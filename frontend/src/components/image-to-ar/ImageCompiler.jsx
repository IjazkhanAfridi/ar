import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import ImageDisplay from './ImageDisplay';
import './ImageCompiler.css';

const ImageCompiler = () => {
  const [compiler, setCompiler] = useState(null);
  const [files, setFiles] = useState([]);
  const [progress, setProgress] = useState(0);
  const [exportedBuffer, setExportedBuffer] = useState(null);
  const [imageData, setImageData] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Initialize compiler directly since we're using ScriptLoader
  useEffect(() => {
    if (window.MINDAR && window.MINDAR.IMAGE) {
      try {
        const compilerInstance = new window.MINDAR.IMAGE.Compiler();
        setCompiler(compilerInstance);
        console.log("MindAR compiler initialized successfully");
      } catch (err) {
        console.error("Error creating compiler instance:", err);
        setError(`Failed to initialize compiler: ${err.message}`);
      }
    }
  }, []);

  const onDrop = useCallback((acceptedFiles) => {
    setFiles(acceptedFiles);
    setImageData([]);
    setExportedBuffer(null);
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/octet-stream': ['.mind']
    }
  });

  const loadImage = async (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(new Error(`Error loading image: ${file.name}`));
      img.src = URL.createObjectURL(file);
    });
  };

  const compileFiles = async () => {
    if (!compiler || files.length === 0) return;

    setProcessing(true);
    setProgress(0);
    setError(null);
    
    try {
      const images = [];
      for (let i = 0; i < files.length; i++) {
        const img = await loadImage(files[i]);
        images.push(img);
        console.log(`Loaded image ${i+1}/${files.length}: ${files[i].name}, size: ${img.width}x${img.height}`);
      }

      console.log("Starting compilation with", images.length, "images");
      const startTime = new Date().getTime();
      
      const dataList = await compiler.compileImageTargets(images, (p) => {
        console.log("Compilation progress:", p);
        setProgress(p);
      });
      
      console.log("Compilation completed in:", new Date().getTime() - startTime, "ms");
      console.log("Compilation results:", dataList);

      setImageData(dataList);
      const buffer = await compiler.exportData();
      setExportedBuffer(buffer);
    } catch (error) {
      console.error("Error compiling files:", error);
      setError(`Error compiling files: ${error.message || "Unknown error"}`);
    } finally {
      setProcessing(false);
    }
  };

  const loadMindFile = async (file) => {
    if (!compiler) return;

    setProcessing(true);
    setError(null);
    
    try {
      const buffer = await file.arrayBuffer();
      console.log("Loading .mind file, size:", buffer.byteLength, "bytes");
      
      const dataList = compiler.importData(buffer);
      console.log("Mind file imported successfully:", dataList);
      
      setImageData(dataList);
    } catch (error) {
      console.error("Error loading .mind file:", error);
      setError(`Error loading .mind file: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleStart = () => {
    if (files.length === 0) {
      setError("Please select files first");
      return;
    }
    
    if (!compiler) {
      setError("MindAR compiler is not initialized yet. Please wait or refresh the page.");
      return;
    }
    
    const ext = files[0].name.split('.').pop().toLowerCase();
    console.log('Processing file with extension:', ext);
    
    if (ext === 'mind') {
      loadMindFile(files[0]);
    } else {
      compileFiles();
    }
  };

  const handleDownload = () => {
    if (!exportedBuffer) return;

    const blob = new Blob([exportedBuffer]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'targets.mind';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const removeFile = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    if (newFiles.length === 0) {
      setImageData([]);
      setExportedBuffer(null);
    }
  };

  return (
    <div className="image-compiler">
      <div className="instructions">
        <h2>Usage:</h2>
        <ol>
          <li>Drop target images (e.g. .png) into the drop zone. (can drop multiple)</li>
          <li>Click "Start". It could take a while (especially for large images)</li>
          <li>When done, some debug images will be shown, and you can visualize the feature points.</li>
          <li>Click "Download" to get a targets.mind file, which is used in the AR webpage</li>
        </ol>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      <div {...getRootProps({ className: `dropzone ${isDragActive ? 'active' : ''}` })}>
        <input {...getInputProps()} />
        {
          isDragActive ?
            <p>Drop the files here ...</p> :
            <p>Drag 'n' drop some files here, or click to select files</p>
        }
      </div>

      {files.length > 0 && (
        <div className="file-list">
          <h3>Selected Files:</h3>
          <ul>
            {files.map((file, index) => (
              <li key={index}>
                {file.name} ({(file.size / 1024).toFixed(2)} KB)
                <button className="remove-button" onClick={() => removeFile(index)}>Remove</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="actions">
        <button 
          className="start-button" 
          onClick={handleStart} 
          disabled={files.length === 0 || processing || !compiler}
        >
          {processing ? 'Processing...' : 'Start'}
        </button>

        <button 
          className="download-button" 
          onClick={handleDownload} 
          disabled={!exportedBuffer}
        >
          Download
        </button>

        {processing && (
          <div className="progress-container">
            <div className="progress-label">Progress: {progress.toFixed(2)}%</div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        )}
      </div>

      <div className="image-container">
        {imageData.map((data, dataIndex) => (
          <div key={dataIndex} className="target-container">
            <h3>Target #{dataIndex + 1}</h3>
            
            {/* Tracking images */}
            {data.trackingImageList && data.trackingImageList.length > 0 ? (
              data.trackingImageList.map((image, i) => (
                <ImageDisplay 
                  key={`tracking-${i}`} 
                  image={image} 
                  points={data.trackingData && data.trackingData[i] && data.trackingData[i].points 
                    ? data.trackingData[i].points.map(p => ({
                        x: Math.round(p.x), 
                        y: Math.round(p.y)
                      }))
                    : []
                  }
                  title={`Tracking Image ${i + 1}`}
                />
              ))
            ) : (
              <p>No tracking images available</p>
            )}
            
            {/* Feature images */}
            {data.imageList && data.imageList.length > 0 ? (
              data.imageList.map((image, i) => {
                const maximaPoints = data.matchingData && data.matchingData[i] && 
                                    data.matchingData[i].maximaPoints ? data.matchingData[i].maximaPoints : [];
                const minimaPoints = data.matchingData && data.matchingData[i] && 
                                    data.matchingData[i].minimaPoints ? data.matchingData[i].minimaPoints : [];
                                    
                const kpmPoints = [...maximaPoints, ...minimaPoints];
                const points = kpmPoints.map(p => ({
                  x: Math.round(p.x),
                  y: Math.round(p.y)
                }));
                
                return (
                  <ImageDisplay 
                    key={`feature-${i}`} 
                    image={image} 
                    points={points}
                    title={`Feature Image ${i + 1}`}
                  />
                );
              })
            ) : (
              <p>No feature images available</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageCompiler;