import React, { useState } from 'react';
import { ZoomIn } from 'lucide-react';

interface ImageMagnifierProps {
  src: string;
  alt: string;
  hasOffer?: boolean;
}

const ImageMagnifier: React.FC<ImageMagnifierProps> = ({ src, alt, hasOffer }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseEnter = () => {
    if (window.innerWidth < 768) return; // Disabled on mobile
    setShowMagnifier(true);
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    if (window.innerWidth < 768) return;
    setShowMagnifier(false);
    setIsHovering(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.innerWidth < 768) return;
    const { top, left, width, height } = e.currentTarget.getBoundingClientRect();
    
    // Calculate mouse position as a percentage for transform-origin
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    
    setPosition({ x, y });
  };

  return (
    <div 
      className="relative flex-1 w-full max-w-[460px] aspect-[4/5] rounded-xl overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.08)] bg-[#FAF8F5] md:cursor-zoom-in group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      <img 
        src={src} 
        alt={alt} 
        className="w-full h-full object-cover mix-blend-multiply block"
        style={{
          transformOrigin: `${position.x}% ${position.y}%`,
          transform: showMagnifier ? 'scale(2.2)' : 'scale(1)',
          transition: showMagnifier ? 'transform 0.1s ease-out' : 'transform 0.4s ease-out',
          willChange: 'transform'
        }}
      />
      
      {/* Zoom Icon Hint (disappears on hover, hidden on mobile) */}
      <div className={`hidden md:block absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm p-2 rounded-full text-charcoal/60 shadow-sm pointer-events-none transition-opacity duration-300 ${isHovering ? 'opacity-0' : 'opacity-100'}`}>
        <ZoomIn size={20} strokeWidth={1.5} />
      </div>

      {/* Offer Badge Overlay */}
      {hasOffer && (
        <div className="absolute top-4 right-4 bg-[#C4A47C] text-white text-[11px] font-bold tracking-[0.2em] px-3 py-1.5 uppercase rounded-sm z-10 shadow-sm backdrop-blur-sm bg-opacity-90 pointer-events-none">
          20% OFF
        </div>
      )}
    </div>
  );
};

export default ImageMagnifier;
