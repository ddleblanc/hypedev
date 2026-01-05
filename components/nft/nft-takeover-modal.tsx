"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  MoreHorizontal,
  ExternalLink,
  Copy,
  Check,
  Tag,
  Clock,
  TrendingUp,
  Award,
  Zap,
  Diamond,
  DollarSign,
  FileText,
  Layers,
  Grid3X3,
  Globe,
  Link2,
  Timer,
  ShoppingCart,
  ArrowRightLeft,
  Gavel,
} from "lucide-react";
import { MediaRenderer } from "@/components/MediaRenderer";
import { cn } from "@/lib/utils";
import { CollectionItem } from "@/components/collection/types";
import { trpc } from "@/lib/trpc/client";
import { formatDistanceToNow } from "date-fns";

// Social Icons
const TwitterIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
    <path d="M9.14163 7.19284L13.6089 2H12.5503L8.67137 6.50887L5.57328 2H2L6.68492 8.81821L2 14.2637H3.05866L7.15491 9.50218L10.4267 14.2637H14L9.14163 7.19284ZM7.69165 8.87828L7.21697 8.19934L3.44011 2.79694H5.06615L8.11412 7.15685L8.5888 7.83579L12.5508 13.503H10.9248L7.69165 8.87828Z" />
  </svg>
);

const DiscordIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.5088 5.34C18.1708 4.714 16.7402 4.25905 15.2446 4C15.0609 4.33209 14.8463 4.77877 14.6983 5.1341C13.1084 4.89499 11.5331 4.89499 9.97243 5.1341C9.8245 4.77877 9.60503 4.33209 9.41971 4C7.92243 4.25905 6.49018 4.71567 5.15222 5.34331C2.45355 9.42136 1.72199 13.3981 2.08777 17.3184C3.87767 18.655 5.6123 19.467 7.31766 19.9984C7.73872 19.4189 8.11425 18.8028 8.43776 18.1536C7.82162 17.9195 7.23149 17.6306 6.67389 17.2952C6.82182 17.1856 6.96652 17.071 7.10632 16.9531C10.5073 18.5438 14.2025 18.5438 17.5628 16.9531C17.7043 17.071 17.849 17.1856 17.9953 17.2952C17.436 17.6322 16.8443 17.9211 16.2281 18.1553C16.5517 18.8028 16.9256 19.4205 17.3482 20C19.0552 19.4687 20.7915 18.6567 22.5814 17.3184C23.0106 12.7738 21.8482 8.83355 19.5088 5.34ZM8.90109 14.9075C7.88016 14.9075 7.04291 13.9543 7.04291 12.7937C7.04291 11.6331 7.86228 10.6783 8.90109 10.6783C9.93993 10.6783 10.7772 11.6314 10.7593 12.7937C10.7609 13.9543 9.93993 14.9075 8.90109 14.9075ZM15.7681 14.9075C14.7471 14.9075 13.9099 13.9543 13.9099 12.7937C13.9099 11.6331 14.7292 10.6783 15.7681 10.6783C16.8069 10.6783 17.6441 11.6314 17.6263 12.7937C17.6263 13.9543 16.8069 14.9075 15.7681 14.9075Z" />
  </svg>
);

const InstagramIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M15.75 2H8.25C4.79875 2 2 4.79875 2 8.25V15.75C2 19.2013 4.79875 22 8.25 22H15.75C19.2013 22 22 19.2013 22 15.75V8.25C22 4.79875 19.2013 2 15.75 2ZM20.125 15.75C20.125 18.1625 18.1625 20.125 15.75 20.125H8.25C5.8375 20.125 3.875 18.1625 3.875 15.75V8.25C3.875 5.8375 5.8375 3.875 8.25 3.875H15.75C18.1625 3.875 20.125 5.8375 20.125 8.25V15.75ZM12 7C9.23875 7 7 9.23875 7 12C7 14.7613 9.23875 17 12 17C14.7613 17 17 14.7613 17 12C17 9.23875 14.7613 7 12 7ZM12 15.125C10.2775 15.125 8.875 13.7225 8.875 12C8.875 10.2762 10.2775 8.875 12 8.875C13.7225 8.875 15.125 10.2762 15.125 12C15.125 13.7225 13.7225 15.125 12 15.125ZM18.0415 6.62499C18.0415 6.99295 17.7432 7.29124 17.3752 7.29124C17.0073 7.29124 16.709 6.99295 16.709 6.62499C16.709 6.25703 17.0073 5.95874 17.3752 5.95874C17.7432 5.95874 18.0415 6.25703 18.0415 6.62499Z" />
  </svg>
);

// Tab types
type DetailTab = "details" | "orders" | "activity";

// ============================================================================
// Types
// ============================================================================

interface NFTTakeoverModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nft: CollectionItem | null;
  nftList?: CollectionItem[];
  collection?: {
    id: string;
    name: string;
    contractAddress: string;
    floorPrice?: number | string;
    verified?: boolean;
  };
  onBuyNow?: (nft: CollectionItem) => void;
  onMakeOffer?: (nft: CollectionItem) => void;
}

interface StatItem {
  label: string;
  value: string;
  subValue?: string;
  icon?: React.ReactNode;
}

// ============================================================================
// Hooks
// ============================================================================

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isMobile;
}

