"use client";

import { useState, useEffect, useCallback } from "react";
import { useActiveAccount } from 'thirdweb/react';
import { useAuth } from '@/contexts/auth-context';
import { useStudio } from '@/contexts/studio-context';

// Types from the studio
interface Project {
  id: string;
  name: string;
  description: string;
  genre?: string;
  concept?: string;
  banner?: string;
  collections: number;
  totalNFTs: number;
  status: 'active' | 'draft';
  createdAt: string;
}

interface Collection {
  id: string;
  name: string;
  symbol: string;
  description?: string;
  image?: string;
  bannerImage?: string;
  projectId: string;
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
  createdAt: string;
  deployedAt?: string;
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
  metadataUri: string;
  collectionId: string;
  collection: { 
    name: string; 
    symbol: string; 
    address?: string; 
  };
  attributes: any;
  ownerAddress: string;
  isMinted: boolean;
  mintedAt?: string;
  traitCount: number;
  rarityScore?: number;
  rarityRank?: number;
  rarityTier?: string;
  createdAt: string;
  traits?: Array<{
    traitType: string;
    value: string;
    displayType?: string;
  }>;
}

export function useStudioData() {
  const account = useActiveAccount();
  const { user, isConnected } = useAuth();
  const { setStudioData } = useStudio();
  
  // Data state
  const [projects, setProjects] = useState<Project[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [nfts, setNFTs] = useState<NFT[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch functions
  const fetchProjects = useCallback(async () => {
    if (!account?.address || !isConnected) return;
    
    try {
      setError(null);
      const response = await fetch(`/api/studio/projects?address=${account.address}`);
      const data = await response.json();
      
      if (data.success) {
        setProjects(data.projects || []);
      } else {
        console.error('Failed to fetch projects:', data.error);
        setError(data.error || 'Failed to fetch projects');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to fetch projects');
    }
  }, [account?.address, isConnected]);

  const fetchCollections = useCallback(async () => {
    if (!account?.address || !isConnected) return;
    
    try {
      setError(null);
      const response = await fetch(`/api/studio/collections?address=${account.address}`);
      const data = await response.json();
      
      if (data.success) {
        setCollections(data.collections || []);
      } else {
        console.error('Failed to fetch collections:', data.error);
        setError(data.error || 'Failed to fetch collections');
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
      setError('Failed to fetch collections');
    }
  }, [account?.address, isConnected]);

  const fetchNFTs = useCallback(async () => {
    if (!account?.address || !isConnected) return;
    
    try {
      setError(null);
      const response = await fetch(`/api/studio/nfts?address=${account.address}`);
      const data = await response.json();
      
      if (data.success) {
        setNFTs(data.nfts || []);
      } else {
        console.error('Failed to fetch NFTs:', data.error);
        setError(data.error || 'Failed to fetch NFTs');
      }
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      setError('Failed to fetch NFTs');
    }
  }, [account?.address, isConnected]);

  const refreshData = useCallback(() => {
    setError(null);
    fetchProjects();
    fetchCollections();
    fetchNFTs();
  }, [fetchProjects, fetchCollections, fetchNFTs]);

  // Initial data fetch
  useEffect(() => {
    if (account?.address && isConnected) {
      setIsLoadingData(true);
      Promise.all([
        fetchProjects(),
        fetchCollections(),
        fetchNFTs()
      ]).finally(() => {
        setIsLoadingData(false);
      });
    }
  }, [account?.address, isConnected, fetchProjects, fetchCollections, fetchNFTs]);

  // Update studio context when data changes
  useEffect(() => {
    setStudioData({
      projects,
      collections,
      nfts,
      isLoading: isLoadingData,
      error
    });
  }, [projects, collections, nfts, isLoadingData, error, setStudioData]);

  return {
    projects,
    collections,
    nfts,
    isLoading: isLoadingData,
    error,
    refreshData,
    fetchProjects,
    fetchCollections,
    fetchNFTs
  };
}

export type { Project, Collection, NFT };