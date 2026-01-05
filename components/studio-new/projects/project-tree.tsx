'use client';

import { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, FolderPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ProjectRow } from './project-row';
import {
  useStudioNew,
  type CollectionForPanel,
} from '@/contexts/studio-new-context';
import { useStudioData } from '@/hooks/use-studio-data';
import { MintNFTsModal } from '@/components/studio/mint-nfts-modal';
import { CollectionDetailPanel } from './collection-detail-panel';
import {
  ProjectTreeSkeleton as SkeletonLoader,
  NoProjectsEmpty,
  NoSearchResultsEmpty,
  staggerContainerVariants,
  staggerItemVariants,
  standardTransition,
} from '../shared';

// =============================================================================
// Types (derived from use-studio-data.ts)
// =============================================================================

interface Nft {
  id: string;
  name: string;
  image?: string;
  tokenId?: string;
  collectionId: string;
}

interface Collection {
  id: string;
  name: string;
  symbol: string;
  image?: string;
  address?: string;
  projectId?: string;
  isDeployed: boolean;
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
  projectId: string | null;
  isActive: boolean;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
}

// Extended types for hierarchy
interface CollectionWithNfts extends Collection {
  nftsCount: number;
  nfts: Nft[];
}

interface ProjectWithCollections extends Project {
  collectionsCount: number;
  nftsCount: number;
  lootboxesCount: number;
  collections: CollectionWithNfts[];
  lootboxes: Lootbox[];
}

// =============================================================================
// Main Component
// =============================================================================

