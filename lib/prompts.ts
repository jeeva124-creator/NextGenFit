import { UserData } from "@/types";

/**
 * Generates a compact, valid JSON fitness plan prompt for the AI.
 * Designed to prevent truncation and parsing errors.
 */
export function generatePlanPrompt(userData: UserData): string {
  return `You are an expert fitness coach. Create a COMPACT, valid JSON fitness plan.

User: ${userData.name}, ${userData.age}y, ${userData.gender}, ${userData.height}cm, ${userData.weight}kg
Goal: ${userData.fitnessGoal} | Level: ${userData.fitnessLevel} | Location: ${userData.workoutLocation}
Diet: ${userData.dietaryPreferences}${userData.medicalHistory ? ` | Medical: ${userData.medicalHistory}` : ""}

Return ONLY valid JSON (no markdown, no extra text). Use this EXACT structure:

{
  "workoutPlan": [
    {
      "day": "Day 1",
      "exercises": [
        { "name": "Exercise Name", "sets": 3, "reps": "10-12", "restTime": "60s", "description": "Brief tip" }
      ],
      "duration": "30 min"
    }
  ],
  "dietPlan": {
    "breakfast": { "name": "Meal", "calories": 400 },
    "lunch": { "name": "Meal", "calories": 500 },
    "dinner": { "name": "Meal", "calories": 450 },
    "snacks": [{ "name": "Snack", "calories": 150 }]
  },
  "tips": {
    "tips": ["Tip 1", "Tip 2"],
    "motivation": ["Quote"],
    "lifestyleAdvice": ["Advice"]
  }
}

CRITICAL RULES:
- Output valid JSON ONLY (start with {, end with })
- MAX 2 workout days
- MAX 3 exercises per day
- Descriptions MAX 5 words
- Keep ALL text short
- Verify JSON syntax before responding`;
}

/**
 * Generates a short motivational quote prompt.
 */
export function generateMotivationPrompt(): string {
  return `Generate one short, motivational quote (1-2 sentences) about fitness or perseverance. 
Return ONLY the quote text, nothing else.`;
}

/**
 * Safely parses JSON. Returns null if invalid.
 */
export function safeJSONParse(response: string): any | null {
  try {
    return JSON.parse(response);
  } catch (error) {
    console.warn("⚠️ Invalid JSON:", error);
    return null;
  }
}

/**
 * Automatically retries generating a fitness plan if JSON is invalid.
 * 
 * @param generateFn - function that calls your AI model
 * @param prompt - the generated plan prompt
 * @param maxRetries - number of times to retry if invalid JSON
 */
export async function generateValidPlan(
  generateFn: (prompt: string) => Promise<string>,
  prompt: string,
  maxRetries = 2
): Promise<any | null> {
  let retries = 0;
  while (retries <= maxRetries) {
    const response = await generateFn(prompt);
    const parsed = safeJSONParse(response);
    if (parsed) return parsed;

    console.log(`Retrying... (${retries + 1}/${maxRetries})`);
    retries++;
  }
  console.error("❌ Failed to get valid JSON from AI after retries.");
  return null;
}
