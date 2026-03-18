'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Library, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  Sparkles,
  Grid,
  List
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MockPack {
  id: string;
  title: string;
  category: string;
  questions: number;
  status: 'Published' | 'Draft' | 'AI Generating';
  version: string;
  thumbnail: string;
}

const MOCK_PACKS: MockPack[] = [
  { id: 'p1', title: 'Ancient Empires', category: 'History', questions: 25, status: 'Published', version: 'v1.2', thumbnail: '🏛️' },
  { id: 'p2', title: 'Naija Flavors', category: 'Culture', questions: 20, status: 'Published', version: 'v1.0', thumbnail: '🍲' },
  { id: 'p3', title: 'States & Capitals', category: 'Geography', questions: 36, status: 'Draft', version: 'v0.8', thumbnail: '🗺️' },
  { id: 'p4', title: 'Afrobeats Legends', category: 'Music', questions: 15, status: 'AI Generating', version: 'v0.5', thumbnail: '🎵' },
  { id: 'p5', title: 'Lagos Landmarks', category: 'Geography', questions: 20, status: 'Published', version: 'v1.1', thumbnail: '🌉' },
  { id: 'p6', title: 'Nollywood Icons', category: 'History', questions: 25, status: 'Published', version: 'v1.0', thumbnail: '🎬' },
];

export default function PacksPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab ] = useState('All');

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
          <h2 className="text-2xl font-bold text-white tracking-tight">Trivia Packs</h2>
          <p className="text-zinc-500 text-sm">Create, manage, and deploy trivia content</p>
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
          {['All', 'History', 'Culture', 'Geography', 'Music'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "text-sm font-bold transition-all relative pb-4",
                activeTab === tab ? "text-[#0fbd58]" : "text-zinc-500 hover:text-white"
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

      {/* Packs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {MOCK_PACKS.filter(p => activeTab === 'All' || p.category === activeTab).map((pack) => (
          <div key={pack.id} className="p-6 rounded-3xl bg-[#141d1a] border border-white/5 hover:border-[#0fbd58]/30 transition-all group cursor-pointer relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Library size={120} />
            </div>

            <div className="flex flex-col h-full space-y-4">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-black/40 flex items-center justify-center text-2xl border border-white/5 shadow-inner">
                  {pack.thumbnail}
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest leading-none mb-1">Version</span>
                  <span className="text-xs font-bold text-white leading-none">{pack.version}</span>
                </div>
              </div>

              <div>
                <p className="text-[#0fbd58] text-[10px] font-bold uppercase tracking-wider mb-1">{pack.category}</p>
                <h3 className="text-lg font-bold text-white group-hover:text-[#0fbd58] transition-colors">{pack.title}</h3>
                <p className="text-zinc-500 text-xs mt-1">{pack.questions} curated questions</p>
              </div>

              <div className="pt-4 mt-auto flex items-center justify-between border-t border-white/5">
                <div className="flex items-center gap-2">
                  {pack.status === 'Published' ? (
                    <div className="flex items-center gap-1.5 text-[#0fbd58]">
                      <CheckCircle2 size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wide">Live</span>
                    </div>
                  ) : pack.status === 'AI Generating' ? (
                    <div className="flex items-center gap-1.5 text-blue-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-wide">Synthesizing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-orange-400">
                      <Clock size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wide">Draft</span>
                    </div>
                  )}
                </div>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:bg-[#0fbd58]/20 transition-all">
                  <ChevronRight size={16} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
