'use client';

import { motion } from 'framer-motion';
import { MediaRenderer } from '@/components/media-renderer';
import {
  ShoppingCart,
  Tag,
  Gavel,
  Send,
  ArrowRightLeft,
  Heart,
  Trophy,
  Sparkles,
  UserPlus,
  UserCheck,
  Package,
  Gift,
  Rocket,
  XCircle,
  Handshake,
  ArrowLeftRight,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export type ActivityType =
  // Marketplace
  | 'listing_created'
  | 'listing_canceled'
  | 'listing_sold'
  | 'purchase'
  | 'auction_created'
  | 'bid_placed'
  | 'auction_won'
  // P2P Trading
  | 'trade_initiated'
  | 'trade_received'
  | 'trade_counteroffer'
  | 'trade_completed'
  | 'trade_canceled'
  // Minting
  | 'nft_minted'
  | 'collection_deployed'
  // Social
  | 'user_followed'
  | 'user_followed_by'
  // Lootbox
  | 'lootbox_purchased'
  | 'lootbox_opened'
  // Transfers
  | 'nft_transferred'
  | 'nft_received'
  // Legacy types (for backwards compatibility)
  | 'sale'
  | 'listing'
  | 'bid'
  | 'transfer'
  | 'offer'
  | 'mint';

export interface Activity {
  id: string;
  type: ActivityType;
  nft?: {
    id: string;
    name: string;
    image: string;
    collection: string;
  };
  price?: number;
  from?: string;
  to?: string;
  timestamp: Date;
  transactionHash?: string;
}

interface ProfileActivityFeedProps {
  activities: Activity[];
  isLoading?: boolean;
  emptyMessage?: string;
}

const activityConfig: Record<
  ActivityType,
  {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    color: string;
    bgColor: string;
  }
> = {
  // Marketplace
  listing_created: {
    icon: Tag,
    label: 'Listed',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  listing_canceled: {
    icon: XCircle,
    label: 'Listing canceled',
    color: 'text-gray-400',
    bgColor: 'bg-gray-400/10',
  },
  listing_sold: {
    icon: Tag,
    label: 'Sold',
    color: 'text-[rgb(163,255,18)]',
    bgColor: 'bg-[rgb(163,255,18)]/10',
  },
  purchase: {
    icon: ShoppingCart,
    label: 'Purchased',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  auction_created: {
    icon: Gavel,
    label: 'Auction started',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  bid_placed: {
    icon: Gavel,
    label: 'Bid placed',
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
  },
  auction_won: {
    icon: Trophy,
    label: 'Won auction',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
  },
  // P2P Trading
  trade_initiated: {
    icon: Handshake,
    label: 'Trade initiated',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
  },
  trade_received: {
    icon: ArrowLeftRight,
    label: 'Trade offer received',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-400/10',
  },
  trade_counteroffer: {
    icon: MessageSquare,
    label: 'Counter-offer',
    color: 'text-cyan-300',
    bgColor: 'bg-cyan-300/10',
  },
  trade_completed: {
    icon: Handshake,
    label: 'Trade completed',
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
  },
  trade_canceled: {
    icon: XCircle,
    label: 'Trade canceled',
    color: 'text-gray-400',
    bgColor: 'bg-gray-400/10',
  },
  // Minting
  nft_minted: {
    icon: Sparkles,
    label: 'Minted',
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
  },
  collection_deployed: {
    icon: Rocket,
    label: 'Collection launched',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  // Social
  user_followed: {
    icon: UserPlus,
    label: 'Followed',
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
  },
  user_followed_by: {
    icon: UserCheck,
    label: 'New follower',
    color: 'text-blue-300',
    bgColor: 'bg-blue-300/10',
  },
  // Lootbox
  lootbox_purchased: {
    icon: Package,
    label: 'Lootbox purchased',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  lootbox_opened: {
    icon: Gift,
    label: 'Lootbox opened',
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/10',
  },
  // Transfers
  nft_transferred: {
    icon: Send,
    label: 'Transferred',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  nft_received: {
    icon: ArrowRightLeft,
    label: 'Received',
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
  },
  // Legacy types (for backwards compatibility)
  sale: {
    icon: Tag,
    label: 'Sold',
    color: 'text-[rgb(163,255,18)]',
    bgColor: 'bg-[rgb(163,255,18)]/10',
  },
  listing: {
    icon: Tag,
    label: 'Listed',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  bid: {
    icon: Gavel,
    label: 'Bid placed',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  transfer: {
    icon: Send,
    label: 'Transferred',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  offer: {
    icon: ArrowRightLeft,
    label: 'Offer made',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
  },
  mint: {
    icon: Sparkles,
    label: 'Minted',
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
  },
};

export function ProfileActivityFeed({
  activities,
  isLoading = false,
  emptyMessage = 'No activity yet',
}: ProfileActivityFeedProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <ActivitySkeleton key={i} />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-white/20" />
        </div>
        <p className="text-white/60 text-lg font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity, index) => (
        <motion.div
          key={activity.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.03 }}
        >
          <ActivityItem activity={activity} />
        </motion.div>
      ))}
    </div>
  );
}

// Default config for unknown activity types
const defaultActivityConfig = {
  icon: Sparkles,
  label: 'Activity',
  color: 'text-white/60',
  bgColor: 'bg-white/10',
};

function ActivityItem({ activity }: { activity: Activity }) {
  const config = activityConfig[activity.type] || defaultActivityConfig;
  const Icon = config.icon;

  const formatAddress = (address?: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl hover:border-white/20 transition-colors">
      {/* Activity Icon */}
      <div
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
          config.bgColor
        )}
      >
        <Icon className={cn('w-5 h-5', config.color)} />
      </div>

      {/* NFT Image (if available) */}
      {activity.nft && (
        <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
          <MediaRenderer
            src={activity.nft.image}
            alt={activity.nft.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Activity Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn('text-sm font-medium', config.color)}>
            {config.label}
          </span>
          {activity.nft && (
            <span className="text-white font-medium truncate">
              {activity.nft.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-white/40">
          {activity.from && (
            <span>
              From: <span className="text-white/60">{formatAddress(activity.from)}</span>
            </span>
          )}
          {activity.to && (
            <span>
              To: <span className="text-white/60">{formatAddress(activity.to)}</span>
            </span>
          )}
        </div>
      </div>

      {/* Price & Time */}
      <div className="text-right flex-shrink-0">
        {activity.price && (
          <p className="text-white font-bold">{activity.price} ETH</p>
        )}
        <p className="text-xs text-white/40">
          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl animate-pulse">
      <div className="w-10 h-10 rounded-full bg-white/10" />
      <div className="w-14 h-14 rounded-lg bg-white/10" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 bg-white/10 rounded" />
        <div className="h-3 w-24 bg-white/10 rounded" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-16 bg-white/10 rounded" />
        <div className="h-3 w-12 bg-white/10 rounded" />
      </div>
    </div>
  );
}
