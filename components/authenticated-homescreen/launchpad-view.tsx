"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowRight,
  Heart,
  Star,
  Play,
  Pause,
  Crown,
  TrendingUp,
  Users,
  Filter,
  List,
  Grid,
  Gem,
  Activity,
  Trophy,
  Zap,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Eye,
  Clock,
  Timer,
  Calendar,
  Flame,
  Award
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MediaRenderer } from "@/components/MediaRenderer";

// Mock data for launchpad - OpenSea inspired
const featuredDrops = [
  {
    id: 1,
    name: "CyberRealms Genesis",
    collection: "CyberRealms",
    creator: "Nexus Studios",
    description: "Immersive cyberpunk world with upgradeable characters and weapons",
    image: "https://picsum.photos/800/800?random=100",
    
    // Mint Schedule
    mintPhases: [
      { phase: "Allowlist", price: "0.06 ETH", starts: "Dec 12, 2024 2:00 PM UTC", status: "upcoming" },
      { phase: "Public Sale", price: "0.08 ETH", starts: "Dec 15, 2024 2:00 PM UTC", status: "upcoming" }
    ],
    currentPhase: "Allowlist",
    
    // Collection Info
    totalSupply: "10,000",
    minted: "0",
    allowlistSpots: "3,500",
    allowlistClaimed: "2,847",
    
    // Stats
    followers: "12.4K",
    verified: true,
    featured: true
  },
  {
    id: 2,
    name: "1v1 Champions",
    collection: "MVW Genesis",
    creator: "GameForge Labs",
    description: "Intense 1v1 competitive dueling with P2E mechanics",
    image: "https://picsum.photos/800/800?random=101",
    
    mintPhases: [
      { phase: "Early Access", price: "0.10 ETH", starts: "Dec 18, 2024 6:00 PM UTC", status: "upcoming" },
      { phase: "Public Sale", price: "0.12 ETH", starts: "Dec 20, 2024 6:00 PM UTC", status: "upcoming" }
    ],
    currentPhase: "Early Access",
    
    totalSupply: "8,888",
    minted: "0",
    allowlistSpots: "2,000",
    allowlistClaimed: "1,923",
    
    followers: "8.9K",
    verified: true,
    featured: true
  },
  {
    id: 3,
    name: "Quantum Legends",
    collection: "Q-Legends",
    creator: "Quantum Games",
    description: "Sci-fi strategy game with quantum mechanics and time travel",
    image: "https://picsum.photos/800/800?random=102",
    
    mintPhases: [
      { phase: "Presale", price: "0.05 ETH", starts: "Dec 23, 2024 12:00 PM UTC", status: "upcoming" },
      { phase: "Public Sale", price: "0.06 ETH", starts: "Dec 25, 2024 12:00 PM UTC", status: "upcoming" }
    ],
    currentPhase: "Presale",
    
    totalSupply: "15,000",
    minted: "0",
    allowlistSpots: "5,000",
    allowlistClaimed: "3,456",
    
    followers: "15.2K",
    verified: true,
    featured: false
  }
];

const categories = [
  { id: "live", name: "Live & Upcoming", icon: Activity, count: "23", active: true },
  { id: "featured", name: "Featured", icon: Crown, count: "8" },
  { id: "gaming", name: "Gaming", icon: Play, count: "67" },
  { id: "1v1", name: "1v1 Gaming", icon: Zap, count: "23" },
  { id: "defi", name: "DeFi", icon: TrendingUp, count: "18" },
  { id: "ai", name: "AI & Tech", icon: Gem, count: "16" }
];

type LaunchpadViewProps = Record<string, never>;

