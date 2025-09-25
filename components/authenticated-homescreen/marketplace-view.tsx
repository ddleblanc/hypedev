"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  Play,
  Info,
  Plus,
  ChevronLeft,
  ChevronRight,
  Search,
  TrendingUp,
  Star,
  Volume2,
  VolumeX,
  MoreHorizontal,
  ArrowUpRight,
  Menu,
  X,
  Home,
  ShoppingCart,
  Rocket,
  Coins,
  Users,
  Filter,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface MarketplaceViewProps {
  setViewMode?: (mode: string) => void;
  onCollectionClick?: (collectionId: string) => void;
}

const mockCollections = {
  hero: {
    id: "legendary-warriors",
    title: "Legendary Warriors",
    subtitle: "Epic battles await in this premium collection",
    description: "Join the ranks of legendary warriors in an immersive gaming experience. Featuring unique characters, rare weapons, and exclusive storylines that define the future of digital collectibles.",
    image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/9b999c34-2113-4873-89b9-d23dba35f954/transcode=true,original=true,quality=90/dnd_clips_04.webm",
    logo: "/api/placeholder/200/80",
    items: 25000,
    floor: "4.2 ETH",
    volume: "12.8K ETH",
    creator: "HyperStudio",
    rating: 4.9,
    isNew: false,
    tags: ["Action", "RPG", "Collectibles"]
  },
  featured: [
    {
      id: "cyber-legends",
      title: "Cyber Legends",
      subtitle: "Futuristic warriors collection",
      image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/9c5398c1-dcde-4d7c-ac6a-33fa6ff5d948/transcode=true,width=450,optimized=true/0e178c0604244fb9a44d5b87c6b2a815.webm",
      items: 10000,
      floor: "2.1 ETH",
      volume: "5.2K ETH",
      isNew: true,
      trending: "+24%",
      creator: "NeonStudios"
    },
    {
      id: "mystic-realms",
      title: "Mystic Realms",
      subtitle: "Magical adventures await",
      image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/70c067bd-0f01-4da8-a603-c7c325637c44/transcode=true,width=450,optimized=true/wan-hdp_00001.webm",
      items: 8500,
      floor: "1.8 ETH",
      volume: "3.7K ETH",
      isNew: false,
      trending: "+18%",
      creator: "MagicWorks"
    },
    {
      id: "space-odyssey",
      title: "Space Odyssey",
      subtitle: "Explore the cosmos",
      image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/940dd528-da99-4bdc-857c-fa3f84892b62/transcode=true,width=450,optimized=true/1632001-He%20empowers%20his%20sword,%20heating%20the%20air%20a-WanWan22-I2V-A14B-HighNoise-Q8_0.webm",
      items: 15000,
      floor: "3.4 ETH",
      volume: "8.1K ETH",
      isNew: false,
      trending: "+31%",
      creator: "CosmicArts"
    },
    {
      id: "ancient-gods",
      title: "Ancient Gods",
      subtitle: "Mythological powers unleashed",
      image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/d6e98371-7da8-4ca1-8283-10dc7f3f2a32/transcode=true,width=450,optimized=true/wan22__00008_1_chf3_prob4.webm",
      items: 6000,
      floor: "5.7 ETH",
      volume: "15.3K ETH",
      isNew: false,
      trending: "+12%",
      creator: "MythicGames"
    },
    {
      id: "neon-city",
      title: "Neon City",
      subtitle: "Urban cyberpunk adventure",
      image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/c4218fb6-fad3-4458-ac38-0362ca9bf4a7/transcode=true,width=450,optimized=true/96085294.webm",
      items: 12000,
      floor: "2.9 ETH",
      volume: "6.8K ETH",
      isNew: true,
      trending: "+45%",
      creator: "UrbanLabs"
    }
  ],
  categories: [
    { id: "new", name: "New & Popular", collections: 45, image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/69281ee0-9883-441a-9a8e-e43ff4e05ad0/original=true,quality=90/94617017.jpeg" },
    { id: "gaming", name: "Gaming", collections: 234, image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/c51fe7d8-e94f-45ed-b23e-d584c8998118/anim=false,width=450,optimized=true/00586-3019206393.jpeg" },
    { id: "art", name: "Digital Art", collections: 156, image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/5683b6d8-fa8c-4d5f-8fdb-b6e98801c82a/anim=false,width=450,optimized=true/01959-1721753241.jpeg" },
    { id: "collectibles", name: "Collectibles", collections: 89, image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/50d09e0b-f10b-400b-9354-2fa908865565/anim=false,width=450,optimized=true/00015-2320167257.jpeg" },
    { id: "premium", name: "Premium", collections: 23, image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/1351be80-e8bd-4d05-8d60-31ced9a024ce/original=true,quality=90/96222521.jpeg" }
  ],
  trending: [
    { id: "dragon-knights", title: "Dragon Knights", image: "/api/placeholder/300/450", floor: "1.2 ETH", change: "+156%" },
    { id: "pixel-heroes", title: "Pixel Heroes", image: "/api/placeholder/300/450", floor: "0.8 ETH", change: "+89%" },
    { id: "mech-warriors", title: "Mech Warriors", image: "/api/placeholder/300/450", floor: "3.1 ETH", change: "+67%" },
    { id: "crypto-cats", title: "Crypto Cats", image: "/api/placeholder/300/450", floor: "0.5 ETH", change: "+234%" },
    { id: "void-hunters", title: "Void Hunters", image: "/api/placeholder/300/450", floor: "2.7 ETH", change: "+45%" },
    { id: "crystal-mages", title: "Crystal Mages", image: "/api/placeholder/300/450", floor: "1.9 ETH", change: "+78%" }
  ]
};

export function MarketplaceView({ onCollectionClick }: MarketplaceViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMuted, setIsMuted] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  const router = useRouter();
  
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  // Combine hero with featured for mobile carousel
  const mobileHeroItems = [mockCollections.hero, ...mockCollections.featured];

  const handleCollectionClick = (collectionId: string) => {
    router.push(`/collection/${collectionId}`);
  };

  const scrollCarousel = (direction: 'left' | 'right', containerId: string) => {
    const container = document.getElementById(containerId);
    if (container) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Auto-rotate hero on mobile
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % mobileHeroItems.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [mobileHeroItems.length]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full overflow-hidden bg-black"
    >
      {/* Mobile Layout - Cinematic */}
      <div className="md:hidden relative">
        
        {/* Mobile Header - Minimal, overlaid */}
        <div className="fixed top-0 left-0 right-0 z-50 p-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-white">Marketplace</h1>
          <div className="flex gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="bg-black/40 backdrop-blur text-white"
              onClick={() => setShowSearch(!showSearch)}
            >
              {showSearch ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="bg-black/40 backdrop-blur text-white"
            >
              <Filter className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Search Overlay */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-16 left-0 right-0 z-40 p-4 bg-black/95 backdrop-blur-xl"
            >
              <Input
                placeholder="Search collections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                autoFocus
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fullscreen Hero Carousel */}
        <div className="relative h-screen w-full overflow-hidden">
          {/* Video Background */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentHeroIndex}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.7 }}
              className="absolute inset-0"
            >
              <video
                className="w-full h-full object-cover"
                autoPlay
                muted={isMuted}
                loop
                playsInline
              >
                <source src={mobileHeroItems[currentHeroIndex].image || mockCollections.hero.image} type="video/webm" />
              </video>
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
            </motion.div>
          </AnimatePresence>

          {/* Content Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 pb-24">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentHeroIndex}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5 }}
              >
                {/* Badges */}
                <div className="flex gap-2 mb-3">
                  {currentHeroIndex === 0 && (
                    <Badge className="bg-[rgb(163,255,18)] text-black font-bold">
                      #1 Collection
                    </Badge>
                  )}
                  {mobileHeroItems[currentHeroIndex].isNew && (
                    <Badge className="bg-blue-500 text-white font-bold">
                      NEW
                    </Badge>
                  )}
                  {mobileHeroItems[currentHeroIndex].trending && (
                    <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">
                      {mobileHeroItems[currentHeroIndex].trending}
                    </Badge>
                  )}
                </div>

                {/* Title */}
                <h2 className="text-4xl font-black text-white mb-2">
                  {mobileHeroItems[currentHeroIndex].title}
                </h2>
                
                {/* Subtitle */}
                <p className="text-lg text-white/80 mb-4">
                  {mobileHeroItems[currentHeroIndex].subtitle || mobileHeroItems[currentHeroIndex].description?.slice(0, 50) + '...'}
                </p>

                {/* Stats */}
                <div className="flex gap-6 mb-6">
                  <div>
                    <p className="text-sm text-white/60">Floor</p>
                    <p className="text-lg font-bold text-white">{mobileHeroItems[currentHeroIndex].floor}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Volume</p>
                    <p className="text-lg font-bold text-white">{mobileHeroItems[currentHeroIndex].volume}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Items</p>
                    <p className="text-lg font-bold text-white">
                      {mobileHeroItems[currentHeroIndex].items?.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* CTA Button */}
                <Button 
                  size="lg"
                  className="w-full bg-white text-black hover:bg-white/90 font-bold"
                  onClick={() => handleCollectionClick(mobileHeroItems[currentHeroIndex].id)}
                >
                  <Play className="w-5 h-5 mr-2" fill="currentColor" />
                  Explore Collection
                </Button>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Carousel Navigation Dots */}
          <div className="absolute bottom-32 left-0 right-0 flex justify-center gap-2 px-6">
            {mobileHeroItems.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentHeroIndex(index)}
                className={`h-1 transition-all duration-300 ${
                  index === currentHeroIndex 
                    ? 'w-8 bg-white' 
                    : 'w-1 bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>

          {/* Swipe Navigation Buttons */}
          <button
            onClick={() => setCurrentHeroIndex((prev) => (prev - 1 + mobileHeroItems.length) % mobileHeroItems.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 backdrop-blur rounded-full text-white"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => setCurrentHeroIndex((prev) => (prev + 1) % mobileHeroItems.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 backdrop-blur rounded-full text-white"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Sound Toggle */}
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-20 right-4 bg-black/40 backdrop-blur text-white"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>
        </div>

        {/* Scrollable Content Below Hero */}
        <div className="bg-black pb-20">
          
          {/* Categories - Horizontal Scroll */}
          <section className="py-8">
            <h3 className="text-2xl font-bold text-white mb-4 px-6">Categories</h3>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide px-6">
              {mockCollections.categories.map((category) => (
                <motion.div
                  key={category.id}
                  whileTap={{ scale: 0.98 }}
                  className="relative flex-shrink-0 w-32 aspect-square rounded-xl overflow-hidden"
                >
                  <img 
                    src={category.image} 
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-white font-bold text-xs">{category.name}</p>
                    <p className="text-white/60 text-[10px]">{category.collections} items</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Trending - Vertical Cards */}
          <section className="py-8">
            <div className="flex items-center justify-between mb-4 px-6">
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-[rgb(163,255,18)]" />
                Trending Now
              </h3>
              <Button variant="ghost" size="sm" className="text-white/60">
                View All
                <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            
            <div className="space-y-1">
              {mockCollections.trending.slice(0, 4).map((collection, index) => (
                <motion.div
                  key={collection.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleCollectionClick(collection.id)}
                  className="relative h-48 overflow-hidden"
                >
                  {/* Full-width background image */}
                  <div className="absolute inset-0">
                    <div className="w-full h-full bg-gradient-to-br from-purple-900/20 to-blue-900/20" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent" />
                  </div>
                  
                  {/* Content */}
                  <div className="relative h-full flex items-center justify-between p-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-black/60 backdrop-blur rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">#{index + 1}</span>
                        </div>
                        <Badge className="bg-green-500 text-white text-xs">
                          {collection.change}
                        </Badge>
                      </div>
                      <h4 className="text-2xl font-bold text-white mb-1">{collection.title}</h4>
                      <p className="text-lg text-white/80">Floor: {collection.floor}</p>
                    </div>
                    
                    {/* Play icon on hover/tap */}
                    <div className="w-16 h-16 bg-white/10 backdrop-blur rounded-full flex items-center justify-center">
                      <Play className="w-8 h-8 text-white" fill="currentColor" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* New Collections - Stories Style */}
          <section className="py-8">
            <h3 className="text-2xl font-bold text-white mb-4 px-6">New Drops</h3>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide px-6">
              {mockCollections.featured.filter(c => c.isNew).map((collection) => (
                <motion.div
                  key={collection.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleCollectionClick(collection.id)}
                  className="relative flex-shrink-0 w-28 h-48 rounded-2xl overflow-hidden"
                >
                  <video
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                  >
                    <source src={collection.image} type="video/webm" />
                  </video>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  
                  <div className="absolute top-3 left-3 right-3">
                    <Badge className="bg-[rgb(163,255,18)] text-black text-[10px] font-bold">
                      NEW
                    </Badge>
                  </div>
                  
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white font-bold text-xs truncate">{collection.title}</p>
                    <p className="text-white/70 text-[10px]">{collection.floor}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-t border-white/10">
          <div className="grid grid-cols-5">
            <button
              onClick={() => router.push('/')}
              className="flex flex-col items-center py-3 text-white/60 hover:text-[rgb(163,255,18)] active:text-[rgb(163,255,18)] transition-colors"
            >
              <Home className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium">HOME</span>
            </button>
            
            <button
              className="flex flex-col items-center py-3 text-[rgb(163,255,18)] transition-colors"
            >
              <ShoppingCart className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium">MARKET</span>
            </button>

            <button
              onClick={() => router.push('/launchpad')}
              className="flex flex-col items-center py-3 text-white/60 hover:text-[rgb(163,255,18)] active:text-[rgb(163,255,18)] transition-colors"
            >
              <Rocket className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium">LAUNCH</span>
            </button>

            <button
              onClick={() => router.push('/tokens')}
              className="flex flex-col items-center py-3 text-white/60 hover:text-[rgb(163,255,18)] active:text-[rgb(163,255,18)] transition-colors"
            >
              <Coins className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium">TOKENS</span>
            </button>

            <button
              onClick={() => router.push('/p2p')}
              className="flex flex-col items-center py-3 text-white/60 hover:text-[rgb(163,255,18)] active:text-[rgb(163,255,18)] transition-colors"
            >
              <Users className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium">P2P</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Layout - Original Cinematic Design */}
      <div className="hidden md:block relative">
        {/* Hero Banner */}
        <motion.div
          ref={heroRef}
          className="relative h-[70vh] md:h-[85vh] overflow-hidden"
          style={{ scale: heroScale }}
        >
          <div className="absolute inset-0">
            <video
              className="w-full h-full object-cover"
              autoPlay
              muted={isMuted}
              loop
              playsInline
            >
              <source src={mockCollections.hero.image} type="video/webm" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          </div>

          {/* Navigation */}
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="absolute top-0 left-0 right-0 z-20 p-4 md:p-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 md:gap-8">
                <h1 className="text-xl md:text-2xl font-bold text-white">Marketplace</h1>
                <nav className="hidden md:flex items-center gap-6">
                  {["Featured", "Trending", "New", "Collections", "Categories"].map((item) => (
                    <button
                      key={item}
                      className="text-white/80 hover:text-white transition-colors text-lg font-medium"
                    >
                      {item}
                    </button>
                  ))}
                </nav>
              </div>
              <div className="flex items-center gap-2 md:gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 h-4 w-4 md:h-5 md:w-5" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 md:pl-10 pr-4 py-2 bg-black/20 backdrop-blur-md border-white/20 text-white placeholder:text-white/60 focus:border-white/40 w-48 md:w-80 text-sm md:text-base"
                  />
                </div>
              </div>
            </div>
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
                <img 
                  src={mockCollections.hero.logo} 
                  alt={mockCollections.hero.title}
                  className="h-12 md:h-16 mb-4 md:mb-6 object-contain"
                />
                <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-4">
                  <Badge className="bg-[rgb(163,255,18)] text-black font-semibold px-2 md:px-3 py-1 text-xs md:text-sm">
                    #{1} Collection
                  </Badge>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 md:h-4 md:w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="text-white/80 ml-1 md:ml-2 text-sm md:text-base">{mockCollections.hero.rating}</span>
                  </div>
                  <span className="text-white/80 text-sm md:text-base">{mockCollections.hero.items.toLocaleString()} Items</span>
                </div>
              </motion.div>

              <motion.h2
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="text-3xl md:text-5xl font-bold text-white mb-3 md:mb-4"
              >
                {mockCollections.hero.title}
              </motion.h2>

              <motion.p
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="text-base md:text-xl text-white/90 mb-4 md:mb-6 leading-relaxed"
              >
                {mockCollections.hero.description}
              </motion.p>

              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="flex flex-wrap items-center gap-2 md:gap-4"
              >
                <Button 
                  className="bg-white text-black hover:bg-white/90 font-bold px-4 md:px-8 py-2 md:py-3 rounded-lg flex items-center gap-2 text-sm md:text-base"
                  onClick={() => handleCollectionClick(mockCollections.hero.id)}
                >
                  <Play className="h-4 w-4 md:h-5 md:w-5" fill="currentColor" />
                  <span className="hidden sm:inline">Explore Collection</span>
                  <span className="sm:hidden">Explore</span>
                </Button>
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 font-bold px-4 md:px-8 py-2 md:py-3 rounded-lg flex items-center gap-2 text-sm md:text-base">
                  <Info className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="hidden sm:inline">More Info</span>
                  <span className="sm:hidden">Info</span>
                </Button>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full p-2 md:p-3">
                  <Plus className="h-5 w-5 md:h-6 md:w-6" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/20 rounded-full p-2 md:p-3"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <VolumeX className="h-5 w-5 md:h-6 md:w-6" /> : <Volume2 className="h-5 w-5 md:h-6 md:w-6" />}
                </Button>
              </motion.div>

              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.8 }}
                className="flex flex-wrap items-center gap-4 md:gap-6 mt-4 md:mt-6 text-white/80"
              >
                <div>
                  <span className="text-xs md:text-sm uppercase tracking-wide text-white/60">Floor Price</span>
                  <p className="text-base md:text-lg font-bold">{mockCollections.hero.floor}</p>
                </div>
                <div>
                  <span className="text-xs md:text-sm uppercase tracking-wide text-white/60">Volume</span>
                  <p className="text-base md:text-lg font-bold">{mockCollections.hero.volume}</p>
                </div>
                <div>
                  <span className="text-xs md:text-sm uppercase tracking-wide text-white/60">Creator</span>
                  <p className="text-base md:text-lg font-bold">{mockCollections.hero.creator}</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Categories Row */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="px-4 md:px-8 py-8 md:py-16 bg-black"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-white">Browse by Category</h2>
            <Button variant="ghost" className="text-white/80 hover:text-white flex items-center gap-2">
              View All
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {mockCollections.categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.6 }}
                whileHover={{ scale: 1.03 }}
                className="group cursor-pointer"
              >
                <div className="relative overflow-hidden rounded-xl">
                  <div className="aspect-[3/4] bg-gradient-to-br from-gray-800 to-gray-900">
                    <img 
                      src={category.image} 
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  </div>
                  <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4">
                    <h3 className="text-white font-bold text-sm md:text-lg mb-1">{category.name}</h3>
                    <p className="text-white/70 text-xs md:text-sm">{category.collections} collections</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Featured Collections */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="px-4 md:px-8 py-8 md:py-16"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Featured Collections</h2>
              <p className="text-white/70">Handpicked collections from top creators</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => scrollCarousel('left', 'featured-carousel')}
                className="text-white hover:bg-white/10 rounded-full"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => scrollCarousel('right', 'featured-carousel')}
                className="text-white hover:bg-white/10 rounded-full"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
          </div>

          <div 
            id="featured-carousel" 
            className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-4" 
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {mockCollections.featured.map((collection, index) => (
              <motion.div
                key={collection.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.6 }}
                whileHover={{ scale: 1.02, y: -8 }}
                className="group cursor-pointer min-w-[240px] md:min-w-[280px] flex-shrink-0"
                onClick={() => handleCollectionClick(collection.id)}
              >
                <div className="relative overflow-hidden rounded-xl">
                  <div className="aspect-[2/3] relative">
                    <video
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      autoPlay
                      muted
                      loop
                      playsInline
                    >
                      <source src={collection.image} type="video/webm" />
                    </video>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    {/* Overlay Content */}
                    <div className="absolute inset-0 flex flex-col justify-between p-4 md:p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col gap-1 md:gap-2">
                          {collection.isNew && (
                            <Badge className="bg-[rgb(163,255,18)] text-black font-bold px-2 md:px-3 py-1 w-fit text-xs">
                              New
                            </Badge>
                          )}
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 w-fit text-xs px-2 py-1">
                            {collection.trending}
                          </Badge>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-white hover:bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-all h-8 w-8 md:h-10 md:w-10"
                        >
                          <MoreHorizontal className="h-4 w-4 md:h-5 md:w-5" />
                        </Button>
                      </div>
                      
                      <div>
                        <h3 className="text-white font-bold text-lg md:text-xl mb-1">{collection.title}</h3>
                        <p className="text-white/80 text-xs md:text-sm mb-2 md:mb-3">{collection.subtitle}</p>
                        <p className="text-white/60 text-xs mb-3 md:mb-4">by {collection.creator}</p>
                        
                        <div className="flex items-center justify-between text-xs md:text-sm">
                          <div>
                            <span className="text-white/60">Floor: </span>
                            <span className="text-white font-bold">{collection.floor}</span>
                          </div>
                          <div>
                            <span className="text-white/60">{collection.items.toLocaleString()} items</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Hover Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="bg-black/60 backdrop-blur-sm rounded-full p-4">
                        <Play className="h-8 w-8 text-white fill-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Trending Collections */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="px-4 md:px-8 py-8 md:py-16 bg-gradient-to-b from-black/50 to-black"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-[rgb(163,255,18)]" />
                Trending Now
              </h2>
              <p className="text-white/70">Collections gaining momentum</p>
            </div>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 flex items-center gap-2">
              View All Trending
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {mockCollections.trending.map((collection, index) => (
              <motion.div
                key={collection.id}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.1 * index, duration: 0.5 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="group cursor-pointer"
                onClick={() => handleCollectionClick(collection.id)}
              >
                <div className="relative overflow-hidden rounded-lg">
                  <div className="aspect-[2/3]">
                    <img 
                      src={collection.image} 
                      alt={collection.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    
                    <div className="absolute top-1 md:top-2 right-1 md:right-2">
                      <Badge className="bg-green-500/90 text-white font-bold text-xs px-1 md:px-2 py-1">
                        {collection.change}
                      </Badge>
                    </div>
                    
                    <div className="absolute bottom-2 md:bottom-3 left-2 md:left-3 right-2 md:right-3">
                      <h3 className="text-white font-bold text-xs md:text-sm mb-1 truncate">{collection.title}</h3>
                      <p className="text-white/70 text-xs">{collection.floor}</p>
                    </div>
                    
                    {/* Ranking Badge */}
                    <div className="absolute top-1 md:top-2 left-1 md:left-2">
                      <div className="bg-black/60 backdrop-blur-sm rounded-full w-6 h-6 md:w-8 md:h-8 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">#{index + 1}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* More Collections Grid */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="px-4 md:px-8 py-8 md:py-16"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">More to Explore</h2>
              <p className="text-white/70">Discover collections across all categories</p>
            </div>
            <div className="flex items-center gap-4">
              <select className="bg-black/40 border border-white/20 text-white rounded-lg px-3 md:px-4 py-2 text-sm md:text-base">
                <option value="all">All Categories</option>
                <option value="gaming">Gaming</option>
                <option value="art">Art</option>
                <option value="collectibles">Collectibles</option>
              </select>
              <select className="bg-black/40 border border-white/20 text-white rounded-lg px-3 md:px-4 py-2 text-sm md:text-base">
                <option value="trending">Trending</option>
                <option value="newest">Newest</option>
                <option value="volume">Volume</option>
                <option value="floor">Floor Price</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[...mockCollections.featured, ...mockCollections.trending.slice(0, 2)].map((collection, index) => (
              <motion.div
                key={`${collection.id}-grid`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index, duration: 0.6 }}
                whileHover={{ scale: 1.02 }}
                className="group cursor-pointer"
                onClick={() => handleCollectionClick(collection.id)}
              >
                <div className="relative overflow-hidden rounded-xl">
                  <div className="aspect-[3/4]">
                    {collection.image.endsWith('.webm') ? (
                      <video
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        autoPlay
                        muted
                        loop
                        playsInline
                      >
                        <source src={collection.image} type="video/webm" />
                      </video>
                    ) : (
                      <img 
                        src={collection.image} 
                        alt={collection.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    
                    <div className="absolute bottom-3 md:bottom-4 left-3 md:left-4 right-3 md:right-4">
                      <h3 className="text-white font-bold text-sm md:text-lg mb-1">{collection.title}</h3>
                      <p className="text-white/80 text-xs md:text-sm mb-1 md:mb-2">
                        {'creator' in collection ? `by ${collection.creator}` : `Floor ${collection.floor}`}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="text-white/70 text-xs">
                          {'items' in collection ? `${collection.items.toLocaleString()} items` : 'Collection'}
                        </div>
                        {'trending' in collection && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs px-1 md:px-2 py-1">
                            {collection.trending}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex justify-center mt-12">
            <Button 
              variant="outline" 
              className="border-white/20 text-white hover:bg-white/10 px-8 py-3"
            >
              Load More Collections
            </Button>
          </div>
        </motion.section>
      </div>
    </motion.div>
  );
}