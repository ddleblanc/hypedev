"use client";

import { useState, useEffect } from "react";
import { MediaRenderer } from "@/components/MediaRenderer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose
} from "@/components/ui/drawer";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  Zap, 
  Tag,
  Crown,
  Shield,
  TrendingUp,
  Check,
  Loader2,
  AlertTriangle,
  Info,
  BarChart3,
  Copy,
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Heart,
  Eye
} from "lucide-react";
import { PriceTicker } from "./price-ticker";
import { TransactionConfidenceMeter } from "./transaction-confidence-meter";

export interface NFTTransactionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nft: {
    id: string;
    name: string;
    image: string;
    price?: number;
    lastSale?: number;
    rarity: string;
    collection: string;
    floorPrice?: number;
    topBid?: number;
    views?: number;
    likes?: number;
    rank?: number;
    royalty?: number;
  } | null;
  mode: "buy" | "offer";
}

type TransactionStep = "details" | "checkout" | "approve" | "confirm" | "pending" | "success" | "error";

const MOCK_COLLECTION_STATS = {
  floorPrice: 2.45,
  volume24h: 147.3,
  floorChange24h: 5.2
};

export function NFTTransactionDrawer({ open, onOpenChange, nft, mode }: NFTTransactionDrawerProps) {
  const [currentStep, setCurrentStep] = useState<TransactionStep>("details");
  const [offerAmount, setOfferAmount] = useState("");
  const [offerDuration, setOfferDuration] = useState("7");
  const [useWETH, setUseWETH] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showFees, setShowFees] = useState(false);
  const [error, setError] = useState("");
  const [isLiked, setIsLiked] = useState(false);

  if (!nft) return null;

  const isBuyMode = mode === "buy" && nft.price;
  const isOfferMode = mode === "offer" || !nft.price;
  const numericOffer = parseFloat(offerAmount) || 0;
  const transactionAmount = isBuyMode ? nft.price! : numericOffer;

  const fees = {
    marketplaceFee: transactionAmount * 0.025,
    creatorRoyalty: transactionAmount * (nft.royalty || 5) / 100,
    gasEstimate: 0.008,
    protocolFee: transactionAmount * 0.005,
  };

  const total = transactionAmount + fees.marketplaceFee + fees.creatorRoyalty + fees.gasEstimate + fees.protocolFee;

  const handleTransaction = async () => {
    try {
      setCurrentStep("checkout");
      await new Promise(resolve => setTimeout(resolve, 1500));
      setCurrentStep("approve");
      await new Promise(resolve => setTimeout(resolve, 2000));
      setCurrentStep("confirm");
      await new Promise(resolve => setTimeout(resolve, 2500));
      setCurrentStep("pending");
      await new Promise(resolve => setTimeout(resolve, 3000));
      setCurrentStep("success");
    } catch (err) {
      setError("Transaction failed. Please try again.");
      setCurrentStep("error");
    }
  };

  const resetDrawer = () => {
    setCurrentStep("details");
    setOfferAmount("");
    setError("");
    setAgreedToTerms(false);
    onOpenChange(false);
  };

  const getStepProgress = () => {
    switch (currentStep) {
      case "details": return 0;
      case "checkout": return 20;
      case "approve": return 40;
      case "confirm": return 60;
      case "pending": return 80;
      case "success": return 100;
      default: return 0;
    }
  };

  return (
    <Drawer open={open} onOpenChange={resetDrawer}>
      <DrawerContent className="max-h-[85vh] flex flex-col">
        {/* Header */}
        <DrawerHeader className="pb-4 border-b bg-muted/30 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden ring-2 ring-border flex-shrink-0">
              <MediaRenderer src={nft.image} alt={nft.name} className="" aspectRatio="square" />
              {(nft.rarity === "Legendary" || nft.rarity === "Mythic") && (
                <Crown className="absolute top-1 right-1 h-4 w-4 text-yellow-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <DrawerTitle className="text-lg font-bold truncate pr-2">{nft.name}</DrawerTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setIsLiked(!isLiked)}
                  >
                    <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
                  </Button>
                  <DrawerClose asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <X className="h-4 w-4" />
                    </Button>
                  </DrawerClose>
                </div>
              </div>
              <DrawerDescription className="text-base font-medium mb-2">
                {nft.collection}
              </DrawerDescription>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {nft.views || 0}
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  {nft.likes || 0}
                </div>
                {nft.rank && (
                  <Badge variant="outline" className="text-xs">#{nft.rank}</Badge>
                )}
              </div>
            </div>
          </div>
        </DrawerHeader>

        {/* Progress Bar */}
        {currentStep !== "details" && currentStep !== "error" && (
          <div className="px-4 py-3 border-b bg-background flex-shrink-0">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>Transaction Progress</span>
              <span>{Math.round(getStepProgress())}%</span>
            </div>
            <Progress value={getStepProgress()} className="h-2" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4">
          {currentStep === "details" && (
            <div className="py-6 space-y-6">
              {/* Price Section */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">
                      {isBuyMode ? "Purchase" : "Make Offer"}
                    </CardTitle>
                    {isBuyMode && (
                      <Badge variant="secondary" className="gap-1">
                        <TrendingUp className="h-3 w-3" />
                        +{MOCK_COLLECTION_STATS.floorChange24h}%
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {isBuyMode ? (
                    <div className="space-y-4">
                      <div className="flex flex-col gap-2">
                        <PriceTicker basePrice={nft.price || 0} />
                        <span className="text-sm text-muted-foreground">
                          ~${((nft.price || 0) * 2650).toFixed(0)} USD
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Pay with WETH</Label>
                        <Switch checked={useWETH} onCheckedChange={setUseWETH} />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="offer-amount" className="text-sm font-medium">Offer Amount (ETH)</Label>
                        <Input
                          id="offer-amount"
                          type="number"
                          placeholder="0.00"
                          value={offerAmount}
                          onChange={(e) => setOfferAmount(e.target.value)}
                          step="0.001"
                          min="0"
                          className="text-lg font-semibold"
                        />
                        {numericOffer > 0 && (
                          <div className="text-sm text-muted-foreground">
                            ~${(numericOffer * 2650).toFixed(0)} USD
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Offer Duration</Label>
                        <Select value={offerDuration} onValueChange={setOfferDuration}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 Day</SelectItem>
                            <SelectItem value="3">3 Days</SelectItem>
                            <SelectItem value="7">1 Week</SelectItem>
                            <SelectItem value="14">2 Weeks</SelectItem>
                            <SelectItem value="30">1 Month</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Transaction Confidence */}
              <TransactionConfidenceMeter
                nft={nft}
                mode={mode}
                offerAmount={numericOffer}
              />

              {/* Market Stats */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Market Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground">Floor Price</div>
                      <div className="font-semibold">{MOCK_COLLECTION_STATS.floorPrice} ETH</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">24h Volume</div>
                      <div className="font-semibold">{MOCK_COLLECTION_STATS.volume24h} ETH</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Fee Breakdown */}
              <Card>
                <CardHeader className="pb-2">
                  <Button
                    variant="ghost"
                    className="justify-between p-0 h-auto w-full"
                    onClick={() => setShowFees(!showFees)}
                  >
                    <CardTitle className="text-base font-semibold">
                      Total: {total.toFixed(4)} ETH
                    </CardTitle>
                    {showFees ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CardHeader>
                {showFees && (
                  <CardContent className="pt-0 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Item price</span>
                      <span className="font-medium">{transactionAmount.toFixed(4)} ETH</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Marketplace fee (2.5%)</span>
                      <span>{fees.marketplaceFee.toFixed(4)} ETH</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Creator royalty ({nft.royalty || 5}%)</span>
                      <span>{fees.creatorRoyalty.toFixed(4)} ETH</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Gas + Protocol</span>
                      <span>{(fees.gasEstimate + fees.protocolFee).toFixed(4)} ETH</span>
                    </div>
                    <Separator />
                    <div className="text-right text-xs text-muted-foreground">
                      ~${(total * 2650).toFixed(2)} USD
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Security Notice */}
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/50 rounded-lg">
                <Shield className="h-4 w-4 text-green-600 flex-shrink-0" />
                <div className="text-sm text-green-600 dark:text-green-400">
                  <div className="font-medium">Secured by Smart Contract</div>
                </div>
              </div>

              {/* Terms Agreement */}
              <div className="flex items-start gap-3">
                <Switch
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={setAgreedToTerms}
                  className="mt-0.5 flex-shrink-0"
                />
                <Label htmlFor="terms" className="text-sm leading-relaxed">
                  I agree to the <span className="text-primary underline">Terms of Service</span> and understand the risks
                </Label>
              </div>
            </div>
          )}

          {/* Transaction Steps */}
          {(currentStep === "checkout" || currentStep === "approve" || currentStep === "confirm" || currentStep === "pending") && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4 max-w-sm">
                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
                  currentStep === "checkout" ? "bg-blue-100 dark:bg-blue-950" :
                  currentStep === "approve" ? "bg-primary/10" :
                  currentStep === "confirm" ? "bg-orange-100 dark:bg-orange-950" :
                  "bg-yellow-100 dark:bg-yellow-950"
                }`}>
                  <Loader2 className={`h-8 w-8 animate-spin ${
                    currentStep === "checkout" ? "text-blue-600" :
                    currentStep === "approve" ? "text-primary" :
                    currentStep === "confirm" ? "text-orange-600" :
                    "text-yellow-600"
                  }`} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    {currentStep === "checkout" && "Preparing Transaction"}
                    {currentStep === "approve" && "Approve in Wallet"}
                    {currentStep === "confirm" && "Confirming Transaction"}
                    {currentStep === "pending" && "Transaction Pending"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {currentStep === "checkout" && "Setting up your transaction..."}
                    {currentStep === "approve" && "Please approve in your wallet"}
                    {currentStep === "confirm" && "Transaction is being processed..."}
                    {currentStep === "pending" && "Waiting for confirmation..."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Success Step */}
          {currentStep === "success" && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4 max-w-sm">
                <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    {isBuyMode ? "Purchase Complete!" : "Offer Submitted!"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {isBuyMode 
                      ? `You now own ${nft.name}`
                      : `Your offer is now active`
                    }
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      View Transaction
                    </Button>
                    <Button size="sm" className="flex-1" onClick={resetDrawer}>
                      Done
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Step */}
          {currentStep === "error" && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4 max-w-sm">
                <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Transaction Failed</h3>
                  <p className="text-sm text-muted-foreground mb-4">{error}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={resetDrawer} className="flex-1">
                      Cancel
                    </Button>
                    <Button onClick={() => setCurrentStep("details")} className="flex-1">
                      Try Again
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {currentStep === "details" && (
          <DrawerFooter className="pt-4 border-t bg-background flex-shrink-0">
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={resetDrawer}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleTransaction}
                disabled={!agreedToTerms || (isOfferMode && !numericOffer)}
                className="flex-1 gap-2"
                size="lg"
              >
                {isBuyMode ? (
                  <>
                    <Zap className="h-4 w-4" />
                    Buy {total.toFixed(3)} ETH
                  </>
                ) : (
                  <>
                    <Tag className="h-4 w-4" />
                    Submit Offer
                  </>
                )}
              </Button>
            </div>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}