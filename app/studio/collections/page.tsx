"use client";

import { Suspense, useMemo, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { StudioCollections } from "@/components/studio/views";
import { useStudioData } from "@/hooks/use-studio-data";
import { useStudio } from "@/contexts/studio-context";
import {
  Plus,
  Search,
  ArrowUpDown,
  TrendingUp,
  Filter,
  X,
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

// New UI components
import { PageTransition } from "@/components/studio/page-transition";
import { CollectionCardSkeleton, GridSkeleton, ListSkeleton, TableRowSkeleton } from "@/components/studio/skeletons";
import { CollectionsEmptyState, FilteredEmptyState, ErrorState } from "@/components/studio/empty-states";
import { SegmentedControl, ViewModeToggle } from "@/components/studio/segmented-control";
import { FilterSheet } from "@/components/studio/bottom-sheet";

function CollectionsContent() {
  const router = useRouter();
  const { collections, isLoading, error, refreshData } = useStudioData();
  const { state, setFilter, setViewMode, resetFilters, openModal, hasActiveFilters } = useStudio();

  const [sortBy, setSortBy] = useState("recent");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Get status filter from context (or "all" if no filter selected)
  const statusFilter: string = state.filters.status[0] || "all";

  // Calculate metrics
  const metrics = useMemo(() => ({
    total: collections.length,
    deployed: collections.filter((c: any) => c.isDeployed).length,
    draft: collections.filter((c: any) => !c.isDeployed).length,
    nfts: collections.reduce((acc: number, c: any) => acc + (c.mintedSupply || 0), 0),
    volume: collections.reduce((acc: number, c: any) => acc + (c.volume || 0), 0),
  }), [collections]);

  // Filter and search logic
  const filteredCollections = useMemo(() => {
    return collections.filter((c: any) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "live" && c.isDeployed) ||
        (statusFilter === "draft" && !c.isDeployed) ||
        (statusFilter === "paused" && c.isPaused);

      const matchesSearch =
        !state.filters.search ||
        c.name?.toLowerCase().includes(state.filters.search.toLowerCase()) ||
        c.symbol?.toLowerCase().includes(state.filters.search.toLowerCase());

      const matchesContractType =
        state.filters.contractType.length === 0 ||
        state.filters.contractType.includes(c.contractType);

      return matchesStatus && matchesSearch && matchesContractType;
    });
  }, [collections, statusFilter, state.filters.search, state.filters.contractType]);

  // Sort collections
  const sortedCollections = useMemo(() => {
    const sorted = [...filteredCollections];
    switch (sortBy) {
      case "name":
        return sorted.sort((a: any, b: any) => a.name.localeCompare(b.name));
      case "volume":
        return sorted.sort((a: any, b: any) => (b.volume || 0) - (a.volume || 0));
      case "items":
        return sorted.sort((a: any, b: any) => (b.mintedSupply || 0) - (a.mintedSupply || 0));
      case "recent":
      default:
        return sorted.sort((a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
  }, [filteredCollections, sortBy]);

  const handleStatusChange = useCallback((value: string) => {
    if (value === "all") {
      setFilter("status", []);
    } else {
      setFilter("status", [value as any]);
    }
  }, [setFilter]);

  // Mobile filter sections
  const filterSections = useMemo(() => [
    {
      title: "Status",
      options: [
        { id: "all", label: "All", selected: statusFilter === "all" },
        { id: "live", label: "Live", selected: statusFilter === "live" },
        { id: "draft", label: "Draft", selected: statusFilter === "draft" },
      ],
      onToggle: (id: string) => handleStatusChange(id),
    },
    {
      title: "Contract Type",
      options: [
        { id: "DropERC721", label: "NFT Drop", selected: state.filters.contractType.includes("DropERC721") },
        { id: "TokenERC721", label: "NFT Collection", selected: state.filters.contractType.includes("TokenERC721") },
        { id: "OpenEditionERC721", label: "Open Edition", selected: state.filters.contractType.includes("OpenEditionERC721") },
        { id: "DropERC1155", label: "Edition Drop", selected: state.filters.contractType.includes("DropERC1155") },
      ],
      onToggle: (id: string) => {
        const current = state.filters.contractType;
        if (current.includes(id as any)) {
          setFilter("contractType", current.filter((t) => t !== id));
        } else {
          setFilter("contractType", [...current, id as any]);
        }
      },
      multiSelect: true,
    },
  ], [statusFilter, state.filters.contractType, handleStatusChange, setFilter]);

  // Error state
  if (error) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center pt-16">
          <ErrorState message={error} onRetry={refreshData} />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen pt-20">
        {/* Header Bar */}
        <div className="bg-black/80 backdrop-blur-xl border-b border-white/10">
          <div className="px-4 lg:px-8 py-3">
            {/* Metrics Row */}
            <div className="flex items-center justify-between">
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
                <div className="w-px h-5 bg-white/10 hidden sm:block" />
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-xs text-zinc-500 uppercase">NFTs</span>
                  <span className="text-lg font-semibold text-white">{metrics.nfts.toLocaleString()}</span>
                </div>
              </div>

              <div className="hidden lg:flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 uppercase">Volume</span>
                  <span className="text-lg font-semibold text-white">{metrics.volume.toFixed(2)} ETH</span>
                </div>
                {metrics.volume > 0 && (
                  <>
                    <div className="w-px h-5 bg-white/10" />
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                      <span className="text-lg font-semibold text-emerald-400">Active</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Controls Row */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mt-4">
              {/* Status Filter - Desktop */}
              <div className="hidden md:block">
                <SegmentedControl
                  options={[
                    { value: "all", label: `All (${metrics.total})` },
                    { value: "live", label: `Live (${metrics.deployed})` },
                    { value: "draft", label: `Draft (${metrics.draft})` },
                  ]}
                  value={statusFilter as any}
                  onChange={handleStatusChange}
                  size="md"
                />
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-3">
                {/* Search */}
                <div
                  className={cn(
                    "relative transition-all duration-200 hidden sm:block",
                    isSearchFocused ? "w-64" : "w-48"
                  )}
                >
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input
                    value={state.filters.search}
                    onChange={(e) => setFilter("search", e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    placeholder="Search..."
                    className="pl-9 h-10 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:border-[rgb(163,255,18)]/50"
                  />
                  {state.filters.search && (
                    <button
                      onClick={() => setFilter("search", "")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* View Mode Toggle */}
                <ViewModeToggle
                  value={state.viewMode}
                  onChange={setViewMode}
                  size="md"
                  className="hidden sm:flex"
                />

                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-36 h-10 bg-white/5 border-white/10 text-white hidden md:flex">
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

                {/* Create Button - Desktop */}
                <Button
                  onClick={() => openModal("createCollection")}
                  className="hidden md:flex gap-2 bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90"
                >
                  <Plus className="w-4 h-4" />
                  Create
                </Button>
              </div>

              {/* Mobile Controls */}
              {isMobile && (
                <div className="flex items-center gap-2">
                  {/* Mobile Search */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input
                      value={state.filters.search}
                      onChange={(e) => setFilter("search", e.target.value)}
                      placeholder="Search collections..."
                      className="pl-9 h-12 w-full bg-white/5 border-white/10 text-white placeholder:text-zinc-500 rounded-xl"
                    />
                  </div>

                  {/* Mobile Filter Button */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowMobileFilters(true)}
                    className={cn(
                      "h-12 w-12 border-white/10 rounded-xl",
                      hasActiveFilters && "border-[rgb(163,255,18)]/50 bg-[rgb(163,255,18)]/10"
                    )}
                  >
                    <Filter className="w-4 h-4" />
                  </Button>

                  {/* Mobile View Toggle */}
                  <ViewModeToggle
                    value={state.viewMode}
                    onChange={setViewMode}
                    size="md"
                  />
                </div>
              )}
            </div>

            {/* Active Filters Chips */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {state.filters.contractType.map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilter("contractType", state.filters.contractType.filter((t) => t !== type))}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[rgb(163,255,18)]/10 text-[rgb(163,255,18)] text-xs border border-[rgb(163,255,18)]/20"
                  >
                    {type}
                    <X className="w-3 h-3" />
                  </button>
                ))}
                <button
                  onClick={resetFilters}
                  className="text-xs text-zinc-500 hover:text-white"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="px-4 lg:px-8 py-8 pb-32">
          {/* Loading State with Skeletons */}
          {isLoading && collections.length === 0 ? (
            state.viewMode === "grid" ? (
              <GridSkeleton count={8} Skeleton={CollectionCardSkeleton} />
            ) : (
              <ListSkeleton count={6} Skeleton={TableRowSkeleton} />
            )
          ) : sortedCollections.length === 0 ? (
            // Empty States
            hasActiveFilters || state.filters.search ? (
              <FilteredEmptyState entityType="collections" />
            ) : (
              <CollectionsEmptyState />
            )
          ) : (
            // Collections Grid/List
            <StudioCollections
              collections={sortedCollections}
              viewMode={state.viewMode}
              onViewCollection={(c) => router.push(`/studio/collections/${c.id}`)}
            />
          )}
        </div>

        {/* Mobile FAB */}
        {isMobile && (
          <div className="fixed bottom-24 right-4 z-40">
            <Button
              onClick={() => openModal("createCollection")}
              className="w-14 h-14 rounded-full shadow-lg bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90"
            >
              <Plus className="w-6 h-6" />
            </Button>
          </div>
        )}

        {/* Mobile Filter Sheet */}
        <FilterSheet
          open={showMobileFilters}
          onClose={() => setShowMobileFilters(false)}
          sections={filterSections}
          onReset={resetFilters}
          onApply={() => setShowMobileFilters(false)}
        />
      </div>
    </PageTransition>
  );
}

export default function StudioCollectionsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen pt-20">
          <div className="px-4 lg:px-8 py-8">
            <GridSkeleton count={8} Skeleton={CollectionCardSkeleton} />
          </div>
        </div>
      }
    >
      <CollectionsContent />
    </Suspense>
  );
}
