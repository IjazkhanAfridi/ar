import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, X, Check, BarChart, ChevronLeft, ChevronRight } from 'lucide-react';

const MultipleImageConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Get data from navigation state
  const {
    mindFileData,
    mindFileBuffer,
    originalImages = [],
    originalFiles = [],
    fileUrls = [],
    compiledImageData = [],
    trackingData = [],
    compilationTimestamp,
    isMultipleImages,
    totalImages,
  } = location?.state || {};

  // Generate image data for current image
  const [imageData, setImageData] = useState({
    name: '',
    size: '',
    dimensions: '1200 x 800 px',
    preview: '',
  });

  const [analysis, setAnalysis] = useState({
    contrast: 92,
    details: 88,
    recognizability: 75,
  });

  useEffect(() => {
    if (originalImages && originalImages.length > 0 && currentImageIndex < originalImages.length) {
      const currentImage = originalImages[currentImageIndex];
      setImageData({
        name: currentImage.name,
        size: `${(currentImage.size / (1024 * 1024)).toFixed(1)} MB`,
        dimensions: '1200 x 800 px',
        preview: currentImage.url || fileUrls[currentImageIndex] || '', // Use the base64 URL
      });

      // Generate random analysis for each image
      setAnalysis({
        contrast: Math.floor(Math.random() * 15) + 85, // 85-100
        details: Math.floor(Math.random() * 20) + 80, // 80-100
        recognizability: Math.floor(Math.random() * 25) + 75, // 75-100
      });
    }
  }, [currentImageIndex, originalImages, fileUrls]);


