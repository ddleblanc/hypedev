"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";
import { useWalletAuth } from "@/hooks/use-wallet-auth";
import { GameCommandCenter, type GameOption } from "@/components/ui/game-command-center";

const playOptions: GameOption[] = [
  {
    id: "casual",
    title: "CASUAL",
    description: "Relax and enjoy casual gaming experiences with friends",
    image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/e86e948f-56cd-4c15-9f70-315818aafa7e/transcode=true,original=true,quality=90/114308upscale_00001.webm",
    category: "CHILL MODE",
    accentColor: "green"
  },
  {
    id: "competitive",
    title: "COMPETITIVE", 
    description: "Test your skills in ranked matches and tournaments",
    image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/ea507b10-5017-472d-8433-06c0676dee51/transcode=true,original=true,quality=90/WanVideoWrapper_I2V_00047.webm",
    category: "ESPORTS",
    accentColor: "orange"
  },
  {
    id: "casino",
    title: "CASINO",
    description: "Try your luck in casino games and blockchain gambling",
    image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/2d89529b-6141-4d66-9992-9798d96dcd5d/transcode=true,width=450,optimized=true/Untitled%20(3).webm",
    category: "HIGH STAKES",
    accentColor: "purple"
  },
  {
    id: "1v1",
    title: "1V1",
    description: "Intense head-to-head battles and competitive duels",
    image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/080b9a0f-d103-4356-95fe-56e6816df24f/transcode=true,original=true,quality=90/Professional_Mode_A_hyper_realistic__cinematic_pok.webm",
    category: "DUELING",
    accentColor: "cyan"
  }
];

type PlayViewProps = {
  setViewMode: (mode: string) => void;
};

export function PlayView({ setViewMode }: PlayViewProps) {
  const { user } = useWalletAuth();

  const handleOptionClick = (option: GameOption) => {
    // Navigate to nested play routes
    setViewMode(`play/${option.id}`);
  };

  return (
    <>
      {/* Mobile Layout */}
      <div className="md:hidden w-full">

        {/* Mobile Content - Accounts for 63px top only */}
        <div>
          <GameCommandCenter 
            options={playOptions}
            onOptionClick={handleOptionClick}
            centerLabel="PLAY"
          />
        </div>
      </div>

      {/* Desktop Layout */}
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
            <h1 className="text-white text-2xl font-black tracking-wider">PLAY HUB</h1>
            <div className="w-20" /> {/* Spacer for centering */}
          </div>
        </div>

        {/* Desktop Content */}
        <div className="px-8 pt-16 pb-12">
          <GameCommandCenter 
            options={playOptions}
            onOptionClick={handleOptionClick}
            centerLabel="PLAY"
          />
        </div>
      </div>
    </>
  );
}