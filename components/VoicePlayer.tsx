"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2 } from "lucide-react";

interface VoicePlayerProps {
  text: string;
  section: "workout" | "diet";
}

export function VoicePlayer({ text, section }: VoicePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && !("speechSynthesis" in window)) {
      setError("Your browser doesn't support text-to-speech");
    }

    return () => {
      if (speechSynthesisRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const startSpeech = () => {
    if (!text || text.trim() === "") {
      setError("No content to read");
      return;
    }

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setError("Text-to-speech is not supported in your browser");
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      speechSynthesisRef.current = utterance;

      utterance.onstart = () => {
        setIsPlaying(true);
        setError(null);
      };

      utterance.onend = () => {
        setIsPlaying(false);
        speechSynthesisRef.current = null;
      };

      utterance.onerror = (event) => {
        console.error("Speech error:", event);
        setError("Failed to read text");
        setIsPlaying(false);
        speechSynthesisRef.current = null;
      };

      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error("Error starting speech:", err);
      setError("Failed to start speech");
    }
  };

  const stop = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      speechSynthesisRef.current = null;
    }
  };

  return (
    <button
      onClick={isPlaying ? stop : startSpeech}
      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold"
    >
      {isPlaying ? (
        <>
          <Pause className="h-4 w-4" />
          <span>Stop</span>
        </>
      ) : (
        <>
          <Volume2 className="h-4 w-4" />
          <span>Read Plan</span>
        </>
      )}
    </button>
  );
}
