import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Google Generative AI with the API key from environment variables
// Note: In a real production app, ensure GOOGLE_API_KEY is set in .env.local
// For this workshop/demo, we assume the environment is set up or we can provide a fallback/mock if needed
// but the requirement was "Server-side only" which this adheres to (files under src/lib used in server actions).

if (!process.env.GOOGLE_API_KEY) {
  throw new Error("GOOGLE_API_KEY is not set");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export const model = genAI.getGenerativeModel({ 
    model: "gemini-1.0-pro",
    generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7, // Creativity balance
    } 
});
