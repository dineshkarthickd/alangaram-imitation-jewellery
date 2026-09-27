import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, doc, setDoc, getDoc, getDocs, query, orderBy, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Upload, Plus, Loader2, CheckCircle2, Settings2, Image as ImageIcon, LayoutList, AlertCircle, AlertTriangle, PackageOpen, Edit2, Trash2, MessageSquare, Eye, EyeOff, Star, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { currentUser, loading: authLoading, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'upload' | 'manage' | 'banner' | 'reviews'>('upload');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  
  // --- PRODUCT UPLOAD STATE ---
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [modelImage, setModelImage] = useState<File | null>(null);
  const [mainPreview, setMainPreview] = useState<string | null>(null);
  const [modelPreview, setModelPreview] = useState<string | null>(null);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    productId: '',
    name: '',
    price: '',
    hasOffer: false,
    offerPercentage: '',
    category: '',
    stock: '',
    description: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // --- MANAGE PRODUCTS STATE ---
  const [productsList, setProductsList] = useState<any[]>([]);
  const [fetchingProducts, setFetchingProducts] = useState(false);
  const [stockFilter, setStockFilter] = useState<'all' | 'active' | 'low' | 'out'>('all');

  // --- REVIEWS STATE ---
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const reviewsFetched = useRef(false);
  
  // --- SETTINGS STATE ---
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [bannerText, setBannerText] = useState('Loading...');
  const [bannerDesign, setBannerDesign] = useState<1 | 2 | 3 | 4>(1);
  const [adminEmail1, setAdminEmail1] = useState('');
  const [adminEmail2, setAdminEmail2] = useState('');
  const [settingsErrors, setSettingsErrors] = useState<Record<string, string>>({});

  // Fetch Current Settings on Load
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const bannerSnap = await getDoc(doc(db, 'settings', 'banner'));
        if (bannerSnap.exists()) {
          if (bannerSnap.data().text) setBannerText(bannerSnap.data().text);
          if (bannerSnap.data().design) setBannerDesign(bannerSnap.data().design);
        }
        
        const adminSnap = await getDoc(doc(db, 'settings', 'admins'));
        if (adminSnap.exists() && adminSnap.data().emails) {
          const emails = adminSnap.data().emails;
          setAdminEmail1(emails[0] || '');
          setAdminEmail2(emails[1] || '');
        } else {
          setAdminEmail1('dineshkarthick1610@gmail.com');
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);

  // Fetch All Products when "Manage" tab is opened
  useEffect(() => {
    if (activeTab === 'manage') {
      const fetchProducts = async () => {
        setFetchingProducts(true);
        setGlobalError(null);
        try {
          const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
          const snap = await getDocs(q);
          const loaded = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setProductsList(loaded);
        } catch (error) {
          console.error("Error fetching products:", error);
          setGlobalError("Failed to fetch inventory from database.");
        } finally {
          setFetchingProducts(false);
        }
      };
      fetchProducts();
    }

    if (activeTab === 'reviews') {
      if (reviewsFetched.current) return;
      reviewsFetched.current = true;

      const fetchAllReviews = async () => {
        setFetchingProducts(true);
        setGlobalError(null);
        try {
          // Step 1: Fetch all products (1 call)
          const productsSnap = await getDocs(collection(db, 'products'));
          const products = productsSnap.docs.map(d => ({ id: d.id, name: d.data().name }));

          // Step 2: Fire ALL review subcollection fetches simultaneously (parallel, not sequential)
          const reviewPromises = products.map(p =>
            getDocs(collection(db, 'products', p.id, 'reviews')).then(snap =>
              snap.docs.map(r => ({
                reviewId: r.id,
                productId: p.id,
                productName: p.name,
                ...r.data()
              }))
            )
          );
          const reviewArrays = await Promise.all(reviewPromises);
          const fetchedReviews = reviewArrays.flat();

          // Sort newest first
          fetchedReviews.sort((a, b) => {
            const toMs = (v: any) => v?.toMillis?.() ?? new Date(v).getTime();
            return toMs(b.createdAt) - toMs(a.createdAt);
          });

          setAllReviews(fetchedReviews);
        } catch (error) {
          console.error("Error fetching reviews:", error);
          setGlobalError("Failed to fetch reviews from database.");
        } finally {
          setFetchingProducts(false);
        }
      };
      fetchAllReviews();
    }
  }, [activeTab]);

  // --- DELETION STATE ---
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'product' | 'review', id: string, name?: string, productId?: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (authLoading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;

  // --- HANDLERS ---
  
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsSuccess(false);
    setGlobalError(null);

    const errors: Record<string, string> = {};
    if (!adminEmail1.trim()) errors.adminEmail1 = "Primary Admin Email is required";
    if (!bannerText.trim()) errors.bannerText = "Banner Text is required";

    if (Object.keys(errors).length > 0) {
      setSettingsErrors(errors);
      setSettingsLoading(false);
      return;
    }
    
    setSettingsErrors({});

    try {
      // 1. Save Banner Config
      await setDoc(doc(db, "settings", "banner"), { text: bannerText, design: bannerDesign, updatedAt: new Date() });
      
      // 2. Save Admin Access (clean up empty inputs, ensure at least one email exists to prevent total lockout)
      const emails = [adminEmail1.trim(), adminEmail2.trim()].filter(Boolean);
      if (emails.length === 0) {
        emails.push(currentUser?.email || 'dineshkarthick1610@gmail.com');
        setAdminEmail1(emails[0]);
      }
      await setDoc(doc(db, "settings", "admins"), { emails, updatedAt: new Date() });
      
      setSettingsSuccess(true);
      scrollToTop();
    } catch (error) {
      console.error(error);
      setGlobalError("Failed to save store settings to database.");
      scrollToTop();
    } finally {
      setSettingsLoading(false);
    }
  };

  const uploadToCloudinary = async (file: File) => {
    const imageFormData = new FormData();
    imageFormData.append('file', file);
    imageFormData.append('upload_preset', 'ml_default'); 
    const res = await fetch('https://api.cloudinary.com/v1_1/qabziz86/image/upload', { method: 'POST', body: imageFormData });
    if (!res.ok) throw new Error("Cloudinary upload failed");
    const data = await res.json();
    return data.secure_url.replace('/upload/', '/upload/f_auto,q_auto,w_1000/');
  };

  const requestProductDelete = (productId: string, productName: string) => {
    setDeleteConfirm({ type: 'product', id: productId, name: productName });
  };

  const requestReviewDelete = (productId: string, reviewId: string) => {
    setDeleteConfirm({ type: 'review', id: reviewId, productId });
  };

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    setGlobalError(null);
    setIsDeleting(true);

    try {
      if (deleteConfirm.type === 'product') {
        await deleteDoc(doc(db, "products", deleteConfirm.id));
        setProductsList(prev => prev.filter(p => p.id !== deleteConfirm.id));
      } else if (deleteConfirm.type === 'review') {
        await deleteDoc(doc(db, 'products', deleteConfirm.productId!, 'reviews', deleteConfirm.id));
        setAllReviews(prev => prev.filter(r => r.reviewId !== deleteConfirm.id));
      }
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting:", error);
      setGlobalError(`Failed to delete ${deleteConfirm.type}.`);
      scrollToTop();
      setDeleteConfirm(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleHideReview = async (productId: string, reviewId: string, currentHidden: boolean) => {
    setGlobalError(null);
    try {
      await updateDoc(doc(db, 'products', productId, 'reviews', reviewId), {
        isHidden: !currentHidden
      });
      setAllReviews(prev => prev.map(r => r.reviewId === reviewId ? { ...r, isHidden: !currentHidden } : r));
    } catch (error) {
      console.error("Error updating review visibility:", error);
      setGlobalError("Failed to update review visibility.");
      scrollToTop();
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);
    setSuccess(false);

    const errors: Record<string, string> = {};
    if (!editingId && !mainImage) errors.mainImage = "Product Image is required";
    if (!formData.productId) errors.productId = "Product ID is required";
    if (!formData.name) errors.name = "Product Name is required";
    if (!formData.price) errors.price = "Base Price is required";
    if (formData.hasOffer && !formData.offerPercentage) errors.offerPercentage = "Discount Percentage is required";
    if (!formData.stock) errors.stock = "Initial Stock is required";
    if (!formData.category) errors.category = "Category is required";
    if (!formData.description) errors.description = "Description is required";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setFormErrors({});
    
    setLoading(true);

    try {
      const fullProductId = `#${formData.productId}`;

      // 1. Validate Duplicate Product ID (Ignore current product if editing)
      const q = query(collection(db, "products"), where("productId", "==", fullProductId));
      const querySnapshot = await getDocs(q);
      const isDuplicate = querySnapshot.docs.some(d => d.id !== editingId);
      if (isDuplicate) {
        setLoading(false);
        setGlobalError(`Product ID ${fullProductId} is already in use! Please choose a unique serial number.`);
        scrollToTop();
        return;
      }

      // 2. Upload Images (If new files are selected, upload them. Otherwise keep existing URLs from preview state)
      const mainUrl = mainImage ? await uploadToCloudinary(mainImage) : mainPreview;
      const modelUrl = modelImage ? await uploadToCloudinary(modelImage) : modelPreview;

      // 3. Calculate Final Price
      const basePrice = Number(formData.price);
      let finalPrice = basePrice;
      if (formData.hasOffer && formData.offerPercentage) {
        const discount = basePrice * (Number(formData.offerPercentage) / 100);
        finalPrice = Math.round(basePrice - discount);
      }

      const productData = {
        productId: fullProductId,
        name: formData.name,
        basePrice: basePrice,
        finalPrice: finalPrice,
        hasOffer: formData.hasOffer,
        offerPercentage: formData.hasOffer ? Number(formData.offerPercentage) : 0,
        category: formData.category,
        description: formData.description,
        stock: Number(formData.stock),
        images: [mainUrl, modelUrl].filter(Boolean)
      };

      // 4. Save or Update in Firestore
      if (editingId) {
        await updateDoc(doc(db, "products", editingId), productData);
        setProductsList(prev => prev.map(p => p.id === editingId ? { ...p, ...productData } : p));
      } else {
        await addDoc(collection(db, "products"), { ...productData, createdAt: new Date() });
      }

      setSuccess(true);
      scrollToTop();
      
      // Reset form
      setEditingId(null);
      setFormData({ productId: '', name: '', price: '', hasOffer: false, offerPercentage: '', category: '', stock: '', description: '' });
      setMainImage(null);
      setModelImage(null);
      setMainPreview(null);
      setModelPreview(null);
      
    } catch (error) {
      console.error("Error saving product:", error);
      setGlobalError("Failed to save product. Check your network and Cloudinary preset.");
      scrollToTop();
    } finally {
      setLoading(false);
    }
  };

  const calculatedOfferPrice = formData.hasOffer && formData.price && formData.offerPercentage 
    ? Math.round(Number(formData.price) - (Number(formData.price) * (Number(formData.offerPercentage) / 100))) 
    : formData.price;

  const lowStockCount = productsList.filter(p => p.stock < 3).length;

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto opacity-0 animate-page-fade">
      <h1 className="text-3xl md:text-4xl font-serif text-charcoal mb-2">Admin Dashboard</h1>
      <p className="text-charcoal/60 mb-10 border-b border-charcoal/10 pb-6">Manage your products, inventory, and website settings.</p>

      <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
        
        {/* Service List Sidebar */}
        <div className="w-full md:w-72 flex flex-col space-y-3 flex-shrink-0">
          <button 
            onClick={() => { setActiveTab('upload'); setEditingId(null); setFormData({ productId: '', name: '', price: '', hasOffer: false, offerPercentage: '', category: '', stock: '', description: '' }); setMainPreview(null); setModelPreview(null); }} 
            className={`flex items-center gap-3 text-left px-5 py-4 rounded-xl transition-all duration-300 font-medium ${activeTab === 'upload' ? 'bg-[#C4A47C] text-white shadow-md' : 'bg-white/50 text-charcoal/70 hover:bg-white border border-charcoal/5'}`}
          >
            <ImageIcon size={18} /> {editingId ? 'Edit Product' : 'Add New Product'}
          </button>
          <button 
            onClick={() => setActiveTab('manage')} 
            className={`flex items-center justify-between px-5 py-4 rounded-xl transition-all duration-300 font-medium ${activeTab === 'manage' ? 'bg-[#C4A47C] text-white shadow-md' : 'bg-white/50 text-charcoal/70 hover:bg-white border border-charcoal/5'}`}
          >
            <div className="flex items-center gap-3"><LayoutList size={18} /> Manage Inventory</div>
            {lowStockCount > 0 && <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">{lowStockCount}</span>}
          </button>
          <button 
            onClick={() => setActiveTab('reviews')} 
            className={`flex items-center gap-3 text-left px-5 py-4 rounded-xl transition-all duration-300 font-medium ${activeTab === 'reviews' ? 'bg-[#C4A47C] text-white shadow-md' : 'bg-white/50 text-charcoal/70 hover:bg-white border border-charcoal/5'}`}
          >
            <MessageSquare size={18} /> Manage Reviews
          </button>
          <button 
            onClick={() => setActiveTab('banner')} 
            className={`flex items-center gap-3 text-left px-5 py-4 rounded-xl transition-all duration-300 font-medium ${activeTab === 'banner' ? 'bg-[#C4A47C] text-white shadow-md' : 'bg-white/50 text-charcoal/70 hover:bg-white border border-charcoal/5'}`}
          >
            <Settings2 size={18} /> Store Settings
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          
          {globalError && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700 animate-fade-in shadow-sm">
              <AlertCircle size={20} className="flex-shrink-0" />
              <p className="font-medium">{globalError}</p>
            </div>
          )}
          
          {/* =========================================
              TAB: ADD / EDIT PRODUCT
             ========================================= */}
          {activeTab === 'upload' && (
            <div className="animate-fade-in">
              {success && !globalError && (
                <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-700 shadow-sm">
                  <CheckCircle2 size={20} />
                  <p>{editingId ? 'Product successfully updated!' : 'Product successfully added to inventory and Cloudinary!'}</p>
                </div>
              )}

              <form onSubmit={handleProductSubmit} className="space-y-10 bg-white/50 p-4 sm:p-8 rounded-2xl border border-charcoal/5 shadow-sm">
                
                <h2 className="text-2xl font-serif text-charcoal mb-6 border-b border-charcoal/10 pb-4">
                  {editingId ? 'Update Existing Product' : 'Create New Product'}
                </h2>
                
                {/* ID & Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm uppercase tracking-wider text-charcoal/70 mb-2">Product ID (SKU)</label>
                    <div className={`flex items-center border-b transition-colors ${formErrors.productId ? 'border-red-500' : 'border-charcoal/20 focus-within:border-[#C4A47C]'}`}>
                      <span className="text-charcoal/50 font-serif text-xl pl-2 pr-1 pb-2">#</span>
                      <input 
                        type="number" placeholder="101" disabled={!!editingId}
                        className="w-full bg-transparent py-3 outline-none disabled:opacity-50"
                        value={formData.productId} onChange={(e) => { setFormData({...formData, productId: e.target.value}); setFormErrors({...formErrors, productId: ''}); }}
                      />
                    </div>
                    {formErrors.productId && <p className="text-red-500 text-xs mt-1.5 animate-fade-in font-medium">{formErrors.productId}</p>}
                  </div>
                  <div>
                    <label className="block text-sm uppercase tracking-wider text-charcoal/70 mb-2">Product Name</label>
                    <input 
                      type="text" placeholder="e.g. Classic Gold Choker"
                      className={`w-full bg-transparent border-b py-3 outline-none transition-colors ${formErrors.name ? 'border-red-500' : 'border-charcoal/20 focus:border-[#C4A47C]'}`}
                      value={formData.name} onChange={(e) => { setFormData({...formData, name: e.target.value}); setFormErrors({...formErrors, name: ''}); }}
                    />
                    {formErrors.name && <p className="text-red-500 text-xs mt-1.5 animate-fade-in font-medium">{formErrors.name}</p>}
                  </div>
                </div>

                {/* Dual Image Upload */}
                <div>
                  <label className="block text-sm uppercase tracking-wider text-charcoal/70 mb-4">Product Imagery (Cloudinary)</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Main Image */}
                    <div>
                      <label className={`flex flex-col items-center justify-center w-full h-56 border-2 border-dashed rounded-xl cursor-pointer bg-cream/30 hover:bg-cream/70 transition-colors overflow-hidden relative ${formErrors.mainImage ? 'border-red-500' : 'border-charcoal/20'}`}>
                        {mainPreview ? <img src={mainPreview} className="w-full h-full object-contain" /> : (
                          <div className="flex flex-col items-center text-center p-4">
                            <Upload className="w-8 h-8 mb-2 text-charcoal/40" />
                            <p className="text-sm font-semibold text-[#C4A47C]">Product Image</p>
                            <p className="text-xs text-charcoal/50 mt-1">(Standalone item)</p>
                          </div>
                        )}
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setMainImage(e.target.files[0]); setMainPreview(URL.createObjectURL(e.target.files[0])); setFormErrors({...formErrors, mainImage: ''});
                          }
                        }} />
                      </label>
                      {formErrors.mainImage && <p className="text-red-500 text-xs mt-1.5 animate-fade-in font-medium">{formErrors.mainImage}</p>}
                    </div>

                    {/* Model Image */}
                    <label className="flex flex-col items-center justify-center w-full h-56 border-2 border-charcoal/20 border-dashed rounded-xl cursor-pointer bg-cream/30 hover:bg-cream/70 transition-colors overflow-hidden relative">
                      {modelPreview ? <img src={modelPreview} className="w-full h-full object-contain" /> : (
                        <div className="flex flex-col items-center text-center p-4">
                          <Upload className="w-8 h-8 mb-2 text-charcoal/40" />
                          <p className="text-sm font-semibold text-charcoal/70">Model Image <span className="font-normal text-xs opacity-70">(Optional)</span></p>
                          <p className="text-xs text-charcoal/50 mt-1">Model wearing the item</p>
                        </div>
                      )}
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setModelImage(e.target.files[0]); setModelPreview(URL.createObjectURL(e.target.files[0]));
                        }
                      }} />
                    </label>
                  </div>
                </div>

                {/* Pricing & Offers */}
                <div className="p-6 border border-[#C4A47C]/20 rounded-xl bg-[#C4A47C]/5 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm uppercase tracking-wider text-charcoal/70 mb-2">Base Price (₹)</label>
                      <input 
                        type="number" placeholder="e.g. 2499"
                        className={`w-full bg-transparent border-b py-3 outline-none transition-colors ${formErrors.price ? 'border-red-500' : 'border-charcoal/20 focus:border-[#C4A47C]'}`}
                        value={formData.price} onChange={(e) => { setFormData({...formData, price: e.target.value}); setFormErrors({...formErrors, price: ''}); }}
                      />
                      {formErrors.price && <p className="text-red-500 text-xs mt-1.5 animate-fade-in font-medium">{formErrors.price}</p>}
                    </div>
                    <div className="flex flex-col justify-center pt-6">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 accent-[#C4A47C]"
                          checked={formData.hasOffer} 
                          onChange={(e) => setFormData({...formData, hasOffer: e.target.checked})}
                        />
                        <span className="text-charcoal font-medium">Apply Special Offer to this product</span>
                      </label>
                    </div>
                  </div>

                  {formData.hasOffer && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                      <div>
                        <label className="block text-sm uppercase tracking-wider text-charcoal/70 mb-2">Discount Percentage (%)</label>
                        <input 
                          type="number" placeholder="e.g. 20" min="1" max="99"
                          className={`w-full bg-transparent border-b py-3 outline-none font-bold transition-colors ${formErrors.offerPercentage ? 'border-red-500 text-red-500' : 'border-[#C4A47C] focus:border-[#C4A47C] text-[#C4A47C]'}`}
                          value={formData.offerPercentage} onChange={(e) => { setFormData({...formData, offerPercentage: e.target.value}); setFormErrors({...formErrors, offerPercentage: ''}); }}
                        />
                        {formErrors.offerPercentage && <p className="text-red-500 text-xs mt-1.5 animate-fade-in font-medium">{formErrors.offerPercentage}</p>}
                      </div>
                      <div className="flex flex-col justify-end pb-2">
                        <p className="text-sm text-charcoal/60">Final Selling Price: <strong className="text-xl text-[#C4A47C]">₹ {calculatedOfferPrice || '0'}</strong></p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Stock & Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm uppercase tracking-wider text-charcoal/70 mb-2">Initial Stock Quantity</label>
                    <input 
                      type="number" placeholder="e.g. 10" min="0"
                      className={`w-full bg-transparent border-b py-3 outline-none transition-colors ${formErrors.stock ? 'border-red-500' : 'border-charcoal/20 focus:border-[#C4A47C]'}`}
                      value={formData.stock} onChange={(e) => { setFormData({...formData, stock: e.target.value}); setFormErrors({...formErrors, stock: ''}); }}
                    />
                    {formErrors.stock && <p className="text-red-500 text-xs mt-1.5 animate-fade-in font-medium">{formErrors.stock}</p>}
                  </div>
                  <div className="relative">
                    <label className="block text-sm uppercase tracking-wider text-charcoal/70 mb-2">Category</label>
                    <div 
                      className={`w-full bg-transparent border-b py-3 flex justify-between items-center cursor-pointer transition-colors ${formErrors.category ? 'border-red-500' : 'border-charcoal/20 hover:border-[#C4A47C]'}`}
                      onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                    >
                      <span className={formData.category ? 'text-charcoal' : 'text-charcoal/50'}>
                        {formData.category ? `${formData.category} Jewellery` : 'Select Category'}
                      </span>
                      <ChevronDown size={18} className={`text-charcoal/50 transition-transform duration-300 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>
                    {formErrors.category && <p className="text-red-500 text-xs mt-1.5 animate-fade-in font-medium">{formErrors.category}</p>}
                    
                    {/* Custom Dropdown Menu */}
                    {isCategoryDropdownOpen && (
                      <div className="absolute top-full left-0 w-full mt-1 bg-white border border-charcoal/10 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
                        {['Forming', 'Imitation'].map((cat) => (
                          <div 
                            key={cat}
                            className={`px-4 py-3 cursor-pointer transition-colors ${formData.category === cat ? 'bg-[#C4A47C]/10 text-[#C4A47C] font-medium' : 'text-charcoal hover:bg-charcoal/5'}`}
                            onClick={() => {
                              setFormData({...formData, category: cat});
                              setFormErrors({...formErrors, category: ''});
                              setIsCategoryDropdownOpen(false);
                            }}
                          >
                            {cat} Jewellery
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm uppercase tracking-wider text-charcoal/70 mb-2">Description</label>
                  <textarea 
                    rows={3} placeholder="Detailed description of the piece..."
                    className={`w-full bg-transparent border-b py-3 outline-none transition-colors resize-none ${formErrors.description ? 'border-red-500' : 'border-charcoal/20 focus:border-[#C4A47C]'}`}
                    value={formData.description} onChange={(e) => { setFormData({...formData, description: e.target.value}); setFormErrors({...formErrors, description: ''}); }}
                  ></textarea>
                  {formErrors.description && <p className="text-red-500 text-xs mt-1.5 animate-fade-in font-medium">{formErrors.description}</p>}
                </div>

                <button type="submit" disabled={loading} className="btn-luxury btn-luxury-solid w-full py-4 flex items-center justify-center gap-2">
                  {loading ? (
                    <><Loader2 className="animate-spin" size={20} /> <span className="hidden sm:inline">Processing & Uploading...</span><span className="sm:hidden">Processing...</span></>
                  ) : (
                    <>
                      <Plus size={20} className="hidden sm:block" /> 
                      <span className="hidden sm:inline">{editingId ? 'Update Product' : 'Create Product & Add to Store'}</span>
                      <span className="sm:hidden">{editingId ? 'Update Product' : 'Create Product'}</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* =========================================
              TAB: MANAGE REVIEWS
             ========================================= */}
          {activeTab === 'reviews' && (
            <div className="animate-fade-in bg-white/50 p-4 sm:p-8 rounded-2xl border border-charcoal/5 shadow-sm min-h-[500px]">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-serif text-charcoal mb-2">Review Management</h2>
                  <p className="text-charcoal/60 text-sm">Monitor, hide, and remove customer reviews across all products.</p>
                </div>
              </div>

              {fetchingProducts ? (
                <div className="flex justify-center items-center h-48"><Loader2 className="animate-spin text-[#C4A47C]" size={32} /></div>
              ) : allReviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-charcoal/40">
                  <MessageSquare size={48} className="mb-4 opacity-50" />
                  <p>No customer reviews have been posted yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {allReviews.map((review) => (
                    <div key={review.reviewId} className={`p-5 rounded-xl border transition-all ${review.isHidden ? 'bg-charcoal/5 border-charcoal/10 opacity-70' : 'bg-white border-charcoal/5 shadow-sm'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-sm font-bold text-charcoal">{review.productName}</p>
                          <p className="text-xs text-charcoal/50 mt-1">Review by <span className="font-semibold text-charcoal/80">{review.userName}</span> on {new Date(review.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={14} className={i < review.rating ? 'text-[#C4A47C] fill-[#C4A47C]' : 'text-charcoal/20'} />
                          ))}
                        </div>
                      </div>
                      
                      <p className="text-charcoal/80 text-sm italic mb-4">"{review.comment}"</p>
                      
                      <div className="flex items-center justify-between border-t border-charcoal/5 pt-3">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${review.isHidden ? 'bg-gray-200 text-gray-600' : 'bg-green-100 text-green-700'}`}>
                          {review.isHidden ? 'Hidden from Public' : 'Visible on Store'}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleToggleHideReview(review.productId, review.reviewId, review.isHidden)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${review.isHidden ? 'bg-[#C4A47C]/10 text-[#C4A47C] hover:bg-[#C4A47C]/20' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}`}
                          >
                            {review.isHidden ? <><Eye size={14} /> Unhide</> : <><EyeOff size={14} /> Hide</>}
                          </button>
                          <button 
                            onClick={() => requestReviewDelete(review.productId, review.reviewId)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* =========================================
              TAB: MANAGE INVENTORY
             ========================================= */}
          {activeTab === 'manage' && (
            <div className="animate-fade-in bg-white/50 p-4 sm:p-8 rounded-2xl border border-charcoal/5 shadow-sm min-h-[500px]">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-serif text-charcoal mb-2">Inventory Management</h2>
                  <p className="text-charcoal/60 text-sm">Monitor stock levels and view all live products.</p>
                </div>
                {lowStockCount > 0 && (
                  <div className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg border border-red-100">
                    <AlertTriangle size={18} />
                    <span className="text-sm font-semibold">{lowStockCount} Items need restocking!</span>
                  </div>
                )}
              </div>

              {/* Stock Filter Pills */}
              <div className="flex flex-wrap gap-2 mb-6">
                <button onClick={() => setStockFilter('all')} className={`px-4 py-2 rounded-full text-xs sm:text-sm transition-all ${stockFilter === 'all' ? 'bg-[#C4A47C] text-white' : 'bg-white border border-charcoal/10 text-charcoal/70 hover:border-[#C4A47C]'}`}>All Products</button>
                <button onClick={() => setStockFilter('active')} className={`px-4 py-2 rounded-full text-xs sm:text-sm transition-all ${stockFilter === 'active' ? 'bg-[#C4A47C] text-white' : 'bg-white border border-charcoal/10 text-charcoal/70 hover:border-[#C4A47C]'}`}>Active Stock</button>
                <button onClick={() => setStockFilter('low')} className={`px-4 py-2 rounded-full text-xs sm:text-sm transition-all ${stockFilter === 'low' ? 'bg-orange-500 text-white' : 'bg-white border border-orange-200 text-orange-600 hover:border-orange-500'}`}>Low Stock</button>
                <button onClick={() => setStockFilter('out')} className={`px-4 py-2 rounded-full text-xs sm:text-sm transition-all ${stockFilter === 'out' ? 'bg-red-500 text-white' : 'bg-white border border-red-200 text-red-600 hover:border-red-500'}`}>Out of Stock</button>
              </div>

              {fetchingProducts ? (
                <div className="flex justify-center items-center h-48"><Loader2 className="animate-spin text-[#C4A47C]" size={32} /></div>
              ) : productsList.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-charcoal/40">
                  <PackageOpen size={48} className="mb-4 opacity-50" />
                  <p>No products found in the database.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-charcoal/10 text-xs uppercase tracking-widest text-charcoal/60">
                        <th className="pb-4 font-medium pl-2 min-w-[250px]">Product</th>
                        <th className="pb-4 font-medium whitespace-nowrap px-4">ID</th>
                        <th className="pb-4 font-medium whitespace-nowrap px-4">Price</th>
                        <th className="pb-4 font-medium whitespace-nowrap px-4">Stock</th>
                        <th className="pb-4 font-medium whitespace-nowrap px-4">Status</th>
                        <th className="pb-4 font-medium text-right pr-2 whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productsList.filter(p => {
                        if (stockFilter === 'out') return p.stock === 0;
                        if (stockFilter === 'low') return p.stock > 0 && p.stock < 3;
                        if (stockFilter === 'active') return p.stock >= 3;
                        return true;
                      }).map((product) => (
                        <tr key={product.id} className="border-b border-charcoal/5 hover:bg-white/40 transition-colors">
                          <td className="py-4 pl-2 min-w-[250px]">
                            <div className="flex items-center gap-4">
                              <img src={product.images[0]} alt={product.name} className="w-12 h-12 rounded object-cover flex-shrink-0" />
                              <div className="flex flex-col min-w-0">
                                <span className="font-serif text-charcoal break-words whitespace-normal">{product.name}</span>
                                {product.hasOffer && <span className="text-[10px] uppercase text-[#C4A47C] font-bold mt-0.5">-{product.offerPercentage}% OFF</span>}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 font-mono text-sm text-charcoal/70 whitespace-nowrap">{product.productId}</td>
                          <td className="py-4 px-4 font-medium text-[#C4A47C] whitespace-nowrap">₹{product.finalPrice}</td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className={`font-bold ${product.stock < 3 ? 'text-red-500' : 'text-green-600'}`}>
                              {product.stock}
                            </span>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            {product.stock === 0 ? (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-md whitespace-nowrap">Out of Stock</span>
                            ) : product.stock < 3 ? (
                              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-md whitespace-nowrap">Low Stock</span>
                            ) : (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md whitespace-nowrap">Active</span>
                            )}
                          </td>
                          <td className="py-4 pr-2 whitespace-nowrap">
                            <div className="flex items-center justify-end gap-3">
                              <button 
                                onClick={() => {
                                  setEditingId(product.id);
                                  setFormData({
                                    productId: product.productId.replace('#', ''),
                                    name: product.name,
                                    price: String(product.basePrice),
                                    hasOffer: product.hasOffer,
                                    offerPercentage: String(product.offerPercentage),
                                    category: product.category,
                                    stock: String(product.stock),
                                    description: product.description
                                  });
                                  setMainPreview(product.images[0]);
                                  if (product.images.length > 1) setModelPreview(product.images[1]);
                                  setActiveTab('upload');
                                }}
                                className="p-2 text-charcoal/40 hover:text-[#C4A47C] transition-colors rounded-lg hover:bg-[#C4A47C]/10"
                                title="Edit Product"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => requestProductDelete(product.id, product.name)}
                                className="p-2 text-charcoal/40 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                                title="Delete Product"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* =========================================
              TAB: STORE SETTINGS
             ========================================= */}
          {activeTab === 'banner' && (
            <div className="animate-fade-in space-y-8 bg-white/50 p-4 sm:p-8 rounded-2xl border border-charcoal/5 shadow-sm">
              <div>
                <h2 className="text-2xl font-serif text-charcoal mb-2">Store Settings</h2>
                <p className="text-charcoal/60 text-sm mb-6">Manage global store configurations and admin access.</p>
              </div>

              {settingsSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-700">
                  <CheckCircle2 size={20} />
                  <p>Store settings successfully updated!</p>
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-12">
                {/* Admin Access Section */}
                <div>
                  <h3 className="text-lg font-serif text-charcoal mb-4 border-b border-charcoal/10 pb-2">Admin Dashboard Access</h3>
                  <p className="text-sm text-charcoal/60 mb-6">Specify up to 2 Google accounts that are authorized to access this dashboard.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm uppercase tracking-wider text-charcoal/70 mb-2">Primary Admin Email</label>
                      <input type="email" value={adminEmail1} onChange={(e) => { setAdminEmail1(e.target.value); setSettingsErrors({...settingsErrors, adminEmail1: ''}); }}
                        className={`w-full bg-transparent border-b py-3 outline-none transition-colors ${settingsErrors.adminEmail1 ? 'border-red-500' : 'border-charcoal/20 focus:border-[#C4A47C]'}`}
                        placeholder="admin@gmail.com"
                      />
                      {settingsErrors.adminEmail1 && <p className="text-red-500 text-xs mt-1.5 animate-fade-in font-medium">{settingsErrors.adminEmail1}</p>}
                    </div>
                    <div>
                      <label className="block text-sm uppercase tracking-wider text-charcoal/70 mb-2">Secondary Admin Email (Optional)</label>
                      <input type="email" value={adminEmail2} onChange={(e) => setAdminEmail2(e.target.value)}
                        className="w-full bg-transparent border-b border-charcoal/20 py-3 outline-none focus:border-[#C4A47C] transition-colors"
                        placeholder="co-owner@gmail.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Banner Section */}
                <div>
                  <h3 className="text-lg font-serif text-charcoal mb-4 border-b border-charcoal/10 pb-2">Offer Banner Alternation</h3>
                  <div className="space-y-8 mt-4">
                    <div>
                      <label className="block text-sm uppercase tracking-wider text-charcoal/70 mb-3">Banner Text</label>
                      <input type="text" value={bannerText} onChange={(e) => { setBannerText(e.target.value); setSettingsErrors({...settingsErrors, bannerText: ''}); }}
                        className={`w-full bg-transparent border-b py-3 outline-none transition-colors ${settingsErrors.bannerText ? 'border-red-500' : 'border-charcoal/20 focus:border-[#C4A47C]'}`}
                      />
                      {settingsErrors.bannerText && <p className="text-red-500 text-xs mt-1.5 animate-fade-in font-medium">{settingsErrors.bannerText}</p>}
                    </div>
                    <div>
                      <label className="block text-sm uppercase tracking-wider text-charcoal/70 mb-4">Select Design Palette</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button type="button" onClick={() => setBannerDesign(1)} className={`p-4 rounded-xl border-2 transition-all ${bannerDesign === 1 ? 'border-[#C4A47C]' : 'border-transparent bg-white hover:border-charcoal/20'}`}>
                          <div className="w-full h-10 bg-[#3F3A36] text-[#C4A47C] flex items-center justify-center text-xs tracking-widest font-sans rounded-md">CHARCOAL & GOLD</div>
                        </button>
                        <button type="button" onClick={() => setBannerDesign(2)} className={`p-4 rounded-xl border-2 transition-all ${bannerDesign === 2 ? 'border-[#C4A47C]' : 'border-transparent bg-white hover:border-charcoal/20'}`}>
                          <div className="w-full h-10 bg-[#C4A47C] text-white flex items-center justify-center text-xs tracking-widest font-sans rounded-md">SOLID GOLD</div>
                        </button>
                        <button type="button" onClick={() => setBannerDesign(3)} className={`p-4 rounded-xl border-2 transition-all ${bannerDesign === 3 ? 'border-[#C4A47C]' : 'border-transparent bg-white hover:border-charcoal/20'}`}>
                          <div className="w-full h-10 bg-[#F0EBE1] border-y border-[#C4A47C] text-[#3F3A36] flex items-center justify-center text-xs tracking-widest font-sans rounded-md">CREAM BORDERED</div>
                        </button>
                        <button type="button" onClick={() => setBannerDesign(4)} className={`p-4 rounded-xl border-2 transition-all ${bannerDesign === 4 ? 'border-[#C4A47C]' : 'border-transparent bg-white hover:border-charcoal/20'}`}>
                          <div className="w-full h-10 bg-transparent border-y border-[#3F3A36] text-[#3F3A36] flex items-center justify-center text-xs tracking-widest font-sans rounded-md">MINIMALIST CLEAR</div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={settingsLoading} className="btn-luxury btn-luxury-solid w-full py-4 flex items-center justify-center gap-2 mt-4">
                  {settingsLoading ? <><Loader2 className="animate-spin" size={20} /> Saving Settings...</> : <><CheckCircle2 size={20} /> Save All Settings</>}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>

      {/* --- CUSTOM DELETE CONFIRMATION MODAL --- */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 text-red-600">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-xl font-serif text-charcoal mb-2">
              Delete {deleteConfirm.type === 'product' ? 'Product' : 'Review'}
            </h3>
            <p className="text-sm text-charcoal/60 mb-6 leading-relaxed">
              Are you sure you want to permanently delete {deleteConfirm.type === 'product' ? <span className="font-semibold text-charcoal">"{deleteConfirm.name}"</span> : 'this review'}? This action cannot be undone.
            </p>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
                className="flex-1 py-3 text-sm font-medium text-charcoal bg-charcoal/5 hover:bg-charcoal/10 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={executeDelete}
                disabled={isDeleting}
                className="flex-1 py-3 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
