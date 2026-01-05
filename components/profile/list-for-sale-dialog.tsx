'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MediaRenderer } from '@/components/media-renderer';
import { useToast } from '@/hooks/use-toast';
import { useActiveAccount } from 'thirdweb/react';
import {
  checkCollectionApproval,
  approveMarketplace,
  createDirectListing,
  calculateSellerProceeds,
  MARKETPLACE_ADDRESS,
  MARKETPLACE_CHAIN_ID,
} from '@/lib/marketplace';
import { trpc } from '@/lib/trpc/client';
import {
  Tag,
  Loader2,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Info,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getExplorerUrl, getExplorerName } from '@/types/profile';

interface NFTItem {
  id: string;
  tokenId: string;
  name: string;
  image: string;
  collection: {
    id: string;
    name: string;
    address: string;
    royaltyPercentage?: number;
  };
  rarityTier?: string | null;
  rarityRank?: number | null;
  // On-chain status - only on-chain NFTs can be listed
  isOnChain?: boolean;
  onChainTokenId?: string | null;
}

interface ListForSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nft: NFTItem | null;
  onSuccess?: () => void;
}

type Step = 'configure' | 'approval' | 'listing' | 'success' | 'error' | 'not_on_chain';

const durationOptions = [
  { label: '1 Day', days: 1 },
  { label: '7 Days', days: 7 },
  { label: '30 Days', days: 30 },
  { label: '6 Months', days: 180 },
];

