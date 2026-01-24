import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-background">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-serif font-bold tracking-tight text-primary">
          Daily Naija Trivia Admin
        </h1>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          <div className="p-4 bg-card rounded-lg border shadow-sm">
             <p className="text-sm text-muted-foreground">Status: Active</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl mt-10">
        
        <Link href="/drafts" className="p-6 border rounded-xl bg-card hover:bg-accent/50 transition-colors cursor-pointer group">
           <h3 className="text-lg font-semibold mb-2 group-hover:text-primary">Generate & Drafts</h3>
           <p className="text-muted-foreground text-sm">Create new questions with AI and review pending drafts.</p>
        </Link>

        <Link href="/publish" className="p-6 border rounded-xl bg-card hover:bg-accent/50 transition-colors cursor-pointer group">
           <h3 className="text-lg font-semibold mb-2 group-hover:text-primary">Publishing</h3>
           <p className="text-muted-foreground text-sm">Bundle approved questions into daily packs.</p>
        </Link>

        <div className="p-6 border rounded-xl bg-card hover:bg-accent/50 transition-colors cursor-pointer group opacity-50">
           <h3 className="text-lg font-semibold mb-2 group-hover:text-primary">Analytics</h3>
           <p className="text-muted-foreground text-sm">View user engagement stats (Coming Soon).</p>
        </div>
      </div>
    </main>
  );
}
