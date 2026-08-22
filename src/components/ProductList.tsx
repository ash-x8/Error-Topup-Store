import React, { useState } from 'react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { useCart } from '../context/CartContext';
import { formatLKR } from '../utils/formatters';
import { 
  Search, 
  Sparkles, 
  Layers, 
  Gem, 
  Award, 
  ArrowRight,
  Filter
} from 'lucide-react';

interface ProductListProps {
  products: Product[];
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
  currencySymbol: string;
}

export const ProductList: React.FC<ProductListProps> = ({
  products,
  activeCategory,
  onSelectCategory,
  currencySymbol,
}) => {
  const { totalItems, subtotal, setIsCartOpen } = useCart();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter only active products unless admin
  const activeProducts = products.filter((p) => p.active !== false);

  const filteredProducts = activeProducts.filter((p) => {
    // Category match
    const categoryMatches =
      activeCategory === 'all' || p.category === activeCategory;

    // Search query match
    const query = searchQuery.toLowerCase().trim();
    const searchMatches =
      !query ||
      p.name.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query);

    return categoryMatches && searchMatches;
  });

  const membershipCount = activeProducts.filter((p) => p.category === 'membership').length;
  const levelUpCount = activeProducts.filter((p) => p.category === 'level_up_pass').length;
  const topupCount = activeProducts.filter((p) => p.category === 'topup').length;

  return (
    <section id="products-catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Category Pills & Search Bar Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          <button
            onClick={() => onSelectCategory('all')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeCategory === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-orange-500/20'
                : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Catalog ({activeProducts.length})</span>
          </button>

          <button
            onClick={() => onSelectCategory('membership')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeCategory === 'membership'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-orange-500/20'
                : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Memberships ({membershipCount})</span>
          </button>

          <button
            onClick={() => onSelectCategory('level_up_pass')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeCategory === 'level_up_pass'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-orange-500/20'
                : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Level Up Pass ({levelUpCount})</span>
          </button>

          <button
            onClick={() => onSelectCategory('topup')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeCategory === 'topup'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-orange-500/20'
                : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Gem className="w-3.5 h-3.5" />
            <span>Diamonds ({topupCount})</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search passes, weekly, diamonds..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
            >
              Clear
            </button>
          )}
        </div>

      </div>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((prod) => (
            <ProductCard
              key={prod.id}
              product={prod}
              currencySymbol={currencySymbol}
            />
          ))}
        </div>
      ) : (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Filter className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-white text-base">No matching products found</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search keywords or switch category filter to &quot;All Catalog&quot;.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              onSelectCategory('all');
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl text-xs font-semibold"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Sticky Bottom Cart floating summary (Mobile & Desktop) */}
      {totalItems > 0 && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-30">
          <div className="bg-slate-900/95 backdrop-blur-md border border-amber-500/50 p-3.5 rounded-2xl shadow-2xl shadow-orange-500/20 flex items-center justify-between gap-3 animate-slide-up">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm shrink-0">
                {totalItems}
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Total Cart Amount</span>
                <span className="font-mono text-base font-black text-amber-400">
                  {formatLKR(subtotal, currencySymbol)}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:to-red-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <span>View Cart</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

    </section>
  );
};