// ============================================================================
// Subcomponents
// ============================================================================

// Desktop Header with Thumbnail Carousel
function DesktopHeader({
  nftList,
  currentIndex,
  onNavigate,
  onClose,
}: {
  nftList: CollectionItem[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  onClose: () => void;
}) {
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < nftList.length - 1;

  return (
    <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-black/80 backdrop-blur-xl border-b border-white/10">
      {/* Prev Button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-8 w-8 rounded-full bg-white/10 hover:bg-white/20",
          !canGoPrev && "opacity-30 pointer-events-none"
        )}
        onClick={() => canGoPrev && onNavigate(currentIndex - 1)}
        disabled={!canGoPrev}
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      {/* Thumbnail Carousel */}
      <div className="flex-1 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 py-1">
          {nftList.map((item, index) => (
            <button
              key={item.id}
              onClick={() => onNavigate(index)}
              className={cn(
                "relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden transition-all duration-200",
                index === currentIndex
                  ? "ring-2 ring-[rgb(163,255,18)] scale-110"
                  : "opacity-60 hover:opacity-100"
              )}
            >
              <MediaRenderer
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Next Button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-8 w-8 rounded-full bg-white/10 hover:bg-white/20",
          !canGoNext && "opacity-30 pointer-events-none"
        )}
        onClick={() => canGoNext && onNavigate(currentIndex + 1)}
        disabled={!canGoNext}
      >
        <ChevronRight className="w-4 h-4" />
      </Button>

      {/* Close Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 ml-2"
        onClick={onClose}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}

// Mobile Header
function MobileHeader({
  onClose,
  onLike,
  onShare,
}: {
  onClose: () => void;
  onLike?: () => void;
  onShare?: () => void;
}) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-xl">
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20"
        onClick={onClose}
      >
        <X className="w-5 h-5" />
      </Button>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20"
          onClick={onLike}
        >
          <Heart className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20"
          onClick={onShare}
        >
          <Share2 className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20"
        >
          <MoreHorizontal className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}

// Stats Bar Component - OpenSea style
function StatsBar({ stats }: { stats: StatItem[] }) {
  return (
    <div className="flex items-stretch gap-4 overflow-x-auto scrollbar-hide py-2">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className={cn(
            "flex-shrink-0 min-w-[100px]",
            index < stats.length - 1 && "border-r border-white/10 pr-4"
          )}
        >
          <div className="text-white/50 text-xs mb-1">{stat.label}</div>
          <div className="flex items-baseline gap-1">
            <span className="text-white font-semibold">{stat.value}</span>
            {stat.subValue && (
              <span className="text-white/50 text-xs">{stat.subValue}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Collapsible Section with Icon
function CollapsibleSection({
  title,
  icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 mb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 bg-white/5">
              <div className="flex items-center justify-center w-6 h-6 rounded border border-white/10 bg-white/10 text-white/60">
                {icon}
              </div>
            </div>
          )}
          <span className="font-medium text-white">{title}</span>
        </div>
        <ChevronLeft
          className={cn(
            "w-5 h-5 text-white/60 transition-transform duration-200",
            isOpen ? "rotate-90" : "-rotate-90"
          )}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Tab Navigation Component
function TabNavigation({
  activeTab,
  onTabChange,
}: {
  activeTab: DetailTab;
  onTabChange: (tab: DetailTab) => void;
}) {
  const tabs: { id: DetailTab; label: string }[] = [
    { id: "details", label: "Details" },
    { id: "orders", label: "Orders" },
    { id: "activity", label: "Activity" },
  ];

  return (
    <nav className="flex gap-6 sticky top-0 z-[1] w-full border-b border-white/10 bg-black/95 backdrop-blur-sm">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "relative py-3 text-sm font-medium transition-colors",
            activeTab === tab.id
              ? "text-white"
              : "text-white/50 hover:text-white"
          )}
        >
          {tab.label}
          {activeTab === tab.id && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
        </button>
      ))}
    </nav>
  );
}

// Social Links Component
function SocialLinks({ collection }: { collection?: { id: string; name: string } }) {
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  return (
    <div className="flex items-center gap-3">
      <button
        className="text-white/60 hover:text-white transition-colors"
        title="Website"
      >
        <Globe className="w-5 h-5" />
      </button>
      <button
        className="text-white/60 hover:text-white transition-colors"
        title="Instagram"
      >
        <InstagramIcon />
      </button>
      <button
        className="text-white/60 hover:text-white transition-colors"
        title="Discord"
      >
        <DiscordIcon />
      </button>
      <button
        className="text-white/60 hover:text-white transition-colors"
        title="Twitter/X"
      >
        <TwitterIcon />
      </button>
      <div className="w-px h-4 bg-white/20" />
      <button
        onClick={handleCopyLink}
        className="text-white/60 hover:text-white transition-colors"
        title="Copy Link"
      >
        <Link2 className="w-5 h-5" />
      </button>
    </div>
  );
}

// Traits Grid
function TraitsGrid({ traits }: { traits?: { trait_type: string; value: string; rarity?: number }[] }) {
  if (!traits || traits.length === 0) {
    return <p className="text-white/40 text-sm">No traits available</p>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      {traits.map((trait, index) => (
        <div
          key={`${trait.trait_type}-${index}`}
          className="bg-white/5 rounded-lg p-3 border border-white/10"
        >
          <div className="text-xs text-white/50 uppercase tracking-wide mb-1">
            {trait.trait_type}
          </div>
          <div className="text-sm font-medium text-white truncate">
            {trait.value}
          </div>
          {trait.rarity && (
            <div className="text-xs text-[rgb(163,255,18)] mt-1">
              {trait.rarity.toFixed(1)}% have this
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Mobile Sticky Bottom Bar
function MobileActionBar({
  nft,
  onBuyNow,
  onMakeOffer,
}: {
  nft: CollectionItem;
  onBuyNow?: () => void;
  onMakeOffer?: () => void;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-t border-white/10 p-4 pb-safe">
      <div className="flex gap-3">
        {nft.listed ? (
          <>
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700 h-12 text-base font-semibold"
              onClick={onBuyNow}
            >
              Buy for {nft.price} ETH
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-white/20 hover:bg-white/10 h-12 text-base font-semibold"
              onClick={onMakeOffer}
            >
              Make Offer
            </Button>
          </>
        ) : (
          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-700 h-12 text-base font-semibold"
            onClick={onMakeOffer}
          >
            <Tag className="w-4 h-4 mr-2" />
            Make Offer
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Desktop View
// ============================================================================

function DesktopView({
  nft,
  nftList,
  currentIndex,
  collection,
  stats,
  onNavigate,
  onClose,
  onBuyNow,
  onMakeOffer,
}: {
  nft: CollectionItem;
  nftList: CollectionItem[];
  currentIndex: number;
  collection?: NFTTakeoverModalProps["collection"];
  stats: StatItem[];
  onNavigate: (index: number) => void;
  onClose: () => void;
  onBuyNow?: () => void;
  onMakeOffer?: () => void;
}) {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>("details");
  const [isFavorited, setIsFavorited] = useState(false);

  // Build query params for tracing
  const nftDbId = (nft as any).dbId;
  const nftOnChainTokenId = (nft as any).onChainTokenId;
  // Use onChainTokenId for querying if available (more accurate for on-chain matching)
  const tokenIdForQuery = nftOnChainTokenId || String(nft.id);
  const offersQueryParams = {
    nftId: nftDbId || undefined,
    assetContract: collection?.contractAddress || "",
    tokenId: tokenIdForQuery,
    status: "ACTIVE" as const,
  };
  const offersQueryEnabled = !!collection?.contractAddress && activeTab === "orders";

  // Fetch offers for this NFT - use nftId (database UUID) if available, otherwise filter by contract+tokenId
  const { data: offersData, isLoading: offersLoading, error: offersError } = trpc.marketplace.offers.list.useQuery(
    offersQueryParams,
    { enabled: offersQueryEnabled }
  );

  // Trace offers query
  useEffect(() => {
    if (activeTab === "orders") {
      console.group("[NFTTakeoverModal] Offers Query Trace");
      console.log("NFT Data:", {
        id: nft.id,
        dbId: nftDbId,
        onChainTokenId: nftOnChainTokenId,
        tokenIdForQuery,
        name: nft.name,
        idType: typeof nft.id,
      });
      console.log("Collection Data:", {
        id: collection?.id,
        name: collection?.name,
        contractAddress: collection?.contractAddress,
      });
      console.log("Query Params:", offersQueryParams);
      console.log("Query Enabled:", offersQueryEnabled);
      console.log("Query Loading:", offersLoading);
      console.log("Query Error:", offersError);
      console.log("Query Response:", offersData);
      console.log("Offers Count:", offersData?.offers?.length || 0);
      console.groupEnd();
    }
  }, [activeTab, nft.id, nftDbId, nft.name, collection, offersQueryParams, offersQueryEnabled, offersLoading, offersError, offersData]);

  // Build collection offers query params
  const collectionOffersQueryParams = {
    collectionId: collection?.id || "",
    status: "ACTIVE" as const,
  };
  const collectionOffersQueryEnabled = !!collection?.id && activeTab === "orders";

  // Fetch collection offers that could apply to this NFT
  const { data: collectionOffersData, isLoading: collectionOffersLoading, error: collectionOffersError } = trpc.marketplace.collectionOffers.list.useQuery(
    collectionOffersQueryParams,
    { enabled: collectionOffersQueryEnabled }
  );

  // Trace collection offers query
  useEffect(() => {
    if (activeTab === "orders") {
      console.group("[NFTTakeoverModal] Collection Offers Query Trace");
      console.log("Query Params:", collectionOffersQueryParams);
      console.log("Query Enabled:", collectionOffersQueryEnabled);
      console.log("Query Loading:", collectionOffersLoading);
      console.log("Query Error:", collectionOffersError);
      console.log("Query Response:", collectionOffersData);
      console.log("Collection Offers Count:", collectionOffersData?.offers?.length || 0);
      console.groupEnd();
    }
  }, [activeTab, collectionOffersQueryParams, collectionOffersQueryEnabled, collectionOffersLoading, collectionOffersError, collectionOffersData]);

  // Combine all offers for display
  const allOffers = useMemo(() => {
    const directOffers = offersData?.offers || [];
    const collOffers = (collectionOffersData?.offers || []).map((o: any) => ({
      ...o,
      isCollectionOffer: true,
    }));
    const combined = [...directOffers, ...collOffers];

    console.log("[NFTTakeoverModal] Combined Offers:", {
      directOffersCount: directOffers.length,
      collectionOffersCount: collOffers.length,
      totalCount: combined.length,
      offers: combined.map((o: any) => ({
        offerId: o.offerId,
        amount: o.offerAmount,
        offeror: o.offerorAddress,
        tokenId: o.tokenId,
        assetContract: o.assetContractAddress,
        isCollectionOffer: o.isCollectionOffer || false,
      })),
    });

    return combined;
  }, [offersData, collectionOffersData]);

  const offersLoadingCombined = offersLoading || collectionOffersLoading;

  // Fetch collection activity (filtered to show relevant NFT activity when available)
  const { data: activityData, isLoading: activityLoading, error: activityError } = trpc.marketplace.collections.activity.useQuery(
    {
      collectionId: collection?.id || "",
      limit: 50,
    },
    {
      enabled: !!collection?.id && activeTab === "activity",
    }
  );

  // Trace activity query
  useEffect(() => {
    if (activeTab === "activity") {
      console.group("[NFTTakeoverModal] Activity Query Trace");
      console.log("NFT Identifiers:", { id: nft.id, dbId: nftDbId });
      console.log("Collection ID:", collection?.id);
      console.log("Query Loading:", activityLoading);
      console.log("Query Error:", activityError);
      console.log("Raw Activity Count:", activityData?.items?.length || 0);
      console.groupEnd();
    }
  }, [activeTab, nft.id, nftDbId, collection?.id, activityLoading, activityError, activityData]);

  // Filter activity to this specific NFT if nft field exists
  const nftActivity = useMemo(() => {
    if (!activityData?.items) return [];
    // Filter to activities that match this NFT (by db id, tokenId, or nft.id)
    const filtered = activityData.items.filter((a: any) => {
      // Check by database UUID if available
      if (nftDbId && a.nftId === nftDbId) return true;
      if (nftDbId && a.nft?.id === nftDbId) return true;
      // Check by token ID
      if (a.nft?.tokenId === String(nft.id)) return true;
      return false;
    }).slice(0, 20);

    console.log("[NFTTakeoverModal] Filtered Activity:", {
      totalActivities: activityData.items.length,
      filteredCount: filtered.length,
      filterCriteria: { nftDbId, tokenId: String(nft.id) },
    });

    return filtered;
  }, [activityData, nft.id, nftDbId]);

  const handleCopyAddress = () => {
    if (collection?.contractAddress) {
      navigator.clipboard.writeText(collection.contractAddress);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black/95 rounded-2xl overflow-hidden">
      {/* Header with Thumbnail Carousel */}
      <DesktopHeader
        nftList={nftList}
        currentIndex={currentIndex}
        onNavigate={onNavigate}
        onClose={onClose}
      />

      {/* Main Content - Two Column */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex">
          {/* Left Column - Sticky Image */}
          <div className="w-1/2 p-6 flex items-center justify-center sticky top-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={nft.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="relative w-full max-w-lg aspect-square rounded-2xl overflow-hidden bg-white/5"
              >
                <MediaRenderer
                  src={nft.image}
                  alt={nft.name}
                  className="w-full h-full object-cover"
                />
                {/* Rarity Badge */}
                <Badge
                  className={cn(
                    "absolute top-4 left-4 text-xs px-2 py-1",
                    nft.rarity === "Mythic" && "bg-purple-500",
                    nft.rarity === "Legendary" && "bg-orange-500",
                    nft.rarity === "Epic" && "bg-purple-400",
                    nft.rarity === "Rare" && "bg-blue-500",
                    (!nft.rarity || nft.rarity === "Common") && "bg-zinc-600"
                  )}
                >
                  {nft.rarity || "Common"}
                </Badge>
                {/* Rank Badge */}
                {nft.rank && (
                  <Badge className="absolute top-4 right-4 bg-black/70 text-white/80 text-xs">
                    Rank #{nft.rank}
                  </Badge>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Column - Scrollable Details */}
          <div className="w-1/2 overflow-y-auto border-l border-white/10 bg-black/50">
            <AnimatePresence mode="wait">
              <motion.div
                key={nft.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="pt-4 pb-16 px-6"
              >
                {/* Title Section */}
                <div className="mb-4">
                  <h1 className="text-2xl font-bold text-white mb-3">{nft.name}</h1>

                  {/* Collection & Owner Row */}
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                      {collection && (
                        <button className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors">
                          <span className="font-medium">{collection.name}</span>
                          {collection.verified && (
                            <svg className="w-4 h-4 text-blue-500" viewBox="0 -960 960 960" fill="currentColor">
                              <path d="m344-60-76-128-144-32 14-148-98-112 98-112-14-148 144-32 76-128 136 58 136-58 76 128 144 32-14 148 98 112-98 112 14 148-144 32-76 128-136-58-136 58Zm94-278 226-226-56-58-170 170-86-84-56 56 142 142Z" />
                            </svg>
                          )}
                        </button>
                      )}
                      {nft.owner && (
                        <>
                          <div className="w-px h-4 bg-white/20" />
                          <span className="text-white/50 text-sm">
                            Owned by{" "}
                            <span className="text-white font-medium">
                              {nft.owner.slice(0, 6)}...{nft.owner.slice(-4)}
                            </span>
                          </span>
                        </>
                      )}
                    </div>

                    {/* Social & Actions */}
                    <div className="flex items-center gap-3">
                      <SocialLinks collection={collection} />
                      <button
                        onClick={() => setIsFavorited(!isFavorited)}
                        className={cn(
                          "transition-colors",
                          isFavorited ? "text-red-500" : "text-white/60 hover:text-white"
                        )}
                        title="Favorite"
                      >
                        <Heart className={cn("w-5 h-5", isFavorited && "fill-current")} />
                      </button>
                      <button
                        className="text-white/60 hover:text-white transition-colors"
                        title="More options"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Chain & Token Badges */}
                  <div className="flex items-center gap-2">
                    <Badge className="bg-white/10 text-white/70 text-xs font-mono uppercase">
                      ERC721
                    </Badge>
                    <Badge className="bg-white/10 text-white/70 text-xs font-mono uppercase flex items-center gap-1">
                      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="m12 16.576 7.498-4.353L12 8.873zM4.5 12.223l7.5 4.353V8.874zM12 0v8.872l7.498 3.35z" />
                        <path d="M12 0 4.5 12.223 12 8.872zM12 17.972V24l7.503-10.381zM12 24v-6.03L4.5 13.62z" />
                      </svg>
                      Ethereum
                    </Badge>
                    <Badge
                      className="bg-white/10 text-white/70 text-xs font-mono uppercase cursor-pointer hover:bg-white/20"
                      onClick={handleCopyAddress}
                    >
                      Token #{nft.id}
                    </Badge>
                  </div>
                </div>

                {/* Stats Bar */}
                <div className="bg-white/5 rounded-xl p-4 mb-4 border border-white/10">
                  <StatsBar stats={stats} />

                  <div className="border-t border-white/10 mt-4 pt-4">
                    {/* Price Section */}
                    {nft.listed ? (
                      <div className="flex flex-col gap-4">
                        <div>
                          <div className="text-white/50 text-xs uppercase tracking-wide mb-1">Buy for</div>
                          <div className="flex flex-wrap items-baseline gap-2">
                            <span className="text-2xl font-bold text-white font-mono">
                              {nft.price} ETH
                            </span>
                            <span className="text-sm text-white/50">
                              (${(parseFloat(nft.price) * 2500).toFixed(2)})
                            </span>
                            {/* Listing Expiry Badge */}
                            <Badge className="bg-white/10 text-white/60 text-xs font-mono">
                              <Timer className="w-3 h-3 mr-1" />
                              Ending in 41 minutes
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Button
                            className="flex-1 bg-blue-600 hover:bg-blue-700 h-12 text-base font-semibold"
                            onClick={onBuyNow}
                          >
                            Buy now
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 border-white/20 hover:bg-white/10 h-12 text-base font-semibold"
                            onClick={onMakeOffer}
                          >
                            Make offer
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <div className="text-white/50 text-sm">
                          This item is not listed for sale
                        </div>
                        <Button
                          className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base font-semibold"
                          onClick={onMakeOffer}
                        >
                          <Tag className="w-4 h-4 mr-2" />
                          Make offer
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tab Navigation */}
                <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

                {/* Tab Content */}
                <div className="mt-4">
                  {activeTab === "details" && (
                    <div className="space-y-2">
                      <CollapsibleSection
                        title="Traits"
                        icon={<Diamond className="w-4 h-4" />}
                        defaultOpen={true}
                      >
                        <TraitsGrid traits={nft.traits} />
                      </CollapsibleSection>

                      <CollapsibleSection
                        title="Price history"
                        icon={<DollarSign className="w-4 h-4" />}
                      >
                        <div className="h-40 flex items-center justify-center text-white/40">
                          <TrendingUp className="w-8 h-8 mr-2" />
                          Price history chart coming soon
                        </div>
                      </CollapsibleSection>

                      <CollapsibleSection
                        title="About"
                        icon={<FileText className="w-4 h-4" />}
                      >
                        <p className="text-white/60 text-sm">
                          {collection?.name || "This NFT"} is part of a unique collection.
                          Each item has distinct attributes and rarity levels.
                        </p>
                      </CollapsibleSection>

                      <CollapsibleSection
                        title="Blockchain details"
                        icon={<Layers className="w-4 h-4" />}
                      >
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-white/50">Contract Address</span>
                            <button
                              className="text-white/70 hover:text-white flex items-center gap-1"
                              onClick={handleCopyAddress}
                            >
                              {collection?.contractAddress?.slice(0, 8)}...
                              {collection?.contractAddress?.slice(-6)}
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/50">Token ID</span>
                            <span className="text-white/70">{nft.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/50">Token Standard</span>
                            <span className="text-white/70">ERC-721</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/50">Chain</span>
                            <span className="text-white/70">Ethereum</span>
                          </div>
                        </div>
                      </CollapsibleSection>

                      <CollapsibleSection
                        title="More from this collection"
                        icon={<Grid3X3 className="w-4 h-4" />}
                      >
                        <div className="text-white/40 text-sm">
                          Related NFTs carousel coming soon
                        </div>
                      </CollapsibleSection>
                    </div>
                  )}

                  {activeTab === "orders" && (
                    <div className="space-y-3">
                      {offersLoadingCombined ? (
                        <div className="py-8 text-center text-white/40">
                          <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mx-auto mb-4" />
                          <p className="text-sm">Loading offers...</p>
                        </div>
                      ) : allOffers.length > 0 ? (
                        <div className="rounded-lg border border-white/10 overflow-hidden">
                          {/* Table Header */}
                          <div className="grid grid-cols-[1.5fr_1fr_0.5fr_1fr_0.8fr] gap-2 px-4 py-3 bg-white/5 border-b border-white/10 text-xs font-medium text-white/50 uppercase tracking-wider">
                            <div>Type</div>
                            <div>Price</div>
                            <div className="text-center">Qty</div>
                            <div>From</div>
                            <div className="text-right">Expiry</div>
                          </div>
                          {/* Table Rows */}
                          <div className="divide-y divide-white/5">
                            {allOffers.map((offer: any) => {
                              // Format expiry as compact relative time
                              const expiryDate = new Date(offer.expirationTimestamp);
                              const now = new Date();
                              const diffMs = expiryDate.getTime() - now.getTime();
                              const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                              const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                              let expiryText = "";
                              if (diffMs < 0) {
                                expiryText = "Expired";
                              } else if (diffDays > 0) {
                                expiryText = `${diffDays}d`;
                              } else if (diffHours > 0) {
                                expiryText = `${diffHours}h`;
                              } else {
                                const diffMins = Math.floor(diffMs / (1000 * 60));
                                expiryText = `${diffMins}m`;
                              }

                              // Format "from" address
                              const fromDisplay = offer.offeror?.username ||
                                `${offer.offerorAddress.slice(0, 6)}...${offer.offerorAddress.slice(-4)}`;

                              return (
                                <div
                                  key={offer.offerId}
                                  className="grid grid-cols-[1.5fr_1fr_0.5fr_1fr_0.8fr] gap-2 px-4 py-3 hover:bg-white/5 transition-colors items-center"
                                >
                                  {/* Type */}
                                  <div className="flex items-center gap-2">
                                    <div className={cn(
                                      "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                                      offer.isCollectionOffer
                                        ? "bg-orange-500/20"
                                        : "bg-blue-500/20"
                                    )}>
                                      {offer.isCollectionOffer ? (
                                        <Layers className="w-3 h-3 text-orange-400" />
                                      ) : (
                                        <Tag className="w-3 h-3 text-blue-400" />
                                      )}
                                    </div>
                                    <span className={cn(
                                      "text-sm font-medium truncate",
                                      offer.isCollectionOffer ? "text-orange-400" : "text-white"
                                    )}>
                                      {offer.isCollectionOffer ? "Collection Offer" : "Item Offer"}
                                    </span>
                                  </div>
                                  {/* Price */}
                                  <div className="text-sm font-mono text-white">
                                    {offer.offerAmount} <span className="text-white/50">WETH</span>
                                  </div>
                                  {/* Qty */}
                                  <div className="text-sm text-white/70 text-center">
                                    {offer.quantity || 1}
                                  </div>
                                  {/* From */}
                                  <div className="text-sm text-white/70 truncate" title={offer.offerorAddress}>
                                    {fromDisplay}
                                  </div>
                                  {/* Expiry */}
                                  <div className={cn(
                                    "text-sm text-right",
                                    diffMs < 0 ? "text-red-400" : "text-white/50"
                                  )}>
                                    {expiryText}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="py-8 text-center text-white/40">
                          <Tag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p className="text-sm">No active offers</p>
                          <p className="text-xs mt-1">Be the first to make an offer!</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "activity" && (
                    <div className="space-y-3">
                      {activityLoading ? (
                        <div className="py-8 text-center text-white/40">
                          <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mx-auto mb-4" />
                          <p className="text-sm">Loading activity...</p>
                        </div>
                      ) : nftActivity && nftActivity.length > 0 ? (
                        <>
                          {nftActivity.map((activity: any, index: number) => (
                            <div
                              key={activity.id || index}
                              className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5"
                            >
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-10 h-10 rounded-full flex items-center justify-center",
                                  activity.type === "sale" || activity.type === "purchase" || activity.type === "listing_sold" ? "bg-green-500/20" :
                                  activity.type === "listing" || activity.type === "listing_created" ? "bg-blue-500/20" :
                                  activity.type === "offer" || activity.type === "offer_made" ? "bg-purple-500/20" :
                                  activity.type === "transfer" ? "bg-orange-500/20" :
                                  "bg-white/10"
                                )}>
                                  {activity.type === "sale" || activity.type === "purchase" || activity.type === "listing_sold" ? (
                                    <ShoppingCart className="w-5 h-5 text-green-400" />
                                  ) : activity.type === "listing" || activity.type === "listing_created" ? (
                                    <Tag className="w-5 h-5 text-blue-400" />
                                  ) : activity.type === "offer" || activity.type === "offer_made" ? (
                                    <Gavel className="w-5 h-5 text-purple-400" />
                                  ) : activity.type === "transfer" ? (
                                    <ArrowRightLeft className="w-5 h-5 text-orange-400" />
                                  ) : (
                                    <Clock className="w-5 h-5 text-white/60" />
                                  )}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-white capitalize">
                                    {activity.type?.replace(/_/g, " ") || "Activity"}
                                  </div>
                                  <div className="text-xs text-white/50">
                                    {activity.user?.username ||
                                      (activity.user?.address
                                        ? `${activity.user.address.slice(0, 6)}...${activity.user.address.slice(-4)}`
                                        : "Unknown")}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                {activity.amount && (
                                  <div className="text-sm font-mono text-white">{activity.amount} {activity.currency || "ETH"}</div>
                                )}
                                <div className="text-xs text-white/40">
                                  {activity.timestamp ? formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true }) : ""}
                                </div>
                              </div>
                            </div>
                          ))}
                        </>
                      ) : (
                        <div className="py-8 text-center text-white/40">
                          <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p className="text-sm">No activity yet</p>
                          <p className="text-xs mt-1">Transaction history will appear here</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Mobile View
// ============================================================================

function MobileView({
  nft,
  nftList,
  currentIndex,
  collection,
  stats,
  onNavigate,
  onClose,
  onBuyNow,
  onMakeOffer,
}: {
  nft: CollectionItem;
  nftList: CollectionItem[];
  currentIndex: number;
  collection?: NFTTakeoverModalProps["collection"];
  stats: StatItem[];
  onNavigate: (index: number) => void;
  onClose: () => void;
  onBuyNow?: () => void;
  onMakeOffer?: () => void;
}) {
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < nftList.length - 1;

  // Swipe handling
  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { x: number } }
  ) => {
    if (info.offset.x > 100 && canGoPrev) {
      onNavigate(currentIndex - 1);
    } else if (info.offset.x < -100 && canGoNext) {
      onNavigate(currentIndex + 1);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black/95 pb-24">
      {/* Header */}
      <MobileHeader onClose={onClose} />

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Image with Swipe */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className="relative w-full aspect-square"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={nft.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full"
            >
              <MediaRenderer
                src={nft.image}
                alt={nft.name}
                className="w-full h-full object-cover"
              />
            </motion.div>
          </AnimatePresence>

          {/* Swipe Indicators */}
          {canGoPrev && (
            <div className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
              <ChevronLeft className="w-5 h-5 text-white/70" />
            </div>
          )}
          {canGoNext && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
              <ChevronRight className="w-5 h-5 text-white/70" />
            </div>
          )}

          {/* Badges */}
          <Badge
            className={cn(
              "absolute bottom-4 left-4 text-xs px-2 py-1",
              nft.rarity === "Mythic" && "bg-purple-500",
              nft.rarity === "Legendary" && "bg-orange-500",
              nft.rarity === "Epic" && "bg-purple-400",
              nft.rarity === "Rare" && "bg-blue-500",
              (!nft.rarity || nft.rarity === "Common") && "bg-zinc-600"
            )}
          >
            {nft.rarity || "Common"}
          </Badge>
          {nft.rank && (
            <Badge className="absolute bottom-4 right-4 bg-black/70 text-white/80 text-xs">
              Rank #{nft.rank}
            </Badge>
          )}
        </motion.div>

        {/* Details Section */}
        <div className="p-4">
          {/* Title */}
          <h1 className="text-xl font-bold text-white mb-2">{nft.name}</h1>
          <div className="flex items-center gap-2 text-sm mb-4">
            {collection && (
              <span className="text-white/70">{collection.name}</span>
            )}
            {collection?.verified && (
              <Check className="w-4 h-4 text-blue-500" />
            )}
          </div>

          {/* Stats Bar - Scrollable */}
          <div className="bg-white/5 rounded-xl p-3 mb-4 border border-white/10 -mx-4 px-4">
            <StatsBar stats={stats} />
          </div>

          {/* Collapsible Sections */}
          <div className="border-t border-white/10 -mx-4">
            <CollapsibleSection title="Traits" defaultOpen={true}>
              <TraitsGrid traits={nft.traits} />
            </CollapsibleSection>

            <CollapsibleSection title="Price History">
              <div className="h-32 flex items-center justify-center text-white/40">
                <TrendingUp className="w-6 h-6 mr-2" />
                Coming soon
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="About">
              <p className="text-white/60 text-sm">
                {collection?.name || "This NFT"} is part of a unique collection.
              </p>
            </CollapsibleSection>

            <CollapsibleSection title="Blockchain Details">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/50">Token ID</span>
                  <span className="text-white/70">{nft.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Chain</span>
                  <span className="text-white/70">Sepolia</span>
                </div>
              </div>
            </CollapsibleSection>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <MobileActionBar
        nft={nft}
        onBuyNow={onBuyNow}
        onMakeOffer={onMakeOffer}
      />
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function NFTTakeoverModal({
  open,
  onOpenChange,
  nft,
  nftList = [],
  collection,
  onBuyNow,
  onMakeOffer,
}: NFTTakeoverModalProps) {
  const isMobile = useIsMobile();

  // Use nftList or create a single-item list from nft
  const effectiveNftList = useMemo(() => {
    if (nftList.length > 0) return nftList;
    if (nft) return [nft];
    return [];
  }, [nftList, nft]);

  // Current NFT index
  const [currentIndex, setCurrentIndex] = useState(0);

  // Update index when nft prop changes
  useEffect(() => {
    if (nft && effectiveNftList.length > 0) {
      // Compare as strings to handle type mismatches (number vs string IDs)
      const nftIdStr = String(nft.id);
      const idx = effectiveNftList.findIndex((item) => String(item.id) === nftIdStr);
      if (idx !== -1 && idx !== currentIndex) {
        setCurrentIndex(idx);
      }
    }
  }, [nft?.id, effectiveNftList.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Current NFT
  const currentNft = effectiveNftList[currentIndex] || nft;

  // Get NFT identifiers for queries
  const currentNftDbId = (currentNft as any)?.dbId;
  const currentNftOnChainTokenId = (currentNft as any)?.onChainTokenId;
  const tokenIdForStatsQuery = currentNftOnChainTokenId || String(currentNft?.id || "");

  // Fetch offers for top offer stat (runs when modal is open)
  const { data: statsOffersData } = trpc.marketplace.offers.list.useQuery(
    {
      nftId: currentNftDbId || undefined,
      assetContract: collection?.contractAddress || "",
      tokenId: tokenIdForStatsQuery,
      status: "ACTIVE" as const,
    },
    {
      enabled: open && !!collection?.contractAddress && !!currentNft,
    }
  );

  // Fetch collection offers for top offer stat
  const { data: statsCollectionOffersData } = trpc.marketplace.collectionOffers.list.useQuery(
    {
      collectionId: collection?.id || "",
      status: "ACTIVE" as const,
    },
    {
      enabled: open && !!collection?.id && !!currentNft,
    }
  );

  // Compute top offer from both item and collection offers
  const topOffer = useMemo(() => {
    const itemOffers = statsOffersData?.offers || [];
    const collectionOffers = statsCollectionOffersData?.offers || [];
    const allOffers = [...itemOffers, ...collectionOffers];

    if (allOffers.length === 0) return null;

    // Find highest offer
    return allOffers.reduce((max, offer) => {
      const amount = offer.offerAmount || 0;
      return amount > (max?.offerAmount || 0) ? offer : max;
    }, allOffers[0]);
  }, [statsOffersData, statsCollectionOffersData]);

  // Navigation
  const navigateTo = useCallback(
    (index: number) => {
      if (index >= 0 && index < effectiveNftList.length) {
        setCurrentIndex(index);
      }
    },
    [effectiveNftList.length]
  );

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          if (currentIndex > 0) navigateTo(currentIndex - 1);
          break;
        case "ArrowRight":
          e.preventDefault();
          if (currentIndex < effectiveNftList.length - 1)
            navigateTo(currentIndex + 1);
          break;
        case "Escape":
          onOpenChange(false);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, currentIndex, effectiveNftList.length, navigateTo, onOpenChange]);

  // Build stats - OpenSea format: Top Offer, Collection Floor, Rarity, Last Sale
  const stats: StatItem[] = useMemo(() => {
    if (!currentNft) return [];

    return [
      // Top Offer
      {
        label: "Top Offer",
        value: topOffer ? `${topOffer.offerAmount}` : "—",
        subValue: topOffer ? "WETH" : undefined,
        icon: <Tag className="w-3 h-3" />,
      },
      // Collection Floor
      {
        label: "Collection Floor",
        value: collection?.floorPrice ? `${collection.floorPrice}` : "—",
        subValue: collection?.floorPrice ? "ETH" : undefined,
        icon: <TrendingUp className="w-3 h-3" />,
      },
      // Rarity
      {
        label: "Rarity",
        value: currentNft.rank ? `#${currentNft.rank}` : "—",
        icon: <Award className="w-3 h-3" />,
      },
      // Last Sale
      {
        label: "Last Sale",
        value: currentNft.lastSale && currentNft.lastSale !== "0" ? `${currentNft.lastSale}` : "—",
        subValue: currentNft.lastSale && currentNft.lastSale !== "0" ? "ETH" : undefined,
        icon: <Zap className="w-3 h-3" />,
      },
    ];
  }, [currentNft, collection, topOffer]);

  if (!currentNft) return null;

  const handleBuyNow = () => {
    if (onBuyNow && currentNft) {
      onBuyNow(currentNft);
    }
  };

  const handleMakeOffer = () => {
    if (onMakeOffer && currentNft) {
      onMakeOffer(currentNft);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          // Reset all default Dialog positioning
          "p-0 gap-0 border-0 bg-transparent",
          "!transform-none", // Remove translate transforms
          isMobile
            ? "fixed !inset-0 !top-0 !right-0 !bottom-0 !left-0 w-full h-full max-w-none max-h-none rounded-none"
            : "fixed !top-4 !right-4 !bottom-4 !left-4 w-auto h-auto max-w-none max-h-none rounded-2xl overflow-hidden"
        )}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <VisuallyHidden>
          <DialogTitle>{currentNft.name} - NFT Details</DialogTitle>
        </VisuallyHidden>

        {isMobile ? (
          <MobileView
            nft={currentNft}
            nftList={effectiveNftList}
            currentIndex={currentIndex}
            collection={collection}
            stats={stats}
            onNavigate={navigateTo}
            onClose={handleClose}
            onBuyNow={handleBuyNow}
            onMakeOffer={handleMakeOffer}
          />
        ) : (
          <DesktopView
            nft={currentNft}
            nftList={effectiveNftList}
            currentIndex={currentIndex}
            collection={collection}
            stats={stats}
            onNavigate={navigateTo}
            onClose={handleClose}
            onBuyNow={handleBuyNow}
            onMakeOffer={handleMakeOffer}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
