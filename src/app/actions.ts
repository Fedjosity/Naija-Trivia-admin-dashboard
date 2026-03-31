'use server';

import { Question, type Pack } from '@antigravity/content-schema';
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

  try {
    // Save Pack
    await fs.writeFile(
        path.join(publishedDir, `${pack.id}.json`),
        JSON.stringify(pack, null, 2)
    );
    
    return { success: true, id: pack.id };
  } catch (error) {
    console.error("Publish Failed:", error);
    return { success: false, message: "Failed to write pack file" };
  }
}

export async function generateQuestions(
  category: string, 
  count: number = 5,
  difficulty: string = 'Intermediate',
  topic: string = ''
): Promise<Question[]> {
  console.log(`Generating ${count} questions for ${category} about topic: ${topic} (${difficulty})...`);
  
  try {
    const prompt = `
      You are a strict trivia expert. Generate EXACTLY ${count} questions about Nigeria.
      
      CRITICAL REQUIREMENT (100% STRICT):
      The questions MUST be strictly about the following topic: "${topic}".
      If the topic is highly specific, do not deviate. Every question, option, and explanation must relate directly to this topic.
      
      CONTEXT:
      - Category: "${category}"
      - Difficulty: "${difficulty}"
      
      RESPONSE STRUCTURE:
      Return a JSON array of objects with this EXACT structure:
      [
        {
          "text": "string",
          "options": ["string", "string", "string", "string"],
          "correctAnswerIndex": number (0-3),
          "explanation": "string",
          "hint": "string",
          "culturalContext": "string"
        }
      ]

      RULES FOR QUESTIONS:
      1. Concise and straight-to-the-point questions and answers.
      2. For 'Beginner' difficulty: EVERY question MUST include a helpful "hint".
      3. For 'Intermediate' difficulty: Provide a "hint" for ~50% of questions.
      4. For 'Legendary' difficulty: Do NOT provide any "hint" (empty string).
    `;
    
    const result = await model.generateContent([TRIVIA_SYSTEM_PROMPT, prompt]);
    const response = await result.response;
    const text = response.text();
    
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const questionsRaw = JSON.parse(cleanText);

    return (questionsRaw as unknown[]).map((rawQ) => {
        const q = rawQ as Record<string, unknown>;
        return {
            ...q as unknown as Question,
            id: crypto.randomUUID(),
            category: category as Question['category'],
            difficulty: difficulty as Question['difficulty'],
            hint: String(q.hint || q.culturalContext || q.explanation || '')
        };
    });

  } catch (error) {
    console.error("AI Generation Failed:", error);
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
  const draftsDir = path.resolve(process.cwd(), '../../content/drafts');
  try {
      await fs.mkdir(draftsDir, { recursive: true });
  } catch {}

  await fs.writeFile(
    path.join(draftsDir, `${question.id}.json`), 
    JSON.stringify(question, null, 2)
  );
  
  return { success: true };
}

export async function deployPackToFirebase(packData: Pack) {
  const { getFirebaseAdmin } = await import('@/lib/firebaseAdmin');
  const { db, storage } = getFirebaseAdmin();
  const bucket = storage.bucket();

  try {
    const packId = packData.id;
    if (!packId) throw new Error("Missing ID in pack data");

    const storagePath = `packs/${packId}.json`;
    const buffer = Buffer.from(JSON.stringify(packData), 'utf-8');
    const file = bucket.file(storagePath);
    
    await file.save(buffer, { contentType: 'application/json' });

    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: '03-01-2500',
    });

    await db.collection('packs').doc(packId).set({
      ...packData,
      downloadUrl: url,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      isActive: true
    });

    return { success: true, id: packId };
  } catch (error) {
    console.error("Deployment Failed:", error);
    const message = (error as Error)?.message || "Failed to register pack in Firestore";
    return { success: false, error: message };
  }
}

export async function uploadPackImage(formData: FormData) {
  const file = formData.get('image') as File;
  if (!file) throw new Error("No file provided");

  try {
    const { getFirebaseAdmin } = await import('@/lib/firebaseAdmin');
    const { storage } = getFirebaseAdmin();
    const bucket = storage.bucket();

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `packs/covers/${Date.now()}.${fileExt}`;
    const gcsFile = bucket.file(fileName);

    await gcsFile.save(buffer, {
      contentType: file.type,
      metadata: { cacheControl: 'public, max-age=31536000' }
    });

    const [url] = await gcsFile.getSignedUrl({
      action: 'read',
      expires: '03-01-2500',
    });

    return { success: true, url };
  } catch (error) {
    console.error("Image Upload Failed:", error);
    throw new Error("Failed to upload image to Firebase Storage.");
  }
}

/**
 * Bans a player by updating their status in Firestore.
 */
export async function handleBanPlayer(uid: string, currentStatus: string) {
  const { getFirebaseAdmin } = await import('@/lib/firebaseAdmin');
  const { db } = getFirebaseAdmin();
  
  try {
    const newStatus = currentStatus === 'Banned' ? 'Active' : 'Banned';
    await db.collection('users').doc(uid).update({
      status: newStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { success: true, status: newStatus };
  } catch (error) {
    console.error("Ban Player Failed:", error);
    return { success: false, error: "Failed to update user status" };
  }
}

/**
 * Permanently deletes a player's Auth account and Firestore document.
 */
export async function handleDeletePlayerAccount(uid: string) {
  const { getFirebaseAdmin } = await import('@/lib/firebaseAdmin');
  const { auth, db } = getFirebaseAdmin();
  
  try {
    // 1. Delete from Firebase Auth
    await auth.deleteUser(uid);
    
    // 2. Delete from Firestore
    await db.collection('users').doc(uid).delete();
    
    // Optional: Log this action in activities
    await db.collection('activities').add({
      type: 'admin_action',
      details: `Permanently deleted user account: ${uid}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      uid: 'system_admin'
    });
    
    return { success: true };
  } catch (error) {
    console.error("Delete Account Failed:", error);
    return { success: false, error: (error as Error).message };
  }
}
