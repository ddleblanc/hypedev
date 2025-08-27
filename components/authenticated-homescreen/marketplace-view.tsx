"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Star,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Eye,
  Heart,
  Share2,
  Filter,
  Grid,
  List,
  Search,
  Crown,
  Flame,
  Zap,
  Trophy,
  Gem,
  Activity,
  Users,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Play,
  Pause
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MediaRenderer } from "@/components/MediaRenderer";

// Mock data for marketplace
const topWeeklySales = [
  {
    id: 1,
    name: "Legendary Dragon Lord #1",
    collection: "Mythic Legends",
    price: "247.5 ETH",
    seller: "DragonMaster.eth",
    buyer: "CryptoWhale.eth",
    image: "https://picsum.photos/800/800?random=100",
    rank: 1,
    change: "+156%"
  },
  {
    id: 2,
    name: "Genesis Cyber Samurai #001",
    collection: "Future Warriors",
    price: "189.2 ETH",
    seller: "SamuraiLord.eth",
    buyer: "TechMogul.eth", 
    image: "https://picsum.photos/800/800?random=101",
    rank: 2,
    change: "+89%"
  },
  {
    id: 3,
    name: "Ancient Artifact #777",
    collection: "Lost Civilizations",
    price: "156.8 ETH",
    seller: "Archaeologist.eth",
    buyer: "ArtCollector.eth",
    image: "https://picsum.photos/800/800?random=102",
    rank: 3,
    change: "+245%"
  }
];

const featuredCollections = [
  {
    id: 1,
    name: "Mythic Legends",
    floor: "12.5 ETH",
    volume24h: "1,234 ETH",
    change24h: "+156.2%",
    items: 10000,
    owners: 5200,
    image: "https://picsum.photos/600/400?random=200",
    verified: true,
    featured: true
  },
  {
    id: 2,
    name: "Cyber Samurai",
    floor: "8.3 ETH", 
    volume24h: "987 ETH",
    change24h: "+89.5%",
    items: 8800,
    owners: 3800,
    image: "https://picsum.photos/600/400?random=201",
    verified: true,
    featured: true
  },
  {
    id: 3,
    name: "Space Odyssey",
    floor: "6.7 ETH",
    volume24h: "756 ETH", 
    change24h: "+45.3%",
    items: 5000,
    owners: 2900,
    image: "https://picsum.photos/600/400?random=202",
    verified: true,
    featured: false
  },
  {
    id: 4,
    name: "Dragon Realms",
    floor: "5.4 ETH",
    volume24h: "623 ETH",
    change24h: "+28.7%",
    items: 7700,
    owners: 2100,
    image: "https://picsum.photos/600/400?random=203",
    verified: true,
    featured: false
  },
  {
    id: 5,
    name: "Pixel Warriors",
    floor: "3.2 ETH",
    volume24h: "445 ETH",
    change24h: "-12.3%",
    items: 4400,
    owners: 1800,
    image: "https://picsum.photos/600/400?random=204",
    verified: false,
    featured: false
  }
];

const topMoversToday = [
  {
    id: 1,
    name: "Lightning Bolt #523",
    collection: "Electric Dreams",
    price: "45.2 ETH",
    change: "+89.3%",
    image: "https://picsum.photos/400/400?random=300",
    timeLeft: "2h 45m"
  },
  {
    id: 2,
    name: "Crystal Shard #188",
    collection: "Mystic Crystals",
    price: "32.7 ETH",
    change: "+67.8%", 
    image: "https://picsum.photos/400/400?random=301",
    timeLeft: "5h 12m"
  },
  {
    id: 3,
    name: "Fire Phoenix #999",
    collection: "Elemental Beasts",
    price: "28.9 ETH",
    change: "+54.2%",
    image: "https://picsum.photos/400/400?random=302",
    timeLeft: "8h 30m"
  },
  {
    id: 4,
    name: "Shadow Ninja #442",
    collection: "Dark Arts",
    price: "41.1 ETH",
    change: "+43.7%",
    image: "https://picsum.photos/400/400?random=303",
    timeLeft: "12h 15m"
  },
  {
    id: 5,
    name: "Golden Crown #001",
    collection: "Royal Collection",
    price: "67.8 ETH",
    change: "+38.9%",
    image: "https://picsum.photos/400/400?random=304",
    timeLeft: "1d 3h"
  }
];

