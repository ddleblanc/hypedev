"use client";

import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState, useEffect, createContext, useContext, useCallback, useMemo } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { NFTMarketplaceSidebar } from "@/components/nft-marketplace-sidebar";
import { useAuth } from "@/contexts/auth-context";
// ChatWidget removed - only using InlineChatPanel on home page
import { AnimatedHeader } from "@/components/animated-ui/animated-header";
import { AnimatedFooter } from "@/components/animated-ui/animated-footer";
import { AnimatedSidebar } from "@/components/animated-ui/animated-sidebar";
import { RightAnimatedSidebar } from "@/components/animated-ui/right-animated-sidebar";
import { BackgroundCarousel } from "@/components/background-carousel";
import { useStudio } from "@/contexts/studio-context";
import { P2PTradingProvider } from "@/contexts/p2p-trading-context";
import { ListsProvider, useLists } from "@/contexts/lists-context";
import { useP2PHeader } from "@/contexts/p2p-header-context";
import { CollectionProvider, useCollectionOptional } from "@/contexts/collection-context";
import { StudioMobileNav } from "@/components/studio/studio-mobile-nav";
import { motion, AnimatePresence } from "framer-motion";

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
  const { user, isConnected } = useAuth();
  
  // Determine layout type based on pathname
  const isStudioRoute = pathname.startsWith('/studio');
  const isProfileRoute = pathname.startsWith('/profile');
  const isPublicProgressiveRoute = [
    '/discover',
    '/home',
    '/trade',
    '/play',
    '/p2p',
    '/marketplace',
    '/casual',
    '/drops',
    '/museum',
    '/lootboxes',
    '/collection',
    '/lists',
    '/login'
  ].some(route => pathname === route || pathname.startsWith(route));

  // Protected routes that require authentication but use progressive UI
  const isControlCenterRoute = pathname.startsWith('/control-center');

  // Studio, Profile, and Control Center routes require authentication and have their own layout
  if (isStudioRoute || isProfileRoute || isControlCenterRoute) {
    return <ProgressiveUIWrapper>{children}</ProgressiveUIWrapper>;
  }

  // Public routes that should always use the progressive UI (marketplace, drops, collection, etc.)
  if (isPublicProgressiveRoute) {
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
    
    if (pathname === '/discover') {
      currentRoute = 'discover';
    } else if (pathname === '/home') {
      currentRoute = 'home';
    } else if (segments[0] === 'p2p') {
      if (segments[1] === 'collections' && segments[2]) {
        currentRoute = 'p2p-collection-browse';
      } else if (segments[1] === 'collections') {
        currentRoute = 'p2p-collections';
      } else if (segments[1]) {
        currentRoute = 'p2p-conversation';
      } else {
        currentRoute = 'p2p';
      }
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
    } else if (segments[0] === 'collection' && segments[1]) {
      currentRoute = 'collection-detail';
    } else if (segments[0] === 'drops' && segments[1]) {
      currentRoute = 'drops-detail';
    } else {
      currentRoute = segments[0] || 'home';
    }

    // Check if mobile on initial load
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const isPlaySubRoute = currentRoute.startsWith('play-');
    
    if (currentRoute === 'login') {
      // Login page - show header only
      return { showHeader: true, showFooter: false, showSidebar: false, showRightSidebar: false, navigationDepth: 0, previousRoute: null };
    } else if (currentRoute === 'discover') {
      // Discover page shows header
      return { showHeader: true, showFooter: false, showSidebar: false, showRightSidebar: false, navigationDepth: 0, previousRoute: null };
    } else if (currentRoute === 'home') {
      // Home (HUD) page - show transparent header with Player Terminal
      return { showHeader: true, showFooter: false, showSidebar: false, showRightSidebar: false, navigationDepth: 0, previousRoute: null };
    } else if (currentRoute === 'trade') {
      return { showHeader: true, showFooter: false, showSidebar: false, showRightSidebar: false, navigationDepth: 1, previousRoute: 'home' };
    } else if (currentRoute === 'p2p-collections') {
      return {
        showHeader: true,
        showFooter: false,
        showSidebar: false,
        showRightSidebar: false,
        navigationDepth: 3,
        previousRoute: 'p2p'
      };
    } else if (currentRoute === 'p2p-collection-browse') {
      return {
        showHeader: true,
        showFooter: false,
        showSidebar: false,
        showRightSidebar: false,
        navigationDepth: 4,
        previousRoute: 'p2p-collections'
      };
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
    } else if (currentRoute === 'profile') {
      return {
        showHeader: true,
        showFooter: !isMobile,
        showSidebar: !isMobile,
        showRightSidebar: false,
        navigationDepth: 2,
        previousRoute: 'home'
      };
    } else if (currentRoute === 'profile-collection' || currentRoute === 'profile-achievements' || currentRoute === 'profile-stats' || currentRoute === 'profile-settings') {
      return {
        showHeader: true,
        showFooter: !isMobile,
        showSidebar: !isMobile,
        showRightSidebar: false,
        navigationDepth: 3,
        previousRoute: 'profile'
      };
    } else if (currentRoute === 'profile-public') {
      return {
        showHeader: true,
        showFooter: !isMobile,
        showSidebar: !isMobile,
        showRightSidebar: false,
        navigationDepth: 3,
        previousRoute: 'profile'
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
    } else if (currentRoute === 'p2p-conversation') {
      return {
        showHeader: true, // Show header on all screen sizes
        showFooter: false,
        showSidebar: false,
        showRightSidebar: false,
        navigationDepth: 3,
        previousRoute: 'p2p'
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
      // Browse page - like marketplace with header, footer, sidebar
      return {
        showHeader: !isMobile,
        showFooter: !isMobile,
        showSidebar: !isMobile,
        showRightSidebar: false,
        navigationDepth: 1,
        previousRoute: 'home'
      };
    } else if (currentRoute === 'lootboxes-reveal') {
      // Reveal/Opening page - immersive VRF experience with no global UI
      return { showHeader: false, showFooter: false, showSidebar: false, showRightSidebar: false, navigationDepth: 2, previousRoute: 'lootboxes' };
    } else if (currentRoute === 'lootboxes-detail') {
      return {
        showHeader: true,
        showFooter: !isMobile,
        showSidebar: !isMobile,
        showRightSidebar: false,
        navigationDepth: 2,
        previousRoute: 'lootboxes'
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
    } else if (currentRoute === 'collection-detail') {
      return {
        showHeader: true,
        showFooter: !isMobile,
        showSidebar: !isMobile,
        showRightSidebar: false,
        navigationDepth: 3,
        previousRoute: 'collection'
      };
    } else if (currentRoute === 'drops') {
      return {
        showHeader: true,
        showFooter: !isMobile,
        showSidebar: !isMobile,
        showRightSidebar: false,
        navigationDepth: 1,
        previousRoute: 'home'
      };
    } else if (currentRoute === 'lists') {
      return {
        showHeader: true,
        showFooter: !isMobile,
        showSidebar: !isMobile,
        showRightSidebar: false,
        navigationDepth: 2,
        previousRoute: 'home'
      };
    } else if (currentRoute === 'drops-detail') {
      return {
        showHeader: true,
        showFooter: !isMobile,
        showSidebar: false,
        showRightSidebar: false,
        navigationDepth: 2,
        previousRoute: 'drops'
      };
    } else if (currentRoute === 'control-center') {
      return {
        showHeader: true,
        showFooter: !isMobile,
        showSidebar: false,
        showRightSidebar: false,
        navigationDepth: 2,
        previousRoute: 'home'
      };
    } else if (currentRoute === 'museum') {
      return {
        showHeader: false,
        showFooter: false,
        showSidebar: true,
        showRightSidebar: true,
        navigationDepth: 1,
        previousRoute: 'home'
      };
    } else if (currentRoute === 'play') {
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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const isStudioRoute = pathname.startsWith('/studio');
  
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

  // Museum data for sidebars
  const techItems = [
    {
      id: "tech-1",
      title: "Jugi Tandon",
      subtitle: "The Innovator",
      thumbnail: "/assets/img/tech1.png",
      introVideo: "/videos/tech-intro-1.mp4",
    },
    {
      id: "tech-2",
      title: "Quantum Computing",
      subtitle: "Next Generation",
      thumbnail: "/assets/img/tech2.jpg",
      introVideo: "/videos/tech-intro-2.mp4",
    },
    {
      id: "tech-3",
      title: "Blockchain",
      subtitle: "Decentralized Future",
      thumbnail: "/assets/img/tech3.jpg",
      introVideo: "/videos/tech-intro-3.mp4",
    },
  ];

  const gamingItems = [
    {
      id: "gaming-1",
      title: "Cyber Legends",
      subtitle: "Epic Adventure",
      thumbnail: "/assets/img/gaming1.webp",
      introVideo: "/videos/gaming-intro-1.mp4",
    },
    {
      id: "gaming-2",
      title: "Neon Racers",
      subtitle: "High Speed Action",
      thumbnail: "/assets/img/gaming2.webp",
      introVideo: "/videos/gaming-intro-2.mp4",
    },
    {
      id: "gaming-3",
      title: "Galaxy Wars",
      subtitle: "Space Combat",
      thumbnail: "/assets/img/gaming3.jpg",
      introVideo: "/videos/gaming-intro-3.mp4",
    },
  ];

  // Museum item click handler - dispatches custom event
  const handleMuseumItemClick = useCallback((item: any) => {
    const event = new CustomEvent('museum-item-click', { detail: item });
    window.dispatchEvent(event);
  }, []);

  const museumTechData = useMemo(() => ({
    items: techItems,
    onItemClick: handleMuseumItemClick
  }), [handleMuseumItemClick]);

  const museumGamingData = useMemo(() => ({
    items: gamingItems,
    onItemClick: handleMuseumItemClick
  }), [handleMuseumItemClick]);

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
    if (pathname === '/login') return 'login';
    if (pathname === '/discover') return 'discover';
    if (pathname === '/home') return 'home';
    const segments = pathname.split('/').filter(Boolean);

    if (segments[0] === 'p2p') {
      if (segments[1] === 'collections' && segments[2]) {
        return 'p2p-collection-browse';
      } else if (segments[1] === 'collections') {
        return 'p2p-collections';
      } else if (segments[1]) {
        return 'p2p-conversation';
      }
      return 'p2p';
    }

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

    if (segments[0] === 'collection' && segments[1]) {
      return 'collection-detail';
    }

    if (segments[0] === 'drops' && segments[1]) {
      return 'drops-detail';
    }

    if (segments[0] === 'profile') {
      if (segments[1] === 'collection') {
        return 'profile-collection';
      } else if (segments[1] === 'achievements') {
        return 'profile-achievements';
      } else if (segments[1] === 'stats') {
        return 'profile-stats';
      } else if (segments[1] === 'settings') {
        return 'profile-settings';
      } else if (segments[1]) {
        // Address-based public profile (e.g., /profile/0x123...)
        return 'profile-public';
      }
      return 'profile';
    }

    return segments[0] || 'home';
  };
  
  const currentRoute = getCurrentRoute();
  const isPlaySubRoute = currentRoute.startsWith('play-');

  // Debug logging
  useEffect(() => {
    console.log('[LayoutWrapper] Current pathname:', pathname);
    console.log('[LayoutWrapper] Current route:', currentRoute);
    console.log('[LayoutWrapper] UI State:', uiState);
  }, [pathname, currentRoute, uiState]);

  // Listen for museum theater events - REVEAL EFFECT
  // The sidebars are visible when browsing, and when user clicks an item:
  // 1. Sidebars animate OUT (revealing the title card behind them)
  // 2. Title card is at z-30, sidebars at z-40, so title is revealed as sidebars move away
  // 3. After animation completes, immersive experience begins
  useEffect(() => {
    const handleIntroStart = () => {
      // User clicked an item - REVEAL animation starts
      // Hide sidebars to trigger their exit animation
      // The title card (at z-30, behind sidebars at z-40) will be revealed
      if (currentRoute === 'museum') {
        setUiState(prev => ({
          ...prev,
          showHeader: false,
          showFooter: false,
          showSidebar: false,
          showRightSidebar: false,
        }));
      }
    };

    const handleTheaterExit = () => {
      // Returning to browse mode - show sidebars again
      if (currentRoute === 'museum') {
        setUiState(prev => ({
          ...prev,
          showHeader: false,
          showFooter: false,
          showSidebar: true,
          showRightSidebar: true,
          navigationDepth: 1,
          previousRoute: 'home'
        }));
      }
    };

    // museum-intro-start = user clicked item, hide sidebars to reveal title
    window.addEventListener('museum-intro-start', handleIntroStart);
    // museum-theater-exit = user exits immersive mode, show sidebars again
    window.addEventListener('museum-theater-exit', handleTheaterExit);

    return () => {
      window.removeEventListener('museum-intro-start', handleIntroStart);
      window.removeEventListener('museum-theater-exit', handleTheaterExit);
    };
  }, [currentRoute]);

  // Update UI state based on current route and mobile status
  useEffect(() => {
    let newState: Partial<ProgressiveUIState> = {};

    if (currentRoute === 'login') {
      // Login page - show header only
      newState = {
        showHeader: true,
        showFooter: false,
        showSidebar: false,
        showRightSidebar: false,
        navigationDepth: 0,
        previousRoute: null
      };
    } else if (currentRoute === 'discover') {
      // Discover page shows header
      newState = {
        showHeader: true,
        showFooter: false,
        showSidebar: false,
        showRightSidebar: false,
        navigationDepth: 0,
        previousRoute: null
      };
    } else if (currentRoute === 'home') {
      // Home (HUD) page - show transparent header with Player Terminal
      newState = {
        showHeader: true,
        showFooter: false,
        showSidebar: false,
        showRightSidebar: false,
        navigationDepth: 0,
        previousRoute: null
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
        showFooter: false, // Always hide footer for studio on mobile (use bottom nav instead)
        showSidebar: !isMobile || isMobileSidebarOpen, // Show sidebar on desktop or when mobile menu is open
        showRightSidebar: false,
        navigationDepth: 2,
        previousRoute: 'home'
      };
    } else if (currentRoute === 'profile') {
      newState = {
        showHeader: true,
        showFooter: false, // Similar to studio layout
        showSidebar: !isMobile || isMobileSidebarOpen,
        showRightSidebar: false,
        navigationDepth: 2,
        previousRoute: 'home'
      };
    } else if (currentRoute === 'profile-collection' || currentRoute === 'profile-achievements' || currentRoute === 'profile-stats' || currentRoute === 'profile-settings') {
      newState = {
        showHeader: true,
        showFooter: false,
        showSidebar: !isMobile || isMobileSidebarOpen,
        showRightSidebar: false,
        navigationDepth: 3,
        previousRoute: 'profile'
      };
    } else if (currentRoute === 'profile-public') {
      newState = {
        showHeader: true,
        showFooter: false, // Similar to profile layout
        showSidebar: !isMobile || isMobileSidebarOpen,
        showRightSidebar: false,
        navigationDepth: 3,
        previousRoute: 'profile'
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
    } else if (currentRoute === 'p2p-collections') {
      newState = {
        showHeader: true,
        showFooter: false,
        showSidebar: false,
        showRightSidebar: false,
        navigationDepth: 3,
        previousRoute: 'p2p'
      };
    } else if (currentRoute === 'p2p-collection-browse') {
      newState = {
        showHeader: true,
        showFooter: false,
        showSidebar: false,
        showRightSidebar: false,
        navigationDepth: 4,
        previousRoute: 'p2p-collections'
      };
    } else if (currentRoute === 'p2p-conversation') {
      newState = {
        showHeader: true, // Show header on all screen sizes
        showFooter: false,
        showSidebar: false,
        showRightSidebar: false,
        navigationDepth: 4,
        previousRoute: 'p2p'
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
      // Browse page - like marketplace with header, footer, sidebar
      newState = {
        showHeader: !isMobile,
        showFooter: !isMobile,
        showSidebar: !isMobile,
        showRightSidebar: false,
        navigationDepth: 1,
        previousRoute: 'home'
      };
    } else if (currentRoute === 'lootboxes-reveal') {
      // Reveal/Opening page - immersive VRF experience with no global UI
      newState = {
        showHeader: false,
        showFooter: false,
        showSidebar: false,
        showRightSidebar: false,
        navigationDepth: 2,
        previousRoute: 'lootboxes'
      };
    } else if (currentRoute === 'lootboxes-detail') {
      newState = {
        showHeader: true,
        showFooter: !isMobile,
        showSidebar: !isMobile,
        showRightSidebar: false,
        navigationDepth: 2,
        previousRoute: 'lootboxes'
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
    } else if (currentRoute === 'collection-detail') {
      newState = {
        showHeader: true,
        showFooter: !isMobile,
        showSidebar: !isMobile,
        showRightSidebar: false,
        navigationDepth: 3,
        previousRoute: 'collection'
      };
    } else if (currentRoute === 'drops') {
      newState = {
        showHeader: true,
        showFooter: !isMobile,
        showSidebar: !isMobile,
        showRightSidebar: false,
        navigationDepth: 1,
        previousRoute: 'home'
      };
    } else if (currentRoute === 'lists') {
      newState = {
        showHeader: true,
        showFooter: !isMobile,
        showSidebar: !isMobile,
        showRightSidebar: false,
        navigationDepth: 2,
        previousRoute: 'home'
      };
    } else if (currentRoute === 'drops-detail') {
      newState = {
        showHeader: true,
        showFooter: !isMobile,
        showSidebar: false,
        showRightSidebar: false,
        navigationDepth: 2,
        previousRoute: 'drops'
      };
    } else if (currentRoute === 'control-center') {
      newState = {
        showHeader: true,
        showFooter: !isMobile,
        showSidebar: false,
        showRightSidebar: false,
        navigationDepth: 2,
        previousRoute: 'home'
      };
    } else if (currentRoute === 'museum') {
      newState = {
        showHeader: false,
        showFooter: false,
        showSidebar: true,
        showRightSidebar: true,
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
    if (route === 'discover') {
      router.push('/discover');
    } else if (route === 'home') {
      router.push('/home');
    } else if (route.startsWith('lootbox-')) {
      const lootboxId = route.replace('lootbox-', '');
      router.push(`/lootboxes/${lootboxId}`);
    } else {
      router.push(`/${route}`);
    }
  };

  return (
    <CollectionProvider>
      <P2PTradingProvider>
        <ListsProvider>
          <ProgressiveUIWrapperInner
            children={children}
            uiState={uiState}
            currentRoute={currentRoute}
            pathname={pathname}
            handleNavigate={handleNavigate}
            handleStudioViewChange={handleStudioViewChange}
            currentStudioView={currentStudioView}
            studioData={studioData}
            p2pData={p2pData}
            lootboxData={lootboxData}
            p2pRightSidebarData={p2pRightSidebarData}
            museumTechData={museumTechData}
            museumGamingData={museumGamingData}
            isMobile={isMobile}
            isStudioRoute={isStudioRoute}
            isMobileSidebarOpen={isMobileSidebarOpen}
            setIsMobileSidebarOpen={setIsMobileSidebarOpen}
            studioHeaderContextValue={studioHeaderContextValue}
          />
        </ListsProvider>
      </P2PTradingProvider>
    </CollectionProvider>
  );
}

function ProgressiveUIWrapperInner({
  children,
  uiState,
  currentRoute,
  pathname,
  handleNavigate,
  handleStudioViewChange,
  currentStudioView,
  studioData,
  p2pData,
  lootboxData,
  p2pRightSidebarData,
  museumTechData,
  museumGamingData,
  isMobile,
  isStudioRoute,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
  studioHeaderContextValue,
}: any) {
  const listsContext = useLists();
  const collectionContext = useCollectionOptional();
  const p2pHeader = useP2PHeader();

  // Prepare lists data for sidebar
  const listsData = currentRoute === 'lists' ? {
    lists: listsContext.lists,
    selectedList: listsContext.selectedList,
    onSelectList: listsContext.setSelectedList,
    onCreateList: () => listsContext.setIsCreatingList(true),
    onDeleteList: listsContext.handleDeleteList,
    isCreatingList: listsContext.isCreatingList,
    newListName: listsContext.newListName,
    onNewListNameChange: listsContext.setNewListName,
    onConfirmCreate: listsContext.handleCreateList,
    onCancelCreate: () => {
      listsContext.setIsCreatingList(false);
      listsContext.setNewListName('');
    },
  } : undefined;

  return (
    <>
      {/* Progressive UI Elements */}
      <AnimatedHeader
        show={uiState.showHeader}
        onNavigate={handleNavigate}
        currentRoute={currentRoute}
        onStudioViewChange={handleStudioViewChange}
        currentStudioView={currentStudioView}
        p2pData={{
          selectedTrader: p2pHeader.selectedTrader || undefined,
          isCreatingOffer: p2pHeader.isCreatingOffer,
          onBack: p2pHeader.onBack,
          onCancelOffer: p2pHeader.onCancelOffer,
          onShowHistory: p2pHeader.onShowHistory
        }}
      />
      <AnimatedFooter show={uiState.showFooter && !isStudioRoute} />
      {/* Mobile sidebar overlay for studio */}
      {isMobile && isStudioRoute && (
        <AnimatePresence>
          {isMobileSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
          )}
        </AnimatePresence>
      )}

      <AnimatedSidebar
        show={uiState.showSidebar || (isMobile && isStudioRoute && isMobileSidebarOpen)}
        showFooter={uiState.showFooter}
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
        listsData={listsData}
        collectionData={collectionContext?.collectionData || undefined}
        museumData={currentRoute === 'museum' ? museumTechData : undefined}
        onNavigate={handleNavigate}
      />
      <RightAnimatedSidebar
        show={uiState.showRightSidebar}
        showFooter={uiState.showFooter}
        currentRoute={currentRoute}
        p2pData={p2pRightSidebarData}
        museumData={currentRoute === 'museum' ? museumGamingData : undefined}
      />
      
      {/* Studio Mobile Navigation - Show on all Studio pages except create flow */}
      {isMobile && isStudioRoute && !pathname.includes('/studio/create') && (
        <StudioMobileNav
          onMenuToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          isMenuOpen={isMobileSidebarOpen}
        />
      )}

      {/* Main content with padding adjustments */}
      <div className={`
        transition-all duration-300 ease-in-out
        ${uiState.showSidebar && !isMobile ? 'md:pl-80' : 'pl-0'}
        ${uiState.showRightSidebar && !isMobile ? 'md:pr-80' : 'pr-0'}
        ${isMobile && isStudioRoute ? 'pb-32' : ''}
      `}>
        <StudioHeaderContext.Provider value={studioHeaderContextValue}>
          {children}
        </StudioHeaderContext.Provider>
      </div>
      
      {/* Background Carousel for wallpaper selection */}
      <BackgroundCarousel />

      {/* Chat Widget removed - only using InlineChatPanel on home page */}
    </>
  );
}