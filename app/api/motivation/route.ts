import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateMotivationPrompt } from "@/lib/prompts";

// Helper to get available models
async function getAvailableModels(apiKey: string): Promise<string[]> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data.models
        ?.filter((model: any) =>
          model.supportedGenerationMethods?.includes("generateContent")
        )
        .map((model: any) => model.name?.replace("models/", ""))
        .filter((name: string) => name) || [];
    }
  } catch (error) {
    // Ignore errors
  }
  return [];
}

export async function GET() {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { quote: "Your journey to fitness starts today! 💪" },
        { status: 200 }
      );
    }

    const prompt = generateMotivationPrompt();
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Get available models or use fallback
    let modelNames = await getAvailableModels(process.env.GEMINI_API_KEY);

    if (modelNames.length === 0) {
      modelNames = ["gemini-1.5-flash", "gemini-pro"];
    } else {
      // Prioritize flash models
      modelNames.sort((a, b) => {
        if (a.includes("flash") && !b.includes("flash")) return -1;
        if (!a.includes("flash") && b.includes("flash")) return 1;
        return 0;
      });
    }

    let result;

    for (const modelName of modelNames) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        result = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `You are a motivational fitness coach. Provide inspiring quotes.\n\n${prompt}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 100,
          },
        });
        // Success! Break out of the loop
        break;
      } catch (modelError: any) {
        // Continue to next model
        continue;
      }
    }

    if (!result) {
      // If all models fail, return fallback quote
      return NextResponse.json(
        { quote: "Your journey to fitness starts today! 💪" },
        { status: 200 }
      );
    }

    const quote = result.response.text().trim();
    if (!quote) {
      throw new Error("No quote generated");
    }

    return NextResponse.json({ quote });
  } catch (error) {
    console.error("Error generating motivation quote:", error);
    return NextResponse.json(
      { quote: "Your journey to fitness starts today! 💪" },
      { status: 200 }
    );
  }
}
