import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../config/firebase';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => void;
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

// Detect mobile browsers — popups are blocked on mobile
const isMobile = () => /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

const resolveAdminStatus = async (user: User): Promise<boolean> => {
  try {
    const docSnap = await getDoc(doc(db, 'settings', 'admins'));
    if (docSnap.exists() && docSnap.data().emails) {
      const emails: string[] = docSnap.data().emails;
      return emails.includes(user.email!);
    }
    // Fallback if DB doc doesn't exist yet
    const defaultAdmins = [
      'dineshkarthick1610@gmail.com',
      'alangarmimitationjewellery@gmail.com',
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

  // Sign in with Google — popup on desktop, redirect on mobile
  const signInWithGoogle = () => {
    try {
      if (isMobile()) {
        // Mobile: full-page redirect — don't await, page navigates away
        signInWithRedirect(auth, googleProvider);
      } else {
        signInWithPopup(auth, googleProvider);
      }
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  // On mount: resolve any pending redirect sign-in result (mobile flow)
  useEffect(() => {
    getRedirectResult(auth).catch((error) => {
      // Only log real errors, not the "no redirect" case
      if (error?.code !== 'auth/null-user') {
        console.error("Redirect sign-in error:", error);
      }
    });
  }, []);

  // Auto-logout after 6 hours of inactivity
  const INACTIVITY_LIMIT_MS = 6 * 60 * 60 * 1000; // 6 hours
  const LAST_ACTIVE_KEY = 'alangaram_last_active';

  useEffect(() => {
    if (!currentUser) return;

    // Record activity timestamp on any meaningful user interaction
    const updateActivity = () => {
      localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(e => window.addEventListener(e, updateActivity, { passive: true }));

    // Seed initial activity when user logs in
    updateActivity();

    // Check inactivity every 60 seconds
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
  }, [currentUser]);

  // Listen to auth state changes
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

  const value = {
    currentUser,
    loading,
    isAdmin,
    signInWithGoogle,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
