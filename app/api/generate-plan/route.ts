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
        const prompt = generatePlanPrompt(userData);

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

        let result;
        let lastError: any = null;
        let successfulModel: string | null = null;
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
                                    text: `You are an expert fitness coach and nutritionist. 

CRITICAL: You MUST return ONLY valid JSON. No markdown, no code blocks, no explanations, no text before or after the JSON.

Return a JSON object with this EXACT structure:
{
  "workoutPlan": [...],
  "dietPlan": {...},
  "tips": {...}
}

Start your response with { and end with }. Return ONLY the JSON object, nothing else.

${prompt}`,
                                },
                            ],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 8192, // Increased for longer responses
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
            // All models failed - provide helpful error message
            console.error("All models failed. Last error:", lastError);

            // Check if it's a 404/not found error
            if (
                lastError?.status === 404 ||
                lastError?.message?.includes("404") ||
                lastError?.message?.includes("not found")
            ) {
                return NextResponse.json(
                    {
                        error: `❌ None of the Gemini models are available with your API key.

**Models we tried:**
${triedModels.map((m) => `- ${m}`).join("\n")}

**Please try:**
1. Visit http://localhost:3000/api/list-models to see which models your key supports
2. Get a fresh API key from https://aistudio.google.com/app/apikey
3. Make sure you're using "Generative AI Studio" API key (not Vertex AI)
4. Restart your dev server after updating the key

**Error:** ${lastError?.message || "Unknown error"}`,
                    },
                    { status: 404 }
                );
            }

            // Other errors
            return NextResponse.json(
                {
                    error: `Unable to connect to Gemini API: ${lastError?.message || "Unknown error"}. 

Please verify your API key at https://aistudio.google.com/app/apikey`,
                },
                { status: 500 }
            );
        }

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

        // Fix single quotes to double quotes (if any) - but be careful with quotes inside strings
        // Only replace single quotes that are outside of double-quoted strings
        content = content.replace(/'/g, '"');

        console.log("Cleaned content preview:", content.substring(0, 300));
        console.log("Cleaned content length:", content.length);
        console.log("Last 200 chars:", content.substring(Math.max(0, content.length - 200)));

        let plan;
        try {
            plan = JSON.parse(content);
        } catch (parseError: any) {
            console.error("JSON Parse Error:", parseError.message);
            console.error("Error position:", parseError.message.match(/position (\d+)/)?.[1]);
            console.error("Failed content (first 1000 chars):", content.substring(0, 1000));
            console.error("Failed content (last 500 chars):", content.substring(Math.max(0, content.length - 500)));

            // Try to fix common JSON issues and retry
            try {
                let fixedContent = content;

                // Check if JSON is incomplete (missing closing brackets)
                const openBraces = (fixedContent.match(/{/g) || []).length;
                const closeBraces = (fixedContent.match(/}/g) || []).length;
                const openBrackets = (fixedContent.match(/\[/g) || []).length;
                const closeBrackets = (fixedContent.match(/\]/g) || []).length;

                // If incomplete, try to close it
                if (openBraces > closeBraces || openBrackets > closeBrackets) {
                    console.log("JSON appears incomplete, attempting to close it");
                    // Remove incomplete property if it exists at the end
                    const lastComma = fixedContent.lastIndexOf(',');
                    const lastQuote = fixedContent.lastIndexOf('"');
                    if (lastQuote > lastComma) {
                        // There's an incomplete property, try to close it
                        const incompleteProp = fixedContent.substring(Math.max(0, fixedContent.lastIndexOf('"', fixedContent.lastIndexOf(':') - 1)));
                        if (incompleteProp && !incompleteProp.endsWith('"')) {
                            // Close the incomplete property and remove it
                            const beforeProp = fixedContent.substring(0, fixedContent.lastIndexOf('"', fixedContent.lastIndexOf(':') - 1));
                            fixedContent = beforeProp;
                            // Remove trailing comma
                            fixedContent = fixedContent.replace(/,\s*$/, '');
                        }
                    }
                    
                    // Close missing brackets/braces
                    for (let i = openBraces - closeBraces; i > 0; i--) {
                        fixedContent += '}';
                    }
                    for (let i = openBrackets - closeBrackets; i > 0; i--) {
                        fixedContent += ']';
                    }
                }

                // Fix unescaped quotes in strings - more careful approach
                // This regex finds strings that might have unescaped quotes
                fixedContent = fixedContent.replace(/"([^"]*)"([^",}\]:]*)"([^",}\]:]*):/g, (match, p1, p2, p3) => {
                    // If p2 contains quotes, escape them
                    if (p2.includes('"')) {
                        return `"${p1}"${p2.replace(/"/g, '\\"')}${p3}:`;
                    }
                    return match;
                });

                // Try removing trailing incomplete property
                // Find the last incomplete string value (starts with " but doesn't end properly)
                const incompleteStringMatch = fixedContent.match(/"([^"]*)$/);
                if (incompleteStringMatch) {
                    // There's an incomplete string at the end
                    const incompleteStart = fixedContent.lastIndexOf('"', fixedContent.length - incompleteStringMatch[0].length - 1);
                    if (incompleteStart !== -1) {
                        // Find what property this belongs to by looking backwards for the key
                        const beforeIncomplete = fixedContent.substring(0, incompleteStart);
                        const lastColon = beforeIncomplete.lastIndexOf(':');
                        const lastComma = beforeIncomplete.lastIndexOf(',');
                        const lastBrace = beforeIncomplete.lastIndexOf('}');
                        const lastBracket = beforeIncomplete.lastIndexOf(']');
                        
                        const lastSeparator = Math.max(lastComma, lastBrace, lastBracket);
                        
                        if (lastColon > lastSeparator) {
                            // This is indeed a value, truncate it and close properly
                            fixedContent = beforeIncomplete + '"';
                            // Remove any trailing comma
                            fixedContent = fixedContent.replace(/,\s*$/, '');
                        }
                    }
                }
                
                // Another approach: if we see "descript" or similar incomplete words at the end, close and remove them
                // Look for incomplete string values that are cut off
                if (fixedContent.match(/"[^"]*$/) && !fixedContent.endsWith('"')) {
                    // Find where the last incomplete string starts
                    const lines = fixedContent.split('\n');
                    const lastLine = lines[lines.length - 1];
                    
                    // If last line has "descript" or similar, it's likely incomplete
                    if (lastLine.includes('"descrip') || lastLine.includes('"desc') || lastLine.match(/"[^"]{0,10}$/)) {
                        // Find the last complete property before the incomplete one
                        const lastCompleteProp = fixedContent.lastIndexOf('",');
                        const lastCompleteValue = fixedContent.lastIndexOf(': "');
                        
                        if (lastCompleteValue > lastCompleteProp) {
                            // There's an incomplete value, truncate before it
                            const truncatePos = fixedContent.lastIndexOf(',', fixedContent.lastIndexOf('"', fixedContent.length - 100));
                            if (truncatePos !== -1) {
                                fixedContent = fixedContent.substring(0, truncatePos);
                                // Make sure we close any open structures
                                fixedContent = fixedContent.trim();
                                if (!fixedContent.endsWith('}') && !fixedContent.endsWith(']')) {
                                    // Find what needs to be closed
                                    const needsClosing = fixedContent.match(/\{[\s\S]*$/);
                                    if (needsClosing && !needsClosing[0].match(/\}$/)) {
                                        fixedContent += '}';
                                    }
                                }
                            }
                        }
                    }
                }
                
                // Simple fix: if response ends with incomplete "descript", just remove that incomplete property
                if (fixedContent.includes('"descript') && !fixedContent.includes('"description"')) {
                    // Find and remove the incomplete description property
                    const descriptIndex = fixedContent.lastIndexOf('"descript');
                    if (descriptIndex !== -1) {
                        // Go back to find the start of this property (the key)
                        const beforeDescript = fixedContent.substring(0, descriptIndex);
                        const lastColon = beforeDescript.lastIndexOf(':');
                        const lastComma = beforeDescript.lastIndexOf(',');
                        const lastBrace = beforeDescript.lastIndexOf('}');
                        const lastBracket = beforeDescript.lastIndexOf(']');
                        const lastSeparator = Math.max(lastComma, lastBrace, lastBracket);
                        
                        if (lastColon > lastSeparator) {
                            // Find the key name
                            const keyStart = beforeDescript.lastIndexOf('"', lastColon - 1);
                            if (keyStart !== -1) {
                                // Remove the entire incomplete property (key + incomplete value)
                                fixedContent = beforeDescript.substring(0, keyStart);
                                // Remove trailing comma if exists
                                fixedContent = fixedContent.replace(/,\s*$/, '');
                            }
                        }
                    }
                }

                // Remove comments if any
                fixedContent = fixedContent.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*/g, "");

                // Final cleanup - remove trailing commas
                fixedContent = fixedContent.replace(/,(\s*[}\]])/g, "$1");

                plan = JSON.parse(fixedContent);
                console.log("✅ Successfully parsed after fixing common issues");
            } catch (secondParseError: any) {
                // Last resort: try to fix array truncation specifically
                try {
                    let finalFixed = content;
                    
                    // Check if error is about array element
                    const isArrayError = parseError.message.includes("array element") || parseError.message.includes("Expected ','") || parseError.message.includes("Expected ']'");
                    
                    if (isArrayError) {
                        const errorPos = parseInt(parseError.message.match(/position (\d+)/)?.[1] || "0");
                        console.log("Array truncation detected at position:", errorPos);
                        
                        // Find the last complete array element before the error position
                        const beforeError = finalFixed.substring(0, errorPos);
                        
                        // Try to find the last complete object in an array
                        let lastCompleteIndex = beforeError.lastIndexOf('}');
                        
                        // Check if we're inside an array
                        const arrayStart = beforeError.lastIndexOf('[');
                        const arrayEnd = beforeError.lastIndexOf(']');
                        
                        if (arrayStart > arrayEnd && lastCompleteIndex > arrayStart) {
                            // We're inside an incomplete array
                            // Find the last complete element (ends with },)
                            // Look for patterns like: },  or },}
                            let lastCommaAfterBrace = beforeError.lastIndexOf('},');
                            
                            // Also check for }, followed by whitespace and possibly newline
                            if (lastCommaAfterBrace === -1) {
                                const regexMatch = beforeError.match(/},\s*(?:\n\s*)?/);
                                if (regexMatch && regexMatch.index !== undefined) {
                                    lastCommaAfterBrace = regexMatch.index;
                                }
                            }
                            
                            // If still not found, try just finding the last complete object
                            if (lastCommaAfterBrace === -1) {
                                // Look backwards from error position to find }, or }
                                for (let i = errorPos - 1; i >= arrayStart; i--) {
                                    if (beforeError.substring(i).startsWith('},')) {
                                        lastCommaAfterBrace = i;
                                        break;
                                    }
                                    if (beforeError.substring(i).startsWith('}') && i < errorPos - 10) {
                                        // Found a closing brace, check if it's complete
                                        const afterBrace = beforeError.substring(i + 1, errorPos).trim();
                                        if (afterBrace === '' || afterBrace.startsWith(',')) {
                                            lastCommaAfterBrace = i + 1;
                                            break;
                                        }
                                    }
                                }
                            }
                            
                            if (lastCommaAfterBrace !== -1 || (lastCompleteIndex !== -1 && lastCompleteIndex > arrayStart)) {
                                // Truncate at the last complete element
                                const truncatePos = lastCommaAfterBrace !== -1 ? lastCommaAfterBrace + 1 : lastCompleteIndex + 1;
                                finalFixed = beforeError.substring(0, truncatePos);
                                
                                // Close the array
                                finalFixed += ']';
                                
                                // Now close any open structures
                                const remainingBraces = (finalFixed.match(/{/g) || []).length - (finalFixed.match(/}/g) || []).length;
                                const remainingBrackets = (finalFixed.match(/\[/g) || []).length - (finalFixed.match(/\]/g) || []).length;
                                
                                for (let i = 0; i < remainingBrackets; i++) {
                                    finalFixed += ']';
                                }
                                for (let i = 0; i < remainingBraces; i++) {
                                    finalFixed += '}';
                                }
                                
                                // Remove any trailing commas
                                finalFixed = finalFixed.replace(/,(\s*[}\]])/g, "$1");
                                
                                console.log("Attempting final parse with array truncation fix");
                                plan = JSON.parse(finalFixed);
                                console.log("✅ Successfully parsed after fixing array truncation");
                            }
                        }
                    }
                    
                    // If still not parsed, try one more aggressive fix
                    if (!plan) {
                        console.log("Trying aggressive array truncation fix...");
                        
                        // Strategy 1: Find last complete exercise object pattern
                        // A complete exercise should have: name, sets, reps, restTime, description (all closed)
                        const completeExercisePattern = /"name"\s*:\s*"[^"]*",\s*"sets"\s*:\s*\d+,\s*"reps"\s*:\s*"[^"]*",\s*"restTime"\s*:\s*"[^"]*",\s*"description"\s*:\s*"[^"]*"\s*}/g;
                        let lastMatch;
                        let match;
                        while ((match = completeExercisePattern.exec(finalFixed)) !== null) {
                            lastMatch = match;
                        }
                        
                        if (lastMatch && lastMatch.index !== undefined) {
                            // Found a complete exercise, truncate after it
                            const truncatePos = lastMatch.index + lastMatch[0].length;
                            const beforeTruncate = finalFixed.substring(0, truncatePos);
                            
                            // Check if there's a comma after this exercise
                            const afterMatch = finalFixed.substring(truncatePos).trim();
                            if (afterMatch.startsWith(',')) {
                                // Remove the comma and everything after
                                finalFixed = beforeTruncate;
                            } else {
                                finalFixed = beforeTruncate;
                            }
                            
                            // Close arrays and objects
                            const openBraces = (finalFixed.match(/{/g) || []).length - (finalFixed.match(/}/g) || []).length;
                            const openBrackets = (finalFixed.match(/\[/g) || []).length - (finalFixed.match(/\]/g) || []).length;
                            
                            // Close arrays first
                            for (let i = 0; i < openBrackets; i++) {
                                finalFixed += ']';
                            }
                            // Then close objects
                            for (let i = 0; i < openBraces; i++) {
                                finalFixed += '}';
                            }
                            
                            finalFixed = finalFixed.replace(/,(\s*[}\]])/g, "$1");
                            
                            try {
                                plan = JSON.parse(finalFixed);
                                console.log("✅ Successfully parsed after finding last complete exercise");
                            } catch (e) {
                                // Continue to next strategy
                            }
                        }
                        
                        // Strategy 2: Simple truncation at last complete object
                        if (!plan) {
                            // Find the last complete exercise object (ends with } followed by , or ])
                            const lastCompletePattern = /}\s*[,|\]]/;
                            const matches = [...finalFixed.matchAll(/}(?=\s*[,|\]])/g)];
                            
                            if (matches.length > 0) {
                                const lastComplete = matches[matches.length - 1];
                                const truncatePos = lastComplete.index! + 1;
                                let truncated = finalFixed.substring(0, truncatePos);
                                
                                // Remove trailing comma if exists
                                truncated = truncated.replace(/,\s*$/, '');
                                
                                // Close structures
                                const openBraces = (truncated.match(/{/g) || []).length - (truncated.match(/}/g) || []).length;
                                const openBrackets = (truncated.match(/\[/g) || []).length - (truncated.match(/\]/g) || []).length;
                                
                                for (let i = 0; i < openBrackets; i++) {
                                    truncated += ']';
                                }
                                for (let i = 0; i < openBraces; i++) {
                                    truncated += '}';
                                }
                                
                                truncated = truncated.replace(/,(\s*[}\]])/g, "$1");
                                
                                try {
                                    plan = JSON.parse(truncated);
                                    console.log("✅ Successfully parsed after simple truncation");
                                } catch (e) {
                                    // Continue
                                }
                            }
                        }
                        
                        // Strategy 3: Remove incomplete last element from arrays
                        if (!plan) {
                            // Find and remove incomplete last element from arrays
                            const incompleteElementMatch = finalFixed.match(/(\[[\s\S]*),\s*\{[\s\S]*$/);
                            if (incompleteElementMatch) {
                                // Remove the incomplete element
                                const beforeIncomplete = finalFixed.substring(0, finalFixed.lastIndexOf(', {'));
                                finalFixed = beforeIncomplete;
                                
                                // Close all structures
                                const openBraces = (finalFixed.match(/{/g) || []).length;
                                const closeBraces = (finalFixed.match(/}/g) || []).length;
                                const openBrackets = (finalFixed.match(/\[/g) || []).length;
                                const closeBrackets = (finalFixed.match(/\]/g) || []).length;
                                
                                for (let i = 0; i < openBrackets - closeBrackets; i++) {
                                    finalFixed += ']';
                                }
                                for (let i = 0; i < openBraces - closeBraces; i++) {
                                    finalFixed += '}';
                                }
                                
                                finalFixed = finalFixed.replace(/,(\s*[}\]])/g, "$1");
                                try {
                                    plan = JSON.parse(finalFixed);
                                    console.log("✅ Successfully parsed after removing incomplete element");
                                } catch (e) {
                                    // Will throw error below
                                }
                            }
                        }
                    }
                    
                    if (plan) {
                        // Success!
                    } else {
                        throw secondParseError;
                    }
                } catch (finalError) {
                    // Last resort: try to extract valid parts and provide helpful error
                    const errorPos = parseInt(parseError.message.match(/position (\d+)/)?.[1] || "0");
                    console.error("All parse attempts failed. Final error:", finalError);
                    console.error("Error at position:", errorPos);
                    console.error("Context around error:", content.substring(Math.max(0, errorPos - 50), Math.min(content.length, errorPos + 50)));
                    
                    throw new Error(
                        `The AI response was not in valid JSON format.\n\n` +
                        `Parse error: ${parseError.message}\n\n` +
                        `The response might be truncated or contain invalid characters.\n` +
                        `Response preview (first 500 chars):\n${content.substring(0, 500)}\n\n` +
                        `Please try generating the plan again. If the issue persists, the AI response may be too long - try simplifying your requirements.`
                    );
                }
            }
        }

        return NextResponse.json({
            ...plan,
            generatedAt: new Date().toISOString(),
            userData,
            modelUsed: successfulModel, // Include which model worked
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
