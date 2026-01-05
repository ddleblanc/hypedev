"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Check,
  Clock,
  DollarSign,
  Users,
  Gem,
  ExternalLink,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface Offer {
  id: string;
  offerId: string;
  type: 'individual' | 'collection' | 'trait';
  amount: number;
  currency: string;
  expiresAt: Date | null;
  createdAt: Date;
  status: string;
  offeror: {
    address: string;
    username: string | null;
    avatar: string | null;
  };
  traitType?: string;
  traitValue?: string;
  onChainId: string | null;
  isExpiringSoon: boolean;
}

interface NFTOffersPanelProps {
  offers: Offer[];
  isLoading?: boolean;
  isOwner: boolean;
  floorPrice?: number | null;
  onAcceptOffer?: (offerId: string, isCollectionOffer: boolean) => void;
  acceptingOfferId?: string | null;
  chainId?: number;
}

export function NFTOffersPanel({
  offers,
  isLoading = false,
  isOwner,
  floorPrice,
  onAcceptOffer,
  acceptingOfferId,
  chainId = 11155111,
}: NFTOffersPanelProps) {
  const getOfferTypeLabel = (type: Offer['type']) => {
    switch (type) {
      case 'collection':
        return 'Collection Offer';
      case 'trait':
        return 'Trait Offer';
      default:
        return 'Individual Offer';
    }
  };

  const getOfferTypeColor = (type: Offer['type']) => {
    switch (type) {
      case 'collection':
        return 'bg-purple-500/10 text-purple-500';
      case 'trait':
        return 'bg-blue-500/10 text-blue-500';
      default:
        return 'bg-green-500/10 text-green-500';
    }
  };

  const getOfferTypeIcon = (type: Offer['type']) => {
    switch (type) {
      case 'collection':
        return Users;
      case 'trait':
        return Gem;
      default:
        return DollarSign;
    }
  };

  const getExplorerUrl = (txOrAddress: string, type: 'tx' | 'address' = 'address') => {
    const explorers: Record<number, string> = {
      1: "https://etherscan.io",
      11155111: "https://sepolia.etherscan.io",
      137: "https://polygonscan.com",
      8453: "https://basescan.org",
      42161: "https://arbiscan.io",
      10: "https://optimistic.etherscan.io",
    };
    const base = explorers[chainId] || explorers[1];
    return `${base}/${type}/${txOrAddress}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <DollarSign className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-xl font-semibold mb-2">No Active Offers</h3>
          <p className="text-muted-foreground">
            {isOwner
              ? "There are no offers on this NFT yet. Share it to attract buyers!"
              : "Be the first to make an offer on this NFT."}
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasExpiringSoonOffers = offers.some(o => o.isExpiringSoon);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {offers.length} active offer{offers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">Best offer: </span>
          <span className="font-semibold">
            {offers[0]?.amount} {offers[0]?.currency}
          </span>
          {floorPrice && offers[0] && (
            <span className="text-muted-foreground ml-2">
              ({((offers[0].amount / floorPrice) * 100).toFixed(0)}% of floor)
            </span>
          )}
        </div>
      </div>

      <Separator />

      {/* Offers List */}
      <div className="space-y-3">
        <AnimatePresence>
          {offers.map((offer, index) => {
            const Icon = getOfferTypeIcon(offer.type);
            const isAccepting = acceptingOfferId === offer.offerId;

            return (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={cn(
                  "transition-all duration-200 hover:shadow-md",
                  index === 0 && "border-primary/50 bg-primary/5"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      {/* Left: Offeror Info */}
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={offer.offeror.avatar || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                            {offer.offeror.username?.[0]?.toUpperCase() ||
                              offer.offeror.address.slice(2, 4).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <a
                              href={getExplorerUrl(offer.offeror.address)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold hover:text-primary transition-colors"
                            >
                              {offer.offeror.username ||
                                `${offer.offeror.address.slice(0, 6)}...${offer.offeror.address.slice(-4)}`}
                            </a>
                            <Badge
                              variant="secondary"
                              className={cn("text-xs", getOfferTypeColor(offer.type))}
                            >
                              <Icon className="h-3 w-3 mr-1" />
                              {getOfferTypeLabel(offer.type)}
                            </Badge>
                            {index === 0 && (
                              <Badge className="bg-primary text-primary-foreground text-xs">
                                Best
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span>
                              {formatDistanceToNow(new Date(offer.createdAt), { addSuffix: true })}
                            </span>
                            {offer.expiresAt && (
                              <span className={cn(
                                "flex items-center gap-1",
                                offer.isExpiringSoon && "text-yellow-500"
                              )}>
                                <Clock className="h-3 w-3" />
                                Expires {formatDistanceToNow(new Date(offer.expiresAt), { addSuffix: true })}
                              </span>
                            )}
                          </div>

                          {/* Trait offer details */}
                          {offer.type === 'trait' && offer.traitType && (
                            <p className="text-xs text-muted-foreground mt-1">
                              For: {offer.traitType} = {offer.traitValue}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Amount and Actions */}
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xl font-bold">
                            {offer.amount} {offer.currency}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ~${(offer.amount * 2650).toLocaleString()}
                          </p>
                        </div>

                        {isOwner && onAcceptOffer && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  className="gap-2"
                                  onClick={() => onAcceptOffer(offer.offerId, offer.type === 'collection')}
                                  disabled={isAccepting || !!acceptingOfferId}
                                >
                                  {isAccepting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Check className="h-4 w-4" />
                                  )}
                                  Accept
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                Accept this offer and sell your NFT
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        {offer.onChainId && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <a
                                  href={getExplorerUrl(offer.offeror.address)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center h-8 w-8 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </TooltipTrigger>
                              <TooltipContent>View offeror on explorer</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Warning for expiring offers */}
      {hasExpiringSoonOffers && (
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Some offers are expiring soon. Accept quickly to secure the deal.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
