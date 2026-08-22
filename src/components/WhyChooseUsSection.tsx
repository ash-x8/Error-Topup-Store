import React from 'react';
import { ShieldCheck, Zap, Lock, Headphones, Sparkles } from 'lucide-react';

export const WhyChooseUsSection: React.FC = () => {
  const features = [
    {
      icon: ShieldCheck,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/30',
      title: '100% Safe & Ban-Proof',
      desc: 'Official direct server reload into your Free Fire Player ID. Zero risk of account penalties or diamond rollback.',
    },
    {
      icon: Lock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/30',
      title: 'No Password Needed',
      desc: 'We never ask for your game password or login credentials. Only your numeric UID is required.',
    },
    {
      icon: Zap,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10 border-orange-500/30',
      title: '5 to 15 Minute Dispatch',
      desc: 'High-speed automated order queue and quick receipt checking ensure your passes & diamonds land fast.',
    },
    {
      icon: Headphones,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/30',
      title: 'Dedicated WhatsApp Care',
      desc: 'Real human support available for payment questions, order updates, and player guidance at any hour.',
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center space-y-2 mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Why Gamers Choose Us</span>
        </div>
        <h2 className="font-display text-2xl sm:text-3xl font-black text-white">
          Sri Lanka's Most Reliable Top-Up Experience
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto">
          We built ERROR TOPUP STORE to provide gamers with transparent pricing, instant slip submission, and seamless reload delivery.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {features.map((feat, idx) => {
          const Icon = feat.icon;
          return (
            <div
              key={idx}
              className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 transition-all space-y-3 group"
            >
              <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${feat.bg} group-hover:scale-105 transition-transform`}>
                <Icon className={`w-5 h-5 ${feat.color}`} />
              </div>
              <h4 className="font-bold text-white text-sm sm:text-base">
                {feat.title}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {feat.desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
