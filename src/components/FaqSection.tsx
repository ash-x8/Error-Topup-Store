import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How long does it take for diamonds or memberships to be credited?',
      a: 'Top-ups are typically processed and credited within 5 to 15 minutes after you upload a valid payment receipt. During high-traffic events, processing can take up to 30 minutes. You can track live progress with your Order ID.',
    },
    {
      q: 'Where do I find my Free Fire Player ID (UID)?',
      a: 'Open Free Fire on your device, tap your player profile avatar at the top left of the main lobby screen, and you will see your numeric UID (e.g. 2489128392) beneath your nickname. Simply tap the copy icon next to it.',
    },
    {
      q: 'Do you need my Free Fire account password or login?',
      a: 'No, NEVER! We only require your numeric Free Fire Player ID (UID). We will never ask for your password, Google, Facebook, or VK credentials under any circumstance.',
    },
    {
      q: 'What payment methods do you accept?',
      a: 'We accept Dialog eZ Cash mobile wallet transfers and Bank Transfers (online banking, mobile banking apps, or CDM cash deposit machines). Simply copy our official account details during checkout.',
    },
    {
      q: 'How do I track my order status?',
      a: 'You can use the "Track Order" button in the top navigation or enter your Order ID / Player UID into the search bar on this page to view real-time status updates directly from our database.',
    },
  ];

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Frequently Asked Questions</span>
        </div>
        <h2 className="font-display text-2xl sm:text-3xl font-black text-white">
          Got Questions? We Have Answers
        </h2>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden transition-colors"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
              >
                <span className="font-bold text-white text-xs sm:text-sm">
                  {faq.q}
                </span>
                <span className="text-slate-400 shrink-0">
                  {isOpen ? <ChevronUp className="w-4 h-4 text-cyan-400" /> : <ChevronDown className="w-4 h-4" />}
                </span>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-slate-400 text-xs leading-relaxed border-t border-slate-800/60 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
