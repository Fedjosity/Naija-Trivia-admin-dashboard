'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  DollarSign, 
  Library, 
  Timer, 
  TrendingUp,
  ArrowUpRight
} from 'lucide-react';

// Static mock data to satisfy pure rendering rules and avoid Math.random lint issues
const STABLE_CHART_DATA = [
  { height: 45, value: 320 },
  { height: 60, value: 410 },
  { height: 85, value: 290 },
  { height: 50, value: 450 },
  { height: 75, value: 380 },
  { height: 90, value: 495 },
  { height: 35, value: 210 },
  { height: 55, value: 335 },
  { height: 80, value: 420 },
  { height: 65, value: 310 },
  { height: 40, value: 250 },
  { height: 70, value: 390 },
];

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0b0e0c]">
        <div className="w-8 h-8 border-4 border-[#0fbd58]/30 border-t-[#0fbd58] rounded-full animate-spin" />
      </div>
    );
  }

  const stats = [
    { name: 'Daily Active Users', value: '2.4k', trend: '+12%', icon: Users },
    { name: 'Total Revenue', value: '$12.5k', trend: '+5%', icon: DollarSign },
    { name: 'Packs Live', value: '18', trend: '0%', icon: Library },
    { name: 'Avg. Session', value: '8m 24s', trend: '+2m', icon: Timer },
  ];

  return (
    <main className="flex-1 overflow-y-auto bg-[#0b0e0c] p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Command Center</h2>
          <p className="text-zinc-500 text-sm">Real-time overview of the Naija Trivia ecosystem</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#0fbd58] animate-pulse" />
            <span className="text-xs font-semibold text-white/70">Live System Status</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="p-6 rounded-2xl bg-[#141d1a] border border-white/5 space-y-4 hover:border-[#0fbd58]/30 transition-all cursor-pointer group">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-[#0fbd58]/10 transition-colors">
                <stat.icon className="text-zinc-400 group-hover:text-[#0fbd58]" size={20} />
              </div>
              <div className="flex items-center gap-1 text-[#0fbd58] text-[10px] font-bold">
                <TrendingUp size={10} />
                <span>{stat.trend}</span>
              </div>
            </div>
            <div>
              <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">{stat.name}</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Growth Chart (Visual Placeholder) */}
        <div className="lg:col-span-2 p-8 rounded-3xl bg-[#141d1a] border border-white/5 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">User Growth</h3>
            <select className="bg-white/5 border border-white/10 rounded-lg text-xs text-white px-3 py-1.5 focus:outline-none focus:border-[#0fbd58]/50">
              <option>Last 30 Days</option>
              <option>Last 7 Days</option>
            </select>
          </div>
          <div className="h-64 flex items-end gap-2 px-2">
            {STABLE_CHART_DATA.map((data: { height: number; value: number }, i: number) => (
              <div 
                key={i} 
                className="flex-1 bg-[#0fbd58]/20 rounded-t-lg hover:bg-[#0fbd58]/40 transition-all group relative cursor-pointer"
                style={{ height: `${data.height}%` }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  {data.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="p-8 rounded-3xl bg-[#141d1a] border border-white/5 space-y-6">
          <h3 className="text-lg font-bold text-white">Recent Activity</h3>
          <div className="space-y-4">
            {[
              { user: 'Kuda_12', action: 'Completed Pack', target: 'Lagos History', time: '2m ago' },
              { user: 'Bola_Star', action: 'Joined Naija Gold', target: 'Annual plan', time: '15m ago' },
              { user: 'Chidi_G', action: 'New Record', target: 'Music Quiz', time: '1h ago' },
              { user: 'Amina_X', action: 'Claimed Daily Gift', target: '50 Coins', time: '2h ago' },
            ].map((activity, i) => (
              <div key={i} className="flex items-start gap-4 group cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold text-zinc-400 group-hover:text-[#0fbd58] transition-colors">
                  {activity.user[0]}
                </div>
                <div className="flex-1 border-b border-white/5 pb-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">{activity.user}</p>
                    <span className="text-[10px] text-zinc-500">{activity.time}</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {activity.action} <span className="text-[#0fbd58] font-medium">{activity.target}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full py-3 text-xs font-bold text-zinc-500 hover:text-white transition-colors flex items-center justify-center gap-2 group">
            View All Activity
            <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </main>
  );
}
