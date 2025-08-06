import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, X, Check, BarChart } from 'lucide-react';

export default function ConvertedImage() {
  const location = useLocation();
  const navigate = useNavigate();
  console.log('location: ', location?.state);

  const [imageData, setImageData] = useState({
    name:
      location?.state?.firstImageName ||
      localStorage.getItem('uploadedImageName') ||
      'target_image.jpg',
    size:
      location?.state?.firstImageSize ||
      localStorage.getItem('uploadedImageSize') ||
      '2.4 MB',
    dimensions:
      location?.state?.firstImageDimensions ||
      localStorage.getItem('uploadedImageDimensions') ||
      '1200 x 800 px',
    preview:
      location?.state?.previewImage ||
      localStorage.getItem('uploadedImagePreview') ||
      '',
  });

  const [analysis, setAnalysis] = useState({
    contrast: 92,
    details: 88,
    recognizability: 75,
  });

  const handleConfirm = () => {
    const createRouteData = {
      mindFileData: location?.state?.mindFileData,
      mindFileBuffer: location?.state?.mindFileBuffer,
      originalImages: location?.state?.originalImages || [],
      compiledImageData: location?.state?.compiledImageData || [],
      trackingData: location?.state?.trackingData || [],
      compilationTimestamp: location?.state?.compilationTimestamp,
      targetImage: {
        name: imageData.name,
        size: imageData.size,
        dimensions: imageData.dimensions,
        preview: imageData.preview,
      },
      analysisResults: analysis,
      uploadedImage:imageData.preview,
    };

    navigate('/create', {
      state: createRouteData,
    });
  };

  const handleReject = () => {
    navigate('/upload-image');
  };

  return (
    <div className='min-h-screen bg-slate-900 text-white'>
      <header className='p-4 border-b border-slate-800 flex justify-between items-center'>
        <div className='flex items-center gap-3'>
          <div className='bg-slate-800 h-8 w-8 flex items-center justify-center rounded-md'>
            <span className='text-xl font-bold'>P</span>
          </div>
          <h1 className='text-xl font-bold tracking-wider'>PACKAR</h1>
        </div>
        <div className='flex items-center gap-2'>
          <span>Image Tracking</span>
          <div className='h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center text-xs'>
            2
          </div>
        </div>
      </header>

      <main className='container mx-auto p-6 flex flex-col items-center'>
        <h2 className='text-2xl font-semibold mb-8 text-center'>
          Confirm this image?
        </h2>

        <div className='bg-slate-800 rounded-lg overflow-hidden max-w-2xl w-full aspect-video mb-6'>
          {imageData.preview ? (
            <img
              src={imageData.preview}
              alt='Uploaded target'
              className='w-full h-full object-contain'
            />
          ) : (
            <div className='w-full h-full bg-black flex items-center justify-center'>
              <span className='text-slate-500'>No preview available</span>
            </div>
          )}

          <div className='p-3 flex justify-between items-center'>
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

      <div className='container mx-auto px-6 mt-auto'>
        <Link to='/upload-image'>
          <Button
            variant='outline'
            className='flex items-center gap-2 bg-transparent border-slate-700 text-slate-300'
          >
            <ArrowLeft className='h-4 w-4' />
            Back
          </Button>
        </Link>
      </div>

      <footer className='p-6 text-center text-slate-500 text-sm mt-auto'>
        © 2023 PACKAR - Create your AR experience
      </footer>
    </div>
  );
}
