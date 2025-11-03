import { UserData } from "@/types";

/**
 * Generates a compact, valid JSON fitness plan prompt for the AI.
 * Designed to prevent truncation and parsing errors.
 */
export function generatePlanPrompt(userData: UserData): string {
  return `You are an expert fitness coach and nutritionist. Create a short, valid JSON fitness plan for the user below.

User Details:
- Name: ${userData.name}
- Age: ${userData.age}
- Gender: ${userData.gender}
- Height: ${userData.height} cm
- Weight: ${userData.weight} kg
- Fitness Goal: ${userData.fitnessGoal}
- Fitness Level: ${userData.fitnessLevel}
- Workout Location: ${userData.workoutLocation}
- Dietary Preferences: ${userData.dietaryPreferences}
${userData.medicalHistory ? `- Medical History: ${userData.medicalHistory}` : ""}
${userData.stressLevel ? `- Stress Level: ${userData.stressLevel}` : ""}

Return ONLY valid JSON in this exact structure (no markdown, no text outside JSON):

{
  "workoutPlan": [
    {
      "day": "Day 1 - Monday",
      "exercises": [
        { "name": "Exercise", "sets": 3, "reps": "10-12", "restTime": "60s", "description": "Short tip" }
      ],
      "duration": "45 min"
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
    "motivation": ["Quote 1"],
    "lifestyleAdvice": ["Advice 1"]
  }
}

STRICT RULES (MUST FOLLOW):
- Output MUST be valid JSON only (no markdown, no text before/after)
- Maximum 3 workout days (keep it short)
- Maximum 3 exercises per day
- Exercise descriptions: MAX 8 words each (be very brief)
- No long text anywhere - keep everything concise
- Start with { and end with }
- Validate all commas and brackets are correct`;
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
