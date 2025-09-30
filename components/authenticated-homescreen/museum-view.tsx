"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ChevronDown,
  Sparkles,
  MousePointer,
  Gem,
  Compass,
  Crown,
  PlayCircle,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MediaRenderer } from "@/components/MediaRenderer";
import { legends, museumProgress, type Legend } from "@/components/museum/legend-data";

// Import museum components (to be created)
import { MuseumHeroSection } from "@/components/museum/hero-section";
import { MuseumGallery } from "@/components/museum/gallery-section";
import { LegendDetailModal } from "@/components/museum/legend-detail-modal";

type MuseumViewProps = {
  setViewMode: (mode: string) => void;
};

export function MuseumView({ setViewMode }: MuseumViewProps) {
  const [selectedLegend, setSelectedLegend] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showInteractiveTooltip, setShowInteractiveTooltip] = useState(true);
  const [cursorMode, setCursorMode] = useState<'explore' | 'interact' | 'collect'>('explore');
  const [immersiveMode, setImmersiveMode] = useState(false);
  const [isEntering, setIsEntering] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const entranceRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  // Advanced motion values for cinematic effects
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 700 };
  const mouseXSpring = useSpring(mouseX, springConfig);
  const mouseYSpring = useSpring(mouseY, springConfig);

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Entrance animation - trigger reveal after background transition
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsEntering(false);
    }, isMobile ? 2000 : 3000); // Faster on mobile

    return () => clearTimeout(timer);
  }, [isMobile]);

  // Enhanced mouse tracking for immersive effects (desktop only)
  useEffect(() => {
    if (isMobile) return; // Skip mouse tracking on mobile

    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setMousePosition({ x, y });
      mouseX.set(x);
      mouseY.set(y);

      // Dynamic cursor mode based on elements
      const target = e.target as HTMLElement;
      if (target.closest('[data-interactive]')) {
        setCursorMode('interact');
      } else if (target.closest('[data-collectible]')) {
        setCursorMode('collect');
      } else {
        setCursorMode('explore');
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY, isMobile]);

  // Enhanced scroll tracking
  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        const scrollTop = scrollContainerRef.current.scrollTop;
        setScrollY(scrollTop);
      }
    };

    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Auto-advance carousel
  useEffect(() => {
    if (!isPlaying || selectedLegend || immersiveMode) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % legends.length);
    }, 12000);
    
    return () => clearInterval(interval);
  }, [isPlaying, selectedLegend, immersiveMode]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (selectedLegend) {
        switch (e.key) {
          case 'Escape':
            setSelectedLegend(null);
            break;
          case 'ArrowLeft':
            setCurrentSlide(Math.max(0, currentSlide - 1));
            break;
          case 'ArrowRight':
            setCurrentSlide(Math.min(legends.length - 1, currentSlide + 1));
            break;
          case ' ':
            e.preventDefault();
            setIsPlaying(!isPlaying);
            break;
          case 'f':
            setImmersiveMode(!immersiveMode);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedLegend, currentSlide, isPlaying, immersiveMode]);

  const currentLegend = legends[currentSlide];
  const hasScrolled = scrollY > 100;

  return (
    <div className="fixed inset-0 z-10 overflow-hidden bg-[#0a0a0a]">
      {/* Netflix-style Entrance Sequence */}
      <AnimatePresence>
        {isEntering && (
          <motion.div
            className="fixed inset-0 z-50 bg-[#0a0a0a]"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {/* Clean dark background */}
            <div className="absolute inset-0 bg-[#0a0a0a]" />

            {/* Elegant title reveal */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              >
                <motion.h1
                  className="text-3xl md:text-5xl font-normal text-white mb-4 tracking-tight"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                >
                  Legends Hall
                </motion.h1>
                <motion.p
                  className="text-sm md:text-base text-white/50 font-light"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
                >
                  A Cinematic Journey
                </motion.p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Custom Cursor (Desktop Only) */}
      {!isMobile && (
        <div
          className="fixed w-8 h-8 pointer-events-none z-50 mix-blend-difference transition-all duration-200"
          style={{
            left: mousePosition.x,
            top: mousePosition.y,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className={cn(
            "w-full h-full rounded-full border-2 transition-all duration-200",
            cursorMode === 'explore' ? "border-white scale-100" :
            cursorMode === 'interact' ? "border-blue-400 scale-150" :
            "border-yellow-400 scale-125"
          )} />

          {cursorMode !== 'explore' && (
            <div className="absolute inset-0 flex items-center justify-center">
              {cursorMode === 'interact' ?
                <MousePointer className="w-4 h-4 text-blue-400" /> :
                <Gem className="w-4 h-4 text-yellow-400" />
              }
            </div>
          )}
        </div>
      )}
      
      
      {/* Main Museum Content - Dignified reveal */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: isEntering ? 0 : 1
        }}
        transition={{ 
          duration: 1.2, 
          ease: "linear",
          delay: isEntering ? 0 : 0.2 
        }}
      >
        
        {/* Top Fade Gradient */}
        <div className={`absolute top-16 left-0 right-0 h-8 transition-opacity duration-300 pointer-events-none z-10 ${
          hasScrolled ? 'bg-gradient-to-b from-black/40 to-transparent' : 'opacity-0'
        }`} />
      
      {/* Main Content with Enhanced Parallax */}
      <div 
        ref={scrollContainerRef}
        className="absolute inset-0 overflow-y-auto scrollbar-hide"
      >
        {/* Hero Section */}
        <div ref={entranceRef}>
          <MuseumHeroSection
            currentLegend={currentLegend}
            currentSlide={currentSlide}
            setCurrentSlide={setCurrentSlide}
            legends={legends}
            isPlaying={isPlaying}
            isMuted={isMuted}
            mousePosition={mousePosition}
            onSelectLegend={setSelectedLegend}
            scrollContainerRef={scrollContainerRef}
            isMobile={isMobile}
          />
        </div>

        {/* Gallery Section */}
        <div ref={galleryRef}>
          <MuseumGallery
            legends={legends}
            onSelectLegend={setSelectedLegend}
            isMobile={isMobile}
          />
        </div>
        
        {/* Bottom padding */}
        <div className="h-32 bg-black" />
      </div>
      
      {/* Legend Detail Modal */}
      <AnimatePresence>
        {selectedLegend && (
          <LegendDetailModal
            legend={legends.find(l => l.id === selectedLegend)!}
            onClose={() => setSelectedLegend(null)}
            isMuted={isMuted}
            setIsMuted={setIsMuted}
            immersiveMode={immersiveMode}
            setImmersiveMode={setImmersiveMode}
            mousePosition={mousePosition}
            isMobile={isMobile}
          />
        )}
      </AnimatePresence>
      
      </motion.div>
    </div>
  );
}