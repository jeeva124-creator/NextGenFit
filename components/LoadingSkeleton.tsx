"use client";

import { motion } from "framer-motion";

export function LoadingSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto p-6 space-y-6"
    >
      <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-12 animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-gray-200 dark:bg-gray-700 rounded-lg h-32 animate-pulse"
          />
        ))}
      </div>
    </motion.div>
  );
}

