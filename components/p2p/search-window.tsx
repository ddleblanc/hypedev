"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Users, 
  Hash,
  Filter,
  Star,
  Activity,
  Zap,
  Crown,
  Shield,
  Target,
  MessageCircle,
  Plus
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MediaRenderer } from "@/components/MediaRenderer";

interface User {
  id: string;
  username: string;
  avatar?: string;
  verified: boolean;
  level: number;
  reputation: number;
  activeOffers: number;
  tradingStyle: 'Aggressive' | 'Balanced' | 'Conservative';
  lastSeen: string;
  collections: string[];
  matchScore: number;
}

interface NFTListing {
  id: string;
  name: string;
  image: string;
  collection: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  value: number;
  owner: {
    username: string;
    avatar?: string;
    verified: boolean;
  };
  tradingInterest: 'High' | 'Medium' | 'Low';
}

// Mock data
const MOCK_USERS: User[] = [
  {
    id: 'u1',
    username: 'CryptoMaster',
    avatar: 'https://picsum.photos/100/100?random=401',
    verified: true,
    level: 45,
    reputation: 98,
    activeOffers: 12,
    tradingStyle: 'Aggressive',
    lastSeen: '2 min ago',
    collections: ['Genesis Warriors', 'Cyber Knights'],
    matchScore: 94
  },
  {
    id: 'u2',
    username: 'NFTCollector99',
    avatar: 'https://picsum.photos/100/100?random=402',
    verified: false,
    level: 32,
    reputation: 87,
    activeOffers: 5,
    tradingStyle: 'Balanced',
    lastSeen: '15 min ago',
    collections: ['Dragon Kings', 'Phoenix Lords'],
    matchScore: 89
  },
  {
    id: 'u3',
    username: 'DiamondHands',
    avatar: 'https://picsum.photos/100/100?random=403',
    verified: true,
    level: 67,
    reputation: 95,
    activeOffers: 8,
    tradingStyle: 'Conservative',
    lastSeen: '1 hr ago',
    collections: ['Quantum Beasts', 'Void Walkers'],
    matchScore: 76
  },
  {
    id: 'u4',
    username: 'TradeKing',
    avatar: 'https://picsum.photos/100/100?random=404',
    verified: true,
    level: 78,
    reputation: 99,
    activeOffers: 23,
    tradingStyle: 'Aggressive',
    lastSeen: '5 min ago',
    collections: ['All Collections'],
    matchScore: 98
  }
];

const MOCK_NFTS: NFTListing[] = [
  {
    id: 'n1',
    name: 'Shadow Dragon #333',
    image: 'https://picsum.photos/300/300?random=501',
    collection: 'Shadow Dragons',
    rarity: 'Legendary',
    value: 22.5,
    owner: { username: 'CryptoMaster', verified: true },
    tradingInterest: 'High'
  },
  {
    id: 'n2',
    name: 'Neon Samurai #777',
    image: 'https://picsum.photos/300/300?random=502',
    collection: 'Neon Samurai',
    rarity: 'Epic',
    value: 8.7,
    owner: { username: 'NFTCollector99', verified: false },
    tradingInterest: 'Medium'
  },
  {
    id: 'n3',
    name: 'Cosmic Wolf #156',
    image: 'https://picsum.photos/300/300?random=503',
    collection: 'Cosmic Wolves',
    rarity: 'Rare',
    value: 4.2,
    owner: { username: 'DiamondHands', verified: true },
    tradingInterest: 'Low'
  }
];

