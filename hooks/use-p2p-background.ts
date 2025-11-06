'use client';

import { useBackgroundCarousel } from '@/contexts/background-carousel-context';
import { useRouter, usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';

interface UseP2PBackgroundReturn {
  navigateToCollections: () => void;
  navigateToCollection: (collectionId: string, bannerImage: string) => void;
  navigateToTrader: (traderAddress: string, nftId?: string, collectionId?: string) => void;
  navigateToHub: () => void;
  setCollectionBackground: (bannerImage: string) => void;
  restoreDefaultBackground: () => void;
}

const DEFAULT_BACKGROUND = '/assets/img/bg1.jpg';
const TRANSITION_DELAY = 50; // Small delay for smooth route transitions

export function useP2PBackground(): UseP2PBackgroundReturn {
  const { setOverlayBackground } = useBackgroundCarousel();
  const router = useRouter();

  const navigateToCollections = useCallback(() => {
    router.push('/p2p/collections');
  }, [router]);

  const navigateToCollection = useCallback((collectionId: string, bannerImage: string) => {
    // Set overlay IMMEDIATELY for fluid transition (doesn't replace base background)
    if (bannerImage) {
      setOverlayBackground(bannerImage);
    }

    // Navigate without delay - overlay is already set
    router.push(`/p2p/collections/${collectionId}`);
  }, [router, setOverlayBackground]);

  const navigateToTrader = useCallback((
    traderAddress: string,
    nftId?: string,
    collectionId?: string
  ) => {
    const params = new URLSearchParams();
    params.set('trader', traderAddress);
    if (nftId) params.set('nft', nftId);
    if (collectionId) params.set('collection', collectionId);

    const queryString = params.toString();
    const url = `/p2p?${queryString}`;

    router.push(url);
  }, [router]);

  const navigateToHub = useCallback(() => {
    // Clear overlay when returning to hub
    setOverlayBackground(null);
    router.push('/p2p');
  }, [router, setOverlayBackground]);

  const setCollectionBackground = useCallback((bannerImage: string) => {
    // Use overlay instead of replacing base background
    if (bannerImage) {
      setOverlayBackground(bannerImage);
    }
  }, [setOverlayBackground]);

  const restoreDefaultBackground = useCallback(() => {
    // Clear the overlay (base background never changed)
    setOverlayBackground(null);
  }, [setOverlayBackground]);

  return {
    navigateToCollections,
    navigateToCollection,
    navigateToTrader,
    navigateToHub,
    setCollectionBackground,
    restoreDefaultBackground,
  };
}
