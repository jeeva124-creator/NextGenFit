"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function MotivationQuote() {
  const [quote, setQuote] = useState<string>("Loading your daily motivation...");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const response = await fetch("/api/motivation");
        const data = await response.json();
        setQuote(data.quote || "Your journey to fitness starts today!");
      } catch (error) {
        console.error("Failed to fetch quote:", error);
        setQuote("Your journey to fitness starts today!");
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuote();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-6"
    >
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 shadow-xl border border-purple-500/30">
        <div className="flex items-start gap-3">
          <Sparkles className="h-6 w-6 mt-1 flex-shrink-0 text-yellow-300" />
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-2 text-white">💬 Daily Motivation</h3>
            <p className="text-white/95 italic text-base leading-relaxed">
              {isLoading ? (
                <span className="text-white/70">Loading your daily inspiration...</span>
              ) : (
                `"${quote}"`
              )}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

