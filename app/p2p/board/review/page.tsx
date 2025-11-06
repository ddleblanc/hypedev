'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { ReviewScreen } from '@/components/p2p/board-review/review-screen';
import { useP2PSelectionFlow } from '@/contexts/p2p-selection-flow-context';
import { useWalletAuthOptimized } from '@/hooks/use-wallet-auth-optimized';

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
  const { user } = useWalletAuthOptimized();
  const { selectedTraderNFTs, selectedUserNFTs, traderAddress, resetFlow } = useP2PSelectionFlow();

  const [traderNFTs, setTraderNFTs] = useState<NFT[]>([]);
  const [userNFTs, setUserNFTs] = useState<NFT[]>([]);
  const [traderName, setTraderName] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  const traderParam = searchParams?.get('trader') || traderAddress;
  const traderNftIdsParam = searchParams?.get('traderNfts');
  const userNftIdsParam = searchParams?.get('userNfts');

  // Load NFT data
  useEffect(() => {
    const loadNFTs = async () => {
      try {
        setIsLoading(true);

        // Priority 1: Use context selections if available
        if (selectedTraderNFTs.length > 0 && selectedUserNFTs.length > 0) {
          setTraderNFTs(selectedTraderNFTs);
          setUserNFTs(selectedUserNFTs);
          setIsLoading(false);
          return;
        }

        // Priority 2: Load from URL params
        if (traderNftIdsParam && userNftIdsParam && traderParam && user?.walletAddress) {
          const traderNftIds = traderNftIdsParam.split(',').filter(Boolean);
          const userNftIds = userNftIdsParam.split(',').filter(Boolean);

          // Fetch trader's NFTs
          const traderResponse = await fetch(`/api/user/${traderParam}/nfts`);
          const traderData = await traderResponse.json();

          if (traderData.success) {
            const traderNftList = traderData.data.nfts || [];
            const selectedTrader = traderNftList.filter((nft: NFT) =>
              traderNftIds.includes(nft.id)
            );
            setTraderNFTs(selectedTrader);
          }

          // Fetch user's NFTs
          const userResponse = await fetch(`/api/user/${user.walletAddress}/nfts`);
          const userData = await userResponse.json();

          if (userData.success) {
            const userNftList = userData.data.nfts || [];
            const selectedUser = userNftList.filter((nft: NFT) =>
              userNftIds.includes(nft.id)
            );
            setUserNFTs(selectedUser);
          }
        }
      } catch (error) {
        console.error('Failed to load NFTs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNFTs();
  }, [traderNftIdsParam, userNftIdsParam, traderParam, user, selectedTraderNFTs, selectedUserNFTs]);

  // Fetch trader info
  useEffect(() => {
    if (!traderParam) return;

    const fetchTraderInfo = async () => {
      try {
        const response = await fetch(`/api/user/${traderParam}`);
        const data = await response.json();
        if (data.success && data.data && data.data.user) {
          setTraderName(data.data.user.username);
        }
      } catch (error) {
        console.error('Failed to fetch trader info:', error);
      }
    };

    fetchTraderInfo();
  }, [traderParam]);

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
      // Create the trade offer
      const response = await fetch('/api/p2p/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initiatorAddress: user.walletAddress,
          counterpartyAddress: traderParam,
          initiatorNFTs: userNFTs.map((nft) => ({
            nftId: nft.id,
            tokenId: nft.tokenId,
          })),
          counterpartyNFTs: traderNFTs.map((nft) => ({
            nftId: nft.id,
            tokenId: nft.tokenId,
          })),
          message: message || undefined,
          status: 'PENDING',
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Clear the selection flow
        resetFlow();

        // Navigate to the P2P chat view with the trader
        router.push(`/p2p?trader=${traderParam}`);
      } else {
        console.error('Failed to create trade:', data.error);
        alert('Failed to send offer. Please try again.');
      }
    } catch (error) {
      console.error('Error sending offer:', error);
      alert('Failed to send offer. Please try again.');
    }
  };

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
      traderName={traderName}
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
