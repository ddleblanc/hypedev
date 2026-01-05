"use client";

import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

interface CampaignCardProps {
  campaign: {
    id: string;
    name: string;
    description?: string | null;
    bannerImage?: string | null;
    baseCommissionBps: number;
    xpPerReferral: number;
    totalAgents: number;
    totalReferrals: number;
    endAt: Date | string;
    startAt: Date | string;
    status: string;
    isFeatured: boolean;
    collection?: {
      name: string;
      image: string | null;
      slug?: string | null;
    } | null;
    lootbox?: {
      name: string;
      image: string | null;
    } | null;
    creator?: {
      username: string | null;
      profilePicture?: string | null;
    } | null;
  };
  onJoin?: () => void;
  onView?: () => void;
  isJoined?: boolean;
  isJoining?: boolean;
  showJoinButton?: boolean;
  compact?: boolean;
  className?: string;
}

export function CampaignCard({
  campaign,
  onJoin,
  onView,
  isJoined,
  isJoining,
  showJoinButton = true,
  compact = false,
  className,
}: CampaignCardProps) {
  const target = campaign.collection || campaign.lootbox;
  const endDate = new Date(campaign.endAt);
  const startDate = new Date(campaign.startAt);
  const now = new Date();

  const isEnded = endDate < now;
  const isUpcoming = startDate > now;
  const endsIn = formatDistanceToNow(endDate, { addSuffix: true });
  const startsIn = formatDistanceToNow(startDate, { addSuffix: true });

  const commissionPercent = campaign.baseCommissionBps / 100;
  const targetImage = campaign.bannerImage || target?.image;

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-4 rounded-lg border p-4",
          campaign.isFeatured ? "border-amber-500/50" : "border-zinc-700",
          "bg-black/40 backdrop-blur-sm",
          "hover:bg-white/5 transition-colors cursor-pointer",
          className
        )}
        onClick={onView}
      >
        {/* Image */}
        <div className="w-14 h-14 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
          {targetImage ? (
            <img
              src={targetImage}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-zinc-600" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white truncate">{campaign.name}</h3>
            {campaign.isFeatured && (
              <Star className="w-4 h-4 text-amber-400 fill-amber-400 flex-shrink-0" />
            )}
          </div>
          <div className="text-sm text-zinc-400 truncate">
            {target?.name}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-center">
            <div className="text-lg font-bold text-green-400">
              {commissionPercent}%
            </div>
            <div className="text-xs text-zinc-500">Commission</div>
          </div>
          {showJoinButton && (
            <Button
              size="sm"
              variant={isJoined ? "outline" : "default"}
              onClick={(e) => {
                e.stopPropagation();
                onJoin?.();
              }}
              disabled={isJoined || isJoining || isEnded}
            >
              {isJoined ? "Joined" : "Join"}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "rounded-xl border overflow-hidden",
        campaign.isFeatured
          ? "border-amber-500 ring-1 ring-amber-500/20"
          : "border-zinc-700",
        "bg-black/40 backdrop-blur-sm",
        className
      )}
    >
      {/* Banner */}
      <div className="relative h-36 bg-zinc-800">
        {targetImage ? (
          <img
            src={targetImage}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-zinc-600" />
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Featured badge */}
        {campaign.isFeatured && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-amber-500 text-black font-bold gap-1">
              <Star className="w-3 h-3 fill-current" />
              FEATURED
            </Badge>
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-3 right-3">
          {isEnded ? (
            <Badge variant="secondary" className="bg-zinc-800">
              Ended
            </Badge>
          ) : isUpcoming ? (
            <Badge className="bg-blue-600">Starts {startsIn}</Badge>
          ) : (
            <Badge className="bg-green-600 gap-1">
              <Clock className="w-3 h-3" />
              Ends {endsIn}
            </Badge>
          )}
        </div>

        {/* Target type indicator */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <div className="text-lg">
            {campaign.collection ? "🖼️" : "🎁"}
          </div>
          <span className="text-sm text-white/80 font-medium">
            {target?.name}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title & Creator */}
        <div className="mb-3">
          <h3 className="font-bold text-lg text-white">{campaign.name}</h3>
          {campaign.creator && (
            <div className="flex items-center gap-2 mt-1 text-sm text-zinc-400">
              {campaign.creator.profilePicture && (
                <img
                  src={campaign.creator.profilePicture}
                  alt=""
                  className="w-4 h-4 rounded-full"
                />
              )}
              <span>by {campaign.creator.username || "Creator"}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {campaign.description && (
          <p className="text-sm text-zinc-400 mb-4 line-clamp-2">
            {campaign.description}
          </p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center p-2 rounded-lg bg-zinc-900/50">
            <div className="text-lg font-bold text-green-400">
              {commissionPercent}%
            </div>
            <div className="text-xs text-zinc-500">Commission</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-zinc-900/50">
            <div className="text-lg font-bold text-amber-400 flex items-center justify-center gap-1">
              <Zap className="w-4 h-4" />
              {campaign.xpPerReferral}
            </div>
            <div className="text-xs text-zinc-500">XP/Sale</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-zinc-900/50">
            <div className="text-lg font-bold text-zinc-300 flex items-center justify-center gap-1">
              <Users className="w-4 h-4" />
              {campaign.totalAgents}
            </div>
            <div className="text-xs text-zinc-500">Agents</div>
          </div>
        </div>

        {/* Performance indicator */}
        {campaign.totalReferrals > 0 && (
          <div className="flex items-center gap-2 text-sm text-zinc-400 mb-4">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span>{campaign.totalReferrals} conversions</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {showJoinButton && (
            <Button
              onClick={onJoin}
              disabled={isJoined || isJoining || isEnded}
              className={cn(
                "flex-1",
                isJoined
                  ? "bg-green-600/20 text-green-400 border border-green-600/50"
                  : ""
              )}
              variant={isJoined ? "outline" : "default"}
            >
              {isJoining ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Joining...
                </>
              ) : isJoined ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Joined
                </>
              ) : isEnded ? (
                "Campaign Ended"
              ) : (
                "Join Campaign"
              )}
            </Button>
          )}
          {onView && (
            <Button variant="outline" size="icon" onClick={onView}>
              <ExternalLink className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Skeleton loader for campaign cards
 */
export function CampaignCardSkeleton({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex items-center gap-4 rounded-lg border border-zinc-700 p-4 bg-black/40 animate-pulse">
        <div className="w-14 h-14 rounded-lg bg-zinc-800" />
        <div className="flex-1">
          <div className="h-4 w-32 bg-zinc-800 rounded mb-2" />
          <div className="h-3 w-24 bg-zinc-800 rounded" />
        </div>
        <div className="h-8 w-16 bg-zinc-800 rounded" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-700 overflow-hidden bg-black/40 animate-pulse">
      <div className="h-36 bg-zinc-800" />
      <div className="p-4">
        <div className="h-5 w-40 bg-zinc-800 rounded mb-2" />
        <div className="h-3 w-24 bg-zinc-800 rounded mb-4" />
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-zinc-800 rounded" />
          ))}
        </div>
        <div className="h-10 bg-zinc-800 rounded" />
      </div>
    </div>
  );
}
