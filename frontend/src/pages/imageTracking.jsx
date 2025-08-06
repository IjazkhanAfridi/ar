import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import '../components/image-to-ar/ImageCompiler.css';
import { Button } from '@/components/ui/button';
import {
  Upload,
  Image as ImageIcon,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';

const ImageTracking = () => {
  const navigate = useNavigate();
  const [compiler, setCompiler] = useState(null);
  const [files, setFiles] = useState([]);
  const [progress, setProgress] = useState(0);
  const [exportedBuffer, setExportedBuffer] = useState(null);
  const [imageData, setImageData] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [compilationComplete, setCompilationComplete] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize compiler with retry mechanism
  const initializeCompiler = useCallback(() => {
    console.log('Checking MindAR availability...', {
      windowMINDAR: !!window.MINDAR,
      windowMINDARIMAGE: !!(window.MINDAR && window.MINDAR.IMAGE),
      compiler: !!compiler
    });
    
    if (window.MINDAR && window.MINDAR.IMAGE) {
      try {
        const compilerInstance = new window.MINDAR.IMAGE.Compiler();
        setCompiler(compilerInstance);
        setIsInitializing(false);
        setError(null);
        console.log('MindAR compiler initialized successfully');
        return true;
      } catch (err) {
        console.error('Error creating compiler instance:', err);
        setError(`Failed to initialize compiler: ${err.message}`);
        setIsInitializing(false);
        return false;
      }
    } else {
      console.log('MindAR not available yet:', {
        MINDAR: !!window.MINDAR,
        IMAGE: !!(window.MINDAR && window.MINDAR.IMAGE)
      });
    }
    return false;
  }, []);

  // Initialize compiler on mount and retry if needed
  useEffect(() => {
    console.log('ImageTracking component mounted, checking MindAR...');
    
    // Try to initialize immediately
    if (!initializeCompiler()) {
      // If MindAR is not available, set up a retry mechanism
      let retryCount = 0;
      const maxRetries = 10;
      const retryInterval = 1000; // 1 second

      const retryInitialization = () => {
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(
            `Retrying MindAR initialization... Attempt ${retryCount}/${maxRetries}`
          );

          if (initializeCompiler()) {
            return; // Successfully initialized
          }

          // Continue retrying
          setTimeout(retryInitialization, retryInterval);
        } else {
          setError(
            'Failed to initialize MindAR after multiple attempts. Please refresh the page.'
          );
          setIsInitializing(false);
        }
      };

      // Start retry process
      setTimeout(retryInitialization, retryInterval);
    }
  }, [initializeCompiler]);

  // Listen for MindAR script loading
  useEffect(() => {
    console.log('Setting up MindAR load listeners...');
    
    const handleMindARLoad = () => {
      if (!compiler && !processing) {
        console.log(
          'MindAR script loaded, attempting to initialize compiler...'
        );
        initializeCompiler();
      }
    };

    // Check if MindAR is already loaded
    if (window.MINDAR && window.MINDAR.IMAGE && !compiler) {
      console.log('MindAR already available, initializing...');
      initializeCompiler();
    }

    // Listen for custom events that might indicate MindAR is loaded
    window.addEventListener('mindARLoaded', handleMindARLoad);

    // Also check periodically if MindAR becomes available
    const checkInterval = setInterval(() => {
      if (!compiler && window.MINDAR && window.MINDAR.IMAGE && !processing) {
        console.log('MindAR detected via interval check');
        initializeCompiler();
        clearInterval(checkInterval);
      }
    }, 500);

    // Check if script failed to load
    const scriptCheck = setTimeout(() => {
      if (!window.MINDAR) {
        console.error('MindAR script may have failed to load. Check network tab for errors.');
        setError('MindAR library failed to load. Please check your internet connection and refresh the page.');
        setIsInitializing(false);
      }
    }, 10000); // Check after 10 seconds

    return () => {
      window.removeEventListener('mindARLoaded', handleMindARLoad);
      clearInterval(checkInterval);
      clearTimeout(scriptCheck);
    };
  }, [compiler, processing, initializeCompiler]);

  const onDrop = useCallback((acceptedFiles) => {
    setFiles(acceptedFiles);
    setImageData([]);
    setExportedBuffer(null);
    setError(null);
    setCompilationComplete(false);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
    },
    multiple: true,
  });

  const loadImage = async (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (e) =>
        reject(new Error(`Error loading image: ${file.name}`));
      img.src = URL.createObjectURL(file);
    });
  };

  const compileFiles = async () => {
    if (!compiler || files.length === 0) return;

    setProcessing(true);
    setProgress(0);
    setError(null);
    setCompilationComplete(false);

    try {
      const images = [];
      for (let i = 0; i < files.length; i++) {
        const img = await loadImage(files[i]);
        images.push(img);
        console.log(
          `Loaded image ${i + 1}/${files.length}: ${files[i].name}, size: ${
            img.width
          }x${img.height}`
        );
      }

      console.log('Starting compilation with', images.length, 'images');
      const startTime = new Date().getTime();

      const dataList = await compiler.compileImageTargets(images, (p) => {
        console.log('Compilation progress:', p);
        setProgress(p);
      });

      console.log(
        'Compilation completed in:',
        new Date().getTime() - startTime,
        'ms'
      );
      console.log('Compilation results:', dataList);

      setImageData(dataList);
      const buffer = await compiler.exportData();
      setExportedBuffer(buffer);
      setCompilationComplete(true);
    } catch (error) {
      console.error('Error compiling files:', error);
      setError(`Error compiling files: ${error.message || 'Unknown error'}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleStart = () => {
    if (files.length === 0) {
      setError('Please select files first');
      return;
    }

    if (!compiler) {
      // Try to reinitialize the compiler one more time
      if (!initializeCompiler()) {
        setError(
          'MindAR compiler is not initialized yet. Please wait or refresh the page.'
        );
        return;
      }
    }

    compileFiles();
  };

  const handleContinue = () => {
    if (!exportedBuffer || !compilationComplete) {
      setError('Please complete the compilation process first');
      return;
    }

    const blob = new Blob([exportedBuffer]);
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result;

      // Get the first original image for preview
      const firstImageFile = files[0];
      const firstImageReader = new FileReader();
      firstImageReader.onload = () => {
        const firstImagePreview = firstImageReader.result;

        navigate('/confirm-image', {
          state: {
            mindFileData: base64Data,
            mindFileBuffer: exportedBuffer,
            originalImages: files.map((file) => ({
              name: file.name,
              size: file.size,
              type: file.type,
              lastModified: file.lastModified,
            })),
            compiledImageData: imageData,
            compilationTimestamp: new Date().toISOString(),
            previewImage: firstImagePreview,
            firstImageName: firstImageFile.name,
            firstImageSize: `${(firstImageFile.size / (1024 * 1024)).toFixed(
              1
            )} MB`,
            firstImageDimensions: '1200 x 800 px',
            trackingData: imageData.map((data) => ({
              trackingImages: data.trackingImageList || [],
              featureImages: data.imageList || [],
              trackingPoints: data.trackingData || [],
              matchingData: data.matchingData || [],
            })),
          },
        });
      };
      firstImageReader.readAsDataURL(firstImageFile);
    };
    reader.readAsDataURL(blob);
  };

  const removeFile = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    if (newFiles.length === 0) {
      setImageData([]);
      setExportedBuffer(null);
      setCompilationComplete(false);
    }
  };

  // Check if the start button should be disabled
  const isStartButtonDisabled =
    files.length === 0 || processing || !compiler || isInitializing;

  return (
    <div className='min-h-screen bg-slate-900 text-white flex flex-col'>
      {/* Main Content */}
      <main className='container mx-auto p-6 flex-grow'>
        <h2 className='text-2xl font-semibold mb-2'>Upload Target Images</h2>
        <p className='text-slate-400 mb-6'>
          These images will be used as targets for the AR experience. Choose
          images with good contrast and details.
        </p>

        {/* Initialization Status */}
        {isInitializing && (
          <div className='mb-6 p-4 bg-blue-900/50 border border-blue-500/50 text-blue-400 rounded'>
            <p>🔄 Initializing MindAR compiler... Please wait.</p>
          </div>
        )}

        <div className='flex flex-col md:flex-row gap-6'>
          {/* Upload Area */}
          <div
            {...getRootProps({
              className:
                'border border-dashed border-amber-600/30 rounded-lg p-8 bg-slate-800 flex-1 flex flex-col items-center justify-center cursor-pointer',
            })}
          >
            <input {...getInputProps()} />
            <Upload className='h-12 w-12 text-blue-400 mb-4' />
            <h3 className='font-medium text-lg mb-1'>
              Drag and drop images here
            </h3>
            <p className='text-slate-400 mb-4'>or</p>
            <Button className='bg-amber-700 hover:bg-amber-800 text-white font-medium flex gap-2 items-center'>
              <ImageIcon className='h-4 w-4' />
              Select Image
            </Button>
            <p className='text-slate-500 text-sm mt-6'>
              Supports: JPG, PNG. Max 10MB
            </p>
          </div>

          {/* Preview Area */}
          <div className='bg-slate-800 rounded-lg p-4 w-full md:w-1/3'>
            <h3 className='font-medium mb-3'>Preview</h3>
            <div className='aspect-video relative bg-slate-900 rounded flex items-center justify-center mb-4'>
              {files.length > 0 ? (
                <div className='flex items-center justify-center p-2'>
                  {files.slice(0, 4).map((file, index) => (
                    <img
                      key={index}
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className='h-full w-full object-cover'
                    />
                  ))}
                </div>
              ) : (
                <div className='text-slate-600 flex flex-col items-center'>
                  <ImageIcon className='h-6 w-6 mb-2' />
                  <span>Preview not available</span>
                </div>
              )}
            </div>
            <div className='text-sm flex items-center gap-2 text-slate-400'>
              <p>File count: {files.length > 0 ? files.length : '-'} , </p>
              <p>
                Total size:{' '}
                {files.length > 0
                  ? `${(
                      files.reduce((sum, file) => sum + file.size, 0) /
                      (1024 * 1024)
                    ).toFixed(1)} MB`
                  : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Uploaded Files List */}
        {files.length > 0 && (
          <div className='mt-6 bg-slate-800 rounded-lg p-4'>
            <h3 className='font-medium mb-3'>Uploaded Files</h3>
            <ul className='space-y-2'>
              {files.map((file, index) => (
                <li
                  key={index}
                  className='flex justify-between items-center bg-slate-900 p-3 rounded'
                >
                  <span className='text-slate-300'>
                    {file.name} ({(file.size / (1024 * 1024)).toFixed(1)} MB)
                  </span>
                  <button
                    className='text-red-500 hover:text-red-600'
                    onClick={() => removeFile(index)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tips Section */}
        <div className='mt-8 bg-slate-800/50 p-4 rounded-lg mb-6'>
          <div className='flex items-center gap-2 mb-3'>
            <HelpCircle className='text-amber-500 h-5 w-5' />
            <h3 className='font-medium text-amber-400'>
              Tips for better results
            </h3>
          </div>
          <ul className='space-y-2'>
            <li className='flex items-center gap-2 text-slate-300'>
              <CheckCircle className='text-green-500 h-4 w-4' />
              Choose images with good contrast and lots of details
            </li>
            <li className='flex items-center gap-2 text-slate-300'>
              <CheckCircle className='text-green-500 h-4 w-4' />
              Avoid repetitive patterns or reflective surfaces
            </li>
            <li className='flex items-center gap-2 text-slate-300'>
              <CheckCircle className='text-green-500 h-4 w-4' />
              Recommended minimum resolution: 1080x1080px
            </li>
          </ul>
        </div>

        {/* Error Message */}
        {error && (
          <div className='mb-6 p-4 bg-red-900/50 border border-red-500/50 text-red-400 rounded'>
            <p>{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className='mb-6'>
          <Button
            className={`bg-amber-700 hover:bg-amber-800 text-white font-medium ${
              isStartButtonDisabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={handleStart}
            disabled={isStartButtonDisabled}
          >
            {processing
              ? 'Compiling...'
              : isInitializing
              ? 'Initializing...'
              : 'Start Compilation'}
          </Button>

          {processing && (
            <div className='mt-4'>
              <p className='text-sm text-slate-400 mb-2'>
                Compilation Progress: {progress.toFixed(2)}%
              </p>
              <div className='bg-slate-700 rounded-full h-3'>
                <div
                  className='bg-blue-600 h-3 rounded-full transition-all duration-300'
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {compilationComplete && (
            <div className='mt-4 p-3 bg-green-900/50 border border-green-500/50 text-green-400 rounded'>
              <p>
                ✅ Compilation completed successfully! You can now continue to
                AR creation.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer with Navigation */}
      <div className='container mx-auto p-6 flex justify-between mt-auto'>
        <Button
          variant='ghost'
          className='flex items-center gap-2 text-slate-400 hover:text-white'
          onClick={() => navigate('/')}
        >
          <ArrowLeft className='h-4 w-4' />
          Back
        </Button>

        <Button
          onClick={handleContinue}
          disabled={!compilationComplete || !exportedBuffer}
          className={`flex items-center gap-2 ${
            compilationComplete && exportedBuffer
              ? 'bg-amber-700 hover:bg-amber-800'
              : 'bg-slate-700 cursor-not-allowed'
          }`}
        >
          Continue
          <ArrowRight className='h-4 w-4' />
        </Button>
      </div>

      {/* Copyright */}
      <footer className='p-4 text-center text-slate-500 text-sm'>
        © 2023 PACKAR - Create your AR experience
      </footer>
    </div>
  );
};

export default ImageTracking;

// import React, { useState, useEffect, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useDropzone } from 'react-dropzone';
// import '../components/image-to-ar/ImageCompiler.css';
// import { Button } from "@/components/ui/button";
// import { Upload, Image as ImageIcon, CheckCircle, ArrowLeft, ArrowRight, HelpCircle } from "lucide-react";

// const ImageTracking = () => {
//   const navigate = useNavigate();
//   const [compiler, setCompiler] = useState(null);
//   const [files, setFiles] = useState([]);
//   const [progress, setProgress] = useState(0);
//   const [exportedBuffer, setExportedBuffer] = useState(null);
//   const [imageData, setImageData] = useState([]);
//   const [processing, setProcessing] = useState(false);
//   const [error, setError] = useState(null);
//   const [compilationComplete, setCompilationComplete] = useState(false);

//   // Initialize compiler
//   useEffect(() => {
//     if (window.MINDAR && window.MINDAR.IMAGE) {
//       try {
//         const compilerInstance = new window.MINDAR.IMAGE.Compiler();
//         setCompiler(compilerInstance);
//         console.log("MindAR compiler initialized successfully");
//       } catch (err) {
//         console.error("Error creating compiler instance:", err);
//         setError(`Failed to initialize compiler: ${err.message}`);
//       }
//     }
//   }, []);

//   const onDrop = useCallback((acceptedFiles) => {
//     setFiles(acceptedFiles);
//     setImageData([]);
//     setExportedBuffer(null);
//     setError(null);
//     setCompilationComplete(false);
//   }, []);

//   const { getRootProps, getInputProps } = useDropzone({
//     onDrop,
//     accept: {
//       'image/*': ['.png', '.jpg', '.jpeg']
//     },
//     multiple: true
//   });

//   const loadImage = async (file) => {
//     return new Promise((resolve, reject) => {
//       const img = new Image();
//       img.onload = () => resolve(img);
//       img.onerror = (e) => reject(new Error(`Error loading image: ${file.name}`));
//       img.src = URL.createObjectURL(file);
//     });
//   };

//   const compileFiles = async () => {
//     if (!compiler || files.length === 0) return;

//     setProcessing(true);
//     setProgress(0);
//     setError(null);
//     setCompilationComplete(false);

//     try {
//       const images = [];
//       for (let i = 0; i < files.length; i++) {
//         const img = await loadImage(files[i]);
//         images.push(img);
//         console.log(`Loaded image ${i+1}/${files.length}: ${files[i].name}, size: ${img.width}x${img.height}`);
//       }

//       console.log("Starting compilation with", images.length, "images");
//       const startTime = new Date().getTime();

//       const dataList = await compiler.compileImageTargets(images, (p) => {
//         console.log("Compilation progress:", p);
//         setProgress(p);
//       });

//       console.log("Compilation completed in:", new Date().getTime() - startTime, "ms");
//       console.log("Compilation results:", dataList);

//       setImageData(dataList);
//       const buffer = await compiler.exportData();
//       setExportedBuffer(buffer);
//       setCompilationComplete(true);
//     } catch (error) {
//       console.error("Error compiling files:", error);
//       setError(`Error compiling files: ${error.message || "Unknown error"}`);
//     } finally {
//       setProcessing(false);
//     }
//   };

//   const handleStart = () => {
//     if (files.length === 0) {
//       setError("Please select files first");
//       return;
//     }

//     if (!compiler) {
//       setError("MindAR compiler is not initialized yet. Please wait or refresh the page.");
//       return;
//     }

//     compileFiles();
//   };

//   const handleContinue = () => {
//   if (!exportedBuffer || !compilationComplete) {
//     setError("Please complete the compilation process first");
//     return;
//   }

//   const blob = new Blob([exportedBuffer]);
//   const reader = new FileReader();
//   reader.onload = () => {
//     const base64Data = reader.result;

//     // Get the first original image for preview
//     const firstImageFile = files[0];
//     const firstImageReader = new FileReader();
//     firstImageReader.onload = () => {
//       const firstImagePreview = firstImageReader.result;

//       navigate('/confirm-image', {
//         state: {
//           mindFileData: base64Data,
//           mindFileBuffer: exportedBuffer,
//           originalImages: files.map(file => ({
//             name: file.name,
//             size: file.size,
//             type: file.type,
//             lastModified: file.lastModified
//           })),
//           compiledImageData: imageData,
//           compilationTimestamp: new Date().toISOString(),
//           previewImage: firstImagePreview,
//           firstImageName: firstImageFile.name,
//           firstImageSize: `${(firstImageFile.size / (1024 * 1024)).toFixed(1)} MB`,
//           firstImageDimensions: '1200 x 800 px',
//           trackingData: imageData.map(data => ({
//             trackingImages: data.trackingImageList || [],
//             featureImages: data.imageList || [],
//             trackingPoints: data.trackingData || [],
//             matchingData: data.matchingData || []
//           }))
//         }
//       });
//     };
//     firstImageReader.readAsDataURL(firstImageFile);
//   };
//   reader.readAsDataURL(blob);
// };

//   const removeFile = (index) => {
//     const newFiles = [...files];
//     newFiles.splice(index, 1);
//     setFiles(newFiles);
//     if (newFiles.length === 0) {
//       setImageData([]);
//       setExportedBuffer(null);
//       setCompilationComplete(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-slate-900 text-white flex flex-col">

//       {/* Main Content */}
//       <main className="container mx-auto p-6 flex-grow">
//         <h2 className="text-2xl font-semibold mb-2">Upload Target Images</h2>
//         <p className="text-slate-400 mb-6">
//           These images will be used as targets for the AR experience. Choose images with good contrast and details.
//         </p>

//         <div className="flex flex-col md:flex-row gap-6">
//           {/* Upload Area */}
//           <div
//             {...getRootProps({
//               className: "border border-dashed border-amber-600/30 rounded-lg p-8 bg-slate-800 flex-1 flex flex-col items-center justify-center cursor-pointer"
//             })}
//           >
//             <input {...getInputProps()} />
//             <Upload className="h-12 w-12 text-blue-400 mb-4" />
//             <h3 className="font-medium text-lg mb-1">Drag and drop images here</h3>
//             <p className="text-slate-400 mb-4">or</p>
//             <Button
//               className="bg-amber-700 hover:bg-amber-800 text-white font-medium flex gap-2 items-center"
//             >
//               <ImageIcon className="h-4 w-4" />
//               Select Image
//             </Button>
//             <p className="text-slate-500 text-sm mt-6">Supports: JPG, PNG. Max 10MB</p>
//           </div>

//           {/* Preview Area */}
//           <div className="bg-slate-800 rounded-lg p-4 w-full md:w-1/3">
//             <h3 className="font-medium mb-3">Preview</h3>
//             <div className="aspect-video relative bg-slate-900 rounded flex items-center justify-center mb-4">
//               {files.length > 0 ? (
//                 <div className="flex items-center justify-center p-2">
//                   {files.slice(0, 4).map((file, index) => (
//                     <img
//                       key={index}
//                       src={URL.createObjectURL(file)}
//                       alt={file.name}
//                       className="h-full w-full object-cover"
//                     />
//                   ))}
//                 </div>
//               ) : (
//                 <div className="text-slate-600 flex flex-col items-center">
//                   <ImageIcon className="h-6 w-6 mb-2" />
//                   <span>Preview not available</span>
//                 </div>
//               )}
//             </div>
//             <div className="text-sm flex items-center gap-2 text-slate-400">
//               <p>File count: {files.length > 0 ? files.length : '-'} , </p>
//               <p>Total size: {files.length > 0 ? `${(files.reduce((sum, file) => sum + file.size, 0) / (1024 * 1024)).toFixed(1)} MB` : '-'}</p>
//             </div>
//           </div>
//         </div>

//         {/* Uploaded Files List */}
//         {files.length > 0 && (
//           <div className="mt-6 bg-slate-800 rounded-lg p-4">
//             <h3 className="font-medium mb-3">Uploaded Files</h3>
//             <ul className="space-y-2">
//               {files.map((file, index) => (
//                 <li key={index} className="flex justify-between items-center bg-slate-900 p-3 rounded">
//                   <span className="text-slate-300">
//                     {file.name} ({(file.size / (1024 * 1024)).toFixed(1)} MB)
//                   </span>
//                   <button
//                     className="text-red-500 hover:text-red-600"
//                     onClick={() => removeFile(index)}
//                   >
//                     Remove
//                   </button>
//                 </li>
//               ))}
//             </ul>
//           </div>
//         )}

//         {/* Tips Section */}
//         <div className="mt-8 bg-slate-800/50 p-4 rounded-lg mb-6">
//           <div className="flex items-center gap-2 mb-3">
//             <HelpCircle className="text-amber-500 h-5 w-5" />
//             <h3 className="font-medium text-amber-400">Tips for better results</h3>
//           </div>
//           <ul className="space-y-2">
//             <li className="flex items-center gap-2 text-slate-300">
//               <CheckCircle className="text-green-500 h-4 w-4" />
//               Choose images with good contrast and lots of details
//             </li>
//             <li className="flex items-center gap-2 text-slate-300">
//               <CheckCircle className="text-green-500 h-4 w-4" />
//               Avoid repetitive patterns or reflective surfaces
//             </li>
//             <li className="flex items-center gap-2 text-slate-300">
//               <CheckCircle className="text-green-500 h-4 w-4" />
//               Recommended minimum resolution: 1080x1080px
//             </li>
//           </ul>
//         </div>

//         {/* Error Message */}
//         {error && (
//           <div className="mb-6 p-4 bg-red-900/50 border border-red-500/50 text-red-400 rounded">
//             <p>{error}</p>
//           </div>
//         )}

//         {/* Actions */}
//         <div className="mb-6">
//           <Button
//             className={`bg-amber-700 hover:bg-amber-800 text-white font-medium ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
//             onClick={handleStart}
//             disabled={files.length === 0 || processing || !compiler}
//           >
//             {processing ? 'Compiling...' : 'Start Compilation'}
//           </Button>

//           {processing && (
//             <div className="mt-4">
//               <p className="text-sm text-slate-400 mb-2">Compilation Progress: {progress.toFixed(2)}%</p>
//               <div className="bg-slate-700 rounded-full h-3">
//                 <div
//                   className="bg-blue-600 h-3 rounded-full transition-all duration-300"
//                   style={{ width: `${progress}%` }}
//                 ></div>
//               </div>
//             </div>
//           )}

//           {compilationComplete && (
//             <div className="mt-4 p-3 bg-green-900/50 border border-green-500/50 text-green-400 rounded">
//               <p>✅ Compilation completed successfully! You can now continue to AR creation.</p>
//             </div>
//           )}
//         </div>

//         {/* Compilation Results */}
//         {/* {compilationComplete && (
//           <div className="mt-8 bg-slate-800 rounded-lg p-4">
//             <h3 className="text-xl font-semibold mb-4">Compilation Results</h3>
//             {imageData.map((data, dataIndex) => (
//               <div key={dataIndex} className="mb-8">
//                 <h4 className="text-lg font-medium mb-4">Target #{dataIndex + 1}</h4>
//                 <div className="space-y-6">
//                   <div>
//                     <h5 className="font-medium mb-2 text-slate-300">Tracking Images:</h5>
//                     {data.trackingImageList && data.trackingImageList.length > 0 ? (
//                       data.trackingImageList.map((image, i) => (
//                         <ImageDisplay
//                           key={`tracking-${i}`}
//                           image={image}
//                           points={data.trackingData && data.trackingData[i] && data.trackingData[i].points
//                             ? data.trackingData[i].points.map(p => ({ x: Math.round(p.x), y: Math.round(p.y) }))
//                             : []
//                           }
//                           title={`Tracking Image ${i + 1}`}
//                         />
//                       ))
//                     ) : (
//                       <p className="text-slate-500">No tracking images available</p>
//                     )}
//                   </div>
//                   <div>
//                     <h5 className="font-medium mb-2 text-slate-300">Feature Images:</h5>
//                     {data.imageList && data.imageList.length > 0 ? (
//                       data.imageList.map((image, i) => {
//                         const maximaPoints = data.matchingData && data.matchingData[i] &&
//                                             data.matchingData[i].maximaPoints ? data.matchingData[i].maximaPoints : [];
//                         const minimaPoints = data.matchingData && data.matchingData[i] &&
//                                             data.matchingData[i].minimaPoints ? data.matchingData[i].minimaPoints : [];
//                         const kmpPoints = [...maximaPoints, ...minimaPoints];
//                         const points = kmpPoints.map(p => ({ x: Math.round(p.x), y: Math.round(p.y) }));
//                         return (
//                           <ImageDisplay
//                             key={`feature-${i}`}
//                             image={image}
//                             points={points}
//                             title={`Feature Image ${i + 1}`}
//                           />
//                         );
//                       })
//                     ) : (
//                       <p className="text-slate-500">No feature images available</p>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )} */}
//       </main>

//       {/* Footer with Navigation */}
//       <div className="container mx-auto p-6 flex justify-between mt-auto">
//         <Button
//           variant="ghost"
//           className="flex items-center gap-2 text-slate-400 hover:text-white"
//           onClick={() => navigate('/')}
//         >
//           <ArrowLeft className="h-4 w-4" />
//           Back
//         </Button>

//         <Button
//           onClick={handleContinue}
//           disabled={!compilationComplete || !exportedBuffer}
//           className={`flex items-center gap-2 ${compilationComplete && exportedBuffer ? 'bg-amber-700 hover:bg-amber-800' : 'bg-slate-700 cursor-not-allowed'}`}
//         >
//           Continue
//           <ArrowRight className="h-4 w-4" />
//         </Button>
//       </div>

//       {/* Copyright */}
//       <footer className="p-4 text-center text-slate-500 text-sm">
//         © 2023 PACKAR - Create your AR experience
//       </footer>
//     </div>
//   );
// };

// export default ImageTracking;
