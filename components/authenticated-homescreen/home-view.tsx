"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MediaRenderer } from "@/components/MediaRenderer";
import { ConnectButton } from "thirdweb/react";
import { sepolia } from "thirdweb/chains";
import { client } from "@/lib/thirdweb";
import {
  Star,
  ArrowRight,
  Calendar,
  MessageSquare,
  Trophy,
  Gift,
  Briefcase,
  Crown,
  Palette,
  TrendingUp,
  Gamepad2,
  Image as ImageIcon,
  User,
  Sparkles,
  ChevronLeft,
  Home,
  Wallet,
  Heart,
  Share2,
  X,
  Check,
  Eye,
  Grid3X3,
  Loader2,
  Gavel,
  Tag,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react";
import { useActiveAccount } from "thirdweb/react";
import {
  checkCollectionApproval,
  approveMarketplace,
  createDirectListing,
  calculateSellerProceeds,
  MARKETPLACE_CHAIN_ID,
} from "@/lib/marketplace";
import { trpc } from "@/lib/trpc/client";
import { useToast } from "@/hooks/use-toast";
import { getExplorerUrl, getExplorerName } from "@/types/profile";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { useBackgroundCarousel } from "@/contexts/background-carousel-context";
import { useChat } from "@/contexts/chat-context";
import { InlineChatPanel } from "@/components/chat-widget/inline-chat-panel";
import { MobileChatOverlay } from "@/components/chat-widget/mobile-chat-overlay";
import { NotificationBar } from "@/components/homepage/notification-bar";
import type { CollectionItem } from "@/components/collection/types";

// Lazy load heavy components
const TrendingCollections = React.lazy(() =>
  import('./trending-collections').then(module => ({ default: module.TrendingCollections }))
);
const UserProfileSection = React.lazy(() =>
  import('./user-profile-section').then(module => ({ default: module.UserProfileSection }))
);

// NFT Locker Types
type LockerItemRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'system';

interface LockerItem {
  id: string;
  dbId?: string; // Database UUID for proper FK references
  name: string;
  image: string;
  rarity: LockerItemRarity;
  collection: string;
  collectionId?: string;
  isSystemItem?: boolean;
  isBackground?: boolean;
  contractAddress?: string;
  tokenId?: string;
  onChainTokenId?: string;
  value?: number;
  traits?: { trait_type: string; value: string }[];
  listed?: boolean;
  listingId?: string;
  hasOffer?: boolean;
  offerPrice?: string;
  owner?: string;
  lastSale?: string;
}

// System wallpapers as locker items
const SYSTEM_WALLPAPERS: LockerItem[] = [
  { id: 'sys-bg1', name: 'Classic Dark', image: '/assets/img/bg1.jpg', rarity: 'system', isSystemItem: true, isBackground: true, collection: 'Backgrounds' },
  { id: 'sys-hpx1', name: 'HypeX Neon', image: '/assets/img/hpx1.mp4', rarity: 'system', isSystemItem: true, isBackground: true, collection: 'Backgrounds' },
  { id: 'sys-bgv1', name: 'Cyber Flow', image: 'https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/21018676-5eb7-4306-9099-992a9c99f37a/transcode=true,original=true,quality=90/96694329.webm', rarity: 'rare', isSystemItem: true, isBackground: true, collection: 'Backgrounds' },
  { id: 'sys-bgv2', name: 'Chic Motion', image: 'https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/39561bcd-8a10-4e56-826c-6f3f7c813414/transcode=true,original=true,quality=90/ChicVideo.webm', rarity: 'epic', isSystemItem: true, isBackground: true, collection: 'Backgrounds' },
  { id: 'sys-bgv3', name: 'Abstract Dreams', image: 'https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/1ad84358-5802-4eae-b74b-f6c880d38ea5/transcode=true,original=true,quality=90/vid_00005.webm', rarity: 'epic', isSystemItem: true, isBackground: true, collection: 'Backgrounds' },
  { id: 'sys-bgv4', name: 'Blood Moon Oni', image: 'https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/a770baa3-875b-4e1d-9f8f-3a0f533e3f96/transcode=true,original=true,quality=90/Blood%20Moon%20Oni.webm', rarity: 'legendary', isSystemItem: true, isBackground: true, collection: 'Backgrounds' },
  { id: 'sys-bgv5', name: 'Neon Pulse', image: 'https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/7f64191f-c494-492e-ab3d-21fb88686523/transcode=true,original=true,quality=90/6JRGQ9C6B2HFZJ94J50N42NPJ0.webm', rarity: 'legendary', isSystemItem: true, isBackground: true, collection: 'Backgrounds' },
];

const RARITY_COLORS: Record<LockerItemRarity, { bg: string; border: string; text: string; glow: string }> = {
  common: { bg: 'bg-zinc-500/20', border: 'border-zinc-500/40', text: 'text-zinc-300', glow: 'shadow-zinc-500/20' },
  rare: { bg: 'bg-blue-500/20', border: 'border-blue-500/40', text: 'text-blue-300', glow: 'shadow-blue-500/30' },
  epic: { bg: 'bg-purple-500/20', border: 'border-purple-500/40', text: 'text-purple-300', glow: 'shadow-purple-500/30' },
  legendary: { bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-300', glow: 'shadow-amber-500/30' },
  system: { bg: 'bg-[rgb(163,255,18)]/10', border: 'border-[rgb(163,255,18)]/30', text: 'text-[rgb(163,255,18)]', glow: 'shadow-[rgb(163,255,18)]/20' },
};

const ITEMS_PER_PAGE = 12;

// Helper to convert LockerItem to CollectionItem for the detail modal
function lockerItemToCollectionItem(item: LockerItem, ownerAddress?: string): CollectionItem {
  return {
    id: item.id,
    dbId: item.dbId,
    tokenId: item.tokenId,
    onChainTokenId: item.onChainTokenId || item.tokenId,
    name: item.name,
    price: item.value?.toString() || '0',
    lastSale: item.lastSale || '0',
    image: item.image,
    rarity: item.rarity === 'system' ? 'Common' : item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1),
    rank: 0,
    likes: 0,
    owner: item.owner || ownerAddress || '',
    listed: item.listed || false,
    listingId: item.listingId,
    hasOffer: item.hasOffer || false,
    offerPrice: item.offerPrice || '0',
    traits: item.traits || [],
  };
}

// View mode for the locker
type LockerViewMode = 'list' | 'detail' | 'listing';

// Listing step type
type ListingStep = 'configure' | 'approval' | 'listing' | 'success' | 'error' | 'not_on_chain';

// Duration options for listing
const DURATION_OPTIONS = [
  { label: '1D', days: 1 },
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '6M', days: 180 },
];

