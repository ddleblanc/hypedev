"use client";

import React from "react";
import Image from "next/image";

interface AppLayoutProps {
  children: React.ReactNode;
  viewMode: 'home' | 'trade' | 'p2p' | 'marketplace' | 'play' | 'casual' | 'launchpad' | 'museum' | 'studio';
  showFooter?: boolean;
  footerContent?: React.ReactNode;
  className?: string;
}

export function AppLayout({ 
  children, 
  viewMode, 
  showFooter = true,
  footerContent,
  className = ""
}: AppLayoutProps) {

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background with conditional zoom/blur - Fixed positioning */}
      <div className="fixed inset-0 animate-[fadeIn_0.5s_ease-out] z-0">
        <Image
          src="/assets/img/bg1.jpg"
          alt="Background"
          fill
          className={`object-cover transition-all duration-500 ${
            viewMode === 'trade' 
              ? 'scale-110 blur-sm' 
              : viewMode === 'play'
              ? 'scale-110 blur-sm'
              : viewMode === 'p2p'
              ? 'scale-125 blur-md'
              : viewMode === 'marketplace'
              ? 'scale-125 blur-md'
              : viewMode === 'casual'
              ? 'scale-125 blur-md'
              : viewMode === 'launchpad'
              ? 'scale-125 blur-md'
              : viewMode === 'museum'
              ? 'scale-125 blur-md'
              : viewMode === 'studio'
              ? 'scale-125 blur-md'
              : 'scale-100 blur-none'
          }`}
          priority
        />
        <div className={`absolute inset-0 transition-all duration-500 ${
          viewMode === 'p2p' || viewMode === 'marketplace' || viewMode === 'casual' || viewMode === 'launchpad' || viewMode === 'museum' || viewMode === 'studio' ? 'bg-black/70' : 'bg-black/40'
        }`} />
        {/* Special fade-to-black overlay for marketplace and casual views */}
        <div className={`absolute inset-0 bg-black transition-all duration-1000 ${
          viewMode === 'marketplace' || viewMode === 'casual' || viewMode === 'launchpad' || viewMode === 'museum' || viewMode === 'studio' ? (viewMode === 'museum' ? 'opacity-100' : 'opacity-60') : 'opacity-0'
        }`} />
        <div className={`absolute inset-0 bg-gradient-to-br from-transparent via-black/20 to-black/60 transition-all duration-500 ${
          viewMode === 'trade' ? 'opacity-80' : viewMode === 'play' ? 'opacity-80' : viewMode === 'p2p' ? 'opacity-90' : viewMode === 'marketplace' ? 'opacity-90' : viewMode === 'casual' ? 'opacity-90' : viewMode === 'launchpad' ? 'opacity-90' : viewMode === 'museum' ? 'opacity-0' : viewMode === 'studio' ? 'opacity-90' : 'opacity-100'
        }`} />
      </div>

      {/* Header functionality now handled by AnimatedHeader in ConditionalLayout */}

      {/* Main Content Area */}
      <div className={`relative z-10 flex-1 ${className}`}>
        <div className={viewMode === 'marketplace' || viewMode === 'casual' || viewMode === 'launchpad' || viewMode === 'trade' || viewMode === 'museum' ? 'relative' : 'px-16 py-4'}>
          {children}
        </div>
      </div>

   
 

    </div>
  );
}