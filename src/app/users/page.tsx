'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  MoreVertical, 
  UserPlus, 
  Filter,
  ShieldCheck,
  ShieldAlert,
  Wallet
} from 'lucide-react';

interface MockUser {
  id: string;
  username: string;
  uid: string;
  joined: string;
  score: number;
  coins: number;
  status: 'Active' | 'Banned';
}

const MOCK_USERS: MockUser[] = [
  { id: '1', username: 'Kuda_12', uid: 'user_882x', joined: '2024-03-10', score: 12500, coins: 450, status: 'Active' },
  { id: '2', username: 'Bola_Star', uid: 'user_991z', joined: '2024-03-11', score: 8400, coins: 1200, status: 'Active' },
  { id: '3', username: 'Chidi_G', uid: 'user_443w', joined: '2024-03-12', score: 21000, coins: 50, status: 'Active' },
  { id: '4', username: 'Amina_X', uid: 'user_112v', joined: '2024-03-12', score: 500, coins: 200, status: 'Banned' },
];

export default function UsersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

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
          <h2 className="text-2xl font-bold text-white tracking-tight">User Management</h2>
          <p className="text-zinc-500 text-sm">Monitor and manage the Naija Trivia player base</p>
        </div>
        <button className="flex items-center gap-2 bg-[#0fbd58] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#0db052] transition-all">
          <UserPlus size={18} />
          Add Internal User
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input 
            type="text" 
            placeholder="Search by Username, Email, or UID..."
            className="w-full bg-[#141d1a] border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-[#0fbd58]/50 transition-all placeholder:text-zinc-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-3 bg-[#141d1a] border border-white/5 rounded-2xl text-zinc-400 hover:text-white transition-all flex items-center gap-2 text-sm font-medium">
            <Filter size={18} />
            Filters
          </button>
          <button className="px-4 py-3 bg-[#141d1a] border border-white/5 rounded-2xl text-zinc-400 hover:text-white transition-all text-sm font-medium">
            Export CSV
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#141d1a] border border-white/5 rounded-[2rem] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5">
              <th className="px-8 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Player</th>
              <th className="px-8 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">UID</th>
              <th className="px-8 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Joined</th>
              <th className="px-8 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Score</th>
              <th className="px-8 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Status</th>
              <th className="px-8 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {MOCK_USERS.map((u) => (
              <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-8 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#0fbd58]/10 flex items-center justify-center font-bold text-[#0fbd58] text-xs">
                      {u.username[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white leading-tight">{u.username}</p>
                      <p className="text-[10px] text-zinc-500 font-medium">Player Level: Elite</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-4">
                  <code className="text-[11px] text-zinc-500 bg-white/5 px-2 py-1 rounded-lg">{u.uid}</code>
                </td>
                <td className="px-8 py-4 text-xs text-zinc-400">{u.joined}</td>
                <td className="px-8 py-4 text-xs font-bold text-white">{u.score.toLocaleString()}</td>
                <td className="px-8 py-4">
                  {u.status === 'Active' ? (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0fbd58]/10 text-[#0fbd58] text-[10px] font-bold uppercase tracking-wide">
                      <ShieldCheck size={12} />
                      Active
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-wide">
                      <ShieldAlert size={12} />
                      Banned
                    </div>
                  )}
                </td>
                <td className="px-8 py-4">
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-all" title="Edit Wallet">
                      <Wallet size={16} />
                    </button>
                    <button className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-all" title="More Actions">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
