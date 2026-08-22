import React from 'react';
import { MessageCircle, ShieldCheck, Zap } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { normalizeWhatsAppNumber } from '../utils/formatters';

export const SupportCtaSection: React.FC = () => {
  const { siteSettings } = useStore();
  const phone = normalizeWhatsAppNumber(siteSettings.contactWhatsApp || '0772472573');

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          <div className="md:col-span-8 space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase">
              <Zap className="w-3.5 h-3.5" />
              <span>Official 24/7 Helpdesk</span>
            </div>
            <h3 className="font-display text-xl sm:text-2xl font-black text-white">
              Need Instant Help with Your Top-Up or Payment?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Our official support agent is online on WhatsApp to answer questions, verify deposits, or assist with your Free Fire Player ID.
            </p>
          </div>

          <div className="md:col-span-4 flex flex-col sm:flex-row md:flex-col items-center justify-center gap-3">
            <a
              href={`https://wa.me/${phone}?text=Hello%20Error%20Topup%20Store%2C%20I%20need%20assistance%20with%20an%20order`}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto md:w-full px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <MessageCircle className="w-4 h-4 fill-slate-950" />
              <span>Chat on WhatsApp</span>
            </a>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Official Support: {siteSettings.contactWhatsApp || '0772472573'}</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
