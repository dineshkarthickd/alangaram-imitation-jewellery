import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  getAdditionalUserInfo
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../config/firebase';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const resolveAdminStatus = async (user: User): Promise<boolean> => {
  try {
    const docSnap = await getDoc(doc(db, 'settings', 'admins'));
    if (docSnap.exists() && docSnap.data().emails) {
      const emails: string[] = docSnap.data().emails;
      return emails.includes(user.email!);
    }
    const defaultAdmins = [
      'dineshkarthick1610@gmail.com',
      'alangaramimitationjewellery@gmail.com'
    ];
    return defaultAdmins.includes(user.email!);
  } catch {
    return false;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [isWelcomeMounted, setIsWelcomeMounted] = useState(false);
  const [isWelcomeVisible, setIsWelcomeVisible] = useState(false);
  const [welcomeName, setWelcomeName] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);

  // Standard Popup Login - fixed by vercel.json COOP headers
  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        const additionalInfo = getAdditionalUserInfo(result);
        setIsNewUser(!!additionalInfo?.isNewUser);
        setWelcomeName(result.user.displayName?.split(' ')[0] || "there");
        setIsWelcomeMounted(true);
        setTimeout(() => setIsWelcomeVisible(true), 10);
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const closeWelcome = () => {
    setIsWelcomeVisible(false);
    setTimeout(() => setIsWelcomeMounted(false), 500);
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  // Auto-logout after 6 hours of inactivity
  const INACTIVITY_LIMIT_MS = 6 * 60 * 60 * 1000;
  const LAST_ACTIVE_KEY = 'alangaram_last_active';

  useEffect(() => {
    if (!currentUser) return;

    const updateActivity = () => {
      localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(e => window.addEventListener(e, updateActivity, { passive: true }));
    updateActivity();

    const interval = setInterval(() => {
      const lastActive = parseInt(localStorage.getItem(LAST_ACTIVE_KEY) || '0', 10);
      if (Date.now() - lastActive > INACTIVITY_LIMIT_MS) {
        localStorage.removeItem(LAST_ACTIVE_KEY);
        firebaseSignOut(auth);
      }
    }, 60 * 1000);

    return () => {
      events.forEach(e => window.removeEventListener(e, updateActivity));
      clearInterval(interval);
    };
  }, [currentUser, INACTIVITY_LIMIT_MS]);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user?.email) {
        const adminStatus = await resolveAdminStatus(user);
        setIsAdmin(adminStatus);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, loading, isAdmin, signInWithGoogle, signOut }}>
      {!loading && children}
      {isWelcomeMounted && (
        <div 
          className={`fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 transition-opacity duration-500 ease-in-out ${isWelcomeVisible ? 'opacity-100' : 'opacity-0'}`}
        >
          <div 
            className={`bg-[#FAF8F5] p-8 md:p-10 rounded-2xl shadow-2xl max-w-sm w-full text-center border border-charcoal/10 relative flex flex-col items-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isWelcomeVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}
          >
            <div className="w-16 h-16 md:w-20 md:h-20 bg-cream rounded-full border border-charcoal/10 shadow-sm overflow-hidden mb-4 md:mb-5">
              <img 
                src="/Mock-Images/Loader Image.png" 
                alt="Alangaram Logo" 
                className="w-full h-full object-contain p-3"
              />
            </div>
            <h2 className="font-serif text-2xl md:text-3xl text-charcoal mb-2">
              {isNewUser ? 'Welcome' : 'Welcome back'}, {welcomeName}!
            </h2>
            <p className="text-charcoal/70 text-[13px] md:text-sm mb-6 md:mb-8 font-light">
              {isNewUser 
                ? "We are delighted to have you. Enjoy a seamless experience as your wishlist and cart are now safely synced to your account."
                : "It is wonderful to see you again. Your wishlist and cart have been safely restored and are ready for you."}
            </p>
            <button 
              onClick={closeWelcome}
              className="btn-luxury btn-luxury-solid w-full py-2.5 md:py-3.5 text-xs md:text-sm"
            >
              Okay, let's explore
            </button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};
