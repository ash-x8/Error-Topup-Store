import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Product, PaymentMethod, SiteSettings } from '../types';

export const INITIAL_PRODUCTS: Omit<Product, 'createdAt' | 'updatedAt'>[] = [
  // Memberships
  {
    id: 'ff-weekly-lite',
    name: 'Weekly Lite',
    category: 'membership',
    price: 130,
    originalPrice: 150,
    description: 'Instant 20 Diamonds + 10 Diamonds/Day for 7 days (Total 90 Diamonds).',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
    badge: 'Popular',
    diamonds: 90,
    active: true,
    sortOrder: 1,
  },
  {
    id: 'ff-weekly',
    name: 'Weekly',
    category: 'membership',
    price: 550,
    originalPrice: 650,
    description: 'Instant 100 Diamonds + 35 Diamonds/Day for 7 days + Special Discount Store & Icon.',
    image: 'https://images.unsplash.com/photo-1612287209262-a56f48a6464f?auto=format&fit=crop&w=400&q=80',
    badge: 'Best Seller',
    diamonds: 450,
    active: true,
    sortOrder: 2,
  },
  {
    id: 'ff-weekly-max',
    name: 'Weekly Max',
    category: 'membership',
    price: 660,
    originalPrice: 750,
    description: 'Weekly Membership + VIP Badge + 7-Day Custom Room Card Privileges.',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=400&q=80',
    badge: 'Hot Deal',
    diamonds: 520,
    active: true,
    sortOrder: 3,
  },
  {
    id: 'ff-monthly',
    name: 'Monthly',
    category: 'membership',
    price: 2730,
    originalPrice: 3200,
    description: 'Instant 500 Diamonds + 50 Diamonds/Day for 30 days (Total 2,600 Diamonds Value).',
    image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=400&q=80',
    badge: 'Best Value',
    diamonds: 2600,
    active: true,
    sortOrder: 4,
  },
  {
    id: 'ff-vip-membership',
    name: 'VIP Membership',
    category: 'membership',
    price: 3280,
    originalPrice: 3800,
    description: 'Combines Weekly + Monthly rewards simultaneously with Super VIP Perks & Extra Crates.',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80',
    badge: 'VIP Elite',
    diamonds: 3200,
    active: true,
    sortOrder: 5,
  },
  {
    id: 'ff-vip-max',
    name: 'VIP Max',
    category: 'membership',
    price: 3410,
    originalPrice: 4000,
    description: 'Enhanced VIP privileges, exclusive weapon loot crates, and double privilege claim tokens.',
    image: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=400&q=80',
    diamonds: 3400,
    active: true,
    sortOrder: 6,
  },
  {
    id: 'ff-s-vip',
    name: 'S VIP',
    category: 'membership',
    price: 4930,
    originalPrice: 5600,
    description: 'Super VIP status with unlimited lobby flex badge, bonus crates, and high-tier seasonal rewards.',
    image: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=400&q=80',
    badge: 'Pro Tier',
    diamonds: 4800,
    active: true,
    sortOrder: 7,
  },
  {
    id: 'ff-s-vip-max',
    name: 'S VIP Max',
    category: 'membership',
    price: 5450,
    originalPrice: 6200,
    description: 'The ultimate Free Fire tier: Max diamonds, all monthly benefits, room cards, and custom emotes.',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
    badge: 'Ultimate',
    diamonds: 5600,
    active: true,
    sortOrder: 8,
  },
  // Level Up Pass
  {
    id: 'ff-level-up-all',
    name: 'All Levels',
    category: 'level_up_pass',
    price: 1400,
    originalPrice: 1650,
    description: 'Unlock 802 Diamonds as your account levels up from Level 1 to Level 30. (One-time claim per account).',
    image: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=400&q=80',
    badge: '1x Only',
    diamonds: 802,
    active: true,
    sortOrder: 9,
  },
  // Topup Diamonds
  {
    id: 'ff-diamonds-100',
    name: '100 + 10 Bonus Diamonds',
    category: 'topup',
    price: 240,
    originalPrice: 280,
    description: 'Instant 100 Diamonds + 10 First Recharge Bonus Diamonds credited directly to your Player ID.',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80',
    diamonds: 110,
    active: true,
    sortOrder: 10,
  },
  {
    id: 'ff-diamonds-310',
    name: '310 + 31 Bonus Diamonds',
    category: 'topup',
    price: 720,
    originalPrice: 820,
    description: 'Instant 310 Diamonds + 31 Bonus Diamonds credited directly to your Player ID.',
    image: 'https://images.unsplash.com/photo-1612287209262-a56f48a6464f?auto=format&fit=crop&w=400&q=80',
    diamonds: 341,
    active: true,
    sortOrder: 11,
  },
  {
    id: 'ff-diamonds-520',
    name: '520 + 52 Bonus Diamonds',
    category: 'topup',
    price: 1200,
    originalPrice: 1350,
    description: 'Instant 520 Diamonds + 52 Bonus Diamonds credited directly to your Player ID.',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
    diamonds: 572,
    active: true,
    sortOrder: 12,
  },
  {
    id: 'ff-diamonds-1060',
    name: '1060 + 106 Bonus Diamonds',
    category: 'topup',
    price: 2400,
    originalPrice: 2700,
    description: 'Instant 1060 Diamonds + 106 Bonus Diamonds credited directly to your Player ID.',
    image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=400&q=80',
    badge: 'Popular Top-up',
    diamonds: 1166,
    active: true,
    sortOrder: 13,
  },
  {
    id: 'ff-diamonds-2180',
    name: '2180 + 218 Bonus Diamonds',
    category: 'topup',
    price: 4800,
    originalPrice: 5300,
    description: 'Instant 2180 Diamonds + 218 Bonus Diamonds credited directly to your Player ID.',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=400&q=80',
    diamonds: 2398,
    active: true,
    sortOrder: 14,
  }
];

