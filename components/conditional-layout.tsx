"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, createContext, useContext, useCallback, useMemo } from "react";
import { NFTMarketplaceSidebar } from "@/components/nft-marketplace-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useWalletAuthOptimized } from "@/hooks/use-wallet-auth-optimized";
import { PersistentBackground } from "@/components/persistent-background";
import { SinglePageApp } from "@/components/single-page-app";
import { AppNavigationProvider, useAppNavigation } from "@/contexts/app-navigation-context";
import { StudioProvider, useStudio } from "@/contexts/studio-context";
import { useRightSidebarStore } from "@/hooks/use-right-sidebar-store";
import { AnimatedHeader } from "@/components/animated-ui/animated-header";
import { AnimatedFooter } from "@/components/animated-ui/animated-footer";
import { AnimatedSidebar } from "@/components/animated-ui/animated-sidebar";
import { RightAnimatedSidebar } from "@/components/animated-ui/right-animated-sidebar";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

// Context for studio header integration
interface StudioHeaderContextType {
  registerStudioViewHandler: (handler: (view: string) => void) => void;
  updateCurrentStudioView: (view: string) => void;
}

const StudioHeaderContext = createContext<StudioHeaderContextType | null>(null);

export const useStudioHeader = () => {
  const context = useContext(StudioHeaderContext);
  return context; // Can be null if not in studio context
};

// Progressive UI state management
interface ProgressiveUIState {
  showHeader: boolean;
  showFooter: boolean;
  showSidebar: boolean;
  showRightSidebar: boolean;
  navigationDepth: number;
  previousRoute: string | null;
}

