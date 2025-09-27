import { useState, useRef, useEffect } from 'react';
import { useLocation,useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const mindFileRef = useRef(null);
  const [markerImage, setMarkerImage] = useState();
  const [markerDimensions, setMarkerDimensions] = useState(null);
  const [showARViewer, setShowARViewer] = useState(false);
  const [transformMode, setTransformMode] = useState('translate');
  const [uploadedMindFile, setUploadedMindFile] = useState();
  const [experienceUrl, setExperienceUrl] = useState();
  const [sceneConfig, setSceneConfig] = useState({
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 0.3, y: 0.3, z: 0.3 },
    sceneObjects: [],
  });

  const form = useForm({
    resolver: zodResolver(insertExperienceSchema),
    defaultValues: {
      title: '',
      description: '',
      markerImage: '',
      markerDimensions: null,
      contentConfig: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 0.3, y: 0.3, z: 0.3 },
        sceneObjects: [],
      },
    },
  });

  // Handle marker image upload with dimensions
  const handleMarkerImageUpload = (markerData) => {
    if (typeof markerData === 'string') {
      // Old format - just the data URL
      setMarkerImage(markerData);
      form.setValue('markerImage', markerData);
    } else {
      // New format - object with dataUrl and dimensions
      setMarkerImage(markerData.dataUrl);
      setMarkerDimensions(markerData.dimensions);
      form.setValue('markerImage', markerData.dataUrl);
      form.setValue('markerDimensions', markerData.dimensions);
      
      console.log('[DEBUG] Marker dimensions captured:', markerData.dimensions);
    }
  };

  useEffect(() => {
    if (markerImage) {
      form.setValue('markerImage', markerImage);
    }
    if (markerDimensions) {
      form.setValue('markerDimensions', markerDimensions);
    }
  }, [markerImage, markerDimensions, form]);

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
      if (data.markerDimensions) {
        formData.append('markerDimensions', JSON.stringify(data.markerDimensions));
      }
      formData.append('contentConfig', JSON.stringify(data.contentConfig));

      if (!mindFileRef.current) {
        throw new Error('Mind file is required but not found');
      }
      formData.append('mindFile', mindFileRef.current);

      const response = await fetch(buildApiUrl('/api/experiences'), {
        method: 'POST',
        body: formData,
        credentials: 'include', 
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create experience');
      }
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Create experience response:', data);
      toast({ title: 'Experience created successfully' });
      setExperienceUrl(data.experienceUrl);
      
      // Access the data from the response structure
      const experienceUrl = data.data?.experienceUrl || data.experienceUrl;
      const title = data.data?.experience?.title || data.title;
      
      console.log('Extracted data:', { experienceUrl, title });
      redirectToARSuccess(experienceUrl, title);
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
    console.log('Redirecting to AR Success with:', { experienceUrl, projectNumber });
    
    // experienceUrl comes as "/experiences/44.html" from backend
    const fullExperienceUrl = experienceUrl 
      ? `${buildApiUrl('')}${experienceUrl}` 
      : '';
      
    console.log('Full experience URL:', fullExperienceUrl);
    
    // Create URL with query parameters
    const params = new URLSearchParams({
      experienceUrl: fullExperienceUrl,
      projectNumber: projectNumber || 'generated'
    });
    navigate(`/ar-success?${params.toString()}`);
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
    navigate('/');
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
            onMarkerImageUpload={handleMarkerImageUpload}
            transformMode={transformMode}
            setTransformMode={setTransformMode}
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

      <Dialog
        open={!!experienceUrl}
        onOpenChange={() => setExperienceUrl(undefined)}
      >
        <DialogContent className='bg-slate-800 border-slate-700'>
          <DialogHeader>
            <DialogTitle className='text-white'>Experience Created Successfully!</DialogTitle>
            <DialogDescription className='text-slate-400'>
              Your AR experience is now ready. Use the link below to access it:
            </DialogDescription>
          </DialogHeader>
          <div className='flex flex-col gap-4'>
            <div className='p-4 bg-slate-700 rounded-lg break-all'>
              <code className='text-slate-300'>{window.location.origin + experienceUrl}</code>
            </div>
            <div className='flex justify-end gap-2'>
              <Button
                variant='outline'
                className='border-slate-600 text-slate-300 hover:bg-slate-700'
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
                className='bg-blue-600 hover:bg-blue-700 text-white'
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
