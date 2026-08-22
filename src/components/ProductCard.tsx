import React from 'react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { formatLKR } from '../utils/formatters';
import { Plus, Minus, ShoppingCart, Flame, Gem } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  currencySymbol: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  currencySymbol,
}) => {
  const { cart, addToCart, updateQuantity } = useCart();

  const cartItem = cart.find((item) => item.product.id === product.id);
  const inCartQty = cartItem?.quantity || 0;

  const categoryLabel =
    product.category === 'membership'
      ? 'Membership'
      : product.category === 'level_up_pass'
      ? 'Level Up Pass'
      : 'Top-Up Diamonds';

  return (
    <div className={`relative group bg-slate-900/90 border rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 ${
      inCartQty > 0
        ? 'border-amber-500/60 ring-1 ring-amber-500/30 bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/20'
        : 'border-slate-800 hover:border-slate-700 hover:shadow-xl hover:shadow-orange-500/5'
    }`}>
      
      {/* Top Badges */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
          {categoryLabel}
        </span>

        {product.badge && (
          <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 shadow-sm flex items-center gap-1">
            <Flame className="w-3 h-3 text-slate-950 fill-slate-950" />
            <span>{product.badge}</span>
          </span>
        )}
      </div>

      {/* Main Image & Content */}
      <div className="space-y-3">
        <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800/80">
          <img
            src={product.image}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {product.diamonds && (
            <div className="absolute bottom-2 right-2 bg-slate-950/90 backdrop-blur-sm border border-cyan-500/40 text-cyan-300 font-mono text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
              <Gem className="w-3 h-3 text-cyan-400" />
              <span>{product.diamonds.toLocaleString()} 💎</span>
            </div>
          )}
        </div>

        <div>
          <h3 className="font-display font-bold text-base sm:text-lg text-white group-hover:text-amber-400 transition-colors">
            {product.name}
          </h3>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>
      </div>

      {/* Pricing & Cart Action Area */}
      <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <div>
          <span className="text-[10px] text-slate-400 font-medium block">Price</span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-lg sm:text-xl font-black text-amber-400">
              {formatLKR(product.price, currencySymbol)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="font-mono text-xs text-slate-500 line-through">
                {formatLKR(product.originalPrice, currencySymbol)}
              </span>
            )}
          </div>
        </div>

        {/* Quantity Controls / Add to cart */}
        <div>
          {inCartQty === 0 ? (
            <button
              onClick={() => addToCart(product, 1)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all cursor-pointer active:scale-95"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-slate-950 border border-amber-500/50 rounded-xl p-1 shadow-inner">
              <button
                onClick={() => updateQuantity(product.id, inCartQty - 1)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                title="Decrease"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <span className="w-6 text-center font-mono font-black text-xs text-amber-400">
                {inCartQty}
              </span>

              <button
                onClick={() => updateQuantity(product.id, inCartQty + 1)}
                className="w-7 h-7 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center font-bold transition-colors cursor-pointer"
                title="Increase"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
