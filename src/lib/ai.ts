import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_MODELS } from "./aiModels";

// Initialize the Google Generative AI with the API key from environment variables
// Note: In a real production app, ensure GOOGLE_API_KEY is set in .env.local
// For this workshop/demo, we assume the environment is set up or we can provide a fallback/mock if needed
// but the requirement was "Server-side only" which this adheres to (files under src/lib used in server actions).

if (!process.env.GOOGLE_API_KEY) {
  throw new Error("GOOGLE_API_KEY is not set");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const generationConfig = {
  responseMimeType: "application/json",
  temperature: 0.7, // Creativity balance
};

const primaryModel = genAI.getGenerativeModel({
  model: GEMINI_MODELS.PRIMARY,
  generationConfig,
});

const fallbackModel = genAI.getGenerativeModel({
  model: GEMINI_MODELS.FALLBACK,
  generationConfig,
});

// Export a wrapper that implements fallback logic
export const model = {
  generateContent: async (
    ...args: Parameters<typeof primaryModel.generateContent>
  ) => {
    try {
      // console.log(`Attempting to generate content with primary model: ${GEMINI_MODELS.PRIMARY}`);
      return await primaryModel.generateContent(...args);
    } catch (error: unknown) {
      console.warn(
        `Primary model (${GEMINI_MODELS.PRIMARY}) failed, switching to fallback model (${GEMINI_MODELS.FALLBACK}). Error: ${error instanceof Error ? error.message : String(error)}`,
      );

      try {
        return await fallbackModel.generateContent(...args);
      } catch (fallbackError) {
        console.error(
          `Fallback model (${GEMINI_MODELS.FALLBACK}) also failed.`,
          fallbackError,
        );
        throw fallbackError; // Re-throw if both fail
      }
    }
  },
};
