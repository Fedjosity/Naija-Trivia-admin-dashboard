"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingBag,
  Plus,
  Star,
  Tag,
  Eye,
  Trash2,
  Palette,
  User,
  Crown,
  Award,
  Lightbulb,
  Clock,
  RotateCcw,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase-client";
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  Theme:           { label: 'Theme',           icon: Palette,    color: 'text-violet-400' },
  Avatar:          { label: 'Avatar',          icon: User,       color: 'text-sky-400' },
  Frame:           { label: 'Frame',           icon: Crown,      color: 'text-amber-400' },
  Title:           { label: 'Title',           icon: Award,      color: 'text-emerald-400' },
  HintPack:        { label: 'Hint Pack',       icon: Lightbulb,  color: 'text-yellow-400' },
  TimeExtender:    { label: 'Time Extender',   icon: Clock,      color: 'text-blue-400' },
  SecondChance:    { label: 'Second Chance',    icon: RotateCcw,  color: 'text-pink-400' },
  ScoreMultiplier: { label: 'Score Multiplier', icon: Zap,       color: 'text-orange-400' },
};

interface BoutiqueItemRecord {
  id: string;
  name: string;
  description: string;
  category: string;
  rarity: "Legendary" | "Epic" | "Rare" | "Common";
  price: number;
  adUnlockable: boolean;
  status: "Active" | "Draft";
  preview: string;
}

export default function BoutiquePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<BoutiqueItemRecord[]>([]);
  const [fetching, setFetching] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      const q = query(collection(db, "boutiqueItems"), orderBy("name", "asc"));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const data = snapshot.docs.map((d) => {
            const raw = d.data();
            return {
              id: d.id,
              name: raw.name || "Untitled",
              description: raw.description || "",
              category: raw.category || "Theme",
              rarity: raw.rarity || "Common",
              price: Number(raw.price) || 0,
              adUnlockable: !!raw.adUnlockable,
              status: raw.status || "Draft",
              preview: raw.preview || "",
            } as BoutiqueItemRecord;
          });
          setItems(data);
          setFetching(false);
        },
        (err) => {
          console.error("Firestore Boutique Error:", err);
          setFetching(false);
        },
      );
      return () => unsubscribe();
    }
  }, [user, loading, router]);

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete "${name}"? This action cannot be undone.`)) return;
    setDeleting(id);
    try {
      await deleteDoc(doc(db, "boutiqueItems", id));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete item");
    } finally {
      setDeleting(null);
    }
  };

  if (loading || !user) return null;

  const FILTER_TABS = ["All", ...Object.keys(CATEGORY_META)];
  const filtered = items.filter(
    (i) => activeFilter === "All" || i.category === activeFilter,
  );

  const rarityColor = (r: string) =>
    r === "Legendary" ? "text-orange-400 bg-orange-500/10 border-orange-500/20" :
    r === "Epic" ? "text-purple-400 bg-purple-500/10 border-purple-500/20" :
    r === "Rare" ? "text-blue-400 bg-blue-500/10 border-blue-500/20" :
    "text-zinc-400 bg-zinc-500/10 border-white/5";

  // Stats
  const totalActive = items.filter(i => i.status === "Active").length;
  const totalFree = items.filter(i => i.price === 0).length;

  return (
    <main className="flex-1 overflow-y-auto bg-[#0b0e0c] p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <ShoppingBag className="text-zinc-500" />
            Boutique Management
          </h2>
          <p className="text-zinc-500 text-sm font-medium">
            Manage items, cosmetics, boosts & economy
          </p>
        </div>
        <button
          onClick={() => router.push("/boutique/new")}
          className="flex items-center gap-2 bg-[#0fbd58] text-white px-5 py-2.5 rounded-2xl font-bold hover:bg-[#0db052] transition-all shadow-lg shadow-[#0fbd58]/20"
        >
          <Plus size={18} />
          Create New Item
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Items", value: items.length, icon: ShoppingBag, color: "text-[#0fbd58]" },
          { label: "Active Items", value: totalActive, icon: Star, color: "text-amber-400" },
          { label: "Free Items", value: totalFree, icon: Tag, color: "text-sky-400" },
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
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {FILTER_TABS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border",
              activeFilter === f
                ? "bg-[#0fbd58]/10 text-[#0fbd58] border-[#0fbd58]/20"
                : "text-zinc-500 hover:text-white border-transparent",
            )}
          >
            {f === "All" ? "All" : CATEGORY_META[f]?.label || f}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {fetching ? (
          <div className="col-span-full py-20 flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-[#0fbd58] border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-500 font-medium text-sm animate-pulse">
              Synchronizing boutique inventory...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center gap-4 bg-white/[0.02] rounded-[3rem] border border-dashed border-white/5 text-center">
            <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center text-zinc-600 mb-2">
              <ShoppingBag size={32} />
            </div>
            <p className="text-zinc-500 font-bold tracking-tight px-8">
              {activeFilter === "All"
                ? "The boutique is empty. Start adding items!"
                : `No ${CATEGORY_META[activeFilter]?.label || activeFilter} items yet.`}
            </p>
          </div>
        ) : (
          filtered.map((item) => {
            const catMeta = CATEGORY_META[item.category];
            const CatIcon = catMeta?.icon || ShoppingBag;

            return (
              <Link
                key={item.id}
                href={`/boutique/${item.id}`}
                className="group relative bg-[#141d1a] border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-[#0fbd58]/30 transition-all shadow-xl hover:shadow-[#0fbd58]/5 block"
              >
                {/* Preview Area */}
                <div className="h-48 bg-black/40 flex items-center justify-center relative overflow-hidden">
                  {item.preview ? (
                    <Image
                      src={
                        (item.preview.startsWith("http") || item.preview.startsWith("data:"))
                          ? item.preview
                          : `https://firebasestorage.googleapis.com/v0/b/naija-trivia.firebasestorage.app/o/${encodeURIComponent(item.preview)}?alt=media`
                      }
                      alt={item.name}
                      fill
                      className="object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                      unoptimized={item.preview.startsWith("data:")}
                    />
                  ) : (
                    <CatIcon className={cn("opacity-20", catMeta?.color || "text-zinc-600")} size={64} />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button className="p-2.5 bg-white text-black rounded-lg hover:scale-110 transition-transform shadow-xl" title="Preview">
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, item.id, item.name)}
                      disabled={deleting === item.id}
                      className="p-2.5 bg-red-500/80 text-white rounded-lg hover:scale-110 transition-transform shadow-xl"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={cn(
                          "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border",
                          rarityColor(item.rarity),
                        )}
                      >
                        {item.rarity}
                      </span>
                      <div className={cn("flex items-center gap-1.5 text-xs font-bold", catMeta?.color || "text-zinc-400")}>
                        <CatIcon size={12} />
                        <span>{catMeta?.label || item.category}</span>
                      </div>
                    </div>
                    <h3 className="text-white font-bold group-hover:text-[#0fbd58] transition-colors line-clamp-1">
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="text-zinc-600 text-xs font-medium mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">
                        {item.price === 0 ? "FREE" : `${item.price} 🐚`}
                      </span>
                      {item.adUnlockable && (
                        <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
                          AD
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 px-2.5 py-1 bg-black/20 rounded-lg border border-white/5">
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          item.status === "Active"
                            ? "bg-[#0fbd58] shadow-[0_0_8px_rgba(15,189,88,0.5)]"
                            : "bg-zinc-600",
                        )}
                      />
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                        {item.status}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </main>
  );
}
