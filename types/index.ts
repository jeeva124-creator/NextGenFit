export interface UserData {
  name: string;
  age: number;
  gender: string;
  height: number; // in cm
  weight: number; // in kg
  fitnessGoal: string;
  fitnessLevel: string;
  workoutLocation: string;
  dietaryPreferences: string;
  medicalHistory?: string;
  stressLevel?: string;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  restTime: string;
  description?: string;
}

export interface WorkoutPlan {
  day: string;
  exercises: Exercise[];
  duration: string;
  notes?: string;
}

export interface Meal {
  name: string;
  calories?: number;
  macronutrients?: {
    protein?: string;
    carbs?: string;
    fats?: string;
  };
  description?: string;
}

export interface DietPlan {
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
  snacks: Meal[];
}

export interface TipsAndMotivation {
  tips: string[];
  motivation: string[];
  lifestyleAdvice?: string[];
}

export interface GeneratedPlan {
  workoutPlan: WorkoutPlan[];
  dietPlan: DietPlan;
  tips: TipsAndMotivation;
  generatedAt: string;
  userData: UserData;
}

