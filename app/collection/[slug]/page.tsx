"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AppFooter } from "@/components/layouts/app-footer";
import { MediaRenderer } from "@/components/MediaRenderer";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { ConnectButton } from "thirdweb/react";
import { client } from "@/lib/thirdweb";
import { BulkSelectionProvider } from "@/components/nft/bulk-selection-provider";
import NFTCardEnhanced from "@/components/nft-card-enhanced";
import { BulkBuyDialog } from "@/components/nft/bulk-buy-dialog";
import { ShoppingCartDrawer } from "@/components/nft/shopping-cart-drawer";
import { OfferManagementDrawer } from "@/components/nft/offer-management-drawer";
import { SweepFloorDialog } from "@/components/nft/sweep-floor-dialog";
import { NFTDetailModal } from "@/components/nft/nft-detail-modal";
import {
  Search,
  Filter,
  Grid3X3,
  List,
  TrendingUp,
  TrendingDown,
  Shield,
  Verified,
  ExternalLink,
  Twitter,
  Globe,
  MessageCircle,
  Heart,
  Share2,
  Eye,
  Clock,
  Activity,
  Users,
  Zap,
  BarChart3,
  Copy,
  ChevronDown,
  SlidersHorizontal,
  ArrowUpDown,
  RefreshCw,
  MoreHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Tag,
} from "lucide-react";

// Enhanced mock data with better images
const mockCollection = {
  slug: "cyber-warriors",
  name: "Cyber Warriors",
  description: "An elite collection of 10,000 unique Cyber Warriors ready for battle in the metaverse. Each warrior possesses unique traits, weapons, and abilities that make them formidable opponents in any digital realm.",
  bannerImage: "https://picsum.photos/1200/400",
  avatarImage: "https://picsum.photos/200",
  verified: true,
  category: "Gaming",
  contractAddress: "0x1234567890123456789012345678901234567890",
  blockchain: "Ethereum",
  totalSupply: 10000,
  creators: ["CyberStudio", "WarriorDAO"],
  royalty: 5.0,
  stats: {
    floorPrice: 2.5,
    totalVolume: 125847.3,
    volume24h: 1247.8,
    volume7d: 8934.2,
    volume30d: 35678.9,
    change24h: 12.5,
    change7d: -5.2,
    change30d: 28.7,
    marketCap: 25000,
    owners: 7842,
    uniqueOwners: 78.4,
    listedCount: 1247,
    listedPercent: 12.47,
    avgSale24h: 3.2,
    avgHoldingTime: 45,
  },
  links: {
    website: "https://cyberwarriors.game",
    twitter: "https://twitter.com/cyberwarriors",
    discord: "https://discord.gg/cyberwarriors",
    opensea: "https://opensea.io/collection/cyber-warriors",
  },
  traits: [
    {
      name: "Background",
      values: ["Neon City", "Dark Void", "Cyber Grid", "Matrix", "Digital Storm"],
    },
    {
      name: "Body",
      values: ["Steel", "Carbon", "Titanium", "Plasma", "Quantum"],
    },
    {
      name: "Weapon",
      values: ["Laser Sword", "Plasma Rifle", "Neural Disruptor", "Cyber Blade", "Ion Cannon"],
    },
    {
      name: "Armor",
      values: ["Battle Suit", "Stealth Gear", "Heavy Mech", "Nano Armor", "Energy Shield"],
    },
    {
      name: "Rarity",
      values: ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic"],
    },
  ],
};

// Enhanced NFT mock data
const mockNFTs = Array.from({ length: 200 }, (_, i) => {
  const id = i + 1;
  const rarities = ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic"];
  const rarity = rarities[Math.floor(Math.random() * rarities.length)];
  const multiplier = rarity === "Mythic" ? 10 : rarity === "Legendary" ? 5 : rarity === "Epic" ? 3 : rarity === "Rare" ? 2 : 1;
  
  return {
    id: id.toString(),
    name: `Cyber Warrior #${id.toString().padStart(4, "0")}`,
    image: `https://picsum.photos/400/400?random=${id}`,
    price: Math.random() > 0.3 ? +(Math.random() * 10 * multiplier + 0.5).toFixed(2) : undefined,
    lastSale: Math.random() > 0.5 ? +(Math.random() * 8 * multiplier + 0.3).toFixed(2) : undefined,
    rarity,
    collection: mockCollection.name,
    rank: Math.floor(Math.random() * 10000) + 1,
    traits: {
      Background: mockCollection.traits[0].values[Math.floor(Math.random() * mockCollection.traits[0].values.length)],
      Body: mockCollection.traits[1].values[Math.floor(Math.random() * mockCollection.traits[1].values.length)],
      Weapon: mockCollection.traits[2].values[Math.floor(Math.random() * mockCollection.traits[2].values.length)],
      Armor: mockCollection.traits[3].values[Math.floor(Math.random() * mockCollection.traits[3].values.length)],
      Rarity: rarity,
    },
    listed: Math.random() > 0.7,
    auction: Math.random() > 0.9,
    new: Math.random() > 0.8,
    likes: Math.floor(Math.random() * 500) + 10,
    views: Math.floor(Math.random() * 2000) + 100,
    lastViewed: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
    floorPrice: mockCollection.stats.floorPrice,
    topBid: Math.random() > 0.7 ? +(Math.random() * 2 + 0.5).toFixed(2) : undefined,
    royalty: mockCollection.royalty,
  };
});

