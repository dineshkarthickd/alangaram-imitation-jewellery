import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-cream-dark pt-14 pb-8 px-8 border-t border-charcoal/5">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12 mb-12">
        
        {/* LEFT: SOCIAL LINKS */}
        <div>
          <h4 className="font-serif text-[1.35rem] text-charcoal mb-5">Connect With Us</h4>
          <div className="flex space-x-6 text-charcoal/70 items-center">
            <a href="https://www.instagram.com/alangaramimitationjewellery" target="_blank" rel="noopener noreferrer" className="hover:text-charcoal hover:-translate-y-1 transition-all duration-300" aria-label="Instagram">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
              </svg>
            </a>
            <a href="http://www.youtube.com/@Alangaramimitationjewellery" target="_blank" rel="noopener noreferrer" className="hover:text-charcoal hover:-translate-y-1 transition-all duration-300" aria-label="YouTube">
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
                <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>
              </svg>
            </a>
            <a href="https://wa.me/917010857596" target="_blank" rel="noopener noreferrer" className="hover:text-charcoal hover:-translate-y-1 transition-all duration-300" aria-label="WhatsApp">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-[26px] h-[26px]" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </a>
          </div>
          
          <div className="mt-5 flex items-center gap-3 text-charcoal/80">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="16" x="2" y="4" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
            <span className="text-[14.5px] font-sans tracking-wide select-all">alangaramimitationjewellery@gmail.com</span>
          </div>
        </div>

        {/* CENTER: QUICK LINKS */}
        <div className="w-full md:w-auto md:ml-12">
          <h4 className="font-serif text-[1.35rem] text-charcoal mb-5">Quick Links</h4>
          <div className="flex flex-col space-y-4 text-charcoal/70">
            <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-charcoal transition-colors text-[15px] font-medium tracking-wide">Home</Link>
            <Link to="/products" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-charcoal transition-colors text-[15px] font-medium tracking-wide">Collections</Link>
            <Link to="/cart" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-charcoal transition-colors text-[15px] font-medium tracking-wide">Shopping Cart</Link>
          </div>
        </div>

        {/* RIGHT: BRAND STORY */}
        <div className="w-full md:w-auto md:max-w-[350px]">
          <h4 className="font-serif text-[1.35rem] text-charcoal mb-4">Our Story</h4>
          <p className="text-[14px] text-charcoal/80 leading-relaxed font-light">
            Crafting timeless imitation jewellery that blends deep-rooted tradition with modern elegance. Every piece is curated to add a touch of grace to your everyday moments. Made to be cherished.
          </p>
        </div>

      </div>
      
      {/* COPYRIGHT */}
      <div className="text-center text-[13px] tracking-wide text-charcoal/80 pt-8 border-t border-charcoal/10">
        © {new Date().getFullYear()} Alangaram Imitation Jewellery. All rights reserved. <br className="md:hidden" />
        <span className="hidden md:inline"> | </span>
        Developed by <a href="https://portfolio-dinesh-karthick.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-charcoal hover:text-black transition-colors underline decoration-charcoal/40 underline-offset-2 font-medium">Dinesh Karthick Durgadas</a>
      </div>
    </footer>
  );
};

export default Footer;
