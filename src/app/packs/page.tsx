"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  Plus,
  Library,
  CheckCircle2,
  Clock,
  ChevronRight,
  Sparkles,
  Grid,
  List,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { db } from "@/lib/firebase-client";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

interface PackRecord {
  id: string;
  title: string;
  category: string;
  questionCount: number;
  status: "Published" | "Draft" | "AI Generating";
  version: string;
  coverImage?: string;
}

export default function PacksPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [packs, setPacks] = useState<PackRecord[]>([]);
  const [fetching, setFetching] = useState(true);
  const [activeTab, setActiveTab] = useState("All");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      const q = query(collection(db, "packs"), orderBy("title", "asc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const packsData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || "Untitled Pack",
            category: data.category || "General",
            questionCount: data.questionCount || data.questions?.length || 0,
            status: data.status || "Published",
            version: data.version?.toString() || "1.0",
            coverImage: data.coverImage || data.thumbnail,
          };
        }) as PackRecord[];
        setPacks(packsData);
        setFetching(false);
      }, (err) => {
        console.error("Firestore Packs Error:", err);
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
            Trivia Packs
          </h2>
          <p className="text-zinc-500 text-sm">
            Create, manage, and deploy trivia content
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-white/5 text-white px-5 py-2.5 rounded-xl font-bold border border-white/10 hover:bg-white/10 transition-all">
            <Sparkles size={18} className="text-[#0fbd58]" />
            AI Pack Generator
          </button>
          <button className="flex items-center gap-2 bg-[#0fbd58] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#0db052] transition-all shadow-lg shadow-[#0fbd58]/20">
            <Plus size={18} />
            New Pack
          </button>
        </div>
      </div>

      {/* Filters and View Toggle */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-6">
          {["All", "History", "Culture", "Geography", "Music"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "text-sm font-bold transition-all relative pb-4",
                activeTab === tab
                  ? "text-[#0fbd58]"
                  : "text-zinc-500 hover:text-white",
              )}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0fbd58] rounded-full" />
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg border border-white/10">
          <button className="p-1.5 rounded-md bg-[#0fbd58]/20 text-[#0fbd58]">
            <Grid size={16} />
          </button>
          <button className="p-1.5 rounded-md text-zinc-500 hover:text-white transition-all">
            <List size={16} />
          </button>
        </div>
      </div>

        {fetching ? (
          <div className="col-span-full py-20 flex flex-col items-center gap-4">
             <div className="w-10 h-10 border-2 border-[#0fbd58] border-t-transparent rounded-full animate-spin" />
             <p className="text-zinc-500 font-medium animate-pulse text-sm">Synchronizing trivia catalogue...</p>
          </div>
        ) : packs.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center gap-4 bg-white/[0.02] rounded-[3rem] border border-dashed border-white/5">
             <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center text-zinc-600">
                <Library size={32} />
             </div>
             <p className="text-zinc-500 font-bold tracking-tight">No trivia packs found in the database.</p>
             <button className="text-[#0fbd58] text-sm font-bold hover:underline">Download Sample Pack</button>
          </div>
        ) : packs.filter(p => activeTab === "All" || p.category === activeTab).map((pack: PackRecord) => (
          <div
            key={pack.id}
            className="p-6 rounded-3xl bg-[#141d1a] border border-white/5 hover:border-[#0fbd58]/30 transition-all group cursor-pointer relative overflow-hidden"
          >
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
              <Library size={120} />
            </div>

            <div className="flex flex-col h-full space-y-4">
              <div className="flex items-start justify-between">
                <div className="w-20 h-20 rounded-2xl bg-black/40 flex items-center justify-center overflow-hidden border border-white/5 shadow-inner relative group-hover:shadow-[#0fbd58]/10 transition-all">
                  {pack.coverImage ? (
                    <Image
                      src={pack.coverImage.startsWith('http') ? pack.coverImage : `https://firebasestorage.googleapis.com/v0/b/naija-trivia.firebasestorage.app/o/${encodeURIComponent(pack.coverImage)}?alt=media`}
                      alt={pack.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                        e.currentTarget.src = "https://placehold.co/400x400/141d1a/0fbd58?text=Pack";
                      }}
                    />
                  ) : (
                    <Library className="text-zinc-600" size={32} />
                  )}
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest leading-none mb-1">
                    Version
                  </span>
                  <span className="text-xs font-bold text-white leading-none">
                    v{pack.version}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[#0fbd58] text-[10px] font-bold uppercase tracking-wider mb-1">
                  {pack.category}
                </p>
                <h3 className="text-lg font-bold text-white group-hover:text-[#0fbd58] transition-colors line-clamp-1">
                  {pack.title}
                </h3>
                <div className="flex items-center gap-2 mt-1.5 px-2 py-1 bg-black/20 rounded-lg w-fit border border-white/5">
                   <div className="w-1 h-1 rounded-full bg-[#0fbd58]" />
                   <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                     {pack.questionCount} Questions
                   </p>
                </div>
              </div>

              <div className="pt-4 mt-auto flex items-center justify-between border-t border-white/5">
                <div className="flex items-center gap-2">
                  {pack.status === "Published" ? (
                    <div className="flex items-center gap-1.5 text-[#0fbd58]">
                      <CheckCircle2 size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wide">
                        Live
                      </span>
                    </div>
                  ) : pack.status === "AI Generating" ? (
                    <div className="flex items-center gap-1.5 text-blue-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-wide">
                        Synthesizing...
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-orange-400">
                      <Clock size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wide">
                        Draft
                      </span>
                    </div>
                  )}
                </div>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:bg-[#0fbd58]/20 transition-all border border-transparent group-hover:border-[#0fbd58]/20">
                  <ChevronRight size={16} />
                </div>
              </div>
            </div>
          </div>
        ))}
    </main>
  );
}
