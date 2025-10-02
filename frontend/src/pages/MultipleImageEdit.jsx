import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SceneEditor } from '@/components/scene-editor';
import { ARViewer } from '@/components/ar-viewer';
import { insertExperienceSchema } from '@/lib/schema';
import { useToast } from '@/hooks/use-toast';
import { buildApiUrl } from '@/utils/config.js';
import { ArrowLeft, Save, Eye, Layers } from 'lucide-react';
import { API_BASE_URL } from '@/utils/config.js';

const DEFAULT_SCENE_CONFIG = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 0.3, y: 0.3, z: 0.3 },
  sceneObjects: [],
};

const sanitizeContent = (content = {}) => {
  const { file, meshRef, ...rest } = content || {};
  return { ...rest };
};

const sanitizeSceneObject = (obj = {}) => ({
  id: obj.id,
  position: {
    x: obj.position?.x ?? 0,
    y: obj.position?.y ?? 0,
    z: obj.position?.z ?? 0,
  },
  rotation: {
    x: obj.rotation?.x ?? 0,
    y: obj.rotation?.y ?? 0,
    z: obj.rotation?.z ?? 0,
  },
  scale: {
    x: obj.scale?.x ?? 1,
    y: obj.scale?.y ?? 1,
    z: obj.scale?.z ?? 1,
  },
  content: sanitizeContent(obj.content),
});

const sanitizeSceneObjects = (objects = []) =>
  Array.isArray(objects) ? objects.map((obj) => sanitizeSceneObject(obj)) : [];

const cloneSceneConfig = (config = DEFAULT_SCENE_CONFIG) => ({
  position: {
    x: config.position?.x ?? 0,
    y: config.position?.y ?? 0,
    z: config.position?.z ?? 0,
  },
  rotation: {
    x: config.rotation?.x ?? 0,
    y: config.rotation?.y ?? 0,
    z: config.rotation?.z ?? 0,
  },
  scale: {
    x: config.scale?.x ?? 0.3,
    y: config.scale?.y ?? 0.3,
    z: config.scale?.z ?? 0.3,
  },
  sceneObjects: sanitizeSceneObjects(config.sceneObjects),
});

const resolveAssetUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  return buildApiUrl(url);
};

const deepEqual = (a, b) => {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch (error) {
    console.warn('deepEqual comparison failed:', error);
    return false;
  }
};

