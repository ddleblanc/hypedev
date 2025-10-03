"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Play, Pause, Volume2, VolumeX, Share2, Heart, Plus, Star, TrendingUp,
  Users, Eye, ShoppingCart, Zap, Crown, ChevronDown, ChevronUp, Search,
  Filter, Grid3x3, List, MoreHorizontal, ArrowLeft, Sparkles, Activity,
  X, ExternalLink, Copy, Check, SlidersHorizontal, Info, Shield, Clock,
  Award, Wallet, BarChart3, PieChart, Globe, Send, Calendar,
  AlertCircle, ArrowUpRight, ArrowDownRight, Flame, Target,
  Coins, DollarSign, Percent, Hash, RefreshCw, Bell, Settings, Verified,
  Bookmark, Download, Upload, Image, Layers, Box, Gauge, TrendingDown,
  Link2, Flag, MessageCircle, ThumbsUp, CheckCircle2, Timer, Gift, Rocket,
  Gamepad2, Minus, Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MediaRenderer } from "@/components/MediaRenderer";
import { cn } from "@/lib/utils";
import { useWalletAuthOptimized } from "@/hooks/use-wallet-auth-optimized";
import { AddToListModal } from "@/components/add-to-list-modal";
import { useActiveAccount, useActiveWalletChain, useSwitchActiveWalletChain } from "thirdweb/react";
import { claimNFT, getUserClaimStatus } from "@/lib/nft-minting";
import { defineChain } from "thirdweb/chains";
import { client } from "@/lib/thirdweb";
import { useTransaction } from "@/contexts/transaction-context";

interface LaunchpadProjectDetailProps {
  projectId: string;
}

// Mock project data for launchpad
const mockProject = {
  id: "cyber-warriors-genesis",
  title: "Cyber Warriors Genesis",
  subtitle: "Elite cyberpunk warriors collection",
  description: "Join the ranks of elite cyber-enhanced warriors in the dystopian future of Neo Tokyo.",
  longDescription: "Cyber Warriors Genesis is a collection of 10,000 unique cyberpunk warriors, each with hand-crafted traits and backstories. Set in the neon-lit streets of Neo Tokyo 2087, these warriors represent the pinnacle of cybernetic enhancement and martial arts mastery. Holders gain access to exclusive gameplay, community events, and future drops in the Cyber Warriors universe.",

  // Media
  heroVideo: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/9c5398c1-dcde-4d7c-ac6a-33fa6ff5d948/transcode=true,width=450,optimized=true/0e178c0604244fb9a44d5b87c6b2a815.webm",
  bannerImage: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/9c5398c1-dcde-4d7c-ac6a-33fa6ff5d948/original=true,quality=90/cyber-warriors-banner.jpg",
  logo: "/api/placeholder/120/120",

  // Launch Details
  mintPrice: "0.08",
  maxSupply: 10000,
  mintedCount: 3547,
  launchDate: "2024-02-15T18:00:00Z",
  launchStatus: "live", // upcoming, live, sold-out, ended

  // Mint details
  maxPerWallet: 5,
  whitelistPrice: "0.06",
  publicPrice: "0.08",
  currentPhase: "public", // whitelist, public

  // Creator/Team
  creator: {
    name: "CyberForge Studios",
    address: "0xCreator...5678",
    avatar: "/api/placeholder/80/80",
    verified: true,
    followers: "25.6K",
    description: "Leading Web3 gaming studio creating immersive cyberpunk experiences"
  },

  team: [
    {
      name: "Alex Chen",
      role: "Creative Director",
      avatar: "/api/placeholder/60/60",
      bio: "Former Ubisoft art director with 15+ years in game development"
    },
    {
      name: "Maya Rodriguez",
      role: "Lead Developer",
      avatar: "/api/placeholder/60/60",
      bio: "Blockchain engineer who built DeFi protocols for major exchanges"
    },
    {
      name: "Kai Nakamura",
      role: "Community Lead",
      avatar: "/api/placeholder/60/60",
      bio: "Community growth expert who scaled Discord servers to 100K+ members"
    }
  ],

  // Roadmap
  roadmap: [
    {
      phase: "Phase 1",
      title: "Genesis Launch",
      status: "completed",
      items: [
        "10,000 unique Cyber Warriors",
        "Community Discord launch",
        "Staking mechanism release",
        "First community event"
      ]
    },
    {
      phase: "Phase 2",
      title: "Game Alpha",
      status: "in-progress",
      items: [
        "3D battle arena game alpha",
        "PvP tournaments with ETH prizes",
        "Exclusive holder perks",
        "Second collection reveal"
      ]
    },
    {
      phase: "Phase 3",
      title: "Metaverse Integration",
      status: "upcoming",
      items: [
        "Virtual world integration",
        "Cross-game compatibility",
        "DAO governance launch",
        "Brand partnerships"
      ]
    }
  ],

  // Utility & Benefits
  utilities: [
    {
      title: "Game Access",
      description: "Exclusive access to Cyber Warriors battle arena",
      icon: Gamepad2,
      available: true
    },
    {
      title: "Staking Rewards",
      description: "Earn $CYBER tokens by staking your warriors",
      icon: Coins,
      available: true
    },
    {
      title: "Community Events",
      description: "VIP access to community tournaments and events",
      icon: Users,
      available: true
    },
    {
      title: "Future Drops",
      description: "Guaranteed whitelist for future collections",
      icon: Gift,
      available: false
    }
  ],

  // Traits preview
  traits: [
    {
      name: "Background",
      rarity: "Common to Legendary",
      preview: ["Neo Tokyo", "Cyber Grid", "Neon Void", "Digital Matrix"]
    },
    {
      name: "Cybernetics",
      rarity: "Rare to Mythic",
      preview: ["Neural Implant", "Bionic Arms", "Quantum Eyes", "Full Cyborg"]
    },
    {
      name: "Weapons",
      rarity: "Epic to Legendary",
      preview: ["Plasma Katana", "Laser Rifle", "Energy Shield", "Void Cannon"]
    }
  ],

  // Community & Social
  socials: {
    website: "https://cyberwarriors.io",
    twitter: "https://twitter.com/cyberwarriors",
    discord: "https://discord.gg/cyberwarriors",
    instagram: "https://instagram.com/cyberwarriors"
  },

  // Stats
  stats: {
    discordMembers: "45.2K",
    twitterFollowers: "38.9K",
    holders: "7.8K",
    floorPrice: "0.12",
    volume: "2.4K"
  }
};

