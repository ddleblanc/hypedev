'use client';

import { motion } from 'framer-motion';
import { CheckCircle, ExternalLink, Plus, ArrowRight, Box, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStudioNew } from '@/contexts/studio-new-context';
import Link from 'next/link';

interface SuccessStepProps {
  contractAddress?: string;
  lootboxId?: number;
  chainId?: number;
  isLootbox?: boolean;
}

const explorerUrls: Record<number, string> = {
  1: 'https://etherscan.io/address/',
  11155111: 'https://sepolia.etherscan.io/address/',
  137: 'https://polygonscan.com/address/',
  42161: 'https://arbiscan.io/address/',
};

export function SuccessStep({ contractAddress, lootboxId, chainId, isLootbox }: SuccessStepProps) {
  const { resetCreate, goToProjects, state, openNftModal } = useStudioNew();
  const finalChainId = chainId || state.create.draft.chainId || 11155111;
  const { draft } = state.create;

  const explorerUrl = contractAddress
    ? `${explorerUrls[finalChainId] || explorerUrls[11155111]}${contractAddress}`
    : null;

  // Handler for "Add NFTs" that opens modal with context
  const handleAddNfts = () => {
    if (contractAddress) {
      openNftModal({
        id: 'new-collection', // Will be updated after DB sync
        name: draft.name || 'New Collection',
        symbol: draft.symbol || 'NFT',
        address: contractAddress,
        chainId: finalChainId,
        contractType: draft.contractType || undefined,
        image: draft.image || undefined,
      });
    }
    // Also navigate to projects so user can see the collection
    goToProjects();
  };

  return (
    <div className="text-center py-8">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="mx-auto h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center mb-6"
      >
        {isLootbox ? (
          <Box className="h-10 w-10 text-green-500" />
        ) : (
          <CheckCircle className="h-10 w-10 text-green-500" />
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-2xl font-semibold text-studio-text mb-2">
          {isLootbox ? 'Lootbox deployed!' : 'Collection deployed!'}
        </h2>
        <p className="text-studio-text-muted mb-8">
          {isLootbox
            ? 'Your lootbox is live and ready for purchases'
            : 'Your collection is live and ready for NFTs'}
        </p>

        {/* Contract Address */}
        {contractAddress && (
          <div className="mb-6 p-3 bg-studio-surface rounded-lg border border-studio-border">
            <p className="text-xs text-studio-text-muted mb-1">
              Contract Address
            </p>
            <p className="font-mono text-sm text-studio-text truncate">
              {contractAddress}
            </p>
          </div>
        )}

        {/* Next Steps */}
        <div className="space-y-3 mb-8">
          <h3 className="text-sm font-medium text-studio-text-muted">
            What&apos;s next?
          </h3>
          <div className="space-y-2">
            {isLootbox && lootboxId ? (
              <>
                <Link
                  href={`/lootboxes/${lootboxId}`}
                  className="w-full flex items-center gap-3 p-4 rounded-xl bg-studio-surface border border-studio-border hover:border-studio-text-muted/30 transition-colors text-left"
                >
                  <div className="h-10 w-10 rounded-lg bg-studio-accent/10 flex items-center justify-center">
                    <Eye className="h-5 w-5 text-studio-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-studio-text">View Lootbox</p>
                    <p className="text-xs text-studio-text-muted">
                      See your lootbox in the marketplace
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-studio-text-muted" />
                </Link>

                {explorerUrl && (
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center gap-3 p-4 rounded-xl bg-studio-surface border border-studio-border hover:border-studio-text-muted/30 transition-colors text-left"
                  >
                    <div className="h-10 w-10 rounded-lg bg-studio-surface flex items-center justify-center border border-studio-border">
                      <ExternalLink className="h-5 w-5 text-studio-text-muted" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-studio-text">View on Explorer</p>
                      <p className="text-xs text-studio-text-muted">
                        See the transaction on block explorer
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-studio-text-muted" />
                  </a>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={handleAddNfts}
                  className="w-full flex items-center gap-3 p-4 rounded-xl bg-studio-surface border border-studio-border hover:border-studio-text-muted/30 transition-colors text-left"
                >
                  <div className="h-10 w-10 rounded-lg bg-studio-accent/10 flex items-center justify-center">
                    <Plus className="h-5 w-5 text-studio-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-studio-text">Add NFTs</p>
                    <p className="text-xs text-studio-text-muted">
                      Upload and mint your first items
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-studio-text-muted" />
                </button>

                {explorerUrl && (
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center gap-3 p-4 rounded-xl bg-studio-surface border border-studio-border hover:border-studio-text-muted/30 transition-colors text-left"
                  >
                    <div className="h-10 w-10 rounded-lg bg-studio-surface flex items-center justify-center border border-studio-border">
                      <ExternalLink className="h-5 w-5 text-studio-text-muted" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-studio-text">View on Explorer</p>
                      <p className="text-xs text-studio-text-muted">
                        See your contract on block explorer
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-studio-text-muted" />
                  </a>
                )}
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={resetCreate}
            className="flex-1 border-studio-border text-studio-text hover:bg-studio-surface"
          >
            Create Another
          </Button>
          <Button
            onClick={goToProjects}
            className="flex-1 bg-studio-accent hover:bg-studio-accent/90 text-white"
          >
            View Projects
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
