"use client";

import { useState, useEffect } from "react";

export interface LaunchpadCollection {
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
    genre?: string;
  };
  address?: string;
  chainId: number;
  contractType?: string;
  maxSupply?: number;
  mintedSupply: number;
  royaltyPercentage: number;
  isDeployed: boolean;
  hasActiveClaimPhase: boolean;
  volume: number;
  holders: number;
  floorPrice: number;
  createdAt: string;
  deployedAt?: string;
}

export function useLaunchpadData() {
  const [collections, setCollections] = useState<LaunchpadCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/public/collections');
        const data = await response.json();

        if (data.success) {
          setCollections(data.collections || []);
        } else {
          setError(data.error || 'Failed to fetch collections');
        }
      } catch (err) {
        console.error('Error fetching launchpad collections:', err);
        setError('Failed to fetch collections');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCollections();
  }, []);

  return {
    collections,
    isLoading,
    error
  };
}