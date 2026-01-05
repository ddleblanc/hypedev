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
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MediaRenderer } from '@/components/media-renderer';
import { useToast } from '@/hooks/use-toast';
import { useActiveAccount } from 'thirdweb/react';
import {
  checkCollectionApproval,
  approveMarketplace,
  createDirectListing,
  MARKETPLACE_CHAIN_ID,
} from '@/lib/marketplace';
import { trpc } from '@/lib/trpc/client';
import {
  Tag,
  Loader2,
  CheckCircle,
  AlertCircle,
  Calendar,
  ChevronRight,
  Info,
  X,
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
  isOnChain?: boolean;
  onChainTokenId?: string | null;
}

interface BulkListingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nfts: NFTItem[];
  onSuccess?: () => void;
}

type Step = 'select' | 'configure' | 'approval' | 'listing' | 'success' | 'error';

interface ListingConfig {
  nft: NFTItem;
  price: string;
  selected: boolean;
  status: 'pending' | 'approving' | 'listing' | 'success' | 'error';
  error?: string;
  transactionHash?: string;
}

const durationOptions = [
  { label: '1 Day', days: 1 },
  { label: '7 Days', days: 7 },
  { label: '30 Days', days: 30 },
  { label: '6 Months', days: 180 },
];

export function BulkListingDialog({
  open,
  onOpenChange,
  nfts,
  onSuccess,
}: BulkListingDialogProps) {
  const { toast } = useToast();
  const account = useActiveAccount();
  const [step, setStep] = useState<Step>('select');
  const [listingConfigs, setListingConfigs] = useState<ListingConfig[]>([]);
  const [globalPrice, setGlobalPrice] = useState('');
  const [duration, setDuration] = useState(30);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [approvedCollections, setApprovedCollections] = useState<Set<string>>(new Set());

  // tRPC mutation
  const createListingMutation = trpc.marketplace.listings.create.useMutation();

  // Initialize configs when NFTs change
  useEffect(() => {
    if (nfts.length > 0) {
      setListingConfigs(
        nfts
          .filter((nft) => nft.isOnChain !== false)
          .map((nft) => ({
            nft,
            price: '',
            selected: true,
            status: 'pending',
          }))
      );
    }
  }, [nfts]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep('select');
        setGlobalPrice('');
        setDuration(30);
        setError(null);
        setCurrentIndex(0);
        setApprovedCollections(new Set());
      }, 300);
    }
  }, [open]);

  const selectedConfigs = listingConfigs.filter((c) => c.selected);
  const successCount = listingConfigs.filter((c) => c.status === 'success').length;
  const errorCount = listingConfigs.filter((c) => c.status === 'error').length;

  const toggleSelect = (index: number) => {
    setListingConfigs((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], selected: !updated[index].selected };
      return updated;
    });
  };

  const setIndividualPrice = (index: number, price: string) => {
    setListingConfigs((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], price };
      return updated;
    });
  };

  const applyGlobalPrice = () => {
    if (!globalPrice) return;
    setListingConfigs((prev) =>
      prev.map((config) =>
        config.selected ? { ...config, price: globalPrice } : config
      )
    );
  };

  const handleContinue = () => {
    // Validate all selected items have prices
    const invalidConfigs = selectedConfigs.filter(
      (c) => !c.price || parseFloat(c.price) <= 0
    );
    if (invalidConfigs.length > 0) {
      toast({
        title: 'Missing prices',
        description: `Please set prices for all ${invalidConfigs.length} selected NFTs`,
        variant: 'destructive',
      });
      return;
    }
    setStep('configure');
  };

  const handleStartListing = async () => {
    if (!account) return;

    setIsProcessing(true);
    setStep('listing');

    // Group by collection for approval check
    const collectionGroups = new Map<string, ListingConfig[]>();
    for (const config of selectedConfigs) {
      const addr = config.nft.collection.address.toLowerCase();
      if (!collectionGroups.has(addr)) {
        collectionGroups.set(addr, []);
      }
      collectionGroups.get(addr)!.push(config);
    }

    // Check and approve collections
    for (const [collectionAddress] of collectionGroups) {
      if (!approvedCollections.has(collectionAddress)) {
        try {
          const isApproved = await checkCollectionApproval(
            collectionAddress,
            account.address
          );
          if (!isApproved) {
            setStep('approval');
            // Update status for all NFTs in this collection
            setListingConfigs((prev) =>
              prev.map((c) =>
                c.nft.collection.address.toLowerCase() === collectionAddress
                  ? { ...c, status: 'approving' }
                  : c
              )
            );

            await approveMarketplace(collectionAddress, account);
          }
          setApprovedCollections((prev) => new Set(prev).add(collectionAddress));
        } catch (err: any) {
          console.error('Approval error:', err);
          setError(`Failed to approve collection: ${err.message}`);
          setStep('error');
          setIsProcessing(false);
          return;
        }
      }
    }

    setStep('listing');

    // Process each listing
    for (let i = 0; i < selectedConfigs.length; i++) {
      const config = selectedConfigs[i];
      setCurrentIndex(i);

      // Update status to listing
      setListingConfigs((prev) =>
        prev.map((c) =>
          c.nft.id === config.nft.id ? { ...c, status: 'listing' } : c
        )
      );

      try {
        const endDate = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
        const tokenIdForChain = config.nft.onChainTokenId || config.nft.tokenId;

        const result = await createDirectListing(
          {
            assetContractAddress: config.nft.collection.address,
            tokenId: tokenIdForChain,
            pricePerToken: config.price,
            endTimestamp: endDate,
          },
          account
        );

        // Save to database
        try {
          await createListingMutation.mutateAsync({
            nftId: config.nft.id,
            listingId: result.listingId,
            sellerAddress: account.address,
            assetContractAddress: config.nft.collection.address,
            tokenId: config.nft.tokenId,
            pricePerToken: parseFloat(config.price),
            startTimestamp: new Date().toISOString(),
            endTimestamp: endDate.toISOString(),
            transactionHash: result.transactionHash,
          });
        } catch (dbError) {
          console.error('Database save failed:', dbError);
        }

        // Update status to success
        setListingConfigs((prev) =>
          prev.map((c) =>
            c.nft.id === config.nft.id
              ? { ...c, status: 'success', transactionHash: result.transactionHash }
              : c
          )
        );
      } catch (err: any) {
        console.error(`Listing error for ${config.nft.name}:`, err);
        setListingConfigs((prev) =>
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

  if (nfts.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black border-white/10 text-white max-w-lg p-0 overflow-hidden max-h-[90vh]">
        <AnimatePresence mode="wait">
          {step === 'select' && (
            <SelectStep
              configs={listingConfigs}
              globalPrice={globalPrice}
              onGlobalPriceChange={setGlobalPrice}
              onApplyGlobalPrice={applyGlobalPrice}
              onToggleSelect={toggleSelect}
              onSetPrice={setIndividualPrice}
              onContinue={handleContinue}
              selectedCount={selectedConfigs.length}
            />
          )}

          {step === 'configure' && (
            <ConfigureStep
              selectedCount={selectedConfigs.length}
              duration={duration}
              onDurationChange={setDuration}
              onBack={() => setStep('select')}
              onStart={handleStartListing}
            />
          )}

          {step === 'approval' && (
            <ApprovalStep configs={listingConfigs} />
          )}

          {step === 'listing' && (
            <ListingStep
              configs={listingConfigs}
              currentIndex={currentIndex}
              totalCount={selectedConfigs.length}
            />
          )}

          {step === 'success' && (
            <SuccessStep
              successCount={successCount}
              errorCount={errorCount}
              configs={listingConfigs}
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
  globalPrice,
  onGlobalPriceChange,
  onApplyGlobalPrice,
  onToggleSelect,
  onSetPrice,
  onContinue,
  selectedCount,
}: {
  configs: ListingConfig[];
  globalPrice: string;
  onGlobalPriceChange: (price: string) => void;
  onApplyGlobalPrice: () => void;
  onToggleSelect: (index: number) => void;
  onSetPrice: (index: number, price: string) => void;
  onContinue: () => void;
  selectedCount: number;
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
          Bulk List NFTs ({selectedCount} selected)
        </DialogTitle>
      </DialogHeader>

      <div className="p-6 space-y-4">
        {/* Global Price */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              type="number"
              placeholder="Set price for all"
              value={globalPrice}
              onChange={(e) => onGlobalPriceChange(e.target.value)}
              className="bg-white/5 border-white/10 text-white pr-16"
              step="0.001"
              min="0"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">
              ETH
            </span>
          </div>
          <Button
            variant="outline"
            onClick={onApplyGlobalPrice}
            disabled={!globalPrice}
            className="border-white/20 text-white hover:bg-white/10"
          >
            Apply All
          </Button>
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
                <div className="w-24">
                  <Input
                    type="number"
                    placeholder="Price"
                    value={config.price}
                    onChange={(e) => onSetPrice(index, e.target.value)}
                    className="bg-white/5 border-white/10 text-white text-sm h-8"
                    step="0.001"
                    min="0"
                    disabled={!config.selected}
                  />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <Button
          onClick={onContinue}
          disabled={selectedCount === 0}
          className="w-full bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90 h-12 font-bold"
        >
          Continue ({selectedCount} NFTs)
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
}

function ConfigureStep({
  selectedCount,
  duration,
  onDurationChange,
  onBack,
  onStart,
}: {
  selectedCount: number;
  duration: number;
  onDurationChange: (days: number) => void;
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
        <DialogTitle>Listing Duration</DialogTitle>
      </DialogHeader>

      <div className="p-6 space-y-6">
        <div className="flex items-start gap-3 p-3 bg-[rgb(163,255,18)]/10 border border-[rgb(163,255,18)]/20 rounded-lg">
          <Info className="w-4 h-4 text-[rgb(163,255,18)] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-white/70">
            You are about to list <span className="text-white font-medium">{selectedCount} NFTs</span>.
            Each will require a blockchain transaction.
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-white/70 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Duration for all listings
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
            className="flex-1 bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90 font-bold"
          >
            Start Listing
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function ApprovalStep({ configs }: { configs: ListingConfig[] }) {
  const approvingConfig = configs.find((c) => c.status === 'approving');

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
        <h3 className="text-xl font-bold text-white mb-2">Approving Collection</h3>
        <p className="text-white/60 text-sm">
          Please approve the marketplace to transfer NFTs from{' '}
          <span className="text-white">{approvingConfig?.nft.collection.name}</span>
        </p>
      </div>
    </motion.div>
  );
}

function ListingStep({
  configs,
  currentIndex,
  totalCount,
}: {
  configs: ListingConfig[];
  currentIndex: number;
  totalCount: number;
}) {
  const successCount = configs.filter((c) => c.status === 'success').length;
  const currentConfig = configs.find((c) => c.status === 'listing');

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
        <h3 className="text-xl font-bold text-white mb-2">
          Listing NFTs ({successCount + 1}/{totalCount})
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
            <p className="text-lg font-bold text-[rgb(163,255,18)]">
              {currentConfig.price} ETH
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
                {config.status === 'listing' && (
                  <Loader2 className="w-4 h-4 text-[rgb(163,255,18)] animate-spin" />
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
  configs: ListingConfig[];
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
        <h3 className="text-xl font-bold text-white mb-2">Bulk Listing Complete</h3>
        <p className="text-white/60 text-sm">
          {successCount} NFTs listed successfully
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
                  <p className="text-xs text-white/40">{config.price} ETH</p>
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
        <h3 className="text-xl font-bold text-white mb-2">Listing Failed</h3>
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
