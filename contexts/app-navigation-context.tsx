"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

type AppRoute = 'home' | 'trade' | 'play' | 'p2p' | 'marketplace' | 'casual' | 'launchpad' | 'museum' | 'studio';

interface NavigationState {
  currentRoute: AppRoute;
  isNavigating: boolean;
  navigationDirection: 'forward' | 'backward' | null;
}

interface AppNavigationContextType {
  navigationState: NavigationState;
  navigateToRoute: (route: AppRoute, updateUrl?: boolean) => void;
  getCurrentRoute: () => AppRoute;
}

const AppNavigationContext = createContext<AppNavigationContextType | undefined>(undefined);

// Route hierarchy for animation direction detection
const routeHierarchy: Record<AppRoute, number> = {
  home: 0,
  trade: 1,
  play: 1,
  p2p: 2,
  marketplace: 2,
  casual: 2,
  launchpad: 2,
  museum: 2,
  studio: 2,
};

// Convert pathname to route
const pathnameToRoute = (pathname: string): AppRoute => {
  const pathMap: Record<string, AppRoute> = {
    '/': 'home',
    '/trade': 'trade',
    '/play': 'play',
    '/p2p': 'p2p',
    '/marketplace': 'marketplace',
    '/casual': 'casual',
    '/launchpad': 'launchpad',
    '/museum': 'museum',
    '/studio': 'studio',
  };
  return pathMap[pathname] || 'home';
};

// Convert route to pathname
const routeToPathname = (route: AppRoute): string => {
  const routeMap: Record<AppRoute, string> = {
    home: '/',
    trade: '/trade',
    play: '/play',
    p2p: '/p2p',
    marketplace: '/marketplace',
    casual: '/casual',
    launchpad: '/launchpad',
    museum: '/museum',
    studio: '/studio',
  };
  return routeMap[route];
};

export function AppNavigationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [navigationState, setNavigationState] = useState<NavigationState>({
    currentRoute: pathnameToRoute(pathname),
    isNavigating: false,
    navigationDirection: null,
  });

  // Update navigation state when pathname changes (for browser back/forward)
  useEffect(() => {
    const newRoute = pathnameToRoute(pathname);
    if (newRoute !== navigationState.currentRoute) {
      const currentDepth = routeHierarchy[navigationState.currentRoute];
      const newDepth = routeHierarchy[newRoute];
      const direction = newDepth > currentDepth ? 'forward' : 'backward';
      
      setNavigationState({
        currentRoute: newRoute,
        isNavigating: false,
        navigationDirection: direction,
      });
    }
  }, [pathname, navigationState.currentRoute]);

  const navigateToRoute = useCallback((route: AppRoute, updateUrl: boolean = true) => {
    if (route === navigationState.currentRoute) return;

    const currentDepth = routeHierarchy[navigationState.currentRoute];
    const newDepth = routeHierarchy[route];
    const direction = newDepth > currentDepth ? 'forward' : 'backward';

    setNavigationState({
      currentRoute: route,
      isNavigating: true,
      navigationDirection: direction,
    });

    // Use Next.js router for navigation
    if (updateUrl) {
      const newPathname = routeToPathname(route);
      router.push(newPathname);
    }

    // Reset navigating state after animation completes
    setTimeout(() => {
      setNavigationState(prev => ({ ...prev, isNavigating: false }));
    }, 500); // Match the CSS transition duration
  }, [navigationState.currentRoute, router]);

  const getCurrentRoute = useCallback(() => {
    return navigationState.currentRoute;
  }, [navigationState.currentRoute]);

  return (
    <AppNavigationContext.Provider value={{ navigationState, navigateToRoute, getCurrentRoute }}>
      {children}
    </AppNavigationContext.Provider>
  );
}

export function useAppNavigation() {
  const context = useContext(AppNavigationContext);
  if (context === undefined) {
    throw new Error('useAppNavigation must be used within an AppNavigationProvider');
  }
  return context;
}