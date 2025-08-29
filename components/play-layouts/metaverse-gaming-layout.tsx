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
  Globe,
  Rocket,
  Building,
  Users,
  Gem,
  Compass,
  Map,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const mockMetaverseWorlds = {
  hero: {
    id: "metaverse-hub",
    title: "Metaverse Hub",
    subtitle: "Explore limitless virtual worlds",
    description: "Step into the future of gaming with immersive virtual worlds, digital ownership, and endless possibilities. Build, explore, and connect in expansive metaverse environments that blur the line between reality and imagination.",
    image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/080b9a0f-d103-4356-95fe-56e6816df24f/transcode=true,original=true,quality=90/Professional_Mode_A_hyper_realistic__cinematic_pok.webm",
    logo: "/api/placeholder/200/80",
    items: 75000,
    floor: "15.8 ETH",
    volume: "456K ETH",
    creator: "MetaStudios",
    rating: 4.9,
    isNew: false,
    tags: ["Metaverse", "Virtual Worlds", "Digital Assets"]
  },
  featured: [
    {
      id: "cyber-metropolis",
      title: "Cyber Metropolis",
      subtitle: "Futuristic city exploration",
      image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/080b9a0f-d103-4356-95fe-56e6816df24f/transcode=true,original=true,quality=90/Professional_Mode_A_hyper_realistic__cinematic_pok.webm",
      items: 45000,
      floor: "12.5 ETH",
      volume: "189K ETH",
      isNew: true,
      trending: "+234%",
      creator: "CyberWorlds"
    },
    {
      id: "fantasy-kingdoms",
      title: "Fantasy Kingdoms",
      subtitle: "Magical realm adventures",
      image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/080b9a0f-d103-4356-95fe-56e6816df24f/transcode=true,original=true,quality=90/Professional_Mode_A_hyper_realistic__cinematic_pok.webm",
      items: 38000,
      floor: "8.9 ETH",
      volume: "145K ETH",
      isNew: false,
      trending: "+156%",
      creator: "FantasyLabs"
    },
    {
      id: "space-colonies",
      title: "Space Colonies",
      subtitle: "Interstellar civilization building",
      image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/080b9a0f-d103-4356-95fe-56e6816df24f/transcode=true,original=true,quality=90/Professional_Mode_A_hyper_realistic__cinematic_pok.webm",
      items: 52000,
      floor: "18.2 ETH",
      volume: "267K ETH",
      isNew: false,
      trending: "+89%",
      creator: "CosmicBuilders"
    }
  ],
  categories: [
    { id: "worlds", name: "Virtual Worlds", collections: 47, image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/69281ee0-9883-441a-9a8e-e43ff4e05ad0/original=true,quality=90/94617017.jpeg" },
    { id: "land", name: "Digital Land", collections: 156, image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/c51fe7d8-e94f-45ed-b23e-d584c8998118/anim=false,width=450,optimized=true/00586-3019206393.jpeg" },
    { id: "avatars", name: "Avatars", collections: 89, image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/5683b6d8-fa8c-4d5f-8fdb-b6e98801c82a/anim=false,width=450,optimized=true/01959-1721753241.jpeg" },
    { id: "items", name: "Virtual Items", collections: 234, image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/50d09e0b-f10b-400b-9354-2fa908865565/anim=false,width=450,optimized=true/00015-2320167257.jpeg" },
    { id: "experiences", name: "Experiences", collections: 67, image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/1351be80-e8bd-4d05-8d60-31ced9a024ce/original=true,quality=90/96222521.jpeg" }
  ]
};

const virtualWorlds = [
  {
    id: "neo-tokyo",
    title: "Neo Tokyo 2077",
    name: "Neo Tokyo 2077",
    description: "Cyberpunk metaverse with neon-lit streets",
    image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/080b9a0f-d103-4356-95fe-56e6816df24f/transcode=true,original=true,quality=90/Professional_Mode_A_hyper_realistic__cinematic_pok.webm",
    players: 12847,
    rating: 4.8,
    status: "LIVE",
    theme: "Cyberpunk"
  },
  {
    id: "crystal-realm",
    title: "Crystal Realm",
    name: "Crystal Realm",
    description: "Fantasy world with magical crystals",
    image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/080b9a0f-d103-4356-95fe-56e6816df24f/transcode=true,original=true,quality=90/Professional_Mode_A_hyper_realistic__cinematic_pok.webm",
    players: 8934,
    rating: 4.9,
    status: "BETA",
    theme: "Fantasy"
  }
];

const myAssets = [
  {
    id: "hover-bike",
    name: "Quantum Hover Bike",
    type: "Vehicle",
    value: "2.4 ETH",
    image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/080b9a0f-d103-4356-95fe-56e6816df24f/transcode=true,original=true,quality=90/Professional_Mode_A_hyper_realistic__cinematic_pok.webm"
  },
  {
    id: "cyber-suit",
    name: "Cyber Enhancement Suit",
    type: "Wearable",
    value: "1.8 ETH",
    image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/080b9a0f-d103-4356-95fe-56e6816df24f/transcode=true,original=true,quality=90/Professional_Mode_A_hyper_realistic__cinematic_pok.webm"
  }
];

const events = [
  {
    id: "metaverse-expo",
    title: "Metaverse Expo 2024",
    date: "Dec 15-17",
    time: "2:00 PM PST",
    world: "Neo Tokyo 2077",
    type: "Conference",
    attendees: 50000
  },
  {
    id: "virtual-concert",
    title: "Neon Dreams Concert",
    date: "Dec 20",
    time: "8:00 PM PST",
    world: "Crystal Realm",
    type: "Entertainment",
    attendees: 25000
  }
];

export function MetaverseGamingLayout() {
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
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full overflow-hidden bg-black"
      >
      <div className="relative">
        {/* Hero Banner - Metaverse themed */}
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
              <source src={mockMetaverseWorlds.hero.image} type="video/webm" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/80 via-blue-800/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          </div>

          {/* Navigation - Metaverse themed */}
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="absolute top-0 left-0 right-0 z-20 p-4 md:p-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 md:gap-8">
                <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                  <Globe className="h-6 w-6 text-cyan-400" />
                  Metaverse Hub
                </h1>
                <nav className="hidden md:flex items-center gap-6">
                  {["Worlds", "Land", "Avatars", "Items", "Events"].map((item) => (
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
                    placeholder="Explore metaverse..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 md:pl-10 pr-4 py-2 bg-black/20 backdrop-blur-md border-white/20 text-white placeholder:text-white/60 focus:border-cyan-400/40 w-48 md:w-80 text-sm md:text-base"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Hero Content - Metaverse themed */}
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
                  <Badge className="bg-cyan-400 text-black font-semibold px-2 md:px-3 py-1 text-xs md:text-sm flex items-center gap-1">
                    <Rocket className="w-3 h-3" />
                    Next-Gen
                  </Badge>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 md:h-4 md:w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="text-white/80 ml-1 md:ml-2 text-sm md:text-base">{mockMetaverseWorlds.hero.rating}</span>
                  </div>
                  <span className="text-white/80 text-sm md:text-base">{mockMetaverseWorlds.hero.items.toLocaleString()} Worlds</span>
                </div>
              </motion.div>

              <motion.h2
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="text-3xl md:text-5xl font-bold text-white mb-3 md:mb-4"
              >
                {mockMetaverseWorlds.hero.title}
              </motion.h2>

              <motion.p
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="text-base md:text-xl text-white/90 mb-4 md:mb-6 leading-relaxed"
              >
                {mockMetaverseWorlds.hero.description}
              </motion.p>

              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="flex flex-wrap items-center gap-2 md:gap-4"
              >
                <Button className="bg-cyan-500 text-black hover:bg-cyan-600 font-bold px-4 md:px-8 py-2 md:py-3 rounded-lg flex items-center gap-2 text-sm md:text-base">
                  <Play className="h-4 w-4 md:h-5 md:w-5" fill="currentColor" />
                  <span className="hidden sm:inline">Enter Metaverse</span>
                  <span className="sm:hidden">Enter</span>
                </Button>
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 font-bold px-4 md:px-8 py-2 md:py-3 rounded-lg flex items-center gap-2 text-sm md:text-base">
                  <Building className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="hidden sm:inline">My Assets</span>
                  <span className="sm:hidden">Assets</span>
                </Button>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full p-2 md:p-3">
                  <Gem className="h-5 w-5 md:h-6 md:w-6" />
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
                  <span className="text-xs md:text-sm uppercase tracking-wide text-white/60">Active Worlds</span>
                  <p className="text-base md:text-lg font-bold text-cyan-400">47</p>
                </div>
                <div>
                  <span className="text-xs md:text-sm uppercase tracking-wide text-white/60">Online Users</span>
                  <p className="text-base md:text-lg font-bold">12,847</p>
                </div>
                <div>
                  <span className="text-xs md:text-sm uppercase tracking-wide text-white/60">Digital Assets</span>
                  <p className="text-base md:text-lg font-bold">456K</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Categories Row - Metaverse */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="px-4 md:px-8 py-8 md:py-16 bg-black"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-white">Metaverse Categories</h2>
            <Button variant="ghost" className="text-white/80 hover:text-white flex items-center gap-2">
              View All
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {mockMetaverseWorlds.categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.6 }}
                whileHover={{ scale: 1.03 }}
                className="group cursor-pointer"
              >
                <div className="relative overflow-hidden rounded-xl">
                  <div className="aspect-[3/4] bg-gradient-to-br from-cyan-800 to-blue-900">
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

     
      </div>
    </motion.div>
    

    </>
  );
}