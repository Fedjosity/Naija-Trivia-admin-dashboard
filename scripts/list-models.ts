
import { listGeminiModels } from "../src/lib/gemini";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

async function run() {
  console.log("Fetching available Gemini models...");
  
  try {
    const models = await listGeminiModels();
    
    if (models.length === 0) {
      console.log("No models found.");
      return;
    }

    console.log(`\nFound ${models.length} models:\n`);
    
    models.forEach((model) => {
      console.log(`Model: ${model.name}`);
      console.log(`Methods: ${model.supportedGenerationMethods.join(", ")}`);
      console.log("-".repeat(30));
    });

  } catch (error) {
    console.error("Failed to list models:", error);
  }
}

run();
