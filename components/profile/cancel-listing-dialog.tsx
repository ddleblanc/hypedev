'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { MediaRenderer } from '@/components/media-renderer';
import { useToast } from '@/hooks/use-toast';
import { useActiveAccount } from 'thirdweb/react';
import { cancelDirectListing, cancelEnglishAuction } from '@/lib/marketplace';
import { trpc } from '@/lib/trpc/client';
import {
  AlertTriangle,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
} from 'lucide-react';

interface NFTItem {
  id: string;
  tokenId: string;
  name: string;
  image: string;
  collection: {
    id: string;
    name: string;
    address: string;
  };
  listingId?: string | null;
  listingType?: string | null;
  listingPrice?: number | null;
}

interface CancelListingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nft: NFTItem | null;
  onSuccess?: () => void;
}

type Step = 'confirm' | 'cancelling' | 'success' | 'error';

export function CancelListingDialog({
  open,
  onOpenChange,
  nft,
  onSuccess,
}: CancelListingDialogProps) {
  const { toast } = useToast();
  const account = useActiveAccount();
  const [step, setStep] = useState<Step>('confirm');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // tRPC mutations
  const cancelListingMutation = trpc.marketplace.listings.cancel.useMutation();
  const cancelAuctionMutation = trpc.marketplace.auctions.cancel.useMutation();

  const handleCancel = async () => {
    if (!account || !nft || !nft.listingId) return;

    setIsLoading(true);
    setError(null);
    setStep('cancelling');

    try {
      // Cancel on-chain based on listing type
      if (nft.listingType === 'auction') {
        await cancelEnglishAuction(nft.listingId, account);

        // Update database via tRPC
        await cancelAuctionMutation.mutateAsync({
          auctionId: nft.listingId,
        });
      } else {
        await cancelDirectListing(nft.listingId, account);

        // Update database via tRPC
        await cancelListingMutation.mutateAsync({
          listingId: nft.listingId,
        });
      }

      setStep('success');
      toast({ title: 'Listing cancelled successfully' });
      onSuccess?.();
    } catch (err: any) {
      console.error('Cancel error:', err);
      setError(err.message || 'Failed to cancel listing');
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after animation
    setTimeout(() => {
      setStep('confirm');
      setError(null);
    }, 300);
  };

  if (!nft) return null;

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="bg-black border-white/10 text-white max-w-md">
        <AnimatePresence mode="wait">
          {step === 'confirm' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-white">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Cancel Listing
                </AlertDialogTitle>
                <AlertDialogDescription className="text-white/60">
                  Are you sure you want to cancel this listing? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="my-6">
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
                    {nft.listingPrice && (
                      <p className="text-sm text-white/60 mt-1">
                        {nft.listingType === 'auction' ? 'Starting bid: ' : 'Listed at: '}
                        {nft.listingPrice} ETH
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  Keep Listing
                </Button>
                <Button
                  onClick={handleCancel}
                  className="flex-1 bg-red-500 text-white hover:bg-red-600"
                >
                  Cancel Listing
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'cancelling' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-8"
            >
              <div className="flex flex-col items-center text-center">
                <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Cancelling Listing</h3>
                <p className="text-white/60 text-sm">
                  Please confirm the transaction in your wallet...
                </p>
              </div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-8"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Listing Cancelled</h3>
                <p className="text-white/60 text-sm mb-6">
                  Your NFT is no longer listed on the marketplace.
                </p>
                <Button
                  onClick={handleClose}
                  className="bg-white/10 text-white hover:bg-white/20"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'error' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-8"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Failed to Cancel</h3>
                <p className="text-white/60 text-sm mb-6">
                  {error || 'Something went wrong. Please try again.'}
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      setError(null);
                      setStep('confirm');
                    }}
                    className="bg-red-500 text-white hover:bg-red-600"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </AlertDialogContent>
    </AlertDialog>
  );
}
