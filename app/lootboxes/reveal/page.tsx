"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Gift,
  X,
  Loader2,
  Wallet,
  AlertCircle,
  ShoppingBag,
  Package,
  Sparkles,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { MediaRenderer } from "thirdweb/react";
import { GameCommandCard } from "@/components/ui/game-command-card";
import { useActiveAccount } from "thirdweb/react";
import { ConnectButton } from "thirdweb/react";
import { client } from "@/lib/thirdweb";
import { useLootboxOpen } from "@/hooks/use-lootbox-open";
import {
  useLootboxSounds,
  triggerHaptic,
  VIDEO_SOUND_TRIGGERS,
} from "@/hooks/use-lootbox-sounds";
import { trpc } from "@/lib/trpc/client";

// Featured lootboxes for right panel / promotional section
const FEATURED_LOOTBOXES = [
  {
    id: "1",
    name: "Warrior's Arsenal",
    description: "COMBAT COLLECTION",
    image:
      "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/1ad84358-5802-4eae-b74b-f6c880d38ea5/transcode=true,original=true,quality=90/vid_00005.webm",
    price: "0.5",
    rarity: "epic",
    accentColor: "purple",
  },
  {
    id: "2",
    name: "Mystic Treasures",
    description: "MAGIC COLLECTION",
    image:
      "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/a770baa3-875b-4e1d-9f8f-3a0f533e3f96/transcode=true,original=true,quality=90/Blood%20Moon%20Oni.webm",
    price: "1.2",
    rarity: "mythic",
    accentColor: "amber",
  },
  {
    id: "3",
    name: "Cosmic Cache",
    description: "UNIVERSE COLLECTION",
    image:
      "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/7f64191f-c494-492e-ab3d-21fb88686523/transcode=true,original=true,quality=90/6JRGQ9C6B2HFZJ94J50N42NPJ0.webm",
    price: "2.0",
    rarity: "cosmic",
    accentColor: "cyan",
  },
];

// Rarity color configurations
const RARITY_COLORS = {
  common: { text: "text-gray-400", border: "border-gray-500", hex: "#9ca3af" },
  rare: { text: "text-blue-400", border: "border-blue-500", hex: "#60a5fa" },
  epic: {
    text: "text-purple-400",
    border: "border-purple-500",
    hex: "#a855f7",
  },
  mythic: {
    text: "text-yellow-400",
    border: "border-yellow-500",
    hex: "#fbbf24",
  },
  cosmic: { text: "text-cyan-400", border: "border-cyan-500", hex: "#22d3ee" },
} as const;

// Owned lootbox type from API
interface OwnedLootbox {
  id: string;
  onChainId: number;
  name: string;
  description?: string;
  image: string;
  price: number;
  priceCurrency: string;
  rarity: string;
  remainingSupply: number;
  balance: number;
  contractAddress?: string;
}

