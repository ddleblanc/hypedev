"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Users, 
  Search, 
  Handshake, 
  Home,
  TrendingUp,
  Zap,
  Settings,
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppFooterProps {
  viewMode: string;
  onNavigate: (view: string) => void;
  showBackButton?: boolean;
  backButtonText?: string;
  onBack?: () => void;
  leftActions?: React.ReactNode;
  rightActions?: React.ReactNode;
  centerContent?: React.ReactNode;
  className?: string;
}

export function AppFooter({
  viewMode,
  onNavigate,
  showBackButton = true,
  backButtonText = "BACK",
  onBack,
  leftActions,
  rightActions,
  centerContent,
  className = ""
}: AppFooterProps) {

  const getBackDestination = () => {
    if (onBack) return onBack;
    
    switch (viewMode) {
      case 'trade':
        return () => onNavigate('home');
      case 'p2p':
        return () => onNavigate('trade');
      case 'marketplace':
        return () => onNavigate('trade');
      case 'play':
        return () => onNavigate('home');
      default:
        return () => onNavigate('home');
    }
  };

  const getBackText = () => {
    switch (viewMode) {
      case 'trade':
        return "BACK TO HOME";
      case 'p2p':
        return "BACK TO TRADE";
      case 'marketplace':
        return "BACK TO TRADE";
      case 'play':
        return "BACK TO HOME";
      default:
        return backButtonText;
    }
  };

  const defaultCenterContent = {
    home: null,
    trade: null,
    play: (
      <div className="flex items-center gap-4 px-8 py-4 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10">
        <div className="flex items-center gap-2 text-white/80">
          <Users className="w-5 h-5 text-[rgb(163,255,18)]" />
          <span className="text-sm font-medium">12.3K Players Online</span>
        </div>
        
        <div className="w-px h-6 bg-white/20" />
        
        <Button
          className="bg-gradient-to-r from-[rgb(163,255,18)] to-green-400 hover:from-green-400 hover:to-[rgb(163,255,18)] text-black font-bold transition-all duration-300 shadow-lg shadow-[rgb(163,255,18)]/20"
        >
          <Zap className="w-4 h-4 mr-2" />
          QUICK PLAY
        </Button>
        
        <div className="w-px h-6 bg-white/20" />
        
        <div className="flex items-center gap-2 text-white/80">
          <TrendingUp className="w-5 h-5 text-[rgb(163,255,18)]" />
          <span className="text-sm font-medium">Hot Games Available</span>
        </div>
      </div>
    ),
    marketplace: (
      <div className="flex items-center gap-4 px-8 py-4 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10">
        <div className="flex items-center gap-2 text-white/80">
          <TrendingUp className="w-5 h-5 text-[rgb(163,255,18)]" />
          <span className="text-sm font-medium">24h Volume: 12.4M ETH</span>
        </div>
        
        <div className="w-px h-6 bg-white/20" />
        
        <Button
          className="bg-gradient-to-r from-[rgb(163,255,18)] to-green-400 hover:from-green-400 hover:to-[rgb(163,255,18)] text-black font-bold transition-all duration-300 shadow-lg shadow-[rgb(163,255,18)]/20"
        >
          <Zap className="w-4 h-4 mr-2" />
          QUICK BUY
        </Button>
        
        <div className="w-px h-6 bg-white/20" />
        
        <div className="flex items-center gap-2 text-white/80">
          <Users className="w-5 h-5 text-[rgb(163,255,18)]" />
          <span className="text-sm font-medium">45.2K Active</span>
        </div>
      </div>
    ),
    p2p: (
      <div className="flex items-center gap-4 px-8 py-4 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10">
        <div className="flex items-center gap-2 text-white/80">
          <Users className="w-5 h-5" />
          <span className="text-sm font-medium">Active Traders: 1,247</span>
        </div>
        
        <div className="w-px h-6 bg-white/20" />
        
        <Button
          className="bg-gradient-to-r from-[rgb(163,255,18)] to-green-400 hover:from-green-400 hover:to-[rgb(163,255,18)] text-black font-bold transition-all duration-300 shadow-lg shadow-[rgb(163,255,18)]/20"
        >
          <Handshake className="w-4 h-4 mr-2" />
          START TRADING
        </Button>
        
        <div className="w-px h-6 bg-white/20" />
        
        <div className="flex items-center gap-2 text-white/80">
          <Search className="w-5 h-5" />
          <span className="text-sm font-medium">Quick Match Available</span>
        </div>
      </div>
    )
  };

  const defaultRightActions = {
    home: (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-white/60 hover:text-white hover:bg-white/10"
        >
          <TrendingUp className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-white/60 hover:text-white hover:bg-white/10"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    ),
    trade: (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-white/60 hover:text-white hover:bg-white/10"
        >
          <Search className="w-4 h-4 mr-1" />
          Filter
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-white/60 hover:text-white hover:bg-white/10"
        >
          <HelpCircle className="w-4 h-4" />
        </Button>
      </div>
    ),
    play: (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-white/60 hover:text-white hover:bg-white/10"
        >
          <Search className="w-4 h-4 mr-1" />
          Find Games
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-white/60 hover:text-white hover:bg-white/10"
        >
          <TrendingUp className="w-4 h-4 mr-1" />
          Leaderboard
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-white/60 hover:text-white hover:bg-white/10"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    ),
    marketplace: (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-white/60 hover:text-white hover:bg-white/10"
        >
          <Search className="w-4 h-4 mr-1" />
          Search
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-white/60 hover:text-white hover:bg-white/10"
        >
          <TrendingUp className="w-4 h-4 mr-1" />
          Analytics
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-white/60 hover:text-white hover:bg-white/10"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    ),
    p2p: (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-white/60 hover:text-white hover:bg-white/10"
        >
          <Zap className="w-4 h-4 mr-1" />
          Quick Match
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-white/60 hover:text-white hover:bg-white/10"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    )
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ 
        duration: 0.5, 
        ease: "easeOut",
        delay: 0.2
      }}
      className={`flex items-center justify-between ${className}`}
    >
      {/* Left Section - Back Button or Custom Actions */}
      <div className="flex items-center gap-4">
        {showBackButton && (
          <Button 
            onClick={getBackDestination()}
            className="px-6 py-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/20 text-white transition-all duration-300 text-lg font-bold tracking-wider hover:bg-green-500/10 flex items-center gap-2"
            style={{
              borderColor: 'rgba(255,255,255,0.2)',
              color: 'white'
            }}
            onMouseEnter={(e) => {
              const target = e.target as HTMLElement;
              target.style.borderColor = 'rgb(163,255,18)';
              target.style.color = 'rgb(163,255,18)';
              target.style.backgroundColor = 'rgba(163,255,18,0.1)';
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLElement;
              target.style.borderColor = 'rgba(255,255,255,0.2)';
              target.style.color = 'white';
              target.style.backgroundColor = 'rgba(255,255,255,0.05)';
            }}
          >
            <ArrowLeft className="w-5 h-5" />
            {getBackText()}
          </Button>
        )}
        {leftActions}
      </div>

      {/* Center Section - View-specific Content */}
      <div className="flex-1 flex justify-center">
        {centerContent || defaultCenterContent[viewMode as keyof typeof defaultCenterContent]}
      </div>

      {/* Right Section - Tools and Actions */}
      <div className="flex items-center gap-4">
        {rightActions || defaultRightActions[viewMode as keyof typeof defaultRightActions]}
      </div>
    </motion.div>
  );
}