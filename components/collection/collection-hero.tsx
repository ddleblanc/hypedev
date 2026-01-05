"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Play, Pause, Volume2, VolumeX, ArrowLeft, ShoppingCart, Check, Plus,
  Share2, Globe, Twitter, Verified, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MediaRenderer } from "@/components/MediaRenderer";
import { CollectionOfferDialog } from "@/components/collection/collection-offer-dialog";
import { CollectionOffersBadge } from "@/components/collection/collection-offers-panel";
import { useActiveAccount } from "thirdweb/react";

interface CollectionHeroProps {
  collection: any;
  isWatchlisted: boolean;
  onWatchlistToggle: () => void;
  onShare: () => void;
}

// Format large numbers compactly
function formatCompact(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString();
}

export function CollectionHero({ collection, isWatchlisted, onWatchlistToggle, onShare }: CollectionHeroProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showOfferDialog, setShowOfferDialog] = useState(false);

  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const account = useActiveAccount();

  // Prepare collection data for offer dialog
  const collectionForOffer = collection ? {
    id: collection.id,
    name: collection.title,
    address: collection.contractAddress,
    image: collection.image || collection.bannerImage,
    floorPrice: collection.stats?.floorPrice ? parseFloat(collection.stats.floorPrice) : null,
    totalSupply: collection.stats?.totalSupply,
  } : null;

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="relative h-[50vh] md:h-[55vh] overflow-hidden">
      {/* Background - static, clean */}
      <div className="absolute inset-0">
        {collection.videoUrl ? (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            muted={isMuted}
            loop
            playsInline
          >
            <source src={collection.videoUrl} type="video/webm" />
          </video>
        ) : (
          <MediaRenderer
            src={collection.bannerImage}
            alt={collection.title}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />
      </div>

      {/* Top Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <Button
          size="icon"
          variant="ghost"
          className="bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors duration-150"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        {collection.videoUrl && (
          <div className="flex gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors duration-150"
              onClick={togglePlayPause}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors duration-150"
              onClick={toggleMute}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
          </div>
        )}
      </div>

      {/* Hero Content - Desktop */}
      <div className="hidden md:block absolute bottom-0 left-0 right-0 p-8">
        {/* Creator Info */}
        <div className="flex items-center gap-3 mb-3">
          <img
            src={collection.creator.avatar}
            alt={collection.creator.name}
            className="w-9 h-9 rounded-full border border-white/20"
          />
          <div className="flex items-center gap-2">
            <span className="text-white/70 text-sm">by</span>
            <span className="text-white font-medium">{collection.creator.name}</span>
            {collection.creator.verified && (
              <Verified className="w-4 h-4 text-blue-400 fill-current" />
            )}
          </div>
        </div>

        {/* Title & Description */}
        <h1 className="text-4xl font-bold text-white mb-2">
          {collection.title}
        </h1>
        <p className="text-base text-white/80 mb-5 max-w-2xl line-clamp-2">
          {collection.description}
        </p>

        {/* Stats Row */}
        <div className="flex items-center gap-6 mb-5">
          <div>
            <p className="text-xs text-white/50 mb-0.5">Floor</p>
            <p className="text-xl font-semibold text-white">
              {parseFloat(collection.stats.floorPrice || 0).toFixed(5)} ETH
            </p>
          </div>
          <Separator orientation="vertical" className="h-10 bg-white/20" />
          <div>
            <p className="text-xs text-white/50 mb-0.5">Volume</p>
            <p className="text-xl font-semibold text-white">
              {formatCompact(parseFloat(collection.stats.volumeAll || 0))} ETH
            </p>
          </div>
          <Separator orientation="vertical" className="h-10 bg-white/20" />
          <div>
            <p className="text-xs text-white/50 mb-0.5">Items</p>
            <p className="text-xl font-semibold text-white">
              {formatCompact(collection.stats.totalSupply || 0)}
            </p>
          </div>
          <Separator orientation="vertical" className="h-10 bg-white/20" />
          <div>
            <p className="text-xs text-white/50 mb-0.5">Owners</p>
            <p className="text-xl font-semibold text-white">
              {formatCompact(collection.stats.owners || 0)}
            </p>
          </div>
        </div>

        {/* Best Offer Badge */}
        {collection?.id && (
          <div className="mb-3">
            <CollectionOffersBadge collectionId={collection.id} />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            size="default"
            className="bg-white text-black hover:bg-white/90 font-medium transition-colors duration-150"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Buy Now
          </Button>
          {account && (
            <Button
              size="default"
              variant="outline"
              className="border-[rgb(163,255,18)]/50 text-[rgb(163,255,18)] hover:bg-[rgb(163,255,18)]/10 transition-colors duration-150"
              onClick={() => setShowOfferDialog(true)}
            >
              <Layers className="w-4 h-4 mr-2" />
              Make Offer
            </Button>
          )}
          <Button
            size="default"
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10 transition-colors duration-150"
            onClick={onWatchlistToggle}
          >
            {isWatchlisted ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Watching
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Watchlist
              </>
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="text-white/70 hover:text-white hover:bg-white/10 transition-colors duration-150"
            onClick={onShare}
          >
            <Share2 className="w-4 h-4" />
          </Button>

          {/* Social Links */}
          <div className="flex items-center gap-1 ml-auto">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10">
                  <Globe className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Website</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10">
                  <Twitter className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Twitter</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Hero Content - Mobile */}
      <div className="md:hidden absolute bottom-0 left-0 right-0 p-4 pb-5">
        {/* Creator */}
        <div className="flex items-center gap-2 mb-2">
          <img
            src={collection.creator.avatar}
            alt={collection.creator.name}
            className="w-7 h-7 rounded-full border border-white/20"
          />
          <span className="text-white/70 text-sm">by</span>
          <span className="text-white font-medium text-sm">{collection.creator.name}</span>
          {collection.creator.verified && (
            <Verified className="w-3 h-3 text-blue-400 fill-current" />
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-1">
          {collection.title}
        </h1>
        <p className="text-sm text-white/70 line-clamp-2 mb-3">
          {collection.description}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1.5">
            <p className="text-[10px] text-white/50">Floor</p>
            <p className="text-sm font-semibold text-white">
              {parseFloat(collection.stats.floorPrice || 0).toFixed(2)}
            </p>
          </div>
          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1.5">
            <p className="text-[10px] text-white/50">Volume</p>
            <p className="text-sm font-semibold text-white">
              {formatCompact(parseFloat(collection.stats.volumeAll || 0))}
            </p>
          </div>
          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1.5">
            <p className="text-[10px] text-white/50">Items</p>
            <p className="text-sm font-semibold text-white">
              {formatCompact(collection.stats.totalSupply || 0)}
            </p>
          </div>
          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1.5">
            <p className="text-[10px] text-white/50">Owners</p>
            <p className="text-sm font-semibold text-white">
              {formatCompact(collection.stats.owners || 0)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="flex-1 bg-white text-black hover:bg-white/90 font-medium h-9"
          >
            <ShoppingCart className="w-4 h-4 mr-1" />
            Buy
          </Button>
          {account && (
            <Button
              size="icon"
              variant="outline"
              className="border-[rgb(163,255,18)]/50 text-[rgb(163,255,18)] hover:bg-[rgb(163,255,18)]/10 h-9 w-9"
              onClick={() => setShowOfferDialog(true)}
            >
              <Layers className="w-4 h-4" />
            </Button>
          )}
          <Button
            size="icon"
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10 h-9 w-9"
            onClick={onWatchlistToggle}
          >
            {isWatchlisted ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10 h-9 w-9"
            onClick={onShare}
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Collection Offer Dialog */}
      <CollectionOfferDialog
        open={showOfferDialog}
        onOpenChange={setShowOfferDialog}
        collection={collectionForOffer}
        onSuccess={() => setShowOfferDialog(false)}
      />
    </div>
  );
}