const trendingCollectionsGrid = [
  {
    id: 1,
    name: "Mythic Legends",
    floor: "12.5 ETH",
    volume24h: "1,234 ETH",
    change24h: "+156.2%",
    items: 10000,
    owners: 5200,
    image: "https://picsum.photos/300/300?random=400",
    bannerImage: "https://picsum.photos/600/200?random=400",
    verified: true,
    rank: 1,
    category: "Gaming",
    description: "Epic fantasy creatures with legendary powers and abilities"
  },
  {
    id: 2,
    name: "Cyber Samurai",
    floor: "8.3 ETH",
    volume24h: "987 ETH", 
    change24h: "+89.5%",
    items: 8800,
    owners: 3800,
    image: "https://picsum.photos/300/300?random=401",
    bannerImage: "https://picsum.photos/600/200?random=401",
    verified: true,
    rank: 2,
    category: "Art",
    description: "Futuristic warriors from the neon-lit streets of Neo Tokyo"
  },
  {
    id: 3,
    name: "Space Odyssey",
    floor: "6.7 ETH",
    volume24h: "756 ETH",
    change24h: "+45.3%",
    items: 5000,
    owners: 2900,
    image: "https://picsum.photos/300/300?random=402",
    bannerImage: "https://picsum.photos/600/200?random=402",
    verified: true,
    rank: 3,
    category: "Gaming",
    description: "Explore the cosmos with interstellar adventures"
  },
  {
    id: 4,
    name: "Dragon Realms",
    floor: "5.4 ETH",
    volume24h: "623 ETH",
    change24h: "+28.7%",
    items: 7700,
    owners: 2100,
    image: "https://picsum.photos/300/300?random=403",
    bannerImage: "https://picsum.photos/600/200?random=403",
    verified: true,
    rank: 4,
    category: "Fantasy",
    description: "Majestic dragons ruling over mystical kingdoms"
  },
  {
    id: 5,
    name: "Pixel Warriors",
    floor: "3.2 ETH",
    volume24h: "445 ETH",
    change24h: "-12.3%",
    items: 4400,
    owners: 1800,
    image: "https://picsum.photos/300/300?random=404",
    bannerImage: "https://picsum.photos/600/200?random=404",
    verified: false,
    rank: 5,
    category: "Pixel Art",
    description: "8-bit heroes ready for retro gaming adventures"
  },
  {
    id: 6,
    name: "Neon Knights",
    floor: "4.8 ETH",
    volume24h: "389 ETH",
    change24h: "+19.4%",
    items: 6600,
    owners: 1900,
    image: "https://picsum.photos/300/300?random=405",
    bannerImage: "https://picsum.photos/600/200?random=405",
    verified: true,
    rank: 6,
    category: "Cyberpunk",
    description: "Glowing warriors from the electric underground"
  }
];

const categories = [
  { id: "all", name: "All", icon: Grid, count: "50K+", active: true },
  { id: "gaming", name: "Gaming", icon: Play, count: "15K" },
  { id: "art", name: "Art", icon: Gem, count: "12K" },
  { id: "music", name: "Music", icon: Activity, count: "8K" },
  { id: "sports", name: "Sports", icon: Trophy, count: "5K" },
  { id: "metaverse", name: "Metaverse", icon: Zap, count: "10K" }
];

type MarketplaceViewProps = {
  setViewMode: (mode: string) => void;
};

