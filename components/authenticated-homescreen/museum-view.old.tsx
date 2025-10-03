"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMuseum } from "@/contexts/museum-context";
import { Play, Info, Plus, ChevronDown, Crown, ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import "./museum-animations.css";

type MuseumViewProps = {
  setViewMode: (mode: string) => void;
};

// Story Episodes Data
const episodes = [
  {
    id: 1,
    title: "The Save Game Pioneer",
    subtitle: "Episode I: Genesis",
    description: "Before this moment, games were ephemeral. Progress was lost the instant you powered down. Then one innovator dared to make virtual worlds remember.",
    year: "1982",
    videoUrl: "/assets/img/jugi.mp4",
    nftImage: "/api/placeholder/600/800",
    catalogNumber: "#0001",
    edition: "1 of 1",
    rarity: "Mythic",
    price: "0.08 ETH",
  },
  {
    id: 2,
    title: "Breaking the Impossible",
    subtitle: "Episode II: Innovation",
    description: "Memory was precious. Every byte counted. When everyone said it couldn't be done, one mind proved them wrong and changed gaming forever.",
    year: "1984",
    videoUrl: "/assets/img/jugi.mp4",
    nftImage: "/api/placeholder/600/800",
    catalogNumber: "#0002",
    edition: "1 of 1",
    rarity: "Legendary",
    price: "0.08 ETH",
  },
  {
    id: 3,
    title: "The Eternal Legacy",
    subtitle: "Episode III: Impact",
    description: "Billions of players. Countless worlds. Every modern game traces its lineage to this singular breakthrough that redefined what virtual worlds could be.",
    year: "1986",
    videoUrl: "/assets/img/jugi.mp4",
    nftImage: "/api/placeholder/600/800",
    catalogNumber: "#0003",
    edition: "1 of 1",
    rarity: "Mythic",
    price: "0.08 ETH",
  },
];

export function MuseumView({ setViewMode }: MuseumViewProps) {
  const { selectedItem, playIntro, showTitleAnimation, introComplete } = useMuseum();
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const [currentEpisode, setCurrentEpisode] = useState(0);

  // Listen for museum item clicks from sidebars
  useEffect(() => {
    const handleMuseumItemClick = (event: any) => {
      const item = event.detail;
      playIntro(item);
    };

    window.addEventListener('museum-item-click', handleMuseumItemClick);
    return () => window.removeEventListener('museum-item-click', handleMuseumItemClick);
  }, [playIntro]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setCurrentEpisode(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentEpisode(prev => Math.min(episodes.length - 1, prev + 1));
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const currentEp = episodes[currentEpisode];

  const nextEpisode = () => {
    setCurrentEpisode(prev => Math.min(episodes.length - 1, prev + 1));
  };

  const prevEpisode = () => {
    setCurrentEpisode(prev => Math.max(0, prev - 1));
  };

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

      {/* Cinematic Full-Screen Carousel */}
      <AnimatePresence mode="wait">
        {introComplete && selectedItem && (
          <motion.div
            key={currentEpisode}
            className="fixed inset-0 z-40 bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {/* Full-Screen Episode */}
            <div className="relative h-screen overflow-hidden">
              {/* Fullscreen Video Background */}
              <motion.div
                key={`video-${currentEpisode}`}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              >
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  src={currentEp.videoUrl}
                />

                {/* Cinematic Gradients */}
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/40" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black" />
              </motion.div>

              {/* Content Grid */}
              <div className="absolute inset-0 z-10 flex items-center">
                <div className="w-full h-full grid lg:grid-cols-[1fr,400px] gap-0 items-center px-8 md:px-16 py-20">

                  {/* Left Side - Story Content */}
                  <motion.div
                    key={`content-${currentEpisode}`}
                    className="space-y-8 max-w-3xl"
                    initial={{ opacity: 0, x: -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                  >
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

            {/* Museum Gallery Sections */}

            {/* Piece #1 - Monument Style */}
            <section className="relative bg-black px-4 md:px-16 py-20 md:py-32">
              <div className="max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-12 md:gap-16 items-center">
                  {/* Monumental NFT Display */}
                  <motion.div
                    className="relative group"
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {/* Museum Frame Effect */}
                    <div className="relative max-w-lg mx-auto lg:max-w-none">
                      {/* Spotlight glow */}
                      <div className="absolute -inset-20 bg-gradient-radial from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                      {/* Main artwork */}
                      <div className="relative aspect-square md:aspect-[4/5] rounded-sm overflow-hidden bg-black shadow-2xl">
                        <img
                          src={selectedItem?.thumbnail || '/api/placeholder/800/1000'}
                          alt="The Save Game Pioneer"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />

                        {/* Museum lighting effect */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/20 mix-blend-overlay" />

                        {/* Floating metadata */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-gradient-to-t from-black via-black/90 to-transparent">
                          <div className="flex items-end justify-between">
                            <div>
                              <p className="text-white/60 text-xs md:text-sm mb-2 font-light tracking-widest">GENESIS COLLECTION</p>
                              <p className="text-white text-xl md:text-2xl font-light tracking-wide">#0001</p>
                            </div>
                            <div className="text-right">
                              <p className="text-white/60 text-xs md:text-sm mb-2 font-light">EDITION</p>
                              <p className="text-white text-lg md:text-xl font-light">1 of 1</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Gallery wall mount detail */}
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    </div>
                  </motion.div>

                  {/* Curator's Description */}
                  <motion.div
                    className="relative"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                  >
                    <div className="space-y-6 md:space-y-8">
                      {/* Title Block */}
                      <div>
                        <p className="text-white/40 text-xs tracking-[0.3em] uppercase mb-3 md:mb-4 font-light">Museum Piece I</p>
                        <h2 className="text-4xl md:text-6xl lg:text-7xl font-light text-white mb-3 md:mb-4 tracking-tight leading-[0.95]">
                          The Save<br/>Game Pioneer
                        </h2>
                        <div className="w-20 h-[1px] bg-white/20 mb-6 md:mb-8" />
                      </div>

                      {/* Story */}
                      <div className="space-y-4 md:space-y-6 text-white/70 leading-relaxed">
                        <p className="text-base md:text-lg lg:text-xl font-light">
                          Before this moment, digital worlds were ephemeral. Games existed only in the present tense—
                          fleeting experiences that vanished the instant you turned off the machine.
                        </p>
                        <p className="text-sm md:text-base lg:text-lg font-light">
                          This piece immortalizes the revolutionary mind who dared to make virtual worlds persistent.
                          When memory was measured in kilobytes and every byte was precious, one innovator changed
                          the fundamental relationship between humans and digital spaces.
                        </p>
                      </div>

                      {/* Exhibition Details */}
                      <div className="pt-6 md:pt-8 border-t border-white/10">
                        <div className="grid grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
                          <div>
                            <p className="text-white/40 text-xs mb-2 tracking-wider">MEDIUM</p>
                            <p className="text-white font-light text-sm md:text-base">Digital NFT</p>
                          </div>
                          <div>
                            <p className="text-white/40 text-xs mb-2 tracking-wider">ERA</p>
                            <p className="text-white font-light text-sm md:text-base">1980s Innovation</p>
                          </div>
                          <div>
                            <p className="text-white/40 text-xs mb-2 tracking-wider">RARITY</p>
                            <p className="text-white font-light text-sm md:text-base">Mythic</p>
                          </div>
                          <div>
                            <p className="text-white/40 text-xs mb-2 tracking-wider">IMPACT</p>
                            <p className="text-white font-light text-sm md:text-base">Revolutionary</p>
                          </div>
                        </div>

                        <Button
                          size="lg"
                          className="w-full bg-white text-black hover:bg-white/90 font-light text-sm md:text-base tracking-wide transition-all duration-300"
                        >
                          View in Gallery
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </section>

            {/* Piece #2 - Cinematic Spread */}
            <section className="relative bg-black py-32 md:py-40 overflow-hidden">
              {/* Background ambient light */}
              <div className="absolute inset-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 rounded-full blur-[150px]" />
              </div>

              <div className="max-w-[1800px] mx-auto px-4 md:px-16 relative">
                <div className="grid lg:grid-cols-[0.8fr,1.2fr] gap-12 md:gap-20 items-center">
                  {/* Text Content First (Left Side) */}
                  <motion.div
                    className="lg:order-1 order-2"
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  >
                    <div className="space-y-8">
                      <div>
                        <p className="text-white/40 text-xs tracking-[0.3em] uppercase mb-4 font-light">Museum Piece II</p>
                        <h2 className="text-5xl md:text-7xl font-light text-white mb-4 tracking-tight leading-[0.95]">
                          Code That<br/>Changed Reality
                        </h2>
                        <div className="w-20 h-[1px] bg-white/20 mb-8" />
                      </div>

                      <div className="space-y-6 text-white/70 leading-relaxed">
                        <p className="text-lg md:text-xl font-light italic border-l-2 border-white/20 pl-6">
                          "When everyone said it was impossible, when memory was measured in kilobytes and every byte was precious..."
                        </p>
                        <p className="text-base md:text-lg font-light">
                          This artifact captures the exact moment innovation triumphed over limitation. The breakthrough
                          that transformed gaming from fleeting arcade sessions into persistent, living worlds that could
                          remember your journey.
                        </p>
                      </div>

                      <div className="pt-8 space-y-4">
                        <div className="flex items-center justify-between py-3 border-b border-white/10">
                          <span className="text-white/40 text-sm tracking-wider">HISTORICAL IMPACT</span>
                          <span className="text-white font-light">Foundational</span>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-white/10">
                          <span className="text-white/40 text-sm tracking-wider">LIVES TOUCHED</span>
                          <span className="text-white font-light">3 Billion+</span>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-white/10">
                          <span className="text-white/40 text-sm tracking-wider">ARTISTIC VALUE</span>
                          <span className="text-white font-light">Priceless</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Large Art Display (Right Side) */}
                  <motion.div
                    className="lg:order-2 order-1 relative group"
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                  >
                    {/* Dramatic shadow */}
                    <div className="absolute -inset-8 bg-gradient-to-tr from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 blur-3xl" />

                    <div className="relative aspect-[16/10] rounded-sm overflow-hidden shadow-2xl">
                      <img
                        src={selectedItem?.thumbnail || '/api/placeholder/1200/750'}
                        alt="Breaking Boundaries"
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                      />

                      {/* Gallery lighting overlay */}
                      <div className="absolute inset-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/30 mix-blend-overlay" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                      </div>

                      {/* Catalog number - minimal */}
                      <div className="absolute top-6 right-6">
                        <div className="text-white/60 text-sm font-light tracking-[0.2em]">#0002</div>
                      </div>

                      {/* Certificate seal */}
                      <div className="absolute bottom-6 right-6">
                        <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center backdrop-blur-sm bg-black/20">
                          <Crown className="w-8 h-8 text-white/40" />
                        </div>
                      </div>
                    </div>

                    {/* Museum plaque */}
                    <div className="mt-6 px-6 py-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white/60 text-xs tracking-wider mb-1">GENESIS COLLECTION</p>
                          <p className="text-white font-light">The Innovation Era • 1982-1986</p>
                        </div>
                        <Button variant="ghost" className="text-white/60 hover:text-white hover:bg-white/10">
                          <Info className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </section>

            {/* Piece #3 - Full Bleed Masterpiece */}
            <section className="relative bg-black py-20 md:py-32">
              <div className="max-w-6xl mx-auto px-4 md:px-16">
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="space-y-12"
                >
                  {/* Header */}
                  <div className="text-center max-w-4xl mx-auto">
                    <p className="text-white/40 text-xs tracking-[0.3em] uppercase mb-4 md:mb-6 font-light">Museum Piece III</p>
                    <h2 className="text-4xl md:text-6xl lg:text-7xl font-light text-white mb-4 md:mb-6 tracking-tight leading-[0.9]">
                      The Eternal<br/>Legacy
                    </h2>
                    <div className="w-24 md:w-32 h-[1px] bg-white/20 mx-auto mb-6 md:mb-8" />
                    <p className="text-lg md:text-xl lg:text-2xl text-white/60 font-light leading-relaxed px-4">
                      A singular innovation that echoes through billions of lives,<br className="hidden md:block" />
                      spanning generations, reshaping reality itself.
                    </p>
                  </div>

                  {/* Large Centered Artwork */}
                  <motion.div
                    className="relative group max-w-4xl mx-auto"
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                  >
                    {/* Atmospheric glow */}
                    <div className="absolute -inset-12 md:-inset-20 bg-gradient-radial from-white/10 via-white/5 to-transparent opacity-50 blur-3xl" />

                    {/* Main art piece */}
                    <div className="relative aspect-square md:aspect-[5/4] rounded-sm overflow-hidden shadow-2xl">
                      <img
                        src={selectedItem?.thumbnail || '/api/placeholder/1400/1120'}
                        alt="Eternal Legacy"
                        className="w-full h-full object-cover transition-transform duration-[1500ms] group-hover:scale-110"
                      />

                      {/* Museum lighting */}
                      <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/40 mix-blend-overlay" />
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.1),transparent_50%)]" />

                      {/* Vignette */}
                      <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]" />
                    </div>

                    {/* Artwork info bar */}
                    <div className="mt-6 md:mt-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 px-6 md:px-8 py-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-sm">
                      <div className="flex items-center gap-6 md:gap-12 overflow-x-auto">
                        <div>
                          <p className="text-white/40 text-xs tracking-wider mb-1">CATALOG</p>
                          <p className="text-white text-base md:text-lg font-light">#0003</p>
                        </div>
                        <div className="w-px h-10 bg-white/10" />
                        <div>
                          <p className="text-white/40 text-xs tracking-wider mb-1">CLASSIFICATION</p>
                          <p className="text-white text-base md:text-lg font-light">Mythic Artifact</p>
                        </div>
                        <div className="w-px h-10 bg-white/10 hidden md:block" />
                        <div className="hidden md:block">
                          <p className="text-white/40 text-xs tracking-wider mb-1">PROVENANCE</p>
                          <p className="text-white text-base md:text-lg font-light">Genesis Collection</p>
                        </div>
                      </div>

                      <Button
                        size="lg"
                        className="bg-white text-black hover:bg-white/90 font-light px-8 w-full md:w-auto"
                      >
                        Acquire Piece
                      </Button>
                    </div>
                  </motion.div>

                  {/* Description Grid */}
                  <motion.div
                    className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto pt-12"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                  >
                    <div className="space-y-4">
                      <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center">
                        <Crown className="w-6 h-6 text-white/40" />
                      </div>
                      <h3 className="text-white text-xl font-light">The Ripple Effect</h3>
                      <p className="text-white/60 font-light leading-relaxed">
                        Every modern game, every RPG, every progression system traces its lineage to this singular breakthrough.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center">
                        <Play className="w-6 h-6 text-white/40" />
                      </div>
                      <h3 className="text-white text-xl font-light">Living History</h3>
                      <p className="text-white/60 font-light leading-relaxed">
                        Billions of players across decades have shaped their digital destinies because of this innovation.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center">
                        <Info className="w-6 h-6 text-white/40" />
                      </div>
                      <h3 className="text-white text-xl font-light">Immortalized</h3>
                      <p className="text-white/60 font-light leading-relaxed">
                        This NFT captures not just achievement, but the eternal impact on human experience.
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
