"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Play,
  Pause,
  Star,
  Users,
  Clock,
  Trophy,
  Zap,
  Heart,
  Share2,
  Download,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Grid,
  List,
  ArrowRight,
  Coins,
  Gift,
  TrendingUp,
  Gamepad2,
  Flame,
  Crown,
  Eye,
  ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MediaRenderer } from "@/components/MediaRenderer";

// Mock data for crypto casual games
const featuredGames = [
  {
    id: 1,
    title: "CryptoFarm Legends",
    subtitle: "BUILD • EARN • TRADE",
    description: "Build your virtual farm, grow rare crops, and trade them as NFTs. Earn $CROP tokens daily!",
    image: "https://picsum.photos/1200/600?random=500",
    logo: "https://picsum.photos/200/200?random=500",
    genre: "Simulation",
    players: "2.1M",
    rating: 4.8,
    tokenRewards: "$CROP",
    dailyRewards: "50-200 $CROP",
    nftDrops: true,
    isNew: false,
    isFree: true,
    status: "live"
  },
  {
    id: 2,
    title: "Pixel Kingdom Rush",
    subtitle: "DEFEND • COLLECT • UPGRADE",
    description: "Tower defense meets NFT collecting. Defend your kingdom with unique hero NFTs and earn rewards!",
    image: "https://picsum.photos/1200/600?random=501",
    logo: "https://picsum.photos/200/200?random=501",
    genre: "Strategy", 
    players: "1.8M",
    rating: 4.9,
    tokenRewards: "$PIXEL",
    dailyRewards: "75-300 $PIXEL",
    nftDrops: true,
    isNew: true,
    isFree: true,
    status: "live"
  },
  {
    id: 3,
    title: "Crypto Puzzle Masters",
    subtitle: "SOLVE • MINT • COLLECT",
    description: "Solve puzzles to unlock rare NFT art pieces. The harder the puzzle, the rarer the reward!",
    image: "https://picsum.photos/1200/600?random=502", 
    logo: "https://picsum.photos/200/200?random=502",
    genre: "Puzzle",
    players: "950K",
    rating: 4.7,
    tokenRewards: "$BRAIN",
    dailyRewards: "25-150 $BRAIN",
    nftDrops: true,
    isNew: false,
    isFree: true,
    status: "live"
  }
];

const gameCategories = [
  { id: "all", name: "All Games", icon: Gamepad2, count: "150+", active: true },
  { id: "simulation", name: "Simulation", icon: Users, count: "45" },
  { id: "puzzle", name: "Puzzle", icon: Zap, count: "32" },
  { id: "strategy", name: "Strategy", icon: Trophy, count: "28" },
  { id: "idle", name: "Idle & Clicker", icon: Clock, count: "25" },
  { id: "card", name: "Card Games", icon: Star, count: "20" }
];

const trendingGames = [
  {
    id: 4,
    title: "DeFi Tycoon",
    genre: "Simulation",
    image: "https://picsum.photos/300/400?random=510",
    players: "1.2M",
    rating: 4.6,
    tokenRewards: "$DEFI",
    dailyEarnings: "100-500 $DEFI",
    isNew: false,
    isFree: true,
    trending: true
  },
  {
    id: 5,
    title: "Crypto Cats Cafe",
    genre: "Casual",
    image: "https://picsum.photos/300/400?random=511", 
    players: "850K",
    rating: 4.8,
    tokenRewards: "$MEOW",
    dailyEarnings: "50-250 $MEOW",
    isNew: true,
    isFree: true,
    trending: true
  },
  {
    id: 6,
    title: "Blockchain Bingo",
    genre: "Casino",
    image: "https://picsum.photos/300/400?random=512",
    players: "1.5M", 
    rating: 4.5,
    tokenRewards: "$BINGO",
    dailyEarnings: "75-400 $BINGO",
    isNew: false,
    isFree: true,
    trending: true
  },
  {
    id: 7,
    title: "NFT Garden Party",
    genre: "Social",
    image: "https://picsum.photos/300/400?random=513",
    players: "2.1M",
    rating: 4.9,
    tokenRewards: "$GARDEN",
    dailyEarnings: "125-600 $GARDEN",
    isNew: false,
    isFree: true,
    trending: true
  }
];

