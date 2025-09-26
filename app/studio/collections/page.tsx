"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRouter } from "next/navigation";
import { StudioCollections } from "@/components/studio/views";
import { StudioMainContent } from "@/components/studio/studio-main-content";
import { useStudioData } from "@/hooks/use-studio-data";
import {
  Plus, Grid3x3, List, Filter, Search, ArrowLeft, Upload,
  Shield, MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function CollectionsContent() {
  const { collections, isLoading, error, refreshData } = useStudioData();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
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

  const filters = [
    { id: 'all', label: 'All Collections', count: collections.length },
    { id: 'deployed', label: 'Deployed', count: collections.filter((c: any) => c.isDeployed).length },
    { id: 'draft', label: 'Draft', count: collections.filter((c: any) => !c.isDeployed).length },
    { id: 'trending', label: 'Trending', count: 5 } // Mock data
  ];

  const sortOptions = [
    { id: 'recent', label: 'Most Recent' },
    { id: 'volume', label: 'Highest Volume' },
    { id: 'supply', label: 'Most NFTs' },
    { id: 'name', label: 'Alphabetical' }
  ];

  // Calculate stats
  const totalCollections = collections.length;
  const deployedCollections = collections.filter((c: any) => c.isDeployed).length;
  const totalNFTs = collections.reduce((acc: number, c: any) => acc + (c.totalSupply || 0), 0);
  const totalVolume = "89.3 ETH"; // Mock data
  const totalHolders = "3.2K"; // Mock data
  const avgFloorPrice = "0.25 ETH"; // Mock data

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <div className="text-red-500 text-2xl">⚠</div>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Error Loading Collections</h3>
          <p className="text-sm text-white/60 mb-4">{error}</p>
          <Button onClick={refreshData} className="bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading && collections.length === 0) {
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
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-black to-[rgb(163,255,18)]/20" />
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239333ea' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
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
                  <DropdownMenuItem className="text-white hover:text-black" onClick={() => router.push('/studio/create')}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Collection
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-white hover:text-black">
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-purple-500 text-white font-bold text-xs">COLLECTIONS</Badge>
                <Badge className="bg-[rgb(163,255,18)] text-black font-bold text-xs">{totalCollections} TOTAL</Badge>
              </div>

              <h1 className="text-4xl font-black text-white mb-2">My Collections</h1>
              <p className="text-white/80 text-sm mb-4">Deploy and manage your NFT collections</p>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <Card className="bg-black/40 backdrop-blur border-white/10">
                  <CardContent className="p-2">
                    <p className="text-[10px] text-white/60 uppercase">Deployed</p>
                    <p className="text-lg font-bold text-[rgb(163,255,18)]">{deployedCollections}</p>
                  </CardContent>
                </Card>
                <Card className="bg-black/40 backdrop-blur border-white/10">
                  <CardContent className="p-2">
                    <p className="text-[10px] text-white/60 uppercase">Volume</p>
                    <p className="text-lg font-bold text-white">{totalVolume}</p>
                  </CardContent>
                </Card>
                <Card className="bg-black/40 backdrop-blur border-white/10">
                  <CardContent className="p-2">
                    <p className="text-[10px] text-white/60 uppercase">NFTs</p>
                    <p className="text-lg font-bold text-white">{totalNFTs}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1 bg-purple-500 text-white hover:bg-purple-600 font-bold" onClick={() => router.push('/studio/create')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Collection
                </Button>
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  <Filter className="w-4 h-4" />
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
                    {filter.count > 0 && (
                      <Badge className="bg-white/10 text-white text-[10px] ml-1">{filter.count}</Badge>
                    )}
                  </div>
                  {activeFilter === filter.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Content */}
          <div className="min-h-screen pb-20 bg-black">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-white/60">{collections.length} collections</p>
                <div className="flex gap-1">
                  <Button size="icon" variant={viewMode === 'grid' ? 'default' : 'ghost'} onClick={() => setViewMode('grid')} className="h-8 w-8">
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant={viewMode === 'list' ? 'default' : 'ghost'} onClick={() => setViewMode('list')} className="h-8 w-8">
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <StudioMainContent currentView="collections">
                <StudioCollections collections={collections} viewMode={viewMode} />
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
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-black to-[rgb(163,255,18)]/30" />
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239333ea' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }} />
            </div>

            <motion.div style={{ opacity: heroOpacity }} className="absolute bottom-0 left-0 right-0 px-8 py-8">
              <div className="max-w-7xl">
                <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="flex items-center gap-3 mb-4">
                  <Badge className="bg-purple-500 text-white font-bold">COLLECTIONS</Badge>
                  <Badge variant="outline" className="border-white/30 text-white">{totalCollections} TOTAL</Badge>
                  <Badge variant="outline" className="border-[rgb(163,255,18)]/50 text-[rgb(163,255,18)]">{deployedCollections} DEPLOYED</Badge>
                </motion.div>

                <motion.h1 initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="text-5xl md:text-6xl font-bold text-white mb-4">
                  Collection Manager
                </motion.h1>

                <motion.p initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="text-lg text-white/90 mb-6 max-w-2xl">
                  Deploy smart contracts, manage NFT collections, and track performance metrics across multiple chains
                </motion.p>

                <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.8 }} className="flex items-center gap-4">
                  <Button className="bg-purple-500 text-white hover:bg-purple-600 font-bold px-6 py-3" onClick={() => router.push('/studio/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Collection
                  </Button>
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 px-6 py-3">
                    <Upload className="h-4 w-4 mr-2" />
                    Import Existing
                  </Button>
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 px-6 py-3">
                    <Shield className="h-4 w-4 mr-2" />
                    Deploy Contract
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>

          {/* Desktop Sticky Header */}
          <div className="sticky top-0 z-30 bg-black/95 backdrop-blur-lg border-b border-white/10">
            <div className="px-8 py-4 max-w-7xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-8">
                  <div>
                    <p className="text-sm text-white/60">Total Collections</p>
                    <p className="text-2xl font-bold text-white">{totalCollections}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Deployed</p>
                    <p className="text-2xl font-bold text-[rgb(163,255,18)]">{deployedCollections}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Total Volume</p>
                    <p className="text-2xl font-bold text-white">{totalVolume}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Total NFTs</p>
                    <p className="text-2xl font-bold text-white">{totalNFTs}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Holders</p>
                    <p className="text-2xl font-bold text-white">{totalHolders}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Avg Floor</p>
                    <p className="text-2xl font-bold text-white">{avgFloorPrice}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 h-4 w-4" />
                    <Input
                      placeholder="Search collections..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64 bg-black/40 border-white/20 text-white placeholder:text-white/60"
                    />
                  </div>

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
                        ? 'text-white border-purple-500'
                        : 'text-white/60 border-transparent hover:text-white hover:border-white/30'
                    }`}
                  >
                    {filter.label}
                    {filter.count > 0 && (
                      <Badge className="bg-white/10 text-white text-xs ml-2">{filter.count}</Badge>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Desktop Content */}
          <div className="px-8 py-8 min-h-screen max-w-7xl">
            <StudioMainContent currentView="collections">
              <StudioCollections collections={collections} viewMode={viewMode} />
            </StudioMainContent>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function StudioCollectionsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    }>
      <CollectionsContent />
    </Suspense>
  );
}