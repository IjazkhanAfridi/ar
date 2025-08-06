import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SceneEditor } from '@/components/scene-editor';
import { ARViewer } from '@/components/ar-viewer';
import { Save, ArrowLeft, Target, Eye, Layers } from 'lucide-react';
import { insertExperienceSchema, InsertExperience } from '@/lib/schema';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

const MultipleImageCreate = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const mindFileRef = useRef(null);

  // Get data from MultipleImageConfirmation
  const {
    mindFileData,
    mindFileBuffer,
    originalImages = [],
    fileUrls = [],
    isMultipleImages,
    totalImages,
    allImages = [],
  } = location?.state || {};

  // State management - Same as create.tsx
  const [markerImage, setMarkerImage] = useState();
  const [showARViewer, setShowARViewer] = useState(false);
  const [transformMode, setTransformMode] = useState('translate');
  const [uploadedMindFile, setUploadedMindFile] = useState();
  const [experienceUrl, setExperienceUrl] = useState();
  const [selectedTargetIndex, setSelectedTargetIndex] = useState(0);

  // Scene config for current target - Same structure as create.tsx
  const [sceneConfig, setSceneConfig] = useState({
    position: { x: 0, y: 0, z: 1 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    sceneObjects: [],
  });

  // Multiple targets configuration - Store scene config for each target
  const [targetsConfig, setTargetsConfig] = useState([]);

  // Form setup - Same as create.tsx
  const form = useFormState({
    resolver: zodResolver(insertExperienceSchema),
    defaultValues: {
      title: '',
      description: '',
      markerImage: '',
      contentConfig: {
        position: { x: 0, y: 0, z: 1 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        sceneObjects: [],
      },
    },
  });

  // Initialize targets from uploaded images
  useEffect(() => {
    if (originalImages.length > 0 && fileUrls.length > 0) {
      const initialTargets = originalImages.map((img, index) => ({
        id: `target-${index}`,
        name: img.name,
        imageUrl: fileUrls[index] || '',
        imageData: img,
        sceneConfig: {
          position: { x: 0, y: 0, z: 1 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          sceneObjects: [],
        },
      }));
      setTargetsConfig(initialTargets);
      setUploadedMindFile('multiple-targets.mind');

      // Set first image as marker image
      if (fileUrls[0]) {
        setMarkerImage(fileUrls[0]);
        form.setValue('markerImage', fileUrls[0]);
      }
    }
  }, [originalImages, fileUrls, form]);

  // Set mind file from navigation state
  useEffect(() => {
    if (mindFileData && mindFileBuffer) {
      fetch(mindFileData)
        .then((res) => res.blob())
        .then((blob) => {
          const mindFile = new File([blob], 'multiple-targets.mind', {
            type: 'application/octet-stream',
          });
          mindFileRef.current = mindFile;
        })
        .catch((error) => {
          console.error('Error processing mind file data:', error);
        });
    }
  }, [mindFileData, mindFileBuffer]);

  // Load current target's scene config
  useEffect(() => {
    if (targetsConfig[selectedTargetIndex]) {
      const currentTarget = targetsConfig[selectedTargetIndex];
      setSceneConfig(currentTarget.sceneConfig);
      setMarkerImage(currentTarget.imageUrl);
      form.setValue('markerImage', currentTarget.imageUrl);
    }
  }, [selectedTargetIndex, targetsConfig, form]);

  // Update current target's scene config when it changes
  useEffect(() => {
    if (targetsConfig[selectedTargetIndex]) {
      setTargetsConfig((prev) =>
        prev.map((target, index) =>
          index === selectedTargetIndex ? { ...target, sceneConfig } : target
        )
      );
    }
  }, [sceneConfig, selectedTargetIndex]);

  // Handle target switch - Save current config and load new one
  const handleTargetChange = (targetIndex) => {
    if (targetIndex === selectedTargetIndex) return;

    // Save current target's config
    setTargetsConfig((prev) =>
      prev.map((target, index) =>
        index === selectedTargetIndex ? { ...target, sceneConfig } : target
      )
    );

    // Switch to new target
    setSelectedTargetIndex(targetIndex);
  };

  // Create mutation - Same as create.tsx but for multiple targets
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('markerImage', data.markerImage);
      formData.append('contentConfig', JSON.stringify(data.contentConfig));
      formData.append('isMultipleTargets', 'true');

      // Convert targets config to the format expected by server
      const serverTargetsConfig = targetsConfig.map((target, index) => ({
        id: target.id,
        name: target.name,
        imageUrl: target.imageUrl,
        imageData: target.imageData,
        sceneObjects: target.sceneConfig.sceneObjects.map((obj) => ({
          id: obj.id,
          type: obj.content.type,
          url: obj.content.url,
          content: obj.content.type === 'text' ? 'Sample Text' : undefined,
          position: obj.position,
          rotation: obj.rotation,
          scale: obj.scale,
          color: obj.content.color,
          size: 1,
        })),
      }));

      formData.append('targetsConfig', JSON.stringify(serverTargetsConfig));

      if (!mindFileRef.current) {
        throw new Error('Mind file is required but not found');
      }
      formData.append('mindFile', mindFileRef.current);

      // Use the new multiple image endpoint
      const response = await fetch('/api/multiple-image-experiences', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || 'Failed to create multiple image experience'
        );
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: 'Multiple image experience created successfully' });
      setExperienceUrl(data.experienceUrl);
    },
    onError: (error) => {
      toast({
        title: 'Error creating multiple image experience',
        description:
          error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    },
  });

  // Handle mind file upload - Same as create.tsx
  const handleMindFileUpload = async (file) => {
    setUploadedMindFile(file.name);
    mindFileRef.current = file;
  };

  // Handle marker image upload - Same as create.tsx
  const handleMarkerImageUpload = (imageData) => {
    setMarkerImage(imageData);
    form.setValue('markerImage', imageData);
  };

  // Submit handler - Same as create.tsx
  const onSubmit = async (data) => {
    if (!mindFileRef.current) {
      toast({
        title: 'Please upload a .mind file',
        variant: 'destructive',
      });
      return;
    }

    const totalObjects = targetsConfig.reduce(
      (sum, target) => sum + target.sceneConfig.sceneObjects.length,
      0
    );
    if (totalObjects === 0) {
      toast({
        title: 'Please add at least one object to any target',
        variant: 'destructive',
      });
      return;
    }

    if (!data.markerImage) {
      toast({
        title: 'Please select a marker image',
        variant: 'destructive',
      });
      return;
    }

    // Update the content config with current scene config
    const updatedData = {
      ...data,
      contentConfig: sceneConfig,
    };

    createMutation.mutate(updatedData);
  };

  // Handle form submission - Same as create.tsx
  const handleFormSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Handle create experience button - Same as create.tsx
  const handleCreateExperience = (e) => {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit(onSubmit)();
  };

  // Handle AR viewer - Same as create.tsx
  const handleShowARViewer = () => {
    if (!uploadedMindFile) {
      toast({
        title: 'Please upload a mind file first',
        variant: 'destructive',
      });
      return;
    }
    setShowARViewer(true);
  };

  if (!originalImages.length) {
    return (
      <div className='min-h-screen bg-slate-900 text-white flex items-center justify-center'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold mb-4'>No Images Found</h2>
          <p className='text-slate-400 mb-6'>Please upload images first.</p>
          <Button onClick={() => navigate('/multiple-image-tracking')}>
            Go Back to Upload
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col bg-slate-800 h-screen'>
      {/* Header Bar - Same as create.tsx */}
      <div className='flex items-center justify-between p-4 border-b border-slate-700'>
        <div className='flex items-center gap-4'>
          <Button
            variant='ghost'
            onClick={() => navigate('/multiple-image-tracking')}
            className='text-white hover:bg-slate-700'
          >
            <ArrowLeft className='h-4 w-4 mr-2' />
            Back to Upload
          </Button>
          <div>
            <h1 className='text-xl font-bold text-white'>
              Create Multi-Target AR Experience
            </h1>
            <p className='text-sm text-slate-400'>
              Target {selectedTargetIndex + 1} of {targetsConfig.length} -{' '}
              {targetsConfig.reduce(
                (sum, target) => sum + target.sceneConfig.sceneObjects.length,
                0
              )}{' '}
              total objects
            </p>
          </div>
        </div>
        <div className='flex items-center gap-4'>
          <Button
            variant='outline'
            size='sm'
            onClick={handleShowARViewer}
            className='text-white border-slate-600 hover:bg-slate-700'
          >
            <Eye className='h-4 w-4 mr-2' />
            Preview AR
          </Button>
          <div className='flex items-center gap-2'>
            <Target className='h-5 w-5 text-blue-400' />
            <span className='text-sm text-white'>Multi-Target Mode</span>
          </div>
        </div>
      </div>

      {/* Target Selection Bar */}
      <div className='border-b border-slate-700 p-4 bg-slate-800'>
        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-2'>
            <Layers className='h-4 w-4 text-slate-400' />
            <span className='text-sm text-slate-400 font-medium'>
              Editing Target:
            </span>
          </div>
          <div className='flex gap-2 overflow-x-auto'>
            {targetsConfig.map((target, index) => (
              <Card
                key={target.id}
                className={`p-3 cursor-pointer transition-all min-w-max ${
                  selectedTargetIndex === index
                    ? 'bg-blue-500/20 border-blue-500'
                    : 'bg-slate-700 border-slate-600 hover:border-slate-500'
                }`}
                onClick={() => handleTargetChange(index)}
              >
                <div className='flex items-center gap-3'>
                  <img
                    src={target.imageUrl}
                    alt={target.name}
                    className='w-8 h-8 rounded object-cover'
                  />
                  <div>
                    <h4 className='text-sm font-medium text-white'>
                      {target.name}
                    </h4>
                    <p className='text-xs text-slate-400'>
                      {target.sceneConfig.sceneObjects.length} objects
                    </p>
                  </div>
                  {selectedTargetIndex === index && (
                    <Badge
                      variant='secondary'
                      className='bg-blue-500/20 text-blue-400 ml-2'
                    >
                      Active
                    </Badge>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content - Same as create.tsx */}
      <Form {...form}>
        <form onSubmit={handleFormSubmit} className='h-full flex flex-col'>
          <SceneEditor
            markerImage={markerImage}
            config={sceneConfig}
            onChange={setSceneConfig}
            onMindFileUpload={handleMindFileUpload}
            onMarkerImageUpload={handleMarkerImageUpload}
            transformMode={transformMode}
            uploadedMindFile={uploadedMindFile}
            form={form}
          />
        </form>
      </Form>

      {/* Floating Create Button - Same as create.tsx */}
      <div className='fixed bottom-6 right-6 z-50'>
        <Button
          type='button'
          onClick={handleCreateExperience}
          disabled={createMutation.isPending}
          className='h-14 px-8 text-lg font-semibold bg-blue-600 hover:bg-blue-700 shadow-2xl border-2 border-blue-500 transition-all duration-200 hover:scale-105'
        >
          {createMutation.isPending ? (
            <>
              <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3'></div>
              Creating...
            </>
          ) : (
            <>
              <Save className='h-5 w-5 mr-2' />
              Create Multi-Target Experience
            </>
          )}
        </Button>
      </div>

      {/* Success Dialog - Same as create.tsx */}
      <Dialog
        open={!!experienceUrl}
        onOpenChange={() => setExperienceUrl(undefined)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Multi-Target Experience Created Successfully!
            </DialogTitle>
            <DialogDescription>
              Your multi-target AR experience is now ready. Users can point
              their camera at any of the {targetsConfig.length} target images to
              see different AR content.
            </DialogDescription>
          </DialogHeader>
          <div className='flex flex-col gap-4'>
            <div className='p-4 bg-muted rounded-lg break-all'>
              <code>{window.location.origin + experienceUrl}</code>
            </div>
            <div className='flex justify-end gap-2'>
              <Button
                variant='outline'
                onClick={() => {
                  navigator.clipboard.writeText(
                    window.location.origin + experienceUrl
                  );
                  toast({ title: 'Link copied to clipboard' });
                }}
              >
                Copy Link
              </Button>
              <Button
                onClick={() =>
                  window.open(window.location.origin + experienceUrl, '_blank')
                }
              >
                Open Experience
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AR Viewer - Same as create.tsx */}
      {showARViewer && uploadedMindFile && (
        <ARViewer
          mindFile={uploadedMindFile}
          contentConfig={sceneConfig}
          onClose={() => setShowARViewer(false)}
        />
      )}
    </div>
  );
};

export default MultipleImageCreate;
