"use client";

import React, { useEffect } from "react";
import { Crown } from "lucide-react";
import { useWalletAuthOptimized } from "@/hooks/use-wallet-auth-optimized";

// Mock data for the authenticated user experience
const mockUserData = {
  username: "CyberWarrior",
  level: 42,
  levelProgress: 75,
  nftCount: 127,
  hyperTokens: 15420,
  rank: "Diamond Elite",
  profilePicture: "https://picsum.photos/100/100?random=50",
  bannerImage: "https://picsum.photos/400/200?random=51"
};

const tradeOptions = [
  {
    id: "marketplace",
    title: "MARKETPLACE",
    description: "Browse and trade gaming NFTs from verified collections",
    image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/e86e948f-56cd-4c15-9f70-315818aafa7e/transcode=true,original=true,quality=90/114308upscale_00001.webm",
    href: "/marketplace"
  },
  {
    id: "launchpad",
    title: "LAUNCHPAD", 
    description: "Discover and invest in new gaming projects before they launch",
    image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/ea507b10-5017-472d-8433-06c0676dee51/transcode=true,original=true,quality=90/WanVideoWrapper_I2V_00047.webm",
    href: "/launchpad"
  },
  {
    id: "tokens",
    title: "TOKENS",
    description: "Trade gaming tokens and participate in token economies",
    image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/2d89529b-6141-4d66-9992-9798d96dcd5d/transcode=true,width=450,optimized=true/Untitled%20(3).webm",
    href: "/tokens"
  },
  {
    id: "p2p",
    title: "P2P",
    description: "Direct peer-to-peer trading with other gamers worldwide",
    image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/080b9a0f-d103-4356-95fe-56e6816df24f/transcode=true,original=true,quality=90/Professional_Mode_A_hyper_realistic__cinematic_pok.webm",
    href: "/p2p"
  }
];

type TradeViewProps = {
  setViewMode: (mode: string) => void;
};

export function TradeView({ setViewMode }: TradeViewProps) {
  const { user } = useWalletAuthOptimized();

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
    <div className="min-h-screen overflow-auto pt-16 pb-32">
      <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center px-16 py-4">
        <div className="flex flex-col items-center gap-8">
          {/* Trade Options Cards */}
          <div className="flex gap-6 max-w-6xl w-full justify-center">
            {tradeOptions.map((option, index) => (
              <div
                key={option.id}
                className="group cursor-pointer w-80 min-w-80 max-w-80 animate-[cardSlideIn_0.4s_ease-out_both]"
                style={{ animationDelay: `${0.2 + index * 0.03}s` }}
                onClick={() => {
                  if (option.id === 'p2p') {
                    setViewMode('p2p');
                  } else if (option.id === 'marketplace') {
                    setViewMode('marketplace');
                  } else if (option.id === 'launchpad') {
                    setViewMode('launchpad');
                  } else {
                    window.location.href = option.href;
                  }
                }}
                onMouseEnter={(e) => {
                  const video = e.currentTarget.querySelector('video');
                  if (video) video.play();
                }}
                onMouseLeave={(e) => {
                  const video = e.currentTarget.querySelector('video');
                  if (video) video.pause();
                }}
              >
                <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden hover:border-[rgb(163,255,18)]/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-black/40">
                  
                  {/* Card Image */}
                  <div className="relative h-48 overflow-hidden">
                    <video
                      src={option.image}
                      loop
                      muted
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
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
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-white/10 via-transparent to-white/10" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}