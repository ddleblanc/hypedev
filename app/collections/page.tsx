"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useWalletAuthOptimized } from "@/hooks/use-wallet-auth-optimized";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type OwnedNFT = {
  id: string;
  name: string;
  description?: string;
  image?: string;
  attributes?: Array<{ trait_type?: string; value?: string }>;
  collection: {
    name: string;
    symbol?: string;
    address?: string;
  };
};

export default function MyCollectionsPage() {
  const { user, isConnected } = useWalletAuthOptimized();
  const [nfts, setNfts] = useState<OwnedNFT[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchOwned = async () => {
      if (!user?.walletAddress) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch(`/api/user/${user.walletAddress}/nfts?filter=owned&limit=200`);
        const data = await res.json();
        if (data.success) {
          setNfts(data.nfts || []);
        } else {
          setError(data.error || "Failed to load your NFTs");
        }
      } catch (e) {
        setError("Failed to load your NFTs");
      } finally {
        setIsLoading(false);
      }
    };
    fetchOwned();
  }, [user?.walletAddress]);

  const filtered = useMemo(() => {
    if (!searchQuery) return nfts;
    const q = searchQuery.toLowerCase();
    return nfts.filter((n) =>
      n.name?.toLowerCase().includes(q) ||
      n.collection?.name?.toLowerCase().includes(q) ||
      n.collection?.symbol?.toLowerCase().includes(q)
    );
  }, [nfts, searchQuery]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black pt-16 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/80 mb-2">Connect your wallet to view your collection</p>
          <div className="inline-flex">
            <Button className="bg-white text-black hover:bg-white/90">Connect Wallet</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-16">
      {/* Hero/Header */}
      <div className="px-4 md:px-8 lg:px-12 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">My Collection</h1>
            <p className="text-white/60">All NFTs owned by your connected wallet</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-white/10 text-white border-white/20">{nfts.length} items</Badge>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search my NFTs..."
              className="w-64 h-9 bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>
        </motion.div>
      </div>

      {/* Items Grid */}
      <div className="px-4 md:px-8 lg:px-12 pb-16">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-24">
            <p className="text-white/70">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-white/70">No NFTs found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {filtered.map((nft, idx) => (
              <motion.div
                key={`${nft.id}-${idx}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.02 * idx }}
                className="group"
              >
                <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
                  <div className="aspect-square overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={nft.image || "/api/placeholder/400/400"}
                      alt={nft.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-white/50 mb-1 truncate">
                      {nft.collection?.name}
                      {nft.collection?.symbol ? (
                        <span className="text-white/30"> • {nft.collection.symbol}</span>
                      ) : null}
                    </p>
                    <p className="text-white font-semibold truncate">{nft.name}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


