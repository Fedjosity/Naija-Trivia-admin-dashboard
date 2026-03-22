'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Save,
  ChevronDown,
  Loader2,
  X,
  Upload,
  Palette,
  User,
  Crown,
  Award,
  Lightbulb,
  Clock,
  RotateCcw,
  Zap,
  Image as ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase-client';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const CATEGORIES = [
  { value: 'Theme',           label: 'Theme',           icon: Palette,    color: 'text-violet-400' },
  { value: 'Avatar',          label: 'Avatar',          icon: User,       color: 'text-sky-400' },
  { value: 'Frame',           label: 'Frame',           icon: Crown,      color: 'text-amber-400' },
  { value: 'Title',           label: 'Title',           icon: Award,      color: 'text-emerald-400' },
  { value: 'HintPack',        label: 'Hint Pack',       icon: Lightbulb,  color: 'text-yellow-400' },
  { value: 'TimeExtender',    label: 'Time Extender',   icon: Clock,      color: 'text-blue-400' },
  { value: 'SecondChance',    label: 'Second Chance',   icon: RotateCcw,  color: 'text-pink-400' },
  { value: 'ScoreMultiplier', label: 'Score Multiplier', icon: Zap,       color: 'text-orange-400' },
] as const;

type Category = typeof CATEGORIES[number]['value'];

const RARITIES = ['Common', 'Rare', 'Epic', 'Legendary'] as const;
type Rarity = typeof RARITIES[number];

interface ItemData {
  name: string;
  description: string;
  category: Category;
  rarity: Rarity;
  price: number;
  adUnlockable: boolean;
  preview: string;
  status: 'Active' | 'Draft';
  metadata: Record<string, string | number>;
}

interface BoutiqueEditorProps {
  itemId?: string;
}

