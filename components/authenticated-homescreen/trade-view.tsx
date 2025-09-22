"use client";

import React from "react";
import { Crown } from "lucide-react";
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
    <div className="w-full h-screen flex items-center justify-center pt-16 pb-12">
      <div className="px-8">
        <GameCommandCenter 
          options={tradeOptions}
          onOptionClick={handleOptionClick}
          centerLabel="TRADE"
        />
      </div>
    </div>
  );
}