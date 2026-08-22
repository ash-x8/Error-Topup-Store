import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, User, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { Product, PaymentMethod, SiteSettings, Order, AdminUser } from '../types';
import { ensureDatabaseInitialized, INITIAL_PRODUCTS, INITIAL_PAYMENT_METHODS, INITIAL_SITE_SETTINGS } from '../lib/seedDatabase';

interface StoreContextType {
  products: Product[];
  paymentMethods: PaymentMethod[];
  siteSettings: SiteSettings;
  orders: Order[];
  isLoading: boolean;
  user: User | null;
  isAdmin: boolean;
  adminProfile: AdminUser | null;
  loginAdmin: (email: string, pass: string) => Promise<void>;
  logoutAdmin: () => Promise<void>;
  currencySymbol: string;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS as Product[]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(INITIAL_PAYMENT_METHODS as PaymentMethod[]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(INITIAL_SITE_SETTINGS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminProfile, setAdminProfile] = useState<AdminUser | null>(null);

  // Initialize DB and listen to Auth state
  useEffect(() => {
    ensureDatabaseInitialized();

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const adminDocRef = doc(db, 'admins', currentUser.uid);
          const adminSnap = await getDoc(adminDocRef);
          if (adminSnap.exists()) {
            const data = adminSnap.data() as AdminUser;
            setAdminProfile(data);
            setIsAdmin(data.active === true && (data.role === 'admin' || data.role === 'superadmin'));
          } else {
            // First time admin profile auto-initialization
            const initialAdmin: AdminUser = {
              uid: currentUser.uid,
              email: currentUser.email || 'admin@ffstore.lk',
              role: 'admin',
              active: true,
              createdAt: new Date().toISOString(),
            };
            await setDoc(adminDocRef, initialAdmin);
            setAdminProfile(initialAdmin);
            setIsAdmin(true);
          }
        } catch (err) {
          console.warn('Admin authorization doc verification:', err);
          setIsAdmin(true);
        }
      } else {
        setAdminProfile(null);
        setIsAdmin(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // 1. Real-time Products Listener from Cloud Firestore
  useEffect(() => {
    try {
      const q = query(collection(db, 'products'), orderBy('sortOrder', 'asc'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const prods: Product[] = [];
            snapshot.forEach((docSnap) => {
              prods.push({ id: docSnap.id, ...docSnap.data() } as Product);
            });
            setProducts(prods);
          }
          setIsLoading(false);
        },
        (error) => {
          console.warn('Products snapshot listener fallback:', error);
          setIsLoading(false);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.warn('Products query initialization error:', err);
      setIsLoading(false);
    }
  }, []);

  // 2. Real-time Payment Methods Listener from Cloud Firestore
  useEffect(() => {
    try {
      const q = query(collection(db, 'paymentMethods'), orderBy('sortOrder', 'asc'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const pms: PaymentMethod[] = [];
            snapshot.forEach((docSnap) => {
              pms.push({ id: docSnap.id, ...docSnap.data() } as PaymentMethod);
            });
            setPaymentMethods(pms);
          }
        },
        (error) => {
          console.warn('Payment methods snapshot listener fallback:', error);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.warn('Payment methods query error:', err);
    }
  }, []);

  // 3. Real-time Site Settings Listener from Cloud Firestore
  useEffect(() => {
    try {
      const docRef = doc(db, 'siteSettings', 'general');
      const unsubscribe = onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            setSiteSettings(docSnap.data() as SiteSettings);
          }
        },
        (error) => {
          console.warn('Site settings snapshot listener fallback:', error);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.warn('Site settings doc ref error:', err);
    }
  }, []);

  // 4. Real-time Orders Listener from Cloud Firestore
  useEffect(() => {
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const ords: Order[] = [];
          snapshot.forEach((docSnap) => {
            ords.push({ id: docSnap.id, ...docSnap.data() } as Order);
          });
          setOrders(ords);
        },
        (error) => {
          console.warn('Orders snapshot listener fallback:', error);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.warn('Orders query error:', err);
    }
  }, []);

  const loginAdmin = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const logoutAdmin = async () => {
    await signOut(auth);
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        paymentMethods,
        siteSettings,
        orders,
        isLoading,
        user,
        isAdmin,
        adminProfile,
        loginAdmin,
        logoutAdmin,
        currencySymbol: siteSettings.currencySymbol || 'Rs.',
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
