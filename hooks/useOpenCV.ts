import { useState, useEffect } from 'react';

export const useOpenCV = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if opencv is already attached to window
    if ((window as any).cv && (window as any).cv.Mat) {
      setIsLoaded(true);
      return;
    }

    // If not, set up a listener or interval to check for it
    const interval = setInterval(() => {
      if ((window as any).cv && (window as any).cv.Mat) {
        setIsLoaded(true);
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return isLoaded;
};