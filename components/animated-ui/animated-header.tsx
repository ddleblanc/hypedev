"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
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
  Zap,
  Menu,
  X,
  Wallet,
  ArrowRight,
  Gift,
  Briefcase
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
  const router = useRouter();
  const { user, isConnected } = useWalletAuthOptimized();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dynamic navigation based on current route context
  const getNavigationItems = () => {
    const currentPath = pathname || '/';
    
    // Studio page - special handling for tab navigation (match subpaths too)
    if ((currentPath && currentPath.startsWith('/studio')) || currentRoute === 'studio') {
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
    
    // Trade methods pages (including detail pages)
    if (['/marketplace', '/launchpad', '/tokens', '/p2p', '/collection'].includes(currentPath) ||
        currentPath.startsWith('/launchpad/') ||
        ['marketplace', 'launchpad', 'launchpad-detail', 'tokens', 'p2p', 'collection'].includes(currentRoute)) {
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
        { id: 'play/1v1', label: '1v1', icon: Crown, type: 'route' }
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

  const handleNavItemClick = async (item: any) => {
    setMobileMenuOpen(false); // Close mobile menu on navigation

    try {
      if (item.type === 'studio-tab') {
        await router.push(`/studio/${item.id}`);
        if (onStudioViewChange) onStudioViewChange(item.id);
      } else if (item.type === 'route') {
        const target = item.id === 'home' ? '/' : `/${item.id}`;
        await router.push(target);
        if (onNavigate) onNavigate(item.id);
      }
    } catch (e) {
      if (item.type === 'studio-tab' && onStudioViewChange) onStudioViewChange(item.id);
      if (item.type === 'route' && onNavigate) onNavigate(item.id);
    }
  };

  // Main navigation for mobile menu - matches authenticated homepage
  const mainMobileNavigation = [
    { label: "TRADE", href: "/trade", description: "Buy & Sell", route: "trade" },
    { label: "PLAY", href: "/play", description: "Gaming Hub", route: "play" },
    { label: "MUSEUM", href: "/museum", description: "Art & Culture", route: "museum" },
    { label: "COLLECTION", href: "/profile", description: "Your Assets", route: "profile" }
  ];

  // Secondary navigation for mobile menu
  const secondaryMobileNavigation = [
    { label: "PROFILE", href: "/profile", external: true },
    { label: "ACHIEVEMENTS", href: "/achievements", external: true },
    { label: "LOOTBOXES", href: "/lootboxes", external: true },
    { label: "PORTFOLIO", href: "/portfolio", external: true },
    { label: "NFT STUDIO", href: "/studio", external: false }
  ];

  return (
    <AnimatePresence>
      {show && (
        <>
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
            className="fixed top-0 left-0 right-0 z-50 h-16 backdrop-blur-xl border-b border-white/10"
            style={{ backgroundColor: 'rgb(3, 3, 3)' }}
          >
            <div className="h-full px-4 md:px-6 flex items-center justify-between">
              {/* Desktop Left - Logo & Back */}
              <div className="flex items-center gap-4">
                {currentRoute !== 'home' && (
                  <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    onClick={() => {
                      if (currentRoute.startsWith('play-')) {
                        onNavigate('play');
                      } else if (['trade', 'play', 'museum'].includes(currentRoute)) {
                        onNavigate('home');
                      } else {
                        window.history.back();
                      }
                    }}
                    className="hidden lg:block p-2 hover:bg-white/10 rounded-lg transition-colors"
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

              {/* Center Section - Desktop Navigation */}
              <nav className="hidden lg:flex items-center gap-1">
                {navItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = item.type === 'studio-tab'
                    ? (currentStudioView === item.id || (pathname && pathname.startsWith(`/studio/${item.id}`)))
                     : item.id.includes('/')
                       ? currentRoute === item.id.replace('/', '-')
                       : currentRoute === item.id;

                  return (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + index * 0.05 }}
                      onClick={() => handleNavItemClick(item)}
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

              {/* Right Section */}
              <div className="flex items-center gap-2 md:gap-3">
                {/* Desktop Only - Action Buttons */}
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="hidden md:flex p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Search className="w-5 h-5 text-white/70" />
                </motion.button>

                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.35 }}
                  className="hidden md:flex p-2 hover:bg-white/10 rounded-lg transition-colors relative"
                >
                  <Bell className="w-5 h-5 text-white/70" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[rgb(163,255,18)] rounded-full" />
                </motion.button>

                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="hidden md:flex p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ShoppingCart className="w-5 h-5 text-white/70" />
                </motion.button>

                {/* Wallet/Profile - Always Visible */}
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
                      <div className="hidden md:block text-sm">
                        <p className="text-white/90 font-medium">
                          {user.username || `${user.walletAddress.slice(0, 6)}...`}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <ConnectButton client={client} />
                  )}
                </motion.div>

                {/* Mobile Hamburger Menu - Right Side */}
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden p-1.5 text-white/80 hover:text-white bg-black/20 backdrop-blur-sm rounded-lg border border-white/10 transition-all ml-2"
                  aria-label="Menu"
                >
                  <Menu className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </motion.header>

          {/* Mobile Menu Overlay - Full Screen (matches authenticated homepage) */}
          <motion.div
            initial={false}
            animate={{ opacity: mobileMenuOpen ? 1 : 0, pointerEvents: mobileMenuOpen ? 'auto' : 'none' }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed inset-0 backdrop-blur-xl z-[60]"
            style={{ backgroundColor: 'rgb(3, 3, 3)' }}
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              className="flex flex-col h-full pt-16 px-4 pb-6 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="absolute top-4 right-4 p-2 text-white/60 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Mobile Profile Section */}
              {isConnected && user && (
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="relative bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-4 mb-6 overflow-hidden"
                >
                  <div className="absolute inset-0 opacity-5">
                    <div className="h-full w-full bg-[linear-gradient(45deg,transparent_48%,rgba(163,255,18,0.5)_49%,rgba(163,255,18,0.5)_51%,transparent_52%)] bg-[length:20px_20px]" />
                  </div>

                  <div className="relative flex items-center gap-4">
                    <div className="w-16 h-16 relative flex-shrink-0">
                      <div className="h-full w-full bg-gradient-to-br from-[rgb(163,255,18)] to-green-400 rounded-xl flex items-center justify-center">
                        <User className="w-8 h-8 text-black" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[rgb(163,255,18)] rounded-full border-2 border-black animate-pulse shadow-lg shadow-[rgb(163,255,18)]/50" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-black text-lg tracking-wide">
                        {user.username || `${user.walletAddress.slice(0, 6)}...`}
                      </div>
                      <div className="text-white/50 text-xs mt-1">Connected</div>
                    </div>
                    <Wallet className="w-5 h-5 text-white/40" />
                  </div>
                </motion.div>
              )}

              {/* Main Navigation Mobile - Grid Layout */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {mainMobileNavigation.map((item, index) => {
                  const getIcon = () => {
                    switch(item.label) {
                      case 'TRADE': return <TrendingUp className="w-10 h-10 text-[rgb(163,255,18)]" />;
                      case 'PLAY': return <Gamepad2 className="w-10 h-10 text-[rgb(163,255,18)]" />;
                      case 'MUSEUM': return <Crown className="w-10 h-10 text-[rgb(163,255,18)]" />;
                      case 'COLLECTION': return <User className="w-10 h-10 text-[rgb(163,255,18)]" />;
                      default: return null;
                    }
                  };

                  return (
                    <motion.button
                      key={item.label}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.15 + index * 0.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={async () => {
                        setMobileMenuOpen(false);
                        await router.push(item.href);
                        if (onNavigate) onNavigate(item.route);
                      }}
                      className="relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl p-5 active:border-[rgb(163,255,18)]/50 active:bg-[rgb(163,255,18)]/10 transition-all overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-[rgb(163,255,18)]/0 to-[rgb(163,255,18)]/0 group-active:from-[rgb(163,255,18)]/20 group-active:to-transparent transition-all duration-300" />

                      <div className="relative flex flex-col items-center gap-3">
                        {getIcon()}
                        <div>
                          <h3 className="text-white text-sm font-black tracking-wider">
                            {item.label}
                          </h3>
                          <p className="text-white/50 text-[10px] mt-0.5">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Secondary Navigation Mobile - List Style */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="space-y-1 border-t border-white/10 pt-4"
              >
                {secondaryMobileNavigation.map((item, index) => {
                  const isNFTStudio = item.label === "NFT STUDIO";

                  return (
                    <motion.button
                      key={item.label}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.35 + index * 0.05 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={async () => {
                        setMobileMenuOpen(false);
                        if (item.external) {
                          await router.push(item.href);
                        } else {
                          await router.push(item.href);
                          if (onNavigate) onNavigate('studio');
                        }
                      }}
                      className="w-full flex items-center justify-between px-2 py-3 rounded-lg active:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 ${isNFTStudio ? 'text-[rgb(255,215,0)]' : 'text-white/60'}`}>
                          {isNFTStudio && <Crown className="w-5 h-5" />}
                          {item.label === "PROFILE" && <User className="w-5 h-5" />}
                          {item.label === "ACHIEVEMENTS" && <Trophy className="w-5 h-5" />}
                          {item.label === "LOOTBOXES" && <Gift className="w-5 h-5" />}
                          {item.label === "PORTFOLIO" && <Briefcase className="w-5 h-5" />}
                        </div>
                        <span className={`text-sm font-black uppercase tracking-wider ${isNFTStudio ? 'text-[rgb(255,215,0)]' : 'text-white'}`}>
                          {item.label}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-white/30" />
                    </motion.button>
                  );
                })}
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}