'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  DollarSign, 
  Library, 
  Timer, 
  TrendingUp,
  ArrowUpRight,
  Activity,
  CreditCard
} from 'lucide-react';
import { db } from '@/lib/firebase-client';
import { collection, onSnapshot, query, orderBy, limit, Timestamp } from 'firebase/firestore';

interface ActivityLog {
  user: string;
  action: string;
  target: string;
  time: string;
  type: 'completion' | 'purchase' | 'join';
}

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [statsData, setStatsData] = useState({
    users: 0,
    packs: 0,
    skins: 0,
    revenue: 0,
    newUsersToday: 0
  });

  const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      // Real-time Users count
      const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
        setStatsData(prev => ({ ...prev, users: snap.size }));
        
        // Calculate new users today (simulated using createdAt if exists)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const newToday = snap.docs.filter(doc => {
          const createdAt = doc.data().createdAt as Timestamp;
          return createdAt && createdAt.toDate() >= today;
        }).length;
        setStatsData(prev => ({ ...prev, newUsersToday: newToday }));
      });

      // Real-time Packs count
      const unsubPacks = onSnapshot(collection(db, 'packs'), (snap) => {
        setStatsData(prev => ({ ...prev, packs: snap.size }));
      });

      // Real-time Skins count
      const unsubSkins = onSnapshot(collection(db, 'skins'), (snap) => {
        setStatsData(prev => ({ ...prev, skins: snap.size }));
        const totalValue = snap.docs.reduce((acc, doc) => acc + (Number(doc.data().price) || 0), 0);
        setStatsData(prev => ({ ...prev, revenue: totalValue }));
      });

      // Mock Activity from real users
      const unsubActivity = onSnapshot(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(5)), (snap) => {
        const logs: ActivityLog[] = snap.docs.map(doc => ({
          user: doc.data().displayName || 'Anonymous User',
          action: 'Joined the Tribe',
          target: 'Naija Trivia',
          time: 'Recently',
          type: 'join'
        }));
        setRecentActivities(logs);
      });

      return () => {
        unsubUsers();
        unsubPacks();
        unsubSkins();
        unsubActivity();
      };
    }
  }, [user, loading, router]);

  const chartData = React.useMemo(() => 
    Array.from({ length: 30 }).map((_, i) => ({
      day: i + 1,
      height: 40 + Math.sin(i * 0.5) * 30 + ((i * 13) % 20)
    })), []);

  if (loading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0b0e0c]">
        <div className="w-8 h-8 border-4 border-[#0fbd58]/30 border-t-[#0fbd58] rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { 
      name: 'Total Naija Scholars', 
      value: statsData.users.toLocaleString(), 
      trend: `+${statsData.newUsersToday} today`, 
      icon: Users,
      color: '#0fbd58'
    },
    { 
      name: 'Boutique Value', 
      value: `₦${statsData.revenue.toLocaleString()}`, 
      trend: 'Estimated', 
      icon: CreditCard,
      color: '#facc15'
    },
    { 
      name: 'Question Packs', 
      value: statsData.packs.toString(), 
      trend: 'Live', 
      icon: Library,
      color: '#3b82f6'
    },
    { 
      name: 'Boutique Items', 
      value: statsData.skins.toString(), 
      trend: 'Active', 
      icon: Timer,
      color: '#a855f7'
    },
  ];

  return (
    <main className="flex-1 overflow-y-auto bg-[#0b0e0c] p-8 space-y-8 text-white relative">
      {/* Dynamic Background Pattern */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[#0fbd58]/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Main Dashboard</h2>
          <p className="text-zinc-500 text-sm mt-1">Real-time data from your Naija Trivia ecosystem</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/logs')}
            className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold hover:bg-white/10 transition-all flex items-center gap-2"
          >
            <Activity size={16} />
            View Full Logs
          </button>
          <div className="hidden sm:flex px-4 py-2 bg-[#0fbd58]/10 border border-[#0fbd58]/20 rounded-xl items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#0fbd58] animate-pulse" />
            <span className="text-[10px] uppercase font-bold text-[#0fbd58] tracking-widest">System Online</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.name} className="p-6 rounded-[2rem] bg-[#141d1a] border border-white/5 space-y-4 hover:border-[#0fbd58]/30 transition-all cursor-pointer group hover:shadow-2xl hover:shadow-[#0fbd58]/5">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-[#0fbd58]/10 transition-colors">
                <stat.icon className="text-zinc-400 group-hover:text-[#0fbd58]" size={24} />
              </div>
              <div className="flex items-center gap-1 text-[#0fbd58] text-[10px] font-black uppercase tracking-tighter">
                <TrendingUp size={12} />
                <span>{stat.trend}</span>
              </div>
            </div>
            <div>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em]">{stat.name}</p>
              <h3 className="text-3xl font-extrabold text-white mt-1 tracking-tighter">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Core Analytics */}
        <div className="lg:col-span-2 p-8 rounded-[2.5rem] bg-[#141d1a] border border-white/5 space-y-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-[#0fbd58]/10 blur-[60px] -translate-x-1/2 -translate-y-1/2" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">Growth & Engagement</h3>
              <p className="text-zinc-500 text-xs">Total scholar growth over the current session</p>
            </div>
            <div className="flex items-center gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
              {['DAU', 'Revenue', 'Packs'].map((tab) => (
                <button key={tab} className="px-4 py-1.5 rounded-lg text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-all">
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="h-72 flex items-end justify-between gap-1 sm:gap-2 px-2 mt-4">
            {chartData.map((data, i) => (
              <div 
                key={i} 
                className="flex-1 bg-gradient-to-t from-[#0fbd58]/10 to-[#0fbd58]/40 rounded-t-md hover:from-[#0fbd58]/30 hover:to-[#0fbd58] transition-all group relative cursor-pointer"
                style={{ height: `${data.height}%` }}
              >
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] px-2 py-1 rounded font-black opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 whitespace-nowrap shadow-xl">
                  Day {data.day}: {Math.round(data.height * 2.4)}%
                </div>
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
            {[
              { label: 'Avg Session', value: '4m 32s', trend: '+12%' },
              { label: 'Bounce Rate', value: '18.4%', trend: '-4%' },
              { label: 'Conversion', value: '2.84%', trend: '+0.5%' },
            ].map((metric) => (
              <div key={metric.label}>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{metric.label}</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-white tracking-tighter">{metric.value}</span>
                  <span className="text-[10px] text-[#0fbd58] font-bold">{metric.trend}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Feed */}
        <div className="p-8 rounded-[2.5rem] bg-[#141d1a] border border-white/5 space-y-8 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white tracking-tight">Recent Activity</h3>
            <span className="px-2 py-1 rounded-md bg-white/5 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Real-time</span>
          </div>

          <div className="space-y-6">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, i) => (
                <div key={i} className="flex items-start gap-4 group cursor-pointer relative animate-in fade-in slide-in-from-right duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black text-[#0fbd58] group-hover:bg-[#0fbd58] group-hover:text-black transition-all rotate-3 group-hover:rotate-0">
                    {activity.user[0]}
                  </div>
                  <div className="flex-1 border-b border-white/5 pb-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-white group-hover:text-[#0fbd58] transition-colors">{activity.user}</p>
                      <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">{activity.time}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                      {activity.action} <span className="text-white/60">{activity.target}</span>
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-20 text-zinc-600 gap-4">
                <Activity size={40} className="opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest">Awaiting scholar activity...</p>
              </div>
            )}
          </div>

          <button 
            onClick={() => router.push('/logs')}
            className="w-full py-4 rounded-2xl bg-white/5 text-xs font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-3 group"
          >
            Explore Historical Data
            <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </main>
  );
}
