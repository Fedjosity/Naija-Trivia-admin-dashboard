import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const publishedDir = path.resolve(process.cwd(), '../../content/published');
    const filePath = path.join(publishedDir, `${params.id}.json`);

    try { 
        await fs.access(filePath); 
    } catch { 
        return NextResponse.json({ error: 'Pack not found' }, { status: 404 }); 
    }

    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch pack' }, { status: 500 });
  }
}
