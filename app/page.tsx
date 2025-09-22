"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  TrendingUp, 
  Zap, 
  Crown, 
  Users, 
  BarChart3, 
  Gamepad2, 
  Trophy, 
  Star, 
  ArrowRight, 
  Shield, 
  ChevronRight, 
  Activity,
  Flame,
  Clock,
  Rocket,
  DollarSign,
  ExternalLink,
  Gem,
  Target,
  Coins,
  Globe,
  Play,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Filter,
  Search,
  Tag
} from "lucide-react";
import { ConnectButton } from "thirdweb/react";
import { cn } from "@/lib/utils";
import { client } from "@/lib/thirdweb";
import { useWalletAuthOptimized } from "@/hooks/use-wallet-auth-optimized";
import { HomeRouter } from "@/components/home-router";
import { HomeView } from "@/components/authenticated-homescreen/home-view";
import { useRouter } from "next/navigation";

const heroNFTs = [
  {
    id: 1,
    name: "Genesis Dragon #001",
    collection: "Dragon Lords Elite",
    price: "125.5 ETH",
    image: "https://picsum.photos/500/500?random=1",
    rarity: "Genesis",
    likes: 2543,
    isLive: true,
    endTime: "2h 45m",
  },
  {
    id: 2,
    name: "Cosmic Warrior #1337",
    collection: "Space Raiders",
    price: "89.2 ETH",
    image: "https://picsum.photos/500/500?random=2",
    rarity: "Legendary",
    likes: 1876,
    isLive: true,
    endTime: "5h 12m",
  },
  {
    id: 3,
    name: "Shadow Assassin #777",
    collection: "Cyber Warriors",
    price: "67.8 ETH",
    image: "https://picsum.photos/500/500?random=3",
    rarity: "Mythic",
    likes: 1432,
    isLive: false,
  },
];

const liveStats = [
  { label: "24h Volume", value: "$12.4M", change: "+32.5%", icon: DollarSign, positive: true },
  { label: "Active Traders", value: "45.2K", change: "+18.3%", icon: Users, positive: true },
  { label: "Floor Index", value: "124.5", change: "+5.7%", icon: BarChart3, positive: true },
  { label: "Gas Saved", value: "85%", change: "vs ETH", icon: Zap, positive: true },
];

const trendingCollections = [
  {
    rank: 1,
    name: "Mythic Legends",
    floor: "12.5 ETH",
    volume24h: "1,234 ETH",
    change24h: "+156.2%",
    owners: "5.2K",
    items: "10K",
    image: "https://picsum.photos/200/200?random=4",
    verified: true,
    category: "Gaming",
    isHot: true,
  },
  {
    rank: 2,
    name: "Cyber Samurai",
    floor: "8.3 ETH",
    volume24h: "987 ETH",
    change24h: "+89.5%",
    owners: "3.8K",
    items: "8.8K",
    image: "https://picsum.photos/200/200?random=5",
    verified: true,
    category: "Art",
    isHot: true,
  },
  {
    rank: 3,
    name: "Space Odyssey",
    floor: "6.7 ETH",
    volume24h: "756 ETH",
    change24h: "+45.3%",
    owners: "2.9K",
    items: "5K",
    image: "https://picsum.photos/200/200?random=6",
    verified: true,
    category: "Gaming",
    isHot: false,
  },
  {
    rank: 4,
    name: "Dragon Realms",
    floor: "5.4 ETH",
    volume24h: "623 ETH",
    change24h: "+28.7%",
    owners: "2.1K",
    items: "7.7K",
    image: "https://picsum.photos/200/200?random=7",
    verified: true,
    category: "Fantasy",
    isHot: false,
  },
  {
    rank: 5,
    name: "Pixel Warriors",
    floor: "3.2 ETH",
    volume24h: "445 ETH",
    change24h: "-12.3%",
    owners: "1.8K",
    items: "4.4K",
    image: "https://picsum.photos/200/200?random=8",
    verified: false,
    category: "Pixel Art",
    isHot: false,
  },
];

const upcomingDrops = [
  {
    id: 1,
    name: "Ethereal Guardians",
    artist: "Studio Mythic",
    mintPrice: "0.08 ETH",
    supply: "5,000",
    date: "Dec 25, 2024",
    image: "https://picsum.photos/400/400?random=9",
    whitelisted: true,
    spots: 1250,
    totalSpots: 2000,
  },
  {
    id: 2,
    name: "Neon Dynasty",
    artist: "CyberPunk Labs",
    mintPrice: "0.12 ETH",
    supply: "3,333",
    date: "Dec 28, 2024",
    image: "https://picsum.photos/400/400?random=10",
    whitelisted: false,
    spots: 800,
    totalSpots: 1000,
  },
  {
    id: 3,
    name: "Ancient Artifacts",
    artist: "Time Keepers",
    mintPrice: "0.15 ETH",
    supply: "2,500",
    date: "Jan 2, 2025",
    image: "https://picsum.photos/400/400?random=11",
    whitelisted: true,
    spots: 450,
    totalSpots: 500,
  },
];

const topCreators = [
  {
    rank: 1,
    name: "ArtMaster.eth",
    avatar: "https://picsum.photos/100/100?random=12",
    totalSales: "12,543 ETH",
    collections: 8,
    followers: "125K",
    verified: true,
    trending: true,
  },
  {
    rank: 2,
    name: "PixelLord",
    avatar: "https://picsum.photos/100/100?random=13",
    totalSales: "9,876 ETH",
    collections: 5,
    followers: "98K",
    verified: true,
    trending: true,
  },
  {
    rank: 3,
    name: "CryptoWizard",
    avatar: "https://picsum.photos/100/100?random=14",
    totalSales: "7,234 ETH",
    collections: 12,
    followers: "76K",
    verified: true,
    trending: false,
  },
  {
    rank: 4,
    name: "MetaArtist",
    avatar: "https://picsum.photos/100/100?random=15",
    totalSales: "5,678 ETH",
    collections: 3,
    followers: "54K",
    verified: false,
    trending: false,
  },
];

