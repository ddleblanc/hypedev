"use client";

import React from "react";
import { motion } from "framer-motion";
import { Play, Pause, Volume2, VolumeX, SkipForward } from "lucide-react";

interface MobileTrailerControlsProps {
  isPlaying: boolean;
  isMuted: boolean;
  progress: number;
  currentTime: string;
  duration: string;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onSkip: () => void;
  onSeek: (percent: number) => void;
}

export function MobileTrailerControls({
  isPlaying,
  isMuted,
  progress,
  currentTime,
  duration,
  onTogglePlay,
  onToggleMute,
  onSkip,
  onSeek,
}: MobileTrailerControlsProps) {
  const handleSeek = (e: React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    const percent = ((touch.clientX - rect.left) / rect.width) * 100;
    onSeek(Math.max(0, Math.min(100, percent)));
  };

  return (
    <motion.div
      className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      {/* Progress bar */}
      <div
        className="w-full h-2 bg-white/20 rounded-full mb-4 touch-none"
        onTouchMove={handleSeek}
      >
        <div
          className="h-full bg-white rounded-full relative"
          style={{ width: `${progress}%` }}
        >
          {/* Scrubber handle for touch */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg" />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Play/Pause */}
          <button
            className="w-12 h-12 flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-full active:scale-95 transition-transform"
            onClick={onTogglePlay}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-white" />
            ) : (
              <Play className="w-6 h-6 text-white ml-1" />
            )}
          </button>

          {/* Volume */}
          <button
            className="w-12 h-12 flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-full active:scale-95 transition-transform"
            onClick={onToggleMute}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-white" />
            ) : (
              <Volume2 className="w-5 h-5 text-white" />
            )}
          </button>

          {/* Time display */}
          <span className="text-white/70 text-sm font-mono">
            {currentTime} / {duration}
          </span>
        </div>

        {/* Skip button */}
        <button
          className="px-4 py-2.5 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm flex items-center gap-2 active:scale-95 transition-transform border border-white/20"
          onClick={onSkip}
        >
          <SkipForward className="w-4 h-4" />
          Skip
        </button>
      </div>
    </motion.div>
  );
}
