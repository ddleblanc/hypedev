"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Gift, 
  Star, 
  Crown, 
  Gem, 
  Zap, 
  ChevronLeft,
  ChevronRight,
  X,
  Sword,
  Shield,
  Wand2
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { GameCommandCard, GameCommandCardOption } from "@/components/ui/game-command-card";

const LOOTBOX_NAVIGATION = [
  { label: "WARRIOR BOXES", icon: Sword, href: "/lootboxes/warrior" },
  { label: "MAGE BOXES", icon: Wand2, href: "/lootboxes/mage" },
  { label: "GUARDIAN BOXES", icon: Shield, href: "/lootboxes/guardian" },
  { label: "COSMIC BOXES", icon: Star, href: "/lootboxes/cosmic" },
  { label: "LEGENDARY VAULT", icon: Crown, href: "/lootboxes/legendary" }
];

const LOOTBOX_BANNERS: GameCommandCardOption[] =  [
  {
    id: '1',
    title: "Warrior's Arsenal",
    description: "COMBAT COLLECTION",
    image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/1ad84358-5802-4eae-b74b-f6c880d38ea5/transcode=true,original=true,quality=90/vid_00005.webm",
    category: 'Epic',
    accentColor: 'purple'
  },
  {
    id: '2',
    title: "Mystic Treasures",
    description: "MAGIC COLLECTION",
    image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/a770baa3-875b-4e1d-9f8f-3a0f533e3f96/transcode=true,original=true,quality=90/Blood%20Moon%20Oni.webm",
    category: 'Legendary',
    accentColor: 'amber'
  },
    {
    id: '3',
    title: "Cosmic Cache",
    description: "UNIVERSE COLLECTION",
    image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/7f64191f-c494-492e-ab3d-21fb88686523/transcode=true,original=true,quality=90/6JRGQ9C6B2HFZJ94J50N42NPJ0.webm?token=CfDJ8IU-uofjHWVPg1_3zdfXdVM1DITXcjK26rTZ_vSgBMON7cn-5Hl4AXjKzNKtDpWgM1vyLFAaaQOTYAXngeNshK2hchUDWACRROB_CMqEUo8WVGj-YwL9zsZzNiUr8P9Qrb2-fYUTWJFR9leN08g5eAEvNhLDPlRIhzJQ_J_OtG1vJHXmtmkbI4U9HzwrEJ_6mIzNxhxK7TdTQv5IdF-d6mRjZhiFfA2G7uXVfu5tTjmRqwan9Rou9I-n4vAonRsTHA.mp4",
    category: 'Legendary',
    accentColor: 'red'
  },
];

const LOOTBOX_OPTIONS = [
  {
    id: 'starter-box',
    name: 'Starter Loot Box',
    rarity: 'Common',
    price: '0.01 ETH',
    image: 'https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/69281ee0-9883-441a-9a8e-e43ff4e05ad0/original=true,quality=90/94617017.jpeg',
    rewards: ['Basic Weapons', 'Common Armor', 'Resources'],
    owned: 3,
    color: 'from-gray-500 to-gray-700'
  },
  {
    id: 'warrior-chest',
    name: 'Warrior Chest',
    rarity: 'Rare',
    price: '0.05 ETH',
    image: 'https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/c51fe7d8-e94f-45ed-b23e-d584c8998118/anim=false,width=450,optimized=true/00586-3019206393.jpeg',
    rewards: ['Epic Weapons', 'Rare Armor', 'Power-ups'],
    owned: 5,
    color: 'from-blue-500 to-purple-600'
  },
  {
    id: 'legend-vault',
    name: 'Legendary Vault',
    rarity: 'Epic',
    price: '0.15 ETH',
    image: 'https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/5683b6d8-fa8c-4d5f-8fdb-b6e98801c82a/anim=false,width=450,optimized=true/01959-1721753241.jpeg',
    rewards: ['Legendary Items', 'Rare Skins', 'XP Boosters'],
    owned: 2,
    color: 'from-purple-500 to-pink-600'
  },
  {
    id: 'mythic-treasury',
    name: 'Mythic Treasury',
    rarity: 'Mythic',
    price: '0.5 ETH',
    image: 'https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/50d09e0b-f10b-400b-9354-2fa908865565/anim=false,width=450,optimized=true/00015-2320167257.jpeg',
    rewards: ['Mythic Artifacts', 'Exclusive Skins', 'Premium Currency'],
    owned: 1,
    color: 'from-yellow-400 to-orange-500'
  },
  {
    id: 'cosmic-cache',
    name: 'Cosmic Cache',
    rarity: 'Cosmic',
    price: '1.0 ETH',
    image: 'https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/1351be80-e8bd-4d05-8d60-31ced9a024ce/original=true,quality=90/96222521.jpeg',
    rewards: ['Cosmic Relics', 'Ultimate Weapons', 'Special Titles'],
    owned: 1,
    color: 'from-cyan-400 to-blue-600'
  }
];

