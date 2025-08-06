import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { buildApiUrl } from '@/utils/config.js';
import {
  Image as ImageIcon,
  Video,
  Box,
  LampDesk,
  Upload,
  Trash2,
  Music,
} from 'lucide-react';

export function ContentSelector({
  onContentSelect,
  sceneObjects = [],
  onRemoveObject,
}) {
  const [libraries, setLibraries] = useState({
    models: [],
    images: [],
    videos: [],
    audios: [],
  });
  const [uploadFiles, setUploadFiles] = useState({});
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchLibraries();
  }, []);

  const fetchLibraries = async () => {
    try {
      const [modelsRes, imagesRes, videosRes, audiosRes] = await Promise.all([
        fetch(buildApiUrl('/api/library/models'), { credentials: 'include' }),
        fetch(buildApiUrl('/api/library/images'), { credentials: 'include' }),
        fetch(buildApiUrl('/api/library/videos'), { credentials: 'include' }),
        fetch(buildApiUrl('/api/library/audios'), { credentials: 'include' }),
      ]);

      const [models, images, videos, audios] = await Promise.all([
        modelsRes.json(),
        imagesRes.json(),
        videosRes.json(),
        audiosRes.json(),
      ]);

      // Arrays are returned directly (like working version)
      setLibraries({
        models: models || [],
        images: images || [],
        videos: videos || [],
        audios: audios || [],
      });
    } catch (error) {
      console.error('Error fetching libraries:', error);
    }
  };

  const handleFileUpload = async (file, type) => {
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type); // Add type field like working version

    try {
      const response = await fetch(buildApiUrl('/api/content'), {
        method: 'POST',
        body: formData,
        credentials: 'include', // Include credentials for authentication
      });

      if (response.ok) {
        const data = await response.json();

        // Immediately add to scene like in working version
        setTimeout(() => {
          onContentSelect({ type, url: data.url });
        }, 100);

        // Refresh libraries
        await fetchLibraries();
        setUploadFiles({ ...uploadFiles, [type]: null });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleContentSelect = (content) => {
    onContentSelect(content);
  };

  const handleAddLight = () => {
    onContentSelect({
      type: 'light',
      intensity: 1,
      color: '#ffffff',
    });
  };

  const LibrarySection = ({ items, type, icon: Icon, accept }) => (
    <div className='space-y-4'>
      {/* Upload Section */}
      <Card className='p-4 bg-slate-700 border-slate-600'>
        <div className='space-y-2'>
          <Label className='text-sm font-medium text-slate-200'>
            Upload {type.charAt(0).toUpperCase() + type.slice(1)}
          </Label>
          <div className='flex gap-2'>
            <Input
              type='file'
              accept={accept}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setUploadFiles({ ...uploadFiles, [type]: file });
                }
              }}
              className='flex-1 text-sm bg-slate-600 border-slate-500 text-slate-200'
            />
            <Button
              onClick={() => handleFileUpload(uploadFiles[type], type)}
              disabled={!uploadFiles[type] || isUploading}
              size='sm'
              className='bg-blue-600 hover:bg-blue-700'
            >
              <Upload className='w-4 h-4' />
            </Button>
          </div>
        </div>
      </Card>

      {/* Library Grid */}
      <ScrollArea className='h-64'>
        <div className='grid grid-cols-2 gap-2'>
          {(items || []).map((item) => (
            <Card
              key={item.id}
              className='p-2 bg-slate-700 border-slate-600 hover:bg-slate-600 cursor-pointer transition-colors'
              onClick={() =>
                handleContentSelect({
                  type,
                  url: item.fileUrl,
                  name: item.name,
                  id: item.id,
                })
              }
            >
              <div className='flex flex-col items-center space-y-2'>
                <Icon className='w-8 h-8 text-slate-400' />
                <span className='text-xs text-slate-300 text-center truncate w-full'>
                  {item.name}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  const SceneObjectsList = () => (
    <ScrollArea className='h-64'>
      <div className='space-y-2'>
        {sceneObjects.map((obj, index) => (
          <Card
            key={obj.id || index}
            className='p-3 bg-slate-700 border-slate-600'
          >
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                {obj.content.type === 'model' && (
                  <Box className='w-4 h-4 text-blue-400' />
                )}
                {obj.content.type === 'image' && (
                  <ImageIcon className='w-4 h-4 text-green-400' />
                )}
                {obj.content.type === 'video' && (
                  <Video className='w-4 h-4 text-purple-400' />
                )}
                {obj.content.type === 'audio' && (
                  <Music className='w-4 h-4 text-yellow-400' />
                )}
                {obj.content.type === 'light' && (
                  <LampDesk className='w-4 h-4 text-orange-400' />
                )}
                <span className='text-sm text-slate-200'>
                  {obj.content.name ||
                    `${
                      obj.content.type.charAt(0).toUpperCase() +
                      obj.content.type.slice(1)
                    } ${index + 1}`}
                </span>
              </div>
              <Button
                onClick={() => onRemoveObject(obj.id)}
                size='sm'
                variant='ghost'
                className='h-8 w-8 p-0 hover:bg-red-600/20 hover:text-red-400'
              >
                <Trash2 className='w-4 h-4' />
              </Button>
            </div>
          </Card>
        ))}
        {sceneObjects.length === 0 && (
          <div className='text-center py-8 text-slate-400'>
            No objects in scene
          </div>
        )}
      </div>
    </ScrollArea>
  );

  return (
    <div className='h-full'>
      <Tabs defaultValue='library' className='h-full flex flex-col'>
        <TabsList className='grid w-full grid-cols-2 bg-slate-700'>
          <TabsTrigger value='library' className='text-slate-200'>
            Library
          </TabsTrigger>
          <TabsTrigger value='scene' className='text-slate-200'>
            Scene Objects
          </TabsTrigger>
        </TabsList>

        <TabsContent value='library' className='flex-1 p-4 space-y-6'>
          <Tabs defaultValue='models' orientation='horizontal'>
            <TabsList className='grid w-full grid-cols-5 bg-slate-700'>
              <TabsTrigger value='models' className='text-slate-200'>
                <Box className='w-4 h-4' />
              </TabsTrigger>
              <TabsTrigger value='images' className='text-slate-200'>
                <ImageIcon className='w-4 h-4' />
              </TabsTrigger>
              <TabsTrigger value='videos' className='text-slate-200'>
                <Video className='w-4 h-4' />
              </TabsTrigger>
              <TabsTrigger value='audios' className='text-slate-200'>
                <Music className='w-4 h-4' />
              </TabsTrigger>
              <TabsTrigger value='lights' className='text-slate-200'>
                <LampDesk className='w-4 h-4' />
              </TabsTrigger>
            </TabsList>

            <TabsContent value='models'>
              <LibrarySection
                items={libraries.models}
                type='model'
                icon={Box}
                accept='.glb,.gltf,.obj,.fbx'
              />
            </TabsContent>

            <TabsContent value='images'>
              <LibrarySection
                items={libraries.images}
                type='image'
                icon={ImageIcon}
                accept='image/*'
              />
            </TabsContent>

            <TabsContent value='videos'>
              <LibrarySection
                items={libraries.videos}
                type='video'
                icon={Video}
                accept='video/*'
              />
            </TabsContent>

            <TabsContent value='audios'>
              <LibrarySection
                items={libraries.audios}
                type='audio'
                icon={Music}
                accept='audio/*'
              />
            </TabsContent>

            <TabsContent value='lights'>
              <div className='space-y-4'>
                <Card className='p-4 bg-slate-700 border-slate-600'>
                  <div className='space-y-2'>
                    <Label className='text-sm font-medium text-slate-200'>
                      Add Light Source
                    </Label>
                    <Button
                      onClick={handleAddLight}
                      className='w-full bg-orange-600 hover:bg-orange-700'
                    >
                      <LampDesk className='w-4 h-4 mr-2' />
                      Add Directional Light
                    </Button>
                  </div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value='scene' className='flex-1 p-4'>
          <div className='space-y-4'>
            <Label className='text-sm font-medium text-slate-200'>
              Scene Objects ({sceneObjects.length})
            </Label>
            <SceneObjectsList />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
