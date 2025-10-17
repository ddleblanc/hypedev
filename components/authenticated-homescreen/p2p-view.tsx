"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useP2PTrading } from "@/contexts/p2p-trading-context";
import { useWalletAuthOptimized } from "@/hooks/use-wallet-auth-optimized";
import {
  X,
  History,
  ChevronLeft,
  ChevronRight,
  ArrowRightLeft,
  Send,
  MessageSquare,
  TrendingUp,
  // AlertCircle,
  Loader2,
  // CheckCircle2,
  // Info,
  Users,
  Plus,
  Search,
  Star,
  Sparkles,
  User,
  MessageCircle,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { IntegratedTradeHistory } from "@/components/p2p/integrated-trade-history";
import { TradeDetailModal } from "@/components/p2p/trade-detail-modal";
import { MediaRenderer } from "@/components/media-renderer";

type P2PViewProps = {
  setViewMode: (mode: string) => void;
};

export function P2PView({ setViewMode: _ }: P2PViewProps) {
  const { user } = useWalletAuthOptimized();
  const address = user?.walletAddress;

  const {
    userNFTs,
    userBoardNFTs,
    traderBoardNFTs,
    removeUserNFTFromBoard,
    removeTraderNFTFromBoard,
    toggleUserNFTSelection,
    toggleTraderNFTSelection,
    loadTradeIntoBoard,
    loadedTrade,
    boardHistoryIndex,
    navigateBoardHistory,
    isViewingHistory,
    selectedTrader,
    selectTrader,
    traders,
    traderNFTs,
    clearAllSelections,
    activeTradeId,
    clearActiveTradeId,
    isLoadingTraders,
    isLoadingTraderNFTs
  } = useP2PTrading();

  const [activeTab, setActiveTab] = useState<'trade' | 'history'>('trade');
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
  const [refreshHistoryKey, setRefreshHistoryKey] = useState(0);
  const [message, setMessage] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  // const [error, setError] = useState<string | null>(null);
  // const [success, setSuccess] = useState<string | null>(null);

  // Mobile sheet states
  const [showContactList, setShowContactList] = useState(false);
  const [showUserNFTSheet, setShowUserNFTSheet] = useState(false);
  const [showTraderNFTSheet, setShowTraderNFTSheet] = useState(false);
  const [contactSearchQuery, setContactSearchQuery] = useState("");

  // Mobile navigation states (chat-like)
  const [mobileView, setMobileView] = useState<'contacts' | 'trading' | 'profile'>('contacts');
  const [showNewTradeSheet, setShowNewTradeSheet] = useState(false);
  const [isCreatingOffer, setIsCreatingOffer] = useState(false); // Track if we're in offer creation mode
  const [showTradeHistory, setShowTradeHistory] = useState(false); // Show trade history for mobile

  // Conversation data
  const [conversation, setConversation] = useState<any[]>([]);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [activeConversations, setActiveConversations] = useState<any[]>([]);

  // History filters
  const [searchQuery, setSearchQuery] = useState("");
  const [viewFilter, setViewFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Calculate fairness score
  const calculateFairnessScore = () => {
    const userValue = userBoardNFTs.reduce((sum, nft) => sum + nft.value, 0);
    const traderValue = traderBoardNFTs.reduce((sum, nft) => sum + nft.value, 0);

    if (userValue === 0 && traderValue === 0) return 0;
    if (userValue === 0 || traderValue === 0) return 0;

    const ratio = Math.min(userValue, traderValue) / Math.max(userValue, traderValue);
    return Math.round(ratio * 100);
  };

  const fairnessScore = calculateFairnessScore();
  const userTotal = userBoardNFTs.reduce((sum, nft) => sum + nft.value, 0);
  const traderTotal = traderBoardNFTs.reduce((sum, nft) => sum + nft.value, 0);

  // Helper function to format time ago
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    // Format as date for older messages
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Helper function to extract real NFT ID
  const extractRealNFTId = (id: string): string => {
    if (id.startsWith('user-') || id.startsWith('trader-')) {
      const parts = id.split('-');
      return parts.slice(1, -1).join('-');
    }
    return id;
  };

  // Send trade offer
  const sendOffer = async () => {
    if (!address || !selectedTrader) return;

    setIsCreating(true);
    // setError(null);
    // setSuccess(null);

    try {
      const endpoint = activeTradeId ? `/api/p2p/trades/${activeTradeId}` : '/api/p2p/trades';
      const method = activeTradeId ? 'PUT' : 'POST';

      const body = activeTradeId ? {
        action: 'counteroffer',
        userAddress: address,
        items: [
          ...userBoardNFTs.map(nft => ({
            nftId: extractRealNFTId(nft.id),
            side: 'INITIATOR',
            tokenAmount: nft.value,
            metadata: { name: nft.name, image: nft.image, rarity: nft.rarity }
          })),
          ...traderBoardNFTs.map(nft => ({
            nftId: extractRealNFTId(nft.id),
            side: 'COUNTERPARTY',
            tokenAmount: nft.value,
            metadata: { name: nft.name, image: nft.image, rarity: nft.rarity }
          }))
        ],
        message
      } : {
        initiatorAddress: address,
        counterpartyAddress: selectedTrader.walletAddress,
        initiatorItems: userBoardNFTs.map(nft => ({
          nftId: extractRealNFTId(nft.id),
          side: 'INITIATOR',
          tokenAmount: nft.value,
          metadata: { name: nft.name, image: nft.image, rarity: nft.rarity }
        })),
        counterpartyItems: traderBoardNFTs.map(nft => ({
          nftId: extractRealNFTId(nft.id),
          side: 'COUNTERPARTY',
          tokenAmount: nft.value,
          metadata: { name: nft.name, image: nft.image, rarity: nft.rarity }
        })),
        metadata: {
          message,
          fairnessScore,
          createdAt: new Date().toISOString()
        }
      };

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.success) {
        // setSuccess(activeTradeId ? 'Counter-offer sent!' : 'Trade offer sent!');
        clearAllSelections();
        setMessage("");
        if (activeTradeId) clearActiveTradeId();

        // Show in history
        setRefreshHistoryKey(prev => prev + 1);
        setActiveTab('history');
        setSelectedTradeId(data.data.id);

        // setTimeout(() => setSuccess(null), 5000);
      } else {
        // setError(data.error || 'Failed to send offer');
        console.error('Trade error:', data.error || 'Failed to send offer');
      }
    } catch (error) {
      console.error('Error sending offer:', error);
      // setError('Failed to send trade offer');
    } finally {
      setIsCreating(false);
    }
  };

  const canSendOffer = userBoardNFTs.length > 0 && selectedTrader && !isCreating && !isViewingHistory;

  // Fetch conversation between user and selected trader
  const fetchConversation = async () => {
    if (!address || !selectedTrader) return;

    setIsLoadingConversation(true);
    try {
      const response = await fetch(`/api/p2p/conversations?userAddress=${address}&partnerAddress=${selectedTrader.walletAddress}`);
      const data = await response.json();

      if (data.success) {
        setConversation(data.data.conversation);
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
    } finally {
      setIsLoadingConversation(false);
    }
  };

  // Fetch active conversations for contacts list
  const fetchActiveConversations = async () => {
    if (!address) return;

    try {
      const response = await fetch(`/api/p2p/trades?address=${address}&limit=50`);
      const data = await response.json();

      if (data.success) {
        // Group trades by trader
        const traderMap = new Map();

        data.data.trades.forEach((trade: any) => {
          const otherParty = trade.initiator.walletAddress === address ? trade.counterparty : trade.initiator;
          const traderId = otherParty.id;

          if (!traderMap.has(traderId)) {
            // First trade with this trader
            traderMap.set(traderId, {
              trader: otherParty,
              trades: [trade],
              lastActivity: trade.updatedAt,
              lastMessage: trade.messages?.[0] || null,
              activeTrades: trade.status === 'PENDING' || trade.status === 'AGREED' ? 1 : 0,
              totalTrades: 1
            });
          } else {
            // Additional trade with same trader
            const existing = traderMap.get(traderId);
            existing.trades.push(trade);
            existing.totalTrades++;

            // Update last activity if this trade is more recent
            if (new Date(trade.updatedAt) > new Date(existing.lastActivity)) {
              existing.lastActivity = trade.updatedAt;
              if (trade.messages?.[0]) {
                existing.lastMessage = trade.messages[0];
              }
            }

            // Count active trades
            if (trade.status === 'PENDING' || trade.status === 'AGREED') {
              existing.activeTrades++;
            }
          }
        });

        // Convert map to array and sort by last activity
        const groupedConversations = Array.from(traderMap.values())
          .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());

        setActiveConversations(groupedConversations);
      }
    } catch (error) {
      console.error('Error fetching active conversations:', error);
    }
  };

  // Send a chat message
  const sendChatMessage = async (messageText: string) => {
    if (!address || !selectedTrader || !messageText.trim()) return;

    try {
      // Get or create a trade ID for this conversation
      let tradeId = activeTradeId;

      // If no active trade, find the most recent one between these users
      if (!tradeId) {
        const tradesResponse = await fetch(`/api/p2p/trades?address=${address}&limit=1`);
        const tradesData = await tradesResponse.json();
        if (tradesData.success && tradesData.data.trades.length > 0) {
          const recentTrade = tradesData.data.trades.find((t: any) =>
            (t.initiator.walletAddress === selectedTrader.walletAddress) ||
            (t.counterparty.walletAddress === selectedTrader.walletAddress)
          );
          if (recentTrade) {
            tradeId = recentTrade.id;
          }
        }
      }

      if (!tradeId) {
        console.error('No trade context for message');
        return;
      }

      const response = await fetch('/api/p2p/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: address,
          tradeId,
          message: messageText,
          messageType: 'TEXT'
        })
      });

      const data = await response.json();
      if (data.success) {
        // Add message to conversation
        setConversation(prev => [...prev, {
          type: 'message',
          timestamp: new Date(),
          message: messageText,
          messageType: 'TEXT',
          user: {
            id: user?.id,
            username: user?.username,
            walletAddress: address,
            profilePicture: user?.profilePicture
          }
        }]);
        setMessage("");
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Load conversation when trader is selected
  useEffect(() => {
    if (selectedTrader && address) {
      fetchConversation();
    }
  }, [selectedTrader, address]);

  // Load active conversations on mount
  useEffect(() => {
    if (address) {
      fetchActiveConversations();
    }
  }, [address]);

  return (
    <>
      {/* Mobile Layout - Full Screen Chat-like Experience */}
      <div className="md:hidden fixed inset-0 flex flex-col bg-black">
        {/* Header - Changes based on view */}
        <div className="fixed top-16 left-0 right-0 z-30 bg-black border-b border-white/10">
          {mobileView === 'contacts' ? (
            // Contacts list header
            <div className="flex items-center justify-between p-4">
              <h1 className="text-white text-xl font-bold">Trades</h1>
              <button
                onClick={() => setShowNewTradeSheet(true)}
                className="w-10 h-10 rounded-full bg-[rgb(163,255,18)] flex items-center justify-center"
              >
                <Plus className="h-5 w-5 text-black" />
              </button>
            </div>
          ) : mobileView === 'trading' && selectedTrader ? (
            // Trading view header with partner info
            <div className="flex items-center gap-3 p-3">
              <button
                onClick={() => {
                  setMobileView('contacts');
                  clearAllSelections();
                }}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center"
              >
                <ChevronLeft className="h-5 w-5 text-white" />
              </button>
              <div className="flex-1 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
                  {selectedTrader.avatar ? (
                    <MediaRenderer
                      src={selectedTrader.avatar}
                      alt={selectedTrader.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold text-sm">
                      {selectedTrader.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{selectedTrader.name}</p>
                  <p className="text-white/40 text-xs">
                    {selectedTrader.isOnline ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
              {/* Trade History Button */}
              <button
                onClick={() => {
                  setShowTradeHistory(true);
                }}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <History className="h-4 w-4 text-white" />
              </button>
            </div>
          ) : (
            // Profile view header
            <div className="flex items-center justify-between p-4">
              <h1 className="text-white text-xl font-bold">Profile</h1>
            </div>
          )}
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto mt-[128px] mb-[72px]">
          <AnimatePresence mode="wait">
            {mobileView === 'contacts' ? (
              // Contacts/Active Trades List View
              <motion.div
                key="contacts"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* Search Bar */}
                <div className="p-4 pb-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search trades..."
                      className="w-full pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl"
                    />
                  </div>
                </div>

                {/* Active Trades Section */}
                <div className="px-4 pb-2">
                  <h2 className="text-xs text-white/40 uppercase tracking-wider mb-3">Conversations</h2>
                  <div className="space-y-2">
                    {activeConversations.length > 0 ? (
                      activeConversations.map(convo => {
                        const { trader, lastMessage, lastActivity, activeTrades, totalTrades } = convo;

                        return (
                          <button
                            key={trader.id}
                            onClick={() => {
                              // Create trader object from conversation data
                              const traderObj = {
                                id: trader.id,
                                name: trader.username || 'Unknown',
                                username: trader.username,
                                walletAddress: trader.walletAddress,
                                avatar: trader.profilePicture || '',
                                rating: 0,
                                trades: totalTrades,
                                successRate: 0,
                                isOnline: false,
                                tier: 'SILVER' as const
                              };
                              selectTrader(traderObj);
                              setMobileView('trading');
                            }}
                            className="w-full bg-white/5 rounded-xl p-3 flex items-center gap-3 hover:bg-white/10 transition-all"
                          >
                            <div className="relative">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
                                {trader.profilePicture ? (
                                  <MediaRenderer
                                    src={trader.profilePicture}
                                    alt={trader.username}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-white font-bold text-lg">
                                    {(trader.username || 'U').charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              {activeTrades > 0 && (
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-yellow-500 rounded-full border-2 border-black" />
                              )}
                            </div>
                            <div className="flex-1 text-left">
                              <p className="text-white text-sm font-medium">{trader.username || 'Unknown User'}</p>
                              <p className="text-white/40 text-xs">
                                {lastMessage ?
                                  lastMessage.message.substring(0, 30) + (lastMessage.message.length > 30 ? '...' : '') :
                                  activeTrades > 0 ? `${activeTrades} active trade${activeTrades > 1 ? 's' : ''}` : 'No recent activity'
                                }
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-white/40">
                                {formatTimeAgo(new Date(lastActivity))}
                              </p>
                              {activeTrades > 0 && (
                                <div className="mt-1 w-5 h-5 rounded-full bg-[rgb(163,255,18)] flex items-center justify-center">
                                  <span className="text-black text-[10px] font-bold">{activeTrades}</span>
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      // Fallback to showing suggested traders when no active conversations
                      traders.slice(0, 3).map(trader => (
                        <button
                          key={trader.id}
                          onClick={() => {
                            selectTrader(trader);
                            setMobileView('trading');
                          }}
                          className="w-full bg-white/5 rounded-xl p-3 flex items-center gap-3 hover:bg-white/10 transition-all"
                        >
                          <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
                              {trader.avatar ? (
                                <MediaRenderer
                                  src={trader.avatar}
                                  alt={trader.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-white font-bold text-lg">
                                  {trader.name.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            {trader.isOnline && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black" />
                            )}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-white text-sm font-medium">{trader.name}</p>
                            <p className="text-white/40 text-xs">Start trading</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Suggested Traders Section - Exclude those already in conversations */}
                <div className="px-4 pt-4">
                  <h2 className="text-xs text-white/40 uppercase tracking-wider mb-3">Suggested Traders</h2>
                  <div className="space-y-2">
                    {traders
                      .filter(trader => trader && !activeConversations.some(convo => convo?.trader?.id === trader.id))
                      .slice(0, 5)
                      .map(trader => trader ? (
                      <button
                        key={trader.id}
                        onClick={() => {
                          selectTrader(trader);
                          setMobileView('trading');
                        }}
                        className="w-full bg-black/40 rounded-xl p-3 flex items-center gap-3 hover:bg-white/5 transition-all"
                      >
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center overflow-hidden">
                            {trader.avatar ? (
                              <MediaRenderer
                                src={trader.avatar}
                                alt={trader.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-white/60 font-bold text-lg">
                                {trader.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          {trader.isOnline && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500/60 rounded-full border-2 border-black" />
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-white/80 text-sm font-medium">{trader.name}</p>
                          <p className="text-white/30 text-xs">
                            {trader.trades} trades • {trader.successRate}% success
                          </p>
                        </div>
                        {trader.rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-400/60 fill-yellow-400/60" />
                            <span className="text-white/40 text-xs">{trader.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </button>
                    ) : null)}
                  </div>
                </div>
              </motion.div>
            ) : mobileView === 'trading' && selectedTrader ? (
              // Chat View with integrated trade history
              <motion.div
                key="chat"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col h-full"
              >
                {/* Chat Messages Area */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                  {isLoadingConversation ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 text-white/40 animate-spin" />
                    </div>
                  ) : conversation.length > 0 ? (
                    conversation.map((item, index) => {
                      const isOwnMessage = item.user?.walletAddress === address;
                      const formattedTime = new Date(item.timestamp).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      // Trade creation event
                      if (item.type === 'trade_created') {
                        return (
                          <div key={index} className="text-center">
                            <p className="text-white/40 text-xs bg-white/5 rounded-full px-3 py-1 inline-block">
                              Trade offer created
                            </p>
                          </div>
                        );
                      }

                      // Trade event (status changes)
                      if (item.type === 'trade_event') {
                        const statusMessages: Record<string, string> = {
                          'AGREED': '✓ Both parties agreed',
                          'COMPLETED': '✓ Trade completed successfully',
                          'CANCELLED': '✗ Trade was cancelled',
                          'DISPUTED': '⚠ Trade disputed'
                        };
                        const message = statusMessages[item.newStatus] || `Trade ${item.action.toLowerCase()}`;
                        const statusColors: Record<string, string> = {
                          'AGREED': 'text-blue-400 bg-blue-400/10',
                          'COMPLETED': 'text-green-400 bg-green-400/10',
                          'CANCELLED': 'text-red-400 bg-red-400/10',
                          'DISPUTED': 'text-yellow-400 bg-yellow-400/10'
                        };
                        const colorClass = statusColors[item.newStatus] || 'text-white/40 bg-white/5';

                        return (
                          <div key={index} className="text-center">
                            <p className={`text-xs rounded-full px-3 py-1 inline-block ${colorClass}`}>
                              {message}
                            </p>
                          </div>
                        );
                      }

                      // Regular message
                      if (item.type === 'message') {
                        return (
                          <div key={index} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                            <div className="max-w-[80%]">
                              <div className={cn(
                                "rounded-2xl p-3",
                                isOwnMessage
                                  ? "bg-[rgb(163,255,18)]/10 border border-[rgb(163,255,18)]/30 rounded-tr-sm"
                                  : "bg-white/5 rounded-tl-sm"
                              )}>
                                <p className="text-white text-sm">{item.message}</p>
                                <p className="text-[9px] text-white/40 mt-1">{formattedTime}</p>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return null;
                    })
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-white/40 text-sm">No messages yet</p>
                      <p className="text-white/30 text-xs mt-2">Start a conversation or create a trade offer</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : mobileView === 'trading' && !selectedTrader ? (
              // Empty state when no trader selected
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center justify-center h-full p-8"
              >
                <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <Users className="h-12 w-12 text-white/20" />
                </div>
                <h3 className="text-white text-lg font-medium mb-2">No Trader Selected</h3>
                <p className="text-white/40 text-sm text-center mb-6">
                  Select a trader from your contacts or start a new trade
                </p>
                <button
                  onClick={() => setMobileView('contacts')}
                  className="px-6 py-3 bg-[rgb(163,255,18)] text-black rounded-xl font-medium"
                >
                  View Contacts
                </button>
              </motion.div>
            ) : mobileView === 'profile' ? (
              // Profile View
              <motion.div
                key="profile"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="p-4"
              >
                <div className="space-y-6">
                  {/* User Profile Card */}
                  <div className="bg-white/5 rounded-2xl p-6">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[rgb(163,255,18)] to-green-500 flex items-center justify-center">
                        <span className="text-black font-bold text-2xl">
                          {user?.username?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <h2 className="text-white text-xl font-bold">{user?.username || 'User'}</h2>
                        <p className="text-white/40 text-sm">{address?.slice(0, 6)}...{address?.slice(-4)}</p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-white text-2xl font-bold">247</p>
                        <p className="text-white/40 text-xs">Trades</p>
                      </div>
                      <div className="text-center">
                        <p className="text-white text-2xl font-bold">98%</p>
                        <p className="text-white/40 text-xs">Success</p>
                      </div>
                      <div className="text-center">
                        <p className="text-white text-2xl font-bold">4.9</p>
                        <p className="text-white/40 text-xs">Rating</p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-3">
                    <h3 className="text-white/60 text-xs uppercase tracking-wider">Quick Actions</h3>
                    <button className="w-full p-4 bg-white/5 rounded-xl flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <History className="h-5 w-5 text-white/60" />
                        <span className="text-white">Trade History</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-white/40 group-hover:text-white" />
                    </button>
                    <button className="w-full p-4 bg-white/5 rounded-xl flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <Star className="h-5 w-5 text-white/60" />
                        <span className="text-white">Reviews</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-white/40 group-hover:text-white" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-white/10 md:hidden">
          <div className="grid grid-cols-3 h-16">
            <button
              onClick={() => setMobileView('contacts')}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors",
                mobileView === 'contacts'
                  ? "text-[rgb(163,255,18)]"
                  : "text-white/60"
              )}
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-[10px]">Trades</span>
            </button>
            <button
              onClick={() => setMobileView('trading')}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors",
                mobileView === 'trading'
                  ? "text-[rgb(163,255,18)]"
                  : "text-white/60"
              )}
            >
              <ArrowRightLeft className="h-5 w-5" />
              <span className="text-[10px]">Trading</span>
            </button>
            <button
              onClick={() => setMobileView('profile')}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors",
                mobileView === 'profile'
                  ? "text-[rgb(163,255,18)]"
                  : "text-white/60"
              )}
            >
              <User className="h-5 w-5" />
              <span className="text-[10px]">Profile</span>
            </button>
          </div>
        </div>

        {/* Mobile Chat Input - Fixed at bottom when trading */}
        {mobileView === 'trading' && selectedTrader && !isCreatingOffer && (
          <div className="fixed bottom-16 left-0 right-0 bg-black border-t border-white/10 p-3 md:hidden">
            <div className="flex gap-2">
              {/* New Trade Button */}
              <button
                onClick={() => {
                  setIsCreatingOffer(true);
                }}
                className="h-10 w-10 p-0 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <ArrowRightLeft className="h-4 w-4 text-white" />
              </button>
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 h-10 bg-white/5 border-white/10 text-white text-sm placeholder:text-white/40 rounded-xl"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && message.trim()) {
                    e.preventDefault();
                    sendChatMessage(message);
                  }
                }}
              />
              <Button
                onClick={() => {
                  if (message.trim()) {
                    sendChatMessage(message);
                  }
                }}
                disabled={!message.trim()}
                className={cn(
                  "h-10 w-10 p-0 rounded-xl",
                  message.trim()
                    ? "bg-[rgb(163,255,18)] text-black"
                    : "bg-white/10 text-white/40"
                )}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Offer Creation Mode - Shows trading boards */}
        {mobileView === 'trading' && selectedTrader && isCreatingOffer && (
          <div className="fixed inset-0 z-50 bg-black md:hidden">
            {/* Header */}
            <div className="fixed top-0 left-0 right-0 z-10 bg-black border-b border-white/10 p-3">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setIsCreatingOffer(false);
                    // Clear boards
                    clearAllSelections();
                  }}
                  className="flex items-center gap-2 text-white"
                >
                  <X className="h-5 w-5" />
                  <span className="text-sm">Cancel</span>
                </button>
                <h3 className="text-white font-semibold">Create Offer</h3>
                <button
                  onClick={sendOffer}
                  disabled={!canSendOffer}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-medium",
                    canSendOffer
                      ? "bg-[rgb(163,255,18)] text-black"
                      : "bg-white/10 text-white/40"
                  )}
                >
                  Send
                </button>
              </div>
            </div>

            {/* Trading Boards */}
            <div className="pt-16 pb-4 px-4 h-full overflow-y-auto">
              <div className="space-y-4">
                {/* Your NFTs */}
                <div className="bg-black/40 rounded-xl p-4 border border-[rgb(163,255,18)]/20">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm text-white">Your Offer</span>
                    <button
                      onClick={() => setShowUserNFTSheet(true)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[rgb(163,255,18)]/10 rounded-full"
                    >
                      <Plus className="h-3.5 w-3.5 text-[rgb(163,255,18)]" />
                      <span className="text-xs text-[rgb(163,255,18)]">Add NFTs</span>
                    </button>
                  </div>

                  {userBoardNFTs.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {userBoardNFTs.map((nft) => (
                        <div key={nft.id} className="relative aspect-square">
                          <button
                            onClick={() => removeUserNFTFromBoard(nft.id)}
                            className="absolute top-1 right-1 z-10 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center"
                          >
                            <X className="h-2.5 w-2.5 text-white" />
                          </button>
                          <MediaRenderer
                            src={nft.image}
                            alt={nft.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-white/40 text-sm">No NFTs selected</p>
                    </div>
                  )}
                </div>

                {/* Their NFTs */}
                <div className="bg-black/40 rounded-xl p-4 border border-purple-500/20">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm text-white">Their Offer</span>
                    <button
                      onClick={() => setShowTraderNFTSheet(true)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-purple-500/10 rounded-full"
                    >
                      <Plus className="h-3.5 w-3.5 text-purple-400" />
                      <span className="text-xs text-purple-400">Add NFTs</span>
                    </button>
                  </div>

                  {traderBoardNFTs.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {traderBoardNFTs.map((nft) => (
                        <div key={nft.id} className="relative aspect-square">
                          <button
                            onClick={() => removeTraderNFTFromBoard(nft.id)}
                            className="absolute top-1 right-1 z-10 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center"
                          >
                            <X className="h-2.5 w-2.5 text-white" />
                          </button>
                          <MediaRenderer
                            src={nft.image}
                            alt={nft.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-white/40 text-sm">No NFTs selected</p>
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Add a message to your offer (optional)..."
                    className="w-full bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl resize-none"
                    rows={3}
                  />
                </div>

                {/* Fairness Indicator */}
                {fairnessScore > 0 && (
                  <div className="bg-black/40 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/60">Fairness Score</span>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "text-sm font-medium",
                          fairnessScore >= 80 ? "text-green-400" :
                          fairnessScore >= 60 ? "text-yellow-400" :
                          "text-red-400"
                        )}>
                          {fairnessScore}%
                        </div>
                        <TrendingUp className={cn(
                          "h-4 w-4",
                          fairnessScore >= 80 ? "text-green-400" :
                          fairnessScore >= 60 ? "text-yellow-400" :
                          "text-red-400"
                        )} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

    {/* Desktop Layout - Original */}
    <div className="hidden md:flex h-screen relative px-6 pt-20 pb-8 flex-col">
      {/* Main Trading Board Container */}
      <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden flex flex-col flex-1">
        {/* Header with Integrated Tab Controls and Actions */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <AnimatePresence mode="wait">
                {activeTab === 'trade' ? (
                  <motion.div
                    key="trade-info"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-4"
                  >
                    {/* Fairness Indicator */}
                    {fairnessScore > 0 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-full",
                          fairnessScore >= 80 ? "bg-green-500/20" :
                          fairnessScore >= 60 ? "bg-yellow-500/20" :
                          "bg-red-500/20"
                        )}
                      >
                        <TrendingUp className={cn(
                          "h-4 w-4",
                          fairnessScore >= 80 ? "text-green-400" :
                          fairnessScore >= 60 ? "text-yellow-400" :
                          "text-red-400"
                        )} />
                        <span className={cn(
                          "text-sm font-medium",
                          fairnessScore >= 80 ? "text-green-400" :
                          fairnessScore >= 60 ? "text-yellow-400" :
                          "text-red-400"
                        )}>
                          {fairnessScore}% Fair
                        </span>
                      </motion.div>
                    )}

                    {/* Value Comparison */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-white/60">You:</span>
                        <span className="text-[rgb(163,255,18)] font-mono font-medium">
                          {userTotal.toFixed(4)} ETH
                        </span>
                      </div>
                      <div className="w-px h-4 bg-white/20" />
                      <div className="flex items-center gap-2">
                        <span className="text-white/60">Them:</span>
                        <span className="text-purple-400 font-mono font-medium">
                          {traderTotal.toFixed(4)} ETH
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="history-filters"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-3"
                  >
                    {/* Quick Filters */}
                    <div className="flex gap-1 bg-black/60 rounded-full p-1 border border-white/10">
                      {(['all', 'active', 'completed'] as const).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setViewFilter(filter)}
                          className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium transition-all",
                            viewFilter === filter
                              ? "bg-white text-black shadow-lg"
                              : "text-white/60 hover:text-white"
                          )}
                        >
                          {filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </button>
                      ))}
                    </div>

                    {/* Search */}
                    <Input
                      placeholder="Search trades..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-48 h-8 bg-black/60 border-white/20 text-white text-xs placeholder:text-white/40"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Tab Controls */}
            <div className="flex items-center gap-2">
              {/* Tab Buttons */}
              <div className="flex gap-1 bg-black/60 rounded-full p-1 border border-white/10">
                <button
                  onClick={() => setActiveTab('trade')}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                    activeTab === 'trade'
                      ? "bg-[rgb(163,255,18)] text-black shadow-lg shadow-[rgb(163,255,18)]/30"
                      : "text-white/60 hover:text-white"
                  )}
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  Trade
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                    activeTab === 'history'
                      ? "bg-white text-black shadow-lg"
                      : "text-white/60 hover:text-white"
                  )}
                >
                  <History className="h-3.5 w-3.5" />
                  History
                  {loadedTrade && (
                    <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-300 text-xs rounded-full">
                      1
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'trade' ? (
              <motion.div
                key="trade"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* Trading Boards - Desktop Layout */}
                <div className="grid grid-cols-2 gap-8">
                  {/* Your Side */}
                  <div className="p-6 bg-black/20 rounded-xl border border-[rgb(163,255,18)]/10">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        <div className="w-2 h-2 bg-[rgb(163,255,18)] rounded-full" />
                        Your Offer
                      </h3>
                      <span className="text-xs text-[rgb(163,255,18)]/60">{userBoardNFTs.length}/6 items</span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 min-h-[200px]">
                      <AnimatePresence mode="popLayout">
                        {userBoardNFTs.map((nft) => (
                          <motion.div
                            key={`user-${nft.id}`}
                            layout
                            initial={{ opacity: 0, scale: 0.5, x: -200, rotateY: -90 }}
                            animate={{ opacity: 1, scale: 1, x: 0, rotateY: 0 }}
                            exit={{ opacity: 0, scale: 0.5, x: -200, rotateY: 90 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                            whileHover={{ scale: 1.05, z: 10 }}
                            className="relative group aspect-square"
                          >
                            <div className="relative h-full bg-black/40 rounded-lg overflow-hidden border border-white/10 hover:border-[rgb(163,255,18)]/50 transition-all">
                              {!isViewingHistory && (
                                <button
                                  onClick={() => removeUserNFTFromBoard(nft.id)}
                                  className="absolute top-1 right-1 z-10 w-5 h-5 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="h-3 w-3 text-white" />
                                </button>
                              )}
                              <MediaRenderer
                                src={nft.image}
                                alt={nft.name}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black to-transparent">
                                <p className="text-[10px] text-white truncate">{nft.name}</p>
                                <p className="text-[10px] text-[rgb(163,255,18)]/80 font-mono">
                                  {nft.value.toFixed(3)}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      {userBoardNFTs.length === 0 && (
                        <div className="col-span-3 flex items-center justify-center">
                          <div className="text-center">
                            <p className="text-white/40 text-xs">Select NFTs from sidebar</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Their Side */}
                  <div className="p-6 bg-black/20 rounded-xl border border-purple-500/10">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full" />
                        Their Offer
                      </h3>
                      <span className="text-xs text-purple-400/60">{traderBoardNFTs.length}/6 items</span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 min-h-[200px]">
                      <AnimatePresence mode="popLayout">
                        {traderBoardNFTs.map((nft) => (
                          <motion.div
                            key={`trader-${nft.id}`}
                            layout
                            initial={{ opacity: 0, scale: 0.5, x: 200, rotateY: 90 }}
                            animate={{ opacity: 1, scale: 1, x: 0, rotateY: 0 }}
                            exit={{ opacity: 0, scale: 0.5, x: 200, rotateY: -90 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                            whileHover={{ scale: 1.05, z: 10 }}
                            className="relative group aspect-square"
                          >
                            <div className="relative h-full bg-black/40 rounded-lg overflow-hidden border border-white/10 hover:border-purple-500/50 transition-all">
                              {!isViewingHistory && (
                                <button
                                  onClick={() => removeTraderNFTFromBoard(nft.id)}
                                  className="absolute top-1 right-1 z-10 w-5 h-5 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="h-3 w-3 text-white" />
                                </button>
                              )}
                              <MediaRenderer
                                src={nft.image}
                                alt={nft.name}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black to-transparent">
                                <p className="text-[10px] text-white truncate">{nft.name}</p>
                                <p className="text-[10px] text-purple-400/80 font-mono">
                                  {nft.value.toFixed(3)}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      {traderBoardNFTs.length === 0 && (
                        <div className="col-span-3 flex items-center justify-center">
                          <div className="text-center">
                            <p className="text-white/40 text-xs">Trader's NFTs</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="history"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <IntegratedTradeHistory
                  key={refreshHistoryKey}
                  searchQuery={searchQuery}
                  viewFilter={viewFilter}
                  onTradeSelect={(trade) => {
                    setSelectedTradeId(trade.id);
                  }}
                  onLoadTrade={(trade) => {
                    loadTradeIntoBoard(trade);
                    setActiveTab('trade');
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop Message Input Footer */}
        {activeTab === 'trade' && (
          <div className="p-6 border-t border-white/10 bg-black/60">
            {selectedTrader && (
              <div className="mb-3">
                <p className="text-xs text-white/60">Trading with <span className="text-white font-medium">{selectedTrader.name}</span></p>
              </div>
            )}
            <div className="flex items-stretch gap-3">
              <div className="flex-1">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a message to your trade offer (optional)..."
                  className="w-full bg-black/40 border-white/20 text-white placeholder:text-white/40 resize-none"
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && canSendOffer) {
                      e.preventDefault();
                      sendOffer();
                    }
                  }}
                />
                {message.length > 0 && (
                  <p className="mt-1 text-xs text-white/40">{message.length} characters</p>
                )}
              </div>
              {/* Send Offer Button */}
              <Button
                onClick={sendOffer}
                disabled={!canSendOffer}
                className={cn(
                  "self-stretch px-6 transition-all min-w-[140px]",
                  canSendOffer
                    ? "bg-gradient-to-r from-[rgb(163,255,18)] to-green-500 text-black hover:shadow-lg hover:shadow-[rgb(163,255,18)]/30"
                    : "bg-white/10 text-white/40"
                )}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {activeTradeId ? 'Send Counter-Offer' : 'Send Offer'}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>

      {/* Alerts and Tips - Below Board - Commented out for now */}
      {/* {activeTab === 'trade' && (
        <div className="mt-6 space-y-3">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-3"
              >
                <AlertCircle className="h-5 w-5 text-red-400" />
                <span className="text-sm text-red-400 flex-1">{error}</span>
                <button onClick={() => setError(null)}>
                  <X className="h-4 w-4 text-red-400 hover:text-red-300" />
                </button>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center gap-3"
              >
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                <span className="text-sm text-green-400 flex-1">{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {userBoardNFTs.length === 0 && traderBoardNFTs.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl"
            >
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-400 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-400 mb-1">Getting Started</h4>
                  <p className="text-xs text-white/60">
                    Select NFTs from the sidebar to start building your trade. Both sides need items for a fair trade.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {fairnessScore > 0 && fairnessScore < 60 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-400 mb-1">Unbalanced Trade</h4>
                  <p className="text-xs text-white/60">
                    This trade has a low fairness score. Consider adjusting the items to make it more balanced.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )} */}

      {/* Trade Detail Modal */}
      <AnimatePresence>
        {selectedTradeId && (
          <TradeDetailModal
            tradeId={selectedTradeId}
            isOpen={true}
            onClose={() => setSelectedTradeId(null)}
            onTradeUpdate={() => {
              setRefreshHistoryKey(prev => prev + 1);
            }}
            onCounterOffer={(trade) => {
              loadTradeIntoBoard(trade);
              setActiveTab('trade');
              setSelectedTradeId(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Mobile New Trade Sheet (like New Chat) */}
      <AnimatePresence>
        {showNewTradeSheet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowNewTradeSheet(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 bg-black rounded-t-3xl border-t border-white/10 max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sheet Header */}
              <div className="sticky top-0 z-10 bg-black border-b border-white/10">
                <div className="flex items-center justify-between p-4">
                  <h3 className="text-white font-semibold text-lg">Start New Trade</h3>
                  <button
                    onClick={() => setShowNewTradeSheet(false)}
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
                {/* Search Bar */}
                <div className="px-4 pb-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <Input
                      value={contactSearchQuery}
                      onChange={(e) => setContactSearchQuery(e.target.value)}
                      placeholder="Search traders..."
                      className="w-full pl-10 h-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                  </div>
                </div>
              </div>

              {/* Traders List */}
              <div className="overflow-y-auto max-h-[calc(80vh-140px)]">
                {isLoadingTraders ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 text-white/40 animate-spin" />
                  </div>
                ) : (
                  <div className="px-2 py-2">
                    <div className="px-3 py-2">
                      <p className="text-xs text-white/40 uppercase tracking-wider">Suggested Traders</p>
                    </div>
                    {traders
                      .filter(trader =>
                        trader.name.toLowerCase().includes(contactSearchQuery.toLowerCase()) ||
                        trader.username?.toLowerCase().includes(contactSearchQuery.toLowerCase())
                      )
                      .map(trader => (
                        <button
                          key={trader.id}
                          onClick={() => {
                            selectTrader(trader);
                            setShowNewTradeSheet(false);
                            setMobileView('trading');
                          }}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all"
                        >
                          {/* Avatar */}
                          <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
                              {trader.avatar ? (
                                <MediaRenderer
                                  src={trader.avatar}
                                  alt={trader.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-white font-bold text-lg">
                                  {trader.name.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            {trader.isOnline && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2">
                              <p className="text-white font-medium text-sm">{trader.name}</p>
                              {trader.tier === 'DIAMOND' && <Sparkles className="h-3 w-3 text-cyan-400" />}
                              {trader.tier === 'GOLD' && <Star className="h-3 w-3 text-yellow-400" />}
                            </div>
                            <p className="text-white/40 text-xs">
                              {trader.trades} trades • {trader.successRate}% success
                            </p>
                          </div>

                          {/* Rating */}
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                            <span className="text-white/60 text-xs">{trader.rating.toFixed(1)}</span>
                          </div>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Contact List Sheet */}
      <AnimatePresence>
        {showContactList && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowContactList(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 bg-black rounded-t-3xl border-t border-white/10 max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sheet Header */}
              <div className="sticky top-0 z-10 bg-black border-b border-white/10">
                <div className="flex items-center justify-between p-4">
                  <h3 className="text-white font-semibold text-lg">Select Trading Partner</h3>
                  <button
                    onClick={() => setShowContactList(false)}
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
                {/* Search Bar */}
                <div className="px-4 pb-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <Input
                      value={contactSearchQuery}
                      onChange={(e) => setContactSearchQuery(e.target.value)}
                      placeholder="Search traders..."
                      className="w-full pl-10 h-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                  </div>
                </div>
              </div>

              {/* Contact List */}
              <div className="overflow-y-auto max-h-[calc(80vh-140px)]">
                {isLoadingTraders ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 text-white/40 animate-spin" />
                  </div>
                ) : (
                  <div className="px-2 py-2">
                    {traders
                      .filter(trader =>
                        trader.name.toLowerCase().includes(contactSearchQuery.toLowerCase()) ||
                        trader.username?.toLowerCase().includes(contactSearchQuery.toLowerCase())
                      )
                      .map(trader => (
                        <button
                          key={trader.id}
                          onClick={() => {
                            selectTrader(trader);
                            setShowContactList(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-xl transition-all",
                            selectedTrader?.id === trader.id
                              ? "bg-[rgb(163,255,18)]/10 border border-[rgb(163,255,18)]/30"
                              : "hover:bg-white/5"
                          )}
                        >
                          {/* Avatar */}
                          <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
                              {trader.avatar ? (
                                <MediaRenderer
                                  src={trader.avatar}
                                  alt={trader.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-white font-bold text-lg">
                                  {trader.name.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            {trader.isOnline && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2">
                              <p className="text-white font-medium text-sm">{trader.name}</p>
                              {trader.tier === 'DIAMOND' && <Sparkles className="h-3 w-3 text-cyan-400" />}
                              {trader.tier === 'GOLD' && <Star className="h-3 w-3 text-yellow-400" />}
                            </div>
                            <p className="text-white/40 text-xs">
                              {trader.trades} trades • {trader.successRate}% success
                            </p>
                          </div>

                          {/* Rating */}
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                            <span className="text-white/60 text-xs">{trader.rating.toFixed(1)}</span>
                          </div>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile User NFT Selection Sheet */}
      <AnimatePresence>
        {showUserNFTSheet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowUserNFTSheet(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 bg-black rounded-t-3xl border-t border-white/10 max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sheet Header */}
              <div className="sticky top-0 z-10 bg-black border-b border-white/10 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-semibold text-lg">Your NFTs</h3>
                  <button
                    onClick={() => setShowUserNFTSheet(false)}
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
                <p className="text-xs text-white/60">Select up to {6 - userBoardNFTs.length} more NFTs</p>
              </div>

              {/* NFT Grid */}
              <div className="overflow-y-auto max-h-[calc(80vh-100px)] p-4">
                <div className="grid grid-cols-3 gap-3">
                  {userNFTs.map((nft) => (
                    <button
                      key={nft.id}
                      onClick={() => {
                        toggleUserNFTSelection(nft.id);
                        if (userBoardNFTs.length < 5) {
                          // Don't close if we can add more
                        } else {
                          setShowUserNFTSheet(false);
                        }
                      }}
                      disabled={userBoardNFTs.length >= 6}
                      className={cn(
                        "relative aspect-square rounded-lg overflow-hidden border-2 transition-all",
                        userBoardNFTs.length >= 6
                          ? "opacity-50 border-white/10"
                          : "border-[rgb(163,255,18)]/30 hover:border-[rgb(163,255,18)]"
                      )}
                    >
                      <MediaRenderer
                        src={nft.image}
                        alt={nft.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent">
                        <p className="text-[10px] text-white truncate">{nft.name}</p>
                        <p className="text-[9px] text-[rgb(163,255,18)]/80">{nft.value.toFixed(2)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Trader NFT Selection Sheet */}
      <AnimatePresence>
        {showTraderNFTSheet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowTraderNFTSheet(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 bg-black rounded-t-3xl border-t border-white/10 max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sheet Header */}
              <div className="sticky top-0 z-10 bg-black border-b border-white/10 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-semibold text-lg">
                    {selectedTrader ? `${selectedTrader.name}'s NFTs` : 'Partner NFTs'}
                  </h3>
                  <button
                    onClick={() => setShowTraderNFTSheet(false)}
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
                <p className="text-xs text-white/60">Select up to {6 - traderBoardNFTs.length} more NFTs</p>
              </div>

              {/* NFT Grid */}
              <div className="overflow-y-auto max-h-[calc(80vh-100px)] p-4">
                {isLoadingTraderNFTs ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 text-white/40 animate-spin" />
                  </div>
                ) : traderNFTs.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {traderNFTs.map((nft) => (
                      <button
                        key={nft.id}
                        onClick={() => {
                          toggleTraderNFTSelection(nft.id);
                          if (traderBoardNFTs.length < 5) {
                            // Don't close if we can add more
                          } else {
                            setShowTraderNFTSheet(false);
                          }
                        }}
                        disabled={traderBoardNFTs.length >= 6}
                        className={cn(
                          "relative aspect-square rounded-lg overflow-hidden border-2 transition-all",
                          traderBoardNFTs.length >= 6
                            ? "opacity-50 border-white/10"
                            : "border-purple-500/30 hover:border-purple-500"
                        )}
                      >
                        <MediaRenderer
                          src={nft.image}
                          alt={nft.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent">
                          <p className="text-[10px] text-white truncate">{nft.name}</p>
                          <p className="text-[9px] text-purple-400/80">{nft.value.toFixed(2)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-white/40 text-sm">No NFTs available</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Trade History Sheet */}
      <AnimatePresence>
        {showTradeHistory && selectedTrader && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowTradeHistory(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 bg-black rounded-t-3xl border-t border-white/10 max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sheet Header */}
              <div className="sticky top-0 z-10 bg-black border-b border-white/10 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-semibold text-lg">
                    Trade History with {selectedTrader.name}
                  </h3>
                  <button
                    onClick={() => setShowTradeHistory(false)}
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
                {/* Filter Pills */}
                <div className="flex gap-2 mt-3">
                  {(['all', 'active', 'completed'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setViewFilter(filter)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                        viewFilter === filter
                          ? "bg-[rgb(163,255,18)] text-black"
                          : "bg-white/10 text-white/60"
                      )}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trade History Content */}
              <div className="overflow-y-auto max-h-[calc(90vh-100px)] p-4">
                <IntegratedTradeHistory
                  key={refreshHistoryKey}
                  searchQuery=""
                  viewFilter={viewFilter}
                  onTradeSelect={(trade) => {
                    setSelectedTradeId(trade.id);
                    setShowTradeHistory(false);
                  }}
                  onLoadTrade={(trade) => {
                    loadTradeIntoBoard(trade);
                    setShowTradeHistory(false);
                    setIsCreatingOffer(true);
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}