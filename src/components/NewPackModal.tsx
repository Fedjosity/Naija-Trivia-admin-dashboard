'use client';

import React, { useState, useRef } from 'react';
import { Plus, X, Upload, FileJson, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase-client';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface NewPackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewPackModal({ isOpen, onClose }: NewPackModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/json') {
      setFile(selectedFile);
      setStatus('idle');
      setMessage('');
    } else {
      setStatus('error');
      setMessage('Please select a valid .json file.');
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setStatus('idle');
    setMessage('Parsing and validating trivia pack...');

    try {
      const text = await file.text();
      const packData = JSON.parse(text);

      // Basic validation
      if (!packData.title || !packData.questions || !Array.isArray(packData.questions)) {
        throw new Error('Invalid pack format. Missing title or questions array.');
      }

      setMessage('Uploading to secure database...');
      
      const docRef = await addDoc(collection(db, 'packs'), {
        ...packData,
        status: 'Published',
        version: packData.version || 1,
        questionCount: packData.questions.length,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log('Document written with ID: ', docRef.id);
      setStatus('success');
      setMessage(`Success! "${packData.title}" has been added to the trivia catalog.`);
      
      setTimeout(() => {
        onClose();
        setFile(null);
        setStatus('idle');
      }, 2000);

    } catch (err) {
      const error = err as Error;
      console.error(error);
      setStatus('error');
      setMessage(`Upload failed: ${error.message || 'Check JSON format'}`);
    } finally {
      setUploading(false);
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
                <Plus size={20} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">Manual Pack Upload</h3>
                <p className="text-zinc-500 text-xs font-medium">Upload structured JSON trivia data</p>
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
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "group border-2 border-dashed rounded-[2rem] p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all",
                file ? "border-[#0fbd58]/40 bg-[#0fbd58]/5" : "border-white/5 bg-black/20 hover:border-white/10 hover:bg-black/30"
              )}
            >
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
              />
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                file ? "bg-[#0fbd58] text-white" : "bg-white/5 text-zinc-500 group-hover:scale-110"
              )}>
                {file ? <FileJson size={24} /> : <Upload size={24} />}
              </div>
              <div className="text-center">
                <p className={cn(
                  "text-sm font-bold",
                  file ? "text-[#0fbd58]" : "text-zinc-400"
                )}>
                  {file ? file.name : "Select JSON file"}
                </p>
                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider mt-1">
                  {file ? `${(file.size / 1024).toFixed(1)} KB` : "Max size 2MB"}
                </p>
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
            onClick={handleUpload}
            disabled={uploading || !file}
            className={cn(
              "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95",
              uploading || !file 
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" 
                : "bg-[#0fbd58] text-white hover:bg-[#0db052] shadow-[#0fbd58]/20"
            )}
          >
            {uploading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Upload size={18} />
                Publish Pack
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
