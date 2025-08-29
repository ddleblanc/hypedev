"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useWalletAuth, AuthUser } from "@/hooks/use-wallet-auth";
import { HomeView } from "./authenticated-homescreen/home-view";
import { TradeView } from "./authenticated-homescreen/trade-view";
import { P2PView } from "./authenticated-homescreen/p2p-view";
import { MarketplaceContainer } from "./marketplace-container";
import { PlayView } from "./authenticated-homescreen/play-view";
import { CasualGamesView } from "./authenticated-homescreen/casual-games-view";
import { LaunchpadView } from "./authenticated-homescreen/launchpad-view";
import { MuseumView } from "./authenticated-homescreen/museum-view";
import { StudioView } from "./authenticated-homescreen/studio-view";
import { AppLayout } from "./layouts/app-layout";
import { AppFooter } from "./layouts/app-footer";
import { BackgroundCarousel } from "./background-carousel";

interface AuthenticatedHomescreenProps {
  user: AuthUser;
}

export function AuthenticatedHomescreen({ user }: AuthenticatedHomescreenProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<'home' | 'trade' | 'p2p' | 'marketplace' | 'play' | 'casual' | 'launchpad' | 'museum' | 'studio'>('home');

  // Initialize view mode from URL
  useEffect(() => {
    const view = searchParams.get('view');
    if (view === 'trade' || view === 'p2p' || view === 'marketplace' || view === 'play' || view === 'casual' || view === 'launchpad' || view === 'museum' || view === 'studio') {
      setViewMode(view);
    } else {
      setViewMode('home');
    }
  }, [searchParams]);

  // Update URL when view mode changes
  const handleViewModeChange = (newMode: 'home' | 'trade' | 'p2p' | 'marketplace' | 'play' | 'casual' | 'launchpad' | 'museum' | 'studio') => {
    setViewMode(newMode);
    
    // Update URL without page reload
    const newUrl = newMode === 'home' ? '/' : `/?view=${newMode}`;
    router.push(newUrl, { scroll: false });
  };

  // Add global animations
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes slideInLeft {
        from {
          transform: translateX(-30px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes slideInRight {
        from {
          transform: translateX(30px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes hyperRushEnter {
        0% {
          transform: translateX(-120vw);
          opacity: 0;
        }
        10% {
          opacity: 0.3;
        }
        50% {
          transform: translateX(-20vw);
          opacity: 1;
        }
        100% {
          transform: translateX(20vw);
          opacity: 0;
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

  const shouldShowFooter = viewMode !== 'home';

  return (
    <>
      <AppLayout 
        viewMode={viewMode}
        showFooter={shouldShowFooter}
      >
        {viewMode === 'home' ? (
          <HomeView setViewMode={handleViewModeChange} />
        ) : viewMode === 'trade' ? (
          <TradeView setViewMode={handleViewModeChange} />
        ) : viewMode === 'p2p' ? (
          <P2PView setViewMode={handleViewModeChange} />
        ) : viewMode === 'play' ? (
          <PlayView setViewMode={handleViewModeChange} />
        ) : viewMode === 'casual' ? (
          <CasualGamesView onBack={() => handleViewModeChange('play')} />
        ) : viewMode === 'launchpad' ? (
          <LaunchpadView setViewMode={handleViewModeChange} />
        ) : viewMode === 'museum' ? (
          <MuseumView setViewMode={handleViewModeChange} />
        ) : viewMode === 'studio' ? (
          <StudioView setViewMode={handleViewModeChange} />
        ) : (
          <MarketplaceContainer setViewMode={handleViewModeChange} />
        )}
      </AppLayout>
      <BackgroundCarousel />
    </>
  );
}