const newReleases = [
  {
    id: 8,
    title: "Quantum Chess Masters",
    genre: "Strategy",
    image: "https://picsum.photos/400/300?random=520",
    logo: "https://picsum.photos/100/100?random=520",
    description: "Chess meets quantum mechanics in this mind-bending strategy game.",
    players: "125K",
    rating: 4.4,
    tokenRewards: "$QUANTUM",
    releaseDate: "2024-08-20",
    isNew: true,
    isFree: true
  },
  {
    id: 9,
    title: "Crypto Cooking Championship",
    genre: "Simulation",
    image: "https://picsum.photos/400/300?random=521",
    logo: "https://picsum.photos/100/100?random=521",
    description: "Cook your way to the top and earn delicious crypto rewards!",
    players: "89K",
    rating: 4.7,
    tokenRewards: "$CHEF", 
    releaseDate: "2024-08-18",
    isNew: true,
    isFree: true
  },
  {
    id: 10,
    title: "Metaverse Mini Golf",
    genre: "Sports",
    image: "https://picsum.photos/400/300?random=522",
    logo: "https://picsum.photos/100/100?random=522", 
    description: "Play mini golf in stunning metaverse environments.",
    players: "67K",
    rating: 4.6,
    tokenRewards: "$GOLF",
    releaseDate: "2024-08-15",
    isNew: true,
    isFree: true
  }
];

const userLibrary = [
  {
    id: 1,
    title: "CryptoFarm Legends",
    lastPlayed: "2 hours ago",
    playtime: "127.5 hrs",
    progress: 78,
    image: "https://picsum.photos/200/300?random=530",
    achievements: 24,
    tokensEarned: "12,450 $CROP"
  },
  {
    id: 6,
    title: "Blockchain Bingo", 
    lastPlayed: "Yesterday",
    playtime: "45.2 hrs",
    progress: 45,
    image: "https://picsum.photos/200/300?random=531",
    achievements: 12,
    tokensEarned: "8,750 $BINGO"
  }
];

type CasualGamesViewProps = {
  onBack: () => void;
};

