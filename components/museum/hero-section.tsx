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
}

export const MuseumHeroSection = forwardRef<HTMLDivElement, MuseumHeroSectionProps>(
  ({ 
    currentLegend, 
    currentSlide, 
    setCurrentSlide, 
    legends, 
    mousePosition, 
    onSelectLegend,
    scrollContainerRef 
  }, ref) => {
    
    return (
      <section ref={ref} className="relative h-screen overflow-hidden bg-black">
        
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
              
              {/* Layered Cinematic Overlays */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/50 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-black/20 to-black/60" />
              
              {/* Dynamic Mouse-Responsive Overlay */}
              <motion.div
                className="absolute inset-0 opacity-20"
                style={{
                  background: `radial-gradient(800px circle at ${mousePosition.x}% ${mousePosition.y}%, ${currentLegend.color}40, transparent 50%)`
                }}
              />
            </div>
            
            {/* Hero Content with Advanced Typography */}
            <div className="absolute inset-0 flex items-center" style={{ paddingTop: '128px' }}>
              <div className="px-16 max-w-8xl mx-auto w-full">
                <div className="grid grid-cols-2 gap-20 items-center">
                  {/* Text Content */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.8, ease: "linear" }}
                  >
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.6, ease: "linear" }}
                    >
                      <Badge 
                        className="mb-8 text-lg font-bold px-6 py-3 backdrop-blur-sm"
                        style={{ 
                          backgroundColor: `${currentLegend.color}20`, 
                          color: currentLegend.color, 
                          borderColor: `${currentLegend.color}40` 
                        }}
                      >
                        <Crown className="w-5 h-5 mr-3" />
                        {currentLegend.category} • {currentLegend.impact} • {currentLegend.era}
                      </Badge>
                    </motion.div>
                    
                    <motion.h1 
                      className="text-7xl font-light text-white mb-8 leading-none tracking-wide"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4, duration: 0.8, ease: "linear" }}
                    >
                      {currentLegend.name}
                    </motion.h1>
                    
                    <motion.p 
                      className="text-3xl font-normal mb-12 leading-tight text-white/80"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6, duration: 0.8, ease: "linear" }}
                    >
                      {currentLegend.title}
                    </motion.p>
                    
                    <motion.p 
                      className="text-xl text-white/70 mb-16 max-w-3xl leading-relaxed font-light"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8, duration: 0.8, ease: "linear" }}
                    >
                      {currentLegend.story.heroLine}
                    </motion.p>
                    
                    {/* Enhanced Stats with Animations */}
                    <motion.div 
                      className="grid grid-cols-3 gap-8 mb-16"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1, duration: 0.8, ease: "linear" }}
                    >
                      {Object.entries(currentLegend.stats).slice(0, 3).map(([key, value], index) => (
                        <motion.div 
                          key={key} 
                          className="text-center group"
                          whileHover={{ opacity: 0.9 }}
                          transition={{ duration: 0.2, ease: "linear" }}
                        >
                          <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-white/10 group-hover:border-white/30 transition-all duration-300">
                            <p className="text-white/60 text-sm font-medium mb-2 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </p>
                            <motion.p 
                              className="text-3xl font-light text-white"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ 
                                delay: 1.2 + index * 0.1, 
                                duration: 0.6,
                                ease: "linear"
                              }}
                            >
                              {value}
                            </motion.p>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                    
                    {/* Action Buttons with Hover Effects */}
                    <motion.div 
                      className="flex items-center gap-8"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.4, duration: 0.8, ease: "linear" }}
                    >
                      <motion.div
                        whileHover={{ opacity: 0.9 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      >
                        <Button 
                          size="lg"
                          className="font-light px-12 py-4 text-lg backdrop-blur-sm relative overflow-hidden group"
                          style={{ backgroundColor: currentLegend.color, color: "black" }}
                          onClick={() => onSelectLegend(currentLegend.id)}
                          data-interactive="true"
                        >
                          {/* Button glow effect */}
                          <div 
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 blur-xl"
                            style={{ backgroundColor: currentLegend.color }}
                          />
                          <div className="relative flex items-center">
                            <PlayCircle className="w-8 h-8 mr-4" />
                            Enter Legend's Hall
                          </div>
                        </Button>
                      </motion.div>
                      
                      <motion.div
                        whileHover={{ opacity: 0.9 }}
                      >
                        <Button 
                          variant="outline" 
                          size="lg"
                          className="border-white/30 text-white hover:bg-white/10 font-bold px-12 py-6 text-xl backdrop-blur-sm"
                          data-collectible="true"
                        >
                          <Gem className="w-6 h-6 mr-3" />
                          Collect Legacy NFT
                        </Button>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                  
                  {/* Interactive Portrait */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 1, ease: "linear" }}
                    className="relative group"
                  >
                    <div className="relative">
                      {/* Portrait with Enhanced Effects */}
                      <div 
                        className="w-[500px] h-[600px] rounded-[3rem] overflow-hidden border-4 shadow-2xl relative"
                        style={{ borderColor: `${currentLegend.color}60` }}
                      >
                        <MediaRenderer
                          src={currentLegend.portrait}
                          alt={currentLegend.name}
                          className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-95"
                          aspectRatio="auto"
                        />
                        
                        {/* Subtle hover overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        {/* Rarity Indicator */}
                        <Badge 
                          className="absolute top-6 right-6 font-bold text-lg px-4 py-2 backdrop-blur-sm"
                          style={{ 
                            backgroundColor: currentLegend.rarity === "Mythic" ? "#ff6b6b" : "#ffd93d",
                            color: "black"
                          }}
                        >
                          <Crown className="w-5 h-5 mr-2" />
                          {currentLegend.rarity}
                        </Badge>
                      </div>
                      
                      {/* Subtle glow */}
                      <div 
                        className="absolute inset-0 rounded-[3rem] blur-3xl opacity-10 -z-10"
                        style={{ backgroundColor: currentLegend.color }}
                      />
                      
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        
        {/* Enhanced Carousel Controls */}
        <div className="absolute bottom-12 left-16 flex items-center gap-8">
          <div className="flex items-center gap-4">
            {/* Navigation Buttons */}
            <button
              onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
              disabled={currentSlide === 0}
              className="w-12 h-12 bg-black/40 backdrop-blur-sm border border-white/10 text-white hover:bg-black/60 transition-opacity flex items-center justify-center disabled:opacity-30"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setCurrentSlide(Math.min(legends.length - 1, currentSlide + 1))}
              disabled={currentSlide === legends.length - 1}
              className="w-12 h-12 bg-black/40 backdrop-blur-sm border border-white/10 text-white hover:bg-black/60 transition-opacity flex items-center justify-center disabled:opacity-30"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          
          {/* Progress Indicators */}
          <div className="flex gap-4">
            {legends.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className="relative overflow-hidden transition-all duration-300"
                style={{
                  width: index === currentSlide ? '64px' : '32px',
                  height: '8px',
                  backgroundColor: index === currentSlide ? currentLegend.color : 'rgba(255,255,255,0.3)'
                }}
              >
                {index === currentSlide && (
                  <motion.div
                    className="absolute inset-0 bg-white/20 rounded-full"
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 12, ease: "linear", repeat: Infinity }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-12 left-1/2 transform -translate-x-1/2 text-center cursor-pointer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 2, duration: 1, ease: "linear" }}
          onClick={() => {
            scrollContainerRef.current?.scrollTo({
              top: window.innerHeight,
              behavior: 'smooth'
            });
          }}
        >
          <p className="text-white/60 text-lg mb-4 font-medium">Explore More Legends</p>
          <div className="w-12 h-12 mx-auto border-2 border-white/40 rounded-full flex items-center justify-center">
            <ChevronDown className="w-6 h-6 text-white/60" />
          </div>
        </motion.div>
      </section>
    );
  }
);