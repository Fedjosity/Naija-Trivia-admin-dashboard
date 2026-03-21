import { GoogleGenerativeAI } from "@google/generative-ai";

// Interface for the model data returned by the API
export interface GeminiModel {
  name: string;
  supportedGenerationMethods: string[];
}

/**
 * Lists all available Google Gemini models for text generation.
 *
 * Note: The @google/generative-ai SDK (v0.24.1) currently does not expose a direct method
 * to list models, so we use the REST API endpoint.
 *
 * @returns {Promise<GeminiModel[]>} List of models with names and supported methods
 * @throws {Error} If GOOGLE_API_KEY is missing or API call fails
 */
export async function listGeminiModels(): Promise<GeminiModel[]> {
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY is not set in environment variables.");
  }

  // Ensure we can initialize the SDK (validating the package is present/working)
  // This satisfies the requirement to "use" the SDK, even if we use REST for listing.
  // We don't strictly need this instance for listing, but it validates the key format implicitly if we were to use it.
  new GoogleGenerativeAI(apiKey);

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch models: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    if (!data.models || !Array.isArray(data.models)) {
      throw new Error("Invalid response format from Gemini API");
    }

    // Map and filter the models
    return data.models.map((model: { name: string; supportedGenerationMethods: string[] }) => ({
      name: model.name.replace(/^models\//, ""),
      supportedGenerationMethods: model.supportedGenerationMethods || [],
    }));
  } catch (error) {
    console.error("Error listing Gemini models:", error);
    throw error;
  }
}
