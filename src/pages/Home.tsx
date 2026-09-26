import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import heroImg from '../assets/hero.png';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';

const Home = () => {
  return (
    <div className="opacity-0 animate-page-fade">
      {/* HERO SECTION */}
      <header className="relative w-full h-[75vh] lg:h-[80vh] overflow-hidden flex items-center justify-start">
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImg})` }}
        />
        
        {/* Dark gradient from left for all screens so text is readable over the bright window */}
        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-black/60 via-black/20 to-transparent" />

        <div className="relative z-10 flex flex-col items-start text-left w-full mt-12 px-8 md:mt-24 md:px-20 lg:px-32 max-w-[850px]">
          <h1 className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-serif text-[#FDFBF7] leading-[1.25] md:leading-[1.2] mb-6 md:mb-8 drop-shadow-md pr-4">
            The <span className="italic font-light">subtle</span> art of adornment. Timeless pieces, made to be cherished.
          </h1>
          <Link to="/products" className="btn-luxury btn-luxury-dark bg-[#FAF8F5]/80 backdrop-blur-md px-10 py-4 w-full md:w-auto group">
            Discover the Collection
            <ArrowUpRight size={16} className="transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:translate-x-1 group-hover:-translate-y-1" />
          </Link>
        </div>
      </header>

      {/* PROMO MARQUEE */}
      <div className="w-full bg-[#2F2C29] text-[#E8DCCB] py-3.5 overflow-hidden flex whitespace-nowrap shadow-[inset_0_2px_15px_rgba(0,0,0,0.3)]">
        <div className="animate-marquee flex gap-10 md:gap-16 text-[12px] md:text-[13px] tracking-[0.25em] font-medium uppercase items-center opacity-90">
          {[...Array(10)].map((_, i) => (
            <React.Fragment key={i}>
              <span>20% OFFER GRAB YOUR OFFERS SOON !!</span>
              <span className="text-[#C4A47C] text-lg leading-none">✧</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* FEATURED PIECES */}
      <section className="pt-12 pb-8 px-8 max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-sm tracking-widest text-charcoal/60 uppercase mb-2">Featured Pieces</p>
          <h2 className="text-3xl sm:text-4xl font-serif text-charcoal">Adorn yourself with quiet beauty.</h2>
        </div>

        <div className="w-full max-w-5xl mx-auto overflow-hidden pb-2">
          <Swiper
            effect={'coverflow'}
            grabCursor={true}
            centeredSlides={true}
            slidesPerView={'auto'}
            loop={true}
            autoplay={{
              delay: 3500,
              disableOnInteraction: false,
            }}
            coverflowEffect={{
              rotate: 15,
              stretch: 0,
              depth: 150,
              modifier: 1.2,
              slideShadows: false,
            }}
            pagination={{ clickable: true }}
            modules={[EffectCoverflow, Pagination, Autoplay]}
            className="w-full pt-8 pb-12 px-4"
          >
            {[
              { id: 1, name: "Classic Forming Necklace", price: "₹ 4,999", img: "/Mock-Images/01.png" },
              { id: 2, name: "Elegant Forming Bangles", price: "₹ 2,499", img: "/Mock-Images/02.png" },
              { id: 3, name: "Traditional Forming Jhumkas", price: "₹ 1,899", img: "/Mock-Images/03.png" },
              { id: 4, name: "Bridal Forming Set", price: "₹ 8,999", img: "/Mock-Images/04.png" },
              { id: 5, name: "Antique Forming Choker", price: "₹ 3,299", img: "/Mock-Images/05.png" },
              { id: 6, name: "Designer Imitation Set", price: "₹ 1,499", img: "/Mock-Images/06.png" },
              { id: 7, name: "Kundan Imitation Earrings", price: "₹ 899", img: "/Mock-Images/07.png" }
            ].map((item) => {
              const hasOffer = [1, 4, 7].includes(item.id);
              return (
              <SwiperSlide key={item.id} className="!w-[220px] md:!w-[280px]">
                <Link to={`/product/${item.id}`} className="group cursor-pointer block pb-8">
                  <div className="relative aspect-[3/4] overflow-hidden bg-[#FAF8F5] rounded-xl shadow-[0_10px_20px_rgba(0,0,0,0.1)] md:shadow-[0_15px_30px_rgba(0,0,0,0.1)]">
                    <img 
                      src={item.img} 
                      alt={item.name} 
                      className="w-full h-full object-cover mix-blend-multiply transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {hasOffer && (
                      <div className="absolute top-4 right-4 bg-[#C4A47C] text-white text-[10px] font-bold tracking-[0.2em] px-2.5 py-1 uppercase rounded-sm z-10 shadow-sm backdrop-blur-sm bg-opacity-90">
                        20% OFF
                      </div>
                    )}
                  </div>
                </Link>
              </SwiperSlide>
              );
            })}
          </Swiper>
        </div>
        
        <div className="mt-2 text-center pb-2">
          <Link to="/products" className="inline-block border-b border-charcoal/30 pb-1 text-charcoal hover:border-charcoal transition-colors uppercase tracking-widest text-[13px] font-medium">
            View All Pieces
          </Link>
        </div>
      </section>

      {/* EDITORIAL SECTION */}
      <section className="py-12 px-8 relative bg-white/40 backdrop-blur-md border-t border-white/60 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="w-full md:w-1/2 aspect-[4/3] rounded-xl overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.08)] group">
            <img 
              src="/Mock-Images/Stories behind the shine.png" 
              alt="Stories behind the shine" 
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              loading="lazy"
            />
          </div>
          <div className="w-full md:w-1/2">
            <h2 className="text-4xl font-serif text-charcoal mb-6">Stories behind the shine</h2>
            <p className="text-charcoal/70 leading-relaxed font-light mb-8">
              Craftsmanship from raw materials and matters the professional of all entity and crowning his quality to and animate thresher to smooth our own craftsmanship.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
