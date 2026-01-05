"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Check } from "lucide-react";

interface VideoQuality {
  label: string;
  value: string;
}

interface VideoQualitySelectorProps {
  currentQuality: string;
  qualities: VideoQuality[];
  onQualityChange: (quality: string) => void;
}

export function VideoQualitySelector({
  currentQuality,
  qualities,
  onQualityChange,
}: VideoQualitySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        aria-label="Video quality settings"
        aria-expanded={isOpen}
      >
        <Settings className="w-5 h-5 text-white" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute bottom-full right-0 mb-2 bg-black/90 backdrop-blur-md rounded-lg border border-white/10 overflow-hidden min-w-[140px] shadow-xl"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="px-4 py-2 text-white/40 text-xs uppercase tracking-wider border-b border-white/10 font-medium">
              Quality
            </p>
            {qualities.map((quality) => (
              <button
                key={quality.value}
                className="w-full px-4 py-2.5 text-left text-white hover:bg-white/10 flex items-center justify-between transition-colors"
                onClick={() => {
                  onQualityChange(quality.value);
                  setIsOpen(false);
                }}
              >
                <span className={currentQuality === quality.value ? "text-white" : "text-white/70"}>
                  {quality.label}
                </span>
                {currentQuality === quality.value && (
                  <Check className="w-4 h-4 text-green-400" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Default quality options
export const DEFAULT_VIDEO_QUALITIES: VideoQuality[] = [
  { label: "Auto", value: "auto" },
  { label: "1080p", value: "1080" },
  { label: "720p", value: "720" },
  { label: "480p", value: "480" },
  { label: "360p", value: "360" },
];
