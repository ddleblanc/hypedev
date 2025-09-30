"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Grid3x3, List as ListIcon, Filter, Search, ChevronDown, Play, Sparkles } from "lucide-react";
import { MediaRenderer } from "@/components/media-renderer";
import { cn } from "@/lib/utils";
import { useLists } from "@/contexts/lists-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function ListsContent() {
  const router = useRouter();
  const { lists, selectedList, isLoading, handleRemoveItem } = useLists();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<'all' | string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = selectedList?.items.filter(item => {
    const matchesType = filterType === 'all' || item.itemType === filterType;
    const matchesSearch = !searchQuery ||
      item.metadata?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.metadata?.symbol?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  }) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <div className="w-8 h-8 border-2 border-white/20 border-t-[rgb(163,255,18)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen overflow-hidden">
      {/* Sticky Top Bar */}
      <div className="sticky top-16 z-30 bg-black/95 backdrop-blur-xl border-b border-white/10">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Left: Title & Stats */}
            <div className="flex items-center gap-6">
              <div>
                <h1 className="text-3xl font-black text-white mb-1 flex items-center gap-3">
                  <Sparkles className="w-7 h-7 text-[rgb(163,255,18)]" />
                  MY LISTS
                </h1>
                <p className="text-white/60 text-sm">
                  {lists.length} {lists.length === 1 ? 'list' : 'lists'} • {selectedList ? `${selectedList._count.items} items` : 'No list selected'}
                </p>
              </div>

              {/* Quick Stats */}
              {selectedList && (
                <div className="flex items-center gap-4 pl-6 border-l border-white/10">
                  <div className="text-center">
                    <p className="text-xs text-white/40 uppercase tracking-wide mb-1">Collections</p>
                    <p className="text-lg font-bold text-white">
                      {selectedList.items.filter(i => i.itemType === 'collection').length}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-white/40 uppercase tracking-wide mb-1">NFTs</p>
                    <p className="text-lg font-bold text-white">
                      {selectedList.items.filter(i => i.itemType === 'nft').length}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-white/40 uppercase tracking-wide mb-1">Launchpad</p>
                    <p className="text-lg font-bold text-white">
                      {selectedList.items.filter(i => i.itemType === 'launchpad').length}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 pr-4 py-3 bg-black/60 border-white/20 text-white rounded-lg focus:border-[rgb(163,255,18)]/50 transition-colors w-64"
                />
              </div>

              {/* Filter Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white/20 text-white hover:bg-white/10 hover:border-[rgb(163,255,18)]/50 transition-all px-6 py-3 rounded-lg"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    {filterType === 'all' ? 'All Types' : filterType.toUpperCase()}
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-black/95 backdrop-blur-xl border-white/20">
                  <DropdownMenuItem onClick={() => setFilterType('all')}>All Types</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType('collection')}>Collections</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType('nft')}>NFTs</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType('launchpad')}>Launchpad</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType('user')}>Users</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType('game')}>Games</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 bg-black/60 rounded-lg p-1 border border-white/10">
                <Button
                  size="icon"
                  variant="ghost"
                  className={cn(
                    "rounded-md transition-all h-10 w-10",
                    viewMode === 'grid'
                      ? "bg-[rgb(163,255,18)]/20 text-[rgb(163,255,18)]"
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  )}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className={cn(
                    "rounded-md transition-all h-10 w-10",
                    viewMode === 'list'
                      ? "bg-[rgb(163,255,18)]/20 text-[rgb(163,255,18)]"
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  )}
                  onClick={() => setViewMode('list')}
                >
                  <ListIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 pt-24 py-12">
        <div className="w-full">
          {selectedList ? (
            <>
              {/* Items - Cinematic Grid */}
              {filteredItems.length === 0 ? (
                <div className="text-center py-16 bg-gradient-to-br from-purple-900/10 to-blue-900/10 rounded-xl border border-white/10">
                  <Sparkles className="w-16 h-16 text-white/10 mx-auto mb-4" />
                  <p className="text-white/40 font-bold mb-2 text-xl">No items found</p>
                  <p className="text-white/30 text-sm">
                    {searchQuery || filterType !== 'all'
                      ? 'Try adjusting your filters'
                      : 'Start adding items to create your wall of art'}
                  </p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className="group relative cursor-pointer transition-transform hover:scale-[1.02] hover:-translate-y-1"
                    >
                      <div className="relative overflow-hidden rounded-xl">
                        <div
                          className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800"
                          onClick={() => {
                            if (item.itemType === 'launchpad' || item.itemType === 'collection') {
                              router.push(`/launchpad/${item.itemId}`);
                            } else if (item.itemType === 'nft') {
                              router.push(`/marketplace/nft/${item.itemId}`);
                            }
                          }}
                        >
                          <div className="w-full h-full group-hover:scale-105 transition-transform duration-700">
                            <MediaRenderer
                              src={item.metadata?.image || '/api/placeholder/300/450'}
                              alt={item.metadata?.name || 'Item'}
                              className="w-full h-full object-cover"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                          {/* Type Badge */}
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-[rgb(163,255,18)]/90 text-black font-bold text-xs px-2 py-1">
                              {item.itemType.toUpperCase()}
                            </Badge>
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveItem(selectedList.id, item.itemType, item.itemId);
                            }}
                            className="absolute top-3 left-3 p-2 bg-red-500/80 hover:bg-red-500 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4 text-white" />
                          </button>

                          {/* Play Icon on Hover */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <div className="bg-black/60 backdrop-blur-sm rounded-full p-4">
                              <Play className="w-8 h-8 text-white fill-white" />
                            </div>
                          </div>

                          {/* Info */}
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <h3 className="text-white font-bold text-sm mb-1 truncate">
                              {item.metadata?.name || 'Unknown'}
                            </h3>
                            {item.metadata?.symbol && (
                              <p className="text-white/70 text-xs">{item.metadata.symbol}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-4 bg-black border border-white/10 hover:border-white/20 transition-all rounded-lg"
                    >
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        <MediaRenderer
                          src={item.metadata?.image || '/api/placeholder/80/80'}
                          alt={item.metadata?.name || 'Item'}
                          className="w-full h-full object-cover"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-bold truncate">{item.metadata?.name || 'Unknown'}</h3>
                        <p className="text-white/60 text-sm">{item.itemType}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white/40 text-xs">
                          Added {new Date(item.addedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                        onClick={() => handleRemoveItem(selectedList.id, item.itemType, item.itemId)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 bg-gradient-to-br from-purple-900/10 to-blue-900/10 rounded-xl border border-white/10">
              <Sparkles className="w-16 h-16 text-white/10 mx-auto mb-4" />
              <p className="text-white/40 font-bold text-xl">Select a list to view items</p>
              <p className="text-white/30 text-sm mt-2">Choose from your lists in the sidebar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ListsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-[rgb(163,255,18)] rounded-full animate-spin" />
      </div>
    }>
      <ListsContent />
    </Suspense>
  );
}