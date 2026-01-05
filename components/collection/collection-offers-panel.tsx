'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useActiveAccount } from 'thirdweb/react';
import { cancelNftOffer, MARKETPLACE_CHAIN_ID } from '@/lib/marketplace';
import {
  Loader2,
  Layers,
  Clock,
  User,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface CollectionOffer {
  id: string;
  offerId: string;
  offerorAddress: string;
  offerAmount: number;
  quantity: number;
  expirationTimestamp: string;
  createdAt: string;
  status: string;
  offeror?: {
    walletAddress: string;
    username?: string | null;
    profilePicture?: string | null;
  } | null;
}

interface CollectionOffersPanelProps {
  collectionId: string;
  assetContractAddress: string;
  className?: string;
  onOfferAccepted?: () => void;
}

export function CollectionOffersPanel({
  collectionId,
  assetContractAddress,
  className,
  onOfferAccepted,
}: CollectionOffersPanelProps) {
  const { toast } = useToast();
  const account = useActiveAccount();
  const [offers, setOffers] = useState<CollectionOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchOffers = async () => {
    try {
      const response = await fetch(
        `/api/marketplace/collection-offers?collectionId=${collectionId}&status=ACTIVE`
      );
      if (response.ok) {
        const data = await response.json();
        setOffers(data.offers || []);
      }
    } catch (error) {
      console.error('Error fetching collection offers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
    // Refresh every 30 seconds
    const interval = setInterval(fetchOffers, 30000);
    return () => clearInterval(interval);
  }, [collectionId]);

  const handleCancelOffer = async (offer: CollectionOffer) => {
    if (!account) return;

    setCancellingId(offer.offerId);

    try {
      // Cancel on-chain
      await cancelNftOffer(offer.offerId, account);

      // Update in database
      await fetch(
        `/api/marketplace/collection-offers?offerId=${offer.offerId}`,
        { method: 'DELETE' }
      );

      toast({ title: 'Offer cancelled successfully' });
      fetchOffers();
    } catch (error: any) {
      console.error('Error cancelling offer:', error);
      toast({
        title: 'Failed to cancel offer',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setCancellingId(null);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const bestOffer = offers.length > 0 ? offers[0] : null;

  if (isLoading) {
    return (
      <div className={cn('p-4 bg-white/5 rounded-xl', className)}>
        <div className="flex items-center gap-2 text-white/60">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading offers...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white/5 rounded-xl overflow-hidden', className)}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5 text-[rgb(163,255,18)]" />
          <span className="font-medium text-white">Collection Offers</span>
          {offers.length > 0 && (
            <Badge className="bg-[rgb(163,255,18)]/20 text-[rgb(163,255,18)] border-0">
              {offers.length}
            </Badge>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-white/40" />
        ) : (
          <ChevronDown className="w-5 h-5 text-white/40" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {offers.length === 0 ? (
              <div className="px-4 pb-4">
                <p className="text-sm text-white/40 text-center py-4">
                  No active collection offers
                </p>
              </div>
            ) : (
              <div className="px-4 pb-4 space-y-2">
                {/* Best Offer Highlight */}
                {bestOffer && (
                  <div className="p-3 bg-[rgb(163,255,18)]/10 border border-[rgb(163,255,18)]/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[rgb(163,255,18)] font-medium">
                        Best Offer
                      </span>
                      <span className="text-lg font-bold text-[rgb(163,255,18)]">
                        {bestOffer.offerAmount} ETH
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-1 text-xs text-white/60">
                        <User className="w-3 h-3" />
                        {bestOffer.offeror?.username ||
                          formatAddress(bestOffer.offerorAddress)}
                      </div>
                      <span className="text-xs text-white/40">
                        x{bestOffer.quantity}
                      </span>
                    </div>
                  </div>
                )}

                {/* Offer List */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {offers.map((offer) => (
                    <div
                      key={offer.id}
                      className="p-3 bg-white/5 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">
                            {offer.offerAmount} ETH
                          </span>
                          <span className="text-xs text-white/40">
                            x{offer.quantity}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-white/60">
                            {offer.offeror?.username ||
                              formatAddress(offer.offerorAddress)}
                          </span>
                          <span className="text-white/20">|</span>
                          <span className="text-xs text-white/40 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(
                              new Date(offer.expirationTimestamp),
                              { addSuffix: true }
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Cancel button for own offers */}
                      {account?.address?.toLowerCase() ===
                        offer.offerorAddress.toLowerCase() && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCancelOffer(offer)}
                          disabled={cancellingId === offer.offerId}
                          className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          {cancellingId === offer.offerId ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Compact version for sidebar or smaller spaces
export function CollectionOffersBadge({
  collectionId,
  className,
}: {
  collectionId: string;
  className?: string;
}) {
  const [bestOffer, setBestOffer] = useState<CollectionOffer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBestOffer = async () => {
      try {
        const response = await fetch(
          `/api/marketplace/collection-offers?collectionId=${collectionId}&status=ACTIVE&limit=1`
        );
        if (response.ok) {
          const data = await response.json();
          setBestOffer(data.bestOffer || null);
        }
      } catch (error) {
        console.error('Error fetching best offer:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBestOffer();
  }, [collectionId]);

  if (isLoading || !bestOffer) {
    return null;
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 bg-[rgb(163,255,18)]/10 border border-[rgb(163,255,18)]/20 rounded-full',
        className
      )}
    >
      <Layers className="w-3.5 h-3.5 text-[rgb(163,255,18)]" />
      <span className="text-xs font-medium text-[rgb(163,255,18)]">
        Best Offer: {bestOffer.offerAmount} ETH
      </span>
    </div>
  );
}
