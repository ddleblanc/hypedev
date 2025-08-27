"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Box,
  Layers,
  Sparkles,
  Plus,
  TrendingUp,
  Settings,
  BarChart3,
  MonitorSpeaker
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StudioNavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export function StudioNavigation({ currentView, onViewChange }: StudioNavigationProps) {
  const navigationItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: MonitorSpeaker,
      description: 'Overview & stats'
    },
    { 
      id: 'projects', 
      label: 'Projects', 
      icon: Box,
      description: 'Your creations'
    },
    { 
      id: 'collections', 
      label: 'Collections', 
      icon: Layers,
      description: 'NFT sets'
    },
    { 
      id: 'nfts', 
      label: 'NFTs', 
      icon: Sparkles,
      description: 'Digital assets'
    },
    { 
      id: 'create', 
      label: 'Create', 
      icon: Plus,
      description: 'New content'
    },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      icon: BarChart3,
      description: 'Performance'
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: Settings,
      description: 'Configuration'
    }
  ];

  return (
    <div className="flex flex-col h-full space-y-3">
      {navigationItems.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          whileHover={{ x: 8 }}
          transition={{ 
            x: { duration: 0.15, ease: "easeOut" },
            opacity: { duration: 0.3, ease: "easeOut", delay: 0.1 + index * 0.05 }
          }}
          onClick={() => onViewChange(item.id)}
          className="group relative cursor-pointer opacity-0"
          style={{ opacity: 0 }}
        >
          {/* Subtle glow effect on hover/active */}
          <div className={cn(
            "absolute inset-0 rounded-2xl transition-all duration-300",
            currentView === item.id 
              ? "bg-gradient-to-r from-[rgb(163,255,18)]/20 to-[rgb(163,255,18)]/10 border border-[rgb(163,255,18)]/30" 
              : "bg-black/20 backdrop-blur-sm border border-white/10 group-hover:border-[rgb(163,255,18)]/20 group-hover:bg-[rgb(163,255,18)]/5"
          )} />
          
          {/* Content */}
          <div className="relative z-10 flex items-center gap-4 p-6">
            {/* Icon */}
            <div className={cn(
              "flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300",
              currentView === item.id
                ? "bg-[rgb(163,255,18)] text-black shadow-lg shadow-[rgb(163,255,18)]/20"
                : "bg-white/10 text-white/70 group-hover:bg-[rgb(163,255,18)]/20 group-hover:text-[rgb(163,255,18)]"
            )}>
              <item.icon className="h-6 w-6" />
            </div>
            
            {/* Text */}
            <div className="flex-1">
              <h3 className={cn(
                "text-xl font-bold tracking-wide transition-all duration-300",
                currentView === item.id 
                  ? "text-[rgb(163,255,18)]" 
                  : "text-white group-hover:text-[rgb(163,255,18)]"
              )}>
                {item.label}
              </h3>
              <p className={cn(
                "text-sm font-medium transition-all duration-300 mt-0.5",
                currentView === item.id
                  ? "text-white/90"
                  : "text-white/50 group-hover:text-white/70"
              )}>
                {item.description}
              </p>
            </div>

            {/* Active indicator */}
            {currentView === item.id && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-2 h-2 bg-[rgb(163,255,18)] rounded-full shadow-lg shadow-[rgb(163,255,18)]/50"
              />
            )}
          </div>

          {/* Subtle scan line on hover */}
          <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-[rgb(163,255,18)]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </motion.div>
      ))}
    </div>
  );
}