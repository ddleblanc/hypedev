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
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MediaRenderer } from '@/components/media-renderer';
import { useToast } from '@/hooks/use-toast';
import { useActiveAccount } from 'thirdweb/react';
import { cancelDirectListing, MARKETPLACE_CHAIN_ID } from '@/lib/marketplace';
import { trpc } from '@/lib/trpc/client';
import {
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getExplorerUrl, getExplorerName } from '@/types/profile';

interface ListedNFT {
  id: string;
  tokenId: string;
  name: string;
  image: string;
  listingId: string;
  listingPrice: number;
  collection: {
    id: string;
    name: string;
    address: string;
  };
}

interface BulkCancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listings: ListedNFT[];
  onSuccess?: () => void;
}

type Step = 'select' | 'confirm' | 'cancelling' | 'success' | 'error';

interface CancelConfig {
  nft: ListedNFT;
  selected: boolean;
  status: 'pending' | 'cancelling' | 'success' | 'error';
  error?: string;
  transactionHash?: string;
}

export function BulkCancelDialog({
  open,
  onOpenChange,
  listings,
  onSuccess,
}: BulkCancelDialogProps) {
  const { toast } = useToast();
  const account = useActiveAccount();
  const [step, setStep] = useState<Step>('select');
  const [cancelConfigs, setCancelConfigs] = useState<CancelConfig[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // tRPC mutation
  const cancelListingMutation = trpc.marketplace.listings.cancel.useMutation();

  // Initialize configs when listings change
  useEffect(() => {
    if (listings.length > 0) {
      setCancelConfigs(
        listings.map((nft) => ({
          nft,
          selected: true,
          status: 'pending',
        }))
      );
    }
  }, [listings]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep('select');
        setError(null);
        setCurrentIndex(0);
      }, 300);
    }
  }, [open]);

  const selectedConfigs = cancelConfigs.filter((c) => c.selected);
  const successCount = cancelConfigs.filter((c) => c.status === 'success').length;
  const errorCount = cancelConfigs.filter((c) => c.status === 'error').length;

  const toggleSelect = (index: number) => {
    setCancelConfigs((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], selected: !updated[index].selected };
      return updated;
    });
  };

  const toggleSelectAll = () => {
    const allSelected = cancelConfigs.every((c) => c.selected);
    setCancelConfigs((prev) =>
      prev.map((c) => ({ ...c, selected: !allSelected }))
    );
  };

  const handleStartCancel = async () => {
    if (!account) return;

    setIsProcessing(true);
    setStep('cancelling');

    for (let i = 0; i < selectedConfigs.length; i++) {
      const config = selectedConfigs[i];
      setCurrentIndex(i);

      // Update status to cancelling
      setCancelConfigs((prev) =>
        prev.map((c) =>
          c.nft.id === config.nft.id ? { ...c, status: 'cancelling' } : c
        )
      );

      try {
        // Cancel on-chain
        const result = await cancelDirectListing(config.nft.listingId, account);

        // Update database
        try {
          await cancelListingMutation.mutateAsync({
            listingId: config.nft.listingId,
          });
        } catch (dbError) {
          console.error('Database update failed:', dbError);
        }

        // Update status to success
        setCancelConfigs((prev) =>
          prev.map((c) =>
            c.nft.id === config.nft.id
              ? { ...c, status: 'success', transactionHash: result.transactionHash }
              : c
          )
        );
      } catch (err: any) {
        console.error(`Cancel error for ${config.nft.name}:`, err);
        setCancelConfigs((prev) =>
          prev.map((c) =>
            c.nft.id === config.nft.id
              ? { ...c, status: 'error', error: err.message }
              : c
          )
        );
      }
    }

    setIsProcessing(false);
    setStep('success');
    onSuccess?.();
  };

  if (listings.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black border-white/10 text-white max-w-lg p-0 overflow-hidden max-h-[90vh]">
        <AnimatePresence mode="wait">
          {step === 'select' && (
            <SelectStep
              configs={cancelConfigs}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
              onContinue={() => setStep('confirm')}
              selectedCount={selectedConfigs.length}
            />
          )}

          {step === 'confirm' && (
            <ConfirmStep
              selectedCount={selectedConfigs.length}
              onBack={() => setStep('select')}
              onStart={handleStartCancel}
            />
          )}

          {step === 'cancelling' && (
            <CancellingStep
              configs={cancelConfigs}
              currentIndex={currentIndex}
              totalCount={selectedConfigs.length}
            />
          )}

          {step === 'success' && (
            <SuccessStep
              successCount={successCount}
              errorCount={errorCount}
              configs={cancelConfigs}
              onClose={() => onOpenChange(false)}
            />
          )}

          {step === 'error' && (
            <ErrorStep
              error={error}
              onRetry={() => {
                setError(null);
                setStep('select');
              }}
              onClose={() => onOpenChange(false)}
            />
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

function SelectStep({
  configs,
  onToggleSelect,
  onToggleSelectAll,
  onContinue,
  selectedCount,
}: {
  configs: CancelConfig[];
  onToggleSelect: (index: number) => void;
  onToggleSelectAll: () => void;
  onContinue: () => void;
  selectedCount: number;
}) {
  const allSelected = configs.every((c) => c.selected);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      <DialogHeader className="p-6 pb-0">
        <DialogTitle className="flex items-center gap-2">
          <X className="w-5 h-5 text-red-400" />
          Cancel Listings ({selectedCount} selected)
        </DialogTitle>
      </DialogHeader>

      <div className="p-6 space-y-4">
        {/* Select All */}
        <div className="flex items-center gap-2">
          <Checkbox
            checked={allSelected}
            onCheckedChange={onToggleSelectAll}
          />
          <span className="text-sm text-white/70">Select All</span>
        </div>

        {/* NFT List */}
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-2">
            {configs.map((config, index) => (
              <div
                key={config.nft.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg transition-colors',
                  config.selected ? 'bg-white/10' : 'bg-white/5 opacity-50'
                )}
              >
                <Checkbox
                  checked={config.selected}
                  onCheckedChange={() => onToggleSelect(index)}
                />
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                  <MediaRenderer
                    src={config.nft.image}
                    alt={config.nft.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {config.nft.name}
                  </p>
                  <p className="text-xs text-white/40 truncate">
                    {config.nft.collection.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">
                    {config.nft.listingPrice} ETH
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <Button
          onClick={onContinue}
          disabled={selectedCount === 0}
          className="w-full bg-red-500 text-white hover:bg-red-600 h-12 font-bold"
        >
          Cancel {selectedCount} Listing{selectedCount !== 1 ? 's' : ''}
        </Button>
      </div>
    </motion.div>
  );
}

function ConfirmStep({
  selectedCount,
  onBack,
  onStart,
}: {
  selectedCount: number;
  onBack: () => void;
  onStart: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <DialogHeader className="p-6 pb-0">
        <DialogTitle>Confirm Cancellation</DialogTitle>
      </DialogHeader>

      <div className="p-6 space-y-6">
        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-red-400">Warning</p>
            <p className="text-sm text-white/70">
              You are about to cancel <span className="text-white font-medium">{selectedCount} listing{selectedCount !== 1 ? 's' : ''}</span>.
              Each cancellation requires a blockchain transaction and cannot be undone.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex-1 border-white/20 text-white hover:bg-white/10"
          >
            Back
          </Button>
          <Button
            onClick={onStart}
            className="flex-1 bg-red-500 text-white hover:bg-red-600 font-bold"
          >
            Yes, Cancel Listings
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function CancellingStep({
  configs,
  currentIndex,
  totalCount,
}: {
  configs: CancelConfig[];
  currentIndex: number;
  totalCount: number;
}) {
  const successCount = configs.filter((c) => c.status === 'success').length;
  const currentConfig = configs.find((c) => c.status === 'cancelling');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-6 space-y-6"
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <Loader2 className="w-8 h-8 text-red-400 animate-spin" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">
          Cancelling Listings ({successCount + 1}/{totalCount})
        </h3>
        <p className="text-white/60 text-sm">
          Please confirm the transaction in your wallet...
        </p>
      </div>

      {currentConfig && (
        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
          <div className="w-12 h-12 rounded-lg overflow-hidden">
            <MediaRenderer
              src={currentConfig.nft.image}
              alt={currentConfig.nft.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <p className="text-sm text-white truncate">{currentConfig.nft.name}</p>
            <p className="text-sm text-white/40">
              Listed for {currentConfig.nft.listingPrice} ETH
            </p>
          </div>
        </div>
      )}

      {/* Progress list */}
      <ScrollArea className="h-[150px]">
        <div className="space-y-2">
          {configs
            .filter((c) => c.selected)
            .map((config) => (
              <div
                key={config.nft.id}
                className="flex items-center gap-2 text-sm"
              >
                {config.status === 'success' && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                {config.status === 'error' && (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
                {config.status === 'cancelling' && (
                  <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
                )}
                {config.status === 'pending' && (
                  <div className="w-4 h-4 rounded-full border-2 border-white/20" />
                )}
                <span
                  className={cn(
                    'truncate',
                    config.status === 'success' && 'text-green-500',
                    config.status === 'error' && 'text-red-500',
                    config.status === 'pending' && 'text-white/40'
                  )}
                >
                  {config.nft.name}
                </span>
              </div>
            ))}
        </div>
      </ScrollArea>
    </motion.div>
  );
}

function SuccessStep({
  successCount,
  errorCount,
  configs,
  onClose,
}: {
  successCount: number;
  errorCount: number;
  configs: CancelConfig[];
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
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Cancellation Complete</h3>
        <p className="text-white/60 text-sm">
          {successCount} listing{successCount !== 1 ? 's' : ''} cancelled successfully
          {errorCount > 0 && `, ${errorCount} failed`}
        </p>
      </div>

      <ScrollArea className="h-[200px]">
        <div className="space-y-2">
          {configs
            .filter((c) => c.selected)
            .map((config) => (
              <div
                key={config.nft.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-white/5"
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden">
                  <MediaRenderer
                    src={config.nft.image}
                    alt={config.nft.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{config.nft.name}</p>
                  <p className="text-xs text-white/40">
                    Was {config.nft.listingPrice} ETH
                  </p>
                </div>
                {config.status === 'success' && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
                {config.status === 'error' && (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
            ))}
        </div>
      </ScrollArea>

      <Button
        onClick={onClose}
        className="w-full bg-white text-black hover:bg-white/90 font-bold"
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
        <h3 className="text-xl font-bold text-white mb-2">Cancellation Failed</h3>
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
          Close
        </Button>
        <Button
          onClick={onRetry}
          className="flex-1 bg-red-500 text-white hover:bg-red-600 font-bold"
        >
          Try Again
        </Button>
      </div>
    </motion.div>
  );
}
