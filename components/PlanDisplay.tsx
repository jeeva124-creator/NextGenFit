"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { GeneratedPlan, Exercise, Meal } from "@/types";
import { VoicePlayer } from "./VoicePlayer";
import { ImageModal } from "./ImageModal";
import { 
  Volume2, 
  RefreshCw, 
  Trash2, 
  Dumbbell, 
  UtensilsCrossed, 
  CheckCircle2,
  Zap,
  Play
} from "lucide-react";

interface PlanDisplayProps {
  plan: GeneratedPlan;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  onClear?: () => void;
}

export function PlanDisplay({
  plan,
  onRegenerate,
  isRegenerating = false,
  onClear,
}: PlanDisplayProps) {
  const [activeTab, setActiveTab] = useState<"workout" | "diet" | "tips">(
    "workout"
  );
  const [imageModal, setImageModal] = useState<{
    isOpen: boolean;
    title: string;
    type: "exercise" | "meal";
  }>({
    isOpen: false,
    title: "",
    type: "exercise",
  });

  const handleExerciseClick = (exerciseName: string) => {
    setImageModal({
      isOpen: true,
      title: exerciseName,
      type: "exercise",
    });
  };

  const handleMealClick = (mealName: string) => {
    setImageModal({
      isOpen: true,
      title: mealName,
      type: "meal",
    });
  };

  const getWorkoutText = () => {
    let text = "Workout Plan:\n\n";
    plan.workoutPlan.forEach((day) => {
      text += `${day.day}\n`;
      day.exercises.forEach((ex) => {
        text += `- ${ex.name}: ${ex.sets} sets x ${ex.reps}, Rest: ${ex.restTime}\n`;
      });
      text += "\n";
    });
    return text;
  };

  const getDietText = () => {
    let text = "Diet Plan:\n\n";
    text += `Breakfast: ${plan.dietPlan.breakfast.name}\n`;
    if (plan.dietPlan.breakfast.description) {
      text += `${plan.dietPlan.breakfast.description}\n`;
    }
    text += `\nLunch: ${plan.dietPlan.lunch.name}\n`;
    if (plan.dietPlan.lunch.description) {
      text += `${plan.dietPlan.lunch.description}\n`;
    }
    text += `\nDinner: ${plan.dietPlan.dinner.name}\n`;
    if (plan.dietPlan.dinner.description) {
      text += `${plan.dietPlan.dinner.description}\n`;
    }
    if (plan.dietPlan.snacks && plan.dietPlan.snacks.length > 0) {
      text += "\nSnacks:\n";
      plan.dietPlan.snacks.forEach((snack) => {
        text += `- ${snack.name}\n`;
      });
    }
    return text;
  };

  return (
    <>
      <div className="space-y-4 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            Your AI-Generated Plan
          </h2>
          <div className="flex gap-2">
            <VoicePlayer text={activeTab === "workout" ? getWorkoutText() : getDietText()} section={activeTab === "workout" ? "workout" : "diet"} />
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                disabled={isRegenerating}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed font-semibold"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`}
                />
                Regenerate
              </button>
            )}
            {onClear && (
              <button
                onClick={onClear}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-semibold"
              >
                <Trash2 className="h-4 w-4" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-600">
          {([
            { id: "workout" as const, label: "Workout", icon: Dumbbell },
            { id: "diet" as const, label: "Diet", icon: UtensilsCrossed },
            { id: "tips" as const, label: "AI Tips", icon: CheckCircle2 },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-semibold transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "border-purple-500 text-purple-400"
                  : "border-transparent text-slate-400 hover:text-slate-300"
              }`}
            >
              <tab.icon className="h-5 w-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Workout Tab */}
          {activeTab === "workout" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4 mt-4"
            >
              {plan.workoutPlan.map((day, dayIdx) => (
                <div key={dayIdx} className="space-y-3">
                  {/* Day Header Card */}
                  <div className="bg-slate-600 rounded-lg p-4 flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <Dumbbell className="h-5 w-5 text-purple-400 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-1">
                          {day.day}
                        </h3>
                        {day.notes && (
                          <p className="text-sm text-slate-300 mb-1">
                            {day.notes}
                          </p>
                        )}
                        {day.duration && (
                          <p className="text-sm text-slate-400">
                            Total time: {day.duration}
                          </p>
                        )}
                      </div>
                    </div>
                    <Play className="h-5 w-5 text-slate-400 cursor-pointer hover:text-white transition-colors" />
                  </div>

                  {/* Exercise List */}
                  <div className="space-y-2">
                    {day.exercises.map((exercise: Exercise, exIdx: number) => (
                      <motion.div
                        key={exIdx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: exIdx * 0.05 }}
                        onClick={() => handleExerciseClick(exercise.name)}
                        className="bg-slate-600 rounded-lg p-3 flex items-start gap-3 cursor-pointer hover:bg-slate-500 transition-colors"
                      >
                        <Zap className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white mb-1">
                            {exercise.name}
                            {exercise.description && (
                              <span className="text-slate-300 font-normal ml-2">
                                ({exercise.description})
                              </span>
                            )}
                          </h4>
                          <p className="text-sm text-slate-300">
                            {exercise.sets} sets × {exercise.reps} • {exercise.restTime} rest
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Diet Tab */}
          {activeTab === "diet" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6 mt-4"
            >
              <VoicePlayer text={getDietText()} section="diet" />
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-white mb-3">Breakfast</h3>
                  <MealCard
                    meal={plan.dietPlan.breakfast}
                    onClick={() => handleMealClick(plan.dietPlan.breakfast.name)}
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-3">Lunch</h3>
                  <MealCard
                    meal={plan.dietPlan.lunch}
                    onClick={() => handleMealClick(plan.dietPlan.lunch.name)}
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-3">Dinner</h3>
                  <MealCard
                    meal={plan.dietPlan.dinner}
                    onClick={() => handleMealClick(plan.dietPlan.dinner.name)}
                  />
                </div>
                {plan.dietPlan.snacks && plan.dietPlan.snacks.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-white mb-3">Snacks</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {plan.dietPlan.snacks.map((snack, idx) => (
                        <MealCard
                          key={idx}
                          meal={snack}
                          onClick={() => handleMealClick(snack.name)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Tips Tab */}
          {activeTab === "tips" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6 mt-4"
            >
              {plan.tips.tips && plan.tips.tips.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Tips</h3>
                  <ul className="space-y-2">
                    {plan.tips.tips.map((tip, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-slate-300"
                      >
                        <span className="text-purple-400 mt-1">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {plan.tips.motivation && plan.tips.motivation.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Motivation</h3>
                  <div className="space-y-3">
                    {plan.tips.motivation.map((quote, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-slate-600 rounded-lg border-l-4 border-purple-500"
                      >
                        <p className="text-slate-300 italic">{quote}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {plan.tips.lifestyleAdvice &&
                plan.tips.lifestyleAdvice.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-white mb-4">
                      Lifestyle Advice
                    </h3>
                    <ul className="space-y-2">
                      {plan.tips.lifestyleAdvice.map((advice, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-slate-300"
                        >
                          <span className="text-green-400 mt-1">•</span>
                          <span>{advice}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal
        isOpen={imageModal.isOpen}
        onClose={() =>
          setImageModal({ isOpen: false, title: "", type: "exercise" })
        }
        title={imageModal.title}
        prompt={imageModal.title}
        type={imageModal.type}
      />
    </>
  );
}

function MealCard({ meal, onClick }: { meal: Meal; onClick: () => void }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className="bg-slate-600 rounded-lg p-4 cursor-pointer hover:bg-slate-500 transition-colors"
    >
      <h4 className="font-semibold text-white mb-2">{meal.name}</h4>
      {meal.calories && (
        <p className="text-sm text-slate-300">Calories: {meal.calories} kcal</p>
      )}
      {meal.macronutrients && (
        <div className="text-sm text-slate-300 mt-2">
          {meal.macronutrients.protein && (
            <span>Protein: {meal.macronutrients.protein} </span>
          )}
          {meal.macronutrients.carbs && (
            <span>Carbs: {meal.macronutrients.carbs} </span>
          )}
          {meal.macronutrients.fats && (
            <span>Fats: {meal.macronutrients.fats}</span>
          )}
        </div>
      )}
      {meal.description && (
        <p className="text-sm text-slate-400 mt-2">{meal.description}</p>
      )}
    </motion.div>
  );
}
