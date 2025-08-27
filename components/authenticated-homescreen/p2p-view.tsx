"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight,
  Star,
  Users,
  Trophy,
  Handshake,
  ArrowLeft,
  Plus,
  Minus,
  Coins,
  Wallet,
  Search,
  Filter,
  Settings,
  ArrowRightLeft,
  CheckCircle2,
  Sparkles,
  Clock,
  TrendingUp,
  Grid3X3,
  List
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type P2PViewProps = {
  setViewMode: (mode: string) => void;
};

interface TradingPartner {
  id: string;
  name: string;
  avatar: string;
  tradeCount: number;
  totalValue: number;
  rating: number;
  traderTier: string;
  lastSeen: string;
  isOnline: boolean;
  successRate: number;
}

interface TradeOffer {
  id: string;
  from: string;
  fromAvatar: string;
  nftCount: number;
  tokenAmount: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  timestamp: Date;
  previewNft?: {
    name: string;
    image: string;
  };
}

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  value: number;
  change: number;
  rank: number;
}

// Mock data for P2P trading experience
const mockTradingPartners: TradingPartner[] = [
  { 
    id: "1", 
    name: "CryptoCollector", 
    avatar: "https://picsum.photos/40/40?random=1",
    tradeCount: 2847,
    totalValue: 45.8,
    rating: 4.9,
    traderTier: "DIAMOND", 
    lastSeen: "2 minutes ago",
    isOnline: true,
    successRate: 94.2
  },
  { 
    id: "2", 
    name: "NFTExplorer", 
    avatar: "https://picsum.photos/40/40?random=2",
    tradeCount: 1923,
    totalValue: 32.1,
    rating: 4.7,
    traderTier: "GOLD", 
    lastSeen: "5 minutes ago",
    isOnline: true,
    successRate: 87.5
  },
  { 
    id: "3", 
    name: "DigitalTrader", 
    avatar: "https://picsum.photos/40/40?random=3",
    tradeCount: 1456,
    totalValue: 28.9,
    rating: 4.5,
    traderTier: "SILVER", 
    lastSeen: "1 hour ago",
    isOnline: false,
    successRate: 82.1
  }
];

const MOCK_OFFERS: TradeOffer[] = [
  {
    id: '1',
    from: 'CryptoCollector',
    fromAvatar: 'https://picsum.photos/32/32?random=101',
    nftCount: 2,
    tokenAmount: 1.5,
    status: 'pending',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    previewNft: { name: 'Dragon King #777', image: 'https://picsum.photos/60/60?random=301' }
  },
  {
    id: '2',
    from: 'NFTExplorer',
    fromAvatar: 'https://picsum.photos/32/32?random=102',
    nftCount: 1,
    tokenAmount: 0.8,
    status: 'pending',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    previewNft: { name: 'Cyber Punk #123', image: 'https://picsum.photos/60/60?random=302' }
  }
];

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { id: '1', name: 'NFTWhale', avatar: 'https://picsum.photos/32/32?random=401', value: 127.5, change: 12.3, rank: 1 },
  { id: '2', name: 'CryptoKing', avatar: 'https://picsum.photos/32/32?random=402', value: 89.2, change: -2.1, rank: 2 },
  { id: '3', name: 'DigitalLord', avatar: 'https://picsum.photos/32/32?random=403', value: 76.8, change: 5.7, rank: 3 }
];

