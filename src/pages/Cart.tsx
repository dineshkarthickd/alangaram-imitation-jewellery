import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Trash2, ArrowRight, Minus, Plus, } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, cartTotal } = useCart();
  const { currentUser, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center pt-16 md:pt-24 px-4 md:px-8">
        <div className="mb-4 md:mb-6">
          <img 
            src="/Mock-Images/Loader Image.png" 
            alt="Empty Cart Logo" 
            className="w-20 md:w-28 h-auto object-contain opacity-100"
          />
        </div>
        <h1 className="font-serif text-2xl md:text-4xl text-charcoal mb-3 md:mb-4">Your Cart is Empty</h1>
        <p className="text-charcoal/60 mb-6 md:mb-8 max-w-md text-center text-[12px] md:text-base">Looks like you haven't added any elegant pieces to your collection yet.</p>
        <Link to="/products" className="btn-luxury btn-luxury-solid px-8 py-3 md:px-10 md:py-4 text-[10px] md:text-sm">
          Explore Collections
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-24 md:pt-32 pb-16 md:pb-24 px-4 md:px-12 max-w-[100vw] md:max-w-7xl overflow-x-hidden mx-auto min-h-screen w-full min-w-0">
      <h1 className="text-2xl md:text-4xl font-serif text-charcoal mb-6 md:mb-10 border-b border-charcoal/10 pb-4 md:pb-6">Shopping Cart</h1>
      
      <div className="flex flex-col md:flex-row gap-8 md:gap-16 w-full min-w-0">
        {/* Cart Items List */}
        <div className="flex-1 min-w-0">
          <div className="space-y-6 md:space-y-8">
            {cartItems.map(item => (
              <div key={item.id} className="flex gap-4 md:gap-6 py-4 md:py-6 border-b border-charcoal/10 group min-w-0">
                {/* Item Image */}
                <Link to={`/product/${item.id}`} className="w-24 md:w-32 aspect-[4/5] bg-cream rounded-lg overflow-hidden flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover mix-blend-multiply transition-transform duration-500 group-hover:scale-105" />
                </Link>
                
                {/* Item Details */}
                <div className="flex flex-col flex-grow justify-between min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <Link to={`/product/${item.id}`} className="font-serif text-[15px] md:text-xl text-charcoal hover:text-black transition-colors block mb-1 truncate">
                        {item.name}
                      </Link>
                      <p className="text-[#C4A47C] font-medium text-[13px] md:text-base">{item.price}</p>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-charcoal/40 hover:text-red-500 transition-colors p-2 -mr-2 md:-mr-0 flex-shrink-0"
                      aria-label="Remove item"
                    >
                      <Trash2 size={16} className="md:w-[18px] md:h-[18px]" />
                    </button>
                  </div>
                  
                  {/* Quantity Controls */}
                  <div className="flex items-center gap-4 mt-3 md:mt-4">
                    <div className="flex items-center border border-charcoal/20 rounded-full px-2 md:px-3 py-1">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="text-charcoal/60 hover:text-charcoal p-1 transition-colors"
                      >
                        <Minus size={12} className="md:w-[14px] md:h-[14px]" />
                      </button>
                      <span className="w-6 md:w-8 text-center text-xs md:text-sm font-medium text-charcoal">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="text-charcoal/60 hover:text-charcoal p-1 transition-colors"
                      >
                        <Plus size={12} className="md:w-[14px] md:h-[14px]" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Order Summary Side */}
        <div className="w-full md:w-[380px] flex-shrink-0 min-w-0">
          <div className="bg-cream/50 border border-charcoal/10 rounded-2xl p-6 md:p-8 md:sticky top-32">
            <h2 className="font-serif text-xl md:text-2xl text-charcoal mb-4 md:mb-6">Order Summary</h2>
            
            <div className="space-y-3 md:space-y-4 text-xs md:text-sm mb-4 md:mb-6 border-b border-charcoal/10 pb-4 md:pb-6">
              <div className="flex justify-between text-charcoal/70">
                <span>Subtotal</span>
                <span>₹ {cartTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-charcoal/70">
                <span>Estimated Shipping</span>
                <span className="text-[#C4A47C] uppercase tracking-wider text-[10px] md:text-[11px] font-bold">Free</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center mb-6 md:mb-8">
              <span className="font-serif text-[17px] md:text-xl text-charcoal">Total</span>
              <span className="font-serif text-xl md:text-2xl text-charcoal">₹ {cartTotal.toLocaleString('en-IN')}</span>
            </div>
            
            <button 
              onClick={() => {
                if (!currentUser) {
                  signInWithGoogle();
                } else {
                  navigate('/checkout');
                }
              }}
              className="btn-luxury btn-luxury-solid w-full py-3 md:py-4 flex items-center justify-center gap-2 text-[10px] md:text-[13px]"
            >
              {currentUser ? 'Proceed to Checkout' : 'Sign in to Checkout'} <ArrowRight size={14} className="md:w-[16px] md:h-[16px]" />
            </button>
            
            <p className="text-center text-[9px] md:text-[11px] text-charcoal/50 mt-4 md:mt-4 uppercase tracking-widest">
              Secure & Encrypted Checkout
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
