"use client";

import React, { createContext, useContext, useRef, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useBackgroundCarousel } from "@/contexts/background-carousel-context";
import { MediaRenderer } from "@/components/media-renderer";
import { motion, AnimatePresence } from "framer-motion";

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
  const { currentBackground, overlayBackground } = useBackgroundCarousel();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [previousPath, setPreviousPath] = useState<string | null>(null);
  const [navigationDirection, setNavigationDirection] = useState<'forward' | 'backward' | null>(null);
  
  // Convert pathname to route type
  const getCurrentRoute = () => {
    if (pathname === '/') return 'home';
    if (pathname === '/lootboxes' || pathname.startsWith('/lootboxes/')) return 'lootboxes';

    // P2P route detection
    if (pathname === '/p2p/collections') return 'p2p-collections';
    if (pathname.startsWith('/p2p/collections/')) return 'p2p-collection-browse';
    if (pathname.startsWith('/p2p/')) return 'p2p-conversation';
    if (pathname === '/p2p') return 'p2p';

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
      lootboxes: 1,
      p2p: 2,
      'p2p-collections': 3,
      'p2p-collection-browse': 4,
      'p2p-conversation': 4,
      marketplace: 2,
      casual: 2,
      launchpad: 2,
      museum: 2,
      studio: 2,
      lists: 2,
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
      case 'profile':
        scale = 'scale-110';
        blur = 'blur-sm';
        break;
      case 'lootboxes':
        scale = 'scale-110';
        blur = 'blur-sm';
        break;
      case 'p2p':
        scale = 'scale-150';
        blur = 'blur-lg';
        break;
      case 'p2p-collections':
        scale = 'scale-150'; // Keep same zoom as p2p hub
        blur = 'blur-xl'; // Deeper blur for collections list
        break;
      case 'p2p-collection-browse':
        scale = 'scale-150'; // Keep same base zoom
        blur = 'blur-xl'; // Keep same blur (overlay will be on top)
        break;
      case 'p2p-conversation':
        scale = 'scale-150';
        blur = 'blur-lg';
        break;
      case 'lists':
        scale = 'scale-125';
        blur = 'blur-md';
        break;
      case 'marketplace':
      case 'casual':
      case 'launchpad':
      case 'studio':
        scale = 'scale-125';
        blur = 'blur-md';
        break;
      case 'museum':
        scale = 'scale-95';
        blur = 'blur-xl';
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
            <MediaRenderer
              src={currentBackground}
              alt="Background"
              className={`w-full h-full object-cover transition-all duration-500 ${scale} ${blur}`}
            />
          )}
          <div className={`absolute inset-0 transition-all duration-500 ${
            currentRoute === 'p2p' ? 'bg-black/40' :
            currentRoute === 'p2p-collections' ? 'bg-black/60' :
            currentRoute === 'p2p-collection-browse' ? 'bg-black/60' :
            currentRoute === 'p2p-conversation' ? 'bg-black/80' :
            currentRoute === 'museum' ? 'bg-black/85' :
            currentRoute === 'marketplace' ||
            currentRoute === 'casual' || currentRoute === 'launchpad' ||
            currentRoute === 'studio' || currentRoute === 'lists'
              ? 'bg-black/70' : 'bg-black/40'
          }`} />
          {/* Special fade-to-black overlay for marketplace and casual views */}
          <div className={`absolute inset-0 bg-black transition-all duration-1000 ${
            currentRoute === 'p2p' ? 'opacity-0' :
            currentRoute === 'p2p-collections' ? 'opacity-40' :
            currentRoute === 'p2p-collection-browse' ? 'opacity-50' :
            currentRoute === 'p2p-conversation' ? 'opacity-70' :
            currentRoute === 'marketplace' || currentRoute === 'casual' ||
            currentRoute === 'launchpad' ||
            currentRoute === 'studio' || currentRoute === 'lists'
              ? 'opacity-60'
              : 'opacity-0'
          }`} />
          <div className={`absolute inset-0 bg-gradient-to-br from-transparent via-black/20 to-black/60 transition-all duration-500 ${
            currentRoute === 'trade' ? 'opacity-80' :
            currentRoute === 'play' ? 'opacity-80' :
            currentRoute === 'p2p' ? 'opacity-80' :
            currentRoute === 'p2p-collections' ? 'opacity-90' :
            currentRoute === 'p2p-collection-browse' ? 'opacity-85' :
            currentRoute === 'p2p-conversation' ? 'opacity-95' :
            currentRoute === 'marketplace' ? 'opacity-90' :
            currentRoute === 'casual' ? 'opacity-90' :
            currentRoute === 'launchpad' ? 'opacity-90' :
            currentRoute === 'studio' ? 'opacity-90' :
            currentRoute === 'lists' ? 'opacity-90' : 'opacity-100'
          }`} />
        </div>
      </div>
      
      {/* Lootbox Black Overlay - sits above the regular background */}
      {currentRoute === 'lootboxes' && (
        <div className="fixed inset-0 z-5 bg-black transition-all duration-1000" />
      )}

      {/* Collection Banner Overlay - sits above the regular background */}
      <AnimatePresence>
        {overlayBackground && currentRoute === 'p2p-collection-browse' && (
          <motion.div
            key="collection-overlay"
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: 1, scale: 1.1 }}
            exit={{ opacity: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] }}
            className="fixed inset-0 z-5 overflow-hidden"
          >
            <div className="absolute inset-0 blur-sm">
              <MediaRenderer
                src={overlayBackground}
                alt="Collection Banner"
                className="w-full h-full object-cover scale-110"
              />
            </div>
            {/* Match the darkness of base background */}
            <div className="absolute inset-0 bg-black/60" />
            <div className="absolute inset-0 bg-black opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-black/20 to-black/60 opacity-85" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scrollable content layer */}
      <div className="relative z-10 min-h-screen">
        {children}
      </div>
    </BackgroundContext.Provider>
  );
}