"use client";

import React from "react";
import { motion } from "framer-motion";
import { Flame, Target, Zap, Crosshair, Radio } from "lucide-react";

export function BattleEffects() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Scanning Lines */}
      <motion.div
        className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-red-500/60 to-transparent"
        animate={{
          y: ["-100vh", "100vh"]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      
      <motion.div
        className="absolute top-0 right-0 w-0.5 h-full bg-gradient-to-b from-transparent via-orange-500/60 to-transparent"
        animate={{
          x: ["100vw", "-100vw"]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "linear",
          delay: 1.5
        }}
      />

      {/* Floating Battle Icons */}
      <motion.div
        className="absolute top-1/4 right-1/4"
        animate={{
          y: [-10, -30, -10],
          x: [-5, 5, -5],
          rotate: [0, 180, 360]
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Target className="w-6 h-6 text-red-400/30" />
      </motion.div>

      <motion.div
        className="absolute top-3/4 left-1/4"
        animate={{
          y: [10, 30, 10],
          x: [5, -5, 5],
          rotate: [360, 180, 0]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      >
        <Crosshair className="w-4 h-4 text-orange-400/30" />
      </motion.div>

      <motion.div
        className="absolute top-1/2 right-1/3"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3
        }}
      >
        <Zap className="w-5 h-5 text-yellow-400/40" />
      </motion.div>

      {/* Battle Particles */}
      {Array.from({ length: 15 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-red-500/40 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -200, -400],
            x: [0, Math.random() * 100 - 50],
            opacity: [0, 1, 0],
            scale: [0, 1, 0]
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "easeOut"
          }}
        />
      ))}

      {/* Corner Battle Indicators */}
      <div className="absolute top-4 left-4">
        <div className="flex items-center gap-2 bg-red-950/40 rounded-lg px-3 py-1 border border-red-500/30 backdrop-blur-sm">
          <Radio className="w-3 h-3 text-red-400 animate-pulse" />
          <span className="text-red-400 text-xs font-mono font-bold">COMBAT ACTIVE</span>
        </div>
      </div>

      <div className="absolute top-4 right-4">
        <div className="flex items-center gap-2 bg-orange-950/40 rounded-lg px-3 py-1 border border-orange-500/30 backdrop-blur-sm">
          <Flame className="w-3 h-3 text-orange-400 animate-pulse" />
          <span className="text-orange-400 text-xs font-mono font-bold">HIGH THREAT</span>
        </div>
      </div>
    </div>
  );
}