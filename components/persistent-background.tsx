"use client";

import React, { createContext, useContext, useRef, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useBackgroundCarousel } from "@/contexts/background-carousel-context";
import { useChat } from "@/contexts/chat-context";
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
  const { currentBackground, overlayBackground, isLoadingPreference } = useBackgroundCarousel();
  const { isMobileOverlayOpen } = useChat();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [previousPath, setPreviousPath] = useState<string | null>(null);
  const [navigationDirection, setNavigationDirection] = useState<'forward' | 'backward' | null>(null);
  
  // Convert pathname to route type
  const getCurrentRoute = () => {
    if (pathname === '/') return 'home';
    if (pathname === '/lootboxes/reveal') return 'lootboxes-reveal'; // Reveal page has its own background handling
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
      'lootboxes-reveal': 2,
      p2p: 2,
      'p2p-collections': 3,
      'p2p-collection-browse': 4,
      'p2p-conversation': 4,
      marketplace: 2,
      casual: 2,
      drops: 2,
      museum: 2,
      studio: 2,
      lists: 2,
      'control-center': 2,
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

  // Calculate zoom, blur, brightness, and saturation based on current route
  // Using CSS filters instead of black overlays maintains visual connection while reducing distraction
  // NOTE: blur must be in the inline filter string (not Tailwind class) because CSS filter property can only be set once
  const getBackgroundStyles = () => {
    let scale = 'scale-100';
    let blur = 0; // in pixels
    let brightness = 1;
    let saturation = 1;

    // Brightness/saturation guide:
    // - 1.0 = full brightness/color (home)
    // - 0.5-0.7 = slightly dimmed (shallow pages)
    // - Deep pages: fully desaturated (0) and very dark (0.15-0.25)
    // Blur guide: 0=none, 4=sm, 8=md, 12=lg, 24=xl
    switch(currentRoute) {
      case 'home':
        scale = 'scale-100';
        blur = 0;
        brightness = 1;
        saturation = 1;
        break;
      case 'trade':
      case 'play':
      case 'profile':
        scale = 'scale-110';
        blur = 4;
        brightness = 0.5;
        saturation = 0.4;
        break;
      case 'lootboxes':
        scale = 'scale-110';
        blur = 12;
        brightness = 0.2;
        saturation = 0;
        break;
      case 'lootboxes-reveal':
        scale = 'scale-125';
        blur = 8;
        brightness = 0.25;
        saturation = 0;
        break;
      case 'p2p':
        scale = 'scale-150';
        blur = 12;
        brightness = 0.25;
        saturation = 0;
        break;
      case 'p2p-collections':
        scale = 'scale-150';
        blur = 24;
        brightness = 0.2;
        saturation = 0;
        break;
      case 'p2p-collection-browse':
        scale = 'scale-150';
        blur = 24;
        brightness = 0.15;
        saturation = 0;
        break;
      case 'p2p-conversation':
        scale = 'scale-150';
        blur = 12;
        brightness = 0.15;
        saturation = 0;
        break;
      case 'lists':
        scale = 'scale-125';
        blur = 12;
        brightness = 0.2;
        saturation = 0;
        break;
      case 'marketplace':
      case 'casual':
      case 'drops':
      case 'studio':
      case 'control-center':
        scale = 'scale-125';
        blur = 12;
        brightness = 0.2;
        saturation = 0;
        break;
      case 'museum':
        scale = 'scale-95';
        blur = 24;
        brightness = 0.15;
        saturation = 0;
        break;
      case 'studio-new':
        scale = 'scale-95';
        blur = 24;
        brightness = 0.15;
        saturation = 0;
        break;
      default:
        scale = 'scale-100';
        blur = 0;
        brightness = 1;
        saturation = 1;
    }

    // Override when mobile chat overlay is open
    if (isMobileOverlayOpen) {
      scale = 'scale-110';
      blur = 16;
      brightness = 0.4;
      saturation = 0.3;
    }

    return { scale, blur, brightness, saturation };
  };

  const { scale, blur, brightness, saturation } = getBackgroundStyles();

  // Build the combined filter string
  const filterString = blur > 0
    ? `blur(${blur}px) brightness(${brightness}) saturate(${saturation})`
    : `brightness(${brightness}) saturate(${saturation})`;

  return (
    <BackgroundContext.Provider value={{ 
      isNavigatingForward: navigationDirection === 'forward', 
      setIsNavigatingForward: () => {},
      previousPath: previousPath 
    }}>
      {/* Fixed background layer - bg-neutral-950 as fallback during loading */}
      <div className="fixed inset-0 z-0 bg-neutral-950">
        {/* Persistent background with animations - fade in after preference loads */}
        {/* Using CSS filters (brightness/saturate) instead of black overlays to maintain visual depth */}
        <div className={`absolute inset-0 transition-opacity duration-500 ${isLoadingPreference ? 'opacity-0' : 'opacity-100'}`}>
          {isVideoBackground ? (
            <video
              ref={videoRef}
              src={currentBackground}
              className={`w-full h-full object-cover transition-all duration-500 ${scale}`}
              style={{
                filter: filterString,
                transition: 'filter 500ms ease-out, transform 500ms ease-out'
              }}
              autoPlay
              muted
              loop
              playsInline
              crossOrigin="anonymous"
              preload="metadata"
              onError={() => {
                console.warn('Video failed to load:', currentBackground);
              }}
            />
          ) : (
            <MediaRenderer
              src={currentBackground}
              alt="Background"
              className={`w-full h-full object-cover transition-all duration-500 ${scale}`}
              style={{
                filter: filterString,
                transition: 'filter 500ms ease-out, transform 500ms ease-out'
              }}
            />
          )}
          {/* Subtle vignette gradient for depth - not a flat overlay */}
          <div className={`absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/30 transition-opacity duration-500 ${
            currentRoute === 'home' ? 'opacity-0' : 'opacity-100'
          }`} />
          {/* Bottom fade for content readability */}
          <div className={`absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent transition-opacity duration-500 ${
            currentRoute === 'home' ? 'opacity-0' : 'opacity-60'
          }`} />
        </div>
      </div>

      {/* Collection Banner Overlay - sits above the regular background */}
      {/* Uses same brightness/saturation approach for consistency */}
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
            <div
              className="absolute inset-0"
              style={{
                filter: filterString,
                transition: 'filter 500ms ease-out'
              }}
            >
              <MediaRenderer
                src={overlayBackground}
                alt="Collection Banner"
                className="w-full h-full object-cover scale-110"
              />
            </div>
            {/* Subtle vignette for depth */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/30" />
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