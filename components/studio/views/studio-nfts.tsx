"use client";

import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MediaRenderer } from "@/components/MediaRenderer";
import {
  Eye,
  Edit,
  Trash2,
  Hash,
  Layers,
  Crown,
  Star
} from "lucide-react";

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
  attributes: Record<string, string | number>;
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

interface StudioNFTsProps {
  nfts: NFT[];
  viewMode: 'grid' | 'list';
}

export function StudioNFTs({ nfts, viewMode }: StudioNFTsProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getRarityColor = (tier?: string) => {
    switch (tier?.toLowerCase()) {
      case 'legendary': return 'text-orange-400 border-orange-400/20';
      case 'epic': return 'text-purple-400 border-purple-400/20';
      case 'rare': return 'text-blue-400 border-blue-400/20';
      case 'uncommon': return 'text-green-400 border-green-400/20';
      default: return 'text-gray-400 border-gray-400/20';
    }
  };

  const getRarityIcon = (tier?: string) => {
    switch (tier?.toLowerCase()) {
      case 'legendary': return Crown;
      case 'epic': 
      case 'rare': return Star;
      default: return Hash;
    }
  };

  return (
    <>

      {/* NFTs Grid */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-6 gap-4' : 'space-y-4'}>
        {nfts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="col-span-6 text-center py-12"
          >
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 mx-auto">
              <Hash className="w-8 h-8 text-white/30" />
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">No NFTs Yet</h3>
            <p className="text-white/60 text-sm mb-6 max-w-md mx-auto">
              Start creating unique digital assets for your collections
            </p>
            <Button className="bg-gradient-to-r from-[rgb(163,255,18)] to-green-400 hover:from-green-400 hover:to-[rgb(163,255,18)] text-black font-bold">
              Create Your First NFT
            </Button>
          </motion.div>
        ) : (
          nfts.map((nft, index) => {
            const RarityIcon = getRarityIcon(nft.rarityTier);
            
            return (
              <motion.div
                key={nft.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ 
                  duration: 0.3,
                  delay: index * 0.02,
                  ease: "easeOut"
                }}
                className="group bg-black/80 rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-300"
              >
                {/* NFT Image */}
                <div className="relative aspect-square overflow-hidden">
                  <MediaRenderer
                    src={nft.image || ''}
                    alt={nft.name}
                    className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Status badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    <Badge 
                      variant={nft.isMinted ? 'default' : 'secondary'}
                      className={nft.isMinted ? 'bg-[rgb(163,255,18)] text-black' : ''}
                    >
                      {nft.isMinted ? 'Minted' : 'Draft'}
                    </Badge>
                    {nft.rarityTier && (
                      <Badge 
                        variant="outline" 
                        className={`${getRarityColor(nft.rarityTier)} capitalize`}
                      >
                        <RarityIcon className="h-3 w-3 mr-1" />
                        {nft.rarityTier}
                      </Badge>
                    )}
                  </div>

                  {/* Token ID */}
                  <div className="absolute top-3 right-3">
                    <Badge variant="outline" className="border-white/20 text-white/80">
                      #{nft.tokenId}
                    </Badge>
                  </div>

                  {/* Hover Actions */}
                  <div className="absolute inset-x-3 bottom-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="outline" className="flex-1 border-white/20 text-white hover:bg-white/10">
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 border-white/20 text-white hover:bg-white/10">
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" className="border-red-400/20 text-red-400 hover:bg-red-400/10">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* NFT Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-white text-sm font-bold truncate flex-1 mr-2">{nft.name}</h3>
                    <Badge variant="outline" className="border-white/20 text-white/70 text-xs shrink-0">
                      {nft.collection.symbol}
                    </Badge>
                  </div>
                  
                  <p className="text-white/60 text-xs mb-3 truncate">{nft.collection.name}</p>
                  
                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs mb-3">
                    {nft.rarityRank && (
                      <div className="flex items-center text-white/70">
                        <Crown className="h-3 w-3 mr-1" />
                        <span>Rank #{nft.rarityRank}</span>
                      </div>
                    )}
                    <div className="flex items-center text-white/70">
                      <Layers className="h-3 w-3 mr-1" />
                      <span>{nft.traitCount} traits</span>
                    </div>
                  </div>

                  {/* Attributes Preview */}
                  {nft.traits && nft.traits.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {nft.traits.slice(0, 2).map((trait, idx) => (
                        <Badge 
                          key={idx}
                          variant="secondary" 
                          className="bg-white/10 text-white/80 text-xs px-2 py-0"
                        >
                          {trait.value}
                        </Badge>
                      ))}
                      {nft.traits.length > 2 && (
                        <Badge 
                          variant="secondary" 
                          className="bg-white/10 text-white/80 text-xs px-2 py-0"
                        >
                          +{nft.traits.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Meta Info */}
                  <div className="text-xs text-white/50 truncate">
                    Created {formatDate(nft.createdAt)}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </>
  );
}
