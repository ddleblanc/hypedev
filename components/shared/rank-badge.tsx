"use client";

import React from "react";
import { Crown, Medal, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface RankBadgeProps {
  rank: number;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "text-sm w-6 h-6",
  md: "text-base w-8 h-8",
  lg: "text-lg w-10 h-10",
};

const iconSizes = {
  sm: "w-3 h-3",
  md: "w-4 h-4",
  lg: "w-5 h-5",
};

export function RankBadge({
  rank,
  size = "md",
  showIcon = true,
  className,
}: RankBadgeProps) {
  const isTop3 = rank <= 3;

  // Get styling based on rank
  const getRankStyle = () => {
    switch (rank) {
      case 1:
        return {
          bg: "bg-gradient-to-br from-yellow-400 to-amber-600",
          text: "text-black",
          shadow: "shadow-lg shadow-yellow-500/30",
          icon: <Crown className={cn(iconSizes[size], "text-black")} />,
        };
      case 2:
        return {
          bg: "bg-gradient-to-br from-gray-300 to-gray-500",
          text: "text-black",
          shadow: "shadow-lg shadow-gray-400/30",
          icon: <Medal className={cn(iconSizes[size], "text-black")} />,
        };
      case 3:
        return {
          bg: "bg-gradient-to-br from-amber-600 to-amber-800",
          text: "text-white",
          shadow: "shadow-lg shadow-amber-600/30",
          icon: <Trophy className={cn(iconSizes[size], "text-white")} />,
        };
      default:
        return {
          bg: "bg-white/10",
          text: "text-white/60",
          shadow: "",
          icon: null,
        };
    }
  };

  const style = getRankStyle();

  if (isTop3 && showIcon) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-full font-bold",
          sizeClasses[size],
          style.bg,
          style.text,
          style.shadow,
          "transition-transform hover:scale-110",
          className
        )}
      >
        {style.icon}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full font-bold",
        sizeClasses[size],
        isTop3 ? style.bg : "bg-transparent",
        isTop3 ? style.text : "text-white/60",
        isTop3 ? style.shadow : "",
        className
      )}
    >
      {rank}
    </div>
  );
}

// Inline rank display for table rows
export function InlineRank({
  rank,
  className,
}: {
  rank: number;
  className?: string;
}) {
  const isTop3 = rank <= 3;

  const getColor = () => {
    switch (rank) {
      case 1:
        return "text-yellow-400";
      case 2:
        return "text-gray-400";
      case 3:
        return "text-amber-600";
      default:
        return "text-white/60";
    }
  };

  return (
    <span
      className={cn(
        "font-bold text-lg tabular-nums",
        getColor(),
        isTop3 && "drop-shadow-[0_0_8px_currentColor]",
        className
      )}
    >
      {rank}
    </span>
  );
}
