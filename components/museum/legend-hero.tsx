"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Volume2, VolumeX, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { LegendDetail } from "@/lib/museum/types";

interface LegendHeroProps {
  legend: LegendDetail;
}

export function LegendHero({ legend }: LegendHeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoReady, setIsVideoReady] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay blocked, that's okay
      });
    }
  }, []);

  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: "smooth",
    });
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <section className="relative h-screen overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0">
        {legend.heroVideoUrl ? (
          <video
            ref={videoRef}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            className={`w-full h-full object-cover transition-opacity duration-700 ${
              isVideoReady ? "opacity-100" : "opacity-0"
            }`}
            onCanPlay={() => setIsVideoReady(true)}
          >
            <source src={legend.heroVideoUrl} type="video/mp4" />
          </video>
        ) : (
          <div
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${legend.bannerUrl})` }}
          />
        )}

        {/* Fallback poster */}
        {!isVideoReady && legend.heroVideoUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${legend.bannerUrl})` }}
          />
        )}

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-4xl px-8 md:px-16">
          {/* Category badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Badge variant="outline" className="border-white/20 text-white/60 mb-6">
              {legend.category}
            </Badge>
          </motion.div>

          {/* Name */}
          <motion.h1
            className="text-5xl md:text-7xl lg:text-8xl font-light text-white mb-4 tracking-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            {legend.name}
          </motion.h1>

          {/* Title */}
          <motion.p
            className="text-xl md:text-2xl lg:text-3xl text-white/80 font-light mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {legend.title}
          </motion.p>

          {/* Hero line */}
          <motion.p
            className="text-lg md:text-xl text-white/60 font-light leading-relaxed max-w-2xl mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {legend.heroLine}
          </motion.p>

          {/* Era and Info */}
          <motion.div
            className="flex flex-wrap items-center gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <div>
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Era</p>
              <p className="text-white font-light">{legend.era}</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div>
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Impact</p>
              <p className="text-white font-light">{legend.impact}</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div>
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Chapters</p>
              <p className="text-white font-light">{legend.chapters.length}</p>
            </div>
            {legend.artifacts.length > 0 && (
              <>
                <div className="w-px h-10 bg-white/20" />
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-1">
                    Artifacts
                  </p>
                  <p className="text-white font-light">{legend.artifacts.length}</p>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>

      {/* Audio toggle */}
      {legend.heroVideoUrl && (
        <motion.button
          className="absolute bottom-24 right-8 p-3 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
          onClick={toggleMute}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          aria-label={isMuted ? "Unmute video" : "Mute video"}
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5 text-white" />
          ) : (
            <Volume2 className="w-5 h-5 text-white" />
          )}
        </motion.button>
      )}

      {/* Scroll indicator */}
      <motion.button
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40 hover:text-white/60 transition-colors"
        onClick={scrollToContent}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 8, 0] }}
        transition={{
          opacity: { delay: 1.5 },
          y: { repeat: Infinity, duration: 1.5 },
        }}
        aria-label="Scroll to content"
      >
        <span className="text-xs uppercase tracking-wider">Explore</span>
        <ChevronDown className="w-5 h-5" />
      </motion.button>
    </section>
  );
}
