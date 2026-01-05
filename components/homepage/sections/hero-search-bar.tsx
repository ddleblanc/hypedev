"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Image,
  User,
  Layers,
  X,
  Loader2,
  Clock,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useActiveAccount } from "thirdweb/react";
import type { SearchResult } from "@/types/homepage";

interface HeroSearchBarProps {
  placeholder?: string;
  className?: string;
}

type SearchCategory = "all" | "collections" | "nfts" | "users";

interface RecentSearch {
  id: string;
  query: string;
  category: string;
  createdAt: string;
}

interface TrendingSuggestion {
  id: string;
  query: string;
  isTrending: boolean;
  searchCount: number;
}

interface PopularCollection {
  id: string;
  slug?: string | null;
  address?: string;
  name: string;
  image: string;
  isVerified: boolean;
  type: "collection";
}

const categoryConfig = {
  all: { label: "All", icon: Search },
  collections: { label: "Collections", icon: Layers },
  nfts: { label: "NFTs", icon: Image },
  users: { label: "Users", icon: User },
};

export function HeroSearchBar({
  placeholder = "Search collections, NFTs, or users...",
  className,
}: HeroSearchBarProps) {
  const router = useRouter();
  const account = useActiveAccount();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [activeCategory, setActiveCategory] = useState<SearchCategory>("all");

  // Suggestions state
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [trendingSuggestions, setTrendingSuggestions] = useState<TrendingSuggestion[]>([]);
  const [popularCollections, setPopularCollections] = useState<PopularCollection[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Fetch suggestions when focused and no query
  useEffect(() => {
    if (!isFocused) return;

    async function fetchSuggestions() {
      setIsLoadingSuggestions(true);
      try {
        // Fetch trending suggestions
        const suggestionsRes = await fetch("/api/search/suggestions?limit=6");
        const suggestionsData = await suggestionsRes.json();
        if (suggestionsData.success) {
          setTrendingSuggestions(suggestionsData.trending || []);
          setPopularCollections(suggestionsData.popularCollections || []);
        }

        // Fetch recent searches if user is logged in
        if (account?.address) {
          const recentRes = await fetch(`/api/search/recent?userId=${account.address}&limit=5`);
          const recentData = await recentRes.json();
          if (recentData.success) {
            setRecentSearches(recentData.searches || []);
          }
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }

    fetchSuggestions();
  }, [isFocused, account?.address]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const categoryParam = activeCategory !== "all" ? `&type=${activeCategory}` : "";
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&limit=8${categoryParam}`
        );
        const data = await response.json();
        if (data.success && data.results) {
          setResults(data.results);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, activeCategory]);

  // Save search to history when navigating to result
  const saveSearchToHistory = useCallback(
    async (searchQuery: string, resultId?: string, resultType?: string) => {
      if (!account?.address || !searchQuery.trim()) return;

      try {
        await fetch("/api/search/recent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: account.address,
            query: searchQuery,
            category: activeCategory,
            resultId,
            resultType,
          }),
        });
      } catch (error) {
        console.error("Error saving search:", error);
      }
    },
    [account?.address, activeCategory]
  );

  // Clear recent searches
  const clearRecentSearches = useCallback(async () => {
    if (!account?.address) return;

    try {
      await fetch(`/api/search/recent?userId=${account.address}`, {
        method: "DELETE",
      });
      setRecentSearches([]);
    } catch (error) {
      console.error("Error clearing searches:", error);
    }
  }, [account?.address]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle result click
  const handleResultClick = useCallback(
    (result: SearchResult) => {
      saveSearchToHistory(query, result.id, result.type);
      setIsFocused(false);
      setQuery("");

      switch (result.type) {
        case "collection":
          router.push(`/collection/${result.slug || result.id}`);
          break;
        case "nft":
          router.push(`/nft/${result.id}`);
          break;
        case "user":
          router.push(`/profile/${result.slug || result.id}`);
          break;
      }
    },
    [router, query, saveSearchToHistory]
  );

  // Handle suggestion click
  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setQuery(suggestion);
      inputRef.current?.focus();
    },
    []
  );

  // Handle popular collection click
  const handlePopularCollectionClick = useCallback(
    (collection: PopularCollection) => {
      saveSearchToHistory(collection.name, collection.id, "collection");
      setIsFocused(false);
      setQuery("");
      router.push(`/collection/${collection.slug || collection.address || collection.id}`);
    },
    [router, saveSearchToHistory]
  );

  // Total items for keyboard navigation
  const totalItems = results.length;

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : prev));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleResultClick(results[selectedIndex]);
        } else if (query.trim()) {
          saveSearchToHistory(query);
          router.push(`/search?q=${encodeURIComponent(query)}`);
        }
      } else if (e.key === "Escape") {
        setIsFocused(false);
        inputRef.current?.blur();
      } else if (e.key === "Tab" && !e.shiftKey) {
        // Tab through categories
        e.preventDefault();
        const categories: SearchCategory[] = ["all", "collections", "nfts", "users"];
        const currentIdx = categories.indexOf(activeCategory);
        setActiveCategory(categories[(currentIdx + 1) % categories.length]);
      }
    },
    [results, selectedIndex, query, router, handleResultClick, saveSearchToHistory, activeCategory, totalItems]
  );

  const getResultIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "collection":
        return <Layers className="w-4 h-4 text-[rgb(163,255,18)]" />;
      case "nft":
        return <Image className="w-4 h-4 text-purple-400" />;
      case "user":
        return <User className="w-4 h-4 text-blue-400" />;
    }
  };

  const showDropdown = isFocused;
  const hasQuery = query.trim().length > 0;
  const showSuggestions = !hasQuery && (recentSearches.length > 0 || trendingSuggestions.length > 0 || popularCollections.length > 0);

  return (
    <div ref={containerRef} className={cn("relative w-full max-w-2xl mx-auto", className)}>
      {/* Search Input */}
      <div
        className={cn(
          "relative flex items-center",
          "bg-black/60 backdrop-blur-xl",
          "border rounded-full transition-all duration-300",
          isFocused
            ? "border-[rgb(163,255,18)]/50 ring-2 ring-[rgb(163,255,18)]/20"
            : "border-white/20 hover:border-white/40"
        )}
      >
        <Search className="absolute left-5 w-5 h-5 text-white/50" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "w-full h-14 pl-14 pr-12",
            "bg-transparent border-0 focus:ring-0",
            "text-white placeholder:text-white/40",
            "text-base md:text-lg"
          )}
        />
        {isSearching && (
          <Loader2 className="absolute right-5 w-5 h-5 text-white/50 animate-spin" />
        )}
        {!isSearching && query && (
          <button
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-5 w-5 h-5 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className={cn(
              "absolute top-full left-0 right-0 mt-2 z-50",
              "bg-zinc-900/95 backdrop-blur-xl",
              "border border-white/10 rounded-2xl",
              "shadow-2xl overflow-hidden"
            )}
          >
            {/* Category Tabs */}
            <div className="flex items-center gap-1 p-2 border-b border-white/5">
              {(Object.keys(categoryConfig) as SearchCategory[]).map((cat) => {
                const { label, icon: Icon } = categoryConfig[cat];
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                      isActive
                        ? "bg-[rgb(163,255,18)] text-black"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Loading State */}
            {isLoadingSuggestions && !hasQuery && (
              <div className="py-8 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
              </div>
            )}

            {/* Suggestions (when no query) */}
            {showSuggestions && !isLoadingSuggestions && (
              <div className="divide-y divide-white/5">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-white/50 text-xs uppercase tracking-wider">
                        <Clock className="w-3.5 h-3.5" />
                        Recent Searches
                      </div>
                      <button
                        onClick={clearRecentSearches}
                        className="text-white/40 hover:text-white/70 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((search) => (
                        <button
                          key={search.id}
                          onClick={() => handleSuggestionClick(search.query)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-sm",
                            "bg-white/5 text-white/80 hover:bg-white/10 hover:text-white",
                            "transition-all hover:scale-105"
                          )}
                        >
                          {search.query}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending Searches */}
                {trendingSuggestions.length > 0 && (
                  <div className="p-3">
                    <div className="flex items-center gap-2 text-white/50 text-xs uppercase tracking-wider mb-2">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Trending Searches
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {trendingSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.id}
                          onClick={() => handleSuggestionClick(suggestion.query)}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm",
                            "bg-gradient-to-r from-[rgb(163,255,18)]/10 to-purple-500/10",
                            "border border-[rgb(163,255,18)]/20",
                            "text-white/90 hover:text-white",
                            "transition-all hover:scale-105 hover:border-[rgb(163,255,18)]/40"
                          )}
                        >
                          {suggestion.isTrending && (
                            <Sparkles className="w-3 h-3 text-[rgb(163,255,18)]" />
                          )}
                          {suggestion.query}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular Collections */}
                {popularCollections.length > 0 && (
                  <div className="p-3">
                    <div className="flex items-center gap-2 text-white/50 text-xs uppercase tracking-wider mb-2">
                      <Layers className="w-3.5 h-3.5" />
                      Popular Collections
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {popularCollections.map((collection) => (
                        <button
                          key={collection.id}
                          onClick={() => handlePopularCollectionClick(collection)}
                          className={cn(
                            "flex items-center gap-3 p-2 rounded-xl",
                            "bg-white/5 hover:bg-white/10",
                            "transition-all group"
                          )}
                        >
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
                            {collection.image ? (
                              <img
                                src={collection.image}
                                alt={collection.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Layers className="w-5 h-5 text-white/30" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-white text-sm font-medium truncate group-hover:text-[rgb(163,255,18)] transition-colors">
                              {collection.name}
                            </p>
                            {collection.isVerified && (
                              <p className="text-[rgb(163,255,18)] text-xs">Verified</p>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Search Results (when query exists) */}
            {hasQuery && (
              <>
                {results.length > 0 ? (
                  <div className="py-2 max-h-[400px] overflow-y-auto">
                    {results.map((result, index) => (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleResultClick(result)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3",
                          "text-left transition-all",
                          index === selectedIndex
                            ? "bg-[rgb(163,255,18)]/10 border-l-2 border-[rgb(163,255,18)]"
                            : "hover:bg-white/5 border-l-2 border-transparent"
                        )}
                      >
                        {/* Thumbnail or Icon */}
                        {result.image ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
                            <img
                              src={result.image}
                              alt={result.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                            {getResultIcon(result.type)}
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "font-medium truncate transition-colors",
                            index === selectedIndex ? "text-[rgb(163,255,18)]" : "text-white"
                          )}>
                            {result.name}
                          </p>
                          {result.subtitle && (
                            <p className="text-white/50 text-sm truncate">
                              {result.subtitle}
                            </p>
                          )}
                        </div>

                        {/* Type badge */}
                        <span className={cn(
                          "text-xs uppercase px-2 py-1 rounded",
                          result.type === "collection" && "text-[rgb(163,255,18)] bg-[rgb(163,255,18)]/10",
                          result.type === "nft" && "text-purple-400 bg-purple-400/10",
                          result.type === "user" && "text-blue-400 bg-blue-400/10"
                        )}>
                          {result.type}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : !isSearching ? (
                  <div className="py-8 text-center">
                    <Search className="w-8 h-8 text-white/20 mx-auto mb-2" />
                    <p className="text-white/50">No results found for "{query}"</p>
                    <p className="text-white/30 text-sm mt-1">
                      Try a different search term
                    </p>
                  </div>
                ) : null}

                {/* Search all link */}
                {query.trim() && (
                  <div className="border-t border-white/10 p-3">
                    <button
                      onClick={() => {
                        saveSearchToHistory(query);
                        router.push(`/search?q=${encodeURIComponent(query)}`);
                      }}
                      className={cn(
                        "w-full flex items-center justify-center gap-2",
                        "text-[rgb(163,255,18)] hover:text-white",
                        "text-sm font-medium py-2 rounded-lg",
                        "hover:bg-[rgb(163,255,18)]/10 transition-all"
                      )}
                    >
                      View all results for "{query}"
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Keyboard hints */}
            <div className="flex items-center justify-center gap-4 px-4 py-2 border-t border-white/5 text-white/30 text-xs">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">Tab</kbd>
                Categories
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">Enter</kbd>
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">Esc</kbd>
                Close
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