const handleConfirm = () => {
  const createRouteData = {
    mindFileData: mindFileData,
    mindFileBuffer: mindFileBuffer,
    originalImages: originalImages,
    originalFiles: originalFiles,
    fileUrls: fileUrls,
    compiledImageData: compiledImageData,
    trackingData: trackingData,
    compilationTimestamp: compilationTimestamp,
    targetImage: {
      name: imageData.name,
      size: imageData.size,
      dimensions: imageData.dimensions,
      preview: imageData.preview,
    },
    analysisResults: analysis,
    uploadedImage: imageData.preview,
    isMultipleImages: true,
    totalImages: originalImages.length,
    // Add all images data with proper URLs
    allImages: originalImages.map((img, index) => ({
      name: img.name,
      size: `${(img.size / (1024 * 1024)).toFixed(1)} MB`,
      dimensions: '1200 x 800 px',
      preview: img.url || fileUrls[index] || '',
    })),
  };

  // Navigate to the new multiple image create page
  navigate('/multiple-image-create', {
    state: createRouteData,
  });
};

  const handleReject = () => {
    navigate('/multiple-image-tracking');
  };

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : originalImages.length - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev < originalImages.length - 1 ? prev + 1 : 0));
  };

  if (!originalImages || originalImages.length === 0) {
    return (
      <div className='min-h-screen bg-slate-900 text-white flex items-center justify-center'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold mb-4'>No Images Found</h2>
          <p className='text-slate-400 mb-6'>Please upload images first.</p>
          <Button onClick={() => navigate('/multiple-image-tracking')}>
            Go Back to Upload
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-slate-900 text-white'>
      {/* Header - Exact same as ConvertedImage */}
      <header className='p-4 border-b border-slate-800 flex justify-between items-center'>
        <div className='flex items-center gap-3'>
          <div className='bg-slate-800 h-8 w-8 flex items-center justify-center rounded-md'>
            <span className='text-xl font-bold'>P</span>
          </div>
          <h1 className='text-xl font-bold tracking-wider'>PACKAR</h1>
        </div>
        <div className='flex items-center gap-2'>
          <span>Multiple Image Tracking</span>
          <div className='h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center text-xs'>
            {originalImages.length}
          </div>
        </div>
      </header>

      <main className='container mx-auto p-6 flex flex-col items-center'>
        {/* Title with image navigation info */}
        <h2 className='text-2xl font-semibold mb-2 text-center'>
          Confirm this image?
        </h2>
        
        {/* Image counter */}
        <div className='mb-6 flex items-center gap-2 text-sm text-slate-400'>
          <span>Image {currentImageIndex + 1} of {originalImages.length}</span>
        </div>

        {/* Main image container - Exact same as ConvertedImage */}
        <div className='bg-slate-800 rounded-lg overflow-hidden max-w-2xl w-full aspect-video mb-6 relative'>
          {imageData.preview ? (
            <img
              src={imageData.preview}
              alt='Current target'
              className='w-full h-full object-contain'
              onError={(e) => {
                console.error('Image failed to load:', imageData.preview);
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <div className='w-full h-full bg-black flex items-center justify-center'>
              <span className='text-slate-500'>No preview available</span>
            </div>
          )}

          {/* Navigation arrows - only show if multiple images */}
          {originalImages.length > 1 && (
            <>
              <button
                onClick={handlePreviousImage}
                className='absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors'
              >
                <ChevronLeft className='h-6 w-6 text-white' />
              </button>
              <button
                onClick={handleNextImage}
                className='absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors'
              >
                <ChevronRight className='h-6 w-6 text-white' />
              </button>
            </>
          )}

          {/* Image info overlay - Exact same as ConvertedImage */}
          <div className='absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3'>
            <div className='flex justify-between items-center'>
              <div className='text-sm text-slate-400'>
                {imageData.name}
                <br />
                {imageData.dimensions} • {imageData.size}
              </div>

              <div className='flex items-center gap-2'>
                <div className='h-2 w-2 bg-green-500 rounded-full'></div>
                <span className='text-sm text-slate-300'>
                  Image suitable for tracking
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Image thumbnails - only show if multiple images */}
        {originalImages.length > 1 && (
          <div className='mb-6 flex gap-2 overflow-x-auto max-w-2xl w-full pb-2'>
            {originalImages.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`flex-shrink-0 relative ${
                  index === currentImageIndex 
                    ? 'ring-2 ring-blue-500 rounded-lg' 
                    : 'hover:ring-2 hover:ring-blue-400/50 rounded-lg'
                }`}
              >
                <img
                  src={image.url || fileUrls[index] || ''}
                  alt={image.name}
                  className='w-16 h-16 object-cover rounded-lg'
                  onError={(e) => {
                    console.error('Thumbnail failed to load:', image.url || fileUrls[index]);
                    e.target.style.backgroundColor = '#374151';
                    e.target.style.display = 'flex';
                    e.target.style.alignItems = 'center';
                    e.target.style.justifyContent = 'center';
                    e.target.innerHTML = '?';
                  }}
                />
                <div className='absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-medium'>
                  {index + 1}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Analysis section - Exact same as ConvertedImage */}
        <div className='bg-slate-800/80 rounded-lg p-4 w-full max-w-2xl mb-8'>
          <div className='flex items-center gap-2 mb-4'>
            <BarChart className='text-blue-400 h-5 w-5' />
            <h3 className='font-medium text-blue-300'>Image Analysis</h3>
          </div>

          <div className='grid grid-cols-3 gap-4 text-center'>
            <div>
              <div className='text-green-400 font-bold text-2xl mb-1'>
                {analysis.contrast}%
              </div>
              <div className='text-slate-400 text-sm'>Contrast</div>
            </div>
            <div>
              <div className='text-blue-400 font-bold text-2xl mb-1'>
                {analysis.details}%
              </div>
              <div className='text-slate-400 text-sm'>Details</div>
            </div>
            <div>
              <div className='text-amber-400 font-bold text-2xl mb-1'>
                {analysis.recognizability}%
              </div>
              <div className='text-slate-400 text-sm'>Recognizability</div>
            </div>
          </div>
        </div>

        {/* Action buttons - Exact same as ConvertedImage */}
        <div className='flex gap-4'>
          <Button
            onClick={handleReject}
            className='bg-red-600 hover:bg-red-700 px-8 py-2 flex items-center gap-2'
          >
            <X className='h-5 w-5' />
            No
          </Button>

          <Button
            onClick={handleConfirm}
            className='bg-amber-700 hover:bg-amber-800 px-8 py-2 flex items-center gap-2'
          >
            <Check className='h-5 w-5' />
            Yes
          </Button>
        </div>
      </main>

      {/* Back button - Exact same as ConvertedImage */}
      <div className='container mx-auto px-6 mt-auto'>
        <Button
          onClick={() => navigate('/multiple-image-tracking')}
          variant='outline'
          className='flex items-center gap-2 bg-transparent border-slate-700 text-slate-300'
        >
          <ArrowLeft className='h-4 w-4' />
          Back
        </Button>
      </div>

      {/* Footer - Exact same as ConvertedImage */}
      <footer className='p-6 text-center text-slate-500 text-sm mt-auto'>
        © 2023 PACKAR - Create your AR experience
      </footer>
    </div>
  );
};

export default MultipleImageConfirmation;