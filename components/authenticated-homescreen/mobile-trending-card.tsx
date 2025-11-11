'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { MediaRenderer } from '@/components/MediaRenderer';
import { useRef, useEffect } from 'react';

interface TrendingCollection {
  name: string;
  floor: string;
  change: string;
  image: string;
  type: 'video' | 'image';
}

interface MobileTrendingCardProps {
  collections: TrendingCollection[];
  currentIndex: number;
}

export function MobileTrendingCard({ collections, currentIndex }: MobileTrendingCardProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to current index
  useEffect(() => {
    if (scrollRef.current) {
      const cardWidth = 160 + 12; // card width + gap
      scrollRef.current.scrollTo({
        left: currentIndex * cardWidth,
        behavior: 'smooth'
      });
    }
  }, [currentIndex]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, type: 'spring', stiffness: 300, damping: 25 }}
      className="px-4"
    >
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-[rgb(163,255,18)]" />
        <h3 className="text-white font-bold text-sm">Trending Collections</h3>
      </div>

      {/* Horizontal Scrollable Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {collections.map((collection, index) => {
          const changeValue = parseFloat(collection.change.replace('%', ''));
          const isPositive = changeValue >= 0;

          return (
            <motion.div
              key={collection.name}
              className="flex-shrink-0 w-[160px] h-[100px] relative rounded-xl overflow-hidden snap-start"
              whileTap={{ scale: 0.98 }}
            >
              {/* Background Image */}
              <MediaRenderer
                src={collection.image}
                alt={collection.name}
                className="w-full h-full object-cover"
              />

              {/* Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-black" />

              {/* Content Overlay - Bottom */}
              <div className="absolute inset-0 flex flex-col justify-end p-3">
                <h4 className="text-white text-xs font-bold truncate mb-1">
                  {collection.name}
                </h4>
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-[10px]">
                    Floor: {collection.floor}
                  </span>
                  <div className={`flex items-center gap-0.5 text-[10px] font-bold ${
                    isPositive ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {isPositive ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {collection.change}
                  </div>
                </div>
              </div>

              {/* Active Indicator */}
              {index === currentIndex && (
                <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[rgb(163,255,18)] animate-pulse" />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Scroll Indicators */}
      <div className="flex items-center justify-center gap-1 mt-2">
        {collections.map((_, index) => (
          <div
            key={index}
            className={`h-1 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'w-4 bg-[rgb(163,255,18)]'
                : 'w-1 bg-white/20'
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
}
