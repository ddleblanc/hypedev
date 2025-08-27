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
  Plus,
  Layers,
  Users,
  TrendingUp
} from "lucide-react";

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
}

interface StudioCollectionsProps {
  collections: Collection[];
  viewMode: 'grid' | 'list';
}

export function StudioCollections({ collections, viewMode }: StudioCollectionsProps) {
  const formatPrice = (price: number) => {
    return price > 0 ? `${price.toFixed(3)} ETH` : '—';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <>

      {/* Collections Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={viewMode === 'grid' ? 'grid grid-cols-2 gap-6' : 'space-y-4'}
      >
        {collections.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="col-span-2 text-center py-12"
          >
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 mx-auto">
              <Layers className="w-8 h-8 text-white/30" />
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">No Collections Yet</h3>
            <p className="text-white/60 text-sm mb-6 max-w-md mx-auto">
              Create your first NFT collection to start building your digital empire
            </p>
            <Button className="bg-gradient-to-r from-[rgb(163,255,18)] to-green-400 hover:from-green-400 hover:to-[rgb(163,255,18)] text-black font-bold">
              Create Collection
            </Button>
          </motion.div>
        ) : (
          collections.map((collection, index) => (
            <motion.div
              key={collection.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="group bg-black/30 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-300"
            >
              {/* Collection Banner */}
              <div className="relative h-32 overflow-hidden">
                <MediaRenderer
                  src={collection.bannerImage || collection.image || ''}
                  alt={collection.name}
                  className="w-full h-full transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute top-3 right-3 flex gap-2">
                  <Badge 
                    variant={collection.isDeployed ? 'default' : 'secondary'}
                    className={collection.isDeployed ? 'bg-[rgb(163,255,18)] text-black' : ''}
                  >
                    {collection.isDeployed ? 'Deployed' : 'Draft'}
                  </Badge>
                  {collection.contractType && (
                    <Badge variant="outline" className="border-white/20 text-white/80">
                      {collection.contractType}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Collection Info */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-white text-lg font-bold">{collection.name}</h3>
                    <p className="text-white/60 text-sm">{collection.symbol}</p>
                  </div>
                  {collection.project && (
                    <Badge variant="outline" className="border-white/20 text-white/70 text-xs">
                      {collection.project.name}
                    </Badge>
                  )}
                </div>
                
                {collection.description && (
                  <p className="text-white/60 text-sm mb-4 line-clamp-2">{collection.description}</p>
                )}
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div className="flex items-center text-white/70">
                    <Layers className="h-3 w-3 mr-1.5" />
                    <span>{collection.mintedSupply}{collection.maxSupply ? `/${collection.maxSupply}` : ''} Minted</span>
                  </div>
                  <div className="flex items-center text-white/70">
                    <Users className="h-3 w-3 mr-1.5" />
                    <span>{collection.holders} Holders</span>
                  </div>
                  <div className="flex items-center text-white/70">
                    <TrendingUp className="h-3 w-3 mr-1.5" />
                    <span>{formatPrice(collection.floorPrice)} Floor</span>
                  </div>
                  <div className="flex items-center text-white/70">
                    <span className="text-xs mr-1.5">Vol:</span>
                    <span>{formatPrice(collection.volume)}</span>
                  </div>
                </div>

                {/* Meta Info */}
                <div className="flex items-center justify-between text-xs text-white/50 mb-4">
                  <span>Created {formatDate(collection.createdAt)}</span>
                  <span>{collection.royaltyPercentage}% Royalty</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
            </motion.div>
          ))
        )}
      </motion.div>
    </>
  );
}