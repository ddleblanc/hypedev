"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Play, Edit3, Plus, Settings, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MediaRenderer } from "@/components/MediaRenderer";

interface StudioCollectionPageProps {
  slug: string;
}

// This is a Studio-specific copy of CollectionDetailPage. It intentionally
// duplicates layout so the studio can diverge (management tools, drafts, edit flows).
// Start with the same visual structure (full-bleed hero + content) and add a
// Studio Tools panel on the hero so collection managers can act without leaving Studio.

export function StudioCollectionPage({ collection }: { collection: any }) {
  const [activeTab, setActiveTab] = useState('items');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.06]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  useEffect(() => {
    setActiveTab('items');
    setViewMode('grid');
    setSearchQuery('');
    console.log(collection)
  }, [collection?.id]);



  // Studio management actions (placeholders)
  const handleEdit = () => alert('Open collection editor (studio)');
  const handleMint = () => alert('Open minting flow');
  const handleSettings = () => alert('Open collection settings');
  const handleAirdrop = () => alert('Trigger airdrop tool');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
      className="w-full min-h-screen bg-black"
    >
      <div className="relative">
        {/* Hero Section - full-bleed like marketplace */}
        <motion.div
          ref={heroRef}
          className="relative h-[40vh] overflow-hidden"
          style={{ scale: heroScale }}
        >
          <div className="absolute inset-0">
            <MediaRenderer
              src={collection.videoUrl}
              alt={collection.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          </div>

          {/* Studio Tools panel (top-right within hero) */}
          <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
            <Button size="sm" variant="outline" className="text-white flex items-center gap-2" onClick={handleEdit}>
              <Edit3 className="w-4 h-4" /> Edit
            </Button>
            <Button size="sm" className="bg-white text-black flex items-center gap-2" onClick={handleMint}>
              <Plus className="w-4 h-4" /> Mint
            </Button>
            <Button size="sm" variant="ghost" className="text-white" onClick={handleSettings}>
              <Settings className="w-4 h-4" />
            </Button>
          </div>

          {/* Close controls and play/mute in hero bottom-left */}
          <motion.div style={{ opacity: heroOpacity }} className="absolute bottom-4 left-4 right-4 p-2 md:p-6 z-20">
            <div className="max-w-4xl">
              <div className="flex items-center gap-4 mb-3">
                {collection.logo && <MediaRenderer src={collection.logo} alt={collection.title} className="h-12 w-auto rounded-md" />}
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white">{collection.title}</h2>
                  {collection.subtitle && <p className="text-white/70 text-sm">{collection.subtitle}</p>}
                </div>
              </div>
              {collection.description && (
                <p className="text-white/80 text-sm md:text-base leading-relaxed">{collection.longDescription || collection.description}</p>
              )}
              <div className="flex items-center gap-3 mt-4">
                <Button className="bg-white text-black font-bold" onClick={() => {}}>
                  <Play className="w-4 h-4 mr-2" /> Preview
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Content area */}
        <div className="bg-black/80 backdrop-blur-sm border-t border-white/10 px-4 md:px-6 py-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="text-white/70">{collection.nfts ? collection.nfts.length : 0} items</div>
              <div className="text-white/70">{collection.stats?.owners ?? '—'} owners</div>
              <div className="text-white/70">Floor: {collection.stats?.floorPrice ?? '—'}</div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="icon" onClick={() => setViewMode('grid')}>
                <svg className="w-4 h-4" />
              </Button>
              <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="icon" onClick={() => setViewMode('list')}>
                <svg className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-3 mb-6">
            {['about', 'items', 'offers', 'holders', 'traits', 'activity'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${activeTab === tab ? 'bg-[rgb(163,255,18)]/20 text-[rgb(163,255,18)]' : 'text-white/70 hover:bg-white/6'}`}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab content (simplified, same structure as public page) */}
          <div>
            {activeTab === 'about' && (
              <div className="space-y-4 text-white/80">
                <h3 className="text-lg font-bold text-white">About</h3>
                <p>{collection.longDescription || collection.description}</p>
                {/* Studio-only quick actions */}
                <div className="mt-4 flex items-center gap-3">
                  <Button size="sm" onClick={handleEdit} className="bg-white text-black">Edit Metadata</Button>
                  <Button size="sm" onClick={handleAirdrop} variant="outline">Airdrop</Button>
                  <Button size="sm" onClick={handleMint} className="bg-[rgb(163,255,18)] text-black">Quick Mint</Button>
                </div>
              </div>
            )}

            {activeTab === 'items' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-white/70">Showing {collection.nfts?.length ?? 0} items</div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Input placeholder="Search items..." value={searchQuery} onChange={(e:any)=>setSearchQuery(e.target.value)} className="pl-3 pr-3 py-2 bg-black/30 border-white/10 text-white" />
                    </div>
                  </div>
                </div>

                <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'}`}>
                  {collection.nfts?.map((item:any, idx:number) => (
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
              </div>
            )}

            {activeTab === 'offers' && (
              <div className="text-center py-12 text-white/70">No offers yet</div>
            )}

            {activeTab === 'holders' && (
              <div className="grid gap-3">
                {(collection.nfts || []).slice(0,10).map((item:any, i:number)=> (
                  <div key={item.id ?? i} className="flex items-center justify-between p-3 bg-black/40 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full" />
                      <div>
                        <p className="text-white font-medium">Holder #{i + 1}</p>
                        <p className="text-white/60 text-sm">{item.ownerAddress ? (item.ownerAddress.slice(0,6) + '...' + item.ownerAddress.slice(-4)) : '0x----...----'}</p>
                      </div>
                    </div>
                    <div className="text-white font-bold">{Math.floor(Math.random()*50)+1} items</div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'traits' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(collection.traits || []).map((trait:any) => (
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
            )}

            {activeTab === 'activity' && (
              <div className="space-y-3">
                {[...Array(6)].map((_, i)=> (
                  <div key={i} className="flex items-center justify-between p-3 bg-black/40 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg" />
                      <div>
                        <p className="text-white font-medium">Activity #{i+1}</p>
                        <p className="text-white/60 text-sm">Some action</p>
                      </div>
                    </div>
                    <div className="text-white">{(Math.random()*5+0.1).toFixed(2)} ETH</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
