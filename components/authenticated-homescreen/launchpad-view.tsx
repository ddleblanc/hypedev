"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Crown,
  TrendingUp,
  Users,
  LayoutGrid,
  LayoutList,
  Activity,
  Clock,
  CheckCircle2,
  Layers,
  ExternalLink,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MediaRenderer } from "@/components/MediaRenderer";
import { useStudioData, Collection } from "@/hooks/use-studio-data";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const categories = [
  { id: "all", name: "All Collections", icon: Layers, count: "0", active: true },
  { id: "live", name: "Live", icon: Activity, count: "0" },
  { id: "featured", name: "Featured", icon: Crown, count: "0" },
  { id: "trending", name: "Trending", icon: TrendingUp, count: "0" },
];


export function LaunchpadView() {
  const router = useRouter();
  const { collections, isLoading, error } = useStudioData();

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewType, setViewType] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Filter collections based on search and category
  const filteredCollections = collections.filter((collection: Collection) => {
    const matchesSearch = !searchQuery ||
      collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      collection.symbol?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' ||
      (selectedCategory === 'live' && collection.isDeployed) ||
      (selectedCategory === 'featured' && collection.volume > 50) ||
      (selectedCategory === 'trending' && collection.floorPrice > 1);

    return matchesSearch && matchesCategory;
  });

  // Update category counts
  const updatedCategories = categories.map(cat => ({
    ...cat,
    count: cat.id === 'all' ? collections.length.toString() :
           cat.id === 'live' ? collections.filter(c => c.isDeployed).length.toString() :
           cat.id === 'featured' ? collections.filter(c => c.volume > 50).length.toString() :
           cat.id === 'trending' ? collections.filter(c => c.floorPrice > 1).length.toString() :
           cat.count
  }));

  const formatPrice = (price: number) => {
    return price > 0 ? `${price.toFixed(3)} ETH` : 'TBD';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const getSupplyPercentage = (minted: number, total?: number) => {
    if (!total || total === 0) return 0;
    return Math.min((minted / total) * 100, 100);
  };


  if (error) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
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
            onClick={() => window.location.reload()}
            className="bg-white text-black hover:bg-zinc-200 font-medium"
          >
            Retry
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16">
      {/* Hero Section - Desktop Only */}
      <div className="hidden md:block relative h-[60vh] overflow-hidden bg-black">
        <div className="absolute inset-0">
          {/* Using a collection image as hero background */}
          {collections.length > 0 && (
            <>
              <MediaRenderer
                src={collections[0].bannerImage || collections[0].image || ''}
                alt="Launchpad Hero"
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
            </>
          )}
        </div>

        {/* Hero Content */}
        <div className="relative h-full flex items-center">
          <div className="pl-6 pr-6 lg:pl-8 lg:pr-8 max-w-4xl">
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="mb-6"
            >
              <div className="flex items-center gap-4 mb-4">
                <Badge className="bg-[rgb(163,255,18)] text-black font-bold px-3 py-1">
                  🚀 Launchpad
                </Badge>
                <Badge className="bg-white/10 text-white border-white/20">
                  {collections.length} Collections
                </Badge>
              </div>
            </motion.div>

            <motion.h1
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="text-5xl font-bold text-white mb-4"
            >
              Discover New Collections
            </motion.h1>

            <motion.p
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="text-xl text-white/90 mb-8 leading-relaxed max-w-2xl"
            >
              Explore the latest NFT collections from emerging creators. Find the next big thing before it takes off.
            </motion.p>

            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="flex items-center gap-6 text-white/80"
            >
              <div>
                <span className="text-sm uppercase tracking-wide text-white/60">Live Collections</span>
                <p className="text-lg font-bold">{collections.filter(c => c.isDeployed).length}</p>
              </div>
              <div>
                <span className="text-sm uppercase tracking-wide text-white/60">Total Volume</span>
                <p className="text-lg font-bold">{collections.reduce((acc, c) => acc + c.volume, 0).toFixed(1)} ETH</p>
              </div>
              <div>
                <span className="text-sm uppercase tracking-wide text-white/60">Avg Floor</span>
                <p className="text-lg font-bold">
                  {collections.length > 0
                    ? (collections.reduce((acc, c) => acc + c.floorPrice, 0) / collections.length).toFixed(2)
                    : '0.00'
                  } ETH
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Sticky Controls Bar */}
      <div className="sticky top-16 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="pl-6 pr-6 lg:pl-8 lg:pr-8 py-3">
          {/* Compact metrics bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            {/* Left side metrics */}
            <div className="flex items-center gap-4 lg:gap-6">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 uppercase">Total</span>
                <span className="text-lg font-semibold text-white">{collections.length}</span>
              </div>
              <div className="w-px h-5 bg-white/10" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 uppercase">Live</span>
                <span className="text-lg font-semibold text-emerald-400">{collections.filter(c => c.isDeployed).length}</span>
              </div>
              <div className="w-px h-5 bg-white/10" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 uppercase">NFTs</span>
                <span className="text-lg font-semibold text-white">{collections.reduce((acc, c) => acc + c.mintedSupply, 0).toLocaleString()}</span>
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
              {updatedCategories.map((category) => {
                const Icon = category.icon;
                const isActive = selectedCategory === category.id;
                return (
                  <motion.button
                    key={category.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => setSelectedCategory(category.id)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 border whitespace-nowrap",
                      isActive
                        ? "bg-[rgb(163,255,18)]/10 text-[rgb(163,255,18)] border-[rgb(163,255,18)]/30"
                        : "bg-white/5 text-zinc-400 border-white/10 hover:text-white hover:border-white/20"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{category.name}</span>
                    <span className={cn(
                      "text-xs px-1.5 py-0.5 rounded-full",
                      isActive ? "bg-black/20" : "bg-white/10"
                    )}>
                      {category.count}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-3">
              {/* Search */}
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
                  placeholder="Search collections..."
                  className="pl-9 h-9 bg-white/5 backdrop-blur-sm border-white/10 text-white placeholder:text-zinc-500 focus:border-white/20 focus:bg-white/10"
                />
              </div>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32 h-9 bg-white/5 backdrop-blur-sm border-white/10 text-white hidden sm:flex">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black/90 backdrop-blur-sm border-white/10">
                  <SelectItem value="recent" className="text-white">Recent</SelectItem>
                  <SelectItem value="name" className="text-white">Name</SelectItem>
                  <SelectItem value="volume" className="text-white">Volume</SelectItem>
                  <SelectItem value="floor" className="text-white">Floor Price</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode */}
              <div className="flex items-center bg-white/5 backdrop-blur-sm rounded-lg p-1 border border-white/10">
                <button
                  onClick={() => setViewType('grid')}
                  className={cn(
                    "p-1.5 rounded transition-all",
                    viewType === 'grid'
                      ? "bg-white text-black"
                      : "text-zinc-500 hover:text-white"
                  )}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewType('list')}
                  className={cn(
                    "p-1.5 rounded transition-all",
                    viewType === 'list'
                      ? "bg-white text-black"
                      : "text-zinc-500 hover:text-white"
                  )}
                >
                  <LayoutList className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Mobile Search Bar */}
              <div className="sm:hidden w-full">
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
            </div>
          </motion.div>
        </div>
      </div>

      {/* Collections Content */}
      <div className="pl-6 pr-6 lg:pl-8 lg:pr-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <p className="text-zinc-500 text-sm">Loading collections...</p>
            </div>
          </div>
        ) : filteredCollections.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24"
          >
            <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-zinc-600" />
            </div>
            <h3 className="text-white font-medium text-lg mb-2">No collections found</h3>
            <p className="text-zinc-500 text-sm mb-6 text-center max-w-md">
              {searchQuery ? 'Try adjusting your search terms' : 'Start creating your first collection to launch it here'}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              viewType === 'grid'
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6"
                : "space-y-4"
            )}
          >
            {filteredCollections.map((collection: Collection, index: number) => (
              <motion.div
                key={collection.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "group relative cursor-pointer",
                  viewType === 'grid' ? "" : "flex items-center gap-4 p-4 rounded-xl bg-black/60 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all"
                )}
                onClick={() => router.push(`/launchpad/${collection.id}`)}
              >
                {viewType === 'grid' ? (
                  <div className="relative bg-black/80 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-300">
                    {/* Image Section */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-black/60 backdrop-blur-sm">
                      <MediaRenderer
                        src={collection.bannerImage || collection.image || ''}
                        alt={collection.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                      {/* Status Badge */}
                      <div className="absolute top-3 right-3">
                        {collection.isDeployed ? (
                          <Badge className="bg-emerald-400/10 border-emerald-400/20 text-emerald-400 backdrop-blur-sm">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Live
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-400/10 border-amber-400/20 text-amber-400 backdrop-blur-sm">
                            <Clock className="w-3 h-3 mr-1" />
                            Draft
                          </Badge>
                        )}
                      </div>

                      {/* Bottom Info Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-white font-semibold text-lg">{collection.name}</h3>
                        <p className="text-zinc-400 text-sm">{collection.symbol}</p>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-5">
                      {/* Supply Progress Bar */}
                      {collection.maxSupply && (
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-xs text-zinc-500">Supply</span>
                            <span className="text-xs text-white">
                              {formatNumber(collection.mintedSupply)}/{formatNumber(collection.maxSupply)}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-zinc-600 to-zinc-400 rounded-full transition-all duration-500"
                              style={{ width: `${getSupplyPercentage(collection.mintedSupply, collection.maxSupply)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-black/60 backdrop-blur-sm rounded-lg p-2.5 border border-white/5">
                          <div className="flex items-center gap-1.5 text-zinc-500 mb-0.5">
                            <Users className="w-3 h-3" />
                            <span className="text-xs">Holders</span>
                          </div>
                          <p className="text-white font-medium">{formatNumber(collection.holders)}</p>
                        </div>

                        <div className="bg-black/60 backdrop-blur-sm rounded-lg p-2.5 border border-white/5">
                          <div className="flex items-center gap-1.5 text-zinc-500 mb-0.5">
                            <Activity className="w-3 h-3" />
                            <span className="text-xs">Volume</span>
                          </div>
                          <p className="text-white font-medium">{formatPrice(collection.volume)}</p>
                        </div>

                        <div className="bg-black/60 backdrop-blur-sm rounded-lg p-2.5 border border-white/5">
                          <div className="flex items-center gap-1.5 text-zinc-500 mb-0.5">
                            <TrendingUp className="w-3 h-3" />
                            <span className="text-xs">Floor</span>
                          </div>
                          <p className="text-white font-medium">{formatPrice(collection.floorPrice)}</p>
                        </div>

                        <div className="bg-black/60 backdrop-blur-sm rounded-lg p-2.5 border border-white/5">
                          <div className="flex items-center gap-1.5 text-zinc-500 mb-0.5">
                            <span className="text-xs">Royalty</span>
                          </div>
                          <p className="text-white font-medium">{collection.royaltyPercentage}%</p>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-white/10">
                        <span className="text-xs text-zinc-500">
                          {new Date(collection.createdAt).toLocaleDateString()}
                        </span>

                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-3 text-zinc-400 hover:text-white hover:bg-white/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/collection/${collection.id}`);
                          }}
                        >
                          View
                          <ExternalLink className="w-3 h-3 ml-1.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // List view
                  <>
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-black/60 backdrop-blur-sm">
                      <MediaRenderer
                        src={collection.image || collection.bannerImage || ''}
                        alt={collection.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-semibold text-lg truncate">{collection.name}</h3>
                        {collection.isDeployed ? (
                          <Badge className="bg-emerald-400/10 border-emerald-400/20 text-emerald-400">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Live
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-400/10 border-amber-400/20 text-amber-400">
                            <Clock className="w-3 h-3 mr-1" />
                            Draft
                          </Badge>
                        )}
                      </div>
                      <p className="text-zinc-400 text-sm mb-2">{collection.symbol}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-zinc-500">
                          Holders: <span className="text-white">{formatNumber(collection.holders)}</span>
                        </span>
                        <span className="text-zinc-500">
                          Floor: <span className="text-white">{formatPrice(collection.floorPrice)}</span>
                        </span>
                        {collection.maxSupply && (
                          <span className="text-zinc-500">
                            Supply: <span className="text-white">{formatNumber(collection.mintedSupply)}/{formatNumber(collection.maxSupply)}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/collection/${collection.id}`);
                        }}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}