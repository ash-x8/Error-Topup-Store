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
  | 'Payment Under Review'
  | 'Processing'
  | 'Completed'
  | 'Rejected'
  | 'Failed'
  | 'Cancelled'
  | 'Refunded'
  | 'PENDING'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_REVIEW'
  | 'FAILED'
  | 'REFUNDED';

export type EmailStatus = 'Sent' | 'Failed' | 'Pending' | 'Skipped' | 'None';

export interface OrderNotificationRecord {
  id?: string;
  type: 'admin_new_order' | 'admin_payment_proof' | 'customer_confirmation' | 'customer_status_update' | 'admin_alert';
  recipient: string;
  subject: string;
  status: 'Sent' | 'Failed' | 'Simulated';
  sentAt: string;
  messageId?: string;
  error?: string;
}

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
  customerEmail?: string;
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
  customerEmailStatus?: EmailStatus;
  customerEmailMessageId?: string;
  customerEmailError?: string;
  lastCustomerNotifiedStatus?: string;
  notificationHistory?: OrderNotificationRecord[];
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
