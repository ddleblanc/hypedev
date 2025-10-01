"use client";

import { useState, useEffect } from "react";
import { fetchCollectionStats } from "@/lib/graph-client";

interface CollectionStats {
  totalVolume: number;
  floorPrice: number;
  holders: number;
  totalSupply: number;
  sales: any[];
  loading: boolean;
  error: string | null;
}

export function useCollectionStats(
  contractAddress: string | undefined,
  chainId: number | undefined
): CollectionStats {
  const [stats, setStats] = useState<CollectionStats>({
    totalVolume: 0,
    floorPrice: 0,
    holders: 0,
    totalSupply: 0,
    sales: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    if (!contractAddress || !chainId) {
      setStats(prev => ({ ...prev, loading: false }));
      return;
    }

    let cancelled = false;

    const loadStats = async () => {
      try {
        setStats(prev => ({ ...prev, loading: true, error: null }));

        const data = await fetchCollectionStats(contractAddress, chainId);

        if (!cancelled) {
          if (data) {
            setStats({
              ...data,
              loading: false,
              error: null
            });
          } else {
            // Fallback to empty stats if no data available
            setStats(prev => ({
              ...prev,
              loading: false,
              error: "No data available from The Graph"
            }));
          }
        }
      } catch (error) {
        if (!cancelled) {
          setStats(prev => ({
            ...prev,
            loading: false,
            error: error instanceof Error ? error.message : "Failed to fetch stats"
          }));
        }
      }
    };

    loadStats();

    // Refresh stats every 30 seconds
    const interval = setInterval(loadStats, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [contractAddress, chainId]);

  return stats;
}

// Hook for multiple collections
export function useMultipleCollectionStats(
  collections: Array<{ address: string; chainId: number }>
) {
  const [allStats, setAllStats] = useState<{
    [address: string]: CollectionStats;
  }>({});

  useEffect(() => {
    if (!collections || collections.length === 0) return;

    let cancelled = false;

    const loadAllStats = async () => {
      const statsMap: { [address: string]: CollectionStats } = {};

      await Promise.all(
        collections.map(async ({ address, chainId }) => {
          try {
            const data = await fetchCollectionStats(address, chainId);

            if (!cancelled) {
              statsMap[address.toLowerCase()] = data
                ? {
                    ...data,
                    loading: false,
                    error: null
                  }
                : {
                    totalVolume: 0,
                    floorPrice: 0,
                    holders: 0,
                    totalSupply: 0,
                    sales: [],
                    loading: false,
                    error: "No data available"
                  };
            }
          } catch (error) {
            if (!cancelled) {
              statsMap[address.toLowerCase()] = {
                totalVolume: 0,
                floorPrice: 0,
                holders: 0,
                totalSupply: 0,
                sales: [],
                loading: false,
                error: error instanceof Error ? error.message : "Failed to fetch"
              };
            }
          }
        })
      );

      if (!cancelled) {
        setAllStats(statsMap);
      }
    };

    loadAllStats();

    // Refresh every minute
    const interval = setInterval(loadAllStats, 60000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [collections]);

  return allStats;
}