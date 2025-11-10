"use client";

import React from "react";
import { ArrowLeft, TrendingUp, Gamepad2, Image as ImageIcon, User, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useWalletAuthOptimized } from "@/hooks/use-wallet-auth-optimized";
import { GameCommandCenter, type GameOption } from "@/components/ui/game-command-center";

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

const mainNavigation = [
  {
    label: "TRADE",
    href: "/trade",
    description: "Buy & Sell"
  },
  {
    label: "PLAY",
    href: "/play",
    description: "Gaming Hub"
  },
  {
    label: "MUSEUM",
    href: "/museum",
    description: "Art & Culture"
  },
  {
    label: "COLLECTION",
    href: "/profile",
    description: "Your Assets"
  }
];

const tradeOptions: GameOption[] = [
  {
    id: "marketplace",
    title: "MARKETPLACE",
    description: "Browse and trade gaming NFTs from verified collections",
    image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/e86e948f-56cd-4c15-9f70-315818aafa7e/transcode=true,original=true,quality=90/114308upscale_00001.webm",
    href: "/marketplace",
    category: "TRADING HUB",
    accentColor: "amber"
  },
  {
    id: "launchpad",
    title: "LAUNCHPAD",
    description: "Discover and invest in new gaming projects before they launch",
    image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/ea507b10-5017-472d-8433-06c0676dee51/transcode=true,original=true,quality=90/WanVideoWrapper_I2V_00047.webm",
    href: "/launchpad",
    category: "LAUNCH ZONE",
    accentColor: "blue"
  },
  {
    id: "lootboxes",
    title: "LOOTBOXES",
    description: "Open mystery boxes containing rare gaming items and NFTs",
    image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/1ad84358-5802-4eae-b74b-f6c880d38ea5/transcode=true,original=true,quality=90/vid_00005.webm",
    href: "/lootboxes/reveal",
    category: "MYSTERY REWARDS",
    accentColor: "purple"
  },
  {
    id: "p2p",
    title: "P2P",
    description: "Direct peer-to-peer trading with other gamers worldwide",
    image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/080b9a0f-d103-4356-95fe-56e6816df24f/transcode=true,original=true,quality=90/Professional_Mode_A_hyper_realistic__cinematic_pok.webm",
    href: "/p2p",
    category: "DIRECT TRADE",
    accentColor: "red"
  }
];

type TradeViewProps = {
  setViewMode: (mode: string) => void;
};

export function TradeView({ setViewMode }: TradeViewProps) {
  const { user } = useWalletAuthOptimized();
  const router = useRouter();

  const handleOptionClick = (option: GameOption) => {
    if (option.id === 'p2p') {
      setViewMode('p2p');
    } else if (option.id === 'marketplace') {
      setViewMode('marketplace');
    } else if (option.id === 'launchpad') {
      setViewMode('launchpad');
    } else if (option.id === 'lootboxes') {
      window.location.href = '/lootboxes/reveal';
    } else if (option.href) {
      window.location.href = option.href;
    }
  };

  return (
    <>
      {/* Mobile Layout */}
      <div className="md:hidden w-full min-h-screen">
        {/* Mobile Content */}
        <div className="relative">
          <GameCommandCenter
            options={tradeOptions}
            onOptionClick={handleOptionClick}
            centerLabel="TRADE"
          />

          {/* Mobile Bottom Navigation Bar - Exact copy from authenticated homescreen */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-30">
            <div className="bg-black/60 backdrop-blur-xl border-t border-white/10">
              <div className="grid grid-cols-5">
                {/* Home Button */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setViewMode('home');
                  }}
                  className="flex flex-col items-center py-3 text-white/60 active:text-[rgb(163,255,18)] transition-colors group"
                >
                  <Home className="w-6 h-6 mb-1 group-active:scale-110 transition-transform" />
                </motion.button>

                {/* Main Navigation Items */}
                {mainNavigation.map((item) => (
                  <motion.button
                    key={item.label}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      if (item.label === 'TRADE') {
                        setViewMode('trade');
                      } else if (item.label === 'PLAY') {
                        setViewMode('play');
                      } else if (item.label === 'MUSEUM') {
                        setViewMode('museum');
                      } else if (item.label === 'COLLECTION') {
                        const addr = user?.walletAddress;
                        if (addr) {
                          router.push(`/${addr}/collection`);
                        } else {
                          router.push(`/profile`);
                        }
                      }
                    }}
                    className={`flex flex-col items-center py-3 transition-colors group ${
                      item.label === 'TRADE'
                        ? 'text-[rgb(163,255,18)]'
                        : 'text-white/60 active:text-[rgb(163,255,18)]'
                    }`}
                  >
                    {item.label === 'TRADE' && <TrendingUp className="w-6 h-6 mb-1 group-active:scale-110 transition-transform" />}
                    {item.label === 'PLAY' && <Gamepad2 className="w-6 h-6 mb-1 group-active:scale-110 transition-transform" />}
                    {item.label === 'MUSEUM' && <ImageIcon className="w-6 h-6 mb-1 group-active:scale-110 transition-transform" />}
                    {item.label === 'COLLECTION' && <User className="w-6 h-6 mb-1 group-active:scale-110 transition-transform" />}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout - Original */}
      <div className="hidden md:flex w-full h-screen items-center justify-center">
        {/* Desktop Header */}
        <div className="fixed top-0 left-0 right-0 z-40 px-8 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setViewMode('home')}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-bold tracking-wider">BACK</span>
            </button>
            <h1 className="text-white text-2xl font-black tracking-wider">TRADE HUB</h1>
            <div className="w-20" /> {/* Spacer for centering */}
          </div>
        </div>

        {/* Desktop Content */}
        <div className="px-8 pt-16 pb-12">
          <GameCommandCenter 
            options={tradeOptions}
            onOptionClick={handleOptionClick}
            centerLabel="TRADE"
          />
        </div>
      </div>
    </>
  );
}