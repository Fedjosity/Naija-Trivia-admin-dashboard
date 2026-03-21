'use client';

import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { generateQuestions, saveDraft } from '../actions';
import { useState } from 'react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Generating...' : 'Generate Batch'}
    </Button>
  );
}

export function GeneratorForm() {
  const [message, setMessage] = useState('');

  async function clientAction(formData: FormData) {
      setMessage('');
      const category = formData.get('category') as string;
      
      try {
          // We call the server action from here
          const questions = await generateQuestions(category);
          
          if (!questions || questions.length === 0) {
              setMessage('No questions generated. Check server logs/API Key.');
              return;
          }

          for (const q of questions) {
              await saveDraft(q);
          }
          
          // We need to refresh the page to see the new drafts. 
          // Since we are in a client component, we might rely on the parent or router.refresh()
          // But actually, `revalidatePath` in the server action generally works if invoked there.
          // Let's rely on a window reload for this simple version or router refresh.
          window.location.reload(); 

      } catch {
          setMessage('Error during generation.');
      }
  }

  return (
    <div className="space-y-4">
        <form action={clientAction} className="space-y-4">
            <select name="category" className="w-full p-2 border rounded bg-background">
                <option value="History">History</option>
                <option value="Sports">Sports</option>
                <option value="Music">Music</option>
                <option value="Pop Culture">Pop Culture</option>
            </select>
            <SubmitButton />
        </form>
        {message && <p className="text-red-500 text-sm">{message}</p>}
    </div>
  );
}
