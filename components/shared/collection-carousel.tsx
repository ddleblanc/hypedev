"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CarouselConfig } from "@/types/homepage";

interface CollectionCarouselProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  config?: CarouselConfig;
  className?: string;
  itemClassName?: string;
  isLoading?: boolean;
  loadingCount?: number;
  renderSkeleton?: () => React.ReactNode;
}

const defaultConfig: CarouselConfig = {
  autoPlay: false,
  autoPlayInterval: 5000,
  showNavigation: true,
  showDots: false,
  itemsPerView: {
    mobile: 2,
    tablet: 3,
    desktop: 6,
  },
  gap: 12,
};

export function CollectionCarousel<T>({
  items,
  renderItem,
  config = {},
  className,
  itemClassName,
  isLoading = false,
  loadingCount = 6,
  renderSkeleton,
}: CollectionCarouselProps<T>) {
  const mergedConfig = { ...defaultConfig, ...config };
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Check scroll position to update navigation arrows
  const checkScrollPosition = useCallback(() => {
    if (!containerRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  // Scroll functions - declared before useEffects that reference them
  const scrollLeft = useCallback(() => {
    if (!containerRef.current) return;
    const scrollAmount = containerRef.current.clientWidth * 0.8;
    containerRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  }, []);

  const scrollRight = useCallback(() => {
    if (!containerRef.current) return;
    const scrollAmount = containerRef.current.clientWidth * 0.8;
    containerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    checkScrollPosition();
    container.addEventListener('scroll', checkScrollPosition);
    window.addEventListener('resize', checkScrollPosition);

    return () => {
      container.removeEventListener('scroll', checkScrollPosition);
      window.removeEventListener('resize', checkScrollPosition);
    };
  }, [checkScrollPosition, items]);

  // Auto-play functionality
  useEffect(() => {
    if (!mergedConfig.autoPlay || items.length === 0) return;

    const interval = setInterval(() => {
      scrollRight();
    }, mergedConfig.autoPlayInterval);

    return () => clearInterval(interval);
  }, [mergedConfig.autoPlay, mergedConfig.autoPlayInterval, items.length, scrollRight]);

  // Default skeleton renderer
  const defaultSkeleton = () => (
    <div className="flex-shrink-0 w-40 md:w-48">
      <div className="aspect-square rounded-xl bg-white/5 animate-pulse mb-2" />
      <div className="h-4 bg-white/5 rounded animate-pulse mb-1" />
      <div className="h-3 bg-white/5 rounded animate-pulse w-2/3" />
    </div>
  );

  const SkeletonComponent = renderSkeleton || defaultSkeleton;

  return (
    <div className={cn("relative group", className)}>
      {/* Navigation Arrows */}
      {mergedConfig.showNavigation && (
        <>
          <AnimatePresence>
            {canScrollLeft && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden md:block"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={scrollLeft}
                  className={cn(
                    "h-12 w-12 rounded-full",
                    "bg-black/80 backdrop-blur-xl border border-white/10",
                    "text-white hover:bg-black hover:border-[rgb(163,255,18)]/50",
                    "shadow-xl transition-all duration-300",
                    "opacity-0 group-hover:opacity-100"
                  )}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {canScrollRight && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden md:block"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={scrollRight}
                  className={cn(
                    "h-12 w-12 rounded-full",
                    "bg-black/80 backdrop-blur-xl border border-white/10",
                    "text-white hover:bg-black hover:border-[rgb(163,255,18)]/50",
                    "shadow-xl transition-all duration-300",
                    "opacity-0 group-hover:opacity-100"
                  )}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Gradient Fade Edges */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black to-transparent z-[1] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black to-transparent z-[1] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Scrollable Container */}
      <div
        ref={containerRef}
        className={cn(
          "flex overflow-x-auto scrollbar-hide scroll-smooth",
          "px-1 -mx-1" // Allow items to breathe
        )}
        style={{ gap: `${mergedConfig.gap}px` }}
      >
        {isLoading ? (
          // Loading skeletons
          [...Array(loadingCount)].map((_, index) => (
            <div key={`skeleton-${index}`} className={itemClassName}>
              <SkeletonComponent />
            </div>
          ))
        ) : (
          // Actual items
          items.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
              className={cn("flex-shrink-0", itemClassName)}
            >
              {renderItem(item, index)}
            </motion.div>
          ))
        )}
      </div>

      {/* Optional Dots Navigation */}
      {mergedConfig.showDots && items.length > 0 && (
        <div className="flex justify-center gap-2 mt-4">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                if (!containerRef.current) return;
                const itemWidth = containerRef.current.scrollWidth / items.length;
                containerRef.current.scrollTo({
                  left: itemWidth * index,
                  behavior: 'smooth',
                });
                setCurrentIndex(index);
              }}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index === currentIndex
                  ? "w-8 bg-[rgb(163,255,18)]"
                  : "w-2 bg-white/30 hover:bg-white/50"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Pre-configured carousel variants
export function FeaturedCarousel<T>(props: Omit<CollectionCarouselProps<T>, 'config'>) {
  return (
    <CollectionCarousel
      {...props}
      config={{
        showNavigation: true,
        showDots: false,
        itemsPerView: { mobile: 1, tablet: 2, desktop: 4 },
        gap: 16,
      }}
    />
  );
}

export function TrendingCarousel<T>(props: Omit<CollectionCarouselProps<T>, 'config'>) {
  return (
    <CollectionCarousel
      {...props}
      config={{
        showNavigation: true,
        showDots: false,
        itemsPerView: { mobile: 2, tablet: 4, desktop: 6 },
        gap: 12,
      }}
    />
  );
}

export function CompactCarousel<T>(props: Omit<CollectionCarouselProps<T>, 'config'>) {
  return (
    <CollectionCarousel
      {...props}
      config={{
        showNavigation: true,
        showDots: false,
        itemsPerView: { mobile: 3, tablet: 5, desktop: 8 },
        gap: 8,
      }}
    />
  );
}
