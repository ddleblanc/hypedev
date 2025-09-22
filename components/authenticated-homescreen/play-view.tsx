"use client";

import React from "react";
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

type PlayViewProps = {};

export function PlayView({}: PlayViewProps) {
  const { user } = useWalletAuth();

  const handleOptionClick = (option: GameOption) => {
    // Navigate to nested play routes
    window.location.href = `/play/${option.id}`;
  };

  return (
    <div className="w-full h-screen flex items-center justify-center pt-16 pb-12">
      <div className="px-8">
        <GameCommandCenter 
          options={playOptions}
          onOptionClick={handleOptionClick}
          centerLabel="PLAY"
        />
      </div>
    </div>
  );
}