export function MarketplaceView({ setViewMode }: MarketplaceViewProps) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewType, setViewType] = useState<"grid" | "list">("grid");
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  
  // Slider refs for horizontal scrolling
  const featuredSliderRef = useRef<HTMLDivElement>(null);
  const topMoversSliderRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Helper function to generate URL-friendly slugs
  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

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
      setCurrentBannerIndex((prev) => (prev + 1) % topWeeklySales.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Slider navigation functions
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
      {/* Dynamic Header Overlay - Matches header height */}
      <div className={`absolute top-0 left-0 right-0 z-20 h-32 transition-all duration-300 ${
        hasScrolled 
          ? 'bg-black/40 backdrop-blur-xl border-b border-white/10' 
          : 'bg-transparent'
      }`} />
      
      {/* Dynamic Top Fade Gradient */}
      <div className={`absolute top-32 left-0 right-0 h-8 transition-opacity duration-300 pointer-events-none z-10 ${
        hasScrolled 
          ? 'opacity-100 bg-gradient-to-b from-black/40 to-transparent' 
          : 'opacity-0'
      }`} />

      {/* Scrollable Content Area - Full Screen */}
      <div 
        ref={scrollContainerRef}
        className="absolute inset-0 overflow-y-auto scrollbar-hide"
      >
        <div className="w-full">
        
        {/* Hero Banner - Top Weekly Sales */}
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
                src={topWeeklySales[currentBannerIndex].image}
                alt={topWeeklySales[currentBannerIndex].name}
                className="w-full h-full object-cover"
                aspectRatio="auto"
              />
              
              {/* Gradient Overlays */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              
              {/* Content */}
              <div className="absolute inset-0 flex items-center pt-36">
                <div className="px-16 max-w-4xl">
                  <Badge className="mb-4 bg-[rgb(163,255,18)]/10 text-[rgb(163,255,18)] border-[rgb(163,255,18)]/30 text-sm font-bold">
                    <Crown className="w-4 h-4 mr-2" />
                    TOP WEEKLY SALE #{topWeeklySales[currentBannerIndex].rank}
                  </Badge>
                  
                  <h1 className="text-6xl font-black text-white mb-2">
                    {topWeeklySales[currentBannerIndex].name}
                  </h1>
                  
                  <p className="text-xl text-[rgb(163,255,18)] font-bold mb-6">
                    {topWeeklySales[currentBannerIndex].collection}
                  </p>
                  
                  <div className="flex items-center gap-6 mb-8">
                    <div>
                      <p className="text-white/70 text-sm">Sale Price</p>
                      <p className="text-3xl font-black text-white">
                        {topWeeklySales[currentBannerIndex].price}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/70 text-sm">24h Change</p>
                      <p className="text-xl font-bold text-[rgb(163,255,18)] flex items-center gap-1">
                        <TrendingUp className="w-5 h-5" />
                        {topWeeklySales[currentBannerIndex].change}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Button 
                      className="bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90 font-bold px-8"
                      onClick={() => router.push(`/collection/${generateSlug(topWeeklySales[currentBannerIndex].collection)}`)}
                    >
                      View Collection
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                    <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                      <Heart className="w-5 h-5 mr-2" />
                      Add to Wishlist
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
              {topWeeklySales.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentBannerIndex(index)}
                  className={cn(
                    "w-3 h-3 rounded-full transition-all",
                    index === currentBannerIndex
                      ? "bg-[rgb(163,255,18)] w-8"
                      : "bg-white/40 hover:bg-white/60"
                  )}
                />
              ))}
            </div>
          </div>
          </div>
        </section>

        {/* Sticky Category Navigation */}
        <div className={`sticky top-32 z-30 transition-all duration-300 ${
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

        {/* Featured Collections Slider */}
        <section className="px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Star className="w-6 h-6 text-[rgb(163,255,18)]" />
              Featured Collections
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => slideLeft(featuredSliderRef)}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all flex items-center justify-center"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => slideRight(featuredSliderRef)}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all flex items-center justify-center"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div
            ref={featuredSliderRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide pb-4"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {featuredCollections.map((collection) => (
              <Card
                key={collection.id}
                className="flex-shrink-0 w-80 bg-gradient-to-br from-gray-900/80 to-black/60 backdrop-blur-xl border-[rgb(163,255,18)]/20 hover:border-[rgb(163,255,18)]/40 transition-all duration-500 hover:scale-[1.02] group cursor-pointer"
                style={{ scrollSnapAlign: 'start' }}
                onClick={() => router.push(`/collection/${generateSlug(collection.name)}`)}
              >
                <div className="relative h-48 overflow-hidden rounded-t-xl">
                  <MediaRenderer
                    src={collection.image}
                    alt={collection.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    aspectRatio="auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  
                  {collection.featured && (
                    <Badge className="absolute top-4 right-4 bg-[rgb(163,255,18)] text-black">
                      <Crown className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                  
                  {collection.verified && (
                    <Badge className="absolute top-4 left-4 bg-white text-black">
                      <Star className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2">{collection.name}</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-white/60 text-sm">Floor Price</p>
                      <p className="text-white font-bold">{collection.floor}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">24h Volume</p>
                      <p className="text-white font-bold">{collection.volume24h}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">Items</p>
                      <p className="text-white font-bold">{collection.items.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">Owners</p>
                      <p className="text-white font-bold">{collection.owners.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className={cn(
                      "flex items-center gap-1 font-bold",
                      collection.change24h.startsWith('+') ? "text-[rgb(163,255,18)]" : "text-red-400"
                    )}>
                      {collection.change24h.startsWith('+') ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                      {collection.change24h}
                    </div>
                    <Button 
                      size="sm" 
                      className="bg-[rgb(163,255,18)]/10 text-[rgb(163,255,18)] hover:bg-[rgb(163,255,18)]/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/collection/${generateSlug(collection.name)}`);
                      }}
                    >
                      Explore
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Top Movers Today */}
        <section className="px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Flame className="w-6 h-6 text-orange-500" />
              Top Movers Today
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => slideLeft(topMoversSliderRef)}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all flex items-center justify-center"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => slideRight(topMoversSliderRef)}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all flex items-center justify-center"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div
            ref={topMoversSliderRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
          >
            {topMoversToday.map((item) => (
              <Card
                key={item.id}
                className="flex-shrink-0 w-64 bg-gradient-to-br from-gray-900/80 to-black/60 backdrop-blur-xl border-orange-500/20 hover:border-orange-500/40 transition-all duration-300 hover:scale-[1.02] group cursor-pointer"
              >
                <div className="relative h-40 overflow-hidden rounded-t-xl">
                  <MediaRenderer
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    aspectRatio="auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  
                  <Badge className="absolute top-3 right-3 bg-orange-500/20 text-orange-400 border-orange-500/40">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {item.change}
                  </Badge>
                  
                  <Badge className="absolute bottom-3 left-3 bg-black/60 text-white border-white/20">
                    {item.timeLeft}
                  </Badge>
                </div>
                
                <CardContent className="p-4">
                  <h3 className="font-bold text-white mb-1 truncate">{item.name}</h3>
                  <p className="text-white/60 text-sm mb-2 truncate">{item.collection}</p>
                  <p className="text-lg font-bold text-orange-400">{item.price}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Trending Collections Grid */}
        <section className="px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-[rgb(163,255,18)]" />
              Trending Collections
            </h2>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
            {trendingCollectionsGrid.map((collection) => (
              <Card
                key={collection.id}
                className="bg-gradient-to-br from-gray-900/80 to-black/60 backdrop-blur-xl border-[rgb(163,255,18)]/20 hover:border-[rgb(163,255,18)]/40 transition-all duration-500 hover:scale-[1.02] group cursor-pointer overflow-hidden"
                onClick={() => router.push(`/collection/${generateSlug(collection.name)}`)}
              >
                {/* Banner Image */}
                <div className="relative h-32 overflow-hidden">
                  <MediaRenderer
                    src={collection.bannerImage}
                    alt={`${collection.name} banner`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    aspectRatio="auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" />
                  
                  <Badge className="absolute top-3 left-3 bg-[rgb(163,255,18)] text-black text-xs font-bold">
                    #{collection.rank}
                  </Badge>
                  
                  {collection.verified && (
                    <Badge className="absolute top-3 right-3 bg-white text-black text-xs">
                      <Star className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                  
                  {/* Collection Avatar */}
                  <div className="absolute -bottom-8 left-6 w-16 h-16 rounded-xl overflow-hidden border-4 border-black/60 backdrop-blur-sm">
                    <MediaRenderer
                      src={collection.image}
                      alt={collection.name}
                      className="w-full h-full object-cover"
                      aspectRatio="square"
                    />
                  </div>
                </div>
                
                <CardContent className="pt-12 p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-1">{collection.name}</h3>
                      <Badge className="text-xs bg-[rgb(163,255,18)]/10 text-[rgb(163,255,18)] border-[rgb(163,255,18)]/30">
                        {collection.category}
                      </Badge>
                    </div>
                    <div className={cn(
                      "flex items-center gap-1 font-bold text-sm",
                      collection.change24h.startsWith('+') ? "text-[rgb(163,255,18)]" : "text-red-400"
                    )}>
                      {collection.change24h.startsWith('+') ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      {collection.change24h}
                    </div>
                  </div>
                  
                  <p className="text-white/70 text-sm mb-4 line-clamp-2">{collection.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-white/60 text-xs">Floor Price</p>
                      <p className="text-white font-bold">{collection.floor}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-xs">24h Volume</p>
                      <p className="text-white font-bold">{collection.volume24h}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-xs">Items</p>
                      <p className="text-white font-bold">{collection.items.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-xs">Owners</p>
                      <p className="text-white font-bold">{collection.owners.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      className="flex-1 bg-[rgb(163,255,18)]/10 text-[rgb(163,255,18)] hover:bg-[rgb(163,255,18)]/20 font-bold"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/collection/${generateSlug(collection.name)}`);
                      }}
                    >
                      Explore Collection
                    </Button>
                    <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10 p-2">
                      <Heart className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10 p-2">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Load More */}
        <section className="px-8 py-16 text-center">
          <Button className="bg-[rgb(163,255,18)]/10 text-[rgb(163,255,18)] hover:bg-[rgb(163,255,18)]/20 font-bold px-12">
            Load More Collections
            <ArrowDownRight className="w-5 h-5 ml-2" />
          </Button>
        </section>
        
        {/* Bottom padding for footer */}
        <div className="h-32" />
        </div>
      </div>
      
      {/* Bottom Footer Overlay - Always visible with glass background */}
      <div className="absolute bottom-0 left-0 right-0 z-20 h-32 bg-black/40 backdrop-blur-xl border-t border-white/10" />
      
      {/* Bottom Fade Gradient - Always visible */}
      <div className="absolute bottom-32 left-0 right-0 h-8 bg-gradient-to-t from-black/40 to-transparent pointer-events-none z-10" />
    </div>
  );
}