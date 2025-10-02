"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Heart } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ItemCard } from "./item-card";
import { ItemsFiltersBar } from "./items-filters-bar";
import { AdvancedFiltersPanel } from "./advanced-filters-panel";
import { Collection, CollectionItem } from "./types";

interface ItemsTabProps {
  collection: Collection;
}

export function ItemsTab({ collection }: ItemsTabProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('price-low');
  const [filterRarity, setFilterRarity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 100]);
  const [nfts, setNfts] = useState<CollectionItem[]>([]);
  const [loadingNfts, setLoadingNfts] = useState(false);

  // Fetch NFTs when collection changes
  useEffect(() => {
    const fetchNfts = async () => {
      if (!collection.id) return;

      try {
        setLoadingNfts(true);
        const response = await fetch(`/api/marketplace/collection/${collection.id}/nfts`);
        const data = await response.json();

        if (data.success && data.nfts) {
          setNfts(data.nfts);
        }
      } catch (err) {
        console.error('Error fetching NFTs:', err);
      } finally {
        setLoadingNfts(false);
      }
    };

    fetchNfts();
  }, [collection.id]);

  // Use fetched NFTs if available, otherwise fall back to collection.items
  const items = nfts.length > 0 ? nfts : collection.items;

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRarity = filterRarity === 'all' || item.rarity.toLowerCase() === filterRarity;
    const matchesPrice = parseFloat(item.price) >= priceRange[0] && parseFloat(item.price) <= priceRange[1];
    return matchesSearch && matchesRarity && matchesPrice;
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'price-low': return parseFloat(a.price) - parseFloat(b.price);
      case 'price-high': return parseFloat(b.price) - parseFloat(a.price);
      case 'rarity': {
        const rarityOrder = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'];
        return rarityOrder.indexOf(b.rarity) - rarityOrder.indexOf(a.rarity);
      }
      case 'rank': return a.rank - b.rank;
      case 'recent': return b.id - a.id;
      default: return 0;
    }
  });

  const handleTraitToggle = (trait: string) => {
    if (selectedTraits.includes(trait)) {
      setSelectedTraits(selectedTraits.filter(t => t !== trait));
    } else {
      setSelectedTraits([...selectedTraits, trait]);
    }
  };

  const handleClearAll = () => {
    setSelectedTraits([]);
    setPriceRange([0, 100]);
    setFilterRarity('all');
  };

  return (
    <TabsContent value="items" className="mt-0 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <ItemsFiltersBar
          itemsCount={sortedItems.length}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          filterRarity={filterRarity}
          onRarityChange={setFilterRarity}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
          selectedTraitsCount={selectedTraits.length}
        />
      </motion.div>

      <AdvancedFiltersPanel
        show={showFilters}
        priceRange={priceRange}
        onPriceRangeChange={setPriceRange}
        traits={collection.traits}
        selectedTraits={selectedTraits}
        onTraitToggle={handleTraitToggle}
        onClearAll={handleClearAll}
        onApply={() => setShowFilters(false)}
      />

      {/* Items Grid */}
      <div className={`grid gap-4 ${
        viewMode === 'grid'
          ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
          : 'grid-cols-1'
      }`}>
        {sortedItems.map((item, index) => (
          viewMode === 'grid' ? (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.05 * index, duration: 0.4 }}
              whileHover={{ scale: 1.03, y: -5 }}
            >
              <ItemCard
                item={item}
                onClick={() => console.log('Open item:', item.id)}
              />
            </motion.div>
          ) : (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * index, duration: 0.4 }}
              whileHover={{ scale: 1.01 }}
            >
              <Card className="bg-black/40 border-white/10 hover:border-white/20 transition-all">
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
                        <Button size="sm" className="bg-black/80 text-white hover:bg-black/90 border border-white/20">
                          Buy Now
                        </Button>
                        <Button size="icon" variant="ghost" className="text-white/60 hover:text-white">
                          <Heart className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        ))}
      </div>

      {sortedItems.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
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
        </motion.div>
      )}
    </TabsContent>
  );
}
