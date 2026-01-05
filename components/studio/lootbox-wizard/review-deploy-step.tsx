"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MediaRenderer } from "@/components/MediaRenderer";
import {
  Check,
  Loader2,
  AlertCircle,
  Rocket,
  Package,
  Coins,
  Percent,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  TrendingUp,
  Gift,
} from "lucide-react";
import type { LootboxConfig, SelectedNFT } from "@/app/studio/lootbox/create/page";
import type { Account } from "thirdweb/wallets";
import {
  deployLootboxWithRewards,
  isContractDeployed,
} from "@/lib/lootbox-contracts";
import { calculateLootboxRarityWithDetails, RARITY_DISPLAY, type RarityTier } from "@/lib/lootbox-utils";
import { uploadFileToThirdweb } from "@/lib/thirdweb";
import { trpc } from "@/lib/trpc/client";

interface ReviewDeployStepProps {
  config: LootboxConfig;
  selectedNFTs: SelectedNFT[];
  account: Account;
  onDeployComplete: (lootboxId: number) => void;
  isDeploying: boolean;
  setIsDeploying: (deploying: boolean) => void;
}

const RARITY_COLORS: Record<string, string> = {
  common: "bg-gray-500",
  rare: "bg-blue-500",
  epic: "bg-purple-500",
  legendary: "bg-orange-500",
  hyper: "bg-pink-500",
};

