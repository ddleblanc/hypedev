"use client";

import React, { useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { 
  Play,
  Info,
  Plus,
  Star,
  Volume2,
  VolumeX,
  ArrowLeft,
  Shield,
  Sword,
  Crown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Lootbox data structure - in real app this would come from API/database
const LOOTBOX_DATA = {
  "1": {
    id: "1",
    title: "Warrior's Arsenal",
    subtitle: "Elite combat gear for legendary warriors",
    description: "The Warrior's Arsenal is a premium lootbox containing some of the most sought-after combat equipment in the realm. Each box guarantees at least one rare weapon and includes chances for legendary and mythic tier items that can turn the tide of any battle.",
    heroMedia: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/1ad84358-5802-4eae-b74b-f6c880d38ea5/transcode=true,original=true,quality=90/vid_00005.webm",
    category: "Epic",
    accentColor: "purple",
    price: "0.25 ETH",
    totalSupply: 10000,
    remaining: 6579,
    rarity: "Epic",
    tags: ["Combat", "Weapons", "Armor"]
  },
  "2": {
    id: "2", 
    title: "Mystic Treasures",
    subtitle: "Magical artifacts from ancient realms",
    description: "Dive into the mystical world of ancient magic with the Mystic Treasures lootbox. Discover powerful spells, enchanted items, and rare magical components that have been lost to time.",
    heroMedia: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/a770baa3-875b-4e1d-9f8f-3a0f533e3f96/transcode=true,original=true,quality=90/Blood%20Moon%20Oni.webm",
    category: "Legendary",
    accentColor: "amber", 
    price: "0.35 ETH",
    totalSupply: 5000,
    remaining: 2900,
    rarity: "Legendary",
    tags: ["Magic", "Spells", "Artifacts"]
  },
  "3": {
    id: "3",
    title: "Cosmic Cache", 
    subtitle: "Treasures from across the universe",
    description: "Explore the vast cosmos with the Cosmic Cache, containing rare stellar artifacts, alien technologies, and cosmic powers that transcend earthly limitations.",
    heroMedia: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/7f64191f-c494-492e-ab3d-21fb88686523/transcode=true,original=true,quality=90/6JRGQ9C6B2HFZJ94J50N42NPJ0.webm?token=CfDJ8IU-uofjHWVPg1_3zdfXdVM1DITXcjK26rTZ_vSgBMON7cn-5Hl4AXjKzNKtDpWgM1vyLFAaaQOTYAXngeNshK2hchUDWACRROB_CMqEUo8WVGj-YwL9zsZzNiUr8P9Qrb2-fYUTWJFR9leN08g5eAEvNhLDPlRIhzJQ_J_OtG1vJHXmtmkbI4U9HzwrEJ_6mIzNxhxK7TdTQv5IdF-d6mRjZhiFfA2G7uXVfu5tTjmRqwan9Rou9I-n4vAonRsTHA.mp4",
    category: "Legendary",
    accentColor: "red",
    price: "0.5 ETH", 
    totalSupply: 3000,
    remaining: 1800,
    rarity: "Legendary",
    tags: ["Cosmic", "Alien", "Technology"]
  }
};

export default function LootboxDetailPage() {
  const router = useRouter();
  const params = useParams();
  const lootboxId = params?.id as string;
  
  const [isMuted, setIsMuted] = useState(true);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  // Get lootbox data
  const lootbox = LOOTBOX_DATA[lootboxId as keyof typeof LOOTBOX_DATA];
  
  // If lootbox not found, show error
  if (!lootbox) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Lootbox Not Found</h1>
          <Button onClick={() => router.push('/lootboxes/reveal')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Lootboxes
          </Button>
        </div>
      </div>
    );
  }

  // Check if hero media is a video
  const isHeroVideo = lootbox.heroMedia.includes('.webm') || lootbox.heroMedia.includes('.mp4');

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Epic': return 'text-purple-400 border-purple-500 bg-purple-500/10';
      case 'Legendary': return 'text-amber-400 border-amber-500 bg-amber-500/10';
      case 'Mythic': return 'text-red-400 border-red-500 bg-red-500/10';
      default: return 'text-white border-white bg-white/10';
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'Epic': return <Sword className="h-4 w-4" />;
      case 'Legendary': return <Crown className="h-4 w-4" />;
      case 'Mythic': return <Shield className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full overflow-hidden bg-black"
    >
      <div className="relative">
        {/* Hero Banner */}
        <motion.div
          ref={heroRef}
          className="relative h-[70vh] md:h-[85vh] overflow-hidden"
          style={{ scale: heroScale }}
        >
          <div className="absolute inset-0">
            {isHeroVideo ? (
              <video
                className="w-full h-full object-cover"
                autoPlay
                muted={isMuted}
                loop
                playsInline
              >
                <source src={lootbox.heroMedia} type={isHeroVideo && lootbox.heroMedia.includes('.webm') ? "video/webm" : "video/mp4"} />
              </video>
            ) : (
              <img
                src={lootbox.heroMedia}
                alt={lootbox.title}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          </div>

          {/* Back Navigation */}
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="absolute top-0 left-0 right-0 z-20 p-4 md:p-8"
          >
            <Button
              variant="ghost"
              onClick={() => router.push('/lootboxes/reveal')}
              className="text-white hover:bg-white/10 flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Lootboxes
            </Button>
          </motion.div>

          {/* Hero Content */}
          <motion.div
            style={{ opacity: heroOpacity }}
            className="absolute bottom-0 left-0 right-0 p-4 md:p-8 pb-12 md:pb-20"
          >
            <div className="max-w-3xl">
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="mb-4 md:mb-6"
              >
                <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-4">
                  <Badge className={`font-semibold px-2 md:px-3 py-1 text-xs md:text-sm ${getRarityColor(lootbox.rarity)} flex items-center gap-1`}>
                    {getRarityIcon(lootbox.rarity)}
                    {lootbox.rarity}
                  </Badge>
                  <span className="text-white/80 text-sm md:text-base">{lootbox.remaining.toLocaleString()} / {lootbox.totalSupply.toLocaleString()} Remaining</span>
                </div>
              </motion.div>

              <motion.h2
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="text-3xl md:text-5xl font-bold text-white mb-3 md:mb-4"
              >
                {lootbox.title}
              </motion.h2>

              <motion.p
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="text-base md:text-xl text-white/90 mb-4 md:mb-6 leading-relaxed"
              >
                {lootbox.description}
              </motion.p>

              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="flex flex-wrap items-center gap-2 md:gap-4"
              >
                <Button 
                  className="bg-white text-black hover:bg-white/90 font-bold px-4 md:px-8 py-2 md:py-3 rounded-lg flex items-center gap-2 text-sm md:text-base"
                >
                  <Play className="h-4 w-4 md:h-5 md:w-5" fill="currentColor" />
                  Open Lootbox
                </Button>
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 font-bold px-4 md:px-8 py-2 md:py-3 rounded-lg flex items-center gap-2 text-sm md:text-base">
                  <Info className="h-4 w-4 md:h-5 md:w-5" />
                  Details
                </Button>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full p-2 md:p-3">
                  <Plus className="h-5 w-5 md:h-6 md:w-6" />
                </Button>
                {isHeroVideo && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-white hover:bg-white/20 rounded-full p-2 md:p-3"
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? <VolumeX className="h-5 w-5 md:h-6 md:w-6" /> : <Volume2 className="h-5 w-5 md:h-6 md:w-6" />}
                  </Button>
                )}
              </motion.div>

              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.8 }}
                className="flex flex-wrap items-center gap-4 md:gap-6 mt-4 md:mt-6 text-white/80"
              >
                <div>
                  <span className="text-xs md:text-sm uppercase tracking-wide text-white/60">Price</span>
                  <p className="text-base md:text-lg font-bold">{lootbox.price}</p>
                </div>
                <div>
                  <span className="text-xs md:text-sm uppercase tracking-wide text-white/60">Category</span>
                  <p className="text-base md:text-lg font-bold">{lootbox.category}</p>
                </div>
                <div>
                  <span className="text-xs md:text-sm uppercase tracking-wide text-white/60">Tags</span>
                  <div className="flex gap-1 mt-1">
                    {lootbox.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs border-white/30 text-white/70">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Additional Content Sections */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="px-4 md:px-8 py-8 md:py-16 bg-black"
        >
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-6">About This Lootbox</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">What's Inside</h4>
                <p className="text-white/70 leading-relaxed">
                  Each {lootbox.title} contains carefully curated items that match the {lootbox.category.toLowerCase()} tier quality. 
                  You're guaranteed to receive valuable items that enhance your gaming experience.
                </p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Collection Stats</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-white/60">Total Supply:</span>
                    <span className="text-white font-medium">{lootbox.totalSupply.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Remaining:</span>
                    <span className="text-white font-medium">{lootbox.remaining.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Opened:</span>
                    <span className="text-white font-medium">{(lootbox.totalSupply - lootbox.remaining).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </motion.div>
  );
}