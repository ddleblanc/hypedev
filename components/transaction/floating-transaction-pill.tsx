"use client";

import React, { useState, useEffect } from 'react';
import { MediaRenderer } from '@/components/MediaRenderer';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  Zap, 
  Tag,
  Check, 
  Loader2, 
  AlertTriangle, 
  ChevronUp,
  ChevronDown,
  X,
  ExternalLink,
  Clock,
  Sparkles,
  TrendingUp,
  Shield,
  Copy,
  Wallet
} from 'lucide-react';
import { useTransaction } from '@/contexts/transaction-context';
import { cn } from '@/lib/utils';

export function FloatingTransactionPill() {
  const { state, minimizeTransaction, expandTransaction, resetTransaction } = useTransaction();
  const [isExpanded, setIsExpanded] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [copied, setCopied] = useState(false);

  // Update time elapsed
  useEffect(() => {
    if (!state.isActive || !state.startTime) return;

    const interval = setInterval(() => {
      setTimeElapsed(Date.now() - state.startTime!);
    }, 1000);

    return () => clearInterval(interval);
  }, [state.isActive, state.startTime]);

  // Auto-minimize immediately for smooth transition
  useEffect(() => {
    if (state.isActive && state.step !== "details" && !state.isMinimized) {
      minimizeTransaction(); // Minimize immediately for fluid experience
    }
  }, [state.isActive, state.step, state.isMinimized, minimizeTransaction]);

  // Auto-dismiss after successful completion
  useEffect(() => {
    if (state.step === "success") {
      const timer = setTimeout(() => {
        resetTransaction();
      }, 8000); // Auto-dismiss after 8 seconds
      
      return () => clearTimeout(timer);
    }
  }, [state.step, resetTransaction]);

  if (!state.isActive) return null;

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const getStepText = () => {
    switch (state.step) {
      case "checkout": return "Preparing transaction...";
      case "approve": return "Approve in wallet";
      case "confirm": return "Confirming transaction";
      case "pending": return "Processing on blockchain";
      case "success": return "Transaction successful!";
      case "error": return "Transaction failed";
      default: return "Processing...";
    }
  };

  const getStepIcon = () => {
    switch (state.step) {
      case "checkout":
      case "approve": 
      case "confirm":
      case "pending":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case "success":
        return <Check className="h-4 w-4" />;
      case "error":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin" />;
    }
  };

  const getStepColor = () => {
    switch (state.step) {
      case "checkout": return "text-blue-500";
      case "approve": return "text-purple-500";
      case "confirm": return "text-orange-500";
      case "pending": return "text-yellow-500";
      case "success": return "text-green-500";
      case "error": return "text-red-500";
      default: return "text-blue-500";
    }
  };

  const getBgColor = () => {
    switch (state.step) {
      case "success": return "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20";
      case "error": return "bg-gradient-to-r from-red-500/10 to-rose-500/10 border-red-500/20";
      default: return "bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20";
    }
  };

  const copyTxHash = () => {
    if (state.txHash) {
      navigator.clipboard.writeText(state.txHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      expandTransaction();
    } else {
      minimizeTransaction();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95, x: 50 }}
        animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
        exit={{ opacity: 0, y: 50, scale: 0.95, x: 50 }}
        transition={{ 
          type: "spring", 
          stiffness: 500, 
          damping: 30,
          mass: 0.5
        }}
        className="fixed bottom-6 right-6 z-[100] max-w-sm"
      >
        <Card className={cn(
          "backdrop-blur-xl bg-black/80 border shadow-2xl overflow-hidden",
          getBgColor()
        )}>
          {/* Minimized State */}
          <AnimatePresence mode="wait">
            {!isExpanded ? (
              <motion.div
                key="minimized"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="p-4 cursor-pointer"
                onClick={toggleExpanded}
              >
                <div className="flex items-center gap-3">
                  {/* NFT Image */}
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden ring-2 ring-white/10 flex-shrink-0">
                    <MediaRenderer 
                      src={state.nft?.image || ''} 
                      alt={state.nft?.name || ''} 
                      className="" 
                      aspectRatio="square" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={cn("flex items-center gap-1.5", getStepColor())}>
                        {getStepIcon()}
                        <span className="text-sm font-medium text-white">
                          {state.step === "success" ? "Complete" : "Processing"}
                        </span>
                      </div>
                      {state.mode && (
                        <Badge 
                          variant="secondary" 
                          className="bg-white/10 text-white border-white/20 text-xs"
                        >
                          {state.mode === "buy" ? <Zap className="h-3 w-3 mr-1" /> : <Tag className="h-3 w-3 mr-1" />}
                          {state.mode === "buy" ? "Buy" : "Offer"}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-xs text-white/70 truncate">
                      {state.nft?.name}
                    </div>
                    
                    {/* Progress */}
                    {state.step !== "success" && state.step !== "error" && (
                      <div className="mt-2">
                        <Progress 
                          value={state.progress} 
                          className="h-1.5 bg-white/10"
                        />
                      </div>
                    )}
                  </div>

                  {/* Expand Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ) : (
              /* Expanded State */
              <motion.div
                key="expanded"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="p-6 space-y-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden ring-2 ring-white/10">
                      <MediaRenderer 
                        src={state.nft?.image || ''} 
                        alt={state.nft?.name || ''} 
                        className="" 
                        aspectRatio="square" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm">
                        {state.nft?.name}
                      </h3>
                      <p className="text-xs text-white/70">
                        {state.nft?.collection}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleExpanded}
                      className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    {(state.step === "success" || state.step === "error") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetTransaction}
                        className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={cn("flex items-center gap-2", getStepColor())}>
                      {getStepIcon()}
                      <span className="font-medium text-white">{getStepText()}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {state.step !== "success" && state.step !== "error" && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-white/70">
                        <span>Progress</span>
                        <span>{Math.round(state.progress)}%</span>
                      </div>
                      <Progress 
                        value={state.progress} 
                        className="h-2 bg-white/10"
                      />
                    </div>
                  )}

                  {/* Transaction Details */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-white/70">Amount</span>
                      <div className="text-white font-medium">
                        {state.amount} ETH
                      </div>
                    </div>
                    <div>
                      <span className="text-white/70">Time</span>
                      <div className="text-white font-medium">
                        {formatTime(timeElapsed)}
                      </div>
                    </div>
                  </div>

                  {/* Success State */}
                  {state.step === "success" && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                        <Sparkles className="h-4 w-4 text-green-400" />
                        <div>
                          <div className="text-sm font-medium text-green-400">
                            {state.mode === "buy" ? "Purchase Successful!" : "Offer Submitted!"}
                          </div>
                          <div className="text-xs text-green-400/80">
                            {state.mode === "buy" 
                              ? "NFT is now in your wallet" 
                              : "Your offer is now active"
                            }
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                        >
                          <Wallet className="h-3 w-3 mr-1" />
                          View Wallet
                        </Button>
                        {state.txHash && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={copyTxHash}
                            className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                          >
                            {copied ? (
                              <Check className="h-3 w-3 mr-1" />
                            ) : (
                              <ExternalLink className="h-3 w-3 mr-1" />
                            )}
                            {copied ? "Copied!" : "View Tx"}
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Error State */}
                  {state.step === "error" && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-red-400" />
                        <div>
                          <div className="text-sm font-medium text-red-400">
                            Transaction Failed
                          </div>
                          <div className="text-xs text-red-400/80">
                            {state.error || "Please try again"}
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                        onClick={resetTransaction}
                      >
                        Try Again
                      </Button>
                    </div>
                  )}

                  {/* Security Badge */}
                  {(state.step === "pending" || state.step === "confirm") && (
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <Shield className="h-3 w-3" />
                      <span>Secured by blockchain</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}