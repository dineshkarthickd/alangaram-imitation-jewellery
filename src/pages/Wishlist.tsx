import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { Trash2, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

const Wishlist = () => {
  const { wishlistItems, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  if (wishlistItems.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center pt-16 md:pt-24 px-4 md:px-8">
        <div className="mb-4 md:mb-6">
          <img 
            src="/Mock-Images/Loader Image.png" 
            alt="Empty Wishlist Logo" 
            className="w-20 md:w-28 h-auto object-contain opacity-100"
          />
        </div>
        <h1 className="font-serif text-2xl md:text-4xl text-charcoal mb-3 md:mb-4">Your Wishlist is Empty</h1>
        <p className="text-charcoal/60 mb-6 md:mb-8 max-w-md text-center text-[12px] md:text-base">Save your favorite pieces here to review them later.</p>
        <Link to="/products" className="btn-luxury btn-luxury-solid px-8 py-3 md:px-10 md:py-4 text-[10px] md:text-sm">
          Explore Collections
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-24 md:pt-32 pb-16 md:pb-24 px-4 md:px-12 max-w-[100vw] md:max-w-7xl overflow-x-hidden mx-auto min-h-screen w-full min-w-0">
      <h1 className="text-2xl md:text-4xl font-serif text-charcoal mb-6 md:mb-10 border-b border-charcoal/10 pb-4 md:pb-6">My Wishlist</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-8 md:gap-y-16">
        {wishlistItems.map((item) => (
          <div key={item.id} className="group flex flex-col">
            <div className="relative aspect-[3/4] overflow-hidden bg-[#FAF8F5] mb-4 md:mb-6 rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
              <Link to={`/product/${item.id}`}>
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="absolute inset-0 w-full h-full object-cover md:mix-blend-multiply transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
              </Link>
              
              {/* Badges container */}
              <div className="absolute top-3 right-3 flex flex-col gap-2 items-end z-10 pointer-events-none">
                {(!item.stock || item.stock === 0) && (
                  <div className="bg-red-900/90 text-white text-[9px] font-bold tracking-[0.2em] px-2 py-1 uppercase rounded-sm shadow-sm backdrop-blur-sm">
                    OUT OF STOCK
                  </div>
                )}
                {(item.stock || 0) > 0 && item.hasOffer && (
                  <div className="bg-[#C4A47C] text-white text-[9px] font-bold tracking-[0.2em] px-2 py-1 uppercase rounded-sm shadow-sm backdrop-blur-sm">
                    {item.offerPercentage}% OFF
                  </div>
                )}
              </div>
              
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  removeFromWishlist(item.id);
                }}
                className="absolute top-3 left-3 bg-white/80 backdrop-blur-md p-1.5 md:p-2 rounded-full text-charcoal/60 hover:text-red-500 hover:bg-white transition-all shadow-sm z-20"
                aria-label="Remove from wishlist"
              >
                <Trash2 size={16} />
              </button>

              {/* Quick Add Button */}
              {((item.stock || 0) > 0) && (
                <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 translate-y-0 opacity-100 md:translate-y-4 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 transition-all duration-500 w-[90%] md:w-[85%] z-20">
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      addToCart({
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        image: item.image
                      });
                    }} 
                    className="btn-luxury btn-luxury-dark w-full bg-white/90 backdrop-blur-md py-2 md:py-3.5 text-[9px] md:text-xs shadow-md flex items-center justify-center gap-2"
                  >
                    <ShoppingBag size={12} className="md:w-4 md:h-4" /> ADD TO CART
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex flex-col items-center text-center px-1 md:px-0 mt-auto">
              <Link to={`/product/${item.id}`}>
                <h3 className="font-serif text-[14px] md:text-lg text-charcoal mb-1 md:mb-2 leading-snug hover:opacity-70 transition-opacity">{item.name}</h3>
              </Link>
              <div className="flex items-center gap-2 md:gap-3">
                {item.hasOffer && (
                  <span className="text-charcoal/40 text-[11px] md:text-[13px] line-through">{item.basePrice}</span>
                )}
                <p className="text-[#C4A47C] font-semibold text-[13px] md:text-[15px] tracking-wide">{item.price}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Wishlist;
