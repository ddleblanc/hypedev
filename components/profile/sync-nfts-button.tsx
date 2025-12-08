'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Check, AlertCircle, Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';

interface SyncNftsButtonProps {
  nftId?: string;
  collectionAddress?: string;
  onSyncComplete?: () => void;
  variant?: 'default' | 'icon';
  className?: string;
}

interface SyncResult {
  nftId: string;
  tokenId: string;
  status: 'updated' | 'skipped' | 'error' | 'not_found';
  newOnChainTokenId?: string | null;
  error?: string;
}

export function SyncNftsButton({
  nftId,
  collectionAddress,
  onSyncComplete,
  variant = 'default',
  className,
}: SyncNftsButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncStatus, setLastSyncStatus] = useState<'success' | 'error' | null>(null);
  const { toast } = useToast();

  const handleSync = async () => {
    setIsLoading(true);
    setLastSyncStatus(null);

    try {
      const response = await fetch('/api/admin/sync-nfts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_API_KEY || 'dev-admin-key'}`,
        },
        body: JSON.stringify({
          dryRun: false,
          nftId,
          collectionAddress,
          fixOwnership: true,
          limit: nftId ? 1 : 50,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Sync failed');
      }

      const { summary, results } = data;

      if (summary.updated > 0) {
        setLastSyncStatus('success');
        toast({
          title: 'Sync Complete',
          description: `Updated ${summary.updated} NFT(s) with on-chain data.`,
        });
        onSyncComplete?.();
      } else if (summary.notFound > 0) {
        setLastSyncStatus('error');
        toast({
          title: 'Sync Issue',
          description: `Could not find ${summary.notFound} NFT(s) on-chain. They may not be minted yet.`,
          variant: 'destructive',
        });
      } else {
        setLastSyncStatus('success');
        toast({
          title: 'Already Synced',
          description: 'All NFTs are already up to date.',
        });
      }
    } catch (error: any) {
      setLastSyncStatus('error');
      toast({
        title: 'Sync Failed',
        description: error.message || 'Failed to sync NFT data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (variant === 'icon') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSync}
              disabled={isLoading}
              className={className}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : lastSyncStatus === 'success' ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : lastSyncStatus === 'error' ? (
                <AlertCircle className="h-4 w-4 text-red-500" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Sync with blockchain</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSync}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Syncing...
        </>
      ) : (
        <>
          <RefreshCw className="mr-2 h-4 w-4" />
          Sync with Blockchain
        </>
      )}
    </Button>
  );
}
