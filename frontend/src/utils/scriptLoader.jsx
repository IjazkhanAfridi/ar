import React, { useEffect, useState } from 'react';

const ScriptLoader = ({ src, children }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('ScriptLoader: Loading script:', src);
    console.log('Global objects available:', {
      MINDAR: !!window.MINDAR,
      MindARThree: !!window.MindARThree,
      THREE: !!window.THREE,
    });

    const existingScript = document.querySelector(`script[src="${src}"]`);

    if (existingScript) {
      if (window.MINDAR) {
        console.log('ScriptLoader: Script already loaded, MINDAR available');
        setLoaded(true);
      } else {
        console.log(
          'ScriptLoader: Script exists but MINDAR not ready, waiting...'
        );
        existingScript.addEventListener('load', () => {
          console.log('ScriptLoader: Existing script loaded');
          setLoaded(true);
        });
        existingScript.addEventListener('error', () => {
          console.error('ScriptLoader: Error loading existing script');
          setError(new Error(`Error loading script: ${src}`));
        });
      }
    } else {
      console.log('ScriptLoader: Creating new script element');
      const script = document.createElement('script');
      script.src = src;
      script.async = true;

      script.addEventListener('load', () => {
        console.log('ScriptLoader: New script loaded, checking for MINDAR...');
        setTimeout(() => {
          console.log('ScriptLoader: Post-load check:', {
            MINDAR: !!window.MINDAR,
            MindARThree: !!window.MindARThree,
            THREE: !!window.THREE,
          });
          if (window.MINDAR) {
            console.log('ScriptLoader: MINDAR found, marking as loaded');
            setLoaded(true);
          } else {
            console.error('ScriptLoader: MINDAR not found after script load');
            setError(
              new Error('MINDAR global object not found after script load')
            );
          }
        }, 100);
      });

      script.addEventListener('error', () => {
        console.error('ScriptLoader: Error loading new script');
        setError(new Error(`Error loading script: ${src}`));
      });

      document.body.appendChild(script);

      return () => {
        console.log('ScriptLoader: Cleaning up script');
        document.body.removeChild(script);
      };
    }
  }, [src]);

  if (error) {
    return (
      <div className='error-container'>
        <h3>Script Loading Error</h3>
        <p>{error.message}</p>
        <p>
          Please ensure that the mindar-image.js file is properly placed in the
          public folder and is accessible at {src}
        </p>
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className='loading-container'>
        <h3>Loading MindAR Library...</h3>
        <p>Please wait while we load the required resources</p>
      </div>
    );
  }

  return children;
};

export default ScriptLoader;
