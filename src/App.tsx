import { useState, useEffect } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { HomeOrderSearchBar } from './components/HomeOrderSearchBar';
import { ExpressTopupSection } from './components/ExpressTopupSection';
import { WhyChooseUsSection } from './components/WhyChooseUsSection';
import { ProductList } from './components/ProductList';
import { FaqSection } from './components/FaqSection';
import { SupportCtaSection } from './components/SupportCtaSection';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { HowToOrderModal } from './components/HowToOrderModal';
import { AdminDashboard } from './components/AdminDashboard';
import { Footer } from './components/Footer';
import { Order } from './types';
import { Loader2, Flame } from 'lucide-react';

function StoreMain() {
  const { products, currencySymbol, isLoading } = useStore();
  const [activeCategory, setActiveCategory] = useState('all');

  // Modals
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [recentOrderSuccess, setRecentOrderSuccess] = useState<Order | null>(null);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [trackerInitialOrderId, setTrackerInitialOrderId] = useState<string | undefined>(undefined);
  const [isHowToOrderOpen, setIsHowToOrderOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Check URL on mount and handle /admin or ?orderId= routing
  useEffect(() => {
    const checkRoute = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const searchParams = new URLSearchParams(window.location.search);
      const orderParam = searchParams.get('orderId') || searchParams.get('order');

      if (path === '/admin' || path.startsWith('/admin/') || hash === '#admin') {
        setIsAdminOpen(true);
      } else if (orderParam) {
        setTrackerInitialOrderId(orderParam);
        setIsTrackerOpen(true);
      } else if (path.startsWith('/order/')) {
        const orderIdFromPath = path.replace('/order/', '').trim();
        if (orderIdFromPath) {
          setTrackerInitialOrderId(orderIdFromPath);
          setIsTrackerOpen(true);
        }
      }
    };

    checkRoute();
    window.addEventListener('popstate', checkRoute);
    return () => window.removeEventListener('popstate', checkRoute);
  }, []);

  const openAdmin = () => {
    if (window.location.pathname !== '/admin') {
      window.history.pushState({}, '', '/admin');
    }
    setIsAdminOpen(true);
  };

  const closeAdmin = () => {
    setIsAdminOpen(false);
    if (window.location.pathname === '/admin') {
      window.history.pushState({}, '', '/');
    }
  };

  const scrollToProducts = () => {
    const el = document.getElementById('products-catalog');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToExpress = () => {
    const el = document.getElementById('express-topup');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOrderSuccess = (newOrder: Order) => {
    setRecentOrderSuccess(newOrder);
  };

  const handleTrackFromSuccess = (orderId: string) => {
    setRecentOrderSuccess(null);
    setTrackerInitialOrderId(orderId);
    setIsTrackerOpen(true);
  };

  const handleTrackSearch = (orderIdOrUid: string) => {
    setTrackerInitialOrderId(orderIdOrUid);
    setIsTrackerOpen(true);
  };

  if (isLoading && products.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center text-slate-950 animate-pulse shadow-xl shadow-orange-500/20">
          <Flame className="w-8 h-8 text-white" />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-300 font-bold">
          <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
          <span>Connecting to Error Topup Store...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* Navigation */}
      <Navbar
        activeTab={activeCategory}
        setActiveTab={(tab) => {
          setActiveCategory(tab);
          scrollToProducts();
        }}
        onOpenHowToOrder={() => setIsHowToOrderOpen(true)}
        onOpenTracker={() => {
          setTrackerInitialOrderId(undefined);
          setIsTrackerOpen(true);
        }}
        onOpenAdmin={openAdmin}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        <HeroSection
          onExploreProducts={scrollToExpress}
          onOpenHowToOrder={() => setIsHowToOrderOpen(true)}
          onOpenTracker={() => {
            setTrackerInitialOrderId(undefined);
            setIsTrackerOpen(true);
          }}
        />

        {/* Live Search Bar for Quick Order Tracking */}
        <HomeOrderSearchBar onSearch={handleTrackSearch} />

        {/* Senu Store Style Frictionless Express Top-Up Section */}
        <ExpressTopupSection
          onOrderSuccess={handleOrderSuccess}
          currencySymbol={currencySymbol}
        />

        {/* Trust & Reliability Pillars */}
        <WhyChooseUsSection />

        {/* Full Catalog & Multi-Product Cart Section */}
        <ProductList
          products={products}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          currencySymbol={currencySymbol}
        />

        {/* FAQ Section */}
        <FaqSection />

        {/* 24/7 WhatsApp Customer Helpdesk CTA */}
        <SupportCtaSection />
      </main>

      {/* Footer */}
      <Footer
        onOpenHowToOrder={() => setIsHowToOrderOpen(true)}
        onOpenTracker={() => {
          setTrackerInitialOrderId(undefined);
          setIsTrackerOpen(true);
        }}
        onOpenAdmin={openAdmin}
      />

      {/* Slide-over Cart Drawer */}
      <CartDrawer
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
        currencySymbol={currencySymbol}
      />

      {/* Checkout Form Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderSuccess={handleOrderSuccess}
        currencySymbol={currencySymbol}
      />

      {/* Order Success Celebration Modal */}
      <OrderSuccessModal
        order={recentOrderSuccess}
        onClose={() => setRecentOrderSuccess(null)}
        onTrackOrder={handleTrackFromSuccess}
        currencySymbol={currencySymbol}
      />

      {/* Live Order Tracker Modal */}
      <OrderTrackerModal
        isOpen={isTrackerOpen}
        onClose={() => setIsTrackerOpen(false)}
        initialOrderId={trackerInitialOrderId}
        currencySymbol={currencySymbol}
      />

      {/* How To Order Tutorial Modal */}
      <HowToOrderModal
        isOpen={isHowToOrderOpen}
        onClose={() => setIsHowToOrderOpen(false)}
      />

      {/* Admin Dashboard Modal */}
      <AdminDashboard
        isOpen={isAdminOpen}
        onClose={closeAdmin}
        currencySymbol={currencySymbol}
      />

    </div>
  );
}

export function App() {
  return (
    <StoreProvider>
      <CartProvider>
        <StoreMain />
      </CartProvider>
    </StoreProvider>
  );
}

export default App;

