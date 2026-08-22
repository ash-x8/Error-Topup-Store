import React from 'react';
import { 
  Zap, 
  ShieldCheck, 
  Flame, 
  CreditCard, 
  ArrowRight,
  Search,
  HelpCircle
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface HeroSectionProps {
  onExploreProducts: () => void;
  onOpenHowToOrder: () => void;
  onOpenTracker: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreProducts,
  onOpenHowToOrder,
  onOpenTracker,
}) => {
  const { siteSettings } = useStore();

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pt-8 pb-12 sm:pt-12 sm:pb-16 border-b border-slate-800/80">
      
      {/* Background Cyber Glow Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Text & CTA */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            {/* Top Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5 text-orange-400 animate-bounce" />
              <span>Sri Lanka's Trusted Direct UID Top-Up</span>
            </div>

            {/* Headline */}
            <div>
              <h1 className="font-display text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white uppercase">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-red-500">
                  {siteSettings.websiteName || 'ERROR TOPUP STORE'}
                </span>
              </h1>
              <p className="font-display text-lg sm:text-2xl font-bold text-amber-300/90 mt-1 tracking-wide">
                {siteSettings.tagline || 'Fast. Secure. Simple Game Top-Ups.'}
              </p>
            </div>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              {siteSettings.heroSubtitle ||
                'Direct diamond reload, Weekly Lite, Weekly, Monthly Memberships, and Level Up Passes delivered safely to your Free Fire Player ID with automated receipt verification.'}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
              <button
                onClick={onExploreProducts}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-orange-500/25 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Zap className="w-4 h-4 text-slate-950 fill-slate-950" />
                <span>TOP UP NOW</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>

              <button
                onClick={onOpenTracker}
                className="px-5 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-cyan-200 font-bold text-xs sm:text-sm border border-cyan-500/30 hover:border-cyan-500/60 transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-cyan-500/10"
              >
                <Search className="w-4 h-4 text-cyan-400" />
                <span>CHECK ORDER</span>
              </button>

              <button
                onClick={onOpenHowToOrder}
                className="px-4 py-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs sm:text-sm border border-slate-800 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span>How It Works</span>
              </button>
            </div>

            {/* Micro Highlights */}
            <div className="grid grid-cols-3 gap-2 pt-4 max-w-lg mx-auto lg:mx-0 text-left">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center gap-1.5 text-orange-400 font-black text-xs">
                  <Zap className="w-3.5 h-3.5" />
                  <span>5-15 Mins</span>
                </div>
                <div className="text-[10px] text-slate-400">Fast Dispatch</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center gap-1.5 text-emerald-400 font-black text-xs">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>100% Safe</span>
                </div>
                <div className="text-[10px] text-slate-400">UID Reload Only</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center gap-1.5 text-cyan-400 font-black text-xs">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>EZ Cash &amp; Bank</span>
                </div>
                <div className="text-[10px] text-slate-400">Instant Slip Proof</div>
              </div>
            </div>

          </div>

          {/* Right Visual Bento Showcase */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
              
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
                  <span className="text-xs font-bold text-slate-300">LIVE PROMO DEALS</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  AUTOMATED DISPATCH
                </span>
              </div>

              {/* Sample Membership Spotlight */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-950/40 to-slate-900 border border-orange-500/30 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-extrabold uppercase">
                    HOT SELLER
                  </span>
                  <h4 className="font-bold text-white text-sm">Weekly Pass + VIP Perks</h4>
                  <p className="text-[11px] text-slate-400">Instant 100 💎 + 35 💎/Day for 7 Days</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 line-through block">Rs. 650</span>
                  <span className="font-mono text-base font-black text-amber-400">Rs. 550</span>
                </div>
              </div>

              {/* Step Flow Preview */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] flex items-center justify-center shrink-0">1</span>
                  <span>Select product package &amp; enter Player ID</span>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] flex items-center justify-center shrink-0">2</span>
                  <span>Transfer via EZ Cash or Bank &amp; upload slip</span>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] flex items-center justify-center shrink-0">3</span>
                  <span>Diamonds &amp; passes credited directly to your UID</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

