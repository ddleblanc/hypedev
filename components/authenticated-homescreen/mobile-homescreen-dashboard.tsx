'use client';

import { MobileHomescreenStats } from './mobile-homescreen-stats';
import { MobileMissionsCard } from './mobile-missions-card';
import { MobileTrendingCard } from './mobile-trending-card';
import { MobileQuickActions } from './mobile-quick-actions';

interface Mission {
  title: string;
  progress: number;
  reward: string;
  status: 'active' | 'completed';
}

interface TrendingCollection {
  name: string;
  floor: string;
  change: string;
  image: string;
  type: 'video' | 'image';
}

interface MobileHomescreenDashboardProps {
  userStats: {
    nftCount: number;
    hyperTokens: number;
    level: number;
  };
  missions: Mission[];
  trendingCollections: TrendingCollection[];
  currentTrendingIndex: number;
  onQuickAction: (actionId: string) => void;
}

export function MobileHomescreenDashboard({
  userStats,
  missions,
  trendingCollections,
  currentTrendingIndex,
  onQuickAction
}: MobileHomescreenDashboardProps) {
  return (
    <div className="relative z-10 overflow-y-auto pb-32">
      {/* Top Spacer - Let background shine through */}
      <div className="h-[120px]" />

      {/* Stats Grid */}
      <MobileHomescreenStats
        nftCount={userStats.nftCount}
        hyperTokens={userStats.hyperTokens}
        level={userStats.level}
      />

      {/* Spacer */}
      <div className="h-12" />

      {/* Active Missions */}
      <MobileMissionsCard missions={missions} />

      {/* Spacer */}
      <div className="h-12" />

      {/* Trending Collections Carousel */}
      <MobileTrendingCard
        collections={trendingCollections}
        currentIndex={currentTrendingIndex}
      />

      {/* Spacer */}
      <div className="h-12" />

      {/* Quick Actions */}
      <MobileQuickActions onActionClick={onQuickAction} />

      {/* Bottom Spacer - Let background shine through */}
      <div className="h-[160px]" />
    </div>
  );
}
