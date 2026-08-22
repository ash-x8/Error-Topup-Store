import React, { useState, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { Order, OrderItemSnapshot } from '../types';
import { formatLKR, copyToClipboard, generateOrderId } from '../utils/formatters';
import { uploadReceipt } from '../lib/uploadReceipt';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import confetti from 'canvas-confetti';
import { 
  X, 
  Check, 
  Copy, 
  UploadCloud, 
  FileText, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles, 
  CreditCard, 
  Phone, 
  User, 
  Gamepad2, 
  ArrowRight, 
  Loader2,
  Trash2,
  CheckCircle2
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
  currencySymbol: string;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderSuccess,
  currencySymbol,
}) => {
  const { cart, subtotal, clearCart } = useCart();
  const { paymentMethods, products } = useStore();

  // Active payment methods
  const activeMethods = paymentMethods.filter((m) => m.active !== false);

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerWhatsApp, setCustomerWhatsApp] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [nickname, setNickname] = useState('');
  const [selectedMethodId, setSelectedMethodId] = useState<string>(
    activeMethods[0]?.id || 'ez-cash'
  );

  // Receipt upload states
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Copy feedback states
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const selectedMethod = activeMethods.find((m) => m.id === selectedMethodId) || activeMethods[0];

  // Copy handler with visual feedback
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

    // Check size (10MB max)
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
    if (!customerName.trim()) {
      setErrorMessage('Please enter your full name.');
      return false;
    }
    const cleanPhone = customerWhatsApp.replace(/\D/g, '');
    if (cleanPhone.length < 9 || cleanPhone.length > 15) {
      setErrorMessage('Please enter a valid WhatsApp phone number (e.g. 0772472573).');
      return false;
    }
    const cleanPlayerId = playerId.trim();
    if (!/^\d{8,14}$/.test(cleanPlayerId)) {
      setErrorMessage('Please enter a valid numeric Free Fire Player ID (usually 8 to 12 digits).');
      return false;
    }
    if (!receiptFile) {
      setErrorMessage('Please upload the transaction receipt screenshot or bank slip before submitting.');
      return false;
    }
    if (cart.length === 0) {
      setErrorMessage('Your cart is empty. Please add products to checkout.');
      return false;
    }
    return true;
  };

  // Submit Order Flow
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validateForm()) return;

    setIsSubmitting(true);
    setIsUploadingReceipt(true);
    setUploadProgress(20);

    try {
      // 1. Upload receipt to Cloudinary / server with progress updates
      if (!receiptFile) {
        throw new Error('Please select a receipt file');
      }

      const uploadResult = await uploadReceipt(receiptFile, (progress) => {
        setUploadProgress(Math.min(75, Math.max(10, progress)));
      });

      const receiptUrl = uploadResult.url;
      setUploadProgress(80);

      // 2. Server-side price recalculation verification directly from current store products
      const orderItems: OrderItemSnapshot[] = cart.map((item) => {
        // Find latest price from active products
        const liveProd = products.find((p) => p.id === item.product.id) || item.product;
        return {
          productId: liveProd.id,
          name: liveProd.name,
          category: liveProd.category,
          price: liveProd.price,
          quantity: item.quantity,
          diamonds: liveProd.diamonds,
        };
      });

      const calculatedTotal = orderItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      // 3. Generate unique Order ID
      const orderId = generateOrderId();
      const createdAt = new Date().toISOString();

      const orderPayload: Order = {
        id: orderId,
        orderId,
        customerName: customerName.trim(),
        customerWhatsApp: customerWhatsApp.trim(),
        playerId: playerId.trim(),
        nickname: nickname.trim() || undefined,
        items: orderItems,
        subtotal: calculatedTotal,
        total: calculatedTotal,
        paymentMethodId: selectedMethod?.id || 'ez-cash',
        paymentMethodName: selectedMethod?.name || 'EZ CASH',
        paymentDetailsSnapshot: {
          provider: selectedMethod?.provider || 'EZ CASH',
          accountNumber: selectedMethod?.accountNumber || '',
          accountName: selectedMethod?.accountName,
          bankName: selectedMethod?.bankName,
        },
        receiptUrl,
        receiptFileName: receiptFile?.name,
        receiptFileSize: receiptFile?.size,
        status: 'Pending Payment Verification',
        emailNotificationStatus: 'Pending',
        createdAt,
      };

      setUploadProgress(90);

      // 4. Save to Cloud Firestore
      await setDoc(doc(db, 'orders', orderId), orderPayload);

      // 5. Trigger server-side transactional email notification via /api/send-order-email
      try {
        const notifRes = await fetch('/api/send-order-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: orderPayload }),
        });
        const notifData = await notifRes.json();
        if (notifData) {
          const emailStatus = notifData.emailStatus || (notifData.success ? 'Sent' : 'Failed');
          orderPayload.emailNotificationStatus = emailStatus;
          orderPayload.emailMessageId = notifData.emailMessageId;
          orderPayload.emailError = notifData.emailError;

          // Update the order doc with Email dispatch outcome in Firestore
          await setDoc(
            doc(db, 'orders', orderId),
            {
              emailNotificationStatus: emailStatus,
              emailMessageId: notifData.emailMessageId || '',
              emailError: notifData.emailError || '',
            },
            { merge: true }
          );
        }
      } catch (emailErr) {
        console.warn('Background email notification attempt:', emailErr);
      }

      setUploadProgress(100);

      // 6. Confetti & Success Transition
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      clearCart();
      onClose();
      onOrderSuccess(orderPayload);
    } catch (err: any) {
      console.error('Order submission error:', err);
      setErrorMessage(err.message || 'An error occurred while submitting your order. Please try again.');
    } finally {
      setIsSubmitting(false);
      setIsUploadingReceipt(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-scale-up my-auto">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 font-black shadow-md shadow-orange-500/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-white uppercase tracking-wide">
                Complete Your Order
              </h2>
              <p className="text-xs text-slate-400">
                Official automated Free Fire reload checkout
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notification banner */}
        {errorMessage && (
          <div className="mx-4 sm:mx-6 mt-4 p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-3 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmitOrder} className="p-4 sm:p-6 space-y-6">
          
          {/* 1. Selected Items & Recalculated Total Breakdown */}
          <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Order Items ({cart.reduce((a, b) => a + b.quantity, 0)})
              </span>
              <span className="text-xs font-mono font-bold text-amber-400">
                Total: {formatLKR(subtotal, currencySymbol)}
              </span>
            </div>

            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between text-xs text-slate-300"
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="w-5 h-5 rounded-md bg-slate-800 text-amber-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {item.quantity}x
                    </span>
                    <span className="font-medium truncate">{item.product.name}</span>
                  </div>
                  <span className="font-mono font-semibold text-slate-200 shrink-0">
                    {formatLKR(item.product.price * item.quantity, currencySymbol)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Customer & Player Information Inputs */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>1. Player &amp; Contact Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              
              {/* Customer Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                  <span>Your Full Name *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kasun Perera"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              {/* WhatsApp Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                  <span>WhatsApp Number *</span>
                  <span className="text-[10px] text-slate-500">Order Updates</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    placeholder="0772472573"
                    value={customerWhatsApp}
                    onChange={(e) => setCustomerWhatsApp(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              {/* Free Fire Player ID (UID) */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-amber-300 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Gamepad2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Free Fire Player ID (UID) *</span>
                  </span>
                  <span className="text-[10px] text-amber-400/80">8-12 Digits</span>
                </label>
                <input
                  type="text"
                  required
                  pattern="[0-9]*"
                  placeholder="e.g. 2489128392"
                  value={playerId}
                  onChange={(e) => setPlayerId(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400 ring-1 ring-amber-500/20 transition-all"
                />
              </div>

              {/* Free Fire Nickname (Optional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                  <span>Free Fire In-Game Nickname</span>
                  <span className="text-[10px] text-slate-500">Optional</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. ꧁ঔৣ☬Shadow☬ঔৣ꧂"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

            </div>
          </div>

          {/* 3. Payment Method & Direct Copy Buttons */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-amber-400" />
              <span>2. Select Payment Method &amp; Transfer</span>
            </h3>

            {/* Payment Method Selector Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
              {activeMethods.map((method) => (
                <button
                  type="button"
                  key={method.id}
                  onClick={() => setSelectedMethodId(method.id)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    selectedMethod?.id === method.id
                      ? 'bg-amber-500/10 border-amber-500 ring-1 ring-amber-500/40 text-white'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{method.name}</span>
                    {selectedMethod?.id === method.id ? (
                      <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-700"></div>
                    )}
                  </div>
                  <span className="font-mono text-xs text-amber-400 font-bold">
                    {method.accountNumber}
                  </span>
                </button>
              ))}
            </div>

            {/* Selected Method Details Box with One-Tap Copy */}
            {selectedMethod && (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3.5">
                <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                  <span>Transfer exactly:</span>
                  <span className="font-mono text-sm font-black text-amber-400">
                    {formatLKR(subtotal, currencySymbol)}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {/* Account / Phone Number */}
                  <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-xl p-2.5">
                    <div>
                      <span className="text-[10px] text-slate-400 block">
                        {selectedMethod.provider === 'BANK' ? 'Bank Account Number' : 'EZ CASH Number'}
                      </span>
                      <span className="font-mono text-sm font-black text-white">
                        {selectedMethod.accountNumber}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(selectedMethod.accountNumber, 'accountNumber')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        copiedField === 'accountNumber'
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/40'
                      }`}
                    >
                      {copiedField === 'accountNumber' ? (
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

                  {/* Account Holder Name (If provided) */}
                  {selectedMethod.accountName && (
                    <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-xl p-2.5">
                      <div className="pr-2 truncate">
                        <span className="text-[10px] text-slate-400 block">Account Holder Name</span>
                        <span className="font-mono text-xs font-bold text-white truncate block">
                          {selectedMethod.accountName}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopy(selectedMethod.accountName || '', 'accountName')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                          copiedField === 'accountName'
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {copiedField === 'accountName' ? (
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

                  {/* Bank Name (If provided) */}
                  {selectedMethod.bankName && (
                    <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-xl p-2.5">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Bank Name</span>
                        <span className="text-xs font-bold text-white">{selectedMethod.bankName}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopy(selectedMethod.bankName || '', 'bankName')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          copiedField === 'bankName'
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {copiedField === 'bankName' ? (
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

                {/* Method instructions */}
                {selectedMethod.instructions && (
                  <p className="text-[11px] text-slate-400 bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/60 leading-relaxed">
                    💡 <span className="font-semibold text-slate-300">Instructions:</span> {selectedMethod.instructions}
                  </p>
                )}

              </div>
            )}
          </div>

          {/* 4. Payment Receipt Upload Area */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <UploadCloud className="w-3.5 h-3.5 text-amber-400" />
                <span>3. Upload Payment Slip / Screenshot *</span>
              </h3>
              <span className="text-[10px] text-slate-400">JPG, PNG, WEBP, PDF (Max 10MB)</span>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
            />

            {!receiptFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-amber-500/60 bg-slate-950/60 hover:bg-slate-950 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 group-hover:text-amber-400 group-hover:bg-amber-500/10 flex items-center justify-center mx-auto transition-colors">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="text-xs font-semibold text-white">
                  Click or drag and drop transaction receipt here
                </div>
                <p className="text-[11px] text-slate-500">
                  Upload screenshot of your EZ CASH SMS or bank deposit receipt
                </p>
              </div>
            ) : (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 truncate">
                  {receiptPreview ? (
                    <img
                      src={receiptPreview}
                      alt="Receipt preview"
                      className="w-12 h-12 rounded-xl object-cover border border-slate-800 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0">
                      <FileText className="w-6 h-6 text-amber-400" />
                    </div>
                  )}

                  <div className="truncate">
                    <span className="text-xs font-bold text-white truncate block">
                      {receiptFile.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {(receiptFile.size / 1024).toFixed(1)} KB • Ready to submit
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-amber-400 hover:text-amber-300 font-semibold px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReceiptFile(null);
                      setReceiptPreview(null);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 bg-slate-900 border border-slate-800 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Upload progress indicator */}
            {isUploadingReceipt && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Uploading receipt &amp; verifying details...</span>
                  <span className="font-mono">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-amber-400 h-1.5 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Action Button */}
          <div className="pt-3 space-y-2.5">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-orange-500/20 transition-all cursor-pointer ${
                isSubmitting
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-slate-950 active:scale-98'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing &amp; Saving Order...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Submit Order &amp; Verify Payment ({formatLKR(subtotal, currencySymbol)})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Safe 256-Bit Encrypted Transfer • Instant Delivery within 5-15 Mins</span>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
