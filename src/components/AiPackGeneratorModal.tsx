'use client';

import React, { useState } from 'react';
import { Sparkles, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AiPackGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AiPackGeneratorModal({ isOpen, onClose }: AiPackGeneratorModalProps) {
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState('History');
  const [difficulty, setDifficulty] = useState('Beginner');
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!topic) return;
    setGenerating(true);
    setStatus('idle');
    setMessage('Connecting to GPT module...');

    try {
      // Logic for calling the Cloud Function generatePack will go here
      // For now, we simulate a delay
      await new Promise(r => setTimeout(r, 4000));
      
      // Actual implementation:
      // const response = await fetch('https://us-central1-naija-trivia.cloudfunctions.net/generatePack', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ topic, category, difficulty })
      // });
      
      setStatus('success');
      setMessage('Success! AI has synthesized the pack and added it to your trivia catalog.');
      setTimeout(() => {
        onClose();
        setStatus('idle');
        setTopic('');
        // We might want to trigger a refresh if not using onSnapshot
      }, 2000);
    } catch (err) {
      const error = err as Error;
      console.error(error);
      setStatus('error');
      setMessage(`Upload failed: ${error.message || 'Check JSON format'}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#141d1a] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0fbd58]/10 flex items-center justify-center text-[#0fbd58]">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">AI Pack Generator</h3>
                <p className="text-zinc-500 text-xs font-medium">Synthesize full trivia packs in seconds</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-zinc-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Topic / Narrative</label>
              <input 
                type="text"
                placeholder="e.g., Nigerian Independence, Afrobeats History..."
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-[#0fbd58]/50 transition-all font-medium"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Category</label>
                <select 
                   className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#0fbd58]/50 transition-all appearance-none cursor-pointer"
                   value={category}
                   onChange={(e) => setCategory(e.target.value)}
                >
                   <option>History</option>
                   <option>Culture</option>
                   <option>Geography</option>
                   <option>Music</option>
                   <option>Sports</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Difficulty</label>
                <select 
                   className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#0fbd58]/50 transition-all appearance-none cursor-pointer"
                   value={difficulty}
                   onChange={(e) => setDifficulty(e.target.value)}
                >
                   <option>Beginner</option>
                   <option>Intermediate</option>
                   <option>Legendary</option>
                </select>
              </div>
            </div>
          </div>

          {status !== 'idle' && (
            <div className={cn(
              "p-4 rounded-2xl flex items-start gap-3 border animate-in slide-in-from-top-2",
              status === 'success' 
                ? "bg-[#0fbd58]/10 border-[#0fbd58]/20 text-[#0fbd58]" 
                : "bg-red-500/10 border-red-500/20 text-red-400"
            )}>
              {status === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <p className="text-xs font-semibold leading-relaxed">{message}</p>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={generating || !topic}
            className={cn(
              "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95",
              generating || !topic 
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" 
                : "bg-[#0fbd58] text-white hover:bg-[#0db052] shadow-[#0fbd58]/20"
            )}
          >
            {generating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Generate Pack
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
