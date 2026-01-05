"use client";

import { useState, useEffect, useCallback } from "react";
import { MediaRenderer } from "@/components/MediaRenderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
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
import { Switch } from "@/components/ui/switch";
import {
  TrendingDown,
  Crown,
  AlertTriangle,
  Info,
  Check,
  Loader2,
  Target,
  Sparkles
} from "lucide-react";
import { useActiveAccount } from "thirdweb/react";
import { sweepFloor } from "@/lib/marketplace";
import { trpc } from "@/lib/trpc/client";

interface FloorNFT {
  id: string;
  listingId: string;
  tokenId: string;
  name: string;
  image: string;
  price: number;
  priceWei: string;
  rarity: string;
  rank?: number;
  lastSale?: number;
  selected: boolean;
  sellerAddress: string;
}

export interface SweepFloorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection: {
    id: string;
    name: string;
    contractAddress: string;
    floorPrice: number;
    totalSupply: number;
  };
  onSuccess?: () => void;
}

type SweepStep = "configure" | "review" | "approve" | "confirm" | "pending" | "success" | "error";

interface SweepPreviewResponse {
  success: boolean;
  listings: Array<{
    listingId: string;
    tokenId: string;
    priceWei: string;
    priceEth: string;
    sellerAddress: string;
    nft: {
      id: string;
      name: string;
      image: string;
      collection: {
        id: string;
        name: string;
        image: string;
      };
    } | null;
  }>;
  summary: {
    totalAvailable: number;
    floorPrice: string | null;
    selectedCount: number;
    totalPrice: string;
    totalPriceWei: string;
  };
  error?: string;
}

