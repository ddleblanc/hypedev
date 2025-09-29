"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRouter } from "next/navigation";
import { StudioNFTs } from "@/components/studio/views";
import { StudioMainContent } from "@/components/studio/studio-main-content";
import { useStudioData } from "@/hooks/use-studio-data";
import {
  Plus, Grid3x3, List, Filter, Search, Upload,
  Sparkles, Hash, Crown, Star, Diamond,
  Shuffle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  const [isClient, setIsClient] = useState(false);

  const heroRef = useRef<HTMLDivElement>(null);
  
  // Always call hooks at the top level, but the container ref might be null initially
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  // Transform values will work once the ref is attached
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  useEffect(() => {
    setIsClient(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
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
    { id: 'rare', label: 'Rare', icon: Star, count: rareNFTs, color: 'text-white' },
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
          <Button onClick={refreshData} className="bg-white/10 border border-white/20 text-white hover:bg-white/20">
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

  // Use static values during SSR, animated values after hydration
  const scaleValue = isClient && heroRef.current ? heroScale : 1;
  const opacityValue = isClient && heroRef.current ? heroOpacity : 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full min-h-screen bg-black"
    >
      <div className="relative">
        {/* Hero Section - Responsive */}
        <motion.div
          ref={heroRef}
          className="relative h-[50vh] md:h-[40vh] overflow-hidden"
          style={{ 
            scale: scaleValue,
            willChange: isClient ? 'transform' : 'auto'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black to-[rgb(163,255,18)]/30" />
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fbbf24' fill-opacity='0.15'%3E%3Cpath d='M0 20h20v20H0V20zm20 0h20v20H20V20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>

          <motion.div 
            style={{ 
              opacity: opacityValue
            }} 
            className="absolute bottom-0 left-0 right-0 px-4 md:px-8 py-6 md:py-8"
          >
            <div className="max-w-7xl">
              {/* Mobile: Compact badges */}
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4"
              >
                <Badge className="bg-white text-black font-bold text-xs md:text-sm">NFT VAULT</Badge>
                <Badge variant="outline" className="border-white/30 text-white text-xs md:text-sm">{totalNFTs} TOTAL</Badge>
                {!isMobile && (
                  <Badge variant="outline" className="border-yellow-500/50 text-yellow-500">{mintedNFTs} MINTED</Badge>
                )}
              </motion.div>

              <motion.h1
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-2 md:mb-4"
              >
                NFT Gallery & Creator
              </motion.h1>

              <motion.p
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-sm md:text-lg text-white/90 mb-4 md:mb-6 max-w-2xl"
              >
                Design unique NFTs, manage metadata, and calculate rarity scores
              </motion.p>

              {/* Desktop: Action buttons */}
              {!isMobile && (
                <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.8 }} className="flex items-center gap-4">
                  <Button className="bg-white/10 border border-white/20 text-white hover:bg-white/20 font-bold px-6 py-3">
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
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* Sticky Header - Responsive */}
        <div className="sticky top-16 md:top-0 z-30 bg-black/95 backdrop-blur-lg border-b border-white/10">
          <div className="px-4 md:px-8 py-3 md:py-4">
            {/* Mobile: Simplified stats */}
            {isMobile ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex gap-4">
                    <div>
                      <p className="text-xs text-white/60">Total</p>
                      <p className="text-lg font-bold text-white">{totalNFTs}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/60">Minted</p>
                      <p className="text-lg font-bold text-white">{mintedNFTs}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/60">Collections</p>
                      <p className="text-lg font-bold text-white">{totalCollections}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant={viewMode === 'grid' ? 'default' : 'ghost'} onClick={() => setViewMode('grid')} className="h-8 w-8">
                      <Grid3x3 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant={viewMode === 'list' ? 'default' : 'ghost'} onClick={() => setViewMode('list')} className="h-8 w-8">
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Mobile rarity badges */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {legendaryNFTs > 0 && (
                    <Badge className="bg-yellow-500/20 border-yellow-500/30 text-yellow-500 whitespace-nowrap">
                      <Crown className="w-3 h-3 mr-1" />
                      {legendaryNFTs} Legendary
                    </Badge>
                  )}
                  {epicNFTs > 0 && (
                    <Badge className="bg-purple-500/20 border-purple-500/30 text-purple-500 whitespace-nowrap">
                      <Diamond className="w-3 h-3 mr-1" />
                      {epicNFTs} Epic
                    </Badge>
                  )}
                  {rareNFTs > 0 && (
                    <Badge className="bg-white/20 border-white/30 text-white whitespace-nowrap">
                      <Star className="w-3 h-3 mr-1" />
                      {rareNFTs} Rare
                    </Badge>
                  )}
                </div>
              </div>
            ) : (
              /* Desktop: Full stats and controls */
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-8">
                  <div>
                    <p className="text-sm text-white/60">Total NFTs</p>
                    <p className="text-2xl font-bold text-white">{totalNFTs}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Minted</p>
                    <p className="text-2xl font-bold text-white">{mintedNFTs}</p>
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
            )}

            {/* Filter tabs */}
            <nav className="flex items-center gap-1 overflow-x-auto">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`px-3 md:px-4 py-1.5 md:py-2 font-medium transition-all duration-200 border-b-2 whitespace-nowrap text-sm md:text-base ${
                    activeFilter === filter.id
                      ? 'text-white border-[rgb(163,255,18)]'
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

        {/* Content */}
        <div className="px-4 md:px-8 py-6 md:py-8 min-h-screen">
          <StudioMainContent currentView="nfts">
            <StudioNFTs nfts={nfts} viewMode={viewMode} />
          </StudioMainContent>
        </div>
      </div>
    </motion.div>
  );
}

export default function StudioNFTsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[rgb(163,255,18)]"></div>
      </div>
    }>
      <NFTsContent />
    </Suspense>
  );
}