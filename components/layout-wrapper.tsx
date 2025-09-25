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
    return <ProgressiveUIWrapper>{children}</ProgressiveUIWrapper>;
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
  
  // Calculate initial UI state based on current route
  const getInitialUIState = (): ProgressiveUIState => {
    const segments = pathname.split('/').filter(Boolean);
    let currentRoute = 'home';
    
    if (pathname === '/') {
      currentRoute = 'home';
    } else if (segments[0] === 'play' && segments[1]) {
      currentRoute = `play-${segments[1]}`;
    } else if (segments[0] === 'lootboxes') {
      if (segments[1] === 'reveal') {
        currentRoute = 'lootboxes-reveal';
      } else if (segments[1]) {
        currentRoute = 'lootboxes-detail';
      } else {
        currentRoute = 'lootboxes';
      }
    } else {
      currentRoute = segments[0] || 'home';
    }

    // Check if mobile on initial load
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const isPlaySubRoute = currentRoute.startsWith('play-');
    
    if (currentRoute === 'home') {
      return { showHeader: false, showFooter: false, showSidebar: false, showRightSidebar: false, navigationDepth: 0, previousRoute: null };
    } else if (currentRoute === 'trade') {
      return { showHeader: true, showFooter: false, showSidebar: false, showRightSidebar: false, navigationDepth: 1, previousRoute: 'home' };
    } else if (currentRoute === 'marketplace') {
      return { 
        showHeader: !isMobile, 
        showFooter: !isMobile, 
        showSidebar: !isMobile, 
        showRightSidebar: false, 
        navigationDepth: 2, 
        previousRoute: 'home' 
      };
    } else if (currentRoute === 'studio') {
      return { 
        showHeader: true, 
        showFooter: !isMobile, 
        showSidebar: !isMobile, 
        showRightSidebar: false, 
        navigationDepth: 2, 
        previousRoute: 'home' 
      };
    } else if (currentRoute === 'p2p') {
      return { 
        showHeader: true, 
        showFooter: !isMobile, 
        showSidebar: !isMobile, 
        showRightSidebar: !isMobile, 
        navigationDepth: 2, 
        previousRoute: 'home' 
      };
    } else if (isPlaySubRoute) {
      return { 
        showHeader: true, 
        showFooter: !isMobile, 
        showSidebar: !isMobile, 
        showRightSidebar: false, 
        navigationDepth: 2, 
        previousRoute: 'play' 
      };
    } else if (currentRoute === 'lootboxes') {
      return { showHeader: false, showFooter: false, showSidebar: false, showRightSidebar: false, navigationDepth: 0, previousRoute: 'home' };
    } else if (currentRoute === 'lootboxes-reveal') {
      return { showHeader: true, showFooter: false, showSidebar: false, showRightSidebar: false, navigationDepth: 1, previousRoute: 'home' };
    } else if (currentRoute === 'lootboxes-detail') {
      return { 
        showHeader: true, 
        showFooter: false, 
        showSidebar: !isMobile, 
        showRightSidebar: false, 
        navigationDepth: 2, 
        previousRoute: 'lootboxes-reveal' 
      };
    } else if (currentRoute === 'collection') {
      return { 
        showHeader: true, 
        showFooter: !isMobile, 
        showSidebar: false, 
        showRightSidebar: false, 
        navigationDepth: 2, 
        previousRoute: 'marketplace' 
      };
    } else if (['play', 'launchpad', 'museum'].includes(currentRoute)) {
      return { 
        showHeader: true, 
        showFooter: !isMobile, 
        showSidebar: false, 
        showRightSidebar: false, 
        navigationDepth: 1, 
        previousRoute: 'home' 
      };
    }
    
    return { showHeader: false, showFooter: false, showSidebar: false, showRightSidebar: false, navigationDepth: 0, previousRoute: null };
  };
  
  const [uiState, setUiState] = useState<ProgressiveUIState>(getInitialUIState());
  const [isMobile, setIsMobile] = useState(false);
  
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

  // Lootbox sidebar data
  const [lootboxData] = useState({
    availableLootboxes: [
      {
        id: '1',
        name: "Warrior's Arsenal",
        collection: "COMBAT COLLECTION",
        image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/1ad84358-5802-4eae-b74b-f6c880d38ea5/width=450/00027-613255485.jpeg",
        price: 0.25,
        discountPrice: 0.22,
        discountPercent: 12,
        rarity: "Epic",
        totalSupply: 10000,
        remaining: 6579,
        category: 'Epic',
        accentColor: 'purple'
      },
      {
        id: '2',
        name: "Mystic Treasures",
        collection: "MAGIC COLLECTION",
        image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/a770baa3-875b-4e1d-9f8f-3a0f533e3f96/width=450/00028-613255486.jpeg",
        price: 0.35,
        discountPrice: null,
        discountPercent: 0,
        rarity: "Legendary",
        totalSupply: 5000,
        remaining: 2900,
        category: 'Legendary',
        accentColor: 'amber'
      },
      {
        id: '3',
        name: "Cosmic Cache",
        collection: "UNIVERSE COLLECTION",
        image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/7f64191f-c494-492e-ab3d-21fb88686523/width=450/cosmic.jpeg",
        price: 0.5,
        discountPrice: 0.45,
        discountPercent: 10,
        rarity: "Legendary",
        totalSupply: 3000,
        remaining: 1800,
        category: 'Legendary',
        accentColor: 'red'
      },
      {
        id: '4',
        name: "Shadow Vault",
        collection: "STEALTH COLLECTION",
        image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/shadow-vault.jpeg",
        price: 0.18,
        discountPrice: null,
        discountPercent: 0,
        rarity: "Rare",
        totalSupply: 15000,
        remaining: 8234,
        category: 'Rare',
        accentColor: 'blue'
      }
    ]
  });

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Convert pathname to route for UI state management
  const getCurrentRoute = () => {
    if (pathname === '/') return 'home';
    const segments = pathname.split('/').filter(Boolean);
    
    if (segments[0] === 'play' && segments[1]) {
      return `play-${segments[1]}`;
    }
    
    if (segments[0] === 'lootboxes') {
      if (segments[1] === 'reveal') {
        return 'lootboxes-reveal';
      } else if (segments[1]) {
        return 'lootboxes-detail';
      } else {
        return 'lootboxes';
      }
    }
    
    return segments[0] || 'home';
  };
  
  const currentRoute = getCurrentRoute();
  const isPlaySubRoute = currentRoute.startsWith('play-');

  // Update UI state based on current route and mobile status
  useEffect(() => {
    let newState: Partial<ProgressiveUIState> = {};
    
    if (currentRoute === 'home') {
      newState = {
        showHeader: false,
        showFooter: false,
        showSidebar: false,
        showRightSidebar: false,
        navigationDepth: 0,
        previousRoute: 'home'
      };
    } else if (['trade', 'play'].includes(currentRoute)) {
      newState = {
        showHeader: true,
        showFooter: false,
        showSidebar: false,
        showRightSidebar: false,
        navigationDepth: 1,
        previousRoute: 'home'
      };
    } else if (currentRoute === 'marketplace') {
      // Marketplace: Hide sidebars on mobile, show on desktop
      newState = {
        showHeader: !isMobile, // Hide global header on mobile (marketplace has its own)
        showFooter: !isMobile,
        showSidebar: !isMobile,
        showRightSidebar: false,
        navigationDepth: 2,
        previousRoute: 'home'
      };
    } else if (currentRoute === 'studio') {
      newState = {
        showHeader: true,
        showFooter: !isMobile,
        showSidebar: !isMobile,
        showRightSidebar: false,
        navigationDepth: 2,
        previousRoute: 'home'
      };
    } else if (currentRoute === 'p2p') {
      newState = {
        showHeader: true,
        showFooter: !isMobile,
        showSidebar: !isMobile,
        showRightSidebar: !isMobile,
        navigationDepth: 2,
        previousRoute: 'home'
      };
    } else if (isPlaySubRoute) {
      newState = {
        showHeader: true,
        showFooter: !isMobile,
        showSidebar: !isMobile,
        showRightSidebar: false,
        navigationDepth: 2,
        previousRoute: 'play'
      };
    } else if (currentRoute === 'lootboxes') {
      newState = {
        showHeader: false,
        showFooter: false,
        showSidebar: false,
        showRightSidebar: false,
        navigationDepth: 0,
        previousRoute: 'home'
      };
    } else if (currentRoute === 'lootboxes-reveal') {
      newState = {
        showHeader: true,
        showFooter: false,
        showSidebar: false,
        showRightSidebar: false,
        navigationDepth: 1,
        previousRoute: 'home'
      };
    } else if (currentRoute === 'lootboxes-detail') {
      newState = {
        showHeader: true,
        showFooter: false,
        showSidebar: !isMobile,
        showRightSidebar: false,
        navigationDepth: 2,
        previousRoute: 'lootboxes-reveal'
      };
    } else if (currentRoute === 'collection') {
      newState = {
        showHeader: true,
        showFooter: !isMobile,
        showSidebar: false,
        showRightSidebar: false,
        navigationDepth: 2,
        previousRoute: 'marketplace'
      };
    } else if (['launchpad', 'museum'].includes(currentRoute)) {
      newState = {
        showHeader: true,
        showFooter: !isMobile,
        showSidebar: false,
        showRightSidebar: false,
        navigationDepth: 1,
        previousRoute: 'home'
      };
    }
    
    // Only update state if there are actual changes
    setUiState(prev => {
      const hasChanges = Object.keys(newState).some(key => 
        prev[key as keyof ProgressiveUIState] !== newState[key as keyof ProgressiveUIState]
      );
      
      if (!hasChanges) {
        return prev;
      }
      
      return { ...prev, ...newState };
    });
  }, [currentRoute, isPlaySubRoute, isMobile]);

  // Handle studio view changes from AnimatedHeader
  const handleStudioViewChange = useCallback((view: string) => {
    setCurrentStudioView(view);
    if (studioViewChangeHandler) {
      studioViewChangeHandler(view);
    }
  }, [studioViewChangeHandler]);

  // Function to register studio view change handler
  const registerStudioViewHandler = useCallback((handler: (view: string) => void) => {
    setStudioViewChangeHandler(() => handler);
  }, []);

  // Function to update current studio view
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
    } else if (route.startsWith('lootbox-')) {
      const lootboxId = route.replace('lootbox-', '');
      router.push(`/lootboxes/${lootboxId}`);
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
        studioData={studioData ? {
          searchQuery: studioData.searchQuery || '',
          onSearchChange: studioData.onSearchChange || (() => {}),
          viewMode: studioData.viewMode || 'grid',
          onViewModeChange: studioData.onViewModeChange || (() => {}),
          projects: studioData.projects || [],
          collections: studioData.collections || [],
          nfts: studioData.nfts || []
        } : undefined}
        p2pData={p2pData}
        lootboxData={lootboxData}
        onNavigate={handleNavigate}
      />
      <RightAnimatedSidebar 
        show={uiState.showRightSidebar}
        currentRoute={currentRoute}
        p2pData={p2pRightSidebarData}
      />
      
      {/* Main content with padding adjustments */}
      <div className={`
        transition-all duration-300 ease-in-out
        ${uiState.showSidebar ? 'md:pl-80' : 'pl-0'}
        ${uiState.showRightSidebar ? 'md:pr-80' : 'pr-0'}
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