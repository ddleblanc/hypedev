"use client";

import React from "react";
import { motion } from "framer-motion";
import { Swords, Shield, Target, Skull, Flame, Zap } from "lucide-react";

interface BattleArenaProps {
  selectedPartner?: string;
  partnerName?: string;
}

export function BattleArena({ selectedPartner, partnerName }: BattleArenaProps) {
  if (!selectedPartner) return null;

  return (
    <motion.div 
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="flex items-center justify-center"
    >
      <div className="text-center relative">
        {/* Battle Arena Ring */}
        <div className="w-24 h-24 bg-gradient-to-br from-red-500/30 via-purple-500/30 to-orange-500/30 rounded-full flex items-center justify-center mb-4 border-4 border-red-500/50 relative overflow-hidden">
          <div className="absolute inset-0 animate-spin bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="relative z-10 bg-black/60 w-16 h-16 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Swords className="w-8 h-8 text-red-400 animate-pulse" />
          </div>
          
          {/* Orbiting Battle Icons */}
          <motion.div
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          >
            <Target className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-yellow-400" />
            <Shield className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
            <Flame className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-4 h-4 text-orange-400" />
            <Zap className="absolute left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
          </motion.div>
        </div>
        
        <div className="bg-red-950/40 rounded-lg p-3 border border-red-500/30 backdrop-blur-sm">
          <p className="text-red-300 text-sm font-black mb-1 flex items-center justify-center gap-1">
            <Target className="w-3 h-3 animate-ping" />
            ENGAGING TARGET
          </p>
          <p className="text-white font-black text-lg">
            {partnerName}
          </p>
          <div className="flex items-center justify-center gap-1 mt-1">
            <Skull className="w-3 h-3 text-red-400" />
            <span className="text-red-400 text-xs font-mono">HOSTILE CONFIRMED</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}