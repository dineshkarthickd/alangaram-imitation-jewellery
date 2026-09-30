import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from './AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface CartItem {
  id: string | number;
  name: string;
  price: string;
  image: string;
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string | number) => void;
  updateQuantity: (id: string | number, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [isCloudSynced, setIsCloudSynced] = useState(false);

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('alangaram_cart');
    return saved ? JSON.parse(saved) : [];
  });

  // 1. Initial Sync when user logs in
  useEffect(() => {
    const syncWithCloud = async () => {
      if (currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const snap = await getDoc(userRef);
          const cloudData = snap.exists() ? snap.data().cart || [] : [];
          
          // Merge local and cloud data, preferring unique items by ID. 
          // If both have it, keep local quantity or sum? Just keep local.
          const localData = JSON.parse(localStorage.getItem('alangaram_cart') || '[]');
          const merged = [...cloudData];
          
          localData.forEach((localItem: CartItem) => {
            const existing = merged.find(c => c.id === localItem.id);
            if (!existing) {
              merged.push(localItem);
            } else {
              // Optionally merge quantities, but let's just use local overrides
              existing.quantity = Math.max(existing.quantity, localItem.quantity);
            }
          });

          setCartItems(merged);
          await setDoc(userRef, { cart: merged }, { merge: true });
          setIsCloudSynced(true);
        } catch (error) {
          console.error("Error syncing cart with cloud:", error);
        }
      } else {
        setIsCloudSynced(false);
      }
    };
    syncWithCloud();
  }, [currentUser]);

  // 2. Save changes to both LocalStorage and Cloud
  useEffect(() => {
    localStorage.setItem('alangaram_cart', JSON.stringify(cartItems));
    if (currentUser && isCloudSynced) {
      setDoc(doc(db, 'users', currentUser.uid), { cart: cartItems }, { merge: true }).catch(err => {
        console.error("Failed to save cart to cloud:", err);
      });
    }
  }, [cartItems, currentUser, isCloudSynced]);

  const addToCart = (product: Omit<CartItem, 'quantity'>) => {
    // Fire smooth luxury popper animation from BOTH sides using a single burst for buttery 60fps performance
    const confettiSettings = {
      particleCount: 100,
      spread: 80,
      startVelocity: 45,
      colors: ['#C4A47C', '#D4AF37', '#FAF8F5', '#36322E'],
      zIndex: 9999,
      disableForReducedMotion: true
    };

    // Left Cannon
    confetti({
      ...confettiSettings,
      angle: 60,
      origin: { x: 0, y: 0.8 }
    });
    
    // Right Cannon
    confetti({
      ...confettiSettings,
      angle: 120,
      origin: { x: 1, y: 0.8 }
    });

    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string | number) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string | number, quantity: number) => {
    if (quantity < 1) return;
    setCartItems(prev => prev.map(item => item.id === id ? { ...item, quantity } : item));
  };

  const clearCart = () => setCartItems([]);

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  // Helper to parse string prices like "₹ 4,999" into numbers for calculation
  const parsePrice = (priceStr: string) => parseInt(priceStr.replace(/\D/g, '')) || 0;
  
  const cartTotal = cartItems.reduce((total, item) => total + (parsePrice(item.price) * item.quantity), 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) throw new Error('useCart must be used within a CartProvider');
  return context;
};
