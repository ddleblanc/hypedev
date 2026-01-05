"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@/contexts/auth-context';

interface BackgroundCarouselContextType {
  currentBackground: string;
  overlayBackground: string | null;
  isCarouselVisible: boolean;
  isLoadingPreference: boolean;
  setCurrentBackground: (bg: string) => void;
  setOverlayBackground: (bg: string | null) => void;
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

const DEFAULT_BACKGROUND = '/assets/img/bg1.jpg';

export const BackgroundCarouselProvider: React.FC<BackgroundCarouselProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [currentBackground, setCurrentBackgroundState] = useState(DEFAULT_BACKGROUND);
  const [overlayBackground, setOverlayBackground] = useState<string | null>(null);
  const [isCarouselVisible, setIsCarouselVisible] = useState(false);
  const [isLoadingPreference, setIsLoadingPreference] = useState(true);
  const [hasLoadedPreference, setHasLoadedPreference] = useState(false);

  // Fetch saved wallpaper preference on mount when user is authenticated
  useEffect(() => {
    const fetchWallpaperPreference = async () => {
      console.log('[Wallpaper] Fetch effect running, user?.id:', user?.id, 'hasLoadedPreference:', hasLoadedPreference);

      if (!user?.id) {
        setIsLoadingPreference(false);
        return;
      }

      // Only fetch once per user session
      if (hasLoadedPreference) return;

      try {
        console.log('[Wallpaper] Fetching preference for user:', user.id);
        const response = await fetch(`/api/preferences?userId=${user.id}&category=background`);
        const data = await response.json();
        console.log('[Wallpaper] Fetch response:', data);

        if (data.success && data.preference?.value) {
          console.log('[Wallpaper] Setting background to:', data.preference.value);
          setCurrentBackgroundState(data.preference.value);
        } else {
          console.log('[Wallpaper] No saved preference found, using default');
        }
      } catch (error) {
        console.error('[Wallpaper] Error fetching preference:', error);
      } finally {
        setIsLoadingPreference(false);
        setHasLoadedPreference(true);
      }
    };

    fetchWallpaperPreference();
  }, [user?.id, hasLoadedPreference]);

  // Reset loaded state when user changes (logout/login different account)
  useEffect(() => {
    if (!user?.id) {
      setHasLoadedPreference(false);
      setCurrentBackgroundState(DEFAULT_BACKGROUND);
    }
  }, [user?.id]);

  // Persist wallpaper changes to database
  const setCurrentBackground = useCallback(async (bg: string) => {
    console.log('[Wallpaper] setCurrentBackground called with:', bg, 'user?.id:', user?.id);

    // Update UI immediately for responsive feel
    setCurrentBackgroundState(bg);

    // Persist to database if user is authenticated
    if (user?.id) {
      try {
        console.log('[Wallpaper] Saving preference to database...');
        const response = await fetch('/api/preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            category: 'background',
            value: bg,
          }),
        });
        const data = await response.json();
        console.log('[Wallpaper] Save response:', data);
      } catch (error) {
        console.error('[Wallpaper] Error saving preference:', error);
        // Don't revert UI on error - background is already set locally
      }
    } else {
      console.log('[Wallpaper] Not saving - user not authenticated');
    }
  }, [user?.id]);

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
      overlayBackground,
      isCarouselVisible,
      isLoadingPreference,
      setCurrentBackground,
      setOverlayBackground,
      showCarousel,
      hideCarousel,
    }}>
      {children}
    </BackgroundCarouselContext.Provider>
  );
};
