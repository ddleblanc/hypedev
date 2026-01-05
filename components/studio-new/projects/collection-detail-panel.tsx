'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Image as ImageIcon,
  Zap,
  ExternalLink,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MediaRenderer } from '@/components/media-renderer';
import { SlidePanel } from '../shared/slide-panel';
import { CollectionSettingsTab } from './collection-settings-tab';
import { CollectionNftsTab } from './collection-nfts-tab';
import { CollectionClaimTab } from './collection-claim-tab';

// =============================================================================
// Types
// =============================================================================

interface Nft {
  id: string;
  name: string;
  image?: string;
  tokenId?: string;
  isMinted?: boolean;
}

interface ClaimPhase {
  id: string;
  name: string;
  startTime: string;
  maxClaimableSupply: number;
  maxClaimablePerWallet: number;
  price: number;
  currency?: string;
}

export interface CollectionForPanel {
  id: string;
  name: string;
  symbol: string;
  description?: string;
  image?: string;
  bannerImage?: string;
  address?: string;
  chainId: number;
  contractType?: string;
  isDeployed: boolean;
  maxSupply?: number;
  mintedSupply?: number;
  royaltyPercentage?: number;
  claimPhases?: ClaimPhase[];
  nfts?: Nft[];
}

interface CollectionDetailPanelProps {
  collection: CollectionForPanel | null;
  onClose: () => void;
  onAddNft?: (collectionId: string) => void;
  onRefresh?: () => void;
}

// =============================================================================
// Tab Configuration
// =============================================================================

const tabs = [
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'nfts', label: 'NFTs', icon: ImageIcon },
  { id: 'claim', label: 'Claim Phases', icon: Zap },
] as const;

type TabId = (typeof tabs)[number]['id'];

// =============================================================================
// Helper Functions
// =============================================================================

function getBlockExplorerUrl(chainId: number, address: string): string {
  const explorers: Record<number, string> = {
    1: 'https://etherscan.io',
    11155111: 'https://sepolia.etherscan.io',
    137: 'https://polygonscan.com',
    80001: 'https://mumbai.polygonscan.com',
    42161: 'https://arbiscan.io',
    10: 'https://optimistic.etherscan.io',
    8453: 'https://basescan.org',
  };

  const baseUrl = explorers[chainId] || 'https://etherscan.io';
  return `${baseUrl}/address/${address}`;
}

// =============================================================================
// Component
// =============================================================================

export function CollectionDetailPanel({
  collection,
  onClose,
  onAddNft,
  onRefresh,
}: CollectionDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('settings');

  // Handlers for child components
  const handleUpdateSettings = useCallback(
    async (updates: Partial<CollectionForPanel>) => {
      if (!collection) return;

      // TODO: Implement API call to update collection
      console.log('Updating collection:', collection.id, updates);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      onRefresh?.();
    },
    [collection, onRefresh]
  );

  const handleSaveClaimPhases = useCallback(
    async (phases: ClaimPhase[]) => {
      if (!collection) return;

      // TODO: Implement API call to save claim phases
      console.log('Saving claim phases for:', collection.id, phases);

      // Call the actual API
      const response = await fetch(
        `/api/studio/collections/${collection.id}/claim-phases`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ claimPhases: JSON.stringify(phases) }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save claim phases');
      }

      onRefresh?.();
    },
    [collection, onRefresh]
  );

  const handleAddNft = useCallback(() => {
    if (!collection) return;
    onAddNft?.(collection.id);
  }, [collection, onAddNft]);

  // Don't render if no collection
  if (!collection) return null;

  // Check if claim phases tab should be visible
  const showClaimTab =
    collection.contractType?.includes('Drop') ||
    collection.contractType?.includes('Edition');

  return (
    <SlidePanel isOpen={!!collection} onClose={onClose} width="full">
      {/* Collection Header */}
      <div className="relative flex-shrink-0">
        {/* Banner */}
        {collection.bannerImage ? (
          <div className="h-32 relative">
            <MediaRenderer
              src={collection.bannerImage}
              alt={`${collection.name} banner`}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-studio-bg to-transparent" />
          </div>
        ) : (
          <div className="h-20 bg-gradient-to-r from-studio-accent/20 to-studio-surface" />
        )}

        {/* Close Button (positioned absolutely) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-colors z-10"
          aria-label="Close panel"
        >
          <X className="h-5 w-5 text-white" />
        </button>

        {/* Collection Info */}
        <div className="px-6 pb-4">
          <div className="flex items-end gap-4 -mt-8 relative">
            {/* Collection Image */}
            {collection.image ? (
              <div className="h-16 w-16 rounded-xl overflow-hidden border-4 border-studio-bg flex-shrink-0">
                <MediaRenderer
                  src={collection.image}
                  alt={collection.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="h-16 w-16 rounded-xl bg-studio-surface border-4 border-studio-bg flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-studio-text-muted">
                  {collection.symbol?.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}

            {/* Name and Status */}
            <div className="flex-1 pb-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-semibold text-studio-text truncate">
                  {collection.name}
                </h2>
                <span
                  className={cn(
                    'px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0',
                    collection.isDeployed
                      ? 'bg-green-500/10 text-green-500'
                      : 'bg-amber-500/10 text-amber-500'
                  )}
                >
                  {collection.isDeployed ? 'Live' : 'Draft'}
                </span>
              </div>
              <p className="text-sm text-studio-text-muted">{collection.symbol}</p>
            </div>

            {/* External Link */}
            {collection.address && (
              <a
                href={getBlockExplorerUrl(collection.chainId, collection.address)}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-studio-surface hover:bg-studio-border transition-colors flex-shrink-0"
                aria-label="View on block explorer"
              >
                <ExternalLink className="h-4 w-4 text-studio-text-muted" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-6 border-b border-studio-border flex-shrink-0">
        <nav className="flex gap-1" role="tablist">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            // Hide claim tab for non-drop contracts
            if (tab.id === 'claim' && !showClaimTab) {
              return null;
            }

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id}`}
                className={cn(
                  'relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'text-studio-text'
                    : 'text-studio-text-muted hover:text-studio-text'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="collectionDetailTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-studio-accent"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div
        className="flex-1 overflow-y-auto p-6"
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={activeTab}
      >
        {activeTab === 'settings' && (
          <CollectionSettingsTab
            collection={collection}
            onUpdate={handleUpdateSettings}
          />
        )}
        {activeTab === 'nfts' && (
          <CollectionNftsTab
            collection={collection}
            onAddNft={handleAddNft}
          />
        )}
        {activeTab === 'claim' && showClaimTab && (
          <CollectionClaimTab
            collection={collection}
            onSavePhases={handleSaveClaimPhases}
          />
        )}
      </div>
    </SlidePanel>
  );
}
