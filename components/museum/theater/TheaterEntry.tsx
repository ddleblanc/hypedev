"use client";

import React, { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { TitleCard } from "./TitleCard";
import { TrailerPlayer } from "./TrailerPlayer";
import { useMuseum } from "@/contexts/museum-context";

interface TheaterEntryProps {
  children: React.ReactNode;
}

/**
 * TheaterEntry wraps museum content and provides theater mode transitions.
 *
 * IMPORTANT: The curtain animation is handled by AnimatedSidebar and RightAnimatedSidebar
 * in museum mode. These sidebars expand to 50% width and act as theater curtains,
 * controlled via the museum-theater-enter/exit events dispatched by the MuseumContext.
 *
 * This component handles:
 * - Scroll lock during transitions
 * - Title card display between curtain states
 * - Trailer player display after curtains open
 */
export function TheaterEntry({ children }: TheaterEntryProps) {
  const {
    theaterPhase,
    isTrailerPlaying,
    activeLegend,
    skipToExperience,
  } = useMuseum();

  // Prevent scroll during theater mode entry
  useEffect(() => {
    if (theaterPhase !== "idle" && theaterPhase !== "immersive") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [theaterPhase]);

  // Get trailer URL from active legend
  const trailerUrl = activeLegend?.trailerUrl || activeLegend?.introVideo;

  return (
    <>
      {/* Title card - renders during closed state */}
      <TitleCard />

      {/* Trailer player - renders after curtains open if legend has a trailer */}
      <AnimatePresence>
        {isTrailerPlaying && trailerUrl && activeLegend && (
          <TrailerPlayer
            videoUrl={trailerUrl}
            posterUrl={activeLegend.thumbnail}
            legendId={activeLegend.id}
            onComplete={skipToExperience}
            onSkip={skipToExperience}
          />
        )}
      </AnimatePresence>

      {/* Main content - show when not playing trailer or if no trailer available */}
      {(!isTrailerPlaying || !trailerUrl) && children}
    </>
  );
}
