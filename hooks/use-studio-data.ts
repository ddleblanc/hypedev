"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useActiveAccount } from 'thirdweb/react';
import { useAuth } from '@/contexts/auth-context';
import { useStudio } from '@/contexts/studio-context';
import { trpc } from "@/lib/trpc/client";

// Types from the studio
interface Project {
  id: string;
  name: string;
  description: string;
  genre?: string | null;
  concept?: string | null;
  banner?: string | null;
  collections: number;
  totalNFTs: number;
  status: string;
  createdAt: Date;
}

interface Collection {
  id: string;
  name: string;
  symbol: string;
  description?: string;
  image?: string;
  bannerImage?: string;
  projectId?: string;
  project?: {
    id: string;
    name: string;
  };
  address?: string;
  chainId: number;
  contractType?: string;
  maxSupply?: number;
  mintedSupply: number;
  royaltyPercentage: number;
  isDeployed: boolean;
  volume: number;
  holders: number;
  floorPrice: number;
  createdAt: Date;
  deployedAt?: Date;
  sharedMetadata?: {
    name: string;
    description?: string;
    image: string;
    external_url?: string;
    animation_url?: string;
    attributes?: Array<{
      trait_type: string;
      value: string;
    }>;
  };
  sharedMetadataSetAt?: string;
  claimPhases?: string;
}

interface NFT {
  id: string;
  tokenId: string;
  name: string;
  description?: string;
  image?: string;
  metadataUri?: string;
  collectionId: string;
  collection: {
    name: string;
    symbol: string;
    address?: string;
  };
  attributes: unknown;
  ownerAddress?: string;
  isMinted: boolean;
  mintedAt?: Date;
  traitCount: number;
  rarityScore?: number;
  rarityRank?: number;
  rarityTier?: string;
  createdAt: Date;
  traits?: Array<{
    traitType: string;
    value: string;
    displayType?: string;
  }>;
}

interface Lootbox {
  id: string;
  onChainId: number | null;
  name: string;
  description: string | null;
  image: string | null;
  price: number;
  priceCurrency: string;
  rarity: string | null;
  totalSupply: number;
  remainingSupply: number;
  rewardsPerOpening: number;
  contractAddress: string | null;
  isActive: boolean;
  projectId: string | null;
  project: {
    id: string;
    name: string;
  } | null;
  rewardCount: number;
  rewardPreviews: Array<{
    id: string;
    name: string;
    image: string;
    rarity: string;
  }>;
  openingsCount: number;
  createdAt: Date;
}

export function useStudioData() {
  const account = useActiveAccount();
  const { isConnected } = useAuth();
  const { setStudioData } = useStudio();

  const address = account?.address || "";
  const enabled = Boolean(address) && isConnected;

  // Use tRPC queries for data fetching
  const {
    data: projectsData,
    isLoading: projectsLoading,
    error: projectsError,
    refetch: refetchProjects
  } = trpc.studio.projects.list.useQuery(
    { address },
    {
      enabled,
      placeholderData: (prev) => prev
    }
  );

  const {
    data: collectionsData,
    isLoading: collectionsLoading,
    error: collectionsError,
    refetch: refetchCollections
  } = trpc.studio.collections.list.useQuery(
    { address },
    {
      enabled,
      placeholderData: (prev) => prev
    }
  );

  const {
    data: nftsData,
    isLoading: nftsLoading,
    error: nftsError,
    refetch: refetchNfts
  } = trpc.studio.nfts.list.useQuery(
    { address },
    {
      enabled,
      placeholderData: (prev) => prev
    }
  );

  const {
    data: lootboxesData,
    isLoading: lootboxesLoading,
    error: lootboxesError,
    refetch: refetchLootboxes
  } = trpc.studio.lootboxes.list.useQuery(
    { address },
    {
      enabled,
      placeholderData: (prev) => prev
    }
  );

  // Extract data from queries - memoize to prevent new array references each render
  const projects = useMemo<Project[]>(
    () => (projectsData?.projects || []) as unknown as Project[],
    [projectsData?.projects]
  );

  const collections = useMemo<Collection[]>(
    () => (collectionsData?.collections || []) as unknown as Collection[],
    [collectionsData?.collections]
  );

  const nfts = useMemo<NFT[]>(
    () => (nftsData?.nfts || []) as unknown as NFT[],
    [nftsData?.nfts]
  );

  const lootboxes = useMemo<Lootbox[]>(
    () => (lootboxesData?.lootboxes || []) as unknown as Lootbox[],
    [lootboxesData?.lootboxes]
  );

  const isLoading = projectsLoading || collectionsLoading || nftsLoading || lootboxesLoading;
  const error = projectsError?.message || collectionsError?.message || nftsError?.message || lootboxesError?.message || null;

  const refreshData = useCallback(() => {
    refetchProjects();
    refetchCollections();
    refetchNfts();
    refetchLootboxes();
  }, [refetchProjects, refetchCollections, refetchNfts, refetchLootboxes]);

  const fetchProjects = useCallback(() => {
    refetchProjects();
  }, [refetchProjects]);

  const fetchCollections = useCallback(() => {
    refetchCollections();
  }, [refetchCollections]);

  const fetchNFTs = useCallback(() => {
    refetchNfts();
  }, [refetchNfts]);

  const fetchLootboxes = useCallback(() => {
    refetchLootboxes();
  }, [refetchLootboxes]);

  // Track previous values to prevent unnecessary context updates
  const prevDataRef = useRef<{
    projects: Project[];
    collections: Collection[];
    nfts: NFT[];
    lootboxes: Lootbox[];
    isLoading: boolean;
    error: string | null;
  } | null>(null);

  // Update studio context when data actually changes
  useEffect(() => {
    const prev = prevDataRef.current;

    // Skip if nothing changed (referential equality check)
    if (
      prev &&
      prev.projects === projects &&
      prev.collections === collections &&
      prev.nfts === nfts &&
      prev.lootboxes === lootboxes &&
      prev.isLoading === isLoading &&
      prev.error === error
    ) {
      return;
    }

    // Update ref with current values
    prevDataRef.current = { projects, collections, nfts, lootboxes, isLoading, error };

    // Sync to context
    setStudioData({
      projects,
      collections,
      nfts,
      isLoading,
      error
    });
  }, [projects, collections, nfts, lootboxes, isLoading, error, setStudioData]);

  return {
    projects,
    collections,
    nfts,
    lootboxes,
    isLoading,
    error,
    refreshData,
    fetchProjects,
    fetchCollections,
    fetchNFTs,
    fetchLootboxes
  };
}

export type { Project, Collection, NFT, Lootbox };