export function LaunchpadView({}: LaunchpadViewProps) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("live");
  const [viewType, setViewType] = useState<"grid" | "list">("grid");
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Track scroll position for dynamic header/footer
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

  // Auto-rotate banner
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % featuredDrops.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isPlaying]);

  const hasScrolled = scrollY > 50;

  return (
    <div className="fixed inset-0 z-10 overflow-hidden">
      
      <div className={`absolute top-16 left-0 right-0 h-8 transition-opacity duration-300 pointer-events-none z-10 ${
        hasScrolled ? 'opacity-100 bg-gradient-to-b from-black/40 to-transparent' : 'opacity-0'
      }`} />

      {/* Scrollable Content Area */}
      <div 
        ref={scrollContainerRef}
        className="absolute inset-0 overflow-y-auto scrollbar-hide"
      >
        <div className="w-full">
        
        {/* Hero Banner - Featured Drops */}
        <section className="relative h-[732px] overflow-hidden bg-black">
          <div className="h-full overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentBannerIndex}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <MediaRenderer
                src={featuredDrops[currentBannerIndex].image}
                alt={featuredDrops[currentBannerIndex].name}
                className="w-full h-full object-cover"
                aspectRatio="auto"
              />
              
              {/* Gradient Overlays */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              
              {/* Content */}
              <div className="absolute inset-0 flex items-center pt-36">
                <div className="px-16 max-w-5xl">
                  <div className="flex items-center gap-3 mb-4">
                    {featuredDrops[currentBannerIndex].verified && (
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        <ShieldCheck className="w-4 h-4 mr-1" />
                        Verified
                      </Badge>
                    )}
                    {featuredDrops[currentBannerIndex].featured && (
                      <Badge className="bg-[rgb(163,255,18)]/10 text-[rgb(163,255,18)] border-[rgb(163,255,18)]/30">
                        <Crown className="w-4 h-4 mr-1" />
                        Featured Drop
                      </Badge>
                    )}
                  </div>
                  
                  <h1 className="text-6xl font-black text-white mb-2">
                    {featuredDrops[currentBannerIndex].name}
                  </h1>
                  
                  <p className="text-xl text-white/80 mb-2">
                    by {featuredDrops[currentBannerIndex].creator}
                  </p>
                  
                  <p className="text-lg text-white/70 mb-8 max-w-2xl">
                    {featuredDrops[currentBannerIndex].description}
                  </p>
                  
                  {/* Mint Schedule */}
                  <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-6 mb-8 max-w-3xl">
                    <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-[rgb(163,255,18)]" />
                      Mint Schedule
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {featuredDrops[currentBannerIndex].mintPhases.map((phase, idx) => (
                        <div key={idx} className="bg-white/5 rounded-lg p-4 border border-white/10">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white font-bold">{phase.phase}</span>
                            <Badge className={`${phase.status === 'live' ? 'bg-green-500' : phase.status === 'upcoming' ? 'bg-orange-500' : 'bg-gray-500'} text-white text-xs`}>
                              {phase.status.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-[rgb(163,255,18)] font-bold text-lg mb-1">{phase.price}</p>
                          <p className="text-white/70 text-sm">{phase.starts}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 mb-8">
                    <div>
                      <p className="text-white/70 text-sm">Total Supply</p>
                      <p className="text-2xl font-black text-white">
                        {featuredDrops[currentBannerIndex].totalSupply}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/70 text-sm">Allowlist</p>
                      <p className="text-xl font-bold text-purple-400">
                        {featuredDrops[currentBannerIndex].allowlistClaimed}/{featuredDrops[currentBannerIndex].allowlistSpots}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/70 text-sm">Followers</p>
                      <p className="text-xl font-bold text-white flex items-center gap-1">
                        <Users className="w-5 h-5" />
                        {featuredDrops[currentBannerIndex].followers}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Button 
                      className="bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90 font-bold px-8"
                    >
                      Join Allowlist
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                    <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                      <Heart className="w-5 h-5 mr-2" />
                      Follow Project
                    </Button>
                    <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                      <Eye className="w-5 h-5 mr-2" />
                      View Collection
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          
          {/* Static bottom fade overlay - doesn't animate with images */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 via-black/30 to-transparent pointer-events-none z-10" />
          
          {/* Banner Controls */}
          <div className="absolute bottom-6 right-6 flex items-center gap-4">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 text-white hover:bg-black/80 transition-all flex items-center justify-center"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            
            <div className="flex gap-2">
              {featuredDrops.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentBannerIndex(index)}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    index === currentBannerIndex
                      ? "bg-[rgb(163,255,18)] w-6"
                      : "bg-white/40 hover:bg-white/60 w-2"
                  )}
                />
              ))}
            </div>
          </div>
          </div>
        </section>

        {/* Sticky Category Navigation */}
        <div className={`sticky top-16 z-30 transition-all duration-300 ${
          hasScrolled 
            ? 'bg-black/40 backdrop-blur-xl border-b border-white/10' 
            : 'bg-transparent'
        }`}>
          <section className="px-8 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-1">
                {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all font-medium border text-sm",
                      selectedCategory === category.id
                        ? "bg-[rgb(163,255,18)]/10 text-[rgb(163,255,18)] border-[rgb(163,255,18)]/30"
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
              
              <div className="flex items-center gap-2 flex-shrink-0">
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
        </div>

        {/* Live & Upcoming Drops */}
        <section className="px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Activity className="w-6 h-6 text-[rgb(163,255,18)]" />
              Live & Upcoming Drops
            </h2>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
            {[
              {
                name: "Neon Racers",
                creator: "SpeedLabs",
                description: "High-octane racing in cyberpunk cities with customizable vehicles",
                image: "https://picsum.photos/400/300?random=600",
                totalSupply: "5,000",
                minted: "0",
                mintPrice: "0.05 ETH",
                nextMint: "Dec 18, 2024 2:00 PM UTC",
                mintPhase: "Allowlist",
                allowlistSpots: "1000",
                allowlistClaimed: "247",
                followers: "4.2K",
                verified: true,
                status: "allowlist"
              },
              {
                name: "Dragon Realm",
                creator: "MythForge",
                description: "Epic fantasy world with breeding dragons and magical quests",
                image: "https://picsum.photos/400/300?random=601",
                totalSupply: "8,888",
                minted: "1,234",
                mintPrice: "0.08 ETH",
                nextMint: "Live Now",
                mintPhase: "Public Sale",
                allowlistSpots: "500",
                allowlistClaimed: "500",
                followers: "7.8K",
                verified: true,
                status: "live"
              },
              {
                name: "Space Colony",
                creator: "CosmicGames",
                description: "Build and manage interstellar colonies in deep space",
                image: "https://picsum.photos/400/300?random=602",
                totalSupply: "15,000",
                minted: "0",
                mintPrice: "0.12 ETH",
                nextMint: "Jan 5, 2025 12:00 PM UTC",
                mintPhase: "Presale",
                allowlistSpots: "2000",
                allowlistClaimed: "892",
                followers: "2.1K",
                verified: false,
                status: "upcoming"
              }
            ].map((project, index) => (
              <div key={index} className="bg-gray-900/80 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:border-[rgb(163,255,18)]/30 transition-all duration-300 hover:scale-[1.02] group">
                <div className="relative h-48 overflow-hidden">
                  <MediaRenderer
                    src={project.image}
                    alt={project.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    aspectRatio="auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    {project.verified && (
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                    <Badge className={`${
                      project.status === 'live' ? 'bg-green-500 text-white' :
                      project.status === 'allowlist' ? 'bg-purple-500 text-white' :
                      project.status === 'upcoming' ? 'bg-orange-500 text-white' :
                      'bg-blue-500 text-white'
                    }`}>
                      {project.status === 'live' ? 'LIVE NOW' :
                       project.status === 'allowlist' ? 'ALLOWLIST' :
                       project.status === 'upcoming' ? 'UPCOMING' :
                       'COMING SOON'}
                    </Badge>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-white font-bold text-lg mb-1">{project.name}</h3>
                    <p className="text-white/80 text-sm">by {project.creator}</p>
                  </div>
                </div>
                
                <div className="p-4">
                  <p className="text-white/70 text-sm mb-4">{project.description}</p>
                  
                  {/* Mint Progress */}
                  {project.minted !== "0" && (
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">Minted</span>
                        <span className="text-white font-bold">{project.minted}/{project.totalSupply}</span>
                      </div>
                      <div className="w-full bg-gray-700/50 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-[rgb(163,255,18)] to-green-400 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(parseInt(project.minted) / parseInt(project.totalSupply)) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div>
                      <span className="text-white/60 block">Mint Price</span>
                      <span className="text-white font-bold">{project.mintPrice}</span>
                    </div>
                    <div>
                      <span className="text-white/60 block">Total Supply</span>
                      <span className="text-white font-bold">{project.totalSupply}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-white/60">Current Phase</span>
                      <span className="text-[rgb(163,255,18)] font-bold">{project.mintPhase}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-white/60">Next Mint</span>
                      <span className="text-white font-bold">{project.nextMint}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-white/60">Allowlist</span>
                      <span className="text-purple-400 font-bold">{project.allowlistClaimed}/{project.allowlistSpots}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Followers</span>
                      <span className="text-white font-bold">{project.followers}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1 bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90 font-bold">
                      {project.status === 'live' ? 'Mint Now' :
                       project.status === 'allowlist' ? 'Join Allowlist' :
                       'Get Notified'}
                    </Button>
                    <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recently Launched */}
        <section className="px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-400" />
              Recently Launched
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
            {featuredDrops.map((launch, index) => (
              <div key={launch.id} className="bg-gray-900/80 backdrop-blur-sm border border-green-500/20 rounded-2xl overflow-hidden hover:border-green-500/40 transition-all duration-300 hover:scale-[1.02] group">
                <div className="relative h-48 overflow-hidden">
                  <MediaRenderer
                    src={launch.image}
                    alt={launch.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    aspectRatio="auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    {launch.verified && (
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                    <Badge className="bg-green-500 text-white">
                      LAUNCHED
                    </Badge>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-white font-bold text-lg mb-1">{launch.name}</h3>
                    <p className="text-white/80 text-sm">by {launch.creator}</p>
                  </div>
                </div>
                
                <div className="p-4">
                  <p className="text-white/70 text-sm mb-4">{launch.description}</p>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div>
                      <span className="text-white/60 block">Launch Price</span>
                      <span className="text-white font-bold">{launch.mintPhases[0].price}</span>
                    </div>
                    <div>
                      <span className="text-white/60 block">Total Supply</span>
                      <span className="text-white font-bold">{launch.totalSupply}</span>
                    </div>
                    <div>
                      <span className="text-white/60 block">Floor Price</span>
                      <span className="text-green-400 font-bold">{(parseFloat(launch.mintPhases[0].price) * 1.3).toFixed(2)} ETH</span>
                    </div>
                    <div>
                      <span className="text-white/60 block">Holders</span>
                      <span className="text-white font-bold">{launch.followers}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 font-bold border border-green-500/30">
                      View Collection
                    </Button>
                    <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Trending Collections */}
        <section className="px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-[rgb(163,255,18)]" />
              Trending Collections
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-6">
            {[
              {
                name: "CyberPunks Elite",
                creator: "CyberDAO",
                image: "https://picsum.photos/300/300?random=700",
                volume24h: "245 ETH",
                floorPrice: "2.8 ETH",
                change: "+12.5%",
                holders: "4.2K",
                verified: true
              },
              {
                name: "Meta Warriors",
                creator: "WarriorLabs",
                image: "https://picsum.photos/300/300?random=701",
                volume24h: "189 ETH",
                floorPrice: "1.6 ETH",
                change: "+8.3%",
                holders: "2.1K",
                verified: true
              },
              {
                name: "Quantum Beasts",
                creator: "QuantumStudios",
                image: "https://picsum.photos/300/300?random=702",
                volume24h: "156 ETH",
                floorPrice: "3.2 ETH",
                change: "+25.7%",
                holders: "1.8K",
                verified: false
              },
              {
                name: "Space Explorers",
                creator: "CosmicGames",
                image: "https://picsum.photos/300/300?random=703",
                volume24h: "134 ETH",
                floorPrice: "0.9 ETH",
                change: "+15.2%",
                holders: "3.5K",
                verified: true
              },
              {
                name: "Dragon Lords",
                creator: "MythicRealms",
                image: "https://picsum.photos/300/300?random=704",
                volume24h: "98 ETH",
                floorPrice: "1.4 ETH",
                change: "+6.8%",
                holders: "2.7K",
                verified: true
              },
              {
                name: "Neon Racers",
                creator: "SpeedLabs",
                image: "https://picsum.photos/300/300?random=705",
                volume24h: "87 ETH",
                floorPrice: "0.7 ETH",
                change: "+19.4%",
                holders: "5.1K",
                verified: false
              },
              {
                name: "AI Companions",
                creator: "TechForge",
                image: "https://picsum.photos/300/300?random=706",
                volume24h: "76 ETH",
                floorPrice: "2.1 ETH",
                change: "+11.7%",
                holders: "1.3K",
                verified: true
              },
              {
                name: "Pixel Legends",
                creator: "RetroGaming",
                image: "https://picsum.photos/300/300?random=707",
                volume24h: "65 ETH",
                floorPrice: "0.5 ETH",
                change: "+22.1%",
                holders: "6.8K",
                verified: false
              }
            ].map((collection, i) => (
              <Card
                key={i}
                className="bg-gray-900/80 backdrop-blur-sm border border-white/10 hover:border-[rgb(163,255,18)]/30 transition-all duration-300 hover:scale-[1.02] group cursor-pointer overflow-hidden"
              >
                <div className="relative aspect-square overflow-hidden">
                  <MediaRenderer
                    src={collection.image}
                    alt={collection.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    aspectRatio="square"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <Badge className="bg-[rgb(163,255,18)]/20 text-[rgb(163,255,18)] border-[rgb(163,255,18)]/30">
                      <Flame className="w-3 h-3 mr-1" />
                      HOT
                    </Badge>
                    {collection.verified && (
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        <ShieldCheck className="w-3 h-3" />
                      </Badge>
                    )}
                  </div>
                  
                  <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <h3 className="text-white font-bold mb-1">{collection.name}</h3>
                    <p className="text-white/80 text-sm">by {collection.creator}</p>
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <h3 className="font-bold text-white mb-2 truncate">{collection.name}</h3>
                  <p className="text-white/60 text-sm mb-3">by {collection.creator}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Floor Price</span>
                      <span className="text-white font-bold">{collection.floorPrice}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">24h Volume</span>
                      <span className="text-[rgb(163,255,18)] font-bold">{collection.volume24h}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">24h Change</span>
                      <span className="text-green-400 font-bold">{collection.change}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Holders</span>
                      <span className="text-white font-bold">{collection.holders}</span>
                    </div>
                  </div>
                  
                  <Button size="sm" className="w-full bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90 font-bold">
                    View Collection
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Notification Banner for Upcoming Drops */}
        <section className="px-8 py-6 bg-gradient-to-r from-purple-900/20 to-pink-900/20 backdrop-blur-xl border-y border-purple-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Timer className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Don&apos;t Miss Out!</h3>
                <p className="text-white/70">CyberRealms Genesis drops in 2 days - Join the allowlist now</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 px-4 py-2">
                <Clock className="w-4 h-4 mr-2" />
                2d 14h 23m
              </Badge>
              <Button className="bg-purple-500 hover:bg-purple-600 text-white font-bold">
                Set Reminder
              </Button>
            </div>
          </div>
        </section>

        {/* Bottom padding */}
        <div className="h-32" />
        </div>
      </div>
    </div>
  );
}
