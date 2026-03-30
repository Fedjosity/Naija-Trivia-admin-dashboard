'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Activity, 
  ArrowLeft, 
  Search, 
  Filter, 
  Download, 
  Clock, 
  User, 
  Tag, 
  ChevronRight,
  TrendingUp,
  CreditCard,
  Zap,
  Library
} from 'lucide-react';
import { db } from '@/lib/firebase-client';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';

interface ActivityLog {
  id: string;
  uid: string;
  userName: string;
  type: string;
  details: string;
  createdAt: any;
  amount?: number;
}

export default function LogsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'activities'), orderBy('createdAt', 'desc'), limit(100));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const logsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ActivityLog[];
        setLogs(logsData);
        setFilteredLogs(logsData);
      });

      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    let result = logs;
    if (activeFilter !== 'all') {
      result = result.filter(log => log.type === activeFilter);
    }
    if (searchTerm) {
      result = result.filter(log => 
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        log.details.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredLogs(result);
  }, [searchTerm, activeFilter, logs]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'pack_completed': return <Library size={16} className="text-blue-400" />;
      case 'boutique_purchase': return <CreditCard size={16} className="text-amber-400" />;
      case 'subscription_activated': return <Zap size={16} className="text-purple-400" />;
      case 'new_user_joined': return <User size={16} className="text-green-400" />;
      default: return <Activity size={16} className="text-zinc-400" />;
    }
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0b0e0c]">
        <div className="w-8 h-8 border-4 border-[#0fbd58]/30 border-t-[#0fbd58] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b0e0c] text-white p-8 space-y-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-[#0fbd58]/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <button 
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-bold group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>
          <h1 className="text-4xl font-black tracking-tighter">System Activity Logs</h1>
          <p className="text-zinc-500 text-sm">Audit trail for all scholar interactions and revenue events</p>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors group">
            <Download size={20} className="text-zinc-400 group-hover:text-white" />
          </button>
          <div className="px-4 py-2 bg-[#0fbd58]/10 border border-[#0fbd58]/20 rounded-2xl flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#0fbd58] animate-pulse" />
            <span className="text-[10px] uppercase font-bold text-[#0fbd58] tracking-widest">Live Monitoring</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#0fbd58] transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search by scholar name or event details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#141d1a] border border-white/5 rounded-[1.5rem] py-4 pl-12 pr-6 text-sm focus:outline-none focus:border-[#0fbd58]/50 transition-all placeholder:text-zinc-600"
          />
        </div>
        <div className="flex items-center gap-2 p-2 bg-[#141d1a] border border-white/5 rounded-[1.5rem] overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'All Events' },
            { id: 'pack_completed', label: 'Packs' },
            { id: 'boutique_purchase', label: 'Purchases' },
            { id: 'subscription_activated', label: 'Subs' },
            { id: 'new_user_joined', label: 'Growth' },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-6 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                activeFilter === filter.id 
                  ? 'bg-[#0fbd58] text-black shadow-lg shadow-[#0fbd58]/20' 
                  : 'text-zinc-500 hover:bg-white/5 hover:text-white'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#141d1a] border border-white/5 rounded-[2.5rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Timestamp</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Scholar</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Activity</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Details</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Impact</th>
                <th className="px-8 py-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-zinc-500 group-hover:text-white transition-colors">
                          <Clock size={14} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white uppercase tracking-tighter">
                            {log.createdAt?.toDate().toLocaleDateString('en-NG')}
                          </p>
                          <p className="text-[10px] text-zinc-600 font-bold">
                            {log.createdAt?.toDate().toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#0fbd58]/20 flex items-center justify-center text-[10px] font-black text-[#0fbd58]">
                          {log.userName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{log.userName}</p>
                          <p className="text-[10px] text-zinc-600 font-mono tracking-tighter">{log.uid.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full w-fit">
                        {getIcon(log.type)}
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">
                          {log.type.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors max-w-xs">{log.details}</p>
                    </td>
                    <td className="px-8 py-6">
                      {log.amount ? (
                        <div className="flex items-center gap-1.5 text-white font-black">
                          <span className="text-sm">₦{log.amount.toLocaleString()}</span>
                          <TrendingUp size={12} className="text-[#0fbd58]" />
                        </div>
                      ) : (
                        <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Neutral</span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button className="p-2 text-zinc-600 hover:text-white transition-colors group/btn">
                        <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-zinc-500 italic">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                      <Search size={48} />
                      <p className="text-sm font-bold uppercase tracking-[0.2em]">No logs match your search criteria</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
