"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageSquare,
  Zap,
  Shield,
  ExternalLink,
  Copy,
  Send,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useWalletAuthOptimized } from "@/hooks/use-wallet-auth-optimized";
import { MediaRenderer } from "@/components/media-renderer";

interface TradeDetail {
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
  messages: Array<{
    id: string;
    message: string;
    messageType: string;
    createdAt: string;
    user: {
      username: string;
      profilePicture: string;
    };
  }>;
  history: Array<{
    id: string;
    action: string;
    oldStatus: string;
    newStatus: string;
    createdAt: string;
    user: {
      username: string;
    };
    metadata?: any;
  }>;
  fairnessScore: number;
  createdAt: string;
  updatedAt: string;
  agreedAt?: string;
  escrowAddress?: string;
  finalizedAt?: string;
  canceledAt?: string;
}

interface TradeDetailModalProps {
  tradeId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onTradeUpdate?: (trade: TradeDetail) => void;
  onCounterOffer?: (trade: TradeDetail) => void;
}

export function TradeDetailModal({
  tradeId,
  isOpen,
  onClose,
  onTradeUpdate,
  onCounterOffer
}: TradeDetailModalProps) {
  const { user } = useWalletAuthOptimized();
  const address = user?.walletAddress;
  const [trade, setTrade] = useState<TradeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isUpdatingTrade, setIsUpdatingTrade] = useState(false);
  const [isCounterMode, setIsCounterMode] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(-1); // -1 means showing current state

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

  const fetchTrade = async () => {
    if (!tradeId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/p2p/trades/${tradeId}`);
      const data = await response.json();

      if (data.success) {
        setTrade(data.data);
      } else {
        setError(data.error || 'Failed to fetch trade details');
      }
    } catch (error) {
      console.error('Error fetching trade:', error);
      setError('Failed to fetch trade details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && tradeId) {
      fetchTrade();
    }
  }, [isOpen, tradeId]);

  const sendMessage = async () => {
    if (!tradeId || !message.trim()) return;

    setIsSendingMessage(true);
    try {
      const response = await fetch(`/api/p2p/trades/${tradeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'message',
          userAddress: address,
          message: message.trim()
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage("");
        fetchTrade(); // Refresh trade data
      } else {
        setError(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const updateTradeStatus = async (action: string) => {
    if (!tradeId) return;

    setIsUpdatingTrade(true);
    try {
      const response = await fetch(`/api/p2p/trades/${tradeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          userAddress: address
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        fetchTrade(); // Refresh trade data
        onTradeUpdate?.(data.data);
      } else {
        setError(data.error || `Failed to ${action} trade`);
      }
    } catch (error) {
      console.error(`Error ${action} trade:`, error);
      setError(`Failed to ${action} trade`);
    } finally {
      setIsUpdatingTrade(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

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

  const isInitiator = trade?.initiator.walletAddress === address;
  const otherParty = isInitiator ? trade?.counterparty : trade?.initiator;

  // Get items to display based on history index
  const getDisplayItems = () => {
    if (!trade) return [];

    // If viewing current state
    if (historyIndex === -1) {
      return trade.items;
    }

    // Get items from history
    const historyEntry = trade.history[historyIndex];
    if (historyEntry?.metadata && 'items' in historyEntry.metadata) {
      return (historyEntry.metadata as any).items || [];
    }

    // Fallback to current items
    return trade.items;
  };

  const displayItems = getDisplayItems();
  const canNavigateBack = historyIndex < (trade?.history.length || 0) - 1;
  const canNavigateForward = historyIndex > -1;

  const navigateHistory = (direction: 'back' | 'forward') => {
    if (!trade) return;

    if (direction === 'back' && canNavigateBack) {
      setHistoryIndex(historyIndex + 1);
    } else if (direction === 'forward' && canNavigateForward) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  // Reset history index when trade changes
  useEffect(() => {
    setHistoryIndex(-1);
  }, [tradeId]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-gray-900 border border-white/20 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Trade Details</h2>
                <p className="text-sm text-white/60">
                  {isInitiator ? 'Trading with' : 'Trading from'} {otherParty?.username || 'Unknown'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white/60 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                  <p className="text-sm text-white/60">Loading trade details...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <AlertCircle className="h-12 w-12 text-red-400" />
                <div className="text-center">
                  <p className="text-lg font-medium text-white mb-2">Failed to load trade</p>
                  <p className="text-sm text-white/60 mb-4">{error}</p>
                  <Button onClick={fetchTrade} variant="outline">
                    Try Again
                  </Button>
                </div>
              </div>
            ) : trade ? (
              <div className="space-y-6">
                {/* Trade Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(trade.status)}>
                      {React.createElement(getStatusIcon(trade.status), { className: "h-3 w-3 mr-1" })}
                      {getStatusLabel(trade.status)}
                    </Badge>
                    <span className="text-sm text-white/60">
                      Created {formatDate(trade.createdAt)}
                    </span>
                  </div>
                  {trade.escrowAddress && (
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-purple-400" />
                      <span className="text-sm text-white/60">Escrow Deployed</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(trade.escrowAddress!)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* History Navigation */}
                {trade.history.length > 0 && (
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-400" />
                      <span className="text-sm text-white">
                        {historyIndex === -1 ? 'Current State' : `Version ${trade.history.length - historyIndex} of ${trade.history.length + 1}`}
                      </span>
                      {historyIndex !== -1 && trade.history[historyIndex] && (
                        <span className="text-xs text-white/60">
                          - {formatDate(trade.history[historyIndex].createdAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigateHistory('back')}
                        disabled={!canNavigateBack}
                        className="border-white/20"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigateHistory('forward')}
                        disabled={!canNavigateForward}
                        className="border-white/20"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Trade Items */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Trade Items</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Initiator Items */}
                    <div>
                      <h4 className="text-sm font-medium text-white/80 mb-3">
                        {trade.initiator.username}'s Items
                      </h4>
                      <div className="space-y-2">
                        {displayItems
                          .filter((item: any) => item.side === 'INITIATOR')
                          .map((item: any, idx: number) => {
                            // Handle both current items (with nft object) and historical items (with metadata)
                            const nftData = item.nft || item.metadata;
                            const imageSrc = item.nft?.image || item.metadata?.image || '';
                            const nftName = item.nft?.name || item.metadata?.name || 'Unknown NFT';
                            const collectionName = item.nft?.collection?.name || item.metadata?.collectionName || '';

                            return (
                              <div key={item.id || `hist-${idx}`} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                                <MediaRenderer
                                  src={imageSrc}
                                  alt={nftName}
                                  className="w-12 h-12 rounded-lg object-cover"
                                />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-white">{nftName}</p>
                                  {collectionName && <p className="text-xs text-white/60">{collectionName}</p>}
                                </div>
                                <span className="text-sm font-medium text-white">
                                  {item.tokenAmount?.toFixed(6) || '0.000000'} ETH
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* Counterparty Items */}
                    <div>
                      <h4 className="text-sm font-medium text-white/80 mb-3">
                        {trade.counterparty.username}'s Items
                      </h4>
                      <div className="space-y-2">
                        {displayItems
                          .filter((item: any) => item.side === 'COUNTERPARTY')
                          .map((item: any, idx: number) => {
                            // Handle both current items (with nft object) and historical items (with metadata)
                            const nftData = item.nft || item.metadata;
                            const imageSrc = item.nft?.image || item.metadata?.image || '';
                            const nftName = item.nft?.name || item.metadata?.name || 'Unknown NFT';
                            const collectionName = item.nft?.collection?.name || item.metadata?.collectionName || '';

                            return (
                              <div key={item.id || `hist-cp-${idx}`} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                                <MediaRenderer
                                  src={imageSrc}
                                  alt={nftName}
                                  className="w-12 h-12 rounded-lg object-cover"
                                />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-white">{nftName}</p>
                                  {collectionName && <p className="text-xs text-white/60">{collectionName}</p>}
                                </div>
                                <span className="text-sm font-medium text-white">
                                  {item.tokenAmount?.toFixed(6) || '0.000000'} ETH
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Counter Offer Mode */}
                {isCounterMode && (
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-yellow-400" />
                        <h3 className="text-lg font-semibold text-white">Counter Offer Mode</h3>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsCounterMode(false)}
                        className="text-white/60 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-white/80 mb-4">
                      Send a message below to negotiate terms, or go to the Trade Board to create a formal counter-offer with adjusted items.
                    </p>
                    <p className="text-xs text-white/60 mb-4">
                      Tip: Use the message feature to discuss changes before formally countering.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          if (trade && onCounterOffer) {
                            onCounterOffer(trade);
                          }
                        }}
                        className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                      >
                        Go to Trade Board
                      </Button>
                      <Button
                        onClick={() => setIsCounterMode(false)}
                        variant="outline"
                        className="flex-1"
                      >
                        Continue Negotiating
                      </Button>
                    </div>
                  </div>
                )}

                {/* Trade Actions */}
                {!isCounterMode && ['PENDING', 'COUNTERED'].includes(trade.status) && (
                  <div className="flex gap-3">
                    {/* If you're the initiator, you can only cancel your offer */}
                    {isInitiator ? (
                      <Button
                        onClick={() => updateTradeStatus('cancel')}
                        disabled={isUpdatingTrade}
                        variant="outline"
                        className="flex-1 border-red-500 text-red-400 hover:bg-red-500/10"
                      >
                        {isUpdatingTrade ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-2" />
                        )}
                        Cancel Offer
                      </Button>
                    ) : (
                      /* If you're the counterparty, you can accept, counter, or reject */
                      <>
                        <Button
                          onClick={() => updateTradeStatus('accept')}
                          disabled={isUpdatingTrade}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          {isUpdatingTrade ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <ThumbsUp className="h-4 w-4 mr-2" />
                          )}
                          Accept Offer
                        </Button>
                        <Button
                          onClick={() => setIsCounterMode(true)}
                          disabled={isUpdatingTrade}
                          variant="outline"
                          className="flex-1 border-yellow-500 text-yellow-400 hover:bg-yellow-500/10"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Counter Offer
                        </Button>
                        <Button
                          onClick={() => updateTradeStatus('reject')}
                          disabled={isUpdatingTrade}
                          variant="outline"
                          className="flex-1 border-red-500 text-red-400 hover:bg-red-500/10"
                        >
                          {isUpdatingTrade ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <ThumbsDown className="h-4 w-4 mr-2" />
                          )}
                          Reject Offer
                        </Button>
                      </>
                    )}
                  </div>
                )}

                {/* Messages */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Messages</h3>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {trade.messages.map((msg) => (
                      <div key={msg.id} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                        <MediaRenderer
                          src={msg.user.profilePicture || 'https://via.placeholder.com/32x32/333/fff?text=U'}
                          alt={msg.user.username}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-white">{msg.user.username}</span>
                            <span className="text-xs text-white/60">{formatDate(msg.createdAt)}</span>
                          </div>
                          <p className="text-sm text-white/80">{msg.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="mt-4 flex gap-2">
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 bg-white/5 border-white/20 text-white placeholder:text-white/40"
                      rows={2}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!message.trim() || isSendingMessage}
                      size="sm"
                    >
                      {isSendingMessage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
