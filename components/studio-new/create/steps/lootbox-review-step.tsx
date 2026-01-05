'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useActiveAccount } from 'thirdweb/react';
import {
  Rocket,
  Package,
  Coins,
  Gift,
  Percent,
  Check,
  Loader2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MediaRenderer } from '@/components/MediaRenderer';
import { useStudioNew, type LootboxRarity } from '@/contexts/studio-new-context';
import {
  deployLootboxWithRewards,
  isContractDeployed,
  verifyNFTOwnership,
} from '@/lib/lootbox-contracts';
import {
  calculateLootboxRarityWithDetails,
  RARITY_DISPLAY,
  databaseToContractRarity,
} from '@/lib/lootbox-utils';
import { uploadFileToThirdweb } from '@/lib/thirdweb';
import { claimNFT } from '@/lib/nft-minting';
import { trpc } from '@/lib/trpc/client';
import { sepolia } from 'thirdweb/chains';

const RARITY_COLORS: Record<string, string> = {
  common: 'bg-gray-500',
  rare: 'bg-blue-500',
  epic: 'bg-purple-500',
  mythic: 'bg-orange-500',
  cosmic: 'bg-pink-500',
};

export function LootboxReviewStep() {
  const { state, updateDraft, setStep, prevStep } = useStudioNew();
  const account = useActiveAccount();
  const createLootboxMutation = trpc.lootbox.create.useMutation();

  const lootbox = state.create.draft.lootbox;
  const selectedNFTs = lootbox?.selectedNFTs || [];

  const [isDeploying, setIsDeploying] = useState(false);
  const [deployProgress, setDeployProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [showAllNFTs, setShowAllNFTs] = useState(false);

  // Calculate totals
  const totalWeight = useMemo(
    () => selectedNFTs.reduce((sum, nft) => sum + nft.weight, 0),
    [selectedNFTs]
  );

  // Count unminted NFTs that need to be minted first
  const unmintedNFTs = useMemo(
    () => selectedNFTs.filter((nft) => !nft.isOnChain),
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
    if (!account) {
      setError('Please connect your wallet');
      return;
    }

    setIsDeploying(true);
    setError(null);
    setDeployProgress(0);

    try {
      // Check if contract is deployed
      const contractReady = await isContractDeployed();
      if (!contractReady) {
        throw new Error(
          'Lootbox contract not deployed. Please contact support.'
        );
      }

      // Track minted NFTs for use in reward config
      const mintedNFTUpdates: Map<string, { tokenId: string; contractAddress: string }> = new Map();

      // Auto-mint unminted NFTs first
      if (unmintedNFTs.length > 0) {
        setCurrentStep(`Minting ${unmintedNFTs.length} unminted NFT(s)...`);
        setDeployProgress(1);

        for (let i = 0; i < unmintedNFTs.length; i++) {
          const nft = unmintedNFTs[i];
          setCurrentStep(`Minting NFT ${i + 1}/${unmintedNFTs.length}: ${nft.name}...`);
          setDeployProgress(1 + (i / unmintedNFTs.length) * 4); // Progress 1-5%

          try {
            // Claim/mint the NFT from the collection contract
            const mintResult = await claimNFT(
              {
                contractAddress: nft.contractAddress,
                chainId: sepolia.id,
                recipient: account.address,
                quantity: 1,
              },
              account
            );

            console.log(`Minted ${nft.name}:`, mintResult);

            // Store the minted token ID for updating reward config
            mintedNFTUpdates.set(nft.id, {
              tokenId: mintResult.startTokenId.toString(),
              contractAddress: nft.contractAddress,
            });
          } catch (mintError) {
            console.error(`Failed to mint ${nft.name}:`, mintError);
            throw new Error(
              `Failed to mint "${nft.name}": ${mintError instanceof Error ? mintError.message : 'Unknown error'}\n\nPlease try again or remove this NFT from the selection.`
            );
          }
        }

        setCurrentStep('All NFTs minted successfully!');
        setDeployProgress(5);
      }

      // Verify NFT ownership before proceeding (using updated token IDs for minted NFTs)
      setCurrentStep('Verifying NFT ownership...');
      setDeployProgress(6);

      // Create updated NFT list with minted token IDs
      const nftsForVerification = selectedNFTs.map((nft) => {
        const mintUpdate = mintedNFTUpdates.get(nft.id);
        if (mintUpdate) {
          return {
            ...nft,
            tokenId: mintUpdate.tokenId,
            isOnChain: true,
          };
        }
        return nft;
      });

      const ownershipCheck = await verifyNFTOwnership(
        account.address,
        nftsForVerification.map((nft) => ({
          contractAddress: nft.contractAddress,
          tokenId: nft.tokenId,
          tokenType: nft.tokenType,
          name: nft.name,
        }))
      );

      if (!ownershipCheck.valid) {
        const reasons = ownershipCheck.failed
          .map((f) => `${f.name}: ${f.reason}`)
          .join('\n');
        throw new Error(
          `Cannot deploy: You don't own these NFTs:\n${reasons}\n\nPlease remove them and try again.`
        );
      }

      // Prepare reward configs with updated token IDs
      const rewards = nftsForVerification.map((nft) => {
        let numericTokenId: bigint;
        try {
          const tokenIdStr = nft.tokenId.includes('-')
            ? nft.tokenId.split('-')[0]
            : nft.tokenId;
          numericTokenId = BigInt(tokenIdStr);
        } catch {
          const match = nft.tokenId.match(/\d+/);
          numericTokenId = match ? BigInt(match[0]) : BigInt(0);
        }

        return {
          nftContract: nft.contractAddress,
          tokenId: numericTokenId,
          tokenType: nft.tokenType,
          amount: nft.amount,
          weight: nft.weight,
          rarity: databaseToContractRarity(nft.rarity) as 'common' | 'rare' | 'epic' | 'legendary' | 'hyper',
        };
      });

      // Upload image and metadata to IPFS
      let metadataUri = '';

      if (lootbox?.image) {
        try {
          setCurrentStep('Uploading lootbox image to IPFS...');
          setDeployProgress(8);

          const response = await fetch(lootbox.image);
          const blob = await response.blob();

          // Get correct file extension from mime type
          const mimeToExt: Record<string, string> = {
            'image/webp': 'webp',
            'image/png': 'png',
            'image/jpeg': 'jpg',
            'image/jpg': 'jpg',
            'image/gif': 'gif',
            'image/svg+xml': 'svg',
            'image/avif': 'avif',
          };
          const ext = mimeToExt[blob.type] || 'png';

          const imageFile = new File([blob], `lootbox-${lootbox.name}.${ext}`, {
            type: blob.type || 'image/png',
          });

          const imageUri = await uploadFileToThirdweb(imageFile);

          setCurrentStep('Uploading metadata to IPFS...');
          setDeployProgress(12);

          const metadata = {
            name: lootbox.name,
            description: lootbox.description || `${lootbox.name} Lootbox`,
            image: imageUri,
            attributes: [
              { trait_type: 'Supply', value: String(lootbox.supply) },
              { trait_type: 'Price', value: `${lootbox.price} ETH` },
              { trait_type: 'Rewards Per Opening', value: String(lootbox.rewardsPerOpening) },
            ],
          };

          const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], {
            type: 'application/json',
          });
          const metadataFile = new File([metadataBlob], 'metadata.json', {
            type: 'application/json',
          });

          metadataUri = await uploadFileToThirdweb(metadataFile);
        } catch (uploadError) {
          console.error('Failed to upload to IPFS:', uploadError);
        }
      }

      // Deploy with progress callback
      const result = await deployLootboxWithRewards(
        account,
        {
          name: lootbox?.name || 'Lootbox',
          price: lootbox?.price || '0.01',
          supply: lootbox?.supply || 10,
          metadataUri,
          rewardsPerOpening: lootbox?.rewardsPerOpening || 1,
        },
        rewards,
        (step, progress) => {
          setCurrentStep(step);
          // Start from 15% (after minting + IPFS), scale remaining 85%
          setDeployProgress(15 + progress * 0.85);
        }
      );

      setTxHash(result.txHash);
      setDeployProgress(100);

      // Record in database
      try {
        // Prepare project data
        const projectId = state.create.draft.projectId;
        const projectName = state.create.draft.projectName;
        const projectDescription = state.create.draft.projectDescription;

        await createLootboxMutation.mutateAsync({
          onChainId: result.lootboxId,
          name: lootbox?.name || 'Lootbox',
          description: lootbox?.description || '',
          image: lootbox?.image || '',
          price: parseFloat(lootbox?.price || '0'),
          totalSupply: lootbox?.supply || 0,
          rewardsPerOpening: lootbox?.rewardsPerOpening || 1,
          // Link to existing project or create new one
          projectId: projectId || undefined,
          project: !projectId && projectName ? {
            name: projectName,
            description: projectDescription || undefined,
          } : undefined,
          rewards: selectedNFTs.map((nft) => ({
            nftContractAddress: nft.contractAddress,
            nftTokenId: nft.tokenId,
            tokenType: nft.tokenType,
            name: nft.name,
            image: nft.image,
            collectionName: nft.collectionName,
            rarity: nft.rarity as 'common' | 'rare' | 'epic' | 'mythic' | 'cosmic',
            weight: nft.weight,
          })),
        });
      } catch (dbError) {
        console.error('Failed to record lootbox in database:', dbError);
        // Don't silently fail - show the error but still show success since on-chain worked
        // The lootbox exists on-chain, we just failed to record it locally
        setError(`Lootbox deployed on-chain (ID: ${result.lootboxId}) but failed to save to database. Please contact support with your transaction hash: ${result.txHash}`);
        setIsDeploying(false);
        return; // Don't proceed to success step
      }

      // Update draft with results and move to success step
      updateDraft({ deployedLootboxId: result.lootboxId, txHash: result.txHash });
      setTimeout(() => setStep(8), 1500);
    } catch (err: unknown) {
      console.error('Deploy error:', err);
      setError(err instanceof Error ? err.message : 'Failed to deploy lootbox');
      setIsDeploying(false);
    }
  };

  const displayedNFTs = showAllNFTs ? selectedNFTs : selectedNFTs.slice(0, 4);

  return (
    <div className="text-left">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto h-14 w-14 rounded-xl bg-studio-accent/10 flex items-center justify-center mb-4"
      >
        <Rocket className="h-7 w-7 text-studio-accent" />
      </motion.div>

      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold text-studio-text mb-2">
          Review & Deploy
        </h2>
        <p className="text-studio-text-muted">
          Confirm your lootbox configuration before deploying
        </p>
      </div>

      {/* Unminted NFTs notice */}
      {unmintedNFTs.length > 0 && !isDeploying && !txHash && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 mb-4">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-400 font-medium">
              {unmintedNFTs.length} NFT{unmintedNFTs.length > 1 ? 's' : ''} will be auto-minted
            </p>
            <p className="text-xs text-amber-400/80 mt-1">
              The following NFTs are not yet on-chain and will be minted during deployment: {unmintedNFTs.map(n => n.name).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Deployment Progress */}
      {isDeploying && (
        <div className="p-4 rounded-lg bg-studio-surface border border-studio-border space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-studio-text">Deploying Lootbox</span>
            <span className="text-xs text-studio-text-muted">{Math.round(deployProgress)}%</span>
          </div>
          <Progress value={deployProgress} className="h-2" />
          <p className="text-xs text-studio-text-muted">{currentStep}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2 mb-4">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-400 font-medium">Deployment Failed</p>
            <p className="text-xs text-red-400/80 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Success */}
      {deployProgress === 100 && txHash && (
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-start gap-2 mb-4">
          <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-green-400 font-medium">Lootbox Deployed!</p>
            <p className="text-xs text-green-400/80 mt-1">
              Your lootbox is now live.
            </p>
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-green-400 hover:underline mt-1"
            >
              View Transaction <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-lg bg-studio-surface border border-studio-border">
          <div className="flex items-center gap-2 text-studio-text-muted mb-1">
            <Coins className="w-3 h-3" />
            <span className="text-xs">Price</span>
          </div>
          <p className="text-lg font-semibold text-studio-text">{lootbox?.price || '0'} ETH</p>
        </div>

        <div className="p-3 rounded-lg bg-studio-surface border border-studio-border">
          <div className="flex items-center gap-2 text-studio-text-muted mb-1">
            <Package className="w-3 h-3" />
            <span className="text-xs">Supply</span>
          </div>
          <p className="text-lg font-semibold text-studio-text">{lootbox?.supply || 0}</p>
        </div>

        <div className="p-3 rounded-lg bg-studio-surface border border-studio-border">
          <div className="flex items-center gap-2 text-studio-text-muted mb-1">
            <Gift className="w-3 h-3" />
            <span className="text-xs">Per Open</span>
          </div>
          <p className="text-lg font-semibold text-studio-text">
            {lootbox?.rewardsPerOpening || 1} NFT{(lootbox?.rewardsPerOpening || 1) > 1 ? 's' : ''}
          </p>
        </div>

        <div className="p-3 rounded-lg bg-studio-surface border border-studio-border">
          <div className="flex items-center gap-2 text-studio-text-muted mb-1">
            <Percent className="w-3 h-3" />
            <span className="text-xs">Total NFTs</span>
          </div>
          <p className="text-lg font-semibold text-studio-text">{selectedNFTs.length}</p>
        </div>
      </div>

      {/* Lootbox Info */}
      <div className="p-3 rounded-lg bg-studio-surface border border-studio-border mb-4">
        <div className="flex items-start gap-3">
          {lootbox?.image ? (
            <img
              src={lootbox.image}
              alt={lootbox.name}
              className="w-16 h-16 rounded-lg object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-studio-border flex items-center justify-center">
              <Package className="w-6 h-6 text-studio-text-muted" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-studio-text truncate">{lootbox?.name || 'Untitled'}</h3>
              {calculatedRarity && (
                <Badge className={RARITY_COLORS[calculatedRarity.tier]}>
                  {RARITY_DISPLAY[calculatedRarity.tier].label}
                </Badge>
              )}
            </div>
            {lootbox?.description && (
              <p className="text-xs text-studio-text-muted line-clamp-2">{lootbox.description}</p>
            )}
            <p className="text-xs text-studio-accent mt-1">
              Max revenue: {((parseFloat(lootbox?.price || '0') || 0) * (lootbox?.supply || 0)).toFixed(4)} ETH
            </p>
          </div>
        </div>
      </div>

      {/* Calculated Rarity */}
      {calculatedRarity && (
        <div className="p-3 rounded-lg bg-studio-accent/10 border border-studio-accent/30 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-studio-accent" />
              <span className="text-xs text-studio-text-muted uppercase tracking-wide">
                Auto-Calculated Tier
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={RARITY_COLORS[calculatedRarity.tier]}>
                {RARITY_DISPLAY[calculatedRarity.tier].label}
              </Badge>
              <span className="text-xs text-studio-text-muted">
                {calculatedRarity.score.toFixed(2)} / 5.00
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Rarity Distribution */}
      <div className="p-3 rounded-lg bg-studio-surface border border-studio-border mb-4">
        <h4 className="text-xs font-medium text-studio-text-muted mb-2">Rarity Distribution</h4>
        <div className="flex flex-wrap gap-1.5">
          {raritySummary.map(([rarity, count]) => (
            <Badge
              key={rarity}
              variant="secondary"
              className="flex items-center gap-1 text-[10px]"
            >
              <div className={`w-1.5 h-1.5 rounded-full ${RARITY_COLORS[rarity]}`} />
              <span className="capitalize">{rarity}</span>
              <span className="text-studio-text-muted">x{count}</span>
            </Badge>
          ))}
        </div>
      </div>

      {/* NFT Preview */}
      <div className="p-3 rounded-lg bg-studio-surface border border-studio-border mb-4">
        <h4 className="text-xs font-medium text-studio-text-muted mb-2">Reward NFTs</h4>
        <div className="grid grid-cols-4 gap-2">
          {displayedNFTs.map((nft) => (
            <div
              key={nft.id}
              className={`relative rounded-lg overflow-hidden border ${
                !nft.isOnChain ? 'border-amber-500/50' : 'border-studio-border'
              }`}
            >
              <div className="aspect-square">
                <MediaRenderer
                  src={nft.image}
                  alt={nft.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Unminted indicator */}
              {!nft.isOnChain && (
                <div className="absolute top-1 right-1">
                  <Badge className="text-[7px] px-1 py-0 bg-amber-500/80 text-white">
                    Unminted
                  </Badge>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                <p className="text-[9px] text-white truncate">{nft.name}</p>
                <div className="flex items-center gap-1">
                  <div className={`w-1 h-1 rounded-full ${RARITY_COLORS[nft.rarity]}`} />
                  <span className="text-[8px] text-white/60">
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
            className="flex items-center gap-1 text-xs text-studio-text-muted hover:text-studio-text mt-2 mx-auto"
          >
            {showAllNFTs ? (
              <>Show Less <ChevronUp className="w-3 h-3" /></>
            ) : (
              <>Show All ({selectedNFTs.length}) <ChevronDown className="w-3 h-3" /></>
            )}
          </button>
        )}
      </div>

      {/* Actions */}
      {!txHash && (
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={isDeploying}
            className="flex-1 border-studio-border text-studio-text hover:bg-studio-surface"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleDeploy}
            disabled={isDeploying || !account}
            className="flex-1 bg-studio-accent hover:bg-studio-accent/90 text-white"
          >
            {isDeploying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deploying...
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4 mr-2" />
                Deploy Lootbox
              </>
            )}
          </Button>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-[10px] text-center text-studio-text-muted mt-4">
        By deploying, you agree to transfer the selected NFTs to the lootbox contract.
        <br />
        You will receive payments when users purchase and open your lootboxes.
      </p>
    </div>
  );
}
