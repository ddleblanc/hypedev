"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMuseum } from "@/contexts/museum-context";
import { ShoppingCart, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import useEmblaCarousel from "embla-carousel-react";
import { PrevButton, NextButton } from "./EmblaCarouselArrowButtons";
import "./museum-animations.css";
import "./museum-horizontal-carousel.css";

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
  {
    id: 4,
    title: "The Code Revolution",
    subtitle: "Episode IV: Evolution",
    description: "From simple bytes to complex algorithms. Watch how persistent state transformed from a technical curiosity into the foundation of modern interactive entertainment.",
    year: "1988",
    videoUrl: "/assets/img/jugi.mp4",
    nftImage: "/api/placeholder/600/800",
    catalogNumber: "#0004",
    edition: "1 of 1",
    rarity: "Epic",
    price: "0.08 ETH",
  },
  {
    id: 5,
    title: "Industry Transformation",
    subtitle: "Episode V: Adoption",
    description: "The moment major studios realized the power of save games. RPGs, adventures, and epic narratives became possible, reshaping an entire industry overnight.",
    year: "1990",
    videoUrl: "/assets/img/jugi.mp4",
    nftImage: "/api/placeholder/600/800",
    catalogNumber: "#0005",
    edition: "1 of 1",
    rarity: "Legendary",
    price: "0.08 ETH",
  },
  {
    id: 6,
    title: "The Modern Era",
    subtitle: "Episode VI: Expansion",
    description: "Cloud saves, auto-saves, multiple save slots. The technology evolved, but the core innovation remained: your progress, preserved forever.",
    year: "2000",
    videoUrl: "/assets/img/jugi.mp4",
    nftImage: "/api/placeholder/600/800",
    catalogNumber: "#0006",
    edition: "1 of 1",
    rarity: "Rare",
    price: "0.08 ETH",
  },
  {
    id: 7,
    title: "Infinite Possibilities",
    subtitle: "Episode VII: Future",
    description: "Today, three billion players save their progress daily. The innovation continues to evolve, enabling experiences the pioneers could only dream of.",
    year: "2024",
    videoUrl: "/assets/img/jugi.mp4",
    nftImage: "/api/placeholder/600/800",
    catalogNumber: "#0007",
    edition: "1 of 1",
    rarity: "Mythic",
    price: "0.08 ETH",
  },
];

const TWEEN_FACTOR_BASE = 0.52;

const numberWithinRange = (number: number, min: number, max: number): number =>
  Math.min(Math.max(number, min), max);

