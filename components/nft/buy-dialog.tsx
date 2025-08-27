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
  Zap, 
  ShoppingCart, 
  Wallet, 
  Shield, 
  Check, 
  Loader2,
  AlertTriangle,
  ExternalLink,
  Crown
} from "lucide-react";
import { ConnectButton } from "thirdweb/react";
import { client } from "@/lib/thirdweb";

export interface NFTBuyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nft: {
    id: string;
    name: string;
    image: string;
    price: number;
    rarity: string;
    collection: string;
    contractAddress?: string;
  } | null;
}

type TransactionStep = "review" | "approve" | "confirm" | "pending" | "success" | "error";

export function NFTBuyDialog({ open, onOpenChange, nft }: NFTBuyDialogProps) {
  const [currentStep, setCurrentStep] = useState<TransactionStep>("review");
  const [transactionHash, setTransactionHash] = useState<string>("");
  const [error, setError] = useState<string>("");
  
  if (!nft) return null;

  const fees = {
    marketplaceFee: nft.price * 0.025, // 2.5%
    creatorRoyalty: nft.price * 0.05,  // 5%
    gasEstimate: 0.008,                // ~$20 at current gas prices
  };

  const total = nft.price + fees.marketplaceFee + fees.creatorRoyalty + fees.gasEstimate;

  const handleBuy = async () => {
    try {
      setCurrentStep("approve");
      
      // Simulate approval step
      await new Promise(resolve => setTimeout(resolve, 2000));
      setCurrentStep("confirm");
      
      // Simulate transaction confirmation
      await new Promise(resolve => setTimeout(resolve, 3000));
      setCurrentStep("pending");
      setTransactionHash("0x1234567890abcdef1234567890abcdef12345678");
      
      // Simulate blockchain confirmation
      await new Promise(resolve => setTimeout(resolve, 4000));
      setCurrentStep("success");
    } catch (err) {
      setError("Transaction failed. Please try again.");
      setCurrentStep("error");
    }
  };

  const getStepProgress = () => {
    switch (currentStep) {
      case "review": return 0;
      case "approve": return 25;
      case "confirm": return 50;
      case "pending": return 75;
      case "success": return 100;
      case "error": return 0;
      default: return 0;
    }
  };

  const resetDialog = () => {
    setCurrentStep("review");
    setError("");
    setTransactionHash("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={resetDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Buy NFT
          </DialogTitle>
          <DialogDescription>
            Complete your purchase of this NFT
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
          </div>
        )}

        <div className="space-y-6">
          {/* NFT Preview */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="relative w-16 h-16 rounded-lg overflow-hidden">
              <MediaRenderer src={nft.image} alt={nft.name} className="" aspectRatio="square" />
              {(nft.rarity === "Legendary" || nft.rarity === "Mythic") && (
                <Crown className="absolute top-1 right-1 h-4 w-4 text-yellow-400" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{nft.name}</h3>
              <p className="text-sm text-muted-foreground">{nft.collection}</p>
              <Badge variant="outline" className="mt-1 text-xs">
                {nft.rarity}
              </Badge>
            </div>
            <div className="text-right">
              <div className="font-bold text-lg">{nft.price} ETH</div>
            </div>
          </div>

          {/* Transaction Steps */}
          {currentStep === "review" && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Item price</span>
                  <span className="font-medium">{nft.price} ETH</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Marketplace fee (2.5%)</span>
                  <span>{fees.marketplaceFee.toFixed(4)} ETH</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Creator royalty (5%)</span>
                  <span>{fees.creatorRoyalty.toFixed(4)} ETH</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gas estimate</span>
                  <span>{fees.gasEstimate} ETH</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{total.toFixed(4)} ETH</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600 dark:text-green-400">
                  This transaction is secured by smart contract escrow
                </span>
              </div>

              <Button onClick={handleBuy} className="w-full" size="lg">
                <Wallet className="h-4 w-4 mr-2" />
                Complete Purchase
              </Button>
            </div>
          )}

          {currentStep === "approve" && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Approve Transaction</h3>
                <p className="text-sm text-muted-foreground">
                  Please approve the transaction in your wallet
                </p>
              </div>
            </div>
          )}

          {currentStep === "confirm" && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Confirming Transaction</h3>
                <p className="text-sm text-muted-foreground">
                  Your transaction is being processed...
                </p>
              </div>
            </div>
          )}

          {currentStep === "pending" && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-950 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-yellow-600 animate-spin" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Transaction Pending</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Waiting for blockchain confirmation
                </p>
                {transactionHash && (
                  <Button variant="outline" size="sm" className="gap-2">
                    <ExternalLink className="h-3 w-3" />
                    View on Etherscan
                  </Button>
                )}
              </div>
            </div>
          )}

          {currentStep === "success" && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Purchase Successful!</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Congratulations! You now own {nft.name}
                </p>
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

          {currentStep === "error" && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Transaction Failed</h3>
                <p className="text-sm text-muted-foreground mb-4">{error}</p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetDialog} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleBuy} className="flex-1">
                    Try Again
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