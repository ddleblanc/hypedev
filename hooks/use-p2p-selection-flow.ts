'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { useP2PSelectionFlow } from '@/contexts/p2p-selection-flow-context';

export function useP2PSelectionFlowNavigation() {
  const router = useRouter();
  const {
    selectedTraderNFTs,
    selectedUserNFTs,
    traderAddress,
    getTraderSelectionCount,
    getUserSelectionCount,
  } = useP2PSelectionFlow();

  const proceedToUserSelection = useCallback(() => {
    if (!traderAddress) {
      console.error('No trader address set');
      return;
    }

    if (getTraderSelectionCount() === 0) {
      console.warn('No trader NFTs selected');
      return;
    }

    router.push(`/p2p/select-offer-nfts?trader=${traderAddress}`);
  }, [router, traderAddress, getTraderSelectionCount]);

  const proceedToBoardReview = useCallback(() => {
    if (!traderAddress) {
      console.error('No trader address set');
      return;
    }

    if (getTraderSelectionCount() === 0) {
      console.warn('No trader NFTs selected');
      return;
    }

    if (getUserSelectionCount() === 0) {
      console.warn('No user NFTs selected');
      return;
    }

    // Navigate to dedicated board review page
    const traderNftIds = selectedTraderNFTs.map((nft) => nft.id).join(',');
    const userNftIds = selectedUserNFTs.map((nft) => nft.id).join(',');

    router.push(`/p2p/board/review?trader=${traderAddress}&traderNfts=${traderNftIds}&userNfts=${userNftIds}`);
  }, [router, traderAddress, selectedTraderNFTs, selectedUserNFTs, getTraderSelectionCount, getUserSelectionCount]);

  // Legacy function - kept for backward compatibility
  const proceedToBoard = useCallback(() => {
    if (!traderAddress) {
      console.error('No trader address set');
      return;
    }

    if (getTraderSelectionCount() === 0) {
      console.warn('No trader NFTs selected');
      return;
    }

    if (getUserSelectionCount() === 0) {
      console.warn('No user NFTs selected');
      return;
    }

    // Build URL with pre-populated NFT IDs
    const traderNftIds = selectedTraderNFTs.map((nft) => nft.id).join(',');
    const userNftIds = selectedUserNFTs.map((nft) => nft.id).join(',');

    router.push(`/p2p?trader=${traderAddress}&traderNfts=${traderNftIds}&userNfts=${userNftIds}`);
  }, [router, traderAddress, selectedTraderNFTs, selectedUserNFTs, getTraderSelectionCount, getUserSelectionCount]);

  const navigateToTraderSelection = useCallback(
    (address: string, initialNftId?: string, collectionName?: string) => {
      const params = new URLSearchParams();
      if (initialNftId) params.set('initial', initialNftId);
      if (collectionName) params.set('collection', collectionName);

      const queryString = params.toString();
      const url = `/p2p/select-trader-nfts/${address}${queryString ? `?${queryString}` : ''}`;

      router.push(url);
    },
    [router]
  );

  // Context-aware navigation functions (replace unreliable router.back())
  const goBackFromTraderSelection = useCallback(() => {
    // From Step 1, go back to collections
    router.push('/p2p/collections');
  }, [router]);

  const goBackFromOfferSelection = useCallback(() => {
    // From Step 2, go back to Step 1 (preserves user's selections)
    if (!traderAddress) {
      console.error('No trader address set');
      router.push('/p2p/collections');
      return;
    }
    router.push(`/p2p/select-trader-nfts/${traderAddress}`);
  }, [router, traderAddress]);

  const goBackFromReview = useCallback(() => {
    // From Step 3, go back to Step 2 (preserves both selections)
    if (!traderAddress) {
      console.error('No trader address set');
      router.push('/p2p/collections');
      return;
    }
    router.push(`/p2p/select-offer-nfts?trader=${traderAddress}`);
  }, [router, traderAddress]);

  // Legacy generic goBack - deprecated, kept for compatibility
  const goBack = useCallback(() => {
    router.back();
  }, [router]);

  return {
    proceedToUserSelection,
    proceedToBoardReview,
    proceedToBoard, // Legacy
    navigateToTraderSelection,
    goBackFromTraderSelection,
    goBackFromOfferSelection,
    goBackFromReview,
    goBack, // Legacy - deprecated
  };
}
