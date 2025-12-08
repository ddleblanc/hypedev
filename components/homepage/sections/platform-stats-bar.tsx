"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Layers, Users, ShoppingBag, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedCounter, formatCompactNumber } from "@/components/shared/animated-counter";
import { LiveIndicator } from "@/components/shared/live-indicator";
import type { PlatformStats } from "@/types/homepage";

interface PlatformStatsBarProps {
  className?: string;
}

interface StatItemProps {
  label: string;
  value: number;
  formattedValue?: string;
  change?: string;
  icon: React.ReactNode;
  iconColor: string;
  delay?: number;
  isLive?: boolean;
}

function StatItem({
  label,
  value,
  formattedValue,
  change,
  icon,
  iconColor,
  delay = 0,
  isLive = false,
}: StatItemProps) {
  const isPositive = change?.startsWith("+");
  const isNegative = change?.startsWith("-");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
      className="flex items-center gap-3 group"
    >
      <div className={cn(
        "p-2 md:p-2.5 rounded-lg bg-white/5 transition-colors group-hover:bg-white/10",
        "relative overflow-hidden"
      )}>
        <div className={cn("relative z-10", iconColor)}>
          {icon}
        </div>
        {/* Subtle glow effect on hover */}
        <div className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity",
          "bg-gradient-radial from-white/10 to-transparent"
        )} />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-white/50 text-[10px] md:text-xs uppercase tracking-wider">{label}</p>
          {isLive && <LiveIndicator variant="minimal" size="sm" />}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-base md:text-xl tabular-nums">
            {formattedValue || (
              <AnimatedCounter
                value={value}
                duration={1500}
                formatFn={formatCompactNumber}
              />
            )}
          </span>
          {change && (
            <span
              className={cn(
                "text-[10px] md:text-xs font-medium flex items-center gap-0.5",
                isPositive && "text-green-400",
                isNegative && "text-red-400",
                !isPositive && !isNegative && "text-white/50"
              )}
            >
              {isPositive && <TrendingUp className="w-3 h-3" />}
              {isNegative && <TrendingDown className="w-3 h-3" />}
              {change}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function PlatformStatsBar({ className }: PlatformStatsBarProps) {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/homepage/stats");
        const data = await response.json();
        if (data.success && data.stats) {
          setStats(data.stats);
        }
      } catch (error) {
        console.error("Error fetching platform stats:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={cn("bg-zinc-900/50 border-y border-white/5", className)}>
        <div className="container mx-auto px-4 md:px-8 py-3 md:py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 md:w-10 md:h-10 bg-white/5 rounded-lg animate-pulse" />
                <div className="space-y-1.5">
                  <div className="h-2.5 w-14 md:w-16 bg-white/5 rounded animate-pulse" />
                  <div className="h-4 md:h-5 w-16 md:w-24 bg-white/5 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className={cn(
      "bg-zinc-900/50 border-y border-white/5 backdrop-blur-sm",
      "relative overflow-hidden",
      className
    )}>
      {/* Subtle animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-[rgb(163,255,18)]/[0.02] via-transparent to-purple-500/[0.02] animate-gradient-x-slow" />

      <div className="container mx-auto px-4 md:px-8 py-3 md:py-4 relative">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          <StatItem
            label="Total Volume"
            value={stats.totalVolume}
            formattedValue={stats.totalVolumeFormatted}
            change={stats.volumeChange24h}
            icon={<DollarSign className="w-4 h-4 md:w-5 md:h-5" />}
            iconColor="text-[rgb(163,255,18)]"
            delay={0}
          />
          <StatItem
            label="Collections"
            value={stats.collectionsCount}
            icon={<Layers className="w-4 h-4 md:w-5 md:h-5" />}
            iconColor="text-purple-400"
            delay={0.1}
          />
          <StatItem
            label="Users"
            value={stats.usersCount}
            icon={<Users className="w-4 h-4 md:w-5 md:h-5" />}
            iconColor="text-blue-400"
            delay={0.2}
          />
          <StatItem
            label="24h Sales"
            value={stats.sales24h}
            change={stats.salesChange24h}
            icon={<ShoppingBag className="w-4 h-4 md:w-5 md:h-5" />}
            iconColor="text-orange-400"
            delay={0.3}
            isLive={true}
          />
        </div>
      </div>
    </div>
  );
}
