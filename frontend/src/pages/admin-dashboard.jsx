import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Package,
  Image,
  Video,
  Music,
  Search,
  Plus,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  UserX,
  Upload,
  X,
  Play,
  Pause,
  FileText,
  Eye,
  ChevronDown,
  ChevronUp,
  Box,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { authUtils } from '../utils/auth';
import { User } from '@/lib/schema';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('users');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadData, setUploadData] = useState({
    name: '',
    description: '',
    file: null,
  });
  const [filePreview, setFilePreview] = useState({
    file: null,
    preview: null,
    isPlaying: false,
  });

  const [experienceFilters, setExperienceFilters] = useState({
    searchQuery: '',
    dateRange: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [isPreviewCollapsed, setIsPreviewCollapsed] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check authentication and admin role
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const { user: authUser, isAuthenticated } = await authUtils.checkAuth();

      if (!isAuthenticated || !authUser || authUser.role !== 'admin') {
        window.location.href = '/';
        return;
      }

      setUser(authUser);
    } catch (error) {
      console.error('Auth check failed:', error);
      window.location.href = '/';
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup function for URL.createObjectURL
  const cleanupPreview = () => {
    if (filePreview.preview && filePreview.preview.startsWith('blob:')) {
      URL.revokeObjectURL(filePreview.preview);
    }
  };

  // Reset preview when modal closes
  const handleModalClose = () => {
    cleanupPreview();
    setUploadDialogOpen(false);
    setFilePreview({ file: null, preview: null, isPlaying: false });
    setUploadData({ name: '', description: '', file: null });
    setIsPreviewCollapsed(false);
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      cleanupPreview();
    };
  }, []);

  const handleFileSelect = async (file, type) => {
    // Cleanup previous preview
    cleanupPreview();

    // Validate file type
    const validTypes = {
      images: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
      ],
      videos: [
        'video/mp4',
        'video/webm',
        'video/ogg',
        'video/avi',
        'video/mov',
      ],
      audios: [
        'audio/mp3',
        'audio/wav',
        'audio/ogg',
        'audio/mpeg',
        'audio/m4a',
        'audio/aac',
      ],
      models: ['.glb', '.gltf', '.obj', '.fbx', '.dae', '.3ds'],
    };

    // For models, check file extension instead of MIME type
    if (type === 'models') {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!validTypes.models.includes(extension)) {
        toast({
          title: 'Invalid file type',
          description: `Please select a valid model file (${validTypes.models.join(
            ', '
          )})`,
          variant: 'destructive',
        });
        return;
      }
    } else {
      const typeKey = type;
      if (!validTypes[typeKey].includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: `Please select a valid ${type.slice(0, -1)} file`,
          variant: 'destructive',
        });
        return;
      }
    }

    // Create preview based on file type
    let preview = null;

    if (type === 'images') {
      preview = URL.createObjectURL(file);
    } else if (type === 'videos') {
      preview = URL.createObjectURL(file);
    } else if (type === 'audios') {
      preview = URL.createObjectURL(file);
    } else if (type === 'models') {
      // For 3D models, we'll show file info instead of preview
      preview = 'model-info';
    }

    setFilePreview({
      file,
      preview,
      isPlaying: false,
    });

    // Update upload data with the file
    setUploadData((prev) => ({ ...prev, file }));
  };

  const toggleVideoPlayback = () => {
    const video = document.getElementById('admin-preview-video');
    if (video) {
      if (filePreview.isPlaying) {
        video.pause();
      } else {
        video.play();
      }
      setFilePreview((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
    }
  };

  const toggleAudioPlayback = () => {
    const audio = document.getElementById('admin-preview-audio');
    if (audio) {
      if (filePreview.isPlaying) {
        audio.pause();
      } else {
        audio.play();
      }
      setFilePreview((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const clearPreview = () => {
    cleanupPreview();
    setFilePreview({ file: null, preview: null, isPlaying: false });
    setUploadData((prev) => ({ ...prev, file: null }));
  };

  const renderPreview = (type) => {
    if (!filePreview.file || !filePreview.preview) {
      return (
        <div className='w-full h-64 bg-slate-700/30 rounded-lg border-2 border-dashed border-slate-600 flex flex-col items-center justify-center text-slate-400'>
          <Eye className='h-12 w-12 mb-3 opacity-50' />
          <p className='text-sm font-medium'>No file selected</p>
          <p className='text-xs mt-1 text-center px-4'>
            Choose a file to see preview here
          </p>
        </div>
      );
    }

    return (
      <div className='w-full bg-slate-700 rounded-lg overflow-hidden border border-slate-600'>
        {/* Preview Header */}
        <div className='flex items-center justify-between p-3 bg-slate-600 border-b border-slate-500'>
          <div className='flex items-center gap-2'>
            <span className='text-sm font-medium text-white'>Preview</span>
            <span className='text-xs text-slate-300 bg-slate-500 px-2 py-1 rounded'>
              {formatFileSize(filePreview.file.size)}
            </span>
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setIsPreviewCollapsed(!isPreviewCollapsed)}
              className='h-7 w-7 p-0 hover:bg-slate-500'
            >
              {isPreviewCollapsed ? (
                <ChevronDown className='h-4 w-4 text-slate-300' />
              ) : (
                <ChevronUp className='h-4 w-4 text-slate-300' />
              )}
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={clearPreview}
              className='h-7 w-7 p-0 hover:bg-slate-500'
            >
              <X className='h-4 w-4 text-slate-300' />
            </Button>
          </div>
        </div>

        {/* Preview Content */}
        {!isPreviewCollapsed && (
          <div
            className='p-4 bg-slate-800/50'
            style={{ minHeight: '200px', maxHeight: '400px' }}
          >
            <div className='flex items-center justify-center h-full'>
              {type === 'images' && (
                <div className='relative w-full h-full flex items-center justify-center'>
                  <img
                    src={filePreview.preview}
                    alt='Preview'
                    className='max-w-full max-h-full object-contain rounded shadow-lg'
                    style={{ maxHeight: '350px' }}
                    onError={() => {
                      toast({
                        title: 'Preview error',
                        description: 'Unable to preview this image',
                        variant: 'destructive',
                      });
                    }}
                  />
                </div>
              )}

              {type === 'videos' && (
                <div className='relative w-full h-full flex items-center justify-center'>
                  <video
                    id='admin-preview-video'
                    src={filePreview.preview}
                    className='max-w-full max-h-full object-contain rounded shadow-lg'
                    style={{ maxHeight: '350px' }}
                    controls={false}
                    onPlay={() =>
                      setFilePreview((prev) => ({ ...prev, isPlaying: true }))
                    }
                    onPause={() =>
                      setFilePreview((prev) => ({ ...prev, isPlaying: false }))
                    }
                    onEnded={() =>
                      setFilePreview((prev) => ({ ...prev, isPlaying: false }))
                    }
                    onError={() => {
                      toast({
                        title: 'Preview error',
                        description: 'Unable to preview this video',
                        variant: 'destructive',
                      });
                    }}
                  />
                  <div className='absolute inset-0 flex items-center justify-center'>
                    <Button
                      variant='ghost'
                      size='lg'
                      onClick={toggleVideoPlayback}
                      className='bg-black/60 hover:bg-black/80 rounded-full p-4 backdrop-blur-sm transition-all'
                    >
                      {filePreview.isPlaying ? (
                        <Pause className='h-8 w-8 text-white' />
                      ) : (
                        <Play className='h-8 w-8 text-white ml-1' />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {type === 'audios' && (
                <div className='flex flex-col items-center gap-6 text-white text-center w-full'>
                  <div className='p-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full shadow-lg'>
                    <Music className='h-16 w-16' />
                  </div>
                  <div className='space-y-2 max-w-xs'>
                    <p className='text-lg font-medium break-all'>
                      {filePreview.file.name}
                    </p>
                    <p className='text-sm text-slate-300'>
                      {filePreview.file.type || 'Audio file'}
                    </p>
                  </div>
                  <div className='flex items-center gap-4'>
                    <Button
                      variant='outline'
                      onClick={toggleAudioPlayback}
                      className='flex items-center gap-3 px-6 py-3 bg-slate-600 hover:bg-slate-500 border-slate-500'
                    >
                      {filePreview.isPlaying ? (
                        <>
                          <Pause className='h-5 w-5' />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className='h-5 w-5' />
                          Play
                        </>
                      )}
                    </Button>
                  </div>
                  <audio
                    id='admin-preview-audio'
                    src={filePreview.preview}
                    onPlay={() =>
                      setFilePreview((prev) => ({ ...prev, isPlaying: true }))
                    }
                    onPause={() =>
                      setFilePreview((prev) => ({ ...prev, isPlaying: false }))
                    }
                    onEnded={() =>
                      setFilePreview((prev) => ({ ...prev, isPlaying: false }))
                    }
                    onError={() => {
                      toast({
                        title: 'Preview error',
                        description: 'Unable to preview this audio file',
                        variant: 'destructive',
                      });
                    }}
                  />
                </div>
              )}

              {type === 'models' && (
                <div className='flex flex-col items-center gap-6 text-white text-center w-full'>
                  <div className='p-6 bg-gradient-to-br from-green-600 to-teal-600 rounded-full shadow-lg'>
                    <Box className='h-16 w-16' />
                  </div>
                  <div className='space-y-3 max-w-xs'>
                    <p className='text-lg font-medium break-all'>
                      {filePreview.file.name}
                    </p>
                    <div className='text-sm text-slate-300 space-y-2 bg-slate-700 p-4 rounded-lg'>
                      <div className='flex justify-between items-center'>
                        <span>Format:</span>
                        <span className='font-medium bg-slate-600 px-2 py-1 rounded text-xs'>
                          {filePreview.file.name
                            .split('.')
                            .pop()
                            ?.toUpperCase()}
                        </span>
                      </div>
                      <div className='flex justify-between items-center'>
                        <span>Size:</span>
                        <span className='font-medium'>
                          {formatFileSize(filePreview.file.size)}
                        </span>
                      </div>
                      <div className='flex justify-between items-center'>
                        <span>Status:</span>
                        <span className='font-medium text-green-400'>
                          Ready to upload
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className='text-xs text-slate-400 text-center bg-slate-700 p-3 rounded-lg max-w-xs'>
                    <FileText className='h-6 w-6 mx-auto mb-2' />
                    <p className='font-medium mb-1'>3D Model Preview</p>
                    <p>Model will be processed and rendered after upload</p>
                    <p className='mt-2 text-green-400'>
                      Supported: GLB, GLTF, OBJ, FBX
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Fetch all users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    enabled: user?.role === 'admin',
  });

  // Fetch all experiences
  const { data: allExperiences = [], isLoading: experiencesLoading } = useQuery(
    {
      queryKey: ['/api/admin/experiences'],
      enabled: user?.role === 'admin',
    }
  );

  // Fetch library items
  const { data: models = [], isLoading: modelsLoading } = useQuery({
    queryKey: ['/api/admin/models'],
    enabled: user?.role === 'admin',
  });

  const { data: images = [], isLoading: imagesLoading } = useQuery({
    queryKey: ['/api/admin/images'],
    enabled: user?.role === 'admin',
  });

  const { data: videos = [], isLoading: videosLoading } = useQuery({
    queryKey: ['/api/admin/videos'],
    enabled: user?.role === 'admin',
  });

  const { data: audios = [], isLoading: audiosLoading } = useQuery({
    queryKey: ['/api/admin/audios'],
    enabled: user?.role === 'admin',
  });

  // User management mutations
  const toggleUserStatus = useMutation({
    mutationFn: async ({ userId, isActive }) => {
      return apiRequest(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        body: { isActive },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/admin/users'],
      });
      toast({
        title: 'User status updated',
        description: 'User status has been successfully changed.',
      });
    },
    onError: (error) => {
      console.error('Toggle user status error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user status.',
        variant: 'destructive',
      });
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (userId) => {
      return apiRequest(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/admin/users'],
      });
      toast({
        title: 'User deleted',
        description: 'User has been successfully deleted.',
      });
    },
    onError: (error) => {
      console.error('Delete user error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user.',
        variant: 'destructive',
      });
    },
  });

  const deleteExperience = useMutation({
    mutationFn: async (experienceId) => {
      return apiRequest(`/api/admin/experiences/${experienceId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/admin/experiences'],
      });
      toast({
        title: 'Experience deleted',
        description: 'Experience has been successfully deleted.',
      });
    },
    onError: (error) => {
      console.error('Delete experience error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete experience.',
        variant: 'destructive',
      });
    },
  });

  // Library delete mutations
  const deleteLibraryItem = useMutation({
    mutationFn: async ({ type, id }) => {
      return apiRequest(`/api/admin/${type}/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [`/api/admin/${variables.type}`],
      });
      toast({
        title: 'Item deleted',
        description: `${variables.type.slice(0, -1)} deleted successfully.`,
      });
    },
    onError: (error) => {
      console.error('Delete library item error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete item.',
        variant: 'destructive',
      });
    },
  });

  // Library upload mutations
  const uploadLibraryItem = useMutation({
    mutationFn: async ({ type, formData }) => {
      return fetch(`/api/admin/${type}`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      }).then((res) => {
        if (!res.ok) {
          return res.json().then((err) => {
            throw new Error(err.message || 'Upload failed');
          });
        }
        return res.json();
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [`/api/admin/${variables.type}`],
      });
      toast({
        title: 'Upload successful',
        description: `${variables.type.slice(0, -1)} uploaded successfully.`,
      });
      handleModalClose();
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload file.',
        variant: 'destructive',
      });
    },
  });

  // Filter functions
  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // const filteredExperiences = (allExperiences as any[]).filter(
  //   (exp: any) =>
  //     exp.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //     exp.description?.toLowerCase().includes(searchQuery.toLowerCase())
  // );

  const filteredExperiences = allExperiences
    .filter((exp) => {
      const creator = users.find((u) => u.id === exp.userId);
      const searchTerm = experienceFilters.searchQuery.toLowerCase();

      // Text search filter
      const matchesSearch =
        !searchTerm ||
        exp.title?.toLowerCase().includes(searchTerm) ||
        exp.description?.toLowerCase().includes(searchTerm) ||
        creator?.email?.toLowerCase().includes(searchTerm) ||
        creator?.name?.toLowerCase().includes(searchTerm);

      // Date filter
      const experienceDate = new Date(exp.createdAt);
      const now = new Date();
      let matchesDate = true;

      switch (experienceFilters.dateRange) {
        case 'today':
          matchesDate = experienceDate.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = experienceDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = experienceDate >= monthAgo;
          break;
        case 'year':
          const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          matchesDate = experienceDate >= yearAgo;
          break;
        default:
          matchesDate = true;
      }

      return matchesSearch && matchesDate;
    })
    .sort((a, b) => {
      const creator_a = users.find((u) => u.id === a.userId);
      const creator_b = users.find((u) => u.id === b.userId);

      let valueA, valueB;

      switch (experienceFilters.sortBy) {
        case 'title':
          valueA = a.title?.toLowerCase() || '';
          valueB = b.title?.toLowerCase() || '';
          break;
        case 'user':
          valueA = creator_a?.email?.toLowerCase() || '';
          valueB = creator_b?.email?.toLowerCase() || '';
          break;
        case 'createdAt':
        default:
          valueA = new Date(a.createdAt).getTime();
          valueB = new Date(b.createdAt).getTime();
          break;
      }

      if (experienceFilters.sortOrder === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-lg'>Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  const handleUpload = () => {
    if (!uploadData.file) {
      toast({
        title: 'Error',
        description: 'Please select a file.',
        variant: 'destructive',
      });
      return;
    }

    if (!uploadData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a name.',
        variant: 'destructive',
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadData.file);
    formData.append('name', uploadData.name);
    formData.append('description', uploadData.description);

    uploadLibraryItem.mutate({ type: selectedTab, formData });
  };

  const renderUploadModal = (currentType) => {
    const typeLabels = {
      models: '3D Model',
      images: 'Image',
      videos: 'Video',
      audios: 'Audio',
    };

    const acceptTypes = {
      models: '.glb,.gltf,.obj,.fbx,.dae,.3ds',
      images: 'image/*',
      videos: 'video/*',
      audios: 'audio/*',
    };

    const supportedFormats = {
      models: 'GLB, GLTF, OBJ, FBX, DAE, 3DS files',
      images: 'JPG, PNG, GIF, WebP, SVG files',
      videos: 'MP4, WebM, OGG, AVI, MOV files',
      audios: 'MP3, WAV, OGG, M4A, AAC files',
    };

    return (
      <DialogContent className='sm:max-w-[95vw] lg:max-w-[1000px] bg-slate-800 border-slate-700 max-h-[95vh] overflow-hidden'>
        <DialogHeader>
          <DialogTitle className='text-white flex items-center gap-2'>
            {currentType === 'models' && <Package className='h-5 w-5' />}
            {currentType === 'images' && <Image className='h-5 w-5' />}
            {currentType === 'videos' && <Video className='h-5 w-5' />}
            {currentType === 'audios' && <Music className='h-5 w-5' />}
            Upload {typeLabels[currentType]}
          </DialogTitle>
        </DialogHeader>

        <div className='flex flex-col lg:flex-row gap-6 pt-4 overflow-hidden'>
          {/* Left Panel - Upload Form */}
          <div className='w-full lg:w-80 space-y-4 flex-shrink-0'>
            <div>
              <Label htmlFor='name' className='text-white'>
                Name
              </Label>
              <Input
                id='name'
                value={uploadData.name}
                onChange={(e) =>
                  setUploadData({ ...uploadData, name: e.target.value })
                }
                placeholder={`${typeLabels[currentType]} name`}
                className='bg-slate-700 border-slate-600 text-white'
              />
            </div>

            <div>
              <Label htmlFor='description' className='text-white'>
                Description
              </Label>
              <Textarea
                id='description'
                value={uploadData.description}
                onChange={(e) =>
                  setUploadData({
                    ...uploadData,
                    description: e.target.value,
                  })
                }
                placeholder={`${typeLabels[currentType]} description`}
                className='bg-slate-700 border-slate-600 text-white'
              />
            </div>

            <div>
              <Label htmlFor='file' className='text-white'>
                File
              </Label>
              <Input
                id='file'
                type='file'
                accept={acceptTypes[currentType]}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileSelect(file, currentType);
                  }
                }}
                className='bg-slate-700 border-slate-600 text-white'
              />
              <p className='text-xs text-gray-400 mt-1'>
                Supported: {supportedFormats[currentType]}
              </p>
            </div>

            <Button
              onClick={handleUpload}
              className='w-full bg-blue-600 hover:bg-blue-700'
              disabled={uploadLibraryItem.isPending || !uploadData.file}
            >
              {uploadLibraryItem.isPending ? (
                <>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                  Uploading...
                </>
              ) : (
                'Upload to Library'
              )}
            </Button>
          </div>

          {/* Right Panel - Preview */}
          <div className='flex-1 min-h-0 overflow-auto'>
            {renderPreview(currentType)}
          </div>
        </div>
      </DialogContent>
    );
  };

  const renderContent = () => {
    switch (selectedTab) {
      case 'users':
        return (
          <div className='space-y-6'>
            <div className='bg-[#1c2631] rounded-lg border border-[#2a3441]'>
              <div className='p-4 border-b border-[#2a3441]'>
                <h3 className='text-lg font-semibold'>User Management</h3>
                <p className='text-sm text-gray-400'>Manage registered users</p>
              </div>

              {usersLoading ? (
                <div className='p-6'>Loading users...</div>
              ) : filteredUsers.length === 0 ? (
                <div className='p-6 text-center text-gray-400'>
                  No users found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Experiences</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => {
                      const userExperiences = filteredExperiences.filter(
                        (exp) => exp.userId === user.id
                      );
                      return (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className='flex items-center gap-3'>
                              <div className='w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold'>
                                {user.name?.[0] || user.email?.[0] || 'U'}
                              </div>
                              <div>
                                <div className='font-medium'>
                                  {user.name || 'Unknown'}
                                </div>
                                <div className='text-sm text-gray-400'>
                                  ID: {user.id}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                user.isActive ? 'default' : 'destructive'
                              }
                            >
                              {user.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>{userExperiences.length}</TableCell>
                          <TableCell>
                            {user.createdAt
                              ? new Date(user.createdAt).toLocaleDateString()
                              : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center gap-2'>
                              <Button
                                size='sm'
                                variant={
                                  user.isActive ? 'destructive' : 'default'
                                }
                                onClick={() =>
                                  toggleUserStatus.mutate({
                                    userId: user.id,
                                    isActive: !user.isActive,
                                  })
                                }
                                disabled={toggleUserStatus.isPending}
                              >
                                {user.isActive ? (
                                  <Ban className='h-4 w-4' />
                                ) : (
                                  <CheckCircle className='h-4 w-4' />
                                )}
                              </Button>
                              <Button
                                size='sm'
                                variant='destructive'
                                onClick={() => {
                                  if (
                                    confirm(
                                      'Are you sure you want to delete this user? This will also delete all their experiences.'
                                    )
                                  ) {
                                    deleteUser.mutate(user.id);
                                  }
                                }}
                                disabled={deleteUser.isPending}
                              >
                                <UserX className='h-4 w-4' />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Enhanced Experiences Table */}
            <div className='bg-[#1c2631] rounded-lg border border-[#2a3441]'>
              <div className='p-4 border-b border-[#2a3441]'>
                <div>
                  <h3 className='text-lg font-semibold'>All Experiences</h3>
                  <p className='text-sm text-gray-400'>
                    Manage user experiences ({filteredExperiences.length} of{' '}
                    {allExperiences.length})
                  </p>
                </div>
                <div className='flex items-center justify-between mt-2'>
                  <div className=''>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                      {/* Search Input */}
                      <div className='relative'>
                        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                        <Input
                          placeholder='Search experiences...'
                          value={experienceFilters.searchQuery}
                          onChange={(e) =>
                            setExperienceFilters({
                              ...experienceFilters,
                              searchQuery: e.target.value,
                            })
                          }
                          className='pl-9 bg-[#253546] border-[#3a4455] text-white placeholder-gray-400'
                        />
                      </div>

                      {/* Date Range Filter */}
                      <select
                        value={experienceFilters.dateRange}
                        onChange={(e) =>
                          setExperienceFilters({
                            ...experienceFilters,
                            dateRange: e.target.value,
                          })
                        }
                        className='px-3 py-2 bg-[#253546] border border-[#3a4455] rounded-md text-white'
                      >
                        <option value='all'>All Time</option>
                        <option value='today'>Today</option>
                        <option value='week'>Last Week</option>
                        <option value='month'>Last Month</option>
                        <option value='year'>Last Year</option>
                      </select>

                      {/* Sort By */}
                      <select
                        value={experienceFilters.sortBy}
                        onChange={(e) =>
                          setExperienceFilters({
                            ...experienceFilters,
                            sortBy: e.target.value,
                          })
                        }
                        className='px-3 py-2 bg-[#253546] border border-[#3a4455] rounded-md text-white'
                      >
                        <option value='createdAt'>Sort by Date</option>
                        <option value='title'>Sort by Title</option>
                        <option value='user'>Sort by User</option>
                      </select>

                      {/* Sort Order */}
                      <select
                        value={experienceFilters.sortOrder}
                        onChange={(e) =>
                          setExperienceFilters({
                            ...experienceFilters,
                            sortOrder: e.target.value,
                          })
                        }
                        className='px-3 py-2 bg-[#253546] border border-[#3a4455] rounded-md text-white'
                      >
                        <option value='desc'>Newest First</option>
                        <option value='asc'>Oldest First</option>
                      </select>
                    </div>

                    {/* Filter Stats */}
                    <div className='flex items-center justify-between text-sm text-gray-400'>
                      {experienceFilters.searchQuery && (
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() =>
                            setExperienceFilters({
                              ...experienceFilters,
                              searchQuery: '',
                            })
                          }
                          className='text-gray-400 hover:text-white'
                        >
                          <X className='h-4 w-4 mr-1' />
                          Clear Search
                        </Button>
                      )}
                    </div>
                  </div>
                  {/* Quick Actions */}
                  <div className=''>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() =>
                        setExperienceFilters({
                          searchQuery: '',
                          dateRange: 'all',
                          sortBy: 'createdAt',
                          sortOrder: 'desc',
                        })
                      }
                      className='text-gray-400 hover:text-white border-gray-600'
                    >
                      Reset Filters
                    </Button>
                  </div>
                </div>
              </div>

              {experiencesLoading ? (
                <div className='p-6'>Loading experiences...</div>
              ) : filteredExperiences.length === 0 ? (
                <div className='p-6 text-center text-gray-400'>
                  {experienceFilters.searchQuery ||
                  experienceFilters.dateRange !== 'all'
                    ? 'No experiences match your filters'
                    : 'No experiences found'}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() =>
                            setExperienceFilters({
                              ...experienceFilters,
                              sortBy: 'title',
                              sortOrder:
                                experienceFilters.sortBy === 'title' &&
                                experienceFilters.sortOrder === 'asc'
                                  ? 'desc'
                                  : 'asc',
                            })
                          }
                          className='h-auto p-0 text-left justify-start hover:bg-transparent'
                        >
                          Title
                          {experienceFilters.sortBy === 'title' &&
                            (experienceFilters.sortOrder === 'asc' ? (
                              <ChevronUp className='h-4 w-4 ml-1' />
                            ) : (
                              <ChevronDown className='h-4 w-4 ml-1' />
                            ))}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() =>
                            setExperienceFilters({
                              ...experienceFilters,
                              sortBy: 'user',
                              sortOrder:
                                experienceFilters.sortBy === 'user' &&
                                experienceFilters.sortOrder === 'asc'
                                  ? 'desc'
                                  : 'asc',
                            })
                          }
                          className='h-auto p-0 text-left justify-start hover:bg-transparent'
                        >
                          User
                          {experienceFilters.sortBy === 'user' &&
                            (experienceFilters.sortOrder === 'asc' ? (
                              <ChevronUp className='h-4 w-4 ml-1' />
                            ) : (
                              <ChevronDown className='h-4 w-4 ml-1' />
                            ))}
                        </Button>
                      </TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() =>
                            setExperienceFilters({
                              ...experienceFilters,
                              sortBy: 'createdAt',
                              sortOrder:
                                experienceFilters.sortBy === 'createdAt' &&
                                experienceFilters.sortOrder === 'asc'
                                  ? 'desc'
                                  : 'asc',
                            })
                          }
                          className='h-auto p-0 text-left justify-start hover:bg-transparent'
                        >
                          Created
                          {experienceFilters.sortBy === 'createdAt' &&
                            (experienceFilters.sortOrder === 'asc' ? (
                              <ChevronUp className='h-4 w-4 ml-1' />
                            ) : (
                              <ChevronDown className='h-4 w-4 ml-1' />
                            ))}
                        </Button>
                      </TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExperiences.map((exp) => {
                      const creator = users.find((u) => u.id === exp.userId);
                      return (
                        <TableRow key={exp.id}>
                          <TableCell>
                            <div>
                              <div className='font-medium'>
                                {exp.title || 'Untitled'}
                              </div>
                              <div className='text-sm text-gray-400 truncate max-w-xs'>
                                {exp.description}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center gap-2'>
                              <div className='w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold'>
                                {creator?.name?.[0] ||
                                  creator?.email?.[0] ||
                                  'U'}
                              </div>
                              <div>
                                <div className='text-sm font-medium'>
                                  {creator?.name || 'Unknown'}
                                </div>
                                <div className='text-xs text-gray-400'>
                                  {creator?.email || 'Unknown'}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant='outline'>AR Experience</Badge>
                          </TableCell>
                          <TableCell>
                            <div className='text-sm'>
                              {exp.createdAt
                                ? new Date(exp.createdAt).toLocaleDateString(
                                    'en-US',
                                    {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    }
                                  )
                                : 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center gap-2'>
                              <Button
                                size='sm'
                                variant='outline'
                                onClick={() => {
                                  if (exp.shareableLink) {
                                    window.open(exp.shareableLink, '_blank');
                                  }
                                }}
                                className='border-gray-600 text-gray-300 hover:bg-gray-700'
                              >
                                <Eye className='h-4 w-4' />
                              </Button>
                              <Button
                                size='sm'
                                variant='destructive'
                                onClick={() => {
                                  if (
                                    confirm(
                                      'Are you sure you want to delete this experience?'
                                    )
                                  ) {
                                    deleteExperience.mutate(exp.id);
                                  }
                                }}
                                disabled={deleteExperience.isPending}
                              >
                                <Trash2 className='h-4 w-4' />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        );
      case 'models':
      case 'images':
      case 'videos':
      case 'audios':
        const currentType = selectedTab;
        const currentData =
          currentType === 'images'
            ? images
            : currentType === 'videos'
            ? videos
            : currentType === 'audios'
            ? audios
            : models;
        const currentLoading =
          currentType === 'images'
            ? imagesLoading
            : currentType === 'videos'
            ? videosLoading
            : currentType === 'audios'
            ? audiosLoading
            : modelsLoading;
        const icon =
          currentType === 'images'
            ? Image
            : currentType === 'videos'
            ? Video
            : currentType === 'audios'
            ? Music
            : Package;
        const IconComponent = icon;
        const buttonColors = {
          images: 'bg-green-600 hover:bg-green-700',
          videos: 'bg-red-600 hover:bg-red-700',
          audios: 'bg-yellow-600 hover:bg-yellow-700',
          models: 'bg-blue-600 hover:bg-blue-700',
        };

        const typeLabels = {
          models: '3D Model',
          images: 'Image',
          videos: 'Video',
          audios: 'Audio',
        };

        return (
          <div className='bg-[#1c2631] rounded-lg border border-[#2a3441] p-6'>
            <div className='flex justify-between items-center mb-6'>
              <div>
                <h3 className='text-lg font-medium mb-2 flex items-center gap-2'>
                  <IconComponent className='h-5 w-5' />
                  {currentType.charAt(0).toUpperCase() +
                    currentType.slice(1)}{' '}
                  Library
                </h3>
                <p className='text-gray-400'>
                  Manage {currentType} available to users
                </p>
              </div>
              <Dialog
                open={uploadDialogOpen}
                onOpenChange={setUploadDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button className={buttonColors[currentType]}>
                    <Plus className='h-4 w-4 mr-2' />
                    Add {typeLabels[currentType]}
                  </Button>
                </DialogTrigger>
                {renderUploadModal(currentType)}
              </Dialog>
            </div>

            {currentLoading ? (
              <div className='text-center py-8'>Loading {currentType}...</div>
            ) : currentData.length === 0 ? (
              <div className='text-center py-8 text-gray-400'>
                No {currentType} uploaded yet
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Size</TableHead>
                    {currentType === 'videos' && (
                      <TableHead>Duration</TableHead>
                    )}
                    {currentType === 'audios' && (
                      <TableHead>Duration</TableHead>
                    )}
                    {currentType === 'images' && (
                      <TableHead>Dimensions</TableHead>
                    )}
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className='font-medium'>{item.name}</TableCell>
                      <TableCell className='max-w-xs truncate'>
                        {item.description || 'No description'}
                      </TableCell>
                      <TableCell>
                        <Badge variant='outline'>
                          {item.format?.toUpperCase() || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.fileSize || 'Unknown'}</TableCell>
                      {currentType === 'videos' && (
                        <TableCell>{item.duration || 'Unknown'}</TableCell>
                      )}
                      {currentType === 'audios' && (
                        <TableCell>{item.duration || 'Unknown'}</TableCell>
                      )}
                      {currentType === 'images' && (
                        <TableCell>{item.dimensions || 'Unknown'}</TableCell>
                      )}
                      <TableCell>
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString()
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Button
                          size='sm'
                          variant='destructive'
                          onClick={() => {
                            if (
                              confirm(
                                `Delete this ${currentType.slice(0, -1)}?`
                              )
                            ) {
                              deleteLibraryItem.mutate({
                                type: currentType,
                                id: item.id,
                              });
                            }
                          }}
                          disabled={deleteLibraryItem.isPending}
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className='min-h-screen bg-[#0f1419] text-white flex'>
      {/* Sidebar */}
      <div className='w-64 bg-[#1c2631] border-r border-[#2a3441] flex flex-col'>
        {/* Header */}
        <div className='p-6 border-b border-[#2a3441]'>
          <h1 className='text-xl font-bold mb-1'>Admin Dashboard</h1>
          <p className='text-sm text-gray-400'>Manage platform content</p>
        </div>

        {/* Navigation Menu */}
        <nav className='flex-1 p-4'>
          <div className='space-y-2'>
            <button
              onClick={() => {
                setSelectedTab('users');
                handleModalClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                selectedTab === 'users'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-[#253546] hover:text-white'
              }`}
            >
              <Users className='h-5 w-5' />
              <span>User Management</span>
            </button>

            <button
              onClick={() => {
                setSelectedTab('models');
                handleModalClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                selectedTab === 'models'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-[#253546] hover:text-white'
              }`}
            >
              <Package className='h-5 w-5' />
              <span>3D Models Library</span>
            </button>

            <button
              onClick={() => {
                setSelectedTab('images');
                handleModalClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                selectedTab === 'images'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-300 hover:bg-[#253546] hover:text-white'
              }`}
            >
              <Image className='h-5 w-5' />
              <span>Images Library</span>
            </button>

            <button
              onClick={() => {
                setSelectedTab('videos');
                handleModalClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                selectedTab === 'videos'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-300 hover:bg-[#253546] hover:text-white'
              }`}
            >
              <Video className='h-5 w-5' />
              <span>Videos Library</span>
            </button>

            <button
              onClick={() => {
                setSelectedTab('audios');
                handleModalClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                selectedTab === 'audios'
                  ? 'bg-yellow-600 text-white'
                  : 'text-gray-300 hover:bg-[#253546] hover:text-white'
              }`}
            >
              <Music className='h-5 w-5' />
              <span>Audio Library</span>
            </button>
          </div>
        </nav>

        {/* User info */}
        <div className='p-4 border-t border-[#2a3441]'>
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold'>
              {user?.name?.[0] || user?.email?.[0] || 'A'}
            </div>
            <div>
              <div className='text-sm font-medium'>{user?.name || 'Admin'}</div>
              <div className='text-xs text-gray-400'>{user?.email}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='flex-1 flex flex-col'>
        {/* Top Bar */}
        <div className='bg-[#1c2631] border-b border-[#2a3441] p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-2xl font-semibold'>
                {selectedTab === 'users' && 'User Management'}
                {selectedTab === 'models' && '3D Models Library'}
                {selectedTab === 'images' && 'Images Library'}
                {selectedTab === 'videos' && 'Videos Library'}
                {selectedTab === 'audios' && 'Audio Library'}
              </h2>
              <p className='text-gray-400 mt-1'>
                {selectedTab === 'users' &&
                  'Manage registered users and their experiences'}
                {selectedTab === 'models' &&
                  'Manage 3D models available to users'}
                {selectedTab === 'images' && 'Manage images available to users'}
                {selectedTab === 'videos' && 'Manage videos available to users'}
                {selectedTab === 'audios' &&
                  'Manage audio files available to users'}
              </p>
            </div>

            {/* Search */}
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
              <Input
                placeholder='Search...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-9 w-80 bg-[#253546] border-[#3a4455]'
              />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className='flex-1 p-6 overflow-auto'>{renderContent()}</div>
      </div>
    </div>
  );
}
