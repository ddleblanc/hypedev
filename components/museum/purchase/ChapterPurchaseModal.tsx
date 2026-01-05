"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ShoppingCart,
  Loader2,
  CheckCircle,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { getContract } from "thirdweb";
import { claimTo } from "thirdweb/extensions/erc721";
import { client } from "@/lib/thirdweb";
import { MUSEUM_CHAIN } from "@/lib/museum-contracts";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import type { LegendChapter } from "@prisma/client";

interface ChapterPurchaseModalProps {
  chapter: LegendChapter;
  legendId: string;
  primaryColor: string;
  onClose: () => void;
  onSuccess?: () => void;
}

type PurchaseState =
  | "idle"
  | "checking"
  | "ready"
  | "confirming"
  | "minting"
  | "success"
  | "error";

export function ChapterPurchaseModal({
  chapter,
  legendId,
  primaryColor,
  onClose,
  onSuccess,
}: ChapterPurchaseModalProps) {
  const [state, setState] = useState<PurchaseState>("checking");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const account = useActiveAccount();
  const { mutate: sendTx } = useSendTransaction();

  // Check purchase eligibility
  const { data: canPurchaseData, isLoading: isCheckingEligibility } =
    trpc.museum.purchase.canPurchase.useQuery(
      { legendId, chapterId: chapter.id },
      { enabled: state === "checking" }
    );

  // Get purchase preparation data
  const { data: prepareData } = trpc.museum.purchase.preparePurchase.useQuery(
    { legendId, chapterId: chapter.id },
    { enabled: !!canPurchaseData?.canPurchase }
  );

  // Record purchase mutation
  const { mutateAsync: recordPurchase } =
    trpc.museum.purchase.recordPurchase.useMutation();

  // Invalidate cache on success
  const utils = trpc.useUtils();

  useEffect(() => {
    if (isCheckingEligibility) {
      setState("checking");
    } else if (canPurchaseData?.canPurchase) {
      setState("ready");
    } else if (canPurchaseData && !canPurchaseData.canPurchase) {
      setState("error");
      setError(canPurchaseData.reason || "Cannot purchase this chapter");
    }
  }, [canPurchaseData, isCheckingEligibility]);

  const handlePurchase = async () => {
    if (!account || !prepareData) return;

    try {
      setState("confirming");

      const contract = getContract({
        client,
        chain: MUSEUM_CHAIN,
        address: prepareData.contractAddress,
      });

      // Prepare claim transaction
      const transaction = claimTo({
        contract,
        to: account.address,
        quantity: BigInt(1),
      });

      setState("minting");

      // Send transaction
      sendTx(transaction, {
        onSuccess: async (result) => {
          setTxHash(result.transactionHash);

          // Record in database
          await recordPurchase({
            legendId,
            chapterId: chapter.id,
            transactionHash: result.transactionHash,
            tokenId: chapter.number.toString(),
          });

          // Invalidate queries to refresh data
          utils.museum.legends.getBySlug.invalidate();
          utils.museum.purchase.canPurchase.invalidate();
          utils.museum.purchase.getOwnedChapters.invalidate();
          utils.museum.progress.get.invalidate();

          setState("success");
          onSuccess?.();
        },
        onError: (err) => {
          console.error("Transaction failed:", err);
          setState("error");
          setError(err.message || "Transaction failed");
        },
      });
    } catch (err: unknown) {
      console.error("Purchase error:", err);
      setState("error");
      setError(err instanceof Error ? err.message : "Purchase failed");
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case "mythic":
        return "bg-purple-500/20 text-purple-300 border-purple-500/30";
      case "legendary":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "epic":
        return "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30";
      case "rare":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      default:
        return "bg-white/10 text-white/60 border-white/20";
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-[#0a0a0a] rounded-2xl overflow-hidden max-w-lg w-full border border-white/10"
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative">
          <img
            src={chapter.thumbnailUrl}
            alt={chapter.title}
            className="w-full aspect-video object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">
                Chapter {chapter.number}
              </p>
              <h2 className="text-2xl font-light text-white">{chapter.title}</h2>
            </div>
            <Badge className={cn(getRarityColor(chapter.rarity))}>
              {chapter.rarity}
            </Badge>
          </div>

          <p className="text-white/60 text-sm mb-6 line-clamp-3">
            {chapter.description}
          </p>

          {/* Price & Edition */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl mb-6">
            <div>
              <p className="text-white/40 text-xs">Price</p>
              <p className="text-xl font-medium text-white">
                {chapter.price ? `${chapter.price} ETH` : "Free"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/40 text-xs">Edition</p>
              <p className="text-white">{chapter.edition}</p>
            </div>
          </div>

          {/* State-based UI */}
          <AnimatePresence mode="wait">
            {state === "checking" && (
              <motion.div
                key="checking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center py-4"
              >
                <Loader2 className="w-6 h-6 text-white/60 animate-spin" />
                <span className="ml-3 text-white/60">
                  Checking availability...
                </span>
              </motion.div>
            )}

            {state === "ready" && (
              <motion.div
                key="ready"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {!account ? (
                  <p className="text-center text-white/60 py-4">
                    Connect your wallet to purchase
                  </p>
                ) : (
                  <Button
                    onClick={handlePurchase}
                    className="w-full py-6 text-lg font-medium"
                    style={{ backgroundColor: primaryColor, color: "#000" }}
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Collect Chapter
                  </Button>
                )}
              </motion.div>
            )}

            {(state === "confirming" || state === "minting") && (
              <motion.div
                key="minting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-4"
              >
                <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-4" />
                <p className="text-white font-medium">
                  {state === "confirming"
                    ? "Confirm in your wallet..."
                    : "Minting your chapter..."}
                </p>
                <p className="text-white/50 text-sm mt-2">
                  This may take a moment
                </p>
              </motion.div>
            )}

            {state === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center py-4"
              >
                <CheckCircle
                  className="w-12 h-12 mx-auto mb-4"
                  style={{ color: primaryColor }}
                />
                <p className="text-white font-medium text-lg mb-2">
                  Chapter Collected!
                </p>
                <p className="text-white/50 text-sm mb-4">
                  You now own this piece of history
                </p>
                {txHash && (
                  <a
                    href={`https://sepolia.etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm hover:underline"
                    style={{ color: primaryColor }}
                  >
                    View transaction
                    <ExternalLink className="w-4 h-4 ml-1" />
                  </a>
                )}
                <div className="mt-6">
                  <Button onClick={onClose} variant="outline" className="w-full">
                    Close
                  </Button>
                </div>
              </motion.div>
            )}

            {state === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-4"
              >
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="text-white font-medium mb-2">
                  {error || "Something went wrong"}
                </p>
                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={() => {
                      setState("checking");
                      setError(null);
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Try Again
                  </Button>
                  <Button onClick={onClose} variant="ghost" className="flex-1">
                    Close
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
