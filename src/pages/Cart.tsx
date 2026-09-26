import { useCart } from '../context/CartContext';
import { Trash2, ArrowRight, Minus, Plus, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, cartTotal } = useCart();

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center pt-24 px-8 opacity-0 animate-page-fade">
        <div className="w-24 h-24 bg-cream rounded-full flex items-center justify-center mb-6 text-charcoal/30">
          <ShoppingBag size={40} strokeWidth={1} />
        </div>
        <h1 className="font-serif text-3xl md:text-4xl text-charcoal mb-4">Your Cart is Empty</h1>
        <p className="text-charcoal/60 mb-8 max-w-md text-center">Looks like you haven't added any elegant pieces to your collection yet.</p>
        <Link to="/products" className="btn-luxury btn-luxury-solid px-10 py-4">
          Explore Collections
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto min-h-screen opacity-0 animate-page-fade">
      <h1 className="text-3xl md:text-4xl font-serif text-charcoal mb-10 border-b border-charcoal/10 pb-6">Shopping Cart</h1>
      
      <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
        {/* Cart Items List */}
        <div className="flex-1">
          <div className="space-y-8">
            {cartItems.map(item => (
              <div key={item.id} className="flex gap-6 py-6 border-b border-charcoal/10 group">
                {/* Item Image */}
                <Link to={`/product/${item.id}`} className="w-24 md:w-32 aspect-[4/5] bg-cream rounded-lg overflow-hidden flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover mix-blend-multiply transition-transform duration-500 group-hover:scale-105" />
                </Link>
                
                {/* Item Details */}
                <div className="flex flex-col flex-grow justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <Link to={`/product/${item.id}`} className="font-serif text-lg md:text-xl text-charcoal hover:text-black transition-colors block mb-1">
                        {item.name}
                      </Link>
                      <p className="text-[#C4A47C] font-medium">{item.price}</p>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-charcoal/40 hover:text-red-500 transition-colors p-2 -mr-2"
                      aria-label="Remove item"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  {/* Quantity Controls */}
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center border border-charcoal/20 rounded-full px-3 py-1">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="text-charcoal/60 hover:text-charcoal p-1 transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center text-sm font-medium text-charcoal">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="text-charcoal/60 hover:text-charcoal p-1 transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Order Summary Side */}
        <div className="w-full lg:w-[380px] flex-shrink-0">
          <div className="bg-cream/50 border border-charcoal/10 rounded-2xl p-8 sticky top-32">
            <h2 className="font-serif text-2xl text-charcoal mb-6">Order Summary</h2>
            
            <div className="space-y-4 text-sm mb-6 border-b border-charcoal/10 pb-6">
              <div className="flex justify-between text-charcoal/70">
                <span>Subtotal</span>
                <span>₹ {cartTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-charcoal/70">
                <span>Estimated Shipping</span>
                <span className="text-[#C4A47C] uppercase tracking-wider text-[11px] font-bold">Free</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center mb-8">
              <span className="font-serif text-xl text-charcoal">Total</span>
              <span className="font-serif text-2xl text-charcoal">₹ {cartTotal.toLocaleString('en-IN')}</span>
            </div>
            
            <button className="btn-luxury btn-luxury-solid w-full py-4">
              Proceed to Checkout <ArrowRight size={16} />
            </button>
            
            <p className="text-center text-[11px] text-charcoal/50 mt-4 uppercase tracking-widest">
              Secure & Encrypted Checkout
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
