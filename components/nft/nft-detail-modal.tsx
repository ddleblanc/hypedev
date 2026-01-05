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
  DialogDescription,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
import { cn, formatRelativeTime } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";
import { makeNFTOffer, buyNFT } from "@/lib/marketplace-actions";
import { useToast } from "@/hooks/use-toast";
import { NFTPriceChart } from "@/components/charts/nft-price-chart";
import { NFTProvenance } from "@/components/nft/nft-provenance";
import { NFTOffersPanel } from "@/components/nft/nft-offers-panel";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { acceptNftOffer, acceptCollectionOffer } from "@/lib/marketplace";

export interface NFTDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nft: {
    id: string;
    name: string;
    image: string;
    description?: string;
    price?: number;
    lastSale?: number;
    rarity?: string;
    collection: string;
    collectionId?: string;
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

// Activity item type from NFT-specific tRPC response
interface ActivityItem {
  id: string;
  type: 'sale' | 'listing' | 'offer' | 'transfer' | 'mint' | 'bid' | 'cancel';
  price: number | null;
  currency: string;
  from: string | null;
  to: string | null;
  timestamp: Date;
  transactionHash: string | null;
  fromUser?: {
    username: string | null;
    avatar: string | null;
    address: string | null;
  };
  toUser?: {
    username: string | null;
    avatar: string | null;
    address: string | null;
  };
}

// Type for related NFTs from collection
interface RelatedNFT {
  id: string;
  dbId: string;
  name: string;
  image: string | null;
  rarity: string | null;
  rank: number | null;
  price: string;
  owner: string | null;
  isListed: boolean;
  listingPrice: number | null;
}

export function NFTDetailModal({ open, onOpenChange, nft }: NFTDetailModalProps) {
  const account = useActiveAccount();
  const { startTransaction, updateStep, completeTransaction, setError, setTxHash } = useTransaction();
  const { toast } = useToast();

  // State management
  const [activeTab, setActiveTab] = useState("overview");
  const [offerAmount, setOfferAmount] = useState("");
  const [offerDuration, setOfferDuration] = useState("7");
  const [quantity, setQuantity] = useState(1);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [copied, setCopied] = useState("");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState<"image" | "details">("details");
  const [imageZoom, setImageZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  // Social features state
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Offers state
  const [acceptingOfferId, setAcceptingOfferId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  
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

  // Fetch real collection stats from tRPC
  const { data: collectionStatsData } = trpc.marketplace.collections.stats.useQuery(
    {
      collectionId: nft?.collectionId || "",
      contractAddress: nft?.contractAddress
    },
    {
      enabled: open && !!nft?.collectionId,
      staleTime: 60000 // 1 minute
    }
  );

  // Fetch NFT-specific activity data (not collection activity)
  const { data: activityData, isLoading: isLoadingActivity } = trpc.marketplace.nft.activity.useQuery(
    {
      nftId: nft?.id || "",
      limit: 20
    },
    {
      enabled: open && !!nft?.id,
      staleTime: 30000 // 30 seconds
    }
  );

  // Fetch last sale details
  const { data: lastSaleData } = trpc.marketplace.nft.lastSale.useQuery(
    { nftId: nft?.id || "" },
    { enabled: open && !!nft?.id }
  );

  // Fetch real trait rarity data
  const { data: traitRarityData, isLoading: isLoadingTraits } = trpc.marketplace.nft.traitRarity.useQuery(
    { nftId: nft?.id || "" },
    {
      enabled: open && !!nft?.id,
      staleTime: 300000 // 5 minutes - trait rarity doesn't change often
    }
  );

  // Fetch price history for chart
  const { data: priceHistoryData, isLoading: isLoadingPriceHistory } = trpc.marketplace.nft.priceHistory.useQuery(
    { nftId: nft?.id || "" },
    {
      enabled: open && !!nft?.id,
      staleTime: 60000 // 1 minute
    }
  );

  // Fetch ownership history/provenance
  const { data: provenanceData, isLoading: isLoadingProvenance } = trpc.marketplace.nft.provenance.useQuery(
    { nftId: nft?.id || "" },
    {
      enabled: open && !!nft?.id,
      staleTime: 60000 // 1 minute
    }
  );

  // Fetch all active offers for this NFT
  const { data: offersData, isLoading: isLoadingOffers, refetch: refetchOffers } = trpc.marketplace.nft.offers.useQuery(
    { nftId: nft?.id || "", includeCollectionOffers: true, includeTraitOffers: true },
    {
      enabled: open && !!nft?.id,
      staleTime: 30000 // 30 seconds - offers can change frequently
    }
  );

  // Fetch the best offer for this NFT (used in Top Bid display)
  const { data: bestOfferData } = trpc.marketplace.nft.bestOffer.useQuery(
    { nftId: nft?.id || "" },
    {
      enabled: open && !!nft?.id,
      staleTime: 30000 // 30 seconds
    }
  );

  // Fetch favorite status
  const { data: favoriteData, refetch: refetchFavorite } = trpc.user.favorites.check.useQuery(
    { nftId: nft?.id || "" },
    { enabled: open && !!nft?.id && !!account }
  );

  // Toggle favorite mutation
  const toggleFavoriteMutation = trpc.user.favorites.toggle.useMutation({
    onSuccess: () => refetchFavorite(),
  });

  // Report mutation
  const createReportMutation = trpc.user.reports.create.useMutation();

  // Fetch related NFTs from collection
  const { data: relatedNftsData, isLoading: isLoadingRelated } = trpc.marketplace.collections.nfts.useQuery(
    {
      collectionId: nft?.collectionId || "",
      limit: 12,
      page: 1
    },
    {
      enabled: open && !!nft?.collectionId,
      staleTime: 60000 // 1 minute
    }
  );

  // Filter out current NFT and limit to 8 items for carousel
  const relatedNfts: RelatedNFT[] = (relatedNftsData?.nfts || [])
    .filter((item) => item.id !== nft?.id && item.id !== nft?.tokenId)
    .slice(0, 8);

  // Create fallback stats when data is not available
  const collectionStats = collectionStatsData || {
    floorPrice: nft?.floorPrice || 0,
    volume24h: 0,
    volume7d: 0,
    holders: 0,
    totalSupply: 0,
    listedCount: 0,
    listedPercentage: 0,
    mintedSupply: 0,
    sales24h: 0,
    sales7d: 0,
    avgPrice24h: null,
    floorChange24h: null,
    floorChange7d: null,
    totalVolumeETH: 0,
  };

  // Transform activity data to component-expected format
  const activityItems: ActivityItem[] = activityData?.items || [];

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

    // NFT must have a listing to buy - check for listingId
    // For now, we'll show an error if there's no listingId
    // In a real scenario, the NFT should have listingId from the marketplace
    const listingId = (nft as { listingId?: string }).listingId;

    if (!listingId) {
      toast({
        title: "Cannot complete purchase",
        description: "This NFT doesn't have a valid listing ID",
        variant: "destructive"
      });
      return;
    }

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

    try {
      updateStep("approve", 40);

      const result = await buyNFT(
        {
          listingId,
          nftId: nft.id,
          quantity: 1,
        },
        account
      );

      if (!result.success) {
        throw new Error(result.error || "Purchase failed");
      }

      updateStep("pending", 80);
      setTxHash(result.transactionHash!);

      completeTransaction();
      toast({ title: "Purchase successful!" });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Transaction failed. Please try again.";
      setError(errorMessage);
      toast({ title: errorMessage, variant: "destructive" });
    }
  };

  const handleMakeOffer = async () => {
    if (!numericOffer || !account) return;

    if (!nft.contractAddress || !nft.tokenId) {
      toast({
        title: "Missing NFT information",
        description: "Cannot make offer without contract address and token ID",
        variant: "destructive"
      });
      return;
    }

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

    try {
      updateStep("approve", 40);

      const result = await makeNFTOffer(
        {
          nftId: nft.id,
          contractAddress: nft.contractAddress,
          tokenId: nft.tokenId,
          offerAmount: offerAmount,
          durationDays: parseInt(offerDuration),
        },
        account
      );

      if (!result.success) {
        throw new Error(result.error || "Failed to submit offer");
      }

      updateStep("pending", 80);
      setTxHash(result.transactionHash!);

      completeTransaction();
      toast({ title: "Offer submitted successfully!" });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to submit offer. Please try again.";
      setError(errorMessage);
      toast({ title: errorMessage, variant: "destructive" });
    }
  };

  // Handle accepting an offer (for NFT owner)
  const handleAcceptOffer = async (offerId: string, isCollectionOffer: boolean) => {
    if (!account || !nft) return;

    if (!nft.contractAddress || !nft.tokenId) {
      toast({
        title: "Missing NFT information",
        description: "Cannot accept offer without contract address and token ID",
        variant: "destructive"
      });
      return;
    }

    setAcceptingOfferId(offerId);

    const offer = offersData?.find(o => o.offerId === offerId);
    const transactionNFT: TransactionNFT = {
      id: nft.id,
      name: nft.name,
      image: nft.image,
      price: offer?.amount || 0,
      collection: nft.collection,
      contractAddress: nft.contractAddress,
      tokenId: nft.tokenId,
    };

    startTransaction(transactionNFT, "offer", offer?.amount || 0);

    try {
      updateStep("approve", 40);

      let result: { transactionHash: string };

      if (isCollectionOffer) {
        result = await acceptCollectionOffer(offerId, nft.tokenId, account);
      } else {
        result = await acceptNftOffer(offerId, account);
      }

      updateStep("pending", 80);
      setTxHash(result.transactionHash);

      completeTransaction();
      toast({ title: "Offer accepted! NFT sold successfully." });

      // Refresh offers list
      refetchOffers();

      // Close modal after successful sale
      onOpenChange(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to accept offer. Please try again.";
      setError(errorMessage);
      toast({ title: errorMessage, variant: "destructive" });
    } finally {
      setAcceptingOfferId(null);
    }
  };

  // =========================================================================
  // Social Features Handlers
  // =========================================================================

  // Get block explorer URL based on chain
  const getExplorerUrl = (chainId: number = 11155111) => {
    const explorers: Record<number, string> = {
      1: "https://etherscan.io",
      11155111: "https://sepolia.etherscan.io",
      137: "https://polygonscan.com",
      8453: "https://basescan.org",
      42161: "https://arbiscan.io",
      10: "https://optimistic.etherscan.io",
    };
    return explorers[chainId] || explorers[1];
  };

  const explorerUrl = getExplorerUrl(11155111); // Default to Sepolia for now

  // Share functionality
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/nft/${nft?.contractAddress}/${nft?.tokenId}`;
    const shareData = {
      title: `${nft?.name} | ${nft?.collection}`,
      text: `Check out ${nft?.name} on HPX Marketplace`,
      url: shareUrl,
    };

    // Try native share API first (mobile)
    if (typeof navigator !== "undefined" && navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // User cancelled or error, fall back to modal
      }
    }

    // Fall back to share modal
    setShowShareModal(true);
  };

  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}/nft/${nft?.contractAddress}/${nft?.tokenId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied("share");
    setTimeout(() => setCopied(""), 2000);
  };

  // Download functionality
  const handleDownload = async () => {
    if (!nft?.image) return;

    try {
      // For IPFS or external URLs, fetch and download
      const response = await fetch(nft.image);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${nft.name || "nft"}-${nft.tokenId || "image"}.${blob.type.split("/")[1] || "png"}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({ title: "Image downloaded successfully!" });
    } catch (error) {
      console.error("Failed to download:", error);
      // Fallback: open in new tab
      window.open(nft.image, "_blank");
    }
  };

  // Toggle favorite
  const isFavorited = favoriteData?.favorited || false;

  const handleToggleFavorite = () => {
    if (!account || !nft?.id) {
      toast({ title: "Please connect your wallet to favorite items", variant: "destructive" });
      return;
    }
    toggleFavoriteMutation.mutate({ nftId: nft.id });
  };

  // Submit report
  const handleSubmitReport = async () => {
    if (!reportReason || !nft?.id) return;

    setIsSubmittingReport(true);
    try {
      await createReportMutation.mutateAsync({
        type: "nft",
        targetId: nft.id,
        contractAddress: nft.contractAddress,
        tokenId: nft.tokenId,
        reason: reportReason as "stolen" | "copyright" | "explicit" | "spam" | "other",
        details: reportDetails || undefined,
      });

      setShowReportModal(false);
      setReportReason("");
      setReportDetails("");
      toast({ title: "Report submitted. Thank you for helping keep the marketplace safe." });
    } catch (error) {
      console.error("Failed to submit report:", error);
      toast({ title: "Failed to submit report. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Open metadata URL
  const handleViewMetadata = () => {
    if (!nft) return;

    let metadataUrl = (nft as { metadataUri?: string }).metadataUri;

    if (metadataUrl) {
      // Convert IPFS URI to HTTP gateway URL
      if (metadataUrl.startsWith("ipfs://")) {
        metadataUrl = metadataUrl.replace("ipfs://", "https://ipfs.io/ipfs/");
      }
      window.open(metadataUrl, "_blank");
    } else {
      toast({ title: "Metadata URI not available", variant: "destructive" });
    }
  };

  // Share Modal Component
  const ShareModal = () => (
    <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share this NFT</DialogTitle>
          <DialogDescription>
            Share {nft?.name} with your friends and followers
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Copy Link */}
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={`${typeof window !== "undefined" ? window.location.origin : ""}/nft/${nft?.contractAddress}/${nft?.tokenId}`}
              className="flex-1 text-sm"
            />
            <Button onClick={copyShareLink} size="sm">
              {copied === "share" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          {/* Social Share Buttons */}
          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={() => {
                const url = encodeURIComponent(`${window.location.origin}/nft/${nft?.contractAddress}/${nft?.tokenId}`);
                const text = encodeURIComponent(`Check out ${nft?.name} on HPX Marketplace`);
                window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, "_blank");
              }}
            >
              <Twitter className="h-5 w-5 mr-2" />
              Twitter
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={() => {
                const url = encodeURIComponent(`${window.location.origin}/nft/${nft?.contractAddress}/${nft?.tokenId}`);
                window.open(`https://t.me/share/url?url=${url}&text=${encodeURIComponent(nft?.name || "")}`, "_blank");
              }}
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              Telegram
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Report Modal Component
  const ReportModal = () => (
    <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report this NFT</DialogTitle>
          <DialogDescription>
            Help us maintain a safe marketplace by reporting issues.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Reason for report</Label>
            <Select value={reportReason} onValueChange={setReportReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stolen">Stolen artwork</SelectItem>
                <SelectItem value="copyright">Copyright infringement</SelectItem>
                <SelectItem value="explicit">Explicit content</SelectItem>
                <SelectItem value="spam">Spam or scam</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Additional details (optional)</Label>
            <Textarea
              placeholder="Provide any additional context..."
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowReportModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReport}
              disabled={!reportReason || isSubmittingReport}
            >
              {isSubmittingReport && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Report
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

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
            onClick={handleToggleFavorite}
            className="text-white hover:bg-white/10"
          >
            <Heart className={cn("h-5 w-5", isFavorited && "fill-red-500 text-red-500")} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
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
                        href={`/collection/${nft.contractAddress || nft.collectionId || nft.collection}`}
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
                              <p className="font-semibold">{collectionStats.floorPrice} ETH</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Last Sale</p>
                              <p className="font-semibold">
                                {lastSaleData ? `${lastSaleData.price} ${lastSaleData.currency}` : nft.lastSale || "—"}
                              </p>
                              {lastSaleData && (
                                <p className="text-[10px] text-muted-foreground">
                                  {new Date(lastSaleData.timestamp).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Top Bid</p>
                              <p className="font-semibold">
                                {bestOfferData ? `${bestOfferData.amount} ${bestOfferData.currency}` : "—"}
                              </p>
                            </div>
                          </div>

                          {/* Mini Price Sparkline for Mobile */}
                          {priceHistoryData?.events && priceHistoryData.events.length > 1 && (
                            <div className="mt-4">
                              <p className="text-xs text-muted-foreground mb-2">Price History</p>
                              <div className="h-16 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={priceHistoryData.events.map(e => ({
                                    date: new Date(e.timestamp).getTime(),
                                    price: e.price
                                  }))}>
                                    <Line
                                      type="monotone"
                                      dataKey="price"
                                      stroke="hsl(var(--primary))"
                                      strokeWidth={2}
                                      dot={false}
                                    />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          )}
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
                  {(traitRarityData && traitRarityData.length > 0) || (nft.traits && Object.keys(nft.traits).length > 0) ? (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Gem className="h-4 w-4" />
                        Properties
                      </h3>
                      {isLoadingTraits ? (
                        <div className="grid grid-cols-2 gap-2">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <Card key={i} className="animate-pulse">
                              <CardContent className="p-3">
                                <div className="h-3 bg-muted rounded w-12 mb-1" />
                                <div className="h-4 bg-muted rounded w-16" />
                                <div className="h-2 bg-muted rounded w-10 mt-1" />
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : traitRarityData && traitRarityData.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {traitRarityData.map((trait) => (
                            <Card key={`${trait.traitType}-${trait.value}`} className="hover:bg-muted/50 transition-colors">
                              <CardContent className="p-3">
                                <p className="text-xs text-muted-foreground mb-1">{trait.traitType}</p>
                                <p className="font-medium text-sm">{trait.value}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {trait.percentage}% ({trait.count.toLocaleString()} items)
                                </p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : nft.traits ? (
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(nft.traits).map(([key, value]) => (
                            <Card key={key} className="hover:bg-muted/50 transition-colors">
                              <CardContent className="p-3">
                                <p className="text-xs text-muted-foreground mb-1">{key}</p>
                                <p className="font-medium text-sm">{value}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  —
                                </p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {/* Recent Activity */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Recent Activity
                    </h3>
                    <div className="space-y-3">
                      {activityItems.slice(0, 4).map((activity) => (
                        <Card key={activity.id} className="hover:bg-muted/50 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div
                                  className={cn(
                                    "h-8 w-8 rounded-full flex items-center justify-center",
                                    activity.type === "sale"
                                      ? "bg-green-500/10 text-green-500"
                                      : activity.type === "offer" || activity.type === "bid"
                                      ? "bg-blue-500/10 text-blue-500"
                                      : activity.type === "listing"
                                      ? "bg-purple-500/10 text-purple-500"
                                      : activity.type === "transfer"
                                      ? "bg-orange-500/10 text-orange-500"
                                      : activity.type === "cancel"
                                      ? "bg-red-500/10 text-red-500"
                                      : "bg-gray-500/10 text-gray-500"
                                  )}
                                >
                                  {activity.type === "sale" ? (
                                    <ShoppingCart className="h-4 w-4" />
                                  ) : activity.type === "offer" || activity.type === "bid" ? (
                                    <Tag className="h-4 w-4" />
                                  ) : activity.type === "listing" ? (
                                    <ArrowUpRight className="h-4 w-4" />
                                  ) : activity.type === "transfer" ? (
                                    <ArrowRight className="h-4 w-4" />
                                  ) : activity.type === "cancel" ? (
                                    <X className="h-4 w-4" />
                                  ) : (
                                    <Plus className="h-4 w-4" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium text-sm capitalize">{activity.type}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {activity.fromUser?.username || (activity.from ? `${activity.from.slice(0, 6)}...${activity.from.slice(-4)}` : "Unknown")}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                {activity.price && (
                                  <p className="font-semibold text-sm">{activity.price} {activity.currency}</p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  {new Date(activity.timestamp).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {activityItems.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
                      )}
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
                      handleToggleFavorite();
                    }}
                  >
                    <Heart className={cn("h-4 w-4", isFavorited && "fill-red-500 text-red-500")} />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-9 w-9 p-0 bg-black/50 backdrop-blur-sm border-white/20 hover:bg-black/70"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShare();
                    }}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-9 w-9 p-0 bg-black/50 backdrop-blur-sm border-white/20 hover:bg-black/70"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowReportModal(true);
                    }}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload();
                          }}
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
                {isLoadingRelated ? (
                  // Loading skeleton
                  Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={`skeleton-${i}`}
                      className="flex-shrink-0 w-16 h-16 rounded-lg bg-white/5 border border-white/10 animate-pulse"
                    />
                  ))
                ) : relatedNfts.length > 0 ? (
                  relatedNfts.map((item) => (
                    <div
                      key={item.id}
                      className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-white/5 border border-white/10 hover:border-white/20 cursor-pointer transition-all duration-200 hover:scale-105 group"
                    >
                      <MediaRenderer
                        src={item.image || ""}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>
                  ))
                ) : (
                  // Empty state
                  <div className="flex items-center justify-center text-white/40 text-sm">
                    No other NFTs in this collection
                  </div>
                )}
                {relatedNfts.length > 0 && (
                  <div className="flex-shrink-0 w-16 h-16 rounded-lg border border-white/20 border-dashed flex items-center justify-center text-white/50 hover:text-white/70 hover:border-white/30 cursor-pointer transition-all duration-200">
                    <ChevronRight className="h-5 w-5" />
                  </div>
                )}
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
                  href={`/collection/${nft.contractAddress || nft.collectionId || nft.collection}`}
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
                  <span className="font-medium">{collectionStats.holders.toLocaleString()} owners</span>
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
                  <TabsTrigger value="offers" className="gap-2 relative">
                    <DollarSign className="h-4 w-4" />
                    Offers
                    {offersData && offersData.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                        {offersData.length}
                      </Badge>
                    )}
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
                                  {(collectionStats.floorChange24h ?? 0) > 0 ? (
                                    <TrendingUp className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <TrendingDownIcon className="h-3 w-3 text-red-500" />
                                  )}
                                  {Math.abs(collectionStats.floorChange24h ?? 0)}% 24h
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
                                  <p className="text-lg font-semibold">{collectionStats.floorPrice ?? 0} ETH</p>
                                  <p className="text-xs text-muted-foreground">
                                    {collectionStats.floorPrice ? ((nft.price / collectionStats.floorPrice - 1) * 100).toFixed(1) : 0}% above floor
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Last Sale</p>
                                  <p className="text-lg font-semibold">
                                    {lastSaleData ? `${lastSaleData.price} ${lastSaleData.currency}` : nft.lastSale || "—"}
                                  </p>
                                  {lastSaleData ? (
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(lastSaleData.timestamp).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric"
                                      })}
                                      {lastSaleData.buyer && (
                                        <> • {lastSaleData.buyer.username || `${lastSaleData.buyer.address.slice(0, 6)}...`}</>
                                      )}
                                    </p>
                                  ) : nft.lastSale ? (
                                    <p className="text-xs text-muted-foreground">
                                      {((nft.price / nft.lastSale - 1) * 100).toFixed(1)}% vs last
                                    </p>
                                  ) : null}
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Top Bid</p>
                                  <p className="text-lg font-semibold">
                                    {bestOfferData ? `${bestOfferData.amount} ${bestOfferData.currency}` : "No bids"}
                                  </p>
                                  {bestOfferData && nft.price && (
                                    <p className="text-xs text-muted-foreground">
                                      {((nft.price / bestOfferData.amount - 1) * 100).toFixed(1)}% above bid
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
                                  {collectionStats.floorPrice && (
                                    <p className="text-sm">
                                      {((numericOffer / collectionStats.floorPrice - 1) * 100).toFixed(1)}%{" "}
                                      <span className={numericOffer > collectionStats.floorPrice ? "text-green-500" : "text-red-500"}>
                                        {numericOffer > collectionStats.floorPrice ? "above" : "below"} floor
                                      </span>
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Price History Chart */}
                      {(priceHistoryData?.events && priceHistoryData.events.length > 0) || isLoadingPriceHistory ? (
                        <NFTPriceChart
                          events={priceHistoryData?.events || []}
                          stats={priceHistoryData?.stats || {
                            avgPrice: 0,
                            minPrice: 0,
                            maxPrice: 0,
                            totalSales: 0,
                            firstSaleDate: null,
                            lastSaleDate: null,
                            priceChange: null,
                          }}
                          isLoading={isLoadingPriceHistory}
                          floorPrice={collectionStats.floorPrice}
                          currency="ETH"
                        />
                      ) : null}

                      {/* Description */}
                      {nft.description && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <FileText className="h-5 w-5" />
                              Description
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                              {nft.description}
                            </p>
                          </CardContent>
                        </Card>
                      )}

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
                              <p className="text-xl font-bold">{collectionStats.floorPrice ?? 0} ETH</p>
                              <p className="text-sm text-muted-foreground">
                                ${((collectionStats.floorPrice ?? 0) * 2650).toFixed(0)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Volume (24h)</p>
                              <p className="text-xl font-bold">{collectionStats.volume24h ?? 0} ETH</p>
                              <p className="text-sm text-muted-foreground">
                                {(((collectionStats.volume24h ?? 0) / (collectionStats.volume7d || 1)) * 100).toFixed(1)}% of 7d vol
                              </p>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Listed Items</p>
                              <p className="text-xl font-bold">
                                {collectionStats.listedCount} / {collectionStats.totalSupply.toLocaleString()}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {((collectionStats.listedCount / collectionStats.totalSupply) * 100).toFixed(1)}% listed
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Unique Owners</p>
                              <p className="text-xl font-bold">{collectionStats.holders.toLocaleString()}</p>
                              <p className="text-sm text-muted-foreground">
                                {collectionStats.totalSupply > 0 ? ((collectionStats.holders / collectionStats.totalSupply) * 100).toFixed(1) : 0}% unique ownership
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Ownership History / Provenance */}
                      <NFTProvenance
                        data={provenanceData || null}
                        isLoading={isLoadingProvenance}
                        chainId={11155111}
                      />

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
                                  <a
                                    href={`${explorerUrl}/address/${nft.contractAddress}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-mono text-xs hover:text-primary transition-colors"
                                  >
                                    {nft.contractAddress
                                      ? `${nft.contractAddress.substring(0, 6)}...${nft.contractAddress.substring(38)}`
                                      : "0x1234...5678"}
                                  </a>
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
                                  <a
                                    href={`${explorerUrl}/address/${nft.contractAddress}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="h-6 w-6 p-0 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </div>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Token ID</span>
                                <a
                                  href={`${explorerUrl}/nft/${nft.contractAddress}/${nft.tokenId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-mono hover:text-primary transition-colors"
                                >
                                  {nft.tokenId || "#1234"}
                                </a>
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
                                  onClick={handleViewMetadata}
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

                <TabsContent value="offers" className="h-full m-0">
                  <ScrollArea className="h-full">
                    <div className="p-8">
                      <NFTOffersPanel
                        offers={offersData || []}
                        isLoading={isLoadingOffers}
                        isOwner={!!isOwner}
                        floorPrice={collectionStats.floorPrice}
                        onAcceptOffer={handleAcceptOffer}
                        acceptingOfferId={acceptingOfferId}
                        chainId={11155111}
                      />
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="properties" className="h-full m-0">
                  <ScrollArea className="h-full">
                    <div className="p-8">
                      {isLoadingTraits ? (
                        <div className="grid grid-cols-2 gap-4">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <Card key={i} className="animate-pulse">
                              <CardContent className="p-6">
                                <div className="text-center space-y-2">
                                  <div className="h-4 bg-muted rounded w-20 mx-auto" />
                                  <div className="h-6 bg-muted rounded w-24 mx-auto" />
                                  <div className="h-3 bg-muted rounded w-16 mx-auto" />
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : traitRarityData && traitRarityData.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4">
                          {traitRarityData.map((trait, index) => (
                            <motion.div
                              key={`${trait.traitType}-${trait.value}`}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer">
                                <CardContent className="p-6">
                                  <div className="text-center">
                                    <p className="text-sm font-medium text-muted-foreground mb-2">{trait.traitType}</p>
                                    <p className="text-lg font-bold mb-2">{trait.value}</p>
                                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                      <Percent className="h-3 w-3" />
                                      <span>{trait.percentage}% rarity</span>
                                    </div>
                                    <div className="mt-2 text-xs text-muted-foreground">
                                      {trait.count.toLocaleString()} of {trait.totalSupply.toLocaleString()} items
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                        </div>
                      ) : nft.traits && Object.keys(nft.traits).length > 0 ? (
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
                                      <span>—</span>
                                    </div>
                                    <div className="mt-2 text-xs text-muted-foreground">
                                      Rarity data unavailable
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
                    <div className="p-6">
                      {activityItems.length > 0 ? (
                        <div className="rounded-lg border overflow-hidden">
                          {/* Table Header */}
                          <div className="grid grid-cols-[1fr_1fr_1.5fr_1.5fr_auto] gap-4 px-4 py-3 bg-muted/50 border-b text-sm font-medium text-muted-foreground">
                            <div>Event</div>
                            <div>Price</div>
                            <div>From</div>
                            <div>To</div>
                            <div className="text-right">Time</div>
                          </div>
                          {/* Table Rows */}
                          <div className="divide-y">
                            {activityItems.map((activity, index) => (
                              <motion.div
                                key={activity.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="grid grid-cols-[1fr_1fr_1.5fr_1.5fr_auto] gap-4 px-4 py-3 items-center hover:bg-muted/30 transition-colors"
                              >
                                {/* Event */}
                                <div className="flex items-center gap-2">
                                  <div
                                    className={cn(
                                      "h-8 w-8 rounded-lg flex items-center justify-center",
                                      activity.type === "sale"
                                        ? "bg-green-500/10 text-green-500"
                                        : activity.type === "offer" || activity.type === "bid"
                                        ? "bg-blue-500/10 text-blue-500"
                                        : activity.type === "listing"
                                        ? "bg-purple-500/10 text-purple-500"
                                        : activity.type === "transfer"
                                        ? "bg-orange-500/10 text-orange-500"
                                        : activity.type === "cancel"
                                        ? "bg-red-500/10 text-red-500"
                                        : "bg-gray-500/10 text-gray-500"
                                    )}
                                  >
                                    {activity.type === "sale" ? (
                                      <ShoppingCart className="h-4 w-4" />
                                    ) : activity.type === "offer" || activity.type === "bid" ? (
                                      <Tag className="h-4 w-4" />
                                    ) : activity.type === "listing" ? (
                                      <ArrowUpRight className="h-4 w-4" />
                                    ) : activity.type === "transfer" ? (
                                      <ArrowRight className="h-4 w-4" />
                                    ) : activity.type === "cancel" ? (
                                      <X className="h-4 w-4" />
                                    ) : (
                                      <Plus className="h-4 w-4" />
                                    )}
                                  </div>
                                  <span className="font-medium capitalize">{activity.type}</span>
                                </div>

                                {/* Price */}
                                <div>
                                  {activity.price ? (
                                    <span className="font-semibold">
                                      {activity.price} {activity.currency}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </div>

                                {/* From */}
                                <div className="flex items-center gap-2">
                                  {activity.fromUser?.avatar && (
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={activity.fromUser.avatar} />
                                      <AvatarFallback className="text-xs">
                                        {(activity.fromUser?.username || activity.from || "?").slice(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                  )}
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="font-mono text-sm truncate max-w-[120px] hover:text-primary cursor-pointer">
                                          {activity.fromUser?.username || (activity.from ? `${activity.from.slice(0, 6)}...${activity.from.slice(-4)}` : "—")}
                                        </span>
                                      </TooltipTrigger>
                                      {activity.from && (
                                        <TooltipContent>
                                          <p className="font-mono text-xs">{activity.from}</p>
                                        </TooltipContent>
                                      )}
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>

                                {/* To */}
                                <div className="flex items-center gap-2">
                                  {activity.toUser?.avatar && (
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={activity.toUser.avatar} />
                                      <AvatarFallback className="text-xs">
                                        {(activity.toUser?.username || activity.to || "?").slice(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                  )}
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="font-mono text-sm truncate max-w-[120px] hover:text-primary cursor-pointer">
                                          {activity.toUser?.username || (activity.to ? `${activity.to.slice(0, 6)}...${activity.to.slice(-4)}` : "—")}
                                        </span>
                                      </TooltipTrigger>
                                      {activity.to && (
                                        <TooltipContent>
                                          <p className="font-mono text-xs">{activity.to}</p>
                                        </TooltipContent>
                                      )}
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>

                                {/* Time */}
                                <div className="flex items-center gap-2 justify-end">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                                          {formatRelativeTime(activity.timestamp)}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="text-xs">
                                          {new Date(activity.timestamp).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  {activity.transactionHash && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <a
                                            href={`https://etherscan.io/tx/${activity.transactionHash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-muted-foreground hover:text-primary transition-colors"
                                          >
                                            <ExternalLink className="h-3.5 w-3.5" />
                                          </a>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p className="text-xs">View on Etherscan</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <Card>
                          <CardContent className="p-12 text-center">
                            <Activity className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                            <h3 className="text-xl font-semibold mb-2">No Activity Yet</h3>
                            <p className="text-muted-foreground">
                              Activity for this NFT will appear here once it has been minted, listed, sold, or transferred.
                            </p>
                          </CardContent>
                        </Card>
                      )}
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

      {/* Share and Report Modals */}
      <ShareModal />
      <ReportModal />
    </>
  );
}