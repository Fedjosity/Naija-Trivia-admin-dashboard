import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const publishedDir = path.resolve(process.cwd(), '../../content/published');
    
    // Ensure the folder exists
    try { await fs.access(publishedDir); } catch { 
        return NextResponse.json({ packs: [] }); 
    }

    const files = await fs.readdir(publishedDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    const packs = [];
    for (const file of jsonFiles) {
        const content = await fs.readFile(path.join(publishedDir, file), 'utf-8');
        const pack = JSON.parse(content);
        packs.push({
            id: pack.id,
            title: pack.title,
            version: pack.version,
            size: `${(content.length / 1024).toFixed(1)} KB`,
            url: `/api/packs/${pack.id}`
        });
    }

    return NextResponse.json({ packs });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch packs' }, { status: 500 });
  }
}
