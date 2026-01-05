'use client';

import { motion } from 'framer-motion';
import {
  FolderPlus,
  Layers,
  ImageIcon,
  Box,
  Search,
  AlertCircle,
  Plus,
  RefreshCw,
  Upload,
  Zap,
  Package,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

interface EmptyStateProps {
  icon?: LucideIcon;
  iconClassName?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

// =============================================================================
// Base Empty State Component
// =============================================================================

/**
 * Base empty state component with icon, title, description, and optional actions.
 */
export function EmptyState({
  icon: Icon = Package,
  iconClassName,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  const getButtonVariant = (variant?: 'primary' | 'secondary' | 'ghost') => {
    switch (variant) {
      case 'primary':
        return 'bg-studio-accent hover:bg-studio-accent/90 text-white';
      case 'ghost':
        return 'bg-transparent hover:bg-studio-surface text-studio-text border border-studio-border';
      case 'secondary':
      default:
        return 'bg-studio-surface hover:bg-studio-border text-studio-text';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('py-12 text-center', className)}
    >
      {/* Icon */}
      <div className="mx-auto mb-4">
        <div
          className={cn(
            'inline-flex h-16 w-16 items-center justify-center rounded-full',
            'bg-studio-surface border border-studio-border',
            iconClassName
          )}
        >
          <Icon className="h-8 w-8 text-studio-text-muted" />
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-medium text-studio-text">{title}</h3>

      {/* Description */}
      {description && (
        <p className="mt-1 text-sm text-studio-text-muted max-w-sm mx-auto">
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="mt-6 flex items-center justify-center gap-3">
          {action && (
            <Button
              onClick={action.onClick}
              className={cn(getButtonVariant(action.variant))}
            >
              <Plus className="h-4 w-4 mr-2" />
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant="ghost"
              className="text-studio-text-muted hover:text-studio-text"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}

// =============================================================================
// Preset Empty States
// =============================================================================

interface PresetEmptyStateProps {
  onAction?: () => void;
  className?: string;
}

/**
 * Empty state for when no projects exist.
 */
export function NoProjectsEmpty({ onAction, className }: PresetEmptyStateProps) {
  return (
    <EmptyState
      icon={FolderPlus}
      title="No projects yet"
      description="Create your first project to organize your collections and NFTs"
      action={
        onAction
          ? {
              label: 'Create Project',
              onClick: onAction,
              variant: 'primary',
            }
          : undefined
      }
      className={className}
    />
  );
}

/**
 * Empty state for when no collections exist within a project.
 */
export function NoCollectionsEmpty({
  onAction,
  className,
}: PresetEmptyStateProps) {
  return (
    <EmptyState
      icon={Layers}
      title="No collections yet"
      description="Add your first collection to this project"
      action={
        onAction
          ? {
              label: 'Add Collection',
              onClick: onAction,
              variant: 'primary',
            }
          : undefined
      }
      className={className}
    />
  );
}

/**
 * Empty state for when no NFTs exist in a collection.
 */
export function NoNftsEmpty({ onAction, className }: PresetEmptyStateProps) {
  return (
    <EmptyState
      icon={ImageIcon}
      title="No NFTs yet"
      description="Create or mint your first NFT to this collection"
      action={
        onAction
          ? {
              label: 'Add NFT',
              onClick: onAction,
              variant: 'primary',
            }
          : undefined
      }
      className={className}
    />
  );
}

/**
 * Empty state for when no lootboxes exist.
 */
export function NoLootboxesEmpty({ onAction, className }: PresetEmptyStateProps) {
  return (
    <EmptyState
      icon={Box}
      iconClassName="bg-amber-500/10 border-amber-500/20"
      title="No lootboxes yet"
      description="Create a lootbox to offer mystery rewards to collectors"
      action={
        onAction
          ? {
              label: 'Create Lootbox',
              onClick: onAction,
              variant: 'primary',
            }
          : undefined
      }
      className={className}
    />
  );
}

/**
 * Empty state for when no activity exists.
 */
export function NoActivityEmpty({ className }: PresetEmptyStateProps) {
  return (
    <EmptyState
      icon={Zap}
      title="No activity yet"
      description="Activity will appear here as you create and manage your collections"
      className={className}
    />
  );
}

/**
 * Empty state for search results with no matches.
 */
export function NoSearchResultsEmpty({
  onAction,
  className,
}: PresetEmptyStateProps) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description="Try adjusting your search terms or filters"
      action={
        onAction
          ? {
              label: 'Clear Search',
              onClick: onAction,
              variant: 'ghost',
            }
          : undefined
      }
      className={className}
    />
  );
}

/**
 * Empty state for when there's no data to display (generic).
 */
export function NoDataEmpty({ onAction, className }: PresetEmptyStateProps) {
  return (
    <EmptyState
      icon={Package}
      title="Nothing here yet"
      description="Get started by creating something new"
      action={
        onAction
          ? {
              label: 'Get Started',
              onClick: onAction,
              variant: 'primary',
            }
          : undefined
      }
      className={className}
    />
  );
}

// =============================================================================
// Error States
// =============================================================================

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * Error state with retry button.
 */
export function ErrorState({
  title = 'Something went wrong',
  description = 'We encountered an error loading this content',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('py-12 text-center', className)}
    >
      {/* Icon */}
      <div className="mx-auto mb-4">
        <div
          className={cn(
            'inline-flex h-16 w-16 items-center justify-center rounded-full',
            'bg-red-500/10 border border-red-500/20'
          )}
        >
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-medium text-studio-text">{title}</h3>

      {/* Description */}
      <p className="mt-1 text-sm text-studio-text-muted max-w-sm mx-auto">
        {description}
      </p>

      {/* Retry Button */}
      {onRetry && (
        <Button
          onClick={onRetry}
          className="mt-6 bg-studio-surface hover:bg-studio-border text-studio-text"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      )}
    </motion.div>
  );
}

/**
 * Inline error banner for showing errors within content areas.
 */
export function InlineError({
  message,
  onRetry,
  onDismiss,
  className,
}: {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={cn(
        'flex items-center gap-3 p-4 rounded-xl',
        'bg-red-500/10 border border-red-500/20',
        className
      )}
    >
      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
      <p className="flex-1 text-sm text-red-400">{message}</p>
      <div className="flex items-center gap-2">
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-sm text-red-400 hover:text-red-300 underline"
          >
            Retry
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-sm text-red-400 hover:text-red-300"
            aria-label="Dismiss"
          >
            &times;
          </button>
        )}
      </div>
    </motion.div>
  );
}

// =============================================================================
// Upload/Drop Zone Empty State
// =============================================================================

interface DropZoneEmptyProps {
  title?: string;
  description?: string;
  accept?: string;
  isDragActive?: boolean;
  className?: string;
}

/**
 * Empty state for file upload/drop zones.
 */
export function DropZoneEmpty({
  title = 'Drag & drop files here',
  description = 'or click to browse',
  isDragActive = false,
  className,
}: DropZoneEmptyProps) {
  return (
    <div
      className={cn(
        'py-12 px-6 text-center rounded-xl border-2 border-dashed transition-colors',
        isDragActive
          ? 'border-studio-accent bg-studio-accent/5'
          : 'border-studio-border hover:border-studio-text-muted/30',
        className
      )}
    >
      <motion.div
        animate={isDragActive ? { scale: 1.05 } : { scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div
          className={cn(
            'mx-auto mb-4 h-12 w-12 rounded-full flex items-center justify-center',
            isDragActive ? 'bg-studio-accent/10' : 'bg-studio-surface'
          )}
        >
          <Upload
            className={cn(
              'h-6 w-6',
              isDragActive ? 'text-studio-accent' : 'text-studio-text-muted'
            )}
          />
        </div>
        <p
          className={cn(
            'font-medium',
            isDragActive ? 'text-studio-accent' : 'text-studio-text'
          )}
        >
          {title}
        </p>
        <p className="mt-1 text-sm text-studio-text-muted">{description}</p>
      </motion.div>
    </div>
  );
}
