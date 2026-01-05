"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ExternalLink, X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";
import type { LegendArtifact } from "@prisma/client";

interface ArtifactsPreviewProps {
  artifacts: LegendArtifact[];
  legendId: string;
  primaryColor: string;
}

export function ArtifactsPreview({ artifacts, legendId, primaryColor }: ArtifactsPreviewProps) {
  const [selectedArtifact, setSelectedArtifact] = useState<LegendArtifact | null>(null);

  const { mutate: updateProgress } = trpc.museum.progress.update.useMutation();

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

  const handleArtifactClick = (artifact: LegendArtifact) => {
    setSelectedArtifact(artifact);
    updateProgress({
      legendId,
      action: "find_artifact",
      targetId: artifact.id,
    });
  };

  if (artifacts.length === 0) {
    return null;
  }

  // Show first 3 or 6 depending on count
  const displayedArtifacts = artifacts.slice(0, 6);
  const hasMore = artifacts.length > displayedArtifacts.length;

  return (
    <section className="py-24 px-8 md:px-16 bg-gradient-to-b from-[#050505] to-black">
      <motion.div
        className="max-w-6xl mx-auto"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-light text-white mb-2">Artifacts</h2>
            <p className="text-white/50">
              Discover pieces of history. Unlock through progress.
            </p>
          </div>
          {hasMore && (
            <Button
              variant="outline"
              className="hidden md:flex border-white/20 text-white/60 hover:text-white"
            >
              View All ({artifacts.length})
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>

        <div
          className={`grid gap-6 ${
            displayedArtifacts.length <= 3
              ? "grid-cols-1 md:grid-cols-3"
              : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {displayedArtifacts.map((artifact, index) => (
            <motion.div
              key={artifact.id}
              className="group relative rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-white/20 transition-all cursor-pointer"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -4 }}
              onClick={() => handleArtifactClick(artifact)}
            >
              {/* Image */}
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={artifact.mediaUrl}
                  alt={artifact.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                {/* Lock overlay for locked artifacts */}
                {artifact.unlockType !== "FREE" && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                    <Lock className="w-8 h-8 text-white/40" />
                    <span className="text-xs text-white/40 uppercase tracking-wider">
                      {getUnlockLabel(artifact.unlockType)}
                    </span>
                  </div>
                )}

                {/* View overlay for unlocked */}
                {artifact.unlockType === "FREE" && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Eye className="w-6 h-6 text-white" />
                    </div>
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <Badge className={cn("text-xs", getRarityColor(artifact.rarity))}>
                    {artifact.rarity}
                  </Badge>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-lg font-medium text-white mb-1">{artifact.name}</h3>
                <p className="text-sm text-white/40 mb-3">
                  {artifact.type} - {artifact.year}
                </p>
                <p className="text-sm text-white/50 line-clamp-2">{artifact.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile view all */}
        {hasMore && (
          <div className="mt-8 md:hidden">
            <Button
              variant="outline"
              className="w-full border-white/20 text-white/60 hover:text-white"
            >
              View All Artifacts ({artifacts.length})
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </motion.div>

      {/* Artifact Detail Modal */}
      <AnimatePresence>
        {selectedArtifact && (
          <ArtifactDetailModal
            artifact={selectedArtifact}
            onClose={() => setSelectedArtifact(null)}
            primaryColor={primaryColor}
            rarityColor={getRarityColor(selectedArtifact.rarity)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

// Helper to get unlock label
function getUnlockLabel(unlockType: string): string {
  switch (unlockType) {
    case "CHAPTER":
      return "Own chapter to unlock";
    case "POINTS":
      return "Earn points to unlock";
    case "QUIZ":
      return "Complete quiz to unlock";
    case "PURCHASE":
      return "Available for purchase";
    case "AIRDROP":
      return "Holder airdrop";
    default:
      return "Locked";
  }
}

// Artifact Detail Modal
interface ArtifactDetailModalProps {
  artifact: LegendArtifact;
  onClose: () => void;
  primaryColor: string;
  rarityColor: string;
}

function ArtifactDetailModal({
  artifact,
  onClose,
  primaryColor,
  rarityColor,
}: ArtifactDetailModalProps) {
  const isLocked = artifact.unlockType !== "FREE";

  return (
    <motion.div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-[#0a0a0a] rounded-2xl overflow-hidden max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-white/10 relative"
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

        <div className="md:flex">
          {/* Image */}
          <div className="relative md:w-1/2">
            <div className="aspect-square md:aspect-auto md:h-full">
              <img
                src={artifact.mediaUrl}
                alt={artifact.name}
                className={`w-full h-full object-cover ${isLocked ? "blur-sm" : ""}`}
              />
              {isLocked && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-4">
                  <Lock className="w-12 h-12 text-white/40" />
                  <p className="text-white/60 text-center px-8">
                    {getUnlockLabel(artifact.unlockType)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="md:w-1/2 p-8">
            <div className="flex items-start justify-between mb-4">
              <Badge className={cn("text-sm px-3 py-1", rarityColor)}>{artifact.rarity}</Badge>
              <span className="text-white/40 text-sm">{artifact.year}</span>
            </div>

            <h2 className="text-2xl font-light text-white mb-2">{artifact.name}</h2>
            <p className="text-white/50 text-sm mb-6">{artifact.type}</p>

            <p className="text-white/70 font-light leading-relaxed mb-8">
              {artifact.description}
            </p>

            {artifact.unlockValue && (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-8">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2">
                  Unlock Requirement
                </p>
                <p className="text-white/70">{getUnlockRequirementText(artifact)}</p>
              </div>
            )}

            <Button
              onClick={onClose}
              variant="outline"
              className="w-full"
              style={!isLocked ? { borderColor: primaryColor, color: primaryColor } : undefined}
            >
              {isLocked ? "Close" : "View Full Size"}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Helper to get unlock requirement text
function getUnlockRequirementText(artifact: LegendArtifact): string {
  switch (artifact.unlockType) {
    case "CHAPTER":
      return `Own Chapter ${artifact.unlockValue} to unlock this artifact`;
    case "POINTS":
      return `Earn ${artifact.unlockValue} curator points to unlock`;
    case "QUIZ":
      return "Complete the related quiz to unlock";
    case "PURCHASE":
      return "This artifact is available for direct purchase";
    default:
      return "Complete requirements to unlock";
  }
}
