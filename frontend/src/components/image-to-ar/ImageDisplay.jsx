import React, { useRef, useEffect } from 'react';
import './ImageDisplay.css';

const ImageDisplay = ({ image, points, title }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!image || !points || !canvasRef.current) return;
    if (!image.width || !image.height || !image.data || !image.data.length) {
      console.error("Invalid image data:", image);
      return;
    }

    try {
      const canvas = canvasRef.current;
      canvas.width = image.width;
      canvas.height = image.height;

      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = new Uint32Array(imageData.data.buffer);

      // Draw the image
      const alpha = 0xff << 24;
      for (let c = 0; c < image.width; c++) {
        for (let r = 0; r < image.height; r++) {
          const idx = r * image.width + c;
          if (idx < image.data.length) {
            const pix = image.data[idx];
            data[r * canvas.width + c] = alpha | (pix << 16) | (pix << 8) | pix;
          }
        }
      }

      // Draw the points
      const greenPixel = (0xff << 24) | (0x00 << 16) | (0xff << 8) | 0x00; // green
      for (let i = 0; i < points.length; ++i) {
        const x = points[i].x;
        const y = points[i].y;
        
        if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
          const offset = x + y * canvas.width;
          data[offset] = greenPixel;
          
          // Draw a small circle around each point
          for (let size = 1; size <= 6; size++) {
            if (x - size >= 0) data[offset - size] = greenPixel;
            if (x + size < canvas.width) data[offset + size] = greenPixel;
            if (y - size >= 0) data[offset - size * canvas.width] = greenPixel;
            if (y + size < canvas.height) data[offset + size * canvas.width] = greenPixel;
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
    } catch (error) {
      console.error("Error rendering image:", error);
    }
  }, [image, points]);

  if (!image || !points) return null;
  if (!image.width || !image.height || !image.data) {
    return <div className="image-error">Invalid image data</div>;
  }

  return (
    <div className="image-display">
      {title && <h4>{title}</h4>}
      <div className="canvas-container">
        <canvas ref={canvasRef}></canvas>
      </div>
      <div className="image-info">
        <p>Size: {image.width} x {image.height}</p>
        <p>Feature points: {points.length}</p>
      </div>
    </div>
  );
};

export default ImageDisplay;