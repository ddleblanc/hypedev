"use client";

import React, { useEffect, useState } from "react";
import { MediaRenderer } from "../MediaRenderer";
import { useWalletAuth, AuthUser } from "@/hooks/use-wallet-auth";

const playOptions = [
  {
    id: "casual",
    title: "CASUAL",
    description: "Relax and enjoy casual gaming experiences with friends",
    image: "https://picsum.photos/400/240?random=200"
  },
  {
    id: "competitive",
    title: "COMPETITIVE", 
    description: "Test your skills in ranked matches and tournaments",
    image: "https://picsum.photos/400/240?random=201"
  },
  {
    id: "casino",
    title: "CASINO",
    description: "Try your luck in casino games and blockchain gambling",
    image: "https://picsum.photos/400/240?random=202"
  },
  {
    id: "metaverse",
    title: "METAVERSE",
    description: "Explore virtual worlds and immersive gaming experiences",
    image: "https://picsum.photos/400/240?random=203"
  }
];

type PlayViewProps = {
  setViewMode: (mode: string) => void;
};

export function PlayView({ setViewMode }: PlayViewProps) {
  const { user } = useWalletAuth();

  // Add custom keyframes for premium animations
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInFromLeft {
        0% {
          transform: translateX(-30px);
          opacity: 0;
        }
        100% {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes cardSlideIn {
        0% {
          transform: translateX(-50px);
          opacity: 0;
        }
        100% {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);



  return (
    <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-8">
              {/* PLAY Title */}
              <h1 
                className="text-white text-8xl font-black tracking-wider animate-[slideInFromLeft_0.3s_ease-out_0.1s_both]"
                style={{ textShadow: '0 0 30px rgba(163,255,18,0.3)' }}
              >
                PLAY
              </h1>
              
              {/* Play Options Cards */}
              <div className="flex gap-6 max-w-6xl w-full justify-center">
              {playOptions.map((option, index) => (
                <div
                  key={option.id}
                  className="group cursor-pointer flex-1 animate-[cardSlideIn_0.4s_ease-out_both]"
                  style={{ animationDelay: `${0.2 + index * 0.03}s` }}
                  onClick={() => {
                    if (option.id === "casual") {
                      setViewMode("casual");
                    } else {
                      // For other options, we can add more sub-views later
                      console.log(`${option.id} view not implemented yet`);
                    }
                  }}
                >
                  <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden hover:border-[rgb(163,255,18)]/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[rgb(163,255,18)]/20">
                    
                    {/* Card Image */}
                    <div className="relative h-48 overflow-hidden">
                      <MediaRenderer
                        src={option.image}
                        alt={option.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        aspectRatio="auto"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </div>
                    
                    {/* Card Content */}
                    <div className="p-8">
                      <h3 
                        className="text-white text-3xl font-black tracking-wider mb-4 transition-colors duration-300"
                        onMouseEnter={(e) => (e.target as HTMLElement).style.color = 'rgb(163,255,18)'}
                        onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'white'}
                      >
                        {option.title}
                      </h3>
                      <p className="text-white/80 text-lg font-medium leading-relaxed group-hover:text-white/90 transition-colors duration-300">
                        {option.description}
                      </p>
                    </div>
                    
                    {/* Hover Effect Border */}
                    <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[rgb(163,255,18)]/10 via-transparent to-[rgb(163,255,18)]/10" />
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </div>
    </div>
  );
}