export default function LootboxRevealPage() {
  const router = useRouter();
  const account = useActiveAccount();

  // Lootbox opening hook
  const { state: openingState, openLootboxWithVRF, reset } = useLootboxOpen();

  // Sound effects hook
  const sounds = useLootboxSounds({ enabled: true, masterVolume: 0.7 });

  // UI State
  const [selectedLootbox, setSelectedLootbox] = useState<OwnedLootbox | null>(
    null
  );
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [hasVideoEnded, setHasVideoEnded] = useState(false);
  const [showRevealImage, setShowRevealImage] = useState(false);
  const [showClaimButton, setShowClaimButton] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [showRarityOverlay, setShowRarityOverlay] = useState(false);

  // Panel state - start with null to indicate SSR, then detect on mount
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [mobilePanel, setMobilePanel] = useState<
    "none" | "inventory" | "featured"
  >("none");

  // Fetch inventory using tRPC
  const {
    data: inventoryData,
    isLoading: isLoadingInventory,
    error: inventoryQueryError,
    refetch: refetchInventory
  } = trpc.lootbox.inventory.useQuery(
    { address: account?.address ?? "" },
    { enabled: !!account?.address }
  );

  // Derived data - transform tRPC response to match OwnedLootbox type
  const ownedLootboxes: OwnedLootbox[] = useMemo(() => {
    if (!inventoryData?.inventory) return [];
    return inventoryData.inventory
      .filter((lb) => lb.balance > 0)
      .map((lb) => ({
        ...lb,
        description: lb.description ?? undefined, // Convert null to undefined
      }));
  }, [inventoryData?.inventory]);

  const inventoryError = inventoryQueryError?.message ?? null;

  // Sound triggers tracking
  const triggeredSoundsRef = useRef<Set<number>>(new Set());

  // Video ref
  const videoRef = useRef<HTMLVideoElement>(null);

  // Detect mobile on mount and resize - runs only client-side
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    // Set initial value after mount (client-side only)
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Preload sounds on mount
  useEffect(() => {
    sounds.preload();
  }, [sounds]);

  // Control video playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isVideoPlaying && !hasVideoEnded) {
      video.currentTime = 0;
      video.play();
      triggeredSoundsRef.current.clear();
    } else if (!isVideoPlaying) {
      video.pause();
      video.currentTime = 0;
      setHasVideoEnded(false);
      triggeredSoundsRef.current.clear();
    }
  }, [isVideoPlaying, hasVideoEnded]);

  // Check if panels should be hidden (during opening or claiming)
  const shouldHidePanels = useMemo(() => {
    return isVideoPlaying && !hasVideoEnded;
  }, [isVideoPlaying, hasVideoEnded]);

  // Handle lootbox selection and VRF opening
  const handleLootboxSelect = useCallback(
    async (lootbox: OwnedLootbox) => {
      if (!account) {
        console.error("No wallet connected");
        return;
      }

      setSelectedLootbox(lootbox);
      setMobilePanel("none");
      setShowRevealImage(false);
      setShowClaimButton(false);
      setIsClaiming(false);
      setHasVideoEnded(false);
      setShowRarityOverlay(false);
      setIsVideoPlaying(true);

      reset();
      sounds.play("purchase-confirm");

      try {
        const reward = await openLootboxWithVRF(
          account,
          parseInt(lootbox.id),
          lootbox.onChainId
        );

        if (reward) {
          console.log("VRF completed, reward:", reward);
        }
      } catch (error) {
        console.error("Error opening lootbox:", error);
      }
    },
    [account, openLootboxWithVRF, reset, sounds]
  );

  // Handle claim button click
  const handleClaim = useCallback(() => {
    setIsClaiming(true);
    setShowClaimButton(false);

    sounds.play("celebration");

    // Use best rarity from all rewards for haptic feedback
    const bestRarity = openingState.bestRarityTier || openingState.reward?.rarity;
    if (bestRarity) {
      triggerHaptic(bestRarity);
    }

    setTimeout(() => {
      setShowRevealImage(false);
      setSelectedLootbox(null);
      setIsClaiming(false);
      setShowRarityOverlay(false);
      setIsVideoPlaying(false);
      reset();

      // Refetch inventory using tRPC
      if (account?.address) {
        refetchInventory();
      }
    }, 1000);
  }, [account?.address, openingState.bestRarityTier, openingState.reward?.rarity, reset, sounds, refetchInventory]);

  // Video time update handler
  const handleVideoTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || !isVideoPlaying) return;

    const progress = video.currentTime / video.duration;

    for (const [threshold, sound] of Object.entries(VIDEO_SOUND_TRIGGERS)) {
      const thresholdNum = parseFloat(threshold);
      if (
        progress >= thresholdNum &&
        !triggeredSoundsRef.current.has(thresholdNum)
      ) {
        triggeredSoundsRef.current.add(thresholdNum);
        sounds.play(sound);
      }
    }

    if (progress >= 0.45 && !showRarityOverlay) {
      setShowRarityOverlay(true);
    }

    if (progress >= 0.75 && !showRevealImage) {
      // Check for rewards (multi-reward) or reward (legacy)
      const hasRewards = openingState.rewards.length > 0 || openingState.reward;
      if (openingState.status === "revealed" && hasRewards) {
        setShowRevealImage(true);
        setShowRarityOverlay(false);
        // Use best rarity for sound/haptic
        const bestRarity = openingState.bestRarityTier || openingState.reward?.rarity || "common";
        sounds.playRarityReveal(bestRarity);
        triggerHaptic(bestRarity);
      } else if (openingState.status === "waiting_vrf") {
        video.pause();
      }
    }
  }, [
    isVideoPlaying,
    showRarityOverlay,
    showRevealImage,
    openingState,
    sounds,
  ]);

  // Resume video when VRF completes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Check for rewards (multi-reward) or reward (legacy)
    const hasRewards = openingState.rewards.length > 0 || openingState.reward;
    if (
      openingState.status === "revealed" &&
      hasRewards &&
      video.paused &&
      isVideoPlaying &&
      !showRevealImage
    ) {
      video.play();
    }
  }, [
    openingState.status,
    openingState.rewards,
    openingState.reward,
    isVideoPlaying,
    showRevealImage,
  ]);

  // Get rarity color configuration
  const getRarityColor = (rarity: string) => {
    const normalized = rarity.toLowerCase() as keyof typeof RARITY_COLORS;
    return (
      RARITY_COLORS[normalized] || {
        text: "text-white",
        border: "border-white",
        hex: "#ffffff",
      }
    );
  };

  // Get rarity overlay color with opacity
  const getRarityOverlayColor = (rarity: string) => {
    const colors = getRarityColor(rarity);
    const hex = colors.hex.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, 0.225)`;
  };

  // Multi-reward support: use rewards array if available, fallback to single reward
  const displayRewards = openingState.rewards.length > 0
    ? openingState.rewards
    : openingState.reward
      ? [openingState.reward]
      : [];
  const displayRarity =
    openingState.bestRarityTier || openingState.reward?.rarity || selectedLootbox?.rarity || "common";
  const displayItem = displayRewards[0] || null;
  const totalOwnedCount = ownedLootboxes.reduce(
    (sum, lb) => sum + lb.balance,
    0
  );
  const [currentRewardIndex, setCurrentRewardIndex] = useState(0);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Fullscreen Video Background - Fades in after black background */}
      <AnimatePresence>
        {isVideoPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
            className="fixed inset-0 z-[-10]"
          >
            <video
              ref={videoRef}
              src="/assets/vid/reveal.mp4"
              playsInline
              muted
              className="w-full h-full object-cover grayscale"
              onEnded={() => {
                setHasVideoEnded(true);
                if (videoRef.current) {
                  videoRef.current.pause();
                }
              }}
              onLoadedData={() => {
                // Delay video playback to sync with the fade-in animation
                if (videoRef.current && isVideoPlaying) {
                  setTimeout(() => {
                    if (videoRef.current && isVideoPlaying) {
                      videoRef.current.currentTime = 0;
                      videoRef.current.play();
                      triggeredSoundsRef.current.clear();
                    }
                  }, 300); // Match the 0.3s delay from the animation
                }
              }}
              onTimeUpdate={handleVideoTimeUpdate}
            />
            <div className="absolute inset-0 bg-black/20" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* VRF Status Overlay */}
      <AnimatePresence>
        {openingState.status === "waiting_vrf" && isVideoPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-black/80 backdrop-blur-sm rounded-xl px-6 py-4 border border-white/10"
          >
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-[rgb(163,255,18)] animate-spin" />
              <div>
                <p className="text-white font-medium">
                  {openingState.statusMessage}
                </p>
                <p className="text-sm text-white/60">
                  Progress: {openingState.progress}%
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Overlay */}
      <AnimatePresence>
        {openingState.status === "error" && openingState.error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Error Card */}
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              className="relative max-w-md w-full bg-gradient-to-b from-zinc-900 to-black rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
            >
              {/* Header accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />

              <div className="p-6 pt-8">
                {/* Icon */}
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-amber-400" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-white text-center mb-2">
                  {openingState.error.title}
                </h3>

                {/* Message */}
                <p className="text-white/70 text-center text-sm leading-relaxed">
                  {openingState.error.message}
                </p>

                {/* Suggestion */}
                {openingState.error.suggestion && (
                  <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-white/60 text-xs text-center">
                      {openingState.error.suggestion}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-6 flex flex-col gap-2">
                  <Button
                    onClick={() => {
                      reset();
                      setIsVideoPlaying(false);
                      setSelectedLootbox(null);
                    }}
                    className="w-full bg-[rgb(163,255,18)] hover:bg-[rgb(163,255,18)]/90 text-black font-semibold"
                  >
                    Try Again
                  </Button>
                  <Button
                    onClick={() => router.push("/lootboxes")}
                    variant="ghost"
                    className="w-full text-white/60 hover:text-white hover:bg-white/5"
                  >
                    Back to Lootboxes
                  </Button>
                </div>

                {/* Technical details (collapsed) */}
                {openingState.error.technical && (
                  <details className="mt-4">
                    <summary className="text-xs text-white/30 cursor-pointer hover:text-white/50 text-center">
                      Technical details
                    </summary>
                    <p className="mt-2 text-xs text-white/30 font-mono bg-black/30 rounded p-2 break-all">
                      {openingState.error.technical}
                    </p>
                  </details>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rarity Color Overlay */}
      <AnimatePresence>
        {showRarityOverlay && selectedLootbox && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0, 0.5, 2, 8],
              opacity: [0, 0.225, 0.6, 0.75],
            }}
            exit={{ scale: 12, opacity: 0 }}
            transition={{
              duration: 2,
              times: [0, 0.6, 0.85, 1],
              ease: [0.22, 1, 0.36, 1],
            }}
            className="fixed inset-0 z-5 flex items-center justify-center pointer-events-none"
          >
            <motion.div
              className="w-32 h-32 rounded-full blur-3xl mix-blend-multiply"
              animate={{
                filter: [
                  "blur(24px) brightness(1)",
                  "blur(20px) brightness(1.2)",
                  "blur(16px) brightness(1.5)",
                  "blur(12px) brightness(2)",
                ],
              }}
              transition={{
                duration: 2,
                times: [0, 0.6, 0.85, 1],
                ease: [0.22, 1, 0.36, 1],
              }}
              style={{
                backgroundColor: getRarityOverlayColor(displayRarity),
                boxShadow: `0 0 200px 100px ${getRarityOverlayColor(displayRarity)}`,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Black Background Overlay - Fades in first when opening starts */}
      <AnimatePresence>
        {isVideoPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed inset-0 bg-black z-[-20]"
          />
        )}
      </AnimatePresence>

      {/* ==================== DESKTOP SIDEBARS ==================== */}

      {/* Left Sidebar - My Lootboxes (Desktop Only) */}
      <AnimatePresence>
        {isMobile === false && !shouldHidePanels && (
          <motion.div
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 30,
              duration: 0.4,
            }}
            className="fixed left-0 top-0 bottom-0 w-80 backdrop-blur-xl border-r border-white/10 z-40 overflow-hidden flex flex-col"
            style={{ backgroundColor: "rgb(3, 3, 3)" }}
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                  <Package className="h-5 w-5 text-[rgb(163,255,18)]" />
                  My Lootboxes
                </h2>
                <p className="text-sm text-white/60">
                  {totalOwnedCount} boxes available
                </p>
              </motion.div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {!account ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Wallet className="w-12 h-12 text-white/30" />
                  <p className="text-white/60 text-center">
                    Connect wallet to view your lootboxes
                  </p>
                  <ConnectButton client={client} />
                </div>
              ) : isLoadingInventory ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="w-8 h-8 text-[rgb(163,255,18)] animate-spin" />
                  <p className="text-white/60">Loading inventory...</p>
                </div>
              ) : inventoryError ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                  <p className="text-red-400 text-center">{inventoryError}</p>
                </div>
              ) : ownedLootboxes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Gift className="w-12 h-12 text-white/30" />
                  <p className="text-white/60 text-center">No lootboxes yet</p>
                  <Button
                    onClick={() => router.push("/lootboxes")}
                    className="bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90"
                  >
                    Browse Lootboxes
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {ownedLootboxes.map((lootbox, index) => {
                    const rarityColor = getRarityColor(lootbox.rarity);
                    return (
                      <motion.div
                        key={lootbox.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + index * 0.05 }}
                        onClick={() => handleLootboxSelect(lootbox)}
                        className={cn(
                          "relative cursor-pointer rounded-lg overflow-hidden border transition-all hover:scale-[1.02]",
                          selectedLootbox?.id === lootbox.id
                            ? "ring-2 ring-[rgb(163,255,18)] border-[rgb(163,255,18)]"
                            : "border-white/10 hover:border-white/30"
                        )}
                      >
                        <div className="relative h-24 [&_img]:!object-cover [&_video]:!object-cover">
                          <MediaRenderer
                            client={client}
                            src={lootbox.image}
                            alt={lootbox.name}
                            className="w-full h-full"
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                          {lootbox.balance > 0 && (
                            <Badge className="absolute top-2 right-2 bg-[rgb(163,255,18)] text-black text-xs font-bold">
                              x{lootbox.balance}
                            </Badge>
                          )}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <h4 className="text-white font-bold text-sm mb-1">
                            {lootbox.name}
                          </h4>
                          <div className="flex items-center justify-between">
                            <Badge
                              className={cn(
                                "text-xs",
                                rarityColor.text,
                                rarityColor.border
                              )}
                            >
                              {lootbox.rarity}
                            </Badge>
                            <Button
                              size="sm"
                              className="h-7 px-3 bg-white/10 hover:bg-white/20 text-white text-xs"
                            >
                              Open
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right Sidebar - Featured Lootboxes (Desktop Only) */}
      <AnimatePresence>
        {isMobile === false && !shouldHidePanels && (
          <motion.div
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 30,
              duration: 0.4,
            }}
            className="fixed right-0 top-0 bottom-0 w-80 backdrop-blur-xl border-l border-white/10 z-40 overflow-hidden flex flex-col"
            style={{ backgroundColor: "rgb(3, 3, 3)" }}
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[rgb(163,255,18)]" />
                  Featured
                </h2>
                <p className="text-sm text-white/60">Hot lootboxes to buy</p>
              </motion.div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {FEATURED_LOOTBOXES.map((lootbox, index) => (
                <motion.div
                  key={lootbox.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + index * 0.1 }}
                >
                  <GameCommandCard
                    option={{
                      id: lootbox.id,
                      title: lootbox.name,
                      description: `${lootbox.description} • ${lootbox.price} ETH`,
                      image: lootbox.image,
                      category: lootbox.rarity,
                      accentColor: lootbox.accentColor as
                        | "purple"
                        | "amber"
                        | "cyan"
                        | "red"
                        | "green"
                        | "blue"
                        | "orange"
                        | "pink",
                    }}
                    corner="topRight"
                    onClick={() => router.push(`/lootboxes/${lootbox.id}`)}
                  />
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="pt-4"
              >
                <Button
                  onClick={() => router.push("/lootboxes")}
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10"
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Browse All Lootboxes
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== MOBILE BOTTOM PANELS ==================== */}

      {/* Mobile Bottom Tabs */}
      <AnimatePresence>
        {isMobile === true && !shouldHidePanels && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-0 left-0 right-0 z-40"
          >
            {/* Tab Buttons */}
            <div className="flex bg-black/90 backdrop-blur-xl border-t border-white/10">
              <button
                onClick={() =>
                  setMobilePanel(
                    mobilePanel === "inventory" ? "none" : "inventory"
                  )
                }
                className={cn(
                  "flex-1 py-4 px-4 flex items-center justify-center gap-2 transition-colors",
                  mobilePanel === "inventory"
                    ? "bg-[rgb(163,255,18)]/10 text-[rgb(163,255,18)]"
                    : "text-white/70 hover:text-white"
                )}
              >
                <Package className="w-5 h-5" />
                <span className="text-sm font-medium">My Boxes</span>
                {totalOwnedCount > 0 && (
                  <Badge className="bg-[rgb(163,255,18)] text-black text-xs px-2">
                    {totalOwnedCount}
                  </Badge>
                )}
                {mobilePanel === "inventory" ? (
                  <ChevronDown className="w-4 h-4 ml-1" />
                ) : (
                  <ChevronUp className="w-4 h-4 ml-1" />
                )}
              </button>

              <div className="w-px bg-white/10" />

              <button
                onClick={() =>
                  setMobilePanel(
                    mobilePanel === "featured" ? "none" : "featured"
                  )
                }
                className={cn(
                  "flex-1 py-4 px-4 flex items-center justify-center gap-2 transition-colors",
                  mobilePanel === "featured"
                    ? "bg-[rgb(163,255,18)]/10 text-[rgb(163,255,18)]"
                    : "text-white/70 hover:text-white"
                )}
              >
                <Sparkles className="w-5 h-5" />
                <span className="text-sm font-medium">Featured</span>
                {mobilePanel === "featured" ? (
                  <ChevronDown className="w-4 h-4 ml-1" />
                ) : (
                  <ChevronUp className="w-4 h-4 ml-1" />
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Inventory Panel */}
      <AnimatePresence>
        {isMobile === true && mobilePanel === "inventory" && !shouldHidePanels && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-[60px] left-0 right-0 z-30 max-h-[60vh] bg-black/95 backdrop-blur-xl border-t border-white/10 rounded-t-2xl overflow-hidden"
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-[rgb(163,255,18)]" />
                My Lootboxes
              </h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setMobilePanel("none")}
                className="text-white/60"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="overflow-y-auto max-h-[calc(60vh-60px)] p-4">
              {!account ? (
                <div className="flex flex-col items-center py-8 space-y-3">
                  <Wallet className="w-10 h-10 text-white/30" />
                  <p className="text-white/60 text-sm">
                    Connect wallet to continue
                  </p>
                  <ConnectButton client={client} />
                </div>
              ) : isLoadingInventory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 text-[rgb(163,255,18)] animate-spin" />
                </div>
              ) : ownedLootboxes.length === 0 ? (
                <div className="flex flex-col items-center py-8 space-y-3">
                  <Gift className="w-10 h-10 text-white/30" />
                  <p className="text-white/60 text-sm">No lootboxes yet</p>
                  <Button
                    onClick={() => router.push("/lootboxes")}
                    size="sm"
                    className="bg-[rgb(163,255,18)] text-black"
                  >
                    Browse
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {ownedLootboxes.map((lootbox) => {
                    const rarityColor = getRarityColor(lootbox.rarity);
                    return (
                      <div
                        key={lootbox.id}
                        onClick={() => handleLootboxSelect(lootbox)}
                        className="relative rounded-lg overflow-hidden border border-white/10 cursor-pointer active:scale-95 transition-transform"
                      >
                        <div className="relative h-20 [&_img]:!object-cover [&_video]:!object-cover">
                          <MediaRenderer
                            client={client}
                            src={lootbox.image}
                            alt={lootbox.name}
                            className="w-full h-full"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                          {lootbox.balance > 0 && (
                            <Badge className="absolute top-1 right-1 bg-[rgb(163,255,18)] text-black text-[10px] px-1.5">
                              x{lootbox.balance}
                            </Badge>
                          )}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-2">
                          <h4 className="text-white text-xs font-bold truncate">
                            {lootbox.name}
                          </h4>
                          <Badge
                            className={cn(
                              "text-[10px] mt-1",
                              rarityColor.text,
                              rarityColor.border
                            )}
                          >
                            {lootbox.rarity}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Featured Panel */}
      <AnimatePresence>
        {isMobile === true && mobilePanel === "featured" && !shouldHidePanels && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-[60px] left-0 right-0 z-30 max-h-[60vh] bg-black/95 backdrop-blur-xl border-t border-white/10 rounded-t-2xl overflow-hidden"
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[rgb(163,255,18)]" />
                Featured Lootboxes
              </h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setMobilePanel("none")}
                className="text-white/60"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="overflow-y-auto max-h-[calc(60vh-60px)] p-4 space-y-3">
              {FEATURED_LOOTBOXES.map((lootbox) => (
                <div
                  key={lootbox.id}
                  onClick={() => router.push(`/lootboxes/${lootbox.id}`)}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer active:scale-[0.98] transition-transform"
                >
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={lootbox.image}
                      alt={lootbox.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-bold text-sm truncate">
                      {lootbox.name}
                    </h4>
                    <p className="text-white/60 text-xs">{lootbox.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        className={cn(
                          "text-[10px]",
                          getRarityColor(lootbox.rarity).text,
                          getRarityColor(lootbox.rarity).border
                        )}
                      >
                        {lootbox.rarity}
                      </Badge>
                      <span className="text-[rgb(163,255,18)] text-xs font-bold">
                        {lootbox.price} ETH
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              <Button
                onClick={() => router.push("/lootboxes")}
                variant="outline"
                className="w-full border-white/20 text-white mt-2"
              >
                Browse All
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== REVEAL CONTENT ==================== */}

      {/* Revealed Item Display - Supports multiple rewards */}
      <AnimatePresence>
        {showRevealImage && displayRewards.length > 0 && (
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -10 }}
            animate={
              isClaiming
                ? {
                    y: [-20, -50, 300],
                    opacity: [1, 1, 0],
                    scale: [1.1, 1.05, 0.8],
                    rotate: [0, 5, 0],
                  }
                : {
                    scale: 1,
                    opacity: 1,
                    rotate: 0,
                  }
            }
            exit={{ scale: 0, opacity: 0 }}
            transition={
              isClaiming
                ? {
                    duration: 1,
                    times: [0, 0.3, 1],
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }
                : {
                    duration: 0.6,
                    ease: "easeOut",
                  }
            }
            onAnimationComplete={() => {
              if (!isClaiming && showRevealImage) {
                setTimeout(() => setShowClaimButton(true), 200);
              }
            }}
            className="fixed inset-0 z-30 flex items-center justify-center pointer-events-none"
          >
            {/* Multi-reward count badge */}
            {displayRewards.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-8 left-1/2 -translate-x-1/2 z-40"
              >
                <Badge className="bg-[rgb(163,255,18)] text-black text-lg px-4 py-2 font-black">
                  {displayRewards.length} REWARDS!
                </Badge>
              </motion.div>
            )}

            {/* Single reward display */}
            {displayRewards.length === 1 && displayItem && (
              <div className="relative">
                <div
                  className="absolute inset-0 rounded-3xl blur-xl scale-150"
                  style={{
                    background: `radial-gradient(circle, ${getRarityColor(displayItem.rarity).hex}40 0%, transparent 70%)`,
                  }}
                />

                <div
                  className={cn(
                    "relative w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-4 shadow-2xl [&_img]:!object-cover [&_video]:!object-cover"
                  )}
                  style={{
                    borderColor: getRarityColor(displayItem.rarity).hex,
                    boxShadow: `0 25px 50px -12px ${getRarityColor(displayItem.rarity).hex}50`,
                  }}
                >
                  <MediaRenderer
                    client={client}
                    src={displayItem.image}
                    alt={displayItem.name}
                    className="w-full h-full"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                    <div className="space-y-2">
                      <Badge
                        className={cn(
                          "text-sm px-3 py-1",
                          getRarityColor(displayItem.rarity).text,
                          getRarityColor(displayItem.rarity).border
                        )}
                      >
                        {displayItem.rarity}
                      </Badge>
                      <h3 className="text-white text-xl md:text-2xl font-black">
                        {displayItem.name}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Sparkles */}
                <div className="absolute -top-4 -left-4">
                  <motion.div
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.7, 1, 0.7],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="w-6 h-6 md:w-8 md:h-8 rounded-full blur-sm"
                    style={{
                      backgroundColor: getRarityColor(displayItem.rarity).hex,
                    }}
                  />
                </div>
                <div className="absolute -bottom-6 -right-6">
                  <motion.div
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.5,
                    }}
                    className="w-5 h-5 md:w-6 md:h-6 bg-white rounded-full blur-sm"
                  />
                </div>
              </div>
            )}

            {/* Multi-reward grid display */}
            {displayRewards.length > 1 && (
              <div className="relative flex flex-wrap justify-center items-center gap-4 max-w-3xl mx-auto px-4">
                {displayRewards.map((reward, index) => (
                  <motion.div
                    key={reward.id}
                    initial={{ scale: 0, opacity: 0, y: 50 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{
                      delay: index * 0.15,
                      duration: 0.5,
                      ease: "easeOut",
                    }}
                    className="relative"
                  >
                    <div
                      className="absolute inset-0 rounded-2xl blur-lg scale-125"
                      style={{
                        background: `radial-gradient(circle, ${getRarityColor(reward.rarity).hex}30 0%, transparent 70%)`,
                      }}
                    />

                    <div
                      className={cn(
                        "relative rounded-2xl overflow-hidden border-3 shadow-xl [&_img]:!object-cover [&_video]:!object-cover",
                        displayRewards.length <= 3
                          ? "w-40 h-40 md:w-52 md:h-52"
                          : displayRewards.length <= 6
                            ? "w-32 h-32 md:w-40 md:h-40"
                            : "w-28 h-28 md:w-32 md:h-32"
                      )}
                      style={{
                        borderColor: getRarityColor(reward.rarity).hex,
                        boxShadow: `0 15px 30px -6px ${getRarityColor(reward.rarity).hex}40`,
                      }}
                    >
                      <MediaRenderer
                        client={client}
                        src={reward.image}
                        alt={reward.name}
                        className="w-full h-full"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                      <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3">
                        <Badge
                          className={cn(
                            "text-[10px] md:text-xs px-2 py-0.5 mb-1",
                            getRarityColor(reward.rarity).text,
                            getRarityColor(reward.rarity).border
                          )}
                        >
                          {reward.rarity}
                        </Badge>
                        <h3 className="text-white text-xs md:text-sm font-bold truncate">
                          {reward.name}
                        </h3>
                      </div>

                      {/* Index indicator */}
                      <div className="absolute top-2 left-2 w-5 h-5 md:w-6 md:h-6 rounded-full bg-black/60 flex items-center justify-center">
                        <span className="text-white text-[10px] md:text-xs font-bold">
                          {index + 1}
                        </span>
                      </div>
                    </div>

                    {/* Sparkle effect */}
                    <motion.div
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: index * 0.2,
                      }}
                      className="absolute -top-2 -right-2 w-4 h-4 rounded-full blur-sm"
                      style={{
                        backgroundColor: getRarityColor(reward.rarity).hex,
                      }}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Claim Button */}
      <AnimatePresence>
        {showClaimButton && !isClaiming && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
          >
            <div className={cn(
              "pointer-events-auto",
              displayRewards.length > 1 ? "mt-80 md:mt-96" : "mt-64 md:mt-80"
            )}>
              <Button
                onClick={handleClaim}
                className="bg-[rgb(163,255,18)] hover:bg-[rgb(163,255,18)]/90 text-black font-black text-lg px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                {displayRewards.length > 1 ? `CLAIM ALL ${displayRewards.length} REWARDS` : "CLAIM"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back Button (visible when not opening and after hydration) */}
      <AnimatePresence>
        {isMobile !== null && !shouldHidePanels && (
          <motion.button
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20 }}
            onClick={() => router.push("/home")}
            className="fixed top-6 left-1/2 -translate-x-1/2 md:left-[50%] z-50 px-4 py-2 bg-black/40 backdrop-blur-sm rounded-full border border-white/10 text-white/70 hover:text-white hover:border-white/30 transition-all text-sm font-medium flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Home
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
