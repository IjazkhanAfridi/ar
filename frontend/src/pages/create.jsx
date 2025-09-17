import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { SceneEditor } from '@/components/scene-editor';
import { ARViewer } from '@/components/ar-viewer';
import { insertExperienceSchema } from '@/lib/schema';
import { useToast } from '@/hooks/use-toast';
import { buildApiUrl } from '@/utils/config.js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export default function Create() {
  const location = useLocation();
  const { toast } = useToast();
  const mindFileRef = useRef(null);
  const [markerImage, setMarkerImage] = useState();
  const [showARViewer, setShowARViewer] = useState(false);
  const [transformMode, setTransformMode] = useState('translate');
  const [uploadedMindFile, setUploadedMindFile] = useState();
  const [experienceUrl, setExperienceUrl] = useState();
  const [sceneConfig, setSceneConfig] = useState({
    position: { x: 0, y: 0, z: 1 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    sceneObjects: [],
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

  useEffect(() => {
    if (markerImage) {
      form.setValue('markerImage', markerImage);
    }
  }, [markerImage, form]);

  useEffect(() => {
    form.setValue('contentConfig', {
      position: sceneConfig.position,
      rotation: sceneConfig.rotation,
      scale: sceneConfig.scale,
      sceneObjects: sceneConfig.sceneObjects,
    });
  }, [sceneConfig, form]);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('markerImage', data.markerImage);
      formData.append('contentConfig', JSON.stringify(data.contentConfig));

      if (!mindFileRef.current) {
        throw new Error('Mind file is required but not found');
      }
      formData.append('mindFile', mindFileRef.current);

      const response = await fetch(buildApiUrl('/api/experiences'), {
        method: 'POST',
        body: formData,
        credentials: 'include', // Add credentials for authentication
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create experience');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: 'Experience created successfully' });
      setExperienceUrl(data.experienceUrl);
      redirectToARSuccess(data.experienceUrl, data.title);
    },
    onError: (error) => {
      toast({
        title: 'Error creating experience',
        description:
          error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    },
  });

  const redirectToARSuccess = (experienceUrl, projectNumber) => {
    navigate('/ar-success', {
      state: { experienceUrl, projectNumber },
    });
  };

  const handleMindFileUpload = async (file) => {
    setUploadedMindFile(file.name);
    mindFileRef.current = file;
  };

  const onSubmit = async (data) => {
    if (!mindFileRef.current) {
      toast({
        title: 'Please upload a .mind file',
        variant: 'destructive',
      });
      return;
    }

    if (!sceneConfig.sceneObjects?.length) {
      toast({
        title: 'Please add at least one object to the scene',
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

    createMutation.mutate(data);
  };

  // Handle form submission - prevent automatic submission
  const handleFormSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Do nothing - only submit when button is explicitly clicked
  };

  // Handle button click - only way to submit
  const handleCreateExperience = (e) => {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit(onSubmit)();
  };

  useEffect(() => {
    if (location.state?.mindFileData) {
      const { mindFileData } = location.state;
      fetch(mindFileData)
        .then((res) => res.blob())
        .then((blob) => {
          const mindFile = new File([blob], 'compiled-targets.mind', {
            type: 'application/octet-stream',
          });
          setUploadedMindFile(mindFile.name);
          mindFileRef.current = mindFile;
        })
        .catch((error) => {
          console.error('Error processing mind file data:', error);
        });
    }
  }, [location.state]);

  useEffect(() => {
    if (location.state?.uploadedImage) {
      const { uploadedImage } = location.state;
      setMarkerImage(uploadedImage);
    }
  }, [location.state]);

  return (
    <div className='relative w-full h-screen bg-slate-800 overflow-hidden'>
      <Form {...form}>
        <form
          onSubmit={handleFormSubmit}
          className='w-full h-full flex flex-col'
        >
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

      {/* Floating Create Button - Bottom Right */}
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
            'Create Experience'
          )}
        </Button>
      </div>

      {/* Preview AR Button - Bottom Center */}
      {uploadedMindFile &&
        markerImage &&
        sceneConfig.sceneObjects?.length > 0 && (
          <div className='fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40'>
            <Button
              type='button'
              onClick={() => setShowARViewer(true)}
              className='h-12 px-6 text-md font-medium bg-green-600 hover:bg-green-700 shadow-xl border-2 border-green-500 transition-all duration-200 hover:scale-105'
            >
              Preview AR
            </Button>
          </div>
        )}

      <Dialog
        open={!!experienceUrl}
        onOpenChange={() => setExperienceUrl(undefined)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Experience Created Successfully!</DialogTitle>
            <DialogDescription>
              Your AR experience is now ready. Use the link below to access it:
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

      {showARViewer && mindFileRef.current && (
        <ARViewer
          mindFile={URL.createObjectURL(mindFileRef.current)}
          contentConfig={sceneConfig}
          onClose={() => setShowARViewer(false)}
        />
      )}
    </div>
  );
}