// Activity mock data
const mockActivity = Array.from({ length: 50 }, (_, i) => ({
  id: i.toString(),
  type: ["sale", "list", "offer", "transfer"][Math.floor(Math.random() * 4)],
  nft: mockNFTs[Math.floor(Math.random() * mockNFTs.length)],
  price: +(Math.random() * 5 + 0.1).toFixed(2),
  from: `0x${Math.random().toString(16).slice(2, 10)}`,
  to: `0x${Math.random().toString(16).slice(2, 10)}`,
  timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
  txHash: `0x${Math.random().toString(16).slice(2, 66)}`,
}));

// Types
type SortOption = "price-low" | "price-high" | "recently-listed" | "rarity-rare" | "rarity-common" | "most-liked" | "last-sale";
type ViewMode = "grid" | "list";

interface NFT {
  id: string;
  name: string;
  image: string;
  price?: number;
  lastSale?: number;
  rarity: string;
  collection: string;
  rank: number;
  traits: Record<string, string>;
  listed: boolean;
  auction: boolean;
  new: boolean;
  likes: number;
  views: number;
  lastViewed: Date;
  floorPrice?: number;
  topBid?: number;
  royalty?: number;
}

interface StatusFilters {
  buyNow: boolean;
  auction: boolean;
  new: boolean;
  hasOffers: boolean;
}

interface Trait {
  name: string;
  values: string[];
}

interface ActivityItem {
  id: string;
  type: string;
  nft: NFT;
  price: number;
  from: string;
  to: string;
  timestamp: Date;
  txHash: string;
}

interface Collection {
  slug: string;
  name: string;
  description: string;
  bannerImage: string;
  avatarImage: string;
  verified: boolean;
  category: string;
  contractAddress: string;
  blockchain: string;
  totalSupply: number;
  creators: string[];
  royalty: number;
  stats: {
    floorPrice: number;
    totalVolume: number;
    volume24h: number;
    volume7d: number;
    volume30d: number;
    change24h: number;
    change7d: number;
    change30d: number;
    marketCap: number;
    owners: number;
    uniqueOwners: number;
    listedCount: number;
    listedPercent: number;
    avgSale24h: number;
    avgHoldingTime: number;
  };
  links: {
    website: string;
    twitter: string;
    discord: string;
    opensea: string;
  };
  traits: Trait[];
}

