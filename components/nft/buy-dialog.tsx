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
  Wallet,
  Shield,
  Check,
  Loader2,
  AlertTriangle,
  ExternalLink,
  Crown
} from "lucide-react";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { buyFromListing, getListing } from "thirdweb/extensions/marketplace";
import { getContract } from "thirdweb";
import { client } from "@/lib/thirdweb";
import { defineChain } from "thirdweb/chains";
import { MARKETPLACE_ADDRESS, MARKETPLACE_CHAIN_ID } from "@/lib/marketplace";

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
    collectionName?: string;
    contractAddress?: string;
    listingId?: string;
    tokenId?: string;
    royaltyPercentage?: number;
  } | null;
  onPurchaseComplete?: () => void;
}

type TransactionStep = "review" | "approve" | "confirm" | "pending" | "success" | "error";

export function NFTBuyDialog({ open, onOpenChange, nft, onPurchaseComplete }: NFTBuyDialogProps) {
  const [currentStep, setCurrentStep] = useState<TransactionStep>("review");
  const [transactionHash, setTransactionHash] = useState<string>("");
  const [error, setError] = useState<string>("");

  const account = useActiveAccount();
  const { mutateAsync: sendTx, isPending } = useSendTransaction();

  if (!nft) return null;

  const royaltyPercent = nft.royaltyPercentage || 5;
  const fees = {
    marketplaceFee: nft.price * 0.025, // 2.5%
    creatorRoyalty: nft.price * (royaltyPercent / 100),
    gasEstimate: 0.008, // ~$20 at current gas prices (estimate)
  };

  const total = nft.price + fees.gasEstimate; // Fees are included in price on Thirdweb marketplace

  const handleBuy = async () => {
    if (!account) {
      setError("Please connect your wallet first");
      setCurrentStep("error");
      return;
    }

    if (!nft.listingId) {
      setError("This NFT is not listed for sale");
      setCurrentStep("error");
      return;
    }

    try {
      setCurrentStep("approve");
      setError("");

      // Get the marketplace contract
      const marketplace = getContract({
        client,
        chain: defineChain(MARKETPLACE_CHAIN_ID),
        address: MARKETPLACE_ADDRESS,
      });

      // Verify listing exists
      console.log("Fetching listing:", nft.listingId);
      const listing = await getListing({
        contract: marketplace,
        listingId: BigInt(nft.listingId),
      });

      if (!listing) {
        throw new Error("Listing not found");
      }

      console.log("Listing found:", listing);

      // Create buy transaction
      const transaction = buyFromListing({
        contract: marketplace,
        listingId: BigInt(nft.listingId),
        quantity: BigInt(1),
        recipient: account.address,
      });

      setCurrentStep("confirm");

      // Send transaction
      const result = await sendTx(transaction);

      setCurrentStep("pending");
      setTransactionHash(result.transactionHash);

      console.log("Transaction submitted:", result.transactionHash);

      // Record the purchase in our database
      try {
        const response = await fetch('/api/marketplace/purchase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listingId: nft.listingId,
            buyerAddress: account.address,
            transactionHash: result.transactionHash,
            quantity: 1,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Failed to record purchase:', errorData);
          // Don't fail the UI - the blockchain tx succeeded
        } else {
          console.log('Purchase recorded in database');
        }
      } catch (dbError) {
        console.error('Error recording purchase:', dbError);
        // Don't fail the UI - the blockchain tx succeeded
      }

      setCurrentStep("success");

      // Notify parent component
      if (onPurchaseComplete) {
        onPurchaseComplete();
      }
    } catch (err: any) {
      console.error("Purchase error:", err);

      // Parse error message
      let errorMessage = "Transaction failed. Please try again.";

      if (err.message?.includes("user rejected") || err.message?.includes("User denied")) {
        errorMessage = "Transaction was cancelled";
      } else if (err.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient funds in your wallet";
      } else if (err.message?.includes("Listing not found")) {
        errorMessage = "This listing is no longer available";
      } else if (err.message) {
        errorMessage = err.message.slice(0, 100); // Truncate long messages
      }

      setError(errorMessage);
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

  const getExplorerUrl = () => {
    if (!transactionHash) return "#";
    // Sepolia explorer
    return `https://sepolia.etherscan.io/tx/${transactionHash}`;
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
              <p className="text-sm text-muted-foreground">{nft.collectionName || nft.collection}</p>
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
                  <span className="text-muted-foreground">Included</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Creator royalty ({royaltyPercent}%)</span>
                  <span className="text-muted-foreground">Included</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gas estimate</span>
                  <span>~{fees.gasEstimate} ETH</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>~{total.toFixed(4)} ETH</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600 dark:text-green-400">
                  This transaction is secured by smart contract escrow
                </span>
              </div>

              {!account ? (
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    Connect your wallet to purchase
                  </p>
                </div>
              ) : !nft.listingId ? (
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    This NFT is not currently listed for sale
                  </p>
                </div>
              ) : (
                <Button
                  onClick={handleBuy}
                  className="w-full"
                  size="lg"
                  disabled={isPending}
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Complete Purchase
                </Button>
              )}
            </div>
          )}

          {currentStep === "approve" && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Preparing Transaction</h3>
                <p className="text-sm text-muted-foreground">
                  Verifying listing and preparing your purchase...
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
                <h3 className="font-semibold mb-2">Confirm in Wallet</h3>
                <p className="text-sm text-muted-foreground">
                  Please confirm the transaction in your wallet
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
                  <a
                    href={getExplorerUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm" className="gap-2">
                      <ExternalLink className="h-3 w-3" />
                      View on Etherscan
                    </Button>
                  </a>
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
                  {transactionHash && (
                    <a
                      href={getExplorerUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button variant="outline" size="sm" className="w-full gap-2">
                        <ExternalLink className="h-3 w-3" />
                        View Transaction
                      </Button>
                    </a>
                  )}
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
                  <Button onClick={handleBuy} className="flex-1" disabled={isPending}>
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
