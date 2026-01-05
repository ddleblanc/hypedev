"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMuseum, CurtainState } from "@/contexts/museum-context";

interface CurtainProps {
  side: 'left' | 'right';
}

function Curtain({ side }: CurtainProps) {
  const { curtainState } = useMuseum();

  // Calculate position based on state
  const getXPosition = (): string | number => {
    switch (curtainState) {
      case 'open':
        return side === 'left' ? '-100%' : '100%';
      case 'closing':
        return 0;
      case 'closed':
        return 0;
      case 'opening':
        return side === 'left' ? '-100%' : '100%';
      default:
        return side === 'left' ? '-100%' : '100%';
    }
  };

  return (
    <motion.div
      className="fixed top-0 bottom-0 z-[100] pointer-events-none theater-curtain"
      style={{
        width: '50vw',
        left: side === 'left' ? 0 : undefined,
        right: side === 'right' ? 0 : undefined,
      }}
      initial={{ x: side === 'left' ? '-100%' : '100%' }}
      animate={{ x: getXPosition() }}
      transition={{
        duration: curtainState === 'closing' ? 0.8 : 0.6,
        ease: curtainState === 'closing' ? [0.4, 0, 0.2, 1] : [0.0, 0, 0.2, 1],
      }}
    >
      {/* Main curtain body */}
      <div className="absolute inset-0 bg-black">
        {/* Velvet texture gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: side === 'left'
              ? 'linear-gradient(to right, #000 0%, #0a0a0a 50%, #111 100%)'
              : 'linear-gradient(to left, #000 0%, #0a0a0a 50%, #111 100%)',
          }}
        />

        {/* Subtle vertical lines for curtain fold effect */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `repeating-linear-gradient(
              ${side === 'left' ? '90deg' : '270deg'},
              transparent,
              transparent 40px,
              rgba(255,255,255,0.03) 40px,
              rgba(255,255,255,0.03) 41px
            )`,
          }}
        />

        {/* Inner edge shadow */}
        <div
          className="absolute top-0 bottom-0 w-8"
          style={{
            [side === 'left' ? 'right' : 'left']: 0,
            background: side === 'left'
              ? 'linear-gradient(to right, transparent, rgba(0,0,0,0.8))'
              : 'linear-gradient(to left, transparent, rgba(0,0,0,0.8))',
          }}
        />
      </div>

      {/* Gold trim at the edge */}
      <div
        className="absolute top-0 bottom-0 w-1"
        style={{
          [side === 'left' ? 'right' : 'left']: 0,
          background: 'linear-gradient(to bottom, #8B7355 0%, #D4AF37 20%, #8B7355 50%, #D4AF37 80%, #8B7355 100%)',
          boxShadow: '0 0 10px rgba(212, 175, 55, 0.3)',
        }}
      />
    </motion.div>
  );
}

export function CurtainAnimation() {
  const { curtainState, isTheaterMode, theaterPhase } = useMuseum();

  // Only render when theater mode is active or animating
  const shouldRender = theaterPhase !== 'idle' || curtainState !== 'open';

  if (!shouldRender) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[99] pointer-events-none">
      <Curtain side="left" />
      <Curtain side="right" />

      {/* Center seam when closed */}
      <AnimatePresence>
        {curtainState === 'closed' && (
          <motion.div
            className="absolute top-0 bottom-0 left-1/2 w-px bg-gradient-to-b from-transparent via-[#D4AF37]/50 to-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ transform: 'translateX(-50%)' }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
