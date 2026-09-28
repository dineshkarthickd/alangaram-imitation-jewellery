import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, addDoc, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Package, ChevronRight, Loader2, Clock, CheckCircle2, Truck, XCircle, ArrowLeft, Copy, Star, ChevronDown } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const MyOrders = () => {
  const { currentUser } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Accordion & Review states
  const [showDelivery, setShowDelivery] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }

    const fetchOrders = async () => {
      try {
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', currentUser.uid)
        );
        const snap = await getDocs(q);
        const fetchedOrders = snap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((order: any) => order.status !== 'Payment Timeout' && order.status !== 'Pending Payment');
        
        fetchedOrders.sort((a: any, b: any) => {
          const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return bTime - aTime;
        });
        
        setOrders(fetchedOrders);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchRecommendations = async () => {
      try {
        const q = query(collection(db, 'products'), limit(4));
        const snap = await getDocs(q);
        setRecommendedProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Error fetching recommendations", err);
      }
    };

    fetchOrders();
    fetchRecommendations();
  }, [currentUser, navigate]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Order Confirmed': return <CheckCircle2 size={14} className="text-green-600" />;
      case 'Shipping': return <Package size={14} className="text-orange-500" />;
      case 'Ready to Deliver': return <Truck size={14} className="text-blue-500" />;
      case 'Delivered Successfully': return <CheckCircle2 size={14} className="text-green-600" />;
      case 'Payment Timeout': return <XCircle size={14} className="text-red-500" />;
      case 'Pending Payment': return <Clock size={14} className="text-yellow-600" />;
      default: return <Clock size={14} className="text-charcoal/50" />;
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenDetails = (item: any) => {
    setSelectedItem(item);
    setShowDelivery(true);
    setShowPrice(true);
    setReviewSubmitted(false);
    setReviewText('');
    setReviewRating(5);
  };

  const handleSubmitReview = async () => {
    if (!currentUser || !selectedItem || !reviewText.trim()) return;
    setSubmittingReview(true);
    try {
      await addDoc(collection(db, 'products', selectedItem.productId || selectedItem.id, 'reviews'), {
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Anonymous User',
        userImage: currentUser.photoURL || null,
        rating: reviewRating,
        comment: reviewText.trim(),
        createdAt: new Date().toISOString()
      });
      setReviewSubmitted(true);
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-32 pb-24 min-h-[70vh] flex justify-center items-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#C4A47C]" />
      </div>
    );
  }

  // Flatten orders into a list of items for the minimal view
  const allOrderItems = orders.flatMap(order => 
    order.items?.map((item: any, index: number) => {
      const orderDateObj = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();
      return {
        ...item,
        uniqueKey: `${order.id}-${index}`,
        orderId: order.orderId,
        orderDateStr: orderDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDateStr: orderDateObj.toLocaleDateString(),
        orderStatus: order.status || 'Order Confirmed',
        customerInfo: order.customerInfo,
        originalOrder: order
      };
    }) || []
  );

  // === DETAIL VIEW ===
  if (selectedItem) {
    return (
      <div key="detail-view" className="pt-32 md:pt-35 pb-24 px-4 md:px-12 max-w-[1000px] mx-auto animate-page-fade min-h-[70vh]">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => setSelectedItem(null)} className="flex items-center gap-3 text-charcoal font-medium hover:opacity-70 transition-opacity text-lg">
            <ArrowLeft size={24} /> Order Details
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-start">
          {/* LEFT SIDE: Order Details (Span 3) */}
          <div className="lg:col-span-3 flex flex-col">
            {/* Product Info */}
            <div className="flex gap-4 mb-8">
          <div className="w-20 h-20 bg-cream rounded-md overflow-hidden flex-shrink-0 border border-charcoal/10">
            <img src={selectedItem.image} alt={selectedItem.name} className="w-full h-full object-cover" />
          </div>
          <div className="pt-1">
            <h3 className="font-medium text-charcoal text-base leading-snug">{selectedItem.name}</h3>
            <p className="text-charcoal/50 text-xs mt-1.5">Qty: {selectedItem.quantity}</p>
          </div>
        </div>

        {/* Order ID */}
        <div className="mb-4 flex items-center gap-2 text-sm text-charcoal/60">
          <span>Order #{selectedItem.orderId}</span>
          <button onClick={() => handleCopy(selectedItem.orderId)} className="hover:text-charcoal transition-colors relative">
            <Copy size={14} />
            {copied && <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-charcoal text-white text-[10px] px-2 py-1 rounded">Copied!</span>}
          </button>
        </div>

        {/* Status Box */}
        <div className="border border-charcoal/20 rounded-xl p-4 flex items-center justify-between mb-8 cursor-default">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full flex items-center justify-center bg-green-100 text-green-700">
              <CheckCircle2 size={16} />
            </div>
            <span className="font-semibold text-green-700 text-sm">
              {selectedItem.orderStatus}, {selectedItem.orderDateStr}
            </span>
          </div>
        </div>

        {/* Delivery Details */}
        <div className="border border-charcoal/10 rounded-xl mb-4 overflow-hidden">
          <div 
            onClick={() => setShowDelivery(!showDelivery)}
            className="p-4 border-b border-charcoal/5 flex justify-between items-center bg-white cursor-pointer hover:bg-charcoal/5 transition-colors"
          >
            <h4 className="font-bold text-charcoal">Delivery details</h4>
            <ChevronDown size={20} className={`text-charcoal/40 transition-transform duration-300 ${showDelivery ? 'rotate-180' : ''}`} />
          </div>
          {showDelivery && (
            <div className="p-4 bg-[#FAF8F5] text-sm text-charcoal/80 leading-relaxed animate-fade-in">
              <p className="font-medium text-charcoal mb-1">Delivered to {selectedItem.customerInfo?.name?.toUpperCase() || 'CUSTOMER'}</p>
              <p>{selectedItem.customerInfo?.address}</p>
              <p>{selectedItem.customerInfo?.district}, {selectedItem.customerInfo?.state} - {selectedItem.customerInfo?.pincode}</p>
              <p className="mt-2 font-medium">{selectedItem.customerInfo?.phone}</p>
            </div>
          )}
        </div>

        {/* Price Details */}
        <div className="border border-charcoal/10 rounded-xl overflow-hidden mb-12">
          <div 
            onClick={() => setShowPrice(!showPrice)}
            className="p-4 border-b border-charcoal/5 flex justify-between items-center bg-white cursor-pointer hover:bg-charcoal/5 transition-colors"
          >
            <h4 className="font-bold text-charcoal">Price details</h4>
            <ChevronDown size={20} className={`text-charcoal/40 transition-transform duration-300 ${showPrice ? 'rotate-180' : ''}`} />
          </div>
          {showPrice && (
            <div className="p-4 bg-[#FAF8F5] text-sm text-charcoal/80 animate-fade-in">
              <div className="flex justify-between mb-2">
                <span>Selling Price (x{selectedItem.quantity})</span>
                <span>{selectedItem.price}</span>
              </div>
              <div className="flex justify-between mb-4 border-b border-charcoal/10 pb-4">
                <span>Shipping Fee</span>
                <span className="text-green-600 font-medium">FREE</span>
              </div>
              <div className="flex justify-between font-bold text-charcoal text-base">
                <span>Total Amount</span>
                <span>{selectedItem.price}</span>
              </div>
              <p className="text-xs text-charcoal/50 mt-3">
                Paid by {selectedItem.originalOrder?.paymentMode === 'TEST' ? 'Test Mode' : 'UPI Transfer'}
              </p>
            </div>
          )}
        </div>

        </div>

        {/* RIGHT SIDE: Review Form (Span 2) */}
        <div className="lg:col-span-2 lg:sticky lg:top-32">
          {/* Rate Experience */}
          <div className="bg-[#FAF8F5] p-6 md:p-8 rounded-xl shadow-sm border border-charcoal/5 mb-8">
            <h3 className="font-serif text-xl text-charcoal mb-6">Write a Review</h3>
            
            {reviewSubmitted ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 size={24} className="text-green-600" />
                </div>
                <p className="font-medium text-charcoal">Thank you for your review!</p>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3 mb-2">
                  <img src={currentUser?.photoURL || ''} alt="User" className="w-10 h-10 rounded-full border border-charcoal/10" referrerPolicy="no-referrer" />
                  <div>
                    <p className="text-sm font-medium text-charcoal">{currentUser?.displayName}</p>
                    <p className="text-xs text-charcoal/50">Posting publicly</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-charcoal/60 mb-2">Your Rating</label>
                  <div className="flex items-center gap-1 cursor-pointer">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        className="p-1 transition-transform hover:scale-110 focus:outline-none"
                        onClick={() => setReviewRating(star)}
                        onMouseEnter={() => setReviewHover(star)}
                        onMouseLeave={() => setReviewHover(0)}
                      >
                        <Star 
                          size={24} 
                          className={`transition-colors duration-200 ${(reviewHover || reviewRating) >= star ? 'text-[#C4A47C] fill-[#C4A47C]' : 'text-charcoal/20'}`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-charcoal/60 mb-2">Your Experience</label>
                  <textarea 
                    required
                    rows={4} 
                    placeholder="What did you love about this piece? How was the quality?"
                    className="w-full bg-white border border-charcoal/10 rounded-lg p-4 outline-none focus:border-[#C4A47C] transition-colors resize-none text-sm shadow-inner"
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                  ></textarea>
                </div>

                <button 
                  onClick={handleSubmitReview}
                  disabled={submittingReview || !reviewText.trim()}
                  className="btn-luxury btn-luxury-solid w-full py-3.5 flex items-center justify-center gap-2 text-sm"
                >
                  {submittingReview ? <><Loader2 className="animate-spin" size={16} /> Posting...</> : 'Post Review'}
                </button>
              </div>
            )}
          </div>
        </div>

        </div>

        {/* You May Also Like Section */}
        {recommendedProducts.length > 0 && (
          <div className="mt-24 mb-8">
            <h3 className="text-2xl font-serif text-charcoal mb-8 text-center">You May Also Like</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
              {recommendedProducts.map(product => {
                const hasStock = product.stock > 0;
                return (
                  <Link to={`/product/${product.id}`} key={product.id} className="group cursor-pointer flex flex-col">
                    <div className="relative aspect-[3/4] overflow-hidden bg-[#FAF8F5] mb-4 rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                      <img 
                        src={product.images[0]} 
                        alt={product.name} 
                        className={`absolute inset-0 w-full h-full object-cover mix-blend-multiply transition-all duration-700 ${product.images.length > 1 ? 'group-hover:opacity-0' : 'group-hover:scale-105'}`}
                        loading="lazy"
                      />
                      {product.images.length > 1 && (
                        <img 
                          src={product.images[1]} 
                          alt={`${product.name} worn`} 
                          className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-0 transition-all duration-700 group-hover:opacity-100 group-hover:scale-105"
                          loading="lazy"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                      
                      <div className="absolute top-2 right-2 flex flex-col gap-1 items-end z-10 pointer-events-none">
                        {!hasStock && (
                          <div className="bg-red-900/90 text-white text-[8px] font-bold tracking-[0.2em] px-2 py-0.5 uppercase rounded-sm shadow-sm backdrop-blur-sm">
                            OUT OF STOCK
                          </div>
                        )}
                        {hasStock && product.hasOffer && (
                          <div className="bg-[#C4A47C] text-white text-[8px] font-bold tracking-[0.2em] px-2 py-0.5 uppercase rounded-sm shadow-sm backdrop-blur-sm">
                            {product.offerPercentage}% OFF
                          </div>
                        )}
                      </div>

                      {hasStock && (
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 md:translate-y-4 md:opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 w-[85%]">
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              addToCart({
                                id: product.id,
                                name: product.name,
                                price: `₹ ${product.finalPrice}`,
                                image: product.images[0]
                              });
                            }} 
                            className="btn-luxury btn-luxury-dark w-full bg-white/90 backdrop-blur-md py-2 text-[10px]"
                          >
                            ADD TO CART
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-center text-center">
                      <h3 className="font-serif text-sm md:text-base text-charcoal mb-1 line-clamp-1">{product.name}</h3>
                      <div className="flex items-center gap-2">
                        {product.hasOffer && (
                          <span className="text-charcoal/40 text-[11px] line-through">₹ {product.basePrice}</span>
                        )}
                        <p className="text-[#C4A47C] font-semibold text-[13px] tracking-wide">₹ {product.finalPrice}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // === LIST VIEW ===
  return (
    <div key="list-view" className="pt-32 md:pt-35 pb-24 px-4 md:px-12 max-w-[900px] mx-auto animate-page-fade min-h-[70vh]">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-charcoal/40 mb-8">
        <button onClick={() => navigate('/')} className="hover:text-charcoal transition-colors">Home</button>
        <ChevronRight size={12} />
        <span className="text-charcoal font-medium">My Orders</span>
      </div>

      <h1 className="font-serif text-3xl md:text-4xl text-charcoal mb-8">My Orders</h1>

      {allOrderItems.length === 0 ? (
        <div className="text-center py-16 bg-white border border-charcoal/10 rounded-2xl">
          <Package size={48} className="mx-auto text-charcoal/20 mb-4" />
          <h2 className="font-serif text-xl text-charcoal mb-2">No orders yet</h2>
          <p className="text-charcoal/60 mb-6">When you place an order, it will appear here.</p>
          <button onClick={() => navigate('/products')} className="btn-luxury btn-luxury-solid px-8 py-3">
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {allOrderItems.map((item) => (
            <div 
              key={item.uniqueKey} 
              onClick={() => handleOpenDetails(item)}
              className="bg-white border border-charcoal/10 rounded-xl p-4 md:p-5 flex flex-col md:flex-row gap-4 md:items-center cursor-pointer hover:shadow-md transition-all group"
            >
              {/* Product Image & Title (Left Side) */}
              <div className="flex gap-4 flex-grow">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-cream rounded-md overflow-hidden flex-shrink-0 border border-charcoal/5">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="flex flex-col justify-center min-w-0">
                  <h3 className="font-medium text-charcoal text-sm md:text-base leading-snug line-clamp-2 pr-4">{item.name}</h3>
                  <p className="text-charcoal/50 text-xs mt-1 md:mt-1.5">Qty: {item.quantity}</p>
                </div>
              </div>

              {/* Price & Status (Right Side) */}
              <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center md:w-[220px] flex-shrink-0 border-t md:border-t-0 border-charcoal/5 pt-3 md:pt-0 mt-1 md:mt-0">
                <p className="font-semibold text-charcoal text-sm md:mb-2">{item.price}</p>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1.5 text-xs font-medium">
                    {getStatusIcon(item.orderStatus)}
                    <span className={item.orderStatus === 'Cancelled' ? 'text-red-600' : 'text-green-700'}>
                      {item.orderStatus === 'Order Confirmed' ? `Confirmed on ${item.orderDateStr}` : `${item.orderStatus} on ${item.orderDateStr}`}
                    </span>
                  </div>
                  <p className="text-[10px] text-charcoal/50 mt-1 hidden md:block">
                    {item.orderStatus === 'Delivered Successfully' ? 'Your item has been delivered' : 'Click to view order details'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* You May Also Like Section */}
      {recommendedProducts.length > 0 && (
        <div className="mt-24 mb-8">
          <h3 className="text-2xl font-serif text-charcoal mb-8 text-center">You May Also Like</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {recommendedProducts.map(product => {
              const hasStock = product.stock > 0;
              return (
                <Link to={`/product/${product.id}`} key={product.id} className="group cursor-pointer flex flex-col">
                  <div className="relative aspect-[3/4] overflow-hidden bg-[#FAF8F5] mb-4 rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                    <img 
                      src={product.images[0]} 
                      alt={product.name} 
                      className={`absolute inset-0 w-full h-full object-cover mix-blend-multiply transition-all duration-700 ${product.images.length > 1 ? 'group-hover:opacity-0' : 'group-hover:scale-105'}`}
                      loading="lazy"
                    />
                    {product.images.length > 1 && (
                      <img 
                        src={product.images[1]} 
                        alt={`${product.name} worn`} 
                        className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-0 transition-all duration-700 group-hover:opacity-100 group-hover:scale-105"
                        loading="lazy"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    
                    <div className="absolute top-2 right-2 flex flex-col gap-1 items-end z-10 pointer-events-none">
                      {!hasStock && (
                        <div className="bg-red-900/90 text-white text-[8px] font-bold tracking-[0.2em] px-2 py-0.5 uppercase rounded-sm shadow-sm backdrop-blur-sm">
                          OUT OF STOCK
                        </div>
                      )}
                      {hasStock && product.hasOffer && (
                        <div className="bg-[#C4A47C] text-white text-[8px] font-bold tracking-[0.2em] px-2 py-0.5 uppercase rounded-sm shadow-sm backdrop-blur-sm">
                          {product.offerPercentage}% OFF
                        </div>
                      )}
                    </div>

                    {hasStock && (
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 md:translate-y-4 md:opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 w-[85%]">
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            addToCart({
                              id: product.id,
                              name: product.name,
                              price: `₹ ${product.finalPrice}`,
                              image: product.images[0]
                            });
                          }} 
                          className="btn-luxury btn-luxury-dark w-full bg-white/90 backdrop-blur-md py-2 text-[10px]"
                        >
                          ADD TO CART
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-center text-center">
                    <h3 className="font-serif text-sm md:text-base text-charcoal mb-1 line-clamp-1">{product.name}</h3>
                    <div className="flex items-center gap-2">
                      {product.hasOffer && (
                        <span className="text-charcoal/40 text-[11px] line-through">₹ {product.basePrice}</span>
                      )}
                      <p className="text-[#C4A47C] font-semibold text-[13px] tracking-wide">₹ {product.finalPrice}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrders;