export function ListForSaleDialog({
  open,
  onOpenChange,
  nft,
  onSuccess,
}: ListForSaleDialogProps) {
  const { toast } = useToast();
  const account = useActiveAccount();
  const [step, setStep] = useState<Step>('configure');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState(30);
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  // tRPC mutation
  const createListingMutation = trpc.marketplace.listings.create.useMutation();

  const royaltyPercentage = nft?.collection.royaltyPercentage || 0;
  const priceNum = parseFloat(price) || 0;
  const proceeds = calculateSellerProceeds(price || '0', royaltyPercentage);

  // Check if NFT is on-chain and approval status when dialog opens
  useEffect(() => {
    const checkOnChainAndApproval = async () => {
      if (!nft || !account?.address) return;

      // Check if NFT is on-chain first - cannot list unminted NFTs
      if (nft.isOnChain === false) {
        setStep('not_on_chain');
        return;
      }

      try {
        const approved = await checkCollectionApproval(
          nft.collection.address,
          account.address
        );
        setIsApproved(approved);
      } catch (err) {
        console.error('Error checking approval:', err);
        setIsApproved(false);
      }
    };

    if (open && nft && account) {
      checkOnChainAndApproval();
    }
  }, [open, nft, account]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep('configure');
        setPrice('');
        setDuration(30);
        setError(null);
        setTransactionHash(null);
      }, 300);
    }
  }, [open]);

  const handleApprove = async () => {
    if (!account || !nft) return;

    setIsLoading(true);
    setError(null);

    try {
      await approveMarketplace(nft.collection.address, account);
      setIsApproved(true);
      toast({ title: 'Collection approved for marketplace' });
      // After approval, proceed to create the listing
      setStep('listing');
      await proceedWithListing();
    } catch (err: any) {
      console.error('Approval error:', err);
      setError(err.message || 'Failed to approve collection');
      setStep('error');
      setIsLoading(false);
    }
  };

  // Separate function to create listing (called after approval or directly if already approved)
  const proceedWithListing = async () => {
    if (!account || !nft || !price) return;

    try {
      // Calculate end timestamp
      const endDate = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);

      // Use onChainTokenId for the actual blockchain call (falls back to tokenId)
      const tokenIdForChain = nft.onChainTokenId || nft.tokenId;

      console.log('Attempting to list NFT:', {
        id: nft.id,
        tokenId: nft.tokenId,
        onChainTokenId: nft.onChainTokenId,
        tokenIdForChain,
        collectionAddress: nft.collection.address,
        seller: account.address,
      });

      // Create the listing on-chain
      const result = await createDirectListing(
        {
          assetContractAddress: nft.collection.address,
          tokenId: tokenIdForChain,
          pricePerToken: price,
          endTimestamp: endDate,
        },
        account
      );

      setTransactionHash(result.transactionHash);

      // Save to database via tRPC - handle errors gracefully since on-chain tx succeeded
      try {
        await createListingMutation.mutateAsync({
          nftId: nft.id,
          listingId: result.listingId,
          sellerAddress: account.address,
          assetContractAddress: nft.collection.address,
          tokenId: nft.tokenId,
          pricePerToken: parseFloat(price),
          startTimestamp: new Date().toISOString(),
          endTimestamp: endDate.toISOString(),
          transactionHash: result.transactionHash,
        });
      } catch (dbError: any) {
        console.error('Database save failed, but on-chain listing succeeded. Error:', dbError);
        toast({
          title: 'Listed on-chain',
          description: dbError.message || 'Your NFT is listed, but there was an issue syncing. It may take a moment to appear.',
          variant: 'default',
        });
      }

      setStep('success');
      toast({ title: 'NFT listed successfully!' });
      onSuccess?.();
    } catch (err: any) {
      console.error('Listing error:', err);

      // Provide user-friendly error messages
      let errorMessage = err.message || 'Failed to create listing';

      if (errorMessage.includes('may not exist at contract') || errorMessage.includes('execution reverted')) {
        errorMessage = 'This NFT has not been minted on-chain yet. You can only list NFTs that have been minted to the blockchain.';
      } else if (errorMessage.includes("don't own this NFT")) {
        errorMessage = 'You do not own this NFT on the blockchain. The ownership may have changed or the NFT data is out of sync.';
      } else if (errorMessage.includes('not approved')) {
        errorMessage = 'Please approve the marketplace to transfer your NFTs first.';
      }

      setError(errorMessage);
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleList = async () => {
    if (!account || !nft || !price) return;

    setIsLoading(true);
    setError(null);

    try {
      // Check approval first
      if (!isApproved) {
        setStep('approval');
        return;
      }

      setStep('listing');

      // Calculate end timestamp
      const endDate = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);

      // Use onChainTokenId for the actual blockchain call (falls back to tokenId)
      const tokenIdForChain = nft.onChainTokenId || nft.tokenId;

      // Create the listing on-chain
      const result = await createDirectListing(
        {
          assetContractAddress: nft.collection.address,
          tokenId: tokenIdForChain,
          pricePerToken: price,
          endTimestamp: endDate,
        },
        account
      );

      setTransactionHash(result.transactionHash);

      // Save to database via tRPC - handle errors gracefully since on-chain tx succeeded
      try {
        await createListingMutation.mutateAsync({
          nftId: nft.id,
          listingId: result.listingId,
          sellerAddress: account.address,
          assetContractAddress: nft.collection.address,
          tokenId: nft.tokenId, // Keep original tokenId for DB reference
          pricePerToken: parseFloat(price),
          startTimestamp: new Date().toISOString(),
          endTimestamp: endDate.toISOString(),
          transactionHash: result.transactionHash,
        });
      } catch (dbError: any) {
        // Database error - log but continue since on-chain succeeded
        console.error('Database save failed, but on-chain listing succeeded. Error:', dbError);
        toast({
          title: 'Listed on-chain',
          description: dbError.message || 'Your NFT is listed, but there was an issue syncing. It may take a moment to appear.',
          variant: 'default',
        });
      }

      setStep('success');
      toast({ title: 'NFT listed successfully!' });
      onSuccess?.();
    } catch (err: any) {
      console.error('Listing error:', err);
      setError(err.message || 'Failed to create listing');
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    if (!price || parseFloat(price) <= 0) {
      toast({ title: 'Please enter a valid price', variant: 'destructive' });
      return;
    }

    if (!isApproved) {
      setStep('approval');
    } else {
      handleList();
    }
  };

  if (!nft) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black border-white/10 text-white max-w-md p-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {step === 'configure' && (
            <ConfigureStep
              nft={nft}
              price={price}
              onPriceChange={setPrice}
              duration={duration}
              onDurationChange={setDuration}
              proceeds={proceeds}
              royaltyPercentage={royaltyPercentage}
              onContinue={handleContinue}
            />
          )}

          {step === 'approval' && (
            <ApprovalStep
              nft={nft}
              isLoading={isLoading}
              onApprove={handleApprove}
              onBack={() => setStep('configure')}
            />
          )}

          {step === 'listing' && (
            <ListingStep nft={nft} price={price} />
          )}

          {step === 'success' && (
            <SuccessStep
              nft={nft}
              price={price}
              transactionHash={transactionHash}
              onClose={() => onOpenChange(false)}
            />
          )}

          {step === 'error' && (
            <ErrorStep
              error={error}
              onRetry={() => {
                setError(null);
                setStep('configure');
              }}
              onClose={() => onOpenChange(false)}
            />
          )}

          {step === 'not_on_chain' && (
            <NotOnChainStep
              nft={nft}
              onClose={() => onOpenChange(false)}
            />
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

function ConfigureStep({
  nft,
  price,
  onPriceChange,
  duration,
  onDurationChange,
  proceeds,
  royaltyPercentage,
  onContinue,
}: {
  nft: NFTItem;
  price: string;
  onPriceChange: (price: string) => void;
  duration: number;
  onDurationChange: (days: number) => void;
  proceeds: { proceeds: string; platformFee: string; royalty: string };
  royaltyPercentage: number;
  onContinue: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      <DialogHeader className="p-6 pb-0">
        <DialogTitle className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-[rgb(163,255,18)]" />
          List for Sale
        </DialogTitle>
      </DialogHeader>

      <div className="p-6 space-y-6">
        {/* NFT Preview */}
        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
          <div className="w-16 h-16 rounded-lg overflow-hidden">
            <MediaRenderer
              src={nft.image}
              alt={nft.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[rgb(163,255,18)]">{nft.collection.name}</p>
            <p className="font-medium text-white truncate">{nft.name}</p>
            {nft.rarityTier && (
              <Badge className="mt-1 text-xs bg-white/10 text-white/60">
                {nft.rarityTier} #{nft.rarityRank}
              </Badge>
            )}
          </div>
        </div>

        {/* Price Input */}
        <div className="space-y-2">
          <Label className="text-white/70">Price</Label>
          <div className="relative">
            <Input
              type="number"
              placeholder="0.00"
              value={price}
              onChange={(e) => onPriceChange(e.target.value)}
              className="bg-white/5 border-white/10 text-white text-lg pr-16 h-12"
              step="0.001"
              min="0"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60">
              ETH
            </span>
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <Label className="text-white/70 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Duration
          </Label>
          <div className="grid grid-cols-4 gap-2">
            {durationOptions.map((option) => (
              <button
                key={option.days}
                onClick={() => onDurationChange(option.days)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  duration === option.days
                    ? 'bg-[rgb(163,255,18)] text-black'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Fee Breakdown */}
        {price && parseFloat(price) > 0 && (
          <div className="space-y-3 p-4 bg-white/5 rounded-xl">
            <div className="flex items-center gap-2 text-sm text-white/60">
              <DollarSign className="w-4 h-4" />
              Fee Breakdown
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">Platform Fee (2.5%)</span>
                <span className="text-white">{proceeds.platformFee} ETH</span>
              </div>
              {royaltyPercentage > 0 && (
                <div className="flex justify-between">
                  <span className="text-white/60">Creator Royalty ({royaltyPercentage}%)</span>
                  <span className="text-white">{proceeds.royalty} ETH</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-white/10 font-medium">
                <span className="text-white/80">You Receive</span>
                <span className="text-[rgb(163,255,18)]">{proceeds.proceeds} ETH</span>
              </div>
            </div>
          </div>
        )}

        {/* Continue Button */}
        <Button
          onClick={onContinue}
          disabled={!price || parseFloat(price) <= 0}
          className="w-full bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90 h-12 font-bold"
        >
          Continue
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
}

function ApprovalStep({
  nft,
  isLoading,
  onApprove,
  onBack,
}: {
  nft: NFTItem;
  isLoading: boolean;
  onApprove: () => void;
  onBack: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <DialogHeader className="p-6 pb-0">
        <DialogTitle>Approve Collection</DialogTitle>
      </DialogHeader>

      <div className="p-6 space-y-6">
        <div className="flex items-start gap-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <Info className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-amber-500">Approval Required</p>
            <p className="text-sm text-white/60">
              You need to approve the marketplace contract to transfer NFTs from the{' '}
              <span className="text-white">{nft.collection.name}</span> collection.
              This is a one-time approval per collection.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-[rgb(163,255,18)]/10 flex items-center justify-center">
              <span className="text-sm font-bold text-[rgb(163,255,18)]">1</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Approve Collection</p>
              <p className="text-xs text-white/40">Allow marketplace to transfer NFTs</p>
            </div>
            {isLoading ? (
              <Loader2 className="w-5 h-5 text-[rgb(163,255,18)] animate-spin" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-white/20" />
            )}
          </div>

          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg opacity-50">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <span className="text-sm font-bold text-white/60">2</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white/60">Create Listing</p>
              <p className="text-xs text-white/40">List your NFT for sale</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex-1 border-white/20 text-white hover:bg-white/10"
            disabled={isLoading}
          >
            Back
          </Button>
          <Button
            onClick={onApprove}
            disabled={isLoading}
            className="flex-1 bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90 font-bold"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Approving...
              </>
            ) : (
              'Approve'
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function ListingStep({ nft, price }: { nft: NFTItem; price: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-6 space-y-6"
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-[rgb(163,255,18)]/10 flex items-center justify-center mb-4">
          <Loader2 className="w-8 h-8 text-[rgb(163,255,18)] animate-spin" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Creating Listing</h3>
        <p className="text-white/60 text-sm">
          Please confirm the transaction in your wallet...
        </p>
      </div>

      <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
        <div className="w-12 h-12 rounded-lg overflow-hidden">
          <MediaRenderer
            src={nft.image}
            alt={nft.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1">
          <p className="text-sm text-white truncate">{nft.name}</p>
          <p className="text-lg font-bold text-[rgb(163,255,18)]">{price} ETH</p>
        </div>
      </div>
    </motion.div>
  );
}

function SuccessStep({
  nft,
  price,
  transactionHash,
  onClose,
}: {
  nft: NFTItem;
  price: string;
  transactionHash: string | null;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-6 space-y-6"
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-[rgb(163,255,18)]/20 flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-[rgb(163,255,18)]" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Listed Successfully!</h3>
        <p className="text-white/60 text-sm">
          Your NFT is now available for purchase on the marketplace.
        </p>
      </div>

      <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
        <div className="w-12 h-12 rounded-lg overflow-hidden">
          <MediaRenderer
            src={nft.image}
            alt={nft.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1">
          <p className="text-sm text-white truncate">{nft.name}</p>
          <p className="text-lg font-bold text-[rgb(163,255,18)]">{price} ETH</p>
        </div>
      </div>

      {transactionHash && (
        <a
          href={getExplorerUrl(MARKETPLACE_CHAIN_ID, transactionHash)}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-sm text-[rgb(163,255,18)] hover:underline"
        >
          View on {getExplorerName(MARKETPLACE_CHAIN_ID)} →
        </a>
      )}

      <Button
        onClick={onClose}
        className="w-full bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90 font-bold"
      >
        Done
      </Button>
    </motion.div>
  );
}

function ErrorStep({
  error,
  onRetry,
  onClose,
}: {
  error: string | null;
  onRetry: () => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-6 space-y-6"
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Transaction Failed</h3>
        <p className="text-white/60 text-sm">
          {error || 'Something went wrong. Please try again.'}
        </p>
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onClose}
          className="flex-1 border-white/20 text-white hover:bg-white/10"
        >
          Cancel
        </Button>
        <Button
          onClick={onRetry}
          className="flex-1 bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90 font-bold"
        >
          Try Again
        </Button>
      </div>
    </motion.div>
  );
}

function NotOnChainStep({
  nft,
  onClose,
}: {
  nft: NFTItem;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-6 space-y-6"
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-orange-500" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Cannot List This NFT</h3>
        <p className="text-white/60 text-sm">
          This NFT has not been minted on-chain yet. Only NFTs that exist on the blockchain can be listed for sale.
        </p>
      </div>

      {/* NFT Preview */}
      <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
        <div className="w-12 h-12 rounded-lg overflow-hidden">
          <MediaRenderer
            src={nft.image}
            alt={nft.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[rgb(163,255,18)]">{nft.collection.name}</p>
          <p className="font-medium text-white truncate">{nft.name}</p>
        </div>
        <Badge className="bg-orange-500/20 border-orange-500/50 text-orange-500">
          Draft
        </Badge>
      </div>

      <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-white/70">
            <p className="font-medium text-orange-500 mb-1">What does this mean?</p>
            <p>
              This NFT is a draft that exists in our database but hasn&apos;t been claimed or minted to the blockchain.
              Once someone claims this NFT from your collection, it will be minted on-chain and can then be listed for sale.
            </p>
          </div>
        </div>
      </div>

      <Button
        onClick={onClose}
        className="w-full bg-white/10 text-white hover:bg-white/20 font-bold"
      >
        Close
      </Button>
    </motion.div>
  );
}
