"use client";

import React, { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Play, X, ShoppingCart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";
import { ChapterPurchaseModal } from "@/components/museum/purchase/ChapterPurchaseModal";
import type { LegendChapter } from "@prisma/client";

interface ChapterSectionProps {
  chapters: LegendChapter[];
  legendId: string;
  primaryColor: string;
}

export function ChapterSection({ chapters, legendId, primaryColor }: ChapterSectionProps) {
  const [selectedChapter, setSelectedChapter] = useState<LegendChapter | null>(null);
  const [purchaseChapter, setPurchaseChapter] = useState<LegendChapter | null>(null);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    slidesToScroll: 1,
  });

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const { mutate: updateProgress } = trpc.museum.progress.update.useMutation();

  // Fetch owned chapters
  const { data: ownedChapterIds = [] } = trpc.museum.purchase.getOwnedChapters.useQuery(
    { legendId },
    { enabled: !!legendId }
  );

  const handleChapterClick = (chapter: LegendChapter) => {
    setSelectedChapter(chapter);
    updateProgress({
      legendId,
      action: "view_chapter",
      targetId: chapter.id,
    });
  };

  const handlePurchaseClick = (chapter: LegendChapter) => {
    setSelectedChapter(null);
    setPurchaseChapter(chapter);
  };

  const handlePurchaseSuccess = () => {
    setPurchaseChapter(null);
  };

  const isChapterOwned = (chapterId: string) => {
    return ownedChapterIds.includes(chapterId);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case "mythic":
        return "bg-purple-500/20 text-purple-300 border-purple-500/30";
      case "legendary":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "epic":
        return "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30";
      case "rare":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      default:
        return "bg-white/10 text-white/60 border-white/20";
    }
  };

  if (chapters.length === 0) {
    return null;
  }

  return (
    <section className="py-20 px-8 md:px-16 bg-black">
      {/* Section header */}
      <motion.div
        className="mb-12"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <h2 className="text-3xl md:text-4xl font-light text-white mb-4">Story Chapters</h2>
        <p className="text-white/50 font-light max-w-2xl">
          Each chapter is a collectible NFT that tells part of this legend&apos;s journey. Own
          a piece of history.
        </p>
      </motion.div>

      {/* Carousel */}
      <div className="relative">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-6">
            {chapters.map((chapter, index) => (
              <motion.div
                key={chapter.id}
                className="flex-shrink-0 w-[280px] md:w-[320px]"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
              >
                <ChapterCard
                  chapter={chapter}
                  primaryColor={primaryColor}
                  rarityColor={getRarityColor(chapter.rarity)}
                  isOwned={isChapterOwned(chapter.id)}
                  onClick={() => handleChapterClick(chapter)}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Navigation buttons */}
        {chapters.length > 3 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-black/60 hover:bg-black/80 text-white rounded-full hidden md:flex"
              onClick={scrollPrev}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-black/60 hover:bg-black/80 text-white rounded-full hidden md:flex"
              onClick={scrollNext}
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </>
        )}
      </div>

      {/* Chapter Detail Modal */}
      <AnimatePresence>
        {selectedChapter && (
          <ChapterDetailModal
            chapter={selectedChapter}
            onClose={() => setSelectedChapter(null)}
            primaryColor={primaryColor}
            rarityColor={getRarityColor(selectedChapter.rarity)}
            isOwned={isChapterOwned(selectedChapter.id)}
            onPurchase={() => handlePurchaseClick(selectedChapter)}
          />
        )}
      </AnimatePresence>

      {/* Chapter Purchase Modal */}
      <AnimatePresence>
        {purchaseChapter && (
          <ChapterPurchaseModal
            chapter={purchaseChapter}
            legendId={legendId}
            primaryColor={primaryColor}
            onClose={() => setPurchaseChapter(null)}
            onSuccess={handlePurchaseSuccess}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

// Chapter Card Component
interface ChapterCardProps {
  chapter: LegendChapter;
  primaryColor: string;
  rarityColor: string;
  isOwned: boolean;
  onClick: () => void;
}

function ChapterCard({ chapter, primaryColor, rarityColor, isOwned, onClick }: ChapterCardProps) {
  return (
    <motion.div
      className={cn(
        "group relative rounded-xl overflow-hidden bg-white/5 border transition-all cursor-pointer",
        isOwned
          ? "border-green-500/30 ring-1 ring-green-500/20"
          : "border-white/10 hover:border-white/20"
      )}
      whileHover={{ y: -8, scale: 1.02 }}
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={chapter.thumbnailUrl}
          alt={chapter.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-8 h-8 text-white ml-1" />
          </div>
        </div>

        {/* Chapter number */}
        <div className="absolute top-4 left-4">
          <span className="text-white/40 text-xs uppercase tracking-wider">
            Chapter {chapter.number}
          </span>
        </div>

        {/* Owned badge or Rarity badge */}
        <div className="absolute top-4 right-4">
          {isOwned ? (
            <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs font-medium">
              <Check className="w-3 h-3 mr-1" />
              Owned
            </Badge>
          ) : (
            <Badge className={cn("text-xs font-medium", rarityColor)}>{chapter.rarity}</Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-medium text-white mb-1 group-hover:text-white/90">
          {chapter.title}
        </h3>
        {chapter.subtitle && (
          <p className="text-sm text-white/50 mb-3">{chapter.subtitle}</p>
        )}
        <p className="text-sm text-white/40 line-clamp-2 mb-4">{chapter.description}</p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          {chapter.year && (
            <div>
              <p className="text-xs text-white/40">Year</p>
              <p className="text-white font-light">{chapter.year}</p>
            </div>
          )}
          {isOwned ? (
            <div
              className="text-right px-3 py-1 rounded-full text-xs"
              style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
            >
              In Collection
            </div>
          ) : chapter.edition ? (
            <div className="text-right">
              <p className="text-xs text-white/40">Edition</p>
              <p className="text-white font-light">{chapter.edition}</p>
            </div>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}

// Chapter Detail Modal
interface ChapterDetailModalProps {
  chapter: LegendChapter;
  onClose: () => void;
  primaryColor: string;
  rarityColor: string;
  isOwned: boolean;
  onPurchase: () => void;
}

function ChapterDetailModal({
  chapter,
  onClose,
  primaryColor,
  rarityColor,
  isOwned,
  onPurchase,
}: ChapterDetailModalProps) {
  return (
    <motion.div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-[#0a0a0a] rounded-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/10"
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 hover:bg-black/80 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Video */}
        <div className="relative aspect-video">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            poster={chapter.thumbnailUrl}
          >
            <source src={chapter.videoUrl} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-white/40 text-xs uppercase tracking-wider mb-2">
                Chapter {chapter.number} {chapter.year ? `- ${chapter.year}` : ""}
              </p>
              <h2 className="text-3xl font-light text-white mb-2">{chapter.title}</h2>
              {chapter.subtitle && (
                <p className="text-white/60">{chapter.subtitle}</p>
              )}
            </div>
            {isOwned ? (
              <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-sm px-3 py-1">
                <Check className="w-4 h-4 mr-1" />
                Owned
              </Badge>
            ) : (
              <Badge className={cn("text-sm px-3 py-1", rarityColor)}>{chapter.rarity}</Badge>
            )}
          </div>

          <p className="text-white/70 font-light leading-relaxed mb-8">
            {chapter.description}
          </p>

          <div className="flex items-center gap-8 mb-8 pb-8 border-b border-white/10">
            {chapter.edition && (
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
                  Edition
                </p>
                <p className="text-white font-light">{chapter.edition}</p>
              </div>
            )}
            {!isOwned && chapter.price !== null && (
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
                  Price
                </p>
                <p className="text-white font-light">
                  {chapter.price ? `${chapter.price} ETH` : "Free"}
                </p>
              </div>
            )}
            {!isOwned && (
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
                  Rarity
                </p>
                <p className="text-white font-light">{chapter.rarity}</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {isOwned ? (
              <>
                <div
                  className="flex-1 flex items-center justify-center py-3 rounded-lg"
                  style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                >
                  <Check className="w-5 h-5 mr-2" />
                  In Your Collection
                </div>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </>
            ) : (
              <>
                <Button
                  className="flex-1"
                  style={{ backgroundColor: primaryColor, color: "#000" }}
                  onClick={onPurchase}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Collect This Chapter
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
