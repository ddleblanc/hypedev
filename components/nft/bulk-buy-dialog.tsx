"use client";

import { useState } from "react";
import { MediaRenderer } from "@/components/MediaRenderer";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  ShoppingBag, 
  Wallet, 
  Shield, 
  Check, 
  Loader2,
  AlertTriangle,
  ExternalLink,
  Crown,
  Zap,
  Info,
  X
} from "lucide-react";
import { useBulkSelection } from "./bulk-selection-provider";

export interface BulkBuyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type BulkTransactionStep = "review" | "approve" | "confirm" | "pending" | "success" | "error";

export function BulkBuyDialog({ open, onOpenChange }: BulkBuyDialogProps) {
  const { selectedNFTs, getTotalPrice, getSelectedCount, clearSelection } = useBulkSelection();
  const [currentStep, setCurrentStep] = useState<BulkTransactionStep>("review");
  const [transactionHash, setTransactionHash] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [processedCount, setProcessedCount] = useState(0);

  const totalPrice = getTotalPrice();
  const fees = {
    marketplaceFee: totalPrice * 0.025,
    creatorRoyalty: totalPrice * 0.05,
    gasEstimate: selectedNFTs.length * 0.008,
  };

  const grandTotal = totalPrice + fees.marketplaceFee + fees.creatorRoyalty + fees.gasEstimate;

  const handleBulkBuy = async () => {
    try {
      setCurrentStep("approve");
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setCurrentStep("confirm");
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setCurrentStep("pending");
      setTransactionHash("0x" + Math.random().toString(16).substring(2, 42));
      
      // Simulate processing each NFT
      for (let i = 0; i < selectedNFTs.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setProcessedCount(i + 1);
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      setCurrentStep("success");
    } catch (err) {
      setError("Bulk transaction failed. Some items may have been processed.");
      setCurrentStep("error");
    }
  };

  const getStepProgress = () => {
    switch (currentStep) {
      case "review": return 0;
      case "approve": return 20;
      case "confirm": return 40;
      case "pending": return 40 + (processedCount / selectedNFTs.length) * 40;
      case "success": return 100;
      default: return 0;
    }
  };

  const resetDialog = () => {
    setCurrentStep("review");
    setError("");
    setTransactionHash("");
    setProcessedCount(0);
    onOpenChange(false);
  };

  const removeFromSelection = (nftId: string) => {
    const nft = selectedNFTs.find(n => n.id === nftId);
    if (nft) {
      // This would call toggleNFT from the context
      // For now, we'll just show the UI
    }
  };

  return (
    <Dialog open={open} onOpenChange={resetDialog}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            Bulk Purchase ({getSelectedCount()} items)
          </DialogTitle>
          <DialogDescription>
            Complete your bulk purchase of {getSelectedCount()} NFTs
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        {currentStep !== "review" && currentStep !== "error" && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Transaction Progress</span>
              <span>{Math.round(getStepProgress())}%</span>
            </div>
            <Progress value={getStepProgress()} className="h-2" />
            {currentStep === "pending" && (
              <div className="text-xs text-muted-foreground text-center">
                Processing {processedCount} of {selectedNFTs.length} items...
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-hidden">
          {/* Review Step */}
          {currentStep === "review" && (
            <div className="space-y-4 h-full flex flex-col">
              {/* Selected Items */}
              <div className="flex-1 overflow-hidden">
                <h4 className="font-medium mb-3">Selected Items</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {selectedNFTs.map((nft) => (
                    <div key={nft.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
                        <MediaRenderer src={nft.image} alt={nft.name} className="" aspectRatio="square" />
                        {(nft.rarity === "Legendary" || nft.rarity === "Mythic") && (
                          <Crown className="absolute top-0.5 right-0.5 h-3 w-3 text-yellow-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{nft.name}</div>
                        <div className="text-xs text-muted-foreground">{nft.collection}</div>
                        <Badge variant="outline" className="text-xs mt-1">
                          {nft.rarity}
                        </Badge>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-medium text-sm">{nft.price} ETH</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 flex-shrink-0"
                        onClick={() => removeFromSelection(nft.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium text-sm">Price Breakdown</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Items total ({getSelectedCount()} items)</span>
                    <span className="font-medium">{totalPrice.toFixed(4)} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Marketplace fees (2.5%)</span>
                    <span>{fees.marketplaceFee.toFixed(4)} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Creator royalties (5%)</span>
                    <span>{fees.creatorRoyalty.toFixed(4)} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gas estimate</span>
                    <span>{fees.gasEstimate.toFixed(4)} ETH</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total Cost</span>
                    <span>{grandTotal.toFixed(4)} ETH</span>
                  </div>
                </div>
              </div>

              {/* Security Notice */}
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <Shield className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="text-sm text-green-600 dark:text-green-400">
                  Bulk transactions are secured by smart contract batch processing
                </span>
              </div>

              {/* Action Button */}
              <Button onClick={handleBulkBuy} className="w-full" size="lg">
                <Zap className="h-4 w-4 mr-2" />
                Complete Bulk Purchase
              </Button>
            </div>
          )}

          {/* Approval Step */}
          {currentStep === "approve" && (
            <div className="text-center space-y-4 py-8">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Approve Bulk Transaction</h3>
                <p className="text-sm text-muted-foreground">
                  Please approve the bulk purchase transaction in your wallet
                </p>
              </div>
            </div>
          )}

          {/* Confirmation Step */}
          {currentStep === "confirm" && (
            <div className="text-center space-y-4 py-8">
              <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Confirming Bulk Transaction</h3>
                <p className="text-sm text-muted-foreground">
                  Your bulk purchase is being processed...
                </p>
              </div>
            </div>
          )}

          {/* Pending Step */}
          {currentStep === "pending" && (
            <div className="text-center space-y-4 py-8">
              <div className="mx-auto w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-950 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-yellow-600 animate-spin" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Processing Bulk Purchase</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Processing {processedCount} of {selectedNFTs.length} items...
                </p>
                <div className="space-y-2">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-yellow-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(processedCount / selectedNFTs.length) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Batch processing NFT transfers...
                  </div>
                </div>
                {transactionHash && (
                  <Button variant="outline" size="sm" className="gap-2 mt-4">
                    <ExternalLink className="h-3 w-3" />
                    View on Etherscan
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Success Step */}
          {currentStep === "success" && (
            <div className="text-center space-y-4 py-8">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Bulk Purchase Successful!</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Congratulations! You now own {selectedNFTs.length} new NFTs
                </p>
                <div className="bg-muted/50 p-4 rounded-lg mb-4">
                  <div className="text-sm">
                    <div className="font-medium">Purchase Summary</div>
                    <div className="text-muted-foreground mt-1">
                      {selectedNFTs.length} NFTs • {grandTotal.toFixed(4)} ETH total
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    View in Wallet
                  </Button>
                  <Button size="sm" className="flex-1" onClick={resetDialog}>
                    Done
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Error Step */}
          {currentStep === "error" && (
            <div className="text-center space-y-4 py-8">
              <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Bulk Transaction Failed</h3>
                <p className="text-sm text-muted-foreground mb-4">{error}</p>
                {processedCount > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg mb-4">
                    <Info className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                    <div className="text-sm text-yellow-600 dark:text-yellow-400 text-left">
                      {processedCount} of {selectedNFTs.length} items were successfully processed.
                      Check your wallet for completed transfers.
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetDialog} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleBulkBuy} className="flex-1">
                    Retry Failed Items
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}