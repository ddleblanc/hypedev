"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  Play, Pause, Volume2, VolumeX, Share2, Heart, Plus, Star, TrendingUp,
  Users, Eye, ShoppingCart, Zap, Crown, ChevronDown, ChevronUp, Search,
  Filter, Grid3x3, List, MoreHorizontal, ArrowLeft, Sparkles, Activity,
  X, ExternalLink, Copy, Check, SlidersHorizontal, Info, Shield, Clock,
  Award, Wallet, BarChart3, PieChart, Globe, Twitter, Send,
  AlertCircle, ArrowUpRight, ArrowDownRight, Flame, Diamond, Target,
  Coins, DollarSign, Percent, Hash, Calendar, RefreshCw, Bell, Settings,
  Bookmark, Download, Upload, Image, Layers, Box, Gauge, TrendingDown,
  Link2, Flag, MessageCircle, ThumbsUp, Verified
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CollectionDetailPageProps {
  slug: string;
}

// Enhanced mock data with more realistic marketplace data
const mockCollection = {
  id: "cyber-legends",
  title: "Cyber Legends",
  subtitle: "Futuristic warriors collection",
  description: "Step into the neon-lit streets of Neo Tokyo where cyber-enhanced warriors battle for supremacy.",
  longDescription: "The Cyber Legends collection brings together the most elite warriors from across the digital frontier. Born from the convergence of advanced cybernetics and ancient martial arts, these legendary fighters have transcended the boundaries between the physical and virtual worlds. Each warrior possesses unique abilities, backstories, and visual traits that make them valuable assets in the metaverse.",
  videoUrl: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/9c5398c1-dcde-4d7c-ac6a-33fa6ff5d948/transcode=true,width=450,optimized=true/0e178c0604244fb9a44d5b87c6b2a815.webm",
  bannerImage: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/9c5398c1-dcde-4d7c-ac6a-33fa6ff5d948/original=true,quality=90/cyber-legends-banner.jpg",
  logo: "/api/placeholder/120/120",
  contractAddress: "0x1234567890abcdef1234567890abcdef12345678",
  blockchain: "Ethereum",
  tokenStandard: "ERC-721",
  createdDate: "2024-01-15",
  creator: {
    name: "NeonStudios",
    address: "0xCreator...5678",
    avatar: "/api/placeholder/80/80",
    verified: true,
    followers: "12.5K",
    description: "Award-winning digital art collective specializing in cyberpunk aesthetics"
  },
  stats: {
    totalSupply: 10000,
    owners: 7834,
    uniqueOwners: 6234,
    floorPrice: "2.1",
    floorPriceUSD: 3780,
    ceilingPrice: "125",
    volume24h: "287",
    volume7d: "1.8K",
    volume30d: "5.2K",
    volumeAll: "52.3K",
    volumeChange24h: 24.5,
    volumeChange7d: -12.3,
    avgPrice: "3.7",
    avgPrice24h: "3.2",
    marketCap: "21K",
    listedCount: 1523,
    listedPercentage: 15.23,
    sales24h: 89,
    sales7d: 486,
    royalty: 5,
    bestOffer: "1.95"
  },
  priceHistory: [
    { date: "Jan 1", price: 1.8 },
    { date: "Jan 5", price: 2.1 },
    { date: "Jan 10", price: 2.3 },
    { date: "Jan 15", price: 2.0 },
    { date: "Jan 20", price: 2.4 },
    { date: "Jan 25", price: 2.1 },
  ],
  traits: [
    { 
      name: "Background", 
      values: [
        { trait: "Neon City", count: 2341, percentage: 23.41 },
        { trait: "Cyber Grid", count: 1823, percentage: 18.23 },
        { trait: "Digital Rain", count: 1456, percentage: 14.56 },
        { trait: "Void", count: 892, percentage: 8.92 }
      ]
    },
    { 
      name: "Cybernetics", 
      values: [
        { trait: "Neural Interface", count: 3421, percentage: 34.21 },
        { trait: "Bionic Arms", count: 2156, percentage: 21.56 },
        { trait: "Optic Implants", count: 1823, percentage: 18.23 }
      ]
    },
    { 
      name: "Weapon", 
      values: [
        { trait: "Plasma Blade", count: 523, percentage: 5.23 },
        { trait: "Laser Rifle", count: 892, percentage: 8.92 },
        { trait: "Energy Shield", count: 1234, percentage: 12.34 }
      ]
    },
    { 
      name: "Rarity Tier", 
      values: [
        { trait: "Common", count: 4500, percentage: 45 },
        { trait: "Rare", count: 3000, percentage: 30 },
        { trait: "Epic", count: 1800, percentage: 18 },
        { trait: "Legendary", count: 600, percentage: 6 },
        { trait: "Mythic", count: 100, percentage: 1 }
      ]
    }
  ],
  items: Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    name: `Cyber Legend #${String(i + 1).padStart(4, '0')}`,
    price: (Math.random() * 20 + 1).toFixed(2),
    lastSale: (Math.random() * 15 + 0.5).toFixed(2),
    image: `https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/cyber${(i % 8) + 1}.jpg`,
    rarity: ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'][Math.floor(Math.random() * 5)],
    rank: i + 1,
    likes: Math.floor(Math.random() * 500) + 50,
    owner: `0x${Math.random().toString(16).slice(2, 10)}...`,
    listed: Math.random() > 0.5,
    hasOffer: Math.random() > 0.7,
    offerPrice: (Math.random() * 18 + 0.5).toFixed(2),
    traits: [
      { trait_type: "Background", value: ["Neon City", "Cyber Grid", "Digital Rain"][Math.floor(Math.random() * 3)] },
      { trait_type: "Cybernetics", value: ["Neural Interface", "Bionic Arms", "Optic Implants"][Math.floor(Math.random() * 3)] },
      { trait_type: "Weapon", value: ["Plasma Blade", "Laser Rifle", "Energy Shield"][Math.floor(Math.random() * 3)] }
    ]
  })),
  topHolders: [
    { address: "0xAbc1...2345", amount: 234, percentage: 2.34 },
    { address: "0xDef4...5678", amount: 189, percentage: 1.89 },
    { address: "0xGhi7...9012", amount: 156, percentage: 1.56 },
    { address: "0xJkl0...3456", amount: 134, percentage: 1.34 },
    { address: "0xMno3...7890", amount: 98, percentage: 0.98 }
  ],
  recentActivity: Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    type: ['Sale', 'List', 'Transfer', 'Offer', 'Bid'][Math.floor(Math.random() * 5)],
    item: `Cyber Legend #${String(Math.floor(Math.random() * 10000) + 1).padStart(4, '0')}`,
    price: (Math.random() * 10 + 0.5).toFixed(2),
    from: `0x${Math.random().toString(16).slice(2, 10)}...`,
    to: `0x${Math.random().toString(16).slice(2, 10)}...`,
    timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    txHash: `0x${Math.random().toString(16).slice(2, 66)}`
  })),
  socials: {
    website: "https://cyberlegends.io",
    twitter: "https://twitter.com/cyberlegends",
    discord: "https://discord.gg/cyberlegends",
    medium: "https://medium.com/@cyberlegends"
  }
};

