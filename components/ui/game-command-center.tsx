"use client";

import React, { useState, useEffect } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";

export interface GameOption {
  id: string;
  title: string;
  description: string;
  image: string;
  href?: string;
  category: string;
  accentColor: 'amber' | 'blue' | 'purple' | 'red' | 'green' | 'cyan' | 'pink' | 'orange';
}

interface GameCommandCenterProps {
  options: GameOption[];
  onOptionClick: (option: GameOption) => void;
  centerLabel?: string;
}

const accentColorClasses = {
  amber: { text: 'text-amber-400', bg: 'bg-amber-400', border: 'border-amber-400/30' },
  blue: { text: 'text-blue-400', bg: 'bg-blue-400', border: 'border-blue-400/30' },
  purple: { text: 'text-purple-400', bg: 'bg-purple-400', border: 'border-purple-400/30' },
  red: { text: 'text-red-400', bg: 'bg-red-400', border: 'border-red-400/30' },
  green: { text: 'text-green-400', bg: 'bg-green-400', border: 'border-green-400/30' },
  cyan: { text: 'text-cyan-400', bg: 'bg-cyan-400', border: 'border-cyan-400/30' },
  pink: { text: 'text-pink-400', bg: 'bg-pink-400', border: 'border-pink-400/30' },
  orange: { text: 'text-orange-400', bg: 'bg-orange-400', border: 'border-orange-400/30' }
};

export function GameCommandCenter({ options, onOptionClick, centerLabel = "SELECT" }: GameCommandCenterProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev - 1 + options.length) % options.length);
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev + 1) % options.length);
  };

  const selected = options[selectedIndex];
  const colorClasses = selected ? accentColorClasses[selected.accentColor] : accentColorClasses.amber;

  // Mobile Layout - Clean implementation
  const MobileLayout = () => (
    <div className="relative h-screen bg-black overflow-hidden">
      {/* Background Layer - Static video background */}
      {mounted && (
        <div className="absolute inset-0">
          <video
            key={selected.id} // Force remount on selection change
            src={selected.image}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          {/* Gradient for readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black/95" />
        </div>
      )}

      {/* Content Layer */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Main Content Area (65%) */}
        <div className="flex-1 flex flex-col justify-end p-6 pb-4">
          {/* Category */}
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-2 h-2 ${colorClasses.bg} rounded-full`} />
            <span className={`${colorClasses.text} text-xs font-black tracking-[0.3em] uppercase`}>
              {selected.category}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-white text-4xl sm:text-5xl font-black mb-3 leading-tight">
            {selected.title}
          </h1>

          {/* Description */}
          <p className="text-white/80 text-sm sm:text-base mb-6 leading-relaxed">
            {selected.description}
          </p>

          {/* CTA Button */}
          <button
            onClick={() => onOptionClick(selected)}
            className={`
              w-full py-3 sm:py-4 rounded-xl
              bg-white/10 backdrop-blur-md
              border ${colorClasses.border}
              flex items-center justify-between px-5 sm:px-6
              active:scale-[0.98] transition-transform duration-150
            `}
          >
            <span className="text-white font-bold text-base sm:text-lg uppercase tracking-wider">Enter</span>
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </button>
        </div>

        {/* Bottom Navigation (35%) - More compact */}
        <div className="bg-black/80 backdrop-blur-xl border-t border-white/20 pb-safe">
          {/* Navigation Controls */}
          <div className="flex items-center justify-between px-4 py-2">
            <button
              onClick={handlePrevious}
              className="p-1.5 text-white/60 hover:text-white active:scale-90 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex-1 px-3">
              <div className="text-center">
                <p className="text-white/60 text-[10px] mb-0.5">
                  {selectedIndex + 1} of {options.length}
                </p>
                <h3 className="text-white text-sm font-bold">
                  {selected.title}
                </h3>
              </div>
            </div>

            <button
              onClick={handleNext}
              className="p-1.5 text-white/60 hover:text-white active:scale-90 transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Option Pills */}
          <div className="px-4 pb-2">
            <div className="flex gap-1.5 justify-center">
              {options.map((option, index) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedIndex(index)}
                  className={`
                    px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider
                    transition-all duration-200
                    ${index === selectedIndex 
                      ? 'bg-white text-black scale-105' 
                      : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'}
                  `}
                >
                  {option.title.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-1.5 pb-3">
            {options.map((_, index) => (
              <div
                key={`dot-${index}`}
                className={`
                  h-0.5 rounded-full transition-all duration-300
                  ${index === selectedIndex 
                    ? 'w-6 bg-white' 
                    : 'w-1.5 bg-white/30'}
                `}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Desktop Layout - Original working version
  const DesktopLayout = () => (
    <div className="relative grid grid-cols-2 gap-8 h-[600px]">
      {options.slice(0, 4).map((option, index) => {
        const optionColors = accentColorClasses[option.accentColor];
        const clipPath = [
          'polygon(0 0, calc(100% - 30px) 0, 100% 30px, 100% 100%, 0 100%)',
          'polygon(30px 0, 100% 0, 100% 100%, 0 100%, 0 30px)',
          'polygon(0 0, 100% 0, 100% calc(100% - 30px), calc(100% - 30px) 100%, 0 100%)',
          'polygon(0 0, 100% 0, 100% 100%, 30px 100%, 0 calc(100% - 30px))'
        ][index];
        
        return (
          <div
            key={option.id}
            className="group cursor-pointer relative overflow-hidden"
            onClick={() => onOptionClick(option)}
          >
            <div 
              className="relative h-full bg-black/20 backdrop-blur-sm border border-white/20 hover:border-[rgb(163,255,18)]/60 transition-all duration-500 hover:scale-[1.02]"
              style={{ clipPath }}
            >
              <div className="absolute inset-0 overflow-hidden">
                <video
                  src={option.image}
                  loop
                  muted
                  className="w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-opacity duration-500"
                  onMouseEnter={(e) => e.currentTarget.play()}
                  onMouseLeave={(e) => e.currentTarget.pause()}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-black/60" />
              </div>
              
              <div className="relative z-10 h-full flex flex-col justify-between p-8">
                <div>
                  <div className={`${optionColors.text} text-sm font-bold tracking-widest mb-2 opacity-80`}>
                    {option.category}
                  </div>
                  <h2 className="text-white text-4xl font-black tracking-wider group-hover:text-[rgb(163,255,18)] transition-colors duration-300">
                    {option.title}
                  </h2>
                </div>
                
                <div>
                  <p className="text-white/80 text-lg font-medium leading-relaxed mb-4">
                    {option.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-0.5 bg-[rgb(163,255,18)]" />
                    <span className="text-[rgb(163,255,18)] text-sm font-bold tracking-wider">ENTER</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
        <div className="w-32 h-32 rounded-full border border-[rgb(163,255,18)]/30 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-[rgb(163,255,18)]/10 flex items-center justify-center">
            <div className="text-[rgb(163,255,18)] font-black text-lg tracking-widest">
              {centerLabel}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="md:hidden">
        <MobileLayout />
      </div>
      <div className="hidden md:block">
        <DesktopLayout />
      </div>
    </>
  );
}