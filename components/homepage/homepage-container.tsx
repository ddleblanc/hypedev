"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useHomepageMode } from "@/contexts/homepage-mode-context";
import { TraditionalHomepage } from "@/components/homepage/traditional/traditional-homepage";
import { HomeView } from "@/components/authenticated-homescreen/home-view";
import { PortalSwitchButton } from "@/components/homepage/portal-switch-button";
import { useRouter } from "next/navigation";

interface HomepageContainerProps {
  isAuthenticated: boolean;
}

export function HomepageContainer({ isAuthenticated }: HomepageContainerProps) {
  const { state, setMode } = useHomepageMode();
  const router = useRouter();

  // Navigation handler for HUD view
  const handleNavigate = (newMode: string) => {
    if (newMode === 'home') {
      router.push('/');
    } else {
      router.push(`/${newMode}`);
    }
  };

  // Zoom transition variants
  // Traditional = top layer (zooms in when going to HUD)
  // HUD = deeper layer (zooms out when going to Traditional)
  const traditionalVariants = {
    initial: {
      opacity: 0,
      scale: 1.15,  // Coming from zoomed in (returning from HUD)
    },
    animate: {
      opacity: 1,
      scale: 1,
    },
    exit: {
      opacity: 0,
      scale: 1.15,  // Zoom in when going to HUD (diving deeper)
    },
  };

  const hudVariants = {
    initial: {
      opacity: 0,
      scale: 0.85,  // Coming from zoomed out (coming from Traditional)
    },
    animate: {
      opacity: 1,
      scale: 1,
    },
    exit: {
      opacity: 0,
      scale: 0.85,  // Zoom out when going to Traditional (rising up)
    },
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatePresence mode="wait">
        {state.mode === 'traditional' ? (
          <motion.div
            key="traditional"
            variants={traditionalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{
              duration: 0.3,
              ease: [0.32, 0.72, 0, 1],
            }}
            className="min-h-screen"
          >
            <TraditionalHomepage />
          </motion.div>
        ) : (
          <motion.div
            key="hud"
            variants={hudVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{
              duration: 0.3,
              ease: [0.32, 0.72, 0, 1],
            }}
            className="min-h-screen"
          >
            <HomeView setViewMode={handleNavigate} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Portal Switch Button - Always visible */}
      <PortalSwitchButton
        currentMode={state.mode}
        onModeChange={setMode}
        isTransitioning={state.isTransitioning}
      />
    </div>
  );
}

// Wrapper for public/unauthenticated users - always shows Traditional
export function PublicHomepageContainer() {
  return (
    <div className="relative min-h-screen">
      <TraditionalHomepage />
      {/* No portal button for unauthenticated users - they only see Traditional */}
    </div>
  );
}