function ProgressiveUIWrapper({ children }: { children: React.ReactNode }) {
  const { navigationState, navigateToRoute } = useAppNavigation();
  const { studioData } = useStudio();
  const { isRightSidebarOpen } = useRightSidebarStore();
  const [uiState, setUiState] = useState<ProgressiveUIState>({
    showHeader: false,
    showFooter: false,
    showSidebar: false,
    showRightSidebar: false,
    navigationDepth: 0,
    previousRoute: null
  });
  
  // Studio navigation state management
  const [currentStudioView, setCurrentStudioView] = useState<string>('dashboard');
  const [studioViewChangeHandler, setStudioViewChangeHandler] = useState<((view: string) => void) | null>(null);
  
  // P2P sidebar state management
  const [p2pSearchQuery, setP2pSearchQuery] = useState<string>('');
  const [p2pGridViewMode, setP2pGridViewMode] = useState<'grid' | 'list'>('grid');
  
  // P2P right sidebar data
  const [p2pRightSidebarData] = useState({
    activeOffers: 12,
    pendingTrades: 5,
    totalVolume: '247.8 ETH',
    successRate: 94.2,
    trustScore: 4.8
  });

  // 1v1 right sidebar data
  const [oneVsOneRightSidebarData] = useState({
    onlineOpponents: 47,
    activeMatches: 12,
    rankPoints: 2156,
    winRate: 87.5,
    currentRank: 'MASTER'
  });

  // Track navigation and update UI state based on current route and right sidebar state
  useEffect(() => {
    const pathname = window.location.pathname;
    // If the SPA navigation state isn't initialized (because the app uses real Next.js routes),
    // infer a route from the current pathname so the ProgressiveUI shows correctly on real routes.
    const inferredRoute = (() => {
      if (navigationState.currentRoute) return navigationState.currentRoute;
      if (pathname.startsWith('/studio')) return 'studio';
      if (pathname.startsWith('/marketplace')) return 'marketplace';
      if (pathname.startsWith('/p2p')) return 'p2p';
      if (pathname.startsWith('/play/1v1')) return 'play-1v1';
      if (pathname.startsWith('/play')) return 'play';
      if (pathname.startsWith('/trade')) return 'trade';
      if (pathname === '/') return 'home';
      if (pathname.startsWith('/launchpad')) return 'launchpad';
      if (pathname.startsWith('/museum')) return 'museum';
      if (pathname.startsWith('/casual')) return 'casual';
      return navigationState.currentRoute || 'home';
    })();
 
    // Progressive reveal logic (use inferredRoute so real routes trigger correct UI)
    if (inferredRoute === 'home') {
      // Home: Minimal UI - no solid elements
      setUiState({
        showHeader: false,
        showFooter: false,
        showSidebar: false,
        showRightSidebar: false,
        navigationDepth: 0,
        previousRoute: navigationState.currentRoute
      });
    } else if (inferredRoute === 'trade') {
      // Trade: Add header and footer
      setUiState(prev => ({
        showHeader: true,
        showFooter: true,
        showSidebar: false,
        showRightSidebar: false,
        navigationDepth: 1,
        previousRoute: prev.previousRoute || 'home'
      }));
    } else if (inferredRoute === 'marketplace') {
      // Marketplace: Add sidebar (keeping header and footer)
      setUiState(prev => ({
        showHeader: true,
        showFooter: true,
        showSidebar: true,
        showRightSidebar: false,
        navigationDepth: 2,
        previousRoute: prev.previousRoute || 'trade'
      }));
    } else if (inferredRoute === 'studio') {
      // Studio: Show header, footer, and sidebar
      setUiState(prev => ({
        showHeader: true,
        showFooter: true,
        showSidebar: true,
        showRightSidebar: false,
        navigationDepth: 2,
        previousRoute: prev.previousRoute || 'home'
      }));
    } else if (inferredRoute === 'p2p') {
      // P2P: Show header, footer, left sidebar, and RIGHT sidebar
      setUiState(prev => ({
        showHeader: true,
        showFooter: true,
        showSidebar: true,
        showRightSidebar: true,
        navigationDepth: 2,
        previousRoute: prev.previousRoute || 'home'
      }));
    } else if (inferredRoute === 'play-1v1') {
      // 1v1: Show header, footer, left sidebar, and RIGHT sidebar
      setUiState(prev => ({
        showHeader: true,
        showFooter: true,
        showSidebar: true,
        showRightSidebar: true,
        navigationDepth: 2,
        previousRoute: prev.previousRoute || 'play'
      }));
    } else if (pathname === '/play/1v1') {
      // 1v1 route: Show header, footer, and right sidebar based on context
      setUiState(prev => ({
        showHeader: true,
        showFooter: true,
        showSidebar: false,
        showRightSidebar: isRightSidebarOpen,
        navigationDepth: 2,
        previousRoute: prev.previousRoute || 'play'
      }));
    } else if (['play', 'launchpad', 'museum'].includes(inferredRoute)) {
      // Other views: Show header and footer, but no sidebar
      setUiState(prev => ({
        showHeader: true,
        showFooter: true,
        showSidebar: false,
        showRightSidebar: false,
        navigationDepth: 1,
        previousRoute: prev.previousRoute || 'home'
      }));
    } else if (inferredRoute === 'casual') {
      // Casual: Full UI with sidebar
      setUiState(prev => ({
        showHeader: true,
        showFooter: true,
        showSidebar: true,
        showRightSidebar: false,
        navigationDepth: 2,
        previousRoute: prev.previousRoute || 'play'
      }));
    }
  }, [navigationState.currentRoute, isRightSidebarOpen]);

  const handleNavigate = (route: string) => {
    // Check if we're going back (reducing depth)
    const isGoingBack = 
      (route === 'home' && uiState.navigationDepth > 0) ||
      (route === 'trade' && uiState.navigationDepth > 1) ||
      (uiState.previousRoute === route);

    if (isGoingBack) {
      // Animate out elements in reverse order
      if (uiState.showSidebar) {
        setUiState(prev => ({ ...prev, showSidebar: false }));
        setTimeout(() => {
          if (route === 'home') {
            setUiState(prev => ({ ...prev, showHeader: false, showFooter: false }));
          }
          navigateToRoute(route as any);
        }, 200);
      } else if (uiState.showHeader && route === 'home') {
        setUiState(prev => ({ ...prev, showHeader: false, showFooter: false }));
        setTimeout(() => navigateToRoute(route as any), 200);
      } else {
        navigateToRoute(route as any);
      }
    } else {
      // Normal forward navigation
      navigateToRoute(route as any);
    }
  };

  // Handle studio view changes from AnimatedHeader
  const handleStudioViewChange = useCallback((view: string) => {
    setCurrentStudioView(view);
    if (studioViewChangeHandler) {
      studioViewChangeHandler(view);
    }
  }, [studioViewChangeHandler]);

  // Function to register studio view change handler from StudioView component
  const registerStudioViewHandler = useCallback((handler: (view: string) => void) => {
    setStudioViewChangeHandler(() => handler);
  }, []);

  // Function to update current studio view (called from StudioView)
  const updateCurrentStudioView = useCallback((view: string) => {
    setCurrentStudioView(view);
  }, []);

  const studioHeaderContextValue = useMemo(() => ({
    registerStudioViewHandler,
    updateCurrentStudioView
  }), [registerStudioViewHandler, updateCurrentStudioView]);

  // P2P data for AnimatedSidebar
  const p2pData = useMemo(() => ({
    searchQuery: p2pSearchQuery,
    onSearchChange: setP2pSearchQuery,
    gridViewMode: p2pGridViewMode,
    onGridViewModeChange: setP2pGridViewMode
  }), [p2pSearchQuery, p2pGridViewMode]);

  return (
    <>
      {/* Progressive UI Elements */}
      <AnimatedHeader 
        show={uiState.showHeader} 
        onNavigate={handleNavigate}
        currentRoute={navigationState.currentRoute}
        onStudioViewChange={handleStudioViewChange}
        currentStudioView={currentStudioView}
      />
      <AnimatedFooter show={uiState.showFooter} />
      <AnimatedSidebar 
        show={uiState.showSidebar} 
        currentRoute={navigationState.currentRoute}
        studioData={studioData || undefined}
        p2pData={p2pData}
      />
      <RightAnimatedSidebar 
        show={uiState.showRightSidebar}
        currentRoute={window.location.pathname === '/play/1v1' ? 'play-1v1' : navigationState.currentRoute}
        p2pData={p2pRightSidebarData}
        oneVsOneData={oneVsOneRightSidebarData}
      />
      
      {/* Main content with padding adjustments */}
      <div className={`
        transition-all duration-300 ease-in-out
        ${uiState.showSidebar ? 'pl-80' : 'pl-0'}
        ${uiState.showRightSidebar ? 'pr-80' : 'pr-0'}
      `}>
        <StudioHeaderContext.Provider value={studioHeaderContextValue}>
          {children}
        </StudioHeaderContext.Provider>
      </div>
    </>
  );
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const { user, isConnected } = useWalletAuthOptimized();
  
  const isStudioRoute = pathname?.startsWith('/studio');
  const isCollectionRoute = pathname?.startsWith('/collection');
  
  // Define authenticated app routes
  const isAppRoute = pathname === '/' ||
    pathname === '/trade' ||
    pathname === '/play' ||
    pathname === '/play/1v1' ||
    pathname === '/p2p' ||
    pathname === '/marketplace' ||
    pathname === '/casual' ||
    pathname === '/launchpad' ||
    pathname === '/museum' ||
    pathname === '/studio' ||
    pathname === '/lootboxes' ||
    pathname?.startsWith('/lootboxes/');

  // Check if user is authenticated and on an app route
  const isAuthenticatedAppRoute = user && isConnected && isAppRoute;

  // For authenticated app routes, use single-page app with persistent background and progressive UI
  if (isAuthenticatedAppRoute) {
    return (
      <AppNavigationProvider>
        <StudioProvider>
          <PersistentBackground>
            <ProgressiveUIWrapper>
              <SinglePageApp />
            </ProgressiveUIWrapper>
          </PersistentBackground>
        </StudioProvider>
      </AppNavigationProvider>
    );
  }

  // Ensure Studio always mounts inside the ProgressiveUI so global animated bars are active
  if (isStudioRoute) {
    return (
      <AppNavigationProvider>
        <StudioProvider>
          <PersistentBackground>
            <ProgressiveUIWrapper>
              {children}
            </ProgressiveUIWrapper>
          </PersistentBackground>
        </StudioProvider>
      </AppNavigationProvider>
    );
  }

  // For collection pages and homepage when not authenticated, keep existing behavior
  if (isCollectionRoute || pathname === '/') {
    return <>{children}</>;
  }

  // Non-authenticated users on other routes: Use NFTMarketplaceSidebar
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <NFTMarketplaceSidebar />
        <SidebarInset className="flex-1 min-w-0 w-full transition-all duration-300 ease-in-out">
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}