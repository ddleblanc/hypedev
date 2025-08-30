"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { MediaRenderer } from "@/components/MediaRenderer";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Zap,
  Tag,
  Crown,
  Shield,
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  Eye,
  Heart,
  Share2,
  ExternalLink,
  Check,
  Loader2,
  AlertTriangle,
  Info,
  Star,
  BarChart3,
  Activity,
  DollarSign,
  Sparkles,
  ArrowRight,
  Copy,
  X,
  ChevronDown,
  ChevronUp,
  Flame,
  Users,
  Timer,
  Minimize2,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  Verified,
  ShoppingCart,
  History,
  Award,
  Gem,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Hash,
  Globe,
  Twitter,
  MessageCircle,
  Link2,
  Fullscreen,
  ZoomIn,
  RotateCcw,
  Download,
  Flag,
  Plus,
  Minus,
  RefreshCw,
  TrendingDown as TrendingDownIcon,
  Calendar,
  FileText,
  Database,
  Package,
  Gift,
  Dice1,
  Dice2,
  Dice3,
  Dice4,
  Dice5,
  Dice6,
  Trophy,
  Target,
  Ticket,
  Box,
  PackageOpen,
  Coins,
  CreditCard,
  Banknote,
  CircleDollarSign,
  Swords,
  Wand2,
  ShieldCheck,
  Zap as Lightning,
  Sparkle,
  Star as StarIcon,
  Lock,
  Unlock,
  Key,
  BookOpen,
  Scroll,
  Map,
  Compass,
  Navigation,
  Crosshair,
  Medal,
  BadgeCheck,
} from "lucide-react";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { client } from "@/lib/thirdweb";
import { useTransaction, TransactionNFT } from "@/contexts/transaction-context";
import { cn } from "@/lib/utils";

export interface LootboxDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lootbox: {
    id: string;
    name: string;
    image: string;
    price?: number;
    lastSale?: number;
    rarity?: string;
    collection: string;
    contractAddress?: string;
    tokenId?: string;
    owner?: string;
    creator?: string;
    royalty?: number;
    totalSupply?: number;
    opened?: number;
    remaining?: number;
    guaranteed?: string[];
    possibleRewards?: Array<{
      name: string;
      rarity: string;
      chance: number;
    }>;
    traits?: Record<string, string>;
    floorPrice?: number;
    topBid?: number;
    views?: number;
    likes?: number;
    rank?: number;
    listed?: boolean;
    auction?: boolean;
    new?: boolean;
  } | null;
}

// Mock data for lootbox-specific information
const MOCK_OPENING_HISTORY = [
  {
    id: "1",
    opener: "0x1234...5678",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    rewards: [
      { name: "Epic Shield", rarity: "Epic" },
      { name: "Rare Armor", rarity: "Rare" },
      { name: "Common Potion x3", rarity: "Common" },
    ],
    txHash: "0xabc...def",
  },
  {
    id: "2",
    opener: "0x2468...1357",
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    rewards: [
      { name: "Legendary Sword", rarity: "Legendary" },
      { name: "Uncommon Helmet", rarity: "Uncommon" },
      { name: "Common Scroll x2", rarity: "Common" },
    ],
    txHash: "0xdef...ghi",
  },
  {
    id: "3",
    opener: "0x3579...2468",
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    rewards: [
      { name: "Rare Spellbook", rarity: "Rare" },
      { name: "Uncommon Crystal x2", rarity: "Uncommon" },
      { name: "Common Potion", rarity: "Common" },
    ],
    txHash: "0xghi...jkl",
  },
];

const MOCK_COLLECTION_STATS = {
  totalOpened: 3247,
  averageValue: 0.35,
  highestValue: 2.45,
  openRate24h: 147,
  totalVolume: 12847.3,
  uniqueOpeners: 1823,
};

