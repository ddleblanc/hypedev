"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Package,
  Gift,
  Play,
  Loader2,
  Check,
  Clock,
  ChevronRight,
  ExternalLink,
  AlertCircle,
  Shield,
  Star,
  Gem,
  Crown,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { z } from "zod";
import Image from "next/image";
import { cva } from "class-variance-authority";

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

// Zod schemas for type safety
const inventoryLootboxSchema = z.object({
  id: z.string(),
  onChainId: z.number().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  image: z.string(),
  price: z.number(),
  priceCurrency: z.string(),
  rarity: z.string(),
  remainingSupply: z.number(),
  contractAddress: z.string(),
  balance: z.number(),
});

const openingRewardSchema = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string(),
  rarity: z.string(),
  nftContractAddress: z.string(),
  nftTokenId: z.string(),
});

const openingLootboxSchema = z.object({
  id: z.string(),
  onChainId: z.number().nullable(),
  name: z.string(),
  image: z.string(),
  rarity: z.string(),
});

const openingSchema = z.object({
  id: z.string(),
  lootbox: openingLootboxSchema,
  reward: openingRewardSchema.nullable(),
  fulfilled: z.boolean(),
  openedAt: z.string(),
  fulfilledAt: z.string().nullable(),
});

const createdLootboxSchema = z.object({
  id: z.string(),
  onChainId: z.number().nullable(),
  name: z.string(),
  image: z.string(),
  price: z.number(),
  rarity: z.string(),
  totalSupply: z.number(),
  remainingSupply: z.number(),
  isActive: z.boolean(),
  createdAt: z.string(),
  soldCount: z.number(),
  openingsCount: z.number(),
});

const inventoryResponseSchema = z.object({
  success: z.boolean(),
  inventory: z.array(inventoryLootboxSchema),
  openings: z.array(openingSchema),
  createdLootboxes: z.array(createdLootboxSchema).optional(),
});

type InventoryLootbox = z.infer<typeof inventoryLootboxSchema>;
type Opening = z.infer<typeof openingSchema>;
type CreatedLootbox = z.infer<typeof createdLootboxSchema>;

// Card variants using CVA
const lootboxCardVariants = cva(
  "relative group cursor-pointer rounded-xl overflow-hidden transition-all duration-500 border backdrop-blur-sm",
  {
    variants: {
      rarity: {
        common:
          "border-gray-500/30 hover:border-gray-400/60 hover:shadow-xl hover:shadow-gray-500/20",
        rare: "border-blue-500/30 hover:border-blue-400/60 hover:shadow-xl hover:shadow-blue-500/20",
        epic: "border-purple-500/30 hover:border-purple-400/60 hover:shadow-xl hover:shadow-purple-500/20",
        mythic:
          "border-yellow-500/30 hover:border-yellow-400/60 hover:shadow-xl hover:shadow-yellow-500/20",
        cosmic:
          "border-cyan-500/30 hover:border-cyan-400/60 hover:shadow-xl hover:shadow-cyan-500/20",
      },
    },
    defaultVariants: {
      rarity: "common",
    },
  }
);

function getRarityIcon(rarity: string) {
  const key = rarity.toLowerCase();
  switch (key) {
    case "cosmic":
      return <Sparkles className="h-3 w-3" />;
    case "mythic":
      return <Crown className="h-3 w-3" />;
    case "epic":
      return <Gem className="h-3 w-3" />;
    case "rare":
      return <Star className="h-3 w-3" />;
    default:
      return <Shield className="h-3 w-3" />;
  }
}

function getRarityConfig(rarity: string) {
  const key = rarity.toLowerCase() as keyof typeof rarityConfig;
  return rarityConfig[key] || rarityConfig.common;
}

// Owned Lootbox Card Component
interface OwnedLootboxCardProps {
  lootbox: InventoryLootbox;
  onOpen: () => void;
  index: number;
}

