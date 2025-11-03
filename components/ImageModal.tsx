"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

interface Props {
  isOpen: boolean;
  title: string;
  prompt?: string;
  type: "exercise" | "meal";
  onClose: () => void;
}

// Simple session cache to avoid regenerating within a session
const imageCache = new Map<string, string>();

export function ImageModal({ isOpen, title, prompt, type, onClose }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const cacheKey = useMemo(
    () => `${type}:${(title || prompt || "").toLowerCase()}`,
    [type, title, prompt]
  );

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    const cached = imageCache.get(cacheKey);
    if (cached) {
      setUrl(cached);
      return;
    }
    const run = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: prompt ?? title, type }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || "Failed to generate image");
        }
        imageCache.set(cacheKey, data.url);
        setUrl(data.url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate image");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [isOpen, cacheKey, prompt, title, type]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-xl bg-slate-800 shadow-xl border border-slate-700">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h3 className="text-white font-semibold truncate pr-4">
            {type === "meal" ? "Diet: " : "Exercise: "}
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white px-2 py-1 rounded"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-4">
          {loading && (
            <div className="h-72 flex items-center justify-center text-slate-300">
              Generating image…
            </div>
          )}
          {error && (
            <div className="text-sm text-red-300">
              {error}
              <div className="mt-2 text-slate-300">
                Tip: Add REPLICATE_API_TOKEN to enable image generation.
              </div>
            </div>
          )}
          {!loading && !error && url && (
            <div className="relative w-full overflow-hidden rounded-lg">
              <Image
                src={url}
                alt={title}
                width={768}
                height={960}
                className="w-full h-auto"
                priority
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
