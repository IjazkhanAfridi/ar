import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Move, RotateCw, Maximize, Sun, Keyboard, ChevronDown, ChevronUp } from 'lucide-react';
import { ObjectsList } from './ObjectsList';
import { PositionPanel, RotationPanel, ScalePanel, LightPanel } from './TransformPanels';

export function SidebarRight({
  selectedObject,
  setSelectedObject,
  objects,
  onDeleteObject,
  activePanel,
  setActivePanel,
  onTransformSync
}) {
  const isLight = selectedObject?.userData.contentType === 'light';
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  return (
    <div className='w-64 bg-slate-800 border-l border-slate-700 h-full flex flex-col'>
      <Card className='h-full bg-slate-800 border-0 rounded-none flex flex-col'>
        <div className='p-4 border-b border-slate-700 flex-shrink-0'>
          <div className='grid grid-cols-2 gap-2 mb-4'>
            <ModeButton icon={<Move className='h-4 w-4' />} label='Move' id='position' activePanel={activePanel} setActivePanel={setActivePanel} />
            <ModeButton icon={<RotateCw className='h-4 w-4' />} label='Rotate' id='rotation' activePanel={activePanel} setActivePanel={setActivePanel} />
            <ModeButton icon={<Maximize className='h-4 w-4' />} label='Scale' id='scale' activePanel={activePanel} setActivePanel={setActivePanel} />
            {isLight && (
              <ModeButton icon={<Sun className='h-4 w-4' />} label='Light' id='intensity' activePanel={activePanel} setActivePanel={setActivePanel} />
            )}
          </div>
          
          {/* Keyboard Shortcuts Help */}
          <div className='border border-slate-600 rounded-lg'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
              className='w-full justify-between text-slate-300 hover:text-white hover:bg-slate-700'
            >
              <div className='flex items-center gap-2'>
                <Keyboard className='h-4 w-4' />
                <span className='text-xs'>Keyboard Shortcuts</span>
              </div>
              {showKeyboardHelp ? <ChevronUp className='h-4 w-4' /> : <ChevronDown className='h-4 w-4' />}
            </Button>
            
            {showKeyboardHelp && (
              <div className='px-3 pb-3 text-xs text-slate-300 space-y-1 font-mono'>
                <div><span className='text-yellow-400'>W</span> translate | <span className='text-yellow-400'>E</span> rotate | <span className='text-yellow-400'>R</span> scale</div>
                <div><span className='text-yellow-400'>Q</span> toggle world/local space</div>
                <div><span className='text-yellow-400'>X/Y/Z</span> toggle axis | <span className='text-yellow-400'>+/-</span> adjust size</div>
                <div><span className='text-yellow-400'>Space</span> toggle enabled | <span className='text-yellow-400'>Esc</span> deselect</div>
              </div>
            )}
          </div>
        </div>

        <div className='p-4 border-b border-slate-700 flex-shrink-0'>
          <label className='mb-3 block text-white font-medium'>Scene Objects</label>
          <ObjectsList
            objects={objects}
            selected={selectedObject}
            onSelect={(o) => setSelectedObject(o)}
            onDelete={(o) => onDeleteObject(o)}
            loading={false}
          />
        </div>

        <div className='flex-1 overflow-y-auto p-4'>
          <div className={`space-y-6 ${!selectedObject ? 'opacity-50 pointer-events-none' : ''}`}>
            {activePanel === 'position' && selectedObject && (
              <PositionPanel object={selectedObject} onChange={onTransformSync} />
            )}
            {activePanel === 'rotation' && selectedObject && (
              <RotationPanel object={selectedObject} onChange={onTransformSync} />
            )}
            {activePanel === 'scale' && selectedObject && (
              <ScalePanel object={selectedObject} onChange={onTransformSync} />
            )}
            {activePanel === 'intensity' && isLight && (
              <LightPanel object={selectedObject} onChange={onTransformSync} />
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

function ModeButton({ icon, label, id, activePanel, setActivePanel }) {
  const active = activePanel === id;
  return (
    <Button
      variant={active ? 'default' : 'outline'}
      size='sm'
      onClick={() => setActivePanel(active ? null : id)}
      className='flex items-center gap-2'
    >
      {icon}
      <span className='text-xs'>{label}</span>
    </Button>
  );
}