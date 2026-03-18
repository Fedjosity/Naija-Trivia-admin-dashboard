"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Plus,
  Star,
  Tag,
  Eye,
  Settings2,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase-client";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

interface SkinRecord {
  id: string;
  name: string;
  type: "Legendary" | "Epic" | "Rare" | "Common";
  price: number;
  sales: number;
  status: "Active" | "Draft";
  preview: string;
}

export default function BoutiquePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [skins, setSkins] = useState<SkinRecord[]>([]);
  const [fetching, setFetching] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      const q = query(collection(db, "skins"), orderBy("name", "asc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const skinsData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || "Untitled Skin",
            type: data.type || "Common",
            price: Number(data.price) || 0,
            sales: Number(data.sales) || 0,
            status: data.status || "Active",
            preview: data.preview || "",
          };
        }) as SkinRecord[];
        setSkins(skinsData);
        setFetching(false);
      }, (err) => {
        console.error("Firestore Boutique Error:", err);
        setFetching(false);
      });
      return () => unsubscribe();
    }
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <main className="flex-1 overflow-y-auto bg-[#0b0e0c] p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Boutique Management
          </h2>
          <p className="text-zinc-500 text-sm">
            Manage skins, cosmetics, and economy items
          </p>
        </div>
        <button className="flex items-center gap-2 bg-[#0fbd58] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#0db052] transition-all shadow-lg shadow-[#0fbd58]/20">
          <Plus size={18} />
          Create New Item
        </button>
      </div>

      {/* Stats Cards for Boutique */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            label: "Total Sales",
            value: "3,564",
            icon: ShoppingBag,
            color: "text-blue-400",
          },
          {
            label: "Legendary Owned",
            value: "12%",
            icon: Star,
            color: "text-gold-400",
          },
          {
            label: "Active Items",
            value: "24",
            icon: Tag,
            color: "text-[#0fbd58]",
          },
        ].map((s, i) => (
          <div
            key={i}
            className="p-6 rounded-2xl bg-[#141d1a] border border-white/5 flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
              <s.icon className={s.color} size={24} />
            </div>
            <div>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">
                {s.label}
              </p>
              <h3 className="text-xl font-bold text-white">{s.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-4 bg-white/5 p-1.5 rounded-2xl w-fit">
        {["All", "Legendary", "Epic", "Rare", "Common"].map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all",
              activeFilter === f
                ? "bg-[#0fbd58] text-white"
                : "text-zinc-500 hover:text-white",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {fetching ? (
          <div className="col-span-full py-20 flex flex-col items-center gap-4">
             <div className="w-10 h-10 border-2 border-[#0fbd58] border-t-transparent rounded-full animate-spin" />
             <p className="text-zinc-500 font-medium text-sm animate-pulse">Synchronizing boutique inventory...</p>
          </div>
        ) : skins.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center gap-4 bg-white/[0.02] rounded-[3rem] border border-dashed border-white/5 text-center">
             <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center text-zinc-600 mb-2">
                <ShoppingBag size={32} />
             </div>
             <p className="text-zinc-500 font-bold tracking-tight px-8">The boutique is currently empty. Start adding skins to populate the store.</p>
          </div>
        ) : skins.filter(s => activeFilter === 'All' || s.type === activeFilter).map((skin: SkinRecord) => (
          <div key={skin.id} className="group relative bg-[#141d1a] border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-[#0fbd58]/30 transition-all shadow-xl hover:shadow-[#0fbd58]/5">
            {/* Preview Area */}
            <div className="h-48 bg-black/40 flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform">
              {skin.preview ? (
                <img 
                  src={skin.preview.startsWith('http') ? skin.preview : `https://firebasestorage.googleapis.com/v0/b/naija-trivia.firebasestorage.app/o/${encodeURIComponent(skin.preview)}?alt=media`}
                  alt={skin.name}
                  className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/141d1a/0fbd58?text=Skin';
                  }}
                />
              ) : (
                <ShoppingBag className="text-zinc-600" size={48} />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                 <button className="p-2.5 bg-white text-black rounded-lg hover:scale-110 transition-transform shadow-xl" title="Preview in App">
                    <Eye size={18} />
                 </button>
                 <button className="p-2.5 bg-white text-black rounded-lg hover:scale-110 transition-transform shadow-xl" title="Settings">
                    <Settings2 size={18} />
                 </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={cn(
                    "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md",
                    skin.type === 'Legendary' ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" :
                    skin.type === 'Epic' ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" :
                    skin.type === 'Rare' ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                    "bg-zinc-500/10 text-zinc-400 border border-white/5"
                  )}>
                    {skin.type}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-bold">{skin.sales} Sales</span>
                </div>
                <h3 className="text-white font-bold group-hover:text-[#0fbd58] transition-colors line-clamp-1">{skin.name}</h3>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest leading-none mb-1">Price</span>
                  <div className="flex items-center gap-1.5 text-white font-bold">
                    <Tag size={12} className="text-[#0fbd58]" />
                    <span className="text-sm">₦{skin.price.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 px-2.5 py-1 bg-black/20 rounded-lg border border-white/5">
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    skin.status === 'Active' ? "bg-[#0fbd58] shadow-[0_0_8px_rgba(15,189,88,0.5)]" : "bg-zinc-600"
                  )} />
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{skin.status}</span>
                </div>
              </div>

              <button className="w-full py-2.5 bg-white/5 border border-white/5 rounded-xl text-zinc-400 text-[11px] font-bold hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all flex items-center justify-center gap-2 group-hover:bg-white/[0.08]">
                <Trash2 size={14} />
                Remove Asset
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
