"use client";

import { useState, useEffect } from "react";
import { MediaRenderer } from "@/components/MediaRenderer";
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
  Timer
} from "lucide-react";
import { ConnectButton } from "thirdweb/react";
import { client } from "@/lib/thirdweb";
import { PriceTicker } from "./price-ticker";
import { TransactionConfidenceMeter } from "./transaction-confidence-meter";

export interface NFTTransactionPanelProps {
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

type TransactionStep = "details" | "checkout" | "approve" | "confirm" | "pending" | "success" | "error";

interface PriceHistory {
  date: string;
  price: number;
  type: "sale" | "list" | "offer";
}

const MOCK_PRICE_HISTORY: PriceHistory[] = [
  { date: "2024-01-15", price: 2.8, type: "sale" },
  { date: "2024-01-10", price: 2.5, type: "list" },
  { date: "2024-01-05", price: 3.1, type: "sale" },
  { date: "2023-12-28", price: 2.2, type: "offer" },
  { date: "2023-12-20", price: 2.9, type: "sale" }
];

const MOCK_COLLECTION_STATS = {
  floorPrice: 2.45,
  volume24h: 147.3,
  volume7d: 892.1,
  owners: 3247,
  totalSupply: 10000,
  floorChange24h: 5.2
};

export function NFTTransactionPanel({ open, onOpenChange, nft, mode }: NFTTransactionPanelProps) {
  const [currentStep, setCurrentStep] = useState<TransactionStep>("details");
  const [offerAmount, setOfferAmount] = useState("");
  const [offerDuration, setOfferDuration] = useState("7");
  const [quantity, setQuantity] = useState(1);
  const [useWETH, setUseWETH] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetPanel = () => {
    setCurrentStep("details");
    setOfferAmount("");
    setQuantity(1);
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

        {/* Progress Bar */}
        {currentStep !== "details" && currentStep !== "error" && (
          <div className="px-6 py-3 border-b bg-background flex-shrink-0">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>Transaction Progress</span>
              <span>{Math.round(getStepProgress())}%</span>
            </div>
            <Progress value={getStepProgress()} className="h-2" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Transaction Details */}
          {currentStep === "details" && (
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

                  {/* Advanced Options */}
                  <Card>
                    <CardHeader className="pb-2">
                      <Button
                        variant="ghost"
                        className="justify-between p-0 h-auto"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                      >
                        <CardTitle className="text-sm font-medium">Advanced Options</CardTitle>
                        {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </CardHeader>
                    {showAdvanced && (
                      <CardContent className="pt-0 space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Auto-approve future transactions</Label>
                          <Switch />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Enable push notifications</Label>
                          <Switch />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Priority gas fees</Label>
                          <Switch />
                        </div>
                      </CardContent>
                    )}
                  </Card>

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
                  {/* Ownership */}
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
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Creator</span>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">CR</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">CyberStudio</span>
                          <Badge variant="secondary" className="text-xs">
                            <Crown className="h-3 w-3 mr-1" />
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Contract Details */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Contract Details</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Contract Address</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono">
                            {nft.contractAddress ? `${nft.contractAddress.substring(0, 6)}...${nft.contractAddress.substring(38)}` : "0x1234...5678"}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => copyAddress(nft.contractAddress || "0x1234567890123456789012345678901234567890")}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Token ID</span>
                        <span className="text-sm font-mono">{nft.tokenId || nft.id}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Token Standard</span>
                        <Badge variant="outline" className="text-xs">ERC-721</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Blockchain</span>
                        <Badge variant="outline" className="text-xs">Ethereum</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Traits */}
                  {nft.traits && Object.keys(nft.traits).length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Traits</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-2 gap-3">
                          {Object.entries(nft.traits).map(([key, value]) => (
                            <div key={key} className="p-3 rounded-lg border bg-muted/50">
                              <div className="text-xs text-muted-foreground uppercase tracking-wide">{key}</div>
                              <div className="font-medium">{value}</div>
                              <div className="text-xs text-muted-foreground">
                                {Math.floor(Math.random() * 15 + 1)}% rarity
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Price History */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Price History</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {MOCK_PRICE_HISTORY.map((item, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${
                                item.type === "sale" ? "bg-green-500" :
                                item.type === "list" ? "bg-blue-500" :
                                "bg-orange-500"
                              }`} />
                              <span className="text-sm capitalize">{item.type}</span>
                              <span className="text-xs text-muted-foreground">{item.date}</span>
                            </div>
                            <span className="text-sm font-medium">{item.price} ETH</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Transaction Steps */}
          {(currentStep === "checkout" || currentStep === "approve" || currentStep === "confirm" || currentStep === "pending") && (
            <div className="flex items-center justify-center min-h-[400px] p-6">
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
                    {currentStep === "approve" && "Approve Transaction"}
                    {currentStep === "confirm" && "Confirming Transaction"}
                    {currentStep === "pending" && "Transaction Pending"}
                  </h3>
                  <p className="text-muted-foreground">
                    {currentStep === "checkout" && "Setting up your transaction details..."}
                    {currentStep === "approve" && "Please approve the transaction in your wallet"}
                    {currentStep === "confirm" && "Your transaction is being processed..."}
                    {currentStep === "pending" && "Waiting for blockchain confirmation..."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Success Step */}
          {currentStep === "success" && (
            <div className="flex items-center justify-center min-h-[400px] p-6">
              <div className="text-center space-y-4 max-w-sm">
                <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    {isBuyMode ? "Purchase Successful!" : "Offer Submitted!"}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {isBuyMode 
                      ? `Congratulations! You now own ${nft.name}`
                      : `Your offer of ${numericOffer} ETH is now active`
                    }
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      View Transaction
                    </Button>
                    <Button size="sm" className="flex-1" onClick={resetPanel}>
                      Done
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Step */}
          {currentStep === "error" && (
            <div className="flex items-center justify-center min-h-[400px] p-6">
              <div className="text-center space-y-4 max-w-sm">
                <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Transaction Failed</h3>
                  <p className="text-muted-foreground mb-4">{error}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={resetPanel} className="flex-1">
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
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}