export function CasualGamesView({ onBack }: CasualGamesViewProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewType, setViewType] = useState<"grid" | "list">("grid");
  const [currentFeaturedIndex, setCurrentFeaturedIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [scrollY, setScrollY] = useState(0);
  
  const trendingSliderRef = useRef<HTMLDivElement>(null);
  const newReleasesSliderRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Track scroll for header effects
  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        setScrollY(scrollContainerRef.current.scrollTop);
      }
    };

    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Auto-rotate featured games
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentFeaturedIndex((prev) => (prev + 1) % featuredGames.length);
    }, 6000);
    
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Slider navigation
  const slideLeft = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      ref.current.scrollBy({ left: -400, behavior: 'smooth' });
    }
  };

  const slideRight = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      ref.current.scrollBy({ left: 400, behavior: 'smooth' });
    }
  };

  const hasScrolled = scrollY > 50;

  return (
    <div className="fixed inset-0 z-10 overflow-hidden">

      <div className={`absolute top-16 left-0 right-0 h-8 transition-opacity duration-300 pointer-events-none z-10 ${
        hasScrolled ? 'opacity-100 bg-gradient-to-b from-black/40 to-transparent' : 'opacity-0'
      }`} />

      {/* Main Content */}
      <div 
        ref={scrollContainerRef}
        className="absolute inset-0 overflow-y-auto scrollbar-hide"
      >
        <div className="w-full">

        {/* Hero Featured Games */}
        <section className="relative h-[832px] overflow-hidden bg-black">
          <div className="h-full overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentFeaturedIndex}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 1, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <MediaRenderer
                src={featuredGames[currentFeaturedIndex].image}
                alt={featuredGames[currentFeaturedIndex].title}
                className="w-full h-full object-cover"
                aspectRatio="auto"
              />
              
              {/* Gradient Overlays */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/70 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
              
              {/* Game Content */}
              <div className="absolute inset-0 flex items-center pt-36">
                <div className="px-16 max-w-5xl">
                  {/* Game Logo */}
                  <div className="mb-6">
                    <MediaRenderer
                      src={featuredGames[currentFeaturedIndex].logo}
                      alt={`${featuredGames[currentFeaturedIndex].title} logo`}
                      className="w-24 h-24 rounded-2xl border border-white/20"
                      aspectRatio="square"
                    />
                  </div>
                  
                  <div className="flex items-center gap-3 mb-4">
                    <Badge className="bg-[rgb(163,255,18)] text-black font-bold">
                      <Gamepad2 className="w-4 h-4 mr-2" />
                      FEATURED GAME
                    </Badge>
                    {featuredGames[currentFeaturedIndex].isNew && (
                      <Badge className="bg-orange-500 text-white font-bold">
                        <Flame className="w-3 h-3 mr-1" />
                        NEW
                      </Badge>
                    )}
                    {featuredGames[currentFeaturedIndex].isFree && (
                      <Badge className="bg-blue-500 text-white font-bold">FREE</Badge>
                    )}
                  </div>
                  
                  <h1 className="text-7xl font-black text-white mb-3">
                    {featuredGames[currentFeaturedIndex].title}
                  </h1>
                  
                  <p className="text-2xl text-[rgb(163,255,18)] font-bold mb-6 tracking-wide">
                    {featuredGames[currentFeaturedIndex].subtitle}
                  </p>
                  
                  <p className="text-xl text-white/90 max-w-2xl mb-8 leading-relaxed">
                    {featuredGames[currentFeaturedIndex].description}
                  </p>
                  
                  {/* Game Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-white/70" />
                        <span className="text-white/70 text-sm">Players</span>
                      </div>
                      <div className="text-xl font-bold text-white">
                        {featuredGames[currentFeaturedIndex].players}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Star className="w-4 h-4 text-yellow-400" />
                        <span className="text-white/70 text-sm">Rating</span>
                      </div>
                      <div className="text-xl font-bold text-white">
                        {featuredGames[currentFeaturedIndex].rating}/5
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Coins className="w-4 h-4 text-[rgb(163,255,18)]" />
                        <span className="text-white/70 text-sm">Token</span>
                      </div>
                      <div className="text-xl font-bold text-[rgb(163,255,18)]">
                        {featuredGames[currentFeaturedIndex].tokenRewards}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Gift className="w-4 h-4 text-purple-400" />
                        <span className="text-white/70 text-sm">Daily Rewards</span>
                      </div>
                      <div className="text-xl font-bold text-purple-400">
                        {featuredGames[currentFeaturedIndex].dailyRewards}
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-4">
                    <Button 
                      size="lg"
                      className="bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90 font-bold px-8 py-6 text-lg"
                    >
                      <Play className="w-6 h-6 mr-3" />
                      Play Now
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="border-white/30 text-white hover:bg-white/10 px-8 py-6"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Install
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-white/30 text-white hover:bg-white/10 p-6"
                    >
                      <Heart className="w-5 h-5" />
                    </Button>
                    <Button
                      size="lg" 
                      variant="outline"
                      className="border-white/30 text-white hover:bg-white/10 p-6"
                    >
                      <Share2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          
          {/* Static bottom fade overlay - doesn't animate with images */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 via-black/30 to-transparent pointer-events-none z-10" />
          
          {/* Carousel Controls */}
          <div className="absolute bottom-8 right-8 flex items-center gap-4">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 text-white hover:bg-black/80 transition-all flex items-center justify-center"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>
            
            <div className="flex gap-2">
              {featuredGames.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentFeaturedIndex(index)}
                  className={cn(
                    "h-3 rounded-full transition-all",
                    index === currentFeaturedIndex
                      ? "bg-[rgb(163,255,18)] w-8"
                      : "bg-white/40 hover:bg-white/60 w-3"
                  )}
                />
              ))}
            </div>
          </div>
          </div>
        </section>

        {/* Sticky Search & Filter Bar + Categories */}
        <div className={`sticky top-16 z-30 transition-all duration-300 ${
          hasScrolled 
            ? 'bg-black/40 backdrop-blur-xl border-b border-white/10' 
            : 'bg-transparent'
        }`}>
          {/* Search & Filter Bar */}
          <section className="px-8 py-3">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                <Input
                  placeholder="Search casual games..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 h-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewType(viewType === "grid" ? "list" : "grid")}
                  className="border-white/20 text-white hover:bg-white/10 h-9 px-3"
                >
                  {viewType === "grid" ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm" 
                  className="border-white/20 text-white hover:bg-white/10 h-9 px-3"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
              </div>
            </div>
          </section>

          {/* Categories */}
          <section className="px-8 pb-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {gameCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all font-medium border text-sm",
                      selectedCategory === category.id
                        ? "bg-[rgb(163,255,18)]/20 text-[rgb(163,255,18)] border-[rgb(163,255,18)]/40"
                        : "bg-white/5 text-white/80 border-white/10 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{category.name}</span>
                    <Badge className="text-xs bg-white/10 text-white/70 border-white/20">
                      {category.count}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* Special Promotion Banner */}
        <section className="px-8 py-8">
          <div className="relative h-64 rounded-2xl overflow-hidden bg-gradient-to-r from-purple-900 via-purple-800 to-pink-900 border border-purple-500/30">
            <div className="absolute inset-0 bg-[url('https://picsum.photos/1200/300?random=600')] bg-cover bg-center opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/80 via-purple-800/60 to-transparent" />
            
            <div className="relative h-full flex items-center px-12">
              <div>
                <Badge className="mb-4 bg-purple-500 text-white font-bold">
                  <Gift className="w-4 h-4 mr-2" />
                  SPECIAL PROMOTION
                </Badge>
                <h2 className="text-4xl font-black text-white mb-3">Weekend Tournament</h2>
                <p className="text-xl text-white/90 mb-6 max-w-2xl">
                  Join this weekend's mega tournament! Win exclusive NFT rewards and earn up to 10,000 tokens!
                </p>
                <div className="flex items-center gap-4">
                  <Button className="bg-purple-500 hover:bg-purple-600 text-white font-bold px-8">
                    Join Tournament
                    <Trophy className="w-5 h-5 ml-2" />
                  </Button>
                  <div className="text-white/80">
                    <span className="text-2xl font-bold">48:12:35</span>
                    <div className="text-sm">Time Remaining</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Game Highlights Grid */}
        <section className="px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Game Highlights</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* Large Featured Game */}
            <div className="relative h-80 rounded-2xl overflow-hidden group cursor-pointer">
              <MediaRenderer
                src="https://picsum.photos/600/400?random=700"
                alt="Featured Game"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                aspectRatio="auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <Badge className="mb-3 bg-[rgb(163,255,18)] text-black">EDITOR'S CHOICE</Badge>
                <h3 className="text-2xl font-bold text-white mb-2">Metaverse Racing Championship</h3>
                <p className="text-white/80">Experience the future of racing in stunning virtual worlds</p>
                <Button className="mt-4 bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90">
                  <Play className="w-4 h-4 mr-2" />
                  Play Now
                </Button>
              </div>
            </div>

            {/* Two Smaller Games */}
            <div className="grid grid-cols-1 gap-6">
              <div className="relative h-36 rounded-2xl overflow-hidden group cursor-pointer">
                <MediaRenderer
                  src="https://picsum.photos/400/200?random=701"
                  alt="Trending Game"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  aspectRatio="auto"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
                <div className="absolute inset-0 p-6 flex flex-col justify-between">
                  <Badge className="w-fit bg-orange-500 text-white">TRENDING</Badge>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">Crypto Kingdoms</h3>
                    <p className="text-white/80 text-sm">Build your empire</p>
                  </div>
                </div>
              </div>

              <div className="relative h-36 rounded-2xl overflow-hidden group cursor-pointer">
                <MediaRenderer
                  src="https://picsum.photos/400/200?random=702"
                  alt="New Release"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  aspectRatio="auto"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
                <div className="absolute inset-0 p-6 flex flex-col justify-between">
                  <Badge className="w-fit bg-blue-500 text-white">NEW</Badge>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">Space Pirates VR</h3>
                    <p className="text-white/80 text-sm">Just released today</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Games Grid - Main Content */}
        <section className="px-8 py-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">All Games</h2>
            <div className="text-white/60">Showing 1-24 of 150+ games</div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {Array.from({ length: 24 }, (_, i) => (
              <Card
                key={i}
                className="bg-gray-900/80 backdrop-blur-sm border-white/10 hover:border-[rgb(163,255,18)]/30 transition-all duration-300 hover:scale-[1.02] group cursor-pointer overflow-hidden"
              >
                <div className="relative aspect-[16/9] overflow-hidden">
                  <MediaRenderer
                    src={`https://picsum.photos/400/225?random=${800 + i}`}
                    alt={`Game ${i + 1}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    aspectRatio="auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Game badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {i % 5 === 0 && <Badge className="bg-[rgb(163,255,18)] text-black text-xs">FREE</Badge>}
                    {i % 7 === 0 && <Badge className="bg-orange-500 text-white text-xs">HOT</Badge>}
                    {i % 9 === 0 && <Badge className="bg-blue-500 text-white text-xs">NEW</Badge>}
                  </div>

                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button size="lg" className="bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90 font-bold">
                      <Play className="w-5 h-5 mr-2" />
                      Play Now
                    </Button>
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <h3 className="font-bold text-white mb-2">Awesome Game {i + 1}</h3>
                  <p className="text-white/60 text-sm mb-3">Action • Adventure</p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400" />
                        <span className="text-white">4.{((i * 7 + 3) % 9) + 1}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-white/70" />
                        <span className="text-white">{((i * 37 + 123) % 500) + 100}K</span>
                      </div>
                    </div>
                    <div className="text-[rgb(163,255,18)] font-bold">
                      {((i * 19 + 67) % 200) + 50} HYP/day
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Load More */}
          <div className="text-center mt-12">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 px-12">
              Load More Games
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </section>

        {/* Bottom padding */}
        <div className="h-32" />
        </div>
      </div>
      
    </div>
  );
}