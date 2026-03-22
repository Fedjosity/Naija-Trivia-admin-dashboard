'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  X,
  Image as ImageIcon,
  List,
  Upload
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { db, storage } from '@/lib/firebase-client';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import { generateQuestions } from '@/app/actions';
import Image from 'next/image';

interface Question {
  text: string;
  options: string[];
  correctOptionIndex: number;
  hint: string;
}

interface PackData {
  title: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Legendary';
  coverImage: string;
  version: string;
  status: 'Published' | 'Draft';
  questions: Question[];
}

interface PackEditorProps {
  packId?: string; // If provided, we are editing
  initialAiTrigger?: boolean;
}

export default function PackEditor({ packId }: PackEditorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(packId ? true : false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiQuestionCount, setAiQuestionCount] = useState(5);
  
  // Image upload state
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<PackData>({
    title: '',
    category: 'History',
    difficulty: 'Intermediate',
    coverImage: '',
    version: '1.0',
    status: 'Draft',
    questions: []
  });

  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(0);

  useEffect(() => {
    const fetchPack = async () => {
      if (!packId) return;
      try {
        const docRef = doc(db, 'packs', packId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            title: data.title || '',
            category: data.category || 'History',
            difficulty: data.difficulty || 'Intermediate',
            coverImage: data.coverImage || '',
            version: data.version?.toString() || '1.0',
            status: data.status || 'Draft',
            questions: (data.questions || []).map((q: Partial<Question>) => ({
              text: q.text || '',
              options: q.options || ['', '', '', ''],
              correctOptionIndex: q.correctOptionIndex ?? 0,
              hint: q.hint || '',
            }))
          });
          // Set preview for existing cover image
          if (data.coverImage) {
            const url = data.coverImage.startsWith('http')
              ? data.coverImage
              : `https://firebasestorage.googleapis.com/v0/b/naija-trivia.firebasestorage.app/o/${encodeURIComponent(data.coverImage)}?alt=media`;
            setCoverImagePreview(url);
          }
        }
      } catch (err) {
        console.error('Error fetching pack:', err);
      } finally {
        setLoading(false);
      }
    };

    if (packId) {
      fetchPack();
    }
  }, [packId]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCoverImageFile(file);
    // Revoke old preview URL to avoid memory leaks
    if (coverImagePreview && coverImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(coverImagePreview);
    }
    setCoverImagePreview(URL.createObjectURL(file));
  };

  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        { text: '', options: ['', '', '', ''], correctOptionIndex: 0, hint: '' }
      ]
    }));
    setExpandedQuestion(formData.questions.length);
  };

  const removeQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
    // Adjust expanded question index
    setExpandedQuestion(prev => {
      if (prev === null) return null;
      if (prev === index) return null;
      if (prev > index) return prev - 1;
      return prev;
    });
  };

  const handleQuestionChange = (index: number, field: keyof Question, value: string | number) => {
    const newQuestions = [...formData.questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setFormData(prev => ({ ...prev, questions: newQuestions }));
  };

  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...formData.questions];
    newQuestions[qIndex] = {
      ...newQuestions[qIndex],
      options: newQuestions[qIndex].options.map((opt, i) => i === oIndex ? value : opt)
    };
    setFormData(prev => ({ ...prev, questions: newQuestions }));
  };

  const handleSave = async () => {
    if (!formData.title) return alert('Title is required');
    setSaving(true);
    try {
      let coverImageUrl = formData.coverImage;

      // Upload cover image if a new file was selected
      if (coverImageFile) {
        const docId = packId || doc(collection(db, 'packs')).id;
        const ext = coverImageFile.name.split('.').pop() || 'png';
        const storageRef = ref(storage, `packs/covers/${docId}.${ext}`);
        await uploadBytes(storageRef, coverImageFile);
        coverImageUrl = await getDownloadURL(storageRef);
      }

      const payload = {
        ...formData,
        coverImage: coverImageUrl,
        questionCount: formData.questions.length,
        updatedAt: serverTimestamp()
      };

      if (packId) {
        await updateDoc(doc(db, 'packs', packId), payload);
      } else {
        const newDocRef = doc(collection(db, 'packs'));
        await setDoc(newDocRef, { ...payload, createdAt: serverTimestamp() });
      }
      router.push('/packs');
    } catch (err) {
      console.error('Save failed:', err);
      alert('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt) return;
    setGenerating(true);
    try {
      const generated = await generateQuestions(
        formData.category, 
        aiQuestionCount, 
        formData.difficulty, 
        formData.title
      );
      
      if (!generated || generated.length === 0) {
        alert('AI returned no questions. Please try a different prompt or check your API key.');
        return;
      }

      // Map the server action's Question schema to our PackEditor schema
      const mappedQuestions: Question[] = generated.map((q) => {
        const raw = q as unknown as Record<string, unknown>;
        return {
          text: q.text || '',
          options: q.options || ['', '', '', ''],
          correctOptionIndex: Number(raw.correctAnswerIndex ?? raw.correctOptionIndex ?? 0),
          hint: String(raw.hint || raw.culturalContext || raw.explanation || ''),
        };
      });

      setFormData(prev => ({
        ...prev,
        questions: [...prev.questions, ...mappedQuestions]
      }));
      setAiPrompt('');
    } catch (err) {
      console.error('AI Generation failed:', err);
      alert('AI generation failed. Please ensure your GOOGLE_API_KEY is set in .env.local');
    } finally {
      setGenerating(false);
    }
  };

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
            <button 
              onClick={() => router.back()}
              className="p-2 text-zinc-500 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {packId ? 'Edit Trivia Pack' : 'Create New Pack'}
              </h2>
              <p className="text-zinc-500 text-sm font-medium">
                {packId ? `ID: ${packId}` : 'Design your next big challenge'}
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
                onClick={() => setFormData(p => ({ ...p, status: 'Published' }))}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                  formData.status === 'Published' ? "bg-[#0fbd58] text-white shadow-lg shadow-[#0fbd58]/20" : "text-zinc-500 hover:text-white"
                )}
              >
                Live
              </button>
            </div>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-[#0fbd58] text-white px-6 py-3 rounded-2xl font-bold hover:bg-[#0db052] transition-all shadow-lg shadow-[#0fbd58]/20 disabled:opacity-50"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {packId ? 'Update Pack' : 'Publish Pack'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-[#141d1a] border border-white/5 rounded-[2.5rem] p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <div className="w-8 h-8 rounded-lg bg-[#0fbd58]/10 flex items-center justify-center text-[#0fbd58]">
                   <ImageIcon size={18} />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">General Information</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Pack Title</label>
                  <input 
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                    className="w-full bg-black/30 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#0fbd58]/50 transition-all font-semibold"
                    placeholder="e.g., The Great Biafra War..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Category</label>
                    <select 
                      value={formData.category}
                      onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))}
                      className="w-full bg-black/30 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#0fbd58]/50 transition-all appearance-none cursor-pointer font-semibold"
                    >
                      {['History', 'Culture', 'Geography', 'Music', 'Sports'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Difficulty</label>
                    <select 
                      value={formData.difficulty}
                      onChange={(e) => setFormData(p => ({ ...p, difficulty: e.target.value as PackData['difficulty'] }))}
                      className="w-full bg-black/30 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#0fbd58]/50 transition-all appearance-none cursor-pointer font-semibold"
                    >
                      {['Beginner', 'Intermediate', 'Legendary'].map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                {/* Cover Image Upload */}
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Cover Image</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  
                  {coverImagePreview ? (
                    <div className="relative group/img">
                      <div className="w-full h-48 rounded-2xl overflow-hidden border border-white/10 bg-black/30 relative">
                        <Image
                          src={coverImagePreview}
                          alt="Cover preview"
                          fill
                          className="object-cover"
                          unoptimized={coverImagePreview.startsWith('blob:')}
                        />
                      </div>
                      <div className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 bg-white/10 text-white rounded-xl text-xs font-bold hover:bg-white/20 transition-all border border-white/10"
                        >
                          Change Image
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCoverImageFile(null);
                            if (coverImagePreview.startsWith('blob:')) URL.revokeObjectURL(coverImagePreview);
                            setCoverImagePreview('');
                            setFormData(p => ({ ...p, coverImage: '' }));
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
                      className="w-full h-48 rounded-2xl border-2 border-dashed border-white/10 bg-black/20 hover:border-[#0fbd58]/30 hover:bg-[#0fbd58]/5 transition-all flex flex-col items-center justify-center gap-3 group/upload cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-zinc-600 group-hover/upload:text-[#0fbd58] transition-colors">
                        <Upload size={24} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-zinc-500 group-hover/upload:text-white transition-colors">
                          Click to upload cover image
                        </p>
                        <p className="text-[10px] font-medium text-zinc-700 mt-1">
                          PNG, JPG, WEBP up to 5MB
                        </p>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* Questions Section */}
            <section className="bg-[#141d1a] border border-white/5 rounded-[2.5rem] p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#0fbd58]/10 flex items-center justify-center text-[#0fbd58]">
                     <List size={18} />
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Questions & Answers</h3>
                </div>
                <div className="px-3 py-1 bg-black/40 rounded-lg text-[#0fbd58] text-[10px] font-bold uppercase border border-white/5">
                   {formData.questions.length} Total
                </div>
              </div>

              <div className="space-y-4">
                {formData.questions.map((q, qIndex) => (
                  <div 
                    key={qIndex}
                    className={cn(
                      "bg-black/20 rounded-3xl border border-white/5 overflow-hidden transition-all duration-300",
                      expandedQuestion === qIndex ? "border-[#0fbd58]/30 ring-1 ring-[#0fbd58]/20" : ""
                    )}
                  >
                    <div 
                      className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                      onClick={() => setExpandedQuestion(expandedQuestion === qIndex ? null : qIndex)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 text-xs font-bold">
                          {qIndex + 1}
                        </div>
                        <p className="text-white font-semibold text-sm line-clamp-1 max-w-md">
                          {q.text || <span className="text-zinc-600 italic">Empty Question...</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeQuestion(qIndex); }}
                          className="p-2 text-zinc-600 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                        {expandedQuestion === qIndex ? <ChevronUp size={20} className="text-zinc-500" /> : <ChevronDown size={20} className="text-zinc-500" />}
                      </div>
                    </div>

                    {expandedQuestion === qIndex && (
                      <div className="p-6 border-t border-white/5 space-y-6 animate-in slide-in-from-top-4 duration-300">
                        <div>
                          <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest block mb-2 px-1">Question Content</label>
                          <textarea 
                            value={q.text}
                            onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                            className="w-full bg-black/30 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#0fbd58]/50 transition-all font-medium min-h-[100px] text-sm"
                            placeholder="Type your trivia question here..."
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {q.options.map((opt, oIndex) => (
                            <div key={oIndex} className="relative">
                               <input 
                                 type="text"
                                 value={opt}
                                 onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                                 className={cn(
                                   "w-full bg-black/30 border rounded-2xl px-12 py-4 text-sm text-white focus:outline-none transition-all font-medium",
                                   q.correctOptionIndex === oIndex ? "border-[#0fbd58]/50 bg-[#0fbd58]/5" : "border-white/5"
                                 )}
                                 placeholder={`Choice ${oIndex + 1}`}
                               />
                               <button 
                                 onClick={() => handleQuestionChange(qIndex, 'correctOptionIndex', oIndex)}
                                 className={cn(
                                   "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                                   q.correctOptionIndex === oIndex ? "bg-[#0fbd58] border-[#0fbd58]" : "border-zinc-700 hover:border-zinc-500"
                                 )}
                               >
                                 {q.correctOptionIndex === oIndex && <CheckCircle2 size={12} className="text-white" />}
                               </button>
                            </div>
                          ))}
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest block mb-2 px-1">Hint (Optional)</label>
                          <input 
                            type="text"
                            value={q.hint || ''}
                            onChange={(e) => handleQuestionChange(qIndex, 'hint', e.target.value)}
                            className="w-full bg-black/30 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#0fbd58]/50 transition-all font-medium text-sm"
                            placeholder="Helpful nudge for the player..."
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button 
                onClick={addQuestion}
                className="w-full py-4 border border-dashed border-white/10 rounded-3xl text-zinc-500 hover:text-white hover:border-[#0fbd58]/30 hover:bg-[#0fbd58]/5 transition-all font-bold flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Add New Question
              </button>
            </section>
          </div>

          {/* AI Tools Sidebar */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-[#141d1a] to-[#0fbd58]/5 border border-[#0fbd58]/20 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden group">
              <div className="absolute -top-4 -right-4 text-[#0fbd58]/10 group-hover:scale-110 transition-transform duration-700">
                <Sparkles size={120} />
              </div>

              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#0fbd58]/20 flex items-center justify-center text-[#0fbd58]">
                    <Sparkles size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight">AI Lab</h3>
                </div>
                <p className="text-zinc-400 text-xs font-medium leading-relaxed mb-6">
                  Synthesize new questions using Gemini AI. They will be added to your current list for review.
                </p>

                <textarea 
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder={`Describe the topic for ${formData.category} questions...`}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-[#0fbd58]/50 transition-all font-medium min-h-[120px] mb-4"
                />

                <div className="flex items-center justify-between mb-6 px-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Question Count</label>
                    <p className="text-[10px] text-zinc-600 font-medium">How many to synthesize?</p>
                  </div>
                  <div className="relative">
                    <input 
                      type="number"
                      min="1"
                      max="20"
                      value={aiQuestionCount}
                      onChange={(e) => setAiQuestionCount(Math.min(20, Math.max(1, Number(e.target.value))))}
                      className="w-20 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white text-center focus:outline-none focus:border-[#0fbd58]/50 transition-all font-bold appearance-none"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-600">
                      <ChevronDown size={14} />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleAiGenerate}
                  disabled={generating || !aiPrompt}
                  className="w-full py-4 bg-[#0fbd58] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#0db052] transition-all shadow-lg shadow-[#0fbd58]/30 disabled:opacity-50 active:scale-95"
                >
                  {generating ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                  {generating ? 'Generating with Gemini...' : 'Synthesize Questions'}
                </button>
              </div>
            </div>

            <div className="bg-[#141d1a] border border-white/5 rounded-[2.5rem] p-8 space-y-4">
               <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">Pack Management</h4>
               <div className="space-y-2">
                 <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                   <span className="text-xs font-bold text-zinc-500">Status</span>
                   <span className={cn(
                     "text-[10px] font-bold uppercase",
                     formData.status === 'Published' ? "text-[#0fbd58]" : "text-orange-400"
                   )}>{formData.status}</span>
                 </div>
                 <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                   <span className="text-xs font-bold text-zinc-500">Total Questions</span>
                   <span className="text-xs font-bold text-white tracking-widest">{formData.questions.length}</span>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
