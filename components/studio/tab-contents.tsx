"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MediaRenderer } from "@/components/MediaRenderer";
import { Plus } from "lucide-react";

interface AboutTabProps {
  collection: any;
  onEdit: () => void;
  onAirdrop: () => void;
  onMint: () => void;
}

export function AboutTab({ collection, onEdit, onAirdrop, onMint }: AboutTabProps) {
  return (
    <div className="space-y-4 text-white/80">
      <h3 className="text-lg font-bold text-white">About</h3>
      <p>{collection.longDescription || collection.description}</p>
      <div className="mt-4 flex items-center gap-3">
        <Button size="sm" onClick={onEdit} className="bg-white text-black">Edit Metadata</Button>
        <Button size="sm" onClick={onAirdrop} variant="outline">Airdrop</Button>
        <Button size="sm" onClick={onMint} className="bg-[rgb(163,255,18)] text-black">Quick Mint</Button>
      </div>
    </div>
  );
}

interface ItemsTabProps {
  collection: any;
  viewMode: 'grid' | 'list';
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddNFTs?: () => void;
}

export function ItemsTab({ collection, viewMode, searchQuery, onSearchChange, onAddNFTs }: ItemsTabProps) {
  const isDropContract = ['DropERC721', 'ERC721Drop', 'OpenEditionERC721'].includes(collection.contractType || '');
  const hasSharedMetadata = collection.sharedMetadata && Object.keys(collection.sharedMetadata).length > 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-white/70">
          {isDropContract && hasSharedMetadata
            ? 'Drop Contract - Shared Metadata Set'
            : `Showing ${collection.nfts?.length ?? 0} items`}
        </div>
        <div className="flex items-center gap-3">
          {onAddNFTs && (
            <Button
              onClick={onAddNFTs}
              className="bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              {isDropContract && hasSharedMetadata ? 'Update Shared Metadata' : 'Add NFTs'}
            </Button>
          )}
          {!isDropContract && (
            <div className="relative">
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e: any) => onSearchChange(e.target.value)}
                className="pl-3 pr-3 py-2 bg-black/30 border-white/10 text-white"
              />
            </div>
          )}
        </div>
      </div>

      {isDropContract ? (
        hasSharedMetadata ? (
          <div className="bg-black/40 rounded-xl border border-white/10 p-6">
            <div className="flex items-start gap-6">
              <div className="w-64 h-64 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                <MediaRenderer
                  src={collection.sharedMetadata.image}
                  alt={collection.sharedMetadata.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">{collection.sharedMetadata.name}</h3>
                  <p className="text-white/70 text-sm mb-1">All NFTs in this collection share this metadata</p>
                  <p className="text-white/50 text-xs">Each minted NFT will have a unique token ID appended (e.g., "{collection.sharedMetadata.name} #1")</p>
                </div>

                {collection.sharedMetadata.description && (
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-1">Description</h4>
                    <p className="text-white/70 text-sm">{collection.sharedMetadata.description}</p>
                  </div>
                )}

                {collection.sharedMetadata.attributes && collection.sharedMetadata.attributes.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-2">Attributes</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {collection.sharedMetadata.attributes.map((attr: any, idx: number) => (
                        <div key={idx} className="bg-white/5 rounded-lg p-2 border border-white/10">
                          <p className="text-xs text-white/60">{attr.trait_type}</p>
                          <p className="text-sm text-white font-medium">{attr.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {collection.sharedMetadata.external_url && (
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-1">External URL</h4>
                    <a
                      href={collection.sharedMetadata.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[rgb(163,255,18)] text-sm hover:underline"
                    >
                      {collection.sharedMetadata.external_url}
                    </a>
                  </div>
                )}

                {collection.sharedMetadataSetAt && (
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-xs text-white/50">
                      Last updated: {new Date(collection.sharedMetadataSetAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-black/40 rounded-xl border border-[rgb(163,255,18)]/30 p-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 bg-[rgb(163,255,18)]/10 rounded-full flex items-center justify-center mx-auto">
                <Plus className="w-8 h-8 text-[rgb(163,255,18)]" />
              </div>
              <h3 className="text-xl font-bold text-white">No Shared Metadata Set</h3>
              <p className="text-white/60 text-sm">
                This is a Drop contract. Click "Add NFTs" above to set the shared metadata that will be used for all NFTs in this collection.
              </p>
              <p className="text-white/50 text-xs">
                Once set, each NFT minted by users will share this metadata with a unique token ID appended.
              </p>
            </div>
          </div>
        )
      ) : (
        <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'}`}>
          {collection.nfts?.map((item: any, idx: number) => (
            <div key={item.id || idx} className="bg-black/40 rounded-xl overflow-hidden border border-white/10 p-3">
              <div className="aspect-square mb-3 bg-gray-800">
                <MediaRenderer src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-semibold text-sm">{item.name}</h4>
                  <p className="text-white/60 text-xs">{item.lastSale ?? ''}</p>
                </div>
                <div className="text-right">
                  <div className="text-[rgb(163,255,18)] font-bold">{item.price ?? '—'}</div>
                  <Button size="sm" className="bg-white text-black mt-2">Manage</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function OffersTab() {
  return (
    <div className="text-center py-12 text-white/70">No offers yet</div>
  );
}

interface HoldersTabProps {
  collection: any;
}

export function HoldersTab({ collection }: HoldersTabProps) {
  return (
    <div className="grid gap-3">
      {(collection.nfts || []).slice(0, 10).map((item: any, i: number) => (
        <div key={item.id ?? i} className="flex items-center justify-between p-3 bg-black/40 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full" />
            <div>
              <p className="text-white font-medium">Holder #{i + 1}</p>
              <p className="text-white/60 text-sm">{item.ownerAddress ? (item.ownerAddress.slice(0, 6) + '...' + item.ownerAddress.slice(-4)) : '0x----...----'}</p>
            </div>
          </div>
          <div className="text-white font-bold">{Math.floor(Math.random() * 50) + 1} items</div>
        </div>
      ))}
    </div>
  );
}

interface TraitsTabProps {
  collection: any;
}

export function TraitsTab({ collection }: TraitsTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {(collection.traits || []).map((trait: any) => (
        <div key={trait.name} className="bg-black/40 rounded-xl p-4">
          <h4 className="text-white font-bold mb-2">{trait.name}</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/80">Rarity</span>
              <span className="text-white">{trait.rarity}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/80">Percentage</span>
              <span className="text-[rgb(163,255,18)]">{trait.percentage}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ActivityTab() {
  return (
    <div className="space-y-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center justify-between p-3 bg-black/40 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg" />
            <div>
              <p className="text-white font-medium">Activity #{i + 1}</p>
              <p className="text-white/60 text-sm">Some action</p>
            </div>
          </div>
          <div className="text-white">{(Math.random() * 5 + 0.1).toFixed(2)} ETH</div>
        </div>
      ))}
    </div>
  );
}
