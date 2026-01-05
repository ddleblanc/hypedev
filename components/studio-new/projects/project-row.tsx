'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  MoreHorizontal,
  Folder,
  Plus,
  Pencil,
  Trash2,
  Package,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { CollectionRow } from './collection-row';
import Link from 'next/link';

// =============================================================================
// Types
// =============================================================================

interface Nft {
  id: string;
  name: string;
  image?: string;
  tokenId?: string;
}

interface Collection {
  id: string;
  name: string;
  symbol: string;
  image?: string;
  address?: string;
  isDeployed: boolean;
  nftsCount: number;
  nfts?: Nft[];
  chainId?: number;
  contractType?: string;
}

interface Lootbox {
  id: string;
  name: string;
  image: string | null;
  price: number;
  rarity: string | null;
  totalSupply: number;
  remainingSupply: number;
  rewardCount: number;
  isActive: boolean;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  collectionsCount: number;
  nftsCount: number;
  lootboxesCount?: number;
  createdAt: Date;
  collections?: Collection[];
  lootboxes?: Lootbox[];
}

interface ProjectRowProps {
  project: Project;
  isExpanded: boolean;
  expandedCollection: string | null;
  onExpand: () => void;
  onExpandCollection: (id: string | null) => void;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  onAddCollection?: (projectId: string) => void;
  onAddNft?: (collection: Collection) => void;
  onViewCollection?: (collection: Collection) => void;
  onViewNfts?: (collectionId: string) => void;
}

// Rarity color mapping
const RARITY_COLORS: Record<string, string> = {
  common: 'bg-gray-500/20 text-gray-400',
  rare: 'bg-blue-500/20 text-blue-400',
  epic: 'bg-purple-500/20 text-purple-400',
  mythic: 'bg-orange-500/20 text-orange-400',
  cosmic: 'bg-pink-500/20 text-pink-400',
};

// =============================================================================
// Component
// =============================================================================

export function ProjectRow({
  project,
  isExpanded,
  expandedCollection,
  onExpand,
  onExpandCollection,
  onEdit,
  onDelete,
  onAddCollection,
  onAddNft,
  onViewCollection,
  onViewNfts,
}: ProjectRowProps) {
  return (
    <div className="border border-studio-border rounded-xl overflow-hidden">
      {/* Project Header */}
      <button
        onClick={onExpand}
        className={cn(
          'w-full flex items-center gap-3 p-4 text-left transition-colors',
          'hover:bg-studio-surface',
          isExpanded && 'bg-studio-surface'
        )}
      >
        {/* Expand Icon */}
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="h-5 w-5 text-studio-text-muted" />
        </motion.div>

        {/* Project Icon */}
        <div className="h-10 w-10 rounded-lg bg-studio-border flex items-center justify-center flex-shrink-0">
          <Folder className="h-5 w-5 text-studio-text-muted" />
        </div>

        {/* Project Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-studio-text truncate">
            {project.name}
          </h3>
          <p className="text-sm text-studio-text-muted">
            {project.collectionsCount} collection
            {project.collectionsCount !== 1 ? 's' : ''} · {project.nftsCount}{' '}
            NFT
            {project.nftsCount !== 1 ? 's' : ''}
            {(project.lootboxesCount ?? 0) > 0 && (
              <>
                {' '}
                · {project.lootboxesCount} lootbox
                {project.lootboxesCount !== 1 ? 'es' : ''}
              </>
            )}
          </p>
        </div>

        {/* Actions Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <button className="p-2 rounded-lg hover:bg-studio-border transition-colors">
              <MoreHorizontal className="h-4 w-4 text-studio-text-muted" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-studio-surface border-studio-border"
          >
            <DropdownMenuItem onClick={() => onAddCollection?.(project.id)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Collection
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit?.(project)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Project
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-studio-border" />
            <DropdownMenuItem
              onClick={() => onDelete?.(project)}
              className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </button>

      {/* Expanded Content - Collections & Lootboxes */}
      <AnimatePresence>
        {isExpanded && (project.collections || project.lootboxes) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-studio-border"
          >
            <div className="p-2 space-y-1">
              {/* Collections Section */}
              {project.collections && project.collections.length > 0 && (
                <>
                  <div className="px-2 py-1 text-xs font-medium text-studio-text-muted uppercase tracking-wide">
                    Collections
                  </div>
                  {project.collections.map((collection) => (
                    <CollectionRow
                      key={collection.id}
                      collection={collection}
                      isExpanded={expandedCollection === collection.id}
                      onExpand={() =>
                        onExpandCollection(
                          expandedCollection === collection.id
                            ? null
                            : collection.id
                        )
                      }
                      onView={() => onViewCollection?.(collection)}
                      onAddNft={() => onAddNft?.(collection)}
                      onViewAllNfts={() => onViewNfts?.(collection.id)}
                    />
                  ))}
                </>
              )}

              {/* Lootboxes Section */}
              {project.lootboxes && project.lootboxes.length > 0 && (
                <>
                  <div className="px-2 py-1 text-xs font-medium text-studio-text-muted uppercase tracking-wide mt-2">
                    Lootboxes
                  </div>
                  {project.lootboxes.map((lootbox) => (
                    <Link
                      key={lootbox.id}
                      href={`/lootboxes/${lootbox.id}`}
                      className={cn(
                        'flex items-center gap-3 p-2 rounded-lg text-left transition-colors',
                        'hover:bg-studio-surface group'
                      )}
                    >
                      {/* Lootbox Icon/Image */}
                      <div className="h-8 w-8 rounded-lg bg-studio-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {lootbox.image ? (
                          <img
                            src={lootbox.image}
                            alt={lootbox.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="h-4 w-4 text-studio-text-muted" />
                        )}
                      </div>

                      {/* Lootbox Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-studio-text truncate">
                            {lootbox.name}
                          </span>
                          {lootbox.rarity && (
                            <Badge
                              className={cn(
                                'text-[10px] px-1.5 py-0',
                                RARITY_COLORS[lootbox.rarity] ||
                                  RARITY_COLORS.common
                              )}
                            >
                              {lootbox.rarity}
                            </Badge>
                          )}
                          {!lootbox.isActive && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-red-500/50 text-red-400">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-studio-text-muted">
                          {lootbox.price} ETH · {lootbox.rewardCount} rewards ·{' '}
                          {lootbox.remainingSupply}/{lootbox.totalSupply} left
                        </p>
                      </div>

                      {/* View Link */}
                      <ExternalLink className="h-4 w-4 text-studio-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ))}
                </>
              )}

              {/* Empty State - no collections or lootboxes */}
              {(!project.collections || project.collections.length === 0) &&
                (!project.lootboxes || project.lootboxes.length === 0) && (
                  <div className="py-8 text-center">
                    <p className="text-sm text-studio-text-muted">
                      No collections or lootboxes yet
                    </p>
                    <button
                      onClick={() => onAddCollection?.(project.id)}
                      className="mt-2 text-sm text-studio-accent hover:underline inline-flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      Create your first collection
                    </button>
                  </div>
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
