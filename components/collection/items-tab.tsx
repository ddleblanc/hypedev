"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Heart } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ItemCard } from "./item-card";
import { ItemCardSkeletonGrid } from "./item-card-skeleton";
import { ItemsFiltersBar } from "./items-filters-bar";
import { AdvancedFiltersPanel, TraitFilterMode } from "./advanced-filters-panel";
import { SweepFloorDialog } from "@/components/nft/sweep-floor-dialog";
import { NFTBuyDialog } from "@/components/nft/buy-dialog";
import { NFTOfferDialog } from "@/components/nft/offer-dialog";
import { NFTTakeoverModal } from "@/components/nft/nft-takeover-modal";
import { Collection, CollectionItem } from "./types";
import { trpc } from "@/lib/trpc/client";

interface ItemsTabProps {
  collection: Collection;
}

export function ItemsTab({ collection }: ItemsTabProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('price-low');
  const [filterRarity, setFilterRarity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [traitFilterMode, setTraitFilterMode] = useState<TraitFilterMode>('or');
  const [priceRange, setPriceRange] = useState([0, 100]);
  const [showSweepDialog, setShowSweepDialog] = useState(false);
  const [showBuyDialog, setShowBuyDialog] = useState(false);
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CollectionItem | null>(null);

  // Fetch NFTs via tRPC
  const { data: nftsData, isLoading: loadingNfts, refetch: refetchNfts } = trpc.marketplace.collections.nfts.useQuery(
    { collectionId: collection.id, page: 1, limit: 100 },
    { enabled: !!collection.id }
  );

  // Transform tRPC data to expected format
  const nfts = useMemo(() => {
    if (!nftsData?.nfts) return [];
    return nftsData.nfts as unknown as CollectionItem[];
  }, [nftsData]);

  // Use fetched NFTs if available, otherwise fall back to collection.items
  const items = nfts.length > 0 ? nfts : (collection.items || []);

  // Calculate dynamic price range from items
  const { minPrice, maxPrice } = useMemo(() => {
    if (items.length === 0) return { minPrice: 0, maxPrice: 100 };

    const prices = items.map(item => parseFloat(item.price)).filter(p => !isNaN(p) && p > 0);
    if (prices.length === 0) return { minPrice: 0, maxPrice: 100 };

    const min = Math.floor(Math.min(...prices) * 1000) / 1000; // Round down to 3 decimals
    const max = Math.ceil(Math.max(...prices) * 1000) / 1000; // Round up to 3 decimals

    return { minPrice: min, maxPrice: Math.max(max, min + 0.001) }; // Ensure max > min
  }, [items]);

  // Update price range when items change (initialize to full range)
  useEffect(() => {
    if (items.length > 0 && priceRange[0] === 0 && priceRange[1] === 100) {
      // Only initialize if using default values
      setPriceRange([minPrice, maxPrice]);
    }
  }, [minPrice, maxPrice, items.length]);

  // Filter items (memoized to prevent unnecessary re-renders)
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRarity = filterRarity === 'all' || item.rarity.toLowerCase() === filterRarity;
      const matchesPrice = parseFloat(item.price) >= priceRange[0] && parseFloat(item.price) <= priceRange[1];

      // Status filter logic
      let matchesStatus = true;
      switch (filterStatus) {
        case 'listed':
          matchesStatus = item.listed === true;
          break;
        case 'not-listed':
          matchesStatus = item.listed !== true;
          break;
        case 'has-offers':
          matchesStatus = item.hasOffer === true;
          break;
        case 'on-auction':
          matchesStatus = item.onAuction === true;
          break;
        case 'all':
        default:
          matchesStatus = true;
      }

      // Trait filter logic with AND/OR support
      let matchesTraits = true;
      if (selectedTraits.length > 0 && item.traits) {
        const itemTraitValues = item.traits.map(t => t.value);

        if (traitFilterMode === 'and') {
          // AND mode: item must have ALL selected traits
          matchesTraits = selectedTraits.every(trait => itemTraitValues.includes(trait));
        } else {
          // OR mode: item must have ANY of the selected traits
          matchesTraits = selectedTraits.some(trait => itemTraitValues.includes(trait));
        }
      }

      return matchesSearch && matchesRarity && matchesPrice && matchesStatus && matchesTraits;
    });
  }, [items, searchQuery, filterRarity, filterStatus, priceRange, selectedTraits, traitFilterMode]);

  // Check if there are any listed items for sweep functionality
  const hasListings = useMemo(() => {
    return items.some(item => item.listed === true);
  }, [items]);

  // Sort items (memoized to prevent unnecessary re-renders)
  const sortedItems = useMemo(() => {
    const rarityOrder = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'];
    return [...filteredItems].sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return parseFloat(a.price) - parseFloat(b.price);
        case 'price-high':
          return parseFloat(b.price) - parseFloat(a.price);
        case 'rarity':
          return rarityOrder.indexOf(b.rarity) - rarityOrder.indexOf(a.rarity);
        case 'rarity-common':
          return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
        case 'rank':
          return a.rank - b.rank; // Lower rank is better
        case 'rank-worst':
          return b.rank - a.rank;
        case 'recent':
          // Handle both string and number ids
          return String(b.id).localeCompare(String(a.id));
        case 'oldest':
          return String(a.id).localeCompare(String(b.id));
        case 'name-az':
          return a.name.localeCompare(b.name);
        case 'name-za':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });
  }, [filteredItems, sortBy]);

  const handleTraitToggle = (trait: string) => {
    if (selectedTraits.includes(trait)) {
      setSelectedTraits(selectedTraits.filter(t => t !== trait));
    } else {
      setSelectedTraits([...selectedTraits, trait]);
    }
  };

  const handleClearAll = () => {
    setSelectedTraits([]);
    setTraitFilterMode('or');
    setPriceRange([minPrice, maxPrice]); // Reset to dynamic range
    setFilterRarity('all');
    setFilterStatus('all');
  };

  // Callback for when sweep succeeds - refresh NFT data
  const handleSweepSuccess = () => {
    // Re-fetch NFTs after successful sweep via tRPC
    refetchNfts();
  };

  // Handler for Buy Now button
  const handleBuyNow = (item: CollectionItem) => {
    setSelectedItem(item);
    setShowBuyDialog(true);
  };

  // Handler for Make Offer button
  const handleMakeOffer = (item: CollectionItem) => {
    setSelectedItem(item);
    setShowOfferDialog(true);
  };

  // Callback for when purchase completes - refresh NFT data
  const handlePurchaseComplete = () => {
    handleSweepSuccess(); // Reuse the refresh logic
  };

  // Callback for when offer completes - refresh NFT data
  const handleOfferComplete = () => {
    handleSweepSuccess(); // Reuse the refresh logic
  };

  // Handler for clicking on an item to open detail modal
  const handleItemClick = (item: CollectionItem) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  // Handler for Buy Now from detail modal
  const handleDetailBuyNow = (item: CollectionItem) => {
    setShowDetailModal(false);
    setSelectedItem(item);
    setShowBuyDialog(true);
  };

  // Handler for Make Offer from detail modal
  const handleDetailMakeOffer = (item: CollectionItem) => {
    setShowDetailModal(false);
    setSelectedItem(item);
    setShowOfferDialog(true);
  };

  return (
    <TabsContent value="items" className="mt-0 space-y-6">
      <ItemsFiltersBar
        itemsCount={sortedItems.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        filterRarity={filterRarity}
        onRarityChange={setFilterRarity}
        filterStatus={filterStatus}
        onStatusChange={setFilterStatus}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        selectedTraitsCount={selectedTraits.length}
        onSweepClick={() => setShowSweepDialog(true)}
        hasListings={hasListings}
      />

      <AdvancedFiltersPanel
        show={showFilters}
        priceRange={priceRange}
        onPriceRangeChange={setPriceRange}
        minPrice={minPrice}
        maxPrice={maxPrice}
        traits={collection.traits}
        selectedTraits={selectedTraits}
        onTraitToggle={handleTraitToggle}
        onClearAll={handleClearAll}
        onApply={() => setShowFilters(false)}
        traitFilterMode={traitFilterMode}
        onTraitFilterModeChange={setTraitFilterMode}
      />

      {/* Items Grid - No staggered animations, instant display like OpenSea/MagicEden */}
      {loadingNfts ? (
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          <ItemCardSkeletonGrid count={10} />
        </div>
      ) : (
      <div className={`grid gap-3 ${
        viewMode === 'grid'
          ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
          : 'grid-cols-1'
      }`}>
        {sortedItems.map((item, index) => (
          viewMode === 'grid' ? (
            <ItemCard
              key={`${item.id}-${index}`}
              item={item}
              onClick={() => handleItemClick(item)}
              collection={{
                id: collection.id,
                name: collection.name,
                contractAddress: collection.contractAddress,
              }}
              onBuyNow={handleBuyNow}
              onMakeOffer={handleMakeOffer}
            />
          ) : (
            <Card
              key={`${item.id}-${index}`}
              className="bg-black/40 border-white/10 hover:border-white/20 transition-colors duration-150"
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                    <div className="md:col-span-2">
                      <p className="font-bold text-white">{item.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`text-[10px] ${
                          item.rarity === 'Mythic' ? 'bg-purple-500' :
                          item.rarity === 'Legendary' ? 'bg-orange-500' :
                          item.rarity === 'Epic' ? 'bg-purple-400' :
                          item.rarity === 'Rare' ? 'bg-blue-500' :
                          'bg-gray-500'
                        }`}>
                          {item.rarity}
                        </Badge>
                        <span className="text-xs text-white/60">Rank #{item.rank}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-white/60">Price</p>
                      <p className="font-bold text-[rgb(163,255,18)]">{item.price} ETH</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/60">Last Sale</p>
                      <p className="text-sm text-white">{item.lastSale} ETH</p>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      {item.listed ? (
                        <Button
                          size="sm"
                          className="bg-[rgb(163,255,18)] text-black hover:bg-[rgb(143,235,0)]"
                          onClick={() => handleBuyNow(item)}
                        >
                          Buy Now
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="bg-blue-600 text-white hover:bg-blue-700"
                          onClick={() => handleMakeOffer(item)}
                        >
                          Make Offer
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="text-white/60 hover:text-white">
                        <Heart className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        ))}
      </div>
      )}

      {!loadingNfts && sortedItems.length === 0 && (
        <Card className="bg-black/40 border-white/10">
          <CardContent className="py-12 text-center">
            <Search className="w-12 h-12 text-white/40 mx-auto mb-4" />
            <p className="text-white/60">No items found matching your filters</p>
            <Button
              variant="outline"
              className="mt-4 border-white/20 text-white hover:bg-white/10"
              onClick={handleClearAll}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Sweep Floor Dialog */}
      <SweepFloorDialog
        open={showSweepDialog}
        onOpenChange={setShowSweepDialog}
        collection={{
          id: collection.id,
          name: collection.name,
          contractAddress: collection.contractAddress,
          floorPrice: collection.floorPrice,
          totalSupply: collection.totalSupply,
        }}
        onSuccess={handleSweepSuccess}
      />

      {/* Buy NFT Dialog */}
      <NFTBuyDialog
        open={showBuyDialog}
        onOpenChange={setShowBuyDialog}
        nft={selectedItem ? {
          id: String(selectedItem.id),
          name: selectedItem.name,
          image: selectedItem.image,
          price: parseFloat(selectedItem.price),
          rarity: selectedItem.rarity,
          collection: collection.id,
          collectionName: collection.name,
          contractAddress: collection.contractAddress,
          listingId: selectedItem.listingId || undefined,
          // Use onChainTokenId if available, otherwise fall back to id
          tokenId: selectedItem.onChainTokenId || String(selectedItem.id),
        } : null}
        onPurchaseComplete={handlePurchaseComplete}
      />

      {/* Make Offer Dialog */}
      <NFTOfferDialog
        open={showOfferDialog}
        onOpenChange={setShowOfferDialog}
        nft={selectedItem ? {
          id: String(selectedItem.id),
          dbId: selectedItem.dbId, // Database UUID for proper FK reference
          name: selectedItem.name,
          image: selectedItem.image,
          price: selectedItem.listed ? parseFloat(selectedItem.price) : undefined,
          rarity: selectedItem.rarity,
          collection: collection.id,
          collectionName: collection.name,
          contractAddress: collection.contractAddress,
          // Use onChainTokenId if available, otherwise fall back to id
          tokenId: selectedItem.onChainTokenId || String(selectedItem.id),
          floorPrice: collection.floorPrice ? parseFloat(String(collection.floorPrice)) : undefined,
        } : null}
        onOfferComplete={handleOfferComplete}
      />

      {/* NFT Detail Takeover Modal */}
      <NFTTakeoverModal
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
        nft={selectedItem}
        nftList={sortedItems}
        collection={{
          id: collection.id,
          name: collection.name,
          contractAddress: collection.contractAddress,
          floorPrice: collection.floorPrice,
          verified: collection.creator?.verified,
        }}
        onBuyNow={handleDetailBuyNow}
        onMakeOffer={handleDetailMakeOffer}
      />
    </TabsContent>
  );
}
