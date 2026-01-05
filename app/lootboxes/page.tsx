"use client";

import React, { useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Play,
  Search,
  Gift,
  Package,
  Sparkles,
  Crown,
  Gem,
  Star,
  Shield,
  Timer,
  Users,
  Volume2,
  VolumeX,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MediaRenderer } from "thirdweb/react";
import { client } from "@/lib/thirdweb";
import { cva } from "class-variance-authority";
import { trpc } from "@/lib/trpc/client";

// Lootbox type inferred from tRPC router
type Lootbox = {
  id: string;
  onChainId: number;
  name: string;
  description: string | null;
  image: string;
  price: number;
  priceCurrency: string;
  rarity: string;
  totalSupply: number;
  remainingSupply: number;
  contractAddress: string;
  creator: {
    id: string;
    username: string | null;
    profilePicture: string | null;
    walletAddress: string;
  };
  rewardCount: number;
  openingsCount: number;
  rarityDistribution: Record<string, number>;
  createdAt: string;
};

// Rarity configuration
const rarityConfig = {
  common: {
    color: "#9ca3af",
    glow: "rgba(156,163,175,0.4)",
    gradient: "from-gray-600 via-gray-500 to-gray-600",
    icon: Shield,
    bg: "bg-gray-500/20",
    text: "text-gray-400",
    border: "border-gray-500/30",
  },
  rare: {
    color: "#60a5fa",
    glow: "rgba(96,165,250,0.5)",
    gradient: "from-blue-600 via-blue-400 to-blue-600",
    icon: Star,
    bg: "bg-blue-500/20",
    text: "text-blue-400",
    border: "border-blue-500/30",
  },
  epic: {
    color: "#a855f7",
    glow: "rgba(168,85,247,0.6)",
    gradient: "from-purple-600 via-purple-400 to-purple-600",
    icon: Gem,
    bg: "bg-purple-500/20",
    text: "text-purple-400",
    border: "border-purple-500/30",
  },
  mythic: {
    color: "#fbbf24",
    glow: "rgba(251,191,36,0.7)",
    gradient: "from-yellow-600 via-amber-400 to-yellow-600",
    icon: Crown,
    bg: "bg-yellow-500/20",
    text: "text-yellow-400",
    border: "border-yellow-500/30",
  },
  cosmic: {
    color: "#22d3ee",
    glow: "rgba(34,211,238,0.8)",
    gradient: "from-cyan-600 via-cyan-400 to-cyan-600",
    icon: Sparkles,
    bg: "bg-cyan-500/20",
    text: "text-cyan-400",
    border: "border-cyan-500/30",
  },
} as const;

// Hero content
const heroContent = {
  title: "NFT Lootbox Arena",
  subtitle: "Discover legendary rewards",
  description:
    "Open mystery boxes powered by Chainlink VRF for provably fair randomness. Every pull could be your next legendary NFT. Are you feeling lucky?",
  video:
    "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/ea507b10-5017-472d-8433-06c0676dee51/transcode=true,original=true,quality=90/WanVideoWrapper_I2V_00047.webm",
  stats: {
    totalBoxes: "50,000+",
    totalOpened: "32,847",
    totalValue: "1,247 ETH",
  },
};

// Lootbox card variants
const lootboxCardVariants = cva(
  "relative group cursor-pointer rounded-xl overflow-hidden transition-all duration-500 border backdrop-blur-sm",
  {
    variants: {
      rarity: {
        common:
          "border-gray-500/30 hover:border-gray-400/60 hover:shadow-2xl hover:shadow-gray-500/30",
        rare: "border-blue-500/30 hover:border-blue-400/60 hover:shadow-2xl hover:shadow-blue-500/30",
        epic: "border-purple-500/30 hover:border-purple-400/60 hover:shadow-2xl hover:shadow-purple-500/30",
        mythic:
          "border-yellow-500/30 hover:border-yellow-400/60 hover:shadow-2xl hover:shadow-yellow-500/30",
        cosmic:
          "border-cyan-500/30 hover:border-cyan-400/60 hover:shadow-2xl hover:shadow-cyan-500/30",
      },
    },
    defaultVariants: {
      rarity: "common",
    },
  }
);

