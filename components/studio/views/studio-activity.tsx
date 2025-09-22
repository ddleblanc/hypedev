"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Clock,
  Upload,
  Edit,
  Trash2,
  Plus,
  Eye,
  DollarSign,
  Package,
  Sparkles,
  TrendingUp,
  Download,
  Share2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  type: 'creation' | 'edit' | 'sale' | 'purchase' | 'deployment' | 'mint' | 'view' | 'share';
  title: string;
  description: string;
  timestamp: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  metadata?: {
    collection?: string;
    project?: string;
    price?: string;
    quantity?: number;
    txHash?: string;
  };
}

const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'creation',
    title: 'Created New Collection',
    description: 'Genesis Warriors collection created with 10,000 items',
    timestamp: '2 hours ago',
    icon: Plus,
    color: 'bg-green-500',
    metadata: {
      collection: 'Genesis Warriors',
      quantity: 10000
    }
  },
  {
    id: '2',
    type: 'deployment',
    title: 'Smart Contract Deployed',
    description: 'Successfully deployed to Ethereum mainnet',
    timestamp: '4 hours ago',
    icon: Upload,
    color: 'bg-blue-500',
    metadata: {
      collection: 'Cyber Punks',
      txHash: '0x1234...5678'
    }
  },
  {
    id: '3',
    type: 'sale',
    title: 'NFT Sold',
    description: 'Sold "Neon Guardian #421" for 2.5 ETH',
    timestamp: '6 hours ago',
    icon: DollarSign,
    color: 'bg-[rgb(163,255,18)]',
    metadata: {
      price: '2.5 ETH'
    }
  },
  {
    id: '4',
    type: 'mint',
    title: 'Batch Minted',
    description: 'Minted 50 new NFTs in Space Pirates collection',
    timestamp: '1 day ago',
    icon: Sparkles,
    color: 'bg-purple-500',
    metadata: {
      collection: 'Space Pirates',
      quantity: 50
    }
  },
  {
    id: '5',
    type: 'edit',
    title: 'Collection Updated',
    description: 'Updated metadata and royalty settings',
    timestamp: '2 days ago',
    icon: Edit,
    color: 'bg-yellow-500',
    metadata: {
      collection: 'Digital Mystics'
    }
  },
  {
    id: '6',
    type: 'view',
    title: 'Analytics Milestone',
    description: 'Your NFTs received 10,000 views this week',
    timestamp: '3 days ago',
    icon: Eye,
    color: 'bg-cyan-500',
    metadata: {
      quantity: 10000
    }
  },
  {
    id: '7',
    type: 'purchase',
    title: 'NFT Purchased',
    description: 'Bought "Rare Artifact #99" for 1.2 ETH',
    timestamp: '3 days ago',
    icon: Package,
    color: 'bg-orange-500',
    metadata: {
      price: '1.2 ETH'
    }
  },
  {
    id: '8',
    type: 'share',
    title: 'Collection Shared',
    description: 'Shared "Future Legends" with 5 collaborators',
    timestamp: '4 days ago',
    icon: Share2,
    color: 'bg-pink-500',
    metadata: {
      collection: 'Future Legends',
      quantity: 5
    }
  }
];

interface StudioActivityProps {
  viewMode?: 'grid' | 'list';
}

export function StudioActivity({ viewMode = 'list' }: StudioActivityProps) {
  const [filter, setFilter] = React.useState<'all' | ActivityItem['type']>('all');
  
  const filterOptions = [
    { value: 'all', label: 'All Activity' },
    { value: 'creation', label: 'Creations' },
    { value: 'deployment', label: 'Deployments' },
    { value: 'sale', label: 'Sales' },
    { value: 'purchase', label: 'Purchases' },
    { value: 'mint', label: 'Mints' },
    { value: 'edit', label: 'Edits' }
  ];

  const filteredActivities = filter === 'all' 
    ? mockActivities 
    : mockActivities.filter(activity => activity.type === filter);

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex items-center justify-end">
        <div className="flex gap-2">
          {filterOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value as 'all' | ActivityItem['type'])}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300",
                filter === option.value
                  ? "bg-[rgb(163,255,18)] text-black shadow-lg shadow-[rgb(163,255,18)]/20"
                  : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-8 top-0 bottom-0 w-px bg-white/10" />
        
        {/* Activity Items */}
        <div className="space-y-4">
          {filteredActivities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="relative flex gap-4 group"
            >
              {/* Icon Circle */}
              <div className="relative z-10 flex-shrink-0">
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110",
                  activity.color
                )}>
                  <activity.icon className="w-8 h-8 text-white" />
                </div>
                {/* Glow effect on hover */}
                <div className={cn(
                  "absolute inset-0 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-300 blur-xl",
                  activity.color
                )} />
              </div>

              {/* Content Card */}
              <div className="flex-1 bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-black/60 hover:border-[rgb(163,255,18)]/30 transition-all duration-300">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-[rgb(163,255,18)] transition-colors">
                      {activity.title}
                    </h3>
                    <p className="text-white/70 mt-1">{activity.description}</p>
                  </div>
                  <span className="text-white/40 text-sm">{activity.timestamp}</span>
                </div>
                
                {/* Metadata */}
                {activity.metadata && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {activity.metadata.collection && (
                      <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-white/80">
                        {activity.metadata.collection}
                      </span>
                    )}
                    {activity.metadata.price && (
                      <span className="px-3 py-1 bg-[rgb(163,255,18)]/20 rounded-full text-xs text-[rgb(163,255,18)]">
                        {activity.metadata.price}
                      </span>
                    )}
                    {activity.metadata.quantity && (
                      <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-white/80">
                        Qty: {activity.metadata.quantity}
                      </span>
                    )}
                    {activity.metadata.txHash && (
                      <span className="px-3 py-1 bg-blue-500/20 rounded-full text-xs text-blue-400 font-mono">
                        {activity.metadata.txHash}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-4 mt-8">
        {[
          { label: 'Total Actions', value: '156', icon: TrendingUp, color: 'bg-green-500' },
          { label: 'NFTs Created', value: '12.5K', icon: Sparkles, color: 'bg-purple-500' },
          { label: 'Total Sales', value: '89 ETH', icon: DollarSign, color: 'bg-[rgb(163,255,18)]' },
          { label: 'Collections', value: '24', icon: Package, color: 'bg-blue-500' }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-[rgb(163,255,18)]/30 transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center",
                stat.color
              )}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white/60 text-sm">{stat.label}</p>
                <p className="text-2xl font-black text-white">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
