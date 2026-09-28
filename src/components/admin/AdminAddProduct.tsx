import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Upload, Plus, Loader2, CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react';

interface AdminAddProductProps {
  editingProduct: any | null;
  setEditingProduct: (product: any | null) => void;
}

const AdminAddProduct: React.FC<AdminAddProductProps> = ({ editingProduct, setEditingProduct }) => {
  const [globalError, setGlobalError] = useState<string | null>(null);
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

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        productId: editingProduct.productId.replace('#', ''),
        name: editingProduct.name,
        price: String(editingProduct.basePrice),
        hasOffer: editingProduct.hasOffer,
        offerPercentage: String(editingProduct.offerPercentage),
        category: editingProduct.category,
        stock: String(editingProduct.stock),
        description: editingProduct.description
      });
      setMainPreview(editingProduct.images[0]);
      if (editingProduct.images.length > 1) {
        setModelPreview(editingProduct.images[1]);
      } else {
        setModelPreview(null);
      }
      setMainImage(null);
      setModelImage(null);
    } else {
      setFormData({ productId: '', name: '', price: '', hasOffer: false, offerPercentage: '', category: '', stock: '', description: '' });
      setMainPreview(null);
      setModelPreview(null);
      setMainImage(null);
      setModelImage(null);
    }
    setGlobalError(null);
    setSuccess(false);
    setFormErrors({});
  }, [editingProduct]);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const uploadToCloudinary = async (file: File) => {
    const imageFormData = new FormData();
    imageFormData.append('file', file);
    imageFormData.append('upload_preset', 'ml_default'); 
    const res = await fetch('https://api.cloudinary.com/v1_1/qabziz86/image/upload', { method: 'POST', body: imageFormData });
    if (!res.ok) throw new Error("Cloudinary upload failed");
    const data = await res.json();
    return data.secure_url.replace('/upload/', '/upload/f_auto,q_auto,w_1000/');
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);
    setSuccess(false);

    const errors: Record<string, string> = {};
    if (!editingProduct && !mainImage) errors.mainImage = "Product Image is required";
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
      const isDuplicate = querySnapshot.docs.some(d => d.id !== editingProduct?.id);
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
      if (editingProduct) {
        await updateDoc(doc(db, "products", editingProduct.id), productData);
      } else {
        await addDoc(collection(db, "products"), { ...productData, createdAt: new Date() });
      }

      setSuccess(true);
      scrollToTop();
      
      // Reset form
      setEditingProduct(null);
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

  return (
    <div className="animate-fade-in">
      {globalError && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700 shadow-sm">
          <AlertCircle size={20} className="flex-shrink-0" />
          <p className="font-medium">{globalError}</p>
        </div>
      )}
      {success && !globalError && (
        <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-700 shadow-sm">
          <CheckCircle2 size={20} />
          <p>{editingProduct ? 'Product successfully updated!' : 'Product successfully added to inventory and Cloudinary!'}</p>
        </div>
      )}

      <form onSubmit={handleProductSubmit} className="space-y-10 bg-white/50 p-4 sm:p-8 rounded-2xl border border-charcoal/5 shadow-sm">
        
        <h2 className="text-2xl font-serif text-charcoal mb-6 border-b border-charcoal/10 pb-4">
          {editingProduct ? 'Update Existing Product' : 'Create New Product'}
        </h2>
        
        {/* ID & Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm uppercase tracking-wider text-charcoal/70 mb-2">Product ID (SKU)</label>
            <div className={`flex items-center border-b transition-colors ${formErrors.productId ? 'border-red-500' : 'border-charcoal/20 focus-within:border-[#C4A47C]'}`}>
              <span className="text-charcoal/50 font-serif text-xl pl-2 pr-1 pb-2">#</span>
              <input 
                type="number" placeholder="101" disabled={!!editingProduct}
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
              <span className="hidden sm:inline">{editingProduct ? 'Update Product' : 'Create Product & Add to Store'}</span>
              <span className="sm:hidden">{editingProduct ? 'Update Product' : 'Create Product'}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default AdminAddProduct;
