'use client';

import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, X, Loader2 } from 'lucide-react';
import { useP2PSelectionFlow } from '@/contexts/p2p-selection-flow-context';
import { useP2PSelectionFlowNavigation } from '@/hooks/use-p2p-selection-flow';
import { SelectedNFTsBar } from '@/components/p2p/selection-flow/selected-nfts-bar';
import { CollectionBrowser } from '@/components/p2p/selection-flow/collection-browser';
import { NFTSelectionGrid } from '@/components/p2p/selection-flow/nft-selection-grid';
import { TraderSelectionMenu } from '@/components/p2p/selection-flow/trader-selection-menu';

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

function TraderNFTSelectionPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const traderAddress = params.address as string;
  const initialNftId = searchParams?.get('initial') || undefined;
  const collectionName = searchParams?.get('collection') || undefined;

  const {
    selectedTraderNFTs,
    toggleTraderNFT,
    clearTraderSelection,
    setTraderAddress,
    setInitialNFT,
    isTraderNFTSelected,
    resetFlow,
    traderAddress: contextTraderAddress,
  } = useP2PSelectionFlow();

  const { proceedToUserSelection, goBackFromTraderSelection } = useP2PSelectionFlowNavigation();

  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  // Track if initial NFT has been selected to prevent duplicate selection
  const initialNftSelectedRef = useRef(false);

  // Defensive cleanup: Clear selections if trader address changes (handles direct URL navigation)
  useEffect(() => {
    if (contextTraderAddress && contextTraderAddress !== traderAddress) {
      // User navigated to a different trader - clear old selections
      resetFlow();
      initialNftSelectedRef.current = false;
    }
  }, [traderAddress, contextTraderAddress, resetFlow]);

  // Set trader address on mount
  useEffect(() => {
    if (traderAddress) {
      setTraderAddress(traderAddress);
    }
  }, [traderAddress, setTraderAddress]);

  // Fetch trader's NFTs
  useEffect(() => {
    const fetchNFTs = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/user/${traderAddress}/nfts`);
        const data = await response.json();

        if (data.success) {
          const nftList = data.data.nfts || [];
          setNfts(nftList);

          // Auto-select initial NFT if found (only once)
          if (initialNftId && !initialNftSelectedRef.current) {
            const initialNFT = nftList.find((nft: NFT) => nft.id === initialNftId || nft.tokenId === initialNftId);
            if (initialNFT) {
              setInitialNFT(initialNFT);
              // Check if not already selected before toggling
              if (!isTraderNFTSelected(initialNFT.id)) {
                toggleTraderNFT(initialNFT);
              }
              initialNftSelectedRef.current = true;
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch trader NFTs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNFTs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [traderAddress, initialNftId]);

  // Group NFTs by collection
  const collections = useMemo(() => {
    const collectionMap = new Map<string, { id: string; name: string; image?: string; nftCount: number }>();

    nfts.forEach((nft) => {
      if (nft.collection && nft.collectionId) {
        if (!collectionMap.has(nft.collectionId)) {
          collectionMap.set(nft.collectionId, {
            id: nft.collectionId,
            name: nft.collection.name,
            image: nft.image, // Use first NFT image as collection image
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
    clearTraderSelection();
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

  const handleNext = () => {
    proceedToUserSelection();
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
            onClick={goBackFromTraderSelection}
            className="flex items-center space-x-2 text-white/60 hover:text-white transition-colors min-h-[44px]"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-lg">Back</span>
          </button>

          <h1 className="text-2xl font-bold text-white">Select NFTs</h1>

          <TraderSelectionMenu
            onChangeTrader={handleChangeTrader}
            onCancel={handleCancel}
          />
        </div>
      </motion.div>

      {/* Collection Browser */}
      {collections.length > 1 && (
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
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredNFTs.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 px-4 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <X className="w-10 h-10 text-white/20" />
          </div>
          <p className="text-white/60 text-lg">No NFTs found</p>
        </motion.div>
      )}

      {/* NFT Grid */}
      {!isLoading && filteredNFTs.length > 0 && (
        <div className={`py-6 ${collections.length > 1 ? 'mt-[52px]' : 'mt-0'}`}>
          <NFTSelectionGrid
            nfts={filteredNFTs}
            selectedNFTIds={selectedTraderNFTs.map((nft) => nft.id)}
            onToggleNFT={toggleTraderNFT}
            isInitialNFT={(id) => id === initialNftId}
          />
        </div>
      )}

      {/* Sticky Bottom Bar */}
      <SelectedNFTsBar
        selectedNFTs={selectedTraderNFTs}
        onNext={handleNext}
        onBack={goBackFromTraderSelection}
        onClear={handleClear}
        nextLabel="Next"
      />
    </div>
  );
}

export default function TraderNFTSelectionPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    }>
      <TraderNFTSelectionPageContent />
    </Suspense>
  );
}
