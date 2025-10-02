"use client";

import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CollectionItem } from "./types";
import { MediaRenderer } from "@/components/MediaRenderer";

interface ItemCardProps {
  item: CollectionItem;
  onClick: () => void;
}

export function ItemCard({ item, onClick }: ItemCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group cursor-pointer"
    >
      <Card className="bg-black/40 border-white/10 hover:border-[rgb(163,255,18)]/50 transition-all duration-300 overflow-hidden">
        <div className="relative aspect-square">
          <MediaRenderer
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Badges */}
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
            <Badge className={`text-[10px] px-2 py-0.5 font-bold ${
              item.rarity === 'Mythic' ? 'bg-purple-500' :
              item.rarity === 'Legendary' ? 'bg-orange-500' :
              item.rarity === 'Epic' ? 'bg-purple-400' :
              item.rarity === 'Rare' ? 'bg-blue-500' :
              'bg-gray-500'
            }`}>
              {item.rarity}
            </Badge>
            <Badge className="bg-black/60 text-white text-[10px]">
              #{item.rank}
            </Badge>
          </div>

          {/* Hover Actions */}
          <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 bg-black/80 text-white hover:bg-black/90 border border-white/20 h-8 text-xs">
                Buy Now
              </Button>
              <Button size="icon" variant="ghost" className="bg-black/60 text-white h-8 w-8">
                <Heart className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>

        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-bold text-white truncate">{item.name}</p>
            {item.hasOffer && (
              <Badge className="bg-blue-500/20 text-blue-400 text-[10px] px-1">
                Offer
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/60">Price</p>
              <p className="text-sm font-bold text-[rgb(163,255,18)]">{item.price} ETH</p>
            </div>
            {item.lastSale && (
              <div className="text-right">
                <p className="text-xs text-white/60">Last Sale</p>
                <p className="text-xs text-white/80">{item.lastSale} ETH</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
