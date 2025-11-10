'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { ChevronRight, Image as ImageIcon } from 'lucide-react';

interface MobileCollectionCardProps {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  nftCount: number;
  floorPrice?: string;
  totalVolume?: string;
  onClick: () => void;
  delay?: number;
}

export function MobileCollectionCard({
  id,
  name,
  description,
  imageUrl,
  nftCount,
  floorPrice,
  totalVolume,
  onClick,
  delay = 0
}: MobileCollectionCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 300, damping: 25 }}
      whileTap={{ scale: 0.98 }}
      transition-tap={{ type: 'spring', stiffness: 400, damping: 17 }}
      onClick={onClick}
      className="w-full text-left group"
    >
      {/* iOS-style card with minimum 120px height for easy touch */}
      <div className="relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 hover:border-white/20 transition-all duration-300 min-h-[120px]">
        <div className="flex gap-4 p-4">
          {/* Collection Image */}
          <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-700"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-white/40" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            {/* Name */}
            <h3 className="text-lg font-bold text-white mb-1 truncate">
              {name}
            </h3>

            {/* Description or Stats */}
            {description ? (
              <p className="text-sm text-white/60 line-clamp-2 mb-2">
                {description}
              </p>
            ) : null}

            {/* Stats row */}
            <div className="flex items-center gap-4 text-xs text-white/60">
              <span>{nftCount} NFTs</span>
              {floorPrice && (
                <>
                  <span>•</span>
                  <span>Floor: {floorPrice}</span>
                </>
              )}
            </div>
          </div>

          {/* Chevron indicator */}
          <div className="flex items-center">
            <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-[rgb(163,255,18)] group-hover:translate-x-1 transition-all duration-300" />
          </div>
        </div>
      </div>
    </motion.button>
  );
}
