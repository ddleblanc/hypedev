"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRouter } from "next/navigation";
import { StudioNFTs } from "@/components/studio/views";
import { StudioMainContent } from "@/components/studio/studio-main-content";
import { useStudioData } from "@/hooks/use-studio-data";
import {
  Plus, Grid3x3, List, Filter, Search, ArrowLeft, Upload,
  Sparkles, Hash, Crown, Star, Diamond,
  MoreVertical, Download, Shuffle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function NFTsContent() {
  const { nfts, collections, isLoading, error, refreshData } = useStudioData();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [rarityFilter, setRarityFilter] = useState('all');
  const [isMobile, setIsMobile] = useState(false);

  const router = useRouter();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate filters
  const mintedNFTs = nfts.filter((n: any) => n.isMinted).length;
  const unmintedNFTs = nfts.filter((n: any) => !n.isMinted).length;
  const legendaryNFTs = nfts.filter((n: any) => n.rarityTier === 'Legendary').length;
  const epicNFTs = nfts.filter((n: any) => n.rarityTier === 'Epic').length;
  const rareNFTs = nfts.filter((n: any) => n.rarityTier === 'Rare').length;

  const filters = [
    { id: 'all', label: 'All NFTs', count: nfts.length },
    { id: 'minted', label: 'Minted', count: mintedNFTs },
    { id: 'unminted', label: 'Unminted', count: unmintedNFTs },
    { id: 'recent', label: 'Recent', count: 10 } // Mock data
  ];

  const rarityFilters = [
    { id: 'all', label: 'All Rarities', icon: Sparkles },
    { id: 'legendary', label: 'Legendary', icon: Crown, count: legendaryNFTs, color: 'text-yellow-500' },
    { id: 'epic', label: 'Epic', icon: Diamond, count: epicNFTs, color: 'text-purple-500' },
    { id: 'rare', label: 'Rare', icon: Star, count: rareNFTs, color: 'text-blue-500' },
    { id: 'common', label: 'Common', icon: Hash, color: 'text-gray-400' }
  ];

  const sortOptions = [
    { id: 'recent', label: 'Most Recent' },
    { id: 'rarity', label: 'Rarity Score' },
    { id: 'rank', label: 'Rarity Rank' },
    { id: 'traits', label: 'Most Traits' },
    { id: 'name', label: 'Alphabetical' }
  ];

  // Calculate stats
  const totalNFTs = nfts.length;
  const totalCollections = collections.length;
  const avgRarityScore = nfts.length > 0
    ? (nfts.reduce((acc: number, n: any) => acc + (n.rarityScore || 0), 0) / nfts.length).toFixed(2)
    : "0";
  const totalValue = "156.7 ETH"; // Mock data
  const uniqueHolders = "892"; // Mock data

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <div className="text-red-500 text-2xl">⚠</div>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Error Loading NFTs</h3>
          <p className="text-sm text-white/60 mb-4">{error}</p>
          <Button onClick={refreshData} className="bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading && nfts.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[rgb(163,255,18)]"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full min-h-screen bg-black"
    >
      {isMobile ? (
        // MOBILE LAYOUT
        <div className="relative">
          {/* Mobile Hero */}
          <div className="relative h-[60vh] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-black to-yellow-900/20" />
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fbbf24' fill-opacity='0.3'%3E%3Cpath d='M0 20h20v20H0V20zm20 0h20v20H20V20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }} />
            </div>

            <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
              <Button size="icon" variant="ghost" className="bg-black/40 backdrop-blur text-white" onClick={() => router.back()}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" className="bg-black/40 backdrop-blur text-white">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-black/90 backdrop-blur border-white/10">
                  <DropdownMenuItem className="text-white hover:text-black">
                    <Plus className="w-4 h-4 mr-2" />
                    Create NFT
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-white hover:text-black">
                    <Upload className="w-4 h-4 mr-2" />
                    Bulk Upload
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem className="text-white hover:text-black">
                    <Download className="w-4 h-4 mr-2" />
                    Export Metadata
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-blue-500 text-white font-bold text-xs">NFT VAULT</Badge>
                <Badge className="bg-yellow-500 text-black font-bold text-xs">{totalNFTs} ITEMS</Badge>
              </div>

              <h1 className="text-4xl font-black text-white mb-2">NFT Gallery</h1>
              <p className="text-white/80 text-sm mb-4">Create, manage, and mint your digital assets</p>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <Card className="bg-black/40 backdrop-blur border-white/10">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-yellow-400" />
                      <div>
                        <p className="text-[10px] text-white/60 uppercase">Minted</p>
                        <p className="text-lg font-bold text-white">{mintedNFTs}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/40 backdrop-blur border-white/10">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-yellow-500" />
                      <div>
                        <p className="text-[10px] text-white/60 uppercase">Legendary</p>
                        <p className="text-lg font-bold text-yellow-500">{legendaryNFTs}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/40 backdrop-blur border-white/10">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <Diamond className="w-4 h-4 text-purple-400" />
                      <div>
                        <p className="text-[10px] text-white/60 uppercase">Epic</p>
                        <p className="text-lg font-bold text-purple-400">{epicNFTs}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/40 backdrop-blur border-white/10">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-blue-400" />
                      <div>
                        <p className="text-[10px] text-white/60 uppercase">Rare</p>
                        <p className="text-lg font-bold text-blue-400">{rareNFTs}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1 bg-blue-500 text-white hover:bg-blue-600 font-bold">
                  <Plus className="w-4 h-4 mr-2" />
                  Create NFT
                </Button>
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  <Shuffle className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Filters */}
          <div className="sticky top-0 z-30 bg-black border-b border-white/10">
            <div className="flex overflow-x-auto">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition-all relative whitespace-nowrap ${
                    activeFilter === filter.id ? 'text-white' : 'text-white/60'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {filter.label}
                    {filter.count !== undefined && (
                      <Badge className="bg-white/10 text-white text-[10px] ml-1">{filter.count}</Badge>
                    )}
                  </div>
                  {activeFilter === filter.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Content */}
          <div className="min-h-screen pb-20 bg-black">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-white/60">{nfts.length} NFTs</p>
                <div className="flex gap-1">
                  <Button size="icon" variant={viewMode === 'grid' ? 'default' : 'ghost'} onClick={() => setViewMode('grid')} className="h-8 w-8">
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant={viewMode === 'list' ? 'default' : 'ghost'} onClick={() => setViewMode('list')} className="h-8 w-8">
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <StudioMainContent currentView="nfts">
                <StudioNFTs nfts={nfts} viewMode={viewMode} />
              </StudioMainContent>
            </div>
          </div>
        </div>
      ) : (
        // DESKTOP LAYOUT
        <div className="relative">
          {/* Desktop Hero */}
          <motion.div
            ref={heroRef}
            className="relative h-[40vh] overflow-hidden"
            style={{ scale: heroScale }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-black to-yellow-900/30" />
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fbbf24' fill-opacity='0.4'%3E%3Cpath d='M0 20h20v20H0V20zm20 0h20v20H20V20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }} />
            </div>

            <motion.div style={{ opacity: heroOpacity }} className="absolute bottom-0 left-0 right-0 px-8 py-8">
              <div className="max-w-7xl">
                <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="flex items-center gap-3 mb-4">
                  <Badge className="bg-blue-500 text-white font-bold">NFT VAULT</Badge>
                  <Badge variant="outline" className="border-white/30 text-white">{totalNFTs} TOTAL</Badge>
                  <Badge variant="outline" className="border-yellow-500/50 text-yellow-500">{mintedNFTs} MINTED</Badge>
                </motion.div>

                <motion.h1 initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="text-5xl md:text-6xl font-bold text-white mb-4">
                  NFT Gallery & Creator
                </motion.h1>

                <motion.p initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="text-lg text-white/90 mb-6 max-w-2xl">
                  Design unique NFTs, manage metadata, calculate rarity scores, and mint your digital masterpieces
                </motion.p>

                <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.8 }} className="flex items-center gap-4">
                  <Button className="bg-blue-500 text-white hover:bg-blue-600 font-bold px-6 py-3">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New NFT
                  </Button>
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 px-6 py-3">
                    <Upload className="h-4 w-4 mr-2" />
                    Bulk Upload
                  </Button>
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 px-6 py-3">
                    <Shuffle className="h-4 w-4 mr-2" />
                    Generate Collection
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>

          {/* Desktop Sticky Header */}
          <div className="sticky top-0 z-30 bg-black/95 backdrop-blur-lg border-b border-white/10">
            <div className="px-8 py-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-8">
                  <div>
                    <p className="text-sm text-white/60">Total NFTs</p>
                    <p className="text-2xl font-bold text-white">{totalNFTs}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Minted</p>
                    <p className="text-2xl font-bold text-[rgb(163,255,18)]">{mintedNFTs}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Collections</p>
                    <p className="text-2xl font-bold text-white">{totalCollections}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Total Value</p>
                    <p className="text-2xl font-bold text-white">{totalValue}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Holders</p>
                    <p className="text-2xl font-bold text-white">{uniqueHolders}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Avg Rarity</p>
                    <p className="text-2xl font-bold text-white">{avgRarityScore}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 h-4 w-4" />
                    <Input
                      placeholder="Search NFTs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64 bg-black/40 border-white/20 text-white placeholder:text-white/60"
                    />
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="border-white/20 text-white">
                        <Sparkles className="h-4 w-4 mr-2" />
                        {rarityFilters.find(r => r.id === rarityFilter)?.label}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-black/90 backdrop-blur border-white/10">
                      {rarityFilters.map((rarity) => (
                        <DropdownMenuItem
                          key={rarity.id}
                          onClick={() => setRarityFilter(rarity.id)}
                          className="text-white hover:text-black"
                        >
                          <rarity.icon className={`h-4 w-4 mr-2 ${rarity.color || 'text-white'}`} />
                          {rarity.label}
                          {rarity.count !== undefined && (
                            <Badge className="ml-auto bg-white/10 text-white text-xs">{rarity.count}</Badge>
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="border-white/20 text-white">
                        <Filter className="h-4 w-4 mr-2" />
                        {sortOptions.find(s => s.id === sortBy)?.label}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-black/90 backdrop-blur border-white/10">
                      {sortOptions.map((option) => (
                        <DropdownMenuItem
                          key={option.id}
                          onClick={() => setSortBy(option.id)}
                          className="text-white hover:text-black"
                        >
                          {option.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div className="flex items-center gap-1">
                    <Button size="icon" variant={viewMode === 'grid' ? 'default' : 'ghost'} onClick={() => setViewMode('grid')} className="text-white">
                      <Grid3x3 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant={viewMode === 'list' ? 'default' : 'ghost'} onClick={() => setViewMode('list')} className="text-white">
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <nav className="flex items-center gap-1">
                {filters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`px-4 py-2 font-medium transition-all duration-200 border-b-2 ${
                      activeFilter === filter.id
                        ? 'text-white border-blue-500'
                        : 'text-white/60 border-transparent hover:text-white hover:border-white/30'
                    }`}
                  >
                    {filter.label}
                    {filter.count !== undefined && (
                      <Badge className="bg-white/10 text-white text-xs ml-2">{filter.count}</Badge>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Desktop Content */}
          <div className="px-8 py-8 min-h-screen">
            <StudioMainContent currentView="nfts">
              <StudioNFTs nfts={nfts} viewMode={viewMode} />
            </StudioMainContent>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function StudioNFTsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    }>
      <NFTsContent />
    </Suspense>
  );
}