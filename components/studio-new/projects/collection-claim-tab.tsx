'use client';

import { useState, useCallback } from 'react';
import {
  Plus,
  Trash2,
  Calendar,
  Users,
  Coins,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

interface ClaimPhase {
  id: string;
  name: string;
  startTime: string;
  maxClaimableSupply: number;
  maxClaimablePerWallet: number;
  price: number;
  currency?: string;
}

interface Collection {
  id: string;
  name: string;
  contractType?: string;
  chainId: number;
  address?: string;
  claimPhases?: ClaimPhase[];
}

interface CollectionClaimTabProps {
  collection: Collection;
  onSavePhases?: (phases: ClaimPhase[]) => Promise<void>;
}

// =============================================================================
// Helper Functions
// =============================================================================

function generatePhaseId(): string {
  return `phase-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createDefaultPhase(index: number): ClaimPhase {
  return {
    id: generatePhaseId(),
    name: `Phase ${index}`,
    startTime: new Date().toISOString(),
    maxClaimableSupply: 1000,
    maxClaimablePerWallet: 5,
    price: 0,
    currency: 'ETH',
  };
}

// =============================================================================
// Components
// =============================================================================

function PhaseCard({
  phase,
  index,
  isEditing,
  onUpdate,
  onRemove,
}: {
  phase: ClaimPhase;
  index: number;
  isEditing: boolean;
  onUpdate: (updates: Partial<ClaimPhase>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="p-4 rounded-xl bg-studio-surface border border-studio-border">
      {/* Phase Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Phase Number */}
          <div className="h-8 w-8 rounded-full bg-studio-accent/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-studio-accent">
              {index + 1}
            </span>
          </div>

          {/* Phase Name */}
          {isEditing ? (
            <Input
              value={phase.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="w-40 bg-studio-border border-0 text-studio-text focus-visible:ring-studio-accent"
              placeholder="Phase name"
            />
          ) : (
            <span className="font-medium text-studio-text">{phase.name}</span>
          )}
        </div>

        {/* Remove Button */}
        {isEditing && (
          <button
            onClick={onRemove}
            className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
            aria-label="Remove phase"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Phase Fields */}
      <div className="grid grid-cols-2 gap-4">
        {/* Start Time */}
        <div>
          <label className="flex items-center gap-1.5 text-xs text-studio-text-muted mb-1.5">
            <Calendar className="h-3 w-3" />
            Start Time
          </label>
          {isEditing ? (
            <Input
              type="datetime-local"
              value={phase.startTime.slice(0, 16)}
              onChange={(e) =>
                onUpdate({ startTime: new Date(e.target.value).toISOString() })
              }
              className="bg-studio-border border-0 text-studio-text focus-visible:ring-studio-accent"
            />
          ) : (
            <p className="text-sm text-studio-text">
              {new Date(phase.startTime).toLocaleString()}
            </p>
          )}
        </div>

        {/* Price */}
        <div>
          <label className="flex items-center gap-1.5 text-xs text-studio-text-muted mb-1.5">
            <Coins className="h-3 w-3" />
            Price (ETH)
          </label>
          {isEditing ? (
            <Input
              type="number"
              value={phase.price}
              onChange={(e) =>
                onUpdate({ price: parseFloat(e.target.value) || 0 })
              }
              className="bg-studio-border border-0 text-studio-text focus-visible:ring-studio-accent"
              step={0.001}
              min={0}
            />
          ) : (
            <p className="text-sm text-studio-text">
              {phase.price === 0 ? 'Free' : `${phase.price} ETH`}
            </p>
          )}
        </div>

        {/* Max Supply */}
        <div>
          <label className="flex items-center gap-1.5 text-xs text-studio-text-muted mb-1.5">
            <Users className="h-3 w-3" />
            Max Supply
          </label>
          {isEditing ? (
            <Input
              type="number"
              value={phase.maxClaimableSupply}
              onChange={(e) =>
                onUpdate({
                  maxClaimableSupply: parseInt(e.target.value) || 0,
                })
              }
              className="bg-studio-border border-0 text-studio-text focus-visible:ring-studio-accent"
              min={1}
            />
          ) : (
            <p className="text-sm text-studio-text">
              {phase.maxClaimableSupply.toLocaleString()}
            </p>
          )}
        </div>

        {/* Per Wallet */}
        <div>
          <label className="flex items-center gap-1.5 text-xs text-studio-text-muted mb-1.5">
            <Users className="h-3 w-3" />
            Per Wallet
          </label>
          {isEditing ? (
            <Input
              type="number"
              value={phase.maxClaimablePerWallet}
              onChange={(e) =>
                onUpdate({
                  maxClaimablePerWallet: parseInt(e.target.value) || 1,
                })
              }
              className="bg-studio-border border-0 text-studio-text focus-visible:ring-studio-accent"
              min={1}
            />
          ) : (
            <p className="text-sm text-studio-text">
              {phase.maxClaimablePerWallet}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyPhasesState({ onAddPhase }: { onAddPhase: () => void }) {
  return (
    <div className="py-12 text-center">
      <div className="mx-auto h-12 w-12 rounded-full bg-studio-surface flex items-center justify-center mb-3">
        <Calendar className="h-6 w-6 text-studio-text-muted" />
      </div>
      <p className="text-studio-text font-medium">No claim phases</p>
      <p className="text-sm text-studio-text-muted mt-1">
        Add phases to enable minting
      </p>
      <Button
        onClick={onAddPhase}
        className="mt-4 bg-studio-accent hover:bg-studio-accent/90 text-white"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Phase
      </Button>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function CollectionClaimTab({
  collection,
  onSavePhases,
}: CollectionClaimTabProps) {
  const [phases, setPhases] = useState<ClaimPhase[]>(
    collection.claimPhases || []
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>(
    'idle'
  );

  // Check if contract supports claim phases
  const isDropContract =
    collection.contractType?.includes('Drop') ||
    collection.contractType?.includes('Edition');

  const addPhase = useCallback(() => {
    const newPhase = createDefaultPhase(phases.length + 1);
    setPhases((prev) => [...prev, newPhase]);
    setIsEditing(true);
  }, [phases.length]);

  const removePhase = useCallback((id: string) => {
    setPhases((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const updatePhase = useCallback((id: string, updates: Partial<ClaimPhase>) => {
    setPhases((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      if (onSavePhases) {
        await onSavePhases(phases);
      }

      setSaveStatus('success');
      setIsEditing(false);

      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to save claim phases:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  }, [phases, onSavePhases]);

  const handleCancel = useCallback(() => {
    setPhases(collection.claimPhases || []);
    setIsEditing(false);
    setSaveStatus('idle');
  }, [collection.claimPhases]);

  // If not a Drop contract, show info message
  if (!isDropContract) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-studio-surface flex items-center justify-center mb-3">
          <Info className="h-6 w-6 text-studio-text-muted" />
        </div>
        <p className="text-studio-text font-medium">
          Claim phases not available
        </p>
        <p className="text-sm text-studio-text-muted mt-1 max-w-md mx-auto">
          This collection uses a standard NFT contract. Claim phases are only
          available for Drop and Edition contracts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="p-4 rounded-lg bg-studio-accent/10 border border-studio-accent/20">
        <p className="text-sm text-studio-accent">
          Claim phases define who can mint, when, and at what price. Changes
          require a blockchain transaction.
        </p>
      </div>

      {/* Status Banners */}
      {saveStatus === 'success' && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">Claim phases saved successfully</span>
        </div>
      )}

      {saveStatus === 'error' && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">
            Failed to save claim phases. Please try again.
          </span>
        </div>
      )}

      {/* Phases List */}
      {phases.length === 0 ? (
        <EmptyPhasesState onAddPhase={addPhase} />
      ) : (
        <div className="space-y-4">
          {phases.map((phase, index) => (
            <PhaseCard
              key={phase.id}
              phase={phase}
              index={index}
              isEditing={isEditing}
              onUpdate={(updates) => updatePhase(phase.id, updates)}
              onRemove={() => removePhase(phase.id)}
            />
          ))}

          {/* Add Phase Button (when editing) */}
          {isEditing && (
            <button
              onClick={addPhase}
              className="w-full p-4 rounded-xl border-2 border-dashed border-studio-border hover:border-studio-accent hover:bg-studio-accent/5 transition-colors flex items-center justify-center gap-2 text-studio-text-muted hover:text-studio-accent"
            >
              <Plus className="h-4 w-4" />
              Add Another Phase
            </button>
          )}
        </div>
      )}

      {/* Actions */}
      {phases.length > 0 && (
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
                  'Save & Deploy'
                )}
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-studio-surface hover:bg-studio-border text-studio-text"
            >
              Edit Phases
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
