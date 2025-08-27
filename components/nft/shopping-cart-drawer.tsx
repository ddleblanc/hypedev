"use client";

import { useState } from "react";
import { MediaRenderer } from "@/components/MediaRenderer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter
} from "@/components/ui/drawer";
import { 
  ShoppingCart, 
  Trash2, 
  Crown,
  Zap,
  Plus,
  Minus,
  X,
  ShoppingBag
} from "lucide-react";
import { useBulkSelection } from "./bulk-selection-provider";

interface NFT {
  id: string;
  name: string;
  image: string;
  price: string;
  collection?: string;
  rarity?: string;
}

export interface ShoppingCartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCheckout: () => void;
}

export function ShoppingCartDrawer({ 
  open, 
  onOpenChange, 
  onCheckout 
}: ShoppingCartDrawerProps) {
  const { 
    selectedNFTs, 
    getTotalPrice, 
    getSelectedCount, 
    clearSelection,
    toggleNFT,
    isSelectionMode,
    toggleSelectionMode
  } = useBulkSelection();

  const totalPrice = getTotalPrice();
  const itemCount = getSelectedCount();
  
  const fees = {
    marketplaceFee: totalPrice * 0.025,
    creatorRoyalty: totalPrice * 0.05,
    gasEstimate: selectedNFTs.length * 0.008,
  };

  const grandTotal = totalPrice + fees.marketplaceFee + fees.creatorRoyalty + fees.gasEstimate;

  const handleRemoveItem = (nft: NFT) => {
    toggleNFT(nft);
  };

  const handleCheckout = () => {
    onOpenChange(false);
    onCheckout();
  };

  const handleClearCart = () => {
    clearSelection();
    if (isSelectionMode) {
      toggleSelectionMode();
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Shopping Cart ({itemCount})
            </div>
            {itemCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearCart}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </DrawerTitle>
          <DrawerDescription>
            Review your selected NFTs before checkout
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-hidden px-4">
          {itemCount === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                <ShoppingBag className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Your cart is empty</h3>
                <p className="text-sm text-muted-foreground">
                  Add NFTs to your cart to get started
                </p>
              </div>
              <Button onClick={() => onOpenChange(false)} variant="outline">
                Continue Shopping
              </Button>
            </div>
          ) : (
            <div className="space-y-4 h-full flex flex-col">
              {/* Items List */}
              <div className="flex-1 overflow-hidden">
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {selectedNFTs.map((nft) => (
                    <div key={nft.id} className="flex items-center gap-3 p-3 border rounded-lg bg-card">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        <MediaRenderer src={nft.image} alt={nft.name} className="" aspectRatio="square" />
                        {(nft.rarity === "Legendary" || nft.rarity === "Mythic") && (
                          <Crown className="absolute top-1 right-1 h-3 w-3 text-yellow-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{nft.name}</h4>
                        <p className="text-sm text-muted-foreground truncate">{nft.collection}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {nft.rarity}
                        </Badge>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-semibold">{nft.price} ETH</div>
                        <div className="text-xs text-muted-foreground">
                          ~${((nft.price || 0) * 2500).toFixed(0)}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 flex-shrink-0 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleRemoveItem(nft)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Section */}
              <div className="space-y-4 border-t pt-4">
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-primary">{itemCount}</div>
                    <div className="text-xs text-muted-foreground">Items</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">{totalPrice.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">ETH Value</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-green-600">
                      {((totalPrice * 0.15) + (Math.random() * totalPrice * 0.1)).toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">Est. Savings</div>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
                  <h4 className="font-medium text-sm">Cost Breakdown</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal ({itemCount} items)</span>
                      <span className="font-medium">{totalPrice.toFixed(4)} ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Marketplace fee (2.5%)</span>
                      <span>{fees.marketplaceFee.toFixed(4)} ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Creator royalty (5%)</span>
                      <span>{fees.creatorRoyalty.toFixed(4)} ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gas estimate</span>
                      <span>{fees.gasEstimate.toFixed(4)} ETH</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-base">
                      <span>Total</span>
                      <span>{grandTotal.toFixed(4)} ETH</span>
                    </div>
                    <div className="text-xs text-muted-foreground text-right">
                      ~${(grandTotal * 2500).toFixed(2)} USD
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {itemCount > 0 && (
          <DrawerFooter>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Continue Shopping
              </Button>
              <Button 
                className="flex-1" 
                size="lg"
                onClick={handleCheckout}
              >
                <Zap className="h-4 w-4 mr-2" />
                Checkout ({itemCount})
              </Button>
            </div>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}