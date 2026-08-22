import React from 'react';
import { useCart } from '../context/CartContext';
import { formatLKR } from '../utils/formatters';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingCart, 
  ArrowRight, 
  ShieldCheck, 
  Gem
} from 'lucide-react';

interface CartDrawerProps {
  onProceedToCheckout: () => void;
  currencySymbol: string;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  onProceedToCheckout,
  currencySymbol,
}) => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalItems,
    subtotal,
  } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-md flex justify-end">
      <div 
        className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-left"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold text-white uppercase">
                Your Order Cart
              </h2>
              <p className="text-[11px] text-slate-400">
                {totalItems} item{totalItems !== 1 ? 's' : ''} in cart
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-slate-400 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"
                title="Clear Cart"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setIsCartOpen(false)}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Your cart is empty</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                  Browse our memberships, level up passes, or diamond top-up packs and add multiple items to order together.
                </p>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold transition-colors cursor-pointer"
              >
                Browse Products
              </button>
            </div>
          ) : (
            cart.map((item) => {
              const itemTotal = item.product.price * item.quantity;
              return (
                <div
                  key={item.product.id}
                  className="bg-slate-950 border border-slate-800/90 rounded-2xl p-3.5 flex gap-3 items-center justify-between"
                >
                  {/* Thumbnail */}
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-xl object-cover border border-slate-800 shrink-0"
                  />

                  {/* Details */}
                  <div className="flex-1 min-w-0 pr-2">
                    <h4 className="font-bold text-white text-xs truncate">
                      {item.product.name}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span>{formatLKR(item.product.price, currencySymbol)} each</span>
                      {item.product.diamonds && (
                        <span className="text-cyan-400 flex items-center gap-0.5">
                          <Gem className="w-2.5 h-2.5" />
                          {item.product.diamonds} 💎
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-xs font-black text-amber-400 mt-1">
                      {formatLKR(itemTotal, currencySymbol)}
                    </div>
                  </div>

                  {/* Quantity & Remove */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl p-0.5">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center font-mono font-bold text-xs text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="w-6 h-6 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center font-bold transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* Footer Checkout Summary */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 space-y-4">
            
            {/* Price Calculations */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Selected Items ({totalItems})</span>
                <span className="font-mono">{formatLKR(subtotal, currencySymbol)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Delivery &amp; Service Fee</span>
                <span className="text-emerald-400 font-bold">FREE (0.00)</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                <span className="text-sm font-bold text-white">Grand Total</span>
                <span className="font-mono text-xl font-black text-amber-400">
                  {formatLKR(subtotal, currencySymbol)}
                </span>
              </div>
            </div>

            {/* Checkout CTA */}
            <button
              onClick={() => {
                setIsCartOpen(false);
                onProceedToCheckout();
              }}
              className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-slate-950 font-black py-3.5 rounded-xl text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all cursor-pointer transform active:scale-98"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Instant Server Verification &amp; 100% Ban-Proof</span>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
