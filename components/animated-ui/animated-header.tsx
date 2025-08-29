"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Bell, 
  ShoppingCart, 
  User,
  ChevronLeft,
  Home,
  TrendingUp,
  Play,
  Users,
  Store,
  Rocket,
  Crown,
  Palette,
  MonitorSpeaker,
  Box,
  Layers,
  Sparkles,
  Activity,
  BarChart3,
  Settings,
  Coins,
  Gamepad2,
  Trophy,
  Zap
} from "lucide-react";
import { ConnectButton } from "thirdweb/react";
import { client } from "@/lib/thirdweb";
import { useWalletAuthOptimized } from "@/hooks/use-wallet-auth-optimized";

interface AnimatedHeaderProps {
  show: boolean;
  onNavigate: (route: string) => void;
  currentRoute: string;
  onStudioViewChange?: (view: string) => void;
  currentStudioView?: string;
}

export function AnimatedHeader({ show, onNavigate, currentRoute, onStudioViewChange, currentStudioView }: AnimatedHeaderProps) {
  const pathname = usePathname();
  const { user, isConnected } = useWalletAuthOptimized();

  // Dynamic navigation based on current route context
  const getNavigationItems = () => {
    const currentPath = pathname || '/';
    
    // Studio page - special handling for tab navigation
    if (currentPath === '/studio' || currentRoute === 'studio') {
      return [
        { id: 'home', label: 'Home', icon: Home, type: 'route' },
        { id: 'dashboard', label: 'Dashboard', icon: MonitorSpeaker, type: 'studio-tab' },
        { id: 'projects', label: 'Projects', icon: Box, type: 'studio-tab' },
        { id: 'collections', label: 'Collections', icon: Layers, type: 'studio-tab' },
        { id: 'nfts', label: 'NFTs', icon: Sparkles, type: 'studio-tab' },
        { id: 'activity', label: 'Activity', icon: Activity, type: 'studio-tab' },
        { id: 'analytics', label: 'Analytics', icon: BarChart3, type: 'studio-tab' },
        { id: 'settings', label: 'Settings', icon: Settings, type: 'studio-tab' }
      ];
    }
    
    // Trade methods pages
    if (['/marketplace', '/launchpad', '/tokens', '/p2p', '/collection'].includes(currentPath) || 
        ['marketplace', 'launchpad', 'tokens', 'p2p', 'collection'].includes(currentRoute)) {
      return [
        { id: 'home', label: 'Home', icon: Home, type: 'route' },
        { id: 'marketplace', label: 'Marketplace', icon: Store, type: 'route' },
        { id: 'launchpad', label: 'Launchpad', icon: Rocket, type: 'route' },
        { id: 'tokens', label: 'Tokens', icon: Coins, type: 'route' },
        { id: 'p2p', label: 'P2P', icon: Users, type: 'route' }
      ];
    }
    
    // Play sub-route pages (not the main play page)
    if ((currentPath.startsWith('/play/') || currentRoute.startsWith('play-')) && currentPath !== '/play' && currentRoute !== 'play') {
      return [
        { id: 'home', label: 'Home', icon: Home, type: 'route' },
        { id: 'play/casual', label: 'Casual', icon: Gamepad2, type: 'route' },
        { id: 'play/competitive', label: 'Competitive', icon: Trophy, type: 'route' },
        { id: 'play/casino', label: 'Casino', icon: Zap, type: 'route' },
        { id: 'play/metaverse', label: 'Metaverse', icon: Crown, type: 'route' }
      ];
    }
    
    // Main play page - show main navigation
    if (currentPath === '/play' || currentRoute === 'play') {
      return [
        { id: 'home', label: 'Home', icon: Home, type: 'route' },
        { id: 'trade', label: 'Trade', icon: TrendingUp, type: 'route' },
        { id: 'play', label: 'Play', icon: Play, type: 'route' },
        { id: 'museum', label: 'Museum', icon: Crown, type: 'route' },
        { id: 'collection', label: 'Collection', icon: Layers, type: 'route' },
        { id: 'studio', label: 'NFT Studio', icon: Palette, type: 'route' }
      ];
    }
    
    // Trade section page
    if (currentPath === '/trade' || currentRoute === 'trade') {
      return [
        { id: 'home', label: 'Home', icon: Home, type: 'route' },
        { id: 'trade', label: 'Trade', icon: TrendingUp, type: 'route' },
        { id: 'play', label: 'Play', icon: Play, type: 'route' },
        { id: 'museum', label: 'Museum', icon: Crown, type: 'route' },
        { id: 'collection', label: 'Collection', icon: Layers, type: 'route' },
        { id: 'studio', label: 'NFT Studio', icon: Palette, type: 'route' }
      ];
    }
    
    // Play section page
    if (currentPath === '/play' || currentRoute === 'play') {
      return [
        { id: 'home', label: 'Home', icon: Home, type: 'route' },
        { id: 'trade', label: 'Trade', icon: TrendingUp, type: 'route' },
        { id: 'play', label: 'Play', icon: Play, type: 'route' },
        { id: 'museum', label: 'Museum', icon: Crown, type: 'route' },
        { id: 'collection', label: 'Collection', icon: Layers, type: 'route' },
        { id: 'studio', label: 'NFT Studio', icon: Palette, type: 'route' }
      ];
    }
    
    // Museum page (similar to trade/play sections)
    if (currentPath === '/museum' || currentRoute === 'museum') {
      return [
        { id: 'home', label: 'Home', icon: Home, type: 'route' },
        { id: 'trade', label: 'Trade', icon: TrendingUp, type: 'route' },
        { id: 'play', label: 'Play', icon: Play, type: 'route' },
        { id: 'museum', label: 'Museum', icon: Crown, type: 'route' },
        { id: 'collection', label: 'Collection', icon: Layers, type: 'route' },
        { id: 'studio', label: 'NFT Studio', icon: Palette, type: 'route' }
      ];
    }
    
    // Default/fallback - should not show header for home
    return [];
  };

  const navItems = getNavigationItems();

  return (
    <AnimatePresence>
      {show && (
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ 
            type: "spring",
            stiffness: 260,
            damping: 30,
            duration: 0.4
          }}
          className="fixed top-0 left-0 right-0 z-50 h-16 bg-black/95 backdrop-blur-xl border-b border-white/10"
        >
          <div className="h-full px-6 flex items-center justify-between">
            {/* Left Section - Logo & Back */}
            <div className="flex items-center gap-4">
              {currentRoute !== 'home' && (
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  onClick={() => {
                    // For play sub-routes, go back to play
                    if (currentRoute.startsWith('play-')) {
                      onNavigate('play');
                    }
                    // For main navigation routes, go directly home
                    else if (['trade', 'play', 'museum'].includes(currentRoute)) {
                      onNavigate('home');
                    } else {
                      // For other routes, use browser back
                      window.history.back();
                    }
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </motion.button>
              )}
              
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/assets/img/logo-text.png"
                  alt="HYPERCHAINX"
                  width={120}
                  height={40}
                  className="h-8 w-auto"
                />
              </Link>
            </div>

            {/* Center Section - Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                // For studio tabs, check against current studio view, for routes check against currentRoute
                const isActive = item.type === 'studio-tab' 
                  ? currentStudioView === item.id
                  : item.id.includes('/') 
                    ? currentRoute === item.id.replace('/', '-') // Convert 'play/casual' to 'play-casual' for comparison
                    : currentRoute === item.id;
                
                const handleClick = () => {
                  if (item.type === 'studio-tab' && onStudioViewChange) {
                    // Handle studio tab navigation
                    onStudioViewChange(item.id);
                  } else if (item.type === 'route') {
                    // Handle normal route navigation
                    onNavigate(item.id);
                  }
                };
                
                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    onClick={handleClick}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg transition-all
                      ${isActive 
                        ? 'bg-[rgb(163,255,18)]/20 text-[rgb(163,255,18)]' 
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </motion.button>
                );
              })}
            </nav>

            {/* Right Section - Actions */}
            <div className="flex items-center gap-3">
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Search className="w-5 h-5 text-white/70" />
              </motion.button>
              
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.35 }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors relative"
              >
                <Bell className="w-5 h-5 text-white/70" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[rgb(163,255,18)] rounded-full" />
              </motion.button>
              
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ShoppingCart className="w-5 h-5 text-white/70" />
              </motion.button>

              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 }}
                className="ml-2 pl-2 border-l border-white/10"
              >
                {isConnected && user ? (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-[rgb(163,255,18)]/30 to-[rgb(163,255,18)]/10 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-[rgb(163,255,18)]" />
                    </div>
                    <div className="text-sm">
                      <p className="text-white/90 font-medium">
                        {user.username || `${user.walletAddress.slice(0, 6)}...`}
                      </p>
                    </div>
                  </div>
                ) : (
                  <ConnectButton client={client} />
                )}
              </motion.div>
            </div>
          </div>
        </motion.header>
      )}
    </AnimatePresence>
  );
}