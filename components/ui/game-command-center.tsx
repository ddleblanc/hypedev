"use client";

import React, { useState, useEffect } from "react";
import { 
  ChevronRight, 
  ChevronLeft, 
  Home,
  ShoppingCart,
  Rocket,
  Gift,
  Users,
  Coffee,
  Trophy,
  Dices,
  Swords,
  Gamepad2
} from "lucide-react";

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
    <div className="relative h-[100dvh] bg-black overflow-hidden flex flex-col">
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
          {/* <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black/95" /> */}
        </div>
      )}

      {/* Content Layer */}
      <div className="relative z-10 h-full flex flex-col pb-[72px]">
        {/* Main Content Area - Takes remaining space */}
        <div className="flex-1 flex flex-col justify-end p-5 pb-4">
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
          <p className="text-white/80 text-sm sm:text-base mb-5 leading-relaxed">
            {selected.description}
          </p>

          {/* CTA Button */}
          <button
            onClick={() => onOptionClick(selected)}
            className={`
              w-full py-3.5 rounded-xl
              bg-white/10 backdrop-blur-md
              border ${colorClasses.border}
              flex items-center justify-between px-5
              active:scale-[0.98] transition-transform duration-150
            `}
          >
            <span className="text-white font-bold text-base uppercase tracking-wider">Enter</span>
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Bottom Navigation - Fixed tab bar */}
        <div className="fixed bottom-0 left-0 right-0 z-30">
          <div className="bg-black/60 backdrop-blur-xl border-t border-white/10">
            <div className="grid grid-cols-5">
              {/* Home Button */}
              <button
                onClick={() => {
                  // Navigate to home or back
                  window.history.back();
                }}
                className="flex flex-col items-center py-3 text-white/60 active:text-[rgb(163,255,18)] transition-colors group"
              >
                <Home className="w-6 h-6 mb-1 group-active:scale-110 transition-transform" />
                {/* <span className="text-[10px] font-bold uppercase tracking-wider">HOME</span> */}
              </button>
              
              {/* Option Navigation Items */}
              {options.map((option, index) => {
                const optionColors = accentColorClasses[option.accentColor];
                const isSelected = index === selectedIndex;
                
                // Icon mapping based on option id
                const getIcon = () => {
                  switch(option.id) {
                    case 'marketplace': return ShoppingCart;
                    case 'launchpad': return Rocket;
                    case 'lootboxes': return Gift;
                    case 'p2p': return Users;
                    case 'casual': return Coffee;
                    case 'competitive': return Trophy;
                    case 'casino': return Dices;
                    case '1v1': return Swords;
                    default: return Gamepad2;
                  }
                };
                const Icon = getIcon();
                
                return (
                  <button
                    key={option.id}
                    onClick={() => {
                      if (isSelected) {
                        onOptionClick(option);
                      } else {
                        setSelectedIndex(index);
                      }
                    }}
                    className={`
                      flex flex-col items-center py-3 transition-colors group
                      ${isSelected ? 'text-[rgb(163,255,18)]' : 'text-white/60 active:text-[rgb(163,255,18)]'}
                    `}
                  >
                    <Icon className="w-6 h-6 mb-1 group-active:scale-110 transition-transform" />
                    {/* <span className="text-[9px] font-bold uppercase tracking-wider">
                      {option.title}
                    </span> */}
                  </button>
                );
              })}
            </div>
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
                {/* <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-black/60" /> */}
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