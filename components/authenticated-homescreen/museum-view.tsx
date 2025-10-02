"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMuseum } from "@/contexts/museum-context";
import { Play, Info, Plus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import "./museum-animations.css";

type MuseumViewProps = {
  setViewMode: (mode: string) => void;
};

export function MuseumView({ setViewMode }: MuseumViewProps) {
  const { selectedItem, playIntro, showTitleAnimation, introComplete } = useMuseum();
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const [scrollY, setScrollY] = useState(0);

  // Listen for museum item clicks from sidebars
  useEffect(() => {
    const handleMuseumItemClick = (event: any) => {
      const item = event.detail;
      playIntro(item);
    };

    window.addEventListener('museum-item-click', handleMuseumItemClick);
    return () => window.removeEventListener('museum-item-click', handleMuseumItemClick);
  }, [playIntro]);

  // Scroll tracking
  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLDivElement;
      setScrollY(target.scrollTop);
    };

    const scrollContainer = document.querySelector('.museum-scroll-container');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [introComplete]);

  return (
    <div className={`fixed inset-0 z-10 overflow-hidden ${selectedItem ? 'bg-black' : ''}`}>
      {/* Title Animation */}
      <AnimatePresence>
        {showTitleAnimation && (
          <motion.div
            className="fixed inset-0 z-45 flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.h1
              className="text-6xl md:text-8xl font-bold text-white mb-6 tracking-wider"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              LEGENDS HALL
            </motion.h1>
            <motion.p
              className="text-xl md:text-2xl text-white/60 font-light tracking-wide"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              A Cinematic Journey
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Netflix-Style Content Page */}
      <AnimatePresence mode="wait">
        {introComplete && selectedItem && (
          <motion.div
            className="fixed inset-0 z-40 bg-[#0a0a0a] museum-scroll-container overflow-y-auto scrollbar-hide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* Hero Header */}
            <section className="relative h-screen">
              {/* Video Background */}
              <div className="absolute inset-0">
                <video
                  ref={heroVideoRef}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  src="/assets/img/jugi.mp4"
                />

                {/* Gradients - Netflix Style */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
              </div>

              {/* Hero Content */}
              <div className="absolute inset-0 flex items-center z-10">
                <div className="px-8 md:px-16 max-w-4xl">
                  <div className="opacity-0 animate-[fadeInUp_0.6s_ease-out_0.2s_forwards]">
                    <span className="text-sm md:text-base text-white/50 font-medium tracking-wider uppercase mb-4 block">
                      {selectedItem?.subtitle || 'Genesis Collection'}
                    </span>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 tracking-tight">
                      {selectedItem?.title || 'The Digital Renaissance'}
                    </h1>

                    <p className="text-xl md:text-2xl text-white/90 mb-8 font-light leading-relaxed">
                      Where timeless art meets blockchain innovation. Own a piece of history,
                      reimagined for the digital age.
                    </p>

                    <p className="text-base md:text-lg text-white/60 mb-10 max-w-2xl">
                      10,000 unique masterpieces bridging classical artistry with cutting-edge technology.
                      Each NFT grants exclusive access to our virtual galleries and real-world exhibitions.
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-4 mb-12">
                      <Button
                        size="lg"
                        className="bg-white text-black hover:bg-white/90 font-bold text-lg px-8 py-6 h-auto"
                      >
                        <Play className="w-5 h-5 mr-2 fill-current" />
                        View Collection
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        className="bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm font-semibold text-lg px-8 py-6 h-auto"
                      >
                        <Info className="w-5 h-5 mr-2" />
                        Learn More
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        className="bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm font-semibold text-lg px-6 py-6 h-auto"
                      >
                        <Plus className="w-5 h-5" />
                      </Button>
                    </div>

                    {/* Quick Stats */}
                    <div className="flex gap-8">
                      <div>
                        <p className="text-3xl font-bold text-white">10K</p>
                        <p className="text-sm text-white/50 uppercase tracking-wider">Total Supply</p>
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-white">0.08Ξ</p>
                        <p className="text-sm text-white/50 uppercase tracking-wider">Floor Price</p>
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-white">6.5K</p>
                        <p className="text-sm text-white/50 uppercase tracking-wider">Owners</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scroll Indicator */}
              {scrollY < 50 && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-0 animate-[fadeIn_0.6s_ease-out_1s_forwards]">
                  <ChevronDown className="w-8 h-8 text-white/60 animate-bounce" />
                </div>
              )}
            </section>

            {/* Content Sections */}

            {/* The Vision Section */}
            <section className="relative bg-[#0a0a0a] px-8 md:px-16 py-24">
              <div className="max-w-7xl mx-auto">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                  <div>
                    <span className="text-white/50 font-medium tracking-wider uppercase text-sm">The Vision</span>
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 mt-4">
                      A Computer In Every Home
                    </h2>
                    <p className="text-lg text-white/70 leading-relaxed mb-6">
                      Legends Hall reimagines the museum experience for the digital age.
                      Each piece in our collection represents a convergence of artistic mastery
                      and technological innovation.
                    </p>
                    <p className="text-lg text-white/70 leading-relaxed">
                      We've curated 10,000 unique digital masterpieces, each telling its own
                      story while contributing to a larger narrative about the evolution of art
                      in the blockchain era.
                    </p>
                  </div>
                  <div className="relative">
                    <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-white/10 to-transparent p-8">
                      <div className="h-full rounded-xl bg-white/5 backdrop-blur-sm flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-6xl font-bold text-white mb-4">∞</p>
                          <p className="text-white text-xl">Infinite Possibilities</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Featured Collection */}
            <section className="relative bg-gradient-to-b from-[#0a0a0a] to-[#0f0f0f] px-8 md:px-16 py-24">
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                  <span className="text-white/50 font-medium tracking-wider uppercase text-sm">Featured Works</span>
                  <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-6">
                    The Genesis Collection
                  </h2>
                  <p className="text-lg text-white/70 max-w-3xl mx-auto">
                    Each piece is algorithmically generated from over 200 hand-crafted traits,
                    ensuring every NFT is a unique work of art.
                  </p>
                </div>

                {/* NFT Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="group relative">
                      <div className="aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-white/5 to-transparent">
                        <img
                          src={selectedItem?.thumbnail || '/api/placeholder/400/400'}
                          alt={`NFT #${1000 + i}`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl flex flex-col justify-end p-4">
                        <p className="text-white font-bold">Legend #{1000 + i}</p>
                        <p className="text-white/60 text-sm">0.08 ETH</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-center">
                  <Button size="lg" className="bg-white text-black hover:bg-white/90 font-bold">
                    Explore Full Collection
                  </Button>
                </div>
              </div>
            </section>

            {/* Rarity & Traits */}
            <section className="relative bg-[#0f0f0f] px-8 md:px-16 py-24">
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                  <span className="text-white/50 font-medium tracking-wider uppercase text-sm">Rarity System</span>
                  <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-6">
                    Every Detail Matters
                  </h2>
                </div>

                <div className="grid md:grid-cols-4 gap-8 mb-16">
                  <div className="text-center p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 mx-auto mb-4"></div>
                    <h3 className="text-white font-bold mb-2">Common</h3>
                    <p className="text-white/50 text-sm">45% of collection</p>
                  </div>
                  <div className="text-center p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 mx-auto mb-4"></div>
                    <h3 className="text-white font-bold mb-2">Rare</h3>
                    <p className="text-white/50 text-sm">35% of collection</p>
                  </div>
                  <div className="text-center p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 mx-auto mb-4"></div>
                    <h3 className="text-white font-bold mb-2">Epic</h3>
                    <p className="text-white/50 text-sm">15% of collection</p>
                  </div>
                  <div className="text-center p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-white to-gray-300 mx-auto mb-4"></div>
                    <h3 className="text-white font-bold mb-2">Legendary</h3>
                    <p className="text-white/50 text-sm">5% of collection</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  <div className="p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                    <h3 className="text-white font-bold text-xl mb-4">200+ Traits</h3>
                    <p className="text-white/60">Hand-crafted attributes across 12 categories</p>
                  </div>
                  <div className="p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                    <h3 className="text-white font-bold text-xl mb-4">Unique Algorithm</h3>
                    <p className="text-white/60">Proprietary generation ensuring no duplicates</p>
                  </div>
                  <div className="p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                    <h3 className="text-white font-bold text-xl mb-4">On-Chain Data</h3>
                    <p className="text-white/60">All metadata stored permanently on blockchain</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Artist Spotlight */}
            <section className="relative bg-gradient-to-b from-[#0f0f0f] to-[#0a0a0a] px-8 md:px-16 py-24">
              <div className="max-w-7xl mx-auto">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                  <div>
                    <span className="text-white/50 font-medium tracking-wider uppercase text-sm">The Creators</span>
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 mt-4">
                      Curated by Visionaries
                    </h2>
                    <p className="text-lg text-white/70 leading-relaxed mb-6">
                      Our team consists of award-winning digital artists, blockchain pioneers,
                      and cultural innovators who share a passion for pushing the boundaries
                      of what's possible in the NFT space.
                    </p>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white to-gray-300"></div>
                        <div>
                          <p className="text-white font-bold">Alex Chen</p>
                          <p className="text-white/50 text-sm">Lead Artist & Creative Director</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600"></div>
                        <div>
                          <p className="text-white font-bold">Maria Santos</p>
                          <p className="text-white/50 text-sm">Blockchain Architect</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600"></div>
                        <div>
                          <p className="text-white font-bold">James Wright</p>
                          <p className="text-white/50 text-sm">Community Lead</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="aspect-video rounded-2xl overflow-hidden">
                      <img
                        src={selectedItem?.thumbnail || '/api/placeholder/800/600'}
                        alt="Artist workspace"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                        <p className="text-white text-2xl font-bold">Behind the Scenes</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Mint Section */}
            <section className="relative bg-[#0a0a0a] px-8 md:px-16 py-24 border-t border-white/10">
              <div className="max-w-4xl mx-auto text-center">
                <span className="text-white/50 font-medium tracking-wider uppercase text-sm">Join the Movement</span>
                <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-6">
                  Become a Legend
                </h2>
                <p className="text-lg text-white/70 mb-12">
                  Mint your piece of digital history and gain access to exclusive exhibitions,
                  virtual events, and a community of art enthusiasts and collectors.
                </p>

                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-white/10">
                  <div className="grid md:grid-cols-2 gap-8 mb-8">
                    <div>
                      <p className="text-white/50 mb-2">Mint Price</p>
                      <p className="text-3xl font-bold text-white">0.08 ETH</p>
                    </div>
                    <div>
                      <p className="text-white/50 mb-2">Remaining</p>
                      <p className="text-3xl font-bold text-white">3,427 / 10,000</p>
                    </div>
                  </div>

                  <div className="w-full bg-white/10 rounded-full h-4 mb-8">
                    <div className="bg-gradient-to-r from-white to-gray-300 h-4 rounded-full" style={{width: '65.73%'}}></div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button size="lg" className="bg-white text-black hover:bg-white/90 font-bold text-lg px-12">
                      Mint Now
                    </Button>
                    <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                      View on OpenSea
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            {/* Roadmap */}
            <section className="relative bg-gradient-to-b from-[#0a0a0a] to-[#0f0f0f] px-8 md:px-16 py-24">
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                  <span className="text-white/50 font-medium tracking-wider uppercase text-sm">The Journey</span>
                  <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-6">
                    What's Next
                  </h2>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  <div className="p-8 rounded-xl bg-white/5 backdrop-blur-sm border border-white/30">
                    <div className="text-white font-bold text-lg mb-4">Phase 1: Genesis</div>
                    <h3 className="text-white font-bold text-xl mb-4">Collection Launch</h3>
                    <p className="text-white/60">10,000 unique pieces minted and distributed to collectors worldwide.</p>
                  </div>
                  <div className="p-8 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                    <div className="text-white/50 font-bold text-lg mb-4">Phase 2: Exhibition</div>
                    <h3 className="text-white font-bold text-xl mb-4">Virtual Gallery Opening</h3>
                    <p className="text-white/60">Immersive 3D gallery experience exclusive to NFT holders.</p>
                  </div>
                  <div className="p-8 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                    <div className="text-white/50 font-bold text-lg mb-4">Phase 3: Evolution</div>
                    <h3 className="text-white font-bold text-xl mb-4">Real-World Integration</h3>
                    <p className="text-white/60">Physical exhibitions and collaborations with renowned museums.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Footer CTA */}
            <section className="relative bg-[#0f0f0f] px-8 md:px-16 py-24 border-t border-white/10">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  Ready to Enter the Hall?
                </h2>
                <p className="text-lg text-white/70 mb-8">
                  Join thousands of collectors in the digital art revolution.
                </p>
                <Button size="lg" className="bg-white text-black hover:bg-white/90 font-bold text-lg px-12">
                  Start Your Collection
                </Button>
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
