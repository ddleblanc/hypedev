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
  Wallet
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

// Secondary navigation will be created dynamically inside component

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
  const { showCarousel, isCarouselVisible, hideCarousel } = useBackgroundCarousel();
  const [currentCollectionIndex, setCurrentCollectionIndex] = useState(0);
  const connectButtonRef = useRef<HTMLDivElement>(null);
  

  useEffect(() => {
    const collectionInterval = setInterval(() => {
      setCurrentCollectionIndex((prev) => (prev + 1) % trendingCollections.length);
    }, 4000);
    return () => clearInterval(collectionInterval);
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
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="relative z-50 flex items-center justify-between px-16 py-6 flex-shrink-0">
        {/* Left section - Logo */}
        <div className="animate-[slideInLeft_0.3s_ease-out_0.1s_both]">
          <Image
            src="/assets/img/logo-text.png"
            alt="HYPERCHAINX"
            width={300}
            height={100}
            className="h-12 w-auto drop-shadow-2xl"
          />
        </div>
        
        {/* Right section - Player Terminal (always visible) */}
        <div className="relative animate-[slideInRight_0.3s_ease-out_0.15s_both] flex items-center gap-1">
           {/* Profile Section - PFP + Banner */}
          <div 
            className="flex items-stretch bg-black/40 backdrop-blur-xl rounded-l-2xl border border-white/10 overflow-hidden cursor-pointer transition-all duration-300 hover:bg-black/60"
            onClick={handleWalletConnect}
          >
            {/* Profile Picture - Full Height, No Padding */}
            <div className="w-20 h-20 relative flex-shrink-0">
              <MediaRenderer
                src={user?.profilePicture || mockUserData.profilePicture}
                alt="Profile Picture"
                className="h-full w-full object-cover"
                aspectRatio="square"
                fallback={
                  <div className="h-full w-full bg-gradient-to-br from-[rgb(163,255,18)] to-green-400 flex items-center justify-center text-black font-black text-xl">
                    {(user?.username || mockUserData.username)[0]}
                  </div>
                }
              />
              <div className="absolute top-1 right-1 w-3 h-3 bg-[rgb(163,255,18)] rounded-full border border-black animate-pulse shadow-sm shadow-[rgb(163,255,18)]/50" />
            </div>

            {/* Username Banner */}
            <div className="w-72 h-20 relative flex-shrink-0">
              <MediaRenderer
                src={user?.profilePicture || mockUserData.profilePicture}
                alt="User Banner"
                className="h-full w-full object-cover"
                aspectRatio="auto"
              />
              {/* Dark to transparent fade overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent"></div>
              {/* Username */}
              <div className="absolute inset-0 flex items-center justify-between pr-4 pl-8">
                <span className="text-white text-lg font-bold tracking-wide drop-shadow-lg">
                  {user?.username || mockUserData.username}
                </span>
                <Wallet className="w-5 h-5 text-white/80 drop-shadow-lg" />
              </div>
            </div>
          </div>
          {/* Level Section */}
          <div className="flex items-center bg-black border-t border-b border-white/10 px-6 py-4 h-20">
            <div className="text-white text-sm font-bold">
              {(mockUserData.hyperTokens / 1000).toFixed(1)}K
            </div>
          </div>

          {/* Assets Section */}
          <div className="relative flex items-center justify-center rounded-r-2xl border border-white/10 h-20 w-20 cursor-pointer transition-all duration-300 hover:brightness-110 overflow-hidden">
            <div 
              className="absolute inset-0 bg-cover bg-center" 
              style={{ backgroundImage: 'url(/assets/img/hyper-logo.jpg)' }}
            />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div 
        className="flex-1 grid grid-cols-[1fr_2fr_1fr] gap-6 relative px-16 py-4 min-h-0"
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
        className="fixed bottom-0 left-[50%] -translate-x-1/2 z-20 px-6 py-3 bg-black/20 backdrop-blur-sm rounded-t-2xl border border-white/10 border-b-0 text-white hover:border-[rgb(163,255,18)]/40 hover:bg-[rgb(163,255,18)]/10 transition-all duration-300 group shadow-lg"
        title="Change Wallpaper"
        style={{ pointerEvents: isCarouselVisible ? 'none' : 'auto' }}
      >
        <div className="flex items-center gap-3">
          <Palette className="w-5 h-5 group-hover:text-[rgb(163,255,18)] transition-colors duration-300" />
          <span className="text-sm font-semibold tracking-wide group-hover:text-[rgb(163,255,18)] transition-colors duration-300">
            WALLPAPERS
          </span>
          <div className="flex gap-1 ml-2">
            <div className="w-1 h-1 bg-white/40 rounded-full group-hover:bg-[rgb(163,255,18)] transition-colors duration-300"></div>
            <div className="w-1 h-1 bg-white/40 rounded-full group-hover:bg-[rgb(163,255,18)] transition-colors duration-300"></div>
            <div className="w-1 h-1 bg-white/40 rounded-full group-hover:bg-[rgb(163,255,18)] transition-colors duration-300"></div>
          </div>
        </div>
      </motion.button>
        {/* Left Navigation Panel - Clean and Centered */}
        <motion.div 
          className="flex flex-col justify-center h-full space-y-6"
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
                      className="text-white text-6xl font-black tracking-wider transition-all duration-300 group-hover:text-green-400" 
                      style={{ 
                        filter: 'drop-shadow(0 0 30px rgba(0,0,0,0.8))',
                        color: 'white'
                      }}
                    >
                      {item.label}
                    </h3>
                    <p className="text-white/70 text-xl font-medium group-hover:text-white transition-all duration-300 mt-1">
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
            className="pt-8 border-t border-white/20 space-y-6 opacity-0"
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
                        className={`text-2xl font-black tracking-wider transition-all duration-300 ${
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
                        {isNFTStudio && <Crown className="inline w-6 h-6 mr-2 mb-1" />}
                        {item.label}
                      </h3>
                      
                      {isLootboxes && (
                        <div className="bg-gradient-to-r from-[rgb(255,215,0)] to-[rgb(255,193,7)] px-2 py-0.5 rounded border border-[rgb(255,215,0)]/50 shadow-lg shadow-[rgb(255,215,0)]/30 flex items-center">
                          <span className="text-black text-sm font-black">3</span>
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

        {/* Center Space - Empty for HUD feel */}
        <div className="relative">
          {/* HUD Grid Overlay */}
          <div className="absolute inset-0 opacity-10">
            <div className="h-full w-full bg-[linear-gradient(rgba(163,255,18,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(163,255,18,0.1)_1px,transparent_1px)] bg-[size:40px_40px]" />
          </div>
          
          {/* Subtle scanning lines for HUD effect */}
          <div className="absolute inset-0">
            <div className="h-full w-full bg-[linear-gradient(0deg,transparent_98%,rgba(163,255,18,0.05)_100%)] bg-[length:100%_3px] animate-pulse" />
          </div>
        </div>

        {/* Right Panel - HUD Data Panels - Equal Split */}
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
          className="flex flex-col justify-center h-full max-h-full overflow-hidden gap-4"
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
                    <div className="absolute bottom-0 left-0 right-0 p-8">
                      <div className="space-y-2">
                        <p className="text-white/90 text-lg font-bold tracking-wider uppercase">
                          {collection.subtitle}
                        </p>
                        <h3 className="text-white text-4xl font-black tracking-wide mb-4">
                          {collection.name}
                        </h3>
                        <div className="flex items-center gap-6 text-xl">
                          <span className="text-white font-mono font-bold">
                            FLOOR: {collection.floor}
                          </span>
                          <span className="text-white font-black text-2xl">
                            {collection.change}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Progress Lines - Bottom of Image */}
              <div className="absolute bottom-0 left-0 right-0 px-8 pb-2">
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
            <div className="flex-1 bg-black/20 backdrop-blur-sm rounded-2xl border border-white/10 p-6 overflow-y-auto">
              <div className="space-y-3">
                {activeMissions.map((mission) => (
                  <div key={mission.id} className="group bg-black/30 rounded-xl border border-white/10 p-4 transition-all duration-300 hover:border-[rgb(163,255,18)]/30">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white text-lg font-bold tracking-wide truncate mb-1">
                          {mission.title}
                        </h4>
                        <div className="flex items-center gap-4">
                          <span className="text-white text-base font-black">
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
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-white/70 font-medium">Progress</span>
                        <span className="text-white font-bold">{mission.progress}%</span>
                      </div>
                      <Progress 
                        value={mission.progress} 
                        className="h-2 bg-white/10"
                        // style={{ 
                        //   backgroundColor: 'rgba(255,255,255,0.1)',
                        //   '--progress-foreground': mission.status === "completing" 
                        //     ? 'rgb(163,255,18)' 
                        //     : 'rgba(163,255,18,0.8)'
                        // } as React.CSSProperties}
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