const recentActivity = [
  {
    type: "sale",
    item: "Cosmic Blade #2341",
    price: "15.5 ETH",
    from: "0x1234...5678",
    to: "0x8765...4321",
    time: "2 min ago",
    image: "https://picsum.photos/100/100?random=16",
  },
  {
    type: "listing",
    item: "Shadow Armor #8976",
    price: "8.2 ETH",
    from: "0x9876...5432",
    time: "5 min ago",
    image: "https://picsum.photos/100/100?random=17",
  },
  {
    type: "offer",
    item: "Fire Dragon #1234",
    price: "25.0 ETH",
    from: "0x5432...1098",
    time: "8 min ago",
    image: "https://picsum.photos/100/100?random=18",
  },
  {
    type: "sale",
    item: "Ice Crystal #5555",
    price: "12.3 ETH",
    from: "0x2468...1357",
    to: "0x1357...2468",
    time: "12 min ago",
    image: "https://picsum.photos/100/100?random=19",
  },
];

const categories = [
  { name: "All", icon: Globe, count: "50K+" },
  { name: "Gaming", icon: Gamepad2, count: "15K" },
  { name: "Art", icon: Gem, count: "12K" },
  { name: "Sports", icon: Trophy, count: "8K" },
  { name: "Music", icon: Play, count: "5K" },
  { name: "Virtual Worlds", icon: Globe, count: "10K" },
];

