import { useState, useEffect } from 'react';
import { User, ShoppingBag, Menu, X, Heart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { currentUser, signInWithGoogle, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    await signOut();
    setIsMobileMenuOpen(false);
    navigate('/');
    window.scrollTo(0, 0);
  };

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
        className={`fixed z-40 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] left-1/2 -translate-x-1/2 rounded-[2rem] border ${
          isScrolled 
            ? 'top-2 md:top-4 bg-cream/95 backdrop-blur-md border-charcoal/10 shadow-lg py-1 md:py-2 w-[92%] max-w-[800px]' 
            : 'top-4 md:top-8 bg-white/30 backdrop-blur-lg border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.05)] py-1.5 md:py-2.5 w-[95%] max-w-[1400px]'
        }`}
      >
        <div className="flex items-center justify-between px-4 md:px-12">
          
          {/* MOBILE HAMBURGER BUTTON */}
          <div className="md:hidden flex-1 flex justify-start">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-charcoal hover:opacity-70 transition-opacity p-1"
            >
              <Menu size={20} strokeWidth={1.2} />
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
            <Link to="/" className="flex items-center gap-2 md:gap-3">
              <img 
                src="/Mock-Images/Loader Image.png" 
                alt="Alangaram Logo" 
                className={`transition-all duration-500 object-contain ${isScrolled ? 'w-6 md:w-8' : 'w-7 md:w-10'}`} 
              />
              <div className="flex flex-col items-center justify-center">
                <span className={`font-serif text-charcoal leading-none tracking-tight transition-all duration-500 ${isScrolled ? 'text-lg md:text-xl' : 'text-xl md:text-3xl'}`}>
                  Alangaram
                </span>
                <span className={`font-sans tracking-[0.2em] font-medium uppercase text-charcoal transition-all duration-500 ${isScrolled ? 'text-[6px] md:text-[8px] mt-0.5 md:mt-1' : 'text-[6px] md:text-[9px] mt-1 md:mt-1.5'}`}>
                  Imitation Jewellery
                </span>
              </div>
            </Link>
          </div>

          {/* RIGHT SIDE: SECONDARY LINKS & ICONS */}
          <div className="flex-1 flex justify-end items-center space-x-4 md:space-x-6 lg:space-x-8 text-[15px] lg:text-[16px] font-serif tracking-wide font-medium text-charcoal">
            
            <div className="flex items-center space-x-3 md:space-x-6 text-charcoal">
              {isAdmin && (
                <Link to="/admin" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hidden sm:block text-charcoal hover:opacity-70 transition-opacity whitespace-nowrap">
                  Admin Dashboard
                </Link>
              )}
              <div className="relative group flex items-center justify-center">
                {currentUser ? (
                  <>
                    <button onClick={handleLogout} className="block hover:opacity-70 transition-opacity flex-shrink-0">
                      {currentUser.photoURL ? (
                        <img src={currentUser.photoURL} alt="Profile" referrerPolicy="no-referrer" className="w-[18px] h-[18px] md:w-[22px] md:h-[22px] min-w-[18px] md:min-w-[22px] rounded-full object-cover border border-charcoal/20 flex-shrink-0" />
                      ) : (
                        <div className="w-[18px] h-[18px] md:w-[22px] md:h-[22px] min-w-[18px] md:min-w-[22px] rounded-full bg-charcoal text-white flex items-center justify-center text-[8px] md:text-[10px] font-sans font-bold flex-shrink-0">
                          {currentUser.displayName?.charAt(0) || 'U'}
                        </div>
                      )}
                    </button>
                    {/* Hover Dropdown (Desktop Only) */}
                    <div className="absolute top-full right-1/2 translate-x-1/2 pt-4 opacity-0 invisible md:group-hover:opacity-100 md:group-hover:visible transition-all duration-300 z-50">
                      <div className="hidden md:flex flex-col bg-white/95 backdrop-blur-md shadow-sm border border-gold-light/30 rounded-sm overflow-hidden">
                        <Link to="/my-orders" className="px-5 py-2.5 text-sm text-charcoal/80 hover:text-charcoal hover:bg-cream transition-colors whitespace-nowrap border-b border-charcoal/5">
                          My Orders
                        </Link>
                        <button onClick={handleLogout} className="px-5 py-2.5 text-sm text-charcoal/80 hover:text-charcoal hover:bg-cream transition-colors whitespace-nowrap text-left">
                          Logout
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <button onClick={signInWithGoogle} className="block hover:opacity-70 transition-opacity">
                      <User strokeWidth={1.5} className="w-[16px] h-[16px] md:w-[19px] md:h-[19px]" />
                    </button>
                    {/* Hover Dropdown (Desktop Only) */}
                    <div className="absolute top-full right-1/2 translate-x-1/2 pt-4 opacity-0 invisible md:group-hover:opacity-100 md:group-hover:visible transition-all duration-300 z-50">
                      <button onClick={signInWithGoogle} className="hidden md:block bg-white/95 backdrop-blur-md shadow-sm border border-gold-light/30 px-5 py-2 rounded-sm text-sm text-charcoal/80 hover:text-charcoal whitespace-nowrap">
                        Login
                      </button>
                    </div>
                  </>
                )}
              </div>
              <Link to="/wishlist" className="relative hover:opacity-70 transition-opacity flex items-center flex-shrink-0">
                <Heart strokeWidth={1.5} className="w-[16px] h-[16px] md:w-[19px] md:h-[19px] flex-shrink-0" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 bg-charcoal text-white text-[7px] md:text-[9px] font-bold w-[12px] h-[12px] md:w-[16px] md:h-[16px] rounded-full flex items-center justify-center pointer-events-none flex-shrink-0">
                    {wishlistCount}
                  </span>
                )}
              </Link>
              <Link to="/cart" className="relative hover:opacity-70 transition-opacity flex items-center flex-shrink-0">
                <ShoppingBag strokeWidth={1.5} className="w-[16px] h-[16px] md:w-[19px] md:h-[19px] flex-shrink-0" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 bg-charcoal text-white text-[7px] md:text-[9px] font-bold w-[12px] h-[12px] md:w-[16px] md:h-[16px] rounded-full flex items-center justify-center pointer-events-none flex-shrink-0">
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
        className={`fixed top-0 left-0 h-full w-[75%] max-w-[300px] bg-cream shadow-2xl z-[100] flex flex-col md:hidden transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header with Logo */}
        <div className="flex justify-between items-center p-5 border-b border-charcoal/10">
          <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex flex-col items-start">
            <span className="font-serif text-xl text-charcoal leading-none tracking-tight">Alangaram</span>
            <span className="font-sans text-[7px] tracking-[0.2em] uppercase text-charcoal/70 mt-1">Imitation Jewellery</span>
          </Link>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-charcoal hover:opacity-50 transition-opacity p-2 -mr-2"
          >
            <X size={18} strokeWidth={1.2} />
          </button>
        </div>
        
        {/* Sidebar Links & Accordions */}
        <div className="flex flex-col flex-grow overflow-y-auto px-6 py-6 space-y-5">
          <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-serif text-charcoal hover:text-gold transition-colors">
            Home
          </Link>
          
          <div className="flex flex-col space-y-3">
            <Link to="/products" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-serif text-charcoal hover:text-gold transition-colors">
              Products
            </Link>
            <div className="flex flex-col pl-4 space-y-3 font-sans text-[13px] text-charcoal/70">
              <Link to="/products?category=forming" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-charcoal flex items-center gap-3 transition-colors">
                <div className="w-1 h-1 rounded-full bg-gold"></div> Forming Jewellery
              </Link>
              <Link to="/products?category=imitation" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-charcoal flex items-center gap-3 transition-colors">
                <div className="w-1 h-1 rounded-full bg-gold"></div> Imitation Jewellery
              </Link>
            </div>
          </div>

          {isAdmin && (
            <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-serif text-charcoal hover:text-gold transition-colors mt-2 block">
              Admin Dashboard
            </Link>
          )}

          {currentUser && (
            <Link to="/my-orders" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-serif text-charcoal hover:text-gold transition-colors mt-2 block">
              My Orders
            </Link>
          )}

          {/* Mobile Auth Button */}
          <div className="pt-5 mt-2 border-t border-charcoal/10">
            {currentUser ? (
              <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-3 mb-1">
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt="Profile" referrerPolicy="no-referrer" className="w-7 h-7 rounded-full border border-charcoal/20" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-charcoal text-white flex items-center justify-center text-xs font-bold">
                      {currentUser.displayName?.charAt(0) || 'U'}
                    </div>
                  )}
                  <span className="font-serif text-charcoal text-sm truncate">{currentUser.displayName}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="text-left text-lg font-serif text-charcoal hover:text-gold transition-colors block"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  signInWithGoogle();
                }}
                className="flex items-center space-x-3 text-lg font-serif text-charcoal hover:text-gold transition-colors w-full text-left"
              >
                <User size={18} strokeWidth={1.5} />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Sidebar Footer Accent */}
        <div className="p-6 bg-cream-dark mt-auto border-t border-charcoal/5">
          <p className="text-[9px] uppercase tracking-widest font-sans text-charcoal/50 mb-1.5">Customer Care</p>
          <span className="text-[11px] font-serif text-charcoal select-all">alangaramimitationjewellery@gmail.com</span>
        </div>
      </div>
    </>
  );
};

export default Navbar;