export default function BoutiqueEditor({ itemId }: BoutiqueEditorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(!!itemId);
  const [saving, setSaving] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<ItemData>({
    name: '',
    description: '',
    category: 'Theme',
    rarity: 'Common',
    price: 0,
    adUnlockable: false,
    preview: '',
    status: 'Draft',
    metadata: {},
  });

  useEffect(() => {
    if (!itemId) return;
    const fetchItem = async () => {
      try {
        const snap = await getDoc(doc(db, 'boutiqueItems', itemId));
        if (snap.exists()) {
          const d = snap.data();
          setFormData({
            name: d.name || '',
            description: d.description || '',
            category: d.category || 'Theme',
            rarity: d.rarity || 'Common',
            price: Number(d.price) || 0,
            adUnlockable: !!d.adUnlockable,
            preview: d.preview || '',
            status: d.status || 'Draft',
            metadata: d.metadata || {},
          });
          if (d.preview) setPreviewUrl(d.preview);
        }
      } catch (err) {
        console.error('Fetch item error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [itemId]);

  // Compress and convert image to Base64
  const compressImage = (file: File, maxWidth = 600, quality = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = document.createElement('img');
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let w = img.width, h = img.height;
          if (w > maxWidth) { h = (h * maxWidth) / w; w = maxWidth; }
          canvas.width = w;
          canvas.height = h;
          canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
          canvas.toBlob((blob) => {
            if (!blob) return reject(new Error('Compression failed'));
            const r2 = new FileReader();
            r2.onloadend = () => resolve(r2.result as string);
            r2.readAsDataURL(blob);
          }, 'image/jpeg', quality);
        };
        img.onerror = () => reject(new Error('Image load failed'));
      };
      reader.onerror = () => reject(new Error('File read failed'));
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewFile(file);
    if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!formData.name) return alert('Name is required');
    setSaving(true);
    try {
      let preview = formData.preview;
      if (previewFile) {
        preview = await compressImage(previewFile);
      }

      const payload = {
        ...formData,
        preview,
        updatedAt: serverTimestamp(),
      };

      if (itemId) {
        await updateDoc(doc(db, 'boutiqueItems', itemId), payload);
      } else {
        const newRef = doc(collection(db, 'boutiqueItems'));
        await setDoc(newRef, { ...payload, createdAt: serverTimestamp() });
      }
      router.push('/boutique');
    } catch (err) {
      console.error('Save failed:', err);
      alert('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const setMeta = (key: string, value: string | number) => {
    setFormData(prev => ({ ...prev, metadata: { ...prev.metadata, [key]: value } }));
  };

  const selectedCat = CATEGORIES.find(c => c.value === formData.category)!;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0b0e0c]">
        <Loader2 className="animate-spin text-[#0fbd58]" size={40} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#0b0e0c] pb-20">
      <div className="max-w-5xl mx-auto p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between sticky top-0 z-10 bg-[#0b0e0c]/80 backdrop-blur-md py-4 border-b border-white/5">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 text-zinc-500 hover:text-white transition-colors">
              <X size={24} />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {itemId ? 'Edit Boutique Item' : 'Create New Item'}
              </h2>
              <p className="text-zinc-500 text-sm font-medium">
                {itemId ? `ID: ${itemId}` : 'Add a new item to the Boutique'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white/5 rounded-2xl p-1 border border-white/5">
              <button
                onClick={() => setFormData(p => ({ ...p, status: 'Draft' }))}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                  formData.status === 'Draft' ? "bg-white/10 text-white" : "text-zinc-500 hover:text-white"
                )}
              >
                Draft
              </button>
              <button
                onClick={() => setFormData(p => ({ ...p, status: 'Active' }))}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                  formData.status === 'Active' ? "bg-[#0fbd58] text-white shadow-lg shadow-[#0fbd58]/20" : "text-zinc-500 hover:text-white"
                )}
              >
                Active
              </button>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-[#0fbd58] text-white px-6 py-3 rounded-2xl font-bold hover:bg-[#0db052] transition-all shadow-lg shadow-[#0fbd58]/20 disabled:opacity-50"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {itemId ? 'Update Item' : 'Save Item'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column — Main Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* General Info */}
            <section className="bg-[#141d1a] border border-white/5 rounded-[2.5rem] p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <div className="w-8 h-8 rounded-lg bg-[#0fbd58]/10 flex items-center justify-center text-[#0fbd58]">
                  <ImageIcon size={18} />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">Item Details</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Item Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                    className="w-full bg-black/30 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#0fbd58]/50 transition-all font-semibold"
                    placeholder="e.g., Ankara Blaze Theme"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                    className="w-full bg-black/30 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#0fbd58]/50 transition-all font-medium min-h-[100px] resize-none"
                    placeholder="Short description shown to users..."
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Category</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {CATEGORIES.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setFormData(p => ({ ...p, category: cat.value, metadata: {} }))}
                          className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-2xl border text-xs font-bold transition-all",
                            formData.category === cat.value
                              ? "bg-[#0fbd58]/10 border-[#0fbd58]/30 text-white"
                              : "bg-black/20 border-white/5 text-zinc-500 hover:text-white hover:border-white/10"
                          )}
                        >
                          <Icon size={20} className={formData.category === cat.value ? cat.color : ''} />
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Rarity */}
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Rarity</label>
                    <div className="relative">
                      <select
                        value={formData.rarity}
                        onChange={(e) => setFormData(p => ({ ...p, rarity: e.target.value as Rarity }))}
                        className={cn(
                          "w-full bg-black/30 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none transition-all appearance-none cursor-pointer font-semibold",
                          formData.rarity === 'Legendary' ? "text-orange-400 border-orange-400/20" :
                          formData.rarity === 'Epic' ? "text-purple-400 border-purple-400/20" :
                          formData.rarity === 'Rare' ? "text-blue-400 border-blue-400/20" :
                          "text-white"
                        )}
                      >
                        {RARITIES.map(r => <option key={r}>{r}</option>)}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" size={16} />
                    </div>
                  </div>

                  {/* Price */}
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Price (🐚 Cowries)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="1000"
                        value={formData.price}
                        onChange={(e) => setFormData(p => ({ ...p, price: Math.max(0, Number(e.target.value)) }))}
                        className="w-full bg-black/30 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#0fbd58]/50 transition-all font-semibold appearance-none"
                        placeholder="0 = Free"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg pointer-events-none">🐚</span>
                    </div>
                    {formData.price === 0 && (
                      <p className="text-[10px] text-[#0fbd58] font-bold mt-1 ml-1">This item is FREE</p>
                    )}
                  </div>

                  {/* Ad Unlockable */}
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Ad Unlockable?</label>
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, adUnlockable: !p.adUnlockable }))}
                      className={cn(
                        "w-full rounded-2xl px-5 py-4 font-semibold transition-all border text-sm",
                        formData.adUnlockable
                          ? "bg-[#0fbd58]/10 border-[#0fbd58]/30 text-[#0fbd58]"
                          : "bg-black/30 border-white/10 text-zinc-500 hover:text-white"
                      )}
                    >
                      {formData.adUnlockable ? '✅ Yes — Watch Ad' : '❌ No — Cowries Only'}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Category-Specific Metadata */}
            {(formData.category === 'Theme' || formData.category === 'Title' || formData.category === 'HintPack' || formData.category === 'ScoreMultiplier' || formData.category === 'TimeExtender' || formData.category === 'SecondChance') && (
              <section className="bg-[#141d1a] border border-white/5 rounded-[2.5rem] p-8 space-y-6">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                  <div className={cn("w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center", selectedCat.color)}>
                    <selectedCat.icon size={18} />
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight">{selectedCat.label} Settings</h3>
                </div>

                <div className="space-y-4">
                  {formData.category === 'Theme' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Primary Color</label>
                        <input
                          type="color"
                          value={String(formData.metadata.primaryColor || '#0fbd58')}
                          onChange={(e) => setMeta('primaryColor', e.target.value)}
                          className="w-full h-14 rounded-2xl border border-white/10 bg-black/30 cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Secondary Color</label>
                        <input
                          type="color"
                          value={String(formData.metadata.secondaryColor || '#141d1a')}
                          onChange={(e) => setMeta('secondaryColor', e.target.value)}
                          className="w-full h-14 rounded-2xl border border-white/10 bg-black/30 cursor-pointer"
                        />
                      </div>
                    </div>
                  )}

                  {formData.category === 'Title' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Display Text</label>
                        <input
                          type="text"
                          value={String(formData.metadata.displayText || '')}
                          onChange={(e) => setMeta('displayText', e.target.value)}
                          className="w-full bg-black/30 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#0fbd58]/50 transition-all font-semibold"
                          placeholder="e.g., Chief"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Position</label>
                        <div className="relative">
                          <select
                            value={String(formData.metadata.position || 'prefix')}
                            onChange={(e) => setMeta('position', e.target.value)}
                            className="w-full bg-black/30 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none transition-all appearance-none cursor-pointer font-semibold"
                          >
                            <option value="prefix">Prefix (before name)</option>
                            <option value="suffix">Suffix (after name)</option>
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" size={16} />
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.category === 'HintPack' && (
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Number of Hints</label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={Number(formData.metadata.quantity || 3)}
                        onChange={(e) => setMeta('quantity', Number(e.target.value))}
                        className="w-full bg-black/30 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#0fbd58]/50 transition-all font-semibold appearance-none"
                      />
                    </div>
                  )}

                  {formData.category === 'ScoreMultiplier' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Multiplier</label>
                        <div className="relative">
                          <select
                            value={String(formData.metadata.multiplier || '2')}
                            onChange={(e) => setMeta('multiplier', Number(e.target.value))}
                            className="w-full bg-black/30 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none transition-all appearance-none cursor-pointer font-semibold"
                          >
                            <option value="1.5">1.5x</option>
                            <option value="2">2x</option>
                            <option value="3">3x</option>
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" size={16} />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Duration</label>
                        <div className="relative">
                          <select
                            value={String(formData.metadata.duration || '1 game')}
                            onChange={(e) => setMeta('duration', e.target.value)}
                            className="w-full bg-black/30 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none transition-all appearance-none cursor-pointer font-semibold"
                          >
                            <option value="1 game">1 Game</option>
                            <option value="1 pack">1 Pack</option>
                            <option value="24 hours">24 Hours</option>
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" size={16} />
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.category === 'TimeExtender' && (
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Extra Seconds</label>
                      <input
                        type="number"
                        min="5"
                        max="60"
                        step="5"
                        value={Number(formData.metadata.extraSeconds || 10)}
                        onChange={(e) => setMeta('extraSeconds', Number(e.target.value))}
                        className="w-full bg-black/30 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#0fbd58]/50 transition-all font-semibold appearance-none"
                      />
                    </div>
                  )}

                  {formData.category === 'SecondChance' && (
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Uses Per Game</label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={Number(formData.metadata.usesPerGame || 1)}
                        onChange={(e) => setMeta('usesPerGame', Number(e.target.value))}
                        className="w-full bg-black/30 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#0fbd58]/50 transition-all font-semibold appearance-none"
                      />
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* Right Column — Preview & Image */}
          <div className="space-y-8">
            <section className="bg-[#141d1a] border border-white/5 rounded-[2.5rem] p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <div className="w-8 h-8 rounded-lg bg-[#0fbd58]/10 flex items-center justify-center text-[#0fbd58]">
                  <Upload size={18} />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">Preview Image</h3>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />

              {previewUrl ? (
                <div className="relative group/img">
                  <div className="w-full aspect-square rounded-2xl overflow-hidden border border-white/10 bg-black/30 relative">
                    <Image
                      src={previewUrl}
                      alt="Item preview"
                      fill
                      className="object-contain p-4"
                      unoptimized={previewUrl.startsWith('blob:') || previewUrl.startsWith('data:')}
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-white/10 text-white rounded-xl text-xs font-bold hover:bg-white/20 transition-all border border-white/10"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewFile(null);
                        if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
                        setPreviewUrl('');
                        setFormData(p => ({ ...p, preview: '' }));
                      }}
                      className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl text-xs font-bold hover:bg-red-500/30 transition-all border border-red-500/20"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-square rounded-2xl border-2 border-dashed border-white/10 bg-black/20 hover:border-[#0fbd58]/30 hover:bg-[#0fbd58]/5 transition-all flex flex-col items-center justify-center gap-3 group/upload cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-zinc-600 group-hover/upload:text-[#0fbd58] transition-colors">
                    <Upload size={24} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-zinc-500 group-hover/upload:text-white transition-colors">
                      Upload preview
                    </p>
                    <p className="text-[10px] font-medium text-zinc-700 mt-1">PNG, JPG, WEBP</p>
                  </div>
                </button>
              )}
            </section>

            {/* Quick Summary Card */}
            <section className="bg-[#141d1a] border border-white/5 rounded-[2.5rem] p-6 space-y-4">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Summary</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs text-zinc-600 font-medium">Category</span>
                  <span className={cn("text-xs font-bold", selectedCat.color)}>{selectedCat.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-zinc-600 font-medium">Rarity</span>
                  <span className={cn(
                    "text-xs font-bold",
                    formData.rarity === 'Legendary' ? "text-orange-400" :
                    formData.rarity === 'Epic' ? "text-purple-400" :
                    formData.rarity === 'Rare' ? "text-blue-400" :
                    "text-zinc-400"
                  )}>{formData.rarity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-zinc-600 font-medium">Price</span>
                  <span className="text-xs font-bold text-white">{formData.price === 0 ? 'FREE' : `${formData.price} 🐚`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-zinc-600 font-medium">Ad Unlock</span>
                  <span className="text-xs font-bold text-white">{formData.adUnlockable ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-zinc-600 font-medium">Status</span>
                  <span className={cn("text-xs font-bold", formData.status === 'Active' ? 'text-[#0fbd58]' : 'text-zinc-400')}>{formData.status}</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