// NFT Locker Component - Fortnite/Sims style with inline detail view
function NFTLockerCard({ walletAddress }: { walletAddress?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const account = useActiveAccount();
  const { setCurrentBackground, currentBackground } = useBackgroundCarousel();
  const [userNFTs, setUserNFTs] = useState<LockerItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<LockerItem | null>(null);
  const [viewMode, setViewMode] = useState<LockerViewMode>('list');
  const [detailTab, setDetailTab] = useState<'info' | 'offers' | 'activity'>('info');

  // Listing state
  const [listingStep, setListingStep] = useState<ListingStep>('configure');
  const [listingPrice, setListingPrice] = useState('');
  const [listingDuration, setListingDuration] = useState(30);
  const [isListingLoading, setIsListingLoading] = useState(false);
  const [listingError, setListingError] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  // tRPC mutation for saving listing to database
  const createListingMutation = trpc.marketplace.listings.create.useMutation();

  // Ref for infinite scroll sentinel
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Combined items: system wallpapers + user NFTs
  const items = useMemo(() => [...SYSTEM_WALLPAPERS, ...userNFTs], [userNFTs]);

  // Fetch user's NFTs with pagination
  const fetchNFTs = useCallback(async (currentOffset: number, append: boolean = false) => {
    if (!walletAddress) {
      setUserNFTs([]);
      return;
    }

    if (currentOffset === 0) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const response = await fetch(
        `/api/user/owned-nfts?address=${walletAddress}&limit=${ITEMS_PER_PAGE}&offset=${currentOffset}`
      );
      const data = await response.json();

      if (data.success && data.nfts) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newNFTs: LockerItem[] = data.nfts.map((nft: any) => ({
          id: nft.id,
          dbId: nft.dbId,
          name: nft.name,
          image: nft.image,
          rarity: (nft.rarity?.toLowerCase() || 'rare') as LockerItemRarity,
          collection: nft.collectionName || 'Unknown Collection',
          collectionId: nft.collectionId,
          contractAddress: nft.contractAddress,
          tokenId: nft.tokenId,
          onChainTokenId: nft.onChainTokenId,
          isSystemItem: false,
          isBackground: false,
          listed: nft.listed || false,
          listingId: nft.listingId,
          hasOffer: nft.hasOffer || false,
          offerPrice: nft.offerPrice,
          owner: nft.owner || walletAddress,
          lastSale: nft.lastSale,
          traits: nft.traits || [],
        }));

        if (append) {
          setUserNFTs(prev => [...prev, ...newNFTs]);
        } else {
          setUserNFTs(newNFTs);
        }

        setHasMore(data.hasMore || false);
        setTotalCount(data.total || 0);
        setOffset(currentOffset + newNFTs.length);
      }
    } catch (error) {
      console.error('Failed to fetch NFTs:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [walletAddress]);

  // Initial fetch
  useEffect(() => {
    setOffset(0);
    setUserNFTs([]);
    fetchNFTs(0, false);
  }, [walletAddress, fetchNFTs]);

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || !hasMore || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          fetchNFTs(offset, true);
        }
      },
      {
        root: scrollContainerRef.current,
        rootMargin: '100px',
        threshold: 0.1
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, offset, fetchNFTs]);

  // Build dynamic filter tabs based on actual collections
  const filterTabs = useMemo(() => {
    const collections = new Map<string, number>();

    // Count backgrounds separately (must be both isSystemItem AND isBackground)
    let backgroundCount = 0;

    // Count items per collection (excluding system items which are counted separately)
    items.forEach(item => {
      if (item.isSystemItem && item.isBackground) {
        backgroundCount++;
      } else if (!item.isSystemItem) {
        const count = collections.get(item.collection) || 0;
        collections.set(item.collection, count + 1);
      }
    });

    // Build tabs: All first, then Backgrounds, then user collections alphabetically
    const tabs: { id: string; label: string; count: number }[] = [
      { id: 'all', label: 'All', count: items.length }
    ];

    // Add Backgrounds tab if there are any background items
    if (backgroundCount > 0) {
      tabs.push({ id: 'backgrounds', label: 'Backgrounds', count: backgroundCount });
    }

    // Add remaining collections sorted alphabetically
    Array.from(collections.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([collection, count]) => {
        tabs.push({ id: collection, label: collection, count });
      });

    return tabs;
  }, [items]);

  // Filter items based on active filter
  const filteredItems = useMemo(() => {
    if (activeFilter === 'all') return items;
    // Special handling for backgrounds - must be both isBackground AND isSystemItem
    if (activeFilter === 'backgrounds') {
      return items.filter(item => item.isSystemItem === true && item.isBackground === true);
    }
    // For collection filters, exclude all system/background items
    return items.filter(item => item.collection === activeFilter && !item.isSystemItem);
  }, [items, activeFilter]);

  // Check if item is current wallpaper
  const isItemApplied = (item: LockerItem) => {
    return currentBackground === item.image;
  };

  // Handle item click - transition to detail view
  const handleItemClick = (item: LockerItem) => {
    setSelectedItem(item);
    setDetailTab('info');
    setViewMode('detail');
  };

  // Handle back to list
  const handleBackToList = () => {
    setViewMode('list');
    setSelectedItem(null);
  };

  // Handle apply as background
  const handleApplyBackground = (item: LockerItem) => {
    setCurrentBackground(item.image);
  };

  // Handle list on marketplace - switch to listing view
  const handleListItem = useCallback(async (item: LockerItem) => {
    if (item.isSystemItem) return;

    setListingPrice('');
    setListingDuration(30);
    setListingError(null);
    setTransactionHash(null);
    setIsApproved(null);

    if (item.onChainTokenId === null || item.onChainTokenId === undefined) {
      setListingStep('not_on_chain');
    } else {
      setListingStep('configure');
      if (account?.address && item.contractAddress) {
        try {
          const approved = await checkCollectionApproval(item.contractAddress, account.address);
          setIsApproved(approved);
        } catch (err) {
          console.error('Error checking approval:', err);
          setIsApproved(false);
        }
      }
    }
    setViewMode('listing');
  }, [account]);

  // Calculate proceeds
  const listingProceeds = useMemo(() => {
    return calculateSellerProceeds(listingPrice || '0', 5);
  }, [listingPrice]);

  // Internal handler for creating listing
  const handleCreateListingInternal = useCallback(async () => {
    if (!account || !selectedItem || !listingPrice || !selectedItem.contractAddress) return;
    setIsListingLoading(true);
    try {
      const endDate = new Date(Date.now() + listingDuration * 24 * 60 * 60 * 1000);
      const tokenIdForChain = selectedItem.onChainTokenId || selectedItem.tokenId;
      if (!tokenIdForChain) throw new Error('Token ID is required');

      const result = await createDirectListing({
        assetContractAddress: selectedItem.contractAddress,
        tokenId: tokenIdForChain,
        pricePerToken: listingPrice,
        endTimestamp: endDate,
      }, account);

      setTransactionHash(result.transactionHash);

      try {
        await createListingMutation.mutateAsync({
          nftId: selectedItem.dbId || selectedItem.id,
          listingId: result.listingId,
          sellerAddress: account.address,
          assetContractAddress: selectedItem.contractAddress,
          tokenId: selectedItem.tokenId || tokenIdForChain,
          pricePerToken: parseFloat(listingPrice),
          startTimestamp: new Date().toISOString(),
          endTimestamp: endDate.toISOString(),
          transactionHash: result.transactionHash,
        });
      } catch (dbError) {
        toast({ title: 'Listed on-chain', description: 'Sync may take a moment.', variant: 'default' });
      }

      setListingStep('success');
      toast({ title: 'NFT listed successfully!' });
      setUserNFTs(prev => prev.map(nft => nft.id === selectedItem.id ? { ...nft, listed: true } : nft));
    } catch (err: unknown) {
      const error = err as Error;
      let errorMessage = error.message || 'Failed to create listing';
      if (errorMessage.includes('may not exist') || errorMessage.includes('execution reverted')) {
        errorMessage = 'This NFT has not been minted on-chain yet.';
      } else if (errorMessage.includes("don't own")) {
        errorMessage = 'You do not own this NFT on the blockchain.';
      }
      setListingError(errorMessage);
      setListingStep('error');
    } finally {
      setIsListingLoading(false);
    }
  }, [account, selectedItem, listingPrice, listingDuration, createListingMutation, toast]);

  // Handle approval
  const handleApprove = useCallback(async () => {
    if (!account || !selectedItem?.contractAddress) return;
    setIsListingLoading(true);
    setListingError(null);
    try {
      await approveMarketplace(selectedItem.contractAddress, account);
      setIsApproved(true);
      toast({ title: 'Collection approved' });
      setListingStep('listing');
      handleCreateListingInternal();
    } catch (err: unknown) {
      const error = err as Error;
      setListingError(error.message || 'Failed to approve');
      setListingStep('error');
      setIsListingLoading(false);
    }
  }, [account, selectedItem, toast, handleCreateListingInternal]);

  // Handle continue from configure step
  const handleListingContinue = useCallback(() => {
    if (!listingPrice || parseFloat(listingPrice) <= 0) {
      toast({ title: 'Please enter a valid price', variant: 'destructive' });
      return;
    }
    if (!isApproved) {
      setListingStep('approval');
    } else {
      setListingStep('listing');
      handleCreateListingInternal();
    }
  }, [listingPrice, isApproved, handleCreateListingInternal, toast]);

  // Handle back from listing view
  const handleBackFromListing = useCallback(() => {
    setListingStep('configure');
    setListingPrice('');
    setListingError(null);
    setViewMode('detail');
  }, []);

  // Handle accept offer
  const handleAcceptOffer = (item: LockerItem) => {
    if (item.isSystemItem) return;
    setDetailTab('offers');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7, duration: 0.4 }}
      className="flex-1 min-h-0 flex flex-col"
    >
      <div className="h-full bg-black/20 backdrop-blur-sm rounded-2xl border border-white/10 flex flex-col overflow-hidden relative">
        <AnimatePresence mode="wait">
          {viewMode === 'list' ? (
            <motion.div
              key="list-view"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full"
            >
              {/* Header - List View */}
              <div className="flex-shrink-0 p-3 border-b border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[rgb(163,255,18)]/20 flex items-center justify-center">
                      <Briefcase className="w-3.5 h-3.5 text-[rgb(163,255,18)]" />
                    </div>
                    <h3 className="text-white text-xs font-bold uppercase tracking-wider">Locker</h3>
                    <span className="text-white/40 text-[10px]">{filteredItems.length} items</span>
                  </div>
                  <button
                    onClick={() => router.push('/profile')}
                    className="text-white/40 hover:text-[rgb(163,255,18)] transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-1 overflow-x-auto scrollbar-none pb-1">
                  {filterTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveFilter(tab.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide whitespace-nowrap transition-all duration-200",
                        activeFilter === tab.id
                          ? "bg-[rgb(163,255,18)]/20 text-[rgb(163,255,18)] border border-[rgb(163,255,18)]/30"
                          : "bg-white/5 text-white/60 border border-transparent hover:bg-white/10 hover:text-white"
                      )}
                    >
                      {tab.id === 'all' && <Grid3X3 className="w-3 h-3" />}
                      {tab.id === 'backgrounds' && <Palette className="w-3 h-3" />}
                      {tab.id !== 'all' && tab.id !== 'backgrounds' && <Star className="w-3 h-3" />}
                      <span className="max-w-[80px] truncate">{tab.label}</span>
                      <span className="text-[8px] opacity-60">({tab.count})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Items Grid */}
              <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
              >
                {isLoading ? (
                  <div className="grid grid-cols-2 gap-2">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="aspect-square rounded-lg bg-white/5 animate-pulse" />
                    ))}
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-2">
                      <ImageIcon className="w-5 h-5 text-white/30" />
                    </div>
                    <p className="text-white/60 text-xs mb-1">No items found</p>
                    <button
                      onClick={() => router.push('/marketplace')}
                      className="text-[rgb(163,255,18)] text-[10px] font-bold hover:underline"
                    >
                      Browse Marketplace
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      {filteredItems.map((item, index) => {
                        const rarityStyle = RARITY_COLORS[item.rarity];
                        const isApplied = isItemApplied(item);
                        const isVideo = item.image.endsWith('.mp4') || item.image.endsWith('.webm');

                        return (
                          <motion.button
                            key={`${item.id}-${index}`}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handleItemClick(item)}
                            className={cn(
                              "group relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-300",
                              item.hasOffer && "ring-2 ring-amber-500/50 ring-offset-1 ring-offset-black/50",
                              isApplied
                                ? "border-[rgb(163,255,18)] shadow-lg shadow-[rgb(163,255,18)]/30"
                                : `${rarityStyle.border} hover:${rarityStyle.border}`
                            )}
                          >
                            {isVideo ? (
                              <video src={item.image} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                            ) : (
                              <MediaRenderer src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            )}

                            <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300", rarityStyle.bg)} />

                            {/* Offer indicator */}
                            {item.hasOffer && (
                              <div className="absolute top-1 right-1 bg-amber-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                <Gavel className="w-2 h-2" />
                                OFFER
                              </div>
                            )}

                            {isApplied && !item.hasOffer && (
                              <div className="absolute top-1 right-1 bg-[rgb(163,255,18)] text-black text-[8px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                <Check className="w-2 h-2" />
                                ACTIVE
                              </div>
                            )}

                            {item.isSystemItem && !isApplied && !item.hasOffer && (
                              <div className="absolute top-1 right-1 bg-black/60 backdrop-blur-sm text-white/60 text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                                FREE
                              </div>
                            )}

                            <div className={cn("absolute top-1 left-1 w-2 h-2 rounded-full",
                              item.rarity === 'legendary' && "bg-amber-400 animate-pulse",
                              item.rarity === 'epic' && "bg-purple-400",
                              item.rarity === 'rare' && "bg-blue-400",
                              item.rarity === 'common' && "bg-zinc-400",
                              item.rarity === 'system' && "bg-[rgb(163,255,18)]"
                            )} />

                            <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/70 to-transparent">
                              <p className="text-white/90 text-[9px] font-medium truncate">{item.name}</p>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>

                    <div ref={loadMoreRef} className="py-4">
                      {isLoadingMore && (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 text-[rgb(163,255,18)] animate-spin" />
                          <span className="text-white/60 text-[10px]">Loading more...</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          ) : viewMode === 'detail' ? (
            /* Detail View - Inline */
            <motion.div
              key="detail-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full"
            >
              {selectedItem && (
                <>
                  {/* Header - Detail View */}
                  <div className="flex-shrink-0 p-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleBackToList}
                        className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4 text-white" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white text-xs font-bold truncate">{selectedItem.name}</h3>
                        <p className="text-white/40 text-[10px] truncate">{selectedItem.collection}</p>
                      </div>
                      <button
                        onClick={handleBackToList}
                        className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                      >
                        <X className="w-4 h-4 text-white/60" />
                      </button>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {/* NFT Preview */}
                    <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-white/10">
                      {selectedItem.image.endsWith('.mp4') || selectedItem.image.endsWith('.webm') ? (
                        <video src={selectedItem.image} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                      ) : (
                        <MediaRenderer src={selectedItem.image} alt={selectedItem.name} className="w-full h-full object-cover" />
                      )}

                      {/* Rarity badge */}
                      <div className={cn(
                        "absolute top-2 left-2 px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                        RARITY_COLORS[selectedItem.rarity].bg,
                        RARITY_COLORS[selectedItem.rarity].border,
                        RARITY_COLORS[selectedItem.rarity].text,
                        "border backdrop-blur-sm"
                      )}>
                        {selectedItem.rarity}
                      </div>

                      {isItemApplied(selectedItem) && (
                        <div className="absolute top-2 right-2 bg-[rgb(163,255,18)] text-black text-[10px] font-black px-2 py-1 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          ACTIVE
                        </div>
                      )}
                    </div>

                    {/* Offer Banner - Prominent if has offers */}
                    {selectedItem.hasOffer && selectedItem.offerPrice && !selectedItem.isSystemItem && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-amber-500/30 flex items-center justify-center">
                              <Gavel className="w-5 h-5 text-amber-400" />
                            </div>
                            <div>
                              <p className="text-[10px] text-amber-300/80 font-medium uppercase tracking-wide">Highest Offer</p>
                              <p className="text-white font-bold text-lg">{selectedItem.offerPrice} ETH</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleAcceptOffer(selectedItem)}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold text-sm hover:from-amber-400 hover:to-orange-400 transition-all duration-200 shadow-lg shadow-amber-500/40 active:scale-95"
                          >
                            ACCEPT
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* Info Tabs */}
                    <div className="flex gap-1 p-1 bg-white/5 rounded-lg">
                      {(['info', 'offers', 'activity'] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setDetailTab(tab)}
                          className={cn(
                            "flex-1 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all",
                            detailTab === tab
                              ? "bg-[rgb(163,255,18)]/20 text-[rgb(163,255,18)]"
                              : "text-white/50 hover:text-white/80"
                          )}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    {/* Tab Content */}
                    <div className="space-y-2">
                      {detailTab === 'info' && (
                        <>
                          {/* Traits */}
                          {selectedItem.traits && selectedItem.traits.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-white/40 text-[10px] font-bold uppercase tracking-wide">Traits</p>
                              <div className="grid grid-cols-2 gap-1.5">
                                {selectedItem.traits.map((trait, i) => (
                                  <div key={i} className="p-2 rounded-lg bg-white/5 border border-white/10">
                                    <p className="text-white/40 text-[8px] uppercase">{trait.trait_type}</p>
                                    <p className="text-white text-[10px] font-bold truncate">{trait.value}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Details */}
                          <div className="space-y-1.5">
                            <p className="text-white/40 text-[10px] font-bold uppercase tracking-wide">Details</p>
                            <div className="space-y-1">
                              <div className="flex justify-between py-1.5 border-b border-white/5">
                                <span className="text-white/50 text-[10px]">Token ID</span>
                                <span className="text-white text-[10px] font-mono">{selectedItem.tokenId || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between py-1.5 border-b border-white/5">
                                <span className="text-white/50 text-[10px]">Collection</span>
                                <span className="text-white text-[10px]">{selectedItem.collection}</span>
                              </div>
                              {selectedItem.listed && (
                                <div className="flex justify-between py-1.5 border-b border-white/5">
                                  <span className="text-white/50 text-[10px]">Listed</span>
                                  <span className="text-[rgb(163,255,18)] text-[10px] font-bold">Yes</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      {detailTab === 'offers' && (
                        <div className="space-y-2">
                          {selectedItem.hasOffer ? (
                            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-white/40 text-[10px]">Best Offer</p>
                                  <p className="text-white font-bold">{selectedItem.offerPrice} ETH</p>
                                </div>
                                <button
                                  onClick={() => handleAcceptOffer(selectedItem)}
                                  className="px-4 py-2 rounded-lg bg-amber-500 text-black font-bold text-xs"
                                >
                                  ACCEPT
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-6">
                              <Gavel className="w-8 h-8 text-white/20 mx-auto mb-2" />
                              <p className="text-white/40 text-xs">No offers yet</p>
                            </div>
                          )}
                        </div>
                      )}

                      {detailTab === 'activity' && (
                        <div className="text-center py-6">
                          <Calendar className="w-8 h-8 text-white/20 mx-auto mb-2" />
                          <p className="text-white/40 text-xs">Activity coming soon</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Bar - Fixed at bottom */}
                  <div className="flex-shrink-0 p-3 border-t border-white/10 bg-black/30">
                    <div className="grid grid-cols-3 gap-2">
                      {selectedItem.isBackground ? (
                        <button
                          onClick={() => handleApplyBackground(selectedItem)}
                          disabled={isItemApplied(selectedItem)}
                          className={cn(
                            "flex flex-col items-center gap-1 py-2 rounded-lg border transition-all",
                            isItemApplied(selectedItem)
                              ? "bg-[rgb(163,255,18)]/20 border-[rgb(163,255,18)]/50 text-[rgb(163,255,18)]"
                              : "bg-[rgb(163,255,18)]/10 border-[rgb(163,255,18)]/30 text-[rgb(163,255,18)] hover:bg-[rgb(163,255,18)]/20"
                          )}
                        >
                          {isItemApplied(selectedItem) ? <Check className="w-4 h-4" /> : <Palette className="w-4 h-4" />}
                          <span className="text-[10px] font-bold">{isItemApplied(selectedItem) ? 'APPLIED' : 'APPLY'}</span>
                        </button>
                      ) : (
                        <button disabled className="flex flex-col items-center gap-1 py-2 rounded-lg border bg-white/5 border-white/10 text-white/30">
                          <User className="w-4 h-4" />
                          <span className="text-[10px] font-bold">EQUIP</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleListItem(selectedItem)}
                        disabled={selectedItem.isSystemItem}
                        className={cn(
                          "flex flex-col items-center gap-1 py-2 rounded-lg border transition-all",
                          selectedItem.isSystemItem
                            ? "bg-white/5 border-white/10 text-white/30"
                            : "bg-white/5 border-white/20 text-white/80 hover:bg-white/10"
                        )}
                      >
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-[10px] font-bold">LIST</span>
                      </button>

                      <button
                        onClick={() => router.push(`/marketplace/nft/${selectedItem.contractAddress}/${selectedItem.tokenId}`)}
                        disabled={selectedItem.isSystemItem}
                        className={cn(
                          "flex flex-col items-center gap-1 py-2 rounded-lg border transition-all",
                          selectedItem.isSystemItem
                            ? "bg-white/5 border-white/10 text-white/30"
                            : "bg-white/5 border-white/20 text-white/80 hover:bg-white/10"
                        )}
                      >
                        <ArrowRight className="w-4 h-4" />
                        <span className="text-[10px] font-bold">FULL VIEW</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          ) : (
            /* Listing View - Inline */
            <motion.div
              key="listing-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full"
            >
              {selectedItem && (
                <>
                  {/* Header - Listing View */}
                  <div className="flex-shrink-0 p-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleBackFromListing}
                        className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4 text-white" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Tag className="w-3.5 h-3.5 text-[rgb(163,255,18)]" />
                          <h3 className="text-white text-xs font-bold">List for Sale</h3>
                        </div>
                        <p className="text-white/40 text-[10px] truncate">{selectedItem.name}</p>
                      </div>
                      <button
                        onClick={handleBackFromListing}
                        className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                      >
                        <X className="w-4 h-4 text-white/60" />
                      </button>
                    </div>
                  </div>

                  {/* Listing Content */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    <AnimatePresence mode="wait">
                      {/* Configure Step */}
                      {listingStep === 'configure' && (
                        <motion.div
                          key="configure"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="space-y-3"
                        >
                          {/* NFT Preview - Compact */}
                          <div className="flex items-center gap-3 p-2 bg-white/5 rounded-xl">
                            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                              {selectedItem.image.endsWith('.mp4') || selectedItem.image.endsWith('.webm') ? (
                                <video src={selectedItem.image} className="w-full h-full object-cover" muted />
                              ) : (
                                <MediaRenderer src={selectedItem.image} alt={selectedItem.name} className="w-full h-full object-cover" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-xs font-bold truncate">{selectedItem.name}</p>
                              <p className="text-white/40 text-[10px] truncate">{selectedItem.collection}</p>
                            </div>
                          </div>

                          {/* Price Input */}
                          <div className="space-y-1.5">
                            <label className="text-white/60 text-[10px] font-bold uppercase tracking-wide">Price</label>
                            <div className="relative">
                              <input
                                type="number"
                                placeholder="0.00"
                                value={listingPrice}
                                onChange={(e) => setListingPrice(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm pr-12 focus:border-[rgb(163,255,18)]/50 focus:outline-none transition-colors"
                                step="0.001"
                                min="0"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 text-xs font-bold">ETH</span>
                            </div>
                          </div>

                          {/* Duration */}
                          <div className="space-y-1.5">
                            <label className="text-white/60 text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5">
                              <Calendar className="w-3 h-3" />
                              Duration
                            </label>
                            <div className="grid grid-cols-4 gap-1.5">
                              {DURATION_OPTIONS.map((option) => (
                                <button
                                  key={option.days}
                                  onClick={() => setListingDuration(option.days)}
                                  className={cn(
                                    "px-2 py-1.5 rounded-lg text-[10px] font-bold transition-colors",
                                    listingDuration === option.days
                                      ? "bg-[rgb(163,255,18)] text-black"
                                      : "bg-white/5 text-white/60 hover:bg-white/10"
                                  )}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Fee Breakdown */}
                          {listingPrice && parseFloat(listingPrice) > 0 && (
                            <div className="space-y-2 p-2.5 bg-white/5 rounded-xl">
                              <div className="flex items-center gap-1.5 text-[10px] text-white/50">
                                <DollarSign className="w-3 h-3" />
                                <span className="font-bold uppercase">Fee Breakdown</span>
                              </div>
                              <div className="space-y-1 text-[10px]">
                                <div className="flex justify-between">
                                  <span className="text-white/50">Platform (2.5%)</span>
                                  <span className="text-white">{listingProceeds.platformFee} ETH</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-white/50">Royalty (5%)</span>
                                  <span className="text-white">{listingProceeds.royalty} ETH</span>
                                </div>
                                <div className="flex justify-between pt-1.5 border-t border-white/10 font-bold">
                                  <span className="text-white/70">You Receive</span>
                                  <span className="text-[rgb(163,255,18)]">{listingProceeds.proceeds} ETH</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}

                      {/* Approval Step */}
                      {listingStep === 'approval' && (
                        <motion.div
                          key="approval"
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="space-y-3"
                        >
                          <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                            <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold text-amber-500 uppercase">Approval Required</p>
                              <p className="text-[10px] text-white/60">
                                Approve the marketplace to transfer NFTs from this collection. One-time per collection.
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2 p-2.5 bg-white/5 rounded-lg">
                              <div className="w-6 h-6 rounded-full bg-[rgb(163,255,18)]/10 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-[rgb(163,255,18)]">1</span>
                              </div>
                              <div className="flex-1">
                                <p className="text-[10px] font-bold text-white">Approve Collection</p>
                              </div>
                              {isListingLoading ? (
                                <Loader2 className="w-4 h-4 text-[rgb(163,255,18)] animate-spin" />
                              ) : (
                                <div className="w-4 h-4 rounded-full border-2 border-white/20" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 p-2.5 bg-white/5 rounded-lg opacity-50">
                              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-white/60">2</span>
                              </div>
                              <div className="flex-1">
                                <p className="text-[10px] font-bold text-white/60">Create Listing</p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Listing Step */}
                      {listingStep === 'listing' && (
                        <motion.div
                          key="listing"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="flex flex-col items-center text-center py-6"
                        >
                          <div className="w-12 h-12 rounded-full bg-[rgb(163,255,18)]/10 flex items-center justify-center mb-3">
                            <Loader2 className="w-6 h-6 text-[rgb(163,255,18)] animate-spin" />
                          </div>
                          <h3 className="text-white text-sm font-bold mb-1">Creating Listing</h3>
                          <p className="text-white/50 text-[10px]">Confirm in your wallet...</p>
                          <div className="mt-4 flex items-center gap-2 p-2 bg-white/5 rounded-lg">
                            <div className="w-8 h-8 rounded-md overflow-hidden">
                              <MediaRenderer src={selectedItem.image} alt={selectedItem.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="text-left">
                              <p className="text-white text-[10px] truncate max-w-[100px]">{selectedItem.name}</p>
                              <p className="text-[rgb(163,255,18)] text-xs font-bold">{listingPrice} ETH</p>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Success Step */}
                      {listingStep === 'success' && (
                        <motion.div
                          key="success"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="flex flex-col items-center text-center py-6"
                        >
                          <div className="w-12 h-12 rounded-full bg-[rgb(163,255,18)]/20 flex items-center justify-center mb-3">
                            <CheckCircle className="w-6 h-6 text-[rgb(163,255,18)]" />
                          </div>
                          <h3 className="text-white text-sm font-bold mb-1">Listed Successfully!</h3>
                          <p className="text-white/50 text-[10px]">Your NFT is now on the marketplace</p>
                          <div className="mt-4 flex items-center gap-2 p-2 bg-white/5 rounded-lg">
                            <div className="w-8 h-8 rounded-md overflow-hidden">
                              <MediaRenderer src={selectedItem.image} alt={selectedItem.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="text-left">
                              <p className="text-white text-[10px] truncate max-w-[100px]">{selectedItem.name}</p>
                              <p className="text-[rgb(163,255,18)] text-xs font-bold">{listingPrice} ETH</p>
                            </div>
                          </div>
                          {transactionHash && (
                            <a
                              href={getExplorerUrl(MARKETPLACE_CHAIN_ID, transactionHash)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-3 text-[10px] text-[rgb(163,255,18)] hover:underline"
                            >
                              View on {getExplorerName(MARKETPLACE_CHAIN_ID)} →
                            </a>
                          )}
                        </motion.div>
                      )}

                      {/* Error Step */}
                      {listingStep === 'error' && (
                        <motion.div
                          key="error"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="flex flex-col items-center text-center py-6"
                        >
                          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-3">
                            <AlertCircle className="w-6 h-6 text-red-500" />
                          </div>
                          <h3 className="text-white text-sm font-bold mb-1">Transaction Failed</h3>
                          <p className="text-white/50 text-[10px] max-w-[180px]">{listingError || 'Something went wrong'}</p>
                        </motion.div>
                      )}

                      {/* Not On-Chain Step */}
                      {listingStep === 'not_on_chain' && (
                        <motion.div
                          key="not_on_chain"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="flex flex-col items-center text-center py-6"
                        >
                          <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center mb-3">
                            <AlertCircle className="w-6 h-6 text-orange-500" />
                          </div>
                          <h3 className="text-white text-sm font-bold mb-1">Cannot List</h3>
                          <p className="text-white/50 text-[10px] max-w-[180px]">
                            This NFT hasn&apos;t been minted on-chain yet.
                          </p>
                          <div className="mt-4 p-2.5 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                            <p className="text-[10px] text-white/60">
                              Once claimed from the collection, it can be listed.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Action Bar - Listing View */}
                  <div className="flex-shrink-0 p-3 border-t border-white/10 bg-black/30">
                    {listingStep === 'configure' && (
                      <button
                        onClick={handleListingContinue}
                        disabled={!listingPrice || parseFloat(listingPrice) <= 0}
                        className={cn(
                          "w-full py-2.5 rounded-xl font-bold text-sm transition-all",
                          listingPrice && parseFloat(listingPrice) > 0
                            ? "bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90"
                            : "bg-white/10 text-white/30 cursor-not-allowed"
                        )}
                      >
                        Continue
                      </button>
                    )}

                    {listingStep === 'approval' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setListingStep('configure')}
                          disabled={isListingLoading}
                          className="flex-1 py-2.5 rounded-xl border border-white/20 text-white text-sm font-bold hover:bg-white/10 transition-colors"
                        >
                          Back
                        </button>
                        <button
                          onClick={handleApprove}
                          disabled={isListingLoading}
                          className="flex-1 py-2.5 rounded-xl bg-[rgb(163,255,18)] text-black text-sm font-bold hover:bg-[rgb(163,255,18)]/90 transition-colors flex items-center justify-center gap-2"
                        >
                          {isListingLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Approving...
                            </>
                          ) : (
                            'Approve'
                          )}
                        </button>
                      </div>
                    )}

                    {listingStep === 'success' && (
                      <button
                        onClick={handleBackToList}
                        className="w-full py-2.5 rounded-xl bg-[rgb(163,255,18)] text-black font-bold text-sm hover:bg-[rgb(163,255,18)]/90 transition-colors"
                      >
                        Done
                      </button>
                    )}

                    {listingStep === 'error' && (
                      <div className="flex gap-2">
                        <button
                          onClick={handleBackFromListing}
                          className="flex-1 py-2.5 rounded-xl border border-white/20 text-white text-sm font-bold hover:bg-white/10 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            setListingError(null);
                            setListingStep('configure');
                          }}
                          className="flex-1 py-2.5 rounded-xl bg-[rgb(163,255,18)] text-black text-sm font-bold hover:bg-[rgb(163,255,18)]/90 transition-colors"
                        >
                          Try Again
                        </button>
                      </div>
                    )}

                    {listingStep === 'not_on_chain' && (
                      <button
                        onClick={handleBackFromListing}
                        className="w-full py-2.5 rounded-xl bg-white/10 text-white font-bold text-sm hover:bg-white/20 transition-colors"
                      >
                        Close
                      </button>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

const mainNavigation = [
  {
    label: "PLAY",
    href: "/play",
    description: "Gaming Hub"
  },
    {
    label: "TRADE",
    href: "/trade",
    description: "Buy & Sell"
  },
  {
    label: "MUSEUM",
    href: "/museum",
    description: "Art & Culture"
  },
  {
    label: "COLLECTION",
    href: "/profile",
    description: "Your Assets"
  }
];

const trendingCollections = [
  {
    name: "HYPERTRONS",
    subtitle: "TRENDING #1",
    floor: "2.3 ETH",
    change: "+24%",
    image: "/assets/img/tron.mp4",
    type: "video"
  },
  {
    name: "JUGI TANDON",
    subtitle: "HOT",
    floor: "1.8 ETH", 
    change: "+18%",
    image: "/assets/img/jugi.mp4",
    type: "video"
  },
  {
    name: "SPACE PIRATES",
    subtitle: "RISING",
    floor: "3.1 ETH",
    change: "+31%",
    image: "https://picsum.photos/400/240?random=12",
    type: "image"
  }
];

const activeMissions = [
  { id: 1, title: "Daily Login Streak", progress: 85, reward: "50 HYP", status: "active" },
  { id: 2, title: "Complete 5 Trades", progress: 60, reward: "100 HYP", status: "active" },
  { id: 3, title: "Referral Bonus", progress: 25, reward: "200 HYP", status: "active" },
  { id: 4, title: "Weekly Challenge", progress: 90, reward: "500 HYP", status: "completing" }
];

type HomeViewProps = {
  setViewMode: (mode: string) => void;
};

export function HomeView({ setViewMode }: HomeViewProps) {
  const router = useRouter();
  const { user: walletUser } = useAuth();
  const { user } = useAuth();
  const { showCarousel, isCarouselVisible, hideCarousel, setCurrentBackground, currentBackground } = useBackgroundCarousel();
  const { isOpen: isChatOpen, unreadCounts, isMobileOverlayOpen, setMobileOverlayOpen } = useChat();
  const totalChatUnread = unreadCounts.world + unreadCounts.clan + unreadCounts.whispers;
  const [currentCollectionIndex, setCurrentCollectionIndex] = useState(0);
  const [mobileWallpaperOpen, setMobileWallpaperOpen] = useState(false);

  // First mission for compact display
  const displayedMissions = activeMissions.slice(0, 1);
  const connectButtonRef = useRef<HTMLDivElement>(null);

  // Define wallpapers array (same as desktop BackgroundCarousel)
  const wallpapers = [
    { id: 'bg1', src: '/assets/img/bg1.jpg', name: 'Original', type: 'image' },
    { id: 'bg2', src: '/assets/img/bgv1.mp4', name: 'Alternative', type: 'video' },
    { id: 'bg5', src: '/assets/img/bgv2.mp4', name: 'Variant 5', type: 'video' },
    { id: 'hpx', src: '/assets/img/hpx1.mp4', name: 'Video 3', type: 'video' },
    { id: 'bgvurl1', src: 'https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/21018676-5eb7-4306-9099-992a9c99f37a/transcode=true,original=true,quality=90/96694329.webm', name: 'Web Video', type: 'video' },
    { id: 'bgvurl2', src: 'https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/39561bcd-8a10-4e56-826c-6f3f7c813414/transcode=true,original=true,quality=90/ChicVideo.webm', name: 'Chic Video', type: 'video' },
    { id: 'bgvurl3', src: 'https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/1ad84358-5802-4eae-b74b-f6c880d38ea5/transcode=true,original=true,quality=90/vid_00005.webm', name: 'Video 5', type: 'video' },
    { id: 'bgvurl4', src: 'https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/a770baa3-875b-4e1d-9f8f-3a0f533e3f96/transcode=true,original=true,quality=90/Blood%20Moon%20Oni.webm', name: 'Blood Moon', type: 'video' },
    { id: 'bgvurl45', src: 'https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/7f64191f-c494-492e-ab3d-21fb88686523/transcode=true,original=true,quality=90/6JRGQ9C6B2HFZJ94J50N42NPJ0.webm?token=CfDJ8IU-uofjHWVPg1_3zdfXdVM1DITXcjK26rTZ_vSgBMON7cn-5Hl4AXjKzNKtDpWgM1vyLFAaaQOTYAXngeNshK2hchUDWACRROB_CMqEUo8WVGj-YwL9zsZzNiUr8P9Qrb2-fYUTWJFR9leN08g5eAEvNhLDPlRIhzJQ_J_OtG1vJHXmtmkbI4U9HzwrEJ_6mIzNxhxK7TdTQv5IdF-d6mRjZhiFfA2G7uXVfu5tTjmRqwan9Rou9I-n4vAonRsTHA.mp4', name: 'Neon', type: 'video' },
  ];

  useEffect(() => {
    const collectionInterval = setInterval(() => {
      setCurrentCollectionIndex((prev) => (prev + 1) % trendingCollections.length);
    }, 4000);
    return () => clearInterval(collectionInterval);
  }, []);

  // Create dynamic secondary navigation based on user creator status - memoized
  const secondaryNavigation = useMemo(() => [
    { label: "PROFILE", icon: MessageSquare, href: "/profile", external: true },
    { label: "ACHIEVEMENTS", icon: Trophy, href: "/achievements", external: true },
    { label: "MY LOOTBOXES", icon: Gift, href: "/lootboxes/reveal", external: true },
    { label: "PORTFOLIO", icon: Briefcase, href: "/portfolio", external: true },
    // Conditional creator/studio link
    user && (user.creatorAppliedAt || user.isCreator) 
      ? { label: "NFT STUDIO", icon: Crown, href: "/studio", external: false }
      : { label: "BECOME A CREATOR", icon: Crown, href: "/creator-onboarding", external: true }
  ].filter(Boolean), [user]); // Remove any falsy values

  return (
    <div className="flex flex-col h-screen overflow-x-hidden pt-16">
      {/* Header is provided by AnimatedHeader via LayoutWrapper */}
   
      {/* Main Content Area */}
      <div 
        className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_2fr_1fr] gap-6 relative px-4 md:px-8 xl:px-16 py-4 min-h-0"
        onClick={isCarouselVisible ? hideCarousel : undefined}
        style={{ cursor: isCarouselVisible ? 'pointer' : 'default' }}
      >
        {/* Left Navigation Panel - Desktop only, mobile handled by menu */}
        <motion.div
          className="hidden md:flex flex-col h-full relative"
          animate={{
            x: isCarouselVisible ? -400 : 0,
            opacity: isCarouselVisible ? 0 : 1
          }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {/* Navigation wrapper - vertically centered */}
          <div className="flex-1 flex flex-col justify-center space-y-4 lg:space-y-6">
          {/* Main Navigation - Centered vertically */}
          {mainNavigation.map((item, index) => {
            return (
              <motion.div 
                key={item.label}
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                whileHover={{ x: 24 }}
                transition={{ 
                  x: { duration: 0.15, ease: "easeOut" },
                  opacity: { duration: 0.3, ease: "easeOut", delay: 0.2 + index * 0.05 }
                }}
                onClick={() => {
                  if (item.label === 'TRADE') {
                    setViewMode('trade');
                  } else if (item.label === 'PLAY') {
                    setViewMode('play');
                  } else if (item.label === 'MUSEUM') {
                    setViewMode('museum');
                  } else if (item.label === 'COLLECTION') {
                    const addr = walletUser?.walletAddress;
                    if (addr) {
                      router.push(`/${addr}/collection`);
                    } else {
                      router.push(`/profile`);
                    }
                  } else {
                    null;
                  }
                }}
                onHoverStart={() => {
                  // Trigger beam animation immediately
                  const beams = document.querySelectorAll(`[data-beam-trigger="${item.label}"]`);
                  beams.forEach(beam => {
                    (beam as HTMLElement).style.animation = 'hyperRushEnter 0.4s ease-out forwards';
                    (beam as HTMLElement).style.opacity = '1';
                  });
                }}
                onHoverEnd={() => {
                  // Reset beam animation
                  const beams = document.querySelectorAll(`[data-beam-trigger="${item.label}"]`);
                  beams.forEach(beam => {
                    (beam as HTMLElement).style.animation = '';
                    (beam as HTMLElement).style.opacity = '0';
                  });
                }}
                className="group relative py-2 cursor-pointer opacity-0"
                style={{ opacity: 0 }}
              >
                  {/* Hyperspeed Animation Background */}
                  <div className="absolute inset-y-0 left-0 w-[120vw] -translate-x-full pointer-events-none">
                    {/* Main Energy Beam */}
                    <div data-beam-trigger={item.label} className="absolute top-1/2 left-0 w-full h-24 -translate-y-1/2 bg-gradient-to-r from-transparent via-[rgb(163,255,18)]/50 to-transparent blur-sm opacity-0" />
                    
                    {/* Secondary Glow */}
                    <div data-beam-trigger={item.label} className="absolute top-1/2 left-0 w-full h-40 -translate-y-1/2 bg-gradient-to-r from-transparent via-[rgb(163,255,18)]/25 to-transparent blur-md opacity-0" />
                    
                    {/* Core Beam */}
                    <div data-beam-trigger={item.label} className="absolute top-1/2 left-0 w-full h-1 -translate-y-1/2 bg-gradient-to-r from-transparent via-white/90 to-transparent blur-sm opacity-0" />
                    
                    {/* Speed Lines */}
                    <div data-beam-trigger={item.label} className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-[rgb(163,255,18)]/60 to-transparent blur-sm opacity-0" />
                    <div data-beam-trigger={item.label} className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-[rgb(163,255,18)]/60 to-transparent blur-sm opacity-0" />
                    
                    {/* Additional Power Lines */}
                    <div data-beam-trigger={item.label} className="absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/40 to-transparent blur-sm opacity-0" />
                    <div data-beam-trigger={item.label} className="absolute top-2/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/40 to-transparent blur-sm opacity-0" />
                  </div>
                  
                  {/* Link Content */}
                  <div className="relative z-10">
                    <h3 
                      className="text-white text-2xl lg:text-4xl xl:text-6xl font-black tracking-wider transition-all duration-300 group-hover:text-green-400" 
                      style={{ 
                        filter: 'drop-shadow(0 0 30px rgba(0,0,0,0.8))',
                        color: 'white'
                      }}
                    >
                      {item.label}
                    </h3>
                    <p className="text-white/70 text-sm lg:text-lg xl:text-xl font-medium group-hover:text-white transition-all duration-300 mt-1">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
            );
          })}

          {/* Secondary Navigation & Chat - Below divider */}
          <div className="pt-4 lg:pt-8 border-t border-white/20">
            {/* Secondary Navigation - Fades when chat is open (stays in DOM to prevent layout shift) */}
            <div
              className={cn(
                "space-y-3 lg:space-y-6 transition-opacity duration-150",
                isChatOpen ? "opacity-30 pointer-events-none" : "opacity-100"
              )}
            >
                  {secondaryNavigation.map((item) => {
              const handleClick = () => {
                if (!item.external && item.href === "/studio") {
                  setViewMode('studio');
                } else if (!item.external && item.label === 'COLLECTION') {
                  const addr = walletUser?.walletAddress;
                  if (addr) {
                    router.push(`/${addr}/collection`);
                  } else {
                    router.push(`/profile`);
                  }
                }
              };

              // Special styling for NFT Studio link
              const isNFTStudio = item.label === "NFT STUDIO";
              const isLootboxes = item.label === "LOOTBOXES";
              
              const animationContent = (
                <>
                  {/* Smaller Hyperspeed Animation */}
                  <div className="absolute inset-y-0 left-0 w-[100vw] -translate-x-full pointer-events-none">
                    {/* Energy Beam */}
                    <div className={`absolute top-1/2 left-0 w-full h-16 -translate-y-1/2 bg-gradient-to-r from-transparent ${isNFTStudio ? 'via-[rgb(255,215,0)]/40' : 'via-[rgb(163,255,18)]/40'} to-transparent blur-sm opacity-0 transition-all duration-75 group-hover:opacity-100 group-hover:animate-[hyperRushEnter_0.3s_ease-out_forwards] group-hover:[animation-fill-mode:forwards]`} />
                    
                    {/* Secondary Glow */}
                    <div className={`absolute top-1/2 left-0 w-full h-24 -translate-y-1/2 bg-gradient-to-r from-transparent ${isNFTStudio ? 'via-[rgb(255,215,0)]/20' : 'via-[rgb(163,255,18)]/20'} to-transparent blur-md opacity-0 transition-all duration-75 group-hover:opacity-100 group-hover:animate-[hyperRushEnter_0.3s_ease-out_forwards] group-hover:[animation-fill-mode:forwards]`} />
                    
                    {/* Core Beam */}
                    <div className="absolute top-1/2 left-0 w-full h-1 -translate-y-1/2 bg-gradient-to-r from-transparent via-white/80 to-transparent blur-sm opacity-0 transition-all duration-75 group-hover:opacity-100 group-hover:animate-[hyperRushEnter_0.3s_ease-out_forwards] group-hover:[animation-fill-mode:forwards]" />
                    
                    {/* Speed Lines */}
                    <div className={`absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent ${isNFTStudio ? 'via-[rgb(255,215,0)]/50' : 'via-[rgb(163,255,18)]/50'} to-transparent blur-sm opacity-0 transition-all duration-75 group-hover:opacity-100 group-hover:animate-[hyperRushEnter_0.3s_ease-out_forwards] group-hover:[animation-fill-mode:forwards]`} />
                    <div className={`absolute top-2/3 left-0 w-full h-px bg-gradient-to-r from-transparent ${isNFTStudio ? 'via-[rgb(255,215,0)]/50' : 'via-[rgb(163,255,18)]/50'} to-transparent blur-sm opacity-0 transition-all duration-75 group-hover:opacity-100 group-hover:animate-[hyperRushEnter_0.3s_ease-out_forwards] group-hover:[animation-fill-mode:forwards]`} />
                  </div>
                  
                  {/* Link Content */}
                  <div className="relative z-10">
                    <div className="flex items-center gap-3">
                      <h3 
                        className={`text-sm lg:text-lg xl:text-2xl font-black tracking-wider transition-all duration-300 ${
                          isNFTStudio 
                            ? 'text-[rgb(255,215,0)] group-hover:text-[rgb(255,223,0)]' 
                            : 'text-white'
                        }`}
                        style={{ 
                          filter: isNFTStudio 
                            ? 'drop-shadow(0 0 20px rgba(255,215,0,0.6))' 
                            : 'drop-shadow(0 0 20px rgba(0,0,0,0.7))'
                        }}
                      >
                        {isNFTStudio && <Crown className="inline w-4 lg:w-5 xl:w-6 h-4 lg:h-5 xl:h-6 mr-2 mb-1" />}
                        {item.label}
                      </h3>
                      
                      {isLootboxes && (
                        <div className="bg-gradient-to-r from-[rgb(255,215,0)] to-[rgb(255,193,7)] px-2 py-0.5 rounded border border-[rgb(255,215,0)]/50 shadow-lg shadow-[rgb(255,215,0)]/30 flex items-center">
                          <span className="text-black text-xs lg:text-sm font-black">3</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              );

              if (item.external) {
                return (
                  <Link key={item.label} href={item.href}>
                    <motion.div 
                      whileHover={{ x: 16 }}
                      transition={{ x: { duration: 0.15, ease: "easeOut" } }}
                      className="group relative py-1"
                    >
                      {animationContent}
                    </motion.div>
                  </Link>
                );
              }

              return (
                <motion.div 
                  key={item.label}
                  whileHover={{ x: 16 }}
                  transition={{ x: { duration: 0.15, ease: "easeOut" } }}
                  onClick={handleClick}
                  className="group relative py-1 cursor-pointer"
                >
                  {animationContent}
                </motion.div>
              );
            })}
            </div>
          </div>
          </div>

          {/* Inline Chat Panel - Absolutely positioned at bottom */}
          <div className="absolute bottom-0 left-0 right-0 pb-4">
            <InlineChatPanel />
          </div>
        </motion.div>

        {/* Center Space - Mobile content, Desktop empty */}
        <div className="relative md:block">
          {/* Mobile Bottom Navigation Bar - Fixed at bottom with icons */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-30">
            <div className="bg-black/60 backdrop-blur-xl border-t border-white/10">
              <div className="grid grid-cols-5">
                {/* Home Button */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    // Already on home, could add refresh or scroll to top logic
                  }}
                  className="flex flex-col items-center py-3 text-[rgb(163,255,18)] transition-colors group"
                >
                  <Home className="w-6 h-6 mb-1 group-active:scale-110 transition-transform" />
                  {/* <span className="text-[10px] font-bold uppercase tracking-wider">HOME</span> */}
                </motion.button>
                
                {/* Main Navigation Items */}
                {mainNavigation.map((item) => (
                  <motion.button
                    key={item.label}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      if (item.label === 'TRADE') {
                        setViewMode('trade');
                      } else if (item.label === 'PLAY') {
                        setViewMode('play');
                      } else if (item.label === 'MUSEUM') {
                        setViewMode('museum');
                      } else if (item.label === 'COLLECTION') {
                        const addr = walletUser?.walletAddress;
                        if (addr) {
                          router.push(`/${addr}/collection`);
                        } else {
                          router.push(`/profile`);
                        }
                      }
                    }}
                    className="flex flex-col items-center py-3 text-white/60 active:text-[rgb(163,255,18)] transition-colors group"
                  >
                    {item.label === 'TRADE' && <TrendingUp className="w-6 h-6 mb-1 group-active:scale-110 transition-transform" />}
                    {item.label === 'PLAY' && <Gamepad2 className="w-6 h-6 mb-1 group-active:scale-110 transition-transform" />}
                    {item.label === 'MUSEUM' && <ImageIcon className="w-6 h-6 mb-1 group-active:scale-110 transition-transform" />}
                    {item.label === 'COLLECTION' && <User className="w-6 h-6 mb-1 group-active:scale-110 transition-transform" />}
                    {/* <span className="text-[9px] font-bold uppercase tracking-wider">{item.label.slice(0, 5)}</span> */}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile Wallpaper Drawer - Side Panel */}
          <motion.div
            initial={false}
            animate={{ 
              x: mobileWallpaperOpen ? 0 : '-100%',
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden fixed top-0 left-0 h-full w-28 bg-black/95 backdrop-blur-2xl z-50 shadow-2xl border-r border-white/20"
          >
            {/* Close/Toggle Button */}
            <button
              onClick={() => setMobileWallpaperOpen(false)}
              className="absolute top-1/2 -right-10 -translate-y-1/2 bg-black/80 backdrop-blur-sm rounded-r-xl px-2 py-3 border border-white/10 border-l-0"
            >
              <Palette className="w-5 h-5 text-white/80" />
            </button>
            
            <div className="flex flex-col h-full py-16 px-3">
              {/* Header */}
              <div className="flex flex-col items-center gap-2 mb-6">
                <Sparkles className="w-6 h-6 text-[rgb(163,255,18)]" />
                <span className="text-[11px] text-white/80 font-black uppercase tracking-wider text-center">Wallpapers</span>
              </div>
              
              {/* Wallpaper Grid - Same as desktop */}
              <div className="flex flex-col gap-3 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                {wallpapers.map((wallpaper) => (
                  <motion.button
                    key={wallpaper.id}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setCurrentBackground(wallpaper.src);
                      setMobileWallpaperOpen(false);
                    }}
                    className={cn(
                      "relative w-full aspect-video rounded-lg overflow-hidden border-2 transition-all",
                      currentBackground === wallpaper.src 
                        ? "border-[rgb(163,255,18)] shadow-lg shadow-[rgb(163,255,18)]/30" 
                        : "border-white/10 hover:border-white/30"
                    )}
                  >
                    {wallpaper.type === 'video' ? (
                      <video 
                        src={wallpaper.src}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        onLoadedData={(e) => {
                          // Set video to a preview frame
                          const video = e.target as HTMLVideoElement;
                          video.currentTime = 1;
                          video.play();
                        }}
                      />
                    ) : (
                      <img 
                        src={wallpaper.src} 
                        alt={wallpaper.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    )}
                    
                    {/* Overlay with name */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity">
                      <span className="absolute bottom-1.5 left-1.5 text-[9px] text-white font-bold uppercase tracking-wide">
                        {wallpaper.name}
                      </span>
                    </div>
                    
                    {/* Selected indicator */}
                    {currentBackground === wallpaper.src && (
                      <div className="absolute top-1 right-1">
                        <div className="w-2 h-2 bg-[rgb(163,255,18)] rounded-full animate-pulse" />
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
              
              {/* Bottom Action - View All */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setMobileWallpaperOpen(false);
                  showCarousel();
                }}
                className="mt-4 p-2.5 bg-gradient-to-r from-[rgb(163,255,18)]/20 to-green-400/20 rounded-xl border border-[rgb(163,255,18)]/30 hover:bg-[rgb(163,255,18)]/30 transition-colors"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-[rgb(163,255,18)]" />
                  <span className="text-[10px] text-[rgb(163,255,18)] font-black tracking-wide">BROWSE ALL</span>
                </div>
              </motion.button>
            </div>
          </motion.div>

          {/* Mobile Wallpaper Drawer Backdrop */}
          {mobileWallpaperOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              onClick={() => setMobileWallpaperOpen(false)}
            />
          )}

          {/* Mobile Wallpaper Toggle - Shows when drawer is closed */}
          {!mobileWallpaperOpen && (
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: 0.3 }}
              onClick={() => setMobileWallpaperOpen(true)}
              className="md:hidden fixed left-0 top-1/2 -translate-y-1/2 z-30 bg-black/60 backdrop-blur-sm rounded-r-xl px-2 py-3 border border-white/10 border-l-0"
            >
              <Palette className="w-5 h-5 text-white/80" />
            </motion.button>
          )}

          {/* Mobile Chat Overlay */}
          <AnimatePresence>
            {isMobileOverlayOpen && (
              <MobileChatOverlay isOpen={isMobileOverlayOpen} onClose={() => setMobileOverlayOpen(false)} />
            )}
          </AnimatePresence>

          {/* Mobile Floating Action Cards - Positioned to avoid overlap */}
          <div className="md:hidden">
            {/* Combined Trending & Profile Card - Top Center, Responsive */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 20 }}
              transition={{ delay: 0.3 }}
              className="fixed top-16 left-4 right-4 z-20 flex justify-center"
            >
              <div className="flex flex-col sm:flex-row gap-2 w-full max-w-sm">
                {/* Trending Card */}
                <NotificationBar />
                <motion.div 
                  className="flex-1 bg-black/30 backdrop-blur-sm rounded-xl border border-white/10 p-3"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-white/60 text-[10px] uppercase tracking-wider">Trending</p>
                      <h4 className="text-white font-bold text-xs truncate">
                        {trendingCollections[currentCollectionIndex].name}
                      </h4>
                    </div>
                    <span className="text-[rgb(163,255,18)] text-xs font-bold ml-2">
                      {trendingCollections[currentCollectionIndex].change}
                    </span>
                  </div>
                </motion.div>

   
              </div>
            </motion.div>

            {/* Mission Indicator - Above bottom nav */}
            <motion.div
               initial={{ opacity: 0, y: 20, x: "-50%" }}
                animate={{ opacity: 1, y: 0, x: "-50%" }}
                transition={{ delay: 0.5 }}
                className="fixed bottom-20 left-1/2 z-20"
            >
              <motion.div 
                className="bg-black/30 backdrop-blur-sm rounded-full border border-white/10 px-4 py-2 flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
              >
                <Trophy className="w-4 h-4 text-[rgb(163,255,18)]" />
                <span className="text-white/80 text-xs">4 Active</span>
                <span className="text-[rgb(163,255,18)] font-bold text-xs">+50 HPX</span>
              </motion.div>
            </motion.div>
          </div>

     {/* Mobile Secondary Navigation */}
<motion.div
  initial={{ opacity: 0, x: 72 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{
    delay: 0.3,
    type: "spring",
    stiffness: 140,
    damping: 18
  }}
  className="
    fixed
    bottom-[calc(6rem+env(safe-area-inset-bottom))]
    right-4
    z-40
    flex
    flex-col
    items-center
    gap-4
    lg:hidden
  "
>
  {/* Chat Button - Top of column */}
  <motion.button
    onClick={() => setMobileOverlayOpen(true)}
    initial={{ opacity: 0, x: 32 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.4 }}
    whileTap={{ scale: 0.86 }}
    whileHover={{ scale: 1.04 }}
    className="
      relative
      w-12
      h-12
      rounded-full
      flex
      items-center
      justify-center
      backdrop-blur-md
      bg-black/45
      border
      border-[rgb(163,255,18)]/50
      shadow-xl
      transition-colors
    "
    aria-label={`Open chat${totalChatUnread > 0 ? `. ${totalChatUnread} unread messages` : ''}`}
  >
    {/* Glow ring */}
    <div className="absolute inset-0 rounded-full blur-md opacity-30 bg-[rgb(163,255,18)]/35" />
    <MessageSquare className="relative z-10 w-5 h-5 text-[rgb(163,255,18)]" />
    {totalChatUnread > 0 && (
      <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center shadow-md">
        {totalChatUnread > 99 ? '99+' : totalChatUnread}
      </div>
    )}
  </motion.button>

  {secondaryNavigation.map((item, index) => {
    const Icon = item.icon;
    const isNFTStudio = item.label === "NFT STUDIO";
    const isLootboxes = item.label === "LOOTBOXES";

    const handleClick = () => {
      if (item.external) {
        window.location.href = item.href;
        return;
      }

      if (item.href === "/studio") {
        setViewMode("studio");
        return;
      }

      router.push(item.href);
    };

    return (
      <motion.button
        key={item.label}
        onClick={handleClick}
        initial={{ opacity: 0, x: 32 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.45 + index * 0.05 }}
        whileTap={{ scale: 0.86 }}
        whileHover={{ scale: 1.04 }}
        className={`
          relative
          w-12
          h-12
          rounded-full
          flex
          items-center
          justify-center
          backdrop-blur-md
          bg-black/45
          border
          shadow-xl
          transition-colors
          ${
            isNFTStudio
              ? "border-[rgb(255,215,0)]/50"
              : "border-white/10"
          }
        `}
      >
        {/* Subtle glow ring */}
        <div
          className={`
            absolute
            inset-0
            rounded-full
            blur-md
            opacity-0
            transition-opacity
            ${
              isNFTStudio
                ? "bg-[rgb(255,215,0)]/35 group-hover:opacity-100"
                : "bg-white/10"
            }
          `}
        />

        {/* Icon */}
        <Icon
          className={`
            relative
            z-10
            w-5
            h-5
            transition-colors
            ${
              isNFTStudio
                ? "text-[rgb(255,215,0)]"
                : "text-white"
            }
          `}
        />

        {/* Lootbox count */}
        {isLootboxes && (
          <div
            className="
              absolute
              -top-1
              -right-1
              min-w-[18px]
              h-[18px]
              px-1
              rounded-full
              bg-[rgb(255,215,0)]
              text-black
              text-[10px]
              font-black
              flex
              items-center
              justify-center
              shadow-md
            "
          >
            3
          </div>
        )}
      </motion.button>
    );
  })}
</motion.div>



          {/* Desktop HUD Grid Overlay */}
          <div className="hidden md:block absolute inset-0 opacity-10">
            <div className="h-full w-full bg-[linear-gradient(rgba(163,255,18,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(163,255,18,0.1)_1px,transparent_1px)] bg-[size:40px_40px]" />
          </div>
          
          {/* Desktop Subtle scanning lines */}
          <div className="hidden md:block absolute inset-0">
            <div className="h-full w-full bg-[linear-gradient(0deg,transparent_98%,rgba(163,255,18,0.05)_100%)] bg-[length:100%_3px] animate-pulse" />
          </div>
        </div>

        {/* Right Panel - Hidden on mobile, visible on desktop */}
        <motion.div
          initial={{ x: 30, opacity: 0 }}
          animate={{
            x: isCarouselVisible ? 400 : 0,
            opacity: isCarouselVisible ? 0 : 1
          }}
          transition={{
            duration: isCarouselVisible ? 0.5 : 0.3,
            ease: "easeInOut",
            delay: isCarouselVisible ? 0 : 0.25
          }}
          className="hidden md:flex flex-col justify-start h-full max-h-full overflow-hidden gap-4 pb-4"
        >

          {/* Notification Bar */}
          <NotificationBar />

          {/* Trending Collections - Compact Bar */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="cursor-pointer group"
            onClick={() => router.push('/marketplace')}
          >
            <div className="relative overflow-hidden rounded-xl border backdrop-blur-xl transition-all duration-300 bg-black/30 border-white/10 hover:border-[rgb(163,255,18)]/40">
              <div className="relative flex items-center gap-3 px-4 py-3">
                {/* Thumbnail */}
                <div className="relative flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden">
                  {trendingCollections[currentCollectionIndex].type === 'video' ? (
                    <video
                      src={trendingCollections[currentCollectionIndex].image}
                      className="w-full h-full object-cover"
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={trendingCollections[currentCollectionIndex].image}
                      alt={trendingCollections[currentCollectionIndex].name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <TrendingUp className="w-3 h-3 text-[rgb(163,255,18)]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[rgb(163,255,18)]">
                      {trendingCollections[currentCollectionIndex].subtitle}
                    </span>
                  </div>
                  <p className="text-white text-sm font-bold truncate">
                    {trendingCollections[currentCollectionIndex].name}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex-shrink-0 text-right">
                  <p className="text-white/60 text-xs">Floor</p>
                  <p className="text-white font-bold text-sm">{trendingCollections[currentCollectionIndex].floor}</p>
                </div>

                {/* Change */}
                <div className="flex-shrink-0">
                  <span className="text-[rgb(163,255,18)] font-black text-sm">
                    {trendingCollections[currentCollectionIndex].change}
                  </span>
                </div>

                {/* Progress dots */}
                <div className="flex-shrink-0 flex gap-1">
                  {trendingCollections.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentCollectionIndex(index);
                      }}
                      className={cn(
                        "w-1.5 h-1.5 rounded-full transition-all duration-300",
                        index === currentCollectionIndex
                          ? "bg-[rgb(163,255,18)]"
                          : "bg-white/30 hover:bg-white/50"
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Active Missions - Compact Bar */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="cursor-pointer group"
            onClick={() => router.push('/control-center')}
          >
            <div className="relative overflow-hidden rounded-xl border backdrop-blur-xl transition-all duration-300 bg-black/30 border-white/10 hover:border-[rgb(163,255,18)]/40">
              <div className="relative flex items-center gap-3 px-4 py-3">
                {/* Icon */}
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[rgb(163,255,18)]/10">
                    <Trophy className="w-5 h-5 text-[rgb(163,255,18)]" />
                  </div>
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold flex items-center justify-center bg-[rgb(163,255,18)] text-black">
                    {activeMissions.length}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-[rgb(163,255,18)]">
                      Active Missions
                    </span>
                  </div>
                  <p className="text-white text-sm font-medium truncate">
                    {displayedMissions[0]?.title || 'No active missions'}
                  </p>
                </div>

                {/* Progress */}
                <div className="flex-shrink-0 flex items-center gap-3">
                  <div className="w-16">
                    <Progress
                      value={displayedMissions[0]?.progress || 0}
                      className="h-1.5 bg-white/10"
                    />
                  </div>
                  <span className="text-white/60 text-xs font-bold">
                    {displayedMissions[0]?.progress || 0}%
                  </span>
                </div>

                {/* Reward */}
                <div className="flex-shrink-0">
                  <span className="text-[rgb(163,255,18)] font-black text-sm">
                    +{activeMissions.reduce((sum, m) => sum + parseInt(m.reward), 0)} HYP
                  </span>
                </div>

                {/* Arrow */}
                <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white/70 group-hover:translate-x-1 transition-all duration-300" />
              </div>
            </div>
          </motion.div>

          {/* NFT Locker - Fortnite/Sims style */}
          <NFTLockerCard walletAddress={walletUser?.walletAddress} />
        </motion.div>
      </div>

      {/* Hidden ConnectButton for wallet management */}
      <div ref={connectButtonRef} className="hidden">
        <ConnectButton
          client={client}
          chain={sepolia}
          connectButton={{
            label: 'Connect Wallet',
          }}
          connectModal={{
            size: 'wide',
            titleIcon: '',
            welcomeScreen: {
              title: 'Connect to HypeX',
              subtitle: 'Choose how you want to connect to the ultimate gaming NFT marketplace.',
            },
          }}
        />
      </div>
    </div>
  );
}