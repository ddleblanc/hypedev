"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Play, Crown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MediaRenderer } from "@/components/MediaRenderer";
import { cn } from "@/lib/utils";
import type { CollectionCardData } from "@/types/homepage";

interface HeroCarouselProps {
  collections: CollectionCardData[];
  isLoading?: boolean;
  autoPlayInterval?: number;
  children?: React.ReactNode;
  enableKenBurns?: boolean;
  showProgressBar?: boolean;
}

// Ken Burns animation styles
const kenBurnsVariants = [
  { scale: [1, 1.08], x: ["0%", "2%"], y: ["0%", "1%"] },
  { scale: [1, 1.06], x: ["0%", "-2%"], y: ["0%", "2%"] },
  { scale: [1, 1.07], x: ["0%", "1%"], y: ["0%", "-1%"] },
  { scale: [1, 1.05], x: ["0%", "-1%"], y: ["0%", "-2%"] },
];

export function HeroCarousel({
  collections,
  isLoading = false,
  autoPlayInterval = 6000,
  children,
  enableKenBurns = true,
  showProgressBar = true,
}: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Progress bar animation
  useEffect(() => {
    if (collections.length <= 1 || isPaused || !showProgressBar) {
      return;
    }

    startTimeRef.current = Date.now();

    const updateProgress = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min((elapsed / autoPlayInterval) * 100, 100);
      setProgress(newProgress);

      if (newProgress < 100) {
        progressRef.current = requestAnimationFrame(updateProgress);
      }
    };

    progressRef.current = requestAnimationFrame(updateProgress);

    return () => {
      if (progressRef.current) {
        cancelAnimationFrame(progressRef.current);
      }
    };
  }, [currentIndex, isPaused, autoPlayInterval, collections.length, showProgressBar]);

  // Auto-rotate through slides
  useEffect(() => {
    if (collections.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % collections.length);
      setProgress(0);
      startTimeRef.current = Date.now();
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [collections.length, autoPlayInterval, isPaused]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
    setProgress(0);
    startTimeRef.current = Date.now();
  }, []);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) =>
      prev === 0 ? collections.length - 1 : prev - 1
    );
    setProgress(0);
    startTimeRef.current = Date.now();
  }, [collections.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % collections.length);
    setProgress(0);
    startTimeRef.current = Date.now();
  }, [collections.length]);

  // Loading skeleton with brand-colored pulse
  if (isLoading) {
    return (
      <div className="relative h-[50vh] sm:h-[60vh] md:h-[70vh] bg-gradient-to-br from-zinc-900 to-black">
        <div className="absolute inset-0 animate-pulse">
          <div className="absolute bottom-6 left-4 md:bottom-8 md:left-8 space-y-3 md:space-y-4">
            <div className="h-6 w-32 md:h-8 md:w-48 bg-white/10 rounded-full" />
            <div className="h-8 w-56 md:h-12 md:w-96 bg-white/10 rounded" />
            <div className="h-5 w-40 md:h-6 md:w-64 bg-white/10 rounded" />
            <div className="flex gap-4 mt-4">
              <div className="h-4 w-20 bg-white/10 rounded" />
              <div className="h-4 w-20 bg-white/10 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <div className="relative h-[50vh] sm:h-[60vh] md:h-[70vh] bg-gradient-to-br from-zinc-900 to-black flex items-center justify-center">
        <div className="text-center px-4">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 md:w-10 md:h-10 text-white/20" />
          </div>
          <p className="text-white/60 text-base md:text-lg">No featured collections yet</p>
          <p className="text-white/40 text-sm mt-2">Check back soon for amazing drops</p>
        </div>
      </div>
    );
  }

  const currentCollection = collections[currentIndex];
  const kenBurnsVariant = kenBurnsVariants[currentIndex % kenBurnsVariants.length];

  return (
    <div
      className="relative h-[50vh] sm:h-[60vh] md:h-[70vh] overflow-hidden group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Slides with Ken Burns Effect */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
          className="absolute inset-0"
        >
          {/* Ken Burns animated wrapper - disabled on mobile for performance */}
          <motion.div
            className="absolute inset-0 hidden md:block"
            initial={{ scale: 1, x: "0%", y: "0%" }}
            animate={
              enableKenBurns && !isPaused
                ? {
                    scale: kenBurnsVariant.scale,
                    x: kenBurnsVariant.x,
                    y: kenBurnsVariant.y,
                  }
                : {}
            }
            transition={{
              duration: autoPlayInterval / 1000,
              ease: "linear",
            }}
          >
            <MediaRenderer
              src={currentCollection.bannerImage || currentCollection.image}
              alt={currentCollection.name}
              className="w-full h-full object-cover"
            />
          </motion.div>

          {/* Static image for mobile */}
          <div className="absolute inset-0 md:hidden">
            <MediaRenderer
              src={currentCollection.bannerImage || currentCollection.image}
              alt={currentCollection.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Gradient overlays - enhanced for better text readability on mobile */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/60 to-black/30 md:from-black/90 md:via-black/50 md:to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent md:from-black md:via-transparent md:to-black/30" />
        </motion.div>
      </AnimatePresence>

      {/* Content with Parallax Effect */}
      <div className="relative h-full flex flex-col z-10">
        {/* Search bar slot */}
        {children && (
          <motion.div
            className="pt-20 sm:pt-24 md:pt-32 px-4 md:px-8"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {children}
          </motion.div>
        )}

        {/* Collection info with parallax */}
        <div className="flex-1 flex items-end">
          <div className="container mx-auto px-4 md:px-8 pb-16 md:pb-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                className="max-w-xl md:max-w-2xl"
              >
                {/* Badges - smaller on mobile */}
                <div className="flex flex-wrap gap-2 mb-3 md:mb-4">
                  <Badge className="bg-[rgb(163,255,18)] text-black font-bold text-xs md:text-sm px-2 md:px-3 py-0.5 md:py-1">
                    <Crown className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1" />
                    Featured
                  </Badge>
                  {currentCollection.isTrending && (
                    <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs md:text-sm px-2 md:px-3 py-0.5 md:py-1">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Trending
                    </Badge>
                  )}
                </div>

                {/* Title - responsive sizing */}
                <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white mb-2 md:mb-3 line-clamp-2">
                  {currentCollection.name}
                </h1>

                {/* Creator */}
                {currentCollection.creatorName && (
                  <p className="text-sm md:text-lg text-white/80 mb-3 md:mb-4">
                    by{" "}
                    <span className="text-[rgb(163,255,18)] font-semibold">
                      {currentCollection.creatorName}
                    </span>
                  </p>
                )}

                {/* Stats - horizontal scroll on mobile */}
                <div className="flex gap-4 md:gap-6 mb-4 md:mb-6 overflow-x-auto scrollbar-hide pb-1">
                  <div className="flex-shrink-0">
                    <p className="text-white/50 text-[10px] md:text-xs uppercase tracking-wider">
                      Floor
                    </p>
                    <p className="text-lg md:text-xl font-bold text-white whitespace-nowrap">
                      {currentCollection.floorPrice}{" "}
                      <span className="text-white/60 text-xs md:text-sm">
                        {currentCollection.floorPriceCurrency}
                      </span>
                    </p>
                  </div>
                  {currentCollection.volume24h && (
                    <div className="flex-shrink-0">
                      <p className="text-white/50 text-[10px] md:text-xs uppercase tracking-wider">
                        24h Vol
                      </p>
                      <p className="text-lg md:text-xl font-bold text-white whitespace-nowrap">
                        {currentCollection.volume24h}
                      </p>
                    </div>
                  )}
                  {currentCollection.itemCount && (
                    <div className="flex-shrink-0">
                      <p className="text-white/50 text-[10px] md:text-xs uppercase tracking-wider">
                        Items
                      </p>
                      <p className="text-lg md:text-xl font-bold text-white">
                        {currentCollection.itemCount.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* CTA - full width on mobile */}
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-white text-black hover:bg-white/90 font-bold text-sm md:text-base"
                  asChild
                >
                  <Link href={`/collection/${currentCollection.slug}`}>
                    <Play className="w-4 h-4 md:w-5 md:h-5 mr-2" fill="currentColor" />
                    Explore Collection
                  </Link>
                </Button>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Navigation Arrows - hidden on mobile, visible on hover for desktop */}
      {collections.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className={cn(
              "absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20",
              "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center",
              "bg-black/50 backdrop-blur-md border border-white/10",
              "text-white hover:bg-black/70 hover:border-white/20 transition-all",
              "opacity-0 group-hover:opacity-100 focus:opacity-100",
              "hidden sm:flex"
            )}
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <button
            onClick={goToNext}
            className={cn(
              "absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20",
              "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center",
              "bg-black/50 backdrop-blur-md border border-white/10",
              "text-white hover:bg-black/70 hover:border-white/20 transition-all",
              "opacity-0 group-hover:opacity-100 focus:opacity-100",
              "hidden sm:flex"
            )}
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </>
      )}

      {/* Progress Bar and Dot Indicators */}
      {collections.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 z-20">
          {/* Progress bar */}
          {showProgressBar && (
            <div className="h-0.5 bg-white/10 mx-4 md:mx-8 mb-2">
              <motion.div
                className="h-full bg-[rgb(163,255,18)]"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          )}

          {/* Dot indicators */}
          <div className="flex justify-center gap-1.5 md:gap-2 pb-3 md:pb-4">
            {collections.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={cn(
                  "h-1.5 md:h-2 rounded-full transition-all duration-300",
                  index === currentIndex
                    ? "w-6 md:w-8 bg-[rgb(163,255,18)]"
                    : "w-1.5 md:w-2 bg-white/40 hover:bg-white/60"
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
