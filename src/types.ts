export type ProductCategory = 'membership' | 'level_up_pass' | 'topup';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  originalPrice?: number;
  description: string;
  image: string;
  badge?: string;
  diamonds?: number;
  active: boolean;
  featured?: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface PaymentMethod {
  id: string;
  name: string;
  provider: 'EZ CASH' | 'BANK' | 'CRYPTO' | 'CUSTOM';
  accountNumber: string;
  phoneNumber?: string;
  accountName?: string;
  bankName?: string;
  instructions: string;
  icon?: string;
  active: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export type OrderStatus =
  | 'Pending Payment Verification'
  | 'Payment Received'
  | 'Processing'
  | 'Completed'
  | 'Rejected'
  | 'Cancelled';

export type EmailStatus = 'Sent' | 'Failed' | 'Pending';

export interface OrderItemSnapshot {
  productId: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  subtotal?: number;
  diamonds?: number;
}

export interface Order {
  id: string;
  orderId: string;
  customerName: string;
  customerWhatsApp: string;
  playerId: string;
  nickname?: string;
  items: OrderItemSnapshot[];
  subtotal: number;
  total: number;
  paymentMethodId: string;
  paymentMethodName: string;
  paymentDetailsSnapshot: {
    provider: string;
    accountNumber: string;
    accountName?: string;
    bankName?: string;
  };
  receiptUrl: string;
  receiptPublicId?: string;
  receiptFileName?: string;
  receiptFileSize?: number;
  status: OrderStatus;
  adminNote?: string;
  emailNotificationStatus: EmailStatus;
  emailMessageId?: string;
  emailError?: string;
  idempotencyKey?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SiteSettings {
  websiteName: string;
  tagline: string;
  contactWhatsApp: string;
  announcement: string;
  announcementActive: boolean;
  heroTitle: string;
  heroSubtitle: string;
  aboutText: string;
  footerText: string;
  maintenanceMode: boolean;
  currencySymbol: string;
  currencyCode: string;
  logo?: string;
  favicon?: string;
  heroDescription?: string;
  supportWhatsApp?: string;
  socialLinks?: {
    facebook?: string;
    youtube?: string;
    discord?: string;
    tiktok?: string;
  };
}

export interface AdminUser {
  uid: string;
  email: string;
  role: 'superadmin' | 'admin';
  active: boolean;
  createdAt: string;
}
