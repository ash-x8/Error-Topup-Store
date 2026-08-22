import React from 'react';
import { 
  Flame, 
  ShieldCheck, 
  Lock, 
  Zap, 
  MessageCircle, 
  HelpCircle, 
  Clock, 
  ExternalLink 
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { normalizeWhatsAppNumber } from '../utils/formatters';

interface FooterProps {
  onOpenHowToOrder: () => void;
  onOpenTracker: () => void;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenHowToOrder,
  onOpenTracker,
  onOpenAdmin,
}) => {
  const { siteSettings } = useStore();

  const whatsappCare = normalizeWhatsAppNumber(siteSettings.contactWhatsApp || '0772472573');

  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 pt-12 pb-8 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Main 4 Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Col 1: Brand */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-red-600 flex items-center justify-center text-white shadow-md">
                <Flame className="w-5 h-5" />
              </div>
              <span className="font-display font-black text-base text-white tracking-wider">
                {siteSettings.websiteName || 'FREE FIRE TOP-UP'}
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              {siteSettings.aboutText ||
                'The official trusted Sri Lankan Free Fire store. Instant automated top-ups for Weekly Lite, Weekly, Monthly, and Diamonds with real-time receipt verification.'}
            </p>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs">Quick Access</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={onOpenHowToOrder}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>How to Order Guide</span>
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenTracker}
                  className="hover:text-cyan-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Track Order Status</span>
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenAdmin}
                  className="hover:text-red-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-red-400" />
                  <span>Admin Control Portal</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Customer Care */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs">Customer Support</h4>
            <p className="text-slate-400 text-xs">
              Need assistance with an order or payment? Reach our official WhatsApp team.
            </p>
            {whatsappCare && (
              <a
                href={`https://wa.me/${whatsappCare}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 font-bold hover:bg-emerald-600/30 transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp: {siteSettings.contactWhatsApp}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Col 4: Trust & Guarantees */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs">Guarantees</h4>
            <div className="space-y-2 text-[11px]">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>100% Ban-Proof Official Garena UID Reload</span>
              </div>
              <div className="flex items-center gap-2 text-cyan-400 font-semibold">
                <Zap className="w-4 h-4 shrink-0" />
                <span>Automated 5 - 15 Minutes Dispatch</span>
              </div>
              <div className="flex items-center gap-2 text-amber-400 font-semibold">
                <Lock className="w-4 h-4 shrink-0" />
                <span>Verified EZ CASH &amp; People&apos;s Bank Accounts</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom copyright disclaimer */}
        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 text-center sm:text-left">
          <p>
            {siteSettings.footerText || '© 2026 Free Fire Top-Up Store. All Rights Reserved.'}
          </p>
          <p className="text-[10px]">
            Free Fire is a registered trademark of Garena International.
          </p>
        </div>

      </div>
    </footer>
  );
};
