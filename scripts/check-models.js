const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function listModels() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("No GOOGLE_API_KEY found in .env.local");
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      // There isn't a direct "listModels" on the client instance in some versions, 
      // but let's try to just run a simple prompt on a few known candidates to see which one works.
      
      const candidates = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro", "gemini-1.0-pro"];
      
      console.log("Testing models...");
      
      for (const modelName of candidates) {
          try {
              console.log(`Trying ${modelName}...`);
              const m = genAI.getGenerativeModel({ model: modelName });
              await m.generateContent("Hello");
              console.log(`SUCCESS: ${modelName} is working.`);
              return; // Found one
          } catch (e) {
              console.log(`FAILED: ${modelName} - ${e.message.split('\n')[0]}`);
          }
      }
      
      console.log("No working models found via simple test.");

  } catch (e) {
    console.error("Error:", e);
  }
}

listModels();
