import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Image as ImageIcon, Video, Box, LampDesk, Volume2 } from 'lucide-react';

const iconMap = {
  image: ImageIcon,
  video: Video,
  model: Box,
  light: LampDesk,
  audio: Volume2
};

export function ObjectsList({ objects, selected, onSelect, onDelete, loading }) {
  return (
    <div className='space-y-2 max-h-48 overflow-y-auto'>
      {objects.map(obj => {
        const Icon = iconMap[obj.userData.contentType] || Box;
        return (
          <div
            key={obj.userData.id}
            className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors ${
              selected === obj ? 'bg-blue-600/20 border border-blue-500/50' : 'bg-slate-700 hover:bg-slate-600'
            }`}
            onClick={() => onSelect(obj)}
          >
            <div className='flex items-center gap-3'>
              <Icon className='h-4 w-4' />
              <span className='text-sm text-white font-medium'>
                {obj.userData.contentType.charAt(0).toUpperCase() + obj.userData.contentType.slice(1)}
              </span>
            </div>
            <Button
              variant='ghost'
              size='icon'
              className='h-6 w-6 hover:bg-red-600/20'
              onClick={(e) => { e.stopPropagation(); onDelete(obj); }}
            >
              <Trash2 className='h-4 w-4 text-red-400' />
            </Button>
          </div>
        );
      })}
      {objects.length === 0 && (
        <p className='text-sm text-slate-400 text-center py-4 bg-slate-700/50 rounded-md'>
          {loading ? 'Loading scene objects...' : 'No objects in scene'}
        </p>
      )}
    </div>
  );
}