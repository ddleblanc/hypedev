"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Layers,
  Image as ImageIcon,
  User,
  Filter,
  Grid,
  List,
  Loader2,
  ChevronDown,
  CheckCircle2,
  X,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type EntityType = "all" | "collection" | "nft" | "user";
type ViewMode = "grid" | "list";
type SortOption = "relevance" | "recent" | "popular" | "name";

interface SearchResultItem {
  type: "collection" | "nft" | "user";
  id: string;
  name: string;
  image: string | null;
  description: string | null;
  address?: string;
  username?: string;
  floorPrice?: number | null;
  itemCount?: number;
  ownerCount?: number;
  isVerified?: boolean;
  isCreator?: boolean;
}

interface SearchResultsProps {
  initialQuery?: string;
}

const typeConfig: Record<EntityType, { label: string; icon: typeof Search }> = {
  all: { label: "All", icon: Search },
  collection: { label: "Collections", icon: Layers },
  nft: { label: "NFTs", icon: ImageIcon },
  user: { label: "Users", icon: User },
};

const sortOptions: Record<SortOption, string> = {
  relevance: "Most Relevant",
  recent: "Recently Added",
  popular: "Most Popular",
  name: "Name A-Z",
};

export function SearchResults({ initialQuery = "" }: SearchResultsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(initialQuery || searchParams.get("q") || "");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeType, setActiveType] = useState<EntityType>(
    (searchParams.get("type") as EntityType) || "all"
  );
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Fetch results
  const fetchResults = useCallback(async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        q: query,
        limit: "24",
        page: page.toString(),
      });

      if (activeType !== "all") {
        params.set("types", activeType);
      }

      const response = await fetch(`/api/search?${params}`);
      const data = await response.json();

      if (data.success) {
        setResults(data.results || []);
        setCounts(data.counts || {});
        setTotal(data.pagination?.total || 0);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [query, activeType, page]);

  // Update URL when search params change
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (activeType !== "all") params.set("type", activeType);

    const newUrl = `/search${params.toString() ? `?${params}` : ""}`;
    router.replace(newUrl, { scroll: false });
  }, [query, activeType, router]);

  // Fetch on query/type/page change
  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // Filter results client-side for additional filters
  const filteredResults = results.filter((result) => {
    if (verifiedOnly && !result.isVerified) return false;
    if (minPrice && result.floorPrice && result.floorPrice < parseFloat(minPrice)) return false;
    if (maxPrice && result.floorPrice && result.floorPrice > parseFloat(maxPrice)) return false;
    return true;
  });

  // Sort results client-side
  const sortedResults = [...filteredResults].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "popular":
        return (b.itemCount || 0) - (a.itemCount || 0);
      case "recent":
        return 0; // Would need createdAt
      default:
        return 0;
    }
  });

  const handleResultClick = (result: SearchResultItem) => {
    switch (result.type) {
      case "collection":
        router.push(`/collection/${result.id}`);
        break;
      case "nft":
        router.push(`/nft/${result.id}`);
        break;
      case "user":
        router.push(`/profile/${result.address || result.id}`);
        break;
    }
  };

  const getTypeIcon = (type: SearchResultItem["type"]) => {
    switch (type) {
      case "collection":
        return <Layers className="w-3.5 h-3.5" />;
      case "nft":
        return <ImageIcon className="w-3.5 h-3.5" />;
      case "user":
        return <User className="w-3.5 h-3.5" />;
    }
  };

  const getTypeBadgeColor = (type: SearchResultItem["type"]) => {
    switch (type) {
      case "collection":
        return "text-[rgb(163,255,18)] bg-[rgb(163,255,18)]/10 border-[rgb(163,255,18)]/30";
      case "nft":
        return "text-purple-400 bg-purple-400/10 border-purple-400/30";
      case "user":
        return "text-blue-400 bg-blue-400/10 border-blue-400/30";
    }
  };

  const activeFiltersCount = [verifiedOnly, minPrice, maxPrice].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search collections, NFTs, or users..."
            className="w-full h-14 pl-12 pr-12 bg-white/5 border-white/10 focus:border-[rgb(163,255,18)]/50 text-white text-lg placeholder:text-white/40 rounded-xl"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Type Tabs + Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Type Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            {(Object.keys(typeConfig) as EntityType[]).map((type) => {
              const { label, icon: Icon } = typeConfig[type];
              const count =
                type === "all"
                  ? Object.values(counts).reduce((a, b) => a + b, 0)
                  : counts[`${type}s`] || 0;

              return (
                <button
                  key={type}
                  onClick={() => {
                    setActiveType(type);
                    setPage(1);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                    activeType === type
                      ? "bg-[rgb(163,255,18)] text-black"
                      : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  {count > 0 && (
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded text-xs",
                        activeType === type ? "bg-black/20" : "bg-white/10"
                      )}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Filter Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "border-white/10 bg-white/5",
                showFilters && "border-[rgb(163,255,18)]/50 bg-[rgb(163,255,18)]/10"
              )}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge className="ml-2 bg-[rgb(163,255,18)] text-black">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>

            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-white/10 bg-white/5">
                  <Filter className="w-4 h-4 mr-2" />
                  {sortOptions[sortBy]}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10">
                {(Object.keys(sortOptions) as SortOption[]).map((option) => (
                  <DropdownMenuItem
                    key={option}
                    onClick={() => setSortBy(option)}
                    className={cn(
                      "text-white/80 hover:text-white focus:text-white focus:bg-white/10",
                      sortBy === option && "text-[rgb(163,255,18)]"
                    )}
                  >
                    {sortBy === option && <CheckCircle2 className="w-4 h-4 mr-2" />}
                    {sortOptions[option]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* View Toggle */}
            <div className="hidden md:flex items-center border border-white/10 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === "grid" ? "bg-white/10 text-white" : "text-white/50 hover:text-white"
                )}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === "list" ? "bg-white/10 text-white" : "text-white/50 hover:text-white"
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-4">
                <div className="flex flex-wrap gap-4">
                  {/* Verified Filter */}
                  <button
                    onClick={() => setVerifiedOnly(!verifiedOnly)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
                      verifiedOnly
                        ? "border-[rgb(163,255,18)] bg-[rgb(163,255,18)]/10 text-[rgb(163,255,18)]"
                        : "border-white/10 text-white/70 hover:border-white/30"
                    )}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Verified Only
                  </button>

                  {/* Price Range (only for collections/nfts) */}
                  {activeType !== "user" && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Min ETH"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="w-24 h-10 bg-white/5 border-white/10 text-white"
                      />
                      <span className="text-white/40">to</span>
                      <Input
                        type="number"
                        placeholder="Max ETH"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="w-24 h-10 bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  )}
                </div>

                {/* Clear Filters */}
                {activeFiltersCount > 0 && (
                  <button
                    onClick={() => {
                      setVerifiedOnly(false);
                      setMinPrice("");
                      setMaxPrice("");
                    }}
                    className="text-sm text-white/50 hover:text-white underline"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results Summary */}
      {query && !isLoading && (
        <p className="text-white/50 text-sm">
          {total > 0 ? (
            <>
              Found <span className="text-white font-medium">{total}</span> results for "
              <span className="text-white font-medium">{query}</span>"
            </>
          ) : (
            <>
              No results found for "<span className="text-white font-medium">{query}</span>"
            </>
          )}
        </p>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-[rgb(163,255,18)] animate-spin" />
        </div>
      )}

      {/* Results Grid/List */}
      {!isLoading && sortedResults.length > 0 && (
        <div
          className={cn(
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              : "space-y-3"
          )}
        >
          {sortedResults.map((result) => (
            <motion.button
              key={`${result.type}-${result.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => handleResultClick(result)}
              className={cn(
                "text-left transition-all group",
                viewMode === "grid"
                  ? "bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-[rgb(163,255,18)]/30 hover:bg-white/[0.07]"
                  : "flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl hover:border-[rgb(163,255,18)]/30 hover:bg-white/[0.07] w-full"
              )}
            >
              {viewMode === "grid" ? (
                <>
                  {/* Grid Card */}
                  <div className="aspect-square bg-white/5 relative overflow-hidden">
                    {result.image ? (
                      <img
                        src={result.image}
                        alt={result.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {getTypeIcon(result.type)}
                      </div>
                    )}
                    <div
                      className={cn(
                        "absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full border text-xs",
                        getTypeBadgeColor(result.type)
                      )}
                    >
                      {getTypeIcon(result.type)}
                      {result.type}
                    </div>
                    {result.isVerified && (
                      <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-[rgb(163,255,18)] flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-black" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    <h3 className="font-semibold text-white truncate group-hover:text-[rgb(163,255,18)] transition-colors">
                      {result.name}
                    </h3>
                    {result.description && (
                      <p className="text-white/50 text-sm line-clamp-2">{result.description}</p>
                    )}
                    {result.type === "collection" && (
                      <div className="flex items-center justify-between text-sm">
                        {result.floorPrice != null && (
                          <span className="text-white/70">
                            Floor: <span className="text-white">{result.floorPrice} ETH</span>
                          </span>
                        )}
                        {result.itemCount != null && (
                          <span className="text-white/50">{result.itemCount} items</span>
                        )}
                      </div>
                    )}
                    {result.type === "user" && result.isCreator && (
                      <Badge className="bg-purple-500/10 text-purple-400 border-purple-400/30">
                        Creator
                      </Badge>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* List Row */}
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
                    {result.image ? (
                      <img
                        src={result.image}
                        alt={result.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/30">
                        {getTypeIcon(result.type)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white truncate group-hover:text-[rgb(163,255,18)] transition-colors">
                        {result.name}
                      </h3>
                      {result.isVerified && (
                        <CheckCircle2 className="w-4 h-4 text-[rgb(163,255,18)] flex-shrink-0" />
                      )}
                    </div>
                    {result.description && (
                      <p className="text-white/50 text-sm truncate">{result.description}</p>
                    )}
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-full border text-xs",
                      getTypeBadgeColor(result.type)
                    )}
                  >
                    {getTypeIcon(result.type)}
                    {result.type}
                  </div>
                  {result.type === "collection" && result.floorPrice != null && (
                    <span className="text-white/70 text-sm whitespace-nowrap">
                      {result.floorPrice} ETH
                    </span>
                  )}
                </>
              )}
            </motion.button>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && query && sortedResults.length === 0 && (
        <div className="text-center py-16">
          <Search className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No results found</h3>
          <p className="text-white/50 max-w-md mx-auto">
            We couldn&apos;t find anything matching &quot;{query}&quot;. Try adjusting your search
            or filters.
          </p>
        </div>
      )}

      {/* No Query State */}
      {!isLoading && !query && (
        <div className="text-center py-16">
          <Search className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Start searching</h3>
          <p className="text-white/50 max-w-md mx-auto">
            Search for collections, NFTs, or users across the marketplace
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="border-white/10"
          >
            Previous
          </Button>
          <span className="text-white/50 text-sm px-4">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="border-white/10"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
