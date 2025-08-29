"use client";

import { useState } from "react";
import { MediaRenderer } from "@/components/MediaRenderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Share2, Eye, Zap, Tag } from "lucide-react";

interface NFT {
  id: string;
  name: string;
  image: string;
  collectionName: string;
  collectionSlug: string;
  chain: 'ethereum' | 'polygon' | 'arbitrum' | 'optimism' | 'base';
  price?: number;
  lastSale?: number;
  floorPrice?: number;
  rarity?: string;
  rank?: number;
  traits?: Record<string, string>;
  owned: boolean;
  created: boolean;
  listed: boolean;
  auction: boolean;
  new: boolean;
  likes: number;
  views: number;
  lastViewed: Date;
  topBid?: number;
  royalty?: number;
}

interface NFTCardProps {
  nft: NFT;
  onBuy: () => void;
  onOffer: () => void;
  onClick?: () => void;
}

// True light source rarity system
const getRarityLight = (rarity: string) => {
  switch(rarity) {
    case "Mythic":
      return {
        primary: "168, 85, 247", // Purple RGB
        secondary: "236, 72, 153", // Pink RGB
        accent: "217, 70, 239", // Fuchsia RGB
        
        intensity: 0.9,
        radius: 200,
        blur: 80,
        coreSize: 8,
        
        pulse: true,
        rotate: true,
        flicker: true,
        
        cardTranslate: "hover:-translate-y-2",
        cardScale: "hover:scale-[1.02]",
        hasParticles: true
      };
    case "Legendary":
      return {
        primary: "251, 191, 36", // Amber RGB
        secondary: "245, 158, 11", // Yellow RGB
        accent: "252, 211, 77", // Light gold RGB
        
        intensity: 0.75,
        radius: 160,
        blur: 60,
        coreSize: 6,
        
        pulse: true,
        rotate: false,
        flicker: false,
        
        cardTranslate: "hover:-translate-y-1.5",
        cardScale: "hover:scale-[1.015]",
        hasParticles: true
      };
    case "Epic":
      return {
        primary: "139, 92, 246", // Violet RGB
        secondary: "167, 139, 250", // Light violet RGB
        accent: "124, 58, 237", // Dark violet RGB
        
        intensity: 0.6,
        radius: 120,
        blur: 40,
        coreSize: 4,
        
        pulse: false,
        rotate: false,
        flicker: false,
        
        cardTranslate: "hover:-translate-y-1",
        cardScale: "hover:scale-[1.01]",
        hasParticles: false
      };
    case "Rare":
      return {
        primary: "59, 130, 246", // Blue RGB
        secondary: "96, 165, 250", // Light blue RGB
        accent: "37, 99, 235", // Dark blue RGB
        
        intensity: 0.45,
        radius: 80,
        blur: 30,
        coreSize: 3,
        
        pulse: false,
        rotate: false,
        flicker: false,
        
        cardTranslate: "hover:-translate-y-1",
        cardScale: "",
        hasParticles: false
      };
    case "Uncommon":
      return {
        primary: "34, 197, 94", // Green RGB
        secondary: "74, 222, 128", // Light green RGB
        accent: "22, 163, 74", // Dark green RGB
        
        intensity: 0.3,
        radius: 60,
        blur: 20,
        coreSize: 2,
        
        pulse: false,
        rotate: false,
        flicker: false,
        
        cardTranslate: "hover:-translate-y-0.5",
        cardScale: "",
        hasParticles: false
      };
    default: // Common
      return {
        primary: "156, 163, 175", // Gray RGB
        secondary: "209, 213, 219", // Light gray RGB
        accent: "107, 114, 128", // Dark gray RGB
        
        intensity: 0.15,
        radius: 40,
        blur: 15,
        coreSize: 0,
        
        pulse: false,
        rotate: false,
        flicker: false,
        
        cardTranslate: "hover:-translate-y-0.5",
        cardScale: "",
        hasParticles: false
      };
  }
};

