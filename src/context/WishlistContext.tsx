import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface WishlistItem {
  id: string;
  name: string;
  price: string;
  image: string;
  basePrice?: string;
  hasOffer?: boolean;
  offerPercentage?: number;
  stock?: number;
}

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: string) => void;
  isInWishlist: (id: string) => boolean;
  wishlistCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useAuth();
  const [isCloudSynced, setIsCloudSynced] = useState(false);

  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>(() => {
    const saved = localStorage.getItem('alangaram_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  // 1. Initial Sync when user logs in
  useEffect(() => {
    const syncWithCloud = async () => {
      if (currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const snap = await getDoc(userRef);
          const cloudData = snap.exists() ? snap.data().wishlist || [] : [];
          
          // Merge local and cloud data, preferring unique items by ID
          const localData = JSON.parse(localStorage.getItem('alangaram_wishlist') || '[]');
          const merged = [...cloudData];
          
          localData.forEach((localItem: WishlistItem) => {
            if (!merged.find(c => c.id === localItem.id)) {
              merged.push(localItem);
            }
          });

          setWishlistItems(merged);
          // Save merged data back to cloud
          await setDoc(userRef, { wishlist: merged }, { merge: true });
          setIsCloudSynced(true);
        } catch (error) {
          console.error("Error syncing wishlist with cloud:", error);
        }
      } else {
        setIsCloudSynced(false);
      }
    };
    syncWithCloud();
  }, [currentUser]);

  // 2. Save changes to both LocalStorage and Cloud (if logged in & synced)
  useEffect(() => {
    localStorage.setItem('alangaram_wishlist', JSON.stringify(wishlistItems));
    if (currentUser && isCloudSynced) {
      setDoc(doc(db, 'users', currentUser.uid), { wishlist: wishlistItems }, { merge: true }).catch(err => {
        console.error("Failed to save wishlist to cloud:", err);
      });
    }
  }, [wishlistItems, currentUser, isCloudSynced]);

  const addToWishlist = (item: WishlistItem) => {
    setWishlistItems(prev => {
      if (prev.find(i => i.id === item.id)) return prev;
      return [...prev, item];
    });
  };

  const removeFromWishlist = (id: string) => {
    setWishlistItems(prev => prev.filter(item => item.id !== id));
  };

  const isInWishlist = (id: string) => {
    return wishlistItems.some(item => item.id === id);
  };

  return (
    <WishlistContext.Provider value={{ 
      wishlistItems, 
      addToWishlist, 
      removeFromWishlist, 
      isInWishlist,
      wishlistCount: wishlistItems.length
    }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
