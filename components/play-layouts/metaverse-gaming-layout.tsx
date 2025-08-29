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
  Gem
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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

        {/* Featured Virtual Worlds */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="px-4 md:px-8 py-8 md:py-16"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Globe className="h-8 w-8 text-cyan-400" />
                Featured Worlds
              </h2>
              <p className="text-white/70">Explore the most popular virtual environments</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => scrollCarousel('left', 'metaverse-carousel')}
                className="text-white hover:bg-white/10 rounded-full"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => scrollCarousel('right', 'metaverse-carousel')}
                className="text-white hover:bg-white/10 rounded-full"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
          </div>

          <div 
            id="metaverse-carousel" 
            className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-4" 
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {mockMetaverseWorlds.featured.map((world, index) => (
              <motion.div
                key={world.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.6 }}
                whileHover={{ scale: 1.02, y: -8 }}
                className="group cursor-pointer min-w-[240px] md:min-w-[280px] flex-shrink-0"
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
                      <source src={world.image} type="video/webm" />
                    </video>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    {/* Featured Badge */}
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-xs px-2 py-1">
                        Featured
                      </Badge>
                    </div>
                    
                    {/* Overlay Content */}
                    <div className="absolute inset-0 flex flex-col justify-between p-4 md:p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col gap-1 md:gap-2">
                          {world.isNew && (
                            <Badge className="bg-cyan-400 text-black font-bold px-2 md:px-3 py-1 w-fit text-xs">
                              New
                            </Badge>
                          )}
                          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 w-fit text-xs px-2 py-1">
                            {world.trending}
                          </Badge>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-white hover:bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-all h-8 w-8 md:h-10 md:w-10"
                        >
                          <Gem className="h-4 w-4 md:h-5 md:w-5" />
                        </Button>
                      </div>
                      
                      <div>
                        <h3 className="text-white font-bold text-lg md:text-xl mb-1">{world.title}</h3>
                        <p className="text-white/80 text-xs md:text-sm mb-2 md:mb-3">{world.subtitle}</p>
                        <p className="text-white/60 text-xs mb-3 md:mb-4">by {world.creator}</p>
                        
                        <div className="flex items-center justify-between text-xs md:text-sm">
                          <div>
                            <span className="text-white/60">Floor: </span>
                            <span className="text-white font-bold">{world.floor}</span>
                          </div>
                          <div>
                            <span className="text-white/60">{world.items.toLocaleString()} assets</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Hover Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="bg-cyan-600/80 backdrop-blur-sm rounded-full p-4">
                        <Play className="h-8 w-8 text-white fill-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>
    </motion.div>
      <div className="max-w-7xl mx-auto px-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Globe className="w-8 h-8 text-cyan-400" />
            <h1 className="text-4xl font-bold text-white">METAVERSE HUB</h1>
            <Globe className="w-8 h-8 text-cyan-400" />
          </div>
          <p className="text-cyan-200 text-lg max-w-2xl mx-auto">
            Explore limitless virtual worlds, build your digital empire, and connect 
            with players from across the multiverse in immersive 3D experiences.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-6 mb-12">
          <Card className="bg-black/40 border-cyan-500/30 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <Globe className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">47</div>
              <div className="text-cyan-200 text-sm">Active Worlds</div>
            </CardContent>
          </Card>
          
          <Card className="bg-black/40 border-cyan-500/30 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">12,847</div>
              <div className="text-cyan-200 text-sm">Online Users</div>
            </CardContent>
          </Card>
          
          <Card className="bg-black/40 border-cyan-500/30 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <Building className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">8,294</div>
              <div className="text-cyan-200 text-sm">Virtual Properties</div>
            </CardContent>
          </Card>
          
          <Card className="bg-black/40 border-cyan-500/30 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <Gem className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">456K</div>
              <div className="text-cyan-200 text-sm">NFT Assets</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Virtual Worlds */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Rocket className="w-6 h-6 text-cyan-400" />
              Featured Virtual Worlds
            </h2>
            <div className="grid gap-6">
              {virtualWorlds.map((world, index) => (
                <Card key={index} className="bg-black/40 border-cyan-500/30 backdrop-blur-sm hover:bg-black/60 transition-all cursor-pointer relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-cyan-500 to-blue-500 text-white text-xs px-3 py-1 rounded-bl-lg">
                    {world.status}
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-lg flex items-center justify-center">
                          <Globe className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-1">{world.name}</h3>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4 text-cyan-400" />
                              <span className="text-cyan-200 text-sm">{world.players.toLocaleString()} exploring</span>
                            </div>
                            <Badge variant="secondary" className="bg-cyan-900/30 text-cyan-300 border-cyan-500/30">
                              {world.theme}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white flex-1">
                        Enter World
                      </Button>
                      <Button variant="outline" className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/30">
                        Preview
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* World Creation */}
            <Card className="bg-gradient-to-br from-purple-900/30 to-blue-800/30 border-purple-500/30 backdrop-blur-sm mt-6">
              <CardContent className="p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Building className="w-5 h-5 text-purple-400" />
                  Create Your Own World
                </h3>
                <p className="text-purple-200 text-sm mb-4">
                  Use our world builder tools to create immersive experiences and monetize your creativity.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                    World Builder
                  </Button>
                  <Button variant="outline" className="border-purple-500/30 text-purple-300 hover:bg-purple-900/30">
                    Asset Store
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* My Virtual Assets */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Gem className="w-6 h-6 text-cyan-400" />
                My Assets
              </h2>
              <div className="space-y-3">
                {myAssets.map((asset, index) => (
                  <Card key={index} className="bg-black/40 border-cyan-500/30 backdrop-blur-sm">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="text-white font-medium text-sm">{asset.name}</div>
                          <Badge className="bg-cyan-900/30 text-cyan-300 border-cyan-500/30 text-xs mt-1">
                            {asset.type}
                          </Badge>
                        </div>
                        <div className="text-cyan-400 font-bold text-sm">{asset.value}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Button variant="outline" className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/30 w-full mt-4">
                View All Assets
              </Button>
            </div>

            {/* Upcoming Events */}
            <div>
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                Upcoming Events
              </h3>
              <div className="space-y-3">
                {events.map((event, index) => (
                  <Card key={index} className="bg-black/40 border-cyan-500/30 backdrop-blur-sm">
                    <CardContent className="p-4">
                      <div className="mb-2">
                        <div className="text-white font-medium text-sm">{event.title}</div>
                        <div className="text-cyan-300 text-xs">{event.world}</div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-cyan-200 text-xs">{event.time}</div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-cyan-400" />
                          <span className="text-cyan-200 text-xs">{event.attendees}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <Card className="bg-black/40 border-cyan-500/30 backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Compass className="w-5 h-5 text-cyan-400" />
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <Button variant="outline" className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/30 w-full justify-start">
                    <Map className="w-4 h-4 mr-2" />
                    Explore New Worlds
                  </Button>
                  <Button variant="outline" className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/30 w-full justify-start">
                    <Building className="w-4 h-4 mr-2" />
                    Buy Virtual Land
                  </Button>
                  <Button variant="outline" className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/30 w-full justify-start">
                    <Users className="w-4 h-4 mr-2" />
                    Join Communities
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Avatar Customization */}
            <Card className="bg-gradient-to-br from-pink-900/30 to-purple-800/30 border-pink-500/30 backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Gem className="w-5 h-5 text-pink-400" />
                  Avatar Studio
                </h3>
                <p className="text-pink-200 text-sm mb-4">
                  Customize your metaverse identity with unique skins, accessories, and animations.
                </p>
                <Button className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white w-full">
                  Customize Avatar
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}