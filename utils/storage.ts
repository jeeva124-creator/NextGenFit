import { GeneratedPlan } from "@/types";

const STORAGE_KEY = "fitness-coach-plans";
const CURRENT_PLAN_KEY = "fitness-coach-current-plan";

export function savePlan(plan: GeneratedPlan): void {
  try {
    const plans = getPlans();
    plans.push(plan);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
    localStorage.setItem(CURRENT_PLAN_KEY, JSON.stringify(plan));
  } catch (error) {
    console.error("Failed to save plan:", error);
  }
}

export function getPlans(): GeneratedPlan[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to get plans:", error);
    return [];
  }
}

export function getCurrentPlan(): GeneratedPlan | null {
  try {
    const stored = localStorage.getItem(CURRENT_PLAN_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error("Failed to get current plan:", error);
    return null;
  }
}

export function clearPlans(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CURRENT_PLAN_KEY);
  } catch (error) {
    console.error("Failed to clear plans:", error);
  }
}

export function setCurrentPlan(plan: GeneratedPlan): void {
  try {
    localStorage.setItem(CURRENT_PLAN_KEY, JSON.stringify(plan));
  } catch (error) {
    console.error("Failed to set current plan:", error);
  }
}

