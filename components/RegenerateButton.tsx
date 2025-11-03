"use client";

import { RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

interface RegenerateButtonProps {
  onClick: () => void;
  isLoading?: boolean;
}

export function RegenerateButton({
  onClick,
  isLoading = false,
}: RegenerateButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      disabled={isLoading}
      className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md transition-colors disabled:cursor-not-allowed font-semibold shadow-lg"
    >
      <RefreshCw className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} />
      {isLoading ? "Regenerating..." : "Regenerate Plan"}
    </motion.button>
  );
}

