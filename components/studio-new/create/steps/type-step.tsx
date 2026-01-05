'use client';

import { motion } from 'framer-motion';
import { Layers, Box, Image } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStudioNew, type CreateType } from '@/contexts/studio-new-context';

const createTypes = [
  {
    id: 'collection' as CreateType,
    title: 'NFT Collection',
    description: 'A set of unique or edition NFTs',
    icon: Layers,
  },
  {
    id: 'lootbox' as CreateType,
    title: 'Lootbox',
    description: 'Random reward crates with VRF',
    icon: Box,
  },
  {
    id: 'nft' as CreateType,
    title: 'Single NFT',
    description: 'One unique piece of art',
    icon: Image,
  },
] as const;

export function TypeStep() {
  const { state, updateDraft } = useStudioNew();
  const selectedType = state.create.draft.type;

  return (
    <div className="text-center">
      <h2 className="text-2xl font-semibold text-studio-text mb-2">
        What are you creating?
      </h2>
      <p className="text-studio-text-muted mb-8">
        Choose the type of asset you want to launch
      </p>

      <div className="grid gap-3">
        {createTypes.map((type, index) => {
          const isSelected = selectedType === type.id;
          const Icon = type.icon;

          return (
            <motion.button
              key={type.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => updateDraft({ type: type.id })}
              className={cn(
                'flex items-center gap-4 p-4 rounded-xl text-left transition-all',
                'border',
                isSelected
                  ? 'border-studio-accent bg-studio-accent/10'
                  : 'border-studio-border bg-studio-surface hover:border-studio-text-muted/30'
              )}
            >
              <div
                className={cn(
                  'h-12 w-12 rounded-xl flex items-center justify-center',
                  isSelected ? 'bg-studio-accent' : 'bg-studio-border'
                )}
              >
                <Icon
                  className={cn(
                    'h-6 w-6',
                    isSelected ? 'text-white' : 'text-studio-text'
                  )}
                />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-studio-text">{type.title}</h3>
                <p className="text-sm text-studio-text-muted">
                  {type.description}
                </p>
              </div>
              {isSelected && (
                <div className="ml-auto">
                  <div className="h-5 w-5 rounded-full bg-studio-accent flex items-center justify-center">
                    <svg
                      className="h-3 w-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