export function MuseumView({ }: MuseumViewProps) {
  const { selectedItem, playIntro, showTitleAnimation, introComplete } = useMuseum();
  const [currentEpisode, setCurrentEpisode] = useState(0);
  const tweenNodes = useRef<HTMLElement[]>([]);
  const tweenFactor = useRef(0);

  // Horizontal Embla Carousel setup for scale effect with infinite loop
  const [emblaRef, emblaApi] = useEmblaCarousel({
    axis: 'x',
    slidesToScroll: 1,
    align: 'center',
    loop: true,
    skipSnaps: false,
    containScroll: 'trimSnaps',
  });

  // Use the selectedItem thumbnail for all NFT images
  const nftImage = selectedItem?.thumbnail || '/api/placeholder/600/800';

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  // Set tween nodes
  const setTweenNodes = useCallback((emblaApi: any): void => {
    tweenNodes.current = emblaApi.slideNodes().map((slideNode: any) => {
      return slideNode.querySelector('.embla__slide__inner') as HTMLElement;
    });
  }, []);

  // Set tween factor
  const setTweenFactor = useCallback((emblaApi: any): void => {
    tweenFactor.current = TWEEN_FACTOR_BASE * emblaApi.scrollSnapList().length;
  }, []);

  // Scale tween function - simplified for individual slide scaling
  const tweenScale = useCallback((emblaApi: any): void => {
    const engine = emblaApi.internalEngine();
    const scrollProgress = emblaApi.scrollProgress();
    const selectedIndex = emblaApi.selectedScrollSnap();

    // Process each slide individually
    emblaApi.slideNodes().forEach((_: any, slideIndex: number) => {
      const slideProgress = emblaApi.scrollSnapList()[slideIndex];
      let diffToTarget = slideProgress - scrollProgress;

      // Handle loop wrapping
      if (engine.options.loop) {
        engine.slideLooper.loopPoints.forEach((loopItem: any) => {
          const target = loopItem.target();
          if (slideIndex === loopItem.index && target !== 0) {
            const sign = Math.sign(target);
            if (sign === -1) {
              diffToTarget = slideProgress - (1 + scrollProgress);
            }
            if (sign === 1) {
              diffToTarget = slideProgress + (1 - scrollProgress);
            }
          }
        });
      }

      // Calculate scale based on distance from center
      const tweenValue = 1 - Math.abs(diffToTarget * tweenFactor.current);
      const scale = numberWithinRange(tweenValue, 0, 1);
      const tweenNode = tweenNodes.current[slideIndex];

      if (tweenNode) {
        tweenNode.style.transform = `scale(${scale})`;

        // Apply dimming based on selection
        const isSelected = slideIndex === selectedIndex;
        const opacity = isSelected ? '1' : '0.4';
        const brightness = isSelected ? 'brightness(1)' : 'brightness(0.6)';
        tweenNode.style.opacity = opacity;
        tweenNode.style.filter = brightness;
      }
    });
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    setTweenNodes(emblaApi);
    setTweenFactor(emblaApi);
    tweenScale(emblaApi);

    emblaApi
      .on('reInit', setTweenNodes)
      .on('reInit', setTweenFactor)
      .on('reInit', tweenScale)
      .on('scroll', tweenScale)
      .on('slideFocus', tweenScale);

    const onSelect = () => {
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
      const selected = emblaApi.selectedScrollSnap();
      setCurrentEpisode(selected);
    };

    emblaApi.on('select', onSelect);
    onSelect();

    return () => {
      emblaApi.off('reInit', setTweenNodes);
      emblaApi.off('reInit', setTweenFactor);
      emblaApi.off('reInit', tweenScale);
      emblaApi.off('scroll', tweenScale);
      emblaApi.off('slideFocus', tweenScale);
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, setTweenNodes, setTweenFactor, tweenScale]);

  // Listen for museum item clicks from sidebars
  useEffect(() => {
    const handleMuseumItemClick = (event: any) => {
      const item = event.detail;
      playIntro(item);
    };

    window.addEventListener('museum-item-click', handleMuseumItemClick);
    return () => window.removeEventListener('museum-item-click', handleMuseumItemClick);
  }, [playIntro]);

  const currentEp = episodes[currentEpisode];

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
            className="fixed inset-0 z-40 bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {/* Full-Screen Episode */}
            <div className="relative h-screen overflow-hidden">
              {/* Fullscreen Video Background */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`video-${currentEpisode}`}
                  className="absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
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
                  <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/20" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black" />
                </motion.div>
              </AnimatePresence>

              {/* Episode Counter */}
              <div className="absolute bottom-24 right-8 md:right-16 z-20">
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="flex items-baseline gap-3"
                >
                  <p className="text-white/40 text-sm md:text-base tracking-wider font-light">EPISODE</p>
                  <p className="text-4xl md:text-6xl font-light text-white tabular-nums">
                    {String(currentEpisode + 1).padStart(2, '0')}
                  </p>
                </motion.div>
              </div>

              {/* Content Layout */}
              <div className="absolute inset-0 z-10 flex items-center justify-center">
                {/* Main Content - Centered */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`content-${currentEpisode}`}
                    className="space-y-6 max-w-3xl px-8 md:px-16 pt-48"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  >
                    {/* Episode Label */}
                    <div>
                      <p className="text-white/40 text-xs tracking-[0.3em] uppercase mb-3 font-light">
                        {currentEp.subtitle}
                      </p>
                      <h1 className="text-5xl md:text-6xl lg:text-7xl font-light text-white mb-6 tracking-tight leading-[0.95]">
                        {currentEp.title}
                      </h1>
                      <div className="w-24 h-[1px] bg-white/20 mb-6" />
                    </div>

                    {/* Description */}
                    <p className="text-xl md:text-2xl text-white/80 font-light leading-relaxed max-w-2xl">
                      {currentEp.description}
                    </p>

                    {/* Meta Info */}
                    <div className="flex items-center gap-8 pt-4">
                      <div>
                        <p className="text-white/40 text-xs tracking-wider mb-1">YEAR</p>
                        <p className="text-white text-lg font-light">{currentEp.year}</p>
                      </div>
                      <div className="w-px h-10 bg-white/20" />
                      <div>
                        <p className="text-white/40 text-xs tracking-wider mb-1">RARITY</p>
                        <p className="text-white text-lg font-light">{currentEp.rarity}</p>
                      </div>
                      <div className="w-px h-10 bg-white/20" />
                      <div>
                        <p className="text-white/40 text-xs tracking-wider mb-1">PRICE</p>
                        <p className="text-white text-lg font-light">{currentEp.price}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-6">
                      <Button
                        size="lg"
                        className="bg-white text-black hover:bg-white/90 font-light px-8"
                      >
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Collect NFT
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        className="border-white/30 text-white hover:bg-white/10 font-light px-8"
                      >
                        <Play className="w-5 h-5 mr-2" />
                        Watch Story
                      </Button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Horizontal Parallax Carousel Navigation */}
              <div className="absolute top-48 left-0 right-0 z-20 pb-20 md:pb-24 justify-center flex">
                <div className="embla">
                  <div className="embla__viewport" ref={emblaRef}>
                    <div className="embla__container">
                      {episodes.map((episode, index) => (
                        <div key={episode.id} className="embla__slide">
                          <div className="embla__slide__inner">
                            <div
                              onClick={() => {
                                if (emblaApi) {
                                  emblaApi.scrollTo(index);
                                }
                              }}
                              className={`embla__slide__number group cursor-pointer relative overflow-hidden rounded-xl transition-all duration-500 h-full ${
                                index === currentEpisode
                                  ? 'ring-2 ring-white/50'
                                  : 'hover:ring-1 hover:ring-white/20'
                              }`}
                              style={{
                                backgroundImage: `url(${nftImage})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                              }}
                            >
                              {/* Gradient Overlay */}
                              <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent transition-opacity duration-500 ${
                                index === currentEpisode ? 'opacity-60' : 'opacity-80'
                              }`} />

                         

                              {/* Active Indicator */}
                              {index === currentEpisode && (
                                <motion.div
                                  className="absolute top-4 right-4"
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0, opacity: 0 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                                </motion.div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* <div className="embla__controls">
                    <div className="embla__buttons">
                      <PrevButton
                        onClick={scrollPrev}
                        disabled={!canScrollPrev}
                        className="embla__button"
                      />
                      <NextButton
                        onClick={scrollNext}
                        disabled={!canScrollNext}
                        className="embla__button"
                      />
                    </div>
                  </div> */}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
