"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRightLeft,
  CheckCircle2,
  X,
  Send,
  Save,
  AlertCircle,
  Loader2,
  Zap,
  Shield,
  Clock,
  TrendingUp,
  Users,
  Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useP2PTrading } from "@/contexts/p2p-trading-context";
import { useWalletAuthOptimized } from "@/hooks/use-wallet-auth-optimized";
import { MediaRenderer } from "@/components/media-renderer";

interface EnhancedTradeConstructorProps {
  onTradeCreated?: (tradeId: string) => void;
  onTradeUpdated?: (tradeId: string) => void;
}

export function EnhancedTradeConstructor({
  onTradeCreated,
  onTradeUpdated
}: EnhancedTradeConstructorProps) {
  const { user } = useWalletAuthOptimized();
  const address = user?.walletAddress;
  const {
    userBoardNFTs,
    traderBoardNFTs,
    selectedTrader,
    clearAllSelections,
    activeTradeId,
    clearActiveTradeId,
    isViewingHistory
  } = useP2PTrading();

  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  // Helper function to extract real NFT ID from synthetic ID
  const extractRealNFTId = (id: string): string => {
    // If ID starts with "user-" or "trader-", extract the real ID
    // Format: "user-{realId}-{index}" or "trader-{realId}-{index}"
    if (id.startsWith('user-') || id.startsWith('trader-')) {
      const parts = id.split('-');
      // Remove first part (user/trader) and last part (index), join the rest
      return parts.slice(1, -1).join('-');
    }
    return id;
  };

  // Auto-save draft functionality - disabled when viewing history
  useEffect(() => {
    // Don't auto-save when viewing history or when IDs are synthetic (from history navigation)
    if (isViewingHistory) return;

    // Check if any NFT has a synthetic ID (starts with "user-" or "trader-")
    const hasSyntheticIds = userBoardNFTs.some(nft => nft.id.startsWith('user-') || nft.id.startsWith('trader-')) ||
                            traderBoardNFTs.some(nft => nft.id.startsWith('user-') || nft.id.startsWith('trader-'));

    if (hasSyntheticIds) return;

    if (userBoardNFTs.length > 0 || traderBoardNFTs.length > 0) {
      const timeoutId = setTimeout(() => {
        saveDraft();
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [userBoardNFTs, traderBoardNFTs, isViewingHistory]);

  const saveDraft = async () => {
    if (!address || !selectedTrader) return;

    // Don't save draft when viewing history
    if (isViewingHistory) return;

    // Don't save draft if using synthetic history IDs
    const hasSyntheticIds = userBoardNFTs.some(nft => nft.id.startsWith('user-') || nft.id.startsWith('trader-')) ||
                            traderBoardNFTs.some(nft => nft.id.startsWith('user-') || nft.id.startsWith('trader-'));
    if (hasSyntheticIds) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/p2p/trades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          initiatorAddress: address,
          counterpartyAddress: selectedTrader.walletAddress,
          initiatorItems: userBoardNFTs.map(nft => ({
            nftId: extractRealNFTId(nft.id),
            side: 'INITIATOR',
            tokenAmount: nft.value,
            metadata: {
              name: nft.name,
              image: nft.image,
              rarity: nft.rarity
            }
          })),
          counterpartyItems: traderBoardNFTs.map(nft => ({
            nftId: extractRealNFTId(nft.id),
            side: 'COUNTERPARTY',
            tokenAmount: nft.value,
            metadata: {
              name: nft.name,
              image: nft.image,
              rarity: nft.rarity
            }
          })),
          metadata: {
            message,
            fairnessScore,
            createdAt: new Date().toISOString()
          }
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Draft saved successfully');
        setTimeout(() => setSuccess(null), 3000);
        onTradeCreated?.(data.data.id);
      } else {
        setError(data.error || 'Failed to save draft');
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      setError('Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  };

  const sendOffer = async () => {
    if (!address || !selectedTrader) return;

    setIsCreating(true);
    setError(null);
    setSuccess(null);

    try {
      // If we have an activeTradeId, this is a counter-offer - update the existing trade
      if (activeTradeId) {
        const response = await fetch(`/api/p2p/trades/${activeTradeId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'counteroffer',
            userAddress: address,
            items: [
              ...userBoardNFTs.map(nft => ({
                nftId: extractRealNFTId(nft.id),
                side: 'INITIATOR',
                tokenAmount: nft.value,
                tokenAddress: null,
                metadata: {
                  name: nft.name,
                  image: nft.image,
                  rarity: nft.rarity
                }
              })),
              ...traderBoardNFTs.map(nft => ({
                nftId: extractRealNFTId(nft.id),
                side: 'COUNTERPARTY',
                tokenAmount: nft.value,
                tokenAddress: null,
                metadata: {
                  name: nft.name,
                  image: nft.image,
                  rarity: nft.rarity
                }
              }))
            ],
            message
          }),
        });

        const data = await response.json();

        if (data.success) {
          setSuccess('Counter-offer sent successfully!');
          clearAllSelections();
          setMessage("");
          clearActiveTradeId();
          onTradeUpdated?.(data.data.id);
          setTimeout(() => setSuccess(null), 5000);
        } else {
          setError(data.error || 'Failed to send counter-offer');
        }
      } else {
        // Create a new trade offer
        const response = await fetch('/api/p2p/trades', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            initiatorAddress: address,
            counterpartyAddress: selectedTrader.walletAddress,
            initiatorItems: userBoardNFTs.map(nft => ({
              nftId: extractRealNFTId(nft.id),
              side: 'INITIATOR',
              tokenAmount: nft.value,
              metadata: {
                name: nft.name,
                image: nft.image,
                rarity: nft.rarity
              }
            })),
            counterpartyItems: traderBoardNFTs.map(nft => ({
              nftId: extractRealNFTId(nft.id),
              side: 'COUNTERPARTY',
              tokenAmount: nft.value,
              metadata: {
                name: nft.name,
                image: nft.image,
                rarity: nft.rarity
              }
            })),
            metadata: {
              message,
              fairnessScore,
              createdAt: new Date().toISOString()
            }
          }),
        });

        const data = await response.json();

        if (data.success) {
          setSuccess('Trade offer sent successfully!');
          clearAllSelections();
          setMessage("");
          onTradeCreated?.(data.data.id);
          setTimeout(() => setSuccess(null), 5000);
        } else {
          setError(data.error || 'Failed to send trade offer');
        }
      }
    } catch (error) {
      console.error('Error sending offer:', error);
      setError('Failed to send trade offer');
    } finally {
      setIsCreating(false);
    }
  };

  const canSendOffer = userBoardNFTs.length > 0 && selectedTrader && !isCreating && !isViewingHistory;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto p-6"
    >
      <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/20 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <ArrowRightLeft className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Trade Constructor</h2>
              <p className="text-sm text-white/60">
                {selectedTrader ? `Trading with ${selectedTrader.name}` : 'Select a trader to start'}
              </p>
            </div>
          </div>
          
          {fairnessScore > 0 && (
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <span className="text-sm font-medium text-green-400">
                {fairnessScore}% Fair
              </span>
            </div>
          )}
        </div>

        {/* Error/Success Messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2"
            >
              <AlertCircle className="h-4 w-4 text-red-400" />
              <span className="text-sm text-red-400">{error}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-300"
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <span className="text-sm text-green-400">{success}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSuccess(null)}
                className="ml-auto text-green-400 hover:text-green-300"
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trade Items Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Your NFTs */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-4 w-4 text-blue-400" />
              <h3 className="font-semibold text-white">Your NFTs ({userBoardNFTs.length})</h3>
            </div>
            <div className="space-y-2">
              {userBoardNFTs.length === 0 ? (
                <div className="text-center py-8 text-white/40">
                  <Package className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">No NFTs selected</p>
                </div>
              ) : (
                userBoardNFTs.map((nft) => (
                  <div
                    key={nft.id}
                    className="flex items-center gap-3 p-3 bg-white/5 rounded-lg"
                  >
                    <MediaRenderer
                      src={nft.image}
                      alt={nft.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white truncate">{nft.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/60">{nft.value.toFixed(6)} ETH</span>
                        <Badge className="text-[10px] bg-purple-500/20 text-purple-400">
                          {nft.rarity}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Trader's NFTs */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-4 w-4 text-green-400" />
              <h3 className="font-semibold text-white">
                {selectedTrader?.name || 'Trader'}'s NFTs ({traderBoardNFTs.length})
              </h3>
            </div>
            <div className="space-y-2">
              {traderBoardNFTs.length === 0 ? (
                <div className="text-center py-8 text-white/40">
                  <Package className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">No NFTs selected</p>
                </div>
              ) : (
                traderBoardNFTs.map((nft) => (
                  <div
                    key={nft.id}
                    className="flex items-center gap-3 p-3 bg-white/5 rounded-lg"
                  >
                    <MediaRenderer
                      src={nft.image}
                      alt={nft.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white truncate">{nft.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/60">{nft.value.toFixed(6)} ETH</span>
                        <Badge className="text-[10px] bg-purple-500/20 text-purple-400">
                          {nft.rarity}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Trade Summary */}
        <div className="bg-white/5 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-white mb-3">Trade Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-white/60">Your Total Value</p>
              <p className="text-lg font-bold text-blue-400">
                {userBoardNFTs.reduce((sum, nft) => sum + nft.value, 0).toFixed(6)} ETH
              </p>
            </div>
            <div>
              <p className="text-sm text-white/60">Trader's Total Value</p>
              <p className="text-lg font-bold text-green-400">
                {traderBoardNFTs.reduce((sum, nft) => sum + nft.value, 0).toFixed(6)} ETH
              </p>
            </div>
          </div>
          
          {fairnessScore > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">Fairness Score</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-white/10 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        fairnessScore >= 80 ? 'bg-green-400' :
                        fairnessScore >= 60 ? 'bg-yellow-400' :
                        'bg-red-400'
                      }`}
                      style={{ width: `${fairnessScore}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-white">{fairnessScore}%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white/80 mb-2">
            Message (Optional)
          </label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a message to your trade offer..."
            className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
            rows={3}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={sendOffer}
            disabled={!canSendOffer}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {activeTradeId ? 'Sending Counter-Offer...' : 'Sending Offer...'}
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {activeTradeId ? 'Send Counter-Offer' : 'Send Trade Offer'}
              </>
            )}
          </Button>

          <Button
            onClick={saveDraft}
            disabled={!selectedTrader || isSaving || isViewingHistory}
            variant="outline"
            className="border-white/20 text-white/70 hover:bg-white/10"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </>
            )}
          </Button>
        </div>

        {/* Trade Tips */}
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-400 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-400 mb-2">Trade Tips</h4>
              <ul className="text-xs text-white/60 space-y-1">
                <li>• Higher fairness scores indicate more balanced trades</li>
                <li>• Add a message to explain your trade reasoning</li>
                <li>• Both parties must agree before assets are locked in escrow</li>
                <li>• You can save drafts and continue later</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
