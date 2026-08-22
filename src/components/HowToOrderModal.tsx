import React from 'react';
import { 
  X, 
  Gamepad2, 
  ShoppingCart, 
  CreditCard, 
  UploadCloud, 
  ShieldCheck
} from 'lucide-react';

interface HowToOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToOrderModal: React.FC<HowToOrderModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-scale-up my-auto">
        
        {/* Header */}
        <div className="p-4 sm:p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-white uppercase tracking-wide">
                How to Order in 4 Easy Steps
              </h2>
              <p className="text-xs text-slate-400">
                Official guide for instant Free Fire top-ups &amp; memberships
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps Content */}
        <div className="p-4 sm:p-6 space-y-4">
          
          {/* Step 1 */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex gap-3.5 items-start">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center shrink-0 mt-0.5">
              1
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4 text-amber-400" />
                <span>Select Products &amp; Add to Cart</span>
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Choose any combination of Weekly Lite, Weekly, Monthly Memberships, Level Up Pass, or Diamond packages. You can order multiple items in a single cart.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex gap-3.5 items-start">
            <div className="w-8 h-8 rounded-xl bg-orange-500 text-slate-950 font-black text-sm flex items-center justify-center shrink-0 mt-0.5">
              2
            </div>
            <div className="space-y-1.5">
              <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                <Gamepad2 className="w-4 h-4 text-orange-400" />
                <span>Enter Your Free Fire Player UID</span>
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Open Free Fire &gt; Click your avatar on the top-left &gt; Copy your 8 to 12 digit numeric Player ID (UID). Paste it into the checkout field.
              </p>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-[11px] text-amber-300/90 font-mono">
                Example UID: 2489128392 (No account password needed, 100% safe!)
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex gap-3.5 items-start">
            <div className="w-8 h-8 rounded-xl bg-red-500 text-white font-black text-sm flex items-center justify-center shrink-0 mt-0.5">
              3
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-red-400" />
                <span>Pay via EZ CASH or Bank Transfer</span>
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Choose your preferred payment method on checkout. Use the single-tap <span className="text-amber-400 font-bold">[COPY]</span> button to copy the EZ CASH number or Bank account number without mistakes, and complete the transfer.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex gap-3.5 items-start">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 font-black text-sm flex items-center justify-center shrink-0 mt-0.5">
              4
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-emerald-400" />
                <span>Upload Payment Proof &amp; Receive Reload</span>
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Take a screenshot of your EZ CASH SMS or bank receipt slip and upload it in the checkout form. Submit your order and receive your reload directly in-game within 5 to 15 minutes!
              </p>
            </div>
          </div>

          {/* Trust Footer */}
          <div className="pt-2 flex items-center justify-center gap-2 text-xs text-slate-400 text-center">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>100% Garena Official Servers • Instant WhatsApp Verification</span>
          </div>

        </div>

        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Got It, Let&apos;s Shop!
          </button>
        </div>

      </div>
    </div>
  );
};