export function LootboxDetailModal({ open, onOpenChange, lootbox }: LootboxDetailModalProps) {
  const account = useActiveAccount();
  const { startTransaction, updateStep, completeTransaction, setError, setTxHash } = useTransaction();
  
  // State management
  const [activeTab, setActiveTab] = useState("overview");
  const [quantity, setQuantity] = useState(1);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [copied, setCopied] = useState("");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState<"image" | "details">("details");
  const [imageZoom, setImageZoom] = useState(1);
  const [isOpening, setIsOpening] = useState(false);
  const [openingResults, setOpeningResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  
  // Mouse position for image interaction
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 150 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);
  
  const imageRef = useRef<HTMLDivElement>(null);

  // Check mobile and setup listeners
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setMobileView("details");
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setActiveTab("overview");
      setQuantity(1);
      setAgreedToTerms(false);
      setImageZoom(1);
      setImageLoaded(true);
      setIsOpening(false);
      setShowResults(false);
      setOpeningResults([]);
    }
  }, [open]);

  const copyAddress = useCallback((address: string, type: string) => {
    navigator.clipboard.writeText(address);
    setCopied(type);
    setTimeout(() => setCopied(""), 2000);
  }, []);

  if (!lootbox) return null;

  const isOwner = account?.address && lootbox.owner === account.address;
  const canBuy = lootbox.price && !isOwner;
  const transactionAmount = (lootbox.price || 0) * quantity;

  const fees = {
    marketplaceFee: transactionAmount * 0.025,
    creatorRoyalty: (transactionAmount * (lootbox.royalty || 5)) / 100,
    gasEstimate: 0.008,
    protocolFee: transactionAmount * 0.005,
  };

  const total = transactionAmount + fees.marketplaceFee + fees.creatorRoyalty + fees.gasEstimate + fees.protocolFee;

  const handleBuyNow = async () => {
    if (!lootbox.price || !account) return;
    
    try {
      const transactionNFT: TransactionNFT = {
        id: lootbox.id,
        name: lootbox.name,
        image: lootbox.image,
        price: lootbox.price * quantity,
        collection: lootbox.collection,
        contractAddress: lootbox.contractAddress,
        tokenId: lootbox.tokenId,
      };

      startTransaction(transactionNFT, "buy", total);
      onOpenChange(false);

      // Simulate transaction steps
      setTimeout(async () => {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        updateStep("approve", 40, 30000);
        
        await new Promise((resolve) => setTimeout(resolve, 2500));
        updateStep("confirm", 60, 20000);
        
        await new Promise((resolve) => setTimeout(resolve, 3000));
        updateStep("pending", 80, 15000);
        
        const mockTxHash = `0x${Math.random().toString(16).slice(2, 66)}`;
        setTxHash(mockTxHash);
        
        await new Promise((resolve) => setTimeout(resolve, 4000));
        completeTransaction();
      }, 100);
    } catch (err) {
      setError("Transaction failed. Please try again.");
    }
  };

  const handleOpenLootbox = async () => {
    if (!account || !lootbox.price) return;
    
    setIsOpening(true);
    
    // Simulate opening animation and results
    setTimeout(() => {
      const mockResults = [
        { name: "Epic Weapon", rarity: "Epic", value: 0.15, image: "https://picsum.photos/200/200?random=10" },
        { name: "Rare Armor", rarity: "Rare", value: 0.08, image: "https://picsum.photos/200/200?random=11" },
        { name: "Common Potion x3", rarity: "Common", value: 0.02, image: "https://picsum.photos/200/200?random=12" },
      ];
      
      setOpeningResults(mockResults);
      setShowResults(true);
      setIsOpening(false);
    }, 3000);
  };

  const getRarityColor = (rarity?: string) => {
    switch (rarity) {
      case "Mythic":
        return "from-purple-500 via-pink-500 to-purple-600";
      case "Legendary":
        return "from-yellow-400 via-orange-500 to-yellow-600";
      case "Epic":
        return "from-violet-500 via-purple-500 to-violet-600";
      case "Rare":
        return "from-blue-500 via-cyan-500 to-blue-600";
      case "Uncommon":
        return "from-green-500 via-emerald-500 to-green-600";
      default:
        return "from-gray-400 via-gray-500 to-gray-600";
    }
  };

  const getChanceColor = (chance: number) => {
    if (chance < 1) return "text-yellow-500";
    if (chance < 5) return "text-purple-500";
    if (chance < 15) return "text-blue-500";
    if (chance < 30) return "text-green-500";
    return "text-gray-500";
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!imageRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    mouseX.set((e.clientX - centerX) / 10);
    mouseY.set((e.clientY - centerY) / 10);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // Mobile Experience Component
  const MobileExperience = () => (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Mobile Header */}
      <div className="flex items-center justify-between p-4 bg-black/90 backdrop-blur-lg border-b border-white/10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onOpenChange(false)}
          className="text-white hover:bg-white/10"
        >
          <X className="h-5 w-5" />
        </Button>
        
        <div className="flex gap-2">
          <Button
            variant={mobileView === "image" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setMobileView("image")}
            className="text-white"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant={mobileView === "details" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setMobileView("details")}
            className="text-white"
          >
            <FileText className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsLiked(!isLiked)}
            className="text-white hover:bg-white/10"
          >
            <Heart className={cn("h-5 w-5", isLiked && "fill-red-500 text-red-500")} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10"
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {mobileView === "image" ? (
            <motion.div
              key="image"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="h-full flex items-center justify-center p-4"
            >
              <div 
                className="relative w-full h-full max-h-[70vh] rounded-2xl overflow-hidden"
                style={{ transform: `scale(${imageZoom})` }}
              >
                <MediaRenderer
                  src={lootbox.image}
                  alt={lootbox.name}
                  className="w-full h-full object-contain"
                />
                
                {/* Lootbox Glow Effect */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-500/20 via-transparent to-transparent animate-pulse" />
                </div>
                
                {/* Image Controls */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 backdrop-blur-sm rounded-full p-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setImageZoom(Math.max(0.5, imageZoom - 0.25))}
                    className="h-8 w-8 p-0 text-white hover:bg-white/20"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setImageZoom(1)}
                    className="h-8 px-3 text-white hover:bg-white/20 text-xs"
                  >
                    {Math.round(imageZoom * 100)}%
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setImageZoom(Math.min(3, imageZoom + 0.25))}
                    className="h-8 w-8 p-0 text-white hover:bg-white/20"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="h-full bg-background"
            >
              <ScrollArea className="h-[calc(100vh-140px)]">
                <div className="p-6 space-y-6 pb-32">
                  {/* Header */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-2xl font-bold">{lootbox.name}</h1>
                      {lootbox.rarity && (
                        <Badge className={cn("text-xs bg-gradient-to-r text-white", getRarityColor(lootbox.rarity))}>
                          {lootbox.rarity}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <Link
                        href={`/collection/${lootbox.collection}`}
                        className="hover:text-foreground flex items-center gap-1"
                      >
                        {lootbox.collection}
                        <Verified className="h-4 w-4 text-primary" />
                      </Link>
                      {lootbox.rank && (
                        <Badge variant="outline" className="gap-1">
                          <Hash className="h-3 w-3" />
                          {lootbox.rank}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Supply Info */}
                  {lootbox.totalSupply && (
                    <Card>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Supply Status</span>
                            <span className="font-medium">
                              {lootbox.remaining}/{lootbox.totalSupply} Remaining
                            </span>
                          </div>
                          <Progress 
                            value={(lootbox.opened! / lootbox.totalSupply) * 100} 
                            className="h-2"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{lootbox.opened} Opened</span>
                            <span>{Math.round((lootbox.opened! / lootbox.totalSupply) * 100)}% Claimed</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Price Card */}
                  <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                    <CardContent className="p-6">
                      {lootbox.price ? (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Price per Box</p>
                          <div className="flex items-baseline gap-4 mb-4">
                            <span className="text-4xl font-bold">{lootbox.price} ETH</span>
                            <span className="text-lg text-muted-foreground">
                              ${(lootbox.price * 2650).toLocaleString()}
                            </span>
                          </div>
                          
                          {/* Quantity Selector */}
                          <div className="space-y-2">
                            <Label htmlFor="mobile-quantity">Quantity</Label>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="h-8 w-8 p-0"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input
                                id="mobile-quantity"
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-20 h-8 text-center"
                                min="1"
                                max={lootbox.remaining || 100}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setQuantity(Math.min(lootbox.remaining || 100, quantity + 1))}
                                className="h-8 w-8 p-0"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Total: {(lootbox.price * quantity).toFixed(3)} ETH
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-lg font-semibold mb-2">Not Available</p>
                          <p className="text-sm text-muted-foreground">This lootbox is not currently for sale</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Possible Rewards */}
                  {lootbox.possibleRewards && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Gift className="h-4 w-4" />
                        Possible Rewards
                      </h3>
                      <div className="space-y-2">
                        {lootbox.possibleRewards.map((reward, index) => (
                          <Card key={index} className="hover:bg-muted/50 transition-colors">
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Badge className={cn("text-xs", getRarityColor(reward.rarity))}>
                                    {reward.rarity}
                                  </Badge>
                                  <span className="font-medium text-sm">{reward.name}</span>
                                </div>
                                <span className={cn("text-sm font-bold", getChanceColor(reward.chance))}>
                                  {reward.chance}%
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Guaranteed Items */}
                  {lootbox.guaranteed && lootbox.guaranteed.length > 0 && (
                    <Card className="border-green-500/20 bg-green-500/5">
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-green-500" />
                          Guaranteed Items
                        </h3>
                        <div className="space-y-1">
                          {lootbox.guaranteed.map((item, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <Check className="h-3 w-3 text-green-500" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fixed Bottom Actions */}
      <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t p-4">
        <div className="space-y-3">
          {/* Terms */}
          <div className="flex items-center gap-3">
            <Switch
              id="mobile-terms"
              checked={agreedToTerms}
              onCheckedChange={setAgreedToTerms}
            />
            <Label htmlFor="mobile-terms" className="text-sm">
              I understand lootbox contents are random
            </Label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {canBuy ? (
              <Button
                size="lg"
                className="flex-1 gap-2 h-12"
                onClick={handleBuyNow}
                disabled={!agreedToTerms || !account}
              >
                <Package className="h-4 w-4" />
                Buy {quantity} Box{quantity > 1 ? 'es' : ''} • {((lootbox.price || 0) * quantity).toFixed(3)} ETH
              </Button>
            ) : !isOwner ? (
              <Button size="lg" variant="outline" className="flex-1 h-12" disabled>
                Not Available
              </Button>
            ) : (
              <Button
                size="lg"
                className="flex-1 gap-2 h-12"
                onClick={handleOpenLootbox}
                disabled={!account}
              >
                <PackageOpen className="h-4 w-4" />
                Open Lootbox
              </Button>
            )}
          </div>

          {/* Connect Wallet */}
          {!account && (
            <div className="flex justify-center">
              <ConnectButton client={client} />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Desktop Experience Component
  const DesktopExperience = () => (
    <DialogContent className="max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh] p-0 gap-0 bg-background/95 backdrop-blur-xl border-0 shadow-2xl">
      <div className="h-full flex rounded-2xl overflow-hidden bg-background">
        {/* Left Panel - Image Gallery */}
        <div className="w-[55%] bg-black relative flex flex-col">
          {/* Main Image */}
          <div className="flex-1 min-h-0 flex items-center justify-center">
            <div 
              ref={imageRef}
              className="relative w-full h-full cursor-zoom-in group"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onClick={() => setShowFullscreen(true)}
            >
              <motion.div
                style={{ x, y }}
                className="w-full h-full flex items-center justify-center p-8"
              >
                <motion.div
                  animate={{ scale: imageLoaded ? 1 : 0.9 }}
                  className="relative w-full h-full rounded-2xl overflow-hidden"
                >
                  <MediaRenderer
                    src={lootbox.image}
                    alt={lootbox.name}
                    className="w-full h-full object-contain transition-all duration-300 group-hover:scale-105"
                  />
                  
                  {/* Lootbox Glow Effect */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-t from-purple-500/20 via-transparent to-transparent animate-pulse" />
                    <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/50" />
                  </div>
                  
                  {/* Rarity Glow Effect */}
                  {lootbox.rarity && ["Legendary", "Mythic", "Epic"].includes(lootbox.rarity) && (
                    <div
                      className="absolute inset-0 pointer-events-none opacity-30"
                      style={{
                        background: `radial-gradient(circle at center, transparent 40%, ${
                          lootbox.rarity === "Mythic"
                            ? "rgba(168, 85, 247, 0.3)"
                            : lootbox.rarity === "Legendary"
                            ? "rgba(251, 191, 36, 0.3)"
                            : "rgba(139, 92, 246, 0.3)"
                        } 100%)`,
                      }}
                    />
                  )}
                </motion.div>
              </motion.div>

              {/* Image Overlay Controls */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {/* Top Controls */}
                <div className="absolute top-6 left-6 right-6 flex justify-between">
                  <div className="flex gap-2">
                    {lootbox.new && (
                      <Badge className="bg-green-500/90 text-white backdrop-blur-sm">
                        <Sparkles className="h-3 w-3 mr-1" />
                        New
                      </Badge>
                    )}
                    {lootbox.remaining && lootbox.remaining < 100 && (
                      <Badge className="bg-orange-500/90 text-white backdrop-blur-sm">
                        <Timer className="h-3 w-3 mr-1" />
                        Limited Supply
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-9 w-9 p-0 bg-black/50 backdrop-blur-sm border-white/20 hover:bg-black/70"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsLiked(!isLiked);
                      }}
                    >
                      <Heart className={cn("h-4 w-4", isLiked && "fill-red-500 text-red-500")} />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-9 w-9 p-0 bg-black/50 backdrop-blur-sm border-white/20 hover:bg-black/70"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Bottom Controls */}
                <div className="absolute bottom-6 left-6 right-6 flex justify-between">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="gap-2 bg-black/50 backdrop-blur-sm border-white/20 hover:bg-black/70"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowFullscreen(true);
                    }}
                  >
                    <Fullscreen className="h-4 w-4" />
                    Fullscreen
                  </Button>
                </div>
              </div>

              {/* Loading State */}
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Supply Info Bar */}
          {lootbox.totalSupply && (
            <div className="p-6 border-t border-white/10">
              <div className="space-y-3">
                <div className="flex justify-between text-white">
                  <span className="text-sm opacity-75">Supply Status</span>
                  <span className="font-medium">
                    {lootbox.remaining}/{lootbox.totalSupply} Remaining
                  </span>
                </div>
                <Progress 
                  value={(lootbox.opened! / lootbox.totalSupply) * 100} 
                  className="h-2 bg-white/10"
                />
                <div className="flex justify-between text-xs text-white/60">
                  <span>{lootbox.opened} Opened</span>
                  <span>{Math.round((lootbox.opened! / lootbox.totalSupply) * 100)}% Claimed</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Details */}
        <div className="flex-1 flex flex-col bg-background relative">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 z-10 h-9 w-9 p-0 hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Header */}
          <div className="p-8 pb-6 border-b">
            <div className="pr-12">
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-3xl font-bold">{lootbox.name}</h1>
                {lootbox.rarity && (
                  <Badge className={cn("text-sm bg-gradient-to-r text-white px-3 py-1", getRarityColor(lootbox.rarity))}>
                    <Crown className="h-3 w-3 mr-1" />
                    {lootbox.rarity}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-6 mb-6">
                <Link
                  href={`/collection/${lootbox.collection}`}
                  className="text-lg text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors"
                >
                  {lootbox.collection}
                  <Verified className="h-5 w-5 text-primary" />
                </Link>
                {lootbox.rank && (
                  <Badge variant="outline" className="gap-2 px-3 py-1">
                    <Hash className="h-4 w-4" />
                    Rank #{lootbox.rank}
                  </Badge>
                )}
              </div>

              {/* Stats Row */}
              <div className="flex items-center gap-6 text-sm">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full">
                        <Eye className="h-4 w-4" />
                        <span className="font-medium">{(lootbox.views || 0).toLocaleString()}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Total views</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full">
                        <Heart className="h-4 w-4" />
                        <span className="font-medium">{(lootbox.likes || 0).toLocaleString()}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Favorites</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">{MOCK_COLLECTION_STATS.uniqueOpeners.toLocaleString()} openers</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabbed Content */}
          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="px-8 py-4 border-b">
                <TabsList className="grid grid-cols-4 w-full h-11">
                  <TabsTrigger value="overview" className="gap-2">
                    <Grid3X3 className="h-4 w-4" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="rewards" className="gap-2">
                    <Gift className="h-4 w-4" />
                    Rewards
                  </TabsTrigger>
                  <TabsTrigger value="history" className="gap-2">
                    <History className="h-4 w-4" />
                    History
                  </TabsTrigger>
                  <TabsTrigger value="details" className="gap-2">
                    <Info className="h-4 w-4" />
                    Details
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-hidden">
                <TabsContent value="overview" className="h-full m-0">
                  <ScrollArea className="h-full">
                    <div className="p-8 space-y-8">
                      {/* Price Information */}
                      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 shadow-lg">
                        <CardContent className="p-6">
                          {lootbox.price ? (
                            <div>
                              <div className="flex items-center justify-between mb-4">
                                <p className="text-sm font-medium text-muted-foreground">Price per Lootbox</p>
                                <Badge variant="secondary" className="gap-1">
                                  <Package className="h-3 w-3" />
                                  {lootbox.remaining} available
                                </Badge>
                              </div>
                              
                              <div className="flex items-baseline gap-4 mb-6">
                                <span className="text-4xl font-bold">{lootbox.price} ETH</span>
                                <span className="text-xl text-muted-foreground">
                                  ${(lootbox.price * 2650).toLocaleString()}
                                </span>
                              </div>

                              {/* Quantity Selector */}
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="quantity" className="mb-2">Quantity to Purchase</Label>
                                  <div className="flex items-center gap-3">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                      className="h-10 w-10 p-0"
                                    >
                                      <Minus className="h-4 w-4" />
                                    </Button>
                                    <Input
                                      id="quantity"
                                      type="number"
                                      value={quantity}
                                      onChange={(e) => setQuantity(Math.max(1, Math.min(lootbox.remaining || 100, parseInt(e.target.value) || 1)))}
                                      className="w-24 h-10 text-center text-lg font-medium"
                                      min="1"
                                      max={lootbox.remaining || 100}
                                    />
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setQuantity(Math.min(lootbox.remaining || 100, quantity + 1))}
                                      className="h-10 w-10 p-0"
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                    <div className="flex-1 text-right">
                                      <p className="text-2xl font-bold">
                                        {(lootbox.price * quantity).toFixed(3)} ETH
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        ${((lootbox.price * quantity) * 2650).toLocaleString()} total
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-6">
                              <h3 className="text-xl font-semibold mb-2">Not Currently Available</h3>
                              <p className="text-muted-foreground">This lootbox is not for sale at the moment</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Guaranteed Items */}
                      {lootbox.guaranteed && lootbox.guaranteed.length > 0 && (
                        <Card className="border-green-500/20 bg-green-500/5">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <ShieldCheck className="h-5 w-5 text-green-500" />
                              Guaranteed Items
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 gap-3">
                              {lootbox.guaranteed.map((item, index) => (
                                <div key={index} className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
                                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                                  <span className="font-medium">{item}</span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Collection Stats */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Collection Statistics
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Total Opened</p>
                              <p className="text-xl font-bold">{MOCK_COLLECTION_STATS.totalOpened.toLocaleString()}</p>
                              <p className="text-sm text-muted-foreground">All time</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Average Value</p>
                              <p className="text-xl font-bold">{MOCK_COLLECTION_STATS.averageValue} ETH</p>
                              <p className="text-sm text-muted-foreground">Per box</p>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Highest Value</p>
                              <p className="text-xl font-bold">{MOCK_COLLECTION_STATS.highestValue} ETH</p>
                              <p className="text-sm text-muted-foreground">Best pull</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Open Rate (24h)</p>
                              <p className="text-xl font-bold">{MOCK_COLLECTION_STATS.openRate24h}</p>
                              <p className="text-sm text-muted-foreground">Boxes opened</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="rewards" className="h-full m-0">
                  <ScrollArea className="h-full">
                    <div className="p-8 space-y-6">
                      {/* Possible Rewards */}
                      {lootbox.possibleRewards && (
                        <div>
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Dice6 className="h-5 w-5" />
                            Drop Rates
                          </h3>
                          <div className="grid grid-cols-1 gap-3">
                            {lootbox.possibleRewards.map((reward, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                              >
                                <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                                  <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-4">
                                        <div className={cn(
                                          "h-12 w-12 rounded-lg flex items-center justify-center",
                                          "bg-gradient-to-br", getRarityColor(reward.rarity)
                                        )}>
                                          <Trophy className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                          <p className="font-semibold text-lg">{reward.name}</p>
                                          <Badge variant="outline" className={cn("mt-1", getRarityColor(reward.rarity))}>
                                            {reward.rarity}
                                          </Badge>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className={cn("text-2xl font-bold", getChanceColor(reward.chance))}>
                                          {reward.chance}%
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          1 in {Math.round(100 / reward.chance)}
                                        </p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Rarity Distribution Chart */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Rarity Distribution
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {["Mythic", "Legendary", "Epic", "Rare", "Uncommon", "Common"].map((rarity) => {
                              const totalChance = lootbox.possibleRewards
                                ?.filter(r => r.rarity === rarity)
                                .reduce((acc, r) => acc + r.chance, 0) || 0;
                              
                              if (totalChance === 0) return null;
                              
                              return (
                                <div key={rarity} className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="font-medium">{rarity}</span>
                                    <span className={cn("font-bold", getChanceColor(totalChance))}>
                                      {totalChance.toFixed(1)}%
                                    </span>
                                  </div>
                                  <Progress 
                                    value={totalChance} 
                                    className="h-2"
                                    style={{
                                      background: `linear-gradient(to right, ${getRarityColor(rarity).split(' ').join(', ')})`,
                                    }}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="history" className="h-full m-0">
                  <ScrollArea className="h-full">
                    <div className="p-8 space-y-4">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Recent Openings
                      </h3>
                      {MOCK_OPENING_HISTORY.map((opening, index) => (
                        <motion.div
                          key={opening.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Card className="hover:shadow-md transition-all duration-200">
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <p className="font-mono text-sm text-muted-foreground">{opening.opener}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {new Date(opening.timestamp).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="gap-2 text-xs"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  View TX
                                </Button>
                              </div>
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">Rewards Received:</p>
                                <div className="flex flex-wrap gap-2">
                                  {opening.rewards.map((reward, i) => (
                                    <Badge
                                      key={i}
                                      variant="secondary"
                                      className={cn("gap-1", getRarityColor(reward.rarity))}
                                    >
                                      {reward.name}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="details" className="h-full m-0">
                  <ScrollArea className="h-full">
                    <div className="p-8 space-y-6">
                      {/* Properties */}
                      {lootbox.traits && Object.keys(lootbox.traits).length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Gem className="h-5 w-5" />
                              Properties
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                              {Object.entries(lootbox.traits).map(([key, value]) => (
                                <div key={key} className="p-4 bg-muted/50 rounded-lg">
                                  <p className="text-sm font-medium text-muted-foreground mb-1">{key}</p>
                                  <p className="font-semibold">{value}</p>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Contract Details */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Database className="h-5 w-5" />
                            Contract Details
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-6 text-sm">
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Contract Address</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs">
                                    {lootbox.contractAddress
                                      ? `${lootbox.contractAddress.substring(0, 6)}...${lootbox.contractAddress.substring(38)}`
                                      : "0x1234...5678"}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() =>
                                      copyAddress(
                                        lootbox.contractAddress || "0x1234567890123456789012345678901234567890",
                                        "contract"
                                      )
                                    }
                                  >
                                    {copied === "contract" ? (
                                      <Check className="h-3 w-3" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Token ID</span>
                                <span className="font-mono">{lootbox.tokenId || "#1234"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Token Standard</span>
                                <span>ERC-721</span>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Blockchain</span>
                                <div className="flex items-center gap-2">
                                  <div className="h-4 w-4 rounded-full bg-gradient-to-r from-purple-400 to-blue-500" />
                                  <span>Ethereum</span>
                                </div>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Creator Royalty</span>
                                <span>{lootbox.royalty || 5}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Metadata</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Owner Information */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Creator Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-12 w-12">
                                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-bold">
                                  {lootbox.creator ? lootbox.creator.slice(2, 4).toUpperCase() : "CR"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold">Creator</p>
                                <p className="text-sm text-muted-foreground font-mono">
                                  {lootbox.creator
                                    ? `${lootbox.creator.substring(0, 6)}...${lootbox.creator.substring(38)}`
                                    : "0x0987...4321"}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        copyAddress(
                                          lootbox.creator || "0x0987654321098765432109876543210987654321",
                                          "creator"
                                        )
                                      }
                                    >
                                      {copied === "creator" ? (
                                        <Check className="h-4 w-4" />
                                      ) : (
                                        <Copy className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Copy address</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              <Button variant="ghost" size="sm">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </ScrollArea>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Footer Actions */}
          <div className="p-8 pt-6 border-t bg-background/50 backdrop-blur-sm">
            <div className="space-y-4">
              {/* Fee Breakdown (for purchases) */}
              {canBuy && (
                <Card className="bg-muted/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between text-sm mb-3">
                      <span className="font-medium">Total Cost Breakdown</span>
                      <Button variant="ghost" size="sm" className="h-auto p-0 text-xs">
                        <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {quantity} Lootbox{quantity > 1 ? 'es' : ''} × {lootbox.price} ETH
                        </span>
                        <span>{transactionAmount.toFixed(4)} ETH</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Marketplace fee (2.5%)</span>
                        <span>{fees.marketplaceFee.toFixed(4)} ETH</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Creator royalty ({lootbox.royalty || 5}%)</span>
                        <span>{fees.creatorRoyalty.toFixed(4)} ETH</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Gas estimate</span>
                        <span>{fees.gasEstimate} ETH</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span>{total.toFixed(4)} ETH</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Terms Agreement */}
              {!isOwner && (
                <div className="flex items-start gap-3">
                  <Switch
                    id="desktop-terms"
                    checked={agreedToTerms}
                    onCheckedChange={setAgreedToTerms}
                    className="mt-1"
                  />
                  <Label htmlFor="desktop-terms" className="text-sm leading-relaxed">
                    I understand that lootbox contents are random and final. I agree to the{" "}
                    <Link href="/terms" className="text-primary underline">
                      Terms of Service
                    </Link>.
                  </Label>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                {canBuy ? (
                  <Button
                    size="lg"
                    className="flex-1 gap-2 h-12 text-base font-semibold"
                    onClick={handleBuyNow}
                    disabled={!agreedToTerms || !account}
                  >
                    <Package className="h-5 w-5" />
                    Buy {quantity} Lootbox{quantity > 1 ? 'es' : ''} • {transactionAmount.toFixed(3)} ETH
                  </Button>
                ) : isOwner ? (
                  <Button
                    size="lg"
                    className="flex-1 gap-2 h-12 text-base font-semibold"
                    onClick={handleOpenLootbox}
                    disabled={isOpening}
                  >
                    {isOpening ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Opening...
                      </>
                    ) : (
                      <>
                        <PackageOpen className="h-5 w-5" />
                        Open Lootbox
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-center">
                      <Lock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="font-semibold">Not Available</p>
                      <p className="text-sm text-muted-foreground">This lootbox cannot be purchased</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Connect Wallet */}
              {!account && (
                <div className="flex justify-center pt-2">
                  <ConnectButton client={client} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <AnimatePresence>
          {open && (
            <motion.div
              key="lootbox-modal"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="contents"
            >
              {isMobile ? <MobileExperience /> : <DesktopExperience />}
            </motion.div>
          )}
        </AnimatePresence>
      </Dialog>

      {/* Fullscreen Image Viewer */}
      <AnimatePresence>
        {showFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
            onClick={() => setShowFullscreen(false)}
          >
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-6 right-6 text-white hover:bg-white/20 z-10"
              onClick={() => setShowFullscreen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              src={lootbox?.image}
              alt={lootbox?.name}
              className="max-w-[95vw] max-h-[95vh] object-contain rounded-lg"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Opening Results Modal */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowResults(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-background rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <Trophy className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
                <h2 className="text-3xl font-bold mb-2">Congratulations!</h2>
                <p className="text-muted-foreground">You received the following items:</p>
              </div>
              
              <div className="grid grid-cols-1 gap-4 mb-6">
                {openingResults.map((result, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.2 }}
                  >
                    <Card className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="h-20 w-20 rounded-lg overflow-hidden bg-muted">
                            <img
                              src={result.image}
                              alt={result.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-lg">{result.name}</p>
                            <Badge className={cn("mt-1", getRarityColor(result.rarity))}>
                              {result.rarity}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold">{result.value} ETH</p>
                            <p className="text-sm text-muted-foreground">
                              ${(result.value * 2650).toFixed(0)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
              
              <div className="flex gap-4">
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={() => setShowResults(false)}
                >
                  Close
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowResults(false);
                    handleOpenLootbox();
                  }}
                >
                  Open Another
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}