export function ProjectTree() {
  const {
    state,
    expandProject,
    expandCollection,
    setSearch,
    goToCreate,
    openNftModal,
    closeNftModal,
    openCollectionPanel,
    closeCollectionPanel,
  } = useStudioNew();

  const { projects, collections, nfts, lootboxes, isLoading, refreshData } = useStudioData();

  // Handler for adding NFTs to a collection
  // Uses base Collection type (compatible with ProjectRow.onAddNft)
  const handleAddNft = useCallback(
    (collection: {
      id: string;
      name: string;
      symbol: string;
      address?: string;
      chainId?: number;
      contractType?: string;
      image?: string;
    }) => {
      openNftModal({
        id: collection.id,
        name: collection.name,
        symbol: collection.symbol,
        address: collection.address,
        chainId: collection.chainId || 11155111, // Default to Sepolia
        contractType: collection.contractType,
        image: collection.image,
      });
    },
    [openNftModal]
  );

  // Handler for viewing collection in slide-in panel
  // Accepts Collection type (with optional nfts) for compatibility with ProjectRow
  const handleViewCollection = useCallback(
    (collection: {
      id: string;
      name: string;
      symbol: string;
      image?: string;
      address?: string;
      chainId?: number;
      contractType?: string;
      isDeployed: boolean;
      nfts?: Array<{
        id: string;
        name: string;
        image?: string;
        tokenId?: string;
      }>;
    }) => {
      // Convert to CollectionForPanel format
      const panelCollection: CollectionForPanel = {
        id: collection.id,
        name: collection.name,
        symbol: collection.symbol,
        image: collection.image,
        address: collection.address,
        chainId: collection.chainId || 11155111,
        contractType: collection.contractType,
        isDeployed: collection.isDeployed,
        nfts: (collection.nfts || []).map((nft) => ({
          id: nft.id,
          name: nft.name,
          image: nft.image,
          tokenId: nft.tokenId,
        })),
      };
      openCollectionPanel(panelCollection);
    },
    [openCollectionPanel]
  );

  // Handler for opening Add NFT from panel
  const handleAddNftFromPanel = useCallback(
    (collectionId: string) => {
      // Find the collection to get its details
      const collection = collections.find((c) => c.id === collectionId);
      if (collection) {
        openNftModal({
          id: collection.id,
          name: collection.name,
          symbol: collection.symbol,
          address: collection.address,
          chainId: collection.chainId || 11155111,
          contractType: collection.contractType,
          image: collection.image,
        });
      }
    },
    [collections, openNftModal]
  );

  // Build hierarchy from flat data
  const projectsWithCollections = useMemo<ProjectWithCollections[]>(() => {
    return projects.map((project) => {
      // Get collections for this project
      const projectCollections = collections
        .filter((c) => c.projectId === project.id)
        .map((collection) => {
          // Get NFTs for this collection
          const collectionNfts = nfts.filter(
            (n) => n.collectionId === collection.id
          );
          return {
            ...collection,
            nftsCount: collectionNfts.length,
            nfts: collectionNfts.map((n) => ({
              id: n.id,
              name: n.name,
              image: n.image,
              tokenId: n.tokenId,
              collectionId: n.collectionId,
            })),
          };
        });

      // Get lootboxes for this project
      const projectLootboxes = lootboxes
        .filter((lb) => lb.projectId === project.id)
        .map((lb) => ({
          id: lb.id,
          name: lb.name,
          image: lb.image,
          price: lb.price,
          rarity: lb.rarity,
          totalSupply: lb.totalSupply,
          remainingSupply: lb.remainingSupply,
          rewardCount: lb.rewardCount,
          projectId: lb.projectId,
          isActive: lb.isActive,
        }));

      // Calculate total NFTs for project
      const totalNfts = projectCollections.reduce(
        (sum, c) => sum + c.nftsCount,
        0
      );

      return {
        ...project,
        collectionsCount: projectCollections.length,
        nftsCount: totalNfts,
        lootboxesCount: projectLootboxes.length,
        collections: projectCollections,
        lootboxes: projectLootboxes,
      };
    });
  }, [projects, collections, nfts, lootboxes]);

  // Filter by search query (searches across all levels)
  const filteredProjects = useMemo(() => {
    const query = state.projects.searchQuery.toLowerCase().trim();
    if (!query) return projectsWithCollections;

    return projectsWithCollections.filter((project) => {
      // Match project name
      if (project.name.toLowerCase().includes(query)) return true;

      // Match collection names
      if (project.collections.some((c) => c.name.toLowerCase().includes(query)))
        return true;

      // Match NFT names
      if (
        project.collections.some((c) =>
          c.nfts.some((n) => n.name.toLowerCase().includes(query))
        )
      )
        return true;

      // Match lootbox names
      if (project.lootboxes.some((lb) => lb.name.toLowerCase().includes(query)))
        return true;

      return false;
    });
  }, [projectsWithCollections, state.projects.searchQuery]);

  // Show loading skeleton
  if (isLoading) {
    return <SkeletonLoader count={3} />;
  }

  return (
    <div className="space-y-4">
      {/* Search and Create Row */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-studio-text-muted pointer-events-none" />
          <Input
            type="text"
            placeholder="Search projects, collections, NFTs..."
            value={state.projects.searchQuery}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-studio-surface border-studio-border text-studio-text placeholder:text-studio-text-muted focus-visible:ring-studio-accent"
            aria-label="Search projects, collections, and NFTs"
          />
        </div>
        <Button
          onClick={goToCreate}
          className="bg-studio-accent hover:bg-studio-accent/90 text-white flex-shrink-0"
        >
          <FolderPlus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">New Project</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>

      {/* Project List or Empty State */}
      {filteredProjects.length === 0 ? (
        state.projects.searchQuery.length > 0 ? (
          <NoSearchResultsEmpty onAction={() => setSearch('')} />
        ) : (
          <NoProjectsEmpty onAction={goToCreate} />
        )
      ) : (
        <motion.div
          className="space-y-3"
          variants={staggerContainerVariants}
          initial="initial"
          animate="animate"
        >
          {filteredProjects.map((project) => (
            <motion.div
              key={project.id}
              variants={staggerItemVariants}
              transition={standardTransition}
            >
              <ProjectRow
                project={project}
                isExpanded={state.projects.expandedProject === project.id}
                expandedCollection={state.projects.expandedCollection}
                onExpand={() =>
                  expandProject(
                    state.projects.expandedProject === project.id
                      ? null
                      : project.id
                  )
                }
                onExpandCollection={expandCollection}
                onAddCollection={() => goToCreate()}
                onAddNft={handleAddNft}
                onViewCollection={handleViewCollection}
                onViewNfts={(collectionId) => {
                  // Find collection and open panel
                  const coll = project.collections.find(
                    (c) => c.id === collectionId
                  );
                  if (coll) handleViewCollection(coll);
                }}
                onEdit={(p) => {
                  // TODO: Open edit modal
                  console.log('Edit project:', p.id);
                }}
                onDelete={(p) => {
                  // TODO: Open delete confirmation
                  console.log('Delete project:', p.id);
                }}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* NFT Minting Modal */}
      {state.nftModalCollection && (
        <MintNFTsModal
          isOpen={!!state.nftModalCollection}
          onClose={closeNftModal}
          collection={{
            id: state.nftModalCollection.id,
            name: state.nftModalCollection.name,
            symbol: state.nftModalCollection.symbol,
            address: state.nftModalCollection.address,
            chainId: state.nftModalCollection.chainId,
            contractType: state.nftModalCollection.contractType,
            image: state.nftModalCollection.image,
          }}
          onSuccess={() => {
            refreshData();
            closeNftModal();
          }}
        />
      )}

      {/* Collection Detail Panel */}
      <CollectionDetailPanel
        collection={state.selectedCollectionForPanel}
        onClose={closeCollectionPanel}
        onAddNft={handleAddNftFromPanel}
        onRefresh={refreshData}
      />
    </div>
  );
}
