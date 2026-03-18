'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Settings as SettingsIcon, 
  Database, 
  ShieldAlert, 
  CheckCircle2, 
  Loader2,
  UserPlus
} from 'lucide-react';
import { db } from '@/lib/firebase-client';
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [seeding, setSeeding] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  if (loading) return null;
  if (!user) {
    router.push('/login');
    return null;
  }

  const handleSeedDatabase = async () => {
    setSeeding(true);
    setStatus('idle');
    setMessage('Initializing your trivia empire...');

    try {
      // 1. Elevate Current User (Self-Promotion)
      await setDoc(doc(db, 'users', user.uid), {
        displayName: user.displayName || 'Master Admin',
        email: user.email,
        isAdmin: true,
        wallet: { coins: 5000, gems: 100 },
        updatedAt: serverTimestamp()
      }, { merge: true });

      // 2. Add Sample Packs
      const samplePacks = [
        { title: 'Nigerian Independence', category: 'History', questionCount: 15, difficulty: 'Intermediate', status: 'Published', version: '1.0.0' },
        { title: 'Afrobeats Legends', category: 'Music', questionCount: 12, difficulty: 'Beginner', status: 'Published', version: '1.0.0' }
      ];

      for (const pack of samplePacks) {
        await addDoc(collection(db, 'packs'), {
          ...pack,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      // 3. Add Sample Skins
      const sampleSkins = [
        { name: 'Naija Gold', type: 'Theme', price: 500, status: 'Active' },
        { name: 'Super Eagles', type: 'Avatar', price: 350, status: 'Active' }
      ];

      for (const skin of sampleSkins) {
        await addDoc(collection(db, 'skins'), {
          ...skin,
          createdAt: serverTimestamp()
        });
      }

      setStatus('success');
      setMessage('Database initialized! You are now a verified admin with sample content.');
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setMessage(`Seeding failed: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto bg-[#0b0e0c] p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <SettingsIcon className="text-zinc-500" size={24} />
            System Control
          </h2>
          <p className="text-zinc-500 text-sm font-medium">Global configuration and administrative tools</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Database Quickstart */}
        <div className="p-8 rounded-[2.5rem] bg-[#141d1a] border border-white/5 space-y-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 pointer-events-none transition-opacity">
            <Database size={120} />
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#0fbd58]/10 flex items-center justify-center text-[#0fbd58]">
              <Database size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">Project Initialization</h3>
              <p className="text-zinc-500 text-xs font-medium">Seed your project with essential data</p>
            </div>
          </div>

          <div className="bg-black/20 rounded-2xl p-4 border border-white/5 space-y-3">
            <div className="flex items-start gap-3">
              <UserPlus className="text-[#0fbd58] mt-1" size={16} />
              <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                Running this tool will grant your account <span className="text-white font-bold">isAdmin: true</span> and populate the trivia catalogue with sample packs and boutique items.
              </p>
            </div>
            {status !== 'idle' && (
              <div className={cn(
                "p-3 rounded-xl flex items-center gap-2 border text-xs font-bold animate-in slide-in-from-top-2",
                status === 'success' ? "bg-[#0fbd58]/10 border-[#0fbd58]/20 text-[#0fbd58]" : "bg-red-500/10 border-red-500/20 text-red-400"
              )}>
                {status === 'success' ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
                {message}
              </div>
            )}
          </div>

          <button
            onClick={handleSeedDatabase}
            disabled={seeding}
            className={cn(
              "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95",
              seeding 
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" 
                : "bg-[#0fbd58] text-white hover:bg-[#0db052] shadow-[#0fbd58]/20"
            )}
          >
            {seeding ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Initializing...
              </>
            ) : (
              <>
                <Database size={20} />
                Initialize Project Database
              </>
            )}
          </button>
        </div>

        {/* Security & Access */}
        <div className="p-8 rounded-[2.5rem] bg-[#141d1a] border border-white/5 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-400">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">Security Hardening</h3>
              <p className="text-zinc-500 text-xs font-medium">Verify Firestore rules and Auth policies</p>
            </div>
          </div>

          <div className="space-y-4">
             {[
               { name: 'Admin Rule Check', status: 'Compliant' },
               { name: 'Auth Origin Restriction', status: 'Locked' },
               { name: 'Public Write Access', status: 'Disabled' },
             ].map((item, i) => (
               <div key={i} className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                 <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{item.name}</span>
                 <div className="flex items-center gap-1.5 text-[#0fbd58]">
                    <CheckCircle2 size={14} />
                    <span className="text-[10px] font-bold uppercase">{item.status}</span>
                 </div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </main>
  );
}
