import React, { useState, useEffect } from 'react';
import { ArrowUpRight, Loader2, Heart } from 'lucide-react';
import heroImg from '../assets/hero.png';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination, Autoplay } from 'swiper/modules';
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';

const Home = () => {
  const [bannerText, setBannerText] = useState('20% OFFER GRAB YOUR OFFERS SOON !!');
  const [bannerDesign, setBannerDesign] = useState<1 | 2 | 3 | 4>(1);
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'banner'));
        if (docSnap.exists()) {
          if (docSnap.data().text) setBannerText(docSnap.data().text);
          if (docSnap.data().design) setBannerDesign(docSnap.data().design);
        }
      } catch (error) {
        console.error('Failed to fetch banner:', error);
      }
    };
    fetchBanner();
  }, []);

  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      setLoadingFeatured(true);
      try {
        const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const loaded = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).slice(0, 10);
        setFeaturedProducts(loaded);
      } catch (error) {
        console.error("Failed to fetch featured products:", error);
      } finally {
        setLoadingFeatured(false);
      }
    };
    fetchFeatured();
  }, []);

  const getBannerDesignClasses = (design: 1 | 2 | 3 | 4) => {
    switch (design) {
      case 1: return "bg-[#2F2C29] text-[#C4A47C] shadow-[inset_0_2px_15px_rgba(0,0,0,0.3)]";
      case 2: return "bg-[#C4A47C] text-white shadow-sm";
      case 3: return "bg-[#F0EBE1] text-[#3F3A36] border-y border-[#C4A47C]/40";
      case 4: return "bg-transparent text-[#3F3A36] border-y border-[#3F3A36]/20";
      default: return "bg-[#2F2C29] text-[#C4A47C] shadow-[inset_0_2px_15px_rgba(0,0,0,0.3)]";
    }
  };

  return (
    <div className="w-full max-w-[100vw] min-w-0 flex flex-col overflow-x-hidden">
      {/* HERO SECTION */}
      <header className="relative w-full h-[75vh] lg:h-[80vh] overflow-hidden flex items-center justify-start">
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImg})` }}
        />
        
        {/* Dark gradient from left for all screens so text is readable over the bright window */}
        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-black/60 via-black/20 to-transparent" />

        <div className="relative z-10 flex flex-col items-start text-left w-full mt-24 px-6 md:px-20 lg:px-32 max-w-[850px]">
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-serif text-[#FDFBF7] leading-snug md:leading-[1.2] mb-5 md:mb-8 drop-shadow-md pr-4">
            The <span className="italic font-light">subtle</span> art of adornment. Timeless pieces, made to be cherished.
          </h1>
          <Link to="/products" className="btn-luxury btn-luxury-dark bg-[#FAF8F5]/80 backdrop-blur-md px-6 py-2.5 md:px-10 md:py-4 w-auto group text-xs md:text-base">
            Discover the Collection
            <ArrowUpRight size={14} className="md:w-4 md:h-4 transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:translate-x-1 group-hover:-translate-y-1" />
          </Link>
        </div>
      </header>

      {/* PROMO MARQUEE */}
      <div className={`w-full py-2.5 md:py-3.5 overflow-hidden flex whitespace-nowrap transition-colors duration-500 ${getBannerDesignClasses(bannerDesign)}`}>
        <div className="animate-marquee flex gap-12 md:gap-16 text-[11px] md:text-[13px] tracking-[0.2em] md:tracking-[0.25em] font-medium uppercase items-center opacity-90">
          {[...Array(10)].map((_, i) => (
            <React.Fragment key={i}>
              <span>{bannerText}</span>
              <span className="text-current opacity-70 text-lg leading-none">✧</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* FEATURED PIECES */}
      <section className="pt-8 pb-4 md:pt-12 md:pb-8 px-4 md:px-8 w-full max-w-[100vw] md:max-w-7xl mx-auto min-w-0 overflow-hidden">
        <div className="text-center mb-5 md:mb-8 min-w-0">
          <p className="text-[9px] md:text-sm tracking-widest text-charcoal/60 uppercase mb-1 md:mb-2">Featured Pieces</p>
          <h2 className="text-lg md:text-4xl font-serif text-charcoal">Adorn yourself with quiet beauty.</h2>
        </div>

        <div className="w-full max-w-5xl mx-auto overflow-hidden pb-0 md:pb-2 min-h-0 md:min-h-[400px] min-w-0">
          <style>{`
            @media (max-width: 768px) {
              .hide-mobile-pagination .swiper-pagination {
                display: none !important;
              }
            }
          `}</style>
          {loadingFeatured ? (
            <div className="flex justify-center items-center h-[250px] md:h-[350px]">
               <Loader2 className="w-8 h-8 md:w-10 md:h-10 animate-spin text-[#C4A47C]" />
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="flex justify-center items-center h-[250px] md:h-[350px] text-charcoal/50 text-sm">
               Check back soon for new arrivals.
            </div>
          ) : (
            <Swiper
              effect={'coverflow'}
              grabCursor={true}
              centeredSlides={true}
              slidesPerView={'auto'}
              loop={featuredProducts.length > 2}
              autoplay={{ delay: 3500, disableOnInteraction: false }}
              coverflowEffect={{ rotate: 15, stretch: 0, depth: 150, modifier: 1.2, slideShadows: false }}
              pagination={{ clickable: true }}
              modules={[EffectCoverflow, Pagination, Autoplay]}
              className="w-full pt-4 pb-0 md:pt-8 md:pb-12 px-2 md:px-4 hide-mobile-pagination"
            >
              {featuredProducts.map((item) => {
                const hasStock = item.stock > 0;
                return (
                <SwiperSlide key={item.id} className="!w-[160px] md:!w-[280px]">
                  <Link to={`/product/${item.id}`} className="group cursor-pointer block pb-4 md:pb-8">
                    <div className="relative aspect-[3/4] overflow-hidden bg-[#FAF8F5] rounded-lg md:rounded-xl shadow-[0_10px_20px_rgba(0,0,0,0.08)] md:shadow-[0_15px_30px_rgba(0,0,0,0.1)]">
                      {/* Main Image */}
                      <img 
                        src={item.images[0]} 
                        alt={item.name} 
                        className={`absolute inset-0 w-full h-full object-cover md:mix-blend-multiply transition-all duration-700 ${item.images.length > 1 ? 'group-hover:opacity-0' : 'group-hover:scale-105'}`}
                        loading="lazy"
                      />
                      {/* Model Image */}
                      {item.images.length > 1 && (
                        <img 
                          src={item.images[1]} 
                          alt={`${item.name} worn`} 
                          className="absolute inset-0 w-full h-full object-cover md:mix-blend-multiply opacity-0 transition-all duration-700 group-hover:opacity-100 group-hover:scale-105"
                          loading="lazy"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                      
                      {/* Wishlist Button */}
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          if (isInWishlist(item.id)) {
                            removeFromWishlist(item.id);
                          } else {
                            addToWishlist({
                              id: item.id,
                              name: item.name,
                              price: `₹ ${item.finalPrice}`,
                              image: item.images[0],
                              basePrice: `₹ ${item.basePrice}`,
                              hasOffer: item.hasOffer,
                              offerPercentage: item.offerPercentage,
                              stock: item.stock
                            });
                          }
                        }}
                        className="absolute top-3 left-3 bg-white/80 backdrop-blur-md p-1.5 md:p-2 rounded-full text-charcoal/60 hover:text-red-500 hover:bg-white transition-all shadow-sm z-20"
                        aria-label="Toggle wishlist"
                      >
                        <Heart size={16} className={isInWishlist(item.id) ? "fill-red-500 text-red-500" : ""} />
                      </button>

                      <div className="absolute top-4 right-4 flex flex-col gap-2 items-end z-10 pointer-events-none">
                        {!hasStock && (
                          <div className="bg-red-900/90 text-white text-[10px] font-bold tracking-[0.2em] px-2.5 py-1 uppercase rounded-sm shadow-sm backdrop-blur-sm">
                            OUT OF STOCK
                          </div>
                        )}
                        {hasStock && item.hasOffer && (
                          <div className="bg-[#C4A47C] text-white text-[10px] font-bold tracking-[0.2em] px-2.5 py-1 uppercase rounded-sm shadow-sm backdrop-blur-sm">
                            {item.offerPercentage}% OFF
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </SwiperSlide>
                );
              })}
            </Swiper>
          )}
        </div>
        
        <div className="mt-0 md:mt-2 text-center pb-2">
          <Link to="/products" className="inline-block border-b border-charcoal/30 pb-1 text-charcoal hover:border-charcoal transition-colors uppercase tracking-widest text-[11px] md:text-[13px] font-medium">
            View All Pieces
          </Link>
        </div>
      </section>

      {/* EDITORIAL SECTION */}
      <section className="py-12 md:py-24 px-6 md:px-8 relative bg-white/40 backdrop-blur-md border-t border-white/60 shadow-[0_-10px_40px_rgba(0,0,0,0.02)] w-full min-w-0 overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-8 md:gap-16 w-full min-w-0">
          <div className="w-full md:w-1/2 aspect-[4/3] rounded-xl overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.08)] group min-w-0">
            <img 
              src="/Mock-Images/Stories behind the shine.png" 
              alt="Stories behind the shine" 
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              loading="lazy"
            />
          </div>
          <div className="w-full md:w-1/2 mt-4 md:mt-0 text-center md:text-left">
            <h2 className="text-2xl md:text-4xl font-serif text-charcoal mb-3 md:mb-6">Stories behind the shine</h2>
            <p className="text-[13px] md:text-base text-charcoal/70 leading-relaxed font-light mb-6 md:mb-8">
              Craftsmanship from raw materials and matters the professional of all entity and crowning his quality to and animate thresher to smooth our own craftsmanship.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
