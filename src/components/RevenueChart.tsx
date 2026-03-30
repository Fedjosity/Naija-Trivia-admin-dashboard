'use client';

import React from 'react';
import { CreditCard, Zap, TrendingUp } from 'lucide-react';

interface RevenueChartProps {
  boutique: number;
  subscriptions: number;
}

export default function RevenueChart({ boutique, subscriptions }: RevenueChartProps) {
  const total = boutique + subscriptions;
  const boutiquePerc = total > 0 ? (boutique / total) * 100 : 0;
  const subsPerc = total > 0 ? (subscriptions / total) * 100 : 0;

  return (
    <div className="p-8 rounded-[2.5rem] bg-[#141d1a] border border-white/5 space-y-6 relative overflow-hidden h-full flex flex-col justify-between">
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#facc15]/5 blur-[60px] translate-x-1/2 translate-y-1/2" />
      
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white tracking-tight">Revenue Mix</h3>
          <div className="flex items-center gap-1 text-[#facc15] text-[10px] font-black uppercase tracking-tighter">
            <TrendingUp size={12} />
            <span>+8% growth</span>
          </div>
        </div>
        <p className="text-zinc-500 text-xs mt-1">Boutique vs. Premium Subscriptions</p>
      </div>

      <div className="space-y-8">
        <div className="relative h-4 w-full bg-white/5 rounded-full overflow-hidden flex">
          <div 
            className="h-full bg-gradient-to-r from-[#facc15] to-[#f59e0b] transition-all duration-1000" 
            style={{ width: `${boutiquePerc}%` }} 
          />
          <div 
            className="h-full bg-gradient-to-r from-[#3b82f6] to-[#2563eb] transition-all duration-1000" 
            style={{ width: `${subsPerc}%` }} 
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#facc15]" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Boutique</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-white tracking-tighter">₦{boutique.toLocaleString()}</span>
              <span className="text-[10px] text-zinc-500 font-bold">{Math.round(boutiquePerc)}%</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10 w-fit">
               <CreditCard size={12} className="text-[#facc15]" />
               <span className="text-[9px] font-black text-white uppercase tracking-tighter">Skins & Items</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#3b82f6]" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Premium</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-white tracking-tighter">₦{subscriptions.toLocaleString()}</span>
              <span className="text-[10px] text-zinc-500 font-bold">{Math.round(subsPerc)}%</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10 w-fit">
               <Zap size={12} className="text-[#3b82f6]" />
               <span className="text-[9px] font-black text-white uppercase tracking-tighter">Naija Gold</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="pt-6 border-t border-white/5">
        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">
          Monthly projections suggest a <span className="text-white">15% surge</span> in subscriptions following the Lagos Trivia Cup event.
        </p>
      </div>
    </div>
  );
}
