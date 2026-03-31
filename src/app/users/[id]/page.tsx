'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  ArrowLeft, 
  ShieldCheck, 
  ShieldAlert, 
  Wallet, 
  Trophy, 
  Calendar,
  Clock,
  Activity,
  Trash2,
  Lock,
  Mail,
  User as UserIcon
} from 'lucide-react';
import { db } from '@/lib/firebase-client';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  onSnapshot,
  updateDoc,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { handleDeletePlayerAccount } from '../../actions';

interface UserData {
  uid: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  isAdmin?: boolean;
  status?: 'Active' | 'Banned';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  wallet?: {
    coins: number;
    gems: number;
  };
  stats?: {
    totalScore: number;
    gamesPlayed: number;
  };
}

interface ActivityItem {
  id: string;
  type: string;
  details: string;
  createdAt: Timestamp;
  amount?: number;
}

export default function UserDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user: adminUser, loading: authLoading } = useAuth();
  
  const [userData, setUserData] = useState<UserData | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!authLoading && !adminUser) {
      router.push('/login');
      return;
    }

    if (id) {
       // Fetch User Profile
       const fetchUser = async () => {
         try {
           const userDoc = await getDoc(doc(db, 'users', id as string));
           if (userDoc.exists()) {
             setUserData({ uid: userDoc.id, ...userDoc.data() } as UserData);
           }
         } catch (error) {
           console.error("Error fetching user:", error);
         } finally {
           setLoading(false);
         }
       };
       fetchUser();

       // Fetch User Activities - Remove server-side orderBy to bypass index building issues
       const q = query(
         collection(db, 'activities'), 
         where('uid', '==', id)
       );

       const unsubscribe = onSnapshot(q, (snapshot) => {
         const activityData = snapshot.docs.map(doc => ({
           id: doc.id,
           ...doc.data()
         })) as ActivityItem[];
         
         // Sort client-side
         const sortedActivities = [...activityData].sort((a, b) => {
           const timeA = a.createdAt?.toMillis() || 0;
           const timeB = b.createdAt?.toMillis() || 0;
           return timeB - timeA;
         });

         setActivities(sortedActivities);
       }, (err) => {
         console.error("Activity load error:", err);
       });

       return () => unsubscribe();
    }
  }, [id, adminUser, authLoading, router]);

  const onToggleBan = async () => {
    if (!userData || isUpdating) return;
    const currentStatus = userData.status || 'Active';
    const newStatus = currentStatus === 'Banned' ? 'Active' : 'Banned';
    
    if (!confirm(`Are you sure you want to ${currentStatus === 'Banned' ? 'unban' : 'ban'} this user?`)) return;
    
    setIsUpdating(true);
    try {
      const userRef = doc(db, 'users', userData.uid);
      await updateDoc(userRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      // The Firestore listener or local state update
      setUserData(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.error("Ban update failed:", error);
      alert("Failed to update status: " + (error.message || "Insufficient permissions. Only admins can modify player status."));
    } finally {
      setIsUpdating(false);
    }
  };

  const onDeleteAccount = async () => {
    if (!userData || isUpdating) return;
    if (!confirm("CRITICAL: This will permanently delete the user's AUTH account and all profile data. Proceed?")) return;
    
    setIsUpdating(true);
    try {
      const result = await handleDeletePlayerAccount(userData.uid);
      if (result.success) {
        router.push('/users');
      } else {
        alert(result.error);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0b0e0c]">
        <div className="w-10 h-10 border-2 border-[#0fbd58] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0b0e0c] text-zinc-500 gap-4">
        <UserIcon size={48} className="opacity-20" />
        <p>User not found in the system.</p>
        <button onClick={() => router.back()} className="text-[#0fbd58] font-bold flex items-center gap-2">
          <ArrowLeft size={16} /> Go Back
        </button>
      </div>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto bg-[#0b0e0c] p-8 space-y-8">
      {/* Back & Actions */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-all font-bold text-sm"
        >
          <ArrowLeft size={18} />
          Back to User Management
        </button>
        
        <div className="flex gap-3">
          <button 
            onClick={onToggleBan}
            disabled={isUpdating}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border",
              userData.status === 'Banned' 
                ? "bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/20" 
                : "bg-white/5 text-white border-white/10 hover:bg-white/10",
              isUpdating && "opacity-50 cursor-not-allowed"
            )}
          >
            {isUpdating ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> : (userData.status === 'Banned' ? <Lock size={14} /> : <ShieldAlert size={14} />)}
            {userData.status === 'Banned' ? 'Unban Player' : 'Ban Player'}
          </button>
          <button 
            onClick={onDeleteAccount}
            disabled={isUpdating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 text-xs font-bold transition-all disabled:opacity-50"
          >
            <Trash2 size={14} />
            Delete Account
          </button>
        </div>
      </div>

      {/* User Info Header */}
      <div className="flex items-start gap-8 bg-[#141d1a] border border-white/5 rounded-[2.5rem] p-8">
        <div className="w-24 h-24 rounded-3xl bg-[#0fbd58]/10 flex items-center justify-center font-black text-4xl text-[#0fbd58] border-2 border-[#0fbd58]/20">
          {(userData.displayName || 'U')[0].toUpperCase()}
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-white">{userData.displayName || 'Anonymous'}</h1>
              <span className={cn(
                "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                userData.status === 'Active' 
                  ? "bg-[#0fbd58]/10 text-[#0fbd58] border-[#0fbd58]/20" 
                  : "bg-red-500/10 text-red-500 border-red-500/20"
              )}>
                {userData.status || 'Active'}
              </span>
              {userData.isAdmin && (
                <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                  Admin
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
                <Mail size={12} />
                {userData.email}
              </div>
              <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
                <ShieldCheck size={12} />
                UID: <span className="font-mono">{userData.uid}</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Naija Coins</p>
              <div className="flex items-center gap-2">
                <Wallet size={16} className="text-[#0fbd58]" />
                <p className="text-xl font-black text-white">₦{(userData.wallet?.coins || 0).toLocaleString()}</p>
              </div>
            </div>
            <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Total XP</p>
              <div className="flex items-center gap-2">
                <Trophy size={16} className="text-amber-400" />
                <p className="text-xl font-black text-white">{(userData.stats?.totalScore || 0).toLocaleString()}</p>
              </div>
            </div>
            <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Games Played</p>
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-blue-400" />
                <p className="text-xl font-black text-white">{activities.filter(a => a.type === 'pack_completed').length}</p>
              </div>
            </div>
            <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Account Born</p>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-purple-400" />
                <p className="text-lg font-black text-white">
                  {userData.createdAt?.seconds 
                    ? new Date(userData.createdAt.seconds * 1000).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' }) 
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <Clock size={20} className="text-[#0fbd58]" />
              Historical Activity Log
            </h3>
            <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{activities.length} Events Recorded</span>
          </div>

          <div className="space-y-4">
            {activities.length === 0 ? (
              <div className="bg-[#141d1a] border border-white/5 rounded-[2rem] p-20 text-center text-zinc-600">
                <Activity size={40} className="mx-auto mb-4 opacity-20 animate-pulse" />
                <p className="text-sm font-bold uppercase tracking-widest">No activity data found for this user</p>
              </div>
            ) : (
              activities.map((item) => (
                <div key={item.id} className="bg-[#141d1a] border border-white/5 rounded-2xl p-5 flex items-center justify-between hover:bg-white/[0.02] transition-all group">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                      item.type === 'boutique_purchase' ? "bg-orange-500/10 text-orange-500" :
                      item.type === 'pack_completed' ? "bg-[#0fbd58]/10 text-[#0fbd58]" :
                      "bg-blue-500/10 text-blue-500"
                    )}>
                      {item.type === 'boutique_purchase' ? <Wallet size={18} /> : 
                       item.type === 'pack_completed' ? <Trophy size={18} /> : 
                       <Activity size={18} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white leading-tight">{item.details}</p>
                      <p className="text-[10px] text-zinc-500 font-medium uppercase mt-0.5 tracking-wider">
                        {item.type.replace(/_/g, ' ')} • {item.createdAt?.seconds 
                          ? new Date(item.createdAt.seconds * 1000).toLocaleString() 
                          : 'Recent'}
                      </p>
                    </div>
                  </div>
                  {item.amount && (
                    <div className="text-right">
                       <p className="text-sm font-black text-white">₦{item.amount.toLocaleString()}</p>
                       <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Revenue</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
           <div className="bg-gradient-to-br from-[#0fbd58]/10 to-transparent border border-[#0fbd58]/20 rounded-[2rem] p-6 space-y-6">
              <h4 className="text-sm font-black text-white uppercase tracking-widest">Engagement Snapshot</h4>
              <div className="space-y-4 text-sm font-medium">
                <div className="flex justify-between items-center text-zinc-400">
                  <span>Purchases</span>
                  <span className="text-white font-bold">{activities.filter(a => a.type === 'boutique_purchase').length}</span>
                </div>
                <div className="flex justify-between items-center text-zinc-400">
                  <span>Success Rate</span>
                  <span className="text-[#0fbd58] font-bold">88%</span>
                </div>
                <div className="flex justify-between items-center text-zinc-400">
                  <span>Lifetime Spend</span>
                  <span className="text-white font-bold">₦{activities.reduce((acc, a) => acc + (a.amount || 0), 0).toLocaleString()}</span>
                </div>
              </div>
              <div className="pt-4 border-t border-white/5">
                <p className="text-[11px] text-zinc-500 leading-relaxed italic">
                  This user is primarily active during evening hours (7PM - 10PM WAT). Favorite category: Cultural History.
                </p>
              </div>
           </div>

           <div className="bg-[#141d1a] border border-white/5 rounded-[2rem] p-6">
              <h4 className="text-sm font-black text-white uppercase tracking-widest mb-4">Admin Audit Notes</h4>
              <textarea 
                placeholder="Add a private note about this user..."
                className="w-full bg-black/20 border border-white/5 rounded-xl p-4 text-xs text-zinc-300 focus:outline-none focus:border-[#0fbd58]/50 h-32 resize-none transition-all"
              />
              <button className="w-full mt-4 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                Save Audit Note
              </button>
           </div>
        </div>
      </div>
    </main>
  );
}
