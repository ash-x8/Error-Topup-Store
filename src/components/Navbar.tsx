import React, { useState } from 'react';
import { 
  Flame, 
  ShoppingCart, 
  HelpCircle, 
  Clock, 
  Lock, 
  Menu, 
  X, 
  Sparkles,
  Zap,
  PhoneCall
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useCart } from '../context/CartContext';
import { formatLKR } from '../utils/formatters';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenHowToOrder: () => void;
  onOpenTracker: () => void;
  onOpenAdmin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenHowToOrder,
  onOpenTracker,
  onOpenAdmin,
}) => {
  const { siteSettings, isAdmin, currencySymbol } = useStore();
  const { totalItems, subtotal, setIsCartOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      {/* Top Dynamic Announcement Bar */}
      {siteSettings.announcementActive && siteSettings.announcement && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 px-4 py-1.5 text-xs text-white font-bold text-center tracking-wide flex items-center justify-center gap-2 shadow-inner">
          <Zap className="w-3.5 h-3.5 animate-pulse text-yellow-200" />
          <span>{siteSettings.announcement}</span>
        </div>
      )}

      {/* Main Nav Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand Logo */}
          <div 
            onClick={() => setActiveTab('all')}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-amber-600 via-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/25 border border-amber-400/40 group-hover:scale-105 transition-transform">
              <Flame className="w-6 h-6 text-white drop-shadow-md" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-black text-lg sm:text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-red-400">
                  {siteSettings.websiteName || 'FREE FIRE STORE'}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-bold uppercase tracking-wider">
                  OFFICIAL
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium tracking-tight">
                {siteSettings.tagline || 'Memberships & Diamond Top-Up'}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1.5 bg-slate-900/90 border border-slate-800/90 p-1.5 rounded-2xl">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-md shadow-orange-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              All Products
            </button>
            <button
              onClick={() => setActiveTab('membership')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'membership'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-md shadow-orange-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Memberships</span>
            </button>
            <button
              onClick={() => setActiveTab('level_up_pass')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'level_up_pass'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-md shadow-orange-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Level Up Pass
            </button>
            <button
              onClick={() => setActiveTab('topup')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'topup'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-md shadow-orange-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Diamonds Top-Up
            </button>
          </nav>

          {/* Right Action Icons & Cart */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* How to order button */}
            <button
              onClick={onOpenHowToOrder}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>How to Order</span>
            </button>

            {/* Track order button */}
            <button
              onClick={onOpenTracker}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
            >
              <Clock className="w-4 h-4 text-cyan-400" />
              <span className="hidden md:inline">Track Order</span>
            </button>

            {/* Admin Dashboard Trigger */}
            <button
              onClick={onOpenAdmin}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isAdmin
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
              title="Admin Portal"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAdmin ? 'Admin Panel' : 'Admin'}</span>
              {isAdmin && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              )}
            </button>

            {/* Cart Trigger Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-orange-500/20 transition-all cursor-pointer active:scale-95"
            >
              <div className="relative">
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2.5 bg-slate-950 text-amber-400 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-amber-400">
                    {totalItems}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline">
                {totalItems === 0 ? 'Cart' : formatLKR(subtotal, currencySymbol)}
              </span>
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-950 border-b border-slate-800 px-4 pt-2 pb-6 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setActiveTab('all');
                setMobileMenuOpen(false);
              }}
              className={`p-2.5 rounded-xl text-xs font-bold text-left ${
                activeTab === 'all' ? 'bg-orange-500 text-slate-950' : 'bg-slate-900 text-slate-200'
              }`}
            >
              All Products
            </button>
            <button
              onClick={() => {
                setActiveTab('membership');
                setMobileMenuOpen(false);
              }}
              className={`p-2.5 rounded-xl text-xs font-bold text-left ${
                activeTab === 'membership' ? 'bg-orange-500 text-slate-950' : 'bg-slate-900 text-slate-200'
              }`}
            >
              Memberships
            </button>
            <button
              onClick={() => {
                setActiveTab('level_up_pass');
                setMobileMenuOpen(false);
              }}
              className={`p-2.5 rounded-xl text-xs font-bold text-left ${
                activeTab === 'level_up_pass' ? 'bg-orange-500 text-slate-950' : 'bg-slate-900 text-slate-200'
              }`}
            >
              Level Up Pass
            </button>
            <button
              onClick={() => {
                setActiveTab('topup');
                setMobileMenuOpen(false);
              }}
              className={`p-2.5 rounded-xl text-xs font-bold text-left ${
                activeTab === 'topup' ? 'bg-orange-500 text-slate-950' : 'bg-slate-900 text-slate-200'
              }`}
            >
              Diamonds Top-Up
            </button>
          </div>

          <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-xs text-slate-400">
            <button
              onClick={() => {
                onOpenHowToOrder();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-1 text-amber-400 font-semibold"
            >
              <HelpCircle className="w-4 h-4" />
              <span>How To Order Guide</span>
            </button>

            {siteSettings.contactWhatsApp && (
              <a
                href={`https://wa.me/${siteSettings.contactWhatsApp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-emerald-400 font-semibold"
              >
                <PhoneCall className="w-4 h-4" />
                <span>WhatsApp Care</span>
              </a>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
