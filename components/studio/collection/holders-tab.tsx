"use client";

import { useState, useEffect, useMemo } from "react";
import { getContract, readContract } from "thirdweb";
import { client } from "@/lib/thirdweb";
import { defineChain } from "thirdweb/chains";
import { motion } from "framer-motion";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  Users,
  Search,
  RefreshCw,
  ExternalLink,
  Crown,
  Copy,
  Check,
  AlertCircle,
  ChevronDown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Holder {
  address: string;
  tokenCount: number;
  tokenIds: string[];
  percentage: number;
}

interface HoldersTabProps {
  collection: {
    id: string;
    address: string;
    chainId: number;
    contractType: string;
    nfts?: Array<{
      id: string;
      tokenId?: string;
      ownerAddress?: string;
    }>;
  };
}

export function HoldersTab({ collection }: HoldersTabProps) {
  const { toast } = useToast();
  const [holders, setHolders] = useState<Holder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [totalSupply, setTotalSupply] = useState(0);
  const [uniqueHolderCount, setUniqueHolderCount] = useState(0);

  // Fetch holders from NFT data and on-chain
  const fetchHolders = async () => {
    setIsLoading(true);

    try {
      const holderMap = new Map<string, { count: number; tokenIds: string[] }>();
      let supply = 0;

      // First, try to use existing NFT data from database
      if (collection.nfts && collection.nfts.length > 0) {
        collection.nfts.forEach((nft) => {
          if (nft.ownerAddress) {
            const addr = nft.ownerAddress.toLowerCase();
            const existing = holderMap.get(addr) || { count: 0, tokenIds: [] };
            existing.count++;
            if (nft.tokenId) {
              existing.tokenIds.push(nft.tokenId);
            }
            holderMap.set(addr, existing);
          }
        });
        supply = collection.nfts.length;
      }

      // If no NFT data, try to fetch from contract
      if (holderMap.size === 0 && collection.address && collection.chainId) {
        const chain = defineChain(collection.chainId);
        const contract = getContract({
          client,
          chain,
          address: collection.address,
        });

        try {
          // Get total supply
          const totalSupplyResult = await readContract({
            contract,
            method: "function totalSupply() view returns (uint256)",
          });
          supply = Number(totalSupplyResult);
          setTotalSupply(supply);

          // For smaller collections, fetch individual owners
          if (supply > 0 && supply <= 100) {
            for (let i = 0; i < supply; i++) {
              try {
                const owner = await readContract({
                  contract,
                  method: "function ownerOf(uint256 tokenId) view returns (address)",
                  params: [BigInt(i)],
                });

                if (owner) {
                  const addr = owner.toLowerCase();
                  const existing = holderMap.get(addr) || { count: 0, tokenIds: [] };
                  existing.count++;
                  existing.tokenIds.push(i.toString());
                  holderMap.set(addr, existing);
                }
              } catch {
                // Token might not exist
              }
            }
          } else if (supply > 100) {
            // For larger collections, we'd need an indexer
            // Show a message to the user
            console.log("Collection too large to enumerate on-chain directly");
          }
        } catch (e) {
          console.log("Error fetching on-chain data:", e);
        }
      }

      // Convert map to sorted array
      const holdersArray: Holder[] = Array.from(holderMap.entries())
        .map(([address, data]) => ({
          address,
          tokenCount: data.count,
          tokenIds: data.tokenIds.sort((a, b) => parseInt(a) - parseInt(b)),
          percentage: supply > 0 ? (data.count / supply) * 100 : 0,
        }))
        .sort((a, b) => b.tokenCount - a.tokenCount);

      setHolders(holdersArray);
      setUniqueHolderCount(holdersArray.length);
      if (supply > 0) setTotalSupply(supply);
    } catch (error) {
      console.error("Error fetching holders:", error);
      toast({ title: "Error", description: "Failed to fetch holder data", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHolders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection.address, collection.chainId, collection.nfts]);

  // Filter holders by search
  const filteredHolders = useMemo(() => {
    if (!searchQuery) return holders;
    return holders.filter((h) =>
      h.address.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [holders, searchQuery]);

  // Limit displayed holders unless "show all" is clicked
  const displayedHolders = showAll ? filteredHolders : filteredHolders.slice(0, 20);

  // Copy address to clipboard
  const copyAddress = async (address: string) => {
    await navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    toast({ title: "Copied", description: "Address copied to clipboard" });
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  // Get explorer URL for address
  const getExplorerUrl = (address: string) => {
    switch (collection.chainId) {
      case 1:
        return `https://etherscan.io/address/${address}`;
      case 137:
        return `https://polygonscan.com/address/${address}`;
      case 42161:
        return `https://arbiscan.io/address/${address}`;
      case 11155111:
        return `https://sepolia.etherscan.io/address/${address}`;
      default:
        return null;
    }
  };

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Get rank badge color
  const getRankBadge = (index: number) => {
    if (index === 0) {
      return (
        <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
          <Crown className="w-3 h-3 mr-1" />
          #1
        </Badge>
      );
    }
    if (index === 1) {
      return (
        <Badge className="bg-gray-400/20 text-gray-400 border-gray-400/30">
          #2
        </Badge>
      );
    }
    if (index === 2) {
      return (
        <Badge className="bg-amber-600/20 text-amber-600 border-amber-600/30">
          #3
        </Badge>
      );
    }
    return (
      <Badge className="bg-white/10 text-white/60 border-white/10">
        #{index + 1}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-[rgb(163,255,18)]" />
            Holders
          </h2>
          <p className="text-white/60 mt-1">
            {uniqueHolderCount} unique holder{uniqueHolderCount !== 1 ? "s" : ""} •{" "}
            {totalSupply} total NFTs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search address..."
              className="bg-black/40 border-white/20 text-white pl-10 w-64"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchHolders}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-black/40 border-white/10">
          <CardContent className="p-4">
            <div className="text-sm text-white/60">Unique Holders</div>
            <div className="text-2xl font-bold text-white">{uniqueHolderCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardContent className="p-4">
            <div className="text-sm text-white/60">Total Supply</div>
            <div className="text-2xl font-bold text-white">{totalSupply}</div>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardContent className="p-4">
            <div className="text-sm text-white/60">Avg. Per Holder</div>
            <div className="text-2xl font-bold text-white">
              {uniqueHolderCount > 0
                ? (totalSupply / uniqueHolderCount).toFixed(2)
                : "0"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Holders List */}
      {holders.length === 0 ? (
        <Alert className="border-white/10 bg-white/5">
          <AlertCircle className="h-4 w-4 text-white/60" />
          <AlertDescription className="text-white/60">
            No holders found. This could mean:
            <ul className="list-disc list-inside mt-2">
              <li>No NFTs have been minted yet</li>
              <li>NFT ownership data is not synced</li>
              <li>The collection is too large to enumerate directly</li>
            </ul>
          </AlertDescription>
        </Alert>
      ) : (
        <Card className="bg-black/40 border-white/10 overflow-hidden">
          <CardContent className="p-0">
            <div className="divide-y divide-white/10">
              {displayedHolders.map((holder, index) => (
                <div
                  key={holder.address}
                  className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {getRankBadge(holders.indexOf(holder))}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[rgb(163,255,18)]/30 to-purple-500/30 flex items-center justify-center">
                      <Users className="w-5 h-5 text-white/60" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-white">
                          {formatAddress(holder.address)}
                        </span>
                        <button
                          onClick={() => copyAddress(holder.address)}
                          className="text-white/40 hover:text-white transition-colors"
                        >
                          {copiedAddress === holder.address ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        {getExplorerUrl(holder.address) && (
                          <a
                            href={getExplorerUrl(holder.address)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white/40 hover:text-white transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                      {holder.tokenIds.length <= 5 && (
                        <div className="text-xs text-white/50 mt-0.5">
                          Token IDs: {holder.tokenIds.join(", ")}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold">
                      {holder.tokenCount} NFT{holder.tokenCount !== 1 ? "s" : ""}
                    </div>
                    <div className="text-white/50 text-sm">
                      {holder.percentage.toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Show More Button */}
            {filteredHolders.length > 20 && !showAll && (
              <div className="p-4 border-t border-white/10">
                <Button
                  variant="outline"
                  onClick={() => setShowAll(true)}
                  className="w-full border-white/20 text-white hover:bg-white/10"
                >
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Show All ({filteredHolders.length - 20} more)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
