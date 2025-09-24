"use client";

import React, { useState, useEffect } from "react";
import { MediaRenderer } from "@/components/MediaRenderer";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { 
  Zap, 
  Tag,
  Crown,
  Shield,
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  Eye,
  Heart,
  Share2,
  ExternalLink,
  Check,
  Loader2,
  AlertTriangle,
  Info,
  Star,
  BarChart3,
  Activity,
  DollarSign,
  Sparkles,
  ArrowRight,
  Copy,
  X,
  ChevronDown,
  ChevronUp,
  Flame,
  Users,
  Timer,
  Minimize2
} from "lucide-react";
import { ConnectButton } from "thirdweb/react";
import { client } from "@/lib/thirdweb";
import { PriceTicker } from "../nft/price-ticker";
import { TransactionConfidenceMeter } from "../nft/transaction-confidence-meter";
import { useTransaction, TransactionNFT } from "@/contexts/transaction-context";

export interface EnhancedTransactionPanelProps {
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
    contractAddress?: string;
    tokenId?: string;
    owner?: string;
    creator?: string;
    royalty?: number;
    traits?: Record<string, string>;
    floorPrice?: number;
    topBid?: number;
    views?: number;
    likes?: number;
    rank?: number;
  } | null;
  mode: "buy" | "offer";
}

const MOCK_COLLECTION_STATS = {
  floorPrice: 2.45,
  volume24h: 147.3,
  volume7d: 892.1,
  owners: 3247,
  totalSupply: 10000,
  floorChange24h: 5.2
};

