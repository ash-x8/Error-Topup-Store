import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Product, PaymentMethod, Order, OrderStatus, ProductCategory, SiteSettings } from '../types';
import { formatLKR, formatDateTime } from '../utils/formatters';
import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { 
  Lock, 
  X, 
  LayoutDashboard, 
  Package, 
  CreditCard, 
  ShoppingBag, 
  Settings, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ExternalLink, 
  RotateCw, 
  DollarSign, 
  TrendingUp, 
  ShieldCheck, 
  Loader2,
  LogOut,
  Save
} from 'lucide-react';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  currencySymbol: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  currencySymbol,
}) => {
  const {
    products,
    paymentMethods,
    siteSettings,
    orders,
    isAdmin,
    loginAdmin,
    logoutAdmin,
  } = useStore();

  // Navigation tab in Admin
  const [activeAdminTab, setActiveAdminTab] = useState<'overview' | 'orders' | 'products' | 'payments' | 'settings'>('overview');

  // Auth form states
  const [authEmail, setAuthEmail] = useState('admin@ffstore.lk');
  const [authPassword, setAuthPassword] = useState('admin123456');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Orders Tab Filter & Search
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<Order | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
  const [isRetryingEmail, setIsRetryingEmail] = useState(false);
  const [emailSuccessBanner, setEmailSuccessBanner] = useState<string | null>(null);

  // Product Modal Edit / Add states
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Payment Method Edit / Add states
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<Partial<PaymentMethod> | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Site Settings Form state
  const [settingsForm, setSettingsForm] = useState<SiteSettings>(siteSettings);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSuccessBanner, setSettingsSuccessBanner] = useState(false);

  // Sync settings form when siteSettings updates
  React.useEffect(() => {
    setSettingsForm(siteSettings);
  }, [siteSettings]);

  if (!isOpen) return null;

  // Handle Admin Login or Auto-create master account if first time
  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      try {
        await loginAdmin(authEmail.trim(), authPassword.trim());
      } catch (loginErr: any) {
        // If user not found, create the default admin account
        if (loginErr.code === 'auth/user-not-found' || loginErr.code === 'auth/invalid-credential') {
          try {
            await createUserWithEmailAndPassword(auth, authEmail.trim(), authPassword.trim());
          } catch (createErr: any) {
            throw loginErr;
          }
        } else {
          throw loginErr;
        }
      }
    } catch (err: any) {
      console.error('Admin login error:', err);
      setAuthError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  // 1. ANALYTICS CALCULATIONS
  const pendingOrders = orders.filter((o) => o.status === 'Pending Payment Verification');
  const processingOrders = orders.filter((o) => o.status === 'Processing');
  const completedOrders = orders.filter((o) => o.status === 'Completed');
  const rejectedOrders = orders.filter((o) => o.status === 'Rejected' || o.status === 'Cancelled');

  const todayIsoPrefix = new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter((o) => o.createdAt && o.createdAt.startsWith(todayIsoPrefix));
  const todayRevenue = todayOrders
    .filter((o) => o.status !== 'Rejected' && o.status !== 'Cancelled')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const totalCompletedRevenue = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  // 2. ORDER MANAGEMENT ACTIONS
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      setIsUpdatingOrder(true);
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      if (selectedOrderForDetail && selectedOrderForDetail.id === orderId) {
        setSelectedOrderForDetail({
          ...selectedOrderForDetail,
          status: newStatus,
        });
      }
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  const handleSaveAdminNote = async (orderId: string) => {
    try {
      setIsUpdatingOrder(true);
      await updateDoc(doc(db, 'orders', orderId), {
        adminNote: adminNoteInput,
        updatedAt: new Date().toISOString(),
      });
      if (selectedOrderForDetail && selectedOrderForDetail.id === orderId) {
        setSelectedOrderForDetail({
          ...selectedOrderForDetail,
          adminNote: adminNoteInput,
        });
      }
      alert('Admin note saved successfully.');
    } catch (err: any) {
      alert('Failed to save note: ' + err.message);
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  const handleRetryEmail = async (order: Order) => {
    try {
      setIsRetryingEmail(true);
      setEmailSuccessBanner(null);
      const res = await fetch('/api/orders/retry-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order }),
      });
      const data = await res.json();

      const newStatus = data.status || (data.success ? 'Sent' : 'Failed');
      await updateDoc(doc(db, 'orders', order.id), {
        emailNotificationStatus: newStatus,
        emailMessageId: data.messageId || '',
        emailError: data.error || '',
        updatedAt: new Date().toISOString(),
      });

      if (selectedOrderForDetail && selectedOrderForDetail.id === order.id) {
        setSelectedOrderForDetail({
          ...selectedOrderForDetail,
          emailNotificationStatus: newStatus,
          emailError: data.error,
        });
      }

      setEmailSuccessBanner(
        data.success
          ? 'Email Notification dispatched successfully to store owner inbox!'
          : `Email attempt: ${data.error || 'Check RESEND_API_KEY and sender email configuration'}`
      );
    } catch (err: any) {
      alert('Error retrying email notification: ' + err.message);
    } finally {
      setIsRetryingEmail(false);
    }
  };

  // 3. PRODUCT MANAGEMENT ACTIONS
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.name || !editingProduct.price) return;

    try {
      const prodId = editingProduct.id || `ff-prod-${Date.now()}`;
      const payload: Product = {
        id: prodId,
        name: editingProduct.name,
        category: (editingProduct.category as ProductCategory) || 'membership',
        price: Number(editingProduct.price),
        originalPrice: editingProduct.originalPrice ? Number(editingProduct.originalPrice) : undefined,
        description: editingProduct.description || '',
        image: editingProduct.image || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
        badge: editingProduct.badge || '',
        diamonds: editingProduct.diamonds ? Number(editingProduct.diamonds) : undefined,
        active: editingProduct.active !== false,
        sortOrder: Number(editingProduct.sortOrder || 99),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'products', prodId), payload, { merge: true });
      setIsProductModalOpen(false);
      setEditingProduct(null);
    } catch (err: any) {
      alert('Failed to save product: ' + err.message);
    }
  };

  const handleToggleProductActive = async (product: Product) => {
    try {
      await updateDoc(doc(db, 'products', product.id), {
        active: !product.active,
        updatedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      alert('Failed to toggle product status: ' + err.message);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteDoc(doc(db, 'products', productId));
    } catch (err: any) {
      alert('Failed to delete product: ' + err.message);
    }
  };

  // 4. PAYMENT METHOD MANAGEMENT ACTIONS
  const handleSavePaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPaymentMethod || !editingPaymentMethod.name || !editingPaymentMethod.accountNumber) return;

    try {
      const methodId = editingPaymentMethod.id || `pm-${Date.now()}`;
      const payload: PaymentMethod = {
        id: methodId,
        name: editingPaymentMethod.name,
        provider: (editingPaymentMethod.provider as any) || 'EZ CASH',
        accountNumber: editingPaymentMethod.accountNumber,
        accountName: editingPaymentMethod.accountName || '',
        bankName: editingPaymentMethod.bankName || '',
        instructions: editingPaymentMethod.instructions || '',
        active: editingPaymentMethod.active !== false,
        sortOrder: Number(editingPaymentMethod.sortOrder || 1),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'paymentMethods', methodId), payload, { merge: true });
      setIsPaymentModalOpen(false);
      setEditingPaymentMethod(null);
    } catch (err: any) {
      alert('Failed to save payment method: ' + err.message);
    }
  };

  const handleTogglePaymentActive = async (pm: PaymentMethod) => {
    try {
      await updateDoc(doc(db, 'paymentMethods', pm.id), {
        active: !pm.active,
        updatedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      alert('Failed to toggle payment method status: ' + err.message);
    }
  };

  const handleDeletePaymentMethod = async (pmId: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return;
    try {
      await deleteDoc(doc(db, 'paymentMethods', pmId));
    } catch (err: any) {
      alert('Failed to delete payment method: ' + err.message);
    }
  };

  // 5. SITE SETTINGS SAVE ACTION
  const handleSaveSiteSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingSettings(true);
      setSettingsSuccessBanner(false);
      await setDoc(doc(db, 'siteSettings', 'general'), settingsForm, { merge: true });
      setSettingsSuccessBanner(true);
      setTimeout(() => setSettingsSuccessBanner(false), 3000);
    } catch (err: any) {
      alert('Failed to save settings: ' + err.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Orders list filter
  const filteredOrders = orders.filter((o) => {
    const statusMatches = orderStatusFilter === 'all' || o.status === orderStatusFilter;
    const q = orderSearchQuery.toLowerCase().trim();
    const searchMatches =
      !q ||
      o.orderId.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerWhatsApp.includes(q) ||
      o.playerId.toLowerCase().includes(q);
    return statusMatches && searchMatches;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-6xl h-[90vh] max-h-[900px] shadow-2xl flex flex-col overflow-hidden animate-scale-up">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg sm:text-xl font-bold text-white uppercase tracking-wide">
                  Store Admin Dashboard
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  REAL-TIME SYNC
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Manage live products, payment numbers, orders &amp; notifications
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={logoutAdmin}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Logout Admin"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Auth Gate Check */}
        {!isAdmin ? (
          <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
            <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-display text-xl font-bold text-white uppercase">
                  Admin Sign In
                </h3>
                <p className="text-xs text-slate-400">
                  Enter your Firebase administrator credentials to access the store management dashboard.
                </p>
              </div>

              {authError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleAdminAuth} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Admin Email</label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Password</label>
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 cursor-pointer"
                >
                  {authLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Sign In as Admin</span>
                    </>
                  )}
                </button>
              </form>

              <div className="text-[11px] text-slate-500 text-center bg-slate-900/50 p-2.5 rounded-xl border border-slate-800">
                Default Master Credentials configured for store owner quick access.
              </div>
            </div>
          </div>
        ) : (
          /* Logged In Admin Workspace */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            
            {/* Sidebar Navigation */}
            <div className="w-full md:w-56 bg-slate-950 border-r border-slate-800 p-3 sm:p-4 space-y-2 shrink-0 flex md:flex-col overflow-x-auto md:overflow-x-visible">
              <button
                onClick={() => setActiveAdminTab('overview')}
                className={`w-full p-2.5 rounded-xl text-xs font-bold text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                  activeAdminTab === 'overview'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <span>Overview</span>
              </button>

              <button
                onClick={() => setActiveAdminTab('orders')}
                className={`w-full p-2.5 rounded-xl text-xs font-bold text-left flex items-center justify-between transition-all cursor-pointer ${
                  activeAdminTab === 'orders'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="w-4 h-4 shrink-0" />
                  <span>Orders</span>
                </div>
                {pendingOrders.length > 0 && (
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    activeAdminTab === 'orders' ? 'bg-slate-950 text-amber-400' : 'bg-amber-500 text-slate-950'
                  }`}>
                    {pendingOrders.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveAdminTab('products')}
                className={`w-full p-2.5 rounded-xl text-xs font-bold text-left flex items-center justify-between transition-all cursor-pointer ${
                  activeAdminTab === 'products'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Package className="w-4 h-4 shrink-0" />
                  <span>Products</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {products.length}
                </span>
              </button>

              <button
                onClick={() => setActiveAdminTab('payments')}
                className={`w-full p-2.5 rounded-xl text-xs font-bold text-left flex items-center justify-between transition-all cursor-pointer ${
                  activeAdminTab === 'payments'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-4 h-4 shrink-0" />
                  <span>Payment Methods</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {paymentMethods.length}
                </span>
              </button>

              <button
                onClick={() => setActiveAdminTab('settings')}
                className={`w-full p-2.5 rounded-xl text-xs font-bold text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                  activeAdminTab === 'settings'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Settings className="w-4 h-4 shrink-0" />
                <span>Site Settings</span>
              </button>
            </div>

            {/* Main Content Pane */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

              {emailSuccessBanner && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{emailSuccessBanner}</span>
                  </div>
                  <button
                    onClick={() => setEmailSuccessBanner(null)}
                    className="text-slate-400 hover:text-white text-xs font-bold"
                  >
                    Dismiss
                  </button>
                </div>
              )}
              
              {/* TAB 1: OVERVIEW & ANALYTICS */}
              {activeAdminTab === 'overview' && (
                <div className="space-y-6">
                  
                  {/* Top Stats Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                        <span>Today&apos;s Revenue</span>
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="font-mono text-xl sm:text-2xl font-black text-emerald-400">
                        {formatLKR(todayRevenue, currencySymbol)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {todayOrders.length} order{todayOrders.length !== 1 ? 's' : ''} today
                      </div>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                        <span>Pending Orders</span>
                        <Clock className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="font-mono text-xl sm:text-2xl font-black text-amber-400">
                        {pendingOrders.length}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Awaiting payment check
                      </div>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                        <span>Completed Orders</span>
                        <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div className="font-mono text-xl sm:text-2xl font-black text-cyan-400">
                        {completedOrders.length}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Total {formatLKR(totalCompletedRevenue, currencySymbol)}
                      </div>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                        <span>Active Products</span>
                        <Package className="w-4 h-4 text-orange-400" />
                      </div>
                      <div className="font-mono text-xl sm:text-2xl font-black text-orange-400">
                        {products.filter((p) => p.active !== false).length}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Of {products.length} total catalog
                      </div>
                    </div>

                  </div>

                  {/* Quick Status Breakdown */}
                  <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-4">
                    <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-amber-400" />
                      <span>Order Fulfillment Status Pipeline</span>
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
                        <span className="text-[10px] text-amber-300 font-bold block uppercase">Pending Verification</span>
                        <span className="font-mono text-lg font-black text-amber-400">{pendingOrders.length}</span>
                      </div>

                      <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl">
                        <span className="text-[10px] text-cyan-300 font-bold block uppercase">Processing Reload</span>
                        <span className="font-mono text-lg font-black text-cyan-400">{processingOrders.length}</span>
                      </div>

                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
                        <span className="text-[10px] text-emerald-300 font-bold block uppercase">Completed</span>
                        <span className="font-mono text-lg font-black text-emerald-400">{completedOrders.length}</span>
                      </div>

                      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl">
                        <span className="text-[10px] text-red-300 font-bold block uppercase">Rejected / Cancelled</span>
                        <span className="font-mono text-lg font-black text-red-400">{rejectedOrders.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Recent 5 Orders Preview */}
                  <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-white text-sm uppercase tracking-wider">
                        Recent Inbound Orders
                      </h3>
                      <button
                        onClick={() => setActiveAdminTab('orders')}
                        className="text-xs text-amber-400 hover:text-amber-300 font-bold"
                      >
                        View All Orders &rarr;
                      </button>
                    </div>

                    <div className="space-y-2">
                      {orders.slice(0, 5).map((ord) => (
                        <div
                          key={ord.id}
                          onClick={() => {
                            setSelectedOrderForDetail(ord);
                            setAdminNoteInput(ord.adminNote || '');
                          }}
                          className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-white">{ord.orderId}</span>
                              <span className="text-xs text-slate-400">• UID: {ord.playerId}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {ord.customerName} • {formatLKR(ord.total, currencySymbol)} • {formatDateTime(ord.createdAt)}
                            </div>
                          </div>

                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${
                            ord.status === 'Completed'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : ord.status === 'Processing'
                              ? 'bg-cyan-500/20 text-cyan-400'
                              : ord.status === 'Rejected'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {ord.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: ORDERS MANAGEMENT */}
              {activeAdminTab === 'orders' && (
                <div className="space-y-4">
                  
                  {/* Filter & Search Bar */}
                  <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <div className="relative w-full sm:w-80">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search Order ID, Name, Player UID, WhatsApp..."
                        value={orderSearchQuery}
                        onChange={(e) => setOrderSearchQuery(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
                      {['all', 'Pending Payment Verification', 'Payment Received', 'Processing', 'Completed', 'Rejected'].map((st) => (
                        <button
                          key={st}
                          onClick={() => setOrderStatusFilter(st)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                            orderStatusFilter === st
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                        >
                          {st === 'all' ? 'All Orders' : st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Orders Table */}
                  <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-900/90 text-[10px] text-slate-400 uppercase font-bold border-b border-slate-800">
                          <tr>
                            <th className="p-3.5">Order ID &amp; Date</th>
                            <th className="p-3.5">Customer &amp; UID</th>
                            <th className="p-3.5">Items</th>
                            <th className="p-3.5">Total &amp; Payment</th>
                            <th className="p-3.5">Status</th>
                            <th className="p-3.5">Email Notif</th>
                            <th className="p-3.5 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-sans">
                          {filteredOrders.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-8 text-center text-slate-500">
                                No orders matching current filters.
                              </td>
                            </tr>
                          ) : (
                            filteredOrders.map((ord) => (
                              <tr
                                key={ord.id}
                                className="hover:bg-slate-900/40 transition-colors"
                              >
                                <td className="p-3.5">
                                  <div className="font-mono font-bold text-white">{ord.orderId}</div>
                                  <div className="text-[10px] text-slate-500">{formatDateTime(ord.createdAt)}</div>
                                </td>

                                <td className="p-3.5">
                                  <div className="font-bold text-white">{ord.customerName}</div>
                                  <div className="text-[10px] font-mono text-amber-400">UID: {ord.playerId}</div>
                                  <div className="text-[10px] text-slate-400">{ord.customerWhatsApp}</div>
                                </td>

                                <td className="p-3.5">
                                  <div className="space-y-0.5">
                                    {ord.items.map((it, idx) => (
                                      <div key={idx} className="truncate max-w-[160px]">
                                        <span className="text-amber-400 font-bold">{it.quantity}x</span> {it.name}
                                      </div>
                                    ))}
                                  </div>
                                </td>

                                <td className="p-3.5">
                                  <div className="font-mono font-black text-amber-400">
                                    {formatLKR(ord.total, currencySymbol)}
                                  </div>
                                  <div className="text-[10px] text-slate-400">{ord.paymentMethodName}</div>
                                </td>

                                <td className="p-3.5">
                                  <select
                                    value={ord.status}
                                    onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value as OrderStatus)}
                                    className={`text-[11px] font-bold px-2 py-1 rounded-lg border bg-slate-900 focus:outline-none cursor-pointer ${
                                      ord.status === 'Completed'
                                        ? 'text-emerald-400 border-emerald-500/40'
                                        : ord.status === 'Processing'
                                        ? 'text-cyan-400 border-cyan-500/40'
                                        : ord.status === 'Rejected'
                                        ? 'text-red-400 border-red-500/40'
                                        : 'text-amber-400 border-amber-500/40'
                                    }`}
                                  >
                                    <option value="Pending Payment Verification">Pending Payment</option>
                                    <option value="Payment Received">Payment Received</option>
                                    <option value="Processing">Processing</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Rejected">Rejected</option>
                                    <option value="Cancelled">Cancelled</option>
                                  </select>
                                </td>

                                <td className="p-3.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                      ord.emailNotificationStatus === 'Sent'
                                        ? 'bg-emerald-500/20 text-emerald-300'
                                        : ord.emailNotificationStatus === 'Failed'
                                        ? 'bg-red-500/20 text-red-300'
                                        : 'bg-amber-500/20 text-amber-300'
                                    }`}>
                                      {ord.emailNotificationStatus || 'Pending'}
                                    </span>
                                    <button
                                      onClick={() => handleRetryEmail(ord)}
                                      title="Retry Email Notification dispatch"
                                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                                    >
                                      <RotateCw className="w-3 h-3" />
                                    </button>
                                  </div>
                                </td>

                                <td className="p-3.5 text-right">
                                  <button
                                    onClick={() => {
                                      setSelectedOrderForDetail(ord);
                                      setAdminNoteInput(ord.adminNote || '');
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-[11px] font-bold transition-colors cursor-pointer"
                                  >
                                    View
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 3: PRODUCT CATALOG MANAGEMENT */}
              {activeAdminTab === 'products' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-base">Product Catalog ({products.length})</h3>
                      <span className="text-xs text-slate-400">Edits update main store in real-time</span>
                    </div>

                    <button
                      onClick={() => {
                        setEditingProduct({
                          name: '',
                          category: 'membership',
                          price: 550,
                          originalPrice: 650,
                          description: '',
                          image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
                          badge: '',
                          diamonds: 100,
                          active: true,
                          sortOrder: products.length + 1,
                        });
                        setIsProductModalOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add New Product</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((prod) => (
                      <div
                        key={prod.id}
                        className={`bg-slate-950 border rounded-2xl p-4 space-y-3 flex flex-col justify-between transition-all ${
                          prod.active !== false ? 'border-slate-800' : 'border-red-500/30 opacity-60'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                              {prod.category}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleToggleProductActive(prod)}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                                  prod.active !== false
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                    : 'bg-red-500/20 text-red-400 border border-red-500/40'
                                }`}
                              >
                                {prod.active !== false ? 'Active' : 'Disabled'}
                              </button>
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <img
                              src={prod.image}
                              alt={prod.name}
                              referrerPolicy="no-referrer"
                              className="w-14 h-14 rounded-xl object-cover border border-slate-800 shrink-0"
                            />
                            <div>
                              <h4 className="font-bold text-white text-xs">{prod.name}</h4>
                              <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                                {prod.description}
                              </p>
                              {prod.diamonds && (
                                <span className="text-[10px] text-cyan-400 font-mono font-bold block mt-1">
                                  {prod.diamonds} 💎
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-500 block">Price</span>
                            <span className="font-mono text-base font-black text-amber-400">
                              {formatLKR(prod.price, currencySymbol)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingProduct(prod);
                                setIsProductModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod.id)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              )}

              {/* TAB 4: PAYMENT METHODS MANAGEMENT */}
              {activeAdminTab === 'payments' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-white text-base">Payment Methods ({paymentMethods.length})</h3>
                      <p className="text-xs text-slate-400">
                        Updates to numbers &amp; bank accounts appear immediately on customer checkout
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setEditingPaymentMethod({
                          name: '',
                          provider: 'EZ CASH',
                          accountNumber: '',
                          accountName: '',
                          bankName: '',
                          instructions: '',
                          active: true,
                          sortOrder: paymentMethods.length + 1,
                        });
                        setIsPaymentModalOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Payment Method</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {paymentMethods.map((pm) => (
                      <div
                        key={pm.id}
                        className={`bg-slate-950 border rounded-3xl p-5 space-y-4 ${
                          pm.active !== false ? 'border-slate-800' : 'border-red-500/30 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-amber-400" />
                            <h4 className="font-bold text-white text-sm">{pm.name}</h4>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleTogglePaymentActive(pm)}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                                pm.active !== false
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                  : 'bg-red-500/20 text-red-400 border border-red-500/40'
                              }`}
                            >
                              {pm.active !== false ? 'Enabled' : 'Disabled'}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                            <span className="text-slate-400">Account / Phone Number:</span>
                            <span className="font-mono font-bold text-amber-400">{pm.accountNumber}</span>
                          </div>

                          {pm.accountName && (
                            <div className="flex justify-between bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                              <span className="text-slate-400">Account Holder:</span>
                              <span className="font-bold text-white truncate max-w-[200px]">{pm.accountName}</span>
                            </div>
                          )}

                          {pm.bankName && (
                            <div className="flex justify-between bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                              <span className="text-slate-400">Bank Name:</span>
                              <span className="font-bold text-white">{pm.bankName}</span>
                            </div>
                          )}

                          {pm.instructions && (
                            <div className="text-[11px] text-slate-400 bg-slate-900/40 p-2.5 rounded-xl">
                              <span className="font-semibold text-slate-300">Instructions:</span> {pm.instructions}
                            </div>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-800 flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingPaymentMethod(pm);
                              setIsPaymentModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Details</span>
                          </button>
                          <button
                            onClick={() => handleDeletePaymentMethod(pm.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              )}

              {/* TAB 5: SITE SETTINGS */}
              {activeAdminTab === 'settings' && (
                <div className="max-w-2xl bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-6">
                  <div>
                    <h3 className="font-bold text-white text-base">Store Settings &amp; Dynamic Content</h3>
                    <p className="text-xs text-slate-400">
                      Changes here are saved directly to Firestore and update the live website for all visitors.
                    </p>
                  </div>

                  {settingsSuccessBanner && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Site settings updated and published in real-time!</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveSiteSettings} className="space-y-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="font-medium text-slate-300">Website Name</label>
                      <input
                        type="text"
                        value={settingsForm.websiteName}
                        onChange={(e) => setSettingsForm({ ...settingsForm, websiteName: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500 text-xs sm:text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-medium text-slate-300">Customer Care WhatsApp Number</label>
                      <input
                        type="text"
                        value={settingsForm.contactWhatsApp}
                        onChange={(e) => setSettingsForm({ ...settingsForm, contactWhatsApp: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500 font-mono text-xs sm:text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-medium text-slate-300">Top Announcement Banner Text</label>
                      <input
                        type="text"
                        value={settingsForm.announcement}
                        onChange={(e) => setSettingsForm({ ...settingsForm, announcement: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500 text-xs sm:text-sm"
                      />
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl">
                      <input
                        type="checkbox"
                        id="announcementActive"
                        checked={settingsForm.announcementActive}
                        onChange={(e) => setSettingsForm({ ...settingsForm, announcementActive: e.target.checked })}
                        className="w-4 h-4 rounded text-amber-500 focus:ring-0 cursor-pointer"
                      />
                      <label htmlFor="announcementActive" className="text-xs font-semibold text-slate-200 cursor-pointer">
                        Display Announcement Banner to visitors
                      </label>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-medium text-slate-300">Hero Headline</label>
                      <input
                        type="text"
                        value={settingsForm.heroTitle}
                        onChange={(e) => setSettingsForm({ ...settingsForm, heroTitle: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500 text-xs sm:text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-medium text-slate-300">Hero Subtitle</label>
                      <textarea
                        rows={2}
                        value={settingsForm.heroSubtitle}
                        onChange={(e) => setSettingsForm({ ...settingsForm, heroSubtitle: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500 text-xs"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingSettings}
                      className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg shadow-orange-500/20"
                    >
                      {isSavingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span>Save &amp; Publish Settings</span>
                    </button>
                  </form>
                </div>
              )}

            </div>
          </div>
        )}

      </div>

      {/* SUB-MODAL 1: ORDER DETAILS POPUP */}
      {selectedOrderForDetail && (
        <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-scale-up my-auto">
            <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Order Details</span>
                <span className="font-mono text-base font-black text-white">{selectedOrderForDetail.orderId}</span>
              </div>
              <button
                onClick={() => setSelectedOrderForDetail(null)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              
              {emailSuccessBanner && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>{emailSuccessBanner}</span>
                </div>
              )}

              {/* Player & Contact snapshot */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
                <div>
                  <span className="text-slate-500 block text-[10px]">Free Fire UID</span>
                  <span className="font-mono font-bold text-amber-400 text-sm flex items-center gap-1">
                    {selectedOrderForDetail.playerId}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Customer Name</span>
                  <span className="font-bold text-white text-sm">{selectedOrderForDetail.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">WhatsApp</span>
                  <a
                    href={`https://wa.me/${selectedOrderForDetail.customerWhatsApp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>{selectedOrderForDetail.customerWhatsApp}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Nickname</span>
                  <span className="text-slate-300">{selectedOrderForDetail.nickname || 'None'}</span>
                </div>
              </div>

              {/* Products Breakdown */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-400 uppercase text-[10px] block">Order Items</span>
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
                  {selectedOrderForDetail.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-slate-300">
                      <span>{it.quantity}x {it.name}</span>
                      <span className="font-mono">{formatLKR(it.price * it.quantity, currencySymbol)}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-white text-sm">
                    <span>Total Amount</span>
                    <span className="font-mono text-amber-400">{formatLKR(selectedOrderForDetail.total, currencySymbol)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Details & Receipt */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                <span className="font-bold text-slate-400 uppercase text-[10px] block">Payment Proof</span>
                <div className="flex justify-between text-slate-300">
                  <span>Method:</span>
                  <span className="font-bold text-white">{selectedOrderForDetail.paymentMethodName}</span>
                </div>

                {selectedOrderForDetail.receiptUrl && (
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <a
                      href={selectedOrderForDetail.receiptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-center text-cyan-400 font-semibold block transition-colors"
                    >
                      Open Full Payment Receipt / Slip &rarr;
                    </a>
                  </div>
                )}
              </div>

              {/* Status Update Control */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-400 uppercase text-[10px]">Change Order Status</label>
                <select
                  value={selectedOrderForDetail.status}
                  onChange={(e) => handleUpdateOrderStatus(selectedOrderForDetail.id, e.target.value as OrderStatus)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold"
                >
                  <option value="Pending Payment Verification">Pending Payment Verification</option>
                  <option value="Payment Received">Payment Received</option>
                  <option value="Processing">Processing</option>
                  <option value="Completed">Completed</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {/* Admin Note Section */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-400 uppercase text-[10px]">Admin Internal Note</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Delivered via Player UID on 12:30pm"
                    value={adminNoteInput}
                    onChange={(e) => setAdminNoteInput(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                  <button
                    onClick={() => handleSaveAdminNote(selectedOrderForDetail.id)}
                    disabled={isUpdatingOrder}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl font-bold disabled:opacity-50"
                  >
                    {isUpdatingOrder ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>

              {/* Email Notification status and retry action */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-xs block">Email Notification:</span>
                  <span className={`font-bold text-xs ${
                    selectedOrderForDetail.emailNotificationStatus === 'Sent'
                      ? 'text-emerald-400'
                      : selectedOrderForDetail.emailNotificationStatus === 'Failed'
                      ? 'text-red-400'
                      : 'text-amber-400'
                  }`}>
                    {selectedOrderForDetail.emailNotificationStatus || 'Pending'}
                  </span>
                  {selectedOrderForDetail.emailError && (
                    <div className="text-[10px] text-red-400 max-w-xs truncate">{selectedOrderForDetail.emailError}</div>
                  )}
                </div>
                <button
                  onClick={() => handleRetryEmail(selectedOrderForDetail)}
                  disabled={isRetryingEmail}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isRetryingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCw className="w-3.5 h-3.5" />}
                  <span>Retry Email Dispatch</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL 2: ADD/EDIT PRODUCT */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up my-auto">
            <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-base">
                {editingProduct.id ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="font-medium text-slate-300">Product Name *</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-slate-300">Category *</label>
                  <select
                    value={editingProduct.category || 'membership'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value as ProductCategory })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="membership">Membership</option>
                    <option value="level_up_pass">Level Up Pass</option>
                    <option value="topup">Diamonds Top-Up</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-slate-300">Price (Rs.) *</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-slate-300">Original Price (Strikeout)</label>
                  <input
                    type="number"
                    value={editingProduct.originalPrice || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, originalPrice: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-slate-300">Diamonds Count</label>
                  <input
                    type="number"
                    value={editingProduct.diamonds || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, diamonds: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-300">Description</label>
                <textarea
                  rows={2}
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-300">Image URL</label>
                <input
                  type="url"
                  value={editingProduct.image || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-slate-300">Badge Label</label>
                  <input
                    type="text"
                    placeholder="e.g. Popular, Hot Deal"
                    value={editingProduct.badge || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, badge: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-slate-300">Sort Order</label>
                  <input
                    type="number"
                    value={editingProduct.sortOrder || 1}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sortOrder: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 bg-slate-950 rounded-xl border border-slate-800">
                <input
                  type="checkbox"
                  id="prodActive"
                  checked={editingProduct.active !== false}
                  onChange={(e) => setEditingProduct({ ...editingProduct, active: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500"
                />
                <label htmlFor="prodActive" className="text-slate-200 font-semibold cursor-pointer">
                  Product Active (Visible in Store)
                </label>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold"
                >
                  Save to Firestore
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL 3: ADD/EDIT PAYMENT METHOD */}
      {isPaymentModalOpen && editingPaymentMethod && (
        <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up my-auto">
            <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-base">
                {editingPaymentMethod.id ? 'Edit Payment Method' : 'Add Payment Method'}
              </h3>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePaymentMethod} className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="font-medium text-slate-300">Method Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EZ CASH Mobile Wallet"
                  value={editingPaymentMethod.name || ''}
                  onChange={(e) => setEditingPaymentMethod({ ...editingPaymentMethod, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-slate-300">Provider Type *</label>
                  <select
                    value={editingPaymentMethod.provider || 'EZ CASH'}
                    onChange={(e) => setEditingPaymentMethod({ ...editingPaymentMethod, provider: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="EZ CASH">EZ CASH</option>
                    <option value="BANK">Bank Transfer</option>
                    <option value="CUSTOM">Custom Wallet</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-slate-300">Account / Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 0772472573"
                    value={editingPaymentMethod.accountNumber || ''}
                    onChange={(e) => setEditingPaymentMethod({ ...editingPaymentMethod, accountNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-300">Account Holder Name</label>
                <input
                  type="text"
                  placeholder="e.g. JAYAKODY ARACHCHILAGE..."
                  value={editingPaymentMethod.accountName || ''}
                  onChange={(e) => setEditingPaymentMethod({ ...editingPaymentMethod, accountName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-300">Bank Name (For Bank Transfers)</label>
                <input
                  type="text"
                  placeholder="e.g. People's Bank"
                  value={editingPaymentMethod.bankName || ''}
                  onChange={(e) => setEditingPaymentMethod({ ...editingPaymentMethod, bankName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-300">Payment Instructions</label>
                <textarea
                  rows={2}
                  value={editingPaymentMethod.instructions || ''}
                  onChange={(e) => setEditingPaymentMethod({ ...editingPaymentMethod, instructions: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center gap-2 p-2 bg-slate-950 rounded-xl border border-slate-800">
                <input
                  type="checkbox"
                  id="pmActive"
                  checked={editingPaymentMethod.active !== false}
                  onChange={(e) => setEditingPaymentMethod({ ...editingPaymentMethod, active: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500"
                />
                <label htmlFor="pmActive" className="text-slate-200 font-semibold cursor-pointer">
                  Payment Method Enabled
                </label>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold"
                >
                  Save Payment Method
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
