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
  Calendar,
  Coins
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase-client';
import { 
  handleDeletePlayerAccount 
} from '../actions';
import { 
  collection, 
  query, 
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';

interface UserRecord {
  id: string;
  username: string;
  uid: string;
  createdAt: { seconds: number; nanoseconds: number } | null;
  score: number;
  walletBalance: number;
  status: 'Active' | 'Banned';
}

export default function UsersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [fetching, setFetching] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      // We remove orderBy('createdAt') here because some users (admins) 
      // might not have this field, and Firestore would filter them out.
      const q = query(collection(db, 'users'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const usersData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            username: data.displayName || data.username || 'Anonymous',
            uid: data.uid || doc.id,
            createdAt: data.createdAt || data.updatedAt || null,
            score: data.stats?.totalScore || data.score || 0,
            walletBalance: data.wallet?.coins || data.wallet?.naijaCoins || 0,
            status: data.status || 'Active'
          };
        }) as UserRecord[];

        // Client-side sort: Descending by createdAt
        const sortedUsers = usersData.sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });

        setUsers(sortedUsers);
        setFetching(false);
      }, (err) => {
        console.error("Firestore error:", err);
        setFetching(false);
      });
      return () => unsubscribe();
    }
  }, [user, loading, router]);

  const onToggleBan = async (uid: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Banned' ? 'Active' : 'Banned';
    if (!confirm(`Are you sure you want to ${currentStatus === 'Banned' ? 'unban' : 'ban'} this user?`)) return;
    
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.error("Ban update failed:", error);
      alert("Failed to update status: " + (error.message || "Insufficient permissions. Check that you are an Admin."));
    }
  };

  const onDeleteAccount = async (uid: string) => {
    if (!confirm("CRITICAL: This will permanently delete the user's AUTH account and all profile data. This cannot be undone. Proceed?")) return;
    const result = await handleDeletePlayerAccount(uid);
    if (result.success) {
      setUsers(prev => prev.filter(u => u.uid !== uid));
    } else {
      alert(result.error);
    }
  };

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
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-8 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Player</th>
                <th className="px-8 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Metadata</th>
                <th className="px-8 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Economy</th>
                <th className="px-8 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none text-center">Status</th>
                <th className="px-8 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {fetching ? (
                <tr>
                   <td colSpan={5} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                         <div className="w-8 h-8 border-2 border-[#0fbd58] border-t-transparent rounded-full animate-spin" />
                         <p className="text-zinc-500 text-sm font-medium">Synchronizing with Firebase...</p>
                      </div>
                   </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                   <td colSpan={5} className="px-8 py-20 text-center">
                      <p className="text-zinc-500 text-sm font-medium">No players found in the system.</p>
                   </td>
                </tr>
              ) : users.filter(u => 
                  u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  u.uid.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((u: UserRecord) => (
                <tr 
                  key={u.id} 
                  className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                  onClick={() => router.push(`/users/${u.uid}`)}
                >
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#0fbd58]/10 flex items-center justify-center font-bold text-[#0fbd58] border border-[#0fbd58]/20 group-hover:scale-110 transition-transform">
                        {u.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white leading-tight group-hover:text-[#0fbd58] transition-colors">{u.username}</p>
                        <p className="text-[10px] text-zinc-500 font-mono tracking-tighter uppercase">{u.uid.slice(0, 12)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <Calendar size={12} />
                        <span className="text-[11px] font-medium">Joined {u.createdAt?.seconds ? new Date(u.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-zinc-500">
                        <ShieldCheck size={12} />
                        <span className="text-[9px] font-bold uppercase tracking-widest italic">Standard Scholar</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <div className="space-y-1 text-right md:text-left">
                       <div className="flex items-center gap-1.5">
                          <Coins size={12} className="text-orange-400" />
                          <p className="text-white font-bold text-sm tracking-tight">₦{u.walletBalance.toLocaleString()}</p>
                       </div>
                       <p className="text-[#0fbd58] text-[9px] font-bold uppercase tracking-widest">{u.score.toLocaleString()} XP</p>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-center">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border transition-all",
                      u.status === 'Active' 
                        ? "bg-[#0fbd58]/10 text-[#0fbd58] border-[#0fbd58]/20" 
                        : "bg-red-500/10 text-red-500 border-red-500/20"
                    )}>
                      {u.status === 'Active' ? <ShieldCheck size={10} /> : <ShieldAlert size={10} />}
                      {u.status}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => onToggleBan(u.uid, u.status)}
                        className={cn(
                          "p-2 bg-white/5 rounded-lg transition-all hover:bg-white/10",
                          u.status === 'Banned' ? "text-orange-400" : "text-white"
                        )} 
                        title={u.status === 'Banned' ? "Unban User" : "Ban User"}
                      >
                        {u.status === 'Banned' ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                      </button>
                      <button 
                        onClick={() => onDeleteAccount(u.uid)}
                        className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-all" 
                        title="Delete Permanently"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
