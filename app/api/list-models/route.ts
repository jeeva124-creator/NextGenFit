import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function GET() {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { error: "GEMINI_API_KEY is not configured" },
                { status: 500 }
            );
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        // Use the REST API directly to list available models
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                return NextResponse.json(
                    {
                        success: false,
                        error: `Failed to list models: ${response.status} ${response.statusText}`,
                        details: errorText.substring(0, 500),
                        suggestion:
                            "This might mean your API key doesn't have permission to list models, or the API endpoint has changed.",
                    },
                    { status: response.status }
                );
            }

            const data = await response.json();

            // Filter models that support generateContent
            const availableModels = data.models
                ?.filter((model: any) =>
                    model.supportedGenerationMethods?.includes("generateContent")
                )
                .map((model: any) => ({
                    name: model.name?.replace("models/", ""),
                    displayName: model.displayName,
                    description: model.description,
                    supportedMethods: model.supportedGenerationMethods,
                })) || [];

            return NextResponse.json({
                success: true,
                totalModels: data.models?.length || 0,
                availableModels: availableModels,
                allModels: data.models?.map((m: any) => m.name?.replace("models/", "")) || [],
                message:
                    availableModels.length > 0
                        ? `✅ Found ${availableModels.length} available model(s)!`
                        : "❌ No models found that support generateContent",
                recommendation:
                    availableModels.length > 0
                        ? `Try using: ${availableModels[0].name}`
                        : "Please check your API key permissions at https://aistudio.google.com/app/apikey",
            });
        } catch (error: any) {
            return NextResponse.json(
                {
                    success: false,
                    error: error?.message || "Failed to fetch models",
                    suggestion:
                        "Try creating a new API key at https://aistudio.google.com/app/apikey",
                },
                { status: 500 }
            );
        }
    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                error: error?.message || "Unknown error",
            },
            { status: 500 }
        );
    }
}

