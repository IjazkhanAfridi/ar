import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Plus,
  X,
  FileImage,
  Layers,
} from 'lucide-react';

const MultipleImageTracking = () => {
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
  const [navigating, setNavigating] = useState(false);
  
  // Refs to prevent memory leaks
  const imageUrlsRef = useRef([]);
  const initializationAttemptedRef = useRef(false);
  const compilerInitializedRef = useRef(false);

  // Cleanup function for image URLs
  const cleanupImageUrls = useCallback(() => {
    imageUrlsRef.current.forEach(url => {
      if (url && typeof url === 'string') {
        URL.revokeObjectURL(url);
      }
    });
    imageUrlsRef.current = [];
  }, []);

  // Initialize compiler with better error handling
  const initializeCompiler = useCallback(() => {
    if (compilerInitializedRef.current || initializationAttemptedRef.current) {
      return compilerInitializedRef.current;
    }

    initializationAttemptedRef.current = true;

    try {
      if (window.MINDAR && window.MINDAR.IMAGE) {
        const compilerInstance = new window.MINDAR.IMAGE.Compiler();
        setCompiler(compilerInstance);
        setIsInitializing(false);
        setError(null);
        compilerInitializedRef.current = true;
        console.log('MindAR compiler initialized successfully');
        return true;
      } else {
        console.warn('MindAR not available yet');
        return false;
      }
    } catch (err) {
      console.error('Error creating compiler instance:', err);
      setError(`Failed to initialize compiler: ${err.message}`);
      setIsInitializing(false);
      return false;
    }
  }, []);

  // Optimized useEffect with proper cleanup
  useEffect(() => {
    let mounted = true;
    let initInterval = null;

    const handleMindARLoad = () => {
      if (mounted) {
        console.log('MindAR loaded, initializing compiler...');
        initializeCompiler();
      }
    };

    // Try immediate initialization
    if (window.MINDAR && window.MINDAR.IMAGE) {
      initializeCompiler();
    } else {
      // Set up event listener for dynamic loading
      window.addEventListener('mindARLoaded', handleMindARLoad);
      
      // Fallback polling with longer intervals
      initInterval = setInterval(() => {
        if (mounted && !compilerInitializedRef.current && window.MINDAR && window.MINDAR.IMAGE) {
          if (initializeCompiler()) {
            clearInterval(initInterval);
          }
        }
      }, 2000); // Reduced frequency
    }

    return () => {
      mounted = false;
      if (initInterval) clearInterval(initInterval);
      window.removeEventListener('mindARLoaded', handleMindARLoad);
      cleanupImageUrls();
    };
  }, []); // Empty dependency array to prevent rerenders

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    setFiles(prevFiles => {
      const newFiles = [...prevFiles, ...acceptedFiles];
      // Store URLs for cleanup
      const newUrls = acceptedFiles.map(file => URL.createObjectURL(file));
      imageUrlsRef.current = [...imageUrlsRef.current, ...newUrls];
      return newFiles;
    });
    
    setError(null);
    setCompilationComplete(false);
    setExportedBuffer(null);
  }, []);

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
    },
    multiple: true,
    noClick: true,
    maxSize: 10 * 1024 * 1024, // 10MB limit
  });

  const loadImage = useCallback(async (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        resolve(img);
      };
      
      img.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(new Error(`Error loading image: ${file.name}`));
      };
      
      img.src = url;
    });
  }, []);

  const compileFiles = useCallback(async () => {
    if (!compiler) {
      setError('Compiler not initialized');
      return;
    }

    if (files.length === 0) {
      setError('No files to compile');
      return;
    }

    setProcessing(true);
    setError(null);
    setProgress(0);

    try {
      console.log('Starting compilation of', files.length, 'files');
      
      const images = await Promise.all(files.map(loadImage));
      console.log('Images loaded successfully:', images.length);

      const startTime = Date.now();
      const dataList = await compiler.compileImageTargets(images, (progressValue) => {
        console.log('Compilation progress:', progressValue);
        setProgress(progressValue);
      });

      const endTime = Date.now();
      console.log('Compilation completed in:', endTime - startTime, 'ms');
      console.log('Compilation results:', dataList);

      if (!dataList || dataList.length === 0) {
        throw new Error('No compilation data generated');
      }

      setImageData(dataList);
      
      const buffer = await compiler.exportData();
      if (!buffer) {
        throw new Error('Failed to export compilation data');
      }

      setExportedBuffer(buffer);
      setCompilationComplete(true);
      setProgress(100);

    } catch (error) {
      console.error('Error compiling files:', error);
      setError(`Compilation failed: ${error.message || 'Unknown error'}`);
    } finally {
      setProcessing(false);
    }
  }, [compiler, files, loadImage]);

  const handleStart = useCallback(() => {
    if (files.length === 0) {
      setError('Please select at least one image');
      return;
    }

    if (!compiler) {
      if (!initializeCompiler()) {
        setError('MindAR compiler is not initialized. Please wait or refresh the page.');
        return;
      }
    }

    compileFiles();
  }, [files.length, compiler, initializeCompiler, compileFiles]);

