"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Filter,
  Search,
  RefreshCw,
  Eye,
  MessageSquare,
  Zap,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWalletAuthOptimized } from "@/hooks/use-wallet-auth-optimized";
import { MediaRenderer } from "@/components/media-renderer";

interface Trade {
  id: string;
  status: string;
  initiator: {
    id: string;
    username: string;
    walletAddress: string;
    profilePicture: string;
  };
  counterparty: {
    id: string;
    username: string;
    walletAddress: string;
    profilePicture: string;
  };
  items: Array<{
    id: string;
    nft: {
      id: string;
      name: string;
      image: string;
      collection: {
        name: string;
        symbol: string;
        image: string;
      };
    };
    side: string;
    tokenAmount: number;
  }>;
  fairnessScore: number;
  createdAt: string;
  updatedAt: string;
  agreedAt?: string;
  escrowAddress?: string;
  finalizedAt?: string;
  canceledAt?: string;
  _count: {
    items: number;
    messages: number;
  };
}

interface TradeHistoryProps {
  onTradeSelect?: (trade: Trade) => void;
}

export function TradeHistory({ onTradeSelect }: TradeHistoryProps) {
  const { user } = useWalletAuthOptimized();
  const address = user?.walletAddress;
  const [trades, setTrades] = useState<Trade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTab, setSelectedTab] = useState("all");

  const statusConfig = {
    DRAFT: { label: "Draft", color: "bg-gray-500/20 text-gray-400", icon: Clock },
    PENDING: { label: "Pending", color: "bg-yellow-500/20 text-yellow-400", icon: Clock },
    COUNTERED: { label: "Countered", color: "bg-orange-500/20 text-orange-400", icon: MessageSquare },
    AGREED: { label: "Agreed", color: "bg-blue-500/20 text-blue-400", icon: CheckCircle2 },
    ESCROW_DEPLOYED: { label: "Escrow Deployed", color: "bg-purple-500/20 text-purple-400", icon: Shield },
    DEPOSITED: { label: "Deposited", color: "bg-indigo-500/20 text-indigo-400", icon: Zap },
    FINALIZED: { label: "Finalized", color: "bg-green-500/20 text-green-400", icon: CheckCircle2 },
    CANCELED: { label: "Canceled", color: "bg-red-500/20 text-red-400", icon: XCircle },
    REJECTED: { label: "Rejected", color: "bg-red-500/20 text-red-400", icon: XCircle },
  };

  const fetchTrades = async () => {
    if (!address) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/p2p/trades?address=${address}`);
      const data = await response.json();

      if (data.success) {
        setTrades(data.data.trades);
        setFilteredTrades(data.data.trades);
      } else {
        setError(data.error || 'Failed to fetch trades');
      }
    } catch (error) {
      console.error('Error fetching trades:', error);
      setError('Failed to fetch trades');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
  }, [address]);

  useEffect(() => {
    let filtered = trades;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(trade => 
        trade.initiator.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trade.counterparty.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trade.items.some(item => 
          item.nft.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(trade => trade.status === statusFilter);
    }

    // Filter by tab
    if (selectedTab === "active") {
      filtered = filtered.filter(trade => 
        ['PENDING', 'COUNTERED', 'AGREED', 'ESCROW_DEPLOYED', 'DEPOSITED'].includes(trade.status)
      );
    } else if (selectedTab === "completed") {
      filtered = filtered.filter(trade => 
        ['FINALIZED', 'CANCELED', 'REJECTED'].includes(trade.status)
      );
    }

    setFilteredTrades(filtered);
  }, [trades, searchQuery, statusFilter, selectedTab]);

  const getStatusIcon = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return Clock;
    return config.icon;
  };

  const getStatusColor = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return "bg-gray-500/20 text-gray-400";
    return config.color;
  };

  const getStatusLabel = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return status;
    return config.label;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTradeValue = (trade: Trade) => {
    return trade.items.reduce((sum, item) => sum + (item.tokenAmount || 0), 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <p className="text-sm text-white/60">Loading trade history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <div className="text-center">
          <p className="text-lg font-medium text-white mb-2">Failed to load trades</p>
          <p className="text-sm text-white/60 mb-4">{error}</p>
          <Button onClick={fetchTrades} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Trade History</h2>
          <p className="text-white/60">Manage your P2P trades and negotiations</p>
        </div>
        <Button onClick={fetchTrades} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search trades, users, or NFTs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white/5 border border-white/20 rounded-md text-white text-sm"
          >
            <option value="all">All Status</option>
            {Object.entries(statusConfig).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-3 bg-white/5">
          <TabsTrigger value="all">All Trades</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-6">
          {filteredTrades.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-white/40" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No trades found</h3>
              <p className="text-white/60">
                {searchQuery || statusFilter !== "all" 
                  ? "Try adjusting your filters" 
                  : "Start trading to see your history here"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {filteredTrades.map((trade, index) => {
                  const StatusIcon = getStatusIcon(trade.status);
                  const isInitiator = trade.initiator.walletAddress === address;
                  const otherParty = isInitiator ? trade.counterparty : trade.initiator;
                  
                  return (
                    <motion.div
                      key={trade.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card 
                        className="bg-white/5 border-white/10 p-6 hover:bg-white/10 transition-colors cursor-pointer"
                        onClick={() => onTradeSelect?.(trade)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="flex items-center gap-2">
                                <MediaRenderer
                                  src={otherParty.profilePicture || 'https://via.placeholder.com/32x32/333/fff?text=U'}
                                  alt={otherParty.username}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                                <div>
                                  <p className="font-medium text-white">
                                    {isInitiator ? 'Trading with' : 'Trading from'} {otherParty.username || 'Unknown'}
                                  </p>
                                  <p className="text-xs text-white/60">
                                    {formatDate(trade.createdAt)}
                                  </p>
                                </div>
                              </div>
                              <Badge className={getStatusColor(trade.status)}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {getStatusLabel(trade.status)}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div>
                                <p className="text-sm text-white/60">Trade Value</p>
                                <p className="font-medium text-white">
                                  {getTradeValue(trade).toFixed(6)} ETH
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-white/60">Items</p>
                                <p className="font-medium text-white">
                                  {trade._count.items} NFTs
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-white/60">Fairness</p>
                                <p className="font-medium text-white">
                                  {trade.fairnessScore || 0}%
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-white/60">
                              <span>{trade._count.messages} messages</span>
                              {trade.escrowAddress && (
                                <span className="flex items-center gap-1">
                                  <Shield className="h-3 w-3" />
                                  Escrow deployed
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                onTradeSelect?.(trade);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Open trade details in new tab
                                window.open(`/p2p/trade/${trade.id}`, '_blank');
                              }}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
