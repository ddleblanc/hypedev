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
import { transferNFT, MARKETPLACE_CHAIN_ID } from '@/lib/marketplace';
import {
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  ChevronRight,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getExplorerUrl, getExplorerName } from '@/types/profile';
import { isAddress } from 'viem';

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
  isOnChain?: boolean;
  onChainTokenId?: string | null;
}

interface BulkTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nfts: NFTItem[];
  onSuccess?: () => void;
}

type Step = 'select' | 'recipient' | 'confirm' | 'transferring' | 'success' | 'error';

interface TransferConfig {
  nft: NFTItem;
  selected: boolean;
  status: 'pending' | 'transferring' | 'success' | 'error';
  error?: string;
  transactionHash?: string;
}

export function BulkTransferDialog({
  open,
  onOpenChange,
  nfts,
  onSuccess,
}: BulkTransferDialogProps) {
  const { toast } = useToast();
  const account = useActiveAccount();
  const [step, setStep] = useState<Step>('select');
  const [transferConfigs, setTransferConfigs] = useState<TransferConfig[]>([]);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Initialize configs when NFTs change
  useEffect(() => {
    if (nfts.length > 0) {
      setTransferConfigs(
        nfts
          .filter((nft) => nft.isOnChain !== false)
          .map((nft) => ({
            nft,
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
        setRecipientAddress('');
        setError(null);
        setCurrentIndex(0);
        // Reset statuses
        setTransferConfigs((prev) =>
          prev.map((c) => ({ ...c, status: 'pending', error: undefined, transactionHash: undefined }))
        );
      }, 300);
    }
  }, [open]);

  const selectedConfigs = transferConfigs.filter((c) => c.selected);
  const successCount = transferConfigs.filter((c) => c.status === 'success').length;
  const errorCount = transferConfigs.filter((c) => c.status === 'error').length;

  const toggleSelect = (index: number) => {
    setTransferConfigs((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], selected: !updated[index].selected };
      return updated;
    });
  };

  const toggleSelectAll = () => {
    const allSelected = transferConfigs.every((c) => c.selected);
    setTransferConfigs((prev) =>
      prev.map((c) => ({ ...c, selected: !allSelected }))
    );
  };

  const validateRecipient = (): boolean => {
    if (!recipientAddress) {
      toast({ title: 'Please enter a recipient address', variant: 'destructive' });
      return false;
    }
    if (!isAddress(recipientAddress)) {
      toast({ title: 'Invalid Ethereum address', variant: 'destructive' });
      return false;
    }
    if (account && recipientAddress.toLowerCase() === account.address.toLowerCase()) {
      toast({ title: 'Cannot transfer to yourself', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const handleStartTransfer = async () => {
    if (!account) return;

    setIsProcessing(true);
    setStep('transferring');

    for (let i = 0; i < selectedConfigs.length; i++) {
      const config = selectedConfigs[i];
      setCurrentIndex(i);

      // Update status to transferring
      setTransferConfigs((prev) =>
        prev.map((c) =>
          c.nft.id === config.nft.id ? { ...c, status: 'transferring' } : c
        )
      );

      try {
        const tokenIdForChain = config.nft.onChainTokenId || config.nft.tokenId;

        // Transfer on-chain
        const result = await transferNFT(
          {
            assetContractAddress: config.nft.collection.address,
            tokenId: tokenIdForChain,
            toAddress: recipientAddress,
          },
          account
        );

        // Update status to success
        setTransferConfigs((prev) =>
          prev.map((c) =>
            c.nft.id === config.nft.id
              ? { ...c, status: 'success', transactionHash: result.transactionHash }
              : c
          )
        );
      } catch (err: any) {
        console.error(`Transfer error for ${config.nft.name}:`, err);
        setTransferConfigs((prev) =>
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
              configs={transferConfigs}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
              onContinue={() => setStep('recipient')}
              selectedCount={selectedConfigs.length}
            />
          )}

          {step === 'recipient' && (
            <RecipientStep
              recipientAddress={recipientAddress}
              onRecipientChange={setRecipientAddress}
              selectedCount={selectedConfigs.length}
              onBack={() => setStep('select')}
              onContinue={() => {
                if (validateRecipient()) {
                  setStep('confirm');
                }
              }}
            />
          )}

          {step === 'confirm' && (
            <ConfirmStep
              selectedCount={selectedConfigs.length}
              recipientAddress={recipientAddress}
              onBack={() => setStep('recipient')}
              onStart={handleStartTransfer}
            />
          )}

          {step === 'transferring' && (
            <TransferringStep
              configs={transferConfigs}
              currentIndex={currentIndex}
              totalCount={selectedConfigs.length}
              recipientAddress={recipientAddress}
            />
          )}

          {step === 'success' && (
            <SuccessStep
              successCount={successCount}
              errorCount={errorCount}
              configs={transferConfigs}
              recipientAddress={recipientAddress}
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
  configs: TransferConfig[];
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
          <Send className="w-5 h-5 text-[rgb(163,255,18)]" />
          Bulk Transfer ({selectedCount} selected)
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

function RecipientStep({
  recipientAddress,
  onRecipientChange,
  selectedCount,
  onBack,
  onContinue,
}: {
  recipientAddress: string;
  onRecipientChange: (address: string) => void;
  selectedCount: number;
  onBack: () => void;
  onContinue: () => void;
}) {
  const isValidAddress = recipientAddress ? isAddress(recipientAddress) : false;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <DialogHeader className="p-6 pb-0">
        <DialogTitle className="flex items-center gap-2">
          <User className="w-5 h-5 text-[rgb(163,255,18)]" />
          Recipient Address
        </DialogTitle>
      </DialogHeader>

      <div className="p-6 space-y-6">
        <p className="text-sm text-white/60">
          Enter the wallet address to receive{' '}
          <span className="text-white font-medium">{selectedCount} NFT{selectedCount !== 1 ? 's' : ''}</span>
        </p>

        <div className="space-y-2">
          <Label className="text-white/70">Recipient Wallet Address</Label>
          <Input
            type="text"
            placeholder="0x..."
            value={recipientAddress}
            onChange={(e) => onRecipientChange(e.target.value)}
            className={cn(
              'bg-white/5 border-white/10 text-white font-mono text-sm',
              recipientAddress && !isValidAddress && 'border-red-500/50'
            )}
          />
          {recipientAddress && !isValidAddress && (
            <p className="text-xs text-red-400">Please enter a valid Ethereum address</p>
          )}
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
            onClick={onContinue}
            disabled={!isValidAddress}
            className="flex-1 bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90 font-bold"
          >
            Continue
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function ConfirmStep({
  selectedCount,
  recipientAddress,
  onBack,
  onStart,
}: {
  selectedCount: number;
  recipientAddress: string;
  onBack: () => void;
  onStart: () => void;
}) {
  const formatAddress = (address: string) =>
    `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <DialogHeader className="p-6 pb-0">
        <DialogTitle>Confirm Transfer</DialogTitle>
      </DialogHeader>

      <div className="p-6 space-y-6">
        <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-amber-400">Warning</p>
            <p className="text-sm text-white/70">
              You are about to transfer{' '}
              <span className="text-white font-medium">
                {selectedCount} NFT{selectedCount !== 1 ? 's' : ''}
              </span>{' '}
              to{' '}
              <span className="text-white font-mono text-xs">
                {formatAddress(recipientAddress)}
              </span>
              . This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="p-4 bg-white/5 rounded-lg">
          <p className="text-xs text-white/40 mb-1">Sending to</p>
          <p className="text-sm text-white font-mono break-all">{recipientAddress}</p>
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
            Transfer NFTs
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function TransferringStep({
  configs,
  currentIndex,
  totalCount,
  recipientAddress,
}: {
  configs: TransferConfig[];
  currentIndex: number;
  totalCount: number;
  recipientAddress: string;
}) {
  const successCount = configs.filter((c) => c.status === 'success').length;
  const currentConfig = configs.find((c) => c.status === 'transferring');

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
          Transferring NFTs ({successCount + 1}/{totalCount})
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
            <p className="text-xs text-white/40">{currentConfig.nft.collection.name}</p>
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
                {config.status === 'transferring' && (
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
  recipientAddress,
  onClose,
}: {
  successCount: number;
  errorCount: number;
  configs: TransferConfig[];
  recipientAddress: string;
  onClose: () => void;
}) {
  const formatAddress = (address: string) =>
    `${address.slice(0, 6)}...${address.slice(-4)}`;

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
        <h3 className="text-xl font-bold text-white mb-2">Transfer Complete</h3>
        <p className="text-white/60 text-sm">
          {successCount} NFT{successCount !== 1 ? 's' : ''} transferred to{' '}
          <span className="text-white font-mono">{formatAddress(recipientAddress)}</span>
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
                  {config.status === 'success' && config.transactionHash && (
                    <a
                      href={getExplorerUrl(MARKETPLACE_CHAIN_ID, config.transactionHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[rgb(163,255,18)] hover:underline"
                    >
                      View on {getExplorerName(MARKETPLACE_CHAIN_ID)}
                    </a>
                  )}
                  {config.status === 'error' && (
                    <p className="text-xs text-red-400 truncate">{config.error}</p>
                  )}
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
        <h3 className="text-xl font-bold text-white mb-2">Transfer Failed</h3>
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
          className="flex-1 bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90 font-bold"
        >
          Try Again
        </Button>
      </div>
    </motion.div>
  );
}
