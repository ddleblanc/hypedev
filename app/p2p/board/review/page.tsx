'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { ReviewScreen } from '@/components/p2p/board-review/review-screen';
import { useP2PSelectionFlow } from '@/contexts/p2p-selection-flow-context';
import { useAuth } from '@/contexts/auth-context';
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
  floorPrice?: number;
  estimatedValue?: number;
}

function BoardReviewPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { selectedTraderNFTs, selectedUserNFTs, traderAddress, resetFlow } = useP2PSelectionFlow();

  const [traderNFTs, setTraderNFTs] = useState<NFT[]>([]);
  const [userNFTs, setUserNFTs] = useState<NFT[]>([]);

  const traderParam = searchParams?.get('trader') || traderAddress;
  const traderNftIdsParam = searchParams?.get('traderNfts');
  const userNftIdsParam = searchParams?.get('userNfts');

  // Use context data if available
  const hasContextData = selectedTraderNFTs.length > 0 && selectedUserNFTs.length > 0;

  // tRPC query for trader's profile (to get username)
  const traderProfileQuery = trpc.user.profile.byAddress.useQuery(
    { address: traderParam || '' },
    {
      enabled: !!traderParam,
    }
  );

  // tRPC queries for NFTs (only if we need to load from URL params)
  const traderNftsQuery = trpc.user.nfts.list.useQuery(
    {
      address: traderParam || '',
      filter: 'owned',
    },
    {
      enabled: !!traderParam && !hasContextData && !!traderNftIdsParam,
    }
  );

  const userNftsQuery = trpc.user.nfts.list.useQuery(
    {
      address: user?.walletAddress || '',
      filter: 'owned',
    },
    {
      enabled: !!user?.walletAddress && !hasContextData && !!userNftIdsParam,
    }
  );

  // tRPC mutation for creating trade
  const createTradeMutation = trpc.p2p.trades.create.useMutation();

  const traderName = traderProfileQuery.data?.username;

  // Load NFT data from context or URL params
  useEffect(() => {
    // Priority 1: Use context selections if available
    if (hasContextData) {
      setTraderNFTs(selectedTraderNFTs);
      setUserNFTs(selectedUserNFTs);
      return;
    }

    // Priority 2: Load from URL params using tRPC query results
    if (traderNftIdsParam && userNftIdsParam && traderParam && user?.walletAddress) {
      const traderNftIds = traderNftIdsParam.split(',').filter(Boolean);
      const userNftIds = userNftIdsParam.split(',').filter(Boolean);

      // Filter trader NFTs
      if (traderNftsQuery.data?.nfts) {
        const selectedTrader = traderNftsQuery.data.nfts
          .filter((nft) => traderNftIds.includes(nft.id))
          .map((nft) => ({
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
          }));
        setTraderNFTs(selectedTrader);
      }

      // Filter user NFTs
      if (userNftsQuery.data?.nfts) {
        const selectedUser = userNftsQuery.data.nfts
          .filter((nft) => userNftIds.includes(nft.id))
          .map((nft) => ({
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
          }));
        setUserNFTs(selectedUser);
      }
    }
  }, [
    hasContextData,
    selectedTraderNFTs,
    selectedUserNFTs,
    traderNftIdsParam,
    userNftIdsParam,
    traderParam,
    user,
    traderNftsQuery.data,
    userNftsQuery.data,
  ]);

  const handleBack = () => {
    // Go back to Step 2 (user offer selection)
    router.push(`/p2p/select-offer-nfts?trader=${traderParam}`);
  };

  const handleEditTraderNFTs = () => {
    // Go to Step 1 to edit trader's NFTs
    // Context automatically preserves selectedUserNFTs
    router.push(`/p2p/select-trader-nfts/${traderParam}`);
  };

  const handleEditUserNFTs = () => {
    // Go to Step 2 to edit user's NFTs
    // Context automatically preserves selectedTraderNFTs
    router.push(`/p2p/select-offer-nfts?trader=${traderParam}`);
  };

  const handleChangeTrader = () => {
    // Reset entire flow and go back to collections
    resetFlow();
    router.push('/p2p/collections');
  };

  const handleCancelTrade = () => {
    // Reset flow and return to P2P hub
    resetFlow();
    router.push('/p2p');
  };

  const handleSend = async (message?: string) => {
    if (!user?.walletAddress || !traderParam) {
      console.error('Missing user or trader address');
      return;
    }

    try {
      // Create the trade offer using tRPC mutation
      await createTradeMutation.mutateAsync({
        initiatorAddress: user.walletAddress,
        counterpartyAddress: traderParam,
        initiatorItems: userNFTs.map((nft) => ({
          nftId: nft.id,
        })),
        counterpartyItems: traderNFTs.map((nft) => ({
          nftId: nft.id,
        })),
        metadata: message ? { message } : undefined,
      });

      // Clear the selection flow
      resetFlow();

      // Navigate to the P2P chat view with the trader
      router.push(`/p2p?trader=${traderParam}`);
    } catch (error) {
      console.error('Error sending offer:', error);
      alert('Failed to send offer. Please try again.');
    }
  };

  const isLoading =
    (!hasContextData && (traderNftsQuery.isLoading || userNftsQuery.isLoading)) ||
    traderProfileQuery.isLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading trade details...</p>
        </div>
      </div>
    );
  }

  if (traderNFTs.length === 0 || userNFTs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-10 h-10 text-white/20" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">No NFTs Selected</h2>
          <p className="text-white/60 mb-6">
            Please select NFTs from both sides to create a trade offer.
          </p>
          <button
            onClick={() => router.push('/p2p/collections')}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold"
          >
            Browse Collections
          </button>
        </div>
      </div>
    );
  }

  return (
    <ReviewScreen
      traderNFTs={traderNFTs}
      userNFTs={userNFTs}
      traderName={traderName || undefined}
      traderAddress={traderParam || ''}
      onBack={handleBack}
      onEditTraderNFTs={handleEditTraderNFTs}
      onEditUserNFTs={handleEditUserNFTs}
      onChangeTrader={handleChangeTrader}
      onCancel={handleCancelTrade}
      onSend={handleSend}
    />
  );
}

export default function BoardReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-black">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      }
    >
      <BoardReviewPageContent />
    </Suspense>
  );
}
