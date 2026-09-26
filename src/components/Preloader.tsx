import { useState, useEffect } from 'react';

const Preloader = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    // Lock scrolling while the preloader is on screen
    document.body.style.overflow = 'hidden';
    
    // Start the curtain rising animation after 2.5 seconds
    const animTimer = setTimeout(() => {
      setIsAnimatingOut(true);
    }, 2500);

    // Completely remove the component from the DOM after 3.5 seconds
    const removeTimer = setTimeout(() => {
      setIsLoading(false);
      document.body.style.overflow = 'unset';
    }, 3500);

    return () => {
      clearTimeout(animTimer);
      clearTimeout(removeTimer);
      document.body.style.overflow = 'unset';
    };
  }, []);

  if (!isLoading) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#201E1C] transition-transform duration-1000 ease-[cubic-bezier(0.76,0,0.24,1)] ${
        isAnimatingOut ? '-translate-y-full' : 'translate-y-0'
      }`}
    >
      {/* Brand Name with Reveal Animation */}
      <div className="overflow-hidden mb-3">
        <h1 className="text-4xl md:text-6xl font-serif text-[#E8DCCB] tracking-[0.15em] uppercase opacity-0 animate-preloader-text">
          Alangaram
        </h1>
      </div>
      
      {/* Subtext with Staggered Reveal Animation */}
      <div className="overflow-hidden">
        <p className="text-[10px] md:text-[12px] font-sans tracking-[0.4em] text-[#C4A47C] uppercase opacity-0 animate-preloader-subtext">
          Imitation Jewellery
        </p>
      </div>
      
      {/* Cinematic Golden Loading Line at the bottom */}
      <div className="absolute bottom-16 md:bottom-24 w-48 md:w-64 h-[1px] bg-white/10 overflow-hidden">
        <div className="h-full bg-[#C4A47C] animate-preloader-line origin-left" />
      </div>
    </div>
  );
};

export default Preloader;
