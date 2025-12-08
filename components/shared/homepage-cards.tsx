"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Shield,
  Clock,
  Flame,
  Sparkles,
  Star
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MediaRenderer } from "@/components/MediaRenderer";
import { cn } from "@/lib/utils";
import type {
  CollectionCardData,
  NFTSaleData,
  LaunchpadProjectData,
  LootboxData
} from "@/types/homepage";

// Helper to format price with max 6 decimals
function formatPrice(value: string, currency: string): { value: string; currency: string } {
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return { value, currency };

  const formatted = numValue.toFixed(6).replace(/\.?0+$/, '');
  return { value: formatted, currency };
}

// Helper to format time ago
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

// ============================================
// COLLECTION CARD
// ============================================
interface CollectionCardProps {
  collection: CollectionCardData;
  variant?: 'default' | 'featured' | 'compact';
  className?: string;
}

export function CollectionCard({ collection, variant = 'default', className }: CollectionCardProps) {
  const { value: priceValue, currency: priceCurrency } = formatPrice(
    collection.floorPrice,
    collection.floorPriceCurrency
  );

  const isPositiveChange = collection.change24h?.startsWith('+');

  return (
    <Link href={`/collection/${collection.slug}`}>
      <motion.div
        whileHover={{ y: -4 }}
        className={cn(
          "group cursor-pointer",
          variant === 'compact' && "w-32",
          variant === 'default' && "w-40 md:w-48",
          variant === 'featured' && "w-56 md:w-64",
          className
        )}
      >
        {/* Image Container */}
        <div className={cn(
          "relative overflow-hidden rounded-xl mb-2",
          variant === 'compact' ? "aspect-square" : "aspect-square"
        )}>
          <MediaRenderer
            src={collection.image}
            alt={collection.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {collection.isVerified && (
              <Badge className="bg-[rgb(163,255,18)] text-black text-[10px] px-1.5 py-0.5">
                <Shield className="w-2.5 h-2.5 mr-0.5" />
                Verified
              </Badge>
            )}
            {collection.isTrending && (
              <Badge className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5">
                <Flame className="w-2.5 h-2.5 mr-0.5" />
                Hot
              </Badge>
            )}
            {collection.isFeatured && (
              <Badge className="bg-purple-500 text-white text-[10px] px-1.5 py-0.5">
                <Star className="w-2.5 h-2.5 mr-0.5" />
                Featured
              </Badge>
            )}
          </div>

          {/* Change badge */}
          {collection.change24h && (
            <div className={cn(
              "absolute bottom-2 right-2 px-2 py-1 rounded-md text-xs font-bold",
              "backdrop-blur-md",
              isPositiveChange
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-red-500/20 text-red-400 border border-red-500/30"
            )}>
              <span className="flex items-center gap-0.5">
                {isPositiveChange ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {collection.change24h}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-1">
          <h3 className="text-white font-bold text-sm md:text-base truncate leading-tight">
            {collection.name}
          </h3>
          {collection.creatorName && (
            <p className="text-[rgb(163,255,18)] text-xs md:text-sm truncate leading-tight">
              {collection.creatorName}
            </p>
          )}
          <div className="pt-1">
            <p className="text-white/50 text-[10px] uppercase tracking-wider">Floor Price</p>
            <p className="text-sm">
              <span className="text-white font-semibold">{priceValue}</span>
              <span className="text-white/60 ml-1">{priceCurrency}</span>
            </p>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

// ============================================
// NFT SALE CARD
// ============================================
interface NFTSaleCardProps {
  sale: NFTSaleData;
  className?: string;
}

export function NFTSaleCard({ sale, className }: NFTSaleCardProps) {
  const { value: priceValue, currency: priceCurrency } = formatPrice(
    sale.salePrice,
    sale.salePriceCurrency
  );

  return (
    <Link href={`/collection/${sale.collectionSlug}/${sale.tokenId}`}>
      <motion.div
        whileHover={{ y: -4 }}
        className={cn("group cursor-pointer w-40 md:w-48", className)}
      >
        {/* Image */}
        <div className="relative overflow-hidden rounded-xl aspect-square mb-2">
          <MediaRenderer
            src={sale.image}
            alt={sale.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />

          {/* Sale indicator */}
          <div className="absolute top-2 left-2">
            <Badge className="bg-[rgb(163,255,18)] text-black text-[10px] font-bold">
              SOLD
            </Badge>
          </div>

          {/* Time */}
          <div className="absolute bottom-2 right-2 px-2 py-1 rounded-md text-[10px] bg-black/60 backdrop-blur-md text-white/80">
            {formatTimeAgo(sale.saleDate)}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-1">
          <h3 className="text-white font-bold text-sm truncate">{sale.name}</h3>
          <p className="text-white/60 text-xs truncate">{sale.collectionName}</p>
          <div className="pt-1">
            <p className="text-white/50 text-[10px] uppercase tracking-wider">Sale Price</p>
            <p className="text-lg font-bold">
              <span className="text-[rgb(163,255,18)]">{priceValue}</span>
              <span className="text-white/60 ml-1 text-sm">{priceCurrency}</span>
            </p>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

// ============================================
// LAUNCHPAD PROJECT CARD
// ============================================
interface LaunchpadCardProps {
  project: LaunchpadProjectData;
  variant?: 'default' | 'featured';
  className?: string;
}

export function LaunchpadCard({ project, variant = 'default', className }: LaunchpadCardProps) {
  const { value: priceValue, currency: priceCurrency } = formatPrice(
    project.mintPrice,
    project.mintPriceCurrency
  );

  const mintProgress = project.totalSupply > 0
    ? (project.mintedSupply / project.totalSupply) * 100
    : 0;

  const statusColors = {
    upcoming: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    live: 'bg-green-500/20 text-green-400 border-green-500/30',
    ended: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  return (
    <Link href={`/launchpad/${project.slug}`}>
      <motion.div
        whileHover={{ y: -4 }}
        className={cn(
          "group cursor-pointer",
          variant === 'default' ? "w-48 md:w-56" : "w-64 md:w-72",
          className
        )}
      >
        {/* Image */}
        <div className={cn(
          "relative overflow-hidden rounded-xl mb-2",
          variant === 'default' ? "aspect-[4/3]" : "aspect-video"
        )}>
          <MediaRenderer
            src={project.bannerImage || project.image}
            alt={project.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Status badge */}
          <div className="absolute top-2 left-2">
            <Badge className={cn("text-[10px] font-bold border", statusColors[project.status])}>
              {project.status === 'live' && <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1 animate-pulse" />}
              {project.status.toUpperCase()}
            </Badge>
          </div>

          {/* Verified badge */}
          {project.isVerified && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-[rgb(163,255,18)] text-black text-[10px]">
                <Shield className="w-2.5 h-2.5" />
              </Badge>
            </div>
          )}

          {/* Bottom info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="text-white font-bold text-sm md:text-base truncate mb-1">
              {project.name}
            </h3>
            {project.creatorName && (
              <p className="text-white/70 text-xs truncate">by {project.creatorName}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-2">
          {/* Progress bar */}
          {project.status === 'live' && (
            <div>
              <div className="flex justify-between text-[10px] text-white/60 mb-1">
                <span>Minted</span>
                <span>{project.mintedSupply.toLocaleString()} / {project.totalSupply.toLocaleString()}</span>
              </div>
              <Progress value={mintProgress} className="h-1.5" />
            </div>
          )}

          {/* Price and date */}
          <div className="flex justify-between items-end">
            <div>
              <p className="text-white/50 text-[10px] uppercase tracking-wider">Mint Price</p>
              <p className="text-sm">
                <span className="text-white font-semibold">{priceValue}</span>
                <span className="text-white/60 ml-1">{priceCurrency}</span>
              </p>
            </div>
            {project.startDate && project.status === 'upcoming' && (
              <div className="text-right">
                <p className="text-white/50 text-[10px] uppercase tracking-wider">Starts</p>
                <p className="text-white/80 text-xs flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(project.startDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

// ============================================
// LOOTBOX CARD
// ============================================
interface LootboxCardProps {
  lootbox: LootboxData;
  className?: string;
}

export function LootboxCard({ lootbox, className }: LootboxCardProps) {
  const { value: priceValue, currency: priceCurrency } = formatPrice(
    lootbox.price,
    lootbox.priceCurrency
  );

  const rarityColors = {
    common: 'border-gray-500/50',
    rare: 'border-blue-500/50',
    epic: 'border-purple-500/50',
    legendary: 'border-[rgb(163,255,18)]/50',
  };

  const rarityGlow = {
    common: '',
    rare: 'shadow-blue-500/20',
    epic: 'shadow-purple-500/20',
    legendary: 'shadow-[rgb(163,255,18)]/20',
  };

  return (
    <Link href={`/lootboxes/${lootbox.id}`}>
      <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        className={cn("group cursor-pointer w-40 md:w-48", className)}
      >
        {/* Image with rarity border */}
        <div className={cn(
          "relative overflow-hidden rounded-xl aspect-square mb-2",
          "border-2 transition-all duration-300",
          rarityColors[lootbox.rarity || 'common'],
          "group-hover:shadow-xl",
          rarityGlow[lootbox.rarity || 'common']
        )}>
          <MediaRenderer
            src={lootbox.image}
            alt={lootbox.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />

          {/* Sparkle overlay for legendary */}
          {lootbox.rarity === 'legendary' && (
            <div className="absolute inset-0 bg-gradient-to-t from-[rgb(163,255,18)]/20 via-transparent to-transparent" />
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex gap-1">
            {lootbox.isTrending && (
              <Badge className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5">
                <Flame className="w-2.5 h-2.5 mr-0.5" />
                Hot
              </Badge>
            )}
            {lootbox.isFeatured && (
              <Badge className="bg-purple-500 text-white text-[10px] px-1.5 py-0.5">
                <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                Featured
              </Badge>
            )}
          </div>

          {/* Rarity badge */}
          {lootbox.rarity && (
            <div className="absolute bottom-2 right-2">
              <Badge className={cn(
                "text-[10px] font-bold uppercase",
                lootbox.rarity === 'legendary' && "bg-[rgb(163,255,18)] text-black",
                lootbox.rarity === 'epic' && "bg-purple-500 text-white",
                lootbox.rarity === 'rare' && "bg-blue-500 text-white",
                lootbox.rarity === 'common' && "bg-gray-500 text-white"
              )}>
                {lootbox.rarity}
              </Badge>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-1">
          <h3 className="text-white font-bold text-sm truncate">{lootbox.name}</h3>
          {lootbox.remainingSupply !== undefined && lootbox.totalSupply && (
            <p className="text-white/60 text-xs">
              {lootbox.remainingSupply.toLocaleString()} / {lootbox.totalSupply.toLocaleString()} left
            </p>
          )}
          <div className="pt-1">
            <p className="text-white/50 text-[10px] uppercase tracking-wider">Price</p>
            <p className="text-sm">
              <span className="text-white font-semibold">{priceValue}</span>
              <span className="text-white/60 ml-1">{priceCurrency}</span>
            </p>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