export function LaunchpadProjectDetail({ projectId }: LaunchpadProjectDetailProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [mintQuantity, setMintQuantity] = useState(1);
  const [isMinting, setIsMinting] = useState(false);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [isCheckingWatchlist, setIsCheckingWatchlist] = useState(true);
  const [watchlistId, setWatchlistId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isAddToListModalOpen, setIsAddToListModalOpen] = useState(false);
  const [collection, setCollection] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userClaimStatus, setUserClaimStatus] = useState<{
    claimed: number;
    limit: number;
    remaining: number;
  }>({ claimed: 0, limit: -1, remaining: -1 });
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'exceed_limit' | 'cancelled' | 'insufficient_funds' | 'supply_exceeded' | 'no_conditions' | 'generic';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'generic'
  });

  const router = useRouter();
  const heroRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useWalletAuthOptimized();
  const account = useActiveAccount();
  const activeChain = useActiveWalletChain();
  const switchChain = useSwitchActiveWalletChain();
  const { startTransaction, updateStep, completeTransaction, setError: setTransactionError, setTxHash } = useTransaction();

  // Fetch collection data
  useEffect(() => {
    const fetchCollection = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/public/collections/${projectId}`);
        const data = await response.json();

        if (data.success && data.collection) {
          setCollection(data.collection);
        } else {
          setError(data.error || 'Failed to load collection');
        }
      } catch (err) {
        console.error('Error fetching collection:', err);
        setError('Failed to load collection');
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      fetchCollection();
    }
  }, [projectId]);

  // Parse claim phases from collection
  const claimPhases = collection?.claimPhases ? JSON.parse(collection.claimPhases) : [];

  // Determine active phase
  const now = new Date();
  const activePhase = claimPhases.find((phase: any) => {
    const phaseStart = new Date(phase.startTimestamp);
    return phaseStart <= now;
  });

  // Get the next upcoming phase
  const upcomingPhase = claimPhases.find((phase: any) => {
    const phaseStart = new Date(phase.startTimestamp);
    return phaseStart > now;
  });

  // Get mint price from active phase or default to 0
  const mintPrice = activePhase ? (parseFloat(activePhase.pricePerToken) / 1e18) : 0;

  // Determine launch status and timing based on collection data
  const launchDate = upcomingPhase
    ? new Date(upcomingPhase.startTimestamp)
    : collection?.deployedAt
    ? new Date(collection.deployedAt)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const isLive = collection?.isDeployed && activePhase !== undefined;
  const isSoldOut = collection?.maxSupply ? collection.mintedSupply >= collection.maxSupply : false;
  const isUpcoming = collection ? !collection.isDeployed || !activePhase : false;

  // Check if item is in watchlist
  useEffect(() => {
    const checkWatchlist = async () => {
      if (!user?.id || !collection) {
        setIsCheckingWatchlist(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/lists/check?userId=${user.id}&itemType=launchpad&itemId=${collection.id}`
        );
        const data = await response.json();

        if (data.success) {
          setIsWatchlisted(data.inWatchlist);

          // Get watchlist ID for this user
          const watchlistResponse = await fetch(`/api/lists/watchlist?userId=${user.id}`);
          const watchlistData = await watchlistResponse.json();
          if (watchlistData.success) {
            setWatchlistId(watchlistData.watchlist.id);
          }
        }
      } catch (error) {
        console.error('Error checking watchlist:', error);
      } finally {
        setIsCheckingWatchlist(false);
      }
    };

    checkWatchlist();
  }, [user?.id, collection]);

  // Countdown timer - Always call this hook, but conditionally execute logic inside
  useEffect(() => {
    // Early return if conditions not met - hook is still called every render
    if (!collection || collection.isDeployed) {
      return;
    }

    const updateCountdown = () => {
      const now = new Date().getTime();
      const launch = launchDate.getTime();
      const difference = launch - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [collection, launchDate, collection?.isDeployed]);

  // Phase countdown timer - Updates every second for phase transitions
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    if (!claimPhases || claimPhases.length === 0) {
      return;
    }

    const timer = setInterval(() => {
      forceUpdate(n => n + 1); // Force re-render to update countdowns
    }, 1000);

    return () => clearInterval(timer);
  }, [claimPhases]);

  // Fetch user's claim status when wallet connects or collection changes
  useEffect(() => {
    const fetchUserClaimStatus = async () => {
      if (!account || !collection) {
        setUserClaimStatus({ claimed: 0, limit: -1, remaining: -1 });
        return;
      }

      try {
        if (!collection.address) {
          console.error('Collection address is undefined');
          return;
        }

        const status = await getUserClaimStatus(
          collection.address,
          collection.chainId,
          account.address
        );
        setUserClaimStatus(status);
        console.log('User claim status:', status);
      } catch (error) {
        console.error('Error fetching user claim status:', error);
        setUserClaimStatus({ claimed: 0, limit: -1, remaining: -1 });
      }
    };

    fetchUserClaimStatus();
  }, [account, collection]);

  // Show loading or error states
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-white text-2xl font-bold mb-4">Collection Not Found</h2>
          <p className="text-white/60 mb-6">The collection you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => router.push('/launchpad')} className="bg-[rgb(163,255,18)] text-black">
            Back to Launchpad
          </Button>
        </div>
      </div>
    );
  }

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

  const handleMint = async () => {
    if (!account || !collection?.address) {
      console.error("No wallet connected or collection address missing");
      return;
    }

    setIsMinting(true);

    // Start the transaction tracking
    startTransaction(
      {
        id: collection.id,
        name: collection.name,
        image: collection.image || collection.bannerImage || '',
        collection: collection.name,
        contractAddress: collection.address,
      },
      'buy',
      mintPrice * mintQuantity
    );

    try {
      // Check if user is on the correct chain
      const requiredChainId = collection.chainId || 1; // Default to mainnet if not specified

      // Update to checkout step
      updateStep('checkout', 20);

      // If on wrong chain, prompt to switch
      if (activeChain?.id !== requiredChainId) {
        const targetChain = defineChain(requiredChainId);
        await switchChain(targetChain);
      }

      // Calculate the total price for the mint
      const totalPrice = mintPrice * mintQuantity;
      const priceInWei = totalPrice > 0 ? BigInt(Math.floor(totalPrice * 1e18)) : undefined;

      // Update to approve step (waiting for wallet confirmation)
      updateStep('approve', 40);

      // Call the claim function with value if there's a price
      console.log("Submitting mint transaction...");

      // Update to confirm step (user is confirming in wallet)
      updateStep('confirm', 60);

      const txHash = await claimNFT(
        {
          contractAddress: collection.address,
          chainId: requiredChainId,
          recipient: account.address,
          quantity: mintQuantity,
          value: priceInWei // Pass the ETH value for paid mints
        },
        account
      );

      console.log("Mint transaction submitted! Tx hash:", txHash);
      console.log("Waiting for blockchain confirmation...");

      // Update to pending step (transaction submitted)
      updateStep('pending', 80);
      setTxHash(txHash);

      // Wait for transaction to be mined (you can add a loading state here)
      // The transaction is already confirmed when sendTransaction returns

      // Get the current token supply to determine token IDs that were minted
      const isDropContract = ['DropERC721', 'ERC721Drop', 'OpenEditionERC721'].includes(collection.contractType || '');

      // Prepare NFT data for database
      const nftsToSave = [];
      for (let i = 0; i < mintQuantity; i++) {
        const nftData: any = {
          name: isDropContract && collection.sharedMetadata?.name
            ? collection.sharedMetadata.name
            : collection.name,
          description: isDropContract && collection.sharedMetadata?.description
            ? collection.sharedMetadata.description
            : collection.description,
          image: isDropContract && collection.sharedMetadata?.image
            ? collection.sharedMetadata.image
            : collection.image,
          attributes: isDropContract && collection.sharedMetadata?.attributes
            ? collection.sharedMetadata.attributes
            : [],
          ownerAddress: account.address,
          tokenId: `${Date.now()}-${i}`, // Temporary - would need to query contract for real token IDs
          metadataUri: isDropContract && collection.sharedMetadata?.image
            ? collection.sharedMetadata.image
            : collection.image
        };
        nftsToSave.push(nftData);
      }

      // Save minted NFTs to database
      console.log("Saving minted NFTs to database...");
      try {
        const response = await fetch('/api/studio/collections/nfts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            collectionId: collection.id,
            nfts: nftsToSave
          })
        });

        if (!response.ok) {
          console.error('Failed to save NFTs to database, but mint was successful');
        } else {
          console.log("NFTs saved to database successfully");
        }
      } catch (dbError) {
        console.error('Database error (mint was still successful):', dbError);
      }

      // Refresh collection data to update minted count and stats
      console.log("Refreshing collection data...");
      await fetchCollections();

      // Refresh user's claim status
      if (collection.address) {
        try {
          const status = await getUserClaimStatus(
            collection.address,
            collection.chainId,
            account.address
          );
          setUserClaimStatus(status);
          console.log('Updated user claim status after mint:', status);
        } catch (error) {
          console.error('Error updating claim status:', error);
        }
      }

      // Show success message
      console.log("Mint complete! Transaction hash:", txHash);

      // Mark transaction as successful
      updateStep('success', 100);

      // Complete the transaction after a short delay to show success state
      setTimeout(() => {
        completeTransaction();
      }, 3000);

    } catch (error: any) {
      console.error("Minting failed:", error);
      console.log("Error message:", error.message);
      console.log("Error toString:", error.toString());

      // Mark transaction as error in the pill
      updateStep('error', 0);
      setTransactionError(error.message || 'Transaction failed');

      // Handle specific error cases
      // Check both error.message and error.toString() as Thirdweb might format it differently
      const errorString = error.message || error.toString() || '';

      if (errorString.includes('DropClaimExceedLimit')) {
        // Extract the numbers from the error message
        // Format: DropClaimExceedLimit - [already_claimed],[total_limit]
        const match = errorString.match(/DropClaimExceedLimit - (\d+),(\d+)/);
        let alreadyClaimed = 0;
        let totalLimit = 0;
        let remainingClaims = 0;

        if (match) {
          alreadyClaimed = parseInt(match[1]);
          totalLimit = parseInt(match[2]);
          remainingClaims = totalLimit - alreadyClaimed;
        }

        // Create appropriate message based on the situation
        let message = '';
        if (remainingClaims > 0) {
          // User still has claims left but tried to mint too many
          if (mintQuantity > remainingClaims) {
            message = `You've already claimed ${alreadyClaimed} out of your ${totalLimit} allowed NFT${totalLimit !== 1 ? 's' : ''}. You tried to mint ${mintQuantity} more, but you can only claim ${remainingClaims} more! Try again with ${remainingClaims === 1 ? '1 NFT' : `${remainingClaims} or fewer NFTs`}. 📊`;
          } else {
            // This shouldn't happen but handle it anyway
            message = `You've already claimed ${alreadyClaimed} out of your ${totalLimit} allowed NFT${totalLimit !== 1 ? 's' : ''}. You can still claim up to ${remainingClaims} more!`;
          }
        } else {
          // User has hit their limit completely
          message = `You've already claimed all ${totalLimit} of your allowed NFT${totalLimit !== 1 ? 's' : ''} from this collection! You're all maxed out, time to let others join the party! 🎉`;
        }

        setErrorModal({
          isOpen: true,
          title: remainingClaims > 0 ? "Slow down there, collector! 📦" : "You're all set! ✨",
          message: message,
          type: 'exceed_limit'
        });
      } else if (errorString.includes('user rejected') || errorString.includes('User rejected') || errorString.includes('rejected by user')) {
        console.log("User cancelled the transaction");
        setErrorModal({
          isOpen: true,
          title: "Cold feet? 🦶",
          message: "No worries, we get it. Sometimes you need a moment to think. Come back when you're ready to join the club!",
          type: 'cancelled'
        });
      } else if (errorString.includes('insufficient funds') || errorString.includes('Insufficient funds')) {
        setErrorModal({
          isOpen: true,
          title: "Uh oh, wallet's looking light! 💸",
          message: "Looks like you need to top up your wallet. Even digital art costs digital money! Time to add some ETH.",
          type: 'insufficient_funds'
        });
      } else if (errorString.includes('!Qty') || errorString.includes('!QTY')) {
        setErrorModal({
          isOpen: true,
          title: "Supply crisis alert! 🚨",
          message: "Bad news - there aren't enough NFTs left for your order. Try reducing the quantity or be quicker next time!",
          type: 'supply_exceeded'
        });
      } else if (errorString.includes('!CONDITION') || errorString.includes('!Condition')) {
        setErrorModal({
          isOpen: true,
          title: "Not so fast! ⏰",
          message: "The minting hasn't started yet or the conditions aren't set. Check back soon or contact the creator!",
          type: 'no_conditions'
        });
      } else {
        // For debugging, let's log the full error to help identify other patterns
        console.error("Unhandled error pattern. Full error details:", {
          message: error.message,
          toString: error.toString(),
          error: error
        });

        setErrorModal({
          isOpen: true,
          title: "Oops, something went wrong! 🤷",
          message: "We hit a snag trying to mint your NFT. Don't worry, no funds were lost. Try again in a moment!",
          type: 'generic'
        });
      }
    } finally {
      setIsMinting(false);
    }
  };

  const handleWatchlistToggle = async () => {
    if (!user?.id || !collection) {
      return;
    }

    try {
      // Get or create watchlist if we don't have the ID yet
      let currentWatchlistId = watchlistId;
      if (!currentWatchlistId) {
        const watchlistResponse = await fetch(`/api/lists/watchlist?userId=${user.id}`);
        const watchlistData = await watchlistResponse.json();
        if (watchlistData.success) {
          currentWatchlistId = watchlistData.watchlist.id;
          setWatchlistId(currentWatchlistId);
        } else {
          console.error('Failed to get watchlist');
          return;
        }
      }

      if (isWatchlisted) {
        // Remove from watchlist
        const response = await fetch(
          `/api/lists/items?listId=${currentWatchlistId}&itemType=launchpad&itemId=${collection.id}`,
          { method: 'DELETE' }
        );
        const data = await response.json();

        if (data.success) {
          setIsWatchlisted(false);
        }
      } else {
        // Add to watchlist
        const response = await fetch('/api/lists/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listId: currentWatchlistId,
            itemType: 'launchpad',
            itemId: collection.id,
            collectionId: collection.id,
            metadata: {
              name: collection.name,
              image: collection.image || collection.bannerImage,
              description: collection.description,
              symbol: collection.symbol,
            },
          }),
        });
        const data = await response.json();

        if (data.success) {
          setIsWatchlisted(true);
        }
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
    }
  };

  const mintProgress = collection.maxSupply ? (collection.mintedSupply / collection.maxSupply) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full min-h-screen bg-black"
    >
      <TooltipProvider>
        {/* Hero Section */}
        <motion.div
          ref={heroRef}
          className="relative h-[70vh] overflow-hidden"
        >
          <div className="absolute inset-0">
            {collection.bannerImage || collection.image ? (
              <MediaRenderer
                src={collection.bannerImage || collection.image || ''}
                alt={collection.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-purple-600 to-blue-600" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />
          </div>

          {/* Back Button & Controls */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <Button
              size="icon"
              variant="ghost"
              className="bg-black/40 backdrop-blur text-white hover:bg-black/60"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>

          {/* Hero Content */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 p-6 md:p-12"
          >
            {/* Creator Info */}
            {collection.project && (
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[rgb(163,255,18)] to-green-400 flex items-center justify-center">
                  <span className="text-black font-bold text-lg">{collection.project.name[0]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-white/80">Created by</p>
                  <p className="text-white font-bold">{collection.project.name}</p>
                  <Verified className="w-5 h-5 text-blue-400 fill-current" />
                </div>
              </div>
            )}

            {/* Project Title */}
            <h1 className="text-5xl md:text-7xl font-black text-white mb-4">
              {collection.name}
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-3xl">
              {collection.description || `Discover the ${collection.name} collection - ${collection.symbol} tokens bringing unique digital assets to life.`}
            </p>

            {/* Launch Status & Quick Info */}
            <div className="flex flex-wrap items-center gap-6 mb-8">
              {/* Status Badge */}
              <div>
                <Badge className={cn(
                  "text-sm px-4 py-2 font-bold",
                  isLive ? "bg-white/10 text-white border-white/20" :
                  isSoldOut ? "bg-red-500 text-white" :
                  isUpcoming ? "bg-white/10 text-white border-white/20" :
                  "bg-gray-500 text-white"
                )}>
                  {isLive ? (
                    <>
                      <Rocket className="w-4 h-4 mr-1" />
                      Live Now
                    </>
                  ) : isSoldOut ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Sold Out
                    </>
                  ) : isUpcoming ? (
                    <>
                      <Timer className="w-4 h-4 mr-1" />
                      Launching Soon
                    </>
                  ) : (
                    "Ended"
                  )}
                </Badge>
              </div>

              <Separator orientation="vertical" className="h-12 bg-white/20" />

              {/* Mint Price */}
              <div>
                <p className="text-sm text-white/60">Mint Price</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-[rgb(163,255,18)]">
                    {mintPrice > 0 ? `${mintPrice.toFixed(4)} ETH` : 'FREE'}
                  </p>
                  <p className="text-sm text-white/60">per NFT</p>
                </div>
              </div>

              {collection.maxSupply && (
                <>
                  <Separator orientation="vertical" className="h-12 bg-white/20" />

                  {/* Supply */}
                  <div>
                    <p className="text-sm text-white/60">Supply</p>
                    <p className="text-2xl font-bold text-white">
                      {collection.maxSupply.toLocaleString()}
                    </p>
                  </div>
                </>
              )}

              <Separator orientation="vertical" className="h-12 bg-white/20" />

              {/* Minted */}
              <div>
                <p className="text-sm text-white/60">Minted</p>
                <p className="text-2xl font-bold text-white">
                  {collection.mintedSupply.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4">
              <Button
                size="lg"
                className="bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90 font-bold px-8"
                disabled={!isLive || isSoldOut}
              >
                {isSoldOut ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Sold Out
                  </>
                ) : isLive ? (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Mint Now
                  </>
                ) : (
                  <>
                    <Timer className="w-5 h-5 mr-2" />
                    Coming Soon
                  </>
                )}
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
                onClick={handleWatchlistToggle}
                disabled={isCheckingWatchlist || !user}
              >
                {isCheckingWatchlist ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : isWatchlisted ? (
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
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
                onClick={() => setIsAddToListModalOpen(true)}
                disabled={!user}
              >
                <Bookmark className="w-5 h-5 mr-2" />
                Add to List
              </Button>

              <Button
                size="lg"
                variant="ghost"
                className="text-white hover:bg-white/10"
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
                      <svg
                        viewBox="0 0 24 24"
                        className="w-5 h-5 fill-current"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Twitter</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost" className="text-white hover:bg-white/10">
                      <MessageCircle className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Discord</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Main Content */}
        <div className="relative bg-black pb-8">
          {/* Mint Progress Bar */}
          {collection.maxSupply && (
            <div className="bg-black/95 backdrop-blur-lg border-b border-white/10 p-6">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-white font-bold text-lg">
                      {collection.mintedSupply.toLocaleString()} / {collection.maxSupply.toLocaleString()} minted
                    </p>
                    <p className="text-white/60 text-sm">{mintProgress.toFixed(1)}% complete</p>
                  </div>
                  {isUpcoming && (
                    <div className="text-right">
                      <p className="text-white/60 text-sm mb-1">Launches in:</p>
                      <div className="flex items-center gap-2 text-[rgb(163,255,18)] font-bold">
                        <span>{timeLeft.days}d</span>
                        <span>{timeLeft.hours}h</span>
                        <span>{timeLeft.minutes}m</span>
                        <span>{timeLeft.seconds}s</span>
                      </div>
                    </div>
                  )}
                </div>
                <Progress value={mintProgress} className="w-full h-3 bg-white/10" />
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="sticky top-16 z-20 bg-black/95 backdrop-blur-lg border-b border-white/10">
            <div className="px-4 md:px-6 max-w-7xl mx-auto">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-transparent border-0 h-auto p-0 w-full justify-start overflow-x-auto">
                  <TabsTrigger
                    value="overview"
                    className="text-white/60 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-[rgb(163,255,18)] rounded-none px-6 py-4"
                  >
                    <Info className="w-4 h-4 mr-2" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="mint"
                    className="text-white/60 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-[rgb(163,255,18)] rounded-none px-6 py-4"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Mint
                  </TabsTrigger>
                  {mockProject.roadmap && mockProject.roadmap.length > 0 && (
                    <TabsTrigger
                      value="roadmap"
                      className="text-white/60 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-[rgb(163,255,18)] rounded-none px-6 py-4"
                    >
                      <Target className="w-4 h-4 mr-2" />
                      Roadmap
                    </TabsTrigger>
                  )}
                  {mockProject.team && mockProject.team.length > 0 && (
                    <TabsTrigger
                      value="team"
                      className="text-white/60 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-[rgb(163,255,18)] rounded-none px-6 py-4"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Team
                    </TabsTrigger>
                  )}
                </TabsList>

                {/* Tab Contents */}
                <div className="py-8">
                  {/* Overview Tab */}
                  <TabsContent value="overview" className="mt-0 space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Main Content */}
                      <div className="lg:col-span-2 space-y-8">
                        {/* About Project */}
                        <Card className="bg-black/40 border-white/10">
                          <CardHeader>
                            <CardTitle className="text-white">About {collection.name}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-white/80 leading-relaxed mb-6">
                              {collection.description || `The ${collection.name} collection features ${collection.symbol} tokens with unique digital artwork and utilities. Join the community and discover what makes this collection special.`}
                            </p>

                            {/* Key Features - Only show if utilities exist */}
                            {mockProject.utilities && mockProject.utilities.length > 0 && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {mockProject.utilities.map((utility, index) => (
                                  <div key={index} className="flex items-start gap-3 p-4 bg-black/40 rounded-lg">
                                    <div className={cn(
                                      "p-2 rounded-lg",
                                      utility.available ? "bg-[rgb(163,255,18)]/20" : "bg-gray-500/20"
                                    )}>
                                      <utility.icon className={cn(
                                        "w-5 h-5",
                                        utility.available ? "text-[rgb(163,255,18)]" : "text-gray-400"
                                      )} />
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="text-white font-medium mb-1">{utility.title}</h4>
                                      <p className="text-white/60 text-sm">{utility.description}</p>
                                      {!utility.available && (
                                        <Badge className="mt-2 bg-gray-500/20 text-gray-400 text-xs">
                                          Coming Soon
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Traits Preview - Only show if traits exist */}
                        {mockProject.traits && mockProject.traits.length > 0 && (
                          <Card className="bg-black/40 border-white/10">
                            <CardHeader>
                              <CardTitle className="text-white">Traits & Rarity</CardTitle>
                              <CardDescription className="text-white/60">
                                Preview of trait categories and rarities
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-6">
                                {mockProject.traits.map((trait, index) => (
                                  <div key={index}>
                                    <div className="flex items-center justify-between mb-3">
                                      <h4 className="text-white font-medium">{trait.name}</h4>
                                      <Badge className="bg-white/10 text-white/80 text-xs">
                                        {trait.rarity}
                                      </Badge>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                      {trait.preview.map((item, idx) => (
                                        <div key={idx} className="p-2 bg-black/40 rounded-lg text-center">
                                          <p className="text-white/80 text-sm">{item}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>

                      {/* Sidebar */}
                      <div className="space-y-6">
                        {/* Quick Stats */}
                        <Card className="bg-black/40 border-white/10">
                          <CardHeader>
                            <CardTitle className="text-white">Collection Stats</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex justify-between">
                              <span className="text-white/60">Symbol</span>
                              <span className="text-white font-bold">{collection.symbol}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/60">Current Holders</span>
                              <span className="text-white font-bold">{collection.holders.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/60">Royalty</span>
                              <span className="text-white font-bold">{collection.royaltyPercentage}%</span>
                            </div>
                            <Separator className="bg-white/10" />
                            <div className="flex justify-between">
                              <span className="text-white/60">Floor Price</span>
                              <span className="text-[rgb(163,255,18)] font-bold">{collection.floorPrice < 0.01 ? collection.floorPrice.toFixed(4) : collection.floorPrice.toFixed(3)} ETH</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/60">Total Volume</span>
                              <span className="text-white font-bold">{collection.volume < 0.01 ? collection.volume.toFixed(4) : collection.volume.toFixed(1)} ETH</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/60">Created</span>
                              <span className="text-white font-bold">{new Date(collection.createdAt).toLocaleDateString()}</span>
                            </div>
                            {collection.deployedAt && (
                              <div className="flex justify-between">
                                <span className="text-white/60">Deployed</span>
                                <span className="text-white font-bold">{new Date(collection.deployedAt).toLocaleDateString()}</span>
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Launch Details */}
                        <Card className="bg-black/40 border-white/10">
                          <CardHeader>
                            <CardTitle className="text-white">Launch Details</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {collection.deployedAt && (
                              <div className="flex justify-between">
                                <span className="text-white/60">Launch Date</span>
                                <span className="text-white font-bold">
                                  {new Date(collection.deployedAt).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                            {activePhase && (
                              <div className="flex justify-between">
                                <span className="text-white/60">Max per Wallet</span>
                                <span className="text-white font-bold">
                                  {activePhase.quantityLimitPerWallet && activePhase.quantityLimitPerWallet > 0
                                    ? activePhase.quantityLimitPerWallet
                                    : 'Unlimited'}
                                </span>
                              </div>
                            )}
                            {mintPrice >= 0 && (
                              <div className="flex justify-between">
                                <span className="text-white/60">Mint Price</span>
                                <span className="text-white font-bold">
                                  {mintPrice > 0 ? `${mintPrice.toFixed(4)} ETH` : 'FREE'}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-white/60">Current Phase</span>
                              <Badge className="bg-[rgb(163,255,18)]/20 text-[rgb(163,255,18)] capitalize">
                                {activePhase ? activePhase.metadata?.name || 'Active' : upcomingPhase ? 'Upcoming' : 'Not Started'}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Claim Phases Timeline */}
                        {claimPhases.length > 0 && (
                          <Card className="bg-black/40 border border-white/10">
                            <CardHeader>
                              <CardTitle className="text-lg flex items-center gap-2 text-white">
                                <Calendar className="w-5 h-5 text-[rgb(163,255,18)]" />
                                Claim Phases
                              </CardTitle>
                              <CardDescription className="text-white/60">
                                Scheduled minting phases for this collection
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {claimPhases
                                .sort((a: any, b: any) => new Date(a.startTimestamp).getTime() - new Date(b.startTimestamp).getTime())
                                .map((phase: any, index: number) => {
                                  const phaseStart = new Date(phase.startTimestamp);
                                  const isActive = phaseStart <= now && (!claimPhases[index + 1] || new Date(claimPhases[index + 1].startTimestamp) > now);
                                  const isPast = phaseStart <= now && !isActive;
                                  const isFuture = phaseStart > now;
                                  const phasePrice = parseFloat(phase.pricePerToken) / 1e18;

                                  return (
                                    <div
                                      key={index}
                                      className={cn(
                                        "relative p-4 rounded-lg border transition-all",
                                        isActive && "bg-[rgb(163,255,18)]/10 border-[rgb(163,255,18)]/50",
                                        isPast && "bg-white/5 border-white/10 opacity-60",
                                        isFuture && "bg-white/5 border-white/20"
                                      )}
                                    >
                                      {/* Phase Status Badge */}
                                      <div className="absolute -top-2 -right-2">
                                        {isActive && (
                                          <Badge className="bg-[rgb(163,255,18)] text-black">
                                            <Zap className="w-3 h-3 mr-1" />
                                            Active Now
                                          </Badge>
                                        )}
                                        {isPast && (
                                          <Badge variant="secondary" className="bg-white/10">
                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                            Completed
                                          </Badge>
                                        )}
                                        {isFuture && (
                                          <Badge variant="outline" className="border-white/30">
                                            <Clock className="w-3 h-3 mr-1" />
                                            Upcoming
                                          </Badge>
                                        )}
                                      </div>

                                      <div className="space-y-3">
                                        {/* Phase Name & Number */}
                                        <div className="flex items-start justify-between">
                                          <div>
                                            <h4 className="font-semibold text-white flex items-center gap-2">
                                              <span className="text-[rgb(163,255,18)]">Phase {index + 1}</span>
                                              {phase.metadata?.name && (
                                                <>
                                                  <span className="text-white/40">•</span>
                                                  <span>{phase.metadata.name}</span>
                                                </>
                                              )}
                                            </h4>
                                            {phase.metadata?.description && (
                                              <p className="text-sm text-white/60 mt-1">{phase.metadata.description}</p>
                                            )}
                                          </div>
                                        </div>

                                        {/* Phase Details */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                          <div>
                                            <p className="text-white/60 mb-1">Start Time</p>
                                            <p className="text-white font-medium">
                                              {phaseStart.toLocaleDateString()} {phaseStart.toLocaleTimeString()}
                                            </p>
                                          </div>
                                          <div>
                                            <p className="text-white/60 mb-1">Price</p>
                                            <p className="text-white font-medium">
                                              {phasePrice > 0 ? `${phasePrice.toFixed(4)} ETH` : 'FREE'}
                                            </p>
                                          </div>
                                          <div>
                                            <p className="text-white/60 mb-1">Per Wallet</p>
                                            <p className="text-white font-medium">
                                              {phase.quantityLimitPerWallet && phase.quantityLimitPerWallet > 0
                                                ? phase.quantityLimitPerWallet
                                                : 'Unlimited'}
                                            </p>
                                          </div>
                                          {phase.maxClaimableSupply && (
                                            <div>
                                              <p className="text-white/60 mb-1">Phase Supply</p>
                                              <p className="text-white font-medium">
                                                {phase.maxClaimableSupply.toLocaleString()}
                                              </p>
                                            </div>
                                          )}
                                        </div>

                                        {/* Progress Bar for Active Phase */}
                                        {isActive && phase.maxClaimableSupply && (
                                          <div className="pt-2">
                                            <div className="flex justify-between text-xs mb-1">
                                              <span className="text-white/60">Phase Progress</span>
                                              <span className="text-[rgb(163,255,18)]">
                                                {phase.supplyClaimed || 0} / {phase.maxClaimableSupply}
                                              </span>
                                            </div>
                                            <Progress
                                              value={(phase.supplyClaimed || 0) / phase.maxClaimableSupply * 100}
                                              className="h-2 bg-white/10"
                                            />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Mint Tab */}
                  <TabsContent value="mint" className="mt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
                      {/* Left Side - Art Showcase */}
                      <div className="space-y-6">
                        {/* Main Feature Image */}
                        <Card className="bg-black/40 border-white/10 overflow-hidden group">
                          <div className="relative aspect-square overflow-hidden">
                            <MediaRenderer
                              src={
                                (collection.contractType === 'DropERC721' || collection.contractType === 'ERC721Drop' || collection.contractType === 'OpenEditionERC721')
                                  ? (collection.sharedMetadata?.image || collection.image || collection.bannerImage || '')
                                  : (collection.image || collection.bannerImage || '')
                              }
                              alt={
                                (collection.contractType === 'DropERC721' || collection.contractType === 'ERC721Drop' || collection.contractType === 'OpenEditionERC721')
                                  ? (collection.sharedMetadata?.name || collection.name)
                                  : collection.name
                              }
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                            {/* Floating Stats */}
                            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                              <Badge className="bg-[rgb(163,255,18)] text-black font-bold px-3 py-1">
                                Featured
                              </Badge>
                              {collection.maxSupply && (
                                <Badge className="bg-black/60 backdrop-blur-sm text-white font-bold px-3 py-1 border border-white/20">
                                  {collection.mintedSupply}/{collection.maxSupply}
                                </Badge>
                              )}
                            </div>

                            {/* Bottom Info */}
                            <div className="absolute bottom-4 left-4 right-4">
                              <p className="text-white/80 text-sm mb-2">You'll receive</p>
                              <h3 className="text-white text-2xl font-black">
                                {(collection.contractType === 'DropERC721' || collection.contractType === 'ERC721Drop' || collection.contractType === 'OpenEditionERC721')
                                  ? (collection.sharedMetadata?.name || collection.name)
                                  : collection.name
                                } NFT
                              </h3>
                            </div>
                          </div>
                        </Card>

                        {/* Shared Metadata Info for Drop Contracts */}
                        {(collection.contractType === 'DropERC721' || collection.contractType === 'ERC721Drop' || collection.contractType === 'OpenEditionERC721') && collection.sharedMetadata && (
                          <Card className="bg-black/40 border-white/10">
                            <CardHeader>
                              <CardTitle className="text-white flex items-center gap-2">
                                <Info className="w-5 h-5 text-[rgb(163,255,18)]" />
                                NFT Metadata
                              </CardTitle>
                              <CardDescription className="text-white/60">
                                All NFTs in this collection share this metadata
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {collection.sharedMetadata.description && (
                                <div>
                                  <h4 className="text-sm font-semibold text-white mb-2">Description</h4>
                                  <p className="text-white/70 text-sm">{collection.sharedMetadata.description}</p>
                                </div>
                              )}

                              {collection.sharedMetadata.attributes && collection.sharedMetadata.attributes.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-semibold text-white mb-3">Attributes</h4>
                                  <div className="grid grid-cols-2 gap-3">
                                    {collection.sharedMetadata.attributes.map((attr, idx) => (
                                      <div key={idx} className="bg-white/5 rounded-lg p-3 border border-white/10">
                                        <p className="text-xs text-white/60 mb-1">{attr.trait_type}</p>
                                        <p className="text-sm text-white font-medium">{attr.value}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="pt-3 border-t border-white/10">
                                <p className="text-xs text-white/50">
                                  Each minted NFT will have a unique token ID appended to the name
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Possible Traits/Variations Grid - Only show for non-Drop contracts */}
                        {!(collection.contractType === 'DropERC721' || collection.contractType === 'ERC721Drop' || collection.contractType === 'OpenEditionERC721') && mockProject.traits && mockProject.traits.length > 0 && (
                          <Card className="bg-black/40 border-white/10">
                            <CardHeader>
                              <CardTitle className="text-white">Possible Traits</CardTitle>
                              <CardDescription className="text-white/60">
                                Each NFT comes with unique combinations
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-2 gap-4">
                                {mockProject.traits.slice(0, 4).map((trait, index) => (
                                  <div
                                    key={index}
                                    className="bg-black/60 rounded-lg p-4 border border-white/10 hover:border-white/20 transition-all"
                                  >
                                    <div className="flex items-start justify-between mb-2">
                                      <h4 className="text-white font-bold text-sm">{trait.name}</h4>
                                      <Badge className="bg-white/10 text-white/80 text-xs">
                                        {trait.preview.length}
                                      </Badge>
                                    </div>
                                    <p className="text-white/40 text-xs mb-3">{trait.rarity}</p>
                                    <div className="space-y-1">
                                      {trait.preview.slice(0, 2).map((item, idx) => (
                                        <div
                                          key={idx}
                                          className="text-white/70 text-xs p-2 bg-white/5 rounded"
                                        >
                                          {item}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Collection Stats */}
                        <div className="grid grid-cols-3 gap-4">
                          <Card className="bg-black/40 border-white/10">
                            <CardContent className="p-4 text-center">
                              <Users className="w-6 h-6 text-white/60 mx-auto mb-2" />
                              <p className="text-2xl font-black text-white mb-1">
                                {collection.holders.toLocaleString()}
                              </p>
                              <p className="text-white/40 text-xs">Holders</p>
                            </CardContent>
                          </Card>
                          <Card className="bg-black/40 border-white/10">
                            <CardContent className="p-4 text-center">
                              <Activity className="w-6 h-6 text-white/60 mx-auto mb-2" />
                              <p className="text-2xl font-black text-white mb-1">
                                {collection.volume < 0.01 ? collection.volume.toFixed(4) : collection.volume.toFixed(1)}
                              </p>
                              <p className="text-white/40 text-xs">Volume ETH</p>
                            </CardContent>
                          </Card>
                          <Card className="bg-black/40 border-white/10">
                            <CardContent className="p-4 text-center">
                              <TrendingUp className="w-6 h-6 text-white/60 mx-auto mb-2" />
                              <p className="text-2xl font-black text-white mb-1">
                                {collection.floorPrice < 0.01 ? collection.floorPrice.toFixed(4) : collection.floorPrice.toFixed(3)}
                              </p>
                              <p className="text-white/40 text-xs">Floor ETH</p>
                            </CardContent>
                          </Card>
                        </div>
                      </div>

                      {/* Right Side - Minting Interface */}
                      <div className="space-y-6">
                        {/* Claim Phases Timeline - Only show if phases exist */}
                        {claimPhases && claimPhases.length > 0 && (
                          <Card className="bg-black/40 border-white/10">
                            <CardHeader className="pb-4">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-white flex items-center gap-2">
                                  <Timer className="w-5 h-5 text-[rgb(163,255,18)]" />
                                  Mint Phases
                                </CardTitle>
                                {(() => {
                                  const sortedPhases = [...claimPhases].sort((a: any, b: any) =>
                                    new Date(a.startTimestamp).getTime() - new Date(b.startTimestamp).getTime()
                                  );
                                  const currentPhaseIndex = sortedPhases.findIndex((phase: any) => {
                                    const phaseStart = new Date(phase.startTimestamp);
                                    const nextPhase = sortedPhases[sortedPhases.indexOf(phase) + 1];
                                    const phaseEnd = nextPhase ? new Date(nextPhase.startTimestamp) : null;
                                    return phaseStart <= now && (!phaseEnd || phaseEnd > now);
                                  });
                                  const nextPhase = currentPhaseIndex >= 0 && sortedPhases[currentPhaseIndex + 1]
                                    ? sortedPhases[currentPhaseIndex + 1] : null;

                                  if (currentPhaseIndex >= 0 && nextPhase) {
                                    const timeToNext = new Date(nextPhase.startTimestamp).getTime() - now.getTime();
                                    const hoursToNext = Math.floor(timeToNext / (1000 * 60 * 60));
                                    const minutesToNext = Math.floor((timeToNext % (1000 * 60 * 60)) / (1000 * 60));

                                    if (timeToNext > 0 && timeToNext < 24 * 60 * 60 * 1000) {
                                      return (
                                        <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50">
                                          <AlertCircle className="w-3 h-3 mr-1" />
                                          Phase ends in {hoursToNext}h {minutesToNext}m
                                        </Badge>
                                      );
                                    }
                                  }
                                  return null;
                                })()}
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-2 pb-4">
                              {/* Phase Timeline */}
                              <div className="relative">
                                {/* Timeline Line */}
                                <div className="absolute left-6 top-8 bottom-0 w-0.5 bg-white/10" />

                                {claimPhases
                                  .sort((a: any, b: any) => new Date(a.startTimestamp).getTime() - new Date(b.startTimestamp).getTime())
                                  .map((phase: any, index: number, sortedArray: any[]) => {
                                    const phaseStart = new Date(phase.startTimestamp);
                                    const nextPhase = sortedArray[index + 1];
                                    const phaseEnd = nextPhase ? new Date(nextPhase.startTimestamp) : null;
                                    const isActive = phaseStart <= now && (!phaseEnd || phaseEnd > now);
                                    const isPast = phaseEnd ? phaseEnd <= now : false;
                                    const isFuture = phaseStart > now;
                                    const phasePrice = parseFloat(phase.pricePerToken) / 1e18;

                                    // Calculate time remaining or time to start
                                    let timeDisplay = null;
                                    if (isActive && phaseEnd) {
                                      const timeRemaining = phaseEnd.getTime() - now.getTime();
                                      const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
                                      const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

                                      if (timeRemaining > 0) {
                                        timeDisplay = days > 0 ? `${days}d ${hours}h remaining` :
                                                    hours > 0 ? `${hours}h ${minutes}m remaining` :
                                                    `${minutes}m remaining`;
                                      }
                                    } else if (isFuture) {
                                      const timeToStart = phaseStart.getTime() - now.getTime();
                                      const days = Math.floor(timeToStart / (1000 * 60 * 60 * 24));
                                      const hours = Math.floor((timeToStart % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                      const minutes = Math.floor((timeToStart % (1000 * 60 * 60)) / (1000 * 60));

                                      timeDisplay = days > 0 ? `Starts in ${days}d ${hours}h` :
                                                  hours > 0 ? `Starts in ${hours}h ${minutes}m` :
                                                  `Starts in ${minutes}m`;
                                    }

                                    return (
                                      <div key={index} className="relative flex gap-4 pb-6 last:pb-0">
                                        {/* Phase Indicator */}
                                        <div className="relative z-10 flex-shrink-0">
                                          <div className={cn(
                                            "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                                            isActive && "bg-[rgb(163,255,18)]/20 border-2 border-[rgb(163,255,18)] animate-pulse",
                                            isPast && "bg-white/5 border-2 border-white/20",
                                            isFuture && "bg-white/5 border-2 border-white/30"
                                          )}>
                                            {isActive ? (
                                              <Zap className="w-5 h-5 text-[rgb(163,255,18)]" />
                                            ) : isPast ? (
                                              <CheckCircle2 className="w-5 h-5 text-white/40" />
                                            ) : (
                                              <Clock className="w-5 h-5 text-white/60" />
                                            )}
                                          </div>
                                        </div>

                                        {/* Phase Content */}
                                        <div className={cn(
                                          "flex-1 p-4 rounded-lg border transition-all",
                                          isActive && "bg-[rgb(163,255,18)]/10 border-[rgb(163,255,18)]/50",
                                          isPast && "bg-white/5 border-white/10 opacity-60",
                                          isFuture && "bg-white/5 border-white/20"
                                        )}>
                                          <div className="flex items-start justify-between mb-2">
                                            <div>
                                              <h4 className="font-semibold text-white flex items-center gap-2">
                                                Phase {index + 1}
                                                {phase.metadata?.name && (
                                                  <span className="text-white/60">• {phase.metadata.name}</span>
                                                )}
                                              </h4>
                                              {timeDisplay && (
                                                <p className={cn(
                                                  "text-sm mt-1",
                                                  isActive ? "text-[rgb(163,255,18)]" : "text-white/60"
                                                )}>
                                                  {timeDisplay}
                                                </p>
                                              )}
                                            </div>
                                            {isActive && (
                                              <Badge className="bg-[rgb(163,255,18)] text-black text-xs">
                                                Active
                                              </Badge>
                                            )}
                                          </div>

                                          <div className="grid grid-cols-3 gap-3 text-xs">
                                            <div>
                                              <p className="text-white/40 mb-1">Price</p>
                                              <p className="text-white font-medium">
                                                {phasePrice > 0 ? `${phasePrice.toFixed(4)} ETH` : 'FREE'}
                                              </p>
                                            </div>
                                            <div>
                                              <p className="text-white/40 mb-1">Per Wallet</p>
                                              <p className="text-white font-medium">
                                                {phase.quantityLimitPerWallet && phase.quantityLimitPerWallet > 0
                                                  ? phase.quantityLimitPerWallet
                                                  : 'Unlimited'}
                                              </p>
                                            </div>
                                            <div>
                                              <p className="text-white/40 mb-1">Start</p>
                                              <p className="text-white font-medium">
                                                {phaseStart.toLocaleDateString('en-US', {
                                                  month: 'short',
                                                  day: 'numeric',
                                                  hour: '2-digit',
                                                  minute: '2-digit'
                                                })}
                                              </p>
                                            </div>
                                          </div>

                                          {/* Price Change Warning */}
                                          {isActive && nextPhase && (
                                            (() => {
                                              const nextPrice = parseFloat(nextPhase.pricePerToken) / 1e18;
                                              if (nextPrice > phasePrice) {
                                                return (
                                                  <div className="mt-3 p-2 bg-orange-500/10 rounded-lg border border-orange-500/30">
                                                    <p className="text-xs text-orange-400 flex items-center gap-1">
                                                      <ArrowUpRight className="w-3 h-3" />
                                                      Price increases to {nextPrice.toFixed(4)} ETH in next phase
                                                    </p>
                                                  </div>
                                                );
                                              } else if (nextPrice < phasePrice && nextPrice > 0) {
                                                return (
                                                  <div className="mt-3 p-2 bg-green-500/10 rounded-lg border border-green-500/30">
                                                    <p className="text-xs text-green-400 flex items-center gap-1">
                                                      <ArrowDownRight className="w-3 h-3" />
                                                      Price decreases to {nextPrice.toFixed(4)} ETH in next phase
                                                    </p>
                                                  </div>
                                                );
                                              }
                                              return null;
                                            })()
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        <Card className="bg-black/60 border-white/10 backdrop-blur-xl sticky top-24">
                          <CardHeader className="border-b border-white/10 pb-6">
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-white text-3xl font-black mb-2">
                                  Mint {collection.name}
                                </CardTitle>
                                <CardDescription className="text-white/60 text-base">
                                  {collection.description?.substring(0, 80) || `Be part of the ${collection.name} collection`}...
                                </CardDescription>
                              </div>
                              {isLive && (
                                <Badge className="bg-[rgb(163,255,18)] text-black font-bold px-3 py-1.5 animate-pulse">
                                  <Zap className="w-3 h-3 mr-1" />
                                  LIVE
                                </Badge>
                              )}
                            </div>
                          </CardHeader>

                          <CardContent className="pt-6 space-y-6">
                            {/* Check if we're between phases */}
                            {(() => {
                              if (claimPhases && claimPhases.length > 0) {
                                const sortedPhases = [...claimPhases].sort((a: any, b: any) =>
                                  new Date(a.startTimestamp).getTime() - new Date(b.startTimestamp).getTime()
                                );
                                const nextUpcomingPhase = sortedPhases.find((phase: any) =>
                                  new Date(phase.startTimestamp) > now
                                );

                                // If there's no active phase but there's an upcoming one, we're between phases
                                if (!activePhase && nextUpcomingPhase) {
                                  const timeToNext = new Date(nextUpcomingPhase.startTimestamp).getTime() - now.getTime();
                                  const days = Math.floor(timeToNext / (1000 * 60 * 60 * 24));
                                  const hours = Math.floor((timeToNext % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                  const minutes = Math.floor((timeToNext % (1000 * 60 * 60)) / (1000 * 60));
                                  const seconds = Math.floor((timeToNext % (1000 * 60)) / 1000);
                                  const nextPhasePrice = parseFloat(nextUpcomingPhase.pricePerToken) / 1e18;

                                  return (
                                    <div className="text-center py-12">
                                      <div className="bg-orange-500/10 rounded-full p-6 w-fit mx-auto mb-6">
                                        <Clock className="w-16 h-16 text-orange-400" />
                                      </div>
                                      <h3 className="text-white text-2xl font-black mb-3">Between Phases</h3>
                                      <p className="text-white/60 mb-2 text-base">Next phase starts soon!</p>
                                      <p className="text-white/80 mb-8">
                                        Price: <span className="text-[rgb(163,255,18)] font-bold">
                                          {nextPhasePrice > 0 ? `${nextPhasePrice.toFixed(4)} ETH` : 'FREE'}
                                        </span>
                                      </p>
                                      <div className="grid grid-cols-4 gap-4 max-w-sm mx-auto">
                                        <div className="bg-black/60 rounded-lg p-4 border border-white/10">
                                          <p className="text-3xl font-black text-white mb-1">{days}</p>
                                          <p className="text-white/40 text-xs uppercase">Days</p>
                                        </div>
                                        <div className="bg-black/60 rounded-lg p-4 border border-white/10">
                                          <p className="text-3xl font-black text-white mb-1">{hours}</p>
                                          <p className="text-white/40 text-xs uppercase">Hours</p>
                                        </div>
                                        <div className="bg-black/60 rounded-lg p-4 border border-white/10">
                                          <p className="text-3xl font-black text-white mb-1">{minutes}</p>
                                          <p className="text-white/40 text-xs uppercase">Min</p>
                                        </div>
                                        <div className="bg-black/60 rounded-lg p-4 border border-white/10">
                                          <p className="text-3xl font-black text-white mb-1">{seconds}</p>
                                          <p className="text-white/40 text-xs uppercase">Sec</p>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }
                              }
                              return null;
                            })()}

                            {/* Show different content based on mint status */}
                            {!isLive && isUpcoming && (!claimPhases || claimPhases.length === 0) ? (
                              <div className="text-center py-12">
                                <div className="bg-white/5 rounded-full p-6 w-fit mx-auto mb-6">
                                  <Timer className="w-16 h-16 text-white/60" />
                                </div>
                                <h3 className="text-white text-2xl font-black mb-3">Minting Opens Soon</h3>
                                <p className="text-white/60 mb-8 text-base">The mint hasn't started yet. Get ready!</p>
                                <div className="grid grid-cols-4 gap-4 max-w-sm mx-auto">
                                  <div className="bg-black/60 rounded-lg p-4 border border-white/10">
                                    <p className="text-3xl font-black text-white mb-1">{timeLeft.days}</p>
                                    <p className="text-white/40 text-xs uppercase">Days</p>
                                  </div>
                                  <div className="bg-black/60 rounded-lg p-4 border border-white/10">
                                    <p className="text-3xl font-black text-white mb-1">{timeLeft.hours}</p>
                                    <p className="text-white/40 text-xs uppercase">Hours</p>
                                  </div>
                                  <div className="bg-black/60 rounded-lg p-4 border border-white/10">
                                    <p className="text-3xl font-black text-white mb-1">{timeLeft.minutes}</p>
                                    <p className="text-white/40 text-xs uppercase">Min</p>
                                  </div>
                                  <div className="bg-black/60 rounded-lg p-4 border border-white/10">
                                    <p className="text-3xl font-black text-white mb-1">{timeLeft.seconds}</p>
                                    <p className="text-white/40 text-xs uppercase">Sec</p>
                                  </div>
                                </div>
                              </div>
                            ) : isSoldOut ? (
                              <div className="text-center py-12">
                                <div className="bg-white/5 rounded-full p-6 w-fit mx-auto mb-6">
                                  <CheckCircle2 className="w-16 h-16 text-white/60" />
                                </div>
                                <h3 className="text-white text-2xl font-black mb-3">Sold Out!</h3>
                                <p className="text-white/60 mb-6 text-base">All NFTs have been minted.</p>
                                <Button
                                  size="lg"
                                  className="bg-white/10 text-white hover:bg-white/20 border border-white/20"
                                  onClick={() => router.push('/marketplace')}
                                >
                                  <ShoppingCart className="w-5 h-5 mr-2" />
                                  Browse Marketplace
                                </Button>
                              </div>
                            ) : isLive ? (
                              <>
                                {/* Mint Progress */}
                                {collection.maxSupply && (
                                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                                    <div className="flex items-center justify-between mb-3">
                                      <p className="text-white/80 text-sm font-medium">Mint Progress</p>
                                      <p className="text-white font-bold text-sm">
                                        {mintProgress.toFixed(1)}% Complete
                                      </p>
                                    </div>
                                    <Progress value={mintProgress} className="w-full h-2 bg-black/40 mb-3" />
                                    <div className="flex items-center justify-between">
                                      <p className="text-white font-bold">
                                        {collection.mintedSupply.toLocaleString()} minted
                                      </p>
                                      <p className="text-white/60">
                                        {(collection.maxSupply - collection.mintedSupply).toLocaleString()} remaining
                                      </p>
                                    </div>
                                  </div>
                                )}

                                   {/* User Claim Status Indicator */}
                                {account && userClaimStatus.limit !== -1 && (
                                  <div className="bg-white/5 rounded-lg p-3 border border-white/10 mb-4">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-[rgb(163,255,18)]" />
                                        <span className="text-white/80 text-sm">Your Claim Status</span>
                                      </div>
                                      <div className="text-right">
                                        {userClaimStatus.remaining > 0 ? (
                                          <div>
                                            <span className="text-[rgb(163,255,18)] font-bold">
                                              {userClaimStatus.remaining}
                                            </span>
                                            <span className="text-white/60 text-sm ml-1">
                                              remaining
                                            </span>
                                          </div>
                                        ) : (
                                          <span className="text-red-400 font-semibold text-sm">
                                            Max claimed
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    {userClaimStatus.claimed > 0 && (
                                      <div className="mt-2 pt-2 border-t border-white/10">
                                        <div className="flex justify-between text-xs">
                                          <span className="text-white/40">
                                            You've claimed {userClaimStatus.claimed} / {userClaimStatus.limit} NFTs
                                          </span>
                                          {userClaimStatus.remaining > 0 && (
                                            <span className="text-[rgb(163,255,18)]/80">
                                              {mintQuantity > userClaimStatus.remaining &&
                                                `⚠️ Max: ${userClaimStatus.remaining}`
                                              }
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Price Display */}
                                {/* <div className="bg-black/60 rounded-xl p-6 border border-white/10">
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-white/60">Mint Price</p>
                                    <p className="text-white text-2xl font-black">
                                      {mintPrice > 0 ? `${mintPrice.toFixed(5)} ETH` : 'FREE'}
                                    </p>
                                  </div>
                                  {mintPrice > 0 && (
                                    <p className="text-white/40 text-sm text-right">
                                      ≈ ${(mintPrice * 1800).toFixed(2)} USD
                                    </p>
                                  )}
                                </div> */}


                                {/* Total Cost */}
                                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                                  <p className="text-white/60 mb-2 text-sm font-medium">Total Cost</p>
                                  <div className="flex items-baseline gap-3">
                                    <p className="text-5xl font-black text-white">
                                      {mintPrice > 0 ? (mintPrice * mintQuantity).toFixed(5) : 'FREE'}
                                    </p>
                                    {mintPrice > 0 && <p className="text-2xl text-white/60">ETH</p>}
                                  </div>
                                  {mintPrice > 0 && (
                                    <p className="text-white/40 mt-2">
                                      ≈ ${((mintPrice * mintQuantity) * 1800).toFixed(2)} USD
                                    </p>
                                  )}
                                </div>

                             


                                {/* Quantity Selector */}
                                <div>
                                  <div className="flex items-center justify-between mb-4">
                                    <label className="text-white font-bold">Quantity</label>
                                    <p className="text-white/60 text-sm">
                                      {activePhase?.quantityLimitPerWallet && activePhase.quantityLimitPerWallet > 0
                                        ? `Max ${activePhase.quantityLimitPerWallet} per wallet`
                                        : 'Unlimited per wallet'}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <Button
                                      size="lg"
                                      variant="outline"
                                      className="flex-1 border-white/20 text-white hover:bg-white/10 hover:border-white/30 h-16 text-2xl font-bold"
                                      onClick={() => setMintQuantity(Math.max(1, mintQuantity - 1))}
                                      disabled={mintQuantity <= 1}
                                    >
                                      <Minus className="w-6 h-6" />
                                    </Button>
                                    <div className="flex-1 text-center bg-black/60 rounded-lg border border-white/10 h-16 flex items-center justify-center">
                                      <span className="text-4xl font-black text-white">
                                        {mintQuantity}
                                      </span>
                                    </div>
                                    <Button
                                      size="lg"
                                      variant="outline"
                                      className="flex-1 border-white/20 text-white hover:bg-white/10 hover:border-white/30 h-16 text-2xl font-bold"
                                      onClick={() => {
                                        const maxLimit = activePhase?.quantityLimitPerWallet && activePhase.quantityLimitPerWallet > 0
                                          ? activePhase.quantityLimitPerWallet
                                          : 100; // Set a reasonable max for unlimited
                                        setMintQuantity(Math.min(maxLimit, mintQuantity + 1));
                                      }}
                                      disabled={
                                        activePhase?.quantityLimitPerWallet && activePhase.quantityLimitPerWallet > 0
                                          ? mintQuantity >= activePhase.quantityLimitPerWallet
                                          : mintQuantity >= 100 // Reasonable limit for unlimited
                                      }
                                    >
                                      <Plus className="w-6 h-6" />
                                    </Button>
                                  </div>
                                </div>

                                {/* Mint Button */}
                                <Button
                                  size="lg"
                                  className="w-full bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90 font-black text-xl h-16"
                                  disabled={isMinting || !account || (userClaimStatus.remaining === 0 && userClaimStatus.limit !== -1)}
                                  onClick={handleMint}
                                >
                                  {isMinting ? (
                                    <>
                                      <RefreshCw className="w-6 h-6 mr-3 animate-spin" />
                                      Minting {mintQuantity} NFT{mintQuantity > 1 ? 's' : ''}...
                                    </>
                                  ) : !account ? (
                                    <>
                                      <Wallet className="w-6 h-6 mr-3" />
                                      Connect Wallet to Mint
                                    </>
                                  ) : userClaimStatus.remaining === 0 && userClaimStatus.limit !== -1 ? (
                                    <>
                                      <X className="w-6 h-6 mr-3" />
                                      Claim Limit Reached
                                    </>
                                  ) : (
                                    <>
                                      <Zap className="w-6 h-6 mr-3" />
                                      Mint {mintQuantity} NFT{mintQuantity > 1 ? 's' : ''}
                                    </>
                                  )}
                                </Button>

                                {/* Important Info */}
                                <div className="flex items-start gap-3 p-4 bg-white/5 rounded-lg border border-white/10">
                                  <Info className="w-5 h-5 text-white/60 flex-shrink-0 mt-0.5" />
                                  <div className="text-sm text-white/80">
                                    <p className="font-bold text-white mb-1">Important Information</p>
                                    <ul className="space-y-1 text-white/60">
                                      <li>• Gas fees are not included in the mint price</li>
                                      <li>• Transaction may take a few minutes to confirm</li>
                                      <li>• NFTs are randomly assigned from available supply</li>
                                    </ul>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="text-center py-12">
                                <div className="bg-white/5 rounded-full p-6 w-fit mx-auto mb-6">
                                  <X className="w-16 h-16 text-white/60" />
                                </div>
                                <h3 className="text-white text-2xl font-black mb-3">Minting Has Ended</h3>
                                <p className="text-white/60 text-base">The minting period for this collection has ended.</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>  
                      </div>
                    </div>
                  </TabsContent>

                  {/* Roadmap Tab - Only show if roadmap exists */}
                  {mockProject.roadmap && mockProject.roadmap.length > 0 && (
                    <TabsContent value="roadmap" className="mt-0">
                      <div className="max-w-4xl mx-auto">
                        <div className="space-y-8">
                          {mockProject.roadmap.map((phase, index) => (
                            <Card key={index} className="bg-black/40 border-white/10">
                              <CardContent className="p-6">
                                <div className="flex items-start gap-6">
                                  <div className={cn(
                                    "flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center",
                                    phase.status === 'completed' ? "bg-green-500/20 border-2 border-green-500" :
                                    phase.status === 'in-progress' ? "bg-[rgb(163,255,18)]/20 border-2 border-[rgb(163,255,18)]" :
                                    "bg-gray-500/20 border-2 border-gray-500"
                                  )}>
                                    {phase.status === 'completed' ? (
                                      <CheckCircle2 className="w-8 h-8 text-green-500" />
                                    ) : phase.status === 'in-progress' ? (
                                      <RefreshCw className="w-8 h-8 text-[rgb(163,255,18)] animate-pulse" />
                                    ) : (
                                      <Clock className="w-8 h-8 text-gray-500" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                      <h3 className="text-xl font-bold text-white">{phase.phase}</h3>
                                      <Badge className={cn(
                                        "text-xs",
                                        phase.status === 'completed' ? "bg-green-500/20 text-green-400" :
                                        phase.status === 'in-progress' ? "bg-[rgb(163,255,18)]/20 text-[rgb(163,255,18)]" :
                                        "bg-gray-500/20 text-gray-400"
                                      )}>
                                        {phase.status === 'completed' ? 'Completed' :
                                         phase.status === 'in-progress' ? 'In Progress' :
                                         'Upcoming'}
                                      </Badge>
                                    </div>
                                    <h4 className="text-lg text-white/80 mb-4">{phase.title}</h4>
                                    <ul className="space-y-2">
                                      {phase.items.map((item, idx) => (
                                        <li key={idx} className="flex items-center gap-2 text-white/60">
                                          <CheckCircle2 className={cn(
                                            "w-4 h-4 flex-shrink-0",
                                            phase.status === 'completed' ? "text-green-500" : "text-gray-500"
                                          )} />
                                          {item}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                  )}

                  {/* Team Tab - Only show if team exists */}
                  {mockProject.team && mockProject.team.length > 0 && (
                    <TabsContent value="team" className="mt-0">
                      <div className="max-w-4xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {mockProject.team.map((member, index) => (
                            <Card key={index} className="bg-black/40 border-white/10">
                              <CardContent className="p-6 text-center">
                                <img
                                  src={member.avatar}
                                  alt={member.name}
                                  className="w-20 h-20 rounded-full mx-auto mb-4 border-2 border-white/20"
                                />
                                <h3 className="text-white font-bold text-lg mb-1">{member.name}</h3>
                                <p className="text-[rgb(163,255,18)] font-medium mb-3">{member.role}</p>
                                <p className="text-white/60 text-sm">{member.bio}</p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                  )}
                </div>
              </Tabs>
            </div>
          </div>
        </div>
      </TooltipProvider>

      {/* Add to List Modal */}
      <AddToListModal
        isOpen={isAddToListModalOpen}
        onClose={() => setIsAddToListModalOpen(false)}
        item={{
          id: collection.id,
          type: 'launchpad',
          name: collection.name,
          image: collection.image || collection.bannerImage,
          description: collection.description,
          collectionId: collection.id,
          metadata: {
            symbol: collection.symbol,
            floorPrice: collection.floorPrice,
            mintedSupply: collection.mintedSupply,
            maxSupply: collection.maxSupply,
          },
        }}
        onSuccess={() => {
          // Optionally refresh watchlist status
          setIsWatchlisted(true);
        }}
      />

      {/* Error Modal */}
      <AnimatePresence>
        {errorModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setErrorModal(prev => ({ ...prev, isOpen: false }))}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="relative max-w-md w-full bg-gradient-to-br from-purple-900/90 to-black/90 rounded-2xl p-6 border border-purple-500/30 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setErrorModal(prev => ({ ...prev, isOpen: false }))}
                className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Icon based on error type */}
              <div className="flex justify-center mb-4">
                {errorModal.type === 'exceed_limit' && (
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-red-400" />
                  </div>
                )}
                {errorModal.type === 'insufficient_funds' && (
                  <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <Wallet className="w-8 h-8 text-yellow-400" />
                  </div>
                )}
                {errorModal.type === 'cancelled' && (
                  <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <X className="w-8 h-8 text-blue-400" />
                  </div>
                )}
                {errorModal.type === 'supply_exceeded' && (
                  <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center">
                    <Package className="w-8 h-8 text-orange-400" />
                  </div>
                )}
                {errorModal.type === 'no_conditions' && (
                  <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <Clock className="w-8 h-8 text-purple-400" />
                  </div>
                )}
                {errorModal.type === 'generic' && (
                  <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-white text-center mb-3">
                {errorModal.title}
              </h3>

              {/* Message */}
              <p className="text-white/80 text-center mb-6 leading-relaxed">
                {errorModal.message}
              </p>

              {/* Action button */}
              <button
                onClick={() => setErrorModal(prev => ({ ...prev, isOpen: false }))}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105"
              >
                {errorModal.type === 'insufficient_funds' ? 'Got It, Need More ETH' :
                 errorModal.type === 'exceed_limit' ? "OK, I'll Play Nice" :
                 errorModal.type === 'cancelled' ? "Maybe Later" :
                 "Got It!"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}