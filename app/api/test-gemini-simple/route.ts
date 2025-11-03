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

        // Try multiple models to find which one works
        const modelNames = [
            "gemini-1.5-flash",
            "gemini-pro",
            "gemini-1.5-pro",
        ];

        const results: any[] = [];

        for (const modelName of modelNames) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent({
                    contents: [{ role: "user", parts: [{ text: "Say hello" }] }],
                });

                const response = result.response;
                const text = response.text();

                results.push({
                    model: modelName,
                    status: "✅ WORKING",
                    response: text,
                });
            } catch (error: any) {
                results.push({
                    model: modelName,
                    status: "❌ FAILED",
                    error: error?.message?.substring(0, 150) || "Unknown error",
                    statusCode: error?.status,
                });
            }
        }

        // Find which models work
        const workingModels = results.filter((r) => r.status === "✅ WORKING");

        return NextResponse.json({
            success: workingModels.length > 0,
            message:
                workingModels.length > 0
                    ? `Found ${workingModels.length} working model(s)!`
                    : "No working models found. Check your API key.",
            results,
            recommendation:
                workingModels.length > 0
                    ? `Use model: ${workingModels[0].model}`
                    : "Please create a new API key at https://aistudio.google.com/app/apikey",
        });
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
