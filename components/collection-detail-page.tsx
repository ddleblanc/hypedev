"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
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
  ChevronUp,
  Search,
  Filter,
  Grid3x3,
  List,
  MoreHorizontal,
  ArrowLeft,
  Sparkles,
  Activity,
  X,
  ExternalLink,
  Copy,
  Check,
  SlidersHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface CollectionDetailPageProps {
  slug: string;
}

// Filter Sidebar Component
const FilterSidebar = ({ 
  show, 
  onClose, 
  onApply,
  filterRarity,
  setFilterRarity,
  sortBy,
  setSortBy,
  priceRange,
  setPriceRange,
  selectedTraits,
  setSelectedTraits,
  collection
}: any) => {
  const [localFilterRarity, setLocalFilterRarity] = useState(filterRarity);
  const [localSortBy, setLocalSortBy] = useState(sortBy);
  const [localPriceRange, setLocalPriceRange] = useState(priceRange);
  const [localSelectedTraits, setLocalSelectedTraits] = useState(selectedTraits);

  const handleApply = () => {
    setFilterRarity(localFilterRarity);
    setSortBy(localSortBy);
    setPriceRange(localPriceRange);
    setSelectedTraits(localSelectedTraits);
    onApply();
  };

  const handleReset = () => {
    setLocalFilterRarity('all');
    setLocalSortBy('price-low');
    setLocalPriceRange([0, 100]);
    setLocalSelectedTraits([]);
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 30,
              duration: 0.4
            }}
            className="fixed left-0 top-0 bottom-0 w-80 bg-black/95 backdrop-blur-xl border-r border-white/10 z-50 overflow-hidden flex flex-col md:hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </h2>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white/70 hover:text-white"
                  onClick={onClose}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-sm text-white/60">Refine your search</p>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Sort By */}
              <div>
                <h3 className="text-sm font-semibold text-white/80 mb-3">SORT BY</h3>
                <select 
                  value={localSortBy} 
                  onChange={(e) => setLocalSortBy(e.target.value)}
                  className="w-full bg-black/40 border border-white/20 text-white rounded-lg px-3 py-2 text-sm"
                >
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="recently-listed">Recently Listed</option>
                  <option value="most-liked">Most Liked</option>
                  <option value="ending-soon">Ending Soon</option>
                </select>
              </div>

              {/* Rarity Filter */}
              <div>
                <h3 className="text-sm font-semibold text-white/80 mb-3">RARITY</h3>
                <div className="space-y-2">
                  {['All', 'Common', 'Rare', 'Epic', 'Legendary', 'Mythic'].map((rarity) => (
                    <button
                      key={rarity}
                      onClick={() => setLocalFilterRarity(rarity.toLowerCase())}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                        localFilterRarity === rarity.toLowerCase() 
                          ? 'bg-[rgb(163,255,18)]/20 text-[rgb(163,255,18)] border border-[rgb(163,255,18)]/30'
                          : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{rarity}</span>
                        {rarity !== 'All' && (
                          <Badge className={`text-[10px] ${
                            rarity === 'Mythic' ? 'bg-purple-500/20 text-purple-400' :
                            rarity === 'Legendary' ? 'bg-orange-500/20 text-orange-400' :
                            rarity === 'Epic' ? 'bg-purple-400/20 text-purple-300' :
                            rarity === 'Rare' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {Math.floor(Math.random() * 1000)}
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="text-sm font-semibold text-white/80 mb-3">PRICE RANGE (ETH)</h3>
                <div className="space-y-4">
                  <Slider
                    value={localPriceRange}
                    onValueChange={setLocalPriceRange}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/60">0 ETH</span>
                    <span className="text-sm font-bold text-[rgb(163,255,18)]">
                      {localPriceRange[0]} - {localPriceRange[1]} ETH
                    </span>
                    <span className="text-xs text-white/60">100+ ETH</span>
                  </div>
                </div>
              </div>

              {/* Traits */}
              <div>
                <h3 className="text-sm font-semibold text-white/80 mb-3">TRAITS</h3>
                <div className="space-y-2">
                  {collection?.traits?.map((trait: any) => (
                    <div key={trait.name} className="flex items-center justify-between p-2">
                      <Label htmlFor={trait.name} className="text-sm text-white/70 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[rgb(163,255,18)]" />
                        {trait.name}
                      </Label>
                      <Switch
                        id={trait.name}
                        checked={localSelectedTraits.includes(trait.name)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setLocalSelectedTraits([...localSelectedTraits, trait.name]);
                          } else {
                            setLocalSelectedTraits(localSelectedTraits.filter((t: string) => t !== trait.name));
                          }
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Filters */}
              <div>
                <h3 className="text-sm font-semibold text-white/80 mb-3">STATUS</h3>
                <div className="space-y-2">
                  <button className="w-full text-left px-4 py-2 bg-white/5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Buy Now</span>
                      <Badge className="bg-green-500/20 text-green-400 text-[10px]">
                        Available
                      </Badge>
                    </div>
                  </button>
                  <button className="w-full text-left px-4 py-2 bg-white/5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">On Auction</span>
                      <Badge className="bg-blue-500/20 text-blue-400 text-[10px]">
                        Live
                      </Badge>
                    </div>
                  </button>
                  <button className="w-full text-left px-4 py-2 bg-white/5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">New Listings</span>
                      <Badge className="bg-purple-500/20 text-purple-400 text-[10px]">
                        24h
                      </Badge>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-white/10 bg-black/50 space-y-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                  onClick={handleReset}
                >
                  Reset
                </Button>
                <Button
                  className="flex-1 bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90 font-bold"
                  onClick={handleApply}
                >
                  Apply Filters
                </Button>
              </div>
              <p className="text-xs text-center text-white/40">
                {Math.floor(Math.random() * 500) + 100} items match your filters
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Mobile-specific components
const MobileItemCard = ({ item, onClick }: { item: any; onClick: () => void }) => (
  <motion.div
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="relative aspect-square rounded-2xl overflow-hidden"
  >
    <img 
      src={item.image} 
      alt={item.name}
      className="w-full h-full object-cover"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
    
    {/* Rarity Badge */}
    <div className="absolute top-2 left-2">
      <Badge className={`text-[10px] px-2 py-0.5 font-bold ${
        item.rarity === 'Mythic' ? 'bg-purple-500 text-white' :
        item.rarity === 'Legendary' ? 'bg-orange-500 text-white' :
        item.rarity === 'Epic' ? 'bg-purple-400 text-white' :
        item.rarity === 'Rare' ? 'bg-blue-500 text-white' :
        'bg-gray-500 text-white'
      }`}>
        {item.rarity}
      </Badge>
    </div>

    {/* Item Info */}
    <div className="absolute bottom-2 left-2 right-2">
      <p className="text-white font-bold text-xs truncate">{item.name}</p>
      <p className="text-[rgb(163,255,18)] font-bold text-sm">{item.price}</p>
    </div>
  </motion.div>
);

// Tab content components (enhanced for mobile)
const AboutTab = ({ collection, isMobile }: { collection: any; isMobile: boolean }) => (
  <div className={`space-y-6 ${isMobile ? 'px-4' : ''}`}>
    {isMobile ? (
      // Mobile Layout
      <div className="space-y-8">
        <div>
          <h3 className="text-xl font-bold text-white mb-3">About</h3>
          <p className="text-white/80 leading-relaxed text-sm">{collection.longDescription}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-white/60 text-xs mb-1">Contract</p>
            <p className="text-white text-sm font-mono">0x1234...5678</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-white/60 text-xs mb-1">Standard</p>
            <p className="text-white text-sm font-bold">ERC-721</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-white/60 text-xs mb-1">Blockchain</p>
            <p className="text-white text-sm font-bold">Ethereum</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-white/60 text-xs mb-1">Royalty</p>
            <p className="text-white text-sm font-bold">5%</p>
          </div>
        </div>
      </div>
    ) : (
      // Desktop Layout (original)
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
    )}
  </div>
);

const ItemsTab = ({ collection, searchQuery, sortBy, filterRarity, viewMode, setSearchQuery, setSortBy, setFilterRarity, setViewMode, isMobile }: any) => (
  <div className={`space-y-6 ${isMobile ? '' : ''}`}>
    {!isMobile && (
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <p className="text-white/70">{collection.items.length} items available</p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 h-4 w-4" />
            <Input
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-black/40 border-white/20 text-white placeholder:text-white/60 w-64"
            />
          </div>
          <select 
            value={filterRarity} 
            onChange={(e) => setFilterRarity(e.target.value)}
            className="bg-black/40 border border-white/20 text-white rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">All Rarities</option>
            <option value="common">Common</option>
            <option value="rare">Rare</option>
            <option value="epic">Epic</option>
            <option value="legendary">Legendary</option>
          </select>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-black/40 border border-white/20 text-white rounded-lg px-3 py-2 text-sm"
          >
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rarity">Rarity</option>
            <option value="likes">Most Liked</option>
          </select>
          <div className="flex items-center gap-1">
            <Button 
              variant={viewMode === 'grid' ? 'default' : 'ghost'} 
              size="icon" 
              className="text-white"
              onClick={() => setViewMode('grid')}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'default' : 'ghost'} 
              size="icon" 
              className="text-white"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    )}

    {isMobile ? (
      // Mobile Grid - Always 2 columns, visual-first
      <div className="grid grid-cols-2 gap-3 px-4">
        {collection.items.map((item: any, index: number) => (
          <MobileItemCard 
            key={item.id} 
            item={item} 
            onClick={() => console.log('Open item:', item.id)}
          />
        ))}
      </div>
    ) : (
      // Desktop Grid (original)
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
    )}
  </div>
);

const ActivityTab = ({ isMobile }: { isMobile: boolean }) => (
  <div className={`space-y-4 ${isMobile ? 'px-4' : ''}`}>
    <div className="text-white">
      {!isMobile && <h3 className="text-xl font-bold mb-4">Recent Activity</h3>}
      <div className="space-y-3">
        {[...Array(10)].map((_, i) => (
          <div key={i} className={`flex items-center justify-between ${
            isMobile ? 'p-3' : 'p-4'
          } bg-black/40 rounded-lg`}>
            <div className="flex items-center gap-3">
              <div className={`${
                isMobile ? 'w-10 h-10' : 'w-12 h-12'
              } bg-gradient-to-r from-green-500 to-blue-500 rounded-lg`} />
              <div>
                <p className={`text-white font-medium ${isMobile ? 'text-sm' : ''}`}>
                  Item #{Math.floor(Math.random() * 1000)}
                </p>
                <p className={`text-white/60 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  2 hours ago
                </p>
              </div>
            </div>
            <div className="text-right">
              <Badge className={`bg-green-500/20 text-green-400 mb-1 ${
                isMobile ? 'text-[10px]' : ''
              }`}>
                {i % 3 === 0 ? 'Sale' : i % 3 === 1 ? 'Transfer' : 'List'}
              </Badge>
              <p className={`text-white font-bold ${isMobile ? 'text-sm' : ''}`}>
                {(Math.random() * 5 + 0.1).toFixed(2)} ETH
              </p>
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
  longDescription: "The Cyber Legends collection brings together the most elite warriors from across the digital frontier. Born from the convergence of advanced cybernetics and ancient martial arts, these legendary fighters have transcended the boundaries between the physical and virtual worlds.",
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
    { id: 1, name: "Cyber Samurai #001", price: "15.7 ETH", image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/cyber1.jpg", rarity: "Legendary", likes: 392, lastSale: "12.1 ETH" },
    { id: 2, name: "Neon Warrior #156", price: "8.9 ETH", image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/cyber2.jpg", rarity: "Epic", likes: 287, lastSale: "7.2 ETH" },
    { id: 3, name: "Data Knight #892", price: "22.1 ETH", image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/cyber3.jpg", rarity: "Mythic", likes: 521, lastSale: "18.9 ETH" },
    { id: 4, name: "Pixel Ronin #445", price: "12.3 ETH", image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/cyber4.jpg", rarity: "Rare", likes: 341, lastSale: "10.8 ETH" },
    { id: 5, name: "Chrome Ninja #223", price: "6.7 ETH", image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/cyber5.jpg", rarity: "Common", likes: 198, lastSale: "5.9 ETH" },
    { id: 6, name: "Quantum Ghost #667", price: "31.2 ETH", image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/cyber6.jpg", rarity: "Mythic", likes: 672, lastSale: "28.4 ETH" },
    { id: 7, name: "Binary Blade #334", price: "18.5 ETH", image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/cyber7.jpg", rarity: "Legendary", likes: 456, lastSale: "16.2 ETH" },
    { id: 8, name: "Circuit Breaker #778", price: "9.3 ETH", image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/cyber8.jpg", rarity: "Epic", likes: 298, lastSale: "8.1 ETH" }
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
  const [showFilterSidebar, setShowFilterSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 100]);
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);

  const router = useRouter();
  const heroRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const tabs = [
    { id: 'items', label: 'Items' },
    { id: 'activity', label: 'Activity' },
    { id: 'about', label: 'About' }
  ];

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const heroRect = heroRef.current.getBoundingClientRect();
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

  const handleFilterApply = () => {
    setShowFilterSidebar(false);
    // Apply filter logic here
    console.log('Filters applied:', { filterRarity, sortBy, priceRange, selectedTraits });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full min-h-screen bg-black"
    >
      {/* Filter Sidebar (Mobile Only) */}
      <FilterSidebar
        show={showFilterSidebar}
        onClose={() => setShowFilterSidebar(false)}
        onApply={handleFilterApply}
        filterRarity={filterRarity}
        setFilterRarity={setFilterRarity}
        sortBy={sortBy}
        setSortBy={setSortBy}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
        selectedTraits={selectedTraits}
        setSelectedTraits={setSelectedTraits}
        collection={mockCollection}
      />

      {isMobile ? (
        // Mobile Layout - Cinematic
        <div className="relative">
          {/* Mobile Hero - Fullscreen Video */}
          <div className="relative h-[70vh] overflow-hidden">
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
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
            
            {/* Mobile Header Overlay */}
            <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
              <Button
                size="icon"
                variant="ghost"
                className="bg-black/40 backdrop-blur text-white"
                onClick={() => router.back()}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className="bg-black/40 backdrop-blur text-white"
                  onClick={toggleMute}
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="bg-black/40 backdrop-blur text-white"
                >
                  <Share2 className="w-5 h-5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="bg-black/40 backdrop-blur text-white"
                >
                  <Heart className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Mobile Hero Content */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-[rgb(163,255,18)] text-black font-bold text-xs">
                  TRENDING
                </Badge>
                <Badge className="bg-blue-500 text-white font-bold text-xs">
                  {mockCollection.stats.volumeChange}
                </Badge>
              </div>
              
              <h1 className="text-4xl font-black text-white mb-2">
                {mockCollection.title}
              </h1>
              <p className="text-white/80 text-sm mb-4 line-clamp-2">
                {mockCollection.description}
              </p>

              {/* Mobile Stats Grid */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="text-center">
                  <p className="text-[10px] text-white/60 uppercase">Floor</p>
                  <p className="text-sm font-bold text-[rgb(163,255,18)]">{mockCollection.stats.floorPrice}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-white/60 uppercase">Volume</p>
                  <p className="text-sm font-bold text-white">{mockCollection.stats.volume}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-white/60 uppercase">Items</p>
                  <p className="text-sm font-bold text-white">{mockCollection.stats.totalSupply.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-white/60 uppercase">Owners</p>
                  <p className="text-sm font-bold text-white">{mockCollection.stats.owners.toLocaleString()}</p>
                </div>
              </div>

              {/* Mobile CTA */}
              <div className="flex gap-2">
                <Button className="flex-1 bg-white text-black hover:bg-white/90 font-bold">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Buy Now
                </Button>
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Tabs - Sticky */}
          <div className="sticky top-0 z-30 bg-black border-b border-white/10">
            <div className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-4 text-sm font-medium transition-all relative ${
                    activeTab === tab.id
                      ? 'text-white'
                      : 'text-white/60'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[rgb(163,255,18)]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Filters (for Items tab) */}
          {activeTab === 'items' && (
            <div className="sticky top-[57px] z-20 bg-black/95 backdrop-blur border-b border-white/10 p-4">
              <div className="flex items-center justify-between">
                <p className="text-white/70 text-sm">{mockCollection.items.length} items</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/20 text-white text-xs"
                    onClick={() => setShowFilterSidebar(true)}
                  >
                    <Filter className="w-3 h-3 mr-1" />
                    Filter
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/20 text-white text-xs"
                  >
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Price
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Tab Content */}
          <div className="min-h-screen pb-20 bg-black">
            {activeTab === 'items' && (
              <ItemsTab 
                collection={mockCollection}
                searchQuery={searchQuery}
                sortBy={sortBy}
                filterRarity={filterRarity}
                viewMode={viewMode}
                setSearchQuery={setSearchQuery}
                setSortBy={setSortBy}
                setFilterRarity={setFilterRarity}
                setViewMode={setViewMode}
                isMobile={true}
              />
            )}
            {activeTab === 'activity' && <ActivityTab isMobile={true} />}
            {activeTab === 'about' && <AboutTab collection={mockCollection} isMobile={true} />}
          </div>
        </div>
      ) : (
        // Desktop Layout (original)
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
                {['items', 'activity', 'about'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 font-medium transition-all duration-200 border-b-2 capitalize ${
                      activeTab === tab
                        ? 'text-white border-[rgb(163,255,18)]'
                        : 'text-white/60 border-transparent hover:text-white hover:border-white/30'
                    }`}
                  >
                    {tab}
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
            {activeTab === 'items' && (
              <ItemsTab 
                collection={mockCollection}
                searchQuery={searchQuery}
                sortBy={sortBy}
                filterRarity={filterRarity}
                viewMode={viewMode}
                setSearchQuery={setSearchQuery}
                setSortBy={setSortBy}
                setFilterRarity={setFilterRarity}
                setViewMode={setViewMode}
                isMobile={false}
              />
            )}
            {activeTab === 'about' && <AboutTab collection={mockCollection} isMobile={false} />}
            {activeTab === 'activity' && <ActivityTab isMobile={false} />}
          </motion.section>
        </div>
      )}
    </motion.div>
  );
}