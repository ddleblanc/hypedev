"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import {
  Play,
  Info,
  Plus,
  Star,
  Volume2,
  VolumeX,
  ArrowLeft,
  Shield,
  Sword,
  Crown,
  Gem,
  Sparkles,
  Users,
  Timer,
  Package,
  Loader2,
  AlertCircle,
  Trophy,
  Percent,
  ChevronDown,
  ChevronUp,
  Wallet,
  ShoppingCart,
} from "lucide-react";
import { useActiveAccount } from "thirdweb/react";
import { parseEther } from "viem";
import {
  purchaseLootbox,
  getLootboxBalance,
  getLootboxInfo,
  LOOTBOX_CONTRACT_ADDRESS,
} from "@/lib/lootbox-contracts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";
import { MediaRenderer } from "thirdweb/react";
import { client } from "@/lib/thirdweb";

// Rarity colors matching the system design
const rarityColors = {
  common: { color: "#9ca3af", glow: "rgba(156,163,175,0.4)", bg: "bg-gray-500/20", text: "text-gray-400", border: "border-gray-500/30" },
  rare: { color: "#60a5fa", glow: "rgba(96,165,250,0.5)", bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30" },
  epic: { color: "#a855f7", glow: "rgba(168,85,247,0.6)", bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/30" },
  mythic: { color: "#fbbf24", glow: "rgba(251,191,36,0.7)", bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/30" },
  cosmic: { color: "#22d3ee", glow: "rgba(34,211,238,0.8)", bg: "bg-cyan-500/20", text: "text-cyan-400", border: "border-cyan-500/30" },
} as const;

// Types inferred from tRPC
type DropTableItem = {
  rarity: string;
  probability: number;
  count: number;
  available: number;
  preview: Array<{
    name: string;
    image: string;
    available: boolean;
  }>;
};

type Winner = {
  id: string;
  user: {
    displayName: string;
    avatar: string | null;
    walletAddress: string;
  };
  reward: {
    name: string;
    image: string;
    rarity: string;
    collectionName: string | null;
  } | null;
  wonAt: string | null;
  rarity: string | null;
};

export default function LootboxDetailPage() {
  const router = useRouter();
  const params = useParams();
  const lootboxId = params?.id as string;
  const account = useActiveAccount();

  const [isMuted, setIsMuted] = useState(true);

  // Purchase state
  const [userBalance, setUserBalance] = useState<number>(0);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  // Use window scroll for parallax effect (avoids hydration issues with ref-based scroll)
  const { scrollY } = useScroll();
  const heroScale = useTransform(scrollY, [0, 500], [1, 1.1]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);

  // Fetch lootbox data using tRPC
  const { data: lootbox, isLoading: lootboxLoading, error: lootboxError } = trpc.lootbox.byId.useQuery(
    { id: lootboxId },
    { enabled: !!lootboxId }
  );

  // Fetch drop table using tRPC
  const { data: dropsData } = trpc.lootbox.drops.useQuery(
    { id: lootboxId },
    { enabled: !!lootboxId }
  );

  // Fetch winners using tRPC
  const { data: winnersData } = trpc.lootbox.winners.useQuery(
    { id: lootboxId, limit: 10 },
    { enabled: !!lootboxId }
  );

  // Derived data
  const dropTable = dropsData?.dropTable ?? [];
  const winners: Winner[] = winnersData?.winners ?? [];
  const winnersStats = winnersData?.stats ?? { total: 0, byRarity: {} };
  const loading = lootboxLoading;
  const error = lootboxError?.message ?? null;

  // Check user's lootbox balance when wallet connects
  useEffect(() => {
    async function checkBalance() {
      if (!account?.address || !lootbox?.onChainId || !LOOTBOX_CONTRACT_ADDRESS) {
        setUserBalance(0);
        return;
      }
      try {
        const balance = await getLootboxBalance(account.address, lootbox.onChainId);
        setUserBalance(balance);
      } catch (err) {
        console.error("Error checking lootbox balance:", err);
        setUserBalance(0);
      }
    }
    checkBalance();
  }, [account?.address, lootbox?.onChainId]);

  // Handle lootbox purchase
  const handlePurchase = useCallback(async () => {
    if (!account || !lootbox) return;

    setIsPurchasing(true);
    setPurchaseError(null);

    try {
      const priceWei = parseEther(lootbox.price.toString());
      await purchaseLootbox(account, lootbox.onChainId, 1, priceWei);

      // Update balance after purchase
      const newBalance = await getLootboxBalance(account.address, lootbox.onChainId);
      setUserBalance(newBalance);

      // Navigate to reveal page
      router.push(`/lootboxes/reveal?lootboxId=${lootbox.id}`);
    } catch (err) {
      console.error("Purchase error:", err);
      setPurchaseError(err instanceof Error ? err.message : "Failed to purchase lootbox");
    } finally {
      setIsPurchasing(false);
    }
  }, [account, lootbox, router]);

  // Handle opening (for users who already own a lootbox)
  const handleOpen = useCallback(() => {
    if (!lootbox) return;
    router.push(`/lootboxes/reveal?lootboxId=${lootbox.id}`);
  }, [lootbox, router]);

  const getRarityColor = (rarity: string) => {
    const key = rarity.toLowerCase() as keyof typeof rarityColors;
    return rarityColors[key] || rarityColors.common;
  };

  const getRarityIcon = (rarity: string) => {
    const key = rarity.toLowerCase();
    switch (key) {
      case "cosmic":
        return <Sparkles className="h-4 w-4" />;
      case "mythic":
        return <Crown className="h-4 w-4" />;
      case "epic":
        return <Gem className="h-4 w-4" />;
      case "rare":
        return <Star className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-[rgb(163,255,18)]" />
          <p className="text-white/60">Loading lootbox...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !lootbox) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center max-w-md px-6">
          <div className="p-6 rounded-full bg-red-500/10 mb-6 inline-block">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">
            {error || "Lootbox Not Found"}
          </h1>
          <p className="text-white/60 mb-6">
            The lootbox you're looking for doesn't exist or has been removed.
          </p>
          <Button
            onClick={() => router.push("/lootboxes")}
            className="bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Lootboxes
          </Button>
        </div>
      </div>
    );
  }

  // Check if hero media is a video
  const isHeroVideo = lootbox.image.includes(".webm") || lootbox.image.includes(".mp4");
  const rarityKey = lootbox.rarity.toLowerCase() as keyof typeof rarityColors;
  const colors = getRarityColor(lootbox.rarity);
  const supplyPercent = ((lootbox.totalSupply - lootbox.remainingSupply) / lootbox.totalSupply) * 100;

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
          className="relative h-[70vh] md:h-[85vh] overflow-hidden"
          style={{ scale: heroScale }}
        >
          <div className="absolute inset-0">
            {isHeroVideo ? (
              <video
                className="w-full h-full object-cover"
                autoPlay
                muted={isMuted}
                loop
                playsInline
              >
                <source
                  src={lootbox.image}
                  type={lootbox.image.includes(".webm") ? "video/webm" : "video/mp4"}
                />
              </video>
            ) : (
              <div className="w-full h-full [&_img]:!object-cover [&_video]:!object-cover">
                <MediaRenderer
                  client={client}
                  src={lootbox.image}
                  alt={lootbox.name}
                  className="w-full h-full"
                />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          </div>

          {/* Back Navigation */}
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="absolute top-0 left-0 right-0 z-20 p-4 md:p-8"
          >
            <Button
              variant="ghost"
              onClick={() => router.push("/lootboxes")}
              className="text-white hover:bg-white/10 flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Lootboxes
            </Button>
          </motion.div>

          {/* Hero Content */}
          <motion.div
            style={{ opacity: heroOpacity }}
            className="absolute bottom-0 left-0 right-0 p-4 md:p-8 pb-12 md:pb-20"
          >
            <div className="max-w-3xl">
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="mb-4 md:mb-6"
              >
                <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-4">
                  <Badge
                    className={cn(
                      "font-semibold px-2 md:px-3 py-1 text-xs md:text-sm flex items-center gap-1",
                      colors.bg,
                      colors.text,
                      colors.border,
                      "border"
                    )}
                  >
                    {getRarityIcon(lootbox.rarity)}
                    {lootbox.rarity}
                  </Badge>
                  <span className="text-white/80 text-sm md:text-base">
                    {lootbox.remainingSupply.toLocaleString()} / {lootbox.totalSupply.toLocaleString()} Remaining
                  </span>
                </div>
              </motion.div>

              <motion.h2
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="text-3xl md:text-5xl font-bold text-white mb-3 md:mb-4"
              >
                {lootbox.name}
              </motion.h2>

              <motion.p
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="text-base md:text-xl text-white/90 mb-4 md:mb-6 leading-relaxed"
              >
                {lootbox.description || `Open this ${lootbox.rarity} lootbox to discover amazing NFT rewards.`}
              </motion.p>

              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="flex flex-wrap items-center gap-2 md:gap-4"
              >
                {/* Primary Action Button - Based on wallet/ownership state */}
                {!account ? (
                  <Button
                    className="bg-white/20 text-white hover:bg-white/30 font-bold px-4 md:px-8 py-2 md:py-3 rounded-lg flex items-center gap-2 text-sm md:text-base backdrop-blur-sm"
                    onClick={() => {
                      // Trigger wallet connect modal - handled by Thirdweb provider
                      const connectButton = document.querySelector('[data-connect-wallet]') as HTMLButtonElement;
                      connectButton?.click();
                    }}
                  >
                    <Wallet className="h-4 w-4 md:h-5 md:w-5" />
                    Connect Wallet
                  </Button>
                ) : userBalance > 0 ? (
                  <Button
                    className="bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90 font-bold px-4 md:px-8 py-2 md:py-3 rounded-lg flex items-center gap-2 text-sm md:text-base"
                    onClick={handleOpen}
                  >
                    <Play className="h-4 w-4 md:h-5 md:w-5" fill="currentColor" />
                    Open Lootbox ({userBalance} owned)
                  </Button>
                ) : (
                  <Button
                    className="bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90 font-bold px-4 md:px-8 py-2 md:py-3 rounded-lg flex items-center gap-2 text-sm md:text-base disabled:opacity-50"
                    onClick={handlePurchase}
                    disabled={isPurchasing || lootbox.remainingSupply === 0}
                  >
                    {isPurchasing ? (
                      <>
                        <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" />
                        Purchasing...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4 md:h-5 md:w-5" />
                        Buy for {lootbox.price} {lootbox.priceCurrency}
                      </>
                    )}
                  </Button>
                )}

                {/* Price badge */}
                <Button
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 font-bold px-4 md:px-8 py-2 md:py-3 rounded-lg flex items-center gap-2 text-sm md:text-base cursor-default"
                >
                  <Package className="h-4 w-4 md:h-5 md:w-5" />
                  {lootbox.price} {lootbox.priceCurrency}
                </Button>
                {isHeroVideo && (
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
                )}
              </motion.div>

              {/* Purchase Error Display */}
              {purchaseError && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2"
                >
                  <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-sm">{purchaseError}</p>
                </motion.div>
              )}

              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.8 }}
                className="flex flex-wrap items-center gap-4 md:gap-6 mt-4 md:mt-6 text-white/80"
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">{lootbox.stats.totalOpenings} opened</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <span className="text-sm">{lootbox.stats.totalRewards} rewards</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  <span className="text-sm">{lootbox.stats.availableRewards} available</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Supply Progress Bar */}
        <div className="bg-black/80 border-t border-white/10 px-4 md:px-8 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60 text-sm">Supply Progress</span>
              <span className="text-white font-medium text-sm">
                {supplyPercent.toFixed(1)}% claimed
              </span>
            </div>
            <Progress
              value={supplyPercent}
              className="h-2 bg-white/10"
              style={
                {
                  "--progress-color": colors.color,
                } as React.CSSProperties
              }
            />
          </div>
        </div>

        {/* Drop Table Section */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="px-4 md:px-8 py-8 md:py-16 bg-black"
        >
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-xl bg-[rgb(163,255,18)]/10 border border-[rgb(163,255,18)]/20">
                <Percent className="h-6 w-6 text-[rgb(163,255,18)]" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Drop Rates</h3>
                <p className="text-white/60 text-sm">Chances for each rarity tier</p>
              </div>
            </div>

            {dropTable.length > 0 ? (
              <div className="space-y-4">
                {dropTable.map((item, index) => {
                  const itemColors = getRarityColor(item.rarity);
                  return (
                    <motion.div
                      key={item.rarity}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                    >
                      <Card className={cn("bg-black/40 border", itemColors.border)}>
                        <CardContent className="p-4 md:p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "p-2 rounded-lg",
                                  itemColors.bg
                                )}
                              >
                                {getRarityIcon(item.rarity)}
                              </div>
                              <div>
                                <h4 className={cn("font-bold capitalize", itemColors.text)}>
                                  {item.rarity}
                                </h4>
                                <p className="text-white/50 text-sm">
                                  {item.available} / {item.count} available
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={cn("text-2xl font-bold", itemColors.text)}>
                                {item.probability.toFixed(1)}%
                              </p>
                              <p className="text-white/50 text-xs">
                                1 in {Math.round(100 / item.probability)}
                              </p>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full transition-all duration-500"
                              style={{
                                width: `${item.probability}%`,
                                backgroundColor: itemColors.color,
                              }}
                            />
                          </div>

                          {/* Preview rewards */}
                          {item.preview.length > 0 && (
                            <div className="flex items-center gap-2 mt-4">
                              <span className="text-white/40 text-xs">Preview:</span>
                              {item.preview.map((reward, i) => (
                                <div
                                  key={i}
                                  className={cn(
                                    "h-8 w-8 rounded-lg overflow-hidden border",
                                    reward.available ? "border-white/20" : "border-white/10 opacity-50"
                                  )}
                                >
                                  <MediaRenderer
                                    client={client}
                                    src={reward.image}
                                    alt={reward.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <Card className="bg-black/40 border-white/10">
                <CardContent className="p-8 text-center">
                  <p className="text-white/60">No drop data available</p>
                </CardContent>
              </Card>
            )}
          </div>
        </motion.section>

        {/* Recent Winners Section */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="px-4 md:px-8 py-8 md:py-16 bg-gradient-to-b from-black to-gray-950"
        >
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-[rgb(163,255,18)]/10 border border-[rgb(163,255,18)]/20">
                  <Trophy className="h-6 w-6 text-[rgb(163,255,18)]" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Recent Winners</h3>
                  <p className="text-white/60 text-sm">
                    {winnersStats.total} total winners
                  </p>
                </div>
              </div>

              {/* Rarity stats */}
              <div className="hidden md:flex items-center gap-2">
                {Object.entries(winnersStats.byRarity).map(([rarity, count]) => {
                  const itemColors = getRarityColor(rarity);
                  return (
                    <Badge
                      key={rarity}
                      className={cn(
                        "text-xs capitalize",
                        itemColors.bg,
                        itemColors.text,
                        itemColors.border,
                        "border"
                      )}
                    >
                      {count} {rarity}
                    </Badge>
                  );
                })}
              </div>
            </div>

            {winners.length > 0 ? (
              <div className="space-y-3">
                {winners.map((winner, index) => {
                  const winnerColors = winner.rarity ? getRarityColor(winner.rarity) : rarityColors.common;
                  return (
                    <motion.div
                      key={winner.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.05 }}
                    >
                      <Card className="bg-black/40 border-white/10 hover:border-white/20 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            {/* User avatar */}
                            <Avatar className="h-10 w-10 border-2 border-white/10">
                              {winner.user.avatar ? (
                                <AvatarImage src={winner.user.avatar} />
                              ) : (
                                <AvatarFallback className="bg-gradient-to-br from-[rgb(163,255,18)]/20 to-[rgb(163,255,18)]/5 text-[rgb(163,255,18)] font-bold">
                                  {winner.user.displayName.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              )}
                            </Avatar>

                            {/* User info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium truncate">
                                {winner.user.displayName}
                              </p>
                              <p className="text-white/50 text-sm">
                                {winner.wonAt
                                  ? new Date(winner.wonAt).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : "Recently"}
                              </p>
                            </div>

                            {/* Reward */}
                            {winner.reward && (
                              <div className="flex items-center gap-3">
                                <div
                                  className={cn(
                                    "h-12 w-12 rounded-lg overflow-hidden border-2",
                                    winnerColors.border
                                  )}
                                >
                                  <MediaRenderer
                                    client={client}
                                    src={winner.reward.image}
                                    alt={winner.reward.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="text-right">
                                  <p className="text-white font-medium text-sm truncate max-w-[120px]">
                                    {winner.reward.name}
                                  </p>
                                  <Badge
                                    className={cn(
                                      "text-xs capitalize",
                                      winnerColors.bg,
                                      winnerColors.text
                                    )}
                                  >
                                    {winner.reward.rarity}
                                  </Badge>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <Card className="bg-black/40 border-white/10">
                <CardContent className="p-8 text-center">
                  <Trophy className="h-12 w-12 text-white/20 mx-auto mb-4" />
                  <p className="text-white/60">No winners yet. Be the first!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </motion.section>

        {/* About Section */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="px-4 md:px-8 py-8 md:py-16 bg-gray-950"
        >
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-6">About This Lootbox</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="bg-black/40 border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg text-white">What's Inside</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/70 leading-relaxed">
                    Each {lootbox.name} contains carefully curated NFT rewards matching the{" "}
                    {lootbox.rarity.toLowerCase()} tier quality. You're guaranteed to receive
                    a valuable item that enhances your gaming experience.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-black/40 border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Collection Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-white/60">Total Supply</span>
                      <span className="text-white font-medium">
                        {lootbox.totalSupply.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Remaining</span>
                      <span className="text-white font-medium">
                        {lootbox.remainingSupply.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Opened</span>
                      <span className="text-white font-medium">
                        {(lootbox.totalSupply - lootbox.remainingSupply).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Creator</span>
                      <span className="text-white font-medium font-mono text-sm">
                        {lootbox.creator.username ||
                          `${lootbox.creator.walletAddress.slice(0, 6)}...${lootbox.creator.walletAddress.slice(-4)}`}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.section>
      </div>
    </motion.div>
  );
}
