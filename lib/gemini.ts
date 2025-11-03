import { GoogleGenerativeAI } from "@google/generative-ai";

export const gemini = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

export const getGeminiModel = (modelName: string = "gemini-pro") => {
    if (!gemini) {
        throw new Error("Gemini API key is not configured");
    }

    // Remove models/ prefix if present (the SDK handles it)
    const cleanModelName = modelName.replace(/^models\//, "");

    return gemini.getGenerativeModel({ model: cleanModelName });
};