export default function NFTCardEnhanced({ nft, onBuy, onOffer, onClick }: NFTCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  const light = getRarityLight(nft.rarity || 'Common');

  return (
    <div className="relative">
      {/* Light effects wrapper - independent of card transforms */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: isHovered ? 1 : 0.7,
          transition: 'opacity 0.3s ease',
          zIndex: 0
        }}
      >
        {/* True Light Source Effect - Emanating from bottom */}
        <div 
          className="absolute bottom-0 left-1/2 -translate-x-1/2"
          style={{ zIndex: -1 }}
        >
          {/* Primary light orb */}
          <div 
            className={`absolute ${light.pulse ? 'animate-light-pulse' : ''}`}
            style={{
              width: `${light.radius}px`,
              height: `${light.radius}px`,
              left: '50%',
              bottom: `-${light.radius / 3}px`,
              transform: 'translateX(-50%)',
              background: `radial-gradient(circle at center, 
                rgba(${light.primary}, ${light.intensity}) 0%, 
                rgba(${light.primary}, ${light.intensity * 0.6}) 20%, 
                rgba(${light.primary}, ${light.intensity * 0.3}) 40%, 
                rgba(${light.primary}, 0) 70%)`,
              filter: `blur(${light.blur}px)`
            }}
          />
          
          {/* Secondary light layer for depth */}
          <div 
            className={`absolute ${light.rotate ? 'animate-light-rotate' : ''}`}
            style={{
              width: `${light.radius * 0.7}px`,
              height: `${light.radius * 0.7}px`,
              left: '50%',
              bottom: `-${light.radius / 4}px`,
              transform: 'translateX(-50%)',
              background: `radial-gradient(circle at center, 
                rgba(${light.secondary}, ${light.intensity * 0.8}) 0%, 
                rgba(${light.secondary}, ${light.intensity * 0.4}) 30%, 
                rgba(${light.secondary}, 0) 60%)`,
              filter: `blur(${light.blur * 0.6}px)`,
              mixBlendMode: 'screen'
            }}
          />
          
          {/* Core bright light point */}
          {light.coreSize > 0 && (
            <div 
              className={`absolute ${light.flicker ? 'animate-light-flicker' : ''}`}
              style={{
                width: `${light.coreSize}px`,
                height: `${light.coreSize * 4}px`,
                left: '50%',
                bottom: '0',
                transform: 'translateX(-50%)',
                background: `linear-gradient(to top, 
                  rgba(${light.primary}, 1) 0%, 
                  rgba(${light.primary}, 0.5) 50%, 
                  transparent 100%)`,
                filter: 'blur(2px)',
                opacity: light.intensity
              }}
            />
          )}
          
          {/* Accent light rays for higher rarities */}
          {light.intensity > 0.5 && (
            <>
              <div 
                className="absolute animate-light-ray"
                style={{
                  width: '2px',
                  height: `${light.radius * 0.8}px`,
                  left: '50%',
                  bottom: '0',
                  transform: 'translateX(-50%) rotate(-20deg)',
                  transformOrigin: 'bottom center',
                  background: `linear-gradient(to top, 
                    rgba(${light.accent}, ${light.intensity * 0.6}) 0%, 
                    transparent 60%)`
                }}
              />
              <div 
                className="absolute animate-light-ray-reverse"
                style={{
                  width: '2px',
                  height: `${light.radius * 0.8}px`,
                  left: '50%',
                  bottom: '0',
                  transform: 'translateX(-50%) rotate(20deg)',
                  transformOrigin: 'bottom center',
                  background: `linear-gradient(to top, 
                    rgba(${light.accent}, ${light.intensity * 0.6}) 0%, 
                    transparent 60%)`
                }}
              />
            </>
          )}
        </div>
        
        {/* Light reflection on card surface */}
        <div 
          className="absolute inset-0 rounded-lg overflow-hidden"
          style={{
            background: `radial-gradient(ellipse at bottom center, 
              rgba(${light.primary}, ${light.intensity * 0.15}) 0%, 
              transparent 50%)`
          }}
        />
        
        {/* Card shadow with color matching light */}
        <div 
          className="absolute inset-0 rounded-lg"
          style={{
            boxShadow: `
              0 ${20 * light.intensity}px ${60 * light.intensity}px -${15 * light.intensity}px rgba(${light.primary}, ${light.intensity * 0.5}),
              inset 0 0 ${30 * light.intensity}px rgba(${light.primary}, ${light.intensity * 0.1})
            `
          }}
        />
        
        {/* Floating light particles for Mythic/Legendary */}
        {light.hasParticles && isHovered && (
          <div className="absolute inset-0 overflow-hidden rounded-lg">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="absolute animate-particle-float"
                style={{
                  width: '2px',
                  height: '2px',
                  left: `${50 + (Math.random() - 0.5) * 30}%`,
                  bottom: '0',
                  background: `rgba(${light.primary}, 1)`,
                  boxShadow: `0 0 ${6 + Math.random() * 4}px rgba(${light.primary}, 0.8)`,
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: `${3 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Main card with separate transform animations */}
      <div 
        className={`group bg-card rounded-lg sm:rounded-xl border border-white/5 overflow-hidden transition-transform duration-300 ${light.cardTranslate} ${light.cardScale} cursor-pointer relative`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
        style={{ zIndex: 1 }}
      >
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          <MediaRenderer
            src={nft.image}
            alt={nft.name}
            className="transition-transform duration-300 group-hover:scale-110"
            aspectRatio="square"
          />
          
          {/* Overlay Elements */}
          <div className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`} />
          
          {/* Top Badges */}
          <div className="absolute top-1 sm:top-2 left-1 sm:left-2 flex gap-1">
            {nft.new && (
              <Badge className="bg-black text-primary-foreground text-[10px] sm:text-xs px-1.5 sm:px-2 h-5 sm:h-6">New</Badge>
            )}
            {nft.auction && (
              <Badge className="bg-orange-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 h-5 sm:h-6">Auction</Badge>
            )}
          </div>

          {/* Top Right Actions */}
          <div className={`absolute top-1 sm:top-2 right-1 sm:right-2 flex gap-1 sm:gap-2 transition-all duration-300 ${
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}>
            <Button
              size="sm"
              variant="secondary"
              className="h-6 w-6 sm:h-8 sm:w-8 p-0 backdrop-blur-sm bg-black/20 border-white/20 hover:bg-black/40"
              onClick={(e) => {
                e.stopPropagation();
                setIsLiked(!isLiked);
              }}
            >
              <Heart className={`h-3 w-3 sm:h-4 sm:w-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="h-6 w-6 sm:h-8 sm:w-8 p-0 backdrop-blur-sm bg-black/20 border-white/20 hover:bg-black/40"
            >
              <Share2 className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
            </Button>
          </div>

          {/* Light indicator orb */}
          {light.intensity > 0.3 && (
            <div className="absolute top-12 right-2">
              <div 
                className="rounded-full"
                style={{
                  width: '6px',
                  height: '6px',
                  background: `rgba(${light.primary}, 1)`,
                  boxShadow: `
                    0 0 ${10 * light.intensity}px rgba(${light.primary}, 0.8),
                    0 0 ${20 * light.intensity}px rgba(${light.primary}, 0.4)
                  `,
                  opacity: light.intensity
                }}
              />
            </div>
          )}

          {/* Bottom Left Stats */}
          <div className="absolute bottom-1 sm:bottom-2 left-1 sm:left-2 flex items-center gap-1 sm:gap-3 text-white text-[10px] sm:text-xs">
            <div className="flex items-center gap-0.5 sm:gap-1 bg-black/40 backdrop-blur-sm rounded px-1.5 sm:px-2 py-0.5 sm:py-1">
              <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              {nft.views}
            </div>
            <div className="flex items-center gap-0.5 sm:gap-1 bg-black/40 backdrop-blur-sm rounded px-1.5 sm:px-2 py-0.5 sm:py-1">
              <Heart className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              {nft.likes}
            </div>
          </div>
        </div>
        
        {/* Card Content */}
        <div className="p-3 sm:p-4 space-y-2 sm:space-y-3 relative">
          <div className="flex items-start justify-between gap-1 sm:gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold truncate text-xs sm:text-sm">{nft.name}</h3>
              <div className="flex items-center gap-1 sm:gap-2 mt-1">
                <span 
                  className="text-[10px] sm:text-xs font-medium"
                  style={{
                    color: light.intensity > 0.4 ? `rgba(${light.primary}, 1)` : 'rgb(156, 163, 175)',
                    textShadow: light.intensity > 0.6 ? `0 0 8px rgba(${light.primary}, 0.5)` : 'none'
                  }}
                >
                  #{nft.rank}
                </span>
                {/* Rarity text with light glow for high tiers */}
                {light.intensity > 0.6 && (
                  <span 
                    className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded"
                    style={{
                      background: `linear-gradient(135deg, 
                        rgba(${light.primary}, 0.1), 
                        rgba(${light.secondary}, 0.1))`,
                      color: `rgba(${light.primary}, 1)`,
                      border: `1px solid rgba(${light.primary}, 0.3)`,
                      boxShadow: `inset 0 0 10px rgba(${light.primary}, 0.1)`
                    }}
                  >
                    {nft.rarity}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="min-w-0">
              {nft.price ? (
                <div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">Price</div>
                  <div className="font-bold text-xs sm:text-sm">{nft.price} ETH</div>
                </div>
              ) : nft.lastSale ? (
                <div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">Last Sale</div>
                  <div className="font-medium text-muted-foreground text-xs sm:text-sm">{nft.lastSale} ETH</div>
                </div>
              ) : (
                <div className="text-xs sm:text-sm text-muted-foreground">Not for sale</div>
              )}
            </div>
            
            <div className="flex gap-1">
              {nft.price ? (
                <Button size="sm" className="gap-0.5 sm:gap-1 h-7 sm:h-8 flex-1 text-xs sm:text-sm px-2 sm:px-3" onClick={onBuy}>
                  <Zap className="h-3 w-3" />
                  <span className="hidden sm:inline">Buy</span>
                </Button>
              ) : (
                <Button size="sm" variant="outline" className="gap-0.5 sm:gap-1 h-7 sm:h-8 flex-1 text-xs sm:text-sm px-2 sm:px-3" onClick={onOffer}>
                  <Tag className="h-3 w-3" />
                  <span className="hidden sm:inline">Offer</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}