"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Library,
  CheckCircle2,
  Clock,
  ChevronRight,
  Sparkles,
  Grid,
  List,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { db } from "@/lib/firebase-client";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";

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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [deleting, setDeleting] = useState<string | null>(null);

  const CATEGORIES = [
    "All",
    "History",
    "Culture",
    "Geography",
    "Music",
    "Sports",
  ];

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      const q = query(collection(db, "packs"), orderBy("title", "asc"));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
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
            } as PackRecord;
          });
          setPacks(packsData);
          setFetching(false);
        },
        (err) => {
          console.error("Firestore Packs Error:", err);
          setFetching(false);
        },
      );

      return () => unsubscribe();
    }
  }, [user, loading, router]);

  const handleDeletePack = async (
    e: React.MouseEvent,
    packId: string,
    packTitle: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      !window.confirm(
        `Are you sure you want to delete "${packTitle}"? This action cannot be undone.`,
      )
    )
      return;

    setDeleting(packId);
    try {
      await deleteDoc(doc(db, "packs", packId));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete pack.");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return null;

  const filteredPacks = packs.filter(
    (p) => activeTab === "All" || p.category === activeTab,
  );

  const statusBadge = (status: PackRecord["status"]) => {
    if (status === "Published") {
      return (
        <div className="flex items-center gap-1.5 text-[#0fbd58]">
          <CheckCircle2 size={14} />
          <span className="text-[10px] font-bold uppercase tracking-wide">
            Live
          </span>
        </div>
      );
    }
    if (status === "AI Generating") {
      return (
        <div className="flex items-center gap-1.5 text-blue-400">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-wide">
            Synthesizing...
          </span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 text-orange-400">
        <Clock size={14} />
        <span className="text-[10px] font-bold uppercase tracking-wide">
          Draft
        </span>
      </div>
    );
  };

  return (
    <main className="flex-1 overflow-y-auto bg-[#0b0e0c] p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Library className="text-zinc-500" />
            Trivia Catalogue
          </h2>
          <p className="text-zinc-500 text-sm font-medium">
            Manage and synthesize your game content
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/packs/new?ai=true")}
            className="flex items-center gap-2 bg-white/5 text-white px-5 py-2.5 rounded-2xl font-bold hover:bg-white/10 transition-all border border-white/5"
          >
            <Sparkles size={18} className="text-[#0fbd58]" />
            AI Pack Generator
          </button>
          <button
            onClick={() => router.push("/packs/new")}
            className="flex items-center gap-2 bg-[#0fbd58] text-white px-5 py-2.5 rounded-2xl font-bold hover:bg-[#0db052] transition-all shadow-lg shadow-[#0fbd58]/20"
          >
            <Plus size={18} />
            New Pack
          </button>
        </div>
      </div>

      {/* Filters & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border",
                activeTab === cat
                  ? "bg-[#0fbd58]/10 text-[#0fbd58] border-[#0fbd58]/20"
                  : "text-zinc-500 hover:text-white border-transparent",
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-black/20 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-2 rounded-lg transition-colors",
              viewMode === "grid"
                ? "text-[#0fbd58] bg-white/5 border border-white/5"
                : "text-zinc-600 hover:text-white border border-transparent",
            )}
          >
            <Grid size={16} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-2 rounded-lg transition-colors",
              viewMode === "list"
                ? "text-[#0fbd58] bg-white/5 border border-white/5"
                : "text-zinc-600 hover:text-white border border-transparent",
            )}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      {fetching ? (
        <div className="py-20 flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#0fbd58] border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 font-medium animate-pulse text-sm">
            Synchronizing trivia catalogue...
          </p>
        </div>
      ) : filteredPacks.length === 0 ? (
        <div className="py-20 flex flex-col items-center gap-4 bg-white/[0.02] rounded-[3rem] border border-dashed border-white/5">
          <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center text-zinc-600">
            <Library size={32} />
          </div>
          <p className="text-zinc-500 font-bold tracking-tight">
            No trivia packs found in the database.
          </p>
          <button className="text-[#0fbd58] text-sm font-bold hover:underline">
            Download Sample Pack
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* ── Grid View ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPacks.map((pack) => (
            <Link
              key={pack.id}
              href={`/packs/${pack.id}`}
              className="p-6 rounded-3xl bg-[#141d1a] border border-white/5 hover:border-[#0fbd58]/30 transition-all group cursor-pointer relative overflow-hidden block"
            >
              {/* Background Pattern */}
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 pointer-events-none">
                <Library size={120} />
              </div>

              <div className="flex flex-col h-full space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-20 h-20 rounded-2xl bg-black/40 flex items-center justify-center overflow-hidden border border-white/5 shadow-inner relative group-hover:shadow-[#0fbd58]/10 transition-all">
                    {pack.coverImage ? (
                      <Image
                        src={
                          pack.coverImage.startsWith("http")
                            ? pack.coverImage
                            : `https://firebasestorage.googleapis.com/v0/b/naija-trivia.firebasestorage.app/o/${encodeURIComponent(pack.coverImage)}?alt=media`
                        }
                        alt={pack.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(
                          e: React.SyntheticEvent<HTMLImageElement, Event>,
                        ) => {
                          e.currentTarget.src =
                            "https://placehold.co/400x400/141d1a/0fbd58?text=Pack";
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
                  {statusBadge(pack.status)}
                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDeletePack(e, pack.id, pack.title)}
                    disabled={deleting === pack.id}
                    className=" p-2 rounded-xl bg-black/40 border border-white/5 text-zinc-600 hover:text-red-400 hover:border-red-400/30 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>

                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:bg-[#0fbd58]/20 transition-all border border-transparent group-hover:border-[#0fbd58]/20">
                    <ChevronRight size={16} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* ── List View ── */
        <div className="space-y-2">
          {/* List header */}
          <div className="grid grid-cols-[1fr_120px_100px_100px_80px_40px] gap-4 px-6 py-3 text-[10px] font-bold text-zinc-600 uppercase tracking-widest border-b border-white/5">
            <span>Pack</span>
            <span>Category</span>
            <span>Questions</span>
            <span>Status</span>
            <span>Version</span>
            <span />
          </div>
          {filteredPacks.map((pack) => (
            <Link
              key={pack.id}
              href={`/packs/${pack.id}`}
              className="grid grid-cols-[1fr_120px_100px_100px_80px_40px] gap-4 items-center px-6 py-4 rounded-2xl bg-[#141d1a] border border-white/5 hover:border-[#0fbd58]/30 transition-all group cursor-pointer"
            >
              {/* Pack title + thumbnail */}
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-black/40 flex-shrink-0 flex items-center justify-center overflow-hidden border border-white/5 relative">
                  {pack.coverImage ? (
                    <Image
                      src={
                        pack.coverImage.startsWith("http")
                          ? pack.coverImage
                          : `https://firebasestorage.googleapis.com/v0/b/naija-trivia.firebasestorage.app/o/${encodeURIComponent(pack.coverImage)}?alt=media`
                      }
                      alt={pack.title}
                      fill
                      className="object-cover"
                      onError={(
                        e: React.SyntheticEvent<HTMLImageElement, Event>,
                      ) => {
                        e.currentTarget.src =
                          "https://placehold.co/400x400/141d1a/0fbd58?text=Pack";
                      }}
                    />
                  ) : (
                    <Library className="text-zinc-600" size={16} />
                  )}
                </div>
                <span className="text-sm font-bold text-white group-hover:text-[#0fbd58] transition-colors truncate">
                  {pack.title}
                </span>
              </div>

              {/* Category */}
              <span className="text-xs font-bold text-[#0fbd58]/70">
                {pack.category}
              </span>

              {/* Question Count */}
              <span className="text-xs font-bold text-zinc-400">
                {pack.questionCount}
              </span>

              {/* Status */}
              {statusBadge(pack.status)}

              {/* Version */}
              <span className="text-xs font-bold text-zinc-500">
                v{pack.version}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => handleDeletePack(e, pack.id, pack.title)}
                  disabled={deleting === pack.id}
                  className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
