"use client";

import React, { createContext, useContext, useRef, useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useBackgroundCarousel } from "@/contexts/background-carousel-context";

interface BackgroundContextType {
  isNavigatingForward: boolean;
  setIsNavigatingForward: (value: boolean) => void;
  previousPath: string | null;
}

const BackgroundContext = createContext<BackgroundContextType>({
  isNavigatingForward: false,
  setIsNavigatingForward: () => {},
  previousPath: null,
});

export function useBackgroundAnimation() {
  return useContext(BackgroundContext);
}

export function PersistentBackground({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentBackground } = useBackgroundCarousel();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [previousPath, setPreviousPath] = useState<string | null>(null);
  const [navigationDirection, setNavigationDirection] = useState<'forward' | 'backward' | null>(null);
  
  // Convert pathname to route type
  const getCurrentRoute = () => {
    if (pathname === '/') return 'home';
    const route = pathname.split('/')[1];
    return route || 'home';
  };
  
  const currentRoute = getCurrentRoute();

  // Check if current background is a video (local files or URLs)
  const isVideoBackground = (() => {
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
    const lowercaseSrc = currentBackground.toLowerCase();
    
    // Check for video file extensions
    if (videoExtensions.some(ext => lowercaseSrc.includes(ext))) {
      return true;
    }
    
    // Check for video-related keywords in URL
    if (lowercaseSrc.includes('video') || lowercaseSrc.includes('webm') || lowercaseSrc.includes('mp4')) {
      return true;
    }
    
    return false;
  })();

  // Determine navigation direction based on route depth
  useEffect(() => {
    const routeHierarchy: Record<string, number> = {
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
    
    if (previousPath && previousPath !== pathname) {
      const prevRoute = previousPath === '/' ? 'home' : previousPath.split('/')[1] || 'home';
      const currentDepth = routeHierarchy[currentRoute] || 0;
      const prevDepth = routeHierarchy[prevRoute] || 0;
      
      setNavigationDirection(currentDepth > prevDepth ? 'forward' : 'backward');
    }
    
    setPreviousPath(pathname);
  }, [pathname, previousPath, currentRoute]);
  
  // Handle video pause/play based on current route
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideoBackground) return;

    if (currentRoute === 'home') {
      video.play().catch(console.error);
    } else {
      video.pause();
    }
  }, [currentRoute, isVideoBackground]);

  // Handle video background change - ensure video starts playing when selected
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideoBackground) return;

    // When a video background is selected, start playing if on home screen
    if (currentRoute === 'home') {
      video.play().catch(console.error);
    }
  }, [currentBackground, isVideoBackground, currentRoute]);

  // Calculate zoom and blur based on current route
  const getBackgroundStyles = () => {
    let scale = 'scale-100';
    let blur = 'blur-none';
    
    switch(currentRoute) {
      case 'trade':
      case 'play':
        scale = 'scale-110';
        blur = 'blur-sm';
        break;
      case 'p2p':
        scale = 'scale-150';
        blur = 'blur-lg';
        break;
      case 'marketplace':
      case 'casual':
      case 'launchpad':
      case 'museum':
      case 'studio':
        scale = 'scale-125';
        blur = 'blur-md';
        break;
      default:
        scale = 'scale-100';
        blur = 'blur-none';
    }
    
    return { scale, blur };
  };

  const { scale, blur } = getBackgroundStyles();

  return (
    <BackgroundContext.Provider value={{ 
      isNavigatingForward: navigationDirection === 'forward', 
      setIsNavigatingForward: () => {},
      previousPath: previousPath 
    }}>
      {/* Fixed background layer */}
      <div className="fixed inset-0 z-0">
        {/* Persistent background with animations */}
        <div className="absolute inset-0 animate-[fadeIn_0.5s_ease-out]">
          {isVideoBackground ? (
            <video
              ref={videoRef}
              src={currentBackground}
              className={`w-full h-full object-cover transition-all duration-500 ${scale} ${blur}`}
              autoPlay
              muted
              loop
              playsInline
              crossOrigin="anonymous"
              preload="metadata"
              onError={() => {
                console.warn('Video failed to load:', currentBackground);
                // Fallback could be implemented here if needed
              }}
            />
          ) : (
            <Image
              src={currentBackground}
              alt="Background"
              fill
              className={`object-cover transition-all duration-500 ${scale} ${blur}`}
              priority
            />
          )}
          <div className={`absolute inset-0 transition-all duration-500 ${
            currentRoute === 'p2p' ? 'bg-black/80' :
            currentRoute === 'marketplace' || 
            currentRoute === 'casual' || currentRoute === 'launchpad' || 
            currentRoute === 'museum' || currentRoute === 'studio' 
              ? 'bg-black/70' : 'bg-black/40'
          }`} />
          {/* Special fade-to-black overlay for marketplace and casual views */}
          <div className={`absolute inset-0 bg-black transition-all duration-1000 ${
            currentRoute === 'p2p' ? 'opacity-70' :
            currentRoute === 'marketplace' || currentRoute === 'casual' || 
            currentRoute === 'launchpad' || currentRoute === 'museum' || 
            currentRoute === 'studio' 
              ? (currentRoute === 'museum' ? 'opacity-100' : 'opacity-60') 
              : 'opacity-0'
          }`} />
          <div className={`absolute inset-0 bg-gradient-to-br from-transparent via-black/20 to-black/60 transition-all duration-500 ${
            currentRoute === 'trade' ? 'opacity-80' : 
            currentRoute === 'play' ? 'opacity-80' : 
            currentRoute === 'p2p' ? 'opacity-95' : 
            currentRoute === 'marketplace' ? 'opacity-90' : 
            currentRoute === 'casual' ? 'opacity-90' : 
            currentRoute === 'launchpad' ? 'opacity-90' : 
            currentRoute === 'museum' ? 'opacity-0' : 
            currentRoute === 'studio' ? 'opacity-90' : 'opacity-100'
          }`} />
        </div>
      </div>
      
      {/* Scrollable content layer */}
      <div className="relative z-10 min-h-screen">
        {children}
      </div>
    </BackgroundContext.Provider>
  );
}