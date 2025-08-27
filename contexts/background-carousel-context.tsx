"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

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
  };
  const hideCarousel = () => {
    // Small delay to allow carousel to slide out, then hide it completely
    setTimeout(() => {
      setIsCarouselVisible(false);
    }, 200);
  };

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