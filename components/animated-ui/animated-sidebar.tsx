"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronRight,
  Gamepad2,
  Trophy,
  Sword,
  Shield,
  Crown,
  Gem,
  Sparkles,
  Star,
  TrendingUp,
  Filter,
  Grid3x3,
  List,
  SlidersHorizontal,
  Search,
  Box,
  Layers,
  Users,
  User,
  Handshake,
  ArrowRightLeft,
  Plus,
  Minus,
  CheckCircle2,
  Edit3,
  Zap,
  Upload,
  Settings,
  BarChart3,
  DollarSign,
  Image,
  Calendar,
  Share,
  Archive,
  ShoppingCart,
  Heart,
  FolderOpen,
  Activity,
  FileText,
  Package,
  Database,
  PieChart,
  MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useP2PTrading } from "@/contexts/p2p-trading-context";
import { GameCommandCard } from "@/components/ui/game-command-card";

interface AnimatedSidebarProps {
  show: boolean;
  showFooter?: boolean;
  currentRoute?: string;
  studioData?: {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    viewMode: 'grid' | 'list';
    onViewModeChange: (mode: 'grid' | 'list') => void;
    projects: any[];
    collections: any[];
    nfts: any[];
  };
  p2pData?: {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    gridViewMode: 'grid' | 'list';
    onGridViewModeChange: (mode: 'grid' | 'list') => void;
  };
  lootboxData?: {
    availableLootboxes: Array<{
      id: string;
      name: string;
      collection: string;
      image: string;
      price: number;
      discountPrice?: number | null;
      discountPercent: number;
      rarity: string;
      totalSupply: number;
      remaining: number;
      category: string;
      accentColor: string;
    }>;
  };
  listsData?: {
    lists: any[];
    selectedList: any | null;
    onSelectList: (list: any) => void;
    onCreateList: () => void;
    onDeleteList: (listId: string) => void;
    isCreatingList: boolean;
    newListName: string;
    onNewListNameChange: (name: string) => void;
    onConfirmCreate: () => void;
    onCancelCreate: () => void;
  };
  collectionData?: {
    id: string;
    name: string;
    totalSupply: number;
    owners: number;
    floorPrice: string;
    volume: string;
    listed: string;
    isOwner: boolean;
  };
  museumData?: {
    items: Array<{
      id: string;
      title: string;
      subtitle: string;
      thumbnail: string;
      introVideo: string;
    }>;
    onItemClick: (item: any) => void;
  };
  onNavigate?: (route: string) => void;
}

