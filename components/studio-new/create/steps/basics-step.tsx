'use client';

import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { useStudioNew } from '@/contexts/studio-new-context';

export function BasicsStep() {
  const { state, updateDraft } = useStudioNew();

  const handleSymbolChange = (value: string) => {
    // Force uppercase, letters/numbers only, max 10 chars
    const sanitized = value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 10);
    updateDraft({ symbol: sanitized });
  };

  return (
    <div className="text-center">
      <h2 className="text-2xl font-semibold text-studio-text mb-2">
        Give it a name
      </h2>
      <p className="text-studio-text-muted mb-8">
        Choose a name and symbol for your collection
      </p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 text-left"
      >
        <div>
          <label className="block text-sm font-medium text-studio-text mb-2">
            Collection Name
          </label>
          <Input
            placeholder="Epic Heroes"
            value={state.create.draft.name || ''}
            onChange={(e) => updateDraft({ name: e.target.value })}
            className="bg-studio-surface border-studio-border text-studio-text text-lg py-6"
            autoFocus
          />
          <p className="text-xs text-studio-text-muted mt-2">
            This is the public name shown in marketplaces
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-studio-text mb-2">
            Symbol
          </label>
          <Input
            placeholder="HERO"
            value={state.create.draft.symbol || ''}
            onChange={(e) => handleSymbolChange(e.target.value)}
            className="bg-studio-surface border-studio-border text-studio-text font-mono text-lg py-6 uppercase"
            maxLength={10}
          />
          <p className="text-xs text-studio-text-muted mt-2">
            2-10 uppercase letters/numbers (e.g., HERO, NFT1)
          </p>
        </div>
      </motion.div>
    </div>
  );
}
