"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediaRenderer } from "@/components/MediaRenderer";
import { StudioToolsPanel } from "./studio-tools-panel";

interface HeroSectionProps {
  collection: any;
  onEdit: () => void;
  onMint: () => void;
  onSettings: () => void;
  onPreview: () => void;
}

export function HeroSection({ collection, onEdit, onMint, onSettings, onPreview }: HeroSectionProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.06]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <motion.div
      ref={heroRef}
      className="relative h-[50vh] overflow-hidden"
      style={{ scale: heroScale }}
    >
      <div className="absolute inset-0">
        <MediaRenderer
          src={collection.bannerImage || collection.videoUrl}
          alt={collection.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent" />
      </div>

      <StudioToolsPanel onEdit={onEdit} onMint={onMint} onSettings={onSettings} />

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
            <Button className="bg-white text-black font-bold" onClick={onPreview}>
              <Play className="w-4 h-4 mr-2" /> Preview
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
