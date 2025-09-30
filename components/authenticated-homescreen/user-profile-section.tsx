"use client";

import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Star, Crown, Trophy, Wallet } from "lucide-react";

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

export function UserProfileSection() {
  return (
    <motion.div
      className="fixed top-8 lg:top-12 right-8 lg:right-12 z-30"
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="bg-black/60 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 p-4 lg:p-6 hover:border-[rgb(163,255,18)]/40 transition-all duration-300 hover:shadow-2xl hover:shadow-[rgb(163,255,18)]/25">
        {/* User Avatar & Basic Info */}
        <div className="flex items-center gap-3 lg:gap-4 mb-4 lg:mb-6">
          <div className="relative w-12 h-12 lg:w-16 lg:h-16 rounded-xl lg:rounded-2xl overflow-hidden border-2 border-[rgb(163,255,18)]/30">
            <img
              src={mockUserData.profilePicture}
              alt="Profile"
              className="w-full h-full object-cover"
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 lg:w-6 lg:h-6 bg-[rgb(163,255,18)] rounded-full flex items-center justify-center">
              <Crown className="w-2 h-2 lg:w-3 lg:h-3 text-black" />
            </div>
          </div>

          <div className="flex-1">
            <h3 className="text-white text-sm lg:text-lg font-bold">{mockUserData.username}</h3>
            <Badge className="bg-[rgb(163,255,18)]/20 text-[rgb(163,255,18)] border-[rgb(163,255,18)]/30 text-xs">
              {mockUserData.rank}
            </Badge>
          </div>
        </div>

        {/* Level Progress */}
        <div className="mb-4 lg:mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/80 text-xs lg:text-sm">Level {mockUserData.level}</span>
            <span className="text-[rgb(163,255,18)] text-xs lg:text-sm font-bold">{mockUserData.levelProgress}%</span>
          </div>
          <Progress
            value={mockUserData.levelProgress}
            className="h-2 lg:h-3 bg-white/10"
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 lg:gap-4">
          <div className="bg-black/40 rounded-xl p-3 lg:p-4 text-center border border-white/10">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy className="w-3 h-3 lg:w-4 lg:h-4 text-[rgb(163,255,18)]" />
              <span className="text-white text-xs lg:text-sm font-bold">{mockUserData.nftCount}</span>
            </div>
            <p className="text-white/60 text-[10px] lg:text-xs">NFTs</p>
          </div>

          <div className="bg-black/40 rounded-xl p-3 lg:p-4 text-center border border-white/10">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Wallet className="w-3 h-3 lg:w-4 lg:h-4 text-[rgb(163,255,18)]" />
              <span className="text-white text-xs lg:text-sm font-bold">{mockUserData.hyperTokens.toLocaleString()}</span>
            </div>
            <p className="text-white/60 text-[10px] lg:text-xs">HYPER</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}