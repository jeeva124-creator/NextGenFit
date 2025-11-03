"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserForm } from "@/components/UserForm";
import { PlanDisplay } from "@/components/PlanDisplay";
import { MotivationQuote } from "@/components/MotivationQuote";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserData, GeneratedPlan } from "@/types";
import { savePlan, getCurrentPlan } from "@/utils/storage";
import { Dumbbell } from "lucide-react";

export default function Home() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedPlan = getCurrentPlan();
    if (savedPlan) {
      setPlan(savedPlan);
      setUserData(savedPlan.userData);
    }
  }, []);

  const handleFormSubmit = async (data: UserData) => {
    setUserData(data);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        const errorMsg = responseData.error || "Failed to generate plan";
        setError(errorMsg);
        return;
      }

      const generatedPlan: GeneratedPlan = responseData;
      setPlan(generatedPlan);
      savePlan(generatedPlan);
    } catch (err) {
      console.error("Error in handleFormSubmit:", err);
      setError(
        err instanceof Error ? err.message : "Failed to generate plan"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!userData) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        const errorMsg = responseData.error || "Failed to regenerate plan";
        setError(errorMsg);
        return;
      }

      const generatedPlan: GeneratedPlan = responseData;
      setPlan(generatedPlan);
      savePlan(generatedPlan);
    } catch (err) {
      console.error("Error in handleRegenerate:", err);
      setError(
        err instanceof Error ? err.message : "Failed to regenerate plan"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setPlan(null);
    setUserData(null);
    setError(null);
    localStorage.removeItem("fitnessPlan");
  };

  return (
    <main className="min-h-screen bg-slate-800 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Dumbbell className="h-8 w-8 text-purple-500" />
          <h1 className="text-2xl font-bold text-white">NextGenFit</h1>
        </div>
        <ThemeToggle />
      </div>

      {/* Daily Motivation Quote */}
      {!plan && <MotivationQuote />}

      {/* Two Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-120px)]">
        {/* Left Panel - Your Details */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-slate-700 rounded-lg shadow-xl p-6 overflow-y-auto"
        >
          {!plan ? (
            <>
              {isLoading ? (
                <LoadingSkeleton />
              ) : (
                <>
                  <UserForm onSubmit={handleFormSubmit} isLoading={isLoading} />
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-4 bg-red-900/30 border border-red-500 text-red-200 rounded-lg text-sm"
                    >
                      {error}
                    </motion.div>
                  )}
                </>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-purple-400" />
                Your Details
              </h2>
              <div className="space-y-2 text-sm">
                <p className="text-slate-300">
                  <span className="font-semibold">Name:</span> {userData?.name}
                </p>
                <p className="text-slate-300">
                  <span className="font-semibold">Age:</span> {userData?.age}
                </p>
                <p className="text-slate-300">
                  <span className="font-semibold">Goal:</span> {userData?.fitnessGoal}
                </p>
                <p className="text-slate-300">
                  <span className="font-semibold">Level:</span> {userData?.fitnessLevel}
                </p>
              </div>
              <button
                onClick={handleClear}
                className="w-full mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors font-semibold"
              >
                Clear & Create New
              </button>
            </div>
          )}
        </motion.div>

        {/* Right Panel - Your AI-Generated Plan */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-slate-700 rounded-lg shadow-xl p-6 overflow-y-auto"
        >
          {!plan ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-slate-400">
                <Dumbbell className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                <p className="text-lg">Fill out the form to generate your plan</p>
              </div>
            </div>
          ) : (
            <PlanDisplay
              plan={plan}
              onRegenerate={handleRegenerate}
              isRegenerating={isLoading}
              onClear={handleClear}
            />
          )}
          {error && plan && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 p-4 bg-red-900/30 border border-red-500 text-red-200 rounded-lg text-sm"
            >
              {error}
            </motion.div>
          )}
        </motion.div>
      </div>
    </main>
  );
}
