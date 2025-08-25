import React from 'react';

export function Canvas3D({ containerRef }) {
  return (
    <div
      ref={containerRef}
      className='w-full h-full bg-slate-800 relative'
      style={{ position: 'relative', overflow: 'hidden', minHeight: '500px' }}
    />
  );
}