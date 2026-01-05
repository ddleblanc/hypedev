'use client';

import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { useStudioNew } from '@/contexts/studio-new-context';
import { MediaRenderer } from '@/components/media-renderer';

const chains: Record<number, string> = {
  11155111: 'Sepolia',
  1: 'Ethereum',
  137: 'Polygon',
  42161: 'Arbitrum',
};

const contractTypes: Record<string, string> = {
  DropERC721: 'NFT Drop',
  TokenERC721: 'NFT Collection',
  OpenEditionERC721: 'Open Edition',
  DropERC1155: 'Edition Drop',
  TokenERC1155: 'Edition',
};

export function ReviewStep() {
  const { state } = useStudioNew();
  const { draft } = state.create;

  const items = [
    {
      label: 'Type',
      value:
        draft.type === 'collection'
          ? 'NFT Collection'
          : draft.type === 'lootbox'
            ? 'Lootbox'
            : draft.type === 'nft'
              ? 'Single NFT'
              : '—',
    },
    { label: 'Project', value: draft.projectName || 'New project' },
    { label: 'Name', value: draft.name || '—' },
    { label: 'Symbol', value: draft.symbol || '—' },
    { label: 'Network', value: draft.chainId ? chains[draft.chainId] : '—' },
    {
      label: 'Contract',
      value: draft.contractType ? contractTypes[draft.contractType] : '—',
    },
    { label: 'Max Supply', value: draft.maxSupply?.toLocaleString() || '—' },
    { label: 'Royalty', value: `${draft.royaltyPercentage ?? 5}%` },
  ];

  return (
    <div className="text-center">
      <h2 className="text-2xl font-semibold text-studio-text mb-2">
        Review your collection
      </h2>
      <p className="text-studio-text-muted mb-8">
        Make sure everything looks right before deploying
      </p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* Preview Card */}
        <div className="bg-studio-surface rounded-xl overflow-hidden border border-studio-border">
          {draft.bannerImage && (
            <div className="aspect-[3/1] relative overflow-hidden">
              <MediaRenderer
                src={draft.bannerImage}
                alt="Banner"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="p-4 flex items-center gap-4">
            {draft.image ? (
              <div className="h-16 w-16 rounded-xl overflow-hidden relative flex-shrink-0">
                <MediaRenderer
                  src={draft.image}
                  alt="Collection"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="h-16 w-16 rounded-xl bg-studio-border flex items-center justify-center text-studio-text-muted flex-shrink-0">
                {draft.symbol?.slice(0, 2) || '??'}
              </div>
            )}
            <div className="text-left">
              <h3 className="font-semibold text-studio-text">
                {draft.name || 'Untitled'}
              </h3>
              <p className="text-sm text-studio-text-muted">
                {draft.symbol || 'SYMBOL'}
              </p>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="bg-studio-surface rounded-xl border border-studio-border divide-y divide-studio-border">
          {items.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3">
              <span className="text-sm text-studio-text-muted">{item.label}</span>
              <span className="text-sm font-medium text-studio-text">
                {item.value}
              </span>
            </div>
          ))}
        </div>

        {/* Warning */}
        <div className="flex items-start gap-3 p-4 bg-amber-500/10 rounded-xl text-left">
          <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-500">Ready to deploy?</p>
            <p className="text-xs text-amber-500/80 mt-1">
              This will create a smart contract on{' '}
              {chains[draft.chainId || 11155111]}. You&apos;ll need to confirm
              the transaction in your wallet.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
