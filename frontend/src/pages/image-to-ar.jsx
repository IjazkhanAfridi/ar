import React from 'react';
import ScriptLoader from '../utils/scriptLoader.jsx';
import ImageCompiler from '../components/image-to-ar/ImageCompiler.jsx';
const ImageToAr = () => {
  return (
    <ScriptLoader src='/mindar-image.js'>
      <ImageCompiler />
    </ScriptLoader>
  );
};

export default ImageToAr;
