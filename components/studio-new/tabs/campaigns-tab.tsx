'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/lib/trpc/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useStudioData } from '@/hooks/use-studio-data';
import { useAuth } from '@/contexts/auth-context';
import { CampaignCard, CampaignCardSkeleton } from '@/components/hype-network/campaign-card';
import { CreatorCampaignBuilder } from '@/components/hype-network/creator-campaign-builder';
import {
  Plus,
  TrendingUp,
  Users,
  DollarSign,
  Link as LinkIcon,
  Megaphone,
  X,
} from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

type CampaignFilter = 'active' | 'draft' | 'ended';

// =============================================================================
// Component
// =============================================================================

export function CampaignsTab() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<CampaignFilter>('active');
  const { user } = useAuth();

  const { collections, isLoading: studioLoading } = useStudioData();

  // Fetch creator's lootboxes for the campaign builder
  const { data: lootboxesData, isLoading: lootboxesLoading } = trpc.lootbox.list.useQuery(
    { creatorId: user?.id, limit: 100 },
    { enabled: Boolean(user?.id) }
  );

  // Map lootboxes to the format expected by CreatorCampaignBuilder
  const lootboxes = useMemo(() => {
    return (lootboxesData?.lootboxes ?? []).map((lb) => ({
      id: lb.id,
      name: lb.name,
      image: lb.image,
    }));
  }, [lootboxesData?.lootboxes]);

  // Map collections to the format expected by CreatorCampaignBuilder
  const mappedCollections = useMemo(() => {
    return collections.map((col) => ({
      id: col.id,
      name: col.name,
      image: col.image ?? null,
    }));
  }, [collections]);

  // Map filter to API status
  const statusMap: Record<CampaignFilter, 'ACTIVE' | 'DRAFT' | 'ENDED'> = {
    active: 'ACTIVE',
    draft: 'DRAFT',
    ended: 'ENDED',
  };

  // Fetch creator's campaigns
  const {
    data: campaignsData,
    isLoading: loadingCampaigns,
    refetch,
  } = trpc.hypeNetwork.campaigns.mine.useQuery(
    {
      status: statusMap[activeFilter],
      limit: 50,
    },
    { enabled: Boolean(user?.id) }
  );

  const campaigns = campaignsData?.items ?? [];

  // Stats aggregation
  const stats = useMemo(() => {
    return {
      totalAgents: campaigns.reduce((acc, c) => acc + (c.totalAgents || 0), 0),
      totalReferrals: campaigns.reduce((acc, c) => acc + (c.totalReferrals || 0), 0),
      totalVolume: campaigns.reduce((acc, c) => acc + Number(c.totalVolume || 0), 0),
      activeCampaigns: campaigns.filter((c) => c.status === 'ACTIVE').length,
    };
  }, [campaigns]);

  const isLoading = studioLoading || loadingCampaigns || lootboxesLoading;

  // Loading state
  if (isLoading) {
    return <CampaignsSkeleton />;
  }

  // Empty state for active tab with no campaigns
  if (campaigns.length === 0 && activeFilter === 'active') {
    return (
      <div className="space-y-6">
        <CampaignsEmptyState onCreateClick={() => setShowCreateModal(true)} />

        <AnimatePresence>
          {showCreateModal && (
            <CampaignBuilderModal
              collections={mappedCollections}
              lootboxes={lootboxes}
              onClose={() => setShowCreateModal(false)}
              onSuccess={() => {
                setShowCreateModal(false);
                refetch();
              }}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          label="Active Campaigns"
          value={stats.activeCampaigns}
          icon={TrendingUp}
          iconColor="text-studio-accent/50"
        />
        <StatsCard
          label="Total Agents"
          value={stats.totalAgents}
          icon={Users}
          iconColor="text-blue-400/50"
        />
        <StatsCard
          label="Total Referrals"
          value={stats.totalReferrals}
          icon={LinkIcon}
          iconColor="text-purple-400/50"
        />
        <StatsCard
          label="Total Volume"
          value={`${stats.totalVolume.toFixed(2)} ETH`}
          icon={DollarSign}
          iconColor="text-green-400/50"
        />
      </div>

      {/* Header with Filters and Create Button */}
      <div className="flex items-center justify-between">
        <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as CampaignFilter)}>
          <TabsList className="bg-studio-surface">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
            <TabsTrigger value="ended">Ended</TabsTrigger>
          </TabsList>
        </Tabs>

        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-studio-accent text-black hover:bg-studio-accent/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* Campaign Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {campaigns.map((campaign, index) => (
          <motion.div
            key={campaign.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <CampaignCard
              campaign={campaign}
              showJoinButton={false}
            />
          </motion.div>
        ))}
      </div>

      {/* Empty state for filtered results */}
      {campaigns.length === 0 && activeFilter !== 'active' && (
        <div className="text-center py-12 text-studio-text-muted">
          No {activeFilter} campaigns found.
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CampaignBuilderModal
            collections={mappedCollections}
            lootboxes={lootboxes}
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              refetch();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconColor: string;
}

function StatsCard({ label, value, icon: Icon, iconColor }: StatsCardProps) {
  return (
    <Card className="bg-studio-surface border-studio-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-studio-text-muted">{label}</p>
            <p className="text-2xl font-bold text-studio-text">{value}</p>
          </div>
          <Icon className={`w-8 h-8 ${iconColor}`} />
        </div>
      </CardContent>
    </Card>
  );
}

function CampaignsEmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 rounded-full bg-studio-accent/10 flex items-center justify-center mb-4">
        <Megaphone className="w-10 h-10 text-studio-accent" />
      </div>
      <h3 className="text-xl font-semibold text-studio-text mb-2">No Campaigns Yet</h3>
      <p className="text-studio-text-muted max-w-md mb-6">
        Create your first affiliate campaign to let agents promote your collections and earn
        commissions on sales.
      </p>
      <Button onClick={onCreateClick} className="bg-studio-accent text-black hover:bg-studio-accent/90">
        <Plus className="w-4 h-4 mr-2" />
        Create Your First Campaign
      </Button>
    </div>
  );
}

function CampaignsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-studio-surface border-studio-border">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Campaign cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <CampaignCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

interface CampaignBuilderModalProps {
  collections: Array<{ id: string; name: string; image: string | null }>;
  lootboxes: Array<{ id: string; name: string; image: string | null }>;
  onClose: () => void;
  onSuccess: (campaignId: string) => void;
}

function CampaignBuilderModal({
  collections,
  lootboxes,
  onClose,
  onSuccess,
}: CampaignBuilderModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Content */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-zinc-900 border border-zinc-700 p-6"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5 text-zinc-400" />
        </button>

        <CreatorCampaignBuilder
          collections={collections}
          lootboxes={lootboxes}
          onSuccess={onSuccess}
          onCancel={onClose}
        />
      </motion.div>
    </motion.div>
  );
}