// Reusable Components
const StatCard = ({ title, value, change, icon: Icon, trend }: any) => (
  <Card className="bg-black/40 border-white/10 hover:border-white/20 transition-all">
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-white/60">{title}</p>
        {Icon && <Icon className="w-4 h-4 text-white/40" />}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xl font-bold text-white">{value}</p>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${
            change > 0 ? 'text-green-400' : change < 0 ? 'text-red-400' : 'text-white/60'
          }`}>
            {change > 0 ? <ArrowUpRight className="w-4 h-4" /> : 
             change < 0 ? <ArrowDownRight className="w-4 h-4" /> : null}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-2 h-8">
          <svg className="w-full h-full" viewBox="0 0 100 30">
            <polyline
              fill="none"
              stroke="rgb(163,255,18)"
              strokeWidth="2"
              points={trend}
              opacity="0.5"
            />
          </svg>
        </div>
      )}
    </CardContent>
  </Card>
);

const ItemCard = ({ item, onClick }: { item: any; onClick: () => void }) => (
  <motion.div
    whileHover={{ y: -4 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="group cursor-pointer"
  >
    <Card className="bg-black/40 border-white/10 hover:border-[rgb(163,255,18)]/50 transition-all duration-300 overflow-hidden">
      <div className="relative aspect-square">
        <img 
          src={item.image} 
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
          <Badge className={`text-[10px] px-2 py-0.5 font-bold ${
            item.rarity === 'Mythic' ? 'bg-purple-500' :
            item.rarity === 'Legendary' ? 'bg-orange-500' :
            item.rarity === 'Epic' ? 'bg-purple-400' :
            item.rarity === 'Rare' ? 'bg-blue-500' :
            'bg-gray-500'
          }`}>
            {item.rarity}
          </Badge>
          <Badge className="bg-black/60 text-white text-[10px]">
            #{item.rank}
          </Badge>
        </div>

        {/* Hover Actions */}
        <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 bg-white text-black hover:bg-white/90 h-8 text-xs">
              Buy Now
            </Button>
            <Button size="icon" variant="ghost" className="bg-black/60 text-white h-8 w-8">
              <Heart className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
      
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-bold text-white truncate">{item.name}</p>
          {item.hasOffer && (
            <Badge className="bg-blue-500/20 text-blue-400 text-[10px] px-1">
              Offer
            </Badge>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white/60">Price</p>
            <p className="text-sm font-bold text-[rgb(163,255,18)]">{item.price} ETH</p>
          </div>
          {item.lastSale && (
            <div className="text-right">
              <p className="text-xs text-white/60">Last Sale</p>
              <p className="text-xs text-white/80">{item.lastSale} ETH</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

export function CollectionDetailPage({ slug }: CollectionDetailPageProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('price-low');
  const [filterRarity, setFilterRarity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 100]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  const router = useRouter();
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

  const copyAddress = () => {
    navigator.clipboard.writeText(mockCollection.contractAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: mockCollection.title,
        text: mockCollection.description,
        url: window.location.href
      });
    }
  };

  // Filter items based on search and filters
  const filteredItems = mockCollection.items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRarity = filterRarity === 'all' || item.rarity.toLowerCase() === filterRarity;
    const matchesPrice = parseFloat(item.price) >= priceRange[0] && parseFloat(item.price) <= priceRange[1];
    return matchesSearch && matchesRarity && matchesPrice;
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'price-low': return parseFloat(a.price) - parseFloat(b.price);
      case 'price-high': return parseFloat(b.price) - parseFloat(a.price);
      case 'rarity': {
        const rarityOrder = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'];
        return rarityOrder.indexOf(b.rarity) - rarityOrder.indexOf(a.rarity);
      }
      case 'rank': return a.rank - b.rank;
      case 'recent': return b.id - a.id;
      default: return 0;
    }
  });

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
          className="relative h-[50vh] md:h-[60vh] overflow-hidden"
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
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
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
            <div>
              {/* Creator Info */}
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src={mockCollection.creator.avatar}
                  alt={mockCollection.creator.name}
                  className="w-10 h-10 rounded-full border-2 border-white/20"
                />
                <div className="flex items-center gap-2">
                  <p className="text-white/80">Created by</p>
                  <p className="text-white font-bold">{mockCollection.creator.name}</p>
                  {mockCollection.creator.verified && (
                    <Verified className="w-4 h-4 text-blue-400 fill-current" />
                  )}
                </div>
              </div>

              {/* Title & Description */}
              <h1 className="text-4xl md:text-6xl font-black text-white mb-3">
                {mockCollection.title}
              </h1>
              <p className="text-lg text-white/90 mb-6">
                {mockCollection.description}
              </p>

              {/* Quick Stats */}
              <div className="flex flex-wrap items-center gap-6 mb-6">
                <div>
                  <p className="text-sm text-white/60">Floor Price</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-[rgb(163,255,18)]">
                      {mockCollection.stats.floorPrice} ETH
                    </p>
                    <p className="text-sm text-white/60">
                      ${mockCollection.stats.floorPriceUSD.toLocaleString()}
                    </p>
                  </div>
                </div>
                <Separator orientation="vertical" className="h-12 bg-white/20" />
                <div>
                  <p className="text-sm text-white/60">Total Volume</p>
                  <p className="text-2xl font-bold text-white">
                    {mockCollection.stats.volumeAll} ETH
                  </p>
                </div>
                <Separator orientation="vertical" className="h-12 bg-white/20" />
                <div>
                  <p className="text-sm text-white/60">Items</p>
                  <p className="text-2xl font-bold text-white">
                    {mockCollection.stats.totalSupply.toLocaleString()}
                  </p>
                </div>
                <Separator orientation="vertical" className="h-12 bg-white/20" />
                <div>
                  <p className="text-sm text-white/60">Owners</p>
                  <p className="text-2xl font-bold text-white">
                    {mockCollection.stats.owners.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <Button 
                  size="lg"
                  className="bg-white text-black hover:bg-white/90 font-bold"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Buy Now
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
                  onClick={handleShare}
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
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Main Content */}
        <div className="relative bg-black">
          {/* Tab Navigation */}
          <div className="sticky top-0 z-20 bg-black/95 backdrop-blur-lg border-b border-white/10">
            <div className="px-4 md:px-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-transparent border-0 h-auto p-0 w-full justify-start overflow-x-auto">
                  <TabsTrigger 
                    value="overview" 
                    className="text-white/60 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-[rgb(163,255,18)] rounded-none px-6 py-4"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger 
                    value="items" 
                    className="text-white/60 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-[rgb(163,255,18)] rounded-none px-6 py-4"
                  >
                    <Grid3x3 className="w-4 h-4 mr-2" />
                    Items
                  </TabsTrigger>
                  <TabsTrigger 
                    value="analytics" 
                    className="text-white/60 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-[rgb(163,255,18)] rounded-none px-6 py-4"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Analytics
                  </TabsTrigger>
                  <TabsTrigger 
                    value="activity" 
                    className="text-white/60 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-[rgb(163,255,18)] rounded-none px-6 py-4"
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    Activity
                  </TabsTrigger>
                  <TabsTrigger 
                    value="holders" 
                    className="text-white/60 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-[rgb(163,255,18)] rounded-none px-6 py-4"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Holders
                  </TabsTrigger>
                </TabsList>

                {/* Tab Contents */}
                <div className="py-8">
                  {/* Overview Tab */}
                  <TabsContent value="overview" className="mt-0 space-y-8">
                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      <StatCard 
                        title="Floor Price" 
                        value={`${mockCollection.stats.floorPrice} ETH`}
                        change={mockCollection.stats.volumeChange24h}
                        icon={Coins}
                      />
                      <StatCard 
                        title="24h Volume" 
                        value={`${mockCollection.stats.volume24h} ETH`}
                        change={mockCollection.stats.volumeChange24h}
                        icon={Activity}
                      />
                      <StatCard 
                        title="7d Volume" 
                        value={`${mockCollection.stats.volume7d} ETH`}
                        change={mockCollection.stats.volumeChange7d}
                        icon={TrendingUp}
                      />
                      <StatCard 
                        title="Market Cap" 
                        value={`${mockCollection.stats.marketCap} ETH`}
                        icon={DollarSign}
                      />
                      <StatCard 
                        title="Listed" 
                        value={mockCollection.stats.listedCount.toLocaleString()}
                        change={mockCollection.stats.listedPercentage}
                        icon={ShoppingCart}
                      />
                      <StatCard 
                        title="Unique Owners" 
                        value={mockCollection.stats.uniqueOwners.toLocaleString()}
                        icon={Users}
                      />
                    </div>

                    {/* About Section */}
                    <Card className="bg-black/40 border-white/10">
                      <CardHeader>
                        <CardTitle className="text-white">About {mockCollection.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-white/80 leading-relaxed">
                          {mockCollection.longDescription}
                        </p>
                        
                        <Separator className="bg-white/10" />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <p className="text-sm text-white/60">Contract Address</p>
                            <div className="flex items-center gap-2">
                              <code className="text-xs text-white font-mono">
                                {mockCollection.contractAddress.slice(0, 6)}...{mockCollection.contractAddress.slice(-4)}
                              </code>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-6 w-6 text-white/60 hover:text-white"
                                onClick={copyAddress}
                              >
                                {copiedAddress ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm text-white/60">Blockchain</p>
                            <p className="text-sm text-white font-medium">{mockCollection.blockchain}</p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm text-white/60">Token Standard</p>
                            <p className="text-sm text-white font-medium">{mockCollection.tokenStandard}</p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm text-white/60">Creator Royalty</p>
                            <p className="text-sm text-white font-medium">{mockCollection.stats.royalty}%</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Traits Distribution */}
                    <Card className="bg-black/40 border-white/10">
                      <CardHeader>
                        <CardTitle className="text-white">Traits & Rarity</CardTitle>
                        <CardDescription className="text-white/60">
                          Distribution of traits across the collection
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {mockCollection.traits.map((trait) => (
                            <div key={trait.name} className="space-y-3">
                              <h4 className="text-white font-medium flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-[rgb(163,255,18)]" />
                                {trait.name}
                              </h4>
                              <div className="space-y-2">
                                {trait.values.map((value) => (
                                  <div key={value.trait} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 flex-1">
                                      <span className="text-sm text-white/80">{value.trait}</span>
                                      <Badge variant="outline" className="text-[10px] border-white/20 text-white/60">
                                        {value.count}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Progress 
                                        value={value.percentage} 
                                        className="w-24 h-2 bg-white/10"
                                      />
                                      <span className="text-xs text-white/60 w-12 text-right">
                                        {value.percentage}%
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Items Tab */}
                  <TabsContent value="items" className="mt-0 space-y-6">
                    {/* Filters Bar */}
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <p className="text-white/70">
                          {sortedItems.length} items
                        </p>
                        {searchQuery && (
                          <Badge className="bg-white/10 text-white/80">
                            Searching: "{searchQuery}"
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Search */}
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 w-4 h-4" />
                          <Input
                            placeholder="Search items..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 bg-black/40 border-white/20 text-white placeholder:text-white/40 w-64"
                          />
                        </div>

                        {/* Sort */}
                        <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger className="w-40 bg-black/40 border-white/20 text-white">
                            <SelectValue placeholder="Sort by" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="price-low">Price: Low to High</SelectItem>
                            <SelectItem value="price-high">Price: High to Low</SelectItem>
                            <SelectItem value="rarity">Rarity</SelectItem>
                            <SelectItem value="rank">Rank</SelectItem>
                            <SelectItem value="recent">Recently Listed</SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Rarity Filter */}
                        <Select value={filterRarity} onValueChange={setFilterRarity}>
                          <SelectTrigger className="w-32 bg-black/40 border-white/20 text-white">
                            <SelectValue placeholder="All Rarities" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Rarities</SelectItem>
                            <SelectItem value="common">Common</SelectItem>
                            <SelectItem value="rare">Rare</SelectItem>
                            <SelectItem value="epic">Epic</SelectItem>
                            <SelectItem value="legendary">Legendary</SelectItem>
                            <SelectItem value="mythic">Mythic</SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Advanced Filters */}
                        <Button
                          variant="outline"
                          className="border-white/20 text-white hover:bg-white/10"
                          onClick={() => setShowFilters(!showFilters)}
                        >
                          <SlidersHorizontal className="w-4 h-4 mr-2" />
                          Filters
                          {selectedTraits.length > 0 && (
                            <Badge className="ml-2 bg-[rgb(163,255,18)] text-black">
                              {selectedTraits.length}
                            </Badge>
                          )}
                        </Button>

                        {/* View Mode */}
                        <div className="flex items-center gap-1 bg-black/40 rounded-lg p-1">
                          <Button
                            size="icon"
                            variant={viewMode === 'grid' ? 'default' : 'ghost'}
                            className="h-8 w-8"
                            onClick={() => setViewMode('grid')}
                          >
                            <Grid3x3 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant={viewMode === 'list' ? 'default' : 'ghost'}
                            className="h-8 w-8"
                            onClick={() => setViewMode('list')}
                          >
                            <List className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Advanced Filters Panel */}
                    <AnimatePresence>
                      {showFilters && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Card className="bg-black/40 border-white/10">
                            <CardContent className="pt-6">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Price Range */}
                                <div className="space-y-3">
                                  <Label className="text-white">Price Range (ETH)</Label>
                                  <Slider
                                    value={priceRange}
                                    onValueChange={setPriceRange}
                                    max={100}
                                    step={0.1}
                                    className="w-full"
                                  />
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-white/60">{priceRange[0]} ETH</span>
                                    <span className="text-sm text-white/60">{priceRange[1]} ETH</span>
                                  </div>
                                </div>

                                {/* Trait Filters */}
                                {mockCollection.traits.slice(0, 2).map((trait) => (
                                  <div key={trait.name} className="space-y-3">
                                    <Label className="text-white">{trait.name}</Label>
                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                      {trait.values.map((value) => (
                                        <label key={value.trait} className="flex items-center gap-2 cursor-pointer">
                                          <input
                                            type="checkbox"
                                            className="rounded border-white/20 bg-black/40 text-[rgb(163,255,18)]"
                                            checked={selectedTraits.includes(value.trait)}
                                            onChange={(e) => {
                                              if (e.target.checked) {
                                                setSelectedTraits([...selectedTraits, value.trait]);
                                              } else {
                                                setSelectedTraits(selectedTraits.filter(t => t !== value.trait));
                                              }
                                            }}
                                          />
                                          <span className="text-sm text-white/80">{value.trait}</span>
                                          <Badge variant="outline" className="ml-auto text-[10px] border-white/20 text-white/60">
                                            {value.count}
                                          </Badge>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              
                              <div className="flex items-center justify-end gap-3 mt-6">
                                <Button
                                  variant="outline"
                                  className="border-white/20 text-white hover:bg-white/10"
                                  onClick={() => {
                                    setSelectedTraits([]);
                                    setPriceRange([0, 100]);
                                    setFilterRarity('all');
                                  }}
                                >
                                  Clear All
                                </Button>
                                <Button
                                  className="bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90"
                                  onClick={() => setShowFilters(false)}
                                >
                                  Apply Filters
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Items Grid */}
                    <div className={`grid gap-4 ${
                      viewMode === 'grid' 
                        ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' 
                        : 'grid-cols-1'
                    }`}>
                      {sortedItems.map((item, index) => (
                        viewMode === 'grid' ? (
                          <ItemCard 
                            key={item.id} 
                            item={item} 
                            onClick={() => console.log('Open item:', item.id)}
                          />
                        ) : (
                          <Card key={item.id} className="bg-black/40 border-white/10 hover:border-white/20 transition-all">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-4">
                                <img 
                                  src={item.image} 
                                  alt={item.name}
                                  className="w-20 h-20 rounded-lg object-cover"
                                />
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                                  <div className="md:col-span-2">
                                    <p className="font-bold text-white">{item.name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge className={`text-[10px] ${
                                        item.rarity === 'Mythic' ? 'bg-purple-500' :
                                        item.rarity === 'Legendary' ? 'bg-orange-500' :
                                        item.rarity === 'Epic' ? 'bg-purple-400' :
                                        item.rarity === 'Rare' ? 'bg-blue-500' :
                                        'bg-gray-500'
                                      }`}>
                                        {item.rarity}
                                      </Badge>
                                      <span className="text-xs text-white/60">Rank #{item.rank}</span>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-xs text-white/60">Price</p>
                                    <p className="font-bold text-[rgb(163,255,18)]">{item.price} ETH</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-white/60">Last Sale</p>
                                    <p className="text-sm text-white">{item.lastSale} ETH</p>
                                  </div>
                                  <div className="flex items-center gap-2 justify-end">
                                    <Button size="sm" className="bg-white text-black hover:bg-white/90">
                                      Buy Now
                                    </Button>
                                    <Button size="icon" variant="ghost" className="text-white/60 hover:text-white">
                                      <Heart className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      ))}
                    </div>

                    {sortedItems.length === 0 && (
                      <Card className="bg-black/40 border-white/10">
                        <CardContent className="py-12 text-center">
                          <Search className="w-12 h-12 text-white/40 mx-auto mb-4" />
                          <p className="text-white/60">No items found matching your filters</p>
                          <Button
                            variant="outline"
                            className="mt-4 border-white/20 text-white hover:bg-white/10"
                            onClick={() => {
                              setSearchQuery('');
                              setSelectedTraits([]);
                              setPriceRange([0, 100]);
                              setFilterRarity('all');
                            }}
                          >
                            Clear Filters
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  {/* Analytics Tab */}
                  <TabsContent value="analytics" className="mt-0 space-y-6">
                    {/* Time Range Selector */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-white">Performance Analytics</h3>
                      <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                        <SelectTrigger className="w-32 bg-black/40 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="24h">24 Hours</SelectItem>
                          <SelectItem value="7d">7 Days</SelectItem>
                          <SelectItem value="30d">30 Days</SelectItem>
                          <SelectItem value="all">All Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Price Chart */}
                      <Card className="bg-black/40 border-white/10">
                        <CardHeader>
                          <CardTitle className="text-white">Floor Price History</CardTitle>
                          <CardDescription className="text-white/60">
                            Price movement over the selected period
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="h-64 flex items-center justify-center text-white/40">
                            [Price Chart Visualization]
                          </div>
                        </CardContent>
                      </Card>

                      {/* Volume Chart */}
                      <Card className="bg-black/40 border-white/10">
                        <CardHeader>
                          <CardTitle className="text-white">Trading Volume</CardTitle>
                          <CardDescription className="text-white/60">
                            Daily volume in ETH
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="h-64 flex items-center justify-center text-white/40">
                            [Volume Chart Visualization]
                          </div>
                        </CardContent>
                      </Card>

                      {/* Sales Distribution */}
                      <Card className="bg-black/40 border-white/10">
                        <CardHeader>
                          <CardTitle className="text-white">Sales Distribution</CardTitle>
                          <CardDescription className="text-white/60">
                            Price distribution of recent sales
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="h-64 flex items-center justify-center text-white/40">
                            [Distribution Chart]
                          </div>
                        </CardContent>
                      </Card>

                      {/* Holder Distribution */}
                      <Card className="bg-black/40 border-white/10">
                        <CardHeader>
                          <CardTitle className="text-white">Holder Distribution</CardTitle>
                          <CardDescription className="text-white/60">
                            Distribution of items among holders
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-white/80">1 item</span>
                              <div className="flex items-center gap-2">
                                <Progress value={65} className="w-32 h-2 bg-white/10" />
                                <span className="text-xs text-white/60 w-12 text-right">65%</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-white/80">2-5 items</span>
                              <div className="flex items-center gap-2">
                                <Progress value={25} className="w-32 h-2 bg-white/10" />
                                <span className="text-xs text-white/60 w-12 text-right">25%</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-white/80">6-10 items</span>
                              <div className="flex items-center gap-2">
                                <Progress value={7} className="w-32 h-2 bg-white/10" />
                                <span className="text-xs text-white/60 w-12 text-right">7%</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-white/80">10+ items</span>
                              <div className="flex items-center gap-2">
                                <Progress value={3} className="w-32 h-2 bg-white/10" />
                                <span className="text-xs text-white/60 w-12 text-right">3%</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Key Insights */}
                    <Card className="bg-black/40 border-white/10">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-[rgb(163,255,18)]" />
                          Key Insights
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-green-500/20 rounded-lg">
                              <TrendingUp className="w-4 h-4 text-green-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">Rising Floor Price</p>
                              <p className="text-xs text-white/60">Floor increased 24% in last 7 days</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                              <Users className="w-4 h-4 text-blue-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">Growing Community</p>
                              <p className="text-xs text-white/60">312 new holders this week</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-purple-500/20 rounded-lg">
                              <Diamond className="w-4 h-4 text-purple-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">Rare Items Trading</p>
                              <p className="text-xs text-white/60">Mythic items averaging 45 ETH</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Activity Tab */}
                  <TabsContent value="activity" className="mt-0 space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-white">Recent Activity</h3>
                      <Button
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                      </Button>
                    </div>

                    <Card className="bg-black/40 border-white/10">
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-white/10">
                                <th className="text-left text-sm font-medium text-white/60 p-4">Event</th>
                                <th className="text-left text-sm font-medium text-white/60 p-4">Item</th>
                                <th className="text-left text-sm font-medium text-white/60 p-4">Price</th>
                                <th className="text-left text-sm font-medium text-white/60 p-4">From</th>
                                <th className="text-left text-sm font-medium text-white/60 p-4">To</th>
                                <th className="text-left text-sm font-medium text-white/60 p-4">Time</th>
                              </tr>
                            </thead>
                            <tbody>
                              {mockCollection.recentActivity.map((activity) => (
                                <tr key={activity.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                  <td className="p-4">
                                    <Badge className={`${
                                      activity.type === 'Sale' ? 'bg-green-500/20 text-green-400' :
                                      activity.type === 'List' ? 'bg-blue-500/20 text-blue-400' :
                                      activity.type === 'Transfer' ? 'bg-purple-500/20 text-purple-400' :
                                      activity.type === 'Offer' ? 'bg-orange-500/20 text-orange-400' :
                                      'bg-gray-500/20 text-gray-400'
                                    }`}>
                                      {activity.type}
                                    </Badge>
                                  </td>
                                  <td className="p-4">
                                    <p className="text-white font-medium">{activity.item}</p>
                                  </td>
                                  <td className="p-4">
                                    <p className="text-[rgb(163,255,18)] font-bold">{activity.price} ETH</p>
                                  </td>
                                  <td className="p-4">
                                    <p className="text-white/80 font-mono text-sm">{activity.from}</p>
                                  </td>
                                  <td className="p-4">
                                    <p className="text-white/80 font-mono text-sm">{activity.to}</p>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Holders Tab */}
                  <TabsContent value="holders" className="mt-0 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Top Holders List */}
                      <div className="lg:col-span-2">
                        <Card className="bg-black/40 border-white/10">
                          <CardHeader>
                            <CardTitle className="text-white">Top Holders</CardTitle>
                            <CardDescription className="text-white/60">
                              Largest holders in the collection
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {mockCollection.topHolders.map((holder, index) => (
                                <div key={holder.address} className="flex items-center justify-between p-3 bg-black/40 rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                                      <span className="text-white text-xs font-bold">#{index + 1}</span>
                                    </div>
                                    <div>
                                      <p className="text-white font-mono text-sm">{holder.address}</p>
                                      <p className="text-white/60 text-xs">
                                        {holder.amount} items ({holder.percentage}%)
                                      </p>
                                    </div>
                                  </div>
                                  <Button size="sm" variant="ghost" className="text-white/60 hover:text-white">
                                    <ExternalLink className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Holder Stats */}
                      <div>
                        <Card className="bg-black/40 border-white/10">
                          <CardHeader>
                            <CardTitle className="text-white">Holder Statistics</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-white/60">Total Holders</span>
                                <span className="text-sm font-bold text-white">
                                  {mockCollection.stats.owners.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-white/60">Unique Holders</span>
                                <span className="text-sm font-bold text-white">
                                  {mockCollection.stats.uniqueOwners.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-white/60">Average per Holder</span>
                                <span className="text-sm font-bold text-white">
                                  {(mockCollection.stats.totalSupply / mockCollection.stats.owners).toFixed(2)}
                                </span>
                              </div>
                            </div>
                            
                            <Separator className="bg-white/10" />
                            
                            <div className="space-y-2">
                              <p className="text-sm text-white/60 mb-2">Holder Growth</p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-white/60">24h</span>
                                <span className="text-xs text-green-400">+2.3%</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-white/60">7d</span>
                                <span className="text-xs text-green-400">+5.8%</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-white/60">30d</span>
                                <span className="text-xs text-green-400">+12.4%</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
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