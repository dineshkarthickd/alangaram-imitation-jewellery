import { useState, useEffect } from 'react';
import { User, ShoppingBag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { cartCount } = useCart();
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
            ? 'top-4 bg-cream/95 backdrop-blur-md border-charcoal/10 shadow-lg py-2 w-[92%] max-w-[800px]' 
            : 'top-8 bg-white/30 backdrop-blur-lg border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.05)] py-2.5 w-[95%] max-w-[1400px]'
        }`}
      >
        <div className="flex items-center justify-between px-12">
          
          {/* DESKTOP: LEFT SIDE LINKS */}
          <div className="flex flex-1 justify-start items-center space-x-10 text-[16px] font-serif tracking-wide font-medium text-charcoal">
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
          <div className="flex-1 flex justify-center">
            <Link to="/" className="flex flex-col items-center justify-center">
              <span className={`font-serif text-charcoal leading-none tracking-tight transition-all duration-500 ${isScrolled ? 'text-xl' : 'text-3xl'}`}>
                Alangaram
              </span>
              <span className={`font-sans tracking-[0.2em] font-medium uppercase text-charcoal transition-all duration-500 ${isScrolled ? 'text-[8px] mt-1' : 'text-[9px] mt-1.5'}`}>
                Imitation Jewellery
              </span>
            </Link>
          </div>

          {/* RIGHT SIDE: SECONDARY LINKS & ICONS */}
          <div className="flex-1 flex justify-end items-center space-x-8 text-[16px] font-serif tracking-wide font-medium text-charcoal">
            
            <div className="flex items-center space-x-6 text-charcoal">
              {isAdmin && (
                <Link to="/admin" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-charcoal hover:opacity-70 transition-opacity whitespace-nowrap">
                  Admin Dashboard
                </Link>
              )}
              <div className="relative group flex items-center justify-center">
                {currentUser ? (
                  <>
                    <button onClick={handleLogout} className="block hover:opacity-70 transition-opacity">
                      {currentUser.photoURL ? (
                        <img src={currentUser.photoURL} alt="Profile" referrerPolicy="no-referrer" className="w-[22px] h-[22px] rounded-full object-cover border border-charcoal/20" />
                      ) : (
                        <div className="w-[22px] h-[22px] rounded-full bg-charcoal text-white flex items-center justify-center text-[10px] font-sans font-bold">
                          {currentUser.displayName?.charAt(0) || 'U'}
                        </div>
                      )}
                    </button>
                    {/* Hover Dropdown */}
                    <div className="absolute top-full right-1/2 translate-x-1/2 pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                      <div className="flex flex-col bg-white/95 backdrop-blur-md shadow-sm border border-gold-light/30 rounded-sm overflow-hidden">
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
                      <User size={19} strokeWidth={1.75} />
                    </button>
                    {/* Hover Dropdown */}
                    <div className="absolute top-full right-1/2 translate-x-1/2 pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                      <button onClick={signInWithGoogle} className="bg-white/95 backdrop-blur-md shadow-sm border border-gold-light/30 px-5 py-2 rounded-sm text-sm text-charcoal/80 hover:text-charcoal whitespace-nowrap">
                        Login
                      </button>
                    </div>
                  </>
                )}
              </div>
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

    </>
  );
};

export default Navbar;
