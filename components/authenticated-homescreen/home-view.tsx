"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MediaRenderer } from "@/components/MediaRenderer";
import { ConnectButton } from "thirdweb/react";
import { sepolia } from "thirdweb/chains";
import { client } from "@/lib/thirdweb";
import { 
  Star,
  ArrowRight,
  Calendar,
  MessageSquare, 
  Trophy, 
  Gift, 
  Briefcase,
  Crown,
  Palette,
  Wallet,
  Menu,
  X,
  TrendingUp,
  Gamepad2,
  Image as ImageIcon,
  User,
  Sparkles,
  ChevronLeft,
  Home
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWalletAuthOptimized } from "@/hooks/use-wallet-auth-optimized";
import { useAuth } from "@/contexts/auth-context";
import { useBackgroundCarousel } from "@/contexts/background-carousel-context";

// Mock data for the authenticated user experience
const mockUserData = {
  username: "CyberWarrior",
  level: 42,
  levelProgress: 75,
  nftCount: 127,
  hyperTokens: 15420,
  rank: "Diamond Elite",
  profilePicture: "https://picsum.photos/100/100?random=50",
  bannerImage: "https://picsum.photos/400/200?random=51"
};

const mainNavigation = [
  {
    label: "TRADE",
    href: "/trade",
    description: "Buy & Sell"
  },
  {
    label: "PLAY",
    href: "/play",
    description: "Gaming Hub"
  },
  {
    label: "MUSEUM",
    href: "/museum",
    description: "Art & Culture"
  },
  {
    label: "COLLECTION",
    href: "/profile",
    description: "Your Assets"
  }
];

const trendingCollections = [
  {
    name: "HYPERTRONS",
    subtitle: "TRENDING #1",
    floor: "2.3 ETH",
    change: "+24%",
    image: "/assets/img/tron.mp4",
    type: "video"
  },
  {
    name: "JUGI TANDON",
    subtitle: "HOT",
    floor: "1.8 ETH", 
    change: "+18%",
    image: "/assets/img/jugi.mp4",
    type: "video"
  },
  {
    name: "SPACE PIRATES",
    subtitle: "RISING",
    floor: "3.1 ETH",
    change: "+31%",
    image: "https://picsum.photos/400/240?random=12",
    type: "image"
  }
];

const activeMissions = [
  { id: 1, title: "Daily Login Streak", progress: 85, reward: "50 HYP", status: "active" },
  { id: 2, title: "Complete 5 Trades", progress: 60, reward: "100 HYP", status: "active" },
  { id: 3, title: "Referral Bonus", progress: 25, reward: "200 HYP", status: "active" },
  { id: 4, title: "Weekly Challenge", progress: 90, reward: "500 HYP", status: "completing" }
];

type HomeViewProps = {
  setViewMode: (mode: string) => void;
};

