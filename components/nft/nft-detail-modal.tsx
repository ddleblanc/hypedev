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
} from "lucide-react";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { client } from "@/lib/thirdweb";
import { PriceTicker } from "./price-ticker";
import { TransactionConfidenceMeter } from "./transaction-confidence-meter";
import { useTransaction, TransactionNFT } from "@/contexts/transaction-context";
import { cn } from "@/lib/utils";

export interface NFTDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nft: {
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

// Enhanced mock data
const MOCK_COLLECTION_STATS = {
  floorPrice: 2.45,
  volume24h: 147.3,
  volume7d: 892.1,
  owners: 3247,
  totalSupply: 10000,
  floorChange24h: 5.2,
  listedCount: 1234,
  avgPrice24h: 3.2,
  uniqueOwners: 78.4,
  totalVolume: 12847.3,
};

const MOCK_PRICE_HISTORY = [
  { date: "2024-01-15", price: 2.1, event: "sale", from: "0x1234...5678", to: "0x8765...4321" },
  { date: "2024-01-20", price: 2.5, event: "sale", from: "0x2468...1357", to: "0x7531...8642" },
  { date: "2024-01-25", price: 2.3, event: "offer", from: "0x3579...2468", status: "expired" },
  { date: "2024-02-01", price: 2.8, event: "sale", from: "0x4680...3579", to: "0x9753...1864" },
  { date: "2024-02-05", price: 3.1, event: "sale", from: "0x5791...4680", to: "0x8642...9753" },
  { date: "2024-02-10", price: 2.9, event: "offer", from: "0x6802...5791", status: "active" },
];

const MOCK_ACTIVITY = [
  {
    id: "1",
    type: "sale",
    from: "0x1234...5678",
    to: "0x8765...4321",
    price: 2.5,
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    txHash: "0xabc...def",
  },
  {
    id: "2",
    type: "offer",
    from: "0x2468...1357",
    price: 2.3,
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    status: "expired",
  },
  {
    id: "3",
    type: "list",
    from: "0x1357...2468",
    price: 2.8,
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: "4",
    type: "transfer",
    from: "0x3579...2468",
    to: "0x9753...1864",
    timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  },
  {
    id: "5",
    type: "mint",
    to: "0x4680...3579",
    timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
  },
];

const MOCK_MORE_FROM_COLLECTION = Array.from({ length: 12 }, (_, i) => ({
  id: `related-${i}`,
  name: `Cyber Warrior #${(i + 1000).toString().padStart(4, "0")}`,
  image: `https://picsum.photos/400/400?random=${i + 100}`,
  price: Math.random() > 0.5 ? +(Math.random() * 5 + 0.5).toFixed(2) : undefined,
  rarity: ["Common", "Uncommon", "Rare", "Epic", "Legendary"][
    Math.floor(Math.random() * 5)
  ],
}));

export function NFTDetailModal({ open, onOpenChange, nft }: NFTDetailModalProps) {
  const account = useActiveAccount();
  const { startTransaction, updateStep, completeTransaction, setError, setTxHash } = useTransaction();
  
  // State management
  const [activeTab, setActiveTab] = useState("overview");
  const [offerAmount, setOfferAmount] = useState("");
  const [offerDuration, setOfferDuration] = useState("7");
  const [quantity, setQuantity] = useState(1);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [copied, setCopied] = useState("");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState<"image" | "details">("details");
  const [imageZoom, setImageZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  
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
      setOfferAmount("");
      setQuantity(1);
      setAgreedToTerms(false);
      setImageZoom(1);
      // Set image as loaded immediately since MediaRenderer handles loading internally
      setImageLoaded(true);
    }
  }, [open]);

  // Move all hooks before early return
  const copyAddress = useCallback((address: string, type: string) => {
    navigator.clipboard.writeText(address);
    setCopied(type);
    setTimeout(() => setCopied(""), 2000);
  }, []);

  if (!nft) return null;

  const isOwner = account?.address && nft.owner === account.address;
  const canBuy = nft.price && !isOwner;
  const numericOffer = parseFloat(offerAmount) || 0;
  const transactionAmount = nft.price || numericOffer;

  const fees = {
    marketplaceFee: transactionAmount * 0.025,
    creatorRoyalty: (transactionAmount * (nft.royalty || 5)) / 100,
    gasEstimate: 0.008,
    protocolFee: transactionAmount * 0.005,
  };

  const total = transactionAmount + fees.marketplaceFee + fees.creatorRoyalty + fees.gasEstimate + fees.protocolFee;

  const handleBuyNow = async () => {
    if (!nft.price || !account) return;
    
    try {
      const transactionNFT: TransactionNFT = {
        id: nft.id,
        name: nft.name,
        image: nft.image,
        price: nft.price,
        collection: nft.collection,
        contractAddress: nft.contractAddress,
        tokenId: nft.tokenId,
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

  const handleMakeOffer = async () => {
    if (!numericOffer || !account) return;
    
    try {
      const transactionNFT: TransactionNFT = {
        id: nft.id,
        name: nft.name,
        image: nft.image,
        price: numericOffer,
        collection: nft.collection,
        contractAddress: nft.contractAddress,
        tokenId: nft.tokenId,
      };

      startTransaction(transactionNFT, "offer", numericOffer);
      onOpenChange(false);

      setTimeout(async () => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        updateStep("approve", 50, 20000);
        
        await new Promise((resolve) => setTimeout(resolve, 2500));
        updateStep("confirm", 75, 15000);
        
        await new Promise((resolve) => setTimeout(resolve, 3000));
        completeTransaction();
      }, 100);
    } catch (err) {
      setError("Failed to submit offer. Please try again.");
    }
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
                  src={nft.image}
                  alt={nft.name}
                  className="w-full h-full object-contain"
                />
                
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
                      <h1 className="text-2xl font-bold">{nft.name}</h1>
                      {nft.rarity && (
                        <Badge className={cn("text-xs bg-gradient-to-r text-white", getRarityColor(nft.rarity))}>
                          {nft.rarity}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <Link
                        href={`/collection/${nft.collection}`}
                        className="hover:text-foreground flex items-center gap-1"
                      >
                        {nft.collection}
                        <Verified className="h-4 w-4 text-primary" />
                      </Link>
                      {nft.rank && (
                        <Badge variant="outline" className="gap-1">
                          <Hash className="h-3 w-3" />
                          {nft.rank}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Price Card */}
                  <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                    <CardContent className="p-6">
                      {nft.price ? (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Current Price</p>
                          <div className="flex items-baseline gap-4 mb-4">
                            <span className="text-4xl font-bold">{nft.price} ETH</span>
                            <span className="text-lg text-muted-foreground">
                              ${(nft.price * 2650).toLocaleString()}
                            </span>
                          </div>
                          
                          {/* Quick Stats */}
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground">Floor</p>
                              <p className="font-semibold">{MOCK_COLLECTION_STATS.floorPrice} ETH</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Last Sale</p>
                              <p className="font-semibold">{nft.lastSale || "—"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Top Bid</p>
                              <p className="font-semibold">{nft.topBid || "—"}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-lg font-semibold mb-2">Not Listed</p>
                          <p className="text-sm text-muted-foreground mb-4">Make an offer to acquire this NFT</p>
                          
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder="Enter offer (ETH)"
                              value={offerAmount}
                              onChange={(e) => setOfferAmount(e.target.value)}
                              className="flex-1"
                            />
                            <Select value={offerDuration} onValueChange={setOfferDuration}>
                              <SelectTrigger className="w-20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1d</SelectItem>
                                <SelectItem value="3">3d</SelectItem>
                                <SelectItem value="7">7d</SelectItem>
                                <SelectItem value="14">14d</SelectItem>
                                <SelectItem value="30">30d</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Properties */}
                  {nft.traits && Object.keys(nft.traits).length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Gem className="h-4 w-4" />
                        Properties
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(nft.traits).map(([key, value]) => (
                          <Card key={key} className="hover:bg-muted/50 transition-colors">
                            <CardContent className="p-3">
                              <p className="text-xs text-muted-foreground mb-1">{key}</p>
                              <p className="font-medium text-sm">{value}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {Math.floor(Math.random() * 30 + 5)}% rarity
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Activity */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Recent Activity
                    </h3>
                    <div className="space-y-3">
                      {MOCK_ACTIVITY.slice(0, 4).map((activity) => (
                        <Card key={activity.id} className="hover:bg-muted/50 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div
                                  className={cn(
                                    "h-8 w-8 rounded-full flex items-center justify-center",
                                    activity.type === "sale"
                                      ? "bg-green-500/10 text-green-500"
                                      : activity.type === "offer"
                                      ? "bg-blue-500/10 text-blue-500"
                                      : activity.type === "list"
                                      ? "bg-purple-500/10 text-purple-500"
                                      : "bg-orange-500/10 text-orange-500"
                                  )}
                                >
                                  {activity.type === "sale" ? (
                                    <ShoppingCart className="h-4 w-4" />
                                  ) : activity.type === "offer" ? (
                                    <Tag className="h-4 w-4" />
                                  ) : activity.type === "list" ? (
                                    <ArrowUpRight className="h-4 w-4" />
                                  ) : (
                                    <ArrowRight className="h-4 w-4" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium text-sm capitalize">{activity.type}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {activity.from}
                                    {activity.to && ` → ${activity.to}`}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                {activity.price && (
                                  <p className="font-semibold text-sm">{activity.price} ETH</p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  {new Date(activity.timestamp).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
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
              I agree to terms and understand transactions are final
            </Label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {canBuy ? (
              <>
                <Button
                  size="lg"
                  className="flex-1 gap-2 h-12"
                  onClick={handleBuyNow}
                  disabled={!agreedToTerms || !account}
                >
                  <Zap className="h-4 w-4" />
                  Buy • {nft.price} ETH
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 w-12 p-0"
                  onClick={() => alert("Please scroll up to enter your offer amount")}
                >
                  <Tag className="h-4 w-4" />
                </Button>
              </>
            ) : !isOwner ? (
              <Button
                size="lg"
                className="flex-1 gap-2 h-12"
                onClick={handleMakeOffer}
                disabled={!agreedToTerms || !numericOffer || !account}
              >
                <Tag className="h-4 w-4" />
                Offer • {numericOffer || 0} ETH
              </Button>
            ) : (
              <Button size="lg" variant="outline" className="flex-1 h-12" disabled>
                You own this NFT
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
                  src={nft.image}
                  alt={nft.name}
                  className="w-full h-full object-contain transition-all duration-300 group-hover:scale-105"
                />
                
                {/* Rarity Glow Effect */}
                {nft.rarity && ["Legendary", "Mythic", "Epic"].includes(nft.rarity) && (
                  <div
                    className="absolute inset-0 pointer-events-none opacity-30"
                    style={{
                      background: `radial-gradient(circle at center, transparent 40%, ${
                        nft.rarity === "Mythic"
                          ? "rgba(168, 85, 247, 0.3)"
                          : nft.rarity === "Legendary"
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
                  {nft.new && (
                    <Badge className="bg-green-500/90 text-white backdrop-blur-sm">
                      <Sparkles className="h-3 w-3 mr-1" />
                      New
                    </Badge>
                  )}
                  {nft.auction && (
                    <Badge className="bg-orange-500/90 text-white backdrop-blur-sm">
                      <Timer className="h-3 w-3 mr-1" />
                      Live Auction
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
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-9 w-9 p-0 bg-black/50 backdrop-blur-sm border-white/20 hover:bg-black/70"
                  >
                    <Flag className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Bottom Controls */}
              <div className="absolute bottom-6 left-6 right-6 flex justify-between">
                <div className="flex gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="gap-2 bg-black/50 backdrop-blur-sm border-white/20 hover:bg-black/70"
                        >
                          <Download className="h-4 w-4" />
                          Save
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Download image</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
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

          {/* Carousel */}
          <div className="h-32 p-8 pt-4 border-t border-white/10">
            <div className="h-full">
              <h3 className="text-white text-sm font-medium mb-3">More from this collection</h3>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide h-20">
                {MOCK_MORE_FROM_COLLECTION.slice(0, 8).map((item, index) => (
                  <div
                    key={item.id}
                    className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-white/5 border border-white/10 hover:border-white/20 cursor-pointer transition-all duration-200 hover:scale-105 group"
                  >
                    <MediaRenderer
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                ))}
                <div className="flex-shrink-0 w-16 h-16 rounded-lg border border-white/20 border-dashed flex items-center justify-center text-white/50 hover:text-white/70 hover:border-white/30 cursor-pointer transition-all duration-200">
                  <ChevronRight className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>
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
                <h1 className="text-3xl font-bold">{nft.name}</h1>
                {nft.rarity && (
                  <Badge className={cn("text-sm bg-gradient-to-r text-white px-3 py-1", getRarityColor(nft.rarity))}>
                    <Crown className="h-3 w-3 mr-1" />
                    {nft.rarity}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-6 mb-6">
                <Link
                  href={`/collection/${nft.collection}`}
                  className="text-lg text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors"
                >
                  {nft.collection}
                  <Verified className="h-5 w-5 text-primary" />
                </Link>
                {nft.rank && (
                  <Badge variant="outline" className="gap-2 px-3 py-1">
                    <Hash className="h-4 w-4" />
                    Rank #{nft.rank}
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
                        <span className="font-medium">{(nft.views || 0).toLocaleString()}</span>
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
                        <span className="font-medium">{(nft.likes || 0).toLocaleString()}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Favorites</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">{MOCK_COLLECTION_STATS.owners.toLocaleString()} owners</span>
                </div>
              </div>
            </div>
          </div>


          {/* Tabbed Content */}
          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="px-8 py-4 border-b">
                <TabsList className="grid grid-cols-3 w-full h-11">
                  <TabsTrigger value="overview" className="gap-2">
                    <Grid3X3 className="h-4 w-4" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="properties" className="gap-2">
                    <Gem className="h-4 w-4" />
                    Properties
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="gap-2">
                    <Activity className="h-4 w-4" />
                    Activity
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
                          {nft.price ? (
                            <div>
                              <div className="flex items-center justify-between mb-4">
                                <p className="text-sm font-medium text-muted-foreground">Current Price</p>
                                <Badge variant="secondary" className="gap-1">
                                  {MOCK_COLLECTION_STATS.floorChange24h > 0 ? (
                                    <TrendingUp className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <TrendingDownIcon className="h-3 w-3 text-red-500" />
                                  )}
                                  {Math.abs(MOCK_COLLECTION_STATS.floorChange24h)}% 24h
                                </Badge>
                              </div>
                              
                              <div className="flex items-baseline gap-4 mb-6">
                                <PriceTicker basePrice={nft.price} />
                                <span className="text-xl text-muted-foreground">
                                  ${(nft.price * 2650).toLocaleString()}
                                </span>
                              </div>

                              {/* Market Context */}
                              <div className="grid grid-cols-3 gap-6">
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Floor Price</p>
                                  <p className="text-lg font-semibold">{MOCK_COLLECTION_STATS.floorPrice} ETH</p>
                                  <p className="text-xs text-muted-foreground">
                                    {((nft.price / MOCK_COLLECTION_STATS.floorPrice - 1) * 100).toFixed(1)}% above floor
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Last Sale</p>
                                  <p className="text-lg font-semibold">{nft.lastSale || "—"}</p>
                                  {nft.lastSale && (
                                    <p className="text-xs text-muted-foreground">
                                      {((nft.price / nft.lastSale - 1) * 100).toFixed(1)}% vs last
                                    </p>
                                  )}
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Top Bid</p>
                                  <p className="text-lg font-semibold">{nft.topBid || "No bids"}</p>
                                  {nft.topBid && (
                                    <p className="text-xs text-muted-foreground">
                                      {((nft.price / nft.topBid - 1) * 100).toFixed(1)}% above bid
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-6">
                              <h3 className="text-xl font-semibold mb-2">Not Currently Listed</h3>
                              <p className="text-muted-foreground mb-6">Make an offer to acquire this NFT</p>
                              
                              <div className="flex gap-3 max-w-md mx-auto">
                                <Input
                                  type="number"
                                  placeholder="Enter offer amount (ETH)"
                                  value={offerAmount}
                                  onChange={(e) => setOfferAmount(e.target.value)}
                                  className="flex-1 h-11"
                                />
                                <Select value={offerDuration} onValueChange={setOfferDuration}>
                                  <SelectTrigger className="w-32 h-11">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1">1 Day</SelectItem>
                                    <SelectItem value="3">3 Days</SelectItem>
                                    <SelectItem value="7">1 Week</SelectItem>
                                    <SelectItem value="14">2 Weeks</SelectItem>
                                    <SelectItem value="30">1 Month</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              {numericOffer > 0 && (
                                <div className="mt-4 space-y-2">
                                  <p className="text-sm text-muted-foreground">
                                    ≈ ${(numericOffer * 2650).toLocaleString()} USD
                                  </p>
                                  {MOCK_COLLECTION_STATS.floorPrice && (
                                    <p className="text-sm">
                                      {((numericOffer / MOCK_COLLECTION_STATS.floorPrice - 1) * 100).toFixed(1)}%{" "}
                                      <span className={numericOffer > MOCK_COLLECTION_STATS.floorPrice ? "text-green-500" : "text-red-500"}>
                                        {numericOffer > MOCK_COLLECTION_STATS.floorPrice ? "above" : "below"} floor
                                      </span>
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Collection Stats */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Collection Overview
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Floor Price</p>
                              <p className="text-xl font-bold">{MOCK_COLLECTION_STATS.floorPrice} ETH</p>
                              <p className="text-sm text-muted-foreground">
                                ${(MOCK_COLLECTION_STATS.floorPrice * 2650).toFixed(0)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Volume (24h)</p>
                              <p className="text-xl font-bold">{MOCK_COLLECTION_STATS.volume24h} ETH</p>
                              <p className="text-sm text-muted-foreground">
                                {((MOCK_COLLECTION_STATS.volume24h / MOCK_COLLECTION_STATS.volume7d) * 100).toFixed(1)}% of 7d vol
                              </p>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Listed Items</p>
                              <p className="text-xl font-bold">
                                {MOCK_COLLECTION_STATS.listedCount} / {MOCK_COLLECTION_STATS.totalSupply.toLocaleString()}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {((MOCK_COLLECTION_STATS.listedCount / MOCK_COLLECTION_STATS.totalSupply) * 100).toFixed(1)}% listed
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Unique Owners</p>
                              <p className="text-xl font-bold">{MOCK_COLLECTION_STATS.owners.toLocaleString()}</p>
                              <p className="text-sm text-muted-foreground">
                                {MOCK_COLLECTION_STATS.uniqueOwners}% unique ownership
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Owner Information */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Owner Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-12 w-12">
                                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-bold">
                                  {nft.owner ? nft.owner.slice(2, 4).toUpperCase() : "UN"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold">Owner</p>
                                <p className="text-sm text-muted-foreground font-mono">
                                  {nft.owner
                                    ? `${nft.owner.substring(0, 6)}...${nft.owner.substring(38)}`
                                    : "0x1234...5678"}
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
                                          nft.owner || "0x1234567890123456789012345678901234567890",
                                          "owner"
                                        )
                                      }
                                    >
                                      {copied === "owner" ? (
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

                      {/* Transaction Confidence */}
                      {canBuy && (
                        <TransactionConfidenceMeter
                          nft={{
                            ...nft,
                            rarity: nft.rarity || 'Common'
                          }}
                          mode="buy"
                          offerAmount={nft.price!}
                        />
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
                                    {nft.contractAddress
                                      ? `${nft.contractAddress.substring(0, 6)}...${nft.contractAddress.substring(38)}`
                                      : "0x1234...5678"}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() =>
                                      copyAddress(
                                        nft.contractAddress || "0x1234567890123456789012345678901234567890",
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
                                <span className="font-mono">{nft.tokenId || "#1234"}</span>
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
                                <span>{nft.royalty || 5}%</span>
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
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="properties" className="h-full m-0">
                  <ScrollArea className="h-full">
                    <div className="p-8">
                      {nft.traits && Object.keys(nft.traits).length > 0 ? (
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(nft.traits).map(([key, value], index) => (
                            <motion.div
                              key={key}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer">
                                <CardContent className="p-6">
                                  <div className="text-center">
                                    <p className="text-sm font-medium text-muted-foreground mb-2">{key}</p>
                                    <p className="text-lg font-bold mb-2">{value}</p>
                                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                      <Percent className="h-3 w-3" />
                                      <span>{Math.floor(Math.random() * 30 + 5)}% rarity</span>
                                    </div>
                                    <div className="mt-2 text-xs text-muted-foreground">
                                      {Math.floor(Math.random() * 1000 + 100)} items
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <Card>
                          <CardContent className="p-12 text-center">
                            <Gem className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                            <h3 className="text-xl font-semibold mb-2">No Properties Available</h3>
                            <p className="text-muted-foreground">
                              This NFT doesn't have specific trait properties defined.
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="activity" className="h-full m-0">
                  <ScrollArea className="h-full">
                    <div className="p-8 space-y-4">
                      {MOCK_ACTIVITY.map((activity, index) => (
                        <motion.div
                          key={activity.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Card className="hover:shadow-md transition-all duration-200">
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div
                                    className={cn(
                                      "h-12 w-12 rounded-xl flex items-center justify-center",
                                      activity.type === "sale"
                                        ? "bg-green-500/10 text-green-500"
                                        : activity.type === "offer"
                                        ? "bg-blue-500/10 text-blue-500"
                                        : activity.type === "list"
                                        ? "bg-purple-500/10 text-purple-500"
                                        : activity.type === "transfer"
                                        ? "bg-orange-500/10 text-orange-500"
                                        : "bg-gray-500/10 text-gray-500"
                                    )}
                                  >
                                    {activity.type === "sale" ? (
                                      <ShoppingCart className="h-6 w-6" />
                                    ) : activity.type === "offer" ? (
                                      <Tag className="h-6 w-6" />
                                    ) : activity.type === "list" ? (
                                      <ArrowUpRight className="h-6 w-6" />
                                    ) : activity.type === "transfer" ? (
                                      <ArrowRight className="h-6 w-6" />
                                    ) : (
                                      <Plus className="h-6 w-6" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-semibold capitalize text-lg">{activity.type}</p>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <span className="font-mono">{activity.from}</span>
                                      {activity.to && (
                                        <>
                                          <ArrowRight className="h-3 w-3" />
                                          <span className="font-mono">{activity.to}</span>
                                        </>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {new Date(activity.timestamp).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  {activity.price && (
                                    <p className="text-xl font-bold">{activity.price} ETH</p>
                                  )}
                                  {activity.txHash && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="mt-2 gap-2 text-xs"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                      View Transaction
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
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
                        <span className="text-muted-foreground">Item price</span>
                        <span>{nft.price} ETH</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Marketplace fee (2.5%)</span>
                        <span>{fees.marketplaceFee.toFixed(4)} ETH</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Creator royalty ({nft.royalty || 5}%)</span>
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
                    I agree to the{" "}
                    <Link href="/terms" className="text-primary underline">
                      Terms of Service
                    </Link>{" "}
                    and understand that NFT transactions are final and irreversible
                  </Label>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                {canBuy ? (
                  <>
                    <Button
                      size="lg"
                      className="flex-1 gap-2 h-12 text-base font-semibold"
                      onClick={handleBuyNow}
                      disabled={!agreedToTerms || !account}
                    >
                      <Zap className="h-5 w-5" />
                      Buy Now • {nft.price} ETH
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="flex-1 gap-2 h-12 text-base font-semibold"
                      onClick={() => alert("Please enter your offer amount above in the price section")}
                    >
                      <Tag className="h-5 w-5" />
                      Make Offer
                    </Button>
                  </>
                ) : !isOwner ? (
                  <Button
                    size="lg"
                    className="flex-1 gap-2 h-12 text-base font-semibold"
                    onClick={handleMakeOffer}
                    disabled={!agreedToTerms || !numericOffer || !account}
                  >
                    <Tag className="h-5 w-5" />
                    Submit Offer • {numericOffer || 0} ETH
                  </Button>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-center">
                      <Crown className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="font-semibold">You own this NFT</p>
                      <p className="text-sm text-muted-foreground">Manage it from your profile</p>
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
              key="nft-modal"
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
              src={nft?.image}
              alt={nft?.name}
              className="max-w-[95vw] max-h-[95vh] object-contain rounded-lg"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}