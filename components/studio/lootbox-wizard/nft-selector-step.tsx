"use client";

import { useState, useMemo } from "react";
import { useActiveAccount } from "thirdweb/react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Check, AlertCircle, Image as ImageIcon } from "lucide-react";
import { MediaRenderer } from "@/components/MediaRenderer";
import type { SelectedNFT } from "@/app/studio/lootbox/create/page";
import { trpc } from "@/lib/trpc/client";

interface NftSelectorStepProps {
  selectedNFTs: SelectedNFT[];
  setSelectedNFTs: (nfts: SelectedNFT[]) => void;
  requiredCount: number;
  rewardsPerOpening?: number;
}

interface OwnedNFT {
  id: string;
  contractAddress: string;
  tokenId: string;
  name: string;
  image: string;
  collectionName: string;
  tokenType: "ERC721" | "ERC1155";
  balance?: number;
}

export function NftSelectorStep({
  selectedNFTs,
  setSelectedNFTs,
  requiredCount,
  rewardsPerOpening = 1,
}: NftSelectorStepProps) {
  const account = useActiveAccount();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch owned NFTs via tRPC
  const { data: ownedNftsData, isLoading, error: queryError } = trpc.user.nfts.owned.useQuery(
    { address: account?.address || "" },
    {
      enabled: !!account?.address,
      staleTime: 60 * 1000, // Cache for 1 minute
    }
  );

  // Use tRPC data or fallback to mock data on error
  const ownedNFTs = useMemo(() => {
    if (ownedNftsData?.nfts) {
      return ownedNftsData.nfts;
    }
    if (queryError) {
      return getMockNFTs();
    }
    return [];
  }, [ownedNftsData, queryError]);

  const error = queryError ? "Failed to load your NFTs. Please try again." : null;

  const toggleNFTSelection = (nft: OwnedNFT) => {
    const isSelected = selectedNFTs.some((s) => s.id === nft.id);

    if (isSelected) {
      setSelectedNFTs(selectedNFTs.filter((s) => s.id !== nft.id));
    } else {
      const newSelected: SelectedNFT = {
        id: nft.id,
        contractAddress: nft.contractAddress,
        tokenId: nft.tokenId,
        name: nft.name,
        image: nft.image,
        collectionName: nft.collectionName,
        tokenType: nft.tokenType,
        amount: nft.tokenType === "ERC1155" ? 1 : undefined,
        weight: 100, // Default weight
        rarity: "common", // Default rarity
      };
      setSelectedNFTs([...selectedNFTs, newSelected]);
    }
  };

  const filteredNFTs = ownedNFTs.filter(
    (nft) =>
      nft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nft.collectionName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isSelected = (id: string) => selectedNFTs.some((s) => s.id === id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Select NFTs as Rewards</h2>
          <p className="text-sm text-white/60">
            Choose which NFTs from your wallet to include in this lootbox
          </p>
        </div>
        <Badge
          variant={selectedNFTs.length >= requiredCount ? "default" : "secondary"}
          className={
            selectedNFTs.length >= requiredCount
              ? "bg-[rgb(163,255,18)] text-black"
              : ""
          }
        >
          {selectedNFTs.length} / {requiredCount} required
        </Badge>
      </div>

      {/* Warning if not enough selected */}
      {selectedNFTs.length < requiredCount && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
          <p className="text-sm text-orange-400">
            You need to select at least {requiredCount} NFTs
            {rewardsPerOpening > 1
              ? ` (${requiredCount / rewardsPerOpening} supply × ${rewardsPerOpening} rewards per opening)`
              : " (one per lootbox in supply)"}
          </p>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <Input
          placeholder="Search by name or collection..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-zinc-900 border-white/10 text-white"
        />
      </div>

      {/* NFT Grid */}
      <div className="min-h-[300px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
            <span className="ml-3 text-white/60">Loading your NFTs...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
            <p className="text-white/60">{error}</p>
          </div>
        ) : filteredNFTs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <ImageIcon className="w-12 h-12 text-white/20 mb-4" />
            <p className="text-white/60">
              {searchQuery ? "No NFTs match your search" : "No NFTs found in your wallet"}
            </p>
            <p className="text-sm text-white/40 mt-1">
              Make sure you have NFTs on the connected network
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto pr-2">
            {filteredNFTs.map((nft) => (
              <button
                key={nft.id}
                onClick={() => toggleNFTSelection(nft)}
                className={`relative group rounded-xl overflow-hidden border-2 transition-all ${
                  isSelected(nft.id)
                    ? "border-[rgb(163,255,18)] ring-2 ring-[rgb(163,255,18)]/30"
                    : "border-white/10 hover:border-white/30"
                }`}
              >
                <div className="aspect-square relative">
                  <MediaRenderer
                    src={nft.image}
                    alt={nft.name}
                    className="w-full h-full object-cover"
                  />

                  {/* Selection overlay */}
                  <div
                    className={`absolute inset-0 transition-colors ${
                      isSelected(nft.id)
                        ? "bg-[rgb(163,255,18)]/20"
                        : "bg-black/0 group-hover:bg-black/30"
                    }`}
                  />

                  {/* Check mark */}
                  {isSelected(nft.id) && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[rgb(163,255,18)] flex items-center justify-center">
                      <Check className="w-4 h-4 text-black" />
                    </div>
                  )}

                  {/* Token type badge */}
                  <Badge
                    variant="secondary"
                    className="absolute top-2 left-2 text-[10px] bg-black/50"
                  >
                    {nft.tokenType}
                  </Badge>
                </div>

                {/* Info */}
                <div className="p-2 bg-zinc-900">
                  <p className="text-sm font-medium text-white truncate">
                    {nft.name}
                  </p>
                  <p className="text-xs text-white/40 truncate">
                    {nft.collectionName}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected summary */}
      {selectedNFTs.length > 0 && (
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <p className="text-sm text-white mb-2">
            Selected NFTs ({selectedNFTs.length}):
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedNFTs.map((nft) => (
              <Badge
                key={nft.id}
                variant="secondary"
                className="flex items-center gap-1.5 pr-1"
              >
                <span className="truncate max-w-[100px]">{nft.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNFTs(selectedNFTs.filter((s) => s.id !== nft.id));
                  }}
                  className="ml-1 hover:text-red-400"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Mock NFTs for demo when API fails
function getMockNFTs(): OwnedNFT[] {
  return [
    {
      id: "mock-1",
      contractAddress: "0x1234567890123456789012345678901234567890",
      tokenId: "1",
      name: "Cyber Warrior #1",
      image: "/api/placeholder/400/400",
      collectionName: "Cyber Warriors",
      tokenType: "ERC721",
    },
    {
      id: "mock-2",
      contractAddress: "0x1234567890123456789012345678901234567890",
      tokenId: "2",
      name: "Cyber Warrior #2",
      image: "/api/placeholder/400/400",
      collectionName: "Cyber Warriors",
      tokenType: "ERC721",
    },
    {
      id: "mock-3",
      contractAddress: "0x2345678901234567890123456789012345678901",
      tokenId: "1",
      name: "Dragon Egg",
      image: "/api/placeholder/400/400",
      collectionName: "Dragon Eggs",
      tokenType: "ERC1155",
      balance: 5,
    },
    {
      id: "mock-4",
      contractAddress: "0x2345678901234567890123456789012345678901",
      tokenId: "2",
      name: "Phoenix Feather",
      image: "/api/placeholder/400/400",
      collectionName: "Mythical Items",
      tokenType: "ERC1155",
      balance: 10,
    },
    {
      id: "mock-5",
      contractAddress: "0x3456789012345678901234567890123456789012",
      tokenId: "42",
      name: "Legendary Sword",
      image: "/api/placeholder/400/400",
      collectionName: "Fantasy Weapons",
      tokenType: "ERC721",
    },
    {
      id: "mock-6",
      contractAddress: "0x3456789012345678901234567890123456789012",
      tokenId: "43",
      name: "Magic Shield",
      image: "/api/placeholder/400/400",
      collectionName: "Fantasy Weapons",
      tokenType: "ERC721",
    },
  ];
}
