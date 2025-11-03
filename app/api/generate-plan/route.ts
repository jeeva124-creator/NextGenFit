import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { generatePlanPrompt } from "@/lib/prompts";
import { UserData } from "@/types";

// Helper function to get available models
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
            const models = data.models
                ?.filter((model: any) =>
                    model.supportedGenerationMethods?.includes("generateContent")
                )
                .map((model: any) => model.name?.replace("models/", ""))
                .filter((name: string) => name) || [];

            return models;
        }
    } catch (error) {
        console.log("Could not fetch available models list");
    }
    return [];
}

// Advanced JSON recovery function
async function attemptAdvancedRecovery(content: string, parseError: any): Promise<any | null> {
    try {
        let fixedContent = content;
        
        // Check if error is about array element
        const isArrayError = parseError.message.includes("array element") || 
                            parseError.message.includes("Expected ','") || 
                            parseError.message.includes("Expected ']'");
        
        if (isArrayError) {
            const errorPos = parseInt(parseError.message.match(/position (\d+)/)?.[1] || "0");
            console.log("Array truncation detected at position:", errorPos);
            
            // Find last complete exercise object pattern
            const completeExercisePattern = /"description"\s*:\s*"[^"]*"\s*}/g;
            let lastMatch;
            let match;
            while ((match = completeExercisePattern.exec(fixedContent)) !== null) {
                lastMatch = match;
            }
            
            if (lastMatch && lastMatch.index !== undefined) {
                // Found a complete exercise, truncate after it
                const truncatePos = lastMatch.index + lastMatch[0].length;
                fixedContent = fixedContent.substring(0, truncatePos);
                
                // Close arrays and objects
                const openBraces = (fixedContent.match(/{/g) || []).length - (fixedContent.match(/}/g) || []).length;
                const openBrackets = (fixedContent.match(/\[/g) || []).length - (fixedContent.match(/\]/g) || []).length;
                
                for (let i = 0; i < openBrackets; i++) {
                    fixedContent += ']';
                }
                for (let i = 0; i < openBraces; i++) {
                    fixedContent += '}';
                }
                
                fixedContent = fixedContent.replace(/,(\s*[}\]])/g, "$1");
                
                const parsed = JSON.parse(fixedContent);
                console.log("✅ Advanced recovery successful");
                return parsed;
            }
        }
        
        // Fallback: try to close incomplete JSON
        const openBraces = (fixedContent.match(/{/g) || []).length;
        const closeBraces = (fixedContent.match(/}/g) || []).length;
        const openBrackets = (fixedContent.match(/\[/g) || []).length;
        const closeBrackets = (fixedContent.match(/\]/g) || []).length;

        if (openBraces > closeBraces || openBrackets > closeBrackets) {
            // Remove incomplete last property
            const lastCompleteComma = fixedContent.lastIndexOf('},');
            if (lastCompleteComma !== -1) {
                fixedContent = fixedContent.substring(0, lastCompleteComma + 1);
            }
            
            for (let i = 0; i < openBrackets - closeBrackets; i++) {
                fixedContent += ']';
            }
            for (let i = 0; i < openBraces - closeBraces; i++) {
                fixedContent += '}';
            }
            
            fixedContent = fixedContent.replace(/,(\s*[}\]])/g, "$1");
            
            const parsed = JSON.parse(fixedContent);
            console.log("✅ Fallback recovery successful");
            return parsed;
        }
    } catch (recoveryError) {
        console.error("Advanced recovery failed:", recoveryError);
    }
    
    return null;
}

