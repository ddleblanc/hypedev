"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Package,
  Loader2,
  CheckCircle,
  Sparkles,
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

interface CollectionPurchaseModalProps {
  legendId: string;
  legendName: string;
  bannerUrl: string;
  tagline: string;
  primaryColor: string;
  onClose: () => void;
  onSuccess?: () => void;
}

type PurchaseState =
  | "loading"
  | "ready"
  | "purchasing"
  | "success"
  | "error";

export function CollectionPurchaseModal({
  legendId,
  legendName,
  bannerUrl,
  tagline,
  primaryColor,
  onClose,
  onSuccess,
}: CollectionPurchaseModalProps) {
  const [state, setState] = useState<PurchaseState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [purchaseProgress, setPurchaseProgress] = useState<{
    current: number;
    total: number;
    txHashes: string[];
  }>({ current: 0, total: 0, txHashes: [] });

  const account = useActiveAccount();
  const { mutate: sendTx } = useSendTransaction();

  // Get collection info
  const { data: collectionInfo, isLoading, isError, error: queryError } =
    trpc.museum.purchase.getCollectionInfo.useQuery({ legendId });

  // Handle query state changes
  React.useEffect(() => {
    if (collectionInfo && !isLoading) {
      setState("ready");
    } else if (isError && queryError) {
      setState("error");
      setError(queryError.message);
    }
  }, [collectionInfo, isLoading, isError, queryError]);

  // Record purchase mutation
  const { mutateAsync: recordPurchase } =
    trpc.museum.purchase.recordPurchase.useMutation();

  // Invalidate cache on success
  const utils = trpc.useUtils();

  // Calculate discount (10% off collection purchase)
  const discountedPrice = collectionInfo
    ? collectionInfo.totalPrice * 0.9
    : 0;

  const handlePurchaseAll = async () => {
    if (!account || !collectionInfo?.contractAddress) return;

    setState("purchasing");
    const chapters = collectionInfo.chapters;
    const txHashes: string[] = [];

    setPurchaseProgress({ current: 0, total: chapters.length, txHashes: [] });

    try {
      const contract = getContract({
        client,
        chain: MUSEUM_CHAIN,
        address: collectionInfo.contractAddress,
      });

      // Purchase chapters sequentially
      for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];

        try {
          // Prepare claim transaction
          const transaction = claimTo({
            contract,
            to: account.address,
            quantity: BigInt(1),
          });

          // Send transaction and wait for result
          await new Promise<void>((resolve, reject) => {
            sendTx(transaction, {
              onSuccess: async (result) => {
                txHashes.push(result.transactionHash);

                // Record in database
                await recordPurchase({
                  legendId,
                  chapterId: chapter.id,
                  transactionHash: result.transactionHash,
                  tokenId: chapter.number.toString(),
                });

                setPurchaseProgress({
                  current: i + 1,
                  total: chapters.length,
                  txHashes: [...txHashes],
                });

                resolve();
              },
              onError: (err) => {
                reject(err);
              },
            });
          });
        } catch (chapterError) {
          console.error(`Failed to purchase chapter ${chapter.number}:`, chapterError);
          // Continue with remaining chapters even if one fails
        }
      }

      // Invalidate queries to refresh data
      utils.museum.legends.getBySlug.invalidate();
      utils.museum.purchase.canPurchase.invalidate();
      utils.museum.purchase.getOwnedChapters.invalidate();
      utils.museum.progress.get.invalidate();

      setState("success");
      onSuccess?.();
    } catch (err: unknown) {
      console.error("Collection purchase error:", err);
      setState("error");
      setError(err instanceof Error ? err.message : "Purchase failed");
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case "mythic":
        return "bg-purple-500/20 text-purple-300";
      case "legendary":
        return "bg-amber-500/20 text-amber-300";
      case "epic":
        return "bg-fuchsia-500/20 text-fuchsia-300";
      case "rare":
        return "bg-blue-500/20 text-blue-300";
      default:
        return "bg-white/10 text-white/60";
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
        className="bg-[#0a0a0a] rounded-2xl overflow-hidden max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10"
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative h-48">
          <img
            src={bannerUrl}
            alt={legendName}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/50 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="absolute bottom-4 left-6">
            <Badge
              className="mb-2"
              style={{
                backgroundColor: `${primaryColor}20`,
                color: primaryColor,
              }}
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Full Collection
            </Badge>
            <h2 className="text-2xl font-light text-white">{legendName}</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-white/60 mb-6">{tagline}</p>

          {isLoading || state === "loading" ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-white/60 animate-spin" />
            </div>
          ) : state === "error" ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-white font-medium mb-2">{error}</p>
              <Button onClick={onClose} variant="outline" className="mt-4">
                Close
              </Button>
            </div>
          ) : state === "success" ? (
            <div className="text-center py-8">
              <CheckCircle
                className="w-16 h-16 mx-auto mb-4"
                style={{ color: primaryColor }}
              />
              <p className="text-white font-medium text-xl mb-2">
                Collection Acquired!
              </p>
              <p className="text-white/50 mb-4">
                You now own {purchaseProgress.current} chapters of this legendary story
              </p>
              {purchaseProgress.txHashes.length > 0 && (
                <a
                  href={`https://sepolia.etherscan.io/tx/${purchaseProgress.txHashes[purchaseProgress.txHashes.length - 1]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm hover:underline"
                  style={{ color: primaryColor }}
                >
                  View latest transaction
                  <ExternalLink className="w-4 h-4 ml-1" />
                </a>
              )}
              <div className="mt-6">
                <Button onClick={onClose} variant="outline" className="w-full">
                  Close
                </Button>
              </div>
            </div>
          ) : state === "purchasing" ? (
            <div className="py-8">
              <div className="text-center mb-6">
                <Loader2 className="w-10 h-10 text-white animate-spin mx-auto mb-4" />
                <p className="text-white font-medium text-lg">
                  Purchasing Collection...
                </p>
                <p className="text-white/50 text-sm mt-2">
                  Confirm each transaction in your wallet
                </p>
              </div>

              {/* Progress bar */}
              <div className="bg-white/10 rounded-full h-2 mb-4 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: primaryColor }}
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(purchaseProgress.current / purchaseProgress.total) * 100}%`,
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              <p className="text-center text-white/60 text-sm">
                {purchaseProgress.current} of {purchaseProgress.total} chapters claimed
              </p>
            </div>
          ) : (
            <>
              {/* Chapters included */}
              <h3 className="text-white/40 text-xs uppercase tracking-wider mb-4">
                {collectionInfo?.totalChapters} Chapters Included
              </h3>

              <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2">
                {collectionInfo?.chapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    className="flex items-center gap-4 p-3 bg-white/5 rounded-lg"
                  >
                    <img
                      src={chapter.thumbnailUrl}
                      alt={chapter.title}
                      className="w-12 h-16 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{chapter.title}</p>
                      <Badge className={cn("text-xs mt-1", getRarityColor(chapter.rarity))}>
                        {chapter.rarity}
                      </Badge>
                    </div>
                    <p className="text-white text-sm whitespace-nowrap">
                      {chapter.price ? `${chapter.price} ETH` : "Free"}
                    </p>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl mb-6">
                <div>
                  <p className="text-white/40 text-xs">Total Collection Price</p>
                  <div className="flex items-center gap-3">
                    <p className="text-white/40 line-through text-sm">
                      {collectionInfo?.totalPrice.toFixed(4)} ETH
                    </p>
                    <p className="text-2xl font-medium text-white">
                      {discountedPrice.toFixed(4)} ETH
                    </p>
                  </div>
                </div>
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                  Save 10%
                </Badge>
              </div>

              {/* Purchase button */}
              <Button
                onClick={handlePurchaseAll}
                disabled={!account || !collectionInfo?.contractAddress}
                className="w-full py-6 text-lg font-medium"
                style={{ backgroundColor: primaryColor, color: "#000" }}
              >
                <Package className="w-5 h-5 mr-2" />
                Collect All Chapters
              </Button>

              {!account && (
                <p className="text-center text-white/40 text-sm mt-4">
                  Connect your wallet to purchase
                </p>
              )}

              {!collectionInfo?.contractAddress && account && (
                <p className="text-center text-amber-400/80 text-sm mt-4">
                  Collection not yet deployed on chain
                </p>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
