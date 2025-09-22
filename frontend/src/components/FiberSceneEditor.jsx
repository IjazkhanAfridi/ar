import { useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { useForm } from 'react-hook-form';
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
import { ContentSelector } from './content-selector';
import FiberScene from './FiberScene';
import { useSceneStore } from '@/stores/sceneStore';

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

export function FiberSceneEditor({
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
  const [activeControlPanel, setActiveControlPanel] = useState(null);
  const mindInputRef = useRef(null);
  const markerInputRef = useRef(null);

  // Get scene store state and actions
  const {
    sceneObjects,
    selectedObject,
    transformMode: currentTransformMode,
    sceneConfig,
    setTransformMode,
    addSceneObject,
    removeSceneObject,
    loadSceneObjects,
    getSceneConfigForSubmission,
  } = useSceneStore();

  // Load existing scene objects when config changes
  useEffect(() => {
    if (config?.sceneObjects && config.sceneObjects !== sceneObjects) {
      loadSceneObjects(config.sceneObjects);
    }
  }, [config?.sceneObjects, loadSceneObjects, sceneObjects]);

  // Update form when scene config changes
  useEffect(() => {
    if (onChange) {
      const updatedConfig = getSceneConfigForSubmission();
      onChange(updatedConfig);
    }
  }, [sceneObjects, onChange, getSceneConfigForSubmission]);

  // Handle transform mode changes
  const handleTransformModeChange = (mode) => {
    setTransformMode(mode);
  };

  // Handle adding content to scene
  const handleAddContent = (content) => {
    const objectData = {
      content,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    };
    
    addSceneObject(objectData);
    setActiveControlPanel(null);
    
    toast({
      title: 'Content Added',
      description: `${content.type} has been added to the scene`,
    });
  };

  // Handle removing selected object
  const handleRemoveSelectedObject = () => {
    if (selectedObject && selectedObject.userData?.id) {
      removeSceneObject(selectedObject.userData.id);
      toast({
        title: 'Object Removed',
        description: 'Selected object has been removed from the scene',
      });
    }
  };

  // Handle mind file upload
  const handleMindFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      onMindFileUpload(file);
      toast({
        title: 'Mind File Uploaded',
        description: file.name,
      });
    }
  };

  // Handle marker image upload
  const handleMarkerImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        onMarkerImageUpload(e.target.result);
        toast({
          title: 'Marker Image Uploaded',
          description: file.name,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Panel - Controls */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Transform Controls */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Transform Mode</h3>
          <div className="flex gap-2">
            <Button
              variant={currentTransformMode === 'translate' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleTransformModeChange('translate')}
              className="flex-1"
            >
              <Move className="w-4 h-4 mr-1" />
              Move
            </Button>
            <Button
              variant={currentTransformMode === 'rotate' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleTransformModeChange('rotate')}
              className="flex-1"
            >
              <RotateCw className="w-4 h-4 mr-1" />
              Rotate
            </Button>
            <Button
              variant={currentTransformMode === 'scale' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleTransformModeChange('scale')}
              className="flex-1"
            >
              <Maximize className="w-4 h-4 mr-1" />
              Scale
            </Button>
          </div>
        </div>

        {/* Object Actions */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Object Actions</h3>
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemoveSelectedObject}
              disabled={!selectedObject}
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remove Selected
            </Button>
          </div>
        </div>

        {/* Add Content */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Add Content</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveControlPanel(activeControlPanel === 'model' ? null : 'model')}
            >
              <Box className="w-4 h-4 mr-1" />
              Model
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveControlPanel(activeControlPanel === 'image' ? null : 'image')}
            >
              <ImageIcon className="w-4 h-4 mr-1" />
              Image
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveControlPanel(activeControlPanel === 'primitive' ? null : 'primitive')}
            >
              <Box className="w-4 h-4 mr-1" />
              Shape
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveControlPanel(activeControlPanel === 'light' ? null : 'light')}
            >
              <LampDesk className="w-4 h-4 mr-1" />
              Light
            </Button>
          </div>
        </div>

        {/* File Upload */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">File Upload</h3>
          <div className="space-y-2">
            <div>
              <input
                type="file"
                ref={mindInputRef}
                accept=".mind"
                onChange={handleMindFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => mindInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Mind File
              </Button>
            </div>
            <div>
              <input
                type="file"
                ref={markerInputRef}
                accept="image/*"
                onChange={handleMarkerImageUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => markerInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Marker Image
              </Button>
            </div>
          </div>
        </div>

        {/* Scene Objects List */}
        <div className="flex-1 p-4 overflow-y-auto">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Scene Objects</h3>
          <div className="space-y-2">
            {sceneObjects.map((obj) => (
              <Card 
                key={obj.id} 
                className={`p-2 cursor-pointer transition-colors ${
                  selectedObject?.userData?.id === obj.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="text-xs text-gray-600">
                  {obj.content.type}: {obj.content.name || obj.content.primitiveType || 'Unnamed'}
                </div>
              </Card>
            ))}
            {sceneObjects.length === 0 && (
              <div className="text-xs text-gray-500 text-center py-4">
                No objects in scene
              </div>
            )}
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <h3 className="text-xs font-medium text-gray-700 mb-2">Keyboard Shortcuts</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <div>G - Move mode</div>
            <div>R - Rotate mode</div>
            <div>S - Scale mode</div>
            <div>ESC - Deselect</div>
          </div>
        </div>
      </div>

      {/* Right Panel - 3D Scene */}
      <div className="flex-1 relative">
        <Canvas
          camera={{ position: [2, 2, 2], fov: 75 }}
          shadows
          onCreated={({ gl }) => {
            gl.shadowMap.enabled = true;
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
          }}
        >
          <FiberScene markerImage={markerImage} />
        </Canvas>

        {/* Content Selector Overlay */}
        {activeControlPanel && (
          <div className="absolute top-4 left-4 z-10">
            <Card className="p-4 bg-white shadow-lg">
              <ContentSelector
                contentType={activeControlPanel}
                onSelect={handleAddContent}
                onCancel={() => setActiveControlPanel(null)}
              />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
