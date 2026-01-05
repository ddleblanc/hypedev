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
import { MediaRenderer } from '@/components/media-renderer';
import { useToast } from '@/hooks/use-toast';
import { useActiveAccount } from 'thirdweb/react';
import { makeCollectionOffer } from '@/lib/marketplace-actions';
import { MARKETPLACE_CHAIN_ID } from '@/lib/marketplace';
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Info,
  Calendar,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getExplorerUrl, getExplorerName } from '@/types/profile';

interface CollectionInfo {
  id: string;
  name: string;
  address: string;
  image?: string | null;
  floorPrice?: number | null;
  totalSupply?: number;
}

interface CollectionOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection: CollectionInfo | null;
  onSuccess?: () => void;
}

type Step = 'configure' | 'submitting' | 'success' | 'error';

const durationOptions = [
  { label: '1 Day', days: 1 },
  { label: '3 Days', days: 3 },
  { label: '7 Days', days: 7 },
  { label: '30 Days', days: 30 },
];

export function CollectionOfferDialog({
  open,
  onOpenChange,
  collection,
  onSuccess,
}: CollectionOfferDialogProps) {
  const { toast } = useToast();
  const account = useActiveAccount();
  const [step, setStep] = useState<Step>('configure');
  const [offerAmount, setOfferAmount] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [duration, setDuration] = useState(7);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  const priceNum = parseFloat(offerAmount) || 0;
  const totalCost = priceNum * quantity;

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep('configure');
        setOfferAmount('');
        setQuantity(1);
        setDuration(7);
        setError(null);
        setTransactionHash(null);
      }, 300);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!account || !collection || !offerAmount) return;

    setIsLoading(true);
    setError(null);
    setStep('submitting');

    try {
      // Use centralized action (handles on-chain + DB)
      const result = await makeCollectionOffer(
        {
          collectionId: collection.id,
          contractAddress: collection.address,
          offerAmount: offerAmount,
          quantity: quantity,
          durationDays: duration,
        },
        account
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to create collection offer');
      }

      setTransactionHash(result.transactionHash || null);
      setStep('success');
      toast({ title: 'Collection offer created!' });
      onSuccess?.();
    } catch (err: unknown) {
      console.error('Collection offer error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create collection offer';
      setError(errorMessage);
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    if (!offerAmount || parseFloat(offerAmount) <= 0) {
      toast({ title: 'Please enter a valid offer amount', variant: 'destructive' });
      return;
    }
    if (quantity < 1) {
      toast({ title: 'Please enter a valid quantity', variant: 'destructive' });
      return;
    }
    handleSubmit();
  };

  if (!collection) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black border-white/10 text-white max-w-md p-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {step === 'configure' && (
            <ConfigureStep
              collection={collection}
              offerAmount={offerAmount}
              onOfferAmountChange={setOfferAmount}
              quantity={quantity}
              onQuantityChange={setQuantity}
              duration={duration}
              onDurationChange={setDuration}
              totalCost={totalCost}
              onContinue={handleContinue}
            />
          )}

          {step === 'submitting' && (
            <SubmittingStep collection={collection} totalCost={totalCost} />
          )}

          {step === 'success' && (
            <SuccessStep
              collection={collection}
              offerAmount={offerAmount}
              quantity={quantity}
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
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

function ConfigureStep({
  collection,
  offerAmount,
  onOfferAmountChange,
  quantity,
  onQuantityChange,
  duration,
  onDurationChange,
  totalCost,
  onContinue,
}: {
  collection: CollectionInfo;
  offerAmount: string;
  onOfferAmountChange: (value: string) => void;
  quantity: number;
  onQuantityChange: (value: number) => void;
  duration: number;
  onDurationChange: (days: number) => void;
  totalCost: number;
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
          <Layers className="w-5 h-5 text-[rgb(163,255,18)]" />
          Make Collection Offer
        </DialogTitle>
      </DialogHeader>

      <div className="p-6 space-y-6">
        {/* Collection Preview */}
        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
          <div className="w-16 h-16 rounded-lg overflow-hidden">
            {collection.image ? (
              <MediaRenderer
                src={collection.image}
                alt={collection.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-white/10 flex items-center justify-center">
                <Layers className="w-8 h-8 text-white/40" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-white truncate">{collection.name}</p>
            <p className="text-sm text-white/60">
              {collection.floorPrice
                ? `Floor: ${collection.floorPrice} ETH`
                : 'No floor price'}
            </p>
            {collection.totalSupply && (
              <p className="text-xs text-white/40">{collection.totalSupply} items</p>
            )}
          </div>
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-3 p-3 bg-[rgb(163,255,18)]/10 border border-[rgb(163,255,18)]/20 rounded-lg">
          <Info className="w-4 h-4 text-[rgb(163,255,18)] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-white/70">
            Your offer will be valid for <span className="text-white">any NFT</span> in this collection.
            Sellers can accept your offer with any NFT they own.
          </p>
        </div>

        {/* Offer Amount Input */}
        <div className="space-y-2">
          <Label className="text-white/70">Offer per NFT</Label>
          <div className="relative">
            <Input
              type="number"
              placeholder={collection.floorPrice ? `Floor: ${collection.floorPrice}` : '0.00'}
              value={offerAmount}
              onChange={(e) => onOfferAmountChange(e.target.value)}
              className="bg-white/5 border-white/10 text-white text-lg pr-16 h-12"
              step="0.001"
              min="0"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60">
              ETH
            </span>
          </div>
        </div>

        {/* Quantity Input */}
        <div className="space-y-2">
          <Label className="text-white/70">Quantity</Label>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              className="border-white/20 text-white hover:bg-white/10"
            >
              -
            </Button>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => onQuantityChange(Math.max(1, parseInt(e.target.value) || 1))}
              className="bg-white/5 border-white/10 text-white text-center h-12 w-20"
              min="1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => onQuantityChange(quantity + 1)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              +
            </Button>
            <span className="text-sm text-white/60 flex-1 text-right">
              NFT{quantity > 1 ? 's' : ''}
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

        {/* Total Cost */}
        {offerAmount && parseFloat(offerAmount) > 0 && (
          <div className="p-4 bg-white/5 rounded-xl">
            <div className="flex justify-between items-center">
              <span className="text-white/60">Total Cost</span>
              <div className="text-right">
                <p className="text-lg font-bold text-[rgb(163,255,18)]">
                  {totalCost.toFixed(4)} ETH
                </p>
                <p className="text-xs text-white/40">
                  {offerAmount} ETH x {quantity}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Continue Button */}
        <Button
          onClick={onContinue}
          disabled={!offerAmount || parseFloat(offerAmount) <= 0}
          className="w-full bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90 h-12 font-bold"
        >
          Make Offer
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
}

function SubmittingStep({
  collection,
  totalCost,
}: {
  collection: CollectionInfo;
  totalCost: number;
}) {
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
        <h3 className="text-xl font-bold text-white mb-2">Creating Offer</h3>
        <p className="text-white/60 text-sm">
          Please confirm the transaction in your wallet...
        </p>
      </div>

      <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
        <div className="w-12 h-12 rounded-lg overflow-hidden">
          {collection.image ? (
            <MediaRenderer
              src={collection.image}
              alt={collection.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-white/10 flex items-center justify-center">
              <Layers className="w-6 h-6 text-white/40" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm text-white truncate">{collection.name}</p>
          <p className="text-lg font-bold text-[rgb(163,255,18)]">
            {totalCost.toFixed(4)} ETH
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function SuccessStep({
  collection,
  offerAmount,
  quantity,
  transactionHash,
  onClose,
}: {
  collection: CollectionInfo;
  offerAmount: string;
  quantity: number;
  transactionHash: string | null;
  onClose: () => void;
}) {
  const totalCost = (parseFloat(offerAmount) || 0) * quantity;

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
        <h3 className="text-xl font-bold text-white mb-2">Offer Created!</h3>
        <p className="text-white/60 text-sm">
          Your collection offer is now active. Any NFT owner from this collection can accept it.
        </p>
      </div>

      <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
        <div className="w-12 h-12 rounded-lg overflow-hidden">
          {collection.image ? (
            <MediaRenderer
              src={collection.image}
              alt={collection.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-white/10 flex items-center justify-center">
              <Layers className="w-6 h-6 text-white/40" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm text-white truncate">{collection.name}</p>
          <p className="text-xs text-white/60">
            {offerAmount} ETH x {quantity} NFT{quantity > 1 ? 's' : ''}
          </p>
          <p className="text-lg font-bold text-[rgb(163,255,18)]">
            {totalCost.toFixed(4)} ETH total
          </p>
        </div>
      </div>

      {transactionHash && (
        <a
          href={getExplorerUrl(MARKETPLACE_CHAIN_ID, transactionHash)}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-sm text-[rgb(163,255,18)] hover:underline"
        >
          View on {getExplorerName(MARKETPLACE_CHAIN_ID)} &rarr;
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
