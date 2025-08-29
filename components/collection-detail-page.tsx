"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  Play,
  Pause,
  Volume2,
  VolumeX,
  Share2,
  Heart,
  Plus,
  Star,
  TrendingUp,
  Users,
  Eye,
  ShoppingCart,
  Zap,
  Crown,
  ChevronDown,
  Search,
  Filter,
  Grid3x3,
  List,
  MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface CollectionDetailPageProps {
  slug: string;
}

// Tab content components
const AboutTab = ({ collection }: { collection: any }) => (
  <div className="space-y-6">
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <h3 className="text-xl font-bold text-white mb-4">Description</h3>
        <p className="text-white/80 leading-relaxed">{collection.longDescription}</p>
      </div>
      <div>
        <h3 className="text-xl font-bold text-white mb-4">Details</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-white/60">Contract Address</span>
            <span className="text-white font-mono text-sm">0x1234...5678</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Token Standard</span>
            <span className="text-white">ERC-721</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Blockchain</span>
            <span className="text-white">Ethereum</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Created</span>
            <span className="text-white">Jan 2024</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Royalty</span>
            <span className="text-white">5%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ItemsTab = ({ collection, searchQuery, sortBy, filterRarity, viewMode }: any) => (
  <div className="space-y-6">
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <p className="text-white/70">{collection.items.length} items available</p>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 h-4 w-4" />
          <Input
            placeholder="Search items..."
            value={searchQuery}
            className="pl-10 pr-4 py-2 bg-black/40 border-white/20 text-white placeholder:text-white/60 w-64"
          />
        </div>
        <select className="bg-black/40 border border-white/20 text-white rounded-lg px-3 py-2 text-sm">
          <option value="all">All Rarities</option>
          <option value="common">Common</option>
          <option value="rare">Rare</option>
          <option value="epic">Epic</option>
          <option value="legendary">Legendary</option>
        </select>
        <select className="bg-black/40 border border-white/20 text-white rounded-lg px-3 py-2 text-sm">
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="rarity">Rarity</option>
          <option value="likes">Most Liked</option>
        </select>
        <div className="flex items-center gap-1">
          <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="icon" className="text-white">
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="icon" className="text-white">
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>

    <div className={`grid gap-4 ${
      viewMode === 'grid' 
        ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' 
        : 'grid-cols-1'
    }`}>
      {collection.items.map((item: any, index: number) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * index, duration: 0.6 }}
          className="group cursor-pointer"
        >
          <div className={`bg-black/40 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 rounded-xl overflow-hidden ${
            viewMode === 'list' ? 'flex items-center p-4 gap-4' : ''
          }`}>
            <div className={`relative ${viewMode === 'grid' ? 'aspect-square' : 'w-20 h-20 flex-shrink-0'}`}>
              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2">
                <Badge className={`text-xs px-2 py-1 ${
                  item.rarity === 'Mythic' ? 'bg-purple-500/90 text-white' :
                  item.rarity === 'Legendary' ? 'bg-orange-500/90 text-white' :
                  item.rarity === 'Epic' ? 'bg-purple-400/90 text-white' :
                  item.rarity === 'Rare' ? 'bg-blue-500/90 text-white' :
                  'bg-gray-500/90 text-white'
                }`}>
                  {item.rarity}
                </Badge>
              </div>
            </div>
            <div className={`${viewMode === 'grid' ? 'p-4' : 'flex-1'}`}>
              <h3 className="font-bold text-white text-sm md:text-base truncate">{item.name}</h3>
              <p className="text-white/60 text-xs mb-2">Last sale: {item.lastSale}</p>
              <div className="flex items-center justify-between">
                <p className="text-[rgb(163,255,18)] font-bold text-sm md:text-lg">{item.price}</p>
                <Button size="sm" className="bg-white text-black hover:bg-white/90 text-xs md:text-sm">
                  Buy Now
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

const OffersTab = () => (
  <div className="space-y-4">
    <div className="text-center py-12">
      <h3 className="text-xl font-bold text-white mb-2">No offers yet</h3>
      <p className="text-white/60 mb-6">Be the first to make an offer on this collection</p>
      <Button className="bg-white text-black hover:bg-white/90">
        Make Offer
      </Button>
    </div>
  </div>
);

const HoldersTab = () => (
  <div className="space-y-4">
    <div className="text-white">
      <h3 className="text-xl font-bold mb-4">Top Holders</h3>
      <div className="space-y-3">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-black/40 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full" />
              <div>
                <p className="text-white font-medium">Holder #{i + 1}</p>
                <p className="text-white/60 text-sm">0x1234...5678</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white font-bold">{Math.floor(Math.random() * 50) + 1} items</p>
              <p className="text-white/60 text-sm">{((Math.random() * 10) + 1).toFixed(2)}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const TraitsTab = ({ collection }: { collection: any }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {collection.traits.map((trait: any, index: number) => (
        <div key={trait.name} className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <h4 className="text-white font-bold mb-2">{trait.name}</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/80">Rarity</span>
              <span className="text-white">{trait.rarity}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/80">Percentage</span>
              <span className="text-[rgb(163,255,18)]">{trait.percentage}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ActivityTab = () => (
  <div className="space-y-4">
    <div className="text-white">
      <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 bg-black/40 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg" />
              <div>
                <p className="text-white font-medium">Item #{Math.floor(Math.random() * 1000)}</p>
                <p className="text-white/60 text-sm">2 hours ago</p>
              </div>
            </div>
            <div className="text-right">
              <Badge className="bg-green-500/20 text-green-400 mb-1">
                {i % 3 === 0 ? 'Sale' : i % 3 === 1 ? 'Transfer' : 'List'}
              </Badge>
              <p className="text-white font-bold">{(Math.random() * 5 + 0.1).toFixed(2)} ETH</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const mockCollection = {
  id: "cyber-legends",
  title: "Cyber Legends",
  subtitle: "Futuristic warriors collection",
  description: "Step into the neon-lit streets of Neo Tokyo where cyber-enhanced warriors battle for supremacy.",
  longDescription: "The Cyber Legends collection brings together the most elite warriors from across the digital frontier. Born from the convergence of advanced cybernetics and ancient martial arts, these legendary fighters have transcended the boundaries between the physical and virtual worlds. Each piece tells a story of honor, technology, and the eternal struggle between order and chaos in a world where data flows like blood through silicon veins.",
  videoUrl: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/9c5398c1-dcde-4d7c-ac6a-33fa6ff5d948/transcode=true,width=450,optimized=true/0e178c0604244fb9a44d5b87c6b2a815.webm",
  bannerImage: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/9c5398c1-dcde-4d7c-ac6a-33fa6ff5d948/original=true,quality=90/cyber-legends-banner.jpg",
  logo: "/api/placeholder/120/60",
  creator: {
    name: "NeonStudios",
    avatar: "/api/placeholder/80/80",
    verified: true,
    followers: "12.5K"
  },
  stats: {
    totalSupply: 10000,
    owners: 7834,
    floorPrice: "2.1 ETH",
    volume: "5.2K ETH",
    volumeChange: "+24%",
    avgPrice: "3.7 ETH",
    marketCap: "21K ETH",
    listed: "15%"
  },
  traits: [
    { name: "Background", rarity: "Common", percentage: "45%" },
    { name: "Cybernetics", rarity: "Rare", percentage: "12%" },
    { name: "Weapon Type", rarity: "Epic", percentage: "3%" },
    { name: "Aura Effect", rarity: "Legendary", percentage: "0.5%" }
  ],
  items: [
    { id: 1, name: "Cyber Samurai #001", price: "15.7 ETH", image: "/api/placeholder/400/400", rarity: "Legendary", likes: 392, lastSale: "12.1 ETH" },
    { id: 2, name: "Neon Warrior #156", price: "8.9 ETH", image: "/api/placeholder/400/400", rarity: "Epic", likes: 287, lastSale: "7.2 ETH" },
    { id: 3, name: "Data Knight #892", price: "22.1 ETH", image: "/api/placeholder/400/400", rarity: "Mythic", likes: 521, lastSale: "18.9 ETH" },
    { id: 4, name: "Pixel Ronin #445", price: "12.3 ETH", image: "/api/placeholder/400/400", rarity: "Rare", likes: 341, lastSale: "10.8 ETH" },
    { id: 5, name: "Chrome Ninja #223", price: "6.7 ETH", image: "/api/placeholder/400/400", rarity: "Common", likes: 198, lastSale: "5.9 ETH" },
    { id: 6, name: "Quantum Ghost #667", price: "31.2 ETH", image: "/api/placeholder/400/400", rarity: "Mythic", likes: 672, lastSale: "28.4 ETH" }
  ]
};

export function CollectionDetailPage({ slug }: CollectionDetailPageProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [activeTab, setActiveTab] = useState('items');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('price-low');
  const [filterRarity, setFilterRarity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSticky, setIsSticky] = useState(false);

  const router = useRouter();
  const heroRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const tabs = [
    { id: 'about', label: 'About', component: AboutTab },
    { id: 'items', label: 'Items', component: ItemsTab },
    { id: 'offers', label: 'Offers', component: OffersTab },
    { id: 'holders', label: 'Holders', component: HoldersTab },
    { id: 'traits', label: 'Traits', component: TraitsTab },
    { id: 'activity', label: 'Activity', component: ActivityTab }
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const heroRect = heroRef.current.getBoundingClientRect();
        // Stick when hero section is 80% scrolled out of view
        setIsSticky(heroRect.bottom <= window.innerHeight * 0.2);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const ActiveTabComponent = tabs.find(tab => tab.id === activeTab)?.component || ItemsTab;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full min-h-screen bg-black"
    >
      <div className="relative">
        {/* Hero Section */}
        <motion.div
          ref={heroRef}
          className="relative h-[40vh] overflow-hidden"
          style={{ scale: heroScale }}
        >
          <div className="absolute inset-0">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              muted={isMuted}
              loop
              playsInline
            >
              <source src={mockCollection.videoUrl} type="video/webm" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          </div>

          {/* Hero Content */}
          <motion.div
            style={{ opacity: heroOpacity }}
            className="absolute bottom-0 left-0 right-0 p-4 md:p-8 pb-8"
          >
            <div className="max-w-4xl">
              <motion.h1
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="text-4xl md:text-6xl font-bold text-white mb-4"
              >
                {mockCollection.title}
              </motion.h1>
              <motion.p
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="text-lg text-white/90 mb-6 max-w-3xl"
              >
                {mockCollection.description}
              </motion.p>
              
              {/* Action buttons in hero */}
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="flex items-center gap-4"
              >
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/20 rounded-full p-3"
                  onClick={togglePlayPause}
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" fill="currentColor" />}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/20 rounded-full p-3"
                  onClick={toggleMute}
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full p-3">
                  <Share2 className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full p-3">
                  <Heart className="h-5 w-5" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Sticky Profile Info & Toolbar */}
        <div ref={stickyRef} className={`sticky top-0 z-30 transition-all duration-300 ${
          isSticky ? 'bg-black/95 backdrop-blur-lg border-b border-white/10 shadow-lg' : 'bg-transparent'
        }`}>
          <div className="px-4 md:px-8 py-4">
            {/* Collection Profile */}
            <div className="flex items-center gap-6 mb-6">
              <div className="relative">
                <img 
                  src={mockCollection.logo} 
                  alt={mockCollection.title}
                  className="h-16 w-16 md:h-20 md:w-20 object-cover rounded-xl border border-white/20"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-white">{mockCollection.title}</h2>
                  <Crown className="h-6 w-6 text-[rgb(163,255,18)]" />
                </div>
                <div className="flex items-center gap-6 text-white/80">
                  <div>
                    <span className="text-sm text-white/60">Floor</span>
                    <p className="font-bold text-[rgb(163,255,18)]">{mockCollection.stats.floorPrice}</p>
                  </div>
                  <div>
                    <span className="text-sm text-white/60">Volume</span>
                    <p className="font-bold">{mockCollection.stats.volume}</p>
                  </div>
                  <div>
                    <span className="text-sm text-white/60">Items</span>
                    <p className="font-bold">{mockCollection.stats.totalSupply.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-sm text-white/60">Owners</span>
                    <p className="font-bold">{mockCollection.stats.owners.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button className="bg-white text-black hover:bg-white/90 font-bold px-6 py-3 flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Buy Now
                </Button>
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 font-bold px-6 py-3 flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Watchlist
                </Button>
              </div>
            </div>

            {/* Tab Navigation */}
            <nav className="flex items-center gap-1 border-b border-white/10">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 font-medium transition-all duration-200 border-b-2 ${
                    activeTab === tab.id
                      ? 'text-white border-[rgb(163,255,18)]'
                      : 'text-white/60 border-transparent hover:text-white hover:border-white/30'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="px-4 md:px-8 py-8 min-h-screen"
        >
          <ActiveTabComponent 
            collection={mockCollection}
            searchQuery={searchQuery}
            sortBy={sortBy}
            filterRarity={filterRarity}
            viewMode={viewMode}
            setSearchQuery={setSearchQuery}
            setSortBy={setSortBy}
            setFilterRarity={setFilterRarity}
            setViewMode={setViewMode}
          />
        </motion.section>
      </div>
    </motion.div>
  );
}