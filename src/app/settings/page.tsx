'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Database,
  Globe,
  Save
} from 'lucide-react';

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

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
          <h2 className="text-2xl font-bold text-white tracking-tight">System Settings</h2>
          <p className="text-zinc-500 text-sm">Configure Admin Hub preferences and global system variables</p>
        </div>
        <button className="flex items-center gap-2 bg-[#0fbd58] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#0db052] transition-all shadow-lg shadow-[#0fbd58]/20">
          <Save size={18} />
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Navigation / Categories */}
        <div className="space-y-2">
          {[
            { label: 'General', icon: SettingsIcon, active: true },
            { label: 'Admin Profile', icon: User },
            { label: 'Notifications', icon: Bell },
            { label: 'Security & Access', icon: Shield },
            { label: 'Database Config', icon: Database },
            { label: 'Remote Config (Live)', icon: Globe },
          ].map((item, i) => (
            <button
              key={i}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                item.active 
                  ? "bg-[#0fbd58]/10 text-[#0fbd58] border border-[#0fbd58]/20" 
                  : "text-zinc-500 hover:text-white hover:bg-white/5"
              }`}
            >
              <item.icon size={18} />
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Settings Form Placeholder */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-8 rounded-3xl bg-[#141d1a] border border-white/5 space-y-6">
             <h3 className="text-lg font-bold text-white mb-4">General Configuration</h3>
             
             <div className="space-y-4">
                <div className="space-y-2">
                   <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Dashboard Name</label>
                   <input 
                     type="text" 
                     placeholder="Naija Trivia Admin Hub" 
                     className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#0fbd58]/50 transition-all"
                   />
                </div>
                
                <div className="space-y-2">
                   <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Support Email</label>
                   <input 
                     type="email" 
                     placeholder="fedjostty@gmail.com" 
                     className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#0fbd58]/50 transition-all"
                   />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                   <div>
                      <p className="text-white text-sm font-bold">Maintenance Mode</p>
                      <p className="text-zinc-500 text-xs text-balance">Temporarily disable app access during system updates</p>
                   </div>
                   <div className="w-12 h-6 rounded-full bg-zinc-800 relative cursor-pointer group">
                      <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-zinc-600 group-hover:bg-zinc-500 transition-all" />
                   </div>
                </div>
             </div>
          </div>

          <div className="p-8 rounded-3xl bg-red-500/5 border border-red-500/10 space-y-4">
             <h3 className="text-lg font-bold text-red-400">Danger Zone</h3>
             <p className="text-zinc-500 text-xs">Clearing system caches or resetting global leaderboards are irreversible actions.</p>
             <button className="px-5 py-2.5 rounded-xl border border-red-500/20 text-red-400 font-bold text-xs hover:bg-red-500/10 transition-all">
                Reset Daily Leaderboards
             </button>
          </div>
        </div>
      </div>
    </main>
  );
}
