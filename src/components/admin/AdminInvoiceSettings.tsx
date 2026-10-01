import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Loader2, CheckCircle2 } from 'lucide-react';

const AdminInvoiceSettings = () => {
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Invoice Settings
  const [invBusinessName, setInvBusinessName] = useState('Alangaram Imitation Jewellery');
  const [invAddress, setInvAddress] = useState('');
  const [invGst, setInvGst] = useState('');
  const [invPan, setInvPan] = useState('');
  const [invSignatory, setInvSignatory] = useState('Authorized Signatory');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const invoiceSnap = await getDoc(doc(db, 'settings', 'invoice'));
        if (invoiceSnap.exists()) {
          const data = invoiceSnap.data();
          if (data.businessName) setInvBusinessName(data.businessName);
          if (data.address) setInvAddress(data.address);
          if (data.gstNumber) setInvGst(data.gstNumber);
          if (data.panNumber) setInvPan(data.panNumber);
          if (data.signatoryName) setInvSignatory(data.signatoryName);
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

    try {
      await setDoc(doc(db, "settings", "invoice"), {
        businessName: invBusinessName.trim(),
        address: invAddress.trim(),
        gstNumber: invGst.trim(),
        panNumber: invPan.trim(),
        signatoryName: invSignatory.trim(),
        updatedAt: new Date()
      });
      
      setSettingsSuccess(true);
      scrollToTop();
    } catch (error) {
      console.error(error);
      setGlobalError("Failed to save invoice settings to database.");
      scrollToTop();
    } finally {
      setSettingsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6 md:space-y-8 bg-white/50 p-4 md:p-8 rounded-xl md:rounded-2xl border border-charcoal/5 shadow-sm">
      <div>
        <h2 className="text-lg md:text-2xl font-serif text-charcoal mb-1 md:mb-2">Invoice Settings</h2>
        <p className="text-charcoal/60 text-[10px] md:text-sm mb-4 md:mb-6">Configure the business details printed on customer PDF invoices.</p>
      </div>

      {globalError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
          <p>{globalError}</p>
        </div>
      )}

      {settingsSuccess && !globalError && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-700">
          <CheckCircle2 size={20} />
          <p>Invoice settings successfully updated!</p>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-12 min-w-0">
        <div className="min-w-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 min-w-0 mb-4">
            <div className="min-w-0">
              <label className="block text-[10px] md:text-sm uppercase tracking-wider text-charcoal/70 mb-2">Business Name</label>
              <input type="text" value={invBusinessName} onChange={(e) => setInvBusinessName(e.target.value)}
                className="w-full bg-transparent border-b border-charcoal/20 py-2 md:py-3 outline-none focus:border-[#C4A47C] transition-colors text-[10px] md:text-sm"
                placeholder="Alangaram Imitation Jewellery"
              />
            </div>
            <div className="min-w-0">
              <label className="block text-[10px] md:text-sm uppercase tracking-wider text-charcoal/70 mb-2">Authorized Signatory Name</label>
              <input type="text" value={invSignatory} onChange={(e) => setInvSignatory(e.target.value)}
                className="w-full bg-transparent border-b border-charcoal/20 py-2 md:py-3 outline-none focus:border-[#C4A47C] transition-colors text-[10px] md:text-sm"
                placeholder="Authorized Signatory"
              />
            </div>
          </div>

          <div className="min-w-0 mb-4">
            <label className="block text-[10px] md:text-sm uppercase tracking-wider text-charcoal/70 mb-2">Full Business Address</label>
            <textarea value={invAddress} onChange={(e) => setInvAddress(e.target.value)} rows={3}
              className="w-full bg-transparent border-b border-charcoal/20 py-2 md:py-3 outline-none focus:border-[#C4A47C] transition-colors text-[10px] md:text-sm resize-none"
              placeholder="50 Thilagar Street, Adivaram, Palani..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 min-w-0">
            <div className="min-w-0">
              <label className="block text-[10px] md:text-sm uppercase tracking-wider text-charcoal/70 mb-2">GST Number (Optional)</label>
              <input type="text" value={invGst} onChange={(e) => setInvGst(e.target.value)}
                className="w-full bg-transparent border-b border-charcoal/20 py-2 md:py-3 outline-none focus:border-[#C4A47C] transition-colors text-[10px] md:text-sm uppercase"
                placeholder="22AAAAA0000A1Z5"
              />
            </div>
            <div className="min-w-0">
              <label className="block text-[10px] md:text-sm uppercase tracking-wider text-charcoal/70 mb-2">PAN Number (Optional)</label>
              <input type="text" value={invPan} onChange={(e) => setInvPan(e.target.value)}
                className="w-full bg-transparent border-b border-charcoal/20 py-2 md:py-3 outline-none focus:border-[#C4A47C] transition-colors text-[10px] md:text-sm uppercase"
                placeholder="ABCDE1234F"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-charcoal/10 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-[10px] md:text-xs text-charcoal/60">This information will be instantly applied to all generated PDF invoices.</p>
          <button
            type="submit"
            disabled={settingsLoading}
            className="w-full sm:w-auto bg-[#C4A47C] text-white px-8 py-3 rounded hover:bg-[#A38766] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-[10px] md:text-sm font-medium"
          >
            {settingsLoading ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : 'Save Invoice Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminInvoiceSettings;