export default function CollectionDetail() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Enhanced state management
  const [searchQuery, setSearchQuery] = useState(searchParams?.get("search") || "");
  const [sortBy, setSortBy] = useState<SortOption>((searchParams?.get("sort") as SortOption) || "price-low");
  const [viewMode, setViewMode] = useState<ViewMode>((searchParams?.get("view") as ViewMode) || "grid");
  const [priceRange, setPriceRange] = useState([0, 50]);
  const [selectedTraits, setSelectedTraits] = useState<Record<string, string[]>>({});
  const [statusFilters, setStatusFilters] = useState<StatusFilters>({
    buyNow: false,
    auction: false,
    new: false,
    hasOffers: false,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  
  // Transaction Dialog States - removed, handled in NFT detail modal
  const [bulkBuyDialogOpen, setBulkBuyDialogOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [offerManagementOpen, setOfferManagementOpen] = useState(false);
  const [sweepFloorOpen, setSweepFloorOpen] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [nftDetailModalOpen, setNftDetailModalOpen] = useState(false);
  
  const itemsPerPage = viewMode === "list" ? 50 : 24;
  
  // Transaction handlers - now handled directly in modal
  const handleBuyNFT = (nft: NFT) => {
    // Will be handled in the modal directly
    handleNFTClick(nft);
  };
  
  const handleMakeOffer = (nft: NFT) => {
    // Will be handled in the modal directly
    handleNFTClick(nft);
  };
  
  const handleBulkCheckout = () => {
    setBulkBuyDialogOpen(true);
  };
  
  const handleSweepFloor = () => {
    setSweepFloorOpen(true);
  };

  const handleNFTClick = (nft: NFT) => {
    setSelectedNFT(nft);
    setNftDetailModalOpen(true);
  };

  // Scroll handling
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 385;
      setHeaderScrolled(scrolled);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Filter and sort NFTs with enhanced logic
  const filteredNFTs = useMemo(() => {
    const filtered = mockNFTs.filter((nft) => {
      // Search filter
      if (searchQuery && !nft.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Price filter
      const price = nft.price || nft.lastSale || 0;
      if (price < priceRange[0] || price > priceRange[1]) {
        return false;
      }
      
      // Status filters
      if (statusFilters.buyNow && !nft.price) return false;
      if (statusFilters.auction && !nft.auction) return false;
      if (statusFilters.new && !nft.new) return false;
      
      // Trait filters
      for (const [traitType, selectedValues] of Object.entries(selectedTraits)) {
        const traitValue = nft.traits[traitType as keyof typeof nft.traits];
        if (selectedValues.length > 0 && traitValue && !selectedValues.includes(traitValue)) {
          return false;
        }
      }
      
      return true;
    });

    // Enhanced sorting
    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => (a.price || 999) - (b.price || 999));
        break;
      case "price-high":
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case "recently-listed":
        filtered.sort(() => Math.random() - 0.5);
        break;
      case "rarity-rare":
        filtered.sort((a, b) => a.rank - b.rank);
        break;
      case "rarity-common":
        filtered.sort((a, b) => b.rank - a.rank);
        break;
      case "most-liked":
        filtered.sort((a, b) => b.likes - a.likes);
        break;
      case "last-sale":
        filtered.sort((a, b) => b.lastViewed.getTime() - a.lastViewed.getTime());
        break;
    }

    return filtered;
  }, [searchQuery, sortBy, priceRange, selectedTraits, statusFilters]);

  const totalPages = Math.ceil(filteredNFTs.length / itemsPerPage);
  const currentNFTs = filteredNFTs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleTrait = (traitType: string, value: string) => {
    setSelectedTraits((prev) => {
      const current = prev[traitType] || [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [traitType]: updated };
    });
  };

  const clearAllFilters = () => {
    setSelectedTraits({});
    setStatusFilters({
      buyNow: false,
      auction: false,
      new: false,
      hasOffers: false,
    });
    setPriceRange([0, 50]);
    setSearchQuery("");
    setCurrentPage(1);
  };

  const activeFiltersCount = 
    Object.values(statusFilters).filter(Boolean).length +
    Object.values(selectedTraits).reduce((acc, values) => acc + values.length, 0) +
    (priceRange[0] > 0 || priceRange[1] < 50 ? 1 : 0);

  const handleNavigate = (mode: 'home' | 'trade' | 'p2p' | 'marketplace') => {
    if (mode === 'marketplace') {
      router.push('/?view=marketplace');
    } else if (mode === 'home') {
      router.push('/');
    } else {
      router.push(`/?view=${mode}`);
    }
  };

  return (
    <BulkSelectionProvider>
      <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <div className="relative h-[320px] sm:h-[400px] lg:h-[500px] overflow-hidden"
      style={{
        position: headerScrolled ? 'sticky' : 'relative',
        top: headerScrolled ? '-385px' : 'auto',
        zIndex: headerScrolled ? 10 : 'auto',
      }}>
        <MediaRenderer
          src="https://www.fiercepc.co.uk/wp/wp-content/uploads/Cyberpunk-2077-1.jpg"
          alt={`${mockCollection.name} banner`}
          className=""
          aspectRatio="banner"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
        <div className="absolute bottom-0 left-0 right-0 h-24 sm:h-32 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

      {/* Sticky Collection Header */}
      <div className={`sticky top-0 z-50 border-b transition-all duration-300 -mt-20 sm:-mt-24 animate-[slideInDown_0.4s_ease-out_0.2s_both] ${
        headerScrolled 
          ? 'bg-[#000]' 
          : ''
      }`}>
        <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Collection Avatar */}
            <div className={`relative transition-all duration-300 flex-shrink-0 animate-[slideInLeft_0.3s_ease-out_0.3s_both] ${
              headerScrolled ? 'w-10 h-10 sm:w-12 sm:h-12' : 'w-14 h-14 sm:w-16 sm:h-16'
            }`}>
              <MediaRenderer
                src={mockCollection.avatarImage}
                alt={mockCollection.name}
                className="rounded-xl border-2 border-background shadow-lg"
                aspectRatio="square"
              />
              {mockCollection.verified && (
                <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
                  <Verified className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </div>

            {/* Collection Info */}
            <div className="flex-1 min-w-0 animate-[slideInUp_0.3s_ease-out_0.35s_both]">
              <div className="flex items-center gap-1 sm:gap-2 mb-1">
                <h1 className={`font-bold truncate transition-all duration-300 ${
                  headerScrolled ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl lg:text-3xl'
                }`}>
                  {mockCollection.name}
                </h1>
                <Badge variant="secondary" className="bg-primary/10 text-primary hidden sm:inline-flex">
                  {mockCollection.category}
                </Badge>
              </div>
              
              {/* Quick Stats */}
              <div className={`flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground transition-all duration-300 overflow-x-auto ${
                headerScrolled ? 'hidden sm:flex' : 'flex'
              }`}>
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span className="font-medium text-foreground">{mockCollection.stats.floorPrice} ETH</span>
                  <span className="hidden xs:inline">Floor</span>
                </div>
                <Separator orientation="vertical" className="h-4 hidden sm:block" />
                <div className="flex items-center gap-1 whitespace-nowrap hidden sm:flex">
                  <span className="font-medium text-foreground">{mockCollection.stats.volume24h.toLocaleString()} ETH</span>
                  <span>24h Vol</span>
                </div>
                <Separator orientation="vertical" className="h-4 hidden lg:block" />
                <div className="flex items-center gap-1 whitespace-nowrap hidden lg:flex">
                  <span className="font-medium text-foreground">{mockCollection.totalSupply.toLocaleString()}</span>
                  <span>Items</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 animate-[slideInRight_0.3s_ease-out_0.4s_both]">
              <Button
                variant={isLiked ? "default" : "outline"}
                size="sm"
                onClick={() => setIsLiked(!isLiked)}
                className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
              >
                <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                <span className="hidden sm:inline ml-2">{isLiked ? "Liked" : "Like"}</span>
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 sm:hidden">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="gap-2 hidden lg:flex">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              <Button variant="ghost" size="sm" className="gap-2 hidden lg:flex" asChild>
                <Link href={mockCollection.links.website} target="_blank">
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Toolbar */}
      <div className="sticky top-[72px] sm:top-[85px] z-40 bg-background/99 backdrop-blur-xl border-b animate-[slideInDown_0.4s_ease-out_0.45s_both]">
        <div className="px-3 sm:px-4 lg:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-2 sm:py-3 gap-2 sm:gap-4">
            {/* Left Side - Search and Filters */}
            <div className="flex items-center gap-2 sm:gap-3 flex-1 w-full sm:w-auto animate-[slideInLeft_0.3s_ease-out_0.5s_both]">
              
              {/* Mobile Filter Button */}
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 lg:hidden relative">
                    <SlidersHorizontal className="h-4 w-4" />
                    <span className="hidden sm:inline">Filters</span>
                    {activeFiltersCount > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0">
                  <FilterSidebar
                    priceRange={priceRange}
                    setPriceRange={setPriceRange}
                    selectedTraits={selectedTraits}
                    toggleTrait={toggleTrait}
                    statusFilters={statusFilters}
                    setStatusFilters={setStatusFilters}
                    traits={mockCollection.traits}
                    onClose={() => setSidebarOpen(false)}
                    activeFiltersCount={activeFiltersCount}
                    onClearAll={clearAllFilters}
                  />
                </SheetContent>
              </Sheet>

              {/* Search */}
              <div className="relative flex-1 sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-8 sm:h-9 text-sm"
                />
              </div>

              {/* Results Count */}
              <div className="hidden sm:block text-sm text-muted-foreground whitespace-nowrap">
                {filteredNFTs.length.toLocaleString()} items
              </div>
            </div>

            {/* Right Side - Controls */}
            <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-end animate-[slideInRight_0.3s_ease-out_0.55s_both]">
              {/* Sort */}
              <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                <SelectTrigger className="w-32 sm:w-44 h-8 sm:h-9 text-sm">
                  <ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="recently-listed">Recently Listed</SelectItem>
                  <SelectItem value="last-sale">Recently Sold</SelectItem>
                  <SelectItem value="rarity-rare">Rarity: Rare First</SelectItem>
                  <SelectItem value="most-liked">Most Liked</SelectItem>
                </SelectContent>
              </Select>

              {/* View Toggle */}
              <div className="flex border rounded-lg p-0.5 bg-muted/50">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                >
                  <Grid3X3 className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                >
                  <List className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>

              {/* Refresh */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setLoading(true)}
                className="hidden md:flex h-8 w-8 sm:h-9 sm:w-9 p-0"
              >
                <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              
              {/* Cart Button */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCartDrawerOpen(true)}
                className="hidden sm:flex gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden md:inline">Cart</span>
              </Button>
              
              {/* Offers Button */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setOfferManagementOpen(true)}
                className="hidden sm:flex gap-2"
              >
                <Tag className="h-4 w-4" />
                <span className="hidden md:inline">Offers</span>
              </Button>
              
              {/* Sweep Floor Button */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSweepFloor}
                className="hidden sm:flex gap-2"
              >
                <TrendingDown className="h-4 w-4" />
                <span className="hidden md:inline">Sweep Floor</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1">
        <div className="flex gap-4 lg:gap-6 p-3 sm:p-4 lg:p-6 pb-32">
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block w-80 flex-shrink-0 animate-[slideInLeft_0.4s_ease-out_0.6s_both]">
            <div className="sticky top-[140px] sm:top-[157px]">
              <FilterSidebar
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                selectedTraits={selectedTraits}
                toggleTrait={toggleTrait}
                statusFilters={statusFilters}
                setStatusFilters={setStatusFilters}
                traits={mockCollection.traits}
                activeFiltersCount={activeFiltersCount}
                onClearAll={clearAllFilters}
              />
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0 max-w-full animate-[slideInUp_0.4s_ease-out_0.65s_both]">
            {/* Active Filters Summary */}
            {activeFiltersCount > 0 && (
              <div className="mb-6 p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">
                    {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} applied
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="h-7 px-2 text-xs"
                  >
                    Clear all
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(statusFilters)
                    .filter(([, value]) => value)
                    .map(([key]) => (
                      <Badge key={key} variant="secondary" className="gap-1">
                        {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => 
                          setStatusFilters(prev => ({ ...prev, [key]: false }))
                        } />
                      </Badge>
                    ))}
                  {Object.entries(selectedTraits)
                    .flatMap(([traitType, values]) => 
                      values.map(value => ({ traitType, value }))
                    )
                    .map(({ traitType, value }) => (
                      <Badge key={`${traitType}-${value}`} variant="secondary" className="gap-1">
                        {traitType}: {value}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => 
                          toggleTrait(traitType, value)
                        } />
                      </Badge>
                    ))}
                </div>
              </div>
            )}

            {/* NFT Grid */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-3 sm:gap-4 lg:gap-6">
                {currentNFTs.map((nft) => (
                  <NFTCardEnhanced 
                    key={nft.id} 
                    nft={nft} 
                    onBuy={() => handleBuyNFT(nft)}
                    onOffer={() => handleMakeOffer(nft)}
                    onClick={() => handleNFTClick(nft)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {currentNFTs.map((nft) => (
                  <div
                    key={nft.id}
                    onClick={() => handleNFTClick(nft)}
                    className="cursor-pointer"
                  >
                    <NFTListItem 
                      nft={nft}
                      onBuy={() => handleBuyNFT(nft)}
                      onOffer={() => handleMakeOffer(nft)}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Enhanced Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                  Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredNFTs.length)} of {filteredNFTs.length}
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage <= 1}
                    className="h-8 px-2 sm:px-3 gap-1 sm:gap-2"
                  >
                    <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </Button>
                  
                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, currentPage - 1) + i;
                      if (pageNum > totalPages) return null;
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-8 h-8 sm:w-9 sm:h-9 p-0 text-xs sm:text-sm"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage >= totalPages}
                    className="h-8 px-2 sm:px-3 gap-1 sm:gap-2"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <BulkBuyDialog
        open={bulkBuyDialogOpen}
        onOpenChange={setBulkBuyDialogOpen}
      />
      
      <ShoppingCartDrawer
        open={cartDrawerOpen}
        onOpenChange={setCartDrawerOpen}
        onCheckout={handleBulkCheckout}
      />
      
      <OfferManagementDrawer
        open={offerManagementOpen}
        onOpenChange={setOfferManagementOpen}
      />
      
      <SweepFloorDialog
        open={sweepFloorOpen}
        onOpenChange={setSweepFloorOpen}
        collection={{
          name: mockCollection.name,
          floorPrice: mockCollection.stats.floorPrice,
          totalSupply: mockCollection.totalSupply
        }}
      />
      
      <NFTDetailModal
        open={nftDetailModalOpen}
        onOpenChange={setNftDetailModalOpen}
        nft={selectedNFT}
      />
      </div>
      
      {/* Fixed Footer - Always visible at bottom */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-xl border-t border-white/10 px-16 py-6">
        <AppFooter 
          viewMode="marketplace"
          onNavigate={handleNavigate}
        />
      </footer>
    </BulkSelectionProvider>
  );
}

// Enhanced Filter Sidebar Component
function FilterSidebar({
  priceRange,
  setPriceRange,
  selectedTraits,
  toggleTrait,
  statusFilters,
  setStatusFilters,
  traits,
  onClose,
  activeFiltersCount,
  onClearAll,
}: {
  priceRange: number[];
  setPriceRange: (range: number[]) => void;
  selectedTraits: Record<string, string[]>;
  toggleTrait: (traitType: string, value: string) => void;
  statusFilters: StatusFilters;
  setStatusFilters: React.Dispatch<React.SetStateAction<StatusFilters>>;
  traits: Trait[];
  onClose?: () => void;
  activeFiltersCount: number;
  onClearAll: () => void;
}) {
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-6 border-b bg-muted/30">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Filters</h3>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {activeFiltersCount} active filter{activeFiltersCount !== 1 ? 's' : ''}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="h-7 px-2 text-xs text-primary hover:text-primary"
            >
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Status Filters */}
        <div className="space-y-4">
          <h4 className="font-semibold text-foreground">Status</h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries({
              buyNow: "Buy Now",
              auction: "Auction",
              new: "New",
              hasOffers: "Has Offers",
            }).map(([key, label]) => (
              <Button
                key={key}
                variant={statusFilters[key as keyof StatusFilters] ? "default" : "outline"}
                size="sm"
                onClick={() => 
                  setStatusFilters(prev => ({ ...prev, [key]: !prev[key as keyof StatusFilters] }))
                }
                className="justify-start gap-2 h-9"
              >
                <div className={`w-2 h-2 rounded-full ${
                  statusFilters[key as keyof StatusFilters] ? 'bg-primary-foreground' : 'bg-muted-foreground'
                }`} />
                {label}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Price Range */}
        <div className="space-y-4">
          <h4 className="font-semibold text-foreground">Price Range (ETH)</h4>
          <div className="space-y-4">
            <div className="px-3">
              <Slider
                value={priceRange}
                onValueChange={setPriceRange}
                max={50}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>{priceRange[0]} ETH</span>
                <span>{priceRange[1]} ETH</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={priceRange[0]}
                onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                className="h-9"
              />
              <Input
                type="number"
                placeholder="Max"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                className="h-9"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Trait Filters */}
        <div className="space-y-4">
          <h4 className="font-semibold text-foreground">Properties</h4>
          <Accordion type="multiple" className="w-full space-y-2">
            {traits.map((trait) => (
              <AccordionItem key={trait.name} value={trait.name} className="border rounded-lg">
                <AccordionTrigger className="px-4 py-3 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                  <div className="flex items-center justify-between w-full mr-2">
                    <span className="font-medium">{trait.name}</span>
                    {selectedTraits[trait.name]?.length > 0 && (
                      <Badge variant="secondary" className="bg-primary text-primary-foreground">
                        {selectedTraits[trait.name].length}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {trait.values.map((value) => (
                      <div
                        key={value}
                        className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                          selectedTraits[trait.name]?.includes(value)
                            ? 'bg-primary/10 border border-primary/20'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => toggleTrait(trait.name, value)}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedTraits[trait.name]?.includes(value) || false}
                            onChange={() => {}} // Handled by parent onClick
                          />
                          <span className="text-sm font-medium">{value}</span>
                        </div>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          {Math.floor(Math.random() * 1000) + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
}

// Enhanced NFT Card Component
function NFTCard({ nft, onBuy, onOffer }: { 
  nft: NFT;
  onBuy: () => void;
  onOffer: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  // True light source rarity system
  const getRarityLight = (rarity: string) => {
    switch(rarity) {
      case "Mythic":
        return {
          // Core light colors
          primary: "168, 85, 247", // Purple RGB
          secondary: "236, 72, 153", // Pink RGB
          accent: "217, 70, 239", // Fuchsia RGB
          
          // Light properties
          intensity: 0.9,
          radius: 200,
          blur: 80,
          coreSize: 8,
          
          // Animations
          pulse: true,
          rotate: true,
          flicker: true,
          
          // Card effects
          cardElevation: "hover:-translate-y-2 hover:scale-[1.02]",
          hasParticles: true
        };
      case "Legendary":
        return {
          primary: "251, 191, 36", // Amber RGB
          secondary: "245, 158, 11", // Yellow RGB
          accent: "252, 211, 77", // Light gold RGB
          
          intensity: 0.75,
          radius: 160,
          blur: 60,
          coreSize: 6,
          
          pulse: true,
          rotate: false,
          flicker: false,
          
          cardElevation: "hover:-translate-y-1.5 hover:scale-[1.015]",
          hasParticles: true
        };
      case "Epic":
        return {
          primary: "139, 92, 246", // Violet RGB
          secondary: "167, 139, 250", // Light violet RGB
          accent: "124, 58, 237", // Dark violet RGB
          
          intensity: 0.6,
          radius: 120,
          blur: 40,
          coreSize: 4,
          
          pulse: false,
          rotate: false,
          flicker: false,
          
          cardElevation: "hover:-translate-y-1 hover:scale-[1.01]",
          hasParticles: false
        };
      case "Rare":
        return {
          primary: "59, 130, 246", // Blue RGB
          secondary: "96, 165, 250", // Light blue RGB
          accent: "37, 99, 235", // Dark blue RGB
          
          intensity: 0.45,
          radius: 80,
          blur: 30,
          coreSize: 3,
          
          pulse: false,
          rotate: false,
          flicker: false,
          
          cardElevation: "hover:-translate-y-1",
          hasParticles: false
        };
      case "Uncommon":
        return {
          primary: "34, 197, 94", // Green RGB
          secondary: "74, 222, 128", // Light green RGB
          accent: "22, 163, 74", // Dark green RGB
          
          intensity: 0.3,
          radius: 60,
          blur: 20,
          coreSize: 2,
          
          pulse: false,
          rotate: false,
          flicker: false,
          
          cardElevation: "hover:-translate-y-0.5",
          hasParticles: false
        };
      default: // Common
        return {
          primary: "156, 163, 175", // Gray RGB
          secondary: "209, 213, 219", // Light gray RGB
          accent: "107, 114, 128", // Dark gray RGB
          
          intensity: 0.15,
          radius: 40,
          blur: 15,
          coreSize: 0,
          
          pulse: false,
          rotate: false,
          flicker: false,
          
          cardElevation: "hover:-translate-y-0.5",
          hasParticles: false
        };
    }
  };
  
  const light = getRarityLight(nft.rarity);

  return (
    <div 
      className={`group bg-card rounded-lg sm:rounded-xl border border-white/5 overflow-visible transition-all duration-500 ${light.cardElevation} cursor-pointer relative`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* True Light Source Effect - Emanating from bottom */}
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{ zIndex: -1 }}
      >
        {/* Primary light orb */}
        <div 
          className={`absolute ${light.pulse ? 'animate-light-pulse' : ''}`}
          style={{
            width: `${light.radius}px`,
            height: `${light.radius}px`,
            left: '50%',
            bottom: `-${light.radius / 3}px`,
            transform: 'translateX(-50%)',
            background: `radial-gradient(circle at center, 
              rgba(${light.primary}, ${light.intensity}) 0%, 
              rgba(${light.primary}, ${light.intensity * 0.6}) 20%, 
              rgba(${light.primary}, ${light.intensity * 0.3}) 40%, 
              rgba(${light.primary}, 0) 70%)`,
            filter: `blur(${light.blur}px)`,
            opacity: isHovered ? 1 : 0.7,
            transition: 'all 0.5s ease'
          }}
        />
        
        {/* Secondary light layer for depth */}
        <div 
          className={`absolute ${light.rotate ? 'animate-light-rotate' : ''}`}
          style={{
            width: `${light.radius * 0.7}px`,
            height: `${light.radius * 0.7}px`,
            left: '50%',
            bottom: `-${light.radius / 4}px`,
            transform: 'translateX(-50%)',
            background: `radial-gradient(circle at center, 
              rgba(${light.secondary}, ${light.intensity * 0.8}) 0%, 
              rgba(${light.secondary}, ${light.intensity * 0.4}) 30%, 
              rgba(${light.secondary}, 0) 60%)`,
            filter: `blur(${light.blur * 0.6}px)`,
            mixBlendMode: 'screen',
            opacity: isHovered ? 0.9 : 0.6,
            transition: 'all 0.5s ease'
          }}
        />
        
        {/* Core bright light point */}
        {light.coreSize > 0 && (
          <div 
            className={`absolute ${light.flicker ? 'animate-light-flicker' : ''}`}
            style={{
              width: `${light.coreSize}px`,
              height: `${light.coreSize * 4}px`,
              left: '50%',
              bottom: '0',
              transform: 'translateX(-50%)',
              background: `linear-gradient(to top, 
                rgba(${light.primary}, 1) 0%, 
                rgba(${light.primary}, 0.5) 50%, 
                transparent 100%)`,
              filter: 'blur(2px)',
              opacity: light.intensity
            }}
          />
        )}
        
        {/* Accent light rays for higher rarities */}
        {light.intensity > 0.5 && (
          <>
            <div 
              className="absolute animate-light-ray"
              style={{
                width: '2px',
                height: `${light.radius * 0.8}px`,
                left: '50%',
                bottom: '0',
                transform: 'translateX(-50%) rotate(-20deg)',
                transformOrigin: 'bottom center',
                background: `linear-gradient(to top, 
                  rgba(${light.accent}, ${light.intensity * 0.6}) 0%, 
                  transparent 60%)`,
                opacity: isHovered ? 0.8 : 0.4,
                transition: 'opacity 0.5s ease'
              }}
            />
            <div 
              className="absolute animate-light-ray-reverse"
              style={{
                width: '2px',
                height: `${light.radius * 0.8}px`,
                left: '50%',
                bottom: '0',
                transform: 'translateX(-50%) rotate(20deg)',
                transformOrigin: 'bottom center',
                background: `linear-gradient(to top, 
                  rgba(${light.accent}, ${light.intensity * 0.6}) 0%, 
                  transparent 60%)`,
                opacity: isHovered ? 0.8 : 0.4,
                transition: 'opacity 0.5s ease'
              }}
            />
          </>
        )}
      </div>
      
      {/* Light reflection on card surface */}
      <div 
        className="absolute inset-0 pointer-events-none rounded-lg overflow-hidden"
        style={{
          background: `radial-gradient(ellipse at bottom center, 
            rgba(${light.primary}, ${light.intensity * 0.15}) 0%, 
            transparent 50%)`,
          opacity: isHovered ? 1 : 0.7,
          transition: 'opacity 0.5s ease'
        }}
      />
      
      {/* Card shadow with color matching light */}
      <div 
        className="absolute inset-0 pointer-events-none rounded-lg"
        style={{
          boxShadow: `
            0 ${20 * light.intensity}px ${60 * light.intensity}px -${15 * light.intensity}px rgba(${light.primary}, ${light.intensity * 0.5}),
            inset 0 0 ${30 * light.intensity}px rgba(${light.primary}, ${light.intensity * 0.1})
          `,
          opacity: isHovered ? 1 : 0.7,
          transition: 'all 0.5s ease'
        }}
      />
      
      {/* Floating light particles for Mythic/Legendary */}
      {light.hasParticles && isHovered && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-particle-float"
              style={{
                width: '2px',
                height: '2px',
                left: `${50 + (Math.random() - 0.5) * 30}%`,
                bottom: '0',
                background: `rgba(${light.primary}, 1)`,
                boxShadow: `0 0 ${6 + Math.random() * 4}px rgba(${light.primary}, 0.8)`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <MediaRenderer
          src={nft.image}
          alt={nft.name}
          className="transition-transform duration-300 group-hover:scale-110"
          aspectRatio="square"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
        />
        
        {/* Overlay Elements */}
        <div className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`} />
        
        {/* Top Badges */}
        <div className="absolute top-1 sm:top-2 left-1 sm:left-2 flex gap-1">
          {nft.new && (
            <Badge className="bg-black text-primary-foreground text-[10px] sm:text-xs px-1.5 sm:px-2 h-5 sm:h-6">New</Badge>
          )}
          {nft.auction && (
            <Badge className="bg-orange-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 h-5 sm:h-6">Auction</Badge>
          )}
        </div>

        {/* Top Right Actions */}
        <div className={`absolute top-1 sm:top-2 right-1 sm:right-2 flex gap-1 sm:gap-2 transition-all duration-300 ${
          isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}>
          <Button
            size="sm"
            variant="secondary"
            className="h-6 w-6 sm:h-8 sm:w-8 p-0 backdrop-blur-sm bg-black/20 border-white/20 hover:bg-black/40"
            onClick={(e) => {
              e.stopPropagation();
              setIsLiked(!isLiked);
            }}
          >
            <Heart className={`h-3 w-3 sm:h-4 sm:w-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-6 w-6 sm:h-8 sm:w-8 p-0 backdrop-blur-sm bg-black/20 border-white/20 hover:bg-black/40"
          >
            <Share2 className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
          </Button>
        </div>

        {/* Light indicator orb */}
        {light.intensity > 0.3 && (
          <div className="absolute top-12 right-2">
            <div 
              className="rounded-full"
              style={{
                width: '6px',
                height: '6px',
                background: `rgba(${light.primary}, 1)`,
                boxShadow: `
                  0 0 ${10 * light.intensity}px rgba(${light.primary}, 0.8),
                  0 0 ${20 * light.intensity}px rgba(${light.primary}, 0.4)
                `,
                opacity: light.intensity
              }}
            />
          </div>
        )}

        {/* Bottom Left Stats */}
        <div className="absolute bottom-1 sm:bottom-2 left-1 sm:left-2 flex items-center gap-1 sm:gap-3 text-white text-[10px] sm:text-xs">
          <div className="flex items-center gap-0.5 sm:gap-1 bg-black/40 backdrop-blur-sm rounded px-1.5 sm:px-2 py-0.5 sm:py-1">
            <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            {nft.views}
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1 bg-black/40 backdrop-blur-sm rounded px-1.5 sm:px-2 py-0.5 sm:py-1">
            <Heart className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            {nft.likes}
          </div>
        </div>
      </div>
      
      {/* Card Content */}
      <div className="p-3 sm:p-4 space-y-2 sm:space-y-3 relative">
        <div className="flex items-start justify-between gap-1 sm:gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold truncate text-xs sm:text-sm">{nft.name}</h3>
            <div className="flex items-center gap-1 sm:gap-2 mt-1">
              <span 
                className="text-[10px] sm:text-xs font-medium"
                style={{
                  color: light.intensity > 0.4 ? `rgba(${light.primary}, 1)` : 'rgb(156, 163, 175)',
                  textShadow: light.intensity > 0.6 ? `0 0 8px rgba(${light.primary}, 0.5)` : 'none'
                }}
              >
                #{nft.rank}
              </span>
              {/* Rarity text with light glow for high tiers */}
              {light.intensity > 0.6 && (
                <span 
                  className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded"
                  style={{
                    background: `linear-gradient(135deg, 
                      rgba(${light.primary}, 0.1), 
                      rgba(${light.secondary}, 0.1))`,
                    color: `rgba(${light.primary}, 1)`,
                    border: `1px solid rgba(${light.primary}, 0.3)`,
                    boxShadow: `inset 0 0 10px rgba(${light.primary}, 0.1)`
                  }}
                >
                  {nft.rarity}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="min-w-0">
            {nft.price ? (
              <div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">Price</div>
                <div className="font-bold text-xs sm:text-sm">{nft.price} ETH</div>
              </div>
            ) : nft.lastSale ? (
              <div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">Last Sale</div>
                <div className="font-medium text-muted-foreground text-xs sm:text-sm">{nft.lastSale} ETH</div>
              </div>
            ) : (
              <div className="text-xs sm:text-sm text-muted-foreground">Not for sale</div>
            )}
          </div>
          
          <div className="flex gap-1">
            {nft.price ? (
              <Button size="sm" className="gap-0.5 sm:gap-1 h-7 sm:h-8 flex-1 text-xs sm:text-sm px-2 sm:px-3" onClick={onBuy}>
                <Zap className="h-3 w-3" />
                <span className="hidden sm:inline">Buy</span>
              </Button>
            ) : (
              <Button size="sm" variant="outline" className="gap-0.5 sm:gap-1 h-7 sm:h-8 flex-1 text-xs sm:text-sm px-2 sm:px-3" onClick={onOffer}>
                <Tag className="h-3 w-3" />
                <span className="hidden sm:inline">Offer</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Enhanced NFT List Item Component
function NFTListItem({ nft, onBuy, onOffer }: { 
  nft: NFT;
  onBuy: () => void;
  onOffer: () => void;
}) {
  const [isLiked, setIsLiked] = useState(false);
  
  // Rarity color system - matching card design
  const getRarityGradient = (rarity: string) => {
    switch(rarity) {
      case "Mythic":
        return {
          gradient: "from-purple-600 via-pink-500 to-purple-600",
          borderGlow: "border-purple-500/30",
          bgGlow: "bg-purple-500/5"
        };
      case "Legendary":
        return {
          gradient: "from-yellow-500 via-orange-400 to-yellow-500",
          borderGlow: "border-yellow-500/30",
          bgGlow: "bg-yellow-500/5"
        };
      case "Epic":
        return {
          gradient: "from-violet-500 via-purple-500 to-violet-500",
          borderGlow: "border-violet-500/30",
          bgGlow: "bg-violet-500/5"
        };
      case "Rare":
        return {
          gradient: "from-blue-500 via-cyan-400 to-blue-500",
          borderGlow: "border-blue-500/30",
          bgGlow: "bg-blue-500/5"
        };
      case "Uncommon":
        return {
          gradient: "from-green-500 via-emerald-400 to-green-500",
          borderGlow: "border-green-500/30",
          bgGlow: "bg-green-500/5"
        };
      default: // Common
        return {
          gradient: "from-gray-400 via-gray-300 to-gray-400",
          borderGlow: "border-gray-400/20",
          bgGlow: ""
        };
    }
  };
  
  const rarityStyle = getRarityGradient(nft.rarity);

  return (
    <div className={`bg-card rounded-lg border ${rarityStyle.borderGlow} ${rarityStyle.bgGlow} p-4 hover:shadow-md transition-all duration-200 relative overflow-hidden`}>
      {/* Subtle rarity accent line */}
      <div className="absolute left-0 top-0 bottom-0 w-1">
        <div className={`absolute inset-0 bg-gradient-to-b ${rarityStyle.gradient}`} />
      </div>
      
      <div className="flex items-center gap-4 pl-2">
        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
          <MediaRenderer src={nft.image} alt={nft.name} className="" aspectRatio="square" />
          {/* Small rarity indicator dot */}
          {(nft.rarity !== "Common") && (
            <div className="absolute top-1 right-1">
              <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${rarityStyle.gradient}`} />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold truncate">{nft.name}</h3>
            <Badge variant="outline" className="text-xs">#{nft.rank}</Badge>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {nft.views}
            </div>
            <div className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              {nft.likes}
            </div>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          {nft.price ? (
            <div>
              <div className="text-xs text-muted-foreground">Price</div>
              <div className="font-bold">{nft.price} ETH</div>
            </div>
          ) : nft.lastSale ? (
            <div>
              <div className="text-xs text-muted-foreground">Last Sale</div>
              <div className="font-medium text-muted-foreground">{nft.lastSale} ETH</div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Not listed</div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsLiked(!isLiked)}
            className="h-8 w-8 p-0"
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
          
          {nft.price ? (
            <Button size="sm" className="gap-1" onClick={onBuy}>
              <Zap className="h-4 w-4" />
              Buy Now
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="gap-1" onClick={onOffer}>
              <Tag className="h-4 w-4" />
              Make Offer
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}