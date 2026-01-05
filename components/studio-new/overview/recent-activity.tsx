'use client';

import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  Upload,
  Check,
  Settings,
  ImageIcon,
  Package,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

export type ActivityType =
  | 'collection_deployed'
  | 'nft_minted'
  | 'metadata_updated'
  | 'claim_phase_set'
  | 'project_created';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  timestamp: Date;
  collectionId?: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
  isLoading?: boolean;
  onViewAll?: () => void;
}

// =============================================================================
// Configuration
// =============================================================================

const activityIcons: Record<
  ActivityType,
  { icon: typeof Upload; color: string }
> = {
  collection_deployed: { icon: Upload, color: 'text-green-500' },
  nft_minted: { icon: ImageIcon, color: 'text-blue-500' },
  metadata_updated: { icon: Settings, color: 'text-amber-500' },
  claim_phase_set: { icon: Check, color: 'text-purple-500' },
  project_created: { icon: Package, color: 'text-cyan-500' },
};

// =============================================================================
// Skeleton Component
// =============================================================================

function ActivitySkeleton() {
  return (
    <div className="flex items-center gap-3 p-4">
      <div className="h-8 w-8 rounded-full bg-studio-border animate-pulse" />
      <div className="flex-1 space-y-1.5">
        <div className="h-4 w-32 bg-studio-border rounded animate-pulse" />
        <div className="h-3 w-20 bg-studio-border rounded animate-pulse" />
      </div>
    </div>
  );
}

// =============================================================================
// Empty State Component
// =============================================================================

function EmptyState() {
  return (
    <div className="rounded-xl border border-studio-border bg-studio-surface p-6 text-center">
      <div className="mx-auto h-12 w-12 rounded-full bg-studio-border/50 flex items-center justify-center mb-3">
        <Package className="h-6 w-6 text-studio-text-muted" />
      </div>
      <h3 className="text-sm font-medium text-studio-text">No activity yet</h3>
      <p className="text-xs text-studio-text-muted mt-1">
        Create your first collection to see activity here
      </p>
    </div>
  );
}

// =============================================================================
// Component
// =============================================================================

export function RecentActivity({
  activities,
  isLoading,
  onViewAll,
}: RecentActivityProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-studio-border bg-studio-surface overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-studio-border">
          <div className="h-4 w-24 bg-studio-border rounded animate-pulse" />
        </div>
        <div className="divide-y divide-studio-border">
          {[...Array(5)].map((_, i) => (
            <ActivitySkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="rounded-xl border border-studio-border bg-studio-surface overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-studio-border">
        <h3 className="text-sm font-medium text-studio-text">Recent Activity</h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-1 text-xs text-studio-text-muted hover:text-studio-text transition-colors"
          >
            View all
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>
      <div className="divide-y divide-studio-border">
        {activities.slice(0, 5).map((activity, index) => {
          const config = activityIcons[activity.type] ?? activityIcons.project_created;
          const Icon = config.icon;

          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.2 }}
              className="flex items-center gap-3 p-4 hover:bg-studio-border/20 transition-colors"
            >
              <div
                className={cn(
                  'h-8 w-8 rounded-full bg-studio-border/50 flex items-center justify-center flex-shrink-0',
                  config.color
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-studio-text truncate">
                  {activity.title}
                </p>
                <p className="text-xs text-studio-text-muted">
                  {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
