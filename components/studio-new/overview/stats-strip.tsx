'use client';

import { motion } from 'framer-motion';
import { Layers, ImageIcon, Users, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

interface StatsStripProps {
  collections: number;
  nfts: number;
  holders: number;
  volume?: number;
  isLoading?: boolean;
}

interface StatConfig {
  key: 'collections' | 'nfts' | 'holders' | 'volume';
  label: string;
  icon: typeof Layers;
  format: 'number' | 'eth';
}

// =============================================================================
// Configuration
// =============================================================================

const stats: StatConfig[] = [
  { key: 'collections', label: 'Collections', icon: Layers, format: 'number' },
  { key: 'nfts', label: 'NFTs Created', icon: ImageIcon, format: 'number' },
  { key: 'holders', label: 'Unique Holders', icon: Users, format: 'number' },
  { key: 'volume', label: 'Total Volume', icon: TrendingUp, format: 'eth' },
];

// =============================================================================
// Helpers
// =============================================================================

function formatValue(value: number | undefined, format: string): string {
  if (value === undefined || value === null) return '—';

  if (format === 'eth') {
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K ETH`;
    if (value >= 1) return `${value.toFixed(2)} ETH`;
    if (value > 0) return `${value.toFixed(4)} ETH`;
    return '0 ETH';
  }

  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toString();
}

// =============================================================================
// Skeleton Component
// =============================================================================

function StatSkeleton() {
  return (
    <div className="rounded-xl border border-studio-border bg-studio-surface p-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-studio-border rounded animate-pulse" />
          <div className="h-4 w-16 bg-studio-border rounded animate-pulse" />
        </div>
        <div className="h-8 w-12 bg-studio-border rounded animate-pulse" />
      </div>
    </div>
  );
}

// =============================================================================
// Component
// =============================================================================

export function StatsStrip({
  collections,
  nfts,
  holders,
  volume,
  isLoading,
}: StatsStripProps) {
  const values = { collections, nfts, holders, volume };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <StatSkeleton key={stat.key} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const value = values[stat.key];

        return (
          <motion.div
            key={stat.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.2 }}
            className={cn(
              'rounded-xl border border-studio-border bg-studio-surface p-4',
              'transition-colors hover:border-studio-text-muted/30'
            )}
          >
            <div className="flex items-center gap-2 text-studio-text-muted">
              <Icon className="h-4 w-4" />
              <span className="text-sm">{stat.label}</span>
            </div>
            <p className="mt-1 text-2xl font-semibold text-studio-text tabular-nums">
              {formatValue(value, stat.format)}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
