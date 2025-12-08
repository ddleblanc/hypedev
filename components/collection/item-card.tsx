"use client";

import { Heart, ShoppingCart, Check, Tag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CollectionItem } from "./types";
import { MediaRenderer } from "@/components/MediaRenderer";
import { useShoppingCart } from "@/contexts/shopping-cart-context";
import { cn } from "@/lib/utils";

interface ItemCardProps {
  item: CollectionItem;
  onClick: () => void;
  collection?: {
    id: string;
    name: string;
    contractAddress: string;
  };
  onBuyNow?: (item: CollectionItem) => void;
}

// Get border color based on item status
function getStatusBorderColor(item: CollectionItem): string {
  if (item.listed) return "border-l-green-500";
  if (item.hasOffer) return "border-l-blue-500";
  return "border-l-transparent";
}

export function ItemCard({ item, onClick, collection, onBuyNow }: ItemCardProps) {
  const { addItem, isInCart } = useShoppingCart();
  const statusBorder = getStatusBorderColor(item);
  const inCart = isInCart(String(item.id));

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!collection || !item.listed) return;

    addItem({
      id: String(item.id),
      listingId: String(item.id), // TODO: Get actual listing ID from item
      tokenId: String(item.id),
      name: item.name,
      image: item.image,
      price: parseFloat(item.price),
      priceWei: (parseFloat(item.price) * 1e18).toString(), // Approximate
      collection: {
        id: collection.id,
        name: collection.name,
        contractAddress: collection.contractAddress,
      },
      rarity: item.rarity,
      rank: item.rank,
      sellerAddress: item.owner,
    });
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBuyNow) {
      onBuyNow(item);
    }
  };

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer"
    >
      <Card className={cn(
        "bg-zinc-900/80 border-white/5 hover:border-white/20 transition-colors duration-150 overflow-hidden",
        "border-l-2",
        statusBorder
      )}>
        <div className="relative aspect-square overflow-hidden">
          <MediaRenderer
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />

          {/* Subtle hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-150" />

          {/* Badges - always visible */}
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
            <Badge className={`text-[10px] px-1.5 py-0.5 font-medium ${
              item.rarity === 'Mythic' ? 'bg-purple-500/90' :
              item.rarity === 'Legendary' ? 'bg-orange-500/90' :
              item.rarity === 'Epic' ? 'bg-purple-400/90' :
              item.rarity === 'Rare' ? 'bg-blue-500/90' :
              'bg-zinc-600/90'
            }`}>
              {item.rarity}
            </Badge>
            <Badge className="bg-black/70 text-white/80 text-[10px] font-normal">
              #{item.rank}
            </Badge>
          </div>

          {/* Hover Actions - fast fade */}
          <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <div className="flex gap-1.5">
              {item.listed ? (
                <>
                  <Button
                    size="sm"
                    className="flex-1 bg-white text-black hover:bg-white/90 h-7 text-xs font-medium"
                    onClick={handleBuyNow}
                  >
                    Buy Now
                  </Button>
                  {collection && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className={cn(
                        "h-7 w-7",
                        inCart
                          ? "bg-[rgb(163,255,18)] text-black hover:bg-[rgb(143,235,0)]"
                          : "bg-black/70 hover:bg-black/90 text-white"
                      )}
                      onClick={handleAddToCart}
                      disabled={inCart}
                    >
                      {inCart ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <ShoppingCart className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  size="sm"
                  className="flex-1 bg-blue-600 text-white hover:bg-blue-700 h-7 text-xs font-medium"
                  onClick={(e) => { e.stopPropagation(); /* TODO: Open offer dialog */ }}
                >
                  <Tag className="w-3 h-3 mr-1" />
                  Make Offer
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="bg-black/70 hover:bg-black/90 text-white h-7 w-7"
                onClick={(e) => { e.stopPropagation(); }}
              >
                <Heart className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>

        <CardContent className="p-2.5">
          <div className="flex items-center justify-between mb-0.5">
            <p className="text-sm font-medium text-white truncate">{item.name}</p>
            {item.hasOffer && (
              <Badge className="bg-blue-500/20 text-blue-400 text-[9px] px-1 py-0 font-normal">
                Offer
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-white/50">Price</p>
              {item.listed ? (
                <p className="text-sm font-semibold text-white">{item.price} ETH</p>
              ) : (
                <p className="text-xs text-white/40">Not listed</p>
              )}
            </div>
            {item.lastSale && item.lastSale !== '0' && (
              <div className="text-right">
                <p className="text-[10px] text-white/50">Last</p>
                <p className="text-xs text-white/70">{item.lastSale} ETH</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