export function HomeView({ setViewMode }: HomeViewProps) {
  const { user: walletUser } = useWalletAuthOptimized();
  const { user } = useAuth();
  const { showCarousel, isCarouselVisible, hideCarousel, setCurrentBackground, currentBackground } = useBackgroundCarousel();
  const [currentCollectionIndex, setCurrentCollectionIndex] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileWallpaperOpen, setMobileWallpaperOpen] = useState(false);
  const connectButtonRef = useRef<HTMLDivElement>(null);

  // Define wallpapers array (same as desktop BackgroundCarousel)
  const wallpapers = [
    { id: 'bg1', src: '/assets/img/bg1.jpg', name: 'Original', type: 'image' },
    { id: 'bg2', src: '/assets/img/bg2.jpg', name: 'Alternative', type: 'image' },
    { id: 'bg5', src: '/assets/img/bg5.jpg', name: 'Variant 5', type: 'image' },
    { id: 'bgv3', src: '/assets/img/bgv3.mp4', name: 'Video 3', type: 'video' },
    { id: 'bgvurl1', src: 'https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/21018676-5eb7-4306-9099-992a9c99f37a/transcode=true,original=true,quality=90/96694329.webm', name: 'Web Video', type: 'video' },
    { id: 'bgvurl2', src: 'https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/39561bcd-8a10-4e56-826c-6f3f7c813414/transcode=true,original=true,quality=90/ChicVideo.webm', name: 'Chic Video', type: 'video' },
    { id: 'bgvurl3', src: 'https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/1ad84358-5802-4eae-b74b-f6c880d38ea5/transcode=true,original=true,quality=90/vid_00005.webm', name: 'Video 5', type: 'video' },
    { id: 'bgvurl4', src: 'https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/a770baa3-875b-4e1d-9f8f-3a0f533e3f96/transcode=true,original=true,quality=90/Blood%20Moon%20Oni.webm', name: 'Blood Moon', type: 'video' },
    { id: 'bgvurl45', src: 'https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/7f64191f-c494-492e-ab3d-21fb88686523/transcode=true,original=true,quality=90/6JRGQ9C6B2HFZJ94J50N42NPJ0.webm?token=CfDJ8IU-uofjHWVPg1_3zdfXdVM1DITXcjK26rTZ_vSgBMON7cn-5Hl4AXjKzNKtDpWgM1vyLFAaaQOTYAXngeNshK2hchUDWACRROB_CMqEUo8WVGj-YwL9zsZzNiUr8P9Qrb2-fYUTWJFR9leN08g5eAEvNhLDPlRIhzJQ_J_OtG1vJHXmtmkbI4U9HzwrEJ_6mIzNxhxK7TdTQv5IdF-d6mRjZhiFfA2G7uXVfu5tTjmRqwan9Rou9I-n4vAonRsTHA.mp4', name: 'Neon', type: 'video' },
  ];

  useEffect(() => {
    const collectionInterval = setInterval(() => {
      setCurrentCollectionIndex((prev) => (prev + 1) % trendingCollections.length);
    }, 4000);
    return () => clearInterval(collectionInterval);
  }, []);

  // Close mobile menu when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle wallet connect click
  const handleWalletConnect = () => {
    const button = connectButtonRef.current?.querySelector('button');
    if (button) {
      button.click();
    }
  };

  // Create dynamic secondary navigation based on user creator status - memoized
  const secondaryNavigation = useMemo(() => [
    { label: "SOCIAL", icon: MessageSquare, href: "/social", external: true },
    { label: "ACHIEVEMENTS", icon: Trophy, href: "/achievements", external: true },
    { label: "LOOTBOXES", icon: Gift, href: "/lootboxes/reveal", external: true },
    { label: "PORTFOLIO", icon: Briefcase, href: "/portfolio", external: true },
    // Conditional creator/studio link
    user && (user.creatorAppliedAt || user.isCreator) 
      ? { label: "NFT STUDIO", icon: Crown, href: "/studio", external: false }
      : { label: "BECOME A CREATOR", icon: Crown, href: "/creator-onboarding", external: true }
  ].filter(Boolean), [user]); // Remove any falsy values

  return (
    <div className="flex flex-col h-screen overflow-x-hidden">
      {/* Header */}
      <header className="relative z-50 flex items-center justify-between px-4 md:px-8 lg:px-16 py-3 md:py-4 lg:py-6 flex-shrink-0">
        {/* Left section - Logo */}
        <div className="animate-[slideInLeft_0.3s_ease-out_0.1s_both]">
          <Image
            src="/assets/img/logo-text.png"
            alt="HYPERCHAINX"
            width={300}
            height={100}
            className="h-6 md:h-10 lg:h-12 w-auto drop-shadow-2xl"
          />
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-1.5 text-white/80 hover:text-white bg-black/20 backdrop-blur-sm rounded-lg border border-white/10 transition-all"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        {/* Right section - Player Terminal (hidden on mobile, visible on desktop) */}
        <div className="hidden md:flex relative animate-[slideInRight_0.3s_ease-out_0.15s_both] items-center gap-1">
           {/* Profile Section - PFP + Banner */}
          <div 
            className="flex items-stretch bg-black/40 backdrop-blur-xl rounded-l-2xl border border-white/10 overflow-hidden cursor-pointer transition-all duration-300 hover:bg-black/60"
            onClick={handleWalletConnect}
          >
            {/* Profile Picture - Full Height, No Padding */}
            <div className="w-16 h-16 lg:w-20 lg:h-20 relative flex-shrink-0">
              <MediaRenderer
                src={user?.profilePicture || mockUserData.profilePicture}
                alt="Profile Picture"
                className="h-full w-full object-cover"
                aspectRatio="square"
                fallback={
                  <div className="h-full w-full bg-gradient-to-br from-[rgb(163,255,18)] to-green-400 flex items-center justify-center text-black font-black text-lg lg:text-xl">
                    {(user?.username || mockUserData.username)[0]}
                  </div>
                }
              />
              <div className="absolute top-1 right-1 w-3 h-3 bg-[rgb(163,255,18)] rounded-full border border-black animate-pulse shadow-sm shadow-[rgb(163,255,18)]/50" />
            </div>

            {/* Username Banner */}
            <div className="w-48 lg:w-72 h-16 lg:h-20 relative flex-shrink-0">
              <MediaRenderer
                src={user?.profilePicture || mockUserData.profilePicture}
                alt="User Banner"
                className="h-full w-full object-cover"
                aspectRatio="auto"
              />
              {/* Dark to transparent fade overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent"></div>
              {/* Username */}
              <div className="absolute inset-0 flex items-center justify-between pr-4 pl-4 lg:pl-8">
                <span className="text-white text-sm lg:text-lg font-bold tracking-wide drop-shadow-lg truncate">
                  {user?.username || mockUserData.username}
                </span>
                <Wallet className="w-4 h-4 lg:w-5 lg:h-5 text-white/80 drop-shadow-lg flex-shrink-0" />
              </div>
            </div>
          </div>
          {/* Level Section */}
          <div className="flex items-center bg-black border-t border-b border-white/10 px-4 lg:px-6 py-3 lg:py-4 h-16 lg:h-20">
            <div className="text-white text-sm font-bold">
              {(mockUserData.hyperTokens / 1000).toFixed(1)}K
            </div>
          </div>

          {/* Assets Section */}
          <div className="relative flex items-center justify-center rounded-r-2xl border border-white/10 h-16 w-16 lg:h-20 lg:w-20 cursor-pointer transition-all duration-300 hover:brightness-110 overflow-hidden">
            <div 
              className="absolute inset-0 bg-cover bg-center" 
              style={{ backgroundImage: 'url(/assets/img/hyper-logo.jpg)' }}
            />
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay - Full Screen */}
      <motion.div
        initial={false}
        animate={{ opacity: mobileMenuOpen ? 1 : 0, pointerEvents: mobileMenuOpen ? 'auto' : 'none' }}
        transition={{ duration: 0.2 }}
        className="md:hidden fixed inset-0 bg-black/95 backdrop-blur-xl z-40"
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

          {/* Mobile Profile Section - Enhanced */}
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-4 mb-6 overflow-hidden"
            onClick={handleWalletConnect}
          >
            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="h-full w-full bg-[linear-gradient(45deg,transparent_48%,rgba(163,255,18,0.5)_49%,rgba(163,255,18,0.5)_51%,transparent_52%)] bg-[length:20px_20px]" />
            </div>
            
            <div className="relative flex items-center gap-4">
              <div className="w-16 h-16 relative flex-shrink-0">
                <MediaRenderer
                  src={user?.profilePicture || mockUserData.profilePicture}
                  alt="Profile"
                  className="h-full w-full object-cover rounded-xl"
                  aspectRatio="square"
                  fallback={
                    <div className="h-full w-full bg-gradient-to-br from-[rgb(163,255,18)] to-green-400 rounded-xl flex items-center justify-center text-black font-black text-xl">
                      {(user?.username || mockUserData.username)[0]}
                    </div>
                  }
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[rgb(163,255,18)] rounded-full border-2 border-black animate-pulse shadow-lg shadow-[rgb(163,255,18)]/50" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-black text-lg tracking-wide">{user?.username || mockUserData.username}</div>
                <div className="flex items-center gap-3 mt-1">
                  <div className="text-[rgb(163,255,18)] text-sm font-bold">
                    {(mockUserData.hyperTokens / 1000).toFixed(1)}K HYP
                  </div>
                  <div className="text-white/50 text-xs">
                    Level {mockUserData.level}
                  </div>
                </div>
              </div>
              <Wallet className="w-5 h-5 text-white/40" />
            </div>
          </motion.div>

          {/* Main Navigation Mobile - Enhanced Grid Layout */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {mainNavigation.map((item, index) => {
              const getIcon = () => {
                switch(item.label) {
                  case 'TRADE': return <TrendingUp className="w-10 h-10 text-[rgb(163,255,18)]" />;
                  case 'PLAY': return <Gamepad2 className="w-10 h-10 text-[rgb(163,255,18)]" />;
                  case 'MUSEUM': return <ImageIcon className="w-10 h-10 text-[rgb(163,255,18)]" />;
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
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (item.label === 'TRADE') {
                      setViewMode('trade');
                    } else if (item.label === 'PLAY') {
                      setViewMode('play');
                    } else if (item.label === 'MUSEUM') {
                      setViewMode('museum');
                    }
                  }}
                  className="relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl p-5 active:border-[rgb(163,255,18)]/50 active:bg-[rgb(163,255,18)]/10 transition-all overflow-hidden group"
                >
                  {/* Hover glow effect */}
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

          {/* Secondary Navigation Mobile - Clean list style */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-1 border-t border-white/10 pt-4"
          >
            {secondaryNavigation.map((item, index) => {
              const isNFTStudio = item.label === "NFT STUDIO";
              const isLootboxes = item.label === "LOOTBOXES";
              
              if (item.external) {
                return (
                  <Link key={item.label} href={item.href}>
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.35 + index * 0.05 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center justify-between px-2 py-3 rounded-lg active:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={cn(
                          "w-5 h-5",
                          isNFTStudio ? "text-[rgb(255,215,0)]" : "text-white/60"
                        )} />
                        <span className={cn(
                          "text-sm font-black uppercase tracking-wider",
                          isNFTStudio ? "text-[rgb(255,215,0)]" : "text-white"
                        )}>
                          {item.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isLootboxes && (
                          <div className="bg-gradient-to-r from-[rgb(255,215,0)] to-[rgb(255,193,7)] px-2 py-0.5 rounded-full">
                            <span className="text-black text-xs font-black">3</span>
                          </div>
                        )}
                        <ArrowRight className="w-4 h-4 text-white/30" />
                      </div>
                    </motion.div>
                  </Link>
                );
              }
              
              return (
                <motion.div
                  key={item.label}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.35 + index * 0.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (item.href === "/studio") {
                      setViewMode('studio');
                    }
                  }}
                  className="flex items-center justify-between px-2 py-3 rounded-lg active:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Crown className={cn(
                      "w-5 h-5",
                      isNFTStudio ? "text-[rgb(255,215,0)]" : "text-white/60"
                    )} />
                    <span className={cn(
                      "text-sm font-black uppercase tracking-wider",
                      isNFTStudio ? "text-[rgb(255,215,0)]" : "text-white"
                    )}>
                      {item.label}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/30" />
                </motion.div>
              );
            })}
          </motion.div>

          {/* Active Missions Summary */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-auto pt-4"
          >
            <div className="bg-gradient-to-r from-[rgb(163,255,18)]/10 to-green-400/10 rounded-xl border border-[rgb(163,255,18)]/20 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/80 text-sm font-semibold">Active Missions</span>
                <div className="flex items-center gap-1">
                  <Trophy className="w-4 h-4 text-[rgb(163,255,18)]" />
                  <span className="text-[rgb(163,255,18)] text-sm font-bold">4</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">Daily Login</span>
                  <span className="text-white">85%</span>
                </div>
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[rgb(163,255,18)] to-green-400 rounded-full" style={{ width: '85%' }} />
                </div>
              </div>
              <p className="text-[rgb(163,255,18)] text-xs font-bold mt-2">Next: 50 HYP</p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div 
        className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_2fr_1fr] gap-6 relative px-4 md:px-8 xl:px-16 py-4 min-h-0"
        onClick={isCarouselVisible ? hideCarousel : undefined}
        style={{ cursor: isCarouselVisible ? 'pointer' : 'default' }}
      >
        {/* Wallpaper Button - Bottom Middle */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: isCarouselVisible ? 0 : 1, 
            y: isCarouselVisible ? 20 : 0
          }}
          transition={{ delay: isCarouselVisible ? 0 : 0.8, duration: 0.4 }}
          whileHover={{ y: -4, scale: 1.05 }}
          whileTap={{ y: -2, scale: 0.98 }}
          onClick={showCarousel}
          className="hidden md:block fixed bottom-0 left-[50%] -translate-x-1/2 z-20 px-4 lg:px-6 py-2 lg:py-3 bg-black/20 backdrop-blur-sm rounded-t-2xl border border-white/10 border-b-0 text-white hover:border-[rgb(163,255,18)]/40 hover:bg-[rgb(163,255,18)]/10 transition-all duration-300 group shadow-lg"
          title="Change Wallpaper"
          style={{ pointerEvents: isCarouselVisible ? 'none' : 'auto' }}
        >
          <div className="flex items-center gap-3">
            <Palette className="w-4 lg:w-5 h-4 lg:h-5 group-hover:text-[rgb(163,255,18)] transition-colors duration-300" />
            <span className="text-xs lg:text-sm font-semibold tracking-wide group-hover:text-[rgb(163,255,18)] transition-colors duration-300">
              WALLPAPERS
            </span>
            <div className="flex gap-1 ml-2">
              <div className="w-1 h-1 bg-white/40 rounded-full group-hover:bg-[rgb(163,255,18)] transition-colors duration-300"></div>
              <div className="w-1 h-1 bg-white/40 rounded-full group-hover:bg-[rgb(163,255,18)] transition-colors duration-300"></div>
              <div className="w-1 h-1 bg-white/40 rounded-full group-hover:bg-[rgb(163,255,18)] transition-colors duration-300"></div>
            </div>
          </div>
        </motion.button>

        {/* Left Navigation Panel - Desktop only, mobile handled by menu */}
        <motion.div 
          className="hidden md:flex flex-col justify-center h-full space-y-4 lg:space-y-6"
          animate={{ 
            x: isCarouselVisible ? -400 : 0,
            opacity: isCarouselVisible ? 0 : 1
          }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {/* Main Navigation - Centered vertically */}
          {mainNavigation.map((item, index) => {
            return (
              <motion.div 
                key={item.label}
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                whileHover={{ x: 24 }}
                transition={{ 
                  x: { duration: 0.15, ease: "easeOut" },
                  opacity: { duration: 0.3, ease: "easeOut", delay: 0.2 + index * 0.05 }
                }}
                onClick={() => {
                  if (item.label === 'TRADE') {
                    setViewMode('trade');
                  } else if (item.label === 'PLAY') {
                    setViewMode('play');
                  } else if (item.label === 'MUSEUM') {
                    setViewMode('museum');
                  } else {
                    null;
                  }
                }}
                onHoverStart={() => {
                  // Trigger beam animation immediately
                  const beams = document.querySelectorAll(`[data-beam-trigger="${item.label}"]`);
                  beams.forEach(beam => {
                    (beam as HTMLElement).style.animation = 'hyperRushEnter 0.4s ease-out forwards';
                    (beam as HTMLElement).style.opacity = '1';
                  });
                }}
                onHoverEnd={() => {
                  // Reset beam animation
                  const beams = document.querySelectorAll(`[data-beam-trigger="${item.label}"]`);
                  beams.forEach(beam => {
                    (beam as HTMLElement).style.animation = '';
                    (beam as HTMLElement).style.opacity = '0';
                  });
                }}
                className="group relative py-2 cursor-pointer opacity-0"
                style={{ opacity: 0 }}
              >
                  {/* Hyperspeed Animation Background */}
                  <div className="absolute inset-y-0 left-0 w-[120vw] -translate-x-full pointer-events-none">
                    {/* Main Energy Beam */}
                    <div data-beam-trigger={item.label} className="absolute top-1/2 left-0 w-full h-24 -translate-y-1/2 bg-gradient-to-r from-transparent via-[rgb(163,255,18)]/50 to-transparent blur-sm opacity-0" />
                    
                    {/* Secondary Glow */}
                    <div data-beam-trigger={item.label} className="absolute top-1/2 left-0 w-full h-40 -translate-y-1/2 bg-gradient-to-r from-transparent via-[rgb(163,255,18)]/25 to-transparent blur-md opacity-0" />
                    
                    {/* Core Beam */}
                    <div data-beam-trigger={item.label} className="absolute top-1/2 left-0 w-full h-1 -translate-y-1/2 bg-gradient-to-r from-transparent via-white/90 to-transparent blur-sm opacity-0" />
                    
                    {/* Speed Lines */}
                    <div data-beam-trigger={item.label} className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-[rgb(163,255,18)]/60 to-transparent blur-sm opacity-0" />
                    <div data-beam-trigger={item.label} className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-[rgb(163,255,18)]/60 to-transparent blur-sm opacity-0" />
                    
                    {/* Additional Power Lines */}
                    <div data-beam-trigger={item.label} className="absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/40 to-transparent blur-sm opacity-0" />
                    <div data-beam-trigger={item.label} className="absolute top-2/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/40 to-transparent blur-sm opacity-0" />
                  </div>
                  
                  {/* Link Content */}
                  <div className="relative z-10">
                    <h3 
                      className="text-white text-2xl lg:text-4xl xl:text-6xl font-black tracking-wider transition-all duration-300 group-hover:text-green-400" 
                      style={{ 
                        filter: 'drop-shadow(0 0 30px rgba(0,0,0,0.8))',
                        color: 'white'
                      }}
                    >
                      {item.label}
                    </h3>
                    <p className="text-white/70 text-sm lg:text-lg xl:text-xl font-medium group-hover:text-white transition-all duration-300 mt-1">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
            );
          })}

          {/* Secondary Navigation - Smaller Links */}
          <motion.div 
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ 
              duration: 0.3, 
              ease: "easeOut", 
              delay: 0.4
            }}
            className="pt-4 lg:pt-8 border-t border-white/20 space-y-3 lg:space-y-6 opacity-0"
            style={{ opacity: 0 }}
          >
            {secondaryNavigation.map((item) => {
              const handleClick = () => {
                if (!item.external && item.href === "/studio") {
                  setViewMode('studio');
                }
              };

              // Special styling for NFT Studio link
              const isNFTStudio = item.label === "NFT STUDIO";
              const isLootboxes = item.label === "LOOTBOXES";
              
              const animationContent = (
                <>
                  {/* Smaller Hyperspeed Animation */}
                  <div className="absolute inset-y-0 left-0 w-[100vw] -translate-x-full pointer-events-none">
                    {/* Energy Beam */}
                    <div className={`absolute top-1/2 left-0 w-full h-16 -translate-y-1/2 bg-gradient-to-r from-transparent ${isNFTStudio ? 'via-[rgb(255,215,0)]/40' : 'via-[rgb(163,255,18)]/40'} to-transparent blur-sm opacity-0 transition-all duration-75 group-hover:opacity-100 group-hover:animate-[hyperRushEnter_0.3s_ease-out_forwards] group-hover:[animation-fill-mode:forwards]`} />
                    
                    {/* Secondary Glow */}
                    <div className={`absolute top-1/2 left-0 w-full h-24 -translate-y-1/2 bg-gradient-to-r from-transparent ${isNFTStudio ? 'via-[rgb(255,215,0)]/20' : 'via-[rgb(163,255,18)]/20'} to-transparent blur-md opacity-0 transition-all duration-75 group-hover:opacity-100 group-hover:animate-[hyperRushEnter_0.3s_ease-out_forwards] group-hover:[animation-fill-mode:forwards]`} />
                    
                    {/* Core Beam */}
                    <div className="absolute top-1/2 left-0 w-full h-1 -translate-y-1/2 bg-gradient-to-r from-transparent via-white/80 to-transparent blur-sm opacity-0 transition-all duration-75 group-hover:opacity-100 group-hover:animate-[hyperRushEnter_0.3s_ease-out_forwards] group-hover:[animation-fill-mode:forwards]" />
                    
                    {/* Speed Lines */}
                    <div className={`absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent ${isNFTStudio ? 'via-[rgb(255,215,0)]/50' : 'via-[rgb(163,255,18)]/50'} to-transparent blur-sm opacity-0 transition-all duration-75 group-hover:opacity-100 group-hover:animate-[hyperRushEnter_0.3s_ease-out_forwards] group-hover:[animation-fill-mode:forwards]`} />
                    <div className={`absolute top-2/3 left-0 w-full h-px bg-gradient-to-r from-transparent ${isNFTStudio ? 'via-[rgb(255,215,0)]/50' : 'via-[rgb(163,255,18)]/50'} to-transparent blur-sm opacity-0 transition-all duration-75 group-hover:opacity-100 group-hover:animate-[hyperRushEnter_0.3s_ease-out_forwards] group-hover:[animation-fill-mode:forwards]`} />
                  </div>
                  
                  {/* Link Content */}
                  <div className="relative z-10">
                    <div className="flex items-center gap-3">
                      <h3 
                        className={`text-sm lg:text-lg xl:text-2xl font-black tracking-wider transition-all duration-300 ${
                          isNFTStudio 
                            ? 'text-[rgb(255,215,0)] group-hover:text-[rgb(255,223,0)]' 
                            : 'text-white'
                        }`}
                        style={{ 
                          filter: isNFTStudio 
                            ? 'drop-shadow(0 0 20px rgba(255,215,0,0.6))' 
                            : 'drop-shadow(0 0 20px rgba(0,0,0,0.7))'
                        }}
                      >
                        {isNFTStudio && <Crown className="inline w-4 lg:w-5 xl:w-6 h-4 lg:h-5 xl:h-6 mr-2 mb-1" />}
                        {item.label}
                      </h3>
                      
                      {isLootboxes && (
                        <div className="bg-gradient-to-r from-[rgb(255,215,0)] to-[rgb(255,193,7)] px-2 py-0.5 rounded border border-[rgb(255,215,0)]/50 shadow-lg shadow-[rgb(255,215,0)]/30 flex items-center">
                          <span className="text-black text-xs lg:text-sm font-black">3</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              );

              if (item.external) {
                return (
                  <Link key={item.label} href={item.href}>
                    <motion.div 
                      whileHover={{ x: 16 }}
                      transition={{ x: { duration: 0.15, ease: "easeOut" } }}
                      className="group relative py-1"
                    >
                      {animationContent}
                    </motion.div>
                  </Link>
                );
              }

              return (
                <motion.div 
                  key={item.label}
                  whileHover={{ x: 16 }}
                  transition={{ x: { duration: 0.15, ease: "easeOut" } }}
                  onClick={handleClick}
                  className="group relative py-1 cursor-pointer"
                >
                  {animationContent}
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>

        {/* Center Space - Mobile content, Desktop empty */}
        <div className="relative md:block">
          {/* Mobile Bottom Navigation Bar - Fixed at bottom with icons */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-30">
            <div className="bg-black/60 backdrop-blur-xl border-t border-white/10">
              <div className="grid grid-cols-5">
                {/* Home Button */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    // Already on home, could add refresh or scroll to top logic
                  }}
                  className="flex flex-col items-center py-3 text-[rgb(163,255,18)] transition-colors group"
                >
                  <Home className="w-6 h-6 mb-1 group-active:scale-110 transition-transform" />
                  {/* <span className="text-[10px] font-bold uppercase tracking-wider">HOME</span> */}
                </motion.button>
                
                {/* Main Navigation Items */}
                {mainNavigation.map((item) => (
                  <motion.button
                    key={item.label}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      if (item.label === 'TRADE') {
                        setViewMode('trade');
                      } else if (item.label === 'PLAY') {
                        setViewMode('play');
                      } else if (item.label === 'MUSEUM') {
                        setViewMode('museum');
                      }
                    }}
                    className="flex flex-col items-center py-3 text-white/60 active:text-[rgb(163,255,18)] transition-colors group"
                  >
                    {item.label === 'TRADE' && <TrendingUp className="w-6 h-6 mb-1 group-active:scale-110 transition-transform" />}
                    {item.label === 'PLAY' && <Gamepad2 className="w-6 h-6 mb-1 group-active:scale-110 transition-transform" />}
                    {item.label === 'MUSEUM' && <ImageIcon className="w-6 h-6 mb-1 group-active:scale-110 transition-transform" />}
                    {item.label === 'COLLECTION' && <User className="w-6 h-6 mb-1 group-active:scale-110 transition-transform" />}
                    {/* <span className="text-[9px] font-bold uppercase tracking-wider">{item.label.slice(0, 5)}</span> */}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile Wallpaper Drawer - Side Panel */}
          <motion.div
            initial={false}
            animate={{ 
              x: mobileWallpaperOpen ? 0 : '-100%',
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden fixed top-0 left-0 h-full w-28 bg-black/95 backdrop-blur-2xl z-50 shadow-2xl border-r border-white/20"
          >
            {/* Close/Toggle Button */}
            <button
              onClick={() => setMobileWallpaperOpen(false)}
              className="absolute top-1/2 -right-10 -translate-y-1/2 bg-black/80 backdrop-blur-sm rounded-r-xl px-2 py-3 border border-white/10 border-l-0"
            >
              <Palette className="w-5 h-5 text-white/80" />
            </button>
            
            <div className="flex flex-col h-full py-16 px-3">
              {/* Header */}
              <div className="flex flex-col items-center gap-2 mb-6">
                <Sparkles className="w-6 h-6 text-[rgb(163,255,18)]" />
                <span className="text-[11px] text-white/80 font-black uppercase tracking-wider text-center">Wallpapers</span>
              </div>
              
              {/* Wallpaper Grid - Same as desktop */}
              <div className="flex flex-col gap-3 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                {wallpapers.map((wallpaper) => (
                  <motion.button
                    key={wallpaper.id}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setCurrentBackground(wallpaper.src);
                      setMobileWallpaperOpen(false);
                    }}
                    className={cn(
                      "relative w-full aspect-video rounded-lg overflow-hidden border-2 transition-all",
                      currentBackground === wallpaper.src 
                        ? "border-[rgb(163,255,18)] shadow-lg shadow-[rgb(163,255,18)]/30" 
                        : "border-white/10 hover:border-white/30"
                    )}
                  >
                    {wallpaper.type === 'video' ? (
                      <video 
                        src={wallpaper.src}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        onLoadedData={(e) => {
                          // Set video to a preview frame
                          const video = e.target as HTMLVideoElement;
                          video.currentTime = 1;
                          video.play();
                        }}
                      />
                    ) : (
                      <img 
                        src={wallpaper.src} 
                        alt={wallpaper.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    )}
                    
                    {/* Overlay with name */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity">
                      <span className="absolute bottom-1.5 left-1.5 text-[9px] text-white font-bold uppercase tracking-wide">
                        {wallpaper.name}
                      </span>
                    </div>
                    
                    {/* Selected indicator */}
                    {currentBackground === wallpaper.src && (
                      <div className="absolute top-1 right-1">
                        <div className="w-2 h-2 bg-[rgb(163,255,18)] rounded-full animate-pulse" />
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
              
              {/* Bottom Action - View All */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setMobileWallpaperOpen(false);
                  showCarousel();
                }}
                className="mt-4 p-2.5 bg-gradient-to-r from-[rgb(163,255,18)]/20 to-green-400/20 rounded-xl border border-[rgb(163,255,18)]/30 hover:bg-[rgb(163,255,18)]/30 transition-colors"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-[rgb(163,255,18)]" />
                  <span className="text-[10px] text-[rgb(163,255,18)] font-black tracking-wide">BROWSE ALL</span>
                </div>
              </motion.button>
            </div>
          </motion.div>

          {/* Mobile Wallpaper Drawer Backdrop */}
          {mobileWallpaperOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              onClick={() => setMobileWallpaperOpen(false)}
            />
          )}

          {/* Mobile Wallpaper Toggle - Shows when drawer is closed */}
          {!mobileWallpaperOpen && (
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: 0.3 }}
              onClick={() => setMobileWallpaperOpen(true)}
              className="md:hidden fixed left-0 top-1/2 -translate-y-1/2 z-30 bg-black/60 backdrop-blur-sm rounded-r-xl px-2 py-3 border border-white/10 border-l-0"
            >
              <Palette className="w-5 h-5 text-white/80" />
            </motion.button>
          )}

          {/* Mobile Floating Action Cards - Positioned to avoid overlap */}
          <div className="md:hidden">
            {/* Combined Trending & Profile Card - Top Center, Responsive */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="fixed top-16 left-4 right-4 z-20 flex justify-center"
            >
              <div className="flex flex-col sm:flex-row gap-2 w-full max-w-sm">
                {/* Trending Card */}
                <motion.div 
                  className="flex-1 bg-black/30 backdrop-blur-sm rounded-xl border border-white/10 p-3"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-white/60 text-[10px] uppercase tracking-wider">Trending</p>
                      <h4 className="text-white font-bold text-xs truncate">
                        {trendingCollections[currentCollectionIndex].name}
                      </h4>
                    </div>
                    <span className="text-[rgb(163,255,18)] text-xs font-bold ml-2">
                      {trendingCollections[currentCollectionIndex].change}
                    </span>
                  </div>
                </motion.div>

                {/* Profile Widget */}
                <motion.div
                  className="bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 p-2 flex items-center gap-2"
                  onClick={handleWalletConnect}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-9 h-9 relative flex-shrink-0">
                    <MediaRenderer
                      src={user?.profilePicture || mockUserData.profilePicture}
                      alt="Profile"
                      className="h-full w-full object-cover rounded-lg"
                      aspectRatio="square"
                      fallback={
                        <div className="h-full w-full bg-gradient-to-br from-[rgb(163,255,18)] to-green-400 rounded-lg flex items-center justify-center text-black font-black text-xs">
                          {(user?.username || mockUserData.username)[0]}
                        </div>
                      }
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[rgb(163,255,18)] rounded-full border border-black animate-pulse" />
                  </div>
                  <div className="pr-2">
                    <div className="text-white text-[10px] font-bold truncate max-w-[60px]">
                      {user?.username || mockUserData.username}
                    </div>
                    <div className="text-[rgb(163,255,18)] text-[10px] font-bold">
                      {(mockUserData.hyperTokens / 1000).toFixed(1)}K
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Mission Indicator - Above bottom nav */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="fixed bottom-20 left-1/2 -translate-x-1/2 z-20"
            >
              <motion.div 
                className="bg-black/30 backdrop-blur-sm rounded-full border border-white/10 px-4 py-2 flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
              >
                <Trophy className="w-4 h-4 text-[rgb(163,255,18)]" />
                <span className="text-white/80 text-xs">4 Active</span>
                <span className="text-[rgb(163,255,18)] font-bold text-xs">+50 HYP</span>
              </motion.div>
            </motion.div>
          </div>

          {/* Desktop HUD Grid Overlay */}
          <div className="hidden md:block absolute inset-0 opacity-10">
            <div className="h-full w-full bg-[linear-gradient(rgba(163,255,18,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(163,255,18,0.1)_1px,transparent_1px)] bg-[size:40px_40px]" />
          </div>
          
          {/* Desktop Subtle scanning lines */}
          <div className="hidden md:block absolute inset-0">
            <div className="h-full w-full bg-[linear-gradient(0deg,transparent_98%,rgba(163,255,18,0.05)_100%)] bg-[length:100%_3px] animate-pulse" />
          </div>
        </div>

        {/* Right Panel - Hidden on mobile, visible on desktop */}
        <motion.div 
          initial={{ x: 30, opacity: 0 }}
          animate={{ 
            x: isCarouselVisible ? 400 : 0, 
            opacity: isCarouselVisible ? 0 : 1 
          }}
          transition={{ 
            duration: isCarouselVisible ? 0.5 : 0.3, 
            ease: "easeInOut", 
            delay: isCarouselVisible ? 0 : 0.25 
          }}
          className="hidden md:flex flex-col justify-center h-full max-h-full overflow-hidden gap-4"
        >
          
          {/* Trending Collections - Image Slider */}
          <div className="h-1/4 min-h-0 flex flex-col">
            
            <div className="relative flex-1 rounded-2xl overflow-hidden shadow-2xl">
              {/* Image Slider Container */}
              <div className="relative h-full">
                {trendingCollections.map((collection, index) => (
                  <div
                    key={index}
                    className={cn(
                      "absolute inset-0 transition-all duration-700 ease-in-out",
                      index === currentCollectionIndex
                        ? "opacity-100 scale-100"
                        : "opacity-0 scale-105"
                    )}
                  >
                    {/* Background Media */}
                    {collection.type === 'video' ? (
                      <video
                        src={collection.image}
                        className="w-full h-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                      />
                    ) : (
                      <img
                        src={collection.image}
                        alt={collection.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                    
                    {/* Dark Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    {/* Content Overlay - Bottom Left */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-8">
                      <div className="space-y-1 lg:space-y-2">
                        <p className="text-white/90 text-xs lg:text-lg font-bold tracking-wider uppercase">
                          {collection.subtitle}
                        </p>
                        <h3 className="text-white text-xl lg:text-4xl font-black tracking-wide mb-2 lg:mb-4">
                          {collection.name}
                        </h3>
                        <div className="flex items-center gap-4 lg:gap-6 text-sm lg:text-xl">
                          <span className="text-white font-mono font-bold">
                            FLOOR: {collection.floor}
                          </span>
                          <span className="text-white font-black text-base lg:text-2xl">
                            {collection.change}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Progress Lines - Bottom of Image */}
              <div className="absolute bottom-0 left-0 right-0 px-4 lg:px-8 pb-2">
                <div className="flex gap-2">
                  {trendingCollections.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentCollectionIndex(index)}
                      className="flex-1 h-1 transition-all duration-300 relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-white/20 rounded-full" />
                      <div 
                        className={cn(
                          "absolute inset-0 rounded-full transition-all duration-700",
                          index === currentCollectionIndex
                            ? "bg-white shadow-lg shadow-white/50"
                            : "bg-white/40 hover:bg-white/60"
                        )} 
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Operations Panel - 75% of remaining space */}
          <div className="min-h-0 flex flex-col">
            <div className="flex-1 bg-black/20 backdrop-blur-sm rounded-2xl border border-white/10 p-4 lg:p-6 overflow-y-auto">
              <div className="space-y-3">
                {activeMissions.map((mission) => (
                  <div key={mission.id} className="group bg-black/30 rounded-xl border border-white/10 p-3 lg:p-4 transition-all duration-300 hover:border-[rgb(163,255,18)]/30">
                    <div className="flex items-start justify-between mb-2 lg:mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white text-sm lg:text-lg font-bold tracking-wide truncate mb-1">
                          {mission.title}
                        </h4>
                        <div className="flex items-center gap-2 lg:gap-4">
                          <span className="text-white text-xs lg:text-base font-black">
                            {mission.reward}
                          </span>
                          <Badge 
                            variant={mission.status === "completing" ? "default" : "outline"}
                            className={cn(
                              "text-xs font-black",
                              mission.status === "completing" 
                                ? "bg-white text-black"
                                : "text-white/70"
                            )}
                          >
                            {mission.status === "completing" ? "COMPLETING" : "ACTIVE"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-1 lg:space-y-2">
                      <div className="flex justify-between items-center text-xs lg:text-sm">
                        <span className="text-white/70 font-medium">Progress</span>
                        <span className="text-white font-bold">{mission.progress}%</span>
                      </div>
                      <Progress 
                        value={mission.progress} 
                        className="h-1.5 lg:h-2 bg-white/10"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Hidden ConnectButton for wallet management */}
      <div ref={connectButtonRef} className="hidden">
        <ConnectButton
          client={client}
          chain={sepolia}
          connectButton={{
            label: 'Connect Wallet',
          }}
          connectModal={{
            size: 'wide',
            titleIcon: '',
            welcomeScreen: {
              title: 'Connect to HypeX',
              subtitle: 'Choose how you want to connect to the ultimate gaming NFT marketplace.',
            },
          }}
        />
      </div>
    </div>
  );
}