"use client";

import React, { forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Crown,
  ArrowLeft,
  ArrowRight,
  PlayCircle,
  Gem,
  ChevronDown,
  Sparkles,
  Target,
  Flame
} from "lucide-react";
import { MediaRenderer } from "@/components/MediaRenderer";
import { type Legend } from "./legend-data";

interface MuseumHeroSectionProps {
  currentLegend: Legend;
  currentSlide: number;
  setCurrentSlide: (slide: number) => void;
  legends: Legend[];
  isPlaying: boolean;
  isMuted: boolean;
  mousePosition: { x: number; y: number };
  onSelectLegend: (id: string) => void;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  isMobile: boolean;
}

export const MuseumHeroSection = forwardRef<HTMLDivElement, MuseumHeroSectionProps>(
  ({
    currentLegend,
    currentSlide,
    setCurrentSlide,
    legends,
    mousePosition,
    onSelectLegend,
    scrollContainerRef,
    isMobile
  }, ref) => {
    
    return (
      <section ref={ref} className="relative h-screen overflow-hidden bg-[#0a0a0a]">
        
        {/* Hero Carousel with Netflix-level Transitions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`hero-${currentSlide}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "linear" }}
            className="absolute inset-0"
          >
            {/* Background with Depth */}
            <div className="absolute inset-0">
              <motion.video
                autoPlay
                muted
                loop
                className="w-full h-full object-cover"
                initial={{ opacity: 0.8 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, ease: "linear" }}
              >
                <source src={currentLegend.heroVideo} type="video/mp4" />
              </motion.video>
              
              {/* Clean Netflix-style Overlays */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
            </div>
            
            {/* Hero Content with Advanced Typography */}
            <div className="absolute inset-0 flex items-center" style={{ paddingTop: isMobile ? '64px' : '128px' }}>
              <div className="px-4 md:px-16 max-w-8xl mx-auto w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 items-center">
                  {/* Text Content */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.8, ease: "linear" }}
                    className="order-2 lg:order-1"
                  >
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
                      className="mb-4 md:mb-6"
                    >
                      <span className="text-xs md:text-sm text-white/40 font-light tracking-wide uppercase">
                        {currentLegend.category}
                      </span>
                    </motion.div>

                    <motion.h1
                      className="text-4xl md:text-6xl lg:text-7xl font-medium text-white mb-4 md:mb-6 leading-tight tracking-tight"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
                    >
                      {currentLegend.name}
                    </motion.h1>

                    <motion.p
                      className="text-lg md:text-xl lg:text-2xl font-light mb-6 md:mb-10 leading-relaxed text-white/60"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
                    >
                      {currentLegend.title}
                    </motion.p>

                    <motion.p
                      className="text-sm md:text-base lg:text-lg text-white/50 mb-8 md:mb-12 max-w-2xl leading-relaxed font-light"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                    >
                      {currentLegend.story.heroLine}
                    </motion.p>
                    
                    {/* Minimal Stats Display - Grayscale */}
                    <motion.div
                      className="flex gap-6 md:gap-12 mb-8 md:mb-12"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
                    >
                      {Object.entries(currentLegend.stats).slice(0, 3).map(([key, value], index) => (
                        <motion.div
                          key={key}
                          className="group"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.7 + index * 0.1, duration: 0.6, ease: "easeOut" }}
                        >
                          <p className="text-white/30 text-xs md:text-sm font-light mb-1 uppercase tracking-wide">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </p>
                          <p className="text-white/70 text-base md:text-xl font-medium">
                            {value}
                          </p>
                        </motion.div>
                      ))}
                    </motion.div>
                    
                    {/* Clean Action Buttons - Grayscale with Green Accent */}
                    <motion.div
                      className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7, duration: 0.8, ease: "easeOut" }}
                    >
                      <Button
                        size={isMobile ? "default" : "lg"}
                        className="w-full md:w-auto font-medium px-6 md:px-8 py-3 md:py-3 text-sm md:text-base bg-white text-[#0a0a0a] hover:bg-white/90 rounded-md transition-colors"
                        onClick={() => onSelectLegend(currentLegend.id)}
                        data-interactive="true"
                      >
                        <PlayCircle className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                        <span>Explore Story</span>
                      </Button>

                      <Button
                        variant="outline"
                        size={isMobile ? "default" : "lg"}
                        className="w-full md:w-auto border-white/10 text-white/70 hover:bg-white/5 hover:border-white/20 font-medium px-6 md:px-8 py-3 md:py-3 text-sm md:text-base rounded-md transition-colors"
                        data-collectible="true"
                      >
                        <span>More Info</span>
                      </Button>
                    </motion.div>
                  </motion.div>
                  
                  {/* Interactive Portrait */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 1, ease: "linear" }}
                    className="relative group order-1 lg:order-2 flex justify-center lg:justify-end"
                  >
                    <div className="relative">
                      {/* Clean Portrait Display */}
                      <div className="w-[240px] h-[320px] md:w-[380px] md:h-[480px] lg:w-[420px] lg:h-[540px] rounded-lg overflow-hidden shadow-2xl relative">
                        <MediaRenderer
                          src={currentLegend.portrait}
                          alt={currentLegend.name}
                          className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-90"
                          aspectRatio="auto"
                        />

                        {/* Minimal overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      </div>

                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        
        {/* Minimal Carousel Controls - Subtle */}
        <div className="absolute bottom-6 md:bottom-12 right-4 md:right-16 flex items-center gap-3">
          {/* Progress Indicators */}
          <div className="flex gap-2">
            {legends.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className="relative overflow-hidden transition-all duration-300"
                style={{
                  width: index === currentSlide ? '32px' : '8px',
                  height: '2px',
                  backgroundColor: index === currentSlide ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.15)'
                }}
              />
            ))}
          </div>
        </div>
        
      </section>
    );
  }
);