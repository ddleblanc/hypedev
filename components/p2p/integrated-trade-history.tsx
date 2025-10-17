"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageSquare,
  Zap,
  Shield,
  TrendingUp,
  ChevronRight,
  RefreshCw,
  Filter,
  Eye,
  EyeOff,
  ArrowUpDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  _count: {
    items: number;
    messages: number;
  };
}

interface IntegratedTradeHistoryProps {
  onTradeSelect?: (trade: Trade) => void;
  onLoadTrade?: (trade: Trade) => void;
  searchQuery?: string;
  viewFilter?: 'all' | 'active' | 'completed';
}

export function IntegratedTradeHistory({
  onTradeSelect,
  onLoadTrade,
  searchQuery = "",
  viewFilter = 'all'
}: IntegratedTradeHistoryProps) {
  const { user } = useWalletAuthOptimized();
  const address = user?.walletAddress;
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedTrade, setExpandedTrade] = useState<string | null>(null);

  const statusConfig = {
    DRAFT: { label: "Draft", color: "bg-white/10 text-white/60 border-white/20", icon: Clock },
    PENDING: { label: "Pending", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: Clock },
    COUNTERED: { label: "Countered", color: "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: MessageSquare },
    AGREED: { label: "Agreed", color: "bg-[rgb(163,255,18)]/20 text-[rgb(163,255,18)] border-[rgb(163,255,18)]/30", icon: CheckCircle2 },
    ESCROW_DEPLOYED: { label: "In Escrow", color: "bg-white/20 text-white border-white/30", icon: Shield },
    DEPOSITED: { label: "Deposited", color: "bg-white/20 text-white border-white/30", icon: Zap },
    FINALIZED: { label: "Complete", color: "bg-[rgb(163,255,18)]/20 text-[rgb(163,255,18)] border-[rgb(163,255,18)]/30", icon: CheckCircle2 },
    CANCELED: { label: "Canceled", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: XCircle },
    REJECTED: { label: "Rejected", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: XCircle },
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

  // Filter trades
  const filteredTrades = trades.filter(trade => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !trade.initiator.username?.toLowerCase().includes(query) &&
        !trade.counterparty.username?.toLowerCase().includes(query) &&
        !trade.items.some(item => item.nft.name.toLowerCase().includes(query))
      ) {
        return false;
      }
    }

    // Status filter
    if (viewFilter === 'active') {
      return ['PENDING', 'COUNTERED', 'AGREED', 'ESCROW_DEPLOYED', 'DEPOSITED'].includes(trade.status);
    } else if (viewFilter === 'completed') {
      return ['FINALIZED', 'CANCELED', 'REJECTED'].includes(trade.status);
    }

    return true;
  });

  const getStatusIcon = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    return config?.icon || Clock;
  };

  const getStatusStyle = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    return config?.color || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  const getStatusLabel = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    return config?.label || status;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getTradeValues = (trade: Trade) => {
    const initiatorValue = trade.items
      .filter(item => item.side === 'INITIATOR')
      .reduce((sum, item) => sum + (item.tokenAmount || 0), 0);
    const counterpartyValue = trade.items
      .filter(item => item.side === 'COUNTERPARTY')
      .reduce((sum, item) => sum + (item.tokenAmount || 0), 0);
    return { initiatorValue, counterpartyValue };
  };

  if (isLoading && trades.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 mx-auto mb-4 border-2 border-white/20 border-t-white/60 rounded-full"
          />
          <p className="text-sm text-white/60">Loading trades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Trade List */}
      {error ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
          <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
          <p className="text-red-400">{error}</p>
          <Button onClick={fetchTrades} variant="outline" size="sm" className="mt-3">
            Try Again
          </Button>
        </div>
      ) : filteredTrades.length === 0 ? (
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-12 text-center">
          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="h-10 w-10 text-white/40" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No trades found</h3>
          <p className="text-white/60 text-sm">
            {searchQuery ? "Try a different search" : "Your trades will appear here"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredTrades.map((trade, index) => {
              const StatusIcon = getStatusIcon(trade.status);
              const isInitiator = trade.initiator.walletAddress === address;
              const otherParty = isInitiator ? trade.counterparty : trade.initiator;
              const { initiatorValue, counterpartyValue } = getTradeValues(trade);
              const isExpanded = expandedTrade === trade.id;

              return (
                <motion.div
                  key={trade.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden hover:border-white/20 transition-all"
                >
                  {/* Main Row */}
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => setExpandedTrade(isExpanded ? null : trade.id)}
                  >
                    <div className="flex items-center gap-4">
                      {/* User Avatar */}
                      <div className="relative">
                        <MediaRenderer
                          src={otherParty.profilePicture || `https://via.placeholder.com/40x40/333/fff?text=${otherParty.username?.[0] || 'U'}`}
                          alt={otherParty.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-gray-900 flex items-center justify-center">
                          {React.createElement(getStatusIcon(trade.status), {
                            className: cn("h-2.5 w-2.5", trade.status === 'PENDING' ? 'text-yellow-400' : 'text-white/60')
                          })}
                        </div>
                      </div>

                      {/* Trade Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-white truncate">
                            {isInitiator ? '→' : '←'} {otherParty.username || 'Unknown'}
                          </p>
                          <Badge className={cn("text-[10px] border", getStatusStyle(trade.status))}>
                            {getStatusLabel(trade.status)}
                          </Badge>
                          {trade._count.messages > 0 && (
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px]">
                              <MessageSquare className="h-2.5 w-2.5 mr-1" />
                              {trade._count.messages}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-white/60">
                          <span>{formatDate(trade.createdAt)}</span>
                          <span>{trade._count.items} items</span>
                          {trade.fairnessScore > 0 && (
                            <span className={cn(
                              "flex items-center gap-1",
                              trade.fairnessScore >= 80 ? "text-green-400" :
                              trade.fairnessScore >= 60 ? "text-yellow-400" :
                              "text-red-400"
                            )}>
                              <TrendingUp className="h-3 w-3" />
                              {trade.fairnessScore}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Values */}
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-[rgb(163,255,18)] font-mono">
                            {isInitiator ? initiatorValue.toFixed(3) : counterpartyValue.toFixed(3)}
                          </span>
                          <ArrowUpDown className="h-3 w-3 text-white/40" />
                          <span className="text-purple-400 font-mono">
                            {isInitiator ? counterpartyValue.toFixed(3) : initiatorValue.toFixed(3)}
                          </span>
                        </div>
                        <p className="text-[10px] text-white/40">ETH</p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onTradeSelect?.(trade);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {['PENDING', 'COUNTERED'].includes(trade.status) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-3 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              onLoadTrade?.(trade);
                            }}
                          >
                            Load
                          </Button>
                        )}
                        <ChevronRight className={cn(
                          "h-4 w-4 text-white/40 transition-transform",
                          isExpanded && "rotate-90"
                        )} />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-white/10"
                      >
                        <div className="p-4 bg-black/60">
                          {/* NFT Preview Grid */}
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-white/60 mb-2">
                                {isInitiator ? 'Your items' : `${trade.initiator.username}'s items`}
                              </p>
                              <div className="flex gap-1">
                                {trade.items
                                  .filter(item => item.side === 'INITIATOR')
                                  .slice(0, 4)
                                  .map((item, idx) => (
                                    <div key={idx} className="relative w-10 h-10 rounded overflow-hidden bg-black/40">
                                      <MediaRenderer
                                        src={item.nft.image}
                                        alt={item.nft.name}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ))}
                                {trade.items.filter(item => item.side === 'INITIATOR').length > 4 && (
                                  <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center text-xs text-white/60">
                                    +{trade.items.filter(item => item.side === 'INITIATOR').length - 4}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div>
                              <p className="text-xs text-white/60 mb-2">
                                {!isInitiator ? 'Your items' : `${trade.counterparty.username}'s items`}
                              </p>
                              <div className="flex gap-1">
                                {trade.items
                                  .filter(item => item.side === 'COUNTERPARTY')
                                  .slice(0, 4)
                                  .map((item, idx) => (
                                    <div key={idx} className="relative w-10 h-10 rounded overflow-hidden bg-black/40">
                                      <MediaRenderer
                                        src={item.nft.image}
                                        alt={item.nft.name}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ))}
                                {trade.items.filter(item => item.side === 'COUNTERPARTY').length > 4 && (
                                  <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center text-xs text-white/60">
                                    +{trade.items.filter(item => item.side === 'COUNTERPARTY').length - 4}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 h-8 text-xs"
                              onClick={() => onTradeSelect?.(trade)}
                            >
                              View Details
                            </Button>
                            {['PENDING', 'COUNTERED'].includes(trade.status) && (
                              <Button
                                size="sm"
                                className="flex-1 h-8 text-xs bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90"
                                onClick={() => onLoadTrade?.(trade)}
                              >
                                Continue Trade
                              </Button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}