export function SearchWindow() {
  const [activeTab, setActiveTab] = useState<'users' | 'items'>('users');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const tradingStyleColors = {
    'Aggressive': 'bg-red-500/20 text-red-300 border-red-500/40',
    'Balanced': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
    'Conservative': 'bg-green-500/20 text-green-300 border-green-500/40'
  };

  const rarityColors = {
    'Common': 'bg-gray-500/20 text-gray-300 border-gray-500/40',
    'Rare': 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    'Epic': 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    'Legendary': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
  };

  const getInterestColor = (interest: string) => {
    switch (interest) {
      case 'High': return 'text-green-400';
      case 'Medium': return 'text-yellow-400';
      case 'Low': return 'text-red-400';
      default: return 'text-white/60';
    }
  };

  const filteredUsers = MOCK_USERS.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.collections.some(collection => 
      collection.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const filteredNFTs = MOCK_NFTS.filter(nft =>
    nft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    nft.collection.toLowerCase().includes(searchQuery.toLowerCase()) ||
    nft.owner.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full bg-black/20 backdrop-blur-sm rounded-2xl border border-white/10 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-white/10">
        <h2 className="text-white text-2xl font-bold tracking-wide mb-4">DISCOVER & CONNECT</h2>
        
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
          <Input
            placeholder="Search users or items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-white/20 text-white placeholder-white/40"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'users' | 'items')}>
          <TabsList className="grid w-full grid-cols-2 bg-black/40">
            <TabsTrigger value="users" className="data-[state=active]:bg-[rgb(163,255,18)] data-[state=active]:text-black">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="items" className="data-[state=active]:bg-[rgb(163,255,18)] data-[state=active]:text-black">
              <Hash className="w-4 h-4 mr-2" />
              Items
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-4">
            <ScrollArea className="h-[calc(100vh-320px)]">
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredUsers.map((user, index) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="cursor-pointer"
                      onClick={() => setSelectedUser(user)}
                    >
                      <Card className="bg-black/40 border-white/10 hover:border-white/20 transition-all p-4">
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback>{user.username[0]}</AvatarFallback>
                            </Avatar>
                            {user.verified && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-[rgb(163,255,18)] rounded-full flex items-center justify-center">
                                <Shield className="w-2 h-2 text-black" />
                              </div>
                            )}
                            <div className="absolute -bottom-1 -right-1">
                              <div className={`w-3 h-3 rounded-full ${
                                user.lastSeen.includes('min') ? 'bg-green-400' : 'bg-yellow-400'
                              }`} />
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="text-white font-bold text-sm truncate flex items-center gap-2">
                                {user.username}
                                {user.level > 50 && <Crown className="w-3 h-3 text-yellow-400" />}
                              </h3>
                              <Badge className="bg-[rgb(163,255,18)]/20 text-[rgb(163,255,18)] border-[rgb(163,255,18)]/40 text-xs">
                                {user.matchScore}% Match
                              </Badge>
                            </div>

                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                Level {user.level}
                              </Badge>
                              <Badge className={`text-xs ${tradingStyleColors[user.tradingStyle]}`}>
                                {user.tradingStyle}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs text-white/60">
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3" />
                                {user.reputation}% Rep
                              </div>
                              <div className="flex items-center gap-1">
                                <Activity className="w-3 h-3" />
                                {user.activeOffers} Offers
                              </div>
                            </div>

                            <div className="text-xs text-white/60 mt-1">
                              Last seen {user.lastSeen}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <div className="text-xs text-white/60 truncate">
                            Collections: {user.collections.join(', ')}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-white/60 hover:text-white h-6 px-2"
                            >
                              <MessageCircle className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-[rgb(163,255,18)] hover:text-[rgb(163,255,18)] hover:bg-[rgb(163,255,18)]/10 h-6 px-2"
                            >
                              <Target className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Items Tab */}
          <TabsContent value="items" className="mt-4">
            <ScrollArea className="h-[calc(100vh-320px)]">
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredNFTs.map((nft, index) => (
                    <motion.div
                      key={nft.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="cursor-pointer"
                    >
                      <Card className="bg-black/40 border-white/10 hover:border-white/20 transition-all overflow-hidden">
                        <div className="flex">
                          <div className="w-20 h-20 flex-shrink-0">
                            <MediaRenderer
                              src={nft.image}
                              alt={nft.name}
                              className="w-full h-full object-cover"
                              aspectRatio="square"
                            />
                          </div>
                          
                          <div className="flex-1 p-3 min-w-0">
                            <div className="flex items-start justify-between mb-1">
                              <h3 className="text-white font-bold text-sm truncate">{nft.name}</h3>
                              <Badge className={`text-xs ${rarityColors[nft.rarity]} ml-2`}>
                                {nft.rarity}
                              </Badge>
                            </div>
                            
                            <p className="text-white/60 text-xs mb-2 truncate">{nft.collection}</p>
                            
                            <div className="flex items-center justify-between">
                              <div className="text-white font-bold text-sm">{nft.value} ETH</div>
                              <div className={`text-xs ${getInterestColor(nft.tradingInterest)}`}>
                                {nft.tradingInterest} Interest
                              </div>
                            </div>

                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-1 text-xs text-white/60">
                                <Avatar className="w-4 h-4">
                                  <AvatarFallback className="text-xs">{nft.owner.username[0]}</AvatarFallback>
                                </Avatar>
                                <span className="truncate">{nft.owner.username}</span>
                                {nft.owner.verified && (
                                  <Shield className="w-3 h-3 text-[rgb(163,255,18)]" />
                                )}
                              </div>
                              
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-[rgb(163,255,18)] hover:text-[rgb(163,255,18)] hover:bg-[rgb(163,255,18)]/10 h-6 px-2"
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Quick Actions */}
      <div className="flex-shrink-0 p-4 border-t border-white/10">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Zap className="w-4 h-4 mr-1" />
            Quick Match
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Filter className="w-4 h-4 mr-1" />
            Filters
          </Button>
        </div>
      </div>

      {/* User Detail Modal (overlay when user is selected) */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedUser(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-black/90 border border-white/20 rounded-xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-4">
                <Avatar className="w-20 h-20 mx-auto mb-3">
                  <AvatarImage src={selectedUser.avatar} />
                  <AvatarFallback>{selectedUser.username[0]}</AvatarFallback>
                </Avatar>
                <h3 className="text-white font-bold text-xl">{selectedUser.username}</h3>
                <Badge className={`mt-1 ${tradingStyleColors[selectedUser.tradingStyle]}`}>
                  {selectedUser.tradingStyle} Trader
                </Badge>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Match Score:</span>
                  <span className="text-[rgb(163,255,18)] font-bold">{selectedUser.matchScore}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Reputation:</span>
                  <span className="text-white font-bold">{selectedUser.reputation}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Active Offers:</span>
                  <span className="text-white font-bold">{selectedUser.activeOffers}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Last Seen:</span>
                  <span className="text-white font-bold">{selectedUser.lastSeen}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  <MessageCircle className="w-4 h-4 mr-1" />
                  Message
                </Button>
                <Button className="bg-[rgb(163,255,18)] hover:bg-green-400 text-black font-bold">
                  <Target className="w-4 h-4 mr-1" />
                  Trade
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}