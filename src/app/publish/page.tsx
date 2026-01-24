import { publishDailyPack } from '../actions';
import { Button } from '@/components/ui/button';
import { revalidatePath } from 'next/cache';

export default function PublishPage() {
    async function handlePublish() {
        'use server';
        await publishDailyPack();
        revalidatePath('/publish');
    }

    return (
        <main className="p-10 max-w-4xl mx-auto">
            <h1 className="text-3xl font-serif font-bold mb-8">Publishing Center</h1>
            
            <div className="bg-card border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Daily Pack</h2>
                <p className="text-muted-foreground mb-6">Aggregate all currently APPROVED questions into today's pack.</p>
                
                <form action={handlePublish}>
                    <Button type="submit">Publish Pack Now</Button>
                </form>
            </div>
        </main>
    );
}