// Update the handleContinue function

const handleContinue = useCallback(async () => {
  if (navigating) return;
  
  if (!exportedBuffer || !compilationComplete) {
    setError('Please complete the compilation process first');
    return;
  }

  if (files.length === 0) {
    setError('No files available for navigation');
    return;
  }

  setNavigating(true);
  setError(null);

  try {
    const blob = new Blob([exportedBuffer]);
    
    // Convert blob to base64
    const base64Data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    // Convert all files to base64 URLs for the confirmation page
    const fileUrls = await Promise.all(
      files.map(file => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      })
    );

    const navigationState = {
      mindFileData: base64Data,
      mindFileBuffer: exportedBuffer,
      // Pass actual files and their URLs
      originalFiles: files,
      fileUrls: fileUrls,
      originalImages: files.map((file, index) => ({
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        url: fileUrls[index], // Add the base64 URL
      })),
      compiledImageData: imageData,
      compilationTimestamp: new Date().toISOString(),
      trackingData: imageData.map((data) => ({
        trackingImages: data.trackingImageList || [],
        featureImages: data.imageList || [],
        trackingPoints: data.trackingData || [],
        matchingData: data.matchingData || [],
      })),
      isMultipleImages: true,
      totalImages: files.length,
    };

    console.log('Navigating to multiple-image-confirmation with state:', navigationState);
    
    navigate('/multiple-image-confirmation', { state: navigationState });

  } catch (error) {
    console.error('Navigation error:', error);
    setError(`Navigation failed: ${error.message}`);
    setNavigating(false);
  }
}, [exportedBuffer, compilationComplete, files, imageData, navigate, navigating]);
  const removeFile = useCallback((index) => {
    setFiles(prevFiles => {
      const newFiles = [...prevFiles];
      newFiles.splice(index, 1);
      
      // Clean up the URL for the removed file
      if (imageUrlsRef.current[index]) {
        URL.revokeObjectURL(imageUrlsRef.current[index]);
        imageUrlsRef.current.splice(index, 1);
      }
      
      return newFiles;
    });
    
    // Reset states if no files left
    if (files.length === 1) {
      setImageData([]);
      setExportedBuffer(null);
      setCompilationComplete(false);
      setProgress(0);
      setError(null);
    }
  }, [files.length]);

  const handleAddMore = useCallback(() => {
    open();
  }, [open]);

  const handleSelectImages = useCallback(() => {
    open();
  }, [open]);

  const isStartButtonDisabled = files.length === 0 || processing || !compiler || isInitializing;
  const isContinueButtonDisabled = !compilationComplete || !exportedBuffer || navigating || processing;

  return (
    <div className='min-h-screen bg-slate-900 text-white flex flex-col'>
      {/* Header */}
      <header className="container mx-auto px-6 py-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-blue-600/20 p-2 rounded-lg">
            <Layers className="h-6 w-6 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold">Multiple Image Tracking</h1>
        </div>
        <p className='text-slate-400'>
          Upload multiple images to create a comprehensive AR tracking system. All images will be compiled into a single .mind file.
        </p>
      </header>

      <main className='container mx-auto p-6 flex-grow'>
        {/* Initialization Status */}
        {isInitializing && (
          <div className='mb-6 p-4 bg-blue-900/50 border border-blue-500/50 text-blue-400 rounded-lg'>
            <p>🔄 Initializing MindAR compiler... Please wait.</p>
          </div>
        )}

        {/* Navigation Status */}
        {navigating && (
          <div className='mb-6 p-4 bg-green-900/50 border border-green-500/50 text-green-400 rounded-lg'>
            <p>🚀 Preparing AR experience... Please wait.</p>
          </div>
        )}

        <div className='flex flex-col lg:flex-row gap-6'>
          {/* Upload Area */}
          <div className='flex-1'>
            {files.length === 0 ? (
              // Initial upload area when no files selected
              <div
                {...getRootProps({
                  className:
                    'border-2 border-dashed border-blue-500/30 rounded-xl p-12 bg-slate-800/50 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/50 hover:bg-slate-800/70 transition-all duration-300',
                })}
              >
                <input {...getInputProps()} />
                <div className="bg-blue-600/20 p-6 rounded-full mb-6">
                  <Upload className='h-16 w-16 text-blue-400' />
                </div>
                <h3 className='font-semibold text-2xl mb-2 text-white'>
                  Upload Multiple Images
                </h3>
                <p className='text-slate-400 mb-6 text-center max-w-md'>
                  Drag and drop multiple images here, or click to select them from your device
                </p>
                <Button
                  onClick={handleSelectImages}
                  className='bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 text-lg flex gap-3 items-center'
                  disabled={isInitializing}
                >
                  <ImageIcon className='h-5 w-5' />
                  Select Multiple Images
                </Button>
                <p className='text-slate-500 text-sm mt-8'>
                  Supports: JPG, PNG • Max 10MB per image • Up to 10 images recommended
                </p>
              </div>
            ) : (
              // Upload area when files are already selected
              <div className='space-y-6'>
                <div
                  {...getRootProps({
                    className:
                      'border-2 border-dashed border-blue-500/30 rounded-xl p-8 bg-slate-800/30 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/50 hover:bg-slate-800/50 transition-all duration-300',
                  })}
                >
                  <input {...getInputProps()} />
                  <Upload className='h-10 w-10 text-blue-400 mb-3' />
                  <h4 className='font-medium text-lg mb-2'>Add More Images</h4>
                  <p className='text-slate-400 text-sm text-center'>
                    Drop additional images here or click to select more
                  </p>
                </div>
                
                <div className='flex justify-center'>
                  <Button
                    onClick={handleAddMore}
                    className='bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 flex gap-2 items-center'
                    disabled={processing || navigating}
                  >
                    <Plus className='h-5 w-5' />
                    Add More Images
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Preview Area */}
          <div className='bg-slate-800/50 rounded-xl p-6 w-full lg:w-96 border border-slate-700/50'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='font-semibold text-lg'>Preview</h3>
              {files.length > 0 && (
                <div className="bg-blue-600/20 px-3 py-1 rounded-full">
                  <span className='text-sm text-blue-400 font-medium'>
                    {files.length} image{files.length > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
            
            <div className='aspect-square relative bg-slate-900 rounded-lg flex items-center justify-center mb-4 border border-slate-700/30'>
              {files.length > 0 ? (
                <div className='grid grid-cols-2 gap-2 w-full h-full p-3'>
                  {files.slice(0, 4).map((file, index) => (
                    <div key={`${file.name}-${index}`} className='relative rounded-lg overflow-hidden'>
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className='w-full h-full object-cover'
                        onLoad={(e) => {
                          // Don't revoke here, we'll handle it in cleanup
                        }}
                      />
                      {index === 3 && files.length > 4 && (
                        <div className='absolute inset-0 bg-black/70 rounded-lg flex items-center justify-center'>
                          <span className='text-white font-semibold text-lg'>
                            +{files.length - 4}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-slate-600 flex flex-col items-center'>
                  <FileImage className='h-12 w-12 mb-3' />
                  <span className='text-lg'>No images selected</span>
                  <span className='text-sm text-slate-500'>Preview will appear here</span>
                </div>
              )}
            </div>
            
            <div className='space-y-2 text-sm'>
              <div className='flex justify-between text-slate-400'>
                <span>Total images:</span>
                <span className='font-medium'>{files.length}</span>
              </div>
              <div className='flex justify-between text-slate-400'>
                <span>Total size:</span>
                <span className='font-medium'>
                  {files.length > 0
                    ? `${(
                        files.reduce((sum, file) => sum + file.size, 0) /
                        (1024 * 1024)
                      ).toFixed(1)} MB`
                    : '0 MB'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Files List */}
        {files.length > 0 && (
          <div className='mt-8 bg-slate-800/50 rounded-xl p-6 border border-slate-700/50'>
            <h3 className='font-semibold text-lg mb-4'>Selected Images</h3>
            <div className='space-y-3 max-h-64 overflow-y-auto'>
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}-${file.lastModified}`}
                  className='flex items-center justify-between bg-slate-900/50 p-4 rounded-lg border border-slate-700/30'
                >
                  <div className='flex items-center gap-4'>
                    <div className='relative'>
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className='w-12 h-12 object-cover rounded-lg'
                      />
                      <div className='absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium'>
                        {index + 1}
                      </div>
                    </div>
                    <div>
                      <h4 className='text-slate-200 font-medium truncate max-w-xs'>
                        {file.name}
                      </h4>
                      <p className='text-slate-500 text-sm'>
                        {(file.size / (1024 * 1024)).toFixed(1)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => removeFile(index)}
                    className='text-red-400 hover:text-red-300 hover:bg-red-900/20 p-2'
                    disabled={processing || navigating}
                  >
                    <X className='h-4 w-4' />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips Section */}
        <div className='mt-8 bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-6 rounded-xl border border-blue-500/20'>
          <div className='flex items-center gap-3 mb-4'>
            <HelpCircle className='text-blue-400 h-6 w-6' />
            <h3 className='font-semibold text-lg text-blue-400'>
              Tips for Multiple Image Tracking
            </h3>
          </div>
          <div className='grid md:grid-cols-2 gap-4'>
            <div className='space-y-3'>
              <div className='flex items-start gap-3'>
                <CheckCircle className='text-green-500 h-5 w-5 mt-0.5' />
                <div>
                  <p className='text-slate-300 font-medium'>Diverse Content</p>
                  <p className='text-slate-400 text-sm'>Choose images with different content for better tracking</p>
                </div>
              </div>
              <div className='flex items-start gap-3'>
                <CheckCircle className='text-green-500 h-5 w-5 mt-0.5' />
                <div>
                  <p className='text-slate-300 font-medium'>High Contrast</p>
                  <p className='text-slate-400 text-sm'>Images with good contrast and details work best</p>
                </div>
              </div>
            </div>
            <div className='space-y-3'>
              <div className='flex items-start gap-3'>
                <CheckCircle className='text-green-500 h-5 w-5 mt-0.5' />
                <div>
                  <p className='text-slate-300 font-medium'>Avoid Repetition</p>
                  <p className='text-slate-400 text-sm'>Don't use repetitive patterns or similar images</p>
                </div>
              </div>
              <div className='flex items-start gap-3'>
                <CheckCircle className='text-green-500 h-5 w-5 mt-0.5' />
                <div>
                  <p className='text-slate-300 font-medium'>Optimal Size</p>
                  <p className='text-slate-400 text-sm'>Minimum 1080x1080px for better results</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className='mt-6 p-4 bg-red-900/50 border border-red-500/50 text-red-400 rounded-lg'>
            <p>{error}</p>
          </div>
        )}

        {/* Progress and Actions */}
        <div className='mt-8 space-y-4'>
          <Button
            className={`w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 text-lg ${
              isStartButtonDisabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={handleStart}
            disabled={isStartButtonDisabled}
          >
            {processing
              ? 'Compiling Images...'
              : isInitializing
              ? 'Initializing...'
              : files.length > 0
              ? `Compile ${files.length} Image${files.length > 1 ? 's' : ''}`
              : 'Select Images First'}
          </Button>

          {processing && (
            <div className='bg-slate-800/50 p-4 rounded-lg border border-slate-700/50'>
              <div className='flex justify-between items-center mb-2'>
                <span className='text-slate-300 font-medium'>Compiling Images...</span>
                <span className='text-blue-400 font-medium'>{progress.toFixed(1)}%</span>
              </div>
              <div className='bg-slate-700 rounded-full h-2'>
                <div
                  className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {compilationComplete && (
            <div className='bg-green-900/50 border border-green-500/50 text-green-400 rounded-lg p-4'>
              <div className='flex items-center gap-3'>
                <CheckCircle className='h-5 w-5' />
                <div>
                  <p className='font-medium'>Compilation Successful!</p>
                  <p className='text-sm'>All {files.length} images have been compiled into a single .mind file.</p>
                </div>
              </div>
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
          disabled={navigating}
        >
          <ArrowLeft className='h-4 w-4' />
          Back to Home
        </Button>

        <Button
          onClick={handleContinue}
          disabled={isContinueButtonDisabled}
          className={`flex items-center gap-2 ${
            compilationComplete && exportedBuffer && !navigating
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-slate-700 cursor-not-allowed'
          }`}
        >
          {navigating ? (
            <>
              Preparing...
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            </>
          ) : (
            <>
              Continue to AR Creation
              <ArrowRight className='h-4 w-4' />
            </>
          )}
        </Button>
      </div>

      {/* Copyright */}
      <footer className='p-4 text-center text-slate-500 text-sm'>
        © 2023 PACKAR - Create your AR experience
      </footer>
    </div>
  );
};

export default MultipleImageTracking;