export function SweepFloorDialog({ open, onOpenChange, collection, onSuccess }: SweepFloorDialogProps) {
  const account = useActiveAccount();
  const recordSweepMutation = trpc.marketplace.sweep.record.useMutation();
  const [currentStep, setCurrentStep] = useState<SweepStep>("configure");
  const [maxBudget, setMaxBudget] = useState("");
  const [maxItems, setMaxItems] = useState("10");
  const [rarityFilter, setRarityFilter] = useState("all");
  const [priceBuffer, setPriceBuffer] = useState("5");
  const [autoSelect, setAutoSelect] = useState(true);
  const [floorNFTs, setFloorNFTs] = useState<FloorNFT[]>([]);
  const [error, setError] = useState("");
  const [processedCount, setProcessedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [successfulPurchases, setSuccessfulPurchases] = useState<string[]>([]);
  const [failedPurchases, setFailedPurchases] = useState<string[]>([]);

  const selectedNFTs = floorNFTs.filter(nft => nft.selected);
  const totalPrice = selectedNFTs.reduce((sum, nft) => sum + nft.price, 0);
  const fees = {
    marketplaceFee: totalPrice * 0.025,
    gasEstimate: selectedNFTs.length * 0.008,
  };
  const grandTotal = totalPrice + fees.marketplaceFee + fees.gasEstimate;

  // Fetch floor NFTs via tRPC
  const sweepPreviewQuery = trpc.marketplace.sweep.preview.useQuery(
    {
      collection: collection.contractAddress,
      maxItems: parseInt(maxItems),
      maxTotalPrice: maxBudget ? parseFloat(maxBudget) : undefined,
    },
    {
      enabled: open && !!collection.contractAddress,
    }
  );

  // Update floor NFTs when query data changes
  useEffect(() => {
    if (sweepPreviewQuery.data?.listings) {
      const nfts: FloorNFT[] = sweepPreviewQuery.data.listings.map((listing, index) => ({
        id: listing.nft?.id || listing.listingId,
        listingId: listing.listingId,
        tokenId: listing.tokenId,
        name: listing.nft?.name || `#${listing.tokenId}`,
        image: listing.nft?.image || '/placeholder-nft.png',
        price: parseFloat(listing.priceEth),
        priceWei: listing.priceWei,
        rarity: 'Common', // TODO: Get from NFT metadata when available
        sellerAddress: listing.sellerAddress,
        selected: index < parseInt(maxItems),
      }));
      setFloorNFTs(nfts);
    } else {
      setFloorNFTs([]);
    }
    setIsLoading(sweepPreviewQuery.isLoading);
  }, [sweepPreviewQuery.data, sweepPreviewQuery.isLoading, maxItems]);

  // Auto-select logic
  useEffect(() => {
    if (autoSelect && maxItems && floorNFTs.length > 0) {
      const maxCount = parseInt(maxItems);
      const budget = maxBudget ? parseFloat(maxBudget) : Infinity;

      let runningTotal = 0;
      const updated = floorNFTs.map((nft, index) => {
        if (index < maxCount && runningTotal + nft.price <= budget) {
          if (rarityFilter === "all" || nft.rarity.toLowerCase() === rarityFilter) {
            runningTotal += nft.price;
            return { ...nft, selected: true };
          }
        }
        return { ...nft, selected: false };
      });

      setFloorNFTs(updated);
    }
  }, [maxBudget, maxItems, rarityFilter, autoSelect, floorNFTs.length]);

  const handleSweep = async () => {
    if (!account) {
      setError("Please connect your wallet to sweep floor");
      setCurrentStep("error");
      return;
    }

    if (selectedNFTs.length === 0) {
      setError("No NFTs selected for sweep");
      setCurrentStep("error");
      return;
    }

    try {
      setCurrentStep("approve");
      setSuccessfulPurchases([]);
      setFailedPurchases([]);
      setProcessedCount(0);

      // Execute sweep using lib/marketplace.ts
      setCurrentStep("pending");

      const result = await sweepFloor(
        collection.contractAddress,
        selectedNFTs.length,
        grandTotal.toString(),
        account.address,
        account
      );

      // Track successful purchases
      const successListings = result.transactions.map(tx => tx.listingId);
      setSuccessfulPurchases(successListings);
      setProcessedCount(result.transactions.length);

      // Record purchases in database via tRPC
      if (result.transactions.length > 0) {
        try {
          await recordSweepMutation.mutateAsync({
            collectionAddress: collection.contractAddress,
            transactions: result.transactions,
            buyerAddress: account.address,
          });
        } catch (recordError) {
          console.error('Failed to record sweep in database:', recordError);
          // Don't fail the whole operation if recording fails
        }
      }

      // Check for partial success
      const failedCount = selectedNFTs.length - result.transactions.length;
      if (failedCount > 0) {
        const successIds = new Set(successListings);
        const failed = selectedNFTs
          .filter(nft => !successIds.has(nft.listingId))
          .map(nft => nft.listingId);
        setFailedPurchases(failed);
      }

      setCurrentStep("success");

      // Notify parent of success
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Sweep error:', err);
      setError(err.message || "Floor sweep failed. Some items may have been processed.");
      setCurrentStep("error");
    }
  };

  const toggleNFTSelection = (id: string) => {
    setFloorNFTs(prev => 
      prev.map(nft => 
        nft.id === id ? { ...nft, selected: !nft.selected } : nft
      )
    );
  };

  const getStepProgress = () => {
    switch (currentStep) {
      case "configure": return 0;
      case "review": return 10;
      case "approve": return 25;
      case "confirm": return 50;
      case "pending": return 50 + (processedCount / selectedNFTs.length) * 40;
      case "success": return 100;
      default: return 0;
    }
  };

  const resetDialog = () => {
    setCurrentStep("configure");
    setError("");
    setProcessedCount(0);
    setSuccessfulPurchases([]);
    setFailedPurchases([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={resetDialog}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-primary" />
            Sweep Floor - {collection.name}
          </DialogTitle>
          <DialogDescription>
            Automatically purchase the lowest-priced NFTs from this collection
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        {currentStep !== "configure" && currentStep !== "error" && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Sweep Progress</span>
              <span>{Math.round(getStepProgress())}%</span>
            </div>
            <Progress value={getStepProgress()} className="h-2" />
            {currentStep === "pending" && (
              <div className="text-xs text-muted-foreground text-center">
                Processing {processedCount} of {selectedNFTs.length} purchases...
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-hidden">
          {/* Configuration Step */}
          {currentStep === "configure" && (
            <div className="space-y-6 h-full overflow-y-auto">
              {/* Settings Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max-budget">Max Budget (ETH)</Label>
                  <Input
                    id="max-budget"
                    type="number"
                    placeholder="10.0"
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(e.target.value)}
                    step="0.1"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max-items">Max Items</Label>
                  <Input
                    id="max-items"
                    type="number"
                    value={maxItems}
                    onChange={(e) => setMaxItems(e.target.value)}
                    min="1"
                    max="50"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Rarity Filter</Label>
                  <Select value={rarityFilter} onValueChange={setRarityFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Rarities</SelectItem>
                      <SelectItem value="common">Common</SelectItem>
                      <SelectItem value="rare">Rare</SelectItem>
                      <SelectItem value="epic">Epic</SelectItem>
                      <SelectItem value="legendary">Legendary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Price Buffer (%)</Label>
                  <Select value={priceBuffer} onValueChange={setPriceBuffer}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0% (Exact Floor)</SelectItem>
                      <SelectItem value="2.5">2.5% Above Floor</SelectItem>
                      <SelectItem value="5">5% Above Floor</SelectItem>
                      <SelectItem value="10">10% Above Floor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Auto-select Toggle */}
              <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg">
                <Switch
                  id="auto-select"
                  checked={autoSelect}
                  onCheckedChange={setAutoSelect}
                />
                <div className="flex-1">
                  <Label htmlFor="auto-select" className="font-medium">Auto-select optimal NFTs</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically select the best NFTs based on your criteria
                  </p>
                </div>
              </div>

              {/* Floor Preview */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Floor NFTs Preview</h4>
                  <div className="flex items-center gap-2">
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    <Badge variant="outline">
                      Floor: {collection.floorPrice} ETH
                    </Badge>
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Loading floor listings...</span>
                  </div>
                ) : floorNFTs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No floor listings available for this collection</p>
                  </div>
                ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                  {floorNFTs.slice(0, 10).map((nft, index) => (
                    <div 
                      key={nft.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        nft.selected ? "bg-primary/10 border-primary" : "bg-card hover:bg-muted/50"
                      }`}
                      onClick={() => !autoSelect && toggleNFTSelection(nft.id)}
                    >
                      <div className="flex items-center">
                        <div className="w-4 text-sm text-muted-foreground">#{index + 1}</div>
                        <input
                          type="checkbox"
                          checked={nft.selected}
                          onChange={() => toggleNFTSelection(nft.id)}
                          className="ml-2"
                          disabled={autoSelect}
                        />
                      </div>
                      
                      <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
                        <MediaRenderer src={nft.image} alt={nft.name} className="" aspectRatio="square" />
                        {(nft.rarity === "Legendary" || nft.rarity === "Epic") && (
                          <Crown className="absolute top-0.5 right-0.5 h-3 w-3 text-yellow-400" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{nft.name}</div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{nft.rarity}</Badge>
                          {nft.rank && (
                            <span className="text-xs text-muted-foreground">Rank #{nft.rank}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-semibold">{nft.price} ETH</div>
                        {nft.lastSale && (
                          <div className={`text-xs ${
                            nft.price < nft.lastSale ? "text-green-600" : "text-red-600"
                          }`}>
                            Last: {nft.lastSale} ETH
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </div>

              {/* Summary */}
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Selected: {selectedNFTs.length} NFTs</span>
                  <span className="font-bold">{grandTotal.toFixed(4)} ETH</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Average: {selectedNFTs.length > 0 ? (totalPrice / selectedNFTs.length).toFixed(4) : "0"} ETH per NFT
                </div>
              </div>

              <Button 
                onClick={() => setCurrentStep("review")} 
                className="w-full" 
                size="lg"
                disabled={selectedNFTs.length === 0}
              >
                <Target className="h-4 w-4 mr-2" />
                Review Sweep ({selectedNFTs.length} items)
              </Button>
            </div>
          )}

          {/* Review Step */}
          {currentStep === "review" && (
            <div className="space-y-6 h-full flex flex-col">
              <div className="grid grid-cols-3 gap-4 text-center p-4 bg-muted/30 rounded-lg">
                <div>
                  <div className="text-2xl font-bold text-primary">{selectedNFTs.length}</div>
                  <div className="text-sm text-muted-foreground">NFTs</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{totalPrice.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">ETH Subtotal</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{grandTotal.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">ETH Total</div>
                </div>
              </div>

              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium text-sm">Cost Breakdown</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>NFTs subtotal</span>
                    <span className="font-medium">{totalPrice.toFixed(4)} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Marketplace fee (2.5%)</span>
                    <span>{fees.marketplaceFee.toFixed(4)} ETH</span>
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

              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <Info className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  <div className="font-medium mb-1">About Floor Sweeping</div>
                  <div className="text-xs">
                    All purchases will execute in a single batch transaction for optimal gas efficiency.
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep("configure")}
                  className="flex-1"
                >
                  Back to Configure
                </Button>
                <Button onClick={handleSweep} className="flex-1" size="lg">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Execute Sweep
                </Button>
              </div>
            </div>
          )}

          {/* Transaction Steps */}
          {(currentStep === "approve" || currentStep === "confirm" || currentStep === "pending") && (
            <div className="text-center space-y-4 py-8">
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
                currentStep === "approve" ? "bg-primary/10" :
                currentStep === "confirm" ? "bg-blue-100 dark:bg-blue-950" :
                "bg-yellow-100 dark:bg-yellow-950"
              }`}>
                <Loader2 className={`h-8 w-8 animate-spin ${
                  currentStep === "approve" ? "text-primary" :
                  currentStep === "confirm" ? "text-blue-600" :
                  "text-yellow-600"
                }`} />
              </div>
              <div>
                <h3 className="font-semibold mb-2">
                  {currentStep === "approve" && "Approve Floor Sweep"}
                  {currentStep === "confirm" && "Confirming Sweep"}
                  {currentStep === "pending" && "Processing Floor Sweep"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {currentStep === "approve" && "Please approve the batch transaction in your wallet"}
                  {currentStep === "confirm" && "Your floor sweep is being confirmed..."}
                  {currentStep === "pending" && `Processing ${processedCount} of ${selectedNFTs.length} purchases...`}
                </p>
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
                <h3 className="font-semibold mb-2">
                  {failedPurchases.length > 0 ? "Partial Sweep Complete" : "Floor Sweep Successful!"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Successfully purchased {successfulPurchases.length} of {selectedNFTs.length} NFTs
                </p>
                {failedPurchases.length > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg mb-4">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                    <div className="text-sm text-yellow-600 dark:text-yellow-400 text-left">
                      {failedPurchases.length} items could not be purchased (may have been sold)
                    </div>
                  </div>
                )}
                <div className="bg-muted/50 p-4 rounded-lg mb-4">
                  <div className="text-sm">
                    <div className="font-medium">Sweep Summary</div>
                    <div className="text-muted-foreground mt-1">
                      {successfulPurchases.length > 0 ? (
                        <>
                          Average price: {(totalPrice / successfulPurchases.length).toFixed(4)} ETH per NFT
                        </>
                      ) : (
                        "No NFTs purchased"
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={resetDialog}>
                    Close
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
                <h3 className="font-semibold mb-2">Floor Sweep Failed</h3>
                <p className="text-sm text-muted-foreground mb-4">{error}</p>
                {processedCount > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg mb-4">
                    <Info className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                    <div className="text-sm text-yellow-600 dark:text-yellow-400 text-left">
                      {processedCount} of {selectedNFTs.length} NFTs were successfully purchased.
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetDialog} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleSweep} className="flex-1">
                    Retry Sweep
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