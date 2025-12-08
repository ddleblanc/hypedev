"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import type { HomepageMode, HomepageModeState } from '@/types/homepage';

interface HomepageModeContextType {
  state: HomepageModeState;
  setMode: (mode: HomepageMode) => void;
  toggleMode: () => void;
}

const HomepageModeContext = createContext<HomepageModeContextType | undefined>(undefined);

// Session storage keys
const SESSION_KEY_VISITED = 'hypedev-session-active';
const SESSION_KEY_MODE = 'hypedev-homepage-mode';
const SESSION_KEY_NAVIGATED = 'hypedev-has-navigated';

// SSR-safe sessionStorage helpers
const getSessionItem = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(key);
};

const setSessionItem = (key: string, value: string): void => {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(key, value);
};

export function HomepageModeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const previousPathname = useRef<string | null>(null);
  const isInitialized = useRef(false);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [state, setState] = useState<HomepageModeState>({
    mode: 'traditional',
    isFirstLoad: true,
    isTransitioning: false,
  });

  // Initialize on mount - detect fresh load vs returning
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    // Check if this is a fresh session (new tab/window)
    const hasActiveSession = getSessionItem(SESSION_KEY_VISITED);
    const savedMode = getSessionItem(SESSION_KEY_MODE) as HomepageMode | null;
    const hasNavigatedBefore = getSessionItem(SESSION_KEY_NAVIGATED);

    if (!hasActiveSession) {
      // Fresh page load - always start with traditional
      setSessionItem(SESSION_KEY_VISITED, 'true');
      setSessionItem(SESSION_KEY_MODE, 'traditional');
      setState({
        mode: 'traditional',
        isFirstLoad: true,
        isTransitioning: false,
      });
    } else if (hasNavigatedBefore && savedMode === 'hud') {
      // Returning to home after navigating - show HUD
      setState({
        mode: 'hud',
        isFirstLoad: false,
        isTransitioning: false,
      });
    } else if (savedMode) {
      // Restore saved mode preference
      setState({
        mode: savedMode,
        isFirstLoad: false,
        isTransitioning: false,
      });
    }
  }, []);

  // Track navigation - when user leaves home and comes back
  useEffect(() => {
    // Skip initial mount
    if (previousPathname.current === null) {
      previousPathname.current = pathname;
      return;
    }

    const wasOnHome = previousPathname.current === '/';
    const isOnHome = pathname === '/';
    const leftHome = wasOnHome && !isOnHome;
    const returnedHome = !wasOnHome && isOnHome;

    if (leftHome) {
      // User navigated away from home - mark that they've navigated
      setSessionItem(SESSION_KEY_NAVIGATED, 'true');
    }

    if (returnedHome) {
      // User returned to home from another page - switch to HUD
      const hasNavigated = getSessionItem(SESSION_KEY_NAVIGATED);
      if (hasNavigated) {
        setState(prev => ({
          ...prev,
          mode: 'hud',
          isFirstLoad: false,
        }));
        setSessionItem(SESSION_KEY_MODE, 'hud');
      }
    }

    previousPathname.current = pathname;
  }, [pathname]);

  const setMode = useCallback((mode: HomepageMode) => {
    setState(prev => ({ ...prev, isTransitioning: true }));

    // Clear any existing timeout to prevent memory leaks
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }

    // Small delay for transition animation
    transitionTimeoutRef.current = setTimeout(() => {
      setState({
        mode,
        isFirstLoad: false,
        isTransitioning: false,
      });
      setSessionItem(SESSION_KEY_MODE, mode);
      transitionTimeoutRef.current = null;
    }, 50);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  const toggleMode = useCallback(() => {
    const newMode = state.mode === 'traditional' ? 'hud' : 'traditional';
    setMode(newMode);
  }, [state.mode, setMode]);

  return (
    <HomepageModeContext.Provider value={{ state, setMode, toggleMode }}>
      {children}
    </HomepageModeContext.Provider>
  );
}

export function useHomepageMode() {
  const context = useContext(HomepageModeContext);
  if (context === undefined) {
    throw new Error('useHomepageMode must be used within a HomepageModeProvider');
  }
  return context;
}

// Helper hook for components that just need the current mode
export function useCurrentHomepageMode(): HomepageMode {
  const { state } = useHomepageMode();
  return state.mode;
}
