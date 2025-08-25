import React from 'react';
import { FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ContentSelector } from '../content-selector';

export function SidebarLeft({
  form,
  uploadedMindFile,
  onMindFileUpload,
  onMarkerImageUpload,
  onAddContent,
  sceneObjects,
  onRemoveObject,
  mindInputRef,
  markerInputRef
}) {
  return (
    <div className='w-64 bg-slate-900 border-r border-slate-700 h-full flex flex-col'>
      <div className='bg-slate-800 p-4 border-b border-slate-700 flex-shrink-0 space-y-4'>
        <FormField
          control={form.control}
          name='title'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='text-white'>Title</FormLabel>
              <Input {...field} placeholder='Experience Title' className='bg-slate-700 border-slate-600 text-white' />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='description'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='text-white'>Description</FormLabel>
              <Input {...field} placeholder='Experience Description' className='bg-slate-700 border-slate-600 text-white' />
              <FormMessage />
            </FormItem>
          )}
        />
        <div>
          <FormLabel className='block mb-2 text-white'>Mind File</FormLabel>
          {uploadedMindFile && (
            <p className='text-sm text-gray-100 font-medium truncate bg-slate-700 px-3 py-2 rounded border border-slate-600'>
              {uploadedMindFile}
            </p>
          )}
        </div>
      </div>
      <div className='flex-1 overflow-y-auto'>
        <ContentSelector
          onContentSelect={(content) =>
            onAddContent({
              position: { x: 0, y: 1, z: 0 },
              rotation: { x: 0, y: 0, z: 0 },
              scale: { x: 1, y: 1, z: 1 },
              content: {
                ...content,
                intensity: content.type === 'light' ? 1 : undefined,
                color: content.type === 'light' ? '#ffffff' : undefined
              }
            })
          }
          sceneObjects={sceneObjects}
          onRemoveObject={onRemoveObject}
        />
      </div>
      <input
        type='file'
        accept='.mind'
        ref={mindInputRef}
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onMindFileUpload(file);
        }}
      />
      <input
        type='file'
        accept='image/*'
        ref={markerInputRef}
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => ev.target?.result && onMarkerImageUpload(ev.target.result);
            reader.readAsDataURL(file);
          }
        }}
      />
    </div>
  );
}