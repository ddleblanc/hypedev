"use client";

import { useState, useEffect } from "react";
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
  Zap, 
  Crown,
  AlertTriangle,
  Info,
  Check,
  Loader2,
  Settings,
  Target,
  Filter,
  Sparkles
} from "lucide-react";

interface FloorNFT {
  id: string;
  name: string;
  image: string;
  price: number;
  rarity: string;
  rank?: number;
  lastSale?: number;
  selected: boolean;
}

export interface SweepFloorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection: {
    name: string;
    floorPrice: number;
    totalSupply: number;
  };
}

type SweepStep = "configure" | "review" | "approve" | "confirm" | "pending" | "success" | "error";

const MOCK_FLOOR_NFTS: FloorNFT[] = [
  {
    id: "1",
    name: "Cosmic Dragon #1234",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96",
    price: 2.45,
    rarity: "Common",
    rank: 1234,
    lastSale: 2.8,
    selected: true
  },
  {
    id: "2",
    name: "Cosmic Dragon #5678",
    image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43",
    price: 2.47,
    rarity: "Common",
    rank: 2341,
    lastSale: 2.6,
    selected: true
  },
  {
    id: "3",
    name: "Cosmic Dragon #9999",
    image: "https://images.unsplash.com/photo-1614732414444-096e5f1122d5",
    price: 2.48,
    rarity: "Rare",
    rank: 567,
    lastSale: 3.1,
    selected: true
  },
  {
    id: "4",
    name: "Cosmic Dragon #0001",
    image: "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3",
    price: 2.52,
    rarity: "Common",
    rank: 8901,
    lastSale: 2.4,
    selected: false
  },
  {
    id: "5",
    name: "Cosmic Dragon #7777",
    image: "https://images.unsplash.com/photo-1557672172-298e090bd0f1",
    price: 2.55,
    rarity: "Epic",
    rank: 123,
    lastSale: 4.2,
    selected: false
  },
];

export function SweepFloorDialog({ open, onOpenChange, collection }: SweepFloorDialogProps) {
  const [currentStep, setCurrentStep] = useState<SweepStep>("configure");
  const [maxBudget, setMaxBudget] = useState("");
  const [maxItems, setMaxItems] = useState("10");
  const [rarityFilter, setRarityFilter] = useState("all");
  const [priceBuffer, setPriceBuffer] = useState("5");
  const [autoSelect, setAutoSelect] = useState(true);
  const [floorNFTs, setFloorNFTs] = useState(MOCK_FLOOR_NFTS);
  const [error, setError] = useState("");
  const [processedCount, setProcessedCount] = useState(0);

  const selectedNFTs = floorNFTs.filter(nft => nft.selected);
  const totalPrice = selectedNFTs.reduce((sum, nft) => sum + nft.price, 0);
  const fees = {
    marketplaceFee: totalPrice * 0.025,
    gasEstimate: selectedNFTs.length * 0.008,
  };
  const grandTotal = totalPrice + fees.marketplaceFee + fees.gasEstimate;

  useEffect(() => {
    if (autoSelect && maxItems) {
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
  }, [maxBudget, maxItems, rarityFilter, autoSelect]);

  const handleSweep = async () => {
    try {
      setCurrentStep("approve");
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setCurrentStep("confirm");
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setCurrentStep("pending");
      
      // Simulate processing each NFT
      for (let i = 0; i < selectedNFTs.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setProcessedCount(i + 1);
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      setCurrentStep("success");
    } catch (err) {
      setError("Floor sweep failed. Some items may have been processed.");
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
                  <Badge variant="outline">
                    Floor: {collection.floorPrice} ETH
                  </Badge>
                </div>

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
                <h3 className="font-semibold mb-2">Floor Sweep Successful!</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Successfully purchased {selectedNFTs.length} NFTs for {grandTotal.toFixed(4)} ETH
                </p>
                <div className="bg-muted/50 p-4 rounded-lg mb-4">
                  <div className="text-sm">
                    <div className="font-medium">Sweep Summary</div>
                    <div className="text-muted-foreground mt-1">
                      Average price: {(totalPrice / selectedNFTs.length).toFixed(4)} ETH per NFT
                    </div>
                    <div className="text-muted-foreground">
                      Floor discount: ~{((collection.floorPrice - (totalPrice / selectedNFTs.length)) / collection.floorPrice * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    View Collection
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