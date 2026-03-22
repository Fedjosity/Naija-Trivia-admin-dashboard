import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_MODELS } from "./aiModels";

// Initialize the Google Generative AI with the API key from environment variables
// Note: In a real production app, ensure GOOGLE_API_KEY is set in .env.local
// For this workshop/demo, we assume the environment is set up or we can provide a fallback/mock if needed
// but the requirement was "Server-side only" which this adheres to (files under src/lib used in server actions).

if (!process.env.GOOGLE_API_KEY) {
  throw new Error("GOOGLE_API_KEY is not set");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

const generationConfig = {
  responseMimeType: "application/json",
  temperature: 0.7,
};

// Create models
const primary = genAI.getGenerativeModel({ model: GEMINI_MODELS.PRIMARY, generationConfig });
const fallback1 = genAI.getGenerativeModel({ model: GEMINI_MODELS.FALLBACK_1, generationConfig });
const fallback2 = genAI.getGenerativeModel({ model: GEMINI_MODELS.FALLBACK_2, generationConfig });

/**
 * Checks if the error is related to quota or rate limits
 */
function isQuotaError(error: unknown): boolean {
  if (!error) return false;
  const errText = String(error).toLowerCase();
  const status = (error as Record<string, unknown>)?.status;
  
  return (
    status === 429 ||
    errText.includes("429") ||
    errText.includes("quota") ||
    errText.includes("rate limit") ||
    errText.includes("resourceexhausted") ||
    errText.includes("resourcelimit")
  );
}

export const model = {
  generateContent: async (args: Parameters<typeof primary.generateContent>[0]) => {
    // Stage 1: Primary
    try {
      console.log(`AI generation model: ${GEMINI_MODELS.PRIMARY}`);
      return await primary.generateContent(args);
    } catch (error) {
      if (!isQuotaError(error)) throw error;
      console.warn(`Primary model (${GEMINI_MODELS.PRIMARY}) quota exceeded. Attempting 1st fallback...`);
      
      // Stage 2: Fallback 1
      try {
        console.log(`AI generation model: ${GEMINI_MODELS.FALLBACK_1}`);
        return await fallback1.generateContent(args);
      } catch (f1Error) {
        if (!isQuotaError(f1Error)) throw f1Error;
        console.warn(`Fallback 1 (${GEMINI_MODELS.FALLBACK_1}) quota exceeded. Attempting 2nd fallback...`);
        
        // Stage 3: Fallback 2
        try {
          console.log(`AI generation model: ${GEMINI_MODELS.FALLBACK_2}`);
          return await fallback2.generateContent(args);
        } catch {
          console.error("All AI models in the pipeline have failed or exceeded quota.");
          // Specific message caught by the UI
          throw new Error("AI generation temporarily unavailable. Please try again later.");
        }
      }
    }
  },
};
