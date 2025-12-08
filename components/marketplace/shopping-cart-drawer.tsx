"use client";

import { useState } from "react";
import { X, Trash2, ShoppingCart, Loader2, Check, AlertCircle } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useShoppingCart, CartItem } from "@/contexts/shopping-cart-context";
import { useActiveAccount } from "thirdweb/react";
import { buyFromDirectListing } from "@/lib/marketplace";
import { MediaRenderer } from "@/components/MediaRenderer";
import { cn } from "@/lib/utils";

interface CartItemRowProps {
  item: CartItem;
  onRemove: () => void;
  isPurchasing: boolean;
  purchaseResult?: { success: boolean; txHash?: string; error?: string };
}

function CartItemRow({ item, onRemove, isPurchasing, purchaseResult }: CartItemRowProps) {
  return (
    <div className={cn(
      "flex gap-3 p-3 rounded-lg bg-zinc-900/50 border transition-colors",
      isPurchasing && "border-[rgb(163,255,18)]/50 animate-pulse",
      purchaseResult?.success && "border-green-500/50 bg-green-500/10",
      purchaseResult?.error && "border-red-500/50 bg-red-500/10",
      !isPurchasing && !purchaseResult && "border-white/5 hover:border-white/10"
    )}>
      <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
        <MediaRenderer
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover"
        />
        {isPurchasing && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[rgb(163,255,18)]" />
          </div>
        )}
        {purchaseResult?.success && (
          <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
            <Check className="w-6 h-6 text-green-400" />
          </div>
        )}
        {purchaseResult?.error && (
          <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{item.name}</p>
        <p className="text-xs text-white/50 truncate">{item.collection.name}</p>
        {item.rarity && (
          <Badge className={cn(
            "mt-1 text-[10px] px-1.5 py-0",
            item.rarity === 'Mythic' ? 'bg-purple-500/80' :
            item.rarity === 'Legendary' ? 'bg-orange-500/80' :
            item.rarity === 'Epic' ? 'bg-purple-400/80' :
            item.rarity === 'Rare' ? 'bg-blue-500/80' :
            'bg-zinc-600/80'
          )}>
            {item.rarity}
          </Badge>
        )}
        {purchaseResult?.error && (
          <p className="text-xs text-red-400 mt-1 truncate">{purchaseResult.error}</p>
        )}
      </div>

      <div className="flex flex-col items-end justify-between">
        <p className="text-sm font-semibold text-[rgb(163,255,18)]">
          {item.price.toFixed(4)} ETH
        </p>
        {!purchaseResult && (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-white/40 hover:text-red-400"
            onClick={onRemove}
            disabled={isPurchasing}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function ShoppingCartDrawer() {
  const account = useActiveAccount();
  const {
    state,
    removeItem,
    clearCart,
    closeCart,
    totalItems,
    totalPrice,
    startPurchase,
    setCurrentPurchaseIndex,
    addPurchaseResult,
    completePurchase,
    resetPurchaseState,
  } = useShoppingCart();

  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const handlePurchaseAll = async () => {
    if (!account) {
      setPurchaseError("Please connect your wallet");
      return;
    }

    if (state.items.length === 0) return;

    setPurchaseError(null);
    startPurchase();

    let successCount = 0;
    let failCount = 0;

    // Sequential purchases - one by one
    for (let i = 0; i < state.items.length; i++) {
      const item = state.items[i];
      setCurrentPurchaseIndex(i);

      try {
        // buyFromDirectListing signature: (listingId, quantity, buyerAddress, account)
        const result = await buyFromDirectListing(
          item.listingId,
          1, // quantity
          account.address,
          account
        );

        // Success - function returns { transactionHash } or throws
        addPurchaseResult({
          itemId: item.id,
          success: true,
          txHash: result.transactionHash,
        });
        successCount++;
      } catch (err) {
        addPurchaseResult({
          itemId: item.id,
          success: false,
          error: err instanceof Error ? err.message : "Purchase failed",
        });
        failCount++;
      }
    }

    // Determine final status
    if (failCount === 0) {
      completePurchase('success');
    } else if (successCount > 0) {
      completePurchase('partial');
    } else {
      completePurchase('error');
    }
  };

  const handleClose = () => {
    if (!state.isProcessing) {
      closeCart();
      resetPurchaseState();
    }
  };

  const getResultForItem = (itemId: string) => {
    return state.purchaseResults.find(r => r.itemId === itemId);
  };

  return (
    <Sheet open={state.isOpen} onOpenChange={handleClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md bg-zinc-950 border-l border-white/10 p-0 flex flex-col"
      >
        <SheetHeader className="p-4 pb-0 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-[rgb(163,255,18)]" />
              <SheetTitle className="text-white">Cart</SheetTitle>
              {totalItems > 0 && (
                <Badge className="bg-[rgb(163,255,18)] text-black">
                  {totalItems}
                </Badge>
              )}
            </div>
            {totalItems > 0 && !state.isProcessing && state.purchaseStatus === 'idle' && (
              <Button
                variant="ghost"
                size="sm"
                className="text-white/50 hover:text-red-400"
                onClick={clearCart}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
          <SheetDescription className="text-white/50 sr-only">
            Your shopping cart
          </SheetDescription>
        </SheetHeader>

        {/* Cart Items */}
        <ScrollArea className="flex-1 p-4">
          {state.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart className="w-12 h-12 text-white/20 mb-4" />
              <p className="text-white/60">Your cart is empty</p>
              <p className="text-white/40 text-sm mt-1">
                Add items from collections to get started
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {state.items.map((item, index) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  onRemove={() => removeItem(item.id)}
                  isPurchasing={state.isProcessing && state.currentPurchaseIndex === index}
                  purchaseResult={getResultForItem(item.id)}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer with totals and purchase button */}
        {state.items.length > 0 && (
          <div className="border-t border-white/10 p-4 space-y-4">
            {/* Purchase Status Messages */}
            {state.purchaseStatus === 'success' && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                <div className="flex items-center gap-2 text-green-400">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">All items purchased successfully!</span>
                </div>
              </div>
            )}

            {state.purchaseStatus === 'partial' && (
              <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                <div className="flex items-center gap-2 text-orange-400">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Some purchases failed</span>
                </div>
                <p className="text-xs text-orange-400/80 mt-1">
                  Failed items remain in cart. You can retry.
                </p>
              </div>
            )}

            {state.purchaseStatus === 'error' && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Purchase failed</span>
                </div>
                {purchaseError && (
                  <p className="text-xs text-red-400/80 mt-1">{purchaseError}</p>
                )}
              </div>
            )}

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Items</span>
                <span className="text-white">{totalItems}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold">
                <span className="text-white">Total</span>
                <span className="text-[rgb(163,255,18)]">{totalPrice.toFixed(4)} ETH</span>
              </div>
            </div>

            {/* Purchase Button */}
            {state.purchaseStatus === 'idle' || state.purchaseStatus === 'error' || state.purchaseStatus === 'partial' ? (
              <Button
                className="w-full h-12 bg-[rgb(163,255,18)] text-black hover:bg-[rgb(143,235,0)] font-semibold"
                onClick={handlePurchaseAll}
                disabled={state.isProcessing || !account}
              >
                {state.isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Purchasing {(state.currentPurchaseIndex ?? 0) + 1}/{totalItems}...
                  </>
                ) : !account ? (
                  "Connect Wallet"
                ) : state.purchaseStatus === 'partial' ? (
                  `Retry Failed (${state.items.length} items)`
                ) : (
                  `Purchase ${totalItems} Item${totalItems !== 1 ? 's' : ''}`
                )}
              </Button>
            ) : (
              <Button
                className="w-full h-12"
                variant="outline"
                onClick={handleClose}
              >
                Close
              </Button>
            )}

            {!account && (
              <p className="text-center text-xs text-white/40">
                Connect your wallet to purchase
              </p>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
