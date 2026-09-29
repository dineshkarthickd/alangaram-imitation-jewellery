import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { Loader2, CheckCircle2 } from 'lucide-react';

const AdminStoreSettings = () => {
  const { currentUser } = useAuth();
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [settingsErrors, setSettingsErrors] = useState<Record<string, string>>({});

  const [bannerText, setBannerText] = useState('Loading...');
  const [bannerDesign, setBannerDesign] = useState<1 | 2 | 3 | 4>(1);
  const [adminEmail1, setAdminEmail1] = useState('');
  const [adminEmail2, setAdminEmail2] = useState('');
  const [upiId, setUpiId] = useState('');
  const [payeeName, setPayeeName] = useState('');

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

        const paymentSnap = await getDoc(doc(db, 'settings', 'payment'));
        if (paymentSnap.exists()) {
          if (paymentSnap.data().upiId) setUpiId(paymentSnap.data().upiId);
          if (paymentSnap.data().payeeName) setPayeeName(paymentSnap.data().payeeName);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);

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
      await setDoc(doc(db, "settings", "payment"), { upiId: upiId.trim(), payeeName: payeeName.trim(), updatedAt: new Date() });
      await setDoc(doc(db, "settings", "banner"), { text: bannerText, design: bannerDesign, updatedAt: new Date() });
      
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

  return (
    <div className="animate-fade-in space-y-8 bg-white/50 p-8 rounded-2xl border border-charcoal/5 shadow-sm">
      <div>
        <h2 className="text-2xl font-serif text-charcoal mb-2">Store Settings</h2>
        <p className="text-charcoal/60 text-sm mb-6">Manage global store configurations and admin access.</p>
      </div>

      {globalError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
          <p>{globalError}</p>
        </div>
      )}

      {settingsSuccess && !globalError && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-700">
          <CheckCircle2 size={20} />
          <p>Store settings successfully updated!</p>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-12">
        {/* Payment Settings Section */}
        <div>
          <h3 className="text-lg font-serif text-charcoal mb-4 border-b border-charcoal/10 pb-2">Payment Settings (GPay UPI)</h3>
          <p className="text-sm text-charcoal/60 mb-6">Configure the exact UPI ID and registered Name for receiving payments.</p>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm uppercase tracking-wider text-charcoal/70 mb-2">UPI ID</label>
              <input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)}
                className="w-full bg-transparent border-b border-charcoal/20 py-3 outline-none focus:border-[#C4A47C] transition-colors"
                placeholder="yourname@okbank"
              />
            </div>
            <div>
              <label className="block text-sm uppercase tracking-wider text-charcoal/70 mb-2">Payee Name</label>
              <input type="text" value={payeeName} onChange={(e) => setPayeeName(e.target.value)}
                className="w-full bg-transparent border-b border-charcoal/20 py-3 outline-none focus:border-[#C4A47C] transition-colors"
                placeholder="Alangaram Jewellery"
              />
            </div>
          </div>
        </div>
        {/* Admin Access Section */}
        <div>
          <h3 className="text-lg font-serif text-charcoal mb-4 border-b border-charcoal/10 pb-2">Admin Dashboard Access</h3>
          <p className="text-sm text-charcoal/60 mb-6">Specify up to 2 Google accounts that are authorized to access this dashboard.</p>
          
          <div className="grid grid-cols-2 gap-6">
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
              <div className="grid grid-cols-2 gap-4">
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
  );
};

export default AdminStoreSettings;
