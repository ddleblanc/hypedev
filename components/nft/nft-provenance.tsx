"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Crown,
  ArrowRight,
  ShoppingCart,
  Sparkles,
  Gift,
  Copy,
  Check,
  Loader2,
  History,
  Calendar,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";

interface OwnershipEvent {
  id: string;
  type: 'mint' | 'transfer' | 'sale' | 'airdrop';
  from: string | null;
  to: string;
  timestamp: Date;
  transactionHash: string | null;
  price: number | null;
  currency: string | null;
  fromUser?: {
    username: string | null;
    avatar: string | null;
  };
  toUser?: {
    username: string | null;
    avatar: string | null;
  };
}

interface ProvenanceData {
  currentOwner: {
    address: string;
    username: string | null;
    avatar: string | null;
    ownedSince: Date | null;
    acquisitionType: 'mint' | 'transfer' | 'sale' | 'airdrop';
    acquisitionPrice: number | null;
  };
  originalMinter: {
    address: string;
    username: string | null;
    avatar: string | null;
    mintDate: Date | null;
    transactionHash: string | null;
  } | null;
  ownershipHistory: OwnershipEvent[];
  totalOwners: number;
  holdingPeriodDays: number | null;
}

interface NFTProvenanceProps {
  data: ProvenanceData | null;
  isLoading?: boolean;
  chainId?: number;
}

const BLOCK_EXPLORER_URLS: Record<number, string> = {
  1: 'https://etherscan.io',
  11155111: 'https://sepolia.etherscan.io',
  137: 'https://polygonscan.com',
  8453: 'https://basescan.org',
};

export function NFTProvenance({ data, isLoading = false, chainId = 11155111 }: NFTProvenanceProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const explorerUrl = BLOCK_EXPLORER_URLS[chainId] || BLOCK_EXPLORER_URLS[1];

  const copyAddress = (address: string, label: string) => {
    navigator.clipboard.writeText(address);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const getEventIcon = (type: OwnershipEvent['type']) => {
    switch (type) {
      case 'mint':
        return Sparkles;
      case 'sale':
        return ShoppingCart;
      case 'airdrop':
        return Gift;
      case 'transfer':
      default:
        return ArrowRight;
    }
  };

  const getEventColor = (type: OwnershipEvent['type']) => {
    switch (type) {
      case 'mint':
        return 'bg-green-500/10 text-green-500';
      case 'sale':
        return 'bg-blue-500/10 text-blue-500';
      case 'airdrop':
        return 'bg-purple-500/10 text-purple-500';
      case 'transfer':
      default:
        return 'bg-orange-500/10 text-orange-500';
    }
  };

  const formatAddress = (address: string) =>
    `${address.slice(0, 6)}...${address.slice(-4)}`;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <History className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground">No ownership history available</p>
        </CardContent>
      </Card>
    );
  }

  const displayHistory = expanded ? data.ownershipHistory : data.ownershipHistory.slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5" />
            Ownership History
          </CardTitle>
          <Badge variant="secondary">
            {data.totalOwners} owner{data.totalOwners !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Owner Highlight */}
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 ring-2 ring-primary/30">
                <AvatarImage src={data.currentOwner.avatar || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-bold">
                  {data.currentOwner.username?.[0]?.toUpperCase() ||
                    data.currentOwner.address.slice(2, 4).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold">
                    {data.currentOwner.username || formatAddress(data.currentOwner.address)}
                  </p>
                  <Badge className="bg-primary/20 text-primary text-xs">
                    <Crown className="h-3 w-3 mr-1" />
                    Current Owner
                  </Badge>
                </div>
                {data.currentOwner.ownedSince && (
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(data.currentOwner.ownedSince), 'MMM d, yyyy')}
                    </span>
                    {data.holdingPeriodDays !== null && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {data.holdingPeriodDays} day{data.holdingPeriodDays !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => copyAddress(data.currentOwner.address, 'owner')}
                    >
                      {copied === 'owner' ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy address</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      asChild
                    >
                      <a
                        href={`${explorerUrl}/address/${data.currentOwner.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>View on Explorer</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>

        <Separator />

        {/* Ownership Timeline */}
        <div className="space-y-4">
          <AnimatePresence>
            {displayHistory.map((event, index) => {
              const Icon = getEventIcon(event.type);
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative"
                >
                  {/* Timeline connector */}
                  {index < displayHistory.length - 1 && (
                    <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-border" />
                  )}

                  <div className="flex gap-4">
                    {/* Event icon */}
                    <div className={cn(
                      "flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center",
                      getEventColor(event.type)
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>

                    {/* Event details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium capitalize">{event.type}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {event.from && (
                              <>
                                <span className="font-mono text-xs">
                                  {event.fromUser?.username || formatAddress(event.from)}
                                </span>
                                <ArrowRight className="h-3 w-3" />
                              </>
                            )}
                            <span className="font-mono text-xs">
                              {event.toUser?.username || formatAddress(event.to)}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          {event.price && (
                            <p className="font-semibold">
                              {event.price} {event.currency || 'ETH'}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                          </p>
                        </div>
                      </div>

                      {/* Transaction link */}
                      {event.transactionHash && (
                        <a
                          href={`${explorerUrl}/tx/${event.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-2"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View transaction
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Show more/less */}
        {data.ownershipHistory.length > 3 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Show all {data.ownershipHistory.length} events
              </>
            )}
          </Button>
        )}

        {/* Original Minter */}
        {data.originalMinter && (
          <>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-green-500" />
                <span className="text-muted-foreground">Original Minter:</span>
                <span className="font-medium">
                  {data.originalMinter.username || formatAddress(data.originalMinter.address)}
                </span>
              </div>
              {data.originalMinter.mintDate && (
                <span className="text-xs text-muted-foreground">
                  {format(new Date(data.originalMinter.mintDate), 'MMM d, yyyy')}
                </span>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
