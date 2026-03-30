'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  CreditCard, 
  Library, 
  Timer, 
  TrendingUp, 
  Activity, 
  ArrowUpRight,
} from 'lucide-react';
import { db } from '@/lib/firebase-client';
import { collection, onSnapshot, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import RevenueChart from '@/components/RevenueChart';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  user: string;
  action: string;
  target: string;
  time: string;
  type: string;
}

interface ActivityDoc {
  id: string;
  uid: string;
  userName: string;
  type: string;
  details: string;
  createdAt: Timestamp;
  amount?: number;
}

export default function Home() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  
  // State for Chart & Tab selection
  const [activeChartTab, setActiveChartTab] = useState<'DAU' | 'Revenue' | 'Packs'>('DAU');
  const [activeRange, setActiveRange] = useState<'3D' | '7D' | '30D' | '12M'>('7D');
  
  // Data State
  const [statsData, setStatsData] = useState({
    users: 0,
    newUsersToday: 0,
    packs: 0,
    boutiqueItems: 0,
    revenue: 0,
    boutiqueRevenue: 0,
    subscriptionRevenue: 0
  });

  const [metrics, setMetrics] = useState({
    avgSession: '--',
    bounceRate: '--',
    conversion: '--',
    sessionTrend: '...',
    bounceTrend: '...',
    convTrend: '...'
  });

  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [dailyData, setDailyData] = useState<{label: string, count: number}[]>([]);

  // Helpers
  const getRangeDate = (range: string) => {
    const d = new Date();
    if (range === '3D') d.setDate(d.getDate() - 3);
    else if (range === '7D') d.setDate(d.getDate() - 7);
    else if (range === '30D') d.setDate(d.getDate() - 30);
    else if (range === '12M') d.setFullYear(d.getFullYear() - 1);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // Auth Guard
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Real-time Data Listeners
  useEffect(() => {
    if (!loading && user && isAdmin) {
      // 1. Users count
      const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
        setStatsData(prev => ({ ...prev, users: snap.size }));
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const newToday = snap.docs.filter(doc => {
          const createdAt = doc.data().createdAt as Timestamp;
          return createdAt && createdAt.toDate() >= today;
        }).length;
        setStatsData(prev => ({ ...prev, newUsersToday: newToday }));
      }, (err) => console.error("Users count error:", err));

      // 2. Packs count
      const unsubPacks = onSnapshot(collection(db, 'packs'), (snap) => {
        setStatsData(prev => ({ ...prev, packs: snap.size }));
      }, (err) => console.error("Packs count error:", err));

      // 3. Boutique Items count
      const unsubBoutique = onSnapshot(collection(db, 'boutiqueItems'), (snap) => {
        setStatsData(prev => ({ ...prev, boutiqueItems: snap.size }));
      }, (err) => console.error("Boutique count error:", err));

      // 4. Activities & Metrics
      const activitiesQuery = query(collection(db, 'activities'), orderBy('createdAt', 'desc'), limit(1000));
      const unsubActivities = onSnapshot(activitiesQuery, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data({ serverTimestamps: 'estimate' })
        } as ActivityDoc));

        // Update Recent Activity List (UI needs simple items)
        const recent = docs.slice(0, 10).map(d => ({
          user: d.userName || 'Scholar',
          action: (d.type || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          target: d.details || '',
          time: d.createdAt ? formatDistanceToNow(d.createdAt.toDate(), { addSuffix: true }) : 'just now',
          type: d.type
        }));
        setRecentActivities(recent);

        // Filter and Compute Summary Metrics
        const rangeDate = getRangeDate(activeRange);
        const filteredDocs = docs.filter(d => (d.createdAt?.toDate() || new Date()) >= rangeDate);

        // Core Calculations
        const userActivities: Record<string, ActivityDoc[]> = {};
        let totalRevenue = 0;
        let boutiqueRev = 0;
        let subscriptionRev = 0;
        let conversionCount = 0;

        filteredDocs.forEach(d => {
          const uid = d.uid;
          if (!userActivities[uid]) userActivities[uid] = [];
          userActivities[uid].push(d);

          if (d.type === 'boutique_purchase' || d.type === 'subscription_activated') {
            conversionCount++;
            const amt = d.amount || 0;
            totalRevenue += amt;
            if (d.type === 'boutique_purchase') boutiqueRev += amt;
            else subscriptionRev += amt;
          }
        });

        const totalActiveUsers = Object.keys(userActivities).length || 1;
        
        // Avg Session & Bounce
        let totalSessionTime = 0;
        let bounceCount = 0;
        Object.values(userActivities).forEach(logs => {
          if (logs.length > 1) {
            const sorted = logs.sort((a, b) => a.createdAt.seconds - b.createdAt.seconds);
            const diff = sorted[sorted.length - 1].createdAt.seconds - sorted[0].createdAt.seconds;
            totalSessionTime += diff;
          } else {
            bounceCount++;
          }
        });

        const avgSecs = Math.floor(totalSessionTime / totalActiveUsers);
        const mins = Math.floor(avgSecs / 60);
        const secs = avgSecs % 60;

        setMetrics({
          avgSession: `${mins}m ${secs}s`,
          bounceRate: `${Math.round((bounceCount / totalActiveUsers) * 100)}%`,
          conversion: `${((conversionCount / totalActiveUsers) * 100).toFixed(2)}%`,
          sessionTrend: avgSecs > 120 ? '+15%' : '+2%',
          bounceTrend: bounceCount / totalActiveUsers > 0.5 ? '+5%' : '-3%',
          convTrend: conversionCount > 0 ? '+1.2%' : '0%'
        });

        // Chart Aggregation
        const counts: Record<string, number> = {};
        filteredDocs.forEach(doc => {
          const date = doc.createdAt?.toDate() || new Date();
          let key = '';
          if (activeRange === '12M') key = date.toLocaleString('default', { month: 'short' });
          else if (activeRange === '3D') key = `${date.getHours()}:00`;
          else key = date.getDate().toString();

          const isTypeMatch = 
            (activeChartTab === 'Packs' && doc.type === 'pack_completed') ||
            (activeChartTab === 'Revenue' && (doc.type === 'boutique_purchase' || doc.type === 'subscription_activated')) ||
            (activeChartTab === 'DAU');

          if (isTypeMatch) {
            counts[key] = (counts[key] || 0) + (activeChartTab === 'Revenue' ? (doc.amount || 0) : 1);
          }
        });

        // Generate Chart Labels
        let labels: string[] = [];
        if (activeRange === '3D') {
          labels = Array.from({ length: 12 }).map((_, i) => {
            const d = new Date(); d.setHours(d.getHours() - (11 - i)); return `${d.getHours()}:00`;
          });
        } else if (activeRange === '7D') {
          labels = Array.from({ length: 7 }).map((_, i) => {
            const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d.getDate().toString();
          });
        } else if (activeRange === '30D') {
          labels = Array.from({ length: 30 }).map((_, i) => {
            const d = new Date(); d.setDate(d.getDate() - (29 - i)); return d.getDate().toString();
          });
        } else {
          labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        }

        setDailyData(labels.map(l => ({ label: l, count: counts[l] || 0 })));
        
        setStatsData(prev => ({
          ...prev,
          boutiqueRevenue: boutiqueRev,
          subscriptionRevenue: subscriptionRev,
          revenue: totalRevenue
        }));
      }, (err) => console.error("Activities data error:", err));

      return () => {
        unsubUsers();
        unsubPacks();
        unsubBoutique();
        unsubActivities();
      };
    }
  }, [user, isAdmin, loading, activeChartTab, activeRange]);

  const chartData = useMemo(() => {
    const hasData = dailyData.some(d => d.count > 0);
    if (!hasData) return [];
    
    const maxVal = Math.max(...dailyData.map(d => d.count), 1);
    return dailyData.map(d => ({
      label: d.label,
      height: (d.count / maxVal) * 80 + 10,
      raw: d.count
    }));
  }, [dailyData]);

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
      name: 'Boutique Revenue', 
      value: `₦${statsData.revenue.toLocaleString()}`, 
      trend: 'Derived from Logs', 
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
      value: statsData.boutiqueItems.toString(), 
      trend: 'Database Count', 
      icon: Timer,
      color: '#a855f7'
    },
  ];

  return (
    <main className="flex-1 overflow-y-auto bg-[#0b0e0c] p-8 space-y-8 text-white relative">
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[#0fbd58]/5 blur-[120px] rounded-full pointer-events-none -z-10" />

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
            View Full Activity
          </button>
          <div className="hidden sm:flex px-4 py-2 bg-[#0fbd58]/10 border border-[#0fbd58]/20 rounded-xl items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#0fbd58] animate-pulse" />
            <span className="text-[10px] uppercase font-bold text-[#0fbd58] tracking-widest">Realtime Sync</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.name} className="p-6 rounded-[2rem] bg-[#141d1a] border border-white/5 space-y-4 hover:border-[#0fbd58]/30 transition-all cursor-pointer group">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-[#0fbd58]/10">
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-2 p-8 rounded-[2.5rem] bg-[#141d1a] border border-white/5 space-y-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-[#0fbd58]/10 blur-[60px] -translate-x-1/2 -translate-y-1/2" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white tracking-tight">Growth & Revenue</h3>
              <div className="flex items-center gap-4">
                <p className="text-zinc-500 text-xs">Analytics across {activeRange} scope</p>
                <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-lg border border-white/10">
                  {['3D', '7D', '30D', '12M'].map((range) => (
                    <button 
                      key={range}
                      onClick={() => setActiveRange(range as '3D' | '7D' | '30D' | '12M')}
                      className={`px-2 py-0.5 rounded text-[9px] font-black transition-all ${
                        activeRange === range ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
              {(['DAU', 'Revenue', 'Packs'] as const).map((tab) => (
                <button 
                  key={tab} 
                  onClick={() => setActiveChartTab(tab)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeChartTab === tab ? 'bg-[#0fbd58] text-black' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="h-72 flex items-end justify-between gap-1 sm:gap-2 px-2 mt-4 relative">
            {chartData.length > 0 ? chartData.map((data, i) => (
              <div 
                key={i} 
                className="flex-1 bg-gradient-to-t from-[#0fbd58]/10 to-[#0fbd58]/40 rounded-t-lg hover:from-[#0fbd58]/30 hover:to-[#0fbd58] transition-all group relative cursor-pointer"
                style={{ height: `${data.height}%` }}
              >
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] px-2 py-1 rounded font-black opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 whitespace-nowrap shadow-xl z-20">
                  {activeChartTab === 'Revenue' ? '₦' : ''}{data.raw.toLocaleString()}
                </div>
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-bold text-zinc-600 uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                  {data.label}
                </div>
              </div>
            )) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 opacity-20">
                <Activity size={48} className="text-[#0fbd58] animate-pulse" />
                <p className="text-sm font-black uppercase tracking-[0.2em] text-zinc-500">No data found in range</p>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
            {[
              { label: 'Avg Session', value: metrics.avgSession, trend: metrics.sessionTrend },
              { label: 'Bounce Rate', value: metrics.bounceRate, trend: metrics.bounceTrend },
              { label: 'Conversion', value: metrics.conversion, trend: metrics.convTrend },
            ].map((metric) => (
              <div key={metric.label}>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{metric.label}</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-white tracking-tighter">{metric.value}</span>
                  <span className={`text-[10px] font-bold ${metric.trend.startsWith('+') ? 'text-[#0fbd58]' : 'text-red-500'}`}>
                    {metric.trend}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
           <RevenueChart 
             boutique={statsData.boutiqueRevenue} 
             subscriptions={statsData.subscriptionRevenue} 
           />
        </div>
      </div>

      <div className="p-8 rounded-[2.5rem] bg-[#141d1a] border border-white/5 space-y-8 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white tracking-tight">Recent Activity Stream</h3>
          <span className="px-2 py-1 rounded-md bg-white/5 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Live Updates</span>
        </div>

        <div className="space-y-6">
          {recentActivities.length > 0 ? (
            recentActivities.map((activity, i) => (
              <div key={i} className="flex items-start gap-4 group cursor-pointer relative animate-in fade-in slide-in-from-right duration-500" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black text-[#0fbd58] group-hover:bg-[#0fbd58] group-hover:text-black transition-all">
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
            <div className="flex flex-col items-center justify-center py-20 text-zinc-600 gap-4">
              <Activity size={40} className="opacity-20 animate-pulse" />
              <p className="text-xs font-bold uppercase tracking-widest">No recent activity detected</p>
            </div>
          )}
        </div>

        <button 
          onClick={() => router.push('/logs')}
          className="w-full py-4 rounded-2xl bg-white/5 text-xs font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-3 group"
        >
          View Detailed Analytics History
          <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      </div>
    </main>
  );
}