export const INITIAL_PAYMENT_METHODS: Omit<PaymentMethod, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'ez-cash',
    name: 'EZ CASH Mobile Wallet',
    provider: 'EZ CASH',
    accountNumber: '0772472573',
    accountName: 'EZ CASH Store Agent',
    instructions: 'Send exact total amount to the EZ CASH number above via Dialog eZ Cash mobile wallet or retailer. Save the transaction SMS/receipt and upload below.',
    active: true,
    sortOrder: 1,
  },
  {
    id: 'bank-transfer',
    name: 'Bank Transfer (People\'s Bank)',
    provider: 'BANK',
    accountNumber: '137200280047635',
    accountName: 'JAYAKODY ARACHCHILAGE SASHMITHA SHARINDRA',
    bankName: 'People\'s Bank',
    instructions: 'Transfer exact total amount via online banking, mobile app, or Bank CDM deposit. Upload the payment receipt/slip screenshot below for instant verification.',
    active: true,
    sortOrder: 2,
  }
];

export const INITIAL_SITE_SETTINGS: SiteSettings = {
  websiteName: 'Free Fire Top-Up Store',
  tagline: 'Fast • Secure • 100% Ban-Proof Memberships & Diamonds',
  contactWhatsApp: '0772472573',
  announcement: '⚡ Special Promo: Weekly Pass & S VIP memberships on sale! Instant dispatch within 5-15 minutes.',
  announcementActive: true,
  heroTitle: 'Official Free Fire Top-Up & Membership Store',
  heroSubtitle: 'Instant automated delivery for Weekly Lite, Weekly, Monthly, Level Up Passes & Diamonds directly to your Player UID.',
  aboutText: 'The official trusted Free Fire store. We deliver 100% legitimate memberships and top-up diamonds with official server confirmation and 24/7 WhatsApp customer care.',
  footerText: '© 2026 Free Fire Top-Up Store. All Free Fire trademarks and logos belong to Garena.',
  maintenanceMode: false,
  currencySymbol: 'Rs.',
  currencyCode: 'LKR',
};

export async function ensureDatabaseInitialized(): Promise<void> {
  try {
    // 1. Check & Seed Products
    const productsRef = collection(db, 'products');
    const productSnap = await getDocs(productsRef);
    if (productSnap.empty) {
      console.log('Seeding initial products to Cloud Firestore...');
      for (const prod of INITIAL_PRODUCTS) {
        await setDoc(doc(db, 'products', prod.id), {
          ...prod,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // 2. Check & Seed Payment Methods
    const paymentRef = collection(db, 'paymentMethods');
    const paymentSnap = await getDocs(paymentRef);
    if (paymentSnap.empty) {
      console.log('Seeding initial payment methods to Cloud Firestore...');
      for (const pm of INITIAL_PAYMENT_METHODS) {
        await setDoc(doc(db, 'paymentMethods', pm.id), {
          ...pm,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // 3. Check & Seed Site Settings
    const settingsDocRef = doc(db, 'siteSettings', 'general');
    const settingsSnap = await getDoc(settingsDocRef);
    if (!settingsSnap.exists()) {
      console.log('Seeding initial site settings to Cloud Firestore...');
      await setDoc(settingsDocRef, INITIAL_SITE_SETTINGS);
    }
  } catch (error) {
    console.warn('Database initialization check warning:', error);
  }
}
