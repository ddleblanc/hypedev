"use client";

import React, { createContext, useContext, useState } from "react";

interface MuseumItem {
  id: string;
  title: string;
  subtitle: string;
  thumbnail: string;
  introVideo: string;
}

interface MuseumContextType {
  // UI State
  showHeaderFooter: boolean;
  setShowHeaderFooter: (show: boolean) => void;
  introComplete: boolean;
  setIntroComplete: (complete: boolean) => void;

  // Intro Video State
  introPlaying: boolean;
  setIntroPlaying: (playing: boolean) => void;
  selectedItem: MuseumItem | null;
  setSelectedItem: (item: MuseumItem | null) => void;
  videoUrl: string | null;

  // Title animation state
  showTitleAnimation: boolean;
  setShowTitleAnimation: (show: boolean) => void;

  // Helper to start intro
  playIntro: (item: MuseumItem) => void;
  stopIntro: () => void;
}

const MuseumContext = createContext<MuseumContextType | undefined>(undefined);

export function MuseumProvider({ children }: { children: React.ReactNode }) {
  const [showHeaderFooter, setShowHeaderFooter] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const [introPlaying, setIntroPlaying] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MuseumItem | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [showTitleAnimation, setShowTitleAnimation] = useState(false);

  const playIntro = (item: MuseumItem) => {
    setSelectedItem(item);
    setVideoUrl(item.introVideo);
    setIntroComplete(false);
    setShowHeaderFooter(false);

    // Show title animation immediately
    setShowTitleAnimation(true);

    // Dispatch event to hide sidebars
    window.dispatchEvent(new CustomEvent('museum-intro-start'));

    // Hide title animation after 3 seconds
    setTimeout(() => {
      setShowTitleAnimation(false);
    }, 3000);

    // After title animation and sidebar close, show content page
    setTimeout(() => {
      setIntroComplete(true);
      setShowHeaderFooter(true);
      window.dispatchEvent(new CustomEvent('museum-intro-end'));
    }, 4000);
  };

  const stopIntro = () => {
    setIntroPlaying(false);
    setVideoUrl(null);
    // After a brief delay, show header/footer and mark as complete
    setTimeout(() => {
      setIntroComplete(true);
      setShowHeaderFooter(true);
      // Dispatch event to show header/footer
      window.dispatchEvent(new CustomEvent('museum-intro-end'));
    }, 500);
  };

  return (
    <MuseumContext.Provider
      value={{
        showHeaderFooter,
        setShowHeaderFooter,
        introComplete,
        setIntroComplete,
        introPlaying,
        setIntroPlaying,
        selectedItem,
        setSelectedItem,
        videoUrl,
        showTitleAnimation,
        setShowTitleAnimation,
        playIntro,
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
