"use client";

import React, { useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Play, Pause, Volume2, VolumeX, ArrowLeft, ShoppingCart, Check, Plus,
  Share2, Globe, Twitter, Verified
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MediaRenderer } from "@/components/MediaRenderer";

interface CollectionHeroProps {
  collection: any;
  isWatchlisted: boolean;
  onWatchlistToggle: () => void;
  onShare: () => void;
}

export function CollectionHero({ collection, isWatchlisted, onWatchlistToggle, onShare }: CollectionHeroProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  const router = useRouter();
  const heroRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

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
    <motion.div
      ref={heroRef}
      className="relative h-[75vh] md:h-[85vh] overflow-hidden"
      style={{ scale: heroScale }}
    >
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
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
      </div>

      {/* Back Button & Controls */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="absolute top-4 left-4 right-4 flex items-center justify-between z-10"
      >
        <Button
          size="icon"
          variant="ghost"
          className="bg-black/40 backdrop-blur text-white hover:bg-black/60"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <div className="flex gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="bg-black/40 backdrop-blur text-white hover:bg-black/60"
            onClick={togglePlayPause}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="bg-black/40 backdrop-blur text-white hover:bg-black/60"
            onClick={toggleMute}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>
        </div>
      </motion.div>

      {/* Hero Content - Desktop */}
      <motion.div
        style={{ opacity: heroOpacity }}
        className="hidden md:block absolute bottom-0 left-0 right-0 p-12"
      >
        <div>
          {/* Creator Info */}
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex items-center gap-3 mb-4"
          >
            <img
              src={collection.creator.avatar}
              alt={collection.creator.name}
              className="w-10 h-10 rounded-full border-2 border-white/20"
            />
            <div className="flex items-center gap-2">
              <p className="text-white/80">Created by</p>
              <p className="text-white font-bold">{collection.creator.name}</p>
              {collection.creator.verified && (
                <Verified className="w-4 h-4 text-blue-400 fill-current" />
              )}
            </div>
          </motion.div>

          {/* Title & Description */}
          <motion.h1
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-6xl font-black text-white mb-3"
          >
            {collection.title}
          </motion.h1>
          <motion.p
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-lg text-white/90 mb-6"
          >
            {collection.description}
          </motion.p>

          {/* Quick Stats */}
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="flex flex-wrap items-center gap-6 mb-6"
          >
            <div>
              <p className="text-sm text-white/60">Floor Price</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-[rgb(163,255,18)]">
                  {collection.stats.floorPrice} ETH
                </p>
                <p className="text-sm text-white/60">
                  ${collection.stats.floorPriceUSD.toLocaleString()}
                </p>
              </div>
            </div>
            <Separator orientation="vertical" className="h-12 bg-white/20" />
            <div>
              <p className="text-sm text-white/60">Total Volume</p>
              <p className="text-2xl font-bold text-white">
                {collection.stats.volumeAll} ETH
              </p>
            </div>
            <Separator orientation="vertical" className="h-12 bg-white/20" />
            <div>
              <p className="text-sm text-white/60">Items</p>
              <p className="text-2xl font-bold text-white">
                {collection.stats.totalSupply.toLocaleString()}
              </p>
            </div>
            <Separator orientation="vertical" className="h-12 bg-white/20" />
            <div>
              <p className="text-sm text-white/60">Owners</p>
              <p className="text-2xl font-bold text-white">
                {collection.stats.owners.toLocaleString()}
              </p>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="flex flex-wrap items-center gap-3"
          >
            <Button
              size="lg"
              className="bg-black/80 text-white hover:bg-black/90 border border-white/20 font-bold"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Buy Now
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
              onClick={onWatchlistToggle}
            >
              {isWatchlisted ? (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Watching
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-2" />
                  Add to Watchlist
                </>
              )}
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="text-white hover:bg-white/10"
              onClick={onShare}
            >
              <Share2 className="w-5 h-5 mr-2" />
              Share
            </Button>

            {/* Social Links */}
            <div className="flex items-center gap-2 ml-auto">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" className="text-white hover:bg-white/10">
                    <Globe className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Website</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" className="text-white hover:bg-white/10">
                    <Twitter className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Twitter</TooltipContent>
              </Tooltip>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Hero Content - Mobile (Social Media Profile Style) */}
      <motion.div
        style={{ opacity: heroOpacity }}
        className="md:hidden absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/95 to-transparent p-4 pb-6"
      >
        <div className="space-y-3">
          {/* Creator Info - Compact */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex items-center gap-2"
          >
            <img
              src={collection.creator.avatar}
              alt={collection.creator.name}
              className="w-8 h-8 rounded-full border border-white/20"
            />
            <p className="text-white/80 text-sm">by</p>
            <p className="text-white font-bold text-sm">{collection.creator.name}</p>
            {collection.creator.verified && (
              <Verified className="w-3 h-3 text-blue-400 fill-current" />
            )}
          </motion.div>

          {/* Title & Description - Compact */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <h1 className="text-2xl font-black text-white mb-1">
              {collection.title}
            </h1>
            <p className="text-sm text-white/80 line-clamp-2">
              {collection.description}
            </p>
          </motion.div>

          {/* Quick Stats - Compact Grid */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="grid grid-cols-4 gap-2"
          >
            <div className="bg-black/40 backdrop-blur rounded-lg p-2">
              <p className="text-[10px] text-white/60 mb-0.5">Floor</p>
              <p className="text-sm font-bold text-[rgb(163,255,18)]">
                {collection.stats.floorPrice}
              </p>
            </div>
            <div className="bg-black/40 backdrop-blur rounded-lg p-2">
              <p className="text-[10px] text-white/60 mb-0.5">Volume</p>
              <p className="text-sm font-bold text-white">
                {collection.stats.volumeAll}
              </p>
            </div>
            <div className="bg-black/40 backdrop-blur rounded-lg p-2">
              <p className="text-[10px] text-white/60 mb-0.5">Items</p>
              <p className="text-sm font-bold text-white">
                {collection.stats.totalSupply > 1000
                  ? `${(collection.stats.totalSupply / 1000).toFixed(1)}K`
                  : collection.stats.totalSupply}
              </p>
            </div>
            <div className="bg-black/40 backdrop-blur rounded-lg p-2">
              <p className="text-[10px] text-white/60 mb-0.5">Owners</p>
              <p className="text-sm font-bold text-white">
                {collection.stats.owners > 1000
                  ? `${(collection.stats.owners / 1000).toFixed(1)}K`
                  : collection.stats.owners}
              </p>
            </div>
          </motion.div>

          {/* Action Buttons - Compact */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="flex items-center gap-2"
          >
            <Button
              size="sm"
              className="flex-1 bg-black/80 text-white hover:bg-black/90 border border-white/20 font-bold h-9"
            >
              <ShoppingCart className="w-4 h-4 mr-1" />
              Buy
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 h-9 w-9 shrink-0"
              onClick={onWatchlistToggle}
            >
              {isWatchlisted ? (
                <Check className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 h-9 w-9 shrink-0"
              onClick={onShare}
            >
              <Share2 className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 h-9 w-9 shrink-0"
            >
              <Globe className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