export default function LootboxesPage() {
  const router = useRouter();
  const [showLootboxCarousel, setShowLootboxCarousel] = useState(false);
  const [selectedLootbox, setSelectedLootbox] = useState<string | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasVideoEnded, setHasVideoEnded] = useState(false);
  const [showRevealImage, setShowRevealImage] = useState(false);
  const [revealedItem, setRevealedItem] = useState<any>(null);
  const [showClaimButton, setShowClaimButton] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [showRarityOverlay, setShowRarityOverlay] = useState(false);


  // Control video playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isVideoPlaying && !hasVideoEnded) {
      video.currentTime = 0;
      video.play();
    } else if (!isVideoPlaying) {
      video.pause();
      video.currentTime = 0;
      setHasVideoEnded(false);
    }
  }, [isVideoPlaying, hasVideoEnded]);


  const handleLootboxSelect = (lootboxId: string) => {
    const selectedBox = LOOTBOX_OPTIONS.find(box => box.id === lootboxId);
    setSelectedLootbox(lootboxId);
    setRevealedItem(selectedBox);
    setShowLootboxCarousel(false);
    setShowRevealImage(false); // Reset reveal state
    setShowClaimButton(false); // Reset claim button
    setIsClaiming(false); // Reset claiming state
    setHasVideoEnded(false); // Reset video end state
    setShowRarityOverlay(false); // Reset rarity overlay
    setIsVideoPlaying(true);
    // Handle loot box opening logic here
    console.log('Opening lootbox:', lootboxId);
  };

  const handleClaim = () => {
    setIsClaiming(true);
    setShowClaimButton(false);
    
    // Reset everything after animation completes
    setTimeout(() => {
      setShowRevealImage(false);
      setRevealedItem(null);
      setIsClaiming(false);
      setShowRarityOverlay(false);
      setIsVideoPlaying(false); // This will bring back the side panels
    }, 1000);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Common': return 'text-gray-400 border-gray-500';
      case 'Rare': return 'text-blue-400 border-blue-500';
      case 'Epic': return 'text-purple-400 border-purple-500';
      case 'Mythic': return 'text-yellow-400 border-yellow-500';
      case 'Cosmic': return 'text-cyan-400 border-cyan-500';
      default: return 'text-white border-white';
    }
  };

  const getRarityOverlayColor = (rarity: string) => {
    switch (rarity) {
      case 'Common': return 'rgba(156, 163, 175, 0.225)'; // gray-400 with opacity
      case 'Rare': return 'rgba(96, 165, 250, 0.225)'; // blue-400 with opacity
      case 'Epic': return 'rgba(168, 85, 247, 0.225)'; // purple-400 with opacity
      case 'Mythic': return 'rgba(251, 191, 36, 0.225)'; // yellow-400 with opacity
      case 'Cosmic': return 'rgba(34, 211, 238, 0.225)'; // cyan-400 with opacity
      default: return 'rgba(255, 255, 255, 0.225)'; // white with opacity
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
        {/* Fullscreen Video Background */}
        <div className="fixed inset-0 -z-10">
          <video
            ref={videoRef}
            src="/assets/vid/reveal.mp4"
            playsInline
            muted
            className="w-full h-full object-cover grayscale"
            onEnded={() => {
              setHasVideoEnded(true);
              if (videoRef.current) {
                videoRef.current.pause();
              }
            }}
            onLoadedData={() => {
              if (videoRef.current && !isVideoPlaying) {
                videoRef.current.currentTime = 0;
              }
            }}
            onTimeUpdate={() => {
              const video = videoRef.current;
              if (video && isVideoPlaying) {
                const progress = video.currentTime / video.duration;
                // Show rarity color overlay at 45% through video
                if (progress >= 0.45 && !showRarityOverlay) {
                  setShowRarityOverlay(true);
                }
                // Show reveal image at 75% through video (after overlay completes)
                if (progress >= 0.75 && !showRevealImage) {
                  setShowRevealImage(true);
                  // Hide overlay when NFT appears to prevent conflicts
                  setShowRarityOverlay(false);
                }
              }
            }}
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* Rarity Color Overlay - Grows from center before NFT reveal */}
        <AnimatePresence>
          {showRarityOverlay && revealedItem && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 0.5, 2, 8],
                opacity: [0, 0.225, 0.6, 0.75]
              }}
              exit={{ scale: 12, opacity: 0 }}
              transition={{ 
                duration: 2,
                times: [0, 0.6, 0.85, 1],
                ease: [0.22, 1, 0.36, 1],
                exit: { duration: 0.3, ease: "easeIn" }
              }}
              className="fixed inset-0 z-5 flex items-center justify-center pointer-events-none"
              style={{ willChange: 'transform, opacity' }}
            >
              <motion.div 
                className="w-32 h-32 rounded-full blur-3xl mix-blend-multiply"
                animate={{
                  filter: [
                    "blur(24px) brightness(1)",
                    "blur(20px) brightness(1.2)", 
                    "blur(16px) brightness(1.5)",
                    "blur(12px) brightness(2)"
                  ]
                }}
                transition={{
                  duration: 2,
                  times: [0, 0.6, 0.85, 1],
                  ease: [0.22, 1, 0.36, 1]
                }}
                style={{ 
                  backgroundColor: getRarityOverlayColor(revealedItem.rarity),
                  boxShadow: `0 0 200px 100px ${getRarityOverlayColor(revealedItem.rarity)}`,
                  willChange: 'transform, filter'
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overlay - Fades out when lootbox is selected, fades back in when video ends */}
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: (isVideoPlaying && !hasVideoEnded) ? 0 : 1 }}
          transition={{ duration: hasVideoEnded ? 2 : 1, ease: "easeInOut" }}
          className="fixed inset-0 bg-black/20 z-0"
        />

        {/* Left Panel - Lootbox Navigation */}
        <motion.div 
          initial={{ x: -30, opacity: 0 }}
          animate={{ 
            x: (showLootboxCarousel || (isVideoPlaying && !isClaiming)) ? -400 : 0, 
            opacity: (showLootboxCarousel || (isVideoPlaying && !isClaiming)) ? 0 : 1 
          }}
          transition={{ 
            duration: (showLootboxCarousel || (isVideoPlaying && !isClaiming)) ? 0.5 : 0.3, 
            ease: "easeInOut", 
            delay: (showLootboxCarousel || (isVideoPlaying && !isClaiming)) ? 0 : 0.25 
          }}
          className="fixed left-0 top-0 bottom-0 z-10 flex flex-col justify-center pl-12 space-y-4 w-80"
        >
          {LOOTBOX_NAVIGATION.map((item) => {
            const IconComponent = item.icon;
            return (
              <motion.div 
                key={item.label}
                whileHover={{ x: 16 }}
                transition={{ x: { duration: 0.15, ease: "easeOut" } }}
                className="group relative py-1 cursor-pointer"
              >
                {/* Hyperspeed Animation */}
                <div className="absolute inset-y-0 left-0 w-[100vw] -translate-x-full pointer-events-none">
                  <div className="absolute top-1/2 left-0 w-full h-16 -translate-y-1/2 bg-gradient-to-r from-transparent via-[rgb(163,255,18)]/40 to-transparent blur-sm opacity-0 transition-all duration-75 group-hover:opacity-100" />
                  <div className="absolute top-1/2 left-0 w-full h-24 -translate-y-1/2 bg-gradient-to-r from-transparent via-[rgb(163,255,18)]/20 to-transparent blur-md opacity-0 transition-all duration-75 group-hover:opacity-100" />
                  <div className="absolute top-1/2 left-0 w-full h-1 -translate-y-1/2 bg-gradient-to-r from-transparent via-white/80 to-transparent blur-sm opacity-0 transition-all duration-75 group-hover:opacity-100" />
                </div>
                
                {/* Link Content */}
                <div className="relative z-10">
                  <div className="flex items-center gap-3">
                    <IconComponent className="w-6 h-6 text-[rgb(163,255,18)] transition-all duration-300 group-hover:text-white" />
                    <h3 className="text-2xl font-black tracking-wider transition-all duration-300 text-white group-hover:text-[rgb(163,255,18)]">
                      {item.label}
                    </h3>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Right Panel - Lootbox Cards */}
        <motion.div 
          initial={{ x: 30, opacity: 0 }}
          animate={{ 
            x: (showLootboxCarousel || (isVideoPlaying && !isClaiming)) ? 400 : 0, 
            opacity: (showLootboxCarousel || (isVideoPlaying && !isClaiming)) ? 0 : 1 
          }}
          transition={{ 
            duration: (showLootboxCarousel || (isVideoPlaying && !isClaiming)) ? 0.5 : 0.3, 
            ease: "easeInOut", 
            delay: (showLootboxCarousel || (isVideoPlaying && !isClaiming)) ? 0 : 0.25 
          }}
          className="fixed right-0 top-0 bottom-0 z-10 flex flex-col justify-center pr-12 space-y-4 w-160"
        >
    
          {LOOTBOX_BANNERS.map((banner) => (
                  <GameCommandCard 
                  key={banner.id} 
  option={{
    id: banner.id,
    title: banner.title,
    description: banner.description,
    image: banner.image,
    category: banner.category,
    accentColor: banner.accentColor
  }}
  corner="topRight"
  onClick={() => router.push(`/lootboxes/${banner.id}`)}
/>
          ))}
        </motion.div>

        {/* Revealed Item Image - Center */}
        <AnimatePresence>
          {showRevealImage && revealedItem && (
            <motion.div
              initial={{ scale: 0, opacity: 0, rotate: -10 }}
              animate={isClaiming ? {
                y: [-20, -50, 300],
                opacity: [1, 1, 0],
                scale: [1.1, 1.05, 0.8],
                rotate: [0, 5, 0]
              } : { 
                scale: 1.1, 
                opacity: 1,
                rotate: 0
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={isClaiming ? {
                duration: 1,
                times: [0, 0.3, 1],
                ease: [0.25, 0.46, 0.45, 0.94]
              } : {
                duration: 0.6,
                ease: "easeOut"
              }}
              onAnimationComplete={() => {
                if (!isClaiming && showRevealImage) {
                  // Show claim button after image animation completes
                  setTimeout(() => setShowClaimButton(true), 200);
                }
              }}
              className="fixed inset-0 z-30 flex items-center justify-center pointer-events-none"
              style={{ willChange: 'transform, opacity' }}
            >
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-[rgba(255, 180, 18, 1)]/20 to-white/20 rounded-3xl blur-xl scale-150" />
                
                {/* Main image container */}
                <div className="relative w-80 h-80 rounded-full overflow-hidden border-4 border-[rgba(255, 212, 18, 1)] shadow-2xl shadow-[rgba(255, 188, 18, 1)]/30">
                  <Image
                    src={revealedItem.image}
                    alt={revealedItem.name}
                    fill
                    className="object-cover"
                  />
                  
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Item info */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge className={`text-sm px-3 py-1 ${getRarityColor(revealedItem.rarity)}`}>
                          {revealedItem.rarity}
                        </Badge>
                        <span className="text-[rgb(163,255,18)] font-bold text-lg">
                          {revealedItem.price}
                        </span>
                      </div>
                      <h3 className="text-white text-2xl font-black">
                        {revealedItem.name}
                      </h3>
                    </div>
                  </div>
                </div>
                
                {/* Sparkle effects */}
                <div className="absolute -top-4 -left-4">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.5, 1],
                      opacity: [0.7, 1, 0.7]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="w-8 h-8 bg-[rgb(163,255,18)] rounded-full blur-sm"
                  />
                </div>
                <div className="absolute -bottom-6 -right-6">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.3, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ 
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.5
                    }}
                    className="w-6 h-6 bg-white rounded-full blur-sm"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Claim Button */}
        <AnimatePresence>
          {showClaimButton && !isClaiming && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
            >
              <div className="mt-80 pointer-events-auto">
                <Button
                  onClick={handleClaim}
                  className="bg-[rgb(163,255,18)] hover:bg-[rgb(163,255,18)]/90 text-black font-black text-lg px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  CLAIM
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lootbox Button - Bottom Middle */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: showLootboxCarousel ? 0 : 1, 
            y: showLootboxCarousel ? 20 : 0
          }}
          transition={{ delay: showLootboxCarousel ? 0 : 0.8, duration: 0.4 }}
          whileHover={{ y: -4, scale: 1.05 }}
          whileTap={{ y: -2, scale: 0.98 }}
          onClick={() => setShowLootboxCarousel(true)}
          className="fixed bottom-0 left-[50%] -translate-x-1/2 z-20 px-6 py-3 bg-black/20 backdrop-blur-sm rounded-t-2xl border border-white/10 border-b-0 text-white hover:border-[rgb(163,255,18)]/40 hover:bg-[rgb(163,255,18)]/10 transition-all duration-300 group shadow-lg"
          title="View Lootboxes"
          style={{ pointerEvents: showLootboxCarousel ? 'none' : 'auto' }}
        >
          <div className="flex items-center gap-3">
            <Gift className="w-5 h-5 group-hover:text-[rgb(163,255,18)] transition-colors duration-300" />
            <span className="text-sm font-semibold tracking-wide group-hover:text-[rgb(163,255,18)] transition-colors duration-300">
              LOOTBOXES
            </span>
            <div className="flex gap-1 ml-2">
              <div className="w-2 h-2 bg-white/30 rounded-full group-hover:bg-[rgb(163,255,18)]/60 transition-colors duration-300" />
              <div className="w-2 h-2 bg-white/30 rounded-full group-hover:bg-[rgb(163,255,18)]/60 transition-colors duration-300" />
              <div className="w-2 h-2 bg-white/30 rounded-full group-hover:bg-[rgb(163,255,18)]/60 transition-colors duration-300" />
            </div>
          </div>
        </motion.button>

        {/* Lootbox Carousel */}
        <AnimatePresence>
          {showLootboxCarousel && (
            <>
              {/* Overlay */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                onClick={() => setShowLootboxCarousel(false)}
              />
              
              {/* Carousel */}
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ 
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                  mass: 0.8
                }}
                className="fixed bottom-0 left-0 right-0 z-50"
              >
                <motion.div className="rounded-t-2xl rounded-b-none border-0 bg-gradient-to-b from-black/95 to-black backdrop-blur-2xl">
                  <div className="px-6 pb-12 pt-8">
                    {/* Close Button */}
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Gift className="w-6 h-6 text-[rgb(163,255,18)]" />
                        My Lootbox Collection
                      </h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowLootboxCarousel(false)}
                        className="text-white/70 hover:text-white"
                      >
                        <X className="w-6 h-6" />
                      </Button>
                    </div>

                    {/* Lootbox Grid */}
                    <div className="flex justify-center gap-4 overflow-x-auto pb-4">
                      {LOOTBOX_OPTIONS.map((lootbox, index) => (
                        <motion.div
                          key={lootbox.id}
                          initial={{ opacity: 0, y: 20, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ 
                            delay: 0.1 + index * 0.05,
                            duration: 0.4,
                            type: "spring",
                            stiffness: 260,
                            damping: 20
                          }}
                        >
                          <motion.div 
                            className={`relative group cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-2 ${
                              selectedLootbox === lootbox.id 
                                ? 'ring-2 ring-[rgb(163,255,18)] ring-offset-2 ring-offset-black' 
                                : 'hover:ring-2 hover:ring-white/20 hover:ring-offset-2 hover:ring-offset-black'
                            }`}
                            onClick={() => handleLootboxSelect(lootbox.id)}
                          >
                            <div className="relative w-48 h-64">
                              {/* Background Gradient */}
                              <div className={`absolute inset-0 bg-gradient-to-br ${lootbox.color} opacity-20`} />
                              
                              {/* Lootbox Image */}
                              <div className="relative w-full h-32 mb-3">
                                <Image
                                  src={lootbox.image}
                                  alt={lootbox.name}
                                  fill
                                  className="object-cover rounded-t-lg"
                                />
                                {/* Owned Count Badge */}
                                {lootbox.owned > 0 && (
                                  <div className="absolute top-2 right-2 bg-[rgb(163,255,18)] text-black text-xs font-bold px-2 py-1 rounded-full">
                                    {lootbox.owned}
                                  </div>
                                )}
                              </div>
                              
                              {/* Content */}
                              <div className="p-4 space-y-3">
                                <div>
                                  <h4 className="text-white font-bold text-sm mb-1">{lootbox.name}</h4>
                                  <Badge className={`text-xs px-2 py-1 ${getRarityColor(lootbox.rarity)}`}>
                                    {lootbox.rarity}
                                  </Badge>
                                </div>
                                
                                <div className="text-xs text-white/70">
                                  <p className="mb-1">Contains:</p>
                                  <ul className="space-y-1">
                                    {lootbox.rewards.slice(0, 2).map((reward, idx) => (
                                      <li key={idx}>• {reward}</li>
                                    ))}
                                    {lootbox.rewards.length > 2 && (
                                      <li>• +{lootbox.rewards.length - 2} more...</li>
                                    )}
                                  </ul>
                                </div>
                                
                                <div className="pt-2 border-t border-white/10">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[rgb(163,255,18)] font-bold text-sm">{lootbox.price}</span>
                                    <div className="flex gap-1">
                                      <Button 
                                        size="sm" 
                                        className="bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleLootboxSelect(lootbox.id);
                                        }}
                                      >
                                        Open
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Navigation Hint */}
                    <div className="text-center mt-6">
                      <p className="text-white/50 text-sm">Click any lootbox to open and reveal your rewards</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
  );
}