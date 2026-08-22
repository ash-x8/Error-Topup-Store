import React, { useState, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { Product, Order, OrderItemSnapshot } from '../types';
import { formatLKR, copyToClipboard, generateOrderId, generateOrderWhatsAppUrl } from '../utils/formatters';
import { uploadReceipt } from '../lib/uploadReceipt';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import confetti from 'canvas-confetti';
import { 
  Gamepad2, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Zap, 
  Loader2, 
  ArrowRight, 
  Trash2, 
  HelpCircle,
  Gem,
  ShieldCheck
} from 'lucide-react';

interface ExpressTopupSectionProps {
  onOrderSuccess: (order: Order) => void;
  currencySymbol: string;
}

export const ExpressTopupSection: React.FC<ExpressTopupSectionProps> = ({
  onOrderSuccess,
  currencySymbol,
}) => {
  const { products, paymentMethods, siteSettings } = useStore();

  // Active items
  const activeProducts = products.filter((p) => p.active !== false);
  const activeMethods = paymentMethods.filter((m) => m.active !== false);

  // Step 1 State: Player ID
  const [playerId, setPlayerId] = useState('');
  const [nickname, setNickname] = useState('');
  const [showUidHelp, setShowUidHelp] = useState(false);

  // Step 2 State: Selected Product & Category Filter
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(
    activeProducts.find((p) => p.id === 'ff-weekly') || activeProducts[0] || null
  );

  // Step 3 State: Payment Method
  const [selectedMethodId, setSelectedMethodId] = useState<string>(
    activeMethods[0]?.id || 'ez-cash'
  );
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Step 4 State: Customer Info & Receipt Slip
  const [customerName, setCustomerName] = useState('');
  const [customerWhatsApp, setCustomerWhatsApp] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedMethod = activeMethods.find((m) => m.id === selectedMethodId) || activeMethods[0];

  // Filter products by category
  const filteredProducts = activeProducts.filter((p) => {
    if (selectedCategory === 'all') return true;
    return p.category === selectedCategory;
  });

  const isPlayerIdValid = /^\d{8,14}$/.test(playerId.trim());

  // Copy handler
  const handleCopy = async (text: string, fieldId: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2500);
    }
  };

  // Receipt File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Receipt file size must be less than 10MB.');
      return;
    }

    setErrorMessage(null);
    setReceiptFile(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setReceiptPreview(null);
    }
  };

  // Validation
  const validateForm = (): boolean => {
    if (!playerId.trim()) {
      setErrorMessage('Step 1: Please enter your Free Fire Player ID (UID).');
      return false;
    }
    if (!isPlayerIdValid) {
      setErrorMessage('Step 1: Free Fire Player ID must be 8 to 14 numbers (digits only).');
      return false;
    }
    if (!selectedProduct) {
      setErrorMessage('Step 2: Please select a recharge package or membership.');
      return false;
    }
    if (!customerWhatsApp.trim()) {
      setErrorMessage('Step 4: Please enter your WhatsApp number.');
      return false;
    }
    const cleanPhone = customerWhatsApp.replace(/\D/g, '');
    if (cleanPhone.length < 9 || cleanPhone.length > 15) {
      setErrorMessage('Step 4: Please enter a valid WhatsApp phone number (e.g. 0772472573).');
      return false;
    }
    if (!customerName.trim()) {
      setErrorMessage('Step 4: Please enter your name.');
      return false;
    }
    if (!receiptFile) {
      setErrorMessage('Step 4: Please upload your payment slip or transfer screenshot.');
      return false;
    }
    return true;
  };

  // Direct Order Submission (Senustore Process)
  const handleSubmitDirectOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validateForm()) {
      const formEl = document.getElementById('express-error-box');
      if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    try {
      setIsSubmitting(true);
      setUploadProgress(15);

      // 1. Upload receipt to Cloudinary or Server
      let uploadedReceiptUrl = '';
      if (receiptFile) {
        const uploadResult = await uploadReceipt(receiptFile, (progress) => {
          setUploadProgress(progress);
        });
        uploadedReceiptUrl = uploadResult.url;
      }

      setUploadProgress(90);

      // 2. Prepare Order Payload
      const orderId = generateOrderId();
      const now = new Date().toISOString();

      const itemSnapshot: OrderItemSnapshot = {
        productId: selectedProduct!.id,
        name: selectedProduct!.name,
        category: selectedProduct!.category,
        price: selectedProduct!.price,
        quantity: 1,
        subtotal: selectedProduct!.price,
        diamonds: selectedProduct!.diamonds,
      };

      const newOrder: Order = {
        id: orderId,
        orderId: orderId,
        customerName: customerName.trim(),
        customerWhatsApp: customerWhatsApp.trim(),
        customerEmail: customerEmail.trim() || undefined,
        customerEmailStatus: customerEmail.trim() ? 'Pending' : 'Skipped',
        playerId: playerId.trim(),
        nickname: nickname.trim() || undefined,
        items: [itemSnapshot],
        subtotal: selectedProduct!.price,
        total: selectedProduct!.price,
        paymentMethodId: selectedMethod?.id || 'ez-cash',
        paymentMethodName: selectedMethod?.name || 'EZ CASH',
        paymentDetailsSnapshot: {
          provider: selectedMethod?.provider || 'EZ CASH',
          accountNumber: selectedMethod?.accountNumber || '0772472573',
          accountName: selectedMethod?.accountName,
          bankName: selectedMethod?.bankName,
        },
        receiptUrl: uploadedReceiptUrl,
        receiptFileName: receiptFile?.name,
        status: 'Pending Payment Verification',
        adminNote: '',
        emailNotificationStatus: 'Pending',
        createdAt: now,
        updatedAt: now,
      };

      // 3. Save order to Firestore
      await setDoc(doc(db, 'orders', orderId), newOrder);

      // 4. Trigger Email Notification in Background (Admin Alert & Customer Confirmation)
      fetch('/api/send-order-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newOrder }),
      })
        .then((res) => res.json())
        .then((resData) => {
          if (resData) {
            const adminSent = resData.results?.adminNotification?.sent ?? resData.success;
            const custSent = resData.results?.customerNotification?.sent;
            setDoc(
              doc(db, 'orders', orderId),
              {
                emailNotificationStatus: adminSent ? 'Sent' : 'Failed',
                emailMessageId: resData.results?.adminNotification?.messageId || '',
                customerEmailStatus: customerEmail.trim() ? (custSent ? 'Sent' : 'Failed') : 'Skipped',
                customerEmailMessageId: resData.results?.customerNotification?.messageId || '',
                updatedAt: new Date().toISOString(),
              },
              { merge: true }
            );
          }
        })
        .catch((err) => console.warn('Email dispatch warning:', err));

      // 5. Build WhatsApp Redirect URL with uploaded image receipt and details
      const whatsappUrl = generateOrderWhatsAppUrl(
        newOrder,
        selectedMethod?.accountNumber || siteSettings?.contactWhatsApp || '0772472573'
      );

      // Open WhatsApp automatically in a new window/tab
      try {
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      } catch (openErr) {
        console.warn('Direct WhatsApp window redirect prevented:', openErr);
      }

      // 6. Celebration Confetti
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // Confetti fallback
      }

      setUploadProgress(100);

      // 7. Reset form
      setReceiptFile(null);
      setReceiptPreview(null);

      // 8. Trigger Parent Success
      onOrderSuccess(newOrder);
    } catch (err: any) {
      console.error('Order submission error:', err);
      setErrorMessage(
        err.message || 'Failed to submit order. Please check your internet connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  return (
    <section id="express-topup" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      
      {/* Section Title */}
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
          <Zap className="w-3.5 h-3.5 fill-amber-400" />
          <span>SENUSTORE PROCESS — DIRECT EXPRESS RELOAD</span>
        </div>
        <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
          Instant Free Fire Direct Top-Up
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Complete the 4 simple steps below to reload Diamonds, Memberships, or Level Up Passes instantly to your Free Fire UID.
        </p>
      </div>

      {/* Main Express Steps Form Container */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl space-y-8">
        
        {/* STEP 1: FREE FIRE PLAYER ID */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 font-black text-sm flex items-center justify-center shadow-md shadow-orange-500/20">
                1
              </span>
              <div>
                <h3 className="font-display text-base sm:text-lg font-bold text-white uppercase tracking-wide flex items-center gap-2">
                  <span>Enter Free Fire Player ID (UID)</span>
                  {isPlayerIdValid && (
                    <span className="text-emerald-400 text-xs font-bold flex items-center gap-1 font-sans">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Valid UID</span>
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400">
                  Your diamonds and memberships will be delivered directly to this account
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowUidHelp(!showUidHelp)}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Where is my UID?</span>
            </button>
          </div>

          {showUidHelp && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 space-y-1">
              <p className="font-bold">How to find your Free Fire UID:</p>
              <p className="text-slate-300">1. Open Free Fire game &gt; Tap your Profile banner in the top left corner.</p>
              <p className="text-slate-300">2. Look under your username to see your 8-14 digit numerical ID &gt; Tap the copy button beside it.</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
                Player ID (UID) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Gamepad2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={playerId}
                  onChange={(e) => setPlayerId(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 1425893214"
                  maxLength={14}
                  className={`w-full bg-slate-950 border rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 font-mono tracking-wider focus:outline-none transition-colors ${
                    playerId
                      ? isPlayerIdValid
                        ? 'border-emerald-500/60 focus:border-emerald-500'
                        : 'border-amber-500/60 focus:border-amber-500'
                      : 'border-slate-800 focus:border-amber-500'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
                In-Game Nickname (Optional)
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="e.g. ꧁DARK_LORD꧂"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>
        </div>

        <hr className="border-slate-800/80" />

        {/* STEP 2: SELECT RECHARGE PACKAGE */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 font-black text-sm flex items-center justify-center shadow-md shadow-orange-500/20">
                2
              </span>
              <div>
                <h3 className="font-display text-base sm:text-lg font-bold text-white uppercase tracking-wide">
                  Select Recharge Item / Package
                </h3>
                <p className="text-xs text-slate-400">
                  Choose your desired Membership, Level Up Pass, or Diamond Top-Up
                </p>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                All Items
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('membership')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === 'membership'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                Memberships
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('level_up_pass')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === 'level_up_pass'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                Level Up Pass
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('topup')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === 'topup'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                Diamonds
              </button>
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filteredProducts.map((prod) => {
              const isSelected = selectedProduct?.id === prod.id;
              return (
                <button
                  type="button"
                  key={prod.id}
                  onClick={() => setSelectedProduct(prod)}
                  className={`relative text-left p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-gradient-to-b from-slate-900 to-amber-950/30 border-amber-500 ring-2 ring-amber-500/40 shadow-lg shadow-orange-500/10'
                      : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  {/* Top Badge & Checkmark */}
                  <div className="flex items-center justify-between w-full mb-2">
                    {prod.badge ? (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500 text-slate-950">
                        {prod.badge}
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {prod.category === 'membership' ? 'Pass' : prod.category === 'level_up_pass' ? 'Level' : 'Topup'}
                      </span>
                    )}

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  {/* Title & Diamonds */}
                  <div className="space-y-1 my-1">
                    <h4 className="font-bold text-xs sm:text-sm text-white line-clamp-1">
                      {prod.name}
                    </h4>
                    {prod.diamonds && (
                      <div className="flex items-center gap-1 text-[11px] text-cyan-400 font-mono font-bold">
                        <Gem className="w-3 h-3" />
                        <span>{prod.diamonds.toLocaleString()} 💎</span>
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <div className="pt-2 mt-2 border-t border-slate-800/80 flex items-baseline justify-between">
                    <span className="font-mono text-sm sm:text-base font-black text-amber-400">
                      {formatLKR(prod.price, currencySymbol)}
                    </span>
                    {prod.originalPrice && prod.originalPrice > prod.price && (
                      <span className="font-mono text-[10px] text-slate-500 line-through">
                        {formatLKR(prod.originalPrice, currencySymbol)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <hr className="border-slate-800/80" />

        {/* STEP 3: SELECT PAYMENT METHOD */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 font-black text-sm flex items-center justify-center shadow-md shadow-orange-500/20">
              3
            </span>
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold text-white uppercase tracking-wide">
                Select Payment Method
              </h3>
              <p className="text-xs text-slate-400">
                Pay via EZ Cash or Bank CDM / Online Transfer and copy details in 1-click
              </p>
            </div>
          </div>

          {/* Payment Method Selector Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeMethods.map((method) => {
              const isSelected = selectedMethod?.id === method.id;
              return (
                <button
                  type="button"
                  key={method.id}
                  onClick={() => setSelectedMethodId(method.id)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500 ring-1 ring-amber-500/50'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                      method.provider === 'EZ CASH'
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {method.provider === 'EZ CASH' ? 'EZ' : 'BANK'}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">{method.name}</div>
                      <div className="text-xs font-mono text-slate-400">
                        {method.accountNumber}
                      </div>
                    </div>
                  </div>

                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    isSelected
                      ? 'bg-amber-500 border-amber-500 text-slate-950'
                      : 'border-slate-700'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Method Details Box with Copy Buttons */}
          {selectedMethod && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Send Payment To:</span>
                  <div className="font-bold text-sm text-white flex items-center gap-2">
                    <span>{selectedMethod.name}</span>
                    {selectedMethod.bankName && (
                      <span className="text-xs font-normal text-amber-400">({selectedMethod.bankName})</span>
                    )}
                  </div>
                </div>

                <div className="text-xs text-slate-400">
                  Amount to transfer: <span className="font-mono font-bold text-amber-400 text-sm">{formatLKR(selectedProduct?.price || 0, currencySymbol)}</span>
                </div>
              </div>

              {/* Account Number Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Account / Phone No:</span>
                    <span className="font-mono text-sm sm:text-base font-bold text-amber-400 select-all">
                      {selectedMethod.accountNumber}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(selectedMethod.accountNumber, 'express-acc')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      copiedField === 'express-acc'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                  >
                    {copiedField === 'express-acc' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {selectedMethod.accountName && (
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Account Name:</span>
                      <span className="text-xs sm:text-sm font-bold text-slate-200 truncate max-w-[180px] block select-all">
                        {selectedMethod.accountName}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedMethod.accountName!, 'express-name')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        copiedField === 'express-name'
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 hover:bg-slate-700 text-white'
                      }`}
                    >
                      {copiedField === 'express-name' ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {selectedMethod.instructions && (
                <p className="text-[11px] text-slate-400 italic pt-1">
                  💡 {selectedMethod.instructions}
                </p>
              )}
            </div>
          )}
        </div>

        <hr className="border-slate-800/80" />

        {/* STEP 4: UPLOAD PAYMENT SLIP & CUSTOMER WHATSAPP */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 font-black text-sm flex items-center justify-center shadow-md shadow-orange-500/20">
              4
            </span>
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold text-white uppercase tracking-wide">
                Upload Payment Slip &amp; WhatsApp Contact
              </h3>
              <p className="text-xs text-slate-400">
                Upload your deposit receipt screenshot to confirm payment and receive instant updates
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* Left: Receipt File Upload Zone */}
            <div className="lg:col-span-7 space-y-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block">
                Payment Proof / Slip Screenshot <span className="text-red-400">*</span>
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />

              {!receiptFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-amber-500/60 rounded-2xl p-6 sm:p-8 text-center bg-slate-950/60 hover:bg-slate-950 transition-all cursor-pointer group space-y-3"
                >
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 group-hover:bg-amber-500/20 text-slate-400 group-hover:text-amber-400 flex items-center justify-center mx-auto transition-colors">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-xs sm:text-sm block">
                      Click to browse or drop payment slip here
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-1">
                      Supports JPG, PNG, WEBP &amp; PDF receipts (Max 10MB)
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {receiptPreview ? (
                        <img
                          src={receiptPreview}
                          alt="Receipt Preview"
                          className="w-14 h-14 rounded-xl object-cover border border-slate-700"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center text-amber-400 font-bold text-xs">
                          PDF SLIP
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-white truncate max-w-[200px]">
                          {receiptFile.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {(receiptFile.size / 1024 / 1024).toFixed(2)} MB • Ready to verify
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setReceiptFile(null);
                        setReceiptPreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                      title="Remove slip"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Customer WhatsApp & Name Fields */}
            <div className="lg:col-span-5 space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block mb-1">
                  WhatsApp Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  value={customerWhatsApp}
                  onChange={(e) => setCustomerWhatsApp(e.target.value)}
                  placeholder="e.g. 0772472573"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-amber-500 transition-colors"
                />
                <span className="text-[10px] text-slate-500 block mt-1">
                  For customer support &amp; order confirmation
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block mb-1">
                  Your Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Kasun Perera"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block mb-1">
                  Email Address <span className="text-slate-500 font-normal lowercase">(optional — for receipt &amp; status tracking)</span>
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="e.g. customer@gmail.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Error Message Box */}
        {errorMessage && (
          <div id="express-error-box" className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-xs sm:text-sm text-red-300">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Upload Progress bar */}
        {isSubmitting && uploadProgress > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Uploading receipt &amp; submitting order...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-orange-500 h-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* STEP 5: SUBMIT EXPRESS ORDER BUTTON */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-800">
          
          {/* Summary Preview */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Selected:</span>
              <span className="font-bold text-white text-sm">{selectedProduct?.name || 'None'}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-slate-400">Total:</span>
              <span className="font-mono text-xl sm:text-2xl font-black text-amber-400">
                {formatLKR(selectedProduct?.price || 0, currencySymbol)}
              </span>
              <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>100% Ban-Proof Official Reload</span>
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleSubmitDirectOrder}
            disabled={isSubmitting}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-xl shadow-orange-500/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-98"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing Order...</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 fill-slate-950" />
                <span>⚡ Direct Buy Now</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

        </div>

      </div>

    </section>
  );
};
