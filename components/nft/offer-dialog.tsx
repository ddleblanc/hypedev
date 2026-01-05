"use client";

import { useState, useEffect } from "react";
import { MediaRenderer } from "@/components/MediaRenderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tag,
  Info,
  Crown,
  TrendingUp,
  TrendingDown,
  Shield,
  Loader2
} from "lucide-react";
import { useActiveAccount } from "thirdweb/react";
import { makeNFTOffer } from "@/lib/marketplace-actions";
import { useToast } from "@/hooks/use-toast";
import { useTransaction } from "@/contexts/transaction-context";

export interface NFTOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nft: {
    id: string;
    dbId?: string; // Database UUID - preferred for database operations
    name: string;
    image: string;
    price?: number;
    rarity: string;
    collection: string;
    collectionName?: string;
    contractAddress: string;
    tokenId: string;
    floorPrice?: number;
    lastSale?: number;
  } | null;
  onOfferComplete?: () => void;
}

const DURATION_OPTIONS = [
  { value: "1", label: "1 Day" },
  { value: "3", label: "3 Days" },
  { value: "7", label: "1 Week" },
  { value: "14", label: "2 Weeks" },
  { value: "30", label: "1 Month" },
];

export function NFTOfferDialog({ open, onOpenChange, nft, onOfferComplete }: NFTOfferDialogProps) {
  const [offerAmount, setOfferAmount] = useState("");
  const [duration, setDuration] = useState("7");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();
  const account = useActiveAccount();
  const { startTransaction, updateStep, setTxHash, setError, completeTransaction } = useTransaction();

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setOfferAmount("");
      setDuration("7");
      setIsSubmitting(false);
    }
  }, [open]);

  if (!nft) return null;

  const numericOffer = parseFloat(offerAmount) || 0;

  const fees = {
    gasFee: 0.005,
    platform: numericOffer * 0.025,
  };

  const getOfferComparison = () => {
    if (!numericOffer) return null;

    const comparisons = [];
    if (nft.price) {
      const diff = ((numericOffer - nft.price) / nft.price) * 100;
      comparisons.push({
        label: "vs Listed Price",
        value: nft.price,
        diff: diff,
        type: diff >= 0 ? "above" : "below" as const
      });
    }

    if (nft.floorPrice) {
      const diff = ((numericOffer - nft.floorPrice) / nft.floorPrice) * 100;
      comparisons.push({
        label: "vs Floor Price",
        value: nft.floorPrice,
        diff: diff,
        type: diff >= 0 ? "above" : "below" as const
      });
    }

    return comparisons;
  };

  const handleSubmitOffer = async () => {
    if (!account) {
      toast({ title: "Please connect your wallet", variant: "destructive" });
      return;
    }

    if (numericOffer <= 0) {
      toast({ title: "Please enter a valid offer amount", variant: "destructive" });
      return;
    }

    if (!nft.contractAddress || !nft.tokenId) {
      toast({ title: "Missing NFT contract information", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    // Capture values before closing dialog (nft might become null)
    const capturedNft: {
      id: string;
      dbId?: string;
      name: string;
      image: string;
      collection: string;
      contractAddress: string;
      tokenId: string;
    } = {
      id: nft.id,
      dbId: nft.dbId, // Database UUID for proper FK reference
      name: nft.name,
      image: nft.image,
      collection: nft.collectionName || nft.collection,
      contractAddress: nft.contractAddress,
      tokenId: nft.tokenId,
    };
    const capturedOfferAmount = offerAmount;
    const capturedDuration = duration;

    // Close the dialog first, then start async operation
    // This ensures the Dialog's overlay is fully unmounted before we continue
    onOpenChange(false);

    // Use requestAnimationFrame to ensure Dialog has unmounted before continuing
    // This prevents the Dialog's overlay from getting stuck
    requestAnimationFrame(() => {
      // Start the floating transaction pill after dialog is closed
      startTransaction(
        {
          ...capturedNft,
          price: numericOffer,
        },
        "offer",
        numericOffer
      );

      // Execute the transaction
      executeTransaction(capturedNft, capturedOfferAmount, capturedDuration);
    });
  };

  // Separate async function to handle the actual transaction
  const executeTransaction = async (
    capturedNft: { id: string; dbId?: string; name: string; image: string; collection: string; contractAddress: string; tokenId: string },
    capturedOfferAmount: string,
    capturedDuration: string
  ) => {
    try {
      // Update step: approve (waiting for wallet)
      updateStep("approve", 40);

      // Execute offer using centralized action (handles on-chain + DB)
      const result = await makeNFTOffer(
        {
          nftId: capturedNft.dbId || capturedNft.id,
          contractAddress: capturedNft.contractAddress,
          tokenId: capturedNft.tokenId,
          offerAmount: capturedOfferAmount,
          durationDays: parseInt(capturedDuration),
        },
        account!
      );

      if (!result.success) {
        throw new Error(result.error || "Failed to submit offer");
      }

      // Update step: pending (transaction submitted)
      updateStep("pending", 80);
      setTxHash(result.transactionHash!);

      // Complete the transaction
      completeTransaction();

      toast({ title: "Offer submitted successfully!" });
      onOfferComplete?.();
    } catch (err: unknown) {
      console.error("Offer error:", err);

      const errorMessage = err instanceof Error ? err.message : "Failed to submit offer. Please try again.";

      setError(errorMessage);
      toast({ title: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const comparisons = getOfferComparison();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            Make Offer
          </DialogTitle>
          <DialogDescription>
            Place a bid on this NFT
          </DialogDescription>
        </DialogHeader>

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
            <div className="text-right text-sm">
              {nft.price && (
                <div className="text-muted-foreground">
                  Listed: {nft.price} ETH
                </div>
              )}
              {nft.floorPrice && (
                <div className="text-muted-foreground">
                  Floor: {nft.floorPrice} ETH
                </div>
              )}
            </div>
          </div>

          {/* Offer Form */}
          <div className="space-y-4">
            {/* Offer Amount */}
            <div className="space-y-2">
              <Label htmlFor="offer-amount">Offer Amount (ETH)</Label>
              <Input
                id="offer-amount"
                type="number"
                placeholder="0.00"
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                step="0.001"
                min="0"
                className="text-lg"
              />
              {numericOffer > 0 && (
                <div className="text-sm text-muted-foreground">
                  ~${(numericOffer * 2650).toFixed(0)} USD
                </div>
              )}
            </div>

            {/* Price Comparisons */}
            {numericOffer > 0 && comparisons && comparisons.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {comparisons.map((comparison, index) => (
                  <div key={index} className={`p-3 rounded-lg border text-sm ${
                    comparison.type === "above"
                      ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
                  }`}>
                    <div className="text-xs text-muted-foreground">{comparison.label}</div>
                    <div className="flex items-center gap-1">
                      {comparison.type === "above" ? (
                        <TrendingUp className="h-3 w-3 text-green-600" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-600" />
                      )}
                      <span className={`font-medium ${
                        comparison.type === "above" ? "text-green-600" : "text-red-600"
                      }`}>
                        {comparison.diff >= 0 ? "+" : ""}{comparison.diff.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Duration */}
            <div className="space-y-2">
              <Label>Offer Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fee Breakdown */}
            {numericOffer > 0 && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium text-sm">Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Your offer</span>
                    <span>{numericOffer} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Platform fee (2.5%)</span>
                    <span>{fees.platform.toFixed(4)} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gas estimate</span>
                    <span>~{fees.gasFee} ETH</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Funds Required</span>
                    <span>{(numericOffer + fees.gasFee).toFixed(4)} ETH</span>
                  </div>
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <Info className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-600 dark:text-blue-400">
                <div className="font-medium mb-1">About Offers</div>
                <div className="text-xs">
                  Your offer will be active for {DURATION_OPTIONS.find(o => o.value === duration)?.label || duration + " days"}.
                  If accepted, the transaction will complete automatically.
                </div>
              </div>
            </div>

            {/* Security Badge */}
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <Shield className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600 dark:text-green-400">
                Secured by smart contract escrow
              </span>
            </div>

            {!account ? (
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Connect your wallet to make an offer
                </p>
              </div>
            ) : (
              <Button
                onClick={handleSubmitOffer}
                className="w-full"
                size="lg"
                disabled={!numericOffer || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Tag className="h-4 w-4 mr-2" />
                    Place Offer
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
