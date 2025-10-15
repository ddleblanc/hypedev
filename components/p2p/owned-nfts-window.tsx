"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Star,
  TrendingUp,
  Eye,
  Plus,
  Check
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MediaRenderer } from "@/components/MediaRenderer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface NFT {
  id: string;
  name: string;
  image: string;
  collection: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  value: number;
  lastSale?: number;
  selected: boolean;
}

// Mock data for user's NFT collection
const MOCK_USER_NFTS: NFT[] = [
  { id: 'u1', name: 'Genesis Warrior #001', image: 'https://picsum.photos/300/300?random=101', collection: 'Genesis Warriors', rarity: 'Legendary', value: 12.5, lastSale: 11.8, selected: false },
  { id: 'u2', name: 'Quantum Beast #256', image: 'https://picsum.photos/300/300?random=102', collection: 'Quantum Beasts', rarity: 'Epic', value: 5.2, lastSale: 4.9, selected: false },
  { id: 'u3', name: 'Cyber Knight #789', image: 'https://picsum.photos/300/300?random=103', collection: 'Cyber Knights', rarity: 'Rare', value: 2.8, lastSale: 3.1, selected: false },
  { id: 'u4', name: 'Void Walker #42', image: 'https://picsum.photos/300/300?random=104', collection: 'Void Walkers', rarity: 'Epic', value: 7.1, lastSale: 6.8, selected: false },
  { id: 'u5', name: 'Crystal Mage #333', image: 'https://picsum.photos/300/300?random=105', collection: 'Crystal Mages', rarity: 'Rare', value: 3.4, lastSale: 3.2, selected: false },
  { id: 'u6', name: 'Phoenix Lord #567', image: 'https://picsum.photos/300/300?random=106', collection: 'Phoenix Lords', rarity: 'Legendary', value: 15.8, lastSale: 14.9, selected: false },
  { id: 'u7', name: 'Storm Guardian #888', image: 'https://picsum.photos/300/300?random=107', collection: 'Storm Guardians', rarity: 'Epic', value: 6.3, lastSale: 6.1, selected: false },
  { id: 'u8', name: 'Shadow Assassin #199', image: 'https://picsum.photos/300/300?random=108', collection: 'Shadow Assassins', rarity: 'Rare', value: 4.7, lastSale: 4.5, selected: false }
];

