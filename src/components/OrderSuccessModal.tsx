import React, { useState } from 'react';
import { Order } from '../types';
import { formatLKR, copyToClipboard } from '../utils/formatters';
import { 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink, 
  MessageCircle, 
  ArrowRight, 
  Clock, 
  Gamepad2
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface OrderSuccessModalProps {
  order: Order | null;
  onClose: () => void;
  onTrackOrder: (orderId: string) => void;
  currencySymbol: string;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  onClose,
  onTrackOrder,
  currencySymbol,
}) => {
  const { siteSettings } = useStore();
  const [copiedId, setCopiedId] = useState(false);

  if (!order) return null;

  const handleCopyOrderId = async () => {
    const success = await copyToClipboard(order.orderId);
    if (success) {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const whatsappCareNumber = (siteSettings.contactWhatsApp || '0772472573').replace(/\D/g, '');
  const whatsappChatUrl = `https://wa.me/${whatsappCareNumber}?text=${encodeURIComponent(
    `Hello FF Store Support! I have placed an order.\n\nOrder ID: ${order.orderId}\nPlayer ID: ${order.playerId}\nTotal: Rs. ${order.total.toLocaleString()}\nStatus: ${order.status}`
  )}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up my-auto">
        
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-center text-white space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto border border-white/30 shadow-lg">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-black uppercase tracking-wide">
            Order Placed Successfully!
          </h2>
          <p className="text-xs text-emerald-100 max-w-xs mx-auto">
            Your Free Fire top-up request has been recorded in our cloud system.
          </p>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          
          {/* Order Reference Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                Order Reference Number
              </span>
              <span className="font-mono text-base font-black text-amber-400">
                {order.orderId}
              </span>
            </div>

            <button
              onClick={handleCopyOrderId}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                copiedId
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {copiedId ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy ID</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Summary Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
            <div>
              <span className="text-slate-400 block text-[10px]">Free Fire UID</span>
              <span className="font-mono font-bold text-white flex items-center gap-1">
                <Gamepad2 className="w-3 h-3 text-amber-400" />
                {order.playerId}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px]">Total Paid</span>
              <span className="font-mono font-black text-amber-400">
                {formatLKR(order.total, currencySymbol)}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px]">Payment Method</span>
              <span className="text-white font-semibold">{order.paymentMethodName}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px]">Estimated Delivery</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3" /> 5 - 15 Mins
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-2.5 pt-2">
            
            {/* Direct WhatsApp Confirmation Link */}
            <a
              href={whatsappChatUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Message Store Support on WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {/* Track Live Order Status */}
            <button
              onClick={() => {
                onClose();
                onTrackOrder(order.orderId);
              }}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Track Live Order Status</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onClose}
              className="w-full py-2.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              Done / Return to Home
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
