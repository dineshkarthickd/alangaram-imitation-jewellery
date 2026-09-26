import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';

// Temporary placeholder pages
const Cart = () => <div className="min-h-[80vh] flex items-center justify-center font-serif text-4xl text-charcoal opacity-0 animate-page-fade">Your Cart is Empty</div>;

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
};

function App() {
  // Initialize Smooth Scrolling globally
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen font-sans flex flex-col relative bg-gradient-to-br from-[#FCF1E6] via-[#FDFBF7] to-[#DFEEE8]">
        {/* Fixed Background Botanical Watermarks */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          {/* Top Right Branch */}
          <svg className="absolute -top-32 -right-32 w-[600px] h-[600px] text-[#A69075] opacity-[0.05] transform rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22S12 12 12 2M12 12C12 12 18 6 22 6C22 6 20 16 12 16M12 18C12 18 6 12 2 12C2 12 4 22 12 22M12 6C12 6 8 2 3 2C3 2 1 9 12 9"/>
          </svg>
          {/* Bottom Left Branch */}
          <svg className="absolute -bottom-48 -left-40 w-[800px] h-[800px] text-[#A69075] opacity-[0.05] transform -rotate-45" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22S12 12 12 2M12 12C12 12 18 6 22 6C22 6 20 16 12 16M12 18C12 18 6 12 2 12C2 12 4 22 12 22M12 6C12 6 8 2 3 2C3 2 1 9 12 9"/>
          </svg>
        </div>

        <div className="relative z-10 flex flex-col flex-grow">
          <Navbar />
          
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
            </Routes>
          </main>

        <Footer />
        <WhatsAppButton />
        </div>
      </div>
    </Router>
  );
}

export default App;