export function EnhancedTransactionPanel({ open, onOpenChange, nft, mode }: EnhancedTransactionPanelProps) {
  const { state, startTransaction, updateStep, minimizeTransaction, setTxHash, setError, completeTransaction, resetTransaction } = useTransaction();
  
  const [offerAmount, setOfferAmount] = useState("");
  const [offerDuration, setOfferDuration] = useState("7");
  const [quantity, setQuantity] = useState(1);
  const [useWETH, setUseWETH] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMinimizing, setIsMinimizing] = useState(false);

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
      // Start the global transaction
      const transactionNFT: TransactionNFT = {
        id: nft.id,
        name: nft.name,
        image: nft.image,
        price: nft.price,
        collection: nft.collection,
        contractAddress: nft.contractAddress,
        tokenId: nft.tokenId,
      };

      startTransaction(transactionNFT, mode, total);

      // Close sidebar immediately for fluid experience
      onOpenChange(false);

      // Continue transaction steps in background
      setTimeout(async () => {
        await new Promise(resolve => setTimeout(resolve, 1500));
        updateStep("approve", 40, 30000);
        
        await new Promise(resolve => setTimeout(resolve, 2500));
        updateStep("confirm", 60, 20000);
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        updateStep("pending", 80, 15000);
        
        // Simulate getting transaction hash
        const mockTxHash = `0x${Math.random().toString(16).slice(2, 66)}`;
        setTxHash(mockTxHash);
        
        await new Promise(resolve => setTimeout(resolve, 4000));
        completeTransaction();
      }, 100);
      
    } catch (err) {
      setError("Transaction failed. Please try again.");
    }
  };

  const handleMinimize = () => {
    setIsMinimizing(true);
    
    // Add a subtle animation delay
    setTimeout(() => {
      minimizeTransaction();
      onOpenChange(false);
    }, 300);
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetPanel = () => {
    setOfferAmount("");
    setQuantity(1);
    setAgreedToTerms(false);
    resetTransaction();
    onOpenChange(false);
  };

  const getOfferComparison = () => {
    if (!numericOffer || isOfferMode === false) return null;
    
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

    if (nft.topBid) {
      const diff = ((numericOffer - nft.topBid) / nft.topBid) * 100;
      comparisons.push({
        label: "vs Top Bid",
        value: nft.topBid,
        diff: diff,
        type: diff >= 0 ? "above" : "below"
      });
    }

    return comparisons;
  };

  return (
    <Sheet open={open} onOpenChange={resetPanel}>
      <SheetContent 
        side="right" 
        className="w-full sm:w-[480px] lg:w-[520px] p-0 flex flex-col max-h-screen overflow-hidden"
      >
        <AnimatePresence>
          {isMinimizing && (
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 1 }}
                animate={{ scale: 0.8, y: 50 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-3 bg-black/90 backdrop-blur-xl border rounded-lg p-4 text-white"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Minimizing to pill...</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <SheetHeader className="p-6 pb-4 border-b bg-muted/30 flex-shrink-0">
          <div className="flex items-start gap-4">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-border">
              <MediaRenderer src={nft.image} alt={nft.name} className="" aspectRatio="square" />
              {(nft.rarity === "Legendary" || nft.rarity === "Mythic") && (
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 via-transparent to-purple-600/20" />
              )}
              {(nft.rarity === "Legendary" || nft.rarity === "Mythic") && (
                <Crown className="absolute top-1 right-1 h-4 w-4 text-yellow-400 drop-shadow-sm" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <SheetTitle className="text-xl font-bold truncate">{nft.name}</SheetTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setIsLiked(!isLiked)}
                >
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
                </Button>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <SheetDescription className="text-base font-medium">
                  {nft.collection}
                </SheetDescription>
                <Badge variant="secondary" className="text-xs">
                  <Crown className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              </div>
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
                  <Badge variant="outline" className="text-xs">
                    #{nft.rank}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            <Tabs defaultValue="purchase" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="purchase" className="gap-2">
                  <Zap className="h-4 w-4" />
                  {isBuyMode ? "Buy Now" : "Make Offer"}
                </TabsTrigger>
                <TabsTrigger value="details" className="gap-2">
                  <Info className="h-4 w-4" />
                  Details
                </TabsTrigger>
              </TabsList>

              <TabsContent value="purchase" className="space-y-6">
                {/* Price Section */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {isBuyMode ? "Current Price" : "Make an Offer"}
                      </CardTitle>
                      {isBuyMode && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="secondary" className="gap-1">
                                <TrendingUp className="h-3 w-3" />
                                +{MOCK_COLLECTION_STATS.floorChange24h}%
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              Floor price increased {MOCK_COLLECTION_STATS.floorChange24h}% in 24h
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
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
                        
                        {/* Quantity Selector */}
                        <div className="flex items-center justify-between">
                          <Label htmlFor="quantity" className="text-sm font-medium">Quantity</Label>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => setQuantity(Math.max(1, quantity - 1))}
                              disabled={quantity <= 1}
                            >
                              -
                            </Button>
                            <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => setQuantity(quantity + 1)}
                              disabled={quantity >= 5}
                            >
                              +
                            </Button>
                          </div>
                        </div>

                        {/* Payment Method */}
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

                        {/* Price Comparisons */}
                        {numericOffer > 0 && getOfferComparison() && (
                          <div className="grid grid-cols-1 gap-2">
                            {getOfferComparison()?.map((comparison, index) => (
                              <div key={index} className={`p-3 rounded-lg border text-sm ${ 
                                comparison.type === "above" 
                                  ? "bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800"
                                  : "bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800"
                              }`}>
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">{comparison.label}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{comparison.value} ETH</span>
                                    <Badge variant={comparison.type === "above" ? "default" : "secondary"} className="text-xs">
                                      {comparison.diff >= 0 ? "+" : ""}{comparison.diff.toFixed(1)}%
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Offer Duration */}
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

                {/* Market Insights */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Market Insights
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
                      <div>
                        <div className="text-xs text-muted-foreground">Top Bid</div>
                        <div className="font-semibold">{nft.topBid || "No bids"} ETH</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Owners</div>
                        <div className="font-semibold">{MOCK_COLLECTION_STATS.owners}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Transaction Confidence */}
                <TransactionConfidenceMeter
                  nft={nft}
                  mode={mode}
                  offerAmount={numericOffer}
                />

                {/* Fee Breakdown */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Fee Breakdown</CardTitle>
                  </CardHeader>
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
                      <span className="text-muted-foreground">Gas estimate</span>
                      <span>{fees.gasEstimate} ETH</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Protocol fee</span>
                      <span>{fees.protocolFee.toFixed(4)} ETH</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>{total.toFixed(4)} ETH</span>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      ~${(total * 2650).toFixed(2)} USD
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="details" className="space-y-6">
                {/* Same details content as the original */}
                {/* Ownership, Contract Details, Traits, Price History - keeping original content */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Ownership</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Owner</span>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">0x</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">
                          {nft.owner ? `${nft.owner.substring(0, 6)}...${nft.owner.substring(38)}` : "0x1234...5678"}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => copyAddress(nft.owner || "0x1234567890123456789012345678901234567890")}
                        >
                          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Footer */}
        <SheetFooter className="p-6 pt-4 border-t bg-background flex-shrink-0">
          <div className="w-full space-y-4">
            {/* Security Notice */}
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/50 rounded-lg">
              <Shield className="h-4 w-4 text-green-600 flex-shrink-0" />
              <div className="text-sm text-green-600 dark:text-green-400">
                <div className="font-medium">Secured by Smart Contract</div>
                <div className="text-xs opacity-90">Your transaction is protected by blockchain security</div>
              </div>
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start gap-3">
              <Switch
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={setAgreedToTerms}
                className="mt-0.5"
              />
              <Label htmlFor="terms" className="text-sm leading-relaxed">
                I agree to the <span className="text-primary underline cursor-pointer">Terms of Service</span> and understand the risks involved in NFT transactions
              </Label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={resetPanel}
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
                    Buy for {total.toFixed(3)} ETH
                  </>
                ) : (
                  <>
                    <Tag className="h-4 w-4" />
                    Submit Offer
                  </>
                )}
              </Button>
            </div>

            {/* Minimize Button */}
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMinimize}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <Minimize2 className="h-4 w-4" />
                <span className="text-xs">Minimize to pill</span>
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}