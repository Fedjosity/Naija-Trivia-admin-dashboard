'use server';

import { Question } from '@antigravity/content-schema';
import * as admin from 'firebase-admin';
import fs from 'fs/promises';
import path from 'path';
import { format } from 'date-fns';

// Mock AI Service - In production this would call OpenAI/Anthropic
import { model } from '@/lib/ai';
import { TRIVIA_SYSTEM_PROMPT } from './prompts';

export async function publishDailyPack() {
  const approvedDir = path.resolve(process.cwd(), '../../content/approved');
  const publishedDir = path.resolve(process.cwd(), '../../content/published');
  
  // Ensure dirs exist
  try { await fs.mkdir(publishedDir, { recursive: true }); } catch {}
  try { await fs.access(approvedDir); } catch { return { success: false, message: "No approved questions" }; }

  // Read approved questions
  const files = await fs.readdir(approvedDir);
  const jsonFiles = files.filter((f: string) => f.endsWith('.json'));
  
  if (jsonFiles.length === 0) return { success: false, message: "No questions to publish" };

    const questions: Question[] = [];
  for (const file of jsonFiles) {
      const data = await fs.readFile(path.join(approvedDir, file), 'utf-8');
      questions.push(JSON.parse(data));
  }

  // Create Pack
  const today = format(new Date(), 'yyyy-MM-dd');
  const pack = {
      id: `daily-${today}`,
      version: `${today}.1`,
      title: `Daily Trivia ${today}`,
      questions: questions,
      publishedAt: new Date().toISOString(),
      checksum: 'simulated-checksum' // In prod use crypto hash
  };

  // Save Pack
  await fs.writeFile(
      path.join(publishedDir, `${pack.id}.json`),
      JSON.stringify(pack, null, 2)
  );
  
  return { success: true, id: pack.id };
}

export async function generateQuestions(category: string, count: number = 5): Promise<Question[]> {
  console.log(`Generating ${count} questions for ${category}...`);
  
  try {
    const prompt = `Generate ${count} diverse and interesting trivia questions about ${category} in Nigeria.`;
    
    // Call Gemini
    const result = await model.generateContent([TRIVIA_SYSTEM_PROMPT, prompt]);
    const response = await result.response;
    const text = response.text();
    
    console.log("AI Response:", text); // Debugging

    // Clean up potential markdown code blocks if the prompt instruction fails
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const questionsRaw = JSON.parse(cleanText);

    // Map to ensure IDs and types are correct
    const questions: Question[] = (questionsRaw as Question[]).map((q) => ({
        ...q,
        id: crypto.randomUUID(),
        category: category as Question['category'],
    }));

    return questions;

  } catch (error) {
    console.error("AI Generation Failed:", error);
    // Fallback to stub or empty for now
    return [];
  }
}

export async function generateFullPack(category: string, difficulty: string = 'beginner'): Promise<Pack | null> {
    console.log(`Generating full pack for ${category} (${difficulty})...`);
    
    try {
        const prompt = `Generate a complete trivia pack about ${category} in Nigeria at a ${difficulty} difficulty.
        The response MUST be a single JSON object matching this structure:
        {
          "id": "string-slug",
          "title": "Clean Title",
          "version": "1.0",
          "questions": [
             {
               "id": "q1",
               "text": "The question...?",
               "options": ["A", "B", "C", "D"],
               "correctAnswerIndex": 0,
               "explanation": "...",
               "culturalContext": "...",
               "category": "${category}",
               "difficulty": "${difficulty}"
             }
          ],
          "publishedAt": "${new Date().toISOString()}",
          "checksum": "auto-filled"
        }
        Generate exactly 10 high-quality questions.`;
        
        const result = await model.generateContent([TRIVIA_SYSTEM_PROMPT, prompt]);
        const response = await result.response;
        const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        
        return JSON.parse(text);
    } catch (error) {
        console.error("Pack Generation Failed:", error);
        return null;
    }
}

export async function saveDraft(question: Question) {
  console.log('Saving draft:', question.id);
  
  // Note: We need to resolve the path relative to the monorepo root
  const draftsDir = path.resolve(process.cwd(), '../../content/drafts');
  
  // Ensure dir exists
  try {
      await fs.mkdir(draftsDir, { recursive: true });
  } catch {
      // Ignore if exists
  }

  await fs.writeFile(
    path.join(draftsDir, `${question.id}.json`), 
    JSON.stringify(question, null, 2)
  );
  
  return { success: true };
}

import { type Pack } from '@antigravity/content-schema';

/**
 * Deploys a pack object OR a daily pack to Firebase (Firestore & Storage)
 */
export async function deployPackToFirebase(packData: Pack) {
  const { getFirebaseAdmin } = await import('@/lib/firebaseAdmin');
  const { db, storage } = getFirebaseAdmin();
  const bucket = storage.bucket();

  try {
    const packId = packData.id;
    if (!packId) throw new Error("Missing ID in pack data");

    console.log(`🚀 Deploying Pack: ${packId}`);

    // 1. Upload to Storage
    const storagePath = `packs/${packId}.json`;
    const buffer = Buffer.from(JSON.stringify(packData), 'utf-8');
    const file = bucket.file(storagePath);
    
    await file.save(buffer, {
      contentType: 'application/json',
    });

    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: '03-01-2500',
    });

    // 2. Register in Firestore
    await db.collection('packs').doc(packId).set({
      ...packData,
      downloadUrl: url,
      updatedAt: (admin.firestore.FieldValue as unknown as { serverTimestamp: () => unknown }).serverTimestamp(),
      isActive: true
    });

    return { success: true, url };
  } catch (error: unknown) {
    console.error("Deploy Error:", error);
    const message = error instanceof Error ? error.message : 'Unknown deployment error';
    return { success: false, error: message };
  }
}
