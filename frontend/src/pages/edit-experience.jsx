import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { SceneEditor } from '@/components/scene-editor';
import { ArrowLeft, Save } from 'lucide-react';
import {
  insertExperienceSchema,
  // InsertExperience and Experience types are used at runtime
} from '@/lib/schema';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { buildApiUrl } from '@/utils/config.js';

export default function EditExperience() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploadedMindFile, setUploadedMindFile] = useState('');
  const [experienceUrl, setExperienceUrl] = useState();
  const [markerImage, setMarkerImage] = useState('');
  const [transformMode, setTransformMode] = useState('translate');
  const mindFileRef = useRef(null);
  const [sceneConfig, setSceneConfig] = useState({
    position: { x: 0, y: 0, z: 1 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    sceneObjects: [],
  });

  // Fetch existing experience data
  const { data: experience, isLoading } = useQuery({
    queryKey: ['experience', id],
    queryFn: async () => {
      const response = await fetch(buildApiUrl(`/api/experiences/${id}`), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch experience');
      const result = await response.json();
      console.log('Fetched experience data:', result);
      return result.data?.experience || result.experience || result;
    },
    enabled: !!id,
  });

  const form = useForm({
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

  // Populate form and scene with existing data
  useEffect(() => {
    if (experience) {
      console.log('Loading experience into edit mode:', {
        id: experience.id,
        title: experience.title,
        contentConfig: experience.contentConfig,
        sceneObjectsCount: experience.contentConfig.sceneObjects?.length || 0,
        sceneObjects: experience.contentConfig.sceneObjects,
      });

      // Reset form with experience data
      form.reset({
        title: experience.title,
        description: experience.description,
        markerImage: experience.markerImage,
        contentConfig: experience.contentConfig,
      });

      // Set marker image for SceneEditor
      setMarkerImage(experience.markerImage);

      // Set scene config with existing objects
      const newSceneConfig = {
        position: experience.contentConfig.position || { x: 0, y: 0, z: 1 },
        rotation: experience.contentConfig.rotation || { x: 0, y: 0, z: 0 },
        scale: experience.contentConfig.scale || { x: 1, y: 1, z: 1 },
        sceneObjects: experience.contentConfig.sceneObjects || [],
      };

      console.log('Setting scene config with objects:', newSceneConfig);
      setSceneConfig(newSceneConfig);

      // Set mind file name if it exists
      if (experience.mindFile) {
        setUploadedMindFile(
          experience.mindFile.split('/').pop() || 'Existing mind file'
        );
      }
    }
  }, [experience, form]);

  // Update form when marker image changes
  useEffect(() => {
    if (markerImage) {
      form.setValue('markerImage', markerImage);
    }
  }, [markerImage, form]);

  // Update form when scene config changes
  useEffect(() => {
    console.log('Scene config changed:', sceneConfig);
    form.setValue('contentConfig', {
      position: sceneConfig.position,
      rotation: sceneConfig.rotation,
      scale: sceneConfig.scale,
      sceneObjects: sceneConfig.sceneObjects,
    });
  }, [sceneConfig, form]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      console.log('Updating experience with data:', {
        title: data.title,
        description: data.description,
        sceneObjectsCount: data.contentConfig.sceneObjects.length,
        sceneObjects: data.contentConfig.sceneObjects,
      });

      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('markerImage', data.markerImage);
      formData.append('contentConfig', JSON.stringify(data.contentConfig));

      // Only append mind file if a new one was uploaded
      if (mindFileRef.current) {
        formData.append('mindFile', mindFileRef.current);
      }

      const response = await fetch(buildApiUrl(`/api/experiences/${id}`), {
        method: 'PUT',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update experience');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: 'Experience updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
      queryClient.invalidateQueries({ queryKey: ['experience', id] });
      setExperienceUrl(data.data?.experienceUrl || data.experienceUrl);
    },
    onError: (error) => {
      toast({
        title: 'Error updating experience',
        description:
          error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    },
  });

  const handleMindFileUpload = async (file) => {
    setUploadedMindFile(file.name);
    mindFileRef.current = file;
  };

  const onSubmit = async (data) => {
    console.log('Submitting experience update:', {
      sceneObjectsCount: data.contentConfig.sceneObjects.length,
      sceneObjects: data.contentConfig.sceneObjects,
    });

    if (!sceneConfig.sceneObjects?.length) {
      toast({
        title: 'Please add at least one object to the scene',
        variant: 'destructive',
      });
      return;
    }

    await updateMutation.mutateAsync(data);
  };

  // Handle form submission - prevent automatic submission
  const handleFormSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Handle button click - only way to submit
  const handleUpdateExperience = (e) => {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit(onSubmit)();
  };

  const redirectToARSuccess = (experienceUrl, title) => {
    const params = new URLSearchParams({
      experienceUrl,
      projectNumber: title,
    });
    navigate(`/ar-success?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <div className='flex flex-col bg-slate-800 h-screen'>
        <div className='flex items-center justify-center h-full'>
          <div className='animate-pulse text-white'>Loading experience...</div>
        </div>
      </div>
    );
  }

  if (!experience) {
    return (
      <div className='flex flex-col bg-slate-800 h-screen'>
        <div className='flex items-center justify-center h-full'>
          <div className='text-center text-white'>
            <h2 className='text-xl font-semibold mb-2'>Experience not found</h2>
            <p className='text-muted-foreground mb-4'>
              The experience you're trying to edit doesn't exist.
            </p>
            <Button onClick={() => navigate('/experiences')}>
              <ArrowLeft className='h-4 w-4 mr-2' />
              Back to Experiences
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col bg-slate-800 h-screen'>
      {/* Header Bar */}
      <div className='flex items-center justify-between p-4 border-b border-slate-700'>
        <div className='flex items-center gap-4'>
          <Button
            variant='ghost'
            onClick={() => navigate('/experiences')}
            className='text-white hover:bg-slate-700'
          >
            <ArrowLeft className='h-4 w-4 mr-2' />
            Back to Experiences
          </Button>
          <div>
            <h1 className='text-xl font-bold text-white'>Edit AR Experience</h1>
            <p className='text-sm text-slate-400'>
              {experience.title} - {sceneConfig.sceneObjects.length} objects
              loaded
            </p>
          </div>
        </div>
        <Button
          onClick={handleUpdateExperience}
          disabled={updateMutation.isPending}
          className='bg-blue-600 hover:bg-blue-700'
        >
          {updateMutation.isPending ? (
            'Updating...'
          ) : (
            <>
              <Save className='h-4 w-4 mr-2' />
              Update Experience
            </>
          )}
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={handleFormSubmit} className='h-full flex flex-col'>
          <SceneEditor
            markerImage={markerImage}
            config={sceneConfig}
            onChange={setSceneConfig}
            onMindFileUpload={handleMindFileUpload}
            onMarkerImageUpload={setMarkerImage}
            transformMode={transformMode}
            onTransformModeChange={setTransformMode}
            uploadedMindFile={uploadedMindFile}
            form={form}
          />
        </form>
      </Form>

      {/* Success Dialog */}
      <Dialog
        open={!!experienceUrl}
        onOpenChange={() => setExperienceUrl(undefined)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Experience Updated Successfully!</DialogTitle>
            <DialogDescription>
              Your AR experience has been updated. Use the link below to access
              it:
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
                  toast({ title: 'Link copied to clipboard!' });
                }}
              >
                Copy Link
              </Button>
              <Button
                onClick={() => {
                  const title = form.getValues('title');
                  if (experienceUrl) {
                    redirectToARSuccess(experienceUrl, title);
                  }
                }}
              >
                View Experience
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
