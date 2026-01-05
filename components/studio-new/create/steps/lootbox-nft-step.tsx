'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useActiveAccount } from 'thirdweb/react';
import { Image as ImageIcon, Search, Check, Loader2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MediaRenderer } from '@/components/MediaRenderer';
import { useStudioNew, type SelectedNFT, type LootboxRarity } from '@/contexts/studio-new-context';
import { trpc } from '@/lib/trpc/client';

interface OwnedNFT {
  id: string;
  contractAddress: string;
  tokenId: string;
  name: string;
  image: string;
  collectionName: string;
  tokenType: 'ERC721' | 'ERC1155';
  balance?: number;
  isOnChain: boolean;
  onChainTokenId?: string;
}

export function LootboxNftStep() {
  const { state, updateLootboxDraft } = useStudioNew();
  const account = useActiveAccount();
  const [searchQuery, setSearchQuery] = useState('');

  const lootbox = state.create.draft.lootbox;
  const selectedNFTs = lootbox?.selectedNFTs || [];
  const supply = lootbox?.supply || 0;
  const rewardsPerOpening = lootbox?.rewardsPerOpening || 1;
  const requiredCount = supply * rewardsPerOpening;

  // Fetch owned NFTs via tRPC
  const { data: ownedNftsData, isLoading, error: queryError } = trpc.user.nfts.owned.useQuery(
    { address: account?.address || '' },
    {
      enabled: !!account?.address,
      staleTime: 60 * 1000,
    }
  );

  // Include both on-chain and unminted NFTs - unminted will be auto-minted on deploy
  const { allNFTs, onChainCount, unmintedCount } = useMemo(() => {
    if (!ownedNftsData?.nfts) {
      return { allNFTs: [] as OwnedNFT[], onChainCount: 0, unmintedCount: 0 };
    }
    const onChain = ownedNftsData.nfts.filter((nft) => nft.isOnChain).length;
    const unminted = ownedNftsData.nfts.length - onChain;
    return { allNFTs: ownedNftsData.nfts, onChainCount: onChain, unmintedCount: unminted };
  }, [ownedNftsData]);

  const ownedNFTs = allNFTs;

  const error = queryError ? 'Failed to load your NFTs. Please try again.' : null;

  const toggleNFTSelection = (nft: OwnedNFT) => {
    const isSelected = selectedNFTs.some((s) => s.id === nft.id);

    if (isSelected) {
      updateLootboxDraft({
        selectedNFTs: selectedNFTs.filter((s) => s.id !== nft.id),
      });
    } else {
      // Use onChainTokenId if available (this is the actual on-chain ID)
      const tokenIdToUse = nft.onChainTokenId || nft.tokenId;
      const newSelected: SelectedNFT = {
        id: nft.id,
        contractAddress: nft.contractAddress,
        tokenId: tokenIdToUse,
        name: nft.name,
        image: nft.image,
        collectionName: nft.collectionName,
        tokenType: nft.tokenType,
        amount: nft.tokenType === 'ERC1155' ? 1 : undefined,
        weight: 100,
        rarity: 'common' as LootboxRarity,
        isOnChain: nft.isOnChain, // Track if needs minting
        collectionId: nft.id.split('-')[0], // Extract collection ID from composite ID
      };
      updateLootboxDraft({
        selectedNFTs: [...selectedNFTs, newSelected],
      });
    }
  };

  const filteredNFTs = ownedNFTs.filter(
    (nft) =>
      nft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nft.collectionName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isSelected = (id: string) => selectedNFTs.some((s) => s.id === id);
  const hasEnough = selectedNFTs.length >= requiredCount;

  return (
    <div className="text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto h-14 w-14 rounded-xl bg-studio-accent/10 flex items-center justify-center mb-4"
      >
        <ImageIcon className="h-7 w-7 text-studio-accent" />
      </motion.div>

      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-semibold text-studio-text">
          Select reward NFTs
        </h2>
        <Badge
          variant={hasEnough ? 'default' : 'secondary'}
          className={hasEnough ? 'bg-green-500 text-white' : ''}
        >
          {selectedNFTs.length} / {requiredCount}
        </Badge>
      </div>
      <p className="text-studio-text-muted mb-6">
        Choose NFTs from your wallet to include as rewards
      </p>

      {/* Warning if not enough */}
      {!hasEnough && requiredCount > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-4 text-left">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <p className="text-xs text-amber-400">
            Select at least {requiredCount} NFTs ({supply} supply x {rewardsPerOpening} rewards per opening)
          </p>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-studio-text-muted" />
        <Input
          placeholder="Search by name or collection..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-studio-surface border-studio-border text-studio-text"
        />
      </div>

      {/* Error notice */}
      {error && (
        <div className="mb-4 p-2 bg-amber-500/10 rounded-lg">
          <p className="text-xs text-amber-400">{error}</p>
        </div>
      )}

      {/* Unminted NFTs notice */}
      {unmintedCount > 0 && (
        <div className="mb-4 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20 text-left">
          <p className="text-xs text-amber-400">
            <strong>{unmintedCount} unminted NFT{unmintedCount > 1 ? 's' : ''}</strong> - These will be automatically minted when you deploy the lootbox.
            Unminted NFTs are marked with an orange border below.
          </p>
        </div>
      )}

      {/* NFT Grid */}
      <div className="min-h-[250px] text-left">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 text-studio-text-muted animate-spin" />
            <span className="ml-2 text-sm text-studio-text-muted">Loading your NFTs...</span>
          </div>
        ) : filteredNFTs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 px-4">
            <ImageIcon className="w-10 h-10 text-studio-text-muted/30 mb-3" />
            <p className="text-studio-text-muted text-sm text-center">
              {searchQuery ? 'No NFTs match your search' : 'No NFTs found in your wallet'}
            </p>
            {!searchQuery && (
              <p className="text-studio-text-muted/70 text-xs text-center mt-2 max-w-[250px]">
                Make sure you have NFTs on Sepolia that you want to use as lootbox rewards
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 max-h-[280px] overflow-y-auto pr-1">
            {filteredNFTs.map((nft) => (
              <button
                key={nft.id}
                onClick={() => toggleNFTSelection(nft)}
                className={`relative group rounded-xl overflow-hidden border-2 transition-all ${
                  isSelected(nft.id)
                    ? 'border-studio-accent ring-2 ring-studio-accent/30'
                    : !nft.isOnChain
                      ? 'border-amber-500/50 hover:border-amber-500'
                      : 'border-studio-border hover:border-studio-text-muted/40'
                }`}
              >
                <div className="aspect-square relative">
                  <MediaRenderer
                    src={nft.image}
                    alt={nft.name}
                    className="w-full h-full object-cover"
                  />

                  {/* Selection overlay */}
                  <div
                    className={`absolute inset-0 transition-colors ${
                      isSelected(nft.id)
                        ? 'bg-studio-accent/20'
                        : 'bg-black/0 group-hover:bg-black/30'
                    }`}
                  />

                  {/* Check mark */}
                  {isSelected(nft.id) && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-studio-accent flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}

                  {/* Token type badge */}
                  <Badge
                    variant="secondary"
                    className="absolute top-2 left-2 text-[9px] bg-black/50"
                  >
                    {nft.tokenType}
                  </Badge>

                  {/* Unminted indicator */}
                  {!nft.isOnChain && (
                    <Badge
                      variant="secondary"
                      className="absolute bottom-2 left-2 text-[8px] bg-amber-500/80 text-white"
                    >
                      Unminted
                    </Badge>
                  )}
                </div>

                {/* Info */}
                <div className="p-2 bg-studio-surface">
                  <p className="text-xs font-medium text-studio-text truncate">
                    {nft.name}
                  </p>
                  <p className="text-[10px] text-studio-text-muted truncate">
                    {nft.collectionName}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected summary */}
      {selectedNFTs.length > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-studio-surface border border-studio-border text-left">
          <p className="text-xs text-studio-text-muted mb-2">
            Selected ({selectedNFTs.length}):
          </p>
          <div className="flex flex-wrap gap-1.5">
            {selectedNFTs.slice(0, 8).map((nft) => (
              <Badge
                key={nft.id}
                variant="secondary"
                className="text-[10px] pr-1 flex items-center gap-1"
              >
                <span className="truncate max-w-[70px]">{nft.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateLootboxDraft({
                      selectedNFTs: selectedNFTs.filter((s) => s.id !== nft.id),
                    });
                  }}
                  className="ml-1 hover:text-red-400"
                >
                  x
                </button>
              </Badge>
            ))}
            {selectedNFTs.length > 8 && (
              <Badge variant="secondary" className="text-[10px]">
                +{selectedNFTs.length - 8} more
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
