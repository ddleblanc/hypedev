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
  // Mount Studio inside the ProgressiveUIWrapper so global AnimatedHeader/AnimatedSidebar
  // are active for Studio pages and preserve the fluid persistent animations.
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
  
  // Calculate initial UI state based on current route to prevent transitions
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

    const isPlaySubRoute = currentRoute.startsWith('play-');
    
    if (currentRoute === 'home') {
      return { showHeader: false, showFooter: false, showSidebar: false, showRightSidebar: false, navigationDepth: 0, previousRoute: null };
    } else if (currentRoute === 'trade') {
      return { showHeader: true, showFooter: true, showSidebar: false, showRightSidebar: false, navigationDepth: 1, previousRoute: 'home' };
    } else if (['marketplace', 'studio'].includes(currentRoute)) {
      return { showHeader: true, showFooter: true, showSidebar: true, showRightSidebar: false, navigationDepth: 2, previousRoute: 'home' };
    } else if (currentRoute === 'p2p') {
      return { showHeader: true, showFooter: true, showSidebar: true, showRightSidebar: true, navigationDepth: 2, previousRoute: 'home' };
    } else if (isPlaySubRoute) {
      return { showHeader: true, showFooter: true, showSidebar: true, showRightSidebar: false, navigationDepth: 2, previousRoute: 'play' };
    } else if (currentRoute === 'lootboxes') {
      return { showHeader: false, showFooter: false, showSidebar: false, showRightSidebar: false, navigationDepth: 0, previousRoute: 'home' };
    } else if (currentRoute === 'lootboxes-reveal') {
      return { showHeader: true, showFooter: false, showSidebar: false, showRightSidebar: false, navigationDepth: 1, previousRoute: 'home' };
    } else if (currentRoute === 'lootboxes-detail') {
      return { showHeader: true, showFooter: false, showSidebar: true, showRightSidebar: false, navigationDepth: 2, previousRoute: 'lootboxes-reveal' };
    } else if (currentRoute === 'collection') {
      return { showHeader: true, showFooter: true, showSidebar: false, showRightSidebar: false, navigationDepth: 2, previousRoute: 'marketplace' };
    } else if (['play', 'launchpad', 'museum'].includes(currentRoute)) {
      return { showHeader: true, showFooter: true, showSidebar: false, showRightSidebar: false, navigationDepth: 1, previousRoute: 'home' };
    }
    
    return { showHeader: false, showFooter: false, showSidebar: false, showRightSidebar: false, navigationDepth: 0, previousRoute: null };
  };
  
  const [uiState, setUiState] = useState<ProgressiveUIState>(getInitialUIState());
  
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

  // Lootbox sidebar data - extended from the main page data
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
      },
      {
        id: '5',
        name: "Dragon Hoard",
        collection: "MYTHICAL COLLECTION",
        image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/dragon-hoard.jpeg",
        price: 0.75,
        discountPrice: 0.65,
        discountPercent: 13,
        rarity: "Mythic",
        totalSupply: 2500,
        remaining: 1456,
        category: 'Mythic',
        accentColor: 'orange'
      },
      {
        id: '6',
        name: "Ocean's Depth",
        collection: "AQUATIC COLLECTION",
        image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/ocean-depth.jpeg",
        price: 0.28,
        discountPrice: null,
        discountPercent: 0,
        rarity: "Epic",
        totalSupply: 8000,
        remaining: 4721,
        category: 'Epic',
        accentColor: 'cyan'
      }
    ]
  });

  // Convert pathname to route for UI state management
  const getCurrentRoute = () => {
    if (pathname === '/') return 'home';
    const segments = pathname.split('/').filter(Boolean);
    
    // Handle nested play routes (e.g., /play/casual -> 'play-casual')
    if (segments[0] === 'play' && segments[1]) {
      return `play-${segments[1]}`;
    }
    
    // Handle lootbox routes - differentiate reveal page vs detail pages
    if (segments[0] === 'lootboxes') {
      if (segments[1] === 'reveal') {
        return 'lootboxes-reveal'; // /lootboxes/reveal - reveal page
      } else if (segments[1]) {
        return 'lootboxes-detail'; // /lootboxes/[id] - detail page
      } else {
        return 'lootboxes'; // /lootboxes - base route (if needed)
      }
    }
    
    return segments[0] || 'home';
  };
  
  const currentRoute = getCurrentRoute();
  const isPlaySubRoute = currentRoute.startsWith('play-');

  // Update UI state based on current route
  useEffect(() => {
    let newState: Partial<ProgressiveUIState> = {};
    
    if (currentRoute === 'home') {
      // Home: No UI elements shown
      newState = {
        showHeader: false,
        showFooter: false,
        showSidebar: false,
        showRightSidebar: false,
        navigationDepth: 0,
        previousRoute: 'home'
      };
    } else if (currentRoute === 'trade') {
      // Trade: Show header and footer only
      newState = {
        showHeader: true,
        showFooter: true,
        showSidebar: false,
        showRightSidebar: false,
        navigationDepth: 1,
        previousRoute: 'home'
      };
    } else if (['marketplace', 'studio'].includes(currentRoute)) {
      // Marketplace/Studio: Show header, footer, and sidebar
      newState = {
        showHeader: true,
        showFooter: true,
        showSidebar: true,
        showRightSidebar: false,
        navigationDepth: 2,
        previousRoute: 'home'
      };
    } else if (currentRoute === 'p2p') {
      // P2P: Show header, footer, left sidebar, and RIGHT sidebar
      newState = {
        showHeader: true,
        showFooter: true,
        showSidebar: true,
        showRightSidebar: true,
        navigationDepth: 2,
        previousRoute: 'home'
      };
    } else if (isPlaySubRoute) {
      // Play sub-routes: Show header, footer, and sidebar
      newState = {
        showHeader: true,
        showFooter: true,
        showSidebar: true,
        showRightSidebar: false,
        navigationDepth: 2,
        previousRoute: 'play'
      };
    } else if (currentRoute === 'lootboxes') {
      // Lootboxes base route: No UI elements (if this route is used)
      newState = {
        showHeader: false,
        showFooter: false,
        showSidebar: false,
        showRightSidebar: false,
        navigationDepth: 0,
        previousRoute: 'home'
      };
    } else if (currentRoute === 'lootboxes-reveal') {
      // Lootboxes reveal page: Show header for navigation
      newState = {
        showHeader: true,
        showFooter: false,
        showSidebar: false,
        showRightSidebar: false,
        navigationDepth: 1,
        previousRoute: 'home'
      };
    } else if (currentRoute === 'lootboxes-detail') {
      // Lootbox detail pages: Show header and sidebar
      newState = {
        showHeader: true,
        showFooter: false,
        showSidebar: true,
        showRightSidebar: false,
        navigationDepth: 2,
        previousRoute: 'lootboxes-reveal'
      };
    } else if (currentRoute === 'collection') {
      // Collection: Show header, footer, and sidebar
      newState = {
        showHeader: true,
        showFooter: true,
        showSidebar: false,
        showRightSidebar: false,
        navigationDepth: 2,
        previousRoute: 'marketplace'
      };
    } else if (['play', 'launchpad', 'museum'].includes(currentRoute)) {
      // Other views: Show header and footer, but no sidebar
      newState = {
        showHeader: true,
        showFooter: true,
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
        return prev; // Return previous state to prevent unnecessary re-render
      }
      
      // Debug logging for header issues
      if (newState.showHeader !== prev.showHeader) {
        console.log('Header state changing:', { 
          from: prev.showHeader, 
          to: newState.showHeader, 
          currentRoute,
          timestamp: Date.now() 
        });
      }
      
      return { ...prev, ...newState };
    });
  }, [currentRoute, isPlaySubRoute]);

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
    } else if (route.startsWith('lootbox-')) {
      // Handle lootbox detail navigation (e.g., 'lootbox-1' -> '/lootboxes/1')
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