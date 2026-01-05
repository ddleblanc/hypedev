"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMuseum } from "@/contexts/museum-context";

export function TitleCard() {
  const { showTitleCard, titleCardText, curtainState } = useMuseum();

  // Generate particle positions only on client
  const particles = useMemo(() => {
    if (typeof window === 'undefined') return [];
    return Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      initialX: Math.random() * window.innerWidth,
      initialY: Math.random() * window.innerHeight,
      targetY: Math.random() * -200 - 100,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 1,
    }));
  }, []);

  // For the reveal effect, title should be BEHIND the sidebars (z-30 < z-40)
  // and should show when curtains are opening (sidebars animating out), not when closed
  const shouldShow = showTitleCard && titleCardText && (curtainState === 'closed' || curtainState === 'opening');

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          className="fixed inset-0 z-30 flex flex-col items-center justify-center bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Subtle spotlight effect */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 80% 60% at 50% 45%, rgba(255,255,255,0.03) 0%, transparent 70%)',
            }}
          />

          {/* Main title */}
          <motion.h1
            className="text-5xl md:text-7xl lg:text-8xl font-light text-white tracking-[0.3em] uppercase theater-title"
            initial={{ opacity: 0, y: 20, letterSpacing: '0.5em' }}
            animate={{ opacity: 1, y: 0, letterSpacing: '0.3em' }}
            exit={{ opacity: 0, y: -10 }}
            transition={{
              duration: 0.8,
              delay: 0.2,
              ease: [0.25, 0.1, 0.25, 1]
            }}
          >
            {titleCardText.main}
          </motion.h1>

          {/* Divider line */}
          <motion.div
            className="w-24 md:w-32 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent my-6 md:my-8"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ scaleX: 0, opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          />

          {/* Subtitle (legend title) */}
          <motion.p
            className="text-lg md:text-xl lg:text-2xl text-white/60 font-light tracking-wider"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            {titleCardText.sub}
          </motion.p>

          {/* Subtle particles/dust effect */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {particles.map((particle) => (
              <motion.div
                key={particle.id}
                className="absolute w-1 h-1 bg-white/10 rounded-full"
                initial={{
                  x: particle.initialX,
                  y: particle.initialY,
                  opacity: 0,
                }}
                animate={{
                  y: [particle.initialY, particle.initialY + particle.targetY],
                  opacity: [0, 0.3, 0],
                }}
                transition={{
                  duration: particle.duration,
                  delay: particle.delay,
                  ease: "linear",
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
