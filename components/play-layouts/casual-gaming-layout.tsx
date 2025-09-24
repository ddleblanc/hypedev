"use client";

import React, { useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
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
  Coffee,
  Heart,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const mockCasualGames = {
  hero: {
    id: "zen-gardens",
    title: "Zen Gardens",
    subtitle: "Find peace in virtual meditation spaces",
    description: "Escape the chaos of daily life and find tranquility in beautifully crafted zen gardens. Design your perfect meditation space, tend to virtual plants, and discover inner peace through mindful gaming.",
    image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/e86e948f-56cd-4c15-9f70-315818aafa7e/transcode=true,original=true,quality=90/114308upscale_00001.webm",
    logo: "/api/placeholder/200/80",
    items: 15000,
    floor: "0.8 ETH",
    volume: "2.4K ETH",
    creator: "ZenStudios",
    rating: 4.9,
    isNew: false,
    tags: ["Relaxing", "Meditative", "Peaceful"]
  },
  featured: [
    {
      id: "word-puzzles",
      title: "Daily Word Quest",
      subtitle: "Expand your vocabulary daily",
      image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/e86e948f-56cd-4c15-9f70-315818aafa7e/transcode=true,original=true,quality=90/114308upscale_00001.webm",
      items: 5000,
      floor: "0.3 ETH",
      volume: "890 ETH",
      isNew: true,
      trending: "+18%",
      creator: "WordCraft"
    },
    {
      id: "match-three",
      title: "Gemstone Gardens",
      subtitle: "Match colorful gems in peaceful settings",
      image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/e86e948f-56cd-4c15-9f70-315818aafa7e/transcode=true,original=true,quality=90/114308upscale_00001.webm",
      items: 8500,
      floor: "0.5 ETH",
      volume: "1.2K ETH",
      isNew: false,
      trending: "+12%",
      creator: "GemWorks"
    },
    {
      id: "city-builder",
      title: "Cozy Town",
      subtitle: "Build your dream neighborhood",
      image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/e86e948f-56cd-4c15-9f70-315818aafa7e/transcode=true,original=true,quality=90/114308upscale_00001.webm",
      items: 12000,
      floor: "1.1 ETH",
      volume: "3.2K ETH",
      isNew: false,
      trending: "+25%",
      creator: "CozyGames"
    }
  ],
  categories: [
    { id: "puzzles", name: "Word Puzzles", collections: 25, image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/69281ee0-9883-441a-9a8e-e43ff4e05ad0/original=true,quality=90/94617017.jpeg" },
    { id: "match", name: "Match Games", collections: 34, image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/c51fe7d8-e94f-45ed-b23e-d584c8998118/anim=false,width=450,optimized=true/00586-3019206393.jpeg" },
    { id: "simulation", name: "Life Sim", collections: 16, image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/5683b6d8-fa8c-4d5f-8fdb-b6e98801c82a/anim=false,width=450,optimized=true/01959-1721753241.jpeg" },
    { id: "wellness", name: "Wellness", collections: 12, image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/50d09e0b-f10b-400b-9354-2fa908865565/anim=false,width=450,optimized=true/00015-2320167257.jpeg" },
    { id: "mindful", name: "Mindful", collections: 8, image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/1351be80-e8bd-4d05-8d60-31ced9a024ce/original=true,quality=90/96222521.jpeg" }
  ]
};

export function CasualGamingLayout() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMuted, setIsMuted] = useState(true);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const scrollCarousel = (direction: 'left' | 'right', containerId: string) => {
    const container = document.getElementById(containerId);
    if (container) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
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
        {/* Hero Banner - Same structure as marketplace */}
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
              <source src={mockCasualGames.hero.image} type="video/webm" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-r from-green-900/80 via-green-800/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          </div>

          {/* Navigation - Casual themed */}
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="absolute top-0 left-0 right-0 z-20 p-4 md:p-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 md:gap-8">
                <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                  <Coffee className="h-6 w-6 text-green-400" />
                  Casual Zone
                </h1>
                <nav className="hidden md:flex items-center gap-6">
                  {["Puzzles", "Match Games", "Life Sim", "Wellness", "Mindful"].map((item) => (
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
                    placeholder="Find relaxing games..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 md:pl-10 pr-4 py-2 bg-black/20 backdrop-blur-md border-white/20 text-white placeholder:text-white/60 focus:border-green-400/40 w-48 md:w-80 text-sm md:text-base"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Hero Content - Casual themed */}
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
                  <Badge className="bg-green-400 text-black font-semibold px-2 md:px-3 py-1 text-xs md:text-sm flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    Most Relaxing
                  </Badge>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 md:h-4 md:w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="text-white/80 ml-1 md:ml-2 text-sm md:text-base">{mockCasualGames.hero.rating}</span>
                  </div>
                  <span className="text-white/80 text-sm md:text-base">{mockCasualGames.hero.items.toLocaleString()} Games</span>
                </div>
              </motion.div>

              <motion.h2
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="text-3xl md:text-5xl font-bold text-white mb-3 md:mb-4"
              >
                {mockCasualGames.hero.title}
              </motion.h2>

              <motion.p
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="text-base md:text-xl text-white/90 mb-4 md:mb-6 leading-relaxed"
              >
                {mockCasualGames.hero.description}
              </motion.p>

              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="flex flex-wrap items-center gap-2 md:gap-4"
              >
                <Button className="bg-green-400 text-black hover:bg-green-500 font-bold px-4 md:px-8 py-2 md:py-3 rounded-lg flex items-center gap-2 text-sm md:text-base">
                  <Play className="h-4 w-4 md:h-5 md:w-5" fill="currentColor" />
                  <span className="hidden sm:inline">Start Relaxing</span>
                  <span className="sm:hidden">Play</span>
                </Button>
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 font-bold px-4 md:px-8 py-2 md:py-3 rounded-lg flex items-center gap-2 text-sm md:text-base">
                  <Coffee className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="hidden sm:inline">Wellness Guide</span>
                  <span className="sm:hidden">Guide</span>
                </Button>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full p-2 md:p-3">
                  <Heart className="h-5 w-5 md:h-6 md:w-6" />
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
                  <span className="text-xs md:text-sm uppercase tracking-wide text-white/60">Average Session</span>
                  <p className="text-base md:text-lg font-bold">2.4 hours</p>
                </div>
                <div>
                  <span className="text-xs md:text-sm uppercase tracking-wide text-white/60">Players Online</span>
                  <p className="text-base md:text-lg font-bold">2,847</p>
                </div>
                <div>
                  <span className="text-xs md:text-sm uppercase tracking-wide text-white/60">Satisfaction</span>
                  <p className="text-base md:text-lg font-bold text-green-400">98%</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Rest of the sections follow the same marketplace structure but with casual gaming content */}
        {/* Categories, Featured Games, etc. using the same layout patterns */}
        
        {/* Categories Row */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="px-4 md:px-8 py-8 md:py-16 bg-black"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-white">Browse Casual Games</h2>
            <Button variant="ghost" className="text-white/80 hover:text-white flex items-center gap-2">
              View All
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {mockCasualGames.categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.6 }}
                whileHover={{ scale: 1.03 }}
                className="group cursor-pointer"
              >
                <div className="relative overflow-hidden rounded-xl">
                  <div className="aspect-[3/4] bg-gradient-to-br from-green-800 to-green-900">
                    <img 
                      src={category.image} 
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  </div>
                  <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4">
                    <h3 className="text-white font-bold text-sm md:text-lg mb-1">{category.name}</h3>
                    <p className="text-white/70 text-xs md:text-sm">{category.collections} games</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

       
      </div>
    </motion.div>
  );
}