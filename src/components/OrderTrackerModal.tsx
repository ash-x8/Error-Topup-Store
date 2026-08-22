import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Order, OrderStatus } from '../types';
import { formatLKR, formatDateTime } from '../utils/formatters';
import { 
  Search, 
  Clock, 
  X, 
  AlertCircle, 
  Gamepad2, 
  ExternalLink
} from 'lucide-react';

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrderId?: string;
  currencySymbol: string;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  isOpen,
  onClose,
  initialOrderId = '',
  currencySymbol,
}) => {
  const { orders } = useStore();
  const [searchQuery, setSearchQuery] = useState(initialOrderId);
  const [matchedOrder, setMatchedOrder] = useState<Order | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (initialOrderId) {
      setSearchQuery(initialOrderId);
      handleSearch(initialOrderId);
    }
  }, [initialOrderId, orders]);

  if (!isOpen) return null;

  const handleSearch = (queryStr: string = searchQuery) => {
    const q = queryStr.trim().toLowerCase();
    if (!q) {
      setMatchedOrder(null);
      setHasSearched(false);
      return;
    }

    setHasSearched(true);
    // Search by Order ID or Player ID
    const found = orders.find(
      (o) =>
        o.orderId.toLowerCase() === q ||
        o.playerId.toLowerCase() === q ||
        o.customerWhatsApp.includes(q)
    );
    setMatchedOrder(found || null);
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'Completed':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'Processing':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
      case 'Payment Received':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'Rejected':
      case 'Cancelled':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      default:
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    }
  };

  const steps = [
    { title: 'Order Submitted', key: 'submitted' },
    { title: 'Payment Verification', key: 'verification' },
    { title: 'Processing Reload', key: 'processing' },
    { title: 'Completed', key: 'completed' },
  ];

  const getStepIndex = (status: OrderStatus) => {
    if (status === 'Completed') return 3;
    if (status === 'Processing') return 2;
    if (status === 'Payment Received') return 1;
    if (status === 'Rejected' || status === 'Cancelled') return -1;
    return 0;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-scale-up my-auto">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-white uppercase tracking-wide">
                Track Order Status
              </h2>
              <p className="text-xs text-slate-400">
                Live real-time delivery status &amp; receipt verification
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

        <div className="p-4 sm:p-6 space-y-6">
          
          {/* Search Bar Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Order ID (FF-...) or Player UID..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
            >
              Track
            </button>
          </form>

          {/* Matched Order Card */}
          {matchedOrder ? (
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-5">
              
              {/* Order Header & Status Badge */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Order Reference
                  </span>
                  <span className="font-mono text-base font-black text-white">
                    {matchedOrder.orderId}
                  </span>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Placed on {formatDateTime(matchedOrder.createdAt)}
                  </div>
                </div>

                <div className={`px-3.5 py-1.5 rounded-full border text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${getStatusColor(matchedOrder.status)}`}>
                  <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                  <span>{matchedOrder.status}</span>
                </div>
              </div>

              {/* Status Step Stepper */}
              {matchedOrder.status !== 'Rejected' && matchedOrder.status !== 'Cancelled' ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-4 gap-1 text-center">
                    {steps.map((step, idx) => {
                      const currentIdx = getStepIndex(matchedOrder.status);
                      const isDone = currentIdx >= idx;
                      const isCurrent = currentIdx === idx;
                      return (
                        <div key={step.key} className="space-y-1">
                          <div className={`h-1.5 rounded-full ${
                            isDone ? 'bg-emerald-500' : 'bg-slate-800'
                          }`}></div>
                          <span className={`text-[10px] font-semibold block leading-tight ${
                            isCurrent ? 'text-amber-400' : isDone ? 'text-slate-300' : 'text-slate-600'
                          }`}>
                            {step.title}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>Order is {matchedOrder.status}. Contact WhatsApp support for details.</span>
                </div>
              )}

              {/* Player & Payment Snapshot */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Free Fire UID</span>
                  <span className="font-mono font-bold text-white flex items-center gap-1">
                    <Gamepad2 className="w-3.5 h-3.5 text-amber-400" />
                    {matchedOrder.playerId}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px]">Customer Name</span>
                  <span className="text-white font-medium truncate block">
                    {matchedOrder.customerName}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px]">Total Paid</span>
                  <span className="font-mono font-black text-amber-400">
                    {formatLKR(matchedOrder.total, currencySymbol)}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Ordered Products
                </span>
                <div className="space-y-1.5">
                  {matchedOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/60 text-slate-300"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 font-bold">{item.quantity}x</span>
                        <span className="font-medium text-white">{item.name}</span>
                      </div>
                      <span className="font-mono font-semibold">
                        {formatLKR(item.price * item.quantity, currencySymbol)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin Note if any */}
              {matchedOrder.adminNote && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300 space-y-1">
                  <span className="font-bold block uppercase text-[10px]">Admin Note:</span>
                  <p>{matchedOrder.adminNote}</p>
                </div>
              )}

              {/* Receipt Link */}
              {matchedOrder.receiptUrl && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                  <span className="text-slate-400">Uploaded Payment Receipt:</span>
                  <a
                    href={matchedOrder.receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                  >
                    <span>View Receipt Slip</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

            </div>
          ) : hasSearched ? (
            <div className="bg-slate-950/60 border border-slate-800 rounded-3xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-white text-base">No Order Found</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                We couldn&apos;t find an order matching &quot;{searchQuery}&quot;. Please verify the Order ID or Player UID.
              </p>
            </div>
          ) : (
            <div className="bg-slate-950/40 border border-slate-800/80 rounded-3xl p-8 text-center space-y-2">
              <p className="text-xs text-slate-400">
                Enter your unique Order Reference Number (e.g. <span className="font-mono text-slate-300">FF-20260822-XXXXX</span>) or your Free Fire Player UID above to view real-time delivery status.
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
