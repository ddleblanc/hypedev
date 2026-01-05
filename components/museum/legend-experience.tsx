"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Play, ChevronLeft, ChevronRight, Heart, ShoppingCart, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMuseum } from "@/contexts/museum-context";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LegendArtifact } from "@prisma/client";

interface LegendExperienceProps {
  legendSlug: string;
}

export function LegendExperience({ legendSlug }: LegendExperienceProps) {
  const router = useRouter();
  const { isTheaterMode, theaterPhase, exitTheaterMode, activeLegend } = useMuseum();
  const [selectedArtifact, setSelectedArtifact] = useState<LegendArtifact | null>(null);

  // Fetch legend data
  const { data: legend, isLoading } = trpc.museum.legends.getBySlug.useQuery(
    { slug: legendSlug },
    { enabled: !!legendSlug }
  );

  // Handle exit
  const handleExit = () => {
    exitTheaterMode();
    router.push("/museum");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // Only show when in immersive mode
  if (!isTheaterMode || theaterPhase !== "immersive") {
    return null;
  }

  // Use fetched legend or fall back to active legend from context
  // Cast to any to handle type mismatch between LegendDetail and MuseumItem
  const displayLegend = (legend || activeLegend) as any;

  if (!displayLegend) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <div className="text-center">
          <p className="text-white/60 mb-4">Legend not found</p>
          <Button variant="outline" onClick={handleExit}>
            Return to Museum
          </Button>
        </div>
      </div>
    );
  }

  const artifacts = legend?.artifacts || [];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 overflow-y-auto bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Back button - Minimal, top left */}
        <motion.button
          className="fixed top-8 left-8 z-[60] flex items-center gap-3 text-white/40 hover:text-white transition-colors group"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          onClick={handleExit}
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-light tracking-wide">Back</span>
        </motion.button>

        {/* Hero Section - Cinematic full viewport */}
        <section className="relative h-screen flex items-end">
          {/* Background Image with gradient */}
          <div className="absolute inset-0">
            <img
              src={displayLegend.heroImage || displayLegend.thumbnail}
              alt={displayLegend.title}
              className="w-full h-full object-cover"
            />
            {/* Cinematic vignette gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />
          </div>

          {/* Hero Content - Bottom left, Apple TV style */}
          <motion.div
            className="relative z-10 max-w-4xl px-16 pb-32"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            {/* Category label */}
            <motion.p
              className="text-white/50 text-xs uppercase tracking-[0.3em] mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {displayLegend.category || "Legend"}
            </motion.p>

            {/* Title - Large, cinematic */}
            <h1 className="text-6xl md:text-8xl font-extralight text-white mb-6 tracking-tight">
              {displayLegend.title}
            </h1>

            {/* Subtitle/Era */}
            <p className="text-xl md:text-2xl text-white/60 font-light mb-8 max-w-2xl">
              {displayLegend.subtitle || displayLegend.era}
            </p>

            {/* Action buttons */}
            <div className="flex items-center gap-4">
              {displayLegend.trailerUrl && (
                <Button
                  size="lg"
                  className="bg-white text-black hover:bg-white/90 gap-2 px-8"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Watch Story
                </Button>
              )}
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 px-8"
              >
                <Heart className="w-5 h-5 mr-2" />
                Add to Favorites
              </Button>
            </div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            <motion.div
              className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2"
              animate={{ y: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <div className="w-1 h-2 bg-white/50 rounded-full" />
            </motion.div>
          </motion.div>
        </section>

        {/* Artifacts Section - Netflix/Apple TV style */}
        {artifacts.length > 0 && (
          <section className="relative py-24 bg-black">
            <div className="px-16">
              {/* Section header */}
              <motion.div
                className="mb-12"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl md:text-4xl font-extralight text-white mb-2">
                  The Collection
                </h2>
                <p className="text-white/40 font-light">
                  {artifacts.length} artifacts from this legend
                </p>
              </motion.div>

              {/* Artifacts Grid - Spaced out, cinematic */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                {artifacts.map((artifact, index) => (
                  <ArtifactCard
                    key={artifact.id}
                    artifact={artifact}
                    index={index}
                    onClick={() => setSelectedArtifact(artifact)}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Story Section - If available */}
        {displayLegend.legacy && (
          <section className="py-32 bg-black">
            <motion.div
              className="max-w-3xl mx-auto px-16 text-center"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <p className="text-white/30 text-xs uppercase tracking-[0.3em] mb-8">
                The Legacy
              </p>
              <p className="text-2xl md:text-3xl text-white/80 font-extralight leading-relaxed">
                {displayLegend.legacy}
              </p>
            </motion.div>
          </section>
        )}

        {/* Artifact Detail Modal */}
        <AnimatePresence>
          {selectedArtifact && (
            <ArtifactModal
              artifact={selectedArtifact}
              onClose={() => setSelectedArtifact(null)}
              primaryColor={displayLegend.primaryColor || "#ffffff"}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}

// Artifact Card - Cinematic style with title and story
interface ArtifactCardProps {
  artifact: LegendArtifact;
  index: number;
  onClick: () => void;
}

function ArtifactCard({ artifact, index, onClick }: ArtifactCardProps) {
  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case "mythic":
        return "text-purple-400";
      case "legendary":
        return "text-amber-400";
      case "epic":
        return "text-fuchsia-400";
      case "rare":
        return "text-blue-400";
      default:
        return "text-white/60";
    }
  };

  return (
    <motion.div
      className="group cursor-pointer"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.6 }}
      onClick={onClick}
    >
      {/* Image container */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg mb-6">
        <img
          src={artifact.mediaUrl}
          alt={artifact.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Hover actions */}
        <div className="absolute bottom-6 left-6 right-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-4 group-hover:translate-y-0">
          <Button
            size="sm"
            className="flex-1 bg-white text-black hover:bg-white/90"
          >
            View Details
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white"
          >
            <Heart className="w-4 h-4" />
          </Button>
        </div>

        {/* Rarity badge */}
        <div className="absolute top-4 left-4">
          <Badge className="bg-black/60 backdrop-blur-sm border-0 text-xs">
            <span className={getRarityColor(artifact.rarity)}>{artifact.rarity}</span>
          </Badge>
        </div>
      </div>

      {/* Content - Title and Story */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-xl font-light text-white group-hover:text-white/90 transition-colors">
            {artifact.name}
          </h3>
          <span className="text-sm text-white/30 shrink-0">{artifact.year}</span>
        </div>

        {/* Story/Description */}
        <p className="text-white/50 font-light leading-relaxed line-clamp-3">
          {artifact.description}
        </p>

        {/* Type tag */}
        <p className="text-xs text-white/30 uppercase tracking-wider">
          {artifact.type}
        </p>
      </div>
    </motion.div>
  );
}

// Artifact Modal - Full detail view with purchase options
interface ArtifactModalProps {
  artifact: LegendArtifact;
  onClose: () => void;
  primaryColor: string;
}

function ArtifactModal({ artifact, onClose, primaryColor }: ArtifactModalProps) {
  const getRarityStyles = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case "mythic":
        return { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" };
      case "legendary":
        return { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" };
      case "epic":
        return { bg: "bg-fuchsia-500/10", text: "text-fuchsia-400", border: "border-fuchsia-500/30" };
      case "rare":
        return { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" };
      default:
        return { bg: "bg-white/5", text: "text-white/60", border: "border-white/20" };
    }
  };

  const rarityStyles = getRarityStyles(artifact.rarity);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative max-w-6xl w-full max-h-[90vh] overflow-hidden flex bg-[#0a0a0a] rounded-2xl"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Left side - Image */}
        <div className="w-1/2 relative">
          <img
            src={artifact.mediaUrl}
            alt={artifact.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0a0a0a]" />
        </div>

        {/* Right side - Content */}
        <div className="w-1/2 p-12 flex flex-col justify-center">
          {/* Rarity badge */}
          <Badge className={cn("w-fit mb-6 text-sm px-4 py-1", rarityStyles.bg, rarityStyles.text, rarityStyles.border)}>
            {artifact.rarity}
          </Badge>

          {/* Title */}
          <h2 className="text-4xl font-extralight text-white mb-2">
            {artifact.name}
          </h2>

          {/* Meta */}
          <p className="text-white/40 mb-8">
            {artifact.type} · {artifact.year}
          </p>

          {/* Story/Description */}
          <div className="mb-10">
            <p className="text-white/30 text-xs uppercase tracking-[0.2em] mb-4">The Story</p>
            <p className="text-white/70 font-light leading-relaxed text-lg">
              {artifact.description}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-4">
            <Button
              size="lg"
              className="flex-1 bg-white text-black hover:bg-white/90"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Purchase Artifact
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Heart className="w-5 h-5" />
            </Button>
          </div>

          {/* Additional info */}
          <div className="mt-10 pt-8 border-t border-white/10">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-white/30 text-xs uppercase tracking-wider mb-1">Collection</p>
                <p className="text-white/70">Legends Hall</p>
              </div>
              <div>
                <p className="text-white/30 text-xs uppercase tracking-wider mb-1">Status</p>
                <p className="text-white/70">{artifact.unlockType === "FREE" ? "Available" : "Locked"}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
