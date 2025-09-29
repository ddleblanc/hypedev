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
  MoreHorizontal,
  Layers,
  Users,
  TrendingUp,
  ExternalLink,
  Copy,
  Activity,
  Clock,
  CheckCircle2
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  onViewCollection?: (c: Collection) => void;
}

export function StudioCollections({ collections, viewMode, onViewCollection }: StudioCollectionsProps) {
  const router = useRouter();

  const formatPrice = (price: number) => {
    if (price === 0) return '—';
    if (price < 0.001) return '<0.001';
    return price.toFixed(3);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getSupplyPercentage = (minted: number, max?: number) => {
    if (!max) return 0;
    return Math.round((minted / max) * 100);
  };

  if (collections.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-24"
      >
        <div className="w-16 h-16 rounded-2xl bg-black/80 backdrop-blur-sm border border-white/10 flex items-center justify-center mb-6">
          <Layers className="w-7 h-7 text-zinc-600" />
        </div>
        <h3 className="text-white text-lg font-medium mb-2">No collections yet</h3>
        <p className="text-zinc-500 text-sm mb-8 max-w-sm text-center">
          Create your first NFT collection to start building your digital presence
        </p>
        <Button 
          onClick={() => router.push('/studio/create')}
          className="bg-white text-black hover:bg-zinc-100 font-medium"
        >
          Create First Collection
        </Button>
      </motion.div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-1">
        {collections.map((collection, index) => (
          <motion.div
            key={collection.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.02 }}
            onClick={() => onViewCollection ? onViewCollection(collection) : router.push(`/studio/collections/${collection.id}`)}
            className="group flex items-center justify-between p-4 rounded-xl bg-black/60 backdrop-blur-sm border border-white/10 hover:bg-black/80 hover:border-white/20 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-black/60 backdrop-blur-sm border border-white/5">
                <MediaRenderer
                  src={collection.image || collection.bannerImage || ''}
                  alt={collection.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-medium">{collection.name}</h3>
                  <span className="text-zinc-500 text-sm">{collection.symbol}</span>
                  {collection.isDeployed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-400" />
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-xs text-zinc-500">
                    {collection.mintedSupply}{collection.maxSupply ? `/${formatNumber(collection.maxSupply)}` : ''} items
                  </span>
                  <span className="text-xs text-zinc-500">{formatNumber(collection.holders)} holders</span>
                  <span className="text-xs text-zinc-500">{formatPrice(collection.volume)} ETH volume</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-white">{formatPrice(collection.floorPrice)} ETH</p>
                <p className="text-xs text-zinc-500">floor price</p>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-black/90 backdrop-blur-sm border-white/10">
                  <DropdownMenuItem className="text-white hover:bg-white/10">
                    <Eye className="w-4 h-4 mr-2" /> View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-white hover:bg-white/10">
                    <Edit className="w-4 h-4 mr-2" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-white hover:bg-white/10">
                    <Copy className="w-4 h-4 mr-2" /> Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem className="text-red-400 hover:bg-red-400/10">
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
      {collections.map((collection, index) => (
        <motion.div
          key={collection.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            delay: index * 0.03,
            type: "spring",
            stiffness: 100
          }}
          className="group relative"
        >
          <div className="relative bg-black/80 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-300">
            {/* Clickable Card Content */}
            <div
              className="cursor-pointer"
              onClick={() => onViewCollection ? onViewCollection(collection) : router.push(`/studio/collections/${collection.id}`)}
            >
              {/* Image Section */}
              <div className="relative aspect-[4/3] overflow-hidden bg-black/60 backdrop-blur-sm">
                <MediaRenderer
                  src={collection.bannerImage || collection.image || ''}
                  alt={collection.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  {collection.isDeployed ? (
                    <Badge className="bg-emerald-400/10 border-emerald-400/20 text-emerald-400 backdrop-blur-sm">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Live
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-400/10 border-amber-400/20 text-amber-400 backdrop-blur-sm">
                      <Clock className="w-3 h-3 mr-1" />
                      Draft
                    </Badge>
                  )}
                </div>

                {/* Bottom Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-semibold text-lg">{collection.name}</h3>
                  <p className="text-zinc-400 text-sm">{collection.symbol}</p>
                </div>
              </div>

              {/* Content Section */}
              <div className="p-5">
                {/* Supply Progress Bar */}
                {collection.maxSupply && (
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs text-zinc-500">Supply</span>
                      <span className="text-xs text-white">
                        {formatNumber(collection.mintedSupply)}/{formatNumber(collection.maxSupply)}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-zinc-600 to-zinc-400 rounded-full transition-all duration-500"
                        style={{ width: `${getSupplyPercentage(collection.mintedSupply, collection.maxSupply)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-black/60 backdrop-blur-sm rounded-lg p-2.5 border border-white/5">
                    <div className="flex items-center gap-1.5 text-zinc-500 mb-0.5">
                      <Users className="w-3 h-3" />
                      <span className="text-xs">Holders</span>
                    </div>
                    <p className="text-white font-medium">{formatNumber(collection.holders)}</p>
                  </div>

                  <div className="bg-black/60 backdrop-blur-sm rounded-lg p-2.5 border border-white/5">
                    <div className="flex items-center gap-1.5 text-zinc-500 mb-0.5">
                      <Activity className="w-3 h-3" />
                      <span className="text-xs">Volume</span>
                    </div>
                    <p className="text-white font-medium">{formatPrice(collection.volume)}</p>
                  </div>

                  <div className="bg-black/60 backdrop-blur-sm rounded-lg p-2.5 border border-white/5">
                    <div className="flex items-center gap-1.5 text-zinc-500 mb-0.5">
                      <TrendingUp className="w-3 h-3" />
                      <span className="text-xs">Floor</span>
                    </div>
                    <p className="text-white font-medium">{formatPrice(collection.floorPrice)}</p>
                  </div>

                  <div className="bg-black/60 backdrop-blur-sm rounded-lg p-2.5 border border-white/5">
                    <div className="flex items-center gap-1.5 text-zinc-500 mb-0.5">
                      <span className="text-xs">Royalty</span>
                    </div>
                    <p className="text-white font-medium">{collection.royaltyPercentage}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-white/10 px-5 pb-5">
              <span className="text-xs text-zinc-500">{formatDate(collection.createdAt)}</span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-white/10">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-black/90 backdrop-blur-sm border-white/10">
                  <DropdownMenuItem className="text-white hover:bg-white/10">
                    <Edit className="w-4 h-4 mr-2" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-white hover:bg-white/10">
                    <Copy className="w-4 h-4 mr-2" /> Duplicate
                  </DropdownMenuItem>
                  {collection.address && (
                    <DropdownMenuItem className="text-white hover:bg-white/10">
                      <ExternalLink className="w-4 h-4 mr-2" /> View on Etherscan
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem className="text-red-400 hover:bg-red-400/10">
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}