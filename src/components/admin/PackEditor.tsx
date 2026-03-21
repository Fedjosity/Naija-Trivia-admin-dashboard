'use client';

import React, { useState, useEffect } from 'react';
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
  List
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase-client';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

interface Question {
  text: string;
  options: string[];
  correctOptionIndex: number;
  hint?: string;
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
            questions: data.questions || []
          });
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
  };

  const handleQuestionChange = (index: number, field: keyof Question, value: string | number) => {
    const newQuestions = [...formData.questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setFormData(prev => ({ ...prev, questions: newQuestions }));
  };

  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...formData.questions];
    newQuestions[qIndex].options[oIndex] = value;
    setFormData(prev => ({ ...prev, questions: newQuestions }));
  };

  const handleSave = async () => {
    if (!formData.title) return alert('Title is required');
    setSaving(true);
    try {
      const payload = {
        ...formData,
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
      // Simulation of AI generation flow
      // In reality, this would call a Cloud Function
      await new Promise(r => setTimeout(r, 3000));
      
      const generatedQuestions: Question[] = [
        { 
          text: `Who was the first president of Nigeria in the context of ${aiPrompt}?`, 
          options: ['Nnamdi Azikiwe', 'Obafemi Awolowo', 'Ahmadu Bello', 'Tafawa Balewa'],
          correctOptionIndex: 0,
          hint: 'He is also known as Zik.'
        },
        {
          text: `In what year did Nigeria gain its independence?`,
          options: ['1960', '1963', '1957', '1970'],
          correctOptionIndex: 0
        }
      ];

      setFormData(prev => ({
        ...prev,
        questions: [...prev.questions, ...generatedQuestions]
      }));
      setAiPrompt('');
    } catch (err) {
      console.error('AI Generation failed:', err);
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

                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Cover Image Path / URL</label>
                  <input 
                    type="text"
                    value={formData.coverImage}
                    onChange={(e) => setFormData(p => ({ ...p, coverImage: e.target.value }))}
                    className="w-full bg-black/30 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#0fbd58]/50 transition-all font-semibold"
                    placeholder="packs/category/image.png or https://..."
                  />
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
                            value={q.hint}
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
                  Synthesize new questions using our GPT-4 pipeline. They will be added to your current list for review.
                </p>

                <textarea 
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ask AI to generate 5 more questions about the Biafra war..."
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-[#0fbd58]/50 transition-all font-medium min-h-[120px] mb-4"
                />

                <button 
                  onClick={handleAiGenerate}
                  disabled={generating || !aiPrompt}
                  className="w-full py-4 bg-[#0fbd58] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#0db052] transition-all shadow-lg shadow-[#0fbd58]/30 disabled:opacity-50 active:scale-95"
                >
                  {generating ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                  {generating ? 'Processing...' : 'Synthesize Questions'}
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