export default function MultipleImageEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mindFileRef = useRef(null);
  const [uploadedMindFile, setUploadedMindFile] = useState('');
  const [experienceMindFileUrl, setExperienceMindFileUrl] = useState('');
  const [sceneConfig, setSceneConfig] = useState(DEFAULT_SCENE_CONFIG);
  const [targetsConfig, setTargetsConfig] = useState([]);
  const [selectedTargetIndex, setSelectedTargetIndex] = useState(0);
  const [markerImage, setMarkerImage] = useState('');
  const [markerDimensions, setMarkerDimensions] = useState(null);
  const [transformMode, setTransformMode] = useState('translate');
  const [showARViewer, setShowARViewer] = useState(false);
  const [viewerMindFileUrl, setViewerMindFileUrl] = useState(null);
  const [experienceUrl, setExperienceUrl] = useState();

  const form = useForm({
    resolver: zodResolver(insertExperienceSchema),
    defaultValues: {
      title: '',
      description: '',
      markerImage: '',
      markerDimensions: null,
      contentConfig: DEFAULT_SCENE_CONFIG,
    },
  });

  const {
    data: experience,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['experience', id],
    enabled: !!id,
    queryFn: async () => {
      const response = await fetch(buildApiUrl(`/api/experiences/${id}`), {
        credentials: 'include',
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch experience: ${response.status} ${errorText}`);
      }
      const result = await response.json();
      return result.data?.experience || result.experience || result;
    },
  });

  useEffect(() => {
    if (!experience) return;

    if (!experience.isMultipleTargets) {
      toast({
        title: 'Redirecting to single experience editor',
        description: 'This experience uses a single marker.',
      });
      navigate(`/edit-experience/${id}`);
      return;
    }

    const normalizedTargets = (experience.targetsConfig || []).map((target, index) => {
      const sceneObjects = sanitizeSceneObjects(target.sceneObjects || []);
      return {
        id: target.id || `target-${index}`,
        name: target.name || `Target ${index + 1}`,
        markerImage: resolveAssetUrl(target.markerImage || ''),
        markerDimensions: target.markerDimensions || null,
        sceneConfig: cloneSceneConfig({
          ...DEFAULT_SCENE_CONFIG,
          sceneObjects,
        }),
      };
    });

    const fallbackTarget = {
      id: 'target-0',
      name: 'Target 1',
      markerImage: resolveAssetUrl(experience.markerImage || ''),
      markerDimensions: experience.markerDimensions || null,
      sceneConfig: cloneSceneConfig(DEFAULT_SCENE_CONFIG),
    };

    const preparedTargets = normalizedTargets.length
      ? normalizedTargets
      : [fallbackTarget];

    setTargetsConfig(preparedTargets);
    setSelectedTargetIndex(0);

    const firstTarget = preparedTargets[0];
    setSceneConfig(cloneSceneConfig(firstTarget.sceneConfig));
    setMarkerImage(firstTarget.markerImage || '');
    setMarkerDimensions(firstTarget.markerDimensions || null);

    form.reset({
      title: experience.title,
      description: experience.description,
      markerImage: firstTarget.markerImage || '',
      markerDimensions: firstTarget.markerDimensions || null,
      contentConfig: cloneSceneConfig(firstTarget.sceneConfig),
    });

    if (experience.mindFile) {
      setUploadedMindFile(experience.mindFile.split('/').pop() || 'Existing mind file');
      setExperienceMindFileUrl(resolveAssetUrl(experience.mindFile));
    } else {
      setUploadedMindFile('');
      setExperienceMindFileUrl('');
    }
  }, [experience, form, id, navigate, toast]);

  const updateTargetConfig = useCallback((targetIndex, updater) => {
    setTargetsConfig((prev) => {
      const target = prev[targetIndex];
      if (!target) return prev;

      const updates = typeof updater === 'function' ? updater(target) : updater;
      const mergedTarget = {
        ...target,
        ...updates,
      };

      if (updates?.sceneConfig) {
        mergedTarget.sceneConfig = cloneSceneConfig(updates.sceneConfig);
      }

      if (deepEqual(target, mergedTarget)) {
        return prev;
      }

      const next = [...prev];
      next[targetIndex] = mergedTarget;
      return next;
    });
  }, []);

  useEffect(() => {
    if (!targetsConfig.length) return;

    const nextTarget =
      targetsConfig[selectedTargetIndex] || targetsConfig[0];
    if (!nextTarget) return;

    const nextSceneConfig = cloneSceneConfig(
      nextTarget.sceneConfig || DEFAULT_SCENE_CONFIG
    );
    const nextMarkerImage = nextTarget.markerImage || '';
    const nextMarkerDimensions = nextTarget.markerDimensions || null;

    setSceneConfig((prev) =>
      deepEqual(prev, nextSceneConfig) ? prev : nextSceneConfig
    );
    setMarkerImage((prev) => (prev === nextMarkerImage ? prev : nextMarkerImage));
    setMarkerDimensions((prev) =>
      deepEqual(prev, nextMarkerDimensions) ? prev : nextMarkerDimensions
    );
  }, [selectedTargetIndex, targetsConfig]);

  useEffect(() => {
    if (markerImage) {
      form.setValue('markerImage', markerImage);
    }
    if (markerDimensions) {
      form.setValue('markerDimensions', markerDimensions);
    }
  }, [markerImage, markerDimensions, form]);

  useEffect(() => {
    form.setValue('contentConfig', cloneSceneConfig(sceneConfig));
  }, [sceneConfig, form]);

  const serializedTargets = useMemo(
    () =>
      targetsConfig.map((target, index) => ({
        id: target.id || `target-${index}`,
        name: target.name || `Target ${index + 1}`,
        markerImage: target.markerImage || '',
        markerDimensions: target.markerDimensions || null,
        sceneObjects: sanitizeSceneObjects(
          target.sceneConfig?.sceneObjects || []
        ),
      })),
    [targetsConfig]
  );

  const viewerTargets = useMemo(
    () =>
      serializedTargets.map((target) => ({
        sceneObjects: target.sceneObjects,
      })),
    [serializedTargets]
  );

  const totalObjects = serializedTargets.reduce(
    (sum, target) => sum + (target.sceneObjects?.length || 0),
    0
  );

  const handleMindFileUpload = (file) => {
    if (!file) return;
    mindFileRef.current = file;
    setUploadedMindFile(file.name);
  };

  const handleMarkerImageUpload = (markerData) => {
    if (typeof markerData === 'string') {
      setMarkerImage(markerData);
      form.setValue('markerImage', markerData);
      updateTargetConfig(selectedTargetIndex, { markerImage: markerData });
      return;
    }

    const newImage = markerData?.dataUrl || '';
    const newDimensions = markerData?.dimensions || null;

    setMarkerImage(newImage);
    setMarkerDimensions(newDimensions);

    updateTargetConfig(selectedTargetIndex, {
      markerImage: newImage,
      markerDimensions: newDimensions,
      sceneConfig,
    });

    if (newImage) {
      form.setValue('markerImage', newImage);
    }
    if (newDimensions) {
      form.setValue('markerDimensions', newDimensions);
    }
  };

  const handleSceneConfigChange = (config) => {
    const cloned = cloneSceneConfig(config);
    setSceneConfig(cloned);
    updateTargetConfig(selectedTargetIndex, (current) => ({
      markerImage: markerImage || current.markerImage,
      markerDimensions: markerDimensions || current.markerDimensions,
      sceneConfig: cloned,
    }));
  };

  const handleTargetChange = (index) => {
    if (index === selectedTargetIndex) return;
    updateTargetConfig(selectedTargetIndex, {
      markerImage,
      markerDimensions,
      sceneConfig,
    });
    setSelectedTargetIndex(index);
  };

  const handleShowARViewer = async () => {
    const cleanup = () => {
      if (viewerMindFileUrl) {
        URL.revokeObjectURL(viewerMindFileUrl);
      }
    };

    cleanup();

    if (mindFileRef.current) {
      const objectUrl = URL.createObjectURL(mindFileRef.current);
      setViewerMindFileUrl(objectUrl);
      setShowARViewer(true);
      return;
    }

    if (!experienceMindFileUrl) {
      toast({
        title: 'Please upload a .mind file first',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(experienceMindFileUrl, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch existing mind file');
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      setViewerMindFileUrl(objectUrl);
      setShowARViewer(true);
    } catch (error) {
      console.error('Error loading existing mind file:', error);
      toast({
        title: 'Unable to preview mind file',
        variant: 'destructive',
      });
    }
  };

  const handleCloseViewer = () => {
    setShowARViewer(false);
    if (viewerMindFileUrl) {
      URL.revokeObjectURL(viewerMindFileUrl);
      setViewerMindFileUrl(null);
    }
  };

  useEffect(() => {
    return () => {
      if (viewerMindFileUrl) {
        URL.revokeObjectURL(viewerMindFileUrl);
      }
    };
  }, [viewerMindFileUrl]);

  const updateMutation = useMutation({
    mutationFn: async (values) => {
      const payloadTargets = serializedTargets.map((target) => ({
        id: target.id,
        name: target.name,
        markerImage: target.markerImage,
        markerDimensions: target.markerDimensions,
        sceneObjects: target.sceneObjects,
      }));

      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('description', values.description);
      formData.append('markerImage', payloadTargets[0]?.markerImage || '');
      if (payloadTargets[0]?.markerDimensions) {
        formData.append(
          'markerDimensions',
          JSON.stringify(payloadTargets[0].markerDimensions)
        );
      }
      formData.append(
        'contentConfig',
        JSON.stringify(cloneSceneConfig(sceneConfig))
      );
      formData.append('targetsConfig', JSON.stringify(payloadTargets));

      if (mindFileRef.current) {
        formData.append('mindFile', mindFileRef.current);
      }

      const response = await fetch(
        buildApiUrl(`/api/experiences/multiple-image/${id}`),
        {
          method: 'PUT',
          body: formData,
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || 'Failed to update multiple image experience'
        );
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: 'Multiple image experience updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
      queryClient.invalidateQueries({ queryKey: ['experience', id] });
      const experienceUrlValue =
        data.data?.experience?.experienceUrl || data.experienceUrl || '';
      setExperienceUrl(experienceUrlValue);
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

  const onSubmit = (values) => {
    if (!serializedTargets.length) {
      toast({
        title: 'Please add at least one marker image',
        variant: 'destructive',
      });
      return;
    }

    const hasSceneObjects = serializedTargets.some(
      (target) => target.sceneObjects?.length
    );

    if (!hasSceneObjects) {
      toast({
        title: 'Please add at least one object to any target',
        variant: 'destructive',
      });
      return;
    }

    updateMutation.mutate(values);
  };

  const handleFormSubmit = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleUpdateExperience = (event) => {
    event.preventDefault();
    event.stopPropagation();
    form.handleSubmit(onSubmit)();
  };

  const fullExperienceUrl = experienceUrl
    ? experienceUrl.startsWith('http')
      ? experienceUrl
      : `${API_BASE_URL}${experienceUrl}`
    : '';

  if (isLoading) {
    return (
      <div className='flex flex-col bg-slate-800 h-screen'>
        <div className='flex items-center justify-center h-full'>
          <div className='animate-pulse text-white'>Loading experience...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex flex-col bg-slate-800 h-screen'>
        <div className='flex items-center justify-center h-full'>
          <div className='text-center text-white'>
            <h2 className='text-xl font-semibold mb-2 text-red-400'>Error Loading Experience</h2>
            <p className='text-slate-400 mb-4'>
              {error.message || 'Failed to load experience data'}
            </p>
            <div className='flex gap-2 justify-center'>
              <Button onClick={() => navigate('/experiences')} variant='outline'>
                <ArrowLeft className='h-4 w-4 mr-2' />
                Back to Experiences
              </Button>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!experience) {
    return (
      <div className='flex flex-col bg-slate-800 h-screen'>
        <div className='flex items-center justify-center h-full'>
          <div className='text-center text-white'>
            <h2 className='text-xl font-semibold mb-2 text-red-400'>Experience not found</h2>
            <p className='text-slate-400 mb-4'>The experience you're trying to edit doesn't exist.</p>
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
            <h1 className='text-xl font-bold text-white'>Edit Multi-Target AR Experience</h1>
            <p className='text-sm text-slate-400'>
              Target {selectedTargetIndex + 1} of {serializedTargets.length}{' '}
              · {totalObjects} total objects
            </p>
          </div>
        </div>
        <div className='flex items-center gap-3'>
          <Button
            variant='outline'
            size='sm'
            onClick={handleShowARViewer}
            className='text-white border-slate-600 hover:bg-slate-700'
          >
            <Eye className='h-4 w-4 mr-2' />
            Preview AR
          </Button>
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
      </div>

      <div className='border-b border-slate-700 p-4 bg-slate-800'>
        <div className='flex items-center gap-4 overflow-x-auto'>
          <div className='flex items-center gap-2 flex-shrink-0'>
            <Layers className='h-4 w-4 text-slate-400' />
            <span className='text-sm text-slate-400 font-medium'>Editing Target:</span>
          </div>
          <div className='flex gap-3 overflow-x-auto pb-2'>
            {targetsConfig.map((target, index) => (
              <Card
                key={target.id}
                className={`p-3 cursor-pointer transition-all min-w-max flex items-center gap-3 ${
                  selectedTargetIndex === index
                    ? 'bg-blue-500/20 border-blue-500'
                    : 'bg-slate-700 border-slate-600 hover:border-slate-500'
                }`}
                onClick={() => handleTargetChange(index)}
              >
                <img
                  src={resolveAssetUrl(target.markerImage)}
                  alt={target.name}
                  className='w-10 h-10 rounded object-cover border border-slate-600'
                />
                <div>
                  <h4 className='text-sm font-medium text-white'>{target.name}</h4>
                  <p className='text-xs text-slate-400'>
                    {(target.sceneConfig?.sceneObjects?.length || 0)} objects
                  </p>
                </div>
                {selectedTargetIndex === index && (
                  <Badge
                    variant='secondary'
                    className='bg-blue-500/20 text-blue-300 ml-2'
                  >
                    Active
                  </Badge>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>

      {targetsConfig.length > 1 && (
        <div className='border-b border-slate-700 bg-slate-900 p-4'>
          <Card className='bg-slate-800 border-slate-600 p-4'>
            <div className='flex items-center justify-between mb-4'>
              <div>
                <p className='text-xs uppercase tracking-wide text-slate-400'>Markers Overview</p>
                <h3 className='text-sm font-semibold text-white'>All markers in one view</h3>
              </div>
              <Badge className='bg-blue-500/20 text-blue-300'>
                {targetsConfig.length} markers
              </Badge>
            </div>
            <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
              {targetsConfig.map((target) => (
                <div
                  key={`overview-${target.id}`}
                  className='relative rounded-lg border border-slate-700 overflow-hidden'
                >
                  <img
                    src={resolveAssetUrl(target.markerImage)}
                    alt={target.name}
                    className='w-full h-36 object-cover'
                  />
                  <div className='absolute inset-x-0 bottom-0 bg-slate-950/70 px-3 py-2 flex items-center justify-between text-xs text-white'>
                    <span className='font-medium'>{target.name}</span>
                    <span className='text-slate-300'>
                      {(target.sceneConfig?.sceneObjects?.length || 0)} objects
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={handleFormSubmit} className='h-full flex flex-col'>
          <SceneEditor
            markerImage={markerImage}
            markerDimensions={markerDimensions}
            config={sceneConfig}
            onChange={handleSceneConfigChange}
            onMindFileUpload={handleMindFileUpload}
            onMarkerImageUpload={handleMarkerImageUpload}
            transformMode={transformMode}
            setTransformMode={setTransformMode}
            uploadedMindFile={uploadedMindFile}
            form={form}
          />
        </form>
      </Form>

      <Dialog
        open={!!experienceUrl}
        onOpenChange={() => setExperienceUrl(undefined)}
      >
        <DialogContent className='bg-slate-800 border-slate-600 text-white'>
          <DialogHeader>
            <DialogTitle>Experience Updated Successfully!</DialogTitle>
            <DialogDescription className='text-slate-400'>
              Your multi-target AR experience is updated. Use the link below to access it.
            </DialogDescription>
          </DialogHeader>
          <div className='flex flex-col gap-4'>
            <div className='p-4 bg-slate-900 rounded-lg break-all border border-slate-700'>
              <code>{fullExperienceUrl}</code>
            </div>
            <div className='flex justify-end gap-2'>
              <Button
                variant='outline'
                className='border-slate-600 text-slate-300 hover:bg-slate-700'
                onClick={() => {
                  if (fullExperienceUrl) {
                    navigator.clipboard.writeText(fullExperienceUrl);
                    toast({ title: 'Link copied to clipboard' });
                  }
                }}
              >
                Copy Link
              </Button>
              <Button
                className='bg-blue-600 hover:bg-blue-700 text-white'
                onClick={() => {
                  if (fullExperienceUrl) {
                    window.open(fullExperienceUrl, '_blank');
                  }
                }}
              >
                Open Experience
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showARViewer && viewerMindFileUrl && (
        <ARViewer
          mindFile={viewerMindFileUrl}
          targetsConfig={viewerTargets}
          contentConfig={cloneSceneConfig(sceneConfig)}
          onClose={handleCloseViewer}
        />
      )}
    </div>
  );
}
