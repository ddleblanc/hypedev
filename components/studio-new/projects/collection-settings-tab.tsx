'use client';

import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

interface Collection {
  id: string;
  name: string;
  symbol: string;
  description?: string;
  chainId: number;
  contractType?: string;
  maxSupply?: number;
  mintedSupply?: number;
  royaltyPercentage?: number;
  isDeployed: boolean;
  address?: string;
}

interface CollectionSettingsTabProps {
  collection: Collection;
  onUpdate?: (updates: Partial<Collection>) => Promise<void>;
}

// =============================================================================
// Component
// =============================================================================

export function CollectionSettingsTab({
  collection,
  onUpdate,
}: CollectionSettingsTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>(
    'idle'
  );
  const [formData, setFormData] = useState({
    name: collection.name || '',
    description: collection.description || '',
    royaltyPercentage: collection.royaltyPercentage ?? 5,
  });

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      if (onUpdate) {
        await onUpdate({
          name: formData.name,
          description: formData.description,
          royaltyPercentage: formData.royaltyPercentage,
        });
      }

      setSaveStatus('success');
      setIsEditing(false);

      // Reset status after delay
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to save:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  }, [formData, onUpdate]);

  const handleCancel = useCallback(() => {
    // Reset form to original values
    setFormData({
      name: collection.name || '',
      description: collection.description || '',
      royaltyPercentage: collection.royaltyPercentage ?? 5,
    });
    setIsEditing(false);
    setSaveStatus('idle');
  }, [collection]);

  // Get chain name for display
  const getChainName = (chainId: number): string => {
    const chains: Record<number, string> = {
      1: 'Ethereum',
      11155111: 'Sepolia',
      137: 'Polygon',
      80001: 'Mumbai',
      42161: 'Arbitrum One',
      10: 'Optimism',
      8453: 'Base',
    };
    return chains[chainId] || `Chain ${chainId}`;
  };

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      {saveStatus === 'success' && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">Changes saved successfully</span>
        </div>
      )}

      {saveStatus === 'error' && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">Failed to save changes. Please try again.</span>
        </div>
      )}

      {/* Basic Info Section */}
      <section>
        <h3 className="text-sm font-medium text-studio-text mb-4">
          Basic Information
        </h3>
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs text-studio-text-muted mb-1.5">
              Collection Name
            </label>
            {isEditing ? (
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="bg-studio-surface border-studio-border text-studio-text focus-visible:ring-studio-accent"
                placeholder="My Collection"
              />
            ) : (
              <p className="text-studio-text">{collection.name}</p>
            )}
          </div>

          {/* Symbol */}
          <div>
            <label className="block text-xs text-studio-text-muted mb-1.5">
              Symbol
            </label>
            <p className="text-studio-text font-mono">{collection.symbol}</p>
            {collection.isDeployed && (
              <p className="text-xs text-studio-text-muted mt-1">
                Symbol cannot be changed after deployment
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-studio-text-muted mb-1.5">
              Description
            </label>
            {isEditing ? (
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="bg-studio-surface border-studio-border text-studio-text min-h-[100px] focus-visible:ring-studio-accent"
                placeholder="Describe your collection..."
              />
            ) : (
              <p className="text-studio-text text-sm whitespace-pre-wrap">
                {collection.description || (
                  <span className="text-studio-text-muted italic">
                    No description
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Contract Details Section */}
      <section>
        <h3 className="text-sm font-medium text-studio-text mb-4">
          Contract Details
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-lg bg-studio-surface">
            <p className="text-xs text-studio-text-muted">Contract Type</p>
            <p className="text-sm font-medium text-studio-text mt-1">
              {collection.contractType || 'NFT Collection'}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-studio-surface">
            <p className="text-xs text-studio-text-muted">Network</p>
            <p className="text-sm font-medium text-studio-text mt-1">
              {getChainName(collection.chainId)}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-studio-surface">
            <p className="text-xs text-studio-text-muted">Max Supply</p>
            <p className="text-sm font-medium text-studio-text mt-1">
              {collection.maxSupply
                ? collection.maxSupply.toLocaleString()
                : 'Unlimited'}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-studio-surface">
            <p className="text-xs text-studio-text-muted">Minted</p>
            <p className="text-sm font-medium text-studio-text mt-1">
              {(collection.mintedSupply || 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Contract Address */}
        {collection.address && (
          <div className="mt-3 p-4 rounded-lg bg-studio-surface">
            <p className="text-xs text-studio-text-muted mb-1">
              Contract Address
            </p>
            <p className="text-sm font-mono text-studio-text break-all">
              {collection.address}
            </p>
          </div>
        )}
      </section>

      {/* Royalty Section */}
      <section>
        <h3 className="text-sm font-medium text-studio-text mb-4">
          Royalty Settings
        </h3>
        <div className="p-4 rounded-lg bg-studio-surface">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-studio-text-muted">
                Royalty Percentage
              </p>
              <p className="text-lg font-semibold text-studio-text mt-1">
                {isEditing ? formData.royaltyPercentage : (collection.royaltyPercentage ?? 5)}%
              </p>
            </div>
            {isEditing && (
              <Input
                type="number"
                value={formData.royaltyPercentage}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    royaltyPercentage: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-24 bg-studio-border border-0 text-studio-text focus-visible:ring-studio-accent"
                min={0}
                max={10}
                step={0.5}
              />
            )}
          </div>
          <p className="text-xs text-studio-text-muted mt-2">
            You earn this percentage on secondary sales
          </p>
        </div>
      </section>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-studio-border">
        {isEditing ? (
          <>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
              className="border-studio-border text-studio-text hover:bg-studio-surface"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className={cn(
                'text-white',
                isSaving
                  ? 'bg-studio-accent/70'
                  : 'bg-studio-accent hover:bg-studio-accent/90'
              )}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </>
        ) : (
          <Button
            onClick={() => setIsEditing(true)}
            className="bg-studio-surface hover:bg-studio-border text-studio-text"
          >
            Edit Settings
          </Button>
        )}
      </div>
    </div>
  );
}
