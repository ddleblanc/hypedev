"use client";

import { useState } from "react";
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
import { Progress } from "@/components/ui/progress";
import { 
  Tag, 
  Calendar, 
  TrendingUp, 
  Wallet, 
  Check, 
  Loader2,
  AlertTriangle,
  Info,
  Crown,
  Clock
} from "lucide-react";

export interface NFTOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nft: {
    id: string;
    name: string;
    image: string;
    price?: number;
    rarity: string;
    collection: string;
    floorPrice?: number;
    lastSale?: number;
  } | null;
}

type OfferStep = "form" | "approve" | "confirm" | "pending" | "success" | "error";

const DURATION_OPTIONS = [
  { value: "1", label: "1 Day" },
  { value: "3", label: "3 Days" },
  { value: "7", label: "1 Week" },
  { value: "14", label: "2 Weeks" },
  { value: "30", label: "1 Month" },
  { value: "custom", label: "Custom" }
];

export function NFTOfferDialog({ open, onOpenChange, nft }: NFTOfferDialogProps) {
  const [currentStep, setCurrentStep] = useState<OfferStep>("form");
  const [offerAmount, setOfferAmount] = useState("");
  const [duration, setDuration] = useState("7");
  const [customEndDate, setCustomEndDate] = useState("");
  const [error, setError] = useState("");

  if (!nft) return null;

  const numericOffer = parseFloat(offerAmount) || 0;
  const fees = {
    gasFee: 0.005,
    platform: numericOffer * 0.025,
  };

  const handleSubmitOffer = async () => {
    if (numericOffer <= 0) {
      setError("Please enter a valid offer amount");
      return;
    }

    try {
      setCurrentStep("approve");
      await new Promise(resolve => setTimeout(resolve, 2000));
      setCurrentStep("confirm");
      await new Promise(resolve => setTimeout(resolve, 3000));
      setCurrentStep("pending");
      await new Promise(resolve => setTimeout(resolve, 2000));
      setCurrentStep("success");
    } catch (err) {
      setError("Failed to submit offer. Please try again.");
      setCurrentStep("error");
    }
  };

  const getStepProgress = () => {
    switch (currentStep) {
      case "form": return 0;
      case "approve": return 25;
      case "confirm": return 50;
      case "pending": return 75;
      case "success": return 100;
      default: return 0;
    }
  };

  const resetDialog = () => {
    setCurrentStep("form");
    setOfferAmount("");
    setDuration("7");
    setCustomEndDate("");
    setError("");
    onOpenChange(false);
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
        type: diff >= 0 ? "above" : "below"
      });
    }
    
    if (nft.floorPrice) {
      const diff = ((numericOffer - nft.floorPrice) / nft.floorPrice) * 100;
      comparisons.push({
        label: "vs Floor Price",
        value: nft.floorPrice,
        diff: diff,
        type: diff >= 0 ? "above" : "below"
      });
    }

    return comparisons;
  };

  return (
    <Dialog open={open} onOpenChange={resetDialog}>
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

        {/* Progress Bar */}
        {currentStep !== "form" && currentStep !== "error" && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Offer Progress</span>
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
          {currentStep === "form" && (
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
                />
              </div>

              {/* Price Comparisons */}
              {numericOffer > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {getOfferComparison()?.map((comparison, index) => (
                    <div key={index} className={`p-3 rounded-lg border text-sm ${
                      comparison.type === "above" 
                        ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                        : "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
                    }`}>
                      <div className="text-xs text-muted-foreground">{comparison.label}</div>
                      <div className={`font-medium ${
                        comparison.type === "above" ? "text-green-600" : "text-red-600"
                      }`}>
                        {comparison.diff >= 0 ? "+" : ""}{comparison.diff.toFixed(1)}%
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

              {duration === "custom" && (
                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="datetime-local"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                  />
                </div>
              )}

              {/* Fee Breakdown */}
              {numericOffer > 0 && (
                <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium text-sm">Fee Breakdown</h4>
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
                      <span>{fees.gasFee} ETH</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Total Cost</span>
                      <span>{(numericOffer + fees.platform + fees.gasFee).toFixed(4)} ETH</span>
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
                    Your offer will be active for the selected duration. If accepted, 
                    the transaction will complete automatically.
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-600">{error}</span>
                </div>
              )}

              <Button 
                onClick={handleSubmitOffer} 
                className="w-full" 
                size="lg"
                disabled={!numericOffer}
              >
                <Tag className="h-4 w-4 mr-2" />
                Place Offer
              </Button>
            </div>
          )}

          {/* Approval Step */}
          {currentStep === "approve" && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Approve Offer</h3>
                <p className="text-sm text-muted-foreground">
                  Please approve the offer transaction in your wallet
                </p>
              </div>
            </div>
          )}

          {/* Confirmation Step */}
          {currentStep === "confirm" && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Confirming Offer</h3>
                <p className="text-sm text-muted-foreground">
                  Your offer is being processed...
                </p>
              </div>
            </div>
          )}

          {/* Pending Step */}
          {currentStep === "pending" && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-950 flex items-center justify-center">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Offer Active</h3>
                <p className="text-sm text-muted-foreground">
                  Your offer is now live and waiting for acceptance
                </p>
              </div>
            </div>
          )}

          {/* Success Step */}
          {currentStep === "success" && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Offer Submitted!</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Your offer of {numericOffer} ETH is now active
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    View Offers
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
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Offer Failed</h3>
                <p className="text-sm text-muted-foreground mb-4">{error}</p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetDialog} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={() => setCurrentStep("form")} className="flex-1">
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