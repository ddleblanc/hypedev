"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

// Curtain animation states
export type CurtainState = 'open' | 'closing' | 'closed' | 'opening';

// Theater mode phases
export type TheaterPhase =
  | 'idle'           // Normal museum browse
  | 'entering'       // Curtains closing
  | 'title-card'     // Showing title
  | 'opening'        // Curtains opening
  | 'immersive'      // Full experience
  | 'exiting';       // Returning to browse

interface MuseumItem {
  id: string;
  slug?: string;
  title: string;
  subtitle: string;
  thumbnail: string;
  introVideo?: string;
  trailerUrl?: string;
}

interface MuseumContextType {
  // Current legend
  activeLegend: MuseumItem | null;
  setActiveLegend: (item: MuseumItem | null) => void;

  // Theater mode state
  isTheaterMode: boolean;
  theaterPhase: TheaterPhase;
  curtainState: CurtainState;

  // Title card
  showTitleCard: boolean;
  titleCardText: { main: string; sub: string } | null;

  // Trailer state
  isTrailerPlaying: boolean;
  trailerProgress: number;
  setTrailerProgress: (progress: number) => void;

  // Actions
  enterTheaterMode: (legend: MuseumItem) => Promise<void>;
  exitTheaterMode: () => void;
  skipToExperience: () => void;

  // Legacy compatibility
  selectedItem: MuseumItem | null;
  playIntro: (item: MuseumItem) => void;
  showTitleAnimation: boolean;
  introComplete: boolean;

  // Legacy UI state
  showHeaderFooter: boolean;
  setShowHeaderFooter: (show: boolean) => void;
  introPlaying: boolean;
  setIntroPlaying: (playing: boolean) => void;
  setSelectedItem: (item: MuseumItem | null) => void;
  videoUrl: string | null;
  setShowTitleAnimation: (show: boolean) => void;
  setIntroComplete: (complete: boolean) => void;
  stopIntro: () => void;
}

const MuseumContext = createContext<MuseumContextType | undefined>(undefined);

// Animation timings (in ms)
const TIMINGS = {
  CURTAIN_CLOSE: 800,
  TITLE_SHOW: 600,
  TITLE_DISPLAY: 1200,
  TITLE_HIDE: 400,
  CURTAIN_OPEN: 600,
  EXIT_FADE: 300,
};

// Utility
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function MuseumProvider({ children }: { children: React.ReactNode }) {
  // Theater mode state
  const [activeLegend, setActiveLegend] = useState<MuseumItem | null>(null);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [theaterPhase, setTheaterPhase] = useState<TheaterPhase>('idle');
  const [curtainState, setCurtainState] = useState<CurtainState>('open');
  const [showTitleCard, setShowTitleCard] = useState(false);
  const [titleCardText, setTitleCardText] = useState<{ main: string; sub: string } | null>(null);
  const [isTrailerPlaying, setIsTrailerPlaying] = useState(false);
  const [trailerProgress, setTrailerProgress] = useState(0);

  // Legacy compatibility state
  const [showHeaderFooter, setShowHeaderFooter] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const [introPlaying, setIntroPlaying] = useState(false);
  const [showTitleAnimation, setShowTitleAnimation] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // Enter theater mode with REVEAL animation sequence
  // The key effect: sidebars animate OUT while title animates IN underneath
  // This creates a cinematic "reveal" where curtains open to show the title
  const enterTheaterMode = useCallback(async (legend: MuseumItem) => {
    setActiveLegend(legend);
    setVideoUrl(legend.introVideo || null);

    // Step 1: Start the reveal - show title and open curtains SIMULTANEOUSLY
    // Title is at z-30, sidebars at z-40, so title is behind and gets revealed
    setTheaterPhase('opening');
    setCurtainState('opening');

    // Show title card immediately (it will be revealed as sidebars move away)
    setShowTitleCard(true);
    setTitleCardText({ main: 'LEGENDS HALL', sub: legend.title });
    setShowTitleAnimation(true); // Legacy

    // Dispatch event to hide sidebars (they will animate out)
    window.dispatchEvent(new CustomEvent('museum-intro-start')); // Triggers sidebar exit

    // Step 2: Wait for curtains to fully open (sidebars animate out over 3.6s)
    await sleep(3600); // Match the sidebar animation duration
    setCurtainState('open');

    // Step 3: Display title for a moment now that it's fully visible
    await sleep(TIMINGS.TITLE_DISPLAY);

    // Step 4: Hide title card
    setShowTitleCard(false);
    setShowTitleAnimation(false); // Legacy

    await sleep(TIMINGS.TITLE_HIDE);

    // Step 5: Enter immersive mode
    setTheaterPhase('immersive');
    setIsTheaterMode(true);
    setIntroComplete(true); // Legacy
    setShowHeaderFooter(true);

    // Start trailer if available
    if (legend.trailerUrl || legend.introVideo) {
      setIsTrailerPlaying(true);
    }

    window.dispatchEvent(new CustomEvent('museum-intro-end')); // Legacy event
  }, []);

  // Exit theater mode
  const exitTheaterMode = useCallback(() => {
    setTheaterPhase('exiting');
    setIsTrailerPlaying(false);
    setTrailerProgress(0);

    // Quick exit - no reverse curtain animation
    setTimeout(() => {
      setIsTheaterMode(false);
      setTheaterPhase('idle');
      setActiveLegend(null);
      setCurtainState('open');
      setIntroComplete(false); // Legacy
      setShowHeaderFooter(false);
      setVideoUrl(null);

      window.dispatchEvent(new CustomEvent('museum-theater-exit'));
    }, TIMINGS.EXIT_FADE);
  }, []);

  // Skip directly to experience (skip trailer)
  const skipToExperience = useCallback(() => {
    setIsTrailerPlaying(false);
    setTrailerProgress(0);
  }, []);

  // Legacy playIntro method for backwards compatibility
  const playIntro = useCallback((item: MuseumItem) => {
    enterTheaterMode(item);
  }, [enterTheaterMode]);

  // Legacy stopIntro
  const stopIntro = useCallback(() => {
    exitTheaterMode();
  }, [exitTheaterMode]);

  // Legacy setSelectedItem
  const setSelectedItem = useCallback((item: MuseumItem | null) => {
    setActiveLegend(item);
    if (item) {
      setVideoUrl(item.introVideo || null);
    } else {
      setVideoUrl(null);
    }
  }, []);

  return (
    <MuseumContext.Provider
      value={{
        // Theater mode
        activeLegend,
        setActiveLegend,
        isTheaterMode,
        theaterPhase,
        curtainState,
        showTitleCard,
        titleCardText,
        isTrailerPlaying,
        trailerProgress,
        setTrailerProgress,
        enterTheaterMode,
        exitTheaterMode,
        skipToExperience,
        // Legacy
        selectedItem: activeLegend,
        playIntro,
        showTitleAnimation,
        introComplete,
        showHeaderFooter,
        setShowHeaderFooter,
        introPlaying,
        setIntroPlaying,
        setSelectedItem,
        videoUrl,
        setShowTitleAnimation,
        setIntroComplete,
        stopIntro,
      }}
    >
      {children}
    </MuseumContext.Provider>
  );
}

export function useMuseum() {
  const context = useContext(MuseumContext);
  if (context === undefined) {
    throw new Error("useMuseum must be used within a MuseumProvider");
  }
  return context;
}
