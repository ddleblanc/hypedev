'use client';

import { motion } from 'framer-motion';
import { Plus, Folder, ArrowRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStudioNew } from '@/contexts/studio-new-context';

// =============================================================================
// Types
// =============================================================================

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  action: () => void;
  variant: 'primary' | 'secondary';
}

// =============================================================================
// Component
// =============================================================================

export function QuickActions() {
  const { goToCreate, goToProjects } = useStudioNew();

  const actions: QuickAction[] = [
    {
      id: 'create',
      title: 'Create Collection',
      description: 'Launch a new NFT collection',
      icon: Plus,
      action: goToCreate,
      variant: 'primary',
    },
    {
      id: 'projects',
      title: 'View Projects',
      description: 'Manage your existing work',
      icon: Folder,
      action: goToProjects,
      variant: 'secondary',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {actions.map((action, index) => {
        const Icon = action.icon;
        const isPrimary = action.variant === 'primary';

        return (
          <motion.button
            key={action.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.05, duration: 0.2 }}
            onClick={action.action}
            className={cn(
              'group relative flex items-center gap-4 rounded-xl p-5 text-left transition-all',
              'border hover:border-studio-text-muted/30',
              isPrimary
                ? 'bg-studio-accent/10 hover:bg-studio-accent/20 border-studio-accent/30'
                : 'bg-studio-surface hover:bg-studio-border/30 border-studio-border'
            )}
          >
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-xl flex-shrink-0',
                isPrimary ? 'bg-studio-accent' : 'bg-studio-border'
              )}
            >
              <Icon
                className={cn(
                  'h-6 w-6',
                  isPrimary ? 'text-white' : 'text-studio-text'
                )}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-studio-text">{action.title}</h3>
              <p className="text-sm text-studio-text-muted mt-0.5">
                {action.description}
              </p>
            </div>
            <ArrowRight
              className={cn(
                'h-5 w-5 text-studio-text-muted transition-transform flex-shrink-0',
                'group-hover:translate-x-1'
              )}
            />
          </motion.button>
        );
      })}
    </div>
  );
}
