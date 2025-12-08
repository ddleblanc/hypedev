"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Shield,
  ChevronRight,
  ArrowUpDown,
  Users,
  ShoppingBag,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediaRenderer } from "@/components/MediaRenderer";
import { cn } from "@/lib/utils";
import { RankBadge } from "@/components/shared/rank-badge";
import { MiniSparkline } from "@/components/shared/mini-sparkline";
import { TimeframeToggle, type Timeframe } from "@/components/shared/timeframe-toggle";
import type { TopCollectionRow } from "@/types/homepage";

interface TopCollectionsTableProps {
  className?: string;
  limit?: number;
}

interface SparklineData {
  collectionId: string;
  data: number[];
  trend: "up" | "down" | "neutral";
  changePercent: number;
}

type SortField = "volume" | "floorPrice" | "sales";

export function TopCollectionsTable({
  className,
  limit = 10,
}: TopCollectionsTableProps) {
  const [collections, setCollections] = useState<TopCollectionRow[]>([]);
  const [sparklines, setSparklines] = useState<Record<string, SparklineData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>("volume");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [timeframe, setTimeframe] = useState<Timeframe>("24h");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Fetch collections based on timeframe
  const fetchCollections = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/homepage/top-collections?timeframe=${timeframe}`);
      const data = await response.json();
      if (data.success && data.collections) {
        setCollections(data.collections.slice(0, limit));
      }
    } catch (error) {
      console.error("Error fetching top collections:", error);
    } finally {
      setIsLoading(false);
    }
  }, [timeframe, limit]);

  // Fetch sparkline data
  const fetchSparklines = useCallback(async (collectionIds: string[]) => {
    if (collectionIds.length === 0) return;

    try {
      const sparklineTimeframe = timeframe === "24h" ? "7d" : timeframe === "7d" ? "7d" : "30d";
      const response = await fetch(
        `/api/homepage/sparklines?collectionIds=${collectionIds.join(",")}&timeframe=${sparklineTimeframe}`
      );
      const data = await response.json();
      if (data.success && data.sparklines) {
        setSparklines(data.sparklines);
      }
    } catch (error) {
      console.error("Error fetching sparklines:", error);
    }
  }, [timeframe]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  useEffect(() => {
    if (collections.length > 0) {
      const collectionIds = collections.map((c) => c.id);
      fetchSparklines(collectionIds);
    }
  }, [collections, fetchSparklines]);

  // Client-side sorting
  const sortedCollections = [...collections].sort((a, b) => {
    let aVal: number, bVal: number;

    switch (sortField) {
      case "volume":
        aVal = parseFloat(a.volume24h.replace(/[^\d.]/g, "")) || 0;
        bVal = parseFloat(b.volume24h.replace(/[^\d.]/g, "")) || 0;
        break;
      case "floorPrice":
        aVal = parseFloat(a.floorPrice) || 0;
        bVal = parseFloat(b.floorPrice) || 0;
        break;
      case "sales":
        aVal = a.sales24h;
        bVal = b.sales24h;
        break;
      default:
        return 0;
    }

    return sortDirection === "desc" ? bVal - aVal : aVal - bVal;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const SortButton = ({
    field,
    label,
  }: {
    field: SortField;
    label: string;
  }) => (
    <button
      onClick={() => handleSort(field)}
      className={cn(
        "flex items-center gap-1 text-xs uppercase tracking-wider",
        "hover:text-white transition-colors",
        sortField === field ? "text-[rgb(163,255,18)]" : "text-white/50"
      )}
    >
      {label}
      <ArrowUpDown className={cn(
        "w-3 h-3 transition-transform",
        sortField === field && sortDirection === "asc" && "rotate-180"
      )} />
    </button>
  );

  const getTimeframeLabel = () => {
    switch (timeframe) {
      case "24h": return "24h";
      case "7d": return "7d";
      case "30d": return "30d";
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="flex justify-end mb-4">
          <div className="h-9 w-32 bg-white/5 rounded-lg animate-pulse" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-3 bg-white/5 rounded-xl animate-pulse"
          >
            <div className="w-8 h-8 bg-white/10 rounded" />
            <div className="w-12 h-12 bg-white/10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-white/10 rounded" />
              <div className="h-3 w-24 bg-white/10 rounded" />
            </div>
            <div className="h-6 w-20 bg-white/10 rounded" />
            <div className="h-4 w-20 bg-white/10 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <div
        className={cn(
          "text-center py-12 bg-white/5 rounded-2xl border border-white/10",
          className
        )}
      >
        <TrendingUp className="w-12 h-12 text-white/20 mx-auto mb-3" />
        <p className="text-white/60">No collections data available</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header with Timeframe Toggle */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Top Collections</h3>
        <TimeframeToggle
          value={timeframe}
          onChange={setTimeframe}
          size="sm"
        />
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-white/10 text-white/50">
          <div className="col-span-1 text-xs uppercase tracking-wider">#</div>
          <div className="col-span-3 text-xs uppercase tracking-wider">
            Collection
          </div>
          <div className="col-span-2 flex justify-end">
            <SortButton field="floorPrice" label="Floor" />
          </div>
          <div className="col-span-2 flex justify-end">
            <SortButton field="volume" label={`${getTimeframeLabel()} Vol`} />
          </div>
          <div className="col-span-2 flex justify-center text-xs uppercase tracking-wider">
            {getTimeframeLabel()} Trend
          </div>
          <div className="col-span-1 flex justify-end">
            <SortButton field="sales" label="Sales" />
          </div>
          <div className="col-span-1" />
        </div>

        {/* Rows */}
        {sortedCollections.map((collection, index) => {
          const isPositive = collection.volumeChange24h?.startsWith("+");
          const isNegative = collection.volumeChange24h?.startsWith("-");
          const isExpanded = expandedRow === collection.id;
          const sparklineData = sparklines[collection.id];

          return (
            <motion.div
              key={collection.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <div
                className={cn(
                  "group relative",
                  "border-b border-white/5 transition-colors",
                  isExpanded ? "bg-white/5" : "hover:bg-white/[0.03]"
                )}
                onMouseEnter={() => setExpandedRow(collection.id)}
                onMouseLeave={() => setExpandedRow(null)}
              >
                <Link
                  href={`/collection/${collection.slug}`}
                  className="grid grid-cols-12 gap-4 px-4 py-3 items-center"
                >
                  {/* Rank Badge */}
                  <div className="col-span-1">
                    <RankBadge rank={index + 1} size="md" />
                  </div>

                  {/* Collection */}
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-white/10 flex-shrink-0 group-hover:ring-2 group-hover:ring-[rgb(163,255,18)]/30 transition-all">
                      <MediaRenderer
                        src={collection.image}
                        alt={collection.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold truncate group-hover:text-[rgb(163,255,18)] transition-colors">
                          {collection.name}
                        </span>
                        {collection.isVerified && (
                          <Shield className="w-4 h-4 text-[rgb(163,255,18)] flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Floor Price */}
                  <div className="col-span-2 text-right">
                    <span className="text-white font-medium">
                      {collection.floorPrice}
                    </span>
                    <span className="text-white/50 text-sm ml-1">
                      {collection.floorPriceCurrency}
                    </span>
                  </div>

                  {/* Volume */}
                  <div className="col-span-2 text-right">
                    <div className="text-white font-medium">
                      {collection.volume24h}
                    </div>
                    <div
                      className={cn(
                        "text-xs flex items-center justify-end gap-0.5",
                        isPositive && "text-green-400",
                        isNegative && "text-red-400",
                        !isPositive && !isNegative && "text-white/50"
                      )}
                    >
                      {isPositive && <TrendingUp className="w-3 h-3" />}
                      {isNegative && <TrendingDown className="w-3 h-3" />}
                      {collection.volumeChange24h}
                    </div>
                  </div>

                  {/* Sparkline */}
                  <div className="col-span-2 flex justify-center">
                    {sparklineData ? (
                      <MiniSparkline
                        data={sparklineData.data}
                        width={80}
                        height={28}
                        trend={sparklineData.trend}
                      />
                    ) : (
                      <div className="w-20 h-7 bg-white/5 rounded animate-pulse" />
                    )}
                  </div>

                  {/* Sales */}
                  <div className="col-span-1 text-right text-white/80">
                    {collection.sales24h}
                  </div>

                  {/* Arrow */}
                  <div className="col-span-1 text-right">
                    <ChevronRight className={cn(
                      "w-5 h-5 text-white/30 transition-all",
                      "group-hover:text-[rgb(163,255,18)] group-hover:translate-x-1"
                    )} />
                  </div>
                </Link>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-3 pt-1 grid grid-cols-4 gap-4 border-t border-white/5">
                        <div className="flex items-center gap-2 text-white/60">
                          <Users className="w-4 h-4" />
                          <span className="text-sm">Owners:</span>
                          <span className="text-white font-medium">{collection.owners.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/60">
                          <ShoppingBag className="w-4 h-4" />
                          <span className="text-sm">{getTimeframeLabel()} Sales:</span>
                          <span className="text-white font-medium">{collection.sales24h}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/60">
                          <BarChart3 className="w-4 h-4" />
                          <span className="text-sm">Change:</span>
                          <span className={cn(
                            "font-medium",
                            isPositive && "text-green-400",
                            isNegative && "text-red-400"
                          )}>
                            {collection.volumeChange24h}
                          </span>
                        </div>
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-[rgb(163,255,18)]/30 text-[rgb(163,255,18)] hover:bg-[rgb(163,255,18)]/10"
                            asChild
                          >
                            <Link href={`/collection/${collection.slug}`}>
                              View Collection
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {sortedCollections.map((collection, index) => {
          const isPositive = collection.volumeChange24h?.startsWith("+");
          const isNegative = collection.volumeChange24h?.startsWith("-");
          const sparklineData = sparklines[collection.id];

          return (
            <motion.div
              key={collection.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <Link
                href={`/collection/${collection.slug}`}
                className={cn(
                  "block p-3",
                  "bg-white/5 hover:bg-white/10 transition-colors rounded-xl",
                  "border border-white/5 hover:border-white/10"
                )}
              >
                <div className="flex items-center gap-3">
                  {/* Rank Badge */}
                  <RankBadge rank={index + 1} size="sm" />

                  {/* Image */}
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
                    <MediaRenderer
                      src={collection.image}
                      alt={collection.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold truncate">
                        {collection.name}
                      </span>
                      {collection.isVerified && (
                        <Shield className="w-4 h-4 text-[rgb(163,255,18)]" />
                      )}
                    </div>
                    <div className="text-white/50 text-sm">
                      Floor: {collection.floorPrice} {collection.floorPriceCurrency}
                    </div>
                  </div>

                  {/* Volume & Sparkline */}
                  <div className="text-right">
                    <div className="text-white font-medium text-sm">
                      {collection.volume24h}
                    </div>
                    <div
                      className={cn(
                        "text-xs flex items-center justify-end gap-0.5",
                        isPositive && "text-green-400",
                        isNegative && "text-red-400"
                      )}
                    >
                      {isPositive && <TrendingUp className="w-3 h-3" />}
                      {isNegative && <TrendingDown className="w-3 h-3" />}
                      {collection.volumeChange24h}
                    </div>
                  </div>
                </div>

                {/* Sparkline on Mobile */}
                {sparklineData && (
                  <div className="mt-2 pt-2 border-t border-white/5">
                    <MiniSparkline
                      data={sparklineData.data}
                      width={120}
                      height={24}
                      trend={sparklineData.trend}
                      className="mx-auto"
                    />
                  </div>
                )}
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* View All Button */}
      <div className="mt-6 text-center">
        <Button
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10 hover:border-white/30"
          asChild
        >
          <Link href="/marketplace/rankings">
            View All Rankings
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