function OwnedLootboxCard({ lootbox, onOpen, index }: OwnedLootboxCardProps) {
  const config = getRarityConfig(lootbox.rarity);
  const isVideo =
    lootbox.image.includes(".webm") || lootbox.image.includes(".mp4");
  const RarityIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className={cn(
        lootboxCardVariants({
          rarity: lootbox.rarity.toLowerCase() as keyof typeof rarityConfig,
        })
      )}
    >
      {/* Balance badge */}
      <div className="absolute top-2 right-2 z-10">
        <Badge className="bg-black/80 text-white font-bold text-sm px-2 py-0.5 border border-white/20">
          x{lootbox.balance}
        </Badge>
      </div>

      {/* Media */}
      <div className="aspect-square relative overflow-hidden">
        {isVideo ? (
          <video
            src={lootbox.image}
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
            onMouseEnter={(e) => e.currentTarget.play()}
            onMouseLeave={(e) => e.currentTarget.pause()}
          />
        ) : (
          <Image
            src={lootbox.image}
            alt={lootbox.name}
            fill
            className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

        {/* Rarity badge */}
        <div className="absolute top-2 left-2">
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
      </div>

      {/* Content */}
      <div className="p-3 bg-black/60">
        <h3 className="text-sm font-bold text-white mb-2 truncate group-hover:text-[rgb(163,255,18)] transition-colors">
          {lootbox.name}
        </h3>

        <Button
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          size="sm"
          className="w-full bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90 font-bold text-xs"
        >
          <Play className="h-3 w-3 mr-1" fill="currentColor" />
          Open
        </Button>
      </div>
    </motion.div>
  );
}

// Opening History Item Component
interface OpeningHistoryItemProps {
  opening: Opening;
  index: number;
}

function OpeningHistoryItem({ opening, index }: OpeningHistoryItemProps) {
  const config = opening.reward
    ? getRarityConfig(opening.reward.rarity)
    : getRarityConfig("common");
  const lootboxConfig = getRarityConfig(opening.lootbox.rarity);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
    >
      <Card className="bg-black/40 border-white/10 hover:border-white/20 transition-colors">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            {/* Lootbox thumbnail */}
            <div
              className={cn(
                "h-10 w-10 rounded-lg overflow-hidden flex-shrink-0 border",
                lootboxConfig.border
              )}
            >
              <Image
                src={opening.lootbox.image}
                alt={opening.lootbox.name}
                width={40}
                height={40}
                className="object-cover"
              />
            </div>

            <ChevronRight className="h-4 w-4 text-white/20 flex-shrink-0" />

            {/* Reward or pending */}
            {opening.fulfilled && opening.reward ? (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div
                  className={cn(
                    "h-10 w-10 rounded-lg overflow-hidden flex-shrink-0 border",
                    config.border
                  )}
                >
                  <Image
                    src={opening.reward.image}
                    alt={opening.reward.name}
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {opening.reward.name}
                  </p>
                  <Badge
                    className={cn("text-xs capitalize", config.bg, config.text)}
                  >
                    {opening.reward.rarity}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-1">
                <div className="h-10 w-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <Loader2 className="h-4 w-4 text-white/40 animate-spin" />
                </div>
                <span className="text-white/50 text-sm">Pending VRF...</span>
              </div>
            )}

            {/* Timestamp */}
            <div className="text-right flex-shrink-0">
              <p className="text-white/40 text-xs">
                {new Date(opening.openedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
              {opening.fulfilled ? (
                <Badge className="bg-green-500/20 text-green-400 text-xs mt-0.5">
                  <Check className="h-2.5 w-2.5 mr-0.5" />
                  Done
                </Badge>
              ) : (
                <Badge className="bg-yellow-500/20 text-yellow-400 text-xs mt-0.5">
                  <Clock className="h-2.5 w-2.5 mr-0.5" />
                  Wait
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Loading Skeleton
function LootboxLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="aspect-[4/5] rounded-xl bg-white/5" />
        ))}
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState({ type }: { type: "owned" | "history" }) {
  const router = useRouter();

  if (type === "owned") {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="p-4 rounded-full bg-white/5 mb-4">
          <Package className="h-10 w-10 text-white/20" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">No Lootboxes</h3>
        <p className="text-white/50 text-sm max-w-xs mb-4">
          You don't own any lootboxes yet. Browse the collection to find your
          first one!
        </p>
        <Button
          onClick={() => router.push("/lootboxes")}
          size="sm"
          className="bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90"
        >
          <Gift className="h-4 w-4 mr-2" />
          Browse Lootboxes
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="p-4 rounded-full bg-white/5 mb-4">
        <Gift className="h-10 w-10 text-white/20" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">No History</h3>
      <p className="text-white/50 text-sm max-w-xs">
        You haven't opened any lootboxes yet. Get started by purchasing one!
      </p>
    </div>
  );
}

// Main Component Props
interface ProfileLootboxesProps {
  walletAddress: string;
}

export function ProfileLootboxes({ walletAddress }: ProfileLootboxesProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inventory, setInventory] = useState<InventoryLootbox[]>([]);
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [createdLootboxes, setCreatedLootboxes] = useState<CreatedLootbox[]>(
    []
  );
  const [activeSubTab, setActiveSubTab] = useState("owned");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch lootbox data
  const fetchLootboxData = useCallback(async () => {
    if (!walletAddress) return;

    try {
      const response = await fetch(
        `/api/lootboxes/user/inventory?address=${walletAddress}`
      );
      const data = await response.json();

      const parsed = inventoryResponseSchema.safeParse(data);
      if (!parsed.success) {
        console.error("API validation failed:", parsed.error);
        throw new Error("Invalid API response");
      }

      if (!parsed.data.success) {
        throw new Error("Failed to fetch inventory");
      }

      // Filter to only show lootboxes with balance > 0
      const ownedLootboxes = parsed.data.inventory.filter(
        (lb) => lb.balance > 0
      );
      setInventory(ownedLootboxes);
      setOpenings(parsed.data.openings);
      setCreatedLootboxes(parsed.data.createdLootboxes || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching lootbox data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchLootboxData();
  }, [fetchLootboxData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchLootboxData();
  };

  // Calculate stats
  const totalOwned = inventory.reduce((sum, lb) => sum + lb.balance, 0);
  const totalOpened = openings.length;

  if (loading) {
    return <LootboxLoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
        <p className="text-white/60 mb-4">{error}</p>
        <Button
          onClick={fetchLootboxData}
          size="sm"
          variant="outline"
          className="border-white/20"
        >
          Try Again
        </Button>
      </div>
    );
  }

  // If no lootbox data at all
  if (inventory.length === 0 && openings.length === 0) {
    return <EmptyState type="owned" />;
  }

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-[rgb(163,255,18)]" />
            <span className="text-white/60 text-sm">Owned:</span>
            <span className="text-white font-bold">{totalOwned}</span>
          </div>
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-purple-400" />
            <span className="text-white/60 text-sm">Opened:</span>
            <span className="text-white font-bold">{totalOpened}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleRefresh}
            size="sm"
            variant="ghost"
            className="text-white/60 hover:text-white"
            disabled={isRefreshing}
          >
            <RefreshCw
              className={cn("h-4 w-4", isRefreshing && "animate-spin")}
            />
          </Button>
          <Button
            onClick={() => router.push("/lootboxes/reveal")}
            size="sm"
            className="bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90"
          >
            <Play className="h-4 w-4 mr-1" fill="currentColor" />
            Open
          </Button>
        </div>
      </div>

      {/* Sub-tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="bg-white/5 border border-white/10 p-1">
          <TabsTrigger
            value="owned"
            className="data-[state=active]:bg-[rgb(163,255,18)] data-[state=active]:text-black text-xs"
          >
            <Package className="h-3 w-3 mr-1" />
            Owned ({totalOwned})
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="data-[state=active]:bg-[rgb(163,255,18)] data-[state=active]:text-black text-xs"
          >
            <Gift className="h-3 w-3 mr-1" />
            History ({openings.length})
          </TabsTrigger>
          {createdLootboxes.length > 0 && (
            <TabsTrigger
              value="created"
              className="data-[state=active]:bg-[rgb(163,255,18)] data-[state=active]:text-black text-xs"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Created ({createdLootboxes.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="owned" className="mt-4">
          {inventory.length === 0 ? (
            <EmptyState type="owned" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {inventory.map((lootbox, index) => (
                <OwnedLootboxCard
                  key={lootbox.id}
                  lootbox={lootbox}
                  index={index}
                  onOpen={() =>
                    router.push(`/lootboxes/reveal?lootboxId=${lootbox.id}`)
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {openings.length === 0 ? (
            <EmptyState type="history" />
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {openings.map((opening, index) => (
                <OpeningHistoryItem
                  key={opening.id}
                  opening={opening}
                  index={index}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {createdLootboxes.length > 0 && (
          <TabsContent value="created" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {createdLootboxes.map((lootbox, index) => {
                const config = getRarityConfig(lootbox.rarity);
                return (
                  <motion.div
                    key={lootbox.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className={cn(
                        "bg-black/40 border cursor-pointer hover:scale-[1.01] transition-all",
                        config.border
                      )}
                      onClick={() => router.push(`/lootboxes/${lootbox.id}`)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "h-14 w-14 rounded-lg overflow-hidden flex-shrink-0 border",
                              config.border
                            )}
                          >
                            <Image
                              src={lootbox.image}
                              alt={lootbox.name}
                              width={56}
                              height={56}
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-bold text-white truncate">
                                {lootbox.name}
                              </h3>
                              {lootbox.isActive ? (
                                <Badge className="bg-green-500/20 text-green-400 text-xs">
                                  Live
                                </Badge>
                              ) : (
                                <Badge className="bg-red-500/20 text-red-400 text-xs">
                                  Off
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-white/50">
                              <span>Sold: {lootbox.soldCount}</span>
                              <span>Left: {lootbox.remainingSupply}</span>
                              <span>Opens: {lootbox.openingsCount}</span>
                            </div>
                          </div>
                          <ExternalLink className="h-4 w-4 text-white/30 flex-shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
