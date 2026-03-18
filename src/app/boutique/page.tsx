'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  ShoppingBag, 
  Plus, 
  Star, 
  Tag, 
  Eye,
  Settings2,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Skin {
  id: string;
  name: string;
  type: 'Legendary' | 'Epic' | 'Rare' | 'Common';
  price: number;
  sales: number;
  status: 'Active' | 'Draft';
  preview: string;
}

const MOCK_SKINS: Skin[] = [
  { id: 's1', name: 'Golden Eagle', type: 'Legendary', price: 2500, sales: 124, status: 'Active', preview: '🦅' },
  { id: 's2', name: 'Lagos Night', type: 'Epic', price: 1200, sales: 450, status: 'Active', preview: '🌙' },
  { id: 's3', name: 'Savannah Pulse', type: 'Rare', price: 500, sales: 890, status: 'Active', preview: '🦁' },
  { id: 's4', name: 'Batique Pattern', type: 'Common', price: 150, sales: 2100, status: 'Active', preview: '🎨' },
  { id: 's5', name: 'Indigo Dream', type: 'Epic', price: 1000, sales: 0, status: 'Draft', preview: '✨' },
];

export default function BoutiquePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <main className="flex-1 overflow-y-auto bg-[#0b0e0c] p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Boutique Management</h2>
          <p className="text-zinc-500 text-sm">Manage skins, cosmetics, and economy items</p>
        </div>
        <button className="flex items-center gap-2 bg-[#0fbd58] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#0db052] transition-all shadow-lg shadow-[#0fbd58]/20">
          <Plus size={18} />
          Create New Item
        </button>
      </div>

      {/* Stats Cards for Boutique */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Sales', value: '3,564', icon: ShoppingBag, color: 'text-blue-400' },
          { label: 'Legendary Owned', value: '12%', icon: Star, color: 'text-gold-400' },
          { label: 'Active Items', value: '24', icon: Tag, color: 'text-[#0fbd58]' },
        ].map((s, i) => (
          <div key={i} className="p-6 rounded-2xl bg-[#141d1a] border border-white/5 flex items-center gap-4">
             <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                <s.icon className={s.color} size={24} />
             </div>
             <div>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">{s.label}</p>
                <h3 className="text-xl font-bold text-white">{s.value}</h3>
             </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-4 bg-white/5 p-1.5 rounded-2xl w-fit">
        {['All', 'Legendary', 'Epic', 'Rare', 'Common'].map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all",
              activeFilter === f ? "bg-[#0fbd58] text-white" : "text-zinc-500 hover:text-white"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {MOCK_SKINS.filter(s => activeFilter === 'All' || s.type === activeFilter).map((skin) => (
          <div key={skin.id} className="group relative bg-[#141d1a] border border-white/5 rounded-[2rem] overflow-hidden hover:border-[#0fbd58]/30 transition-all">
            {/* Preview Area */}
            <div className="h-40 bg-gradient-to-br from-[#0fbd58]/10 to-transparent flex items-center justify-center text-5xl relative group-hover:scale-105 transition-transform">
              {skin.preview}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                 <button className="p-2.5 bg-white text-black rounded-lg hover:scale-110 transition-transform" title="Preview in App">
                    <Eye size={18} />
                 </button>
                 <button className="p-2.5 bg-white text-black rounded-lg hover:scale-110 transition-transform" title="Settings">
                    <Settings2 size={18} />
                 </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                   <span className={cn(
                     "text-[9px] font-bold uppercase tracking-widest",
                     skin.type === 'Legendary' ? "text-orange-400" :
                     skin.type === 'Epic' ? "text-purple-400" :
                     skin.type === 'Rare' ? "text-blue-400" : "text-zinc-400"
                   )}>{skin.type}</span>
                   <span className="text-[10px] font-bold text-zinc-500">{skin.sales} Sales</span>
                </div>
                <h3 className="text-lg font-bold text-white">{skin.name}</h3>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 p-2 bg-black/20 rounded-xl border border-white/5">
                   <div className="w-4 h-4 rounded-full bg-gold-500 flex items-center justify-center text-[8px] font-bold text-black bg-yellow-500">₦</div>
                   <span className="text-sm font-bold text-white">{skin.price}</span>
                </div>
                <div className="flex items-center gap-1">
                   {skin.status === 'Active' ? (
                     <div className="w-2 h-2 rounded-full bg-[#0fbd58]" />
                   ) : (
                     <div className="w-2 h-2 rounded-full bg-zinc-600" />
                   )}
                   <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{skin.status}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                 <button className="text-xs font-bold text-zinc-500 hover:text-white transition-colors">Edit Item</button>
                 <button className="text-red-500/50 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                 </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
