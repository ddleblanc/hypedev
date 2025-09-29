"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Play, Pause, Volume2, VolumeX, Share2, Heart, Plus, Star, TrendingUp,
  Users, Eye, ShoppingCart, Zap, Crown, ChevronDown, ChevronUp, Search,
  Filter, Grid3x3, List, MoreHorizontal, ArrowLeft, Sparkles, Activity,
  X, ExternalLink, Copy, Check, SlidersHorizontal, Info, Shield, Clock,
  Award, Wallet, BarChart3, PieChart, Globe, Twitter, Send, Calendar,
  AlertCircle, ArrowUpRight, ArrowDownRight, Flame, Diamond, Target,
  Coins, DollarSign, Percent, Hash, RefreshCw, Bell, Settings, Verified,
  Bookmark, Download, Upload, Image, Layers, Box, Gauge, TrendingDown,
  Link2, Flag, MessageCircle, ThumbsUp, CheckCircle2, Timer, Gift, Rocket,
  Gamepad2, Minus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MediaRenderer } from "@/components/MediaRenderer";
import { cn } from "@/lib/utils";

interface LaunchpadProjectDetailProps {
  projectId: string;
}

// Mock project data for launchpad
const mockProject = {
  id: "cyber-warriors-genesis",
  title: "Cyber Warriors Genesis",
  subtitle: "Elite cyberpunk warriors collection",
  description: "Join the ranks of elite cyber-enhanced warriors in the dystopian future of Neo Tokyo.",
  longDescription: "Cyber Warriors Genesis is a collection of 10,000 unique cyberpunk warriors, each with hand-crafted traits and backstories. Set in the neon-lit streets of Neo Tokyo 2087, these warriors represent the pinnacle of cybernetic enhancement and martial arts mastery. Holders gain access to exclusive gameplay, community events, and future drops in the Cyber Warriors universe.",

  // Media
  heroVideo: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/9c5398c1-dcde-4d7c-ac6a-33fa6ff5d948/transcode=true,width=450,optimized=true/0e178c0604244fb9a44d5b87c6b2a815.webm",
  bannerImage: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/9c5398c1-dcde-4d7c-ac6a-33fa6ff5d948/original=true,quality=90/cyber-warriors-banner.jpg",
  logo: "/api/placeholder/120/120",

  // Launch Details
  mintPrice: "0.08",
  maxSupply: 10000,
  mintedCount: 3547,
  launchDate: "2024-02-15T18:00:00Z",
  launchStatus: "live", // upcoming, live, sold-out, ended

  // Mint details
  maxPerWallet: 5,
  whitelistPrice: "0.06",
  publicPrice: "0.08",
  currentPhase: "public", // whitelist, public

  // Creator/Team
  creator: {
    name: "CyberForge Studios",
    address: "0xCreator...5678",
    avatar: "/api/placeholder/80/80",
    verified: true,
    followers: "25.6K",
    description: "Leading Web3 gaming studio creating immersive cyberpunk experiences"
  },

  team: [
    {
      name: "Alex Chen",
      role: "Creative Director",
      avatar: "/api/placeholder/60/60",
      bio: "Former Ubisoft art director with 15+ years in game development"
    },
    {
      name: "Maya Rodriguez",
      role: "Lead Developer",
      avatar: "/api/placeholder/60/60",
      bio: "Blockchain engineer who built DeFi protocols for major exchanges"
    },
    {
      name: "Kai Nakamura",
      role: "Community Lead",
      avatar: "/api/placeholder/60/60",
      bio: "Community growth expert who scaled Discord servers to 100K+ members"
    }
  ],

  // Roadmap
  roadmap: [
    {
      phase: "Phase 1",
      title: "Genesis Launch",
      status: "completed",
      items: [
        "10,000 unique Cyber Warriors",
        "Community Discord launch",
        "Staking mechanism release",
        "First community event"
      ]
    },
    {
      phase: "Phase 2",
      title: "Game Alpha",
      status: "in-progress",
      items: [
        "3D battle arena game alpha",
        "PvP tournaments with ETH prizes",
        "Exclusive holder perks",
        "Second collection reveal"
      ]
    },
    {
      phase: "Phase 3",
      title: "Metaverse Integration",
      status: "upcoming",
      items: [
        "Virtual world integration",
        "Cross-game compatibility",
        "DAO governance launch",
        "Brand partnerships"
      ]
    }
  ],

  // Utility & Benefits
  utilities: [
    {
      title: "Game Access",
      description: "Exclusive access to Cyber Warriors battle arena",
      icon: Gamepad2,
      available: true
    },
    {
      title: "Staking Rewards",
      description: "Earn $CYBER tokens by staking your warriors",
      icon: Coins,
      available: true
    },
    {
      title: "Community Events",
      description: "VIP access to community tournaments and events",
      icon: Users,
      available: true
    },
    {
      title: "Future Drops",
      description: "Guaranteed whitelist for future collections",
      icon: Gift,
      available: false
    }
  ],

  // Traits preview
  traits: [
    {
      name: "Background",
      rarity: "Common to Legendary",
      preview: ["Neo Tokyo", "Cyber Grid", "Neon Void", "Digital Matrix"]
    },
    {
      name: "Cybernetics",
      rarity: "Rare to Mythic",
      preview: ["Neural Implant", "Bionic Arms", "Quantum Eyes", "Full Cyborg"]
    },
    {
      name: "Weapons",
      rarity: "Epic to Legendary",
      preview: ["Plasma Katana", "Laser Rifle", "Energy Shield", "Void Cannon"]
    }
  ],

  // Community & Social
  socials: {
    website: "https://cyberwarriors.io",
    twitter: "https://twitter.com/cyberwarriors",
    discord: "https://discord.gg/cyberwarriors",
    instagram: "https://instagram.com/cyberwarriors"
  },

  // Stats
  stats: {
    discordMembers: "45.2K",
    twitterFollowers: "38.9K",
    holders: "7.8K",
    floorPrice: "0.12",
    volume: "2.4K"
  }
};

