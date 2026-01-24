import { GeneratorForm } from './generator-form';
import { Button } from '@/components/ui/button';
import fs from 'fs/promises';
import path from 'path';

// Read drafts from file system
async function getDrafts() {
    const draftsDir = path.resolve(process.cwd(), '../../content/drafts');
    try {
        const files = await fs.readdir(draftsDir);
        return files.filter(f => f.endsWith('.json'));
    } catch (e) {
        return [];
    }
}

export default async function DraftsPage() {
    const drafts = await getDrafts();

    return (
        <main className="p-10 max-w-6xl mx-auto">
            <h1 className="text-3xl font-serif font-bold mb-8">Drafts & Generation</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Generator Sidebar */}
                <div className="lg:col-span-1 border p-6 rounded-lg bg-card h-fit">
                    <h2 className="font-semibold mb-4">Generate Batch</h2>
                    <GeneratorForm />
                </div>

                {/* Drafts List */}
                <div className="lg:col-span-3">
                    <h2 className="font-semibold mb-4">Pending Review ({drafts.length})</h2>
                    <div className="space-y-4">
                        {drafts.length === 0 ? (
                            <p className="text-muted-foreground italic">No drafts found. Generate some!</p>
                        ) : (
                            drafts.map(draft => (
                                <div key={draft} className="flex items-center justify-between p-4 border rounded-lg bg-white dark:bg-zinc-900">
                                    <span className="font-mono text-sm">{draft}</span>
                                    <Button variant="outline" size="sm">Review</Button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
