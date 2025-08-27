"use client";

import React, { useEffect } from "react";
import { useAppNavigation } from "@/contexts/app-navigation-context";
import { HomeView } from "@/components/authenticated-homescreen/home-view";
import { TradeView } from "@/components/authenticated-homescreen/trade-view";
import { PlayView } from "@/components/authenticated-homescreen/play-view";
import { P2PView } from "@/components/authenticated-homescreen/p2p-view";
import { MarketplaceView } from "@/components/authenticated-homescreen/marketplace-view";
import { CasualGamesView } from "@/components/authenticated-homescreen/casual-games-view";
import { LaunchpadView } from "@/components/authenticated-homescreen/launchpad-view";
import { MuseumView } from "@/components/authenticated-homescreen/museum-view";
import { StudioView } from "@/components/authenticated-homescreen/studio-view";
import { AuthenticatedLayout } from "@/components/layouts/authenticated-layout";
import { AppFooter } from "@/components/layouts/app-footer";
import { BackgroundCarousel } from "@/components/background-carousel";

export function SinglePageApp() {
  const { navigationState, navigateToRoute, getCurrentRoute } = useAppNavigation();

  const handleNavigate = (newMode: string) => {
    navigateToRoute(newMode as any);
  };

  const handleBack = (destination: string) => {
    navigateToRoute(destination as any);
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

  const renderCurrentView = () => {
    const currentRoute = getCurrentRoute();
    
    switch (currentRoute) {
      case 'home':
        return <HomeView setViewMode={handleNavigate} />;
      case 'trade':
        return <TradeView setViewMode={handleNavigate} />;
      case 'play':
        return <PlayView setViewMode={handleNavigate} />;
      case 'p2p':
        return <P2PView setViewMode={handleNavigate} />;
      case 'marketplace':
        return <MarketplaceView setViewMode={handleNavigate} />;
      case 'casual':
        return <CasualGamesView onBack={() => handleBack('play')} />;
      case 'launchpad':
        return <LaunchpadView setViewMode={handleNavigate} />;
      case 'museum':
        return <MuseumView setViewMode={handleNavigate} />;
      case 'studio':
        return <StudioView setViewMode={handleNavigate} />;
      default:
        return <HomeView setViewMode={handleNavigate} />;
    }
  };

  const shouldShowFooter = navigationState.currentRoute !== 'home';

  return (
    <>
      <AuthenticatedLayout
        showFooter={shouldShowFooter}
        footerContent={
          shouldShowFooter ? (
            <AppFooter 
              viewMode={navigationState.currentRoute}
              onNavigate={handleNavigate}
            />
          ) : null
        }
      >
        {renderCurrentView()}
      </AuthenticatedLayout>
      <BackgroundCarousel />
    </>
  );
}