// P2P Navbar Component (matching Studio)
function P2PNavbar({ currentView, onViewChange }: { currentView: string; onViewChange: (view: string) => void }) {
  const navigationItems = [
    { id: 'hub', label: 'Trading Hub', icon: Users },
    { id: 'offers', label: 'Active Offers', icon: Handshake },
    { id: 'history', label: 'Trade History', icon: Clock },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  ];

  const getContextualActions = () => {
    switch (currentView) {
      case 'hub':
        return [
          { 
            id: 'new-trade', 
            label: 'New Trade', 
            icon: Plus,
            action: () => console.log('New Trade'),
            primary: true
          }
        ];
      default:
        return [];
    }
  };

  const contextualActions = getContextualActions();

  return (
    <div className="relative w-full">
      {/* Background blur effect */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm border-b border-white/10" />
      
      {/* Navigation container */}
      <div className="relative z-10 flex items-center justify-between px-6 py-3">
        {/* Left side - Navigation items */}
        <div className="flex items-center gap-2">
          {navigationItems.map((item, index) => (
            <motion.button
              key={item.id}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              whileHover={{ y: -2 }}
              transition={{ 
                y: { duration: 0.15, ease: "easeOut" },
                opacity: { duration: 0.3, ease: "easeOut", delay: index * 0.03 }
              }}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "group relative flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300",
                currentView === item.id 
                  ? "bg-[rgb(163,255,18)] text-black shadow-lg shadow-[rgb(163,255,18)]/20" 
                  : "bg-white/5 text-white/70 hover:bg-[rgb(163,255,18)]/10 hover:text-[rgb(163,255,18)] hover:border-[rgb(163,255,18)]/20 border border-transparent"
              )}
            >
              {/* Icon */}
              <item.icon className={cn(
                "h-5 w-5 transition-transform duration-300",
                currentView === item.id ? "scale-110" : "group-hover:scale-110"
              )} />
              
              {/* Label */}
              <span className={cn(
                "text-sm font-semibold tracking-wide",
                currentView === item.id ? "text-black" : ""
              )}>
                {item.label}
              </span>

              {/* Active indicator */}
              {currentView === item.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-[rgb(163,255,18)] rounded-xl -z-10"
                  transition={{ type: "spring", duration: 0.5 }}
                />
              )}
            </motion.button>
          ))}
        </div>

        {/* Right side - Contextual action buttons */}
        <div className="flex items-center gap-2">
          {contextualActions.map((action, index) => (
            <motion.button
              key={action.id}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ 
                y: { duration: 0.15, ease: "easeOut" },
                opacity: { duration: 0.3, ease: "easeOut", delay: 0.2 + index * 0.03 }
              }}
              onClick={action.action}
              className={cn(
                "group flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 font-semibold",
                action.primary
                  ? "bg-gradient-to-r from-[rgb(163,255,18)] to-green-400 hover:from-green-400 hover:to-[rgb(163,255,18)] text-black shadow-lg shadow-[rgb(163,255,18)]/20"
                  : "bg-white/5 text-white/70 hover:bg-[rgb(163,255,18)]/20 hover:text-[rgb(163,255,18)] border border-white/10 hover:border-[rgb(163,255,18)]/30"
              )}
              title={action.label}
            >
              <action.icon className="h-4 w-4" />
              <span className="text-sm hidden sm:inline">{action.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

// P2P Sidebar Component (matching Studio)
function P2PSidebar({ searchQuery, onSearchChange, gridViewMode, onGridViewModeChange }: { 
  searchQuery: string; 
  onSearchChange: (query: string) => void;
  gridViewMode: 'grid' | 'list';
  onGridViewModeChange: (mode: 'grid' | 'list') => void;
}) {
  return (
    <motion.div
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ 
        duration: 0.3, 
        ease: "easeOut", 
        delay: 0.25 
      }}
      className="bg-black/20 backdrop-blur-sm rounded-2xl border border-white/10 p-6 h-full flex flex-col"
    >
      {/* Search & Filters */}
      <div className="mb-6">
        <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
          <Search className="h-5 w-5" />
          Search & Filter
        </h3>
        <div className="space-y-3">
          <Input
            placeholder="Search traders..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-black/30 border-white/20 text-white placeholder:text-white/40"
          />
          <div className="flex gap-2">
            <Button
              variant={gridViewMode === 'grid' ? "default" : "outline"}
              size="sm"
              onClick={() => onGridViewModeChange('grid')}
              className="flex-1"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={gridViewMode === 'list' ? "default" : "outline"}
              size="sm"
              onClick={() => onGridViewModeChange('list')}
              className="flex-1"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/10 mb-6"></div>

      {/* Trading Stats */}
      <div className="mb-6">
        <h3 className="text-white text-lg font-bold mb-4">Trading Stats</h3>
        <div className="space-y-4">
          {[
            { label: 'Online Traders', value: 247, icon: Users },
            { label: '24h Volume', value: '1,432 ETH', icon: TrendingUp },
            { label: 'Pending Offers', value: 89, icon: Handshake },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-[rgb(163,255,18)]" />
                <span className="text-white/80 text-sm">{label}</span>
              </div>
              <Badge variant="secondary" className="bg-white/10 text-white">
                {value}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/10 mb-6"></div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h3 className="text-white text-lg font-bold mb-4">Quick Actions</h3>
        <div className="space-y-2">
          <Button className="w-full bg-gradient-to-r from-[rgb(163,255,18)] to-green-400 hover:from-green-400 hover:to-[rgb(163,255,18)] text-black font-bold">
            Start Trading
          </Button>
          <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
            View My Offers
          </Button>
          <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
            Trading History
          </Button>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/10 mb-6"></div>

      {/* Resources & Help */}
      <div className="flex-1">
        <h3 className="text-white text-lg font-bold mb-4">Resources</h3>
        <div className="space-y-3">
          <a href="#" className="block text-white/60 hover:text-[rgb(163,255,18)] transition-colors text-sm">
            📚 Trading Guide
          </a>
          <a href="#" className="block text-white/60 hover:text-[rgb(163,255,18)] transition-colors text-sm">
            🛡️ Safety Tips
          </a>
          <a href="#" className="block text-white/60 hover:text-[rgb(163,255,18)] transition-colors text-sm">
            💡 Best Practices
          </a>
          <a href="#" className="block text-white/60 hover:text-[rgb(163,255,18)] transition-colors text-sm">
            📊 Market Data
          </a>
          <a href="#" className="block text-white/60 hover:text-[rgb(163,255,18)] transition-colors text-sm">
            💬 Community
          </a>
        </div>
      </div>
    </motion.div>
  );
}

// P2P Main Content Component (matching Studio)
function P2PMainContent({ children, currentView }: { children: React.ReactNode; currentView: string }) {
  return (
    <div className="relative h-full overflow-y-auto custom-scrollbar pr-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ 
            duration: 0.3, 
            ease: "easeInOut" 
          }}
          className="space-y-6 pb-8"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function P2PView({ setViewMode }: P2PViewProps) {
  const [currentView, setCurrentView] = useState<string>('hub');
  const [selectedPartner, setSelectedPartner] = useState<string>('');
  const [partnerName, setPartnerName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [gridViewMode, setGridViewMode] = useState<'grid' | 'list'>('grid');
  const [offerAmount, setOfferAmount] = useState<number>(0);
  const [selectedNFTs, setSelectedNFTs] = useState<string[]>([]);

  const mockNFTs = [
    { id: '1', name: 'Cyber Dragon #001', image: 'https://picsum.photos/80/80?random=501', value: 2.5 },
    { id: '2', name: 'Digital Warrior #127', image: 'https://picsum.photos/80/80?random=502', value: 1.8 },
    { id: '3', name: 'Neon Beast #089', image: 'https://picsum.photos/80/80?random=503', value: 3.2 },
    { id: '4', name: 'Quantum Knight #445', image: 'https://picsum.photos/80/80?random=504', value: 1.5 }
  ];

  const handlePartnerSelect = (partnerId: string, name: string) => {
    setSelectedPartner(partnerId);
    setPartnerName(name);
    setCurrentView('trade');
  };

  // Trade Interface
  if (currentView === 'trade') {
    return (
      <div className="h-full flex flex-col">
        {/* Trade Navigation */}
        <div className="relative w-full">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm border-b border-white/10" />
          <div className="relative z-10 flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setCurrentView('hub')}
                variant="ghost"
                className="text-white hover:text-[rgb(163,255,18)]"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Hub
              </Button>
              <div className="h-6 w-px bg-white/20" />
              <div>
                <h2 className="text-xl font-bold text-white">Trading with {partnerName}</h2>
                <p className="text-white/60 text-sm">Create and send your trade offer</p>
              </div>
            </div>
            
            {/* Trade Progress */}
            <div className="flex items-center gap-4">
              {['Select', 'Offer', 'Review'].map((step, index) => (
                <div key={step} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                    ${index === 0 ? 'bg-[rgb(163,255,18)] text-black' : 'bg-white/20 text-white/60'}`}>
                    {index + 1}
                  </div>
                  <span className={`text-xs font-medium ${index === 0 ? 'text-[rgb(163,255,18)]' : 'text-white/60'}`}>
                    {step}
                  </span>
                  {index < 2 && <ArrowRight className="w-3 h-3 text-white/40 ml-2" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trade Content */}
        <div className="flex-1 grid grid-cols-[1fr_3fr] gap-6 mt-4 overflow-hidden">
          {/* Trade Sidebar */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeOut", delay: 0.25 }}
            className="bg-black/20 backdrop-blur-sm rounded-2xl border border-white/10 p-6 h-fit"
          >
            <h3 className="text-white font-bold mb-4">Trade Summary</h3>
            
            {/* Selected NFTs Count */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-4 h-4 text-[rgb(163,255,18)]" />
                <span className="text-white/80 font-medium">Selected NFTs</span>
              </div>
              <div className="text-white text-2xl font-bold">{selectedNFTs.length}</div>
            </div>

            {/* Token Offer */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Coins className="w-4 h-4 text-[rgb(163,255,18)]" />
                <span className="text-white/80 font-medium">Token Offer</span>
              </div>
              <div className="text-white text-2xl font-bold">{offerAmount.toFixed(1)} ETH</div>
              <div className="text-white/60 text-sm">≈ ${(offerAmount * 2000).toLocaleString()}</div>
            </div>

            <Button
              className="w-full bg-gradient-to-r from-[rgb(163,255,18)] to-green-400 hover:from-green-400 hover:to-[rgb(163,255,18)] text-black font-bold"
              disabled={selectedNFTs.length === 0 && offerAmount === 0}
            >
              <ArrowRightLeft className="w-4 h-4 mr-2" />
              Send Offer
            </Button>
          </motion.div>

          {/* Main Trade Area */}
          <P2PMainContent currentView="trade">
            <div className="space-y-8">
              {/* Your NFTs Section */}
              <div>
                <h3 className="text-white text-xl font-bold mb-4">Your NFT Collection</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {mockNFTs.map((nft) => (
                    <div
                      key={nft.id}
                      onClick={() => {
                        setSelectedNFTs(prev => 
                          prev.includes(nft.id) 
                            ? prev.filter(id => id !== nft.id)
                            : [...prev, nft.id]
                        )
                      }}
                      className={`relative cursor-pointer rounded-xl border-2 transition-all duration-300 overflow-hidden
                        ${selectedNFTs.includes(nft.id) 
                          ? 'border-[rgb(163,255,18)] shadow-lg shadow-[rgb(163,255,18)]/20' 
                          : 'border-white/10 hover:border-[rgb(163,255,18)]/50'
                        }`}
                    >
                      <img src={nft.image} alt={nft.name} className="w-full aspect-square object-cover" />
                      {selectedNFTs.includes(nft.id) && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-[rgb(163,255,18)] rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-black" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-3">
                        <p className="text-white text-sm font-medium truncate">{nft.name}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Sparkles className="w-3 h-3 text-[rgb(163,255,18)]" />
                          <span className="text-[rgb(163,255,18)] text-xs font-mono">{nft.value} ETH</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Token Offer Section */}
              <div>
                <h3 className="text-white text-xl font-bold mb-4">Token Offer</h3>
                <Card className="bg-white/5 border-white/10 p-6">
                  <div className="flex items-center gap-4">
                    <Button
                      onClick={() => setOfferAmount(Math.max(0, offerAmount - 0.1))}
                      variant="outline"
                      size="icon"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    
                    <div className="flex-1 bg-black/30 border border-white/20 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-[rgb(163,255,18)] mb-2">
                        {offerAmount.toFixed(1)} ETH
                      </div>
                      <div className="text-white/60 text-sm">
                        ≈ ${(offerAmount * 2000).toLocaleString()}
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => setOfferAmount(offerAmount + 0.1)}
                      variant="outline" 
                      size="icon"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </P2PMainContent>
        </div>
      </div>
    );
  }

  // Main P2P Hub Layout - Following Studio Structure Exactly
  return (
    <div className="h-full flex flex-col">
      {/* Top Navigation Bar */}
      <P2PNavbar currentView={currentView} onViewChange={setCurrentView} />

      {/* Main Content Area - Two Column Grid */}
      <div className="flex-1 grid grid-cols-[1fr_3fr] gap-6 mt-4 overflow-hidden">
        {/* Left Panel - Context & Actions */}
        <P2PSidebar 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          gridViewMode={gridViewMode}
          onGridViewModeChange={setGridViewMode}
        />

        {/* Main Content Area (Scrollable) */}
        <P2PMainContent currentView={currentView}>
          {currentView === 'hub' && (
            <div className="space-y-8">
              {/* Header */}
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2">Trading Hub</h2>
                <p className="text-white/60">Connect with traders worldwide and exchange NFTs securely</p>
              </div>

              {/* Online Traders */}
              <div>
                <h3 className="text-white text-xl font-bold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-[rgb(163,255,18)]" />
                  Online Traders
                </h3>
                <div className="grid gap-4">
                  {mockTradingPartners.map((partner) => (
                    <Card 
                      key={partner.id} 
                      className="bg-white/5 border-white/10 p-4 hover:bg-white/10 transition-colors cursor-pointer"
                      onClick={() => handlePartnerSelect(partner.id, partner.name)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img src={partner.avatar} alt={partner.name} className="w-12 h-12 rounded-full" />
                          {partner.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[rgb(163,255,18)] rounded-full border-2 border-black" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-white font-medium">{partner.name}</p>
                            <Badge variant="secondary" className={`text-xs ${
                              partner.traderTier === 'DIAMOND' ? 'bg-blue-500/20 text-blue-400' :
                              partner.traderTier === 'GOLD' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {partner.traderTier}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-[rgb(163,255,18)]" />
                              <span className="text-[rgb(163,255,18)] text-sm">{partner.rating}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <ArrowRightLeft className="w-3 h-3 text-[rgb(163,255,18)]" />
                              <span className="text-[rgb(163,255,18)] text-sm">{partner.successRate}%</span>
                            </div>
                            <span className="text-white/60 text-sm">{partner.tradeCount} trades</span>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-white/40" />
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentView === 'offers' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Active Offers</h2>
              <div className="space-y-4">
                {MOCK_OFFERS.map((offer) => (
                  <Card key={offer.id} className="bg-white/5 border-white/10 p-4">
                    <div className="flex items-center gap-4">
                      <img src={offer.fromAvatar} alt={offer.from} className="w-10 h-10 rounded-full" />
                      <div className="flex-1">
                        <p className="text-white font-medium">{offer.from}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs border-white/20 text-white/80">
                            {offer.nftCount} NFTs
                          </Badge>
                          <span className="text-[rgb(163,255,18)] text-sm">{offer.tokenAmount} ETH</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs border-orange-500/50 text-orange-400">
                        PENDING
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {currentView === 'leaderboard' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Top Traders</h2>
              <div className="space-y-4">
                {MOCK_LEADERBOARD.map((leader) => (
                  <Card key={leader.id} className="bg-white/5 border-white/10 p-4">
                    <div className="flex items-center gap-4">
                      <Badge className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        leader.rank === 1 ? 'bg-[rgb(163,255,18)] text-black' :
                        leader.rank === 2 ? 'bg-gray-300 text-black' :
                        leader.rank === 3 ? 'bg-yellow-600 text-black' :
                        'bg-gray-600 text-white'
                      }`}>
                        {leader.rank}
                      </Badge>
                      <img src={leader.avatar} alt={leader.name} className="w-10 h-10 rounded-full" />
                      <div className="flex-1">
                        <p className="text-white font-medium">{leader.name}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-[rgb(163,255,18)] text-sm">{leader.value} ETH</span>
                          <span className={`text-sm ${leader.change > 0 ? 'text-[rgb(163,255,18)]' : 'text-red-400'}`}>
                            {leader.change > 0 ? '+' : ''}{leader.change}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </P2PMainContent>
      </div>
    </div>
  );
}