export function AnimatedSidebar({ show, showFooter = true, currentRoute = 'marketplace', studioData, p2pData, lootboxData, listsData, collectionData, museumData, onNavigate }: AnimatedSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Always call the hook unconditionally
  const p2pContext = useP2PTrading();

  // Only use P2P data when on P2P route
  const {
    userNFTs,
    selectedTrader,
    toggleUserNFTSelection,
    confirmUserNFTs
  } = currentRoute === 'p2p' ? p2pContext : {
    userNFTs: [],
    selectedTrader: null,
    toggleUserNFTSelection: () => {},
    confirmUserNFTs: () => {}
  };
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['gaming']);
  const [priceRange, setPriceRange] = useState([0, 100]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [hoveredMuseumItem, setHoveredMuseumItem] = useState<string | null>(null);

  // Generate stable random values on client side only
  const [randomStats, setRandomStats] = useState<{
    volume24h: string;
    change7d: string;
    avgPrice: string;
    activity: Array<{ time: string; price: string }>;
    collectionPrices: Array<{ price: string; change: string }>;
  } | null>(null);

  // Initialize random stats on mount to avoid hydration mismatch
  useEffect(() => {
    setRandomStats({
      volume24h: (Math.random() * 50 + 10).toFixed(1),
      change7d: (Math.random() * 30 + 5).toFixed(1),
      avgPrice: (Math.random() * 2 + 0.5).toFixed(1),
      activity: Array.from({ length: 3 }, (_, i) => ({
        time: `${Math.floor(Math.random() * 24)}h ago`,
        price: (Math.random() * 5 + 0.1).toFixed(2)
      })),
      collectionPrices: Array.from({ length: 4 }, () => ({
        price: (Math.random() * 2 + 0.1).toFixed(2),
        change: Math.floor(Math.random() * 50 + 10).toString()
      }))
    });
  }, []);

  const categories = [
    {
      id: 'gaming',
      name: 'Gaming',
      icon: Gamepad2,
      count: 15234,
      subcategories: [
        { id: 'action', name: 'Action Games', count: 3421 },
        { id: 'rpg', name: 'RPG', count: 2156 },
        { id: 'strategy', name: 'Strategy', count: 1893 },
        { id: 'sports', name: 'Sports', count: 1654 },
        { id: 'racing', name: 'Racing', count: 987 }
      ]
    },
    {
      id: 'collectibles',
      name: 'Collectibles',
      icon: Trophy,
      count: 8976,
      subcategories: [
        { id: 'cards', name: 'Trading Cards', count: 2345 },
        { id: 'figures', name: 'Figures', count: 1876 },
        { id: 'comics', name: 'Comics', count: 1234 }
      ]
    },
    {
      id: 'weapons',
      name: 'Weapons',
      icon: Sword,
      count: 6543,
      subcategories: [
        { id: 'swords', name: 'Swords', count: 2134 },
        { id: 'guns', name: 'Guns', count: 1987 },
        { id: 'magic', name: 'Magic Items', count: 1654 }
      ]
    },
    {
      id: 'armor',
      name: 'Armor',
      icon: Shield,
      count: 5432,
      subcategories: [
        { id: 'helmets', name: 'Helmets', count: 1234 },
        { id: 'body', name: 'Body Armor', count: 1876 },
        { id: 'accessories', name: 'Accessories', count: 987 }
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      icon: Crown,
      count: 2341,
      badge: 'HOT'
    },
    {
      id: 'rare',
      name: 'Rare Items',
      icon: Gem,
      count: 1234
    }
  ];

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ x: currentRoute === 'museum' ? '-100%' : -320, opacity: currentRoute === 'museum' ? 1 : 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: currentRoute === 'museum' ? '-100%' : -320, opacity: currentRoute === 'museum' ? 1 : 0 }}
          transition={
            currentRoute === 'museum'
              ? { duration: 3.6, ease: [0.6, 0.05, 0.01, 0.9] } // Slow cinematic animation for museum
              : {
                  type: "spring",
                  stiffness: 260,
                  damping: 30,
                  duration: 0.4
                }
          }
          className={`fixed left-0 top-0 bottom-0 ${currentRoute === 'museum' ? 'w-1/2' : `top-16 ${showFooter ? 'md:bottom-[44.6px]' : 'md:bottom-0'} w-80`} bg-black/95 backdrop-blur-xl border-r border-white/10 z-40 overflow-hidden flex flex-col`}
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {(pathname?.startsWith('/studio') || currentRoute === 'studio') ? (
                (() => {
                  // Determine specific studio page
                  if (pathname === '/studio/collections') {
                    return (
                      <>
                        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                          <Layers className="h-5 w-5 text-[rgb(163,255,18)]" />
                          Collections
                        </h2>
                        <p className="text-sm text-white/60">Manage NFT collections</p>
                      </>
                    );
                  } else if (pathname === '/studio/projects') {
                    return (
                      <>
                        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                          <FolderOpen className="h-5 w-5 text-[rgb(163,255,18)]" />
                          Projects
                        </h2>
                        <p className="text-sm text-white/60">Organize your work</p>
                      </>
                    );
                  } else if (pathname === '/studio/nfts') {
                    return (
                      <>
                        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                          <Image className="h-5 w-5 text-[rgb(163,255,18)]" />
                          NFTs
                        </h2>
                        <p className="text-sm text-white/60">Your digital assets</p>
                      </>
                    );
                  } else if (pathname === '/studio/analytics') {
                    return (
                      <>
                        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-[rgb(163,255,18)]" />
                          Analytics
                        </h2>
                        <p className="text-sm text-white/60">Track performance</p>
                      </>
                    );
                  } else if (pathname === '/studio/activity') {
                    return (
                      <>
                        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                          <Activity className="h-5 w-5 text-[rgb(163,255,18)]" />
                          Activity
                        </h2>
                        <p className="text-sm text-white/60">Recent events</p>
                      </>
                    );
                  } else if (pathname === '/studio/settings') {
                    return (
                      <>
                        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                          <Settings className="h-5 w-5 text-[rgb(163,255,18)]" />
                          Settings
                        </h2>
                        <p className="text-sm text-white/60">Studio preferences</p>
                      </>
                    );
                  } else if (pathname === '/studio/create') {
                    return (
                      <>
                        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                          <Plus className="h-5 w-5 text-[rgb(163,255,18)]" />
                          Create
                        </h2>
                        <p className="text-sm text-white/60">New collection</p>
                      </>
                    );
                  } else if (pathname === '/studio/dashboard') {
                    return (
                      <>
                        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                          <PieChart className="h-5 w-5 text-[rgb(163,255,18)]" />
                          Dashboard
                        </h2>
                        <p className="text-sm text-white/60">Overview & insights</p>
                      </>
                    );
                  } else {
                    // Default studio page
                    return (
                      <>
                        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                          <Database className="h-5 w-5 text-[rgb(163,255,18)]" />
                          Studio
                        </h2>
                        <p className="text-sm text-white/60">Create & Manage</p>
                      </>
                    );
                  }
                })()
              ) : (pathname?.startsWith('/profile') || currentRoute === 'profile') ? (
                (() => {
                  // Determine specific profile page
                  if (pathname === '/profile/collection') {
                    return (
                      <>
                        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                          <Package className="h-5 w-5 text-[rgb(163,255,18)]" />
                          Collection
                        </h2>
                        <p className="text-sm text-white/60">Your NFT assets</p>
                      </>
                    );
                  } else if (pathname === '/profile/achievements') {
                    return (
                      <>
                        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                          <Trophy className="h-5 w-5 text-[rgb(163,255,18)]" />
                          Achievements
                        </h2>
                        <p className="text-sm text-white/60">Your progress</p>
                      </>
                    );
                  } else if (pathname === '/profile/stats') {
                    return (
                      <>
                        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                          <Activity className="h-5 w-5 text-[rgb(163,255,18)]" />
                          Activity
                        </h2>
                        <p className="text-sm text-white/60">Performance metrics</p>
                      </>
                    );
                  } else if (pathname === '/profile/settings') {
                    return (
                      <>
                        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                          <Settings className="h-5 w-5 text-[rgb(163,255,18)]" />
                          Settings
                        </h2>
                        <p className="text-sm text-white/60">Profile preferences</p>
                      </>
                    );
                  } else {
                    // Default profile page
                    return (
                      <>
                        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                          <User className="h-5 w-5 text-[rgb(163,255,18)]" />
                          Profile
                        </h2>
                        <p className="text-sm text-white/60">Personal dashboard</p>
                      </>
                    );
                  }
                })()
              ) : currentRoute === 'launchpad' || currentRoute === 'launchpad-detail' ? (
                <>
                  <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[rgb(163,255,18)]" />
                    Launchpad
                  </h2>
                  <p className="text-sm text-white/60">Discover new collections</p>
                </>
              ) : currentRoute === 'p2p' ? (
                <>
                  <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <ArrowRightLeft className="h-5 w-5" />
                    P2P Trading
                  </h2>
                  <p className="text-sm text-white/60">Search & Filter</p>
                </>
              ) : currentRoute === 'museum' ? (
                <>
                  <h2 className="text-4xl md:text-6xl font-bold text-white mb-2 tracking-tight">
                    TECH
                  </h2>
                  <p className="text-[#00ff88] text-sm md:text-base font-light">
                    Explore the Future
                  </p>
                </>
              ) : currentRoute === 'lists' ? (
                <>
                  <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <FolderOpen className="h-5 w-5 text-[rgb(163,255,18)]" />
                    Your Lists
                  </h2>
                  <p className="text-sm text-white/60">{listsData?.lists.length || 0} lists</p>
                </>
              ) : currentRoute === 'play-casual' ? (
                <>
                  <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-green-400" />
                    Casual Zone
                  </h2>
                  <p className="text-sm text-white/60">Relax & Enjoy</p>
                </>
              ) : currentRoute === 'play-competitive' ? (
                <>
                  <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-orange-400" />
                    Competitive Arena
                  </h2>
                  <p className="text-sm text-white/60">Climb the Ranks</p>
                </>
              ) : currentRoute === 'play-casino' ? (
                <>
                  <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <Crown className="h-5 w-5 text-purple-400" />
                    High Stakes Casino
                  </h2>
                  <p className="text-sm text-white/60">Fortune Awaits</p>
                </>
              ) : currentRoute === 'play-1v1' ? (
                <>
                  <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <Gem className="h-5 w-5 text-cyan-400" />
                    1v1 Arena Hub
                  </h2>
                  <p className="text-sm text-white/60">Challenge Players</p>
                </>
              ) : currentRoute === 'lootboxes-detail' ? (
                <>
                  <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <Box className="h-5 w-5 text-purple-400" />
                    Lootbox Collection
                  </h2>
                  <p className="text-sm text-white/60">Explore & Discover</p>
                </>
              ) : (pathname?.startsWith('/collection/') || currentRoute === 'collection') ? (
                <>
                  <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <Layers className="h-5 w-5 text-cyan-400" />
                    Collection Manager
                  </h2>
                  <p className="text-sm text-white/60">Manage your collection</p>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Marketplace
                  </h2>
                  <p className="text-sm text-white/60">Browse 50,000+ items</p>
                </>
              )}
            </motion.div>

            {/* View Controls */}
            {currentRoute !== 'museum' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="flex items-center justify-between mt-4"
              >
                {currentRoute === 'studio' && studioData ? (
                <div className="w-full space-y-3">
                  <Input
                    placeholder="Search everything..."
                    value={studioData.searchQuery}
                    onChange={(e) => studioData.onSearchChange(e.target.value)}
                    className="bg-black/30 border-white/20 text-white placeholder:text-white/40"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant={studioData.viewMode === 'grid' ? "default" : "outline"}
                      size="sm"
                      onClick={() => studioData.onViewModeChange('grid')}
                      className="flex-1"
                    >
                      <Grid3x3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={studioData.viewMode === 'list' ? "default" : "outline"}
                      size="sm"
                      onClick={() => studioData.onViewModeChange('list')}
                      className="flex-1"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : currentRoute?.startsWith('play-') ? (
                <div className="w-full space-y-3">
                  <Input
                    placeholder={`Search ${currentRoute?.split('-')[1]} games...`}
                    className="bg-black/30 border-white/20 text-white placeholder:text-white/40"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === 'grid' ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="flex-1"
                    >
                      <Grid3x3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="flex-1"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : currentRoute === 'p2p' && p2pData ? (
                <div className="w-full space-y-3">
                  <Input
                    placeholder="Search traders..."
                    value={p2pData.searchQuery}
                    onChange={(e) => p2pData.onSearchChange(e.target.value)}
                    className="bg-black/30 border-white/20 text-white placeholder:text-white/40"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant={p2pData.gridViewMode === 'grid' ? "default" : "outline"}
                      size="sm"
                      onClick={() => p2pData.onGridViewModeChange('grid')}
                      className="flex-1"
                    >
                      <Grid3x3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={p2pData.gridViewMode === 'list' ? "default" : "outline"}
                      size="sm"
                      onClick={() => p2pData.onGridViewModeChange('list')}
                      className="flex-1"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : currentRoute === 'lists' && listsData ? (
                <div className="w-full space-y-3">
                  <Button
                    onClick={listsData.onCreateList}
                    className="w-full bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90 font-bold"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New List
                  </Button>
                </div>
              ) : currentRoute === 'lootboxes-detail' ? (
                <div className="w-full space-y-3">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-2"
                    >
                      <Filter className="w-3 h-3" />
                      Rarity
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-2"
                    >
                      <TrendingUp className="w-3 h-3" />
                      Price
                    </Button>
                  </div>
                </div>
              ) : currentRoute === 'launchpad' || currentRoute === 'launchpad-detail' ? (
                <div className="w-full space-y-3">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-2 border-[rgb(163,255,18)]/30 text-[rgb(163,255,18)] hover:bg-[rgb(163,255,18)]/10"
                    >
                      <Star className="w-3 h-3" />
                      Featured
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-2 border-white/20 text-white hover:bg-white/10"
                    >
                      <TrendingUp className="w-3 h-3" />
                      Trending
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-2 border-white/20 text-white hover:bg-white/10"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Live
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-2 border-white/20 text-white hover:bg-white/10"
                    >
                      <Calendar className="w-3 h-3" />
                      Recent
                    </Button>
                  </div>
                </div>
              ) : (pathname?.startsWith('/collection/') || currentRoute === 'collection') && collectionData ? (
                <div className="w-full space-y-3">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-2 border-white/20 text-white hover:bg-white/10"
                    >
                      <BarChart3 className="w-3 h-3" />
                      Analytics
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-2 border-white/20 text-white hover:bg-white/10"
                    >
                      <Settings className="w-3 h-3" />
                      Settings
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      onClick={() => setViewMode('grid')}
                      className="p-2"
                    >
                      <Grid3x3 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      onClick={() => setViewMode('list')}
                      className="p-2"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>

                  <Button size="sm" variant="outline" className="gap-2">
                    <Filter className="w-3 h-3" />
                    Filters
                  </Button>
                </>
              )}
              </motion.div>
            )}
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            {currentRoute === 'lists' && listsData ? (
              <div className="p-6">
                {/* Create List Form */}
                {listsData.isCreatingList && (
                  <div className="bg-black border border-white/10 p-3 mb-4 rounded-lg">
                    <Input
                      placeholder="List name..."
                      value={listsData.newListName}
                      onChange={(e) => listsData.onNewListNameChange(e.target.value)}
                      className="mb-2 bg-black/60 border-white/20 text-white"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={listsData.onConfirmCreate}
                        className="flex-1 bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90"
                      >
                        Create
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={listsData.onCancelCreate}
                        className="flex-1 border-white/20 text-white hover:bg-white/10"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Lists */}
                <div className="space-y-2">
                  {listsData.lists.map((list: any) => {
                    const isSelected = listsData.selectedList?.id === list.id;
                    const IconComponent = list.type === 'watchlist' ? Heart : list.type === 'favorites' ? Star : FolderOpen;

                    return (
                      <button
                        key={list.id}
                        onClick={() => listsData.onSelectList(list)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-gradient-to-br from-[rgb(163,255,18)]/20 to-[rgb(163,255,18)]/5 border-[rgb(163,255,18)] text-white'
                            : 'bg-gradient-to-br from-white/5 to-transparent border-white/10 text-white/60 hover:border-white/30 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className={`p-2 rounded-lg flex-shrink-0 ${
                              isSelected ? 'bg-[rgb(163,255,18)]/20' : 'bg-white/5'
                            }`}>
                              <IconComponent className={`w-4 h-4 ${isSelected ? 'text-[rgb(163,255,18)]' : 'text-white/40'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-bold truncate">{list.name}</h3>
                              <Badge className={`text-xs px-2 py-0.5 mt-1 ${
                                isSelected
                                  ? 'bg-[rgb(163,255,18)]/30 text-[rgb(163,255,18)] border-[rgb(163,255,18)]/50'
                                  : 'bg-white/10 text-white/60 border-white/20'
                              }`}>
                                {list._count.items} items
                              </Badge>
                            </div>
                          </div>
                          {list.type === 'custom' && (
                            <button
                              className="p-1 hover:bg-white/10 rounded"
                              onClick={(e) => {
                                e.stopPropagation();
                                listsData.onDeleteList(list.id);
                              }}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (pathname?.startsWith('/studio') || currentRoute === 'studio') ? (
              <>
                {/* Studio Stats (only when studioData is available) */}
                {studioData && (
                  <div className="p-6 border-b border-white/10">
                    <motion.h3
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-sm font-semibold text-white/80 mb-4"
                    >
                      STUDIO STATS
                    </motion.h3>
                    <div className="space-y-4">
                      {[
                        { label: 'Projects', value: studioData.projects.length, icon: Box },
                        { label: 'Collections', value: studioData.collections.length, icon: Layers },
                        { label: 'NFTs', value: studioData.nfts.length, icon: Sparkles },
                      ].map(({ label, value, icon: Icon }, index) => (
                        <motion.div
                          key={label}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + index * 0.05 }}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-[rgb(163,255,18)]" />
                            <span className="text-white/80 text-sm">{label}</span>
                          </div>
                          <Badge className="bg-white/10 text-white border-white/20">
                            {value}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="p-6 border-b border-white/10">
                  <motion.h3
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-sm font-semibold text-white/80 mb-4"
                  >
                    QUICK ACTIONS
                  </motion.h3>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="space-y-2"
                  >
                    {/* Page-specific quick actions */}
                    {pathname && pathname.startsWith('/studio/collections/') ? (
                      // Collection detail page actions
                      (() => {
                        const m = pathname.match(/^\/studio\/collections\/([^\/]+)/);
                        const collectionId = m ? m[1] : null;
                        return (
                          <>
                            <Button className="w-full bg-gradient-to-r from-[rgb(163,255,18)] to-green-400 hover:from-green-400 hover:to-[rgb(163,255,18)] text-black font-bold" onClick={() => collectionId && router.push(`/studio/collections/${collectionId}/edit`)}>
                              <Edit3 className="w-4 h-4 mr-2" /> Edit Metadata
                            </Button>
                            <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10" onClick={() => collectionId && router.push(`/studio/collections/${collectionId}/airdrop`)}>
                              <Zap className="w-4 h-4 mr-2" /> Airdrop
                            </Button>
                            <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10" onClick={() => collectionId && router.push(`/studio/collections/${collectionId}/mint`)}>
                              <Plus className="w-4 h-4 mr-2" /> Quick Mint
                            </Button>
                          </>
                        );
                      })()
                    ) : pathname === '/studio/collections' ? (
                      // Collections page actions
                      <>
                        <Button className="w-full bg-gradient-to-r from-[rgb(163,255,18)] to-green-400 hover:from-green-400 hover:to-[rgb(163,255,18)] text-black font-bold" onClick={() => router.push('/studio/create')}>
                          <Plus className="w-4 h-4 mr-2" /> New Collection
                        </Button>
                        <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                          <Upload className="w-4 h-4 mr-2" /> Import Collection
                        </Button>
                        <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                          <Layers className="w-4 h-4 mr-2" /> Bulk Upload
                        </Button>
                      </>
                    ) : pathname === '/studio/projects' ? (
                      // Projects page actions
                      <>
                        <Button className="w-full bg-gradient-to-r from-[rgb(163,255,18)] to-green-400 hover:from-green-400 hover:to-[rgb(163,255,18)] text-black font-bold">
                          <FolderOpen className="w-4 h-4 mr-2" /> New Project
                        </Button>
                        <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                          <Upload className="w-4 h-4 mr-2" /> Import Project
                        </Button>
                        <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                          <Share className="w-4 h-4 mr-2" /> Share Project
                        </Button>
                      </>
                    ) : pathname === '/studio/nfts' ? (
                      // NFTs page actions
                      <>
                        <Button className="w-full bg-gradient-to-r from-[rgb(163,255,18)] to-green-400 hover:from-green-400 hover:to-[rgb(163,255,18)] text-black font-bold">
                          <Image className="w-4 h-4 mr-2" /> Create NFT
                        </Button>
                        <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                          <Upload className="w-4 h-4 mr-2" /> Batch Upload
                        </Button>
                        <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                          <Edit3 className="w-4 h-4 mr-2" /> Bulk Edit
                        </Button>
                      </>
                    ) : pathname === '/studio/analytics' ? (
                      // Analytics page actions
                      <>
                        <Button className="w-full bg-gradient-to-r from-[rgb(163,255,18)] to-green-400 hover:from-green-400 hover:to-[rgb(163,255,18)] text-black font-bold">
                          <BarChart3 className="w-4 h-4 mr-2" /> Export Report
                        </Button>
                        <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                          <PieChart className="w-4 h-4 mr-2" /> Custom Dashboard
                        </Button>
                        <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                          <Activity className="w-4 h-4 mr-2" /> Track Events
                        </Button>
                      </>
                    ) : pathname === '/studio/settings' ? (
                      // Settings page actions
                      <>
                        <Button className="w-full bg-gradient-to-r from-[rgb(163,255,18)] to-green-400 hover:from-green-400 hover:to-[rgb(163,255,18)] text-black font-bold">
                          <Settings className="w-4 h-4 mr-2" /> Preferences
                        </Button>
                        <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                          <Users className="w-4 h-4 mr-2" /> Team Members
                        </Button>
                        <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                          <Shield className="w-4 h-4 mr-2" /> Security
                        </Button>
                      </>
                    ) : (
                      // Default studio actions
                      <>
                        <Button className="w-full bg-gradient-to-r from-[rgb(163,255,18)] to-green-400 hover:from-green-400 hover:to-[rgb(163,255,18)] text-black font-bold">
                          <Database className="w-4 h-4 mr-2" /> Quick Start
                        </Button>
                        <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                          <FolderOpen className="w-4 h-4 mr-2" /> Browse Projects
                        </Button>
                        <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                          <TrendingUp className="w-4 h-4 mr-2" /> View Analytics
                        </Button>
                      </>
                    )}
                  </motion.div>
                </div>

                {/* Resources & Help */}
                <div className="p-6">
                  <motion.h3
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-sm font-semibold text-white/80 mb-4"
                  >
                    RESOURCES
                  </motion.h3>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                    className="space-y-3"
                  >
                    <a href="#" className="block text-white/60 hover:text-[rgb(163,255,18)] transition-colors text-sm">
                      📚 Documentation
                    </a>
                    <a href="#" className="block text-white/60 hover:text-[rgb(163,255,18)] transition-colors text-sm">
                      🎥 Video Tutorials
                    </a>
                    <a href="#" className="block text-white/60 hover:text-[rgb(163,255,18)] transition-colors text-sm">
                      💡 Best Practices
                    </a>
                    <a href="#" className="block text-white/60 hover:text-[rgb(163,255,18)] transition-colors text-sm">
                      🚀 API Reference
                    </a>
                    <a href="#" className="block text-white/60 hover:text-[rgb(163,255,18)] transition-colors text-sm">
                      💬 Community Forum
                    </a>
                  </motion.div>
                </div>
              </>
            ) : (pathname?.startsWith('/profile') || currentRoute === 'profile') ? (
              <>
                {/* Profile Navigation */}
                <div className="p-6 border-b border-white/10">
                  <motion.h3
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-sm font-semibold text-white/80 mb-4"
                  >
                    NAVIGATION
                  </motion.h3>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="space-y-2"
                  >
                    <Button
                      variant={pathname === '/profile' ? 'default' : 'ghost'}
                      className="w-full justify-start gap-2"
                      onClick={() => router.push('/profile')}
                    >
                      <User className="w-4 h-4" /> Dashboard
                    </Button>
                    <Button
                      variant={pathname === '/profile/collection' ? 'default' : 'ghost'}
                      className="w-full justify-start gap-2"
                      onClick={() => router.push('/profile/collection')}
                    >
                      <Package className="w-4 h-4" /> Collection
                    </Button>
                    <Button
                      variant={pathname === '/profile/achievements' ? 'default' : 'ghost'}
                      className="w-full justify-start gap-2"
                      onClick={() => router.push('/profile/achievements')}
                    >
                      <Trophy className="w-4 h-4" /> Achievements
                    </Button>
                    <Button
                      variant={pathname === '/profile/stats' ? 'default' : 'ghost'}
                      className="w-full justify-start gap-2"
                      onClick={() => router.push('/profile/stats')}
                    >
                      <Activity className="w-4 h-4" /> Activity
                    </Button>
                    <Button
                      variant={pathname === '/profile/settings' ? 'default' : 'ghost'}
                      className="w-full justify-start gap-2"
                      onClick={() => router.push('/profile/settings')}
                    >
                      <Settings className="w-4 h-4" /> Settings
                    </Button>
                  </motion.div>
                </div>

                {/* Profile Stats */}
                <div className="p-6 border-b border-white/10">
                  <motion.h3
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-sm font-semibold text-white/80 mb-4"
                  >
                    PROFILE STATS
                  </motion.h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Level', value: '42', icon: Star },
                      { label: 'NFTs Owned', value: '127', icon: Package },
                      { label: 'Achievements', value: '24', icon: Trophy },
                      { label: 'Followers', value: '1.2K', icon: Users },
                    ].map(({ label, value, icon: Icon }, index) => (
                      <motion.div
                        key={label}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.05 }}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-[rgb(163,255,18)]" />
                          <span className="text-white/80 text-sm">{label}</span>
                        </div>
                        <Badge className="bg-white/10 text-white border-white/20">
                          {value}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="p-6 border-b border-white/10">
                  <motion.h3
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-sm font-semibold text-white/80 mb-4"
                  >
                    QUICK ACTIONS
                  </motion.h3>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                    className="space-y-2"
                  >
                    <Button className="w-full bg-gradient-to-r from-[rgb(163,255,18)] to-green-400 hover:from-green-400 hover:to-[rgb(163,255,18)] text-black font-bold">
                      <Edit3 className="w-4 h-4 mr-2" /> Edit Profile
                    </Button>
                    <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                      <Share className="w-4 h-4 mr-2" /> Share Profile
                    </Button>
                    <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                      <Settings className="w-4 h-4 mr-2" /> Privacy Settings
                    </Button>
                  </motion.div>
                </div>
              </>
            ) : currentRoute === 'lootboxes-detail' && lootboxData ? (
              <>
                {/* Lootbox Collection */}
                <div className="p-6 border-b border-white/10">
                  <motion.h3
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-sm font-semibold text-white/80 mb-4"
                  >
                    AVAILABLE LOOTBOXES ({lootboxData.availableLootboxes.length})
                  </motion.h3>
                  
                  <div className="space-y-3">
                    {lootboxData.availableLootboxes.map((lootbox, index) => (
                      <motion.div
                        key={lootbox.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + index * 0.05 }}
                      >
                        <GameCommandCard
                          option={{
                            id: lootbox.id,
                            title: lootbox.name,
                            description: `${lootbox.collection} • ${lootbox.discountPrice || lootbox.price} ETH`,
                            image: lootbox.image,
                            category: lootbox.rarity,
                            accentColor: lootbox.accentColor as any
                          }}
                          corner="topRight"
                          onClick={() => onNavigate && onNavigate(`lootbox-${lootbox.id}`)}
                        />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </>
            ) : (pathname?.startsWith('/collection/') || currentRoute === 'collection') && collectionData ? (
              <>
                {/* Collection Stats */}
                <div className="p-6 border-b border-white/10">
                  <motion.h3
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-sm font-semibold text-white/80 mb-4"
                  >
                    COLLECTION STATS
                  </motion.h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Total Supply', value: collectionData.totalSupply.toLocaleString(), icon: Box },
                      { label: 'Owners', value: collectionData.owners.toLocaleString(), icon: Users },
                      { label: 'Floor Price', value: collectionData.floorPrice, icon: TrendingUp },
                      { label: 'Volume', value: collectionData.volume, icon: BarChart3 },
                    ].map(({ label, value, icon: Icon }, index) => (
                      <motion.div
                        key={label}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.05 }}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-cyan-400" />
                          <span className="text-white/80 text-sm">{label}</span>
                        </div>
                        <Badge className="bg-white/10 text-white border-white/20">
                          {value}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Collection Management Tools */}
                <div className="p-6 border-b border-white/10">
                  <motion.h3
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-sm font-semibold text-white/80 mb-4"
                  >
                    MANAGEMENT TOOLS
                  </motion.h3>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="space-y-2"
                  >
                    {collectionData.isOwner ? (
                      <>
                        <Button className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-blue-500 hover:to-cyan-400 text-black font-bold">
                          <Upload className="w-4 h-4 mr-2" />
                          Add New NFTs
                        </Button>
                        <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                          <Edit3 className="w-4 h-4 mr-2" />
                          Edit Collection
                        </Button>
                        <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                          <Settings className="w-4 h-4 mr-2" />
                          Collection Settings
                        </Button>
                        <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                          <DollarSign className="w-4 h-4 mr-2" />
                          Pricing & Royalties
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-blue-500 hover:to-cyan-400 text-black font-bold">
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Browse Items
                        </Button>
                        <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                          <Heart className="w-4 h-4 mr-2" />
                          Add to Watchlist
                        </Button>
                        <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                          <Share className="w-4 h-4 mr-2" />
                          Share Collection
                        </Button>
                      </>
                    )}
                  </motion.div>
                </div>

                {/* Collection Analytics */}
                <div className="p-6 border-b border-white/10">
                  <motion.h3
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-sm font-semibold text-white/80 mb-4"
                  >
                    ANALYTICS
                  </motion.h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/5 rounded-lg p-2">
                      <div className="text-xs text-white/60">Listed</div>
                      <div className="text-lg font-bold text-white">{collectionData.listed}</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2">
                      <div className="text-xs text-white/60">Avg Price</div>
                      <div className="text-lg font-bold text-cyan-400">
                        {(parseFloat(collectionData.floorPrice) * 1.3).toFixed(1)} ETH
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2">
                      <div className="text-xs text-white/60">24h Volume</div>
                      <div className="text-lg font-bold text-white">{randomStats?.volume24h || '0.0'} ETH</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2">
                      <div className="text-xs text-white/60">7d Change</div>
                      <div className="text-lg font-bold text-green-400">+{randomStats?.change7d || '0.0'}%</div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="p-6">
                  <motion.h3
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.55 }}
                    className="text-sm font-semibold text-white/80 mb-4"
                  >
                    RECENT ACTIVITY
                  </motion.h3>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="space-y-3"
                  >
                    {randomStats?.activity.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                        <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">#{1000 + i}</p>
                          <p className="text-xs text-white/60">{item.time}</p>
                        </div>
                        <div className="text-right">
                          <Badge className={`text-[10px] ${
                            i % 3 === 0 ? 'bg-green-500/20 text-green-400' :
                            i % 3 === 1 ? 'bg-blue-500/20 text-blue-400' :
                            'bg-orange-500/20 text-orange-400'
                          }`}>
                            {i % 3 === 0 ? 'Sale' : i % 3 === 1 ? 'List' : 'Transfer'}
                          </Badge>
                          <p className="text-xs font-bold text-white">
                            {item.price} ETH
                          </p>
                        </div>
                      </div>
                    )) || [...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                        <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">#{1000 + i}</p>
                          <p className="text-xs text-white/60">Loading...</p>
                        </div>
                        <div className="text-right">
                          <Badge className="text-[10px] bg-gray-500/20 text-gray-400">
                            ---
                          </Badge>
                          <p className="text-xs font-bold text-white">
                            --- ETH
                          </p>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                </div>
              </>
            ) : currentRoute === 'launchpad' || currentRoute === 'launchpad-detail' ? (
              <>
                {/* Launchpad Stats */}
                <div className="p-6 border-b border-white/10">
                  <motion.h3
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-sm font-semibold text-white/80 mb-4"
                  >
                    LAUNCHPAD STATS
                  </motion.h3>
                  <div className="space-y-3">
                    {[
                      { label: 'New Collections', value: '24', icon: Sparkles },
                      { label: 'Live Projects', value: '47', icon: CheckCircle2 },
                      { label: 'Total Volume', value: '1.2K ETH', icon: TrendingUp },
                      { label: 'Active Creators', value: '156', icon: Users }
                    ].map(({ label, value, icon: Icon }, index) => (
                      <motion.div
                        key={label}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.05 }}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-[rgb(163,255,18)]" />
                          <span className="text-white/80 text-sm">{label}</span>
                        </div>
                        <Badge className="bg-white/10 text-white border-white/20">
                          {value}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Trending Categories */}
                <div className="p-6 border-b border-white/10">
                  <motion.h3
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-sm font-semibold text-white/80 mb-4"
                  >
                    TRENDING CATEGORIES
                  </motion.h3>
                  <div className="space-y-2">
                    {[
                      { name: 'Gaming', projects: 18, growth: '+45%' },
                      { name: 'Art', projects: 12, growth: '+23%' },
                      { name: 'Collectibles', projects: 8, growth: '+67%' },
                      { name: 'Music', projects: 6, growth: '+89%' }
                    ].map((category, index) => (
                      <motion.div
                        key={category.name}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45 + index * 0.05 }}
                        className="flex items-center justify-between p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">{category.name}</p>
                          <p className="text-xs text-white/60">{category.projects} projects</p>
                        </div>
                        <Badge className="bg-[rgb(163,255,18)]/20 text-[rgb(163,255,18)] border-[rgb(163,255,18)]/30 text-xs">
                          {category.growth}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Top Collections */}
                <div className="p-6">
                  <motion.h3
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-sm font-semibold text-white/80 mb-4"
                  >
                    TOP COLLECTIONS
                  </motion.h3>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                    className="space-y-3"
                  >
                    {randomStats?.collectionPrices.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                        <div className="w-8 h-8 bg-gradient-to-r from-[rgb(163,255,18)] to-green-400 rounded-lg flex items-center justify-center">
                          <span className="text-black text-xs font-bold">#{i + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">Collection {i + 1}</p>
                          <p className="text-xs text-white/60">{500 + i * 100} items</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-white">
                            {item.price} ETH
                          </p>
                          <p className="text-[10px] text-[rgb(163,255,18)]">
                            +{item.change}%
                          </p>
                        </div>
                      </div>
                    )) || [...Array(4)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                        <div className="w-8 h-8 bg-gradient-to-r from-[rgb(163,255,18)] to-green-400 rounded-lg flex items-center justify-center">
                          <span className="text-black text-xs font-bold">#{i + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">Collection {i + 1}</p>
                          <p className="text-xs text-white/60">--- items</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-white">
                            --- ETH
                          </p>
                          <p className="text-[10px] text-[rgb(163,255,18)]">
                            ---%
                          </p>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                </div>
              </>
            ) : currentRoute === 'p2p' ? (
              <>
                {/* My NFT Collection for P2P Trading */}
                <div className="p-6 border-b border-white/10">
                  <motion.h3
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-sm font-semibold text-white/80 mb-4"
                  >
                    MY NFTS ({userNFTs.length})
                  </motion.h3>
                  
                  {/* Search and Filter */}
                  <div className="mb-4 space-y-3">
                    <Input
                      placeholder="Search your NFTs..."
                      className="bg-black/30 border-white/20 text-white placeholder:text-white/40"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-white/20 text-white/70 hover:bg-white/10"
                      >
                        <Filter className="h-3 w-3 mr-1" />
                        Filter
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-white/20 text-white/70 hover:bg-white/10"
                      >
                        <SlidersHorizontal className="h-3 w-3 mr-1" />
                        Sort
                      </Button>
                    </div>
                  </div>
                  
                  {/* NFT List */}
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    <AnimatePresence mode="popLayout">
                      {userNFTs.map((nft, index) => (
                        <motion.div
                          key={nft.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{
                            opacity: 0,
                            scale: 0.5,
                            x: 400,
                            transition: { duration: 0.4, ease: "easeIn" }
                          }}
                          transition={{ delay: 0.3 + index * 0.05 }}
                          className="flex items-center gap-3 p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer group"
                          onClick={() => toggleUserNFTSelection(nft.id)}
                        >
                        <div className="relative">
                          <img 
                            src={nft.image} 
                            alt={nft.name} 
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          {nft.selected && (
                            <div className="absolute inset-0 bg-[rgb(163,255,18)]/20 rounded-lg flex items-center justify-center">
                              <CheckCircle2 className="w-6 h-6 text-[rgb(163,255,18)]" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{nft.name}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[rgb(163,255,18)] font-mono">{nft.value} ETH</span>
                            {nft.rarity && (
                              <Badge className="text-[10px] bg-purple-500/20 text-purple-400 border-purple-500/30">
                                {nft.rarity}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleUserNFTSelection(nft.id);
                          }}
                        >
                          {nft.selected ? (
                            <Minus className="h-4 w-4 text-red-400" />
                          ) : (
                            <Plus className="h-4 w-4 text-[rgb(163,255,18)]" />
                          )}
                        </Button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Trade Summary */}
                <div className="p-6 border-b border-white/10">
                  <motion.h3
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-sm font-semibold text-white/80 mb-4"
                  >
                    TRADE SUMMARY
                  </motion.h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/60">Selected NFTs</span>
                      <span className="text-sm font-bold text-white">{userNFTs.filter(nft => nft.selected).length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/60">Total Value</span>
                      <span className="text-sm font-bold text-[rgb(163,255,18)]">
                        {userNFTs.filter(nft => nft.selected).reduce((sum, nft) => sum + nft.value, 0).toFixed(1)} ETH
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/60">Trader Selected</span>
                      <span className="text-sm font-bold text-white">{selectedTrader?.name || 'None'}</span>
                    </div>
                  </div>
                  <Button 
                    className="w-full mt-4 bg-gradient-to-r from-[rgb(163,255,18)] to-green-400 hover:from-green-400 hover:to-[rgb(163,255,18)] text-black font-bold"
                    disabled={userNFTs.filter(nft => nft.selected).length === 0}
                    onClick={confirmUserNFTs}
                  >
                    {userNFTs.filter(nft => nft.selected).length > 0 
                      ? `Confirm ${userNFTs.filter(nft => nft.selected).length} NFTs` 
                      : 'Select NFTs First'
                    }
                  </Button>
                </div>

                {/* Quick Stats */}
                <div className="p-6">
                  <motion.h3
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-sm font-semibold text-white/80 mb-4"
                  >
                    MY STATS
                  </motion.h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/5 rounded-lg p-2">
                      <div className="text-xs text-white/60">Total NFTs</div>
                      <div className="text-lg font-bold text-white">{userNFTs.length}</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2">
                      <div className="text-xs text-white/60">Portfolio</div>
                      <div className="text-lg font-bold text-[rgb(163,255,18)]">42.8 ETH</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2">
                      <div className="text-xs text-white/60">Trades</div>
                      <div className="text-lg font-bold text-white">127</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2">
                      <div className="text-xs text-white/60">Success</div>
                      <div className="text-lg font-bold text-[rgb(163,255,18)]">94%</div>
                    </div>
                  </div>
                </div>
              </>
            ) : currentRoute === 'museum' && museumData ? (
              <>
                {/* Museum TECH Items - Netflix Style Banners */}
                <div className="p-8 md:p-12">
                  <div className="grid grid-cols-2 gap-4">
                    {museumData.items.map((item, index) => (
                      <motion.div
                        key={item.id}
                        className="relative group cursor-pointer"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                        onMouseEnter={() => setHoveredMuseumItem(item.id)}
                        onMouseLeave={() => setHoveredMuseumItem(null)}
                        onClick={() => museumData.onItemClick(item)}
                      >
                        <div className="relative aspect-video overflow-hidden rounded-lg">
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                          {/* Title Overlay */}
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <h3 className="text-lg font-bold text-white mb-1 transition-colors">
                              {item.title}
                            </h3>
                            <p className="text-xs text-white/70">{item.subtitle}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Play-specific content */}
                {currentRoute?.startsWith('play-') && (
                  <div className="p-6 border-b border-white/10">
                    <motion.h3
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-sm font-semibold text-white/80 mb-4"
                    >
                      {currentRoute === 'play-casual' && 'CASUAL GAMES'}
                      {currentRoute === 'play-competitive' && 'TOURNAMENTS'}
                      {currentRoute === 'play-casino' && 'CASINO GAMES'}
                      {currentRoute === 'play-1v1' && '1V1'}
                    </motion.h3>
                    <div className="space-y-4">
                      {currentRoute === 'play-casual' && [
                        { label: 'Active Games', value: '47', icon: Gamepad2 },
                        { label: 'Players Online', value: '12,543', icon: Users },
                        { label: 'Rewards Pool', value: '2,451 HYP', icon: Trophy },
                      ].map(({ label, value, icon: Icon }, index) => (
                        <motion.div
                          key={label}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + index * 0.05 }}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-[rgb(163,255,18)]" />
                            <span className="text-white/80 text-sm">{label}</span>
                          </div>
                          <Badge className="bg-white/10 text-white border-white/20">
                            {value}
                          </Badge>
                        </motion.div>
                      ))}
                      
                      {currentRoute === 'play-competitive' && [
                        { label: 'Live Tournaments', value: '8', icon: Trophy },
                        { label: 'Prize Pool', value: '15,000 USDC', icon: Crown },
                        { label: 'Competitors', value: '1,247', icon: Users },
                      ].map(({ label, value, icon: Icon }, index) => (
                        <motion.div
                          key={label}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + index * 0.05 }}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-[rgb(163,255,18)]" />
                            <span className="text-white/80 text-sm">{label}</span>
                          </div>
                          <Badge className="bg-white/10 text-white border-white/20">
                            {value}
                          </Badge>
                        </motion.div>
                      ))}
                      
                      {currentRoute === 'play-casino' && [
                        { label: 'Live Tables', value: '23', icon: Sparkles },
                        { label: 'Jackpot Pool', value: '87.5 ETH', icon: Gem },
                        { label: 'Active Players', value: '3,891', icon: Users },
                      ].map(({ label, value, icon: Icon }, index) => (
                        <motion.div
                          key={label}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + index * 0.05 }}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-[rgb(163,255,18)]" />
                            <span className="text-white/80 text-sm">{label}</span>
                          </div>
                          <Badge className="bg-white/10 text-white border-white/20">
                            {value}
                          </Badge>
                        </motion.div>
                      ))}
                      
                      {currentRoute === 'play-1v1' && [
                        { label: 'Active Worlds', value: '12', icon: Sparkles },
                        { label: 'Concurrent Users', value: '8,764', icon: Users },
                        { label: 'Land Parcels', value: '1,247', icon: Box },
                      ].map(({ label, value, icon: Icon }, index) => (
                        <motion.div
                          key={label}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + index * 0.05 }}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-[rgb(163,255,18)]" />
                            <span className="text-white/80 text-sm">{label}</span>
                          </div>
                          <Badge className="bg-white/10 text-white border-white/20">
                            {value}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Categories */}
                <div className="p-6 border-b border-white/10">
                  <motion.h3
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-sm font-semibold text-white/80 mb-4"
                  >
                    CATEGORIES
                  </motion.h3>
                  
                  <div className="space-y-1">
                    {categories.map((category, index) => {
                      const Icon = category.icon;
                      const isExpanded = expandedCategories.includes(category.id);
                      
                      return (
                        <motion.div
                          key={category.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + index * 0.05 }}
                        >
                          <button
                            onClick={() => toggleCategory(category.id)}
                            className="w-full flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="w-4 h-4 text-white/70 group-hover:text-[rgb(163,255,18)]" />
                              <span className="text-sm text-white/90">{category.name}</span>
                              {category.badge && (
                                <Badge className="text-[10px] bg-red-500/20 text-red-400 border-red-500/30">
                                  {category.badge}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-white/40">{category.count.toLocaleString()}</span>
                              {category.subcategories && (
                                <ChevronRight className={`w-3 h-3 text-white/40 transition-transform ${
                                  isExpanded ? 'rotate-90' : ''
                                }`} />
                              )}
                            </div>
                          </button>
                          
                          {/* Subcategories */}
                          <AnimatePresence>
                            {isExpanded && category.subcategories && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="ml-6 overflow-hidden"
                              >
                                {category.subcategories.map((sub) => (
                                  <button
                                    key={sub.id}
                                    className="w-full flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors"
                                  >
                                    <span className="text-xs text-white/60">{sub.name}</span>
                                    <span className="text-xs text-white/30">{sub.count.toLocaleString()}</span>
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Price Range */}
                <div className="p-6 border-b border-white/10">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <h3 className="text-sm font-semibold text-white/80 mb-4">PRICE RANGE</h3>
                    <div className="space-y-4">
                      <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/60">0 ETH</span>
                        <span className="text-sm font-bold text-[rgb(163,255,18)]">
                          {priceRange[0]} - {priceRange[1]} ETH
                        </span>
                        <span className="text-xs text-white/60">100+ ETH</span>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Additional Filters */}
                <div className="p-6">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                    className="space-y-4"
                  >
                    <h3 className="text-sm font-semibold text-white/80 mb-4">FILTERS</h3>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="verified" className="text-sm text-white/70 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-[rgb(163,255,18)]" />
                        Verified Only
                      </Label>
                      <Switch
                        id="verified"
                        checked={showVerifiedOnly}
                        onCheckedChange={setShowVerifiedOnly}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Button className="w-full justify-start gap-2" variant="outline" size="sm">
                        <Star className="w-4 h-4" />
                        Featured Items
                      </Button>
                      <Button className="w-full justify-start gap-2" variant="outline" size="sm">
                        <TrendingUp className="w-4 h-4" />
                        Recently Listed
                      </Button>
                      <Button className="w-full justify-start gap-2" variant="outline" size="sm">
                        <Sparkles className="w-4 h-4" />
                        Ending Soon
                      </Button>
                    </div>
                  </motion.div>
                </div>
              </>
            )}
          </div>

          {/* Footer Actions */}
          {currentRoute === 'studio' ? (
            <div className="p-4 border-t border-white/10 bg-black/50">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-center"
              >
                <p className="text-xs text-white/40">
                  Studio v1.0
                </p>
              </motion.div>
            </div>
          ) : currentRoute === 'lootboxes-detail' ? (
            <div className="p-4 border-t border-white/10 bg-black/50">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-center"
              >
                <p className="text-xs text-white/40">
                  Lootbox Explorer v1.0
                </p>
              </motion.div>
            </div>
          ) : currentRoute === 'p2p' ? (
            <div className="p-4 border-t border-white/10 bg-black/50">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-center"
              >
                <p className="text-xs text-white/40">
                  P2P Trading v1.0
                </p>
              </motion.div>
            </div>
          ) : (pathname?.startsWith('/collection/') || currentRoute === 'collection') ? (
            <div className="p-4 border-t border-white/10 bg-black/50">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-center"
              >
                <p className="text-xs text-white/40">
                  Collection Manager v1.0
                </p>
              </motion.div>
            </div>
          ) : currentRoute === 'museum' ? null : (
            <div className="p-4 border-t border-white/10 bg-black/50">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-2"
              >
                <Button variant="ghost" size="sm" className="flex-1">
                  Clear All
                </Button>
                <Button size="sm" className="flex-1 bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90">
                  Apply Filters
                </Button>
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}