export default function Home() {
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const router = useRouter();

  const handleNavigate = (newMode: string) => {
    if (newMode === 'home') {
      router.push('/');
    } else {
      router.push(`/${newMode}`);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveHeroIndex((prev) => (prev + 1) % heroNFTs.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const publicContent = (

    <div className="flex flex-1 flex-col">

      {/* LUXURY VEGAS-STYLE HERO - 11/10 EXPERIENCE */}
      <section className="relative min-h-screen overflow-hidden bg-black">
        {/* SOPHISTICATED VEGAS BACKGROUND */}
        <div className="absolute inset-0">
          
          {/* Premium gold accent gradient */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[rgb(163,255,18)]/5 via-transparent to-white/5" />
          
          {/* Vegas-style ambient lighting */}
          <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-gradient-radial from-[rgb(163,255,18)]/3 via-transparent to-transparent rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-gradient-radial from-white/2 via-transparent to-transparent rounded-full blur-[120px]" />
          
          {/* Luxury circuit pattern */}
          <div className="absolute inset-0 opacity-[0.15]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(163,255,18,0.1)_0%,transparent_50%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_48%,rgba(163,255,18,0.05)_49%,rgba(163,255,18,0.05)_51%,transparent_52%)] bg-[length:100px_100px]" />
          </div>
          
          {/* Premium geometric overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(163,255,18,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(163,255,18,0.02)_1px,transparent_1px)] bg-[size:200px_200px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]" />
        </div>

        {/* PREMIUM VEGAS HEADER */}
        <div className="relative z-50 hidden md:block">
          <div className="container mx-auto px-12 py-8">
            <div className="flex items-center justify-between backdrop-blur-xl bg-black/10 rounded-3xl px-10 py-6 border border-[rgb(163,255,18)]/20 shadow-2xl shadow-[rgb(163,255,18)]/10">
              <Image
                src="/assets/img/logo-text.png"
                alt="HYPERCHAINX"
                width={200}
                height={60}
                className="h-14 w-auto drop-shadow-2xl"
              />
              <div className="flex items-center gap-10">
                <nav className="hidden lg:flex items-center gap-10 text-base font-medium">
                  <Link href="/explore" className="text-white/90 hover:text-[rgb(163,255,18)] transition-colors duration-300 relative group">
                    Explore
                    <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[rgb(163,255,18)] to-white transition-all duration-300 group-hover:w-full" />
                  </Link>
                  <Link href="/collections" className="text-white/90 hover:text-[rgb(163,255,18)] transition-colors duration-300 relative group">
                    Collections
                    <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[rgb(163,255,18)] to-white transition-all duration-300 group-hover:w-full" />
                  </Link>
                  <Link href="/creators" className="text-white/90 hover:text-[rgb(163,255,18)] transition-colors duration-300 relative group">
                    Creators
                    <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[rgb(163,255,18)] to-white transition-all duration-300 group-hover:w-full" />
                  </Link>
                </nav>
                <div className="border border-[rgb(163,255,18)]/30 rounded-2xl p-1 bg-black/10 backdrop-blur-sm">
                  <ConnectButton client={client} />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* ULTIMATE VEGAS HERO EXPERIENCE */}
        <div className="relative z-40 min-h-screen flex items-center py-20">
          <div className="container mx-auto px-12">
            
            {/* VEGAS ROYAL STATUS BADGE */}
            <div className="flex justify-center mb-16">
              <div className="inline-flex items-center gap-4 px-8 py-4 rounded-full bg-gradient-to-r from-black/60 via-zinc-900/80 to-black/60 backdrop-blur-2xl border border-[rgb(163,255,18)]/40 shadow-2xl shadow-[rgb(163,255,18)]/20">
                <div className="w-3 h-3 bg-gradient-to-r from-[rgb(163,255,18)] to-[rgb(163,255,18)] rounded-full animate-pulse shadow-lg" />
                <span className="text-white font-bold tracking-[0.1em] text-lg">THE #1 GAMING NFT MARKETPLACE</span>
                <div className="w-px h-5 bg-gradient-to-b from-[rgb(163,255,18)]/50 via-[rgb(163,255,18)] to-[rgb(163,255,18)]/50" />
                <span className="text-[rgb(163,255,18)] font-black text-base">ELITE</span>
              </div>
            </div>

            {/* MASSIVE VEGAS TITLE */}
            <div className="text-center mb-12 sm:mb-16 md:mb-20">
              <h1 className="text-5xl xs:text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem] 2xl:text-[12rem] font-black leading-none tracking-tighter mb-6 sm:mb-8 ">
                <div className="text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.3)] relative ">
                  HYPER
                  <div className="absolute inset-0 text-transparent bg-clip-text bg-gradient-to-r from-white via-[rgb(163,255,18)]/4 to-white " />
                </div>
                <div className="text-transparent bg-clip-text bg-gradient-to-r from-[rgb(163,255,18)] via-[rgb(163,255,18)] to-[rgb(163,255,18)] -mt-2 sm:-mt-4 lg:-mt-6 xl:-mt-8 drop-shadow-[0_0_40px_rgba(163,255,18,0.2)] relative ">
                  CHAINX
                  <div className="absolute inset-0 bg-gradient-to-r from-[rgb(163,255,18)] via-[rgb(163,255,18)] to-[rgb(163,255,18)] bg-clip-text text-transparent " />
                </div>
              </h1>
              
              <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-light text-white/95 tracking-[0.1em] sm:tracking-[0.15em] lg:tracking-[0.2em] mb-6 sm:mb-8 drop-shadow-lg " >
                WHERE <span className="text-[rgb(163,255,18)] font-bold bg-gradient-to-r from-[rgb(163,255,18)] to-[rgb(163,255,18)] bg-clip-text text-transparent ">LEGENDS</span> ASCEND TO <span className="text-[rgb(163,255,18)] font-bold bg-gradient-to-r from-[rgb(163,255,18)] to-[rgb(163,255,18)] bg-clip-text text-transparent ">IMMORTALITY</span>
              </p>
              
              <div className="flex justify-center mb-8 sm:mb-10 md:mb-12 " >
                <div className="w-16 sm:w-24 md:w-32 h-0.5 bg-gradient-to-r from-transparent via-[rgb(163,255,18)] to-transparent " />
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-[rgb(163,255,18)] to-[rgb(163,255,18)] rounded-full -mt-1.5 mx-3 sm:mx-4 shadow-md shadow-[rgb(163,255,18)]/25 " />
                <div className="w-16 sm:w-24 md:w-32 h-0.5 bg-gradient-to-r from-transparent via-[rgb(163,255,18)] to-transparent " />
              </div>

              {/* VEGAS LUXURY TICKER */}
              <div className="relative overflow-hidden bg-gradient-to-r from-black/80 via-zinc-900/90 to-black/80 backdrop-blur-2xl border-y border-[rgb(163,255,18)]/30 py-4 sm:py-5 md:py-6 rounded-xl sm:rounded-2xl shadow-2xl ">
                <div className="flex items-center gap-8 sm:gap-10 md:gap-12 animate-[scroll_40s_linear_infinite] whitespace-nowrap text-base sm:text-lg font-medium">
                  <div className="flex items-center gap-3 text-[rgb(163,255,18)] font-bold">
                    <div className="w-3 h-3 bg-gradient-to-r from-[rgb(163,255,18)] to-[rgb(163,255,18)] rounded-full animate-pulse" />
                    LIVE LUXURY TRADES
                  </div>
                  
                  <div className="flex items-center gap-3 text-white">
                    <Crown className="w-5 h-5 text-[rgb(163,255,18)]" />
                    <span className="font-semibold">Genesis Dragons</span>
                    <span className="text-white font-black text-xl">+247%</span>
                  </div>
                  
                  <div className="w-px h-6 bg-gradient-to-b from-[rgb(163,255,18)]/8 via-[rgb(163,255,18)] to-[rgb(163,255,18)]/8" />
                  
                  <div className="flex items-center gap-3 text-white">
                    <Gem className="w-5 h-5 text-purple-400" />
                    <span className="font-semibold">Elite Warriors</span>
                    <span className="text-white font-black text-xl">+189%</span>
                  </div>
                  
                  <div className="w-px h-6 bg-gradient-to-b from-[rgb(163,255,18)]/8 via-[rgb(163,255,18)] to-[rgb(163,255,18)]/8" />
                  
                  <div className="flex items-center gap-3 text-white">
                    <Star className="w-5 h-5 text-[rgb(163,255,18)]" />
                    <span className="font-semibold">Mythic Legends</span>
                    <span className="text-white font-black text-xl">+156%</span>
                  </div>
                  
                  <div className="w-px h-6 bg-gradient-to-b from-[rgb(163,255,18)]/8 via-[rgb(163,255,18)] to-[rgb(163,255,18)]/8" />
                  
                  <div className="flex items-center gap-3 text-white">
                    <Rocket className="w-5 h-5 text-white/70" />
                    <span className="font-semibold">Space Lords</span>
                    <span className="text-[rgb(163,255,18)] font-black text-xl">MINTING</span>
                  </div>
                  
                  {/* Seamless repeat */}
                  <div className="w-px h-6 bg-gradient-to-b from-[rgb(163,255,18)]/8 via-[rgb(163,255,18)] to-[rgb(163,255,18)]/8" />
                  
                  <div className="flex items-center gap-3 text-[rgb(163,255,18)] font-bold">
                    <div className="w-3 h-3 bg-gradient-to-r from-[rgb(163,255,18)] to-[rgb(163,255,18)] rounded-full animate-pulse" />
                    LIVE LUXURY TRADES
                  </div>
                </div>
              </div>
            </div>

            {/* VEGAS LUXURY GRID */}
            <div className="grid lg:grid-cols-1 xl:grid-cols-3 gap-8 sm:gap-12 lg:gap-16 items-start max-w-8xl mx-auto">
              
              {/* Left: MASSIVE FEATURED PROJECT */}
              <div className="xl:col-span-2 relative " >
                <div className="relative aspect-[4/3] sm:aspect-[3/2] lg:aspect-[16/10] max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto">
                  
                  {/* VEGAS GLOW EFFECTS */}
                  <div className="absolute -inset-4 sm:-inset-6 lg:-inset-8 bg-gradient-to-r from-[rgb(163,255,18)]/8 via-[rgb(163,255,18)]/4 to-[rgb(163,255,18)]/8 rounded-2xl lg:rounded-[2rem] blur-[25px] sm:blur-[30px] lg:blur-[35px] " />
                  <div className="absolute -inset-2 sm:-inset-3 lg:-inset-4 bg-gradient-to-r from-transparent via-transparent to-transparent rounded-2xl lg:rounded-[2rem] blur-[20px] sm:blur-[30px] lg:blur-[40px] " />
                  
                  {/* ULTIMATE NFT SHOWCASE */}
                  <Card className="relative h-full overflow-hidden bg-gradient-to-br from-black via-zinc-900/60 to-black backdrop-blur-2xl border-2 border-[rgb(163,255,18)]/40 rounded-2xl lg:rounded-[2rem] group hover:border-[rgb(163,255,18)]/80 transition-all duration-1000 hover:scale-[1.01] shadow-2xl hover:shadow-[rgb(163,255,18)]/15 ">
                    <div className="relative h-4/5">
                      <Image
                        src={heroNFTs[activeHeroIndex].image}
                        alt={heroNFTs[activeHeroIndex].name}
                        fill
                        className="object-cover rounded-t-[2rem] transition-transform duration-1000 group-hover:scale-105"
                      />
                      
                      {/* LUXURY OVERLAY */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent rounded-t-[2rem]" />
                      <div className="absolute inset-0 bg-gradient-to-br from-[rgb(163,255,18)]/8 via-transparent to-white/8 rounded-t-[2rem]" />
                      
                      {/* PREMIUM SCAN LINES */}
                      <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_98%,rgba(163,255,18,0.1)_100%)] bg-[length:100%_2px] rounded-t-[2rem] opacity-40" />
                      
                      {/* CORNER ACCENT LINES */}
                      <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-[rgb(163,255,18)]/60" />
                      <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-[rgb(163,255,18)]/60" />
                      
                      {/* PREMIUM LIVE BADGE */}
                      {heroNFTs[activeHeroIndex].isLive && (
                        <div className="absolute top-6 right-6 px-4 py-2 rounded-lg bg-black/80 backdrop-blur-xl text-white text-sm sm:text-base lg:text-xl font-black flex items-center gap-2 sm:gap-2.5 lg:gap-3 shadow-2xl border border-red-500/50 ">
                          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 lg:w-3 lg:h-3 bg-white rounded-full animate-pulse shadow-lg" />
                          <span className="hidden sm:inline">LIVE AUCTION</span>
                          <span className="sm:hidden">LIVE</span>
                        </div>
                      )}
                      
                      {/* LUXURY RARITY BADGE */}
                      <div className="absolute top-4 sm:top-6 lg:top-8 left-4 sm:left-6 lg:left-8 px-4 py-2 rounded-full bg-gradient-to-r from-[rgb(163,255,18)] via-[rgb(163,255,18)] to-[rgb(163,255,18)] text-black text-sm sm:text-base lg:text-xl font-black shadow-2xl border border-[rgb(163,255,18)] " >
                        {heroNFTs[activeHeroIndex].rarity}
                      </div>
                      
                      {/* VEGAS LIKE COUNTER */}
                      <div className="absolute bottom-4 sm:bottom-6 lg:bottom-8 left-4 sm:left-6 lg:left-8 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 text-white flex items-center gap-1.5 sm:gap-2 " >
                        <Star className="w-3 h-3 sm:w-4 sm:h-4 text-[rgb(163,255,18)] "  />
                        <span className="font-bold text-sm sm:text-base">{heroNFTs[activeHeroIndex].likes.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    {/* LUXURY CARD CONTENT */}
                    <div className="h-1/5 p-4 sm:p-6 lg:p-8 xl:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
                      <div className="flex-1">
                        <p className="text-[rgb(163,255,18)] text-sm sm:text-base lg:text-lg mb-1 sm:mb-2 font-semibold tracking-wider ">{heroNFTs[activeHeroIndex].collection}</p>
                        <h3 className="text-white text-xl sm:text-2xl lg:text-3xl font-black leading-tight ">{heroNFTs[activeHeroIndex].name}</h3>
                      </div>
                      
                      <div className="text-left sm:text-right">
                        <p className="text-[rgb(163,255,18)]/70 text-xs sm:text-sm lg:text-base font-semibold mb-1">Current Bid</p>
                        <p className="text-[rgb(163,255,18)] text-2xl sm:text-3xl lg:text-4xl font-black drop-shadow-lg ">{heroNFTs[activeHeroIndex].price}</p>
                      </div>
                    </div>
                  </Card>

                  {/* VEGAS CAROUSEL CONTROLS */}
                  <div className="flex justify-center gap-3 sm:gap-4 mt-12 sm:mt-14 lg:mt-16">
                    {heroNFTs.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveHeroIndex(index)}
                        className={cn(
                          "h-3 sm:h-4 rounded-full transition-all duration-500 hover:scale-110 ",
                          index === activeHeroIndex
                            ? "w-12 sm:w-16 bg-gradient-to-r from-[rgb(163,255,18)] via-[rgb(163,255,18)] to-[rgb(163,255,18)] shadow-md shadow-[rgb(163,255,18)]/25 "
                            : "w-3 sm:w-4 bg-white/30 hover:bg-white/60"
                        )}
                                              />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: VEGAS ACTIONS & STATS */}
              <div className="space-y-8 sm:space-y-10 lg:space-y-12 " >
                
                {/* LUXURY CTAs */}
                <div className="space-y-4 sm:space-y-6">
                  <p className="text-lg sm:text-xl lg:text-2xl text-white/90 leading-relaxed font-light mb-6 sm:mb-8">
                    Enter the most exclusive gaming NFT ecosystem where digital assets become <span className="text-[rgb(163,255,18)] font-bold ">legendary</span> and fortunes are <span className="text-white font-bold ">immortalized</span>.
                  </p>
                  
                  <Button 
                    size="lg" 
                    className="w-full h-16 sm:h-18 lg:h-20 text-lg sm:text-xl lg:text-2xl font-black bg-gradient-to-r from-[rgb(163,255,18)] via-[rgb(163,255,18)] to-[rgb(163,255,18)] hover:from-[rgb(163,255,18)] hover:via-[rgb(163,255,18)] hover:to-[rgb(163,255,18)] text-black transition-all duration-500 hover:scale-[1.01] hover:shadow-2xl hover:shadow-[rgb(163,255,18)]/40 group border border-[rgb(163,255,18)] " 
                    asChild
                  >
                    <Link href="/explore" className="flex items-center justify-center gap-3 sm:gap-4">
                      <Crown className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 group-hover:rotate-6 transition-transform "  />
                      <span className="">ENTER THE ELITE</span>
                      <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 group-hover:translate-x-2 transition-transform" />
                    </Link>
                  </Button>
                  
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <Button 
                      variant="outline" 
                      className="h-12 sm:h-14 lg:h-16 border-2 border-[rgb(163,255,18)]/60 text-[rgb(163,255,18)] hover:bg-[rgb(163,255,18)]/10 hover:border-[rgb(163,255,18)] transition-all duration-300 text-sm sm:text-base lg:text-lg font-bold " 
                      asChild
                    >
                      <Link href="/collections" className="flex items-center justify-center gap-2 sm:gap-3">
                        <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5 "  />
                        <span>Explore</span>
                      </Link>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="h-12 sm:h-14 lg:h-16 border-2 border-white/60 text-white hover:bg-white/10 hover:border-white transition-all duration-300 text-sm sm:text-base lg:text-lg font-bold " 
                      asChild
                    >
                      <Link href="/creators" className="flex items-center justify-center gap-2 sm:gap-3">
                        <Gem className="w-4 h-4 sm:w-5 sm:h-5 "  />
                        <span>Create</span>
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* VEGAS LUXURY STATS */}
                <div className="bg-gradient-to-br from-zinc-900/60 via-black/40 to-zinc-900/60 backdrop-blur-2xl border border-[rgb(163,255,18)]/30 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl ">
                  <h3 className="text-[rgb(163,255,18)] text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-center ">LIVE MARKET PULSE</h3>
                  <div className="grid grid-cols-2 gap-4 sm:gap-6">
                    {liveStats.map((stat, index) => (
                      <div key={index} className="text-center group " >
                        <div className="text-2xl sm:text-3xl font-black text-white mb-2 group-hover:text-[rgb(163,255,18)] transition-colors duration-300 ">
                          {stat.value}
                        </div>
                        <div className="text-xs text-[rgb(163,255,18)]/70 uppercase tracking-wider font-semibold">
                          {stat.label}
                        </div>
                        <div className={cn(
                          "mt-2 text-xs font-bold flex items-center justify-center gap-1",
                          stat.positive ? "text-white" : "text-red-400"
                        )}>
                          {stat.positive ? (
                            <ArrowUpRight className="w-3 h-3 " style={{'--delay': `${index}`} as React.CSSProperties} />
                          ) : (
                            <ArrowDownRight className="w-3 h-3" />
                          )}
                          {stat.change}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED COLLECTIONS - Luxury Showcase */}
      <section className="py-24 bg-gradient-to-b from-black via-gray-950/50 to-black">
        <div className="container mx-auto px-8">
          
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-[rgb(163,255,18)]/10 border border-[rgb(163,255,18)]/20 backdrop-blur-sm mb-6">
              <Crown className="w-4 h-4 text-[rgb(163,255,18)]" />
              <span className="text-white font-medium">Featured Collections</span>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-4">
              LUXURY <span className="text-transparent bg-clip-text bg-gradient-to-r from-[rgb(163,255,18)] to-white">COLLABORATIONS</span>
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Exclusive partnerships with the world&apos;s most prestigious gaming NFT collections
            </p>
          </div>

          {/* Premium Collections Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            
            {/* Featured Collection 1 */}
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-[rgb(163,255,18)]/40 via-white/20 to-[rgb(163,255,18)]/40 rounded-3xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Card className="relative overflow-hidden bg-gradient-to-br from-gray-900/80 via-black/60 to-gray-900/80 backdrop-blur-xl border border-[rgb(163,255,18)]/20 rounded-3xl group-hover:border-[rgb(163,255,18)]/40 transition-all duration-500">
                <div className="relative h-64">
                  <Image
                    src="https://picsum.photos/400/400?random=21"
                    alt="Mythic Legends"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  
                  {/* Hot Badge */}
                  <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-bold flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    HOT
                  </div>
                  
                  {/* Verified Badge */}
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white text-black text-sm font-bold flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    VERIFIED
                  </div>
                  
                  {/* Collection Info Overlay */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white text-xl font-bold mb-1">Mythic Legends</h3>
                    <p className="text-[rgb(163,255,18)] text-sm">Epic Fantasy Collection</p>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">12.5 ETH</div>
                      <div className="text-xs text-[rgb(163,255,18)]/70">Floor</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-[rgb(163,255,18)]">+156%</div>
                      <div className="text-xs text-[rgb(163,255,18)]/70">24h</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">5.2K</div>
                      <div className="text-xs text-[rgb(163,255,18)]/70">Owners</div>
                    </div>
                  </div>
                  
                  <Button className="w-full bg-gradient-to-r from-white to-white hover:from-white hover:to-zinc-200 text-black font-bold transition-all duration-300 hover:scale-[1.02]">
                    View Collection
                  </Button>
                </div>
              </Card>
            </div>

            {/* Featured Collection 2 */}
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-white/20 via-[rgb(163,255,18)]/20 to-white/20 rounded-3xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Card className="relative overflow-hidden bg-gradient-to-br from-gray-900/80 via-black/60 to-gray-900/80 backdrop-blur-xl border border-white/20 rounded-3xl group-hover:border-white/40 transition-all duration-500">
                <div className="relative h-64">
                  <Image
                    src="https://picsum.photos/400/400?random=22"
                    alt="Cyber Samurai"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  
                  {/* Featured Badge */}
                  <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    FEATURED
                  </div>
                  
                  {/* Verified Badge */}
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white text-black text-sm font-bold flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    VERIFIED
                  </div>
                  
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white text-xl font-bold mb-1">Cyber Samurai</h3>
                    <p className="text-purple-300 text-sm">Futuristic Warriors</p>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">8.3 ETH</div>
                      <div className="text-xs text-purple-300/70">Floor</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-400">+89%</div>
                      <div className="text-xs text-purple-300/70">24h</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">3.8K</div>
                      <div className="text-xs text-purple-300/70">Owners</div>
                    </div>
                  </div>
                  
                  <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-bold transition-all duration-300 hover:scale-[1.02]">
                    View Collection
                  </Button>
                </div>
              </Card>
            </div>

            {/* Featured Collection 3 */}
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-[rgb(163,255,18)]/30 via-white/20 to-[rgb(163,255,18)]/30 rounded-3xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Card className="relative overflow-hidden bg-gradient-to-br from-gray-900/80 via-black/60 to-gray-900/80 backdrop-blur-xl border border-[rgb(163,255,18)]/20 rounded-3xl group-hover:border-[rgb(163,255,18)]/40 transition-all duration-500">
                <div className="relative h-64">
                  <Image
                    src="https://picsum.photos/400/400?random=23"
                    alt="Space Odyssey"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  
                  {/* New Badge */}
                  <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-gradient-to-r from-[rgb(163,255,18)] to-white text-black text-sm font-bold flex items-center gap-1">
                    <Rocket className="w-3 h-3" />
                    NEW
                  </div>
                  
                  {/* Verified Badge */}
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white text-black text-sm font-bold flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    VERIFIED
                  </div>
                  
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white text-xl font-bold mb-1">Space Odyssey</h3>
                    <p className="text-[rgb(163,255,18)] text-sm">Cosmic Adventures</p>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">6.7 ETH</div>
                      <div className="text-xs text-[rgb(163,255,18)]/70">Floor</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-400">+45%</div>
                      <div className="text-xs text-[rgb(163,255,18)]/70">24h</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">2.9K</div>
                      <div className="text-xs text-[rgb(163,255,18)]/70">Owners</div>
                    </div>
                  </div>
                  
                  <Button className="w-full bg-gradient-to-r from-[rgb(163,255,18)] to-white hover:from-[rgb(163,255,18)] hover:to-zinc-200 text-black font-bold transition-all duration-300 hover:scale-[1.02]">
                    View Collection
                  </Button>
                </div>
              </Card>
            </div>
          </div>

          {/* Partnership CTA */}
          <div className="text-center mt-16">
            <div className="inline-flex flex-col items-center gap-4 px-8 py-6 rounded-2xl bg-gradient-to-r from-white/10 via-zinc-100/10 to-zinc-200/10 backdrop-blur-xl border border-white/20">
              <div className="flex items-center gap-2 text-green-400 font-semibold">
                <Crown className="w-5 h-5" />
                <span>BECOME A FEATURED PARTNER</span>
              </div>
              <p className="text-white/80 text-center max-w-md">
                Join the elite. Showcase your collection to millions of premium collectors and traders.
              </p>
              <Button className="bg-gradient-to-r from-white to-white hover:from-white hover:to-zinc-200 text-black font-bold px-8">
                Apply for Partnership
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section - Sticky Subnav */}
      <section className="sticky top-0 z-40 border-y bg-black/95 backdrop-blur-xl shadow-lg shadow-[rgb(163,255,18)]/5">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center gap-3 sm:gap-6 overflow-x-auto no-scrollbar">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.name}
                  onClick={() => setSelectedCategory(category.name)}
                  className={cn(
                    "flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl transition-all whitespace-nowrap backdrop-blur-sm border font-medium hover:scale-[1.02]",
                    selectedCategory === category.name
                      ? "bg-[rgb(163,255,18)]/10 text-[rgb(163,255,18)] border-[rgb(163,255,18)]/30 shadow-lg shadow-[rgb(163,255,18)]/20"
                      : "bg-white/5 text-white/80 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20"
                  )}
                >
                  <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-sm sm:text-base font-medium">{category.name}</span>
                  <Badge className={cn("ml-1 text-[10px] sm:text-xs px-2 py-0.5 rounded-md font-bold",
                    selectedCategory === category.name 
                      ? "bg-[rgb(163,255,18)]/20 text-[rgb(163,255,18)] border-[rgb(163,255,18)]/40"
                      : "bg-white/10 text-white/70 border-white/20"
                  )}>
                    {category.count}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content Container */}
      <div className="container mx-auto px-4 py-8 sm:py-12 space-y-12 sm:space-y-16">
        {/* Trending Collections with Advanced Metrics */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-1 sm:mb-2">
                TRENDING <span className="text-transparent bg-clip-text bg-gradient-to-r from-[rgb(163,255,18)] to-white">COLLECTIONS</span>
              </h2>
              <p className="text-sm sm:text-base text-white/70">Top performing collections in the last 24 hours</p>
            </div>
            <div className="flex items-center gap-2">
              <Button className="gap-2 bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white/30 backdrop-blur-sm font-medium">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
              <Button className="bg-[rgb(163,255,18)]/10 hover:bg-[rgb(163,255,18)]/20 text-[rgb(163,255,18)] border-[rgb(163,255,18)]/30 hover:border-[rgb(163,255,18)]/50 backdrop-blur-sm font-medium" asChild>
                <Link href="/collections">
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {trendingCollections.map((collection) => (
              <Link
                key={collection.rank}
                href={`/collection/${collection.name.toLowerCase().replace(/\s+/g, '-')}`}
                className="block"
              >
                <Card className="group overflow-hidden hover:shadow-2xl hover:shadow-[rgb(163,255,18)]/10 transition-all duration-500 hover:-translate-y-1 bg-gradient-to-r from-gray-900/80 to-black/60 backdrop-blur-xl border-[rgb(163,255,18)]/20 hover:border-[rgb(163,255,18)]/40 rounded-2xl">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-3 sm:gap-6 p-4 sm:p-6">
                      {/* Rank */}
                      <div className="text-2xl sm:text-3xl font-bold text-[rgb(163,255,18)] w-6 sm:w-8">
                        {collection.rank}
                      </div>

                      {/* Collection Image */}
                      <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden flex-shrink-0">
                        <Image
                          src={collection.image}
                          alt={collection.name}
                          width={80}
                          height={80}
                          className="w-full h-full object-top"
              style={{ objectFit: 'cover', objectPosition: 'center top' }}
                        />
                        {collection.isHot && (
                          <div className="absolute -top-1 -right-1">
                            <Flame className="h-6 w-6 text-orange-500 animate-pulse" />
                          </div>
                        )}
                      </div>

                      {/* Collection Info */}
                      <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-4">
                        <div className="col-span-2 sm:col-span-1">
                          <div className="flex items-center gap-1 sm:gap-2 mb-1">
                            <h3 className="font-bold text-white text-sm sm:text-base truncate">{collection.name}</h3>
                            {collection.verified && (
                              <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-[rgb(163,255,18)] flex-shrink-0" />
                            )}
                          </div>
                          <Badge className="text-[10px] sm:text-xs bg-[rgb(163,255,18)]/10 text-[rgb(163,255,18)] border-[rgb(163,255,18)]/30 font-medium">
                            {collection.category}
                          </Badge>
                        </div>

                        <div className="hidden sm:block">
                          <p className="text-xs sm:text-sm text-white/60">Floor Price</p>
                          <p className="font-bold text-white text-sm sm:text-base">{collection.floor}</p>
                        </div>

                        <div className="hidden sm:block">
                          <p className="text-xs sm:text-sm text-white/60">24h Volume</p>
                          <p className="font-bold text-white text-sm sm:text-base">{collection.volume24h}</p>
                        </div>

                        <div>
                          <p className="text-xs sm:text-sm text-white/60">24h Change</p>
                          <p className={cn(
                            "font-bold text-sm sm:text-base flex items-center gap-0.5 sm:gap-1",
                            collection.change24h.startsWith('+') ? "text-[rgb(163,255,18)]" : "text-red-400"
                          )}>
                            {collection.change24h.startsWith('+') ? (
                              <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3 sm:h-4 sm:w-4" />
                            )}
                            {collection.change24h}
                          </p>
                        </div>

                        <div className="text-right hidden md:block">
                          <p className="text-xs sm:text-sm text-white/60">
                            {collection.owners} owners
                          </p>
                          <p className="text-xs sm:text-sm text-white/60">
                            {collection.items} items
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Upcoming Drops / Launchpad */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
                <Rocket className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                Upcoming Drops
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">Exclusive launches from verified creators</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/launchpad">
                View Launchpad
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {upcomingDrops.map((drop) => (
              <Card key={drop.id} className="overflow-hidden group hover:shadow-xl transition-all bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm border-primary/20 hover:border-primary/40">
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    src={drop.image}
                    alt={drop.name}
                    width={400}
                    height={400}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {drop.whitelisted && (
                    <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground z-10">
                      <Star className="h-3 w-3 mr-1" />
                      Whitelist Open
                    </Badge>
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4 z-10">
                    <h3 className="text-white font-bold text-xl">{drop.name}</h3>
                    <p className="text-white/80 text-sm">{drop.artist}</p>
                  </div>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Mint Price</p>
                      <p className="font-semibold text-lg">{drop.mintPrice}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Supply</p>
                      <p className="font-semibold text-lg">{drop.supply}</p>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Whitelist Spots</span>
                      <span className="font-medium">{drop.spots}/{drop.totalSpots}</span>
                    </div>
                    <Progress value={(drop.spots / drop.totalSpots) * 100} className="h-2" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{drop.date}</span>
                    </div>
                    <Button size="sm" className="gap-2">
                      Join Whitelist
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Live Activity Feed & Top Creators */}
        <section className="space-y-8 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-8 xl:gap-12">
          {/* Live Activity Feed */}
          <div>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-1.5 sm:gap-2">
                <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-[rgb(163,255,18)] animate-pulse" />
                LIVE <span className="text-transparent bg-clip-text bg-gradient-to-r from-[rgb(163,255,18)] to-white">ACTIVITY</span>
              </h2>
              <Badge className="gap-1 text-xs bg-[rgb(163,255,18)]/10 text-[rgb(163,255,18)] border-[rgb(163,255,18)]/30 font-bold">
                <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-[rgb(163,255,18)] rounded-full animate-pulse" />
                LIVE
              </Badge>
            </div>

            <Card className="bg-gradient-to-br from-gray-900/80 to-black/60 backdrop-blur-xl border-[rgb(163,255,18)]/20 rounded-2xl">
              <CardContent className="p-0">
                <div className="divide-y divide-[rgb(163,255,18)]/10">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="p-3 sm:p-4 hover:bg-[rgb(163,255,18)]/5 transition-colors">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={activity.image}
                            alt={activity.item}
                            width={48}
                            height={48}
                            className="w-full h-full object-top"
              style={{ objectFit: 'cover', objectPosition: 'center top' }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                            <div className="flex items-center gap-2">
                              {activity.type === "sale" && (
                                <Badge variant="default" className="text-[10px] sm:text-xs px-1.5 py-0.5">
                                  <DollarSign className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                                  Sale
                                </Badge>
                              )}
                              {activity.type === "listing" && (
                                <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 py-0.5">
                                  <Tag className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                                  Listed
                                </Badge>
                              )}
                              {activity.type === "offer" && (
                                <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0.5">
                                  <Target className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                                  Offer
                                </Badge>
                              )}
                              <span className="text-xs sm:text-sm font-medium text-foreground">{activity.price}</span>
                            </div>
                            <div className="text-xs sm:text-sm text-muted-foreground sm:ml-auto">
                              {activity.time}
                            </div>
                          </div>
                          <div className="text-xs sm:text-sm font-medium text-foreground truncate mb-1">
                            {activity.item}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {activity.to ? (
                              <>
                                <span className="truncate max-w-[80px] sm:max-w-none">{activity.from}</span>
                                <ArrowRight className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                                <span className="truncate max-w-[80px] sm:max-w-none">{activity.to}</span>
                              </>
                            ) : (
                              <span className="truncate">by {activity.from}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Creators */}
          <div>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-1.5 sm:gap-2">
                <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                Top Creators
              </h2>
              <Button variant="outline" size="sm" asChild>
                <Link href="/creators" className="flex items-center gap-1">
                  <span className="hidden sm:inline">View All</span>
                  <span className="sm:hidden">All</span>
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </Link>
              </Button>
            </div>

            <Card className="bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm border-primary/20">
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {topCreators.map((creator) => (
                    <div key={creator.rank} className="p-3 sm:p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="text-lg sm:text-2xl font-bold text-muted-foreground w-4 sm:w-6 flex-shrink-0">
                          {creator.rank}
                        </div>
                        <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                          <AvatarImage src={creator.avatar} alt={creator.name} />
                          <AvatarFallback>{creator.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <h3 className="font-semibold text-sm sm:text-base truncate">{creator.name}</h3>
                              {creator.verified && (
                                <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                              )}
                            </div>
                            {creator.trending && (
                              <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 py-0.5 w-fit">
                                <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                                Trending
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-3 sm:flex sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                            <span className="truncate">{creator.totalSales}</span>
                            <span className="truncate">{creator.collections} collections</span>
                            <span className="truncate">{creator.followers}</span>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="text-xs px-2 sm:px-3 flex-shrink-0">
                          <span className="hidden sm:inline">Follow</span>
                          <span className="sm:hidden">+</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Educational Section for New Users */}
        <section className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-12 backdrop-blur-sm border border-primary/20">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <Badge className="mb-4" variant="secondary">
              <Info className="h-3 w-3 mr-1" />
              New to NFTs?
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
              Start Your NFT Journey Today
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Learn how to buy, sell, and trade NFTs with our comprehensive guides and tutorials.
              Join millions of collectors in the HYPERCHAINX ecosystem.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8">
              <Card className="text-left">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Search className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">1. Discover</h3>
                  <p className="text-sm text-muted-foreground">
                    Browse thousands of unique collections and find NFTs that match your style
                  </p>
                </CardContent>
              </Card>
              <Card className="text-left">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">2. Connect</h3>
                  <p className="text-sm text-muted-foreground">
                    Securely connect your wallet to start buying and selling NFTs instantly
                  </p>
                </CardContent>
              </Card>
              <Card className="text-left">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Coins className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">3. Trade</h3>
                  <p className="text-sm text-muted-foreground">
                    Buy, sell, and trade NFTs with low fees and lightning-fast transactions
                  </p>
                </CardContent>
              </Card>
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-6 sm:mt-8">
              <Button size="default" className="gap-2">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="default" variant="outline">
                Learn More
              </Button>
            </div>
          </div>
        </section>

        {/* Platform Features */}
        <section>
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-4">Why Choose HYPERCHAINX?</h2>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
              Built with cutting-edge technology for the best trading experience
            </p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Card className="relative overflow-hidden group hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-white/20 to-zinc-200/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="h-6 w-6 text-green-500" />
                </div>
                <h3 className="font-semibold mb-2">Lightning Fast</h3>
                <p className="text-sm text-muted-foreground">
                  Sub-second transactions with 99.9% uptime guarantee
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden group hover:shadow-lg transition-all border-primary/20 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Bank-Level Security</h3>
                <p className="text-sm text-muted-foreground">
                  Multi-sig wallets and audited smart contracts
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden group hover:shadow-lg transition-all border-primary/20 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-accent/20 to-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Coins className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold mb-2">Lowest Fees</h3>
                <p className="text-sm text-muted-foreground">
                  Only 1% trading fee with zero hidden costs
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden group hover:shadow-lg transition-all border-primary/20 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Vibrant Community</h3>
                <p className="text-sm text-muted-foreground">
                  Join 1.2M+ traders and collectors worldwide
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
  
  const authenticatedContent = <HomeView setViewMode={handleNavigate} />;

  return (
    <HomeRouter 
      publicContent={publicContent}
      authenticatedContent={authenticatedContent}
    />
  );
}