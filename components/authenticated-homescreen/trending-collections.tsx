"use client";

import React from "react";
import { motion } from "framer-motion";
import { MediaRenderer } from "@/components/MediaRenderer";

const trendingCollections = [
  {
    name: "HYPERTRONS",
    subtitle: "TRENDING #1",
    floor: "2.3 ETH",
    change: "+24%",
    image: "/assets/img/tron.mp4",
    type: "video"
  },
  {
    name: "JUGI TANDON",
    subtitle: "HOT",
    floor: "1.8 ETH",
    change: "+18%",
    image: "/assets/img/jugi.mp4",
    type: "video"
  },
  {
    name: "SPACE PIRATES",
    subtitle: "RISING",
    floor: "3.1 ETH",
    change: "+31%",
    image: "https://picsum.photos/400/240?random=12",
    type: "image"
  }
];

interface TrendingCollectionsProps {
  onCollectionClick: (index: number) => void;
}

export function TrendingCollections({ onCollectionClick }: TrendingCollectionsProps) {
  return (
    <motion.div
      className="fixed bottom-8 lg:bottom-12 left-1/2 -translate-x-1/2 flex gap-2 lg:gap-4 z-30"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      {trendingCollections.map((collection, index) => (
        <motion.div
          key={collection.name}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.8 + index * 0.1 }}
          whileHover={{ scale: 1.1, y: -10 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onCollectionClick(index)}
          className="relative group cursor-pointer"
        >
          <div className="w-20 h-20 lg:w-32 lg:h-32 xl:w-40 xl:h-40 rounded-2xl lg:rounded-3xl overflow-hidden bg-black/60 backdrop-blur-sm border border-white/20 hover:border-[rgb(163,255,18)]/50 transition-all duration-300 hover:shadow-2xl hover:shadow-[rgb(163,255,18)]/25">
            {collection.type === "video" ? (
              <video
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              >
                <source src={collection.image} type="video/mp4" />
              </video>
            ) : (
              <MediaRenderer
                src={collection.image}
                alt={collection.name}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

            {/* Content overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-2 lg:p-3">
              <div className="text-[10px] lg:text-xs text-[rgb(163,255,18)] font-bold mb-1">
                {collection.subtitle}
              </div>
              <div className="text-white text-xs lg:text-sm font-bold mb-1 truncate">
                {collection.name}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/80 text-[8px] lg:text-xs font-medium">
                  {collection.floor}
                </span>
                <span className="text-[rgb(163,255,18)] text-[8px] lg:text-xs font-bold">
                  {collection.change}
                </span>
              </div>
            </div>

            {/* Hover glow effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-t from-[rgb(163,255,18)]/20 via-transparent to-transparent rounded-2xl lg:rounded-3xl" />
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}