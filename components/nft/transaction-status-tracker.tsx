"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { 
  Check, 
  Loader2, 
  AlertTriangle, 
  ExternalLink,
  Clock,
  Activity,
  Zap,
  ShoppingBag,
  Tag
} from "lucide-react";

export interface Transaction {
  id: string;
  type: "buy" | "offer" | "bulk_buy" | "bulk_offer";
  status: "pending" | "confirmed" | "failed" | "success";
  hash?: string;
  items: {
    id: string;
    name: string;
    image: string;
    price?: number;
  }[];
  totalAmount: number;
  createdAt: Date;
  confirmations?: number;
  requiredConfirmations?: number;
  gasUsed?: string;
  error?: string;
}

export interface TransactionStatusTrackerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
}

export function TransactionStatusTracker({ 
  open, 
  onOpenChange, 
  transaction 
}: TransactionStatusTrackerProps) {
  const [localConfirmations, setLocalConfirmations] = useState(0);

  useEffect(() => {
    if (!transaction || transaction.status !== "pending") return;

    const interval = setInterval(() => {
      setLocalConfirmations(prev => {
        const newCount = prev + 1;
        if (newCount >= (transaction.requiredConfirmations || 12)) {
          clearInterval(interval);
        }
        return newCount;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [transaction]);

  if (!transaction) return null;

  const getStatusIcon = () => {
    switch (transaction.status) {
      case "pending":
        return <Loader2 className="h-8 w-8 text-yellow-600 animate-spin" />;
      case "confirmed":
        return <Clock className="h-8 w-8 text-blue-600" />;
      case "success":
        return <Check className="h-8 w-8 text-green-600" />;
      case "failed":
        return <AlertTriangle className="h-8 w-8 text-red-600" />;
    }
  };

  const getStatusColor = () => {
    switch (transaction.status) {
      case "pending": return "bg-yellow-100 dark:bg-yellow-950";
      case "confirmed": return "bg-blue-100 dark:bg-blue-950";
      case "success": return "bg-green-100 dark:bg-green-950";
      case "failed": return "bg-red-100 dark:bg-red-950";
    }
  };

  const getTypeLabel = () => {
    switch (transaction.type) {
      case "buy": return "Purchase";
      case "offer": return "Offer";
      case "bulk_buy": return "Bulk Purchase";
      case "bulk_offer": return "Bulk Offers";
    }
  };

  const getTypeIcon = () => {
    switch (transaction.type) {
      case "buy": return <Zap className="h-4 w-4" />;
      case "offer": return <Tag className="h-4 w-4" />;
      case "bulk_buy": return <ShoppingBag className="h-4 w-4" />;
      case "bulk_offer": return <Activity className="h-4 w-4" />;
    }
  };

  const getProgress = () => {
    if (transaction.status === "success") return 100;
    if (transaction.status === "failed") return 0;
    if (transaction.status === "confirmed") return 85;
    
    const confirmations = transaction.confirmations || localConfirmations;
    const required = transaction.requiredConfirmations || 12;
    return Math.min((confirmations / required) * 80, 80);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getTypeIcon()}
            Transaction Status
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Section */}
          <div className="text-center space-y-4">
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${getStatusColor()}`}>
              {getStatusIcon()}
            </div>
            
            <div>
              <h3 className="font-semibold mb-1">
                {transaction.status === "pending" && "Transaction Pending"}
                {transaction.status === "confirmed" && "Transaction Confirmed"}
                {transaction.status === "success" && "Transaction Successful"}
                {transaction.status === "failed" && "Transaction Failed"}
              </h3>
              
              <p className="text-sm text-muted-foreground mb-2">
                {transaction.status === "pending" && "Your transaction is being processed on the blockchain"}
                {transaction.status === "confirmed" && "Transaction confirmed, waiting for final settlement"}
                {transaction.status === "success" && "Your transaction has been completed successfully"}
                {transaction.status === "failed" && "Your transaction encountered an error"}
              </p>

              <Badge variant="outline" className="text-xs">
                {getTypeLabel()} • {formatTimeAgo(transaction.createdAt)}
              </Badge>
            </div>
          </div>

          {/* Progress Bar */}
          {(transaction.status === "pending" || transaction.status === "confirmed") && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Confirmations</span>
                <span>
                  {transaction.confirmations || localConfirmations} / {transaction.requiredConfirmations || 12}
                </span>
              </div>
              <Progress value={getProgress()} className="h-2" />
              <div className="text-xs text-muted-foreground text-center">
                Estimated completion: ~{Math.max(1, 12 - (transaction.confirmations || localConfirmations))} minutes
              </div>
            </div>
          )}

          {/* Transaction Details */}
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Transaction ID</span>
              <span className="font-mono text-xs">
                {transaction.id.substring(0, 8)}...{transaction.id.substring(transaction.id.length - 4)}
              </span>
            </div>
            
            {transaction.hash && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Hash</span>
                <Button variant="link" className="h-auto p-0 text-xs font-mono">
                  {transaction.hash.substring(0, 6)}...{transaction.hash.substring(transaction.hash.length - 4)}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Items</span>
              <span>{transaction.items.length} NFT{transaction.items.length > 1 ? "s" : ""}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Amount</span>
              <span className="font-medium">{transaction.totalAmount.toFixed(4)} ETH</span>
            </div>

            {transaction.gasUsed && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Gas Used</span>
                <span>{transaction.gasUsed}</span>
              </div>
            )}

            {transaction.error && (
              <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-600 dark:text-red-400">
                    <div className="font-medium mb-1">Error Details</div>
                    <div className="text-xs">{transaction.error}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Items Preview */}
          {transaction.items.length <= 3 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Items</h4>
              <div className="space-y-2">
                {transaction.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                    <div className="w-8 h-8 bg-muted rounded-md flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{item.name}</div>
                      {item.price && (
                        <div className="text-xs text-muted-foreground">{item.price} ETH</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {transaction.hash && (
              <Button variant="outline" className="flex-1" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Explorer
              </Button>
            )}
            
            <Button 
              onClick={() => onOpenChange(false)} 
              className="flex-1" 
              size="sm"
              variant={transaction.status === "success" ? "default" : "outline"}
            >
              {transaction.status === "success" ? "Done" : "Close"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}