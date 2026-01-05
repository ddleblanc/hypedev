'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useStudioNew, type CreateDraft } from '@/contexts/studio-new-context';

const chains = [
  {
    id: 11155111,
    name: 'Sepolia',
    description: 'Ethereum testnet',
    isTestnet: true,
  },
  { id: 1, name: 'Ethereum', description: 'Mainnet', isTestnet: false },
  { id: 137, name: 'Polygon', description: 'Low fees', isTestnet: false },
  { id: 42161, name: 'Arbitrum', description: 'Fast & cheap', isTestnet: false },
];

const contractTypes: Array<{
  id: CreateDraft['contractType'];
  name: string;
  description: string;
}> = [
  { id: 'NFTDrop', name: 'NFT Drop', description: 'Users claim from a pool' },
  {
    id: 'NFTCollection',
    name: 'NFT Collection',
    description: 'Direct mint to users',
  },
  {
    id: 'OpenEdition',
    name: 'Open Edition',
    description: 'Unlimited supply window',
  },
];

export function ConfigStep() {
  const { state, updateDraft } = useStudioNew();
  const selectedChain = state.create.draft.chainId;
  const selectedType = state.create.draft.contractType;

  return (
    <div className="text-center">
      <h2 className="text-2xl font-semibold text-studio-text mb-2">
        Choose your blockchain
      </h2>
      <p className="text-studio-text-muted mb-8">
        Select where your collection will live
      </p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Chain Selection */}
        <div>
          <label className="block text-sm font-medium text-studio-text mb-3 text-left">
            Network
          </label>
          <div className="grid grid-cols-2 gap-2">
            {chains.map((chain) => (
              <button
                key={chain.id}
                onClick={() => updateDraft({ chainId: chain.id })}
                className={cn(
                  'p-3 rounded-lg text-left transition-all',
                  'border',
                  selectedChain === chain.id
                    ? 'border-studio-accent bg-studio-accent/10'
                    : 'border-studio-border bg-studio-surface hover:border-studio-text-muted/30'
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-studio-text">
                    {chain.name}
                  </span>
                  {chain.isTestnet && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-500 rounded">
                      Testnet
                    </span>
                  )}
                </div>
                <p className="text-xs text-studio-text-muted mt-0.5">
                  {chain.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Contract Type */}
        <div>
          <label className="block text-sm font-medium text-studio-text mb-3 text-left">
            Contract Type
          </label>
          <div className="space-y-2">
            {contractTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => updateDraft({ contractType: type.id })}
                className={cn(
                  'w-full p-3 rounded-lg text-left transition-all',
                  'border',
                  selectedType === type.id
                    ? 'border-studio-accent bg-studio-accent/10'
                    : 'border-studio-border bg-studio-surface hover:border-studio-text-muted/30'
                )}
              >
                <span className="font-medium text-studio-text">{type.name}</span>
                <p className="text-xs text-studio-text-muted mt-0.5">
                  {type.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
