"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { MediaRenderer } from "@/components/MediaRenderer";
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
import NFTCardEnhanced from "@/components/nft-card-enhanced";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/auth-context";
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
  Crown,
  Calendar,
  MapPin,
  Link2,
  Send,
  Instagram,
  Youtube,
  Sparkles,
  Star,
  Trophy,
  Flame,
  Settings,
  Edit,
} from "lucide-react";

// Enhanced user profile interface
interface UserProfile {
  id: string;
  walletAddress: string;
  username?: string;
  profilePicture?: string;
  bannerImage?: string;
  bio?: string;
  profileCompleted: boolean;
  isCreator: boolean;
  creatorAppliedAt?: Date;
  creatorApprovedAt?: Date;
  verified?: boolean;
  socials: Array<{
    id: string;
    platform: string;
    url: string;
  }>;
  stats: {
    nftsOwned: number;
    collectionsOwned: number;
    totalValue: number;
    volumeTraded: number;
    created?: number;
    followers?: number;
    following?: number;
    avgSalePrice?: number;
    topSale?: number;
    rank?: number;
    joinedDays?: number;
  };
  createdAt: Date;
}

// Enhanced NFT interface
interface NFT {
  id: string;
  name: string;
  image: string;
  collectionName: string;
  collectionSlug: string;
  chain: 'ethereum' | 'polygon' | 'arbitrum' | 'optimism' | 'base';
  price?: number;
  lastSale?: number;
  floorPrice?: number;
  rarity?: string;
  rank?: number;
  traits?: Record<string, string>;
  owned: boolean;
  created: boolean;
  listed: boolean;
  auction: boolean;
  new: boolean;
  likes: number;
  views: number;
  lastViewed: Date;
  topBid?: number;
  royalty?: number;
}


const chains = ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base'] as const;
const rarities = ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic"];

const generateMockNFTs = (count: number = 100): NFT[] => 
  Array.from({ length: count }, (_, i) => {
    const id = i + 1;
    const rarity = rarities[Math.floor(Math.random() * rarities.length)];
    const multiplier = rarity === "Mythic" ? 10 : rarity === "Legendary" ? 5 : rarity === "Epic" ? 3 : rarity === "Rare" ? 2 : 1;
    
    return {
      id: id.toString(),
      name: `Genesis #${id.toString().padStart(4, "0")}`,
      image: `https://picsum.photos/400/400?random=${id}`,
      collectionName: `Collection ${Math.floor(i / 20) + 1}`,
      collectionSlug: `collection-${Math.floor(i / 20) + 1}`,
      chain: chains[Math.floor(Math.random() * chains.length)],
      price: Math.random() > 0.4 ? +(Math.random() * 10 * multiplier + 0.5).toFixed(2) : undefined,
      lastSale: Math.random() > 0.6 ? +(Math.random() * 8 * multiplier + 0.3).toFixed(2) : undefined,
      floorPrice: +(Math.random() * 2 + 0.1).toFixed(2),
      rarity,
      rank: Math.floor(Math.random() * 10000) + 1,
      traits: {
        Background: ["Neon", "Dark", "Cyber", "Matrix", "Storm"][Math.floor(Math.random() * 5)],
        Type: ["Robot", "Human", "Alien", "Cyborg", "AI"][Math.floor(Math.random() * 5)],
        Rarity: rarity,
      },
      owned: Math.random() > 0.7,
      created: Math.random() > 0.8,
      listed: Math.random() > 0.6,
      auction: Math.random() > 0.9,
      new: Math.random() > 0.8,
      likes: Math.floor(Math.random() * 500) + 10,
      views: Math.floor(Math.random() * 2000) + 100,
      lastViewed: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
      topBid: Math.random() > 0.7 ? +(Math.random() * 2 + 0.5).toFixed(2) : undefined,
      royalty: 5.0,
    };
  });