export async function POST(request: NextRequest) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                {
                    error:
                        "Gemini API key is not configured. Please add GEMINI_API_KEY to your .env.local file.",
                },
                { status: 500 }
            );
        }

        const userData: UserData = await request.json();
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        // First, try to get available models from the API
        let modelNames = await getAvailableModels(process.env.GEMINI_API_KEY);

        // If we couldn't get the list, use a comprehensive fallback list
        if (modelNames.length === 0) {
            console.log("Using fallback model list");
            modelNames = [
                "gemini-1.5-flash",
                "gemini-1.5-flash-latest",
                "gemini-pro",
                "gemini-1.0-pro",
                "gemini-1.5-pro",
                "gemini-1.5-pro-latest",
                "gemini-2.0-flash",
                "gemini-2.5-flash",
            ];
        } else {
            console.log("Found available models:", modelNames);
            // Prioritize flash models (faster and free tier friendly)
            modelNames.sort((a, b) => {
                if (a.includes("flash") && !b.includes("flash")) return -1;
                if (!a.includes("flash") && b.includes("flash")) return 1;
                return 0;
            });
        }

        // Retry loop for generating valid JSON (max 2 attempts)
        let plan: any = null;
        let successfulModel: string | null = null;
        let lastError: any = null;
        const maxRetries = 2;

        for (let retryCount = 0; retryCount < maxRetries && !plan; retryCount++) {
            if (retryCount > 0) {
                console.log(`🔄 Retry attempt ${retryCount + 1}/${maxRetries} - regenerating plan...`);
            }

            const prompt = generatePlanPrompt(userData);
            let result;
            const triedModels: string[] = [];

            for (const modelName of modelNames) {
                try {
                    console.log(`Trying model: ${modelName}`);
                    triedModels.push(modelName);
                    const model = genAI.getGenerativeModel({ model: modelName });

                    result = await model.generateContent({
                        contents: [
                            {
                                role: "user",
                                parts: [
                                    {
                                        text: `${prompt}

CRITICAL INSTRUCTIONS:
1. Return ONLY valid JSON - no markdown code blocks, no explanations
2. Start with { and end with }
3. Keep response SHORT to prevent truncation
4. Validate JSON syntax before responding
5. Escape all quotes in text values properly`,
                                    },
                                ],
                            },
                        ],
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 4096, // Reduced to prevent overly long responses
                            topP: 0.8,
                            topK: 40,
                        },
                    });

                    successfulModel = modelName;
                    console.log(`✅ Successfully used model: ${modelName}`);
                    break; // Success! Exit the loop
                } catch (modelError: any) {
                    console.log(`❌ Model ${modelName} failed:`, modelError?.message?.substring(0, 100));
                    lastError = modelError;
                    // Continue to next model
                    continue;
                }
            }

            if (!result) {
                // If no model worked, break out and throw error below
                break;
            }

            // Try to parse the JSON response
            const response = result.response;
            let content = response.text();

            // More aggressive JSON extraction and cleaning
            console.log("Raw response length:", content.length);
            console.log("Raw response preview:", content.substring(0, 200));

            // Remove markdown code blocks (various formats)
            content = content
                .replace(/```json\s*/gi, "")
                .replace(/```\s*/g, "")
                .trim();

            // Remove any leading/trailing text before first { and after last }
            const firstBrace = content.indexOf("{");
            const lastBrace = content.lastIndexOf("}");

            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                content = content.substring(firstBrace, lastBrace + 1);
            }

            // Try to find JSON object even if wrapped in text
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                content = jsonMatch[0];
            }

            // Clean up common JSON issues
            // Remove trailing commas before } or ]
            content = content.replace(/,(\s*[}\]])/g, "$1");

            // Fix single quotes to double quotes (if any)
            content = content.replace(/'/g, '"');

            console.log("Cleaned content preview:", content.substring(0, 300));
            console.log("Cleaned content length:", content.length);

            try {
                plan = JSON.parse(content);
                console.log(`✅ Successfully parsed JSON on attempt ${retryCount + 1}`);
            } catch (parseError: any) {
                console.error(`❌ JSON Parse Error on attempt ${retryCount + 1}:`, parseError.message);
                lastError = parseError;
                
                // Try advanced recovery only on the last attempt
                if (retryCount === maxRetries - 1) {
                    console.log("Attempting advanced JSON recovery...");
                    plan = await attemptAdvancedRecovery(content, parseError);
                }
            }
        }

        // After all retries, check if we have a valid plan
        if (!plan) {
            console.error("Failed to generate valid JSON after all retries. Last error:", lastError);

            // Check if it's a model availability error
            if (
                lastError?.status === 404 ||
                lastError?.message?.includes("404") ||
                lastError?.message?.includes("not found")
            ) {
                return NextResponse.json(
                    {
                        error: `❌ None of the Gemini models are available with your API key. Please verify your API key and try again.`,
                    },
                    { status: 404 }
                );
            }

            // JSON parsing error
            if (lastError?.message?.includes("JSON")) {
                return NextResponse.json(
                    {
                        error: `The AI response could not be parsed as valid JSON after ${maxRetries} attempts.\n\nPlease try again. If the issue persists, try simplifying your requirements (e.g., provide less detailed medical history or preferences).`,
                    },
                    { status: 500 }
                );
            }

            // Other errors
            return NextResponse.json(
                {
                    error: `Unable to generate plan: ${lastError?.message || "Unknown error"}. Please try again.`,
                },
                { status: 500 }
            );
        }

        // Success! Return the plan
        return NextResponse.json({
            ...plan,
            generatedAt: new Date().toISOString(),
            userData,
            modelUsed: successfulModel,
        });
    } catch (error: any) {
        console.error("Error generating plan:", error);

        // Better error handling
        if (error?.status === 429) {
            return NextResponse.json(
                {
                    error:
                        "You've exceeded your Gemini API quota. Please check your usage at https://aistudio.google.com/app/apikey.",
                },
                { status: 429 }
            );
        }

        if (error?.status === 401 || error?.status === 403) {
            return NextResponse.json(
                {
                    error: "Invalid Gemini API key. Please check your .env.local file and make sure you restarted the server.",
                },
                { status: 401 }
            );
        }

        const errorMessage = error instanceof Error ? error.message : "Failed to generate plan. Please try again.";
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