export function ReviewDeployStep({
  config,
  selectedNFTs,
  account,
  onDeployComplete,
  isDeploying,
  setIsDeploying,
}: ReviewDeployStepProps) {
  const createLootboxMutation = trpc.lootbox.create.useMutation();
  const [deployProgress, setDeployProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [showAllNFTs, setShowAllNFTs] = useState(false);

  // Calculate totals
  const totalWeight = useMemo(
    () => selectedNFTs.reduce((sum, nft) => sum + nft.weight, 0),
    [selectedNFTs]
  );

  // Calculate the lootbox rarity based on rewards
  const calculatedRarity = useMemo(() => {
    if (selectedNFTs.length === 0) return null;
    return calculateLootboxRarityWithDetails(
      selectedNFTs.map((nft) => ({ rarity: nft.rarity, weight: nft.weight }))
    );
  }, [selectedNFTs]);

  const raritySummary = useMemo(() => {
    const summary = new Map<string, number>();
    for (const nft of selectedNFTs) {
      summary.set(nft.rarity, (summary.get(nft.rarity) || 0) + 1);
    }
    return Array.from(summary.entries()).sort((a, b) => b[1] - a[1]);
  }, [selectedNFTs]);

  const handleDeploy = async () => {
    setIsDeploying(true);
    setError(null);
    setDeployProgress(0);

    try {
      // Check if contract is deployed
      const contractReady = await isContractDeployed();
      if (!contractReady) {
        throw new Error(
          "Lootbox contract not deployed. Please set NEXT_PUBLIC_LOOTBOX_CONTRACT_ADDRESS in your environment."
        );
      }

      // Prepare reward configs
      const rewards = selectedNFTs.map((nft) => {
        // Extract numeric tokenId - handle cases where tokenId might contain non-numeric chars
        let numericTokenId: bigint;
        try {
          // If tokenId contains a hyphen (like "123-0"), extract the first part
          const tokenIdStr = nft.tokenId.includes("-")
            ? nft.tokenId.split("-")[0]
            : nft.tokenId;
          numericTokenId = BigInt(tokenIdStr);
        } catch {
          // Fallback: try to extract any numeric sequence
          const match = nft.tokenId.match(/\d+/);
          numericTokenId = match ? BigInt(match[0]) : BigInt(0);
        }

        return {
          nftContract: nft.contractAddress,
          tokenId: numericTokenId,
          tokenType: nft.tokenType as "ERC721" | "ERC1155",
          amount: nft.amount,
          weight: nft.weight,
          rarity: nft.rarity as RarityTier,
        };
      });

      // Upload image and metadata to IPFS via Thirdweb storage
      let metadataUri = "";

      if (config.image) {
        try {
          setCurrentStep("Uploading lootbox image to IPFS...");
          setDeployProgress(2);

          // Convert base64 data URL to File
          const response = await fetch(config.image);
          const blob = await response.blob();

          // Get correct file extension from mime type
          const mimeToExt: Record<string, string> = {
            "image/webp": "webp",
            "image/png": "png",
            "image/jpeg": "jpg",
            "image/jpg": "jpg",
            "image/gif": "gif",
            "image/svg+xml": "svg",
            "image/avif": "avif",
          };
          const ext = mimeToExt[blob.type] || "png";

          const imageFile = new File([blob], `lootbox-${config.name}.${ext}`, {
            type: blob.type || "image/png",
          });

          // Upload image to IPFS
          const imageUri = await uploadFileToThirdweb(imageFile);

          setCurrentStep("Uploading lootbox metadata to IPFS...");
          setDeployProgress(5);

          // Create and upload metadata JSON
          const metadata = {
            name: config.name,
            description: config.description || `${config.name} Lootbox`,
            image: imageUri,
            attributes: [
              { trait_type: "Supply", value: config.supply.toString() },
              { trait_type: "Price", value: `${config.price} ETH` },
              { trait_type: "Rewards Per Opening", value: config.rewardsPerOpening.toString() },
            ],
          };

          const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], {
            type: "application/json",
          });
          const metadataFile = new File([metadataBlob], "metadata.json", {
            type: "application/json",
          });

          metadataUri = await uploadFileToThirdweb(metadataFile);
          console.log("[Lootbox] Uploaded metadata to IPFS:", metadataUri);
        } catch (uploadError) {
          console.error("Failed to upload to IPFS:", uploadError);
          // Continue with empty URI if upload fails - image stored in DB
        }
      }

      // Deploy with progress callback (rarity is auto-calculated from rewards)
      const result = await deployLootboxWithRewards(
        account,
        {
          name: config.name,
          price: config.price,
          supply: config.supply,
          metadataUri,
          rewardsPerOpening: config.rewardsPerOpening,
        },
        rewards,
        (step, progress) => {
          setCurrentStep(step);
          // Offset progress to account for upload steps (0-8% was upload)
          setDeployProgress(8 + progress * 0.92);
        }
      );

      setTxHash(result.txHash);
      setDeployProgress(100);

      // Record in database via tRPC (rarity is auto-calculated server-side)
      try {
        await createLootboxMutation.mutateAsync({
          onChainId: result.lootboxId,
          name: config.name,
          description: config.description,
          image: config.image || "",
          price: parseFloat(config.price),
          totalSupply: config.supply,
          rewardsPerOpening: config.rewardsPerOpening,
          rewards: selectedNFTs.map((nft) => ({
            nftContractAddress: nft.contractAddress,
            nftTokenId: nft.tokenId,
            tokenType: nft.tokenType as "ERC721" | "ERC1155",
            name: nft.name,
            image: nft.image,
            collectionName: nft.collectionName,
            rarity: nft.rarity as "common" | "rare" | "epic" | "mythic" | "cosmic",
            weight: nft.weight,
          })),
        });
      } catch (dbError) {
        console.error("Failed to record lootbox in database:", dbError);
        // Don't fail the whole operation
      }

      // Wait a moment before redirecting
      setTimeout(() => {
        onDeployComplete(result.lootboxId);
      }, 2000);
    } catch (err: any) {
      console.error("Deploy error:", err);
      setError(err.message || "Failed to deploy lootbox");
      setIsDeploying(false);
    }
  };

  const displayedNFTs = showAllNFTs ? selectedNFTs : selectedNFTs.slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[rgb(163,255,18)]/10">
          <Rocket className="w-6 h-6 text-[rgb(163,255,18)]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Review & Deploy</h2>
          <p className="text-sm text-white/60">
            Confirm your lootbox configuration before deploying
          </p>
        </div>
      </div>

      {/* Deployment Progress */}
      {isDeploying && (
        <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-white font-medium">Deploying Lootbox</span>
            <span className="text-white/60 text-sm">{Math.round(deployProgress)}%</span>
          </div>
          <Progress value={deployProgress} className="h-2" />
          <p className="text-sm text-white/60">{currentStep}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-medium">Deployment Failed</p>
            <p className="text-sm text-red-400/80 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Success */}
      {deployProgress === 100 && txHash && (
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-start gap-3">
          <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-green-400 font-medium">Lootbox Deployed!</p>
            <p className="text-sm text-green-400/80 mt-1">
              Your lootbox is now live and ready for purchases.
            </p>
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-green-400 hover:underline mt-2"
            >
              View Transaction <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 text-white/60 mb-1">
            <Coins className="w-4 h-4" />
            <span className="text-sm">Price</span>
          </div>
          <p className="text-xl font-bold text-white">{config.price} ETH</p>
        </div>

        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 text-white/60 mb-1">
            <Package className="w-4 h-4" />
            <span className="text-sm">Supply</span>
          </div>
          <p className="text-xl font-bold text-white">{config.supply}</p>
        </div>

        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 text-white/60 mb-1">
            <Gift className="w-4 h-4" />
            <span className="text-sm">Per Open</span>
          </div>
          <p className="text-xl font-bold text-white">
            {config.rewardsPerOpening} reward{config.rewardsPerOpening > 1 ? "s" : ""}
          </p>
        </div>

        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 text-white/60 mb-1">
            <Percent className="w-4 h-4" />
            <span className="text-sm">Total NFTs</span>
          </div>
          <p className="text-xl font-bold text-white">{selectedNFTs.length}</p>
        </div>
      </div>

      {/* Lootbox Info with Calculated Rarity */}
      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-start gap-4">
          {config.image ? (
            <img
              src={config.image}
              alt={config.name}
              className="w-24 h-24 rounded-lg object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-lg bg-white/10 flex items-center justify-center">
              <Package className="w-8 h-8 text-white/20" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-white">{config.name}</h3>
              {calculatedRarity && (
                <Badge className={RARITY_COLORS[calculatedRarity.tier]}>
                  {RARITY_DISPLAY[calculatedRarity.tier].label}
                </Badge>
              )}
            </div>
            {config.description && (
              <p className="text-sm text-white/60">{config.description}</p>
            )}
            <div className="flex gap-4 mt-3 text-sm text-white/60">
              <span>
                Potential Revenue:{" "}
                <span className="text-[rgb(163,255,18)]">
                  {(parseFloat(config.price) * config.supply).toFixed(4)} ETH
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Calculated Rarity Explanation */}
      {calculatedRarity && (
        <div className="p-4 rounded-lg bg-gradient-to-r from-[rgb(163,255,18)]/10 to-transparent border border-[rgb(163,255,18)]/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[rgb(163,255,18)]/20">
              <TrendingUp className="w-5 h-5 text-[rgb(163,255,18)]" />
            </div>
            <div>
              <p className="text-xs text-white/60 uppercase tracking-wide">Auto-Calculated Rarity</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge className={RARITY_COLORS[calculatedRarity.tier]}>
                  {RARITY_DISPLAY[calculatedRarity.tier].label}
                </Badge>
                <span className="text-xs text-white/40">
                  Score: {calculatedRarity.score.toFixed(2)} / 5.00
                </span>
              </div>
            </div>
            <p className="text-xs text-white/60 ml-auto max-w-[200px] text-right">
              Based on reward rarities and weights
            </p>
          </div>
        </div>
      )}

      {/* Rarity Distribution */}
      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
        <h4 className="text-sm font-medium text-white mb-3">Rarity Distribution</h4>
        <div className="flex flex-wrap gap-2">
          {raritySummary.map(([rarity, count]) => (
            <Badge
              key={rarity}
              variant="secondary"
              className="flex items-center gap-1.5"
            >
              <div className={`w-2 h-2 rounded-full ${RARITY_COLORS[rarity]}`} />
              <span className="capitalize">{rarity}</span>
              <span className="text-white/40">×{count}</span>
            </Badge>
          ))}
        </div>
      </div>

      {/* NFT Preview */}
      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
        <h4 className="text-sm font-medium text-white mb-3">Reward NFTs</h4>
        <div className="grid grid-cols-4 gap-3">
          {displayedNFTs.map((nft) => (
            <div
              key={nft.id}
              className="relative rounded-lg overflow-hidden border border-white/10"
            >
              <div className="aspect-square">
                <MediaRenderer
                  src={nft.image}
                  alt={nft.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                <p className="text-xs text-white truncate">{nft.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${RARITY_COLORS[nft.rarity]}`}
                  />
                  <span className="text-[10px] text-white/60">
                    {((nft.weight / totalWeight) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedNFTs.length > 4 && (
          <button
            onClick={() => setShowAllNFTs(!showAllNFTs)}
            className="flex items-center gap-1 text-sm text-white/60 hover:text-white mt-3 mx-auto"
          >
            {showAllNFTs ? (
              <>
                Show Less <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                Show All ({selectedNFTs.length}) <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Deploy Button */}
      {!txHash && (
        <Button
          onClick={handleDeploy}
          disabled={isDeploying}
          className="w-full h-12 bg-[rgb(163,255,18)] text-black hover:bg-[rgb(143,235,0)] font-semibold"
        >
          {isDeploying ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Deploying...
            </>
          ) : (
            <>
              <Rocket className="w-5 h-5 mr-2" />
              Deploy Lootbox
            </>
          )}
        </Button>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-center text-white/40">
        By deploying, you agree to transfer the selected NFTs to the lootbox contract.
        <br />
        You will receive payments when users purchase and open your lootboxes.
      </p>
    </div>
  );
}
