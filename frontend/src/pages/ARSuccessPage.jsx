import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  FaShare,
  FaDownload,
  FaEye,
  FaTh,
  FaCopy,
  FaCheck,
} from 'react-icons/fa';
import { QRCodeSVG } from 'qrcode.react';

const ARSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  // Get data from URL parameters
  const projectNumber = searchParams.get('projectNumber') || 'AR Experience';
  const experienceUrl = searchParams.get('experienceUrl') || '';
  
  // Create full URL for sharing
  const fullExperienceUrl = experienceUrl.startsWith('http') 
    ? experienceUrl 
    : `${window.location.origin}${experienceUrl}`;

  // Redirect if no URL is provided
  useEffect(() => {
    if (!experienceUrl) {
      navigate('/experiences');
    }
  }, [experienceUrl, navigate]);

  const handleCopy = () => {
    navigator.clipboard.writeText(fullExperienceUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReturnToDashboard = () => {
    navigate('/experiences');
  };

  const handleViewExperience = () => {
    window.open(fullExperienceUrl, '_blank');
  };

  if (!experienceUrl) {
    return (
      <div className='min-h-screen bg-slate-900 text-white flex items-center justify-center'>
        <div className='text-center'>
          <h2 className='text-xl font-semibold mb-4'>Invalid Experience URL</h2>
          <button 
            onClick={() => navigate('/experiences')}
            className='bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded'
          >
            Go to Experiences
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-slate-900 text-white font-sans flex flex-col px-6 md:px-10 py-5'>
      <main className='flex-1 flex flex-col items-center max-w-3xl mx-auto'>
        <div className='flex flex-col items-center mb-8'>
          <div className='bg-green-500 w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4'>
            ✓
          </div>
          <h1 className='text-2xl md:text-3xl font-bold mb-2'>
            AR Experience Successfully Created
          </h1>
          <p className='text-slate-300 text-center'>
            Your augmented reality experience "{projectNumber}" is ready to be shared!
          </p>
        </div>

        <div className='bg-white p-5 rounded-lg mb-4'>
          <QRCodeSVG value={fullExperienceUrl} size={200} />
        </div>

        <p className='text-slate-300 mb-8'>
          Scan the QR code to access the AR experience
        </p>

        <div className='w-full mb-8'>
          <label className='text-slate-300'>Experience URL:</label>
          <div className='flex mt-2'>
            <input
              type='text'
              value={fullExperienceUrl}
              readOnly
              className='flex-1 bg-slate-700 border-none py-3 px-4 text-white rounded-l-md focus:outline-none'
            />
            <button
              className='bg-slate-700 text-white px-5 rounded-r-md flex items-center gap-2 hover:bg-slate-600 transition-colors'
              onClick={handleCopy}
            >
              {copied ? <FaCheck /> : <FaCopy />} {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <div className='flex flex-wrap gap-4 justify-center'>
          <button 
            onClick={handleCopy}
            className='flex items-center gap-2 py-3 px-5 bg-slate-700 text-white rounded-md hover:bg-slate-600 transition-colors min-w-[140px] justify-center'
          >
            <FaShare /> Share
          </button>
          <button className='flex items-center gap-2 py-3 px-5 bg-slate-700 text-white rounded-md hover:bg-slate-600 transition-colors min-w-[140px] justify-center'>
            <FaDownload /> Download
          </button>
          <button 
            onClick={handleViewExperience}
            className='flex items-center gap-2 py-3 px-5 bg-amber-700 text-white rounded-md hover:bg-amber-600 transition-colors min-w-[140px] justify-center'
          >
            <FaEye /> View
          </button>
          <button 
            onClick={handleReturnToDashboard}
            className='flex items-center gap-2 py-3 px-5 bg-blue-700 text-white rounded-md hover:bg-blue-600 transition-colors min-w-[140px] justify-center'
          >
            <FaTh /> My Experiences
          </button>
        </div>
      </main>
    </div>
  );
};

export default ARSuccessPage;
