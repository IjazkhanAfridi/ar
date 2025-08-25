import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

export function PositionPanel({ object, onChange }) {
  return (
    <PanelWrapper title='Position'>
      {['x','y','z'].map(axis => (
        <AxisSlider
          key={axis}
            label={axis}
          value={object.position[axis]}
          min={-5}
          max={5}
          step={0.1}
          display={object.position[axis].toFixed(2)}
          onChange={(v)=>{ object.position[axis]=v; onChange(); }}
        />
      ))}
    </PanelWrapper>
  );
}

export function RotationPanel({ object, onChange }) {
  return (
    <PanelWrapper title='Rotation'>
      {['x','y','z'].map(axis => (
        <AxisSlider
          key={axis}
          label={axis}
          value={object.rotation[axis]}
          min={0}
          max={Math.PI * 2}
          step={0.1}
          display={`${((object.rotation[axis]*180)/Math.PI).toFixed(0)}°`}
          onChange={(v)=>{ object.rotation[axis]=v; onChange(); }}
        />
      ))}
    </PanelWrapper>
  );
}

export function ScalePanel({ object, onChange }) {
  return (
    <PanelWrapper title='Scale'>
      {['x','y','z'].map(axis => (
        <AxisSlider
          key={axis}
          label={axis}
          value={object.scale[axis]}
          min={0.1}
          max={3}
          step={0.1}
          display={`${object.scale[axis].toFixed(2)}x`}
          onChange={(v)=>{ object.scale[axis]=v; onChange(); }}
        />
      ))}
    </PanelWrapper>
  );
}

export function LightPanel({ object, onChange }) {
  return (
    <PanelWrapper title='Light Intensity'>
      <AxisSlider
        label='Intensity'
        value={object.intensity}
        min={0}
        max={5}
        step={0.1}
        display={object.intensity.toFixed(2)}
        onChange={(v)=>{ object.intensity = v; onChange(); }}
      />
    </PanelWrapper>
  );
}

function PanelWrapper({ title, children }) {
  return (
    <div className='space-y-4'>
      <Label className='text-white font-medium'>{title}</Label>
      {children}
    </div>
  );
}

function AxisSlider({ label, value, min, max, step, onChange, display }) {
  return (
    <div className='space-y-2'>
      <div className='flex justify-between items-center'>
        <Label className='text-slate-300'>{label.toUpperCase()}</Label>
        <span className='text-sm text-slate-400 font-mono bg-slate-700 px-2 py-1 rounded'>{display}</span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        className='w-full'
      />
    </div>
  );
}