export function LaunchpadProjectDetail({ projectId }: LaunchpadProjectDetailProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [mintQuantity, setMintQuantity] = useState(1);
  const [isMinting, setIsMinting] = useState(false);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const router = useRouter();
  const heroRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  // Countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const launch = new Date(mockProject.launchDate).getTime();
      const difference = launch - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleMint = async () => {
    setIsMinting(true);
    // Simulate minting process
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsMinting(false);
  };

  const mintProgress = (mockProject.mintedCount / mockProject.maxSupply) * 100;
  const isLive = mockProject.launchStatus === 'live';
  const isSoldOut = mockProject.launchStatus === 'sold-out';
  const isUpcoming = mockProject.launchStatus === 'upcoming';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full min-h-screen bg-black"
    >
      <TooltipProvider>
        {/* Hero Section */}
        <motion.div
          ref={heroRef}
          className="relative h-[70vh] overflow-hidden"
          style={{ scale: heroScale }}
        >
          <div className="absolute inset-0">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              muted={isMuted}
              loop
              playsInline
            >
              <source src={mockProject.heroVideo} type="video/webm" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />
          </div>

          {/* Back Button & Controls */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <Button
              size="icon"
              variant="ghost"
              className="bg-black/40 backdrop-blur text-white hover:bg-black/60"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <div className="flex gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="bg-black/40 backdrop-blur text-white hover:bg-black/60"
                onClick={togglePlayPause}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="bg-black/40 backdrop-blur text-white hover:bg-black/60"
                onClick={toggleMute}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Hero Content */}
          <motion.div
            style={{ opacity: heroOpacity }}
            className="absolute bottom-0 left-0 right-0 p-6 md:p-12"
          >
            {/* Creator Info */}
            <div className="flex items-center gap-3 mb-4">
              <img
                src={mockProject.creator.avatar}
                alt={mockProject.creator.name}
                className="w-12 h-12 rounded-full border-2 border-white/20"
              />
              <div className="flex items-center gap-2">
                <p className="text-white/80">Created by</p>
                <p className="text-white font-bold">{mockProject.creator.name}</p>
                {mockProject.creator.verified && (
                  <Verified className="w-5 h-5 text-blue-400 fill-current" />
                )}
              </div>
            </div>

            {/* Project Title */}
            <h1 className="text-5xl md:text-7xl font-black text-white mb-4">
              {mockProject.title}
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-3xl">
              {mockProject.description}
            </p>

            {/* Launch Status & Quick Info */}
            <div className="flex flex-wrap items-center gap-6 mb-8">
              {/* Status Badge */}
              <div>
                <Badge className={cn(
                  "text-sm px-4 py-2 font-bold",
                  isLive ? "bg-[rgb(163,255,18)] text-black" :
                  isSoldOut ? "bg-red-500 text-white" :
                  isUpcoming ? "bg-orange-500 text-white" :
                  "bg-gray-500 text-white"
                )}>
                  {isLive ? (
                    <>
                      <Rocket className="w-4 h-4 mr-1" />
                      Live Now
                    </>
                  ) : isSoldOut ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Sold Out
                    </>
                  ) : isUpcoming ? (
                    <>
                      <Timer className="w-4 h-4 mr-1" />
                      Launching Soon
                    </>
                  ) : (
                    "Ended"
                  )}
                </Badge>
              </div>

              <Separator orientation="vertical" className="h-12 bg-white/20" />

              {/* Mint Price */}
              <div>
                <p className="text-sm text-white/60">Mint Price</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-[rgb(163,255,18)]">
                    {mockProject.mintPrice} ETH
                  </p>
                  <p className="text-sm text-white/60">per NFT</p>
                </div>
              </div>

              <Separator orientation="vertical" className="h-12 bg-white/20" />

              {/* Supply */}
              <div>
                <p className="text-sm text-white/60">Supply</p>
                <p className="text-2xl font-bold text-white">
                  {mockProject.maxSupply.toLocaleString()}
                </p>
              </div>

              <Separator orientation="vertical" className="h-12 bg-white/20" />

              {/* Minted */}
              <div>
                <p className="text-sm text-white/60">Minted</p>
                <p className="text-2xl font-bold text-white">
                  {mockProject.mintedCount.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4">
              <Button
                size="lg"
                className="bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90 font-bold px-8"
                disabled={!isLive || isSoldOut}
              >
                {isSoldOut ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Sold Out
                  </>
                ) : isLive ? (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Mint Now
                  </>
                ) : (
                  <>
                    <Timer className="w-5 h-5 mr-2" />
                    Coming Soon
                  </>
                )}
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
                onClick={() => setIsWatchlisted(!isWatchlisted)}
              >
                {isWatchlisted ? (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Watching
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 mr-2" />
                    Add to Watchlist
                  </>
                )}
              </Button>

              <Button
                size="lg"
                variant="ghost"
                className="text-white hover:bg-white/10"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Share
              </Button>

              {/* Social Links */}
              <div className="flex items-center gap-2 ml-auto">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost" className="text-white hover:bg-white/10">
                      <Globe className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Website</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost" className="text-white hover:bg-white/10">
                      <Twitter className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Twitter</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost" className="text-white hover:bg-white/10">
                      <MessageCircle className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Discord</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Main Content */}
        <div className="relative bg-black">
          {/* Mint Progress Bar */}
          <div className="bg-black/95 backdrop-blur-lg border-b border-white/10 p-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-white font-bold text-lg">
                    {mockProject.mintedCount.toLocaleString()} / {mockProject.maxSupply.toLocaleString()} minted
                  </p>
                  <p className="text-white/60 text-sm">{mintProgress.toFixed(1)}% complete</p>
                </div>
                {isUpcoming && (
                  <div className="text-right">
                    <p className="text-white/60 text-sm mb-1">Launches in:</p>
                    <div className="flex items-center gap-2 text-[rgb(163,255,18)] font-bold">
                      <span>{timeLeft.days}d</span>
                      <span>{timeLeft.hours}h</span>
                      <span>{timeLeft.minutes}m</span>
                      <span>{timeLeft.seconds}s</span>
                    </div>
                  </div>
                )}
              </div>
              <Progress value={mintProgress} className="w-full h-3 bg-white/10" />
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="sticky top-16 z-20 bg-black/95 backdrop-blur-lg border-b border-white/10">
            <div className="px-4 md:px-6 max-w-7xl mx-auto">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-transparent border-0 h-auto p-0 w-full justify-start overflow-x-auto">
                  <TabsTrigger
                    value="overview"
                    className="text-white/60 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-[rgb(163,255,18)] rounded-none px-6 py-4"
                  >
                    <Info className="w-4 h-4 mr-2" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="mint"
                    className="text-white/60 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-[rgb(163,255,18)] rounded-none px-6 py-4"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Mint
                  </TabsTrigger>
                  <TabsTrigger
                    value="roadmap"
                    className="text-white/60 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-[rgb(163,255,18)] rounded-none px-6 py-4"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Roadmap
                  </TabsTrigger>
                  <TabsTrigger
                    value="team"
                    className="text-white/60 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-[rgb(163,255,18)] rounded-none px-6 py-4"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Team
                  </TabsTrigger>
                </TabsList>

                {/* Tab Contents */}
                <div className="py-8">
                  {/* Overview Tab */}
                  <TabsContent value="overview" className="mt-0 space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Main Content */}
                      <div className="lg:col-span-2 space-y-8">
                        {/* About Project */}
                        <Card className="bg-black/40 border-white/10">
                          <CardHeader>
                            <CardTitle className="text-white">About {mockProject.title}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-white/80 leading-relaxed mb-6">
                              {mockProject.longDescription}
                            </p>

                            {/* Key Features */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {mockProject.utilities.map((utility, index) => (
                                <div key={index} className="flex items-start gap-3 p-4 bg-black/40 rounded-lg">
                                  <div className={cn(
                                    "p-2 rounded-lg",
                                    utility.available ? "bg-[rgb(163,255,18)]/20" : "bg-gray-500/20"
                                  )}>
                                    <utility.icon className={cn(
                                      "w-5 h-5",
                                      utility.available ? "text-[rgb(163,255,18)]" : "text-gray-400"
                                    )} />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="text-white font-medium mb-1">{utility.title}</h4>
                                    <p className="text-white/60 text-sm">{utility.description}</p>
                                    {!utility.available && (
                                      <Badge className="mt-2 bg-gray-500/20 text-gray-400 text-xs">
                                        Coming Soon
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>

                        {/* Traits Preview */}
                        <Card className="bg-black/40 border-white/10">
                          <CardHeader>
                            <CardTitle className="text-white">Traits & Rarity</CardTitle>
                            <CardDescription className="text-white/60">
                              Preview of trait categories and rarities
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-6">
                              {mockProject.traits.map((trait, index) => (
                                <div key={index}>
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-white font-medium">{trait.name}</h4>
                                    <Badge className="bg-white/10 text-white/80 text-xs">
                                      {trait.rarity}
                                    </Badge>
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {trait.preview.map((item, idx) => (
                                      <div key={idx} className="p-2 bg-black/40 rounded-lg text-center">
                                        <p className="text-white/80 text-sm">{item}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Sidebar */}
                      <div className="space-y-6">
                        {/* Quick Stats */}
                        <Card className="bg-black/40 border-white/10">
                          <CardHeader>
                            <CardTitle className="text-white">Project Stats</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex justify-between">
                              <span className="text-white/60">Discord Members</span>
                              <span className="text-white font-bold">{mockProject.stats.discordMembers}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/60">Twitter Followers</span>
                              <span className="text-white font-bold">{mockProject.stats.twitterFollowers}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/60">Current Holders</span>
                              <span className="text-white font-bold">{mockProject.stats.holders}</span>
                            </div>
                            <Separator className="bg-white/10" />
                            <div className="flex justify-between">
                              <span className="text-white/60">Floor Price</span>
                              <span className="text-[rgb(163,255,18)] font-bold">{mockProject.stats.floorPrice} ETH</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/60">Total Volume</span>
                              <span className="text-white font-bold">{mockProject.stats.volume} ETH</span>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Launch Details */}
                        <Card className="bg-black/40 border-white/10">
                          <CardHeader>
                            <CardTitle className="text-white">Launch Details</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex justify-between">
                              <span className="text-white/60">Launch Date</span>
                              <span className="text-white font-bold">
                                {new Date(mockProject.launchDate).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/60">Max per Wallet</span>
                              <span className="text-white font-bold">{mockProject.maxPerWallet}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/60">Whitelist Price</span>
                              <span className="text-white font-bold">{mockProject.whitelistPrice} ETH</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/60">Public Price</span>
                              <span className="text-white font-bold">{mockProject.publicPrice} ETH</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/60">Current Phase</span>
                              <Badge className="bg-[rgb(163,255,18)]/20 text-[rgb(163,255,18)] capitalize">
                                {mockProject.currentPhase}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Mint Tab */}
                  <TabsContent value="mint" className="mt-0">
                    <div className="max-w-2xl mx-auto">
                      <Card className="bg-black/40 border-white/10">
                        <CardHeader className="text-center">
                          <CardTitle className="text-white text-2xl">Mint Your Cyber Warriors</CardTitle>
                          <CardDescription className="text-white/60">
                            Join the elite ranks of cyber-enhanced warriors
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {/* Quantity Selector */}
                          <div className="text-center">
                            <p className="text-white/60 mb-3">Quantity (max {mockProject.maxPerWallet})</p>
                            <div className="flex items-center justify-center gap-4">
                              <Button
                                size="icon"
                                variant="outline"
                                className="border-white/20 text-white hover:bg-white/10"
                                onClick={() => setMintQuantity(Math.max(1, mintQuantity - 1))}
                                disabled={mintQuantity <= 1}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <span className="text-3xl font-bold text-white w-16 text-center">
                                {mintQuantity}
                              </span>
                              <Button
                                size="icon"
                                variant="outline"
                                className="border-white/20 text-white hover:bg-white/10"
                                onClick={() => setMintQuantity(Math.min(mockProject.maxPerWallet, mintQuantity + 1))}
                                disabled={mintQuantity >= mockProject.maxPerWallet}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Total Cost */}
                          <div className="bg-black/40 rounded-lg p-4 text-center">
                            <p className="text-white/60 mb-1">Total Cost</p>
                            <p className="text-3xl font-bold text-[rgb(163,255,18)]">
                              {(parseFloat(mockProject.mintPrice) * mintQuantity).toFixed(3)} ETH
                            </p>
                            <p className="text-white/60 text-sm">
                              ≈ ${((parseFloat(mockProject.mintPrice) * mintQuantity) * 1800).toFixed(2)} USD
                            </p>
                          </div>

                          {/* Mint Button */}
                          <Button
                            className="w-full bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90 font-bold py-4 text-lg"
                            disabled={!isLive || isSoldOut || isMinting}
                            onClick={handleMint}
                          >
                            {isMinting ? (
                              <>
                                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                Minting...
                              </>
                            ) : isSoldOut ? (
                              <>
                                <CheckCircle2 className="w-5 h-5 mr-2" />
                                Sold Out
                              </>
                            ) : isLive ? (
                              <>
                                <Zap className="w-5 h-5 mr-2" />
                                Mint {mintQuantity} NFT{mintQuantity > 1 ? 's' : ''}
                              </>
                            ) : (
                              <>
                                <Timer className="w-5 h-5 mr-2" />
                                Not Live Yet
                              </>
                            )}
                          </Button>

                          {/* Mint Info */}
                          <div className="text-center text-sm text-white/60">
                            <p>Gas fees not included. Transaction may take a few minutes.</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Roadmap Tab */}
                  <TabsContent value="roadmap" className="mt-0">
                    <div className="max-w-4xl mx-auto">
                      <div className="space-y-8">
                        {mockProject.roadmap.map((phase, index) => (
                          <Card key={index} className="bg-black/40 border-white/10">
                            <CardContent className="p-6">
                              <div className="flex items-start gap-6">
                                <div className={cn(
                                  "flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center",
                                  phase.status === 'completed' ? "bg-green-500/20 border-2 border-green-500" :
                                  phase.status === 'in-progress' ? "bg-[rgb(163,255,18)]/20 border-2 border-[rgb(163,255,18)]" :
                                  "bg-gray-500/20 border-2 border-gray-500"
                                )}>
                                  {phase.status === 'completed' ? (
                                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                                  ) : phase.status === 'in-progress' ? (
                                    <RefreshCw className="w-8 h-8 text-[rgb(163,255,18)] animate-pulse" />
                                  ) : (
                                    <Clock className="w-8 h-8 text-gray-500" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-3">
                                    <h3 className="text-xl font-bold text-white">{phase.phase}</h3>
                                    <Badge className={cn(
                                      "text-xs",
                                      phase.status === 'completed' ? "bg-green-500/20 text-green-400" :
                                      phase.status === 'in-progress' ? "bg-[rgb(163,255,18)]/20 text-[rgb(163,255,18)]" :
                                      "bg-gray-500/20 text-gray-400"
                                    )}>
                                      {phase.status === 'completed' ? 'Completed' :
                                       phase.status === 'in-progress' ? 'In Progress' :
                                       'Upcoming'}
                                    </Badge>
                                  </div>
                                  <h4 className="text-lg text-white/80 mb-4">{phase.title}</h4>
                                  <ul className="space-y-2">
                                    {phase.items.map((item, idx) => (
                                      <li key={idx} className="flex items-center gap-2 text-white/60">
                                        <CheckCircle2 className={cn(
                                          "w-4 h-4 flex-shrink-0",
                                          phase.status === 'completed' ? "text-green-500" : "text-gray-500"
                                        )} />
                                        {item}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Team Tab */}
                  <TabsContent value="team" className="mt-0">
                    <div className="max-w-4xl mx-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {mockProject.team.map((member, index) => (
                          <Card key={index} className="bg-black/40 border-white/10">
                            <CardContent className="p-6 text-center">
                              <img
                                src={member.avatar}
                                alt={member.name}
                                className="w-20 h-20 rounded-full mx-auto mb-4 border-2 border-white/20"
                              />
                              <h3 className="text-white font-bold text-lg mb-1">{member.name}</h3>
                              <p className="text-[rgb(163,255,18)] font-medium mb-3">{member.role}</p>
                              <p className="text-white/60 text-sm">{member.bio}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>
        </div>
      </TooltipProvider>
    </motion.div>
  );
}