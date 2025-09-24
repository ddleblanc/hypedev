"use client";

import React from 'react';
import { OneVsOneGamingLayout } from './1v1-gaming-layout';
import { RightAnimatedSidebar } from '@/components/animated-ui/right-animated-sidebar';
import { useRightSidebarStore } from '@/hooks/use-right-sidebar-store';

export function OneVsOnePageWrapper() {
  const { isRightSidebarOpen } = useRightSidebarStore();

  // Mock 1v1 data
  const oneVsOneData = {
    onlineOpponents: 47,
    activeMatches: 12,
    rankPoints: 2156,
    winRate: 87.5,
    currentRank: 'MASTER'
  };

  return (
    <>
      {/* Main content wrapper with padding adjustment */}
      <div className={`
        transition-all duration-300 ease-in-out
        ${isRightSidebarOpen ? 'mr-80' : 'mr-0'}
      `}>
        <OneVsOneGamingLayout />
      </div>
      
      {/* Right sidebar */}
      <RightAnimatedSidebar 
        show={isRightSidebarOpen}
        currentRoute="play-1v1"
        oneVsOneData={oneVsOneData}
      />
    </>
  );
}