export function OwnedNFTsWindow() {
  const [nfts, setNfts] = useState<NFT[]>(MOCK_USER_NFTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRarity, setSelectedRarity] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCount, setSelectedCount] = useState(0);

  const rarityColors = {
    'Common': 'bg-gray-500/20 text-gray-300 border-gray-500/40',
    'Rare': 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    'Epic': 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    'Legendary': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
  };

  const filteredNfts = nfts.filter(nft => {
    const matchesSearch = nft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         nft.collection.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRarity = !selectedRarity || nft.rarity === selectedRarity;
    return matchesSearch && matchesRarity;
  });

  const toggleNFTSelection = (nftId: string) => {
    setNfts(prev => prev.map(nft => 
      nft.id === nftId 
        ? { ...nft, selected: !nft.selected }
        : nft
    ));
    
    const updatedNft = nfts.find(nft => nft.id === nftId);
    if (updatedNft) {
      setSelectedCount(prev => updatedNft.selected ? prev - 1 : prev + 1);
    }
  };

  const totalSelectedValue = nfts.filter(nft => nft.selected)
                                 .reduce((sum, nft) => sum + nft.value, 0);

  return (
    <div className="h-full bg-black/20 backdrop-blur-sm rounded-2xl border border-white/10 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-2xl font-bold tracking-wide">YOUR COLLECTION</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
          <Input
            placeholder="Search your NFTs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-white/20 text-white placeholder-white/40"
          />
        </div>

        {/* Rarity Filters */}
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant={selectedRarity === null ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedRarity(null)}
            className={selectedRarity === null ? "bg-[rgb(163,255,18)] text-black" : "text-white/70 hover:text-white hover:bg-white/10"}
          >
            All
          </Button>
          {(['Common', 'Rare', 'Epic', 'Legendary'] as const).map((rarity) => (
            <Button
              key={rarity}
              variant={selectedRarity === rarity ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedRarity(selectedRarity === rarity ? null : rarity)}
              className={selectedRarity === rarity ? "bg-[rgb(163,255,18)] text-black" : "text-white/70 hover:text-white hover:bg-white/10"}
            >
              {rarity}
            </Button>
          ))}
        </div>

        {/* Selection Summary */}
        {selectedCount > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="bg-[rgb(163,255,18)]/10 border border-[rgb(163,255,18)]/30 rounded-lg p-3"
          >
            <div className="flex items-center justify-between">
              <div className="text-[rgb(163,255,18)] font-bold">
                {selectedCount} NFT{selectedCount !== 1 ? 's' : ''} Selected
              </div>
              <div className="text-white font-bold">
                {totalSelectedValue.toFixed(6)} ETH
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* NFT Grid/List */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 gap-3">
              <AnimatePresence>
                {filteredNfts.map((nft, index) => (
                  <motion.div
                    key={nft.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    className={`relative cursor-pointer transition-all duration-300 ${
                      nft.selected 
                        ? 'ring-2 ring-[rgb(163,255,18)] ring-offset-2 ring-offset-black/20' 
                        : 'hover:scale-105'
                    }`}
                    onClick={() => toggleNFTSelection(nft.id)}
                  >
                    <Card className="bg-black/40 border-white/10 hover:border-white/20 transition-colors overflow-hidden">
                      <div className="relative aspect-square">
                        <MediaRenderer
                          src={nft.image}
                          alt={nft.name}
                          className="w-full h-full object-cover"
                          aspectRatio="square"
                        />
                        
                        {/* Selection Indicator */}
                        <div className="absolute top-2 right-2">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                            nft.selected 
                              ? 'bg-[rgb(163,255,18)] border-[rgb(163,255,18)]' 
                              : 'bg-black/40 border-white/40'
                          }`}>
                            {nft.selected && <Check className="w-3 h-3 text-black" />}
                          </div>
                        </div>

                        {/* Rarity Badge */}
                        <div className="absolute top-2 left-2">
                          <Badge className={`text-xs ${rarityColors[nft.rarity]}`}>
                            {nft.rarity}
                          </Badge>
                        </div>

                        {/* Value */}
                        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm rounded px-2 py-1">
                          <span className="text-white text-xs font-bold">{nft.value} ETH</span>
                        </div>
                      </div>
                      
                      <div className="p-3">
                        <h3 className="text-white font-bold text-sm mb-1 truncate">{nft.name}</h3>
                        <p className="text-white/60 text-xs truncate">{nft.collection}</p>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {filteredNfts.map((nft, index) => (
                  <motion.div
                    key={nft.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.03 }}
                    className={`flex items-center gap-3 p-3 bg-black/40 rounded-lg border border-white/10 cursor-pointer transition-all duration-300 ${
                      nft.selected 
                        ? 'border-[rgb(163,255,18)]/50 bg-[rgb(163,255,18)]/5' 
                        : 'hover:border-white/20'
                    }`}
                    onClick={() => toggleNFTSelection(nft.id)}
                  >
                    <div className="relative w-12 h-12 flex-shrink-0">
                      <MediaRenderer
                        src={nft.image}
                        alt={nft.name}
                        className="w-full h-full object-cover rounded"
                        aspectRatio="square"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-bold text-sm truncate">{nft.name}</h3>
                      <p className="text-white/60 text-xs truncate">{nft.collection}</p>
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      <div className="text-white font-bold text-sm">{nft.value} ETH</div>
                      <Badge className={`text-xs ${rarityColors[nft.rarity]}`}>
                        {nft.rarity}
                      </Badge>
                    </div>
                    
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                      nft.selected 
                        ? 'bg-[rgb(163,255,18)] border-[rgb(163,255,18)]' 
                        : 'bg-transparent border-white/40'
                    }`}>
                      {nft.selected && <Check className="w-3 h-3 text-black" />}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}