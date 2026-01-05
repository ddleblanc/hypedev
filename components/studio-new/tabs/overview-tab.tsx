'use client';

import { useMemo } from 'react';
import { StatsStrip } from '../overview/stats-strip';
import { RecentActivity, type ActivityItem, type ActivityType } from '../overview/recent-activity';
import { QuickActions } from '../overview/quick-actions';
import { useStudioData, type Collection, type NFT } from '@/hooks/use-studio-data';
import { useStudioNew } from '@/contexts/studio-new-context';

// =============================================================================
// Helpers
// =============================================================================

/**
 * Transform studio data (projects, collections, nfts) into activity items
 * for display in the RecentActivity component.
 */
function transformToActivity(
  collections: Collection[],
  nfts: NFT[]
): ActivityItem[] {
  const activities: ActivityItem[] = [];

  // Add deployed collections as activity
  collections
    .filter((collection) => collection.isDeployed)
    .slice(0, 3)
    .forEach((collection) => {
      activities.push({
        id: `col-deployed-${collection.id}`,
        type: 'collection_deployed' as ActivityType,
        title: `Deployed "${collection.name}"`,
        timestamp: new Date(collection.deployedAt ?? collection.createdAt),
        collectionId: collection.id,
      });
    });

  // Add recently created collections (not yet deployed)
  collections
    .filter((collection) => !collection.isDeployed)
    .slice(0, 2)
    .forEach((collection) => {
      activities.push({
        id: `col-created-${collection.id}`,
        type: 'project_created' as ActivityType,
        title: `Created "${collection.name}"`,
        timestamp: new Date(collection.createdAt),
        collectionId: collection.id,
      });
    });

  // Add minted NFTs as activity
  nfts
    .filter((nft) => nft.isMinted)
    .slice(0, 3)
    .forEach((nft) => {
      activities.push({
        id: `nft-minted-${nft.id}`,
        type: 'nft_minted' as ActivityType,
        title: `Minted "${nft.name}"`,
        timestamp: new Date(nft.mintedAt ?? nft.createdAt),
      });
    });

  // Sort by timestamp descending and return top 5
  return activities
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 5);
}

// =============================================================================
// Component
// =============================================================================

export function OverviewTab() {
  const { collections, nfts, isLoading } = useStudioData();
  const { goToProjects } = useStudioNew();

  // Compute aggregate stats
  const stats = useMemo(() => {
    const totalCollections = collections.length;
    const totalNfts = nfts.length;

    // Calculate unique holders from NFTs with owner addresses
    const uniqueHolders = new Set(
      nfts.map((n) => n.ownerAddress).filter(Boolean)
    ).size;

    // Calculate total volume from all collections
    const totalVolume = collections.reduce(
      (sum, c) => sum + (c.volume ?? 0),
      0
    );

    return {
      collections: totalCollections,
      nfts: totalNfts,
      holders: uniqueHolders,
      volume: totalVolume,
    };
  }, [collections, nfts]);

  // Transform data to activity format
  const activities = useMemo(
    () => transformToActivity(collections, nfts),
    [collections, nfts]
  );

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h2 className="text-2xl font-semibold text-studio-text">Welcome back</h2>
        <p className="text-studio-text-muted mt-1">
          Here&apos;s what&apos;s happening in your studio
        </p>
      </div>

      {/* Stats Strip */}
      <StatsStrip
        collections={stats.collections}
        nfts={stats.nfts}
        holders={stats.holders}
        volume={stats.volume}
        isLoading={isLoading}
      />

      {/* Two Column Layout: Quick Actions + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div>
          <h3 className="text-sm font-medium text-studio-text-muted mb-3">
            Quick Actions
          </h3>
          <QuickActions />
        </div>

        {/* Recent Activity */}
        <div>
          <h3 className="text-sm font-medium text-studio-text-muted mb-3">
            Activity
          </h3>
          <RecentActivity
            activities={activities}
            isLoading={isLoading}
            onViewAll={goToProjects}
          />
        </div>
      </div>
    </div>
  );
}
