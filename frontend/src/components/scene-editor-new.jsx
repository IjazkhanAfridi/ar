import { useState, useRef, useEffect, useCallback } from 'react';
import { R3FSceneContainer } from './R3FSceneContainer';
import { ContentSelector } from './content-selector';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { API_BASE_URL } from '@/utils/config.js';
import {
  Move,
  RotateCw,
  Maximize,
  Sun,
  Upload,
  Trash2,
  Image as ImageIcon,
  Video,
  Box,
  LampDesk,
  Volume2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// Helper function to convert relative URLs to full backend URLs
const getFullUrl = (url) => {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url; // Already a full URL
  }
  if (url.startsWith('/')) {
    return `${API_BASE_URL}${url}`; // Convert relative URL to full backend URL
  }
  return url;
};

export function SceneEditor({
  markerImage,
  config,
  onChange,
  onMindFileUpload,
  onMarkerImageUpload,
  transformMode,
  uploadedMindFile,
  form,
}) {
  const { toast } = useToast();
  const [selectedObject, setSelectedObject] = useState(null);
  const [activeControlPanel, setActiveControlPanel] = useState(null);
  const [sceneObjects, setSceneObjects] = useState([]);

  // Refs
  const mindInputRef = useRef(null);
  const markerInputRef = useRef(null);

  // Convert config.sceneObjects to scene objects for R3F
  useEffect(() => {
    if (config.sceneObjects) {
      setSceneObjects(config.sceneObjects);
    }
  }, [config.sceneObjects]);

  // Update scene config when objects change
  const updateSceneConfig = useCallback(() => {
    const updatedSceneObjects = sceneObjects.map(obj => {
      if (obj.meshRef?.current) {
        const mesh = obj.meshRef.current;
        return {
          ...obj,
          position: {
            x: mesh.position.x,
            y: mesh.position.y,
            z: mesh.position.z
          },
          rotation: {
            x: mesh.rotation.x,
            y: mesh.rotation.y,
            z: mesh.rotation.z
          },
          scale: {
            x: mesh.scale.x,
            y: mesh.scale.y,
            z: mesh.scale.z
          }
        };
      }
      return obj;
    });

    onChange({
      ...config,
      sceneObjects: updatedSceneObjects
    });
  }, [sceneObjects, config, onChange]);

  // Create new object
  const createObject = useCallback((objectConfig) => {
    const newObject = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      ...objectConfig,
    };

    const updatedObjects = [...sceneObjects, newObject];
    setSceneObjects(updatedObjects);
    
    // Update config
    onChange({
      ...config,
      sceneObjects: updatedObjects
    });
  }, [sceneObjects, config, onChange]);

  // Delete object
  const handleObjectDelete = useCallback((objectToDelete) => {
    const objectId = objectToDelete.userData?.id || objectToDelete.id;
    const updatedObjects = sceneObjects.filter(obj => obj.id !== objectId);
    setSceneObjects(updatedObjects);
    
    // Clear selection if deleted object was selected
    if (selectedObject === objectToDelete) {
      setSelectedObject(null);
    }
    
    // Update config
    onChange({
      ...config,
      sceneObjects: updatedObjects
    });
  }, [sceneObjects, selectedObject, config, onChange]);

  // Update object transforms
  const updateObjectTransform = useCallback(
    (id, property, value) => {
      const updatedObjects = sceneObjects.map((obj) => {
        if (obj.id === id) {
          return { ...obj, [property]: value };
        }
        return obj;
      });

      setSceneObjects(updatedObjects);
      onChange({
        ...config,
        sceneObjects: updatedObjects,
      });
    },
    [sceneObjects, config, onChange]
  );

  return (
    <div className='flex w-full h-full'>
      <input
        type='file'
        accept='.mind'
        style={{ display: 'none' }}
        ref={mindInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onMindFileUpload(file);
        }}
      />
      <input
        type='file'
        accept='image/*'
        style={{ display: 'none' }}
        ref={markerInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const result = e.target?.result;
              if (result) onMarkerImageUpload(result);
            };
            reader.readAsDataURL(file);
          }
        }}
      />

      {/* Left Sidebar - Content Selector */}
      <div className='w-64 bg-slate-900 border-r border-slate-700 h-full flex flex-col'>
        {/* Header Section - Fixed */}
        <div className='bg-slate-800 p-4 border-b border-slate-700 flex-shrink-0'>
          <div className='space-y-4'>
            <div>
              <FormField
                control={form.control}
                name='title'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-white'>Title</FormLabel>
                    <Input
                      {...field}
                      placeholder='Experience Title'
                      className='bg-slate-700 border-slate-600 text-white'
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div>
              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-white'>Description</FormLabel>
                    <Input
                      {...field}
                      placeholder='Experience Description'
                      className='bg-slate-700 border-slate-600 text-white'
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div>
              <FormLabel className='block mb-2 text-white'>Mind File</FormLabel>
              {uploadedMindFile && (
                <p className='text-sm text-gray-100 font-medium truncate bg-slate-700 px-3 py-2 rounded border border-slate-600'>
                  {uploadedMindFile}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Content Selector - Scrollable */}
        <div className='flex-1 overflow-y-auto'>
          <ContentSelector
            onContentSelect={(content) => {
              const newConfig = {
                position: { x: 0, y: 1, z: 0 },
                rotation: { x: 0, y: 0, z: 0 },
                scale: { x: 1, y: 1, z: 1 },
                content: {
                  ...content,
                  intensity: content.type === 'light' ? 1 : undefined,
                  color: content.type === 'light' ? '#ffffff' : undefined,
                },
              };
              createObject(newConfig);
            }}
            sceneObjects={config.sceneObjects || []}
            onRemoveObject={(id) => {
              const objectToDelete = { id };
              handleObjectDelete(objectToDelete);
            }}
          />
        </div>
      </div>

      {/* Center - 3D Scene Viewer */}
      <div className='flex-1 bg-slate-800 h-full'>
        <R3FSceneContainer
          sceneObjects={sceneObjects}
          selectedObject={selectedObject}
          setSelectedObject={setSelectedObject}
          transformMode={transformMode}
          onObjectChange={updateSceneConfig}
          markerImage={markerImage}
          className='w-full h-full bg-slate-800 relative'
        />
      </div>

      {/* Right Sidebar - Transform Controls */}
      <div className='w-64 bg-slate-800 border-l border-slate-700 h-full flex flex-col'>
        <Card className='h-full bg-slate-800 border-0 rounded-none flex flex-col'>
          {/* Transform Mode Buttons - Fixed */}
          <div className='p-4 border-b border-slate-700 flex-shrink-0'>
            <div className='grid grid-cols-2 gap-2 mb-4'>
              <Button
                variant={
                  activeControlPanel === 'position' ? 'default' : 'outline'
                }
                size='sm'
                onClick={() =>
                  setActiveControlPanel((prev) =>
                    prev === 'position' ? null : 'position'
                  )
                }
                className='flex items-center gap-2'
              >
                <Move className='h-4 w-4' />
                <span className='text-xs'>Move</span>
              </Button>
              <Button
                variant={
                  activeControlPanel === 'rotation' ? 'default' : 'outline'
                }
                size='sm'
                onClick={() =>
                  setActiveControlPanel((prev) =>
                    prev === 'rotation' ? null : 'rotation'
                  )
                }
                className='flex items-center gap-2'
              >
                <RotateCw className='h-4 w-4' />
                <span className='text-xs'>Rotate</span>
              </Button>
              <Button
                variant={
                  activeControlPanel === 'scale' ? 'default' : 'outline'
                }
                size='sm'
                onClick={() =>
                  setActiveControlPanel((prev) =>
                    prev === 'scale' ? null : 'scale'
                  )
                }
                className='flex items-center gap-2'
              >
                <Maximize className='h-4 w-4' />
                <span className='text-xs'>Scale</span>
              </Button>
              <Button
                variant={
                  activeControlPanel === 'lighting' ? 'default' : 'outline'
                }
                size='sm'
                onClick={() =>
                  setActiveControlPanel((prev) =>
                    prev === 'lighting' ? null : 'lighting'
                  )
                }
                className='flex items-center gap-2'
              >
                <Sun className='h-4 w-4' />
                <span className='text-xs'>Light</span>
              </Button>
            </div>

            {/* Upload Buttons */}
            <div className='space-y-2 mb-4'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => mindInputRef.current?.click()}
                className='w-full flex items-center gap-2'
              >
                <Upload className='h-4 w-4' />
                <span className='text-xs'>Upload Mind</span>
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => markerInputRef.current?.click()}
                className='w-full flex items-center gap-2'
              >
                <ImageIcon className='h-4 w-4' />
                <span className='text-xs'>Upload Marker</span>
              </Button>
            </div>
          </div>

          {/* Control Panels - Scrollable */}
          <div className='flex-1 overflow-y-auto p-4 space-y-4'>
            {selectedObject && (
              <div className='space-y-4'>
                <h3 className='text-white font-semibold'>Selected Object</h3>
                
                {/* Position Controls */}
                {activeControlPanel === 'position' && (
                  <div className='space-y-3'>
                    <Label className='text-white'>Position</Label>
                    <div className='space-y-2'>
                      <div>
                        <Label className='text-sm text-gray-300'>X</Label>
                        <Slider
                          value={[selectedObject.position?.x || 0]}
                          onValueChange={([value]) =>
                            updateObjectTransform(selectedObject.id, 'position', {
                              ...selectedObject.position,
                              x: value,
                            })
                          }
                          min={-10}
                          max={10}
                          step={0.1}
                          className='w-full'
                        />
                      </div>
                      <div>
                        <Label className='text-sm text-gray-300'>Y</Label>
                        <Slider
                          value={[selectedObject.position?.y || 0]}
                          onValueChange={([value]) =>
                            updateObjectTransform(selectedObject.id, 'position', {
                              ...selectedObject.position,
                              y: value,
                            })
                          }
                          min={-10}
                          max={10}
                          step={0.1}
                          className='w-full'
                        />
                      </div>
                      <div>
                        <Label className='text-sm text-gray-300'>Z</Label>
                        <Slider
                          value={[selectedObject.position?.z || 0]}
                          onValueChange={([value]) =>
                            updateObjectTransform(selectedObject.id, 'position', {
                              ...selectedObject.position,
                              z: value,
                            })
                          }
                          min={-10}
                          max={10}
                          step={0.1}
                          className='w-full'
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Rotation Controls */}
                {activeControlPanel === 'rotation' && (
                  <div className='space-y-3'>
                    <Label className='text-white'>Rotation</Label>
                    <div className='space-y-2'>
                      <div>
                        <Label className='text-sm text-gray-300'>X</Label>
                        <Slider
                          value={[selectedObject.rotation?.x || 0]}
                          onValueChange={([value]) =>
                            updateObjectTransform(selectedObject.id, 'rotation', {
                              ...selectedObject.rotation,
                              x: value,
                            })
                          }
                          min={-Math.PI}
                          max={Math.PI}
                          step={0.1}
                          className='w-full'
                        />
                      </div>
                      <div>
                        <Label className='text-sm text-gray-300'>Y</Label>
                        <Slider
                          value={[selectedObject.rotation?.y || 0]}
                          onValueChange={([value]) =>
                            updateObjectTransform(selectedObject.id, 'rotation', {
                              ...selectedObject.rotation,
                              y: value,
                            })
                          }
                          min={-Math.PI}
                          max={Math.PI}
                          step={0.1}
                          className='w-full'
                        />
                      </div>
                      <div>
                        <Label className='text-sm text-gray-300'>Z</Label>
                        <Slider
                          value={[selectedObject.rotation?.z || 0]}
                          onValueChange={([value]) =>
                            updateObjectTransform(selectedObject.id, 'rotation', {
                              ...selectedObject.rotation,
                              z: value,
                            })
                          }
                          min={-Math.PI}
                          max={Math.PI}
                          step={0.1}
                          className='w-full'
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Scale Controls */}
                {activeControlPanel === 'scale' && (
                  <div className='space-y-3'>
                    <Label className='text-white'>Scale</Label>
                    <div className='space-y-2'>
                      <div>
                        <Label className='text-sm text-gray-300'>X</Label>
                        <Slider
                          value={[selectedObject.scale?.x || 1]}
                          onValueChange={([value]) =>
                            updateObjectTransform(selectedObject.id, 'scale', {
                              ...selectedObject.scale,
                              x: value,
                            })
                          }
                          min={0.1}
                          max={5}
                          step={0.1}
                          className='w-full'
                        />
                      </div>
                      <div>
                        <Label className='text-sm text-gray-300'>Y</Label>
                        <Slider
                          value={[selectedObject.scale?.y || 1]}
                          onValueChange={([value]) =>
                            updateObjectTransform(selectedObject.id, 'scale', {
                              ...selectedObject.scale,
                              y: value,
                            })
                          }
                          min={0.1}
                          max={5}
                          step={0.1}
                          className='w-full'
                        />
                      </div>
                      <div>
                        <Label className='text-sm text-gray-300'>Z</Label>
                        <Slider
                          value={[selectedObject.scale?.z || 1]}
                          onValueChange={([value]) =>
                            updateObjectTransform(selectedObject.id, 'scale', {
                              ...selectedObject.scale,
                              z: value,
                            })
                          }
                          min={0.1}
                          max={5}
                          step={0.1}
                          className='w-full'
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Delete Button */}
                <Button
                  variant='destructive'
                  size='sm'
                  onClick={() => handleObjectDelete(selectedObject)}
                  className='w-full flex items-center gap-2'
                >
                  <Trash2 className='h-4 w-4' />
                  Delete Object
                </Button>
              </div>
            )}

            {!selectedObject && (
              <div className='text-center text-gray-400'>
                <p className='text-sm'>Select an object to edit its properties</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
