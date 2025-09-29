"use client";

import { Suspense, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { StudioCollections } from "@/components/studio/views";
import { useStudioData } from "@/hooks/use-studio-data";
import {
  Plus, Search, ArrowUpDown, LayoutGrid, LayoutList, 
  Sparkles, TrendingUp, Clock, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

function CollectionsContent() {
  const { collections, isLoading, error, refreshData } = useStudioData();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate metrics
  const metrics = {
    total: collections.length,
    deployed: collections.filter((c: any) => c.isDeployed).length,
    nfts: collections.reduce((acc: number, c: any) => acc + (c.totalSupply || 0), 0),
    volume: 89.3,
    growth: 12.5
  };

  const filters = [
    { 
      id: 'all', 
      label: 'All Collections',
      icon: Sparkles,
      description: 'View everything'
    },
    { 
      id: 'deployed', 
      label: 'Live',
      icon: CheckCircle2,
      description: 'On mainnet',
      accent: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
    },
    { 
      id: 'draft', 
      label: 'In Progress',
      icon: Clock,
      description: 'Not deployed',
      accent: 'text-amber-400 bg-amber-400/10 border-amber-400/20'
    }
  ];

  // Filter and search logic
  const filteredCollections = collections.filter((c: any) => {
    const matchesFilter = 
      activeFilter === 'all' ||
      (activeFilter === 'deployed' && c.isDeployed) ||
      (activeFilter === 'draft' && !c.isDeployed);
    
    const matchesSearch = !searchQuery || 
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.symbol?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500">!</span>
          </div>
          <h3 className="text-white font-medium mb-2">Something went wrong</h3>
          <p className="text-zinc-400 text-sm mb-6">{error}</p>
          <Button 
            onClick={refreshData}
            className="bg-white text-black hover:bg-zinc-200 font-medium"
          >
            Retry
          </Button>
        </motion.div>
      </div>
    );
  }

  if (isLoading && collections.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm">Loading collections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16">
      {/* Unified Header Bar */}
      <div className="bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="pl-6 pr-6 lg:pl-8 lg:pr-8 py-3">
          {/* Compact Metrics Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            {/* Left side metrics */}
            <div className="flex items-center gap-4 lg:gap-6">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 uppercase">Total</span>
                <span className="text-lg font-semibold text-white">{metrics.total}</span>
              </div>
              <div className="w-px h-5 bg-white/10" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 uppercase">Live</span>
                <span className="text-lg font-semibold text-emerald-400">{metrics.deployed}</span>
              </div>
              <div className="w-px h-5 bg-white/10" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 uppercase">NFTs</span>
                <span className="text-lg font-semibold text-white">{metrics.nfts.toLocaleString()}</span>
              </div>
            </div>

            {/* Right side metrics (desktop only) */}
            <div className="hidden lg:flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 uppercase">Volume</span>
                <span className="text-lg font-semibold text-white">{metrics.volume} ETH</span>
              </div>
              <div className="w-px h-5 bg-white/10" />
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                <span className="text-lg font-semibold text-emerald-400">+{metrics.growth}%</span>
              </div>
            </div>
          </motion.div>

          {/* Filter and Controls Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mt-3"
          >
            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto">
              {filters.map((filter, index) => {
                const isActive = activeFilter === filter.id;
                const count = filter.id === 'all'
                  ? collections.length
                  : filter.id === 'deployed'
                  ? metrics.deployed
                  : collections.length - metrics.deployed;

                return (
                  <motion.button
                    key={filter.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    onClick={() => setActiveFilter(filter.id)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 border whitespace-nowrap",
                      isActive
                        ? filter.accent || "bg-white/5 text-white border-white"
                        : "bg-white/5 text-zinc-400 border-white/10 hover:text-white hover:border-white/20"
                    )}
                  >
                    <filter.icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{filter.label}</span>
                    <span className="sm:hidden">{filter.label.split(' ')[0]}</span>
                    <span className={cn(
                      "text-xs px-1.5 py-0.5 rounded-full",
                      isActive ? "bg-black/20" : "bg-white/10"
                    )}>
                      {count}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-3">
              {/* Search - Hidden on mobile */}
              <div className={cn(
                "relative transition-all duration-200 hidden sm:block",
                isSearchFocused ? "w-64" : "w-48"
              )}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  placeholder="Search..."
                  className="pl-9 h-9 bg-white/5 backdrop-blur-sm border-white/10 text-white placeholder:text-zinc-500 focus:border-white/20 focus:bg-white/10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                  >
                    <span className="text-xs">ESC</span>
                  </button>
                )}
              </div>

              {/* Sort - Hidden on mobile */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-36 h-9 bg-white/5 backdrop-blur-sm border-white/10 text-white hidden sm:flex">
                  <ArrowUpDown className="w-3.5 h-3.5 mr-2 text-zinc-500" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black/90 backdrop-blur-sm border-white/10">
                  <SelectItem value="recent" className="text-white">Recent</SelectItem>
                  <SelectItem value="name" className="text-white">Name</SelectItem>
                  <SelectItem value="volume" className="text-white">Volume</SelectItem>
                  <SelectItem value="items" className="text-white">Items</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode */}
              <div className="flex items-center bg-white/5 backdrop-blur-sm rounded-lg p-1 border border-white/10">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "p-1.5 rounded transition-all",
                    viewMode === 'grid'
                      ? "bg-white text-black"
                      : "text-zinc-500 hover:text-white"
                  )}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-1.5 rounded transition-all",
                    viewMode === 'list'
                      ? "bg-white text-black"
                      : "text-zinc-500 hover:text-white"
                  )}
                >
                  <LayoutList className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Mobile Search Bar */}
            {isMobile && (
              <div className="lg:hidden">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search collections..."
                    className="pl-9 h-9 w-full bg-white/5 backdrop-blur-sm border-white/10 text-white placeholder:text-zinc-500"
                  />
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>


      {/* Content Area */}
      <div className="pl-6 pr-6 lg:pl-8 lg:pr-8 py-8">
        <AnimatePresence mode="wait">
          {filteredCollections.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-24"
            >
              <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-zinc-600" />
              </div>
              <h3 className="text-white font-medium text-lg mb-2">No collections found</h3>
              <p className="text-zinc-500 text-sm mb-6">
                {searchQuery ? 'Try adjusting your search' : 'Create your first collection to get started'}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => router.push('/studio/create')}
                  className="bg-white text-black hover:bg-zinc-100"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Collection
                </Button>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <StudioCollections
                collections={filteredCollections}
                viewMode={viewMode}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function StudioCollectionsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center pt-16">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm">Loading...</p>
        </div>
      </div>
    }>
      <CollectionsContent />
    </Suspense>
  );
}