interface LootboxCardProps {
  lootbox: Lootbox;
  onClick: () => void;
  index: number;
}

function LootboxCard({ lootbox, onClick, index }: LootboxCardProps) {
  const rarityKey = lootbox.rarity.toLowerCase() as keyof typeof rarityConfig;
  const config = rarityConfig[rarityKey] || rarityConfig.common;
  const isVideo =
    lootbox.image.includes(".webm") || lootbox.image.includes(".mp4");
  const supplyPercent =
    ((lootbox.totalSupply - lootbox.remainingSupply) / lootbox.totalSupply) *
    100;
  const RarityIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.08,
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{ y: -12, scale: 1.02 }}
      className={cn(lootboxCardVariants({ rarity: rarityKey }))}
      onClick={onClick}
    >
      {/* Background glow effect */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${config.glow}, transparent 70%)`,
        }}
      />

      {/* Media */}
      <div className="aspect-[4/5] relative overflow-hidden">
        {isVideo ? (
          <video
            src={lootbox.image}
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-110 transition-all duration-700"
            onMouseEnter={(e) => e.currentTarget.play()}
            onMouseLeave={(e) => e.currentTarget.pause()}
          />
        ) : (
          <MediaRenderer
            client={client}
            src={lootbox.image}
            alt={lootbox.name}
            className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-110 transition-all duration-700"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        {/* Supply bar at top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-black/50">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${100 - supplyPercent}%`,
              backgroundColor: config.color,
            }}
          />
        </div>

        {/* Rarity badge */}
        <div className="absolute top-3 left-3">
          <Badge
            className={cn(
              "text-xs font-bold flex items-center gap-1 backdrop-blur-sm",
              `bg-gradient-to-r ${config.gradient} text-white border-0`
            )}
          >
            <RarityIcon className="h-3 w-3" />
            {lootbox.rarity}
          </Badge>
        </div>

        {/* Low supply warning */}
        {lootbox.remainingSupply < 100 && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-red-500/90 text-white text-xs flex items-center gap-1 backdrop-blur-sm">
              <Timer className="h-3 w-3" />
              Low Stock
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 bg-black/60">
        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[rgb(163,255,18)] transition-colors duration-300">
          {lootbox.name}
        </h3>

        {lootbox.description && (
          <p className="text-white/50 text-sm line-clamp-2 mb-4">
            {lootbox.description}
          </p>
        )}

        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-white/40 text-xs uppercase">Price</p>
            <p className="text-[rgb(163,255,18)] font-bold text-xl">
              {lootbox.price}{" "}
              <span className="text-sm">{lootbox.priceCurrency}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-white/40 text-xs uppercase">Remaining</p>
            <p className="text-white font-medium">
              {lootbox.remainingSupply.toLocaleString()}
              <span className="text-white/40">
                {" "}
                / {lootbox.totalSupply.toLocaleString()}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-white/40 border-t border-white/10 pt-3">
          <span className="flex items-center gap-1">
            <Package className="h-3 w-3" />
            {lootbox.rewardCount} rewards
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {lootbox.openingsCount} opened
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function LootboxBrowsePage() {
  const router = useRouter();

  // Use window scroll for parallax effect (avoids hydration issues with ref-based scroll)
  const { scrollY } = useScroll();
  const heroScale = useTransform(scrollY, [0, 600], [1, 1.15]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRarity, setSelectedRarity] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);

  // Use tRPC query for fetching lootboxes
  const {
    data,
    isLoading: loading,
    error: queryError,
  } = trpc.lootbox.list.useQuery(
    {
      rarity: selectedRarity as
        | "common"
        | "rare"
        | "epic"
        | "mythic"
        | "cosmic"
        | undefined,
      search: searchQuery || undefined,
      limit: 50,
      offset: 0,
    },
    {
      // Keep previous data while fetching new data
      placeholderData: (prev) => prev,
    }
  );

  const lootboxes = data?.lootboxes ?? [];
  const error = queryError?.message ?? null;

  const rarityFilters = ["common", "rare", "epic", "mythic", "cosmic"];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full overflow-hidden"
    >
      <div className="relative">
        {/* Hero Banner */}
        <motion.div
          className="relative h-[60vh] md:h-[70vh] overflow-hidden"
          style={{ scale: heroScale }}
        >
          <div className="absolute inset-0">
            <video
              className="w-full h-full object-cover"
              autoPlay
              muted={isMuted}
              loop
              playsInline
            >
              <source src={heroContent.video} type="video/webm" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/70 via-black/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          </div>

          {/* Hero Content */}
          <motion.div
            style={{ opacity: heroOpacity }}
            className="absolute bottom-0 left-0 right-0 p-4 md:p-8 pb-12 md:pb-24"
          >
            <div className="max-w-3xl">
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="mb-4 md:mb-6"
              >
                <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-4">
                  <Badge className="bg-[rgb(163,255,18)] text-black font-semibold px-2 md:px-3 py-1 text-xs md:text-sm flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    VRF Powered
                  </Badge>
                  <Badge className="bg-purple-500/80 text-white font-semibold px-2 md:px-3 py-1 text-xs md:text-sm">
                    Provably Fair
                  </Badge>
                </div>
              </motion.div>

              <motion.h2
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="text-4xl md:text-6xl font-bold text-white mb-3 md:mb-4"
              >
                {heroContent.title}
              </motion.h2>

              <motion.p
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="text-base md:text-xl text-white/90 mb-4 md:mb-6 leading-relaxed"
              >
                {heroContent.description}
              </motion.p>

              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="flex flex-wrap items-center gap-2 md:gap-4"
              >
                <Button
                  className="bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90 font-bold px-4 md:px-8 py-2 md:py-3 rounded-lg flex items-center gap-2 text-sm md:text-base"
                  onClick={() => {
                    const featuredSection =
                      document.getElementById("featured-section");
                    featuredSection?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <Play className="h-4 w-4 md:h-5 md:w-5" fill="currentColor" />
                  Explore Boxes
                </Button>
                <Button
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 font-bold px-4 md:px-8 py-2 md:py-3 rounded-lg flex items-center gap-2 text-sm md:text-base"
                  onClick={() => router.push("/lootboxes/reveal")}
                >
                  <Gift className="h-4 w-4 md:h-5 md:w-5" />
                  Open Boxes
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 rounded-full p-2 md:p-3"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? (
                    <VolumeX className="h-5 w-5 md:h-6 md:w-6" />
                  ) : (
                    <Volume2 className="h-5 w-5 md:h-6 md:w-6" />
                  )}
                </Button>
              </motion.div>

              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.8 }}
                className="flex flex-wrap items-center gap-4 md:gap-8 mt-4 md:mt-8 text-white/80"
              >
                <div>
                  <span className="text-xs md:text-sm uppercase tracking-wide text-white/50">
                    Total Boxes
                  </span>
                  <p className="text-lg md:text-2xl font-bold text-[rgb(163,255,18)]">
                    {heroContent.stats.totalBoxes}
                  </p>
                </div>
                <div>
                  <span className="text-xs md:text-sm uppercase tracking-wide text-white/50">
                    Opened
                  </span>
                  <p className="text-lg md:text-2xl font-bold">
                    {heroContent.stats.totalOpened}
                  </p>
                </div>
                <div>
                  <span className="text-xs md:text-sm uppercase tracking-wide text-white/50">
                    Total Value Won
                  </span>
                  <p className="text-lg md:text-2xl font-bold">
                    {heroContent.stats.totalValue}
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Filters */}
        <motion.section
          id="featured-section"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="px-4 md:px-8 py-6 bg-black/95 backdrop-blur-lg sticky top-0 z-10 border-b border-white/10"
        >
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-4 w-4" />
              <Input
                placeholder="Search lootboxes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[rgb(163,255,18)]/40 w-full"
              />
            </div>

            {/* Rarity Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <Button
                variant={selectedRarity === null ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedRarity(null)}
                className={cn(
                  "whitespace-nowrap",
                  selectedRarity === null
                    ? "bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                )}
              >
                All
              </Button>
              {rarityFilters.map((rarity) => {
                const config = rarityConfig[rarity as keyof typeof rarityConfig];
                const Icon = config.icon;
                return (
                  <Button
                    key={rarity}
                    variant={selectedRarity === rarity ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedRarity(rarity)}
                    className={cn(
                      "whitespace-nowrap capitalize flex items-center gap-2",
                      selectedRarity === rarity
                        ? `bg-gradient-to-r ${config.gradient} text-white`
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {rarity}
                  </Button>
                );
              })}
            </div>
          </div>
        </motion.section>

        {/* Lootbox Grid */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="px-4 md:px-8 py-8 md:py-16 bg-black"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
              <Gift className="h-8 w-8 text-[rgb(163,255,18)]" />
              {selectedRarity
                ? `${selectedRarity.charAt(0).toUpperCase() + selectedRarity.slice(1)} Lootboxes`
                : "All Lootboxes"}
            </h2>
            <span className="text-white/60">
              {lootboxes.length} {lootboxes.length === 1 ? "box" : "boxes"}{" "}
              available
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-[rgb(163,255,18)]" />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <Gift className="h-12 w-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/60 mb-4">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-[rgb(163,255,18)] text-black"
              >
                Try Again
              </Button>
            </div>
          ) : lootboxes.length === 0 ? (
            <div className="text-center py-20">
              <Package className="h-16 w-16 text-white/20 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-white mb-2">
                No Lootboxes Found
              </h3>
              <p className="text-white/60 max-w-md mx-auto mb-6">
                {selectedRarity
                  ? `No ${selectedRarity} lootboxes are currently available. Try selecting a different rarity.`
                  : "No lootboxes are currently available. Check back soon!"}
              </p>
              {selectedRarity && (
                <Button
                  onClick={() => setSelectedRarity(null)}
                  className="bg-white/10 text-white hover:bg-white/20"
                >
                  Clear Filter
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {lootboxes.map((lootbox, index) => (
                <LootboxCard
                  key={lootbox.id}
                  lootbox={lootbox}
                  index={index}
                  onClick={() => router.push(`/lootboxes/${lootbox.id}`)}
                />
              ))}
            </div>
          )}
        </motion.section>

        {/* How It Works Section */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="px-4 md:px-8 py-12 md:py-20 bg-gradient-to-b from-black via-purple-950/20 to-black"
        >
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Provably Fair Lootboxes
            </h2>
            <p className="text-white/60 text-lg">
              Powered by Chainlink VRF for verifiable randomness
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: Package,
                title: "1. Purchase Box",
                description:
                  "Browse our collection and purchase a lootbox using ETH. Each box contains exclusive NFT rewards.",
              },
              {
                icon: Sparkles,
                title: "2. VRF Randomness",
                description:
                  "Chainlink VRF generates a provably fair random number on-chain to determine your reward.",
              },
              {
                icon: Gift,
                title: "3. Claim Reward",
                description:
                  "Your NFT is automatically transferred to your wallet. View your collection in My Boxes.",
              },
            ].map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="bg-white/5 border border-white/10 rounded-xl p-6 text-center hover:border-[rgb(163,255,18)]/30 transition-colors"
              >
                <div className="inline-flex p-4 rounded-xl bg-[rgb(163,255,18)]/10 mb-4">
                  <step.icon className="h-8 w-8 text-[rgb(163,255,18)]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-white/60">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>
    </motion.div>
  );
}
