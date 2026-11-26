import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { Loader2, CheckCircle2, Send, Bot, AlertCircle } from 'lucide-react';

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

  // Dynamic Telegram Notification Keys
  const [telegramBotToken, setTelegramBotToken] = useState('9266471231:AAEFxlYJeyMItwIPJ5HikNHBxUBc8zYJLmg');
  const [telegramChatId, setTelegramChatId] = useState('7232146507');
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [testTelegramResult, setTestTelegramResult] = useState<{ success: boolean; message: string } | null>(null);

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

        const telegramSnap = await getDoc(doc(db, 'settings', 'telegram'));
        if (telegramSnap.exists()) {
          const tData = telegramSnap.data();
          if (tData.botToken) setTelegramBotToken(tData.botToken);
          if (tData.chatId) setTelegramChatId(tData.chatId);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const handleSendTestTelegram = async () => {
    if (!telegramBotToken.trim() || !telegramChatId.trim()) {
      setTestTelegramResult({ success: false, message: 'Please enter both Bot Token and Chat ID to test.' });
      return;
    }

    setIsTestingTelegram(true);
    setTestTelegramResult(null);

    try {
      const res = await fetch('/api/send-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testAlert: true,
          customBotToken: telegramBotToken.trim(),
          customChatId: telegramChatId.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestTelegramResult({ success: true, message: 'Test alert sent! Check your Telegram app.' });
      } else {
        setTestTelegramResult({ success: false, message: data.error || 'Failed to send test alert. Check token and chat ID.' });
      }
    } catch (err: any) {
      setTestTelegramResult({ success: false, message: err.message || 'Network error sending test alert.' });
    } finally {
      setIsTestingTelegram(false);
    }
  };

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
      await setDoc(doc(db, "settings", "banner"), { text: bannerText, design: bannerDesign, updatedAt: new Date() });
      
      const emails = [adminEmail1.trim(), adminEmail2.trim()].filter(Boolean);
      if (emails.length === 0) {
        emails.push(currentUser?.email || 'dineshkarthick1610@gmail.com');
        setAdminEmail1(emails[0]);
      }
      await setDoc(doc(db, "settings", "admins"), { emails, updatedAt: new Date() });

      // Save dynamic Telegram credentials
      await setDoc(doc(db, "settings", "telegram"), {
        botToken: telegramBotToken.trim(),
        chatId: telegramChatId.trim(),
        updatedAt: new Date()
      });
      
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
    <div className="animate-fade-in space-y-6 md:space-y-8 bg-white/50 p-4 md:p-8 rounded-xl md:rounded-2xl border border-charcoal/5 shadow-sm">
      <div>
        <h2 className="text-lg md:text-2xl font-serif text-charcoal mb-1 md:mb-2">Store Settings</h2>
        <p className="text-charcoal/60 text-[10px] md:text-sm mb-4 md:mb-6">Manage global store configurations and admin access.</p>
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

      <form onSubmit={handleSaveSettings} className="space-y-12 min-w-0">
        {/* Admin Access Section */}
        <div className="min-w-0">
          <h3 className="text-lg font-serif text-charcoal mb-4 border-b border-charcoal/10 pb-2">Admin Dashboard Access</h3>
          <p className="text-[10px] md:text-sm text-charcoal/60 mb-6">Specify up to 2 Google accounts that are authorized to access this dashboard.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 min-w-0">
            <div className="min-w-0">
              <label className="block text-[10px] md:text-sm uppercase tracking-wider text-charcoal/70 mb-2">Primary Admin Email</label>
              <input type="email" value={adminEmail1} onChange={(e) => { setAdminEmail1(e.target.value); setSettingsErrors({...settingsErrors, adminEmail1: ''}); }}
                className={`w-full bg-transparent border-b py-2 md:py-3 outline-none transition-colors text-[10px] md:text-sm ${settingsErrors.adminEmail1 ? 'border-red-500' : 'border-charcoal/20 focus:border-[#C4A47C]'}`}
                placeholder="admin@gmail.com"
              />
              {settingsErrors.adminEmail1 && <p className="text-red-500 text-[10px] md:text-xs mt-1.5 animate-fade-in font-medium">{settingsErrors.adminEmail1}</p>}
            </div>
            <div className="min-w-0">
              <label className="block text-[10px] md:text-sm uppercase tracking-wider text-charcoal/70 mb-2">Secondary Admin Email (Optional)</label>
              <input type="email" value={adminEmail2} onChange={(e) => setAdminEmail2(e.target.value)}
                className="w-full bg-transparent border-b border-charcoal/20 py-2 md:py-3 outline-none focus:border-[#C4A47C] transition-colors text-[10px] md:text-sm"
                placeholder="co-owner@gmail.com"
              />
            </div>
          </div>
        </div>

        {/* Banner Section */}
        <div className="min-w-0">
          <h3 className="text-lg font-serif text-charcoal mb-4 border-b border-charcoal/10 pb-2">Offer Banner Alternation</h3>
          <div className="space-y-4 md:space-y-8 mt-4 min-w-0">
            <div className="min-w-0">
              <label className="block text-[10px] md:text-sm uppercase tracking-wider text-charcoal/70 mb-2 md:mb-3">Banner Text</label>
              <input type="text" value={bannerText} onChange={(e) => { setBannerText(e.target.value); setSettingsErrors({...settingsErrors, bannerText: ''}); }}
                className={`w-full bg-transparent border-b py-2 md:py-3 outline-none transition-colors text-[10px] md:text-sm ${settingsErrors.bannerText ? 'border-red-500' : 'border-charcoal/20 focus:border-[#C4A47C]'}`}
              />
              {settingsErrors.bannerText && <p className="text-red-500 text-[10px] md:text-xs mt-1.5 animate-fade-in font-medium">{settingsErrors.bannerText}</p>}
            </div>
            <div className="min-w-0">
              <label className="block text-[10px] md:text-sm uppercase tracking-wider text-charcoal/70 mb-3 md:mb-4">Select Design Palette</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 min-w-0">
                <button type="button" onClick={() => setBannerDesign(1)} className={`p-2 md:p-4 rounded-xl border-2 transition-all ${bannerDesign === 1 ? 'border-[#C4A47C]' : 'border-transparent bg-white hover:border-charcoal/20'}`}>
                  <div className="w-full h-10 bg-[#3F3A36] text-[#C4A47C] flex items-center justify-center text-[10px] md:text-xs tracking-widest font-sans rounded-md text-center p-2">CHARCOAL & GOLD</div>
                </button>
                <button type="button" onClick={() => setBannerDesign(2)} className={`p-2 md:p-4 rounded-xl border-2 transition-all ${bannerDesign === 2 ? 'border-[#C4A47C]' : 'border-transparent bg-white hover:border-charcoal/20'}`}>
                  <div className="w-full h-10 bg-[#C4A47C] text-white flex items-center justify-center text-[10px] md:text-xs tracking-widest font-sans rounded-md text-center p-2">SOLID GOLD</div>
                </button>
                <button type="button" onClick={() => setBannerDesign(3)} className={`p-2 md:p-4 rounded-xl border-2 transition-all ${bannerDesign === 3 ? 'border-[#C4A47C]' : 'border-transparent bg-white hover:border-charcoal/20'}`}>
                  <div className="w-full h-10 bg-[#F0EBE1] border-y border-[#C4A47C] text-[#3F3A36] flex items-center justify-center text-[10px] md:text-xs tracking-widest font-sans rounded-md text-center p-2">CREAM BORDERED</div>
                </button>
                <button type="button" onClick={() => setBannerDesign(4)} className={`p-2 md:p-4 rounded-xl border-2 transition-all ${bannerDesign === 4 ? 'border-[#C4A47C]' : 'border-transparent bg-white hover:border-charcoal/20'}`}>
                  <div className="w-full h-10 bg-transparent border-y border-[#3F3A36] text-[#3F3A36] flex items-center justify-center text-[10px] md:text-xs tracking-widest font-sans rounded-md text-center p-2">MINIMALIST CLEAR</div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Telegram Order Alerts Section */}
        <div className="min-w-0 p-4 md:p-6 bg-[#C4A47C]/5 border border-[#C4A47C]/20 rounded-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-charcoal/10 pb-3">
            <Bot className="text-[#C4A47C]" size={22} />
            <div>
              <h3 className="text-lg font-serif text-charcoal">Telegram Order Alerts</h3>
              <p className="text-[10px] md:text-xs text-charcoal/60">Configure or dynamically switch the Telegram Bot and Chat receiving live customer order notifications.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 min-w-0">
            <div className="min-w-0">
              <label className="block text-[10px] md:text-sm uppercase tracking-wider text-charcoal/70 mb-2">Telegram Bot Token</label>
              <input 
                type="text" 
                value={telegramBotToken} 
                onChange={(e) => setTelegramBotToken(e.target.value)}
                className="w-full bg-white/70 border border-charcoal/20 rounded-lg px-3 py-2 md:py-2.5 outline-none focus:border-[#C4A47C] transition-colors text-[11px] md:text-sm font-mono"
                placeholder="e.g. 9266471231:AAEFxlYJeyM..."
              />
              <p className="text-[9px] md:text-[11px] text-charcoal/50 mt-1">From @BotFather on Telegram</p>
            </div>

            <div className="min-w-0">
              <label className="block text-[10px] md:text-sm uppercase tracking-wider text-charcoal/70 mb-2">Telegram Chat ID</label>
              <input 
                type="text" 
                value={telegramChatId} 
                onChange={(e) => setTelegramChatId(e.target.value)}
                className="w-full bg-white/70 border border-charcoal/20 rounded-lg px-3 py-2 md:py-2.5 outline-none focus:border-[#C4A47C] transition-colors text-[11px] md:text-sm font-mono"
                placeholder="e.g. 7232146507"
              />
              <p className="text-[9px] md:text-[11px] text-charcoal/50 mt-1">Your user or channel ID from @userinfobot</p>
            </div>
          </div>

          {/* Test Alert Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
            <button
              type="button"
              disabled={isTestingTelegram || !telegramBotToken.trim() || !telegramChatId.trim()}
              onClick={handleSendTestTelegram}
              className="px-4 py-2 bg-white border border-[#C4A47C] text-[#C4A47C] hover:bg-[#C4A47C] hover:text-white rounded-lg text-xs md:text-sm font-medium transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              {isTestingTelegram ? (
                <><Loader2 className="animate-spin" size={14} /> Sending Test Alert...</>
              ) : (
                <><Send size={14} /> Send Test Alert to Telegram</>
              )}
            </button>

            {testTelegramResult && (
              <div className={`text-xs md:text-sm flex items-center gap-1.5 font-medium animate-fade-in ${testTelegramResult.success ? 'text-green-600' : 'text-red-600'}`}>
                {testTelegramResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{testTelegramResult.message}</span>
              </div>
            )}
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
