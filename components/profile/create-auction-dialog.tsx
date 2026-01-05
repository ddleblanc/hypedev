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
  createEnglishAuction,
  calculateSellerProceeds,
  MARKETPLACE_CHAIN_ID,
} from '@/lib/marketplace';
import { trpc } from '@/lib/trpc/client';
import {
  Gavel,
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
  // On-chain status - only on-chain NFTs can be auctioned
  isOnChain?: boolean;
  onChainTokenId?: string | null;
}

interface CreateAuctionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nft: NFTItem | null;
  onSuccess?: () => void;
}

type Step = 'configure' | 'approval' | 'creating' | 'success' | 'error' | 'not_on_chain';

const durationOptions = [
  { label: '1 Day', days: 1 },
  { label: '3 Days', days: 3 },
  { label: '7 Days', days: 7 },
  { label: '14 Days', days: 14 },
];

export function CreateAuctionDialog({
  open,
  onOpenChange,
  nft,
  onSuccess,
}: CreateAuctionDialogProps) {
  const { toast } = useToast();
  const account = useActiveAccount();
  const [step, setStep] = useState<Step>('configure');
  const [startingBid, setStartingBid] = useState('');
  const [buyoutPrice, setBuyoutPrice] = useState('');
  const [duration, setDuration] = useState(7);
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  // tRPC mutation
  const createAuctionMutation = trpc.marketplace.auctions.create.useMutation();

  const royaltyPercentage = nft?.collection.royaltyPercentage || 0;
  const bidNum = parseFloat(startingBid) || 0;

  // Check if NFT is on-chain and approval status when dialog opens
  useEffect(() => {
    const checkOnChainAndApproval = async () => {
      if (!nft || !account?.address) return;

      // Check if NFT is on-chain first - cannot auction unminted NFTs
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
        setStartingBid('');
        setBuyoutPrice('');
        setDuration(7);
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
      setStep('creating');
      handleCreate();
    } catch (err: any) {
      console.error('Approval error:', err);
      setError(err.message || 'Failed to approve collection');
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!account || !nft || !startingBid) return;

    setIsLoading(true);
    setError(null);

    try {
      // Check approval first
      if (!isApproved) {
        setStep('approval');
        return;
      }

      setStep('creating');

      // Calculate end timestamp
      const endDate = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);

      // Use onChainTokenId for the actual blockchain call (falls back to tokenId)
      const tokenIdForChain = nft.onChainTokenId || nft.tokenId;

      console.log('Attempting to create auction for NFT:', {
        id: nft.id,
        tokenId: nft.tokenId,
        onChainTokenId: nft.onChainTokenId,
        tokenIdForChain,
        collectionAddress: nft.collection.address,
        seller: account.address,
      });

      // Create the auction on-chain
      const result = await createEnglishAuction(
        {
          assetContractAddress: nft.collection.address,
          tokenId: tokenIdForChain,
          minimumBidAmount: startingBid,
          buyoutBidAmount: buyoutPrice || undefined,
          endTimestamp: endDate,
        },
        account
      );

      setTransactionHash(result.transactionHash);

      // Save to database via tRPC - handle errors gracefully since on-chain tx succeeded
      try {
        await createAuctionMutation.mutateAsync({
          nftId: nft.id,
          auctionId: result.auctionId,
          sellerAddress: account.address,
          assetContractAddress: nft.collection.address,
          tokenId: nft.tokenId,
          minimumBidAmount: parseFloat(startingBid),
          buyoutBidAmount: buyoutPrice ? parseFloat(buyoutPrice) : undefined,
          startTimestamp: new Date().toISOString(),
          endTimestamp: endDate.toISOString(),
          transactionHash: result.transactionHash,
        });
      } catch (dbError: any) {
        console.error('Database save failed, but on-chain auction succeeded. Error:', dbError);
        toast({
          title: 'Auction created on-chain',
          description: dbError.message || 'Your auction is live, but there was an issue syncing. It may take a moment to appear.',
          variant: 'default',
        });
      }

      setStep('success');
      toast({ title: 'Auction created successfully!' });
      onSuccess?.();
    } catch (err: any) {
      console.error('Auction creation error:', err);

      // Provide user-friendly error messages
      let errorMessage = err.message || 'Failed to create auction';

      if (errorMessage.includes('may not exist at contract') || errorMessage.includes('execution reverted')) {
        errorMessage = 'This NFT has not been minted on-chain yet. You can only auction NFTs that have been minted to the blockchain.';
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

  const handleContinue = () => {
    if (!startingBid || parseFloat(startingBid) <= 0) {
      toast({ title: 'Please enter a valid starting bid', variant: 'destructive' });
      return;
    }

    if (buyoutPrice && parseFloat(buyoutPrice) <= parseFloat(startingBid)) {
      toast({ title: 'Buyout price must be higher than starting bid', variant: 'destructive' });
      return;
    }

    if (!isApproved) {
      setStep('approval');
    } else {
      handleCreate();
    }
  };

  if (!nft) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black border-white/10 text-white max-w-md p-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {step === 'configure' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <DialogHeader className="p-6 pb-0">
                <DialogTitle className="flex items-center gap-2">
                  <Gavel className="w-5 h-5 text-purple-500" />
                  Create Auction
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

                {/* Starting Bid */}
                <div className="space-y-2">
                  <Label className="text-white/70">Starting Bid</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={startingBid}
                      onChange={(e) => setStartingBid(e.target.value)}
                      className="bg-white/5 border-white/10 text-white text-lg pr-16 h-12"
                      step="0.001"
                      min="0"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60">
                      ETH
                    </span>
                  </div>
                </div>

                {/* Buyout Price (Optional) */}
                <div className="space-y-2">
                  <Label className="text-white/70 flex items-center gap-2">
                    Buy Now Price
                    <span className="text-xs text-white/40">(Optional)</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={buyoutPrice}
                      onChange={(e) => setBuyoutPrice(e.target.value)}
                      className="bg-white/5 border-white/10 text-white text-lg pr-16 h-12"
                      step="0.001"
                      min="0"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60">
                      ETH
                    </span>
                  </div>
                  <p className="text-xs text-white/40">
                    Set a price for instant purchase (must be higher than starting bid)
                  </p>
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
                        onClick={() => setDuration(option.days)}
                        className={cn(
                          'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                          duration === option.days
                            ? 'bg-purple-500 text-white'
                            : 'bg-white/5 text-white/70 hover:bg-white/10'
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fee Info */}
                <div className="flex items-start gap-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <Info className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-white/60">
                    Platform fee of 2.5% will be applied when the auction ends.
                    {royaltyPercentage > 0 && ` Creator royalty of ${royaltyPercentage}% will also be deducted.`}
                  </p>
                </div>

                {/* Continue Button */}
                <Button
                  onClick={handleContinue}
                  disabled={!startingBid || parseFloat(startingBid) <= 0}
                  className="w-full bg-purple-500 text-white hover:bg-purple-600 h-12 font-bold"
                >
                  Continue
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'approval' && (
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
                      Approve the marketplace to transfer NFTs from{' '}
                      <span className="text-white">{nft.collection.name}</span>.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep('configure')}
                    className="flex-1 border-white/20 text-white hover:bg-white/10"
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleApprove}
                    disabled={isLoading}
                    className="flex-1 bg-purple-500 text-white hover:bg-purple-600 font-bold"
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
          )}

          {step === 'creating' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-6 space-y-6"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
                  <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Creating Auction</h3>
                <p className="text-white/60 text-sm">
                  Please confirm the transaction in your wallet...
                </p>
              </div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-6 space-y-6"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-purple-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Auction Created!</h3>
                <p className="text-white/60 text-sm">
                  Your NFT is now up for auction on the marketplace.
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
                  <p className="text-sm text-white/60">Starting bid: {startingBid} ETH</p>
                </div>
              </div>

              {transactionHash && (
                <a
                  href={getExplorerUrl(MARKETPLACE_CHAIN_ID, transactionHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center text-sm text-purple-400 hover:underline"
                >
                  View on {getExplorerName(MARKETPLACE_CHAIN_ID)} →
                </a>
              )}

              <Button
                onClick={() => onOpenChange(false)}
                className="w-full bg-purple-500 text-white hover:bg-purple-600 font-bold"
              >
                Done
              </Button>
            </motion.div>
          )}

          {step === 'error' && (
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
                  onClick={() => onOpenChange(false)}
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setError(null);
                    setStep('configure');
                  }}
                  className="flex-1 bg-purple-500 text-white hover:bg-purple-600 font-bold"
                >
                  Try Again
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'not_on_chain' && (
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
                <h3 className="text-xl font-bold text-white mb-2">Cannot Auction This NFT</h3>
                <p className="text-white/60 text-sm">
                  This NFT has not been minted on-chain yet. Only NFTs that exist on the blockchain can be auctioned.
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
                  <p className="text-xs text-purple-400">{nft.collection.name}</p>
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
                      Once someone claims this NFT from your collection, it will be minted on-chain and can then be auctioned.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => onOpenChange(false)}
                className="w-full bg-white/10 text-white hover:bg-white/20 font-bold"
              >
                Close
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
