"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface BackgroundCarouselContextType {
  currentBackground: string;
  isCarouselVisible: boolean;
  setCurrentBackground: (bg: string) => void;
  showCarousel: () => void;
  hideCarousel: () => void;
}

const BackgroundCarouselContext = createContext<BackgroundCarouselContextType | null>(null);

export const useBackgroundCarousel = () => {
  const context = useContext(BackgroundCarouselContext);
  if (!context) {
    throw new Error('useBackgroundCarousel must be used within a BackgroundCarouselProvider');
  }
  return context;
};

interface BackgroundCarouselProviderProps {
  children: ReactNode;
}

export const BackgroundCarouselProvider: React.FC<BackgroundCarouselProviderProps> = ({ children }) => {
  const [currentBackground, setCurrentBackground] = useState('/assets/img/bg1.jpg');
  const [isCarouselVisible, setIsCarouselVisible] = useState(false);

  const showCarousel = () => {
    setIsCarouselVisible(true);
    // Prevent body scrolling when carousel is open
    document.body.style.overflow = 'hidden';
  };
  const hideCarousel = () => {
    setIsCarouselVisible(false);
    // Re-enable body scrolling after animation completes (700ms transition)
    setTimeout(() => {
      document.body.style.overflow = '';
    }, 700);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <BackgroundCarouselContext.Provider value={{
      currentBackground,
      isCarouselVisible,
      setCurrentBackground,
      showCarousel,
      hideCarousel,
    }}>
      {children}
    </BackgroundCarouselContext.Provider>
  );
};