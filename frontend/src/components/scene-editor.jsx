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
  X,
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
  setTransformMode,
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

  // Auto-show position panel when object is selected
  useEffect(() => {
    if (selectedObject && !activeControlPanel) {
      setActiveControlPanel('position');
      setTransformMode('translate');
    }
  }, [selectedObject, activeControlPanel, setTransformMode]);

  // Keyboard handlers for transform mode switching
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Only handle if no input elements are focused
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
        return;
      }

      switch (event.key.toLowerCase()) {
        case 'g':
          setTransformMode('translate');
          setActiveControlPanel('position');
          break;
        case 'r':
          setTransformMode('rotate');
          setActiveControlPanel('rotation');
          break;
        case 's':
          setTransformMode('scale');
          setActiveControlPanel('scale');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setTransformMode]);

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
    const objectId = objectToDelete.id;
    const updatedObjects = sceneObjects.filter(obj => obj.id !== objectId);
    setSceneObjects(updatedObjects);
    
    // Clear selection if deleted object was selected
    if (selectedObject?.sceneObj?.id === objectId) {
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
          const updatedObj = { ...obj, [property]: value };
          
          // Also update the mesh if it exists
          if (obj.meshRef?.current) {
            const mesh = obj.meshRef.current;
            if (property === 'position') {
              mesh.position.set(value.x, value.y, value.z);
            } else if (property === 'rotation') {
              mesh.rotation.set(value.x, value.y, value.z);
            } else if (property === 'scale') {
              mesh.scale.set(value.x, value.y, value.z);
            }
          }
          
          return updatedObj;
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

  // Handle selection from R3F scene
  const handleObjectSelection = useCallback((selection) => {
    setSelectedObject(selection);
  }, []);

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
                position: { x: 0, y: 0, z: 0 },
                rotation: { x: 0, y: 0, z: 0 },
                scale: { x: 0.3, y: 0.3, z: 0.3 },
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
      <div className='flex-1 h-full'>
        <R3FSceneContainer
          sceneObjects={sceneObjects}
          selectedObject={selectedObject}
          setSelectedObject={handleObjectSelection}
          transformMode={transformMode}
          onObjectChange={(updatedObject) => {
            if (updatedObject) {
              // Update specific object
              const updatedObjects = sceneObjects.map(obj => 
                obj.id === updatedObject.id ? updatedObject : obj
              );
              setSceneObjects(updatedObjects);
              
              // Update config
              onChange({
                ...config,
                sceneObjects: updatedObjects
              });
            } else {
              // Fallback to general update
              updateSceneConfig();
            }
          }}
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
                onClick={() => {
                  const newPanel = activeControlPanel === 'position' ? null : 'position';
                  setActiveControlPanel(newPanel);
                  if (newPanel === 'position') {
                    setTransformMode('translate');
                  }
                }}
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
                onClick={() => {
                  const newPanel = activeControlPanel === 'rotation' ? null : 'rotation';
                  setActiveControlPanel(newPanel);
                  if (newPanel === 'rotation') {
                    setTransformMode('rotate');
                  }
                }}
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
                onClick={() => {
                  const newPanel = activeControlPanel === 'scale' ? null : 'scale';
                  setActiveControlPanel(newPanel);
                  if (newPanel === 'scale') {
                    setTransformMode('scale');
                  }
                }}
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
                <div className='flex items-center justify-between'>
                  <h3 className='text-white font-semibold'>Selected Object</h3>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      setSelectedObject(null);
                      setActiveControlPanel(null);
                    }}
                    className='flex items-center gap-1 text-xs'
                  >
                    <X className='h-3 w-3' />
                    Clear
                  </Button>
                </div>
                
                {/* Position Controls */}
                {activeControlPanel === 'position' && (
                  <div className='space-y-3'>
                    <Label className='text-white'>Position</Label>
                    <div className='space-y-2'>
                      <div>
                        <Label className='text-sm text-gray-300'>X: {selectedObject.sceneObj.position?.x?.toFixed(2) || 0}</Label>
                        <Slider
                          value={[selectedObject.sceneObj.position?.x || 0]}
                          onValueChange={([value]) =>
                            updateObjectTransform(selectedObject.sceneObj.id, 'position', {
                              ...selectedObject.sceneObj.position,
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
                        <Label className='text-sm text-gray-300'>Y: {selectedObject.sceneObj.position?.y?.toFixed(2) || 0}</Label>
                        <Slider
                          value={[selectedObject.sceneObj.position?.y || 0]}
                          onValueChange={([value]) =>
                            updateObjectTransform(selectedObject.sceneObj.id, 'position', {
                              ...selectedObject.sceneObj.position,
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
                        <Label className='text-sm text-gray-300'>Z: {selectedObject.sceneObj.position?.z?.toFixed(2) || 0}</Label>
                        <Slider
                          value={[selectedObject.sceneObj.position?.z || 0]}
                          onValueChange={([value]) =>
                            updateObjectTransform(selectedObject.sceneObj.id, 'position', {
                              ...selectedObject.sceneObj.position,
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
                        <Label className='text-sm text-gray-300'>X: {(selectedObject.sceneObj.rotation?.x * 180 / Math.PI)?.toFixed(1) || 0}°</Label>
                        <Slider
                          value={[selectedObject.sceneObj.rotation?.x || 0]}
                          onValueChange={([value]) =>
                            updateObjectTransform(selectedObject.sceneObj.id, 'rotation', {
                              ...selectedObject.sceneObj.rotation,
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
                        <Label className='text-sm text-gray-300'>Y: {(selectedObject.sceneObj.rotation?.y * 180 / Math.PI)?.toFixed(1) || 0}°</Label>
                        <Slider
                          value={[selectedObject.sceneObj.rotation?.y || 0]}
                          onValueChange={([value]) =>
                            updateObjectTransform(selectedObject.sceneObj.id, 'rotation', {
                              ...selectedObject.sceneObj.rotation,
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
                        <Label className='text-sm text-gray-300'>Z: {(selectedObject.sceneObj.rotation?.z * 180 / Math.PI)?.toFixed(1) || 0}°</Label>
                        <Slider
                          value={[selectedObject.sceneObj.rotation?.z || 0]}
                          onValueChange={([value]) =>
                            updateObjectTransform(selectedObject.sceneObj.id, 'rotation', {
                              ...selectedObject.sceneObj.rotation,
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
                        <Label className='text-sm text-gray-300'>X: {selectedObject.sceneObj.scale?.x?.toFixed(2) || 1}</Label>
                        <Slider
                          value={[selectedObject.sceneObj.scale?.x || 1]}
                          onValueChange={([value]) =>
                            updateObjectTransform(selectedObject.sceneObj.id, 'scale', {
                              ...selectedObject.sceneObj.scale,
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
                        <Label className='text-sm text-gray-300'>Y: {selectedObject.sceneObj.scale?.y?.toFixed(2) || 1}</Label>
                        <Slider
                          value={[selectedObject.sceneObj.scale?.y || 1]}
                          onValueChange={([value]) =>
                            updateObjectTransform(selectedObject.sceneObj.id, 'scale', {
                              ...selectedObject.sceneObj.scale,
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
                        <Label className='text-sm text-gray-300'>Z: {selectedObject.sceneObj.scale?.z?.toFixed(2) || 1}</Label>
                        <Slider
                          value={[selectedObject.sceneObj.scale?.z || 1]}
                          onValueChange={([value]) =>
                            updateObjectTransform(selectedObject.sceneObj.id, 'scale', {
                              ...selectedObject.sceneObj.scale,
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
                {/* <Button
                  variant='destructive'
                  size='sm'
                  onClick={() => handleObjectDelete(selectedObject.sceneObj)}
                  className='w-full flex items-center gap-2'
                >
                  <Trash2 className='h-4 w-4' />
                  Delete Object
                </Button> */}
              </div>
            )}

            {/* Scene Objects List */}
            <div className='space-y-4'>
              <div className='flex items-center justify-between border-b border-slate-600 pb-2'>
                <div className='flex items-center gap-2'>
                  <h3 className='text-white font-semibold'>Scene Objects</h3>
                  <span className='text-xs bg-slate-600 text-gray-300 px-2 py-1 rounded-full'>
                    {sceneObjects.length}
                  </span>
                </div>
                {/* <Button
                  variant='outline'
                  size='sm'
                  onClick={() => mindInputRef.current?.click()}
                  className='flex items-center gap-1 text-xs'
                >
                  <Upload className='h-3 w-3' />
                  Add
                </Button> */}
              </div>
              {sceneObjects.length > 0 ? (
                <div className='space-y-2'>
                  {sceneObjects.map((obj) => (
                    <div
                      key={obj.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                        selectedObject?.sceneObj?.id === obj.id
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-slate-600 bg-slate-700/50 hover:bg-slate-700'
                      }`}
                      onClick={() => {
                        // Find the mesh reference for this object
                        const meshRef = obj.meshRef?.current;
                        if (meshRef) {
                          setSelectedObject({ mesh: meshRef, sceneObj: obj });
                          // Auto-show position panel when selecting from list
                          if (!activeControlPanel) {
                            setActiveControlPanel('position');
                            setTransformMode('translate');
                          }
                        }
                      }}
                    >
                      <div className='flex items-center gap-3 flex-1 min-w-0'>
                        {/* Object Type Icon */}
                        <div className='flex-shrink-0 relative'>
                          {obj.content.type === 'model' && <Box className='h-4 w-4 text-blue-400' />}
                          {obj.content.type === 'image' && <ImageIcon className='h-4 w-4 text-green-400' />}
                          {obj.content.type === 'video' && <Video className='h-4 w-4 text-purple-400' />}
                          {obj.content.type === 'primitive' && <Box className='h-4 w-4 text-yellow-400' />}
                          {obj.content.type === 'light' && <LampDesk className='h-4 w-4 text-orange-400' />}
                          {obj.content.type === 'audio' && <Volume2 className='h-4 w-4 text-pink-400' />}
                          
                          {/* Selection indicator */}
                          {selectedObject?.sceneObj?.id === obj.id && (
                            <div className='absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full'></div>
                          )}
                        </div>
                        
                        {/* Object Info */}
                        <div className='flex-1 min-w-0'>
                          <p className='text-sm text-white font-medium truncate'>
                            {obj.content.name || obj.content.url?.split('/').pop()?.replace(/^\d+-/, '') || `${obj.content.type} Object`}
                          </p>
                          <div className='flex items-center gap-2'>
                            <p className='text-xs text-gray-400 capitalize'>
                              {obj.content.type}
                            </p>
                            <span className='text-xs text-gray-500'>•</span>
                            <p className='text-xs text-gray-500'>
                              {`(${obj.position.x.toFixed(1)}, ${obj.position.y.toFixed(1)}, ${obj.position.z.toFixed(1)})`}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Delete Button */}
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={(e) => {
                          e.stopPropagation();
                          handleObjectDelete(obj);
                        }}
                        className='flex-shrink-0 h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10'
                      >
                        <Trash2 className='h-3 w-3' />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-center text-gray-400 py-4'>
                  <Box className='h-8 w-8 mx-auto mb-2 text-gray-500' />
                  <p className='text-sm'>No objects in scene</p>
                  <p className='text-xs text-gray-500'>Upload files to get started</p>
                </div>
              )}
            </div>

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
