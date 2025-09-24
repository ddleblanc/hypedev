"use client";

import React, { useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { 
  Play,
  Pause,
  Volume2,
  VolumeX,
  Share2,
  Heart,
  Plus,
  Filter,
  Grid3x3,
  List,
  ArrowLeft,
  ExternalLink,
  Star,
  TrendingUp,
  Users,
  Eye,
  ShoppingCart,
  Zap,
  Crown,
  ChevronDown,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface CollectionDetailProps {
  collectionId: string;
  onBack: () => void;
}

const mockCollection = {
  id: "cyber-legends",
  title: "Cyber Legends",
  subtitle: "Futuristic warriors collection",
  description: "Step into the neon-lit streets of Neo Tokyo where cyber-enhanced warriors battle for supremacy. Each NFT in this collection represents a unique character with distinct abilities, weapons, and backstories that shape the future of digital warfare.",
  longDescription: "The Cyber Legends collection brings together the most elite warriors from across the digital frontier. Born from the convergence of advanced cybernetics and ancient martial arts, these legendary fighters have transcended the boundaries between the physical and virtual worlds. Each piece tells a story of honor, technology, and the eternal struggle between order and chaos in a world where data flows like blood through silicon veins.",
  videoUrl: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/9c5398c1-dcde-4d7c-ac6a-33fa6ff5d948/transcode=true,width=450,optimized=true/0e178c0604244fb9a44d5b87c6b2a815.webm",
  logo: "/api/placeholder/300/120",
  creator: {
    name: "NeonStudios",
    avatar: "/api/placeholder/80/80",
    verified: true,
    followers: "12.5K"
  },
  stats: {
    totalSupply: 10000,
    owners: 7834,
    floorPrice: "2.1 ETH",
    volume: "5.2K ETH",
    volumeChange: "+24%",
    avgPrice: "3.7 ETH",
    marketCap: "21K ETH",
    listed: "15%"
  },
  traits: [
    { name: "Background", rarity: "Common", percentage: "45%" },
    { name: "Cybernetics", rarity: "Rare", percentage: "12%" },
    { name: "Weapon Type", rarity: "Epic", percentage: "3%" },
    { name: "Aura Effect", rarity: "Legendary", percentage: "0.5%" }
  ],
  items: [
    { id: 1, name: "Cyber Samurai #001", price: "15.7 ETH", image: "/api/placeholder/400/400", rarity: "Legendary", likes: 392, lastSale: "12.1 ETH" },
    { id: 2, name: "Neon Warrior #156", price: "8.9 ETH", image: "/api/placeholder/400/400", rarity: "Epic", likes: 287, lastSale: "7.2 ETH" },
    { id: 3, name: "Data Knight #892", price: "22.1 ETH", image: "/api/placeholder/400/400", rarity: "Mythic", likes: 521, lastSale: "18.9 ETH" },
    { id: 4, name: "Pixel Ronin #445", price: "12.3 ETH", image: "/api/placeholder/400/400", rarity: "Rare", likes: 341, lastSale: "10.8 ETH" },
    { id: 5, name: "Chrome Ninja #223", price: "6.7 ETH", image: "/api/placeholder/400/400", rarity: "Common", likes: 198, lastSale: "5.9 ETH" },
    { id: 6, name: "Quantum Ghost #667", price: "31.2 ETH", image: "/api/placeholder/400/400", rarity: "Mythic", likes: 672, lastSale: "28.4 ETH" },
    { id: 7, name: "Binary Blade #334", price: "9.8 ETH", image: "/api/placeholder/400/400", rarity: "Epic", likes: 445, lastSale: "8.3 ETH" },
    { id: 8, name: "Neo Sentinel #778", price: "14.5 ETH", image: "/api/placeholder/400/400", rarity: "Legendary", likes: 389, lastSale: "12.7 ETH" }
  ]
};

export function CollectionDetail({ collectionId, onBack }: CollectionDetailProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('price-low');
  const [filterRarity, setFilterRarity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const heroRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full overflow-hidden bg-black"
    >
      <div className="relative">
        {/* Hero Section */}
        <motion.div
          ref={heroRef}
          className="relative h-[60vh] md:h-[70vh] overflow-hidden"
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
              <source src={mockCollection.videoUrl} type="video/webm" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
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
              <Button
                variant="ghost"
                onClick={onBack}
                className="text-white hover:bg-white/20 flex items-center gap-2"
              >
                <ArrowLeft className="h-5 w-5" />
                Back to Marketplace
              </Button>
              
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                  <Share2 className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                  <Heart className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                  <ExternalLink className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Hero Content */}
          <motion.div
            style={{ opacity: heroOpacity }}
            className="absolute bottom-0 left-0 right-0 p-4 md:p-8 pb-12 md:pb-20"
          >
            <div className="max-w-4xl">
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="mb-6"
              >
                <img 
                  src={mockCollection.logo} 
                  alt={mockCollection.title}
                  className="h-12 md:h-16 mb-4 object-contain"
                />
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <Badge className="bg-[rgb(163,255,18)] text-black font-semibold px-3 py-1">
                    Top Collection
                  </Badge>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="text-white/80 ml-2">4.9</span>
                  </div>
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                    {mockCollection.creator.verified ? 'Verified Creator' : 'Creator'}
                  </Badge>
                </div>
              </motion.div>

              <motion.h1
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="text-4xl md:text-6xl font-bold text-white mb-4"
              >
                {mockCollection.title}
              </motion.h1>

              <motion.p
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="text-lg md:text-xl text-white/90 mb-6 leading-relaxed max-w-3xl"
              >
                {mockCollection.description}
              </motion.p>

              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="flex flex-wrap items-center gap-3 md:gap-4"
              >
                <Button className="bg-white text-black hover:bg-white/90 font-bold px-6 md:px-8 py-2 md:py-3 rounded-lg flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 md:h-5 md:w-5" />
                  Buy Now
                </Button>
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 font-bold px-6 md:px-8 py-2 md:py-3 rounded-lg flex items-center gap-2">
                  <Plus className="h-4 w-4 md:h-5 md:w-5" />
                  Add to Watchlist
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/20 rounded-full p-3"
                  onClick={togglePlayPause}
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" fill="currentColor" />}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/20 rounded-full p-3"
                  onClick={toggleMute}
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
              </motion.div>

              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.8 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mt-8 text-white/80"
              >
                <div>
                  <span className="text-xs md:text-sm uppercase tracking-wide text-white/60">Floor Price</span>
                  <p className="text-lg md:text-xl font-bold text-[rgb(163,255,18)]">{mockCollection.stats.floorPrice}</p>
                </div>
                <div>
                  <span className="text-xs md:text-sm uppercase tracking-wide text-white/60">Total Volume</span>
                  <p className="text-lg md:text-xl font-bold">{mockCollection.stats.volume}</p>
                </div>
                <div>
                  <span className="text-xs md:text-sm uppercase tracking-wide text-white/60">Items</span>
                  <p className="text-lg md:text-xl font-bold">{mockCollection.stats.totalSupply.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-xs md:text-sm uppercase tracking-wide text-white/60">Owners</span>
                  <p className="text-lg md:text-xl font-bold">{mockCollection.stats.owners.toLocaleString()}</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Collection Stats */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="px-4 md:px-8 py-8 md:py-12 bg-gradient-to-b from-black/50 to-black"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { label: "Market Cap", value: mockCollection.stats.marketCap, change: "+12.5%", icon: TrendingUp },
              { label: "Avg Price", value: mockCollection.stats.avgPrice, change: "+8.2%", icon: Zap },
              { label: "Listed", value: mockCollection.stats.listed, change: "-2.1%", icon: Eye },
              { label: "Unique Owners", value: `${((mockCollection.stats.owners / mockCollection.stats.totalSupply) * 100).toFixed(1)}%`, change: "+1.8%", icon: Users }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.6 }}
                className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center"
              >
                <stat.icon className="h-8 w-8 mx-auto mb-3 text-[rgb(163,255,18)]" />
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-1">{stat.value}</h3>
                <p className="text-white/60 text-sm mb-2">{stat.label}</p>
                <p className={`text-sm font-semibold ${
                  stat.change.startsWith('+') ? 'text-green-400' : 'text-red-400'
                }`}>
                  {stat.change}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Creator & Description Section */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="px-4 md:px-8 py-8 md:py-12"
        >
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {/* Creator Info */}
            <div className="md:col-span-1">
              <motion.div
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-6"
              >
                <h3 className="text-xl font-bold text-white mb-4">Creator</h3>
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={mockCollection.creator.avatar}
                    alt={mockCollection.creator.name}
                    className="w-16 h-16 rounded-full"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-bold text-white">{mockCollection.creator.name}</h4>
                      {mockCollection.creator.verified && (
                        <Crown className="h-5 w-5 text-[rgb(163,255,18)]" />
                      )}
                    </div>
                    <p className="text-white/60">{mockCollection.creator.followers} followers</p>
                  </div>
                </div>
                <Button className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20">
                  Follow Creator
                </Button>
              </motion.div>

              {/* Traits */}
              <motion.div
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="mt-6 bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-6"
              >
                <h3 className="text-xl font-bold text-white mb-4">Traits</h3>
                <div className="space-y-3">
                  {mockCollection.traits.map((trait, index) => (
                    <div key={trait.name} className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{trait.name}</p>
                        <p className="text-white/60 text-sm">{trait.rarity}</p>
                      </div>
                      <Badge className="bg-white/10 text-white">
                        {trait.percentage}
                      </Badge>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <motion.div
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
              >
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">About {mockCollection.title}</h3>
                <p className="text-white/80 text-lg leading-relaxed mb-6">
                  {mockCollection.longDescription}
                </p>
                
                {/* Additional Stats */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-8 w-8 text-green-400" />
                      <div>
                        <p className="text-white/60 text-sm">24h Volume</p>
                        <p className="text-white font-bold text-lg">{mockCollection.stats.volume}</p>
                        <p className="text-green-400 text-sm font-semibold">{mockCollection.stats.volumeChange}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <Eye className="h-8 w-8 text-blue-400" />
                      <div>
                        <p className="text-white/60 text-sm">Listed Items</p>
                        <p className="text-white font-bold text-lg">{mockCollection.stats.listed}</p>
                        <p className="text-white/60 text-sm">of total supply</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Items Grid */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="px-4 md:px-8 py-8 md:py-12 bg-gradient-to-b from-transparent to-black/20"
        >
          {/* Filters & Controls */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Collection Items</h2>
              <p className="text-white/70">{mockCollection.items.length} items available</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 h-4 w-4" />
                <Input
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-black/40 border-white/20 text-white placeholder:text-white/60 w-64"
                />
              </div>
              
              <select 
                value={filterRarity}
                onChange={(e) => setFilterRarity(e.target.value)}
                className="bg-black/40 border border-white/20 text-white rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">All Rarities</option>
                <option value="common">Common</option>
                <option value="rare">Rare</option>
                <option value="epic">Epic</option>
                <option value="legendary">Legendary</option>
                <option value="mythic">Mythic</option>
              </select>
              
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-black/40 border border-white/20 text-white rounded-lg px-3 py-2 text-sm"
              >
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rarity">Rarity</option>
                <option value="likes">Most Liked</option>
                <option value="recent">Recently Listed</option>
              </select>
              
              <div className="flex items-center gap-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className="text-white"
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                  className="text-white"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* NFT Items Grid */}
          <div className={`grid gap-4 md:gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' 
              : 'grid-cols-1'
          }`}>
            {mockCollection.items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index, duration: 0.6 }}
                whileHover={{ scale: viewMode === 'grid' ? 1.03 : 1.01, y: viewMode === 'grid' ? -5 : 0 }}
                className="group cursor-pointer"
              >
                <div className={`bg-black/40 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 rounded-xl overflow-hidden ${
                  viewMode === 'list' ? 'flex items-center p-4 gap-4' : ''
                }`}>
                  <div className={`relative ${
                    viewMode === 'grid' ? 'aspect-square' : 'w-20 h-20 flex-shrink-0'
                  }`}>
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    {/* Rarity Badge */}
                    <div className="absolute top-2 left-2">
                      <Badge className={`text-xs px-2 py-1 ${
                        item.rarity === 'Mythic' ? 'bg-purple-500/90 text-white' :
                        item.rarity === 'Legendary' ? 'bg-orange-500/90 text-white' :
                        item.rarity === 'Epic' ? 'bg-purple-400/90 text-white' :
                        item.rarity === 'Rare' ? 'bg-blue-500/90 text-white' :
                        'bg-gray-500/90 text-white'
                      }`}>
                        {item.rarity}
                      </Badge>
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="h-8 w-8 bg-black/60 hover:bg-black/80 text-white">
                        <Heart className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 bg-black/60 hover:bg-black/80 text-white">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className={`${viewMode === 'grid' ? 'p-4' : 'flex-1'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-white text-sm md:text-base truncate">{item.name}</h3>
                        <p className="text-white/60 text-xs">Last sale: {item.lastSale}</p>
                      </div>
                      {viewMode === 'grid' && (
                        <div className="flex items-center gap-1 text-white/60">
                          <Heart className="h-3 w-3" />
                          <span className="text-xs">{item.likes}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[rgb(163,255,18)] font-bold text-sm md:text-lg">{item.price}</p>
                      </div>
                      <Button size="sm" className="bg-white text-black hover:bg-white/90 text-xs md:text-sm">
                        Buy Now
                      </Button>
                    </div>
                    
                    {viewMode === 'list' && (
                      <div className="flex items-center gap-4 mt-2 text-white/60 text-sm">
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          <span>{item.likes}</span>
                        </div>
                        <span>•</span>
                        <span>{item.rarity}</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Load More */}
          <div className="flex justify-center mt-12">
            <Button 
              variant="outline" 
              className="border-white/20 text-white hover:bg-white/10 px-8 py-3"
            >
              Load More Items
            </Button>
          </div>
        </motion.section>
      </div>
    </motion.div>
  );
}