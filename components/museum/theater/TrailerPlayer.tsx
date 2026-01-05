"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipForward,
} from "lucide-react";
import { useMuseum } from "@/contexts/museum-context";
import { trpc } from "@/lib/trpc/client";

interface TrailerPlayerProps {
  videoUrl: string;
  posterUrl?: string;
  duration?: number;
  legendId: string;
  onComplete?: () => void;
  onSkip?: () => void;
}

export function TrailerPlayer({
  videoUrl,
  posterUrl,
  duration = 90,
  legendId,
  onComplete,
  onSkip,
}: TrailerPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { isTrailerPlaying, setTrailerProgress, skipToExperience } = useMuseum();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(duration);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSkipButton, setShowSkipButton] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const { mutate: updateProgress } = trpc.museum.progress.update.useMutation();

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Auto-play when trailer starts
  useEffect(() => {
    if (isTrailerPlaying && videoRef.current) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        // Auto-play blocked, user needs to interact
        setIsPlaying(false);
      });
    }
  }, [isTrailerPlaying]);

  // Show skip button after 5 seconds
  useEffect(() => {
    if (isTrailerPlaying) {
      const timer = setTimeout(() => {
        setShowSkipButton(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isTrailerPlaying]);

  // Handle time update
  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;

    const current = videoRef.current.currentTime;
    const total = videoRef.current.duration || videoDuration;
    const progressPercent = (current / total) * 100;

    setCurrentTime(current);
    setProgress(progressPercent);
    setTrailerProgress(progressPercent);
  }, [videoDuration, setTrailerProgress]);

  // Handle video end
  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    updateProgress({
      legendId,
      action: "watch_trailer",
    });
    onComplete?.();
  }, [legendId, updateProgress, onComplete]);

  // Handle skip
  const handleSkip = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    skipToExperience();
    onSkip?.();
  }, [skipToExperience, onSkip]);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Seek on progress bar click
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const newTime = clickPosition * (videoRef.current.duration || videoDuration);

    videoRef.current.currentTime = newTime;
  }, [videoDuration]);

  // Handle touch seek for mobile
  const handleTouchSeek = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    const touchPosition = (touch.clientX - rect.left) / rect.width;
    const newTime = Math.max(0, Math.min(1, touchPosition)) * (videoRef.current.duration || videoDuration);

    videoRef.current.currentTime = newTime;
  }, [videoDuration]);

  // Show controls on mouse move, hide after delay
  const handleMouseMove = useCallback(() => {
    setShowControls(true);

    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying]);

  // Touch handler for mobile
  const handleTouchStart = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 4000);
  }, [isPlaying]);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isTrailerPlaying) return null;

  return (
    <motion.div
      ref={containerRef}
      className="fixed inset-0 z-[105] bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      onClick={togglePlay}
    >
      {/* Video */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        poster={posterUrl}
        muted={isMuted}
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onLoadedMetadata={() => {
          if (videoRef.current) {
            setVideoDuration(videoRef.current.duration);
          }
        }}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
      >
        <source src={videoUrl} type="video/mp4" />
      </video>

      {/* Buffering indicator */}
      <AnimatePresence>
        {isBuffering && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip Intro Button (Netflix style) */}
      <AnimatePresence>
        {showSkipButton && (
          <motion.button
            className={`absolute ${isMobile ? "bottom-28 right-4" : "bottom-24 right-8"} px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 text-white font-medium rounded transition-colors`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onClick={(e) => {
              e.stopPropagation();
              handleSkip();
            }}
          >
            <SkipForward className="w-5 h-5 inline mr-2" />
            Skip Intro
          </motion.button>
        )}
      </AnimatePresence>

      {/* Controls Overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            className="absolute inset-0 flex flex-col justify-end pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

            {/* Controls container */}
            <div
              className={`relative ${isMobile ? "p-4" : "p-8"} pointer-events-auto`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Progress bar */}
              <div
                className={`w-full ${isMobile ? "h-2" : "h-1"} bg-white/20 rounded-full mb-4 cursor-pointer group touch-none`}
                onClick={handleProgressClick}
                onTouchMove={handleTouchSeek}
              >
                {/* Buffered indicator */}
                <div
                  className={`absolute ${isMobile ? "h-2" : "h-1"} bg-white/30 rounded-full`}
                  style={{ width: "100%" }}
                />
                {/* Progress */}
                <div
                  className={`h-full bg-white rounded-full relative transition-all ${isMobile ? "" : "group-hover:h-1.5"}`}
                  style={{ width: `${progress}%` }}
                >
                  {/* Scrubber */}
                  <div className={`absolute right-0 top-1/2 -translate-y-1/2 ${isMobile ? "w-4 h-4" : "w-3 h-3"} bg-white rounded-full ${isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`} />
                </div>
              </div>

              {/* Bottom controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Play/Pause */}
                  <button
                    className={`${isMobile ? "w-12 h-12" : "w-10 h-10"} flex items-center justify-center ${isMobile ? "bg-white/10" : "hover:bg-white/10"} rounded-full transition-colors`}
                    onClick={togglePlay}
                  >
                    {isPlaying ? (
                      <Pause className={`${isMobile ? "w-6 h-6" : "w-6 h-6"} text-white`} />
                    ) : (
                      <Play className={`${isMobile ? "w-6 h-6" : "w-6 h-6"} text-white ml-1`} />
                    )}
                  </button>

                  {/* Volume */}
                  <button
                    className={`${isMobile ? "w-12 h-12" : "w-10 h-10"} flex items-center justify-center ${isMobile ? "bg-white/10" : "hover:bg-white/10"} rounded-full transition-colors`}
                    onClick={toggleMute}
                  >
                    {isMuted ? (
                      <VolumeX className={`${isMobile ? "w-5 h-5" : "w-6 h-6"} text-white`} />
                    ) : (
                      <Volume2 className={`${isMobile ? "w-5 h-5" : "w-6 h-6"} text-white`} />
                    )}
                  </button>

                  {/* Time */}
                  <span className={`text-white/80 ${isMobile ? "text-xs" : "text-sm"} font-mono`}>
                    {formatTime(currentTime)} / {formatTime(videoDuration)}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  {/* Fullscreen - hide on mobile since videos are fullscreen by default */}
                  {!isMobile && (
                    <button
                      className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
                      onClick={toggleFullscreen}
                    >
                      {isFullscreen ? (
                        <Minimize className="w-6 h-6 text-white" />
                      ) : (
                        <Maximize className="w-6 h-6 text-white" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Center play button when paused */}
      <AnimatePresence>
        {!isPlaying && !isBuffering && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <div className={`${isMobile ? "w-16 h-16" : "w-20 h-20"} bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center`}>
              <Play className={`${isMobile ? "w-8 h-8" : "w-10 h-10"} text-white ml-1`} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
