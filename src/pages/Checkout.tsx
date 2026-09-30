import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ShoppingBag, AlertCircle, CheckCircle2, ChevronRight, ChevronDown, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';

const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli", "Daman and Diu", "Delhi", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka",
  "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

const Checkout = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { currentUser, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [fetchingSettings, setFetchingSettings] = useState(true);
  const [upiSettings, setUpiSettings] = useState({ upiId: 'dineshkarthick1610-4@okaxis', payeeName: 'Dinesh Karthick' });
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    pincode: '',
    state: '',
    district: ''
  });

  const [testMode, setTestMode] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [orderError, setOrderError] = useState<string | null>(null);
  const [desktopQRUrl, setDesktopQRUrl] = useState<string | null>(null);
  const [verificationStep, setVerificationStep] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [orderDocId, setOrderDocId] = useState('');
  const [finalAmount, setFinalAmount] = useState(0);
  const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false);

  // Prefill email if logged in
  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({ ...prev, email: currentUser.email || '', name: currentUser.displayName || '' }));
    }
  }, [currentUser]);

  // Redirect to cart if empty
  useEffect(() => {
    if (cartItems.length === 0 && !orderSuccess && !verificationStep) {
      navigate('/cart');
    }
  }, [cartItems, navigate, orderSuccess, verificationStep]);

  // Timer Effect for Verification Step
  useEffect(() => {
    if (verificationStep && timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    } else if (verificationStep && timeLeft === 0) {
      if (orderDocId) {
        updateDoc(doc(db, 'orders', orderDocId), { status: 'Payment Timeout' }).catch(console.error);
      }
      setOrderError("Payment time expired. Please try placing the order again.");
      setVerificationStep(false);
      setDesktopQRUrl(null);
    }
  }, [verificationStep, timeLeft, orderDocId]);

  // Fetch UPI Settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'payment'));
        if (snap.exists() && snap.data().upiId) {
          setUpiSettings({ upiId: snap.data().upiId, payeeName: snap.data().payeeName });
        }
      } catch (e) {
        console.error('Error fetching payment settings:', e);
      } finally {
        setFetchingSettings(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormErrors(prev => ({ ...prev, [e.target.name]: '' }));
    setOrderError(null);
  };

  const fireSuccessConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#C4A47C', '#D4AF37']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#C4A47C', '#D4AF37']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setOrderError(null);
    setFormErrors({});
    
    // Validate fields
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "Full Name is required";
    if (!formData.phone.trim() || formData.phone.length < 10) errors.phone = "Please enter a valid 10-digit phone number";
    if (!formData.pincode.trim() || formData.pincode.length < 6) errors.pincode = "Please enter a valid 6-digit Pincode";
    if (!formData.state) errors.state = "Please select your State";
    if (!formData.district.trim()) errors.district = "Please enter your District";
    if (!formData.address.trim()) errors.address = "Complete Delivery Address is required";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setLoading(true);

    try {
      // 1. Generate Order ID
      const orderId = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

      // 2. Save to Firestore
      const docRef = await addDoc(collection(db, 'orders'), {
        orderId,
        userId: currentUser.uid,
        customerInfo: formData,
        items: cartItems,
        totalAmount: cartTotal,
        status: testMode ? 'Order Confirmed' : 'Pending Payment',
        paymentMode: testMode ? 'TEST' : 'GPAY',
        createdAt: serverTimestamp()
      });
      
      setOrderDocId(docRef.id);
      setFinalAmount(cartTotal);
      setPlacedOrderId(orderId);

      // 3. Trigger GPay (if not in test mode)
      if (!testMode) {
        // Deep link for UPI (GPay, PhonePe, Paytm, etc.)
        const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        const upiUrl = `upi://pay?pa=${upiSettings.upiId}&pn=${encodeURIComponent(upiSettings.payeeName)}&am=${cartTotal}&cu=INR&tr=${orderId}`;
        
        if (isMobile) {
          window.location.href = upiUrl;
        } else {
          setDesktopQRUrl(upiUrl);
        }
        
        // Transition to verification step for BOTH mobile and desktop
        setVerificationStep(true);
        setTimeLeft(60);
        
      } else {
        // 4. Show Success Popup (Test Mode)
        clearCart();
        setOrderSuccess(true);
        fireSuccessConfetti();
      }

    } catch (error: any) {
      console.error("Order error:", error);
      if (error?.message?.includes("Missing or insufficient permissions")) {
        setOrderError("Firestore permissions error. Please tell the admin to allow users to write to the 'orders' collection in Firebase.");
      } else {
        setOrderError("Something went wrong placing your order.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (transactionId.length < 8) {
      setOrderError("Please enter a valid Transaction ID");
      return;
    }
    setLoading(true);
    setOrderError(null);
    try {
      if (orderDocId) {
        await updateDoc(doc(db, 'orders', orderDocId), {
          transactionId: transactionId,
          status: 'Order Confirmed'
        });
      }
      setVerificationStep(false);
      setDesktopQRUrl(null);
      clearCart();
      setOrderSuccess(true);
      fireSuccessConfetti();
    } catch (err) {
      console.error(err);
      setOrderError("Failed to verify payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // MUST LOG IN FIRST
  if (!currentUser) {
    return (
      <div className="pt-24 md:pt-32 pb-16 md:pb-24 px-4 md:px-6 min-h-[70vh] flex flex-col items-center justify-center w-full max-w-[100vw] overflow-hidden min-w-0">
        <div className="w-12 h-12 md:w-16 md:h-16 bg-cream rounded-full flex items-center justify-center mb-4 md:mb-6">
          <AlertCircle size={24} className="md:w-[32px] md:h-[32px] text-[#C4A47C]" />
        </div>
        <h1 className="font-serif text-2xl md:text-4xl text-charcoal mb-3 md:mb-4 text-center">Login Required</h1>
        <p className="text-charcoal/60 mb-6 md:mb-8 text-center max-w-md text-[12px] md:text-base">You need to log in to securely place an order and track your shipments.</p>
        <button onClick={signInWithGoogle} className="btn-luxury px-6 md:px-8 py-2 md:py-3 text-[10px] md:text-sm">
          Sign In with Google
        </button>
      </div>
    );
  }

  // VERIFICATION STEP (MOBILE & DESKTOP)
  if (verificationStep) {
    return (
      <div className="pt-24 md:pt-32 pb-16 md:pb-24 px-4 md:px-6 min-h-[70vh] flex flex-col items-center justify-center animate-fade-in w-full max-w-[100vw] overflow-x-hidden min-w-0">
        <h1 className="font-serif text-2xl md:text-4xl text-charcoal mb-3 md:mb-4 text-center">Verify Payment</h1>
        
        {desktopQRUrl ? (
          <>
            <p className="text-charcoal/60 mb-3 md:mb-4 text-center max-w-md text-[12px] md:text-base">Scan this QR code with any UPI app to pay ₹ {finalAmount}.</p>
            <div className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl shadow-lg border border-charcoal/10 mb-4 md:mb-6">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(desktopQRUrl)}`} alt="UPI QR Code" className="w-[150px] h-[150px] md:w-[200px] md:h-[200px]" />
            </div>
          </>
        ) : (
          <p className="text-charcoal/60 mb-4 md:mb-6 text-center max-w-md text-[12px] md:text-base">Please complete the payment in your UPI app and return to this page.</p>
        )}

        <div className="text-base md:text-xl font-bold text-red-500 mb-4 md:mb-6 flex items-center gap-2">
          Time Remaining: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </div>

        {orderError && (
          <div className="mb-4 md:mb-6 p-3 md:p-4 bg-red-50 border border-red-200 rounded-lg flex gap-2 md:gap-3 text-red-700 animate-fade-in shadow-sm w-full max-w-md">
            <AlertCircle size={16} className="md:w-[20px] md:h-[20px] flex-shrink-0 mt-0.5" />
            <p className="text-[11px] md:text-sm font-medium leading-relaxed">{orderError}</p>
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 p-3 md:p-4 rounded-lg max-w-md mb-4 md:mb-6 text-center space-y-2 shadow-sm w-full">
          <p className="text-[11px] md:text-sm font-medium text-yellow-800">
            Your order will be placed ONLY after entering the UPI Transaction ID below and clicking the button.
          </p>
          <hr className="border-yellow-200" />
          <p className="text-[10px] md:text-[13px] font-medium text-yellow-800">
            UPI பரிவர்த்தனை எண்ணை (Transaction ID) கீழே உள்ளிட்டு பொத்தானை அழுத்தினால் மட்டுமே உங்கள் ஆர்டர் உறுதி செய்யப்படும்.
          </p>
        </div>

        <div className="w-full max-w-md space-y-3 md:space-y-4">
          <input 
            type="text" 
            placeholder="Enter 12-digit UPI Transaction ID / UTR"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            className="w-full bg-white border border-charcoal/20 px-3 py-3 md:px-4 md:py-4 rounded-md outline-none focus:border-[#C4A47C] text-center tracking-widest font-mono shadow-sm text-xs md:text-base"
          />
          <button 
            onClick={handleVerifyPayment}
            disabled={loading || transactionId.length < 8}
            className="btn-luxury btn-luxury-solid px-6 py-3 md:px-8 md:py-4 w-full flex justify-center items-center gap-2 disabled:opacity-50 text-[10px] md:text-sm"
          >
            {loading ? <Loader2 className="animate-spin" /> : "I Have Completed Payment"}
          </button>
        </div>
      </div>
    );
  }

  // SUCCESS POPUP
  if (orderSuccess) {
    return (
      <div className="pt-24 md:pt-32 pb-16 md:pb-24 px-4 md:px-6 min-h-[70vh] flex flex-col items-center justify-center w-full max-w-[100vw] overflow-hidden min-w-0">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-green-50 rounded-full flex items-center justify-center mb-4 md:mb-6 shadow-sm border border-green-100 animate-bounce">
          <CheckCircle2 size={32} className="md:w-[40px] md:h-[40px] text-green-600" />
        </div>
        <h1 className="font-serif text-2xl md:text-4xl text-charcoal mb-2 text-center">Order Confirmed!</h1>
        <p className="text-charcoal/60 mb-4 md:mb-6 text-center text-[12px] md:text-base">Thank you for your purchase. Your masterpiece is on its way.</p>
        <div className="bg-cream/50 px-4 py-2 md:px-6 md:py-3 rounded-md border border-charcoal/5 mb-6 md:mb-8">
          <p className="font-mono text-[10px] md:text-sm tracking-wider text-charcoal/70">Order ID: {placedOrderId}</p>
        </div>
        <button onClick={() => navigate('/my-orders')} className="btn-luxury px-6 md:px-8 py-2 md:py-3 text-[10px] md:text-sm">
          Track My Order
        </button>
      </div>
    );
  }

  return (
    <div className="pt-24 md:pt-32 pb-16 md:pb-24 px-4 md:px-12 w-full max-w-[100vw] md:max-w-[1200px] mx-auto min-w-0 overflow-x-hidden animate-fade-in">
      
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[10px] md:text-xs uppercase tracking-widest text-charcoal/40 mb-8 md:mb-12">
        <button onClick={() => navigate('/cart')} className="hover:text-charcoal transition-colors">Cart</button>
        <ChevronRight size={10} className="md:w-[12px] md:h-[12px]" />
        <span className="text-charcoal font-medium">Checkout</span>
      </div>

      <h1 className="font-serif text-2xl md:text-4xl text-charcoal mb-8 md:mb-12">Secure Checkout</h1>

      <div className="flex flex-col md:flex-row gap-6 md:gap-12 w-full min-w-0">
        
        {/* LEFT COL: FORM */}
        <div className="flex-[3] w-full min-w-0 bg-white/40 p-4 md:p-8 rounded-xl md:rounded-2xl border border-charcoal/5 shadow-sm backdrop-blur-sm h-fit">
          <h2 className="font-serif text-lg md:text-xl text-charcoal mb-4 md:mb-8 border-b border-charcoal/10 pb-3 md:pb-4">Shipping Information</h2>
          
          <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-4 md:space-y-6" noValidate>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-[10px] md:text-xs uppercase tracking-widest text-charcoal/60 mb-1.5 md:mb-2">Full Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className={`w-full bg-white/50 border ${formErrors.name ? 'border-red-500' : 'border-charcoal/10'} px-3 md:px-4 py-2 md:py-3 rounded-md outline-none focus:border-[#C4A47C] transition-colors text-[12px] md:text-base`} />
                {formErrors.name && <p className="text-red-500 text-[10px] md:text-[11px] mt-1.5 font-medium">{formErrors.name}</p>}
              </div>
              <div>
                <label className="block text-[10px] md:text-xs uppercase tracking-widest text-charcoal/60 mb-1.5 md:mb-2">Email Address *</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} readOnly className="w-full bg-charcoal/5 border border-charcoal/10 px-3 md:px-4 py-2 md:py-3 rounded-md outline-none text-charcoal/60 cursor-not-allowed text-[12px] md:text-base" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-[10px] md:text-xs uppercase tracking-widest text-charcoal/60 mb-1.5 md:mb-2">Phone Number *</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 99999 99999" className={`w-full bg-white/50 border ${formErrors.phone ? 'border-red-500' : 'border-charcoal/10'} px-3 md:px-4 py-2 md:py-3 rounded-md outline-none focus:border-[#C4A47C] transition-colors text-[12px] md:text-base`} />
                {formErrors.phone && <p className="text-red-500 text-[10px] md:text-[11px] mt-1.5 font-medium">{formErrors.phone}</p>}
              </div>
              <div>
                <label className="block text-[10px] md:text-xs uppercase tracking-widest text-charcoal/60 mb-1.5 md:mb-2">Pincode *</label>
                <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} placeholder="989 001" maxLength={6} className={`w-full bg-white/50 border ${formErrors.pincode ? 'border-red-500' : 'border-charcoal/10'} px-3 md:px-4 py-2 md:py-3 rounded-md outline-none focus:border-[#C4A47C] transition-colors text-[12px] md:text-base`} />
                {formErrors.pincode && <p className="text-red-500 text-[10px] md:text-[11px] mt-1.5 font-medium">{formErrors.pincode}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-[10px] md:text-xs uppercase tracking-widest text-charcoal/60 mb-1.5 md:mb-2">State *</label>
                <div 
                  className="relative z-50"
                  tabIndex={0}
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                      setIsStateDropdownOpen(false);
                    }
                  }}
                >
                  <div 
                    onClick={() => setIsStateDropdownOpen(!isStateDropdownOpen)}
                    className={`w-full bg-white/50 border ${formErrors.state ? 'border-red-500' : 'border-charcoal/10'} px-3 md:px-4 py-2 md:py-3 rounded-md outline-none cursor-pointer flex justify-between items-center transition-colors text-[12px] md:text-base ${isStateDropdownOpen ? 'border-[#C4A47C]' : ''}`}
                  >
                    <span className={formData.state ? 'text-charcoal' : 'text-charcoal/50'}>
                      {formData.state || "Select State"}
                    </span>
                    <ChevronDown size={14} className={`md:w-[16px] md:h-[16px] text-charcoal/40 transition-transform ${isStateDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                  
                  {isStateDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-charcoal/10 rounded-md shadow-lg max-h-60 overflow-y-auto custom-scrollbar z-[100] animate-fade-in origin-top">
                      {INDIAN_STATES.map(s => (
                        <div 
                          key={s} 
                          onClick={() => {
                            setFormData({...formData, state: s});
                            if (formErrors.state) setFormErrors(prev => ({...prev, state: ''}));
                            setIsStateDropdownOpen(false);
                          }}
                          className={`px-3 md:px-4 py-2 text-[12px] md:text-base cursor-pointer transition-colors ${formData.state === s ? 'bg-cream font-medium text-[#C4A47C]' : 'text-charcoal/80 hover:bg-cream/50'}`}
                        >
                          {s}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {formErrors.state && <p className="text-red-500 text-[10px] md:text-[11px] mt-1.5 font-medium">{formErrors.state}</p>}
              </div>
              <div>
                <label className="block text-[10px] md:text-xs uppercase tracking-widest text-charcoal/60 mb-1.5 md:mb-2">District *</label>
                <input type="text" name="district" value={formData.district} onChange={handleChange} placeholder="e.g., Chennai" className={`w-full bg-white/50 border ${formErrors.district ? 'border-red-500' : 'border-charcoal/10'} px-3 md:px-4 py-2 md:py-3 rounded-md outline-none focus:border-[#C4A47C] transition-colors text-[12px] md:text-base`} />
                {formErrors.district && <p className="text-red-500 text-[10px] md:text-[11px] mt-1.5 font-medium">{formErrors.district}</p>}
              </div>
            </div>

            <div>
              <label className="block text-[10px] md:text-xs uppercase tracking-widest text-charcoal/60 mb-1.5 md:mb-2">Complete Delivery Address *</label>
              <textarea name="address" value={formData.address} onChange={handleChange} placeholder="Door Number, Street, Area" rows={3} className={`w-full bg-white/50 border ${formErrors.address ? 'border-red-500' : 'border-charcoal/10'} px-3 md:px-4 py-2 md:py-3 rounded-md outline-none focus:border-[#C4A47C] transition-colors resize-none text-[12px] md:text-base`}></textarea>
              {formErrors.address && <p className="text-red-500 text-[10px] md:text-[11px] mt-1.5 font-medium">{formErrors.address}</p>}
            </div>
          </form>
        </div>

        {/* RIGHT COL: SUMMARY & PAYMENT */}
        <div className="flex-[2] w-full min-w-0 bg-[#FAF8F5] p-4 md:p-8 rounded-xl md:rounded-2xl border border-charcoal/5 shadow-sm h-fit">
          <h2 className="font-serif text-lg md:text-xl text-charcoal mb-4 md:mb-8 border-b border-charcoal/10 pb-3 md:pb-4">Order Summary</h2>
          
          <div className="space-y-3 md:space-y-4 mb-6 md:mb-8 max-h-[250px] md:max-h-[300px] overflow-y-auto pr-2 custom-scrollbar min-w-0">
            {cartItems.map((item, idx) => (
              <div key={idx} className="flex gap-3 md:gap-4 min-w-0">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-md overflow-hidden flex-shrink-0 border border-charcoal/5">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-grow min-w-0">
                  <p className="font-medium text-charcoal text-[11px] md:text-sm leading-snug truncate">{item.name}</p>
                  <p className="text-charcoal/50 text-[10px] md:text-xs mt-0.5 md:mt-1">Qty: {item.quantity}</p>
                </div>
                <p className="font-medium text-charcoal text-[11px] md:text-sm whitespace-nowrap">{item.price}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-charcoal/10 pt-4 md:pt-6 space-y-3 md:space-y-4 mb-6 md:mb-8">
            <div className="flex justify-between text-charcoal/60 text-[11px] md:text-sm">
              <span>Subtotal</span>
              <span>₹ {cartTotal}</span>
            </div>
            <div className="flex justify-between text-charcoal/60 text-[11px] md:text-sm">
              <span>Shipping</span>
              <span className="text-green-600 font-medium">FREE</span>
            </div>
            <div className="flex justify-between text-lg md:text-xl font-serif text-charcoal pt-3 md:pt-4 border-t border-charcoal/5">
              <span>Total</span>
              <span>₹ {cartTotal}</span>
            </div>
          </div>

          <div className="bg-white p-3 md:p-4 rounded-lg border border-charcoal/10 mb-6 md:mb-8">
            <div className="flex items-center justify-between mb-1.5 md:mb-2">
              <span className="font-medium text-charcoal flex items-center gap-2 text-[12px] md:text-base">
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500"></div>
                GPay (UPI)
              </span>
            </div>
            <p className="text-[10px] md:text-xs text-charcoal/50 leading-relaxed">Direct, secure payment via Google Pay, PhonePe, or Paytm.</p>
          </div>

          {/* ERROR DISPLAY */}
          {orderError && (
            <div className="mb-4 md:mb-6 p-3 md:p-4 bg-red-50 border border-red-200 rounded-lg flex gap-2 md:gap-3 text-red-700 animate-fade-in shadow-sm w-full min-w-0">
              <AlertCircle size={16} className="md:w-[20px] md:h-[20px] flex-shrink-0 mt-0.5" />
              <p className="text-[10px] md:text-sm font-medium leading-relaxed">{orderError}</p>
            </div>
          )}

          {/* TEST MODE TOGGLE */}
          <div className="flex items-center justify-between mb-4 md:mb-6 bg-yellow-50 p-2 md:p-3 rounded border border-yellow-200">
            <span className="text-[9px] md:text-xs font-medium text-yellow-800 uppercase tracking-wider">Developer Test Mode</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={testMode} onChange={() => setTestMode(!testMode)} />
              <div className="w-7 h-4 md:w-9 md:h-5 bg-yellow-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 md:after:h-4 md:after:w-4 after:transition-all peer-checked:bg-yellow-500"></div>
            </label>
          </div>

          <button 
            type="submit"
            form="checkout-form"
            disabled={loading || fetchingSettings}
            className="btn-luxury btn-luxury-solid w-full py-3 md:py-4 flex items-center justify-center gap-2 md:gap-3 text-[13px] md:text-lg"
          >
            {loading ? <Loader2 size={16} className="md:w-[20px] md:h-[20px] animate-spin" /> : <><ShoppingBag size={16} className="md:w-[20px] md:h-[20px]" /> Pay ₹ {cartTotal}</>}
          </button>
          
          <p className="text-center text-[9px] md:text-[10px] text-charcoal/40 mt-3 md:mt-4 uppercase tracking-widest">100% Secure Checkout</p>
        </div>

      </div>
    </div>
  );
};

export default Checkout;
