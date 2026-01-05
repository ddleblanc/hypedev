'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useP2PSelectionFlow } from '@/contexts/p2p-selection-flow-context';
import { useP2PSelectionFlowNavigation } from '@/hooks/use-p2p-selection-flow';
import { SelectedNFTsBar } from '@/components/p2p/selection-flow/selected-nfts-bar';
import { CollectionBrowser } from '@/components/p2p/selection-flow/collection-browser';
import { NFTSelectionGrid } from '@/components/p2p/selection-flow/nft-selection-grid';
import { OfferSelectionMenu } from '@/components/p2p/selection-flow/offer-selection-menu';
import { trpc } from '@/lib/trpc/client';

interface NFT {
  id: string;
  tokenId: string;
  name: string;
  image: string;
  collection?: {
    name: string;
    symbol: string;
  };
  collectionId?: string;
  rarityTier?: string;
}

function UserOfferSelectionPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const address = user?.walletAddress;
  const traderAddress = searchParams?.get('trader');

  const {
    selectedUserNFTs,
    selectedTraderNFTs,
    toggleUserNFT,
    clearUserSelection,
    isUserNFTSelected,
    resetFlow,
  } = useP2PSelectionFlow();

  const { proceedToBoardReview, goBackFromOfferSelection } = useP2PSelectionFlowNavigation();

  const [isCreatingTrade, setIsCreatingTrade] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  // tRPC query for user's NFTs
  const nftsQuery = trpc.user.nfts.list.useQuery(
    {
      address: address || '',
      filter: 'owned',
    },
    {
      enabled: !!address,
    }
  );

  const nfts = useMemo(() => {
    if (!nftsQuery.data?.nfts) return [];
    return nftsQuery.data.nfts.map((nft) => ({
      id: nft.id,
      tokenId: nft.tokenId,
      name: nft.name,
      image: nft.image || '',
      collection: nft.collection
        ? {
            name: nft.collection.name,
            symbol: '',
          }
        : undefined,
      collectionId: nft.collectionId || undefined,
      rarityTier: nft.rarityTier || undefined,
    }));
  }, [nftsQuery.data]);

  // Group NFTs by collection
  const collections = useMemo(() => {
    const collectionMap = new Map<string, { id: string; name: string; image?: string; nftCount: number }>();

    nfts.forEach((nft) => {
      if (nft.collection && nft.collectionId) {
        if (!collectionMap.has(nft.collectionId)) {
          collectionMap.set(nft.collectionId, {
            id: nft.collectionId,
            name: nft.collection.name,
            image: nft.image,
            nftCount: 0,
          });
        }
        const col = collectionMap.get(nft.collectionId)!;
        col.nftCount++;
      }
    });

    return Array.from(collectionMap.values());
  }, [nfts]);

  // Filter NFTs by selected collection
  const filteredNFTs = useMemo(() => {
    if (selectedCollectionId === null) {
      return nfts;
    }
    return nfts.filter((nft) => nft.collectionId === selectedCollectionId);
  }, [nfts, selectedCollectionId]);

  const handleClear = () => {
    clearUserSelection();
  };

  const handleEditTraderNFTs = () => {
    // Go back to Step 1 to edit trader's selections
    // Context automatically preserves selectedUserNFTs
    router.push(`/p2p/select-trader-nfts/${traderAddress}`);
  };

  const handleChangeTrader = () => {
    // Reset entire flow and go back to collections
    resetFlow();
    router.push('/p2p/collections');
  };

  const handleCancel = () => {
    // Reset flow and return to P2P hub
    resetFlow();
    router.push('/p2p');
  };

  const handleCreateTrade = async () => {
    setIsCreatingTrade(true);
    // Small delay for UX (shows loading state)
    await new Promise((resolve) => setTimeout(resolve, 300));
    proceedToBoardReview();
  };

  return (
    <div className="relative z-10 min-h-screen pb-32">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="sticky top-[64px] z-40 bg-black/95 backdrop-blur-2xl border-b border-white/10 px-4 py-4"
      >
        <div className="flex items-center justify-between">
          <button
            onClick={goBackFromOfferSelection}
            className="flex items-center space-x-2 text-white/60 hover:text-white transition-colors min-h-[44px]"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-lg">Back</span>
          </button>

          <h1 className="text-2xl font-bold text-white">Your Offer</h1>

          <OfferSelectionMenu
            onEditTraderNFTs={handleEditTraderNFTs}
            onChangeTrader={handleChangeTrader}
            onCancel={handleCancel}
          />
        </div>
      </motion.div>

      {/* Collection Browser */}
      {collections.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="sticky top-[137px] z-30 bg-black/95 backdrop-blur-2xl border-b border-white/10 py-4"
        >
          <CollectionBrowser
            collections={collections}
            selectedCollection={selectedCollectionId}
            onCollectionChange={setSelectedCollectionId}
          />
        </motion.div>
      )}

      {/* Loading State */}
      {nftsQuery.isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!nftsQuery.isLoading && filteredNFTs.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 px-4 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <X className="w-10 h-10 text-white/20" />
          </div>
          <p className="text-white/60 text-lg">No NFTs in your collection</p>
          <p className="text-white/40 text-sm mt-2">You need NFTs to create a trade offer</p>
        </motion.div>
      )}

      {/* NFT Grid */}
      {!nftsQuery.isLoading && filteredNFTs.length > 0 && (
        <div className="py-6 mt-[3.2rem]">
          <NFTSelectionGrid
            nfts={filteredNFTs}
            selectedNFTIds={selectedUserNFTs.map((nft) => nft.id)}
            onToggleNFT={toggleUserNFT}
          />
        </div>
      )}

      {/* Sticky Bottom Bar */}
      <SelectedNFTsBar
        selectedNFTs={selectedUserNFTs}
        onNext={handleCreateTrade}
        onBack={goBackFromOfferSelection}
        onClear={handleClear}
        nextLabel="Create Trade"
        isLoading={isCreatingTrade}
      />
    </div>
  );
}

export default function UserOfferSelectionPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    }>
      <UserOfferSelectionPageContent />
    </Suspense>
  );
}
