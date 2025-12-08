"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid,
  Sparkles,
  Compass,
  Home,
  X,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { HomepageMode, PortalSwitchButtonProps } from "@/types/homepage";

// View option data
const viewOptions = {
  traditional: {
    icon: Compass,
    label: "Discover",
    description: "Browse collections, trending, and launches",
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-gradient-to-br from-blue-500/20 to-cyan-500/20",
    borderColor: "border-blue-500/50",
  },
  hud: {
    icon: LayoutGrid,
    label: "My HUD",
    description: "Your personalized gaming dashboard",
    color: "from-[rgb(163,255,18)] to-emerald-500",
    bgColor: "bg-gradient-to-br from-[rgb(163,255,18)]/20 to-emerald-500/20",
    borderColor: "border-[rgb(163,255,18)]/50",
  },
};

export function PortalSwitchButton({
  currentMode,
  onModeChange,
  isTransitioning = false,
  className
}: PortalSwitchButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const currentOption = viewOptions[currentMode];
  const alternateMode: HomepageMode = currentMode === 'traditional' ? 'hud' : 'traditional';
  const alternateOption = viewOptions[alternateMode];

  const handleToggle = () => {
    if (isTransitioning) return;
    onModeChange(alternateMode);
    setIsExpanded(false);
  };

  const handleExpand = () => {
    if (isTransitioning) return;
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      {/* Backdrop when expanded */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99]"
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>

      {/* Main Button Container */}
      <motion.div
        className={cn(
          "fixed z-[100]",
          // Position: bottom-right on desktop, bottom-center on mobile
          "bottom-6 right-6 md:bottom-8 md:right-8",
          className
        )}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 25,
          delay: 0.5
        }}
      >
        <AnimatePresence mode="wait">
          {isExpanded ? (
            // Expanded State - View Selector Card
            <motion.div
              key="expanded"
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={cn(
                "w-80 md:w-96",
                "bg-black/95 backdrop-blur-2xl",
                "border border-white/20 rounded-2xl",
                "shadow-2xl shadow-black/50",
                "overflow-hidden"
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[rgb(163,255,18)]/20 to-white/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-[rgb(163,255,18)]" />
                  </div>
                  <span className="text-white font-bold">Switch View</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
                  onClick={() => setIsExpanded(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Options */}
              <div className="p-4 space-y-3">
                {/* Traditional Option */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onModeChange('traditional');
                    setIsExpanded(false);
                  }}
                  disabled={isTransitioning}
                  className={cn(
                    "w-full p-4 rounded-xl text-left transition-all duration-300",
                    "border-2",
                    currentMode === 'traditional'
                      ? "bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/50"
                      : "bg-white/5 border-white/10 hover:border-white/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      currentMode === 'traditional'
                        ? "bg-gradient-to-br from-blue-500 to-cyan-500"
                        : "bg-white/10"
                    )}>
                      <Compass className={cn(
                        "w-6 h-6",
                        currentMode === 'traditional' ? "text-white" : "text-white/60"
                      )} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-bold",
                          currentMode === 'traditional' ? "text-white" : "text-white/80"
                        )}>
                          Discover
                        </span>
                        {currentMode === 'traditional' && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-300 text-[10px] font-bold">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-white/50">Browse collections & trending</p>
                    </div>
                    {currentMode !== 'traditional' && (
                      <ChevronRight className="w-5 h-5 text-white/30" />
                    )}
                  </div>
                </motion.button>

                {/* HUD Option */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onModeChange('hud');
                    setIsExpanded(false);
                  }}
                  disabled={isTransitioning}
                  className={cn(
                    "w-full p-4 rounded-xl text-left transition-all duration-300",
                    "border-2",
                    currentMode === 'hud'
                      ? "bg-gradient-to-br from-[rgb(163,255,18)]/20 to-emerald-500/20 border-[rgb(163,255,18)]/50"
                      : "bg-white/5 border-white/10 hover:border-white/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      currentMode === 'hud'
                        ? "bg-gradient-to-br from-[rgb(163,255,18)] to-emerald-500"
                        : "bg-white/10"
                    )}>
                      <LayoutGrid className={cn(
                        "w-6 h-6",
                        currentMode === 'hud' ? "text-black" : "text-white/60"
                      )} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-bold",
                          currentMode === 'hud' ? "text-white" : "text-white/80"
                        )}>
                          My HUD
                        </span>
                        {currentMode === 'hud' && (
                          <span className="px-2 py-0.5 rounded-full bg-[rgb(163,255,18)]/30 text-[rgb(163,255,18)] text-[10px] font-bold">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-white/50">Your personalized dashboard</p>
                    </div>
                    {currentMode !== 'hud' && (
                      <ChevronRight className="w-5 h-5 text-white/30" />
                    )}
                  </div>
                </motion.button>
              </div>

              {/* Footer hint */}
              <div className="px-4 pb-4">
                <p className="text-xs text-white/40 text-center">
                  Click outside or press ESC to close
                </p>
              </div>
            </motion.div>
          ) : (
            // Collapsed State - Floating Orb Button
            <motion.div
              key="collapsed"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onHoverStart={() => setIsHovered(true)}
              onHoverEnd={() => setIsHovered(false)}
              className="relative"
            >
              {/* Glow effect */}
              <motion.div
                className={cn(
                  "absolute inset-0 rounded-full blur-xl",
                  currentMode === 'traditional'
                    ? "bg-blue-500/40"
                    : "bg-[rgb(163,255,18)]/40"
                )}
                animate={{
                  scale: isHovered ? 1.5 : 1,
                  opacity: isHovered ? 0.8 : 0.5,
                }}
                transition={{ duration: 0.3 }}
              />

              {/* Pulsing ring */}
              <motion.div
                className={cn(
                  "absolute inset-0 rounded-full border-2",
                  currentMode === 'traditional'
                    ? "border-blue-500/50"
                    : "border-[rgb(163,255,18)]/50"
                )}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />

              {/* Main button */}
              <Button
                onClick={handleExpand}
                disabled={isTransitioning}
                className={cn(
                  "relative h-14 w-14 md:h-16 md:w-16 rounded-full",
                  "shadow-2xl transition-all duration-300",
                  "border-2",
                  currentMode === 'traditional'
                    ? "bg-gradient-to-br from-blue-500 to-cyan-500 border-blue-400/50 hover:shadow-blue-500/50"
                    : "bg-gradient-to-br from-[rgb(163,255,18)] to-emerald-500 border-[rgb(163,255,18)]/50 hover:shadow-[rgb(163,255,18)]/50",
                  isHovered && "scale-110",
                  isTransitioning && "opacity-50 cursor-not-allowed"
                )}
              >
                {/* Icon with rotation animation */}
                <motion.div
                  animate={{
                    rotate: isHovered ? 180 : 0,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {currentMode === 'traditional' ? (
                    <Compass className="w-6 h-6 md:w-7 md:h-7 text-white" />
                  ) : (
                    <LayoutGrid className="w-6 h-6 md:w-7 md:h-7 text-black" />
                  )}
                </motion.div>

                {/* Scan line effect */}
                <motion.div
                  className="absolute inset-0 rounded-full overflow-hidden"
                  style={{ pointerEvents: 'none' }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-transparent"
                    animate={{ y: ['-100%', '200%'] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                </motion.div>
              </Button>

              {/* Tooltip on hover */}
              <AnimatePresence>
                {isHovered && !isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, x: 10, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 10, scale: 0.9 }}
                    className={cn(
                      "absolute right-full mr-3 top-1/2 -translate-y-1/2",
                      "whitespace-nowrap pointer-events-none"
                    )}
                  >
                    <div className={cn(
                      "px-4 py-2 rounded-xl",
                      "bg-black/95 backdrop-blur-xl",
                      "border",
                      currentMode === 'traditional'
                        ? "border-blue-500/30"
                        : "border-[rgb(163,255,18)]/30",
                      "shadow-xl"
                    )}>
                      <p className="text-white font-bold text-sm">
                        Switch to {alternateOption.label}
                      </p>
                      <p className="text-white/50 text-xs">
                        {alternateOption.description}
                      </p>
                    </div>
                    {/* Arrow */}
                    <div className={cn(
                      "absolute right-0 top-1/2 -translate-y-1/2 translate-x-1",
                      "w-2 h-2 rotate-45",
                      "bg-black/95 border-r border-t",
                      currentMode === 'traditional'
                        ? "border-blue-500/30"
                        : "border-[rgb(163,255,18)]/30"
                    )} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}

// Compact version for mobile or alternate layouts
export function PortalSwitchButtonCompact({
  currentMode,
  onModeChange,
  isTransitioning = false,
  className
}: PortalSwitchButtonProps) {
  const handleToggle = () => {
    if (isTransitioning) return;
    const newMode: HomepageMode = currentMode === 'traditional' ? 'hud' : 'traditional';
    onModeChange(newMode);
  };

  return (
    <motion.button
      onClick={handleToggle}
      disabled={isTransitioning}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full",
        "bg-black/60 backdrop-blur-xl border border-white/20",
        "text-white text-sm font-medium",
        "hover:bg-black/80 hover:border-white/30",
        "transition-all duration-300",
        isTransitioning && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentMode}
          initial={{ rotate: -180, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 180, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-2"
        >
          {currentMode === 'traditional' ? (
            <>
              <LayoutGrid className="w-4 h-4 text-[rgb(163,255,18)]" />
              <span>Switch to HUD</span>
            </>
          ) : (
            <>
              <Compass className="w-4 h-4 text-blue-400" />
              <span>Switch to Discover</span>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
}
