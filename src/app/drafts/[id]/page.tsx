import { Button } from '@/components/ui/button';
import { Question } from '@antigravity/content-schema';
import fs from 'fs/promises';
import path from 'path';
import { notFound, redirect } from 'next/navigation';

export default async function ReviewPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  // Load draft
  const draftsDir = path.resolve(process.cwd(), '../../content/drafts');
  const filePath = path.join(draftsDir, `${id}.json`);
  
  let draft: Question;
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    draft = JSON.parse(data);
  } catch (e) {
    notFound();
  }

  async function approveAction(formData: FormData) {
      'use server';
      // Move to approved folder
      const approvedDir = path.resolve(process.cwd(), '../../content/approved');
      try { await fs.mkdir(approvedDir, { recursive: true }); } catch {}
      
      const newPath = path.join(approvedDir, `${id}.json`);
      // In real app we would validate changes from FormData here
      // For now we just move the file
      const currentDraftDir = path.resolve(process.cwd(), '../../content/drafts');
      const currentPath = path.join(currentDraftDir, `${id}.json`);
      
      // Read potentially updated data from form if we had inputs, 
      // but for this scaffold we'll assume "Approved as is" or similar
      const data = await fs.readFile(currentPath);
      await fs.writeFile(newPath, data);
      await fs.unlink(currentPath);
      
      redirect('/drafts');
  }

  return (
    <main className="p-10 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
         <h1 className="text-2xl font-serif font-bold">Review Question</h1>
         <div className="space-x-2">
             <Button variant="outline">Reject</Button>
         </div>
      </div>
      
      <div className="bg-card border rounded-lg p-6 space-y-6">
          <div className="space-y-2">
              <label className="text-sm font-medium">Question Text</label>
              <div className="p-3 bg-muted rounded-md border">{draft.text}</div>
          </div>
          
          <div className="space-y-2">
              <label className="text-sm font-medium">Options</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {draft.options.map((opt, i) => (
                      <div key={i} className={`p-3 rounded-md border ${i === draft.correctAnswerIndex ? 'bg-green-100 dark:bg-green-900 border-green-500' : 'bg-background'}`}>
                          {opt}
                      </div>
                  ))}
              </div>
          </div>

          <div className="space-y-2">
              <label className="text-sm font-medium">Explanation</label>
              <p className="text-sm text-muted-foreground">{draft.explanation}</p>
          </div>

          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800">
               <span className="text-xs font-bold text-yellow-800 dark:text-yellow-200 uppercase tracking-wider">Cultural Context</span>
               <p className="mt-1 text-sm">{draft.culturalContext}</p>
          </div>
          
          <form action={approveAction} className="pt-4 border-t">
              <Button type="submit" className="w-full md:w-auto">Approve & Publish</Button>
          </form>
      </div>
    </main>
  );
}
