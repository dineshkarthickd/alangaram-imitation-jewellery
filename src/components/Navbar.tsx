import { useState, useEffect } from 'react';
import { User, ShoppingBag, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { cartCount } = useCart();

  // Listen for scroll events to trigger the sticky navbar effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  return (
    <>
      <nav 
        className={`fixed z-50 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] left-1/2 -translate-x-1/2 rounded-[2rem] border ${
          isScrolled 
            ? 'top-4 bg-cream/95 backdrop-blur-md border-charcoal/10 shadow-lg py-1.5 md:py-2 w-[92%] max-w-[800px]' 
            : 'top-6 md:top-8 bg-white/30 backdrop-blur-lg border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.05)] py-2 md:py-2.5 w-[95%] max-w-[1400px]'
        }`}
      >
        <div className="flex items-center justify-between px-6 md:px-12">
          
          {/* MOBILE HAMBURGER BUTTON */}
          <div className="md:hidden flex-1 flex justify-start">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-charcoal hover:opacity-70 transition-opacity"
            >
              <Menu size={24} strokeWidth={1.2} />
            </button>
          </div>

          {/* DESKTOP: LEFT SIDE LINKS */}
          <div className="hidden md:flex flex-1 justify-start items-center space-x-8 lg:space-x-10 text-[15px] lg:text-[16px] font-serif tracking-wide font-medium text-charcoal">
            <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:opacity-70 transition-opacity">Home</Link>
            
            <div className="relative group">
              <Link to="/products" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:opacity-70 transition-opacity pb-4">
                Product
              </Link>
              <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                <div className="bg-white/95 backdrop-blur-md shadow-sm border border-gold-light/30 flex flex-col min-w-[220px] py-3 rounded-sm">
                  <Link to="/products?category=forming" className="px-6 py-2.5 hover:bg-cream transition-colors text-sm text-charcoal/80 hover:text-charcoal">
                    Forming Jewellery
                  </Link>
                  <Link to="/products?category=imitation" className="px-6 py-2.5 hover:bg-cream transition-colors text-sm text-charcoal/80 hover:text-charcoal">
                    Imitation Jewellery
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* CENTER: THE ROYAL LOGO */}
          <div className="flex-[2] md:flex-1 flex justify-center">
            <Link to="/" className="flex flex-col items-center justify-center">
              <span className={`font-serif text-charcoal leading-none tracking-tight transition-all duration-500 ${isScrolled ? 'text-lg lg:text-xl' : 'text-xl lg:text-3xl'}`}>
                Alangaram
              </span>
              <span className={`font-sans tracking-[0.2em] font-medium uppercase text-charcoal transition-all duration-500 ${isScrolled ? 'text-[7px] lg:text-[8px] mt-1' : 'text-[8px] lg:text-[9px] mt-1.5'}`}>
                Imitation Jewellery
              </span>
            </Link>
          </div>

          {/* RIGHT SIDE: SECONDARY LINKS & ICONS */}
          <div className="flex-1 flex justify-end items-center space-x-4 md:space-x-6 lg:space-x-8 text-[15px] lg:text-[16px] font-serif tracking-wide font-medium text-charcoal">
            
            <div className="flex items-center space-x-5 lg:space-x-6 text-charcoal">
              <button className="hidden sm:block hover:opacity-70 transition-opacity"><User size={19} strokeWidth={1.75} /></button>
              <Link to="/cart" className="relative hover:opacity-70 transition-opacity flex items-center">
                <ShoppingBag size={19} strokeWidth={1.75} />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-charcoal text-white text-[9px] font-bold w-[16px] h-[16px] rounded-full flex items-center justify-center pointer-events-none">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

        </div>
      </nav>

      {/* MOBILE UNIQUE SLIDE-OUT MENU */}
      
      {/* 1. Dark Blur Overlay (Click to close) */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] transition-opacity duration-500 md:hidden ${
          isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* 2. The Glass Sidebar Panel */}
      <div 
        className={`fixed top-0 left-0 h-full w-[85%] max-w-[360px] bg-cream shadow-2xl z-[100] flex flex-col md:hidden transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header with Logo */}
        <div className="flex justify-between items-center p-6 border-b border-charcoal/10">
          <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex flex-col items-start">
            <span className="font-serif text-2xl text-charcoal leading-none tracking-tight">Alangaram</span>
            <span className="font-sans text-[8px] tracking-[0.2em] uppercase text-charcoal/70 mt-1">Imitation Jewellery</span>
          </Link>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-charcoal hover:opacity-50 transition-opacity p-2 -mr-2"
          >
            <X size={22} strokeWidth={1.2} />
          </button>
        </div>
        
        {/* Sidebar Links & Accordions */}
        <div className="flex flex-col flex-grow overflow-y-auto px-8 py-10 space-y-8">
          <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-serif text-charcoal hover:text-gold transition-colors">
            Home
          </Link>
          
          <div className="flex flex-col space-y-5">
            <Link to="/products" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-serif text-charcoal hover:text-gold transition-colors">
              Products
            </Link>
            <div className="flex flex-col pl-4 space-y-4 font-sans text-[15px] text-charcoal/70">
              <Link to="/products?category=forming" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-charcoal flex items-center gap-3 transition-colors">
                <div className="w-1 h-1 rounded-full bg-gold"></div> Forming Jewellery
              </Link>
              <Link to="/products?category=imitation" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-charcoal flex items-center gap-3 transition-colors">
                <div className="w-1 h-1 rounded-full bg-gold"></div> Imitation Jewellery
              </Link>
            </div>
          </div>

        </div>

        {/* Sidebar Footer Accent */}
        <div className="p-8 bg-cream-dark mt-auto border-t border-charcoal/5">
          <p className="text-[10px] uppercase tracking-widest font-sans text-charcoal/50 mb-2">Customer Care</p>
          <a href="mailto:support@alangaram.com" className="text-sm font-serif text-charcoal">support@alangaram.com</a>
        </div>
      </div>
    </>
  );
};

export default Navbar;
