"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import {
  Check,
  X,
  ExternalLink,
  Clock,
  Gavel,
  Tag,
  Handshake,
  UserPlus,
  Gift,
  ShoppingCart,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MediaRenderer } from "@/components/media-renderer";
import { cn } from "@/lib/utils";
import type { Notification } from "@/hooks/use-notifications";

interface NotificationCardProps {
  notification: Notification;
  index: number;
  onMarkRead: (id: string) => Promise<void>;
  onDismiss: (id: string) => Promise<void>;
  onAction: (
    id: string,
    action: string,
    data?: Record<string, unknown>
  ) => Promise<boolean>;
}

const typeConfig: Record<
  string,
  { icon: React.ElementType; color: string; label: string }
> = {
  offer_received: { icon: Tag, color: "text-blue-400", label: "Offer Received" },
  offer_made: { icon: Tag, color: "text-blue-400", label: "Offer Made" },
  offer_accepted: { icon: Check, color: "text-green-400", label: "Offer Accepted" },
  offer_rejected: { icon: X, color: "text-red-400", label: "Offer Rejected" },
  trade_received: {
    icon: Handshake,
    color: "text-purple-400",
    label: "Trade Request",
  },
  trade_initiated: {
    icon: Handshake,
    color: "text-purple-400",
    label: "Trade Initiated",
  },
  trade_completed: {
    icon: Check,
    color: "text-green-400",
    label: "Trade Complete",
  },
  trade_counteroffer: {
    icon: Handshake,
    color: "text-yellow-400",
    label: "Counteroffer",
  },
  bid_placed: { icon: Gavel, color: "text-yellow-400", label: "Outbid" },
  auction_won: {
    icon: Gavel,
    color: "text-[rgb(163,255,18)]",
    label: "Auction Won",
  },
  listing_sold: {
    icon: ShoppingCart,
    color: "text-green-400",
    label: "Item Sold",
  },
  purchase: { icon: ShoppingCart, color: "text-green-400", label: "Purchased" },
  user_followed_by: {
    icon: UserPlus,
    color: "text-cyan-400",
    label: "New Follower",
  },
  lootbox_opened: { icon: Gift, color: "text-pink-400", label: "Lootbox Opened" },
};

export function NotificationCard({
  notification,
  index,
  onMarkRead,
  onDismiss,
  onAction,
}: NotificationCardProps) {
  const router = useRouter();
  const [isActioning, setIsActioning] = useState(false);
  const [actionType, setActionType] = useState<string | null>(null);

  const config = typeConfig[notification.type] || {
    icon: ExternalLink,
    color: "text-white/60",
    label: notification.type.replace(/_/g, " "),
  };

  const Icon = config.icon;
  const isUrgent =
    notification.priority === "URGENT" || notification.isTimeSensitive;
  const isPending = notification.actionStatus === "PENDING";
  const hasExpiry =
    notification.expiresAt && new Date(notification.expiresAt) > new Date();

  const handleAction = async (action: string) => {
    setIsActioning(true);
    setActionType(action);

    try {
      const success = await onAction(
        notification.id,
        action,
        notification.actionData || undefined
      );
      if (success) {
        await onMarkRead(notification.id);
      }
    } finally {
      setIsActioning(false);
      setActionType(null);
    }
  };

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.tradeId) {
      router.push(`/p2p?trade=${notification.tradeId}`);
    } else if (notification.nftId && notification.collectionId) {
      router.push(
        `/collection/${notification.collectionId}?nft=${notification.nftId}`
      );
    } else if (notification.relatedAddress) {
      router.push(`/profile/${notification.relatedAddress}`);
    }
  };

  // Render inline action buttons based on notification type
  const renderActions = () => {
    if (!isPending || notification.actionStatus === "COMPLETED") return null;

    switch (notification.actionType) {
      case "ACCEPT_OFFER":
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleAction("ACCEPT_OFFER");
              }}
              disabled={isActioning}
              className="bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90"
            >
              {isActioning && actionType === "ACCEPT_OFFER" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Accept
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                handleAction("DECLINE_OFFER");
              }}
              disabled={isActioning}
              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
            >
              <X className="w-4 h-4 mr-1" />
              Decline
            </Button>
          </div>
        );

      case "ACCEPT_TRADE":
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleAction("VIEW_ITEM");
              }}
              className="bg-purple-500 hover:bg-purple-600"
            >
              <Handshake className="w-4 h-4 mr-1" />
              Review Trade
            </Button>
          </div>
        );

      case "PLACE_BID":
        return (
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleAction("VIEW_ITEM");
            }}
            className="bg-yellow-500 text-black hover:bg-yellow-400"
          >
            <Gavel className="w-4 h-4 mr-1" />
            Place Bid
          </Button>
        );

      case "FOLLOW_BACK":
        return (
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleAction("FOLLOW_BACK");
            }}
            disabled={isActioning}
            className="bg-cyan-500 hover:bg-cyan-400"
          >
            {isActioning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-1" />
                Follow Back
              </>
            )}
          </Button>
        );

      default:
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleAction("VIEW_ITEM");
            }}
            className="border-white/20"
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            View
          </Button>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ delay: index * 0.05 }}
      onClick={handleClick}
      className={cn(
        "relative group cursor-pointer rounded-xl border p-4 transition-all duration-300",
        "bg-black/40 backdrop-blur-sm hover:bg-white/5",
        notification.isRead ? "border-white/10" : "border-white/20",
        isUrgent && !notification.isRead && "border-red-500/50 bg-red-500/5"
      )}
    >
      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[rgb(163,255,18)]" />
      )}

      <div className="flex gap-4">
        {/* Image/Icon */}
        <div className="flex-shrink-0">
          {notification.metadata?.nftImage ? (
            <div className="w-14 h-14 rounded-lg overflow-hidden border border-white/10">
              <MediaRenderer
                src={notification.metadata.nftImage}
                alt="NFT"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div
              className={cn(
                "w-14 h-14 rounded-lg flex items-center justify-center",
                "bg-white/5 border border-white/10"
              )}
            >
              <Icon className={cn("w-6 h-6", config.color)} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={cn(
                    "text-xs font-medium uppercase tracking-wider",
                    config.color
                  )}
                >
                  {config.label}
                </span>
                {isUrgent && (
                  <Badge className="bg-red-500/20 text-red-400 text-[10px]">
                    <Clock className="w-3 h-3 mr-1" />
                    Urgent
                  </Badge>
                )}
              </div>
              <h3 className="text-white font-medium text-sm">
                {notification.title}
              </h3>
              {notification.message && (
                <p className="text-white/60 text-sm mt-1 line-clamp-2">
                  {notification.message}
                </p>
              )}

              {/* Price if applicable */}
              {notification.metadata?.price && (
                <p className="text-[rgb(163,255,18)] font-bold text-sm mt-2">
                  {notification.metadata.price} ETH
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex-shrink-0">{renderActions()}</div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
            <span className="text-white/40 text-xs">
              {formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
              })}
            </span>

            {hasExpiry && (
              <span className="text-red-400 text-xs flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Expires{" "}
                {formatDistanceToNow(new Date(notification.expiresAt!), {
                  addSuffix: true,
                })}
              </span>
            )}

            {/* Dismiss button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(notification.id);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-white/40 hover:text-white/60"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
