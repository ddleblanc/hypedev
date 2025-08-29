"use client";

import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState, useEffect, createContext, useContext, useCallback, useMemo } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { NFTMarketplaceSidebar } from "@/components/nft-marketplace-sidebar";
import { useWalletAuthOptimized } from "@/hooks/use-wallet-auth-optimized";
import { AnimatedHeader } from "@/components/animated-ui/animated-header";
import { AnimatedFooter } from "@/components/animated-ui/animated-footer";
import { AnimatedSidebar } from "@/components/animated-ui/animated-sidebar";
import { RightAnimatedSidebar } from "@/components/animated-ui/right-animated-sidebar";
import { BackgroundCarousel } from "@/components/background-carousel";
import { useStudio } from "@/contexts/studio-context";
import { P2PTradingProvider } from "@/contexts/p2p-trading-context";

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

interface LayoutWrapperProps {
  children: ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const { user, isConnected } = useWalletAuthOptimized();
  
  // Determine layout type based on pathname
  const isStudioRoute = pathname.startsWith('/studio');
  const isCollectionRoute = pathname.startsWith('/collection');
  const isMarketplaceRoute = pathname === '/marketplace' && (!user || !isConnected);
  const isAuthenticatedRoute = [
    '/',
    '/trade',
    '/play',
    '/p2p',
    '/marketplace',
    '/casual',
    '/launchpad',
    '/museum',
    '/studio',
    '/lootboxes',
    '/collection'
  ].some(route => pathname === route || pathname.startsWith(route));

  // Studio routes have their own layout
  if (isStudioRoute) {
    return <>{children}</>;
  }

  // Collection routes use authenticated layout if user is connected
  if (isCollectionRoute && user && isConnected) {
    return <ProgressiveUIWrapper>{children}</ProgressiveUIWrapper>;
  } else if (isCollectionRoute) {
    return <>{children}</>;
  }

  // Non-authenticated marketplace route
  if (isMarketplaceRoute) {
    return (
      <SidebarProvider>
        <NFTMarketplaceSidebar />
        <SidebarInset>
          {children}
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Authenticated routes use progressive UI
  if (isAuthenticatedRoute && user && isConnected) {
    return <ProgressiveUIWrapper>{children}</ProgressiveUIWrapper>;
  }

  // Default: public pages
  return <>{children}</>;
}

// Progressive UI Wrapper for authenticated routes
function ProgressiveUIWrapper({ children }: { children: ReactNode }) {
  const { studioData } = useStudio();
  const pathname = usePathname();
  const router = useRouter();
  
  const [uiState, setUiState] = useState<ProgressiveUIState>({
    showHeader: false,
    showFooter: false,
    showSidebar: false,
    showRightSidebar: false,
    navigationDepth: 0,
    previousRoute: null
  });
  
  const [currentStudioView, setCurrentStudioView] = useState<string>('dashboard');
  const [studioViewChangeHandler, setStudioViewChangeHandler] = useState<((view: string) => void) | null>(null);
  const [p2pSearchQuery, setP2pSearchQuery] = useState('');
  const [p2pGridViewMode, setP2pGridViewMode] = useState<'grid' | 'list'>('grid');
  
  // P2P right sidebar data
  const [p2pRightSidebarData] = useState({
    activeOffers: 12,
    pendingTrades: 5,
    totalVolume: '247.8 ETH',
    successRate: 94.2,
    trustScore: 4.8
  });

  // Convert pathname to route for UI state management
  const getCurrentRoute = () => {
    if (pathname === '/') return 'home';
    const segments = pathname.split('/').filter(Boolean);
    
    // Handle nested play routes (e.g., /play/casual -> 'play-casual')
    if (segments[0] === 'play' && segments[1]) {
      return `play-${segments[1]}`;
    }
    
    return segments[0] || 'home';
  };
  
  const currentRoute = getCurrentRoute();
  const isPlaySubRoute = currentRoute.startsWith('play-');

  // Update UI state based on current route
  useEffect(() => {
    if (currentRoute === 'home') {
      // Home: No UI elements shown
      setUiState(prev => ({
        showHeader: false,
        showFooter: false,
        showSidebar: false,
        showRightSidebar: false,
        navigationDepth: 0,
        previousRoute: prev.previousRoute || 'home'
      }));
    } else if (currentRoute === 'trade') {
      // Trade: Show header and footer only
      setUiState(prev => ({
        showHeader: true,
        showFooter: true,
        showSidebar: false,
        showRightSidebar: false,
        navigationDepth: 1,
        previousRoute: prev.previousRoute || 'home'
      }));
    } else if (['marketplace', 'studio'].includes(currentRoute)) {
      // Marketplace/Studio: Show header, footer, and sidebar
      setUiState(prev => ({
        showHeader: true,
        showFooter: true,
        showSidebar: true,
        showRightSidebar: false,
        navigationDepth: 2,
        previousRoute: prev.previousRoute || 'home'
      }));
    } else if (currentRoute === 'p2p') {
      // P2P: Show header, footer, left sidebar, and RIGHT sidebar
      setUiState(prev => ({
        showHeader: true,
        showFooter: true,
        showSidebar: true,
        showRightSidebar: true,
        navigationDepth: 2,
        previousRoute: prev.previousRoute || 'home'
      }));
    } else if (isPlaySubRoute) {
      // Play sub-routes: Show header, footer, and sidebar
      setUiState(prev => ({
        showHeader: true,
        showFooter: true,
        showSidebar: true,
        showRightSidebar: false,
        navigationDepth: 2,
        previousRoute: prev.previousRoute || 'play'
      }));
    } else if (currentRoute === 'lootboxes') {
      // Lootboxes: Show header only
      setUiState(prev => ({
        showHeader: true,
        showFooter: false,
        showSidebar: false,
        showRightSidebar: false,
        navigationDepth: 1,
        previousRoute: prev.previousRoute || 'home'
      }));
    } else if (currentRoute === 'collection') {
      // Collection: Show header, footer, and sidebar
      setUiState(prev => ({
        showHeader: true,
        showFooter: true,
        showSidebar: false,
        showRightSidebar: false,
        navigationDepth: 2,
        previousRoute: prev.previousRoute || 'marketplace'
      }));
    } else if (['play', 'launchpad', 'museum'].includes(currentRoute)) {
      // Other views: Show header and footer, but no sidebar
      setUiState(prev => ({
        showHeader: true,
        showFooter: true,
        showSidebar: false,
        showRightSidebar: false,
        navigationDepth: 1,
        previousRoute: prev.previousRoute || 'home'
      }));
    }
  }, [currentRoute]);

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

  const handleNavigate = (route: string) => {
    if (route === 'home') {
      router.push('/');
    } else {
      router.push(`/${route}`);
    }
  };

  return (
    <P2PTradingProvider>
      {/* Progressive UI Elements */}
      <AnimatedHeader 
        show={uiState.showHeader} 
        onNavigate={handleNavigate}
        currentRoute={currentRoute}
        onStudioViewChange={handleStudioViewChange}
        currentStudioView={currentStudioView}
      />
      <AnimatedFooter show={uiState.showFooter} />
      <AnimatedSidebar 
        show={uiState.showSidebar} 
        currentRoute={currentRoute}
        studioData={studioData || undefined}
        p2pData={p2pData}
      />
      <RightAnimatedSidebar 
        show={uiState.showRightSidebar}
        currentRoute={currentRoute}
        p2pData={p2pRightSidebarData}
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
      
      {/* Background Carousel for wallpaper selection */}
      <BackgroundCarousel />
    </P2PTradingProvider>
  );
}