// Activity mock data
const generateMockActivity = (count: number = 50) => 
  Array.from({ length: count }, (_, i) => ({
    id: i.toString(),
    type: ["sale", "list", "offer", "transfer", "mint", "burn"][Math.floor(Math.random() * 6)],
    nftName: `Genesis #${Math.floor(Math.random() * 1000).toString().padStart(4, "0")}`,
    nftImage: `https://picsum.photos/100/100?random=${i}`,
    price: +(Math.random() * 5 + 0.1).toFixed(2),
    from: `0x${Math.random().toString(16).slice(2, 10)}`,
    to: `0x${Math.random().toString(16).slice(2, 10)}`,
    timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    txHash: `0x${Math.random().toString(16).slice(2, 66)}`,
  }));

// Types
type SortOption = "recent" | "price-low" | "price-high" | "rarity-rare" | "rarity-common" | "most-liked" | "oldest";
type ViewMode = "grid" | "list";
type TabValue = "owned" | "created" | "activity" | "offers" | "analytics";

interface StatusFilters {
  listed: boolean;
  auction: boolean;
  new: boolean;
  hasOffers: boolean;
}

export default function UserProfile() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const address = params?.address as string;
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Profile and NFT state
  const [user, setUser] = useState<UserProfile | null>(null);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [nftLoading, setNftLoading] = useState(false);
  const [activity] = useState(generateMockActivity());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Enhanced state management
  const [searchQuery, setSearchQuery] = useState(searchParams?.get("search") || "");
  const [sortBy, setSortBy] = useState<SortOption>((searchParams?.get("sort") as SortOption) || "recent");
  const [viewMode, setViewMode] = useState<ViewMode>((searchParams?.get("view") as ViewMode) || "grid");
  const [activeTab, setActiveTab] = useState<TabValue>((searchParams?.get("tab") as TabValue) || "owned");
  const [priceRange, setPriceRange] = useState([0, 50]);
  const [selectedChains, setSelectedChains] = useState<Set<string>>(new Set());
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(new Set());
  const [statusFilters, setStatusFilters] = useState<StatusFilters>({
    listed: false,
    auction: false,
    new: false,
    hasOffers: false,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [isFollowing, setIsFollowing] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const itemsPerPage = viewMode === "list" ? 50 : 24;
  const isOwnProfile = currentUser && currentUser.walletAddress.toLowerCase() === address?.toLowerCase();

  // Fetch user data
  useEffect(() => {
    async function fetchUser() {
      if (!address) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/user/${address}`)
        const data = await response.json()
        
        if (data.success) {
          setUser(data.user);
        } else {
          setError(data.error || 'Failed to load user profile');
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    }
    
    fetchUser();
  }, [address]);

  // Fetch NFT data
  useEffect(() => {
    async function fetchNFTs() {
      if (!address || !user) return;
      
      setNftLoading(true);
      
      try {
        const params = new URLSearchParams({
          filter: activeTab,
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
          search: searchQuery,
          sortBy: sortBy
        });

        // Add chain filters
        if (selectedChains.size > 0) {
          params.append('chains', Array.from(selectedChains).join(','));
        }

        // Add collection filters  
        if (selectedCollections.size > 0) {
          params.append('collections', Array.from(selectedCollections).join(','));
        }

        // Add price range
        if (priceRange[0] > 0 || priceRange[1] < 50) {
          params.append('minPrice', priceRange[0].toString());
          params.append('maxPrice', priceRange[1].toString());
        }

        // Add status filters
        if (statusFilters.listed) params.append('status', 'listed');
        else if (statusFilters.auction) params.append('status', 'auction');
        else if (statusFilters.new) params.append('status', 'new');
        else if (statusFilters.hasOffers) params.append('status', 'hasOffers');

        const response = await fetch(`/api/user/${address}/nfts?${params.toString()}`);
        const data = await response.json();
        
        if (data.success) {
          setNfts(data.data.nfts);
        } else {
          console.error('Failed to fetch NFTs:', data.error);
        }
      } catch (err) {
        console.error('Error fetching NFTs:', err);
      } finally {
        setNftLoading(false);
      }
    }
    
    // Only fetch NFTs for owned/created tabs
    if (activeTab === 'owned' || activeTab === 'created') {
      fetchNFTs();
    }
  }, [
    address,
    user,
    activeTab,
    currentPage,
    itemsPerPage,
    searchQuery,
    sortBy,
    selectedChains,
    selectedCollections,
    priceRange,
    statusFilters
  ]);

  // Scroll handling
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 385;
      setHeaderScrolled(scrolled);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Get unique collections
  const availableCollections = useMemo(() => {
    return Array.from(new Set(nfts.map(nft => nft.collectionName))).sort();
  }, [nfts]);

  // Since we're fetching filtered data from the API, we use NFTs directly
  // The API handles filtering, sorting, and pagination
  const filteredNFTs = nfts;
  const currentNFTs = nfts; // API already returns paginated data
  const totalPages = 1; // TODO: Get from API response

  const clearAllFilters = () => {
    setSelectedChains(new Set());
    setSelectedCollections(new Set());
    setStatusFilters({
      listed: false,
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
    selectedChains.size +
    selectedCollections.size +
    (priceRange[0] > 0 || priceRange[1] < 50 ? 1 : 0);

  const copyAddress = () => {
    if (user) {
      navigator.clipboard.writeText(user.walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg font-semibold mb-2">Loading profile...</div>
          <div className="text-sm text-muted-foreground">Fetching user data and NFTs</div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-destructive" />
          </div>
          <div className="text-lg font-semibold mb-2 text-destructive">Profile not found</div>
          <div className="text-sm text-muted-foreground">{error}</div>
          <Button onClick={() => router.push('/')} className="mt-4">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <div className="relative h-[320px] sm:h-[400px] lg:h-[500px] overflow-hidden"
      style={{
        position: headerScrolled ? 'sticky' : 'relative',
        top: headerScrolled ? '-385px' : 'auto',
        zIndex: headerScrolled ? 10 : 'auto',
      }}>
        <MediaRenderer
          src={user.bannerImage}
          alt={`${user.username || 'User'} banner`}
          className=""
          aspectRatio="banner"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
        <div className="absolute bottom-0 left-0 right-0 h-24 sm:h-32 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

      {/* Sticky User Header */}
      <div className={`sticky top-0 z-50 border-b transition-all duration-300 -mt-20 sm:-mt-24 ${
        headerScrolled 
          ? 'bg-[#000]' 
          : ''
      }`}>
        <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* User Avatar */}
            <div className={`relative transition-all duration-300 flex-shrink-0 ${
              headerScrolled ? 'w-10 h-10 sm:w-12 sm:h-12' : 'w-14 h-14 sm:w-16 sm:h-16'
            }`}>
              <MediaRenderer
                src={user.profilePicture}
                alt={user.username || 'User'}
                className="rounded-xl border-2 border-background shadow-lg"
                aspectRatio="square"
              />
              {user.verified && (
                <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
                  <Verified className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
              {user.isCreator && (
                <div className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-1">
                  <Crown className="h-3 w-3 text-white" />
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 sm:gap-2 mb-1">
                <h1 className={`font-bold truncate transition-all duration-300 ${
                  headerScrolled ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl lg:text-3xl'
                }`}>
                  {user.username || `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`}
                </h1>
                <div className="flex items-center gap-1">
                  {user.isCreator && (
                    <Badge className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-600 border-yellow-500/30">
                      <Crown className="w-3 h-3 mr-1" />
                      Creator
                    </Badge>
                  )}
                  {user.stats.rank && user.stats.rank <= 1000 && (
                    <Badge className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30">
                      <Trophy className="w-3 h-3 mr-1" />
                      Top {user.stats.rank}
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className={`flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground transition-all duration-300 overflow-x-auto ${
                headerScrolled ? 'hidden sm:flex' : 'flex'
              }`}>
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span className="font-medium text-foreground">{user.stats.nftsOwned.toLocaleString()}</span>
                  <span className="hidden xs:inline">NFTs</span>
                </div>
                <Separator orientation="vertical" className="h-4 hidden sm:block" />
                <div className="flex items-center gap-1 whitespace-nowrap hidden sm:flex">
                  <span className="font-medium text-foreground">{user.stats.totalValue.toLocaleString()} ETH</span>
                  <span>Value</span>
                </div>
                <Separator orientation="vertical" className="h-4 hidden lg:block" />
                <div className="flex items-center gap-1 whitespace-nowrap hidden lg:flex">
                  <span className="font-medium text-foreground">{user.stats.volumeTraded.toLocaleString()} ETH</span>
                  <span>Volume</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyAddress}
                      className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3 border-border/50 hover:border-primary/50"
                    >
                      <Copy className="h-4 w-4" />
                      <span className="hidden sm:inline ml-2">
                        {copied ? "Copied!" : "Copy Address"}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{copied ? "Copied!" : "Copy wallet address"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {!isOwnProfile && (
                <Button
                  variant={isFollowing ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsFollowing(!isFollowing)}
                  className="gap-2 hidden sm:flex"
                >
                  <Users className="h-4 w-4" />
                  {isFollowing ? "Following" : "Follow"}
                </Button>
              )}

              {isOwnProfile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/profile/edit')}
                  className="gap-2 hidden sm:flex"
                >
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </Button>
              )}

              <Button variant="ghost" size="sm" className="gap-2 hidden lg:flex">
                <Share2 className="h-4 w-4" />
                Share
              </Button>

              {/* Social Links */}
              <div className="hidden lg:flex items-center gap-1">
                {user.socials.map((social) => {
                  const Icon = social.platform === 'twitter' ? Twitter : 
                              social.platform === 'discord' ? MessageCircle :
                              social.platform === 'instagram' ? Instagram :
                              social.platform === 'youtube' ? Youtube :
                              social.platform === 'website' ? Globe : Link2;
                  
                  return (
                    <Button
                      key={social.id}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      asChild
                    >
                      <Link href={social.url} target="_blank">
                        <Icon className="h-4 w-4" />
                      </Link>
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Toolbar */}
      <div className="sticky top-[72px] sm:top-[85px] z-40 bg-background/99 backdrop-blur-xl border-b">
        <div className="px-3 sm:px-4 lg:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-2 sm:py-3 gap-2 sm:gap-4">
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)} className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-4 bg-transparent p-0 h-auto">
                <TabsTrigger value="owned" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg px-3 py-2">
                  <span className="text-xs sm:text-sm font-medium">Owned</span>
                  <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 h-5 text-[10px]">
                    {nfts.filter(n => n.owned).length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="created" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg px-3 py-2">
                  <span className="text-xs sm:text-sm font-medium">Created</span>
                  <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 h-5 text-[10px]">
                    {nfts.filter(n => n.created).length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="activity" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg px-3 py-2">
                  <span className="text-xs sm:text-sm font-medium">Activity</span>
                </TabsTrigger>
                <TabsTrigger value="offers" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg px-3 py-2">
                  <span className="text-xs sm:text-sm font-medium">Offers</span>
                  <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 h-5 text-[10px]">
                    12
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Right Side - Controls */}
            {(activeTab === "owned" || activeTab === "created") && (
              <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-end">
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
                      <MobileFilterSidebar
                        priceRange={priceRange}
                        setPriceRange={setPriceRange}
                        selectedChains={selectedChains}
                        setSelectedChains={setSelectedChains}
                        selectedCollections={selectedCollections}
                        setSelectedCollections={setSelectedCollections}
                        statusFilters={statusFilters}
                        setStatusFilters={setStatusFilters}
                        availableCollections={availableCollections}
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

                {/* Sort */}
                <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                  <SelectTrigger className="w-32 sm:w-44 h-8 sm:h-9 text-sm">
                    <ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Recently Added</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="rarity-rare">Rarity: Rare First</SelectItem>
                    <SelectItem value="most-liked">Most Liked</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
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
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content with Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)} className="flex-1">
        <div className="flex-1 lg:flex lg:gap-6 px-3 sm:px-4 lg:px-6 pb-12">
          {/* Desktop Sidebar - conditionally show based on tab */}
          {(activeTab === "owned" || activeTab === "created") && (
            <aside className="hidden lg:block w-64 space-y-6 mt-6 sticky top-[160px] h-fit">
              <FilterSidebar
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                selectedChains={selectedChains}
                setSelectedChains={setSelectedChains}
                selectedCollections={selectedCollections}
                setSelectedCollections={setSelectedCollections}
                statusFilters={statusFilters}
                setStatusFilters={setStatusFilters}
                availableCollections={availableCollections}
                onClearAll={clearAllFilters}
                activeFiltersCount={activeFiltersCount}
              />
            </aside>
          )}

          {/* Main Content */}
          <div className="flex-1 mt-6">
            <TabsContent value="owned" className="mt-0">
              <NFTGridContent
                nfts={currentNFTs}
                viewMode={viewMode}
                activeFiltersCount={activeFiltersCount}
                clearAllFilters={clearAllFilters}
                statusFilters={statusFilters}
                setStatusFilters={setStatusFilters}
                selectedChains={selectedChains}
                setSelectedChains={setSelectedChains}
                selectedCollections={selectedCollections}
                setSelectedCollections={setSelectedCollections}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                availableCollections={availableCollections}
                totalPages={totalPages}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                itemsPerPage={itemsPerPage}
                filteredNFTs={filteredNFTs}
              />
            </TabsContent>

            <TabsContent value="created" className="mt-0">
              <NFTGridContent
                nfts={currentNFTs}
                viewMode={viewMode}
                activeFiltersCount={activeFiltersCount}
                clearAllFilters={clearAllFilters}
                statusFilters={statusFilters}
                setStatusFilters={setStatusFilters}
                selectedChains={selectedChains}
                setSelectedChains={setSelectedChains}
                selectedCollections={selectedCollections}
                setSelectedCollections={setSelectedCollections}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                availableCollections={availableCollections}
                totalPages={totalPages}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                itemsPerPage={itemsPerPage}
                filteredNFTs={filteredNFTs}
              />
            </TabsContent>

            <TabsContent value="activity" className="mt-0">
              <ActivityContent activity={activity} />
            </TabsContent>

            <TabsContent value="offers" className="mt-0">
              <div className="text-center py-12 text-muted-foreground">
                <Tag className="w-12 h-12 mx-auto mb-3" />
                <div className="text-lg font-medium mb-2">No active offers</div>
                <div className="text-sm">Offers made and received will appear here</div>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <AnalyticsContent user={user} />
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}

// NFT Grid Content Component
function NFTGridContent({
  nfts,
  viewMode,
  activeFiltersCount,
  clearAllFilters,
  statusFilters,
  setStatusFilters,
  selectedChains,
  setSelectedChains,
  selectedCollections,
  setSelectedCollections,
  priceRange,
  setPriceRange,
  availableCollections,
  totalPages,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  filteredNFTs
}: any) {
  const handleBuyNFT = (nft: NFT) => {
    console.log('Buy NFT:', nft);
  };
  
  const handleMakeOffer = (nft: NFT) => {
    console.log('Make offer on NFT:', nft);
  };

  return (
    <div className="flex-1">
      {/* Content Area - No sidebar here since it's already in the parent */}
      <div className="w-full">
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
                        setStatusFilters((prev: any) => ({ ...prev, [key]: false }))
                      } />
                    </Badge>
                  ))}
              </div>
            </div>
          )}

          {/* Results count */}
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {filteredNFTs.length.toLocaleString()} items
          </div>

          {/* NFT Grid */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
              {nfts.map((nft: NFT) => (
                <NFTCardEnhanced 
                  key={nft.id} 
                  nft={nft} 
                  onBuy={() => handleBuyNFT(nft)}
                  onOffer={() => handleMakeOffer(nft)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {nfts.map((nft: NFT) => (
                <NFTListItem 
                  key={nft.id} 
                  nft={nft}
                  onBuy={() => handleBuyNFT(nft)}
                  onOffer={() => handleMakeOffer(nft)}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
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
  );
}

// Activity Content Component
function ActivityContent({ activity }: { activity: any[] }) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'sale': return <Zap className="w-4 h-4 text-green-500" />;
      case 'list': return <Tag className="w-4 h-4 text-blue-500" />;
      case 'offer': return <Heart className="w-4 h-4 text-purple-500" />;
      case 'transfer': return <Send className="w-4 h-4 text-orange-500" />;
      case 'mint': return <Sparkles className="w-4 h-4 text-yellow-500" />;
      case 'burn': return <Flame className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'sale': return 'text-green-500';
      case 'list': return 'text-blue-500';
      case 'offer': return 'text-purple-500';
      case 'transfer': return 'text-orange-500';
      case 'mint': return 'text-yellow-500';
      case 'burn': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {activity.map((item, index) => (
        <div key={item.id} className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border/50 hover:border-primary/30 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              <MediaRenderer 
                src={item.nftImage} 
                alt={item.nftName}
                className="w-full h-full"
                aspectRatio="square"
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {getActivityIcon(item.type)}
                <span className={`font-medium capitalize ${getActivityColor(item.type)}`}>
                  {item.type}
                </span>
                <span className="text-sm text-muted-foreground">•</span>
                <span className="text-sm font-medium truncate">{item.nftName}</span>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>From</span>
                  <code className="bg-muted px-2 py-0.5 rounded text-xs">
                    {item.from.slice(0, 6)}...{item.from.slice(-4)}
                  </code>
                </div>
                {item.to && (
                  <>
                    <span>to</span>
                    <code className="bg-muted px-2 py-0.5 rounded text-xs">
                      {item.to.slice(0, 6)}...{item.to.slice(-4)}
                    </code>
                  </>
                )}
              </div>
            </div>
            
            <div className="text-right flex-shrink-0">
              {item.price && (
                <div className="text-lg font-bold">{item.price} ETH</div>
              )}
              <div className="text-xs text-muted-foreground">
                {item.timestamp.toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Analytics Content Component
function AnalyticsContent({ user }: { user: UserProfile }) {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Portfolio Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 border border-border/50">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Portfolio Performance
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Value</span>
              <span className="font-bold">{user.stats.totalValue} ETH</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Volume Traded</span>
              <span className="font-bold">{user.stats.volumeTraded} ETH</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Best Sale</span>
              <span className="font-bold text-green-500">{user.stats.topSale} ETH</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Average Sale</span>
              <span className="font-bold">{user.stats.avgSalePrice} ETH</span>
            </div>
          </div>
        </div>

        <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 border border-border/50">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Collection Stats
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">NFTs Owned</span>
              <span className="font-bold">{user.stats.nftsOwned.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Collections</span>
              <span className="font-bold">{user.stats.collectionsOwned}</span>
            </div>
            {user.isCreator && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="font-bold text-primary">{user.stats.created}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Placeholder for charts */}
      <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 border border-border/50">
        <h3 className="text-lg font-semibold mb-4">Portfolio Timeline</h3>
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-3" />
            <div className="text-lg font-medium mb-2">Portfolio Analytics</div>
            <div className="text-sm">Advanced analytics coming soon</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Filter Sidebar Components (same as collection detail page structure)
function FilterSidebar({
  priceRange,
  setPriceRange,
  selectedChains,
  setSelectedChains,
  selectedCollections,
  setSelectedCollections,
  statusFilters,
  setStatusFilters,
  availableCollections,
  activeFiltersCount,
  onClearAll,
}: any) {
  const chainInfo = {
    ethereum: { name: 'Ethereum', icon: '⟠' },
    polygon: { name: 'Polygon', icon: '⬟' },
    arbitrum: { name: 'Arbitrum', icon: '◉' },
    optimism: { name: 'Optimism', icon: '⬤' },
    base: { name: 'Base', icon: '◯' }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-6 border-b bg-muted/30">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Filters</h3>
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
              listed: "Listed",
              auction: "Auction",
              new: "New",
              hasOffers: "Has Offers",
            }).map(([key, label]) => (
              <Button
                key={key}
                variant={statusFilters[key as keyof StatusFilters] ? "default" : "outline"}
                size="sm"
                onClick={() => 
                  setStatusFilters((prev: any) => ({ ...prev, [key]: !prev[key as keyof StatusFilters] }))
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

        {/* Chains */}
        <div className="space-y-4">
          <h4 className="font-semibold text-foreground">Blockchains</h4>
          <Accordion type="multiple" className="w-full space-y-2">
            <AccordionItem value="chains" className="border rounded-lg">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center justify-between w-full mr-2">
                  <span className="font-medium">Chains</span>
                  {selectedChains.size > 0 && (
                    <Badge variant="secondary" className="bg-primary text-primary-foreground">
                      {selectedChains.size}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-2">
                  {Object.entries(chainInfo).map(([chain, info]) => (
                    <div
                      key={chain}
                      className="flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        const newSet = new Set(selectedChains);
                        if (newSet.has(chain)) {
                          newSet.delete(chain);
                        } else {
                          newSet.add(chain);
                        }
                        setSelectedChains(newSet);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox checked={selectedChains.has(chain)} />
                        <span className="text-sm font-medium flex items-center gap-2">
                          <span>{info.icon}</span>
                          {info.name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <Separator />

        {/* Collections */}
        <div className="space-y-4">
          <h4 className="font-semibold text-foreground">Collections</h4>
          <Accordion type="multiple" className="w-full space-y-2">
            <AccordionItem value="collections" className="border rounded-lg">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center justify-between w-full mr-2">
                  <span className="font-medium">Collections</span>
                  {selectedCollections.size > 0 && (
                    <Badge variant="secondary" className="bg-primary text-primary-foreground">
                      {selectedCollections.size}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {availableCollections.map((collection: string) => (
                    <div
                      key={collection}
                      className="flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        const newSet = new Set(selectedCollections);
                        if (newSet.has(collection)) {
                          newSet.delete(collection);
                        } else {
                          newSet.add(collection);
                        }
                        setSelectedCollections(newSet);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox checked={selectedCollections.has(collection)} />
                        <span className="text-sm font-medium">{collection}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
}

// Mobile Filter Sidebar Component
function MobileFilterSidebar(props: any) {
  return (
    <div className="h-full">
      <FilterSidebar {...props} />
    </div>
  );
}

// NFT List Item Component
function NFTListItem({ nft, onBuy, onOffer }: { 
  nft: NFT;
  onBuy: () => void;
  onOffer: () => void;
}) {
  const [isLiked, setIsLiked] = useState(false);

  return (
    <div className="bg-card rounded-lg border p-4 hover:shadow-md transition-all duration-200">
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
          <MediaRenderer src={nft.image} alt={nft.name} className="w-full h-full" aspectRatio="square" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold truncate">{nft.name}</h3>
            <Badge variant="outline" className="text-xs">#{nft.rank}</Badge>
            {nft.rarity && (
              <Badge variant="secondary" className="text-xs">{nft.rarity}</Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{nft.collectionName}</span>
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