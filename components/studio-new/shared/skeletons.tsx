'use client';

import { cn } from '@/lib/utils';

// =============================================================================
// Base Skeleton Primitive
// =============================================================================

interface SkeletonProps {
  className?: string;
  animate?: boolean;
}

/**
 * Base skeleton primitive with shimmer animation.
 * Use this to build custom skeleton shapes.
 */
export function Skeleton({ className, animate = true }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-studio-surface rounded',
        animate && 'skeleton-shimmer',
        className
      )}
      aria-hidden="true"
    />
  );
}

// =============================================================================
// Text Skeletons
// =============================================================================

interface TextSkeletonProps {
  lines?: number;
  className?: string;
}

/**
 * Skeleton for text content with variable line count.
 */
export function TextSkeleton({ lines = 1, className }: TextSkeletonProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            // Last line is usually shorter
            i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

// =============================================================================
// Card Skeletons
// =============================================================================

interface CardSkeletonProps {
  hasImage?: boolean;
  hasTitle?: boolean;
  hasDescription?: boolean;
  className?: string;
}

/**
 * Skeleton for card-style components.
 */
export function CardSkeleton({
  hasImage = true,
  hasTitle = true,
  hasDescription = true,
  className,
}: CardSkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-studio-border bg-studio-surface overflow-hidden',
        className
      )}
    >
      {hasImage && <Skeleton className="aspect-video w-full rounded-none" />}
      <div className="p-4 space-y-3">
        {hasTitle && <Skeleton className="h-5 w-3/4" />}
        {hasDescription && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Stats Skeletons
// =============================================================================

/**
 * Skeleton for a single stat card.
 */
export function StatSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-studio-border bg-studio-surface p-4',
        className
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-8 w-16" />
    </div>
  );
}

/**
 * Skeleton for stats strip (4 stats in a row).
 */
export function StatsStripSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-4 gap-3', className)}>
      {Array.from({ length: 4 }).map((_, i) => (
        <StatSkeleton key={i} />
      ))}
    </div>
  );
}

// =============================================================================
// List/Activity Skeletons
// =============================================================================

interface ListItemSkeletonProps {
  hasAvatar?: boolean;
  hasSecondaryText?: boolean;
  className?: string;
}

/**
 * Skeleton for list items with optional avatar.
 */
export function ListItemSkeleton({
  hasAvatar = true,
  hasSecondaryText = true,
  className,
}: ListItemSkeletonProps) {
  return (
    <div className={cn('flex items-center gap-3 p-4', className)}>
      {hasAvatar && <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        {hasSecondaryText && <Skeleton className="h-3 w-24" />}
      </div>
    </div>
  );
}

/**
 * Skeleton for activity feed.
 */
export function ActivityListSkeleton({
  count = 5,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-studio-border bg-studio-surface overflow-hidden',
        className
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-studio-border">
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="divide-y divide-studio-border">
        {Array.from({ length: count }).map((_, i) => (
          <ListItemSkeleton key={i} hasAvatar hasSecondaryText />
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Project Tree Skeletons
// =============================================================================

/**
 * Skeleton for a single project row.
 */
export function ProjectRowSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-studio-border bg-studio-surface p-4',
        className
      )}
    >
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Skeleton for project tree with multiple rows.
 */
export function ProjectTreeSkeleton({
  count = 3,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <ProjectRowSkeleton key={i} />
      ))}
    </div>
  );
}

// =============================================================================
// Grid Skeletons
// =============================================================================

/**
 * Skeleton for NFT-style grid items.
 */
export function GridItemSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-studio-border bg-studio-surface overflow-hidden',
        className
      )}
    >
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

/**
 * Skeleton for NFT grid.
 */
export function NftGridSkeleton({
  count = 6,
  columns = 3,
  className,
}: {
  count?: number;
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-3', gridCols[columns], className)}>
      {Array.from({ length: count }).map((_, i) => (
        <GridItemSkeleton key={i} />
      ))}
    </div>
  );
}

// =============================================================================
// Form Skeletons
// =============================================================================

/**
 * Skeleton for form input fields.
 */
export function InputSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  );
}

/**
 * Skeleton for form with multiple fields.
 */
export function FormSkeleton({
  fields = 4,
  className,
}: {
  fields?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-6', className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <InputSkeleton key={i} />
      ))}
      <Skeleton className="h-10 w-32 rounded-lg" />
    </div>
  );
}

// =============================================================================
// Collection Detail Skeletons
// =============================================================================

/**
 * Skeleton for collection header with banner.
 */
export function CollectionHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('', className)}>
      {/* Banner */}
      <Skeleton className="h-32 w-full rounded-none" />
      {/* Profile section */}
      <div className="px-6 pb-4">
        <div className="flex items-end gap-4 -mt-8 relative">
          <Skeleton className="h-16 w-16 rounded-xl border-4 border-studio-bg" />
          <div className="flex-1 pb-1 space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Full collection detail panel skeleton.
 */
export function CollectionDetailSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('', className)}>
      <CollectionHeaderSkeleton />
      {/* Tab bar */}
      <div className="px-6 border-b border-studio-border">
        <div className="flex gap-4 py-3">
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </div>
      {/* Content */}
      <div className="p-6">
        <FormSkeleton fields={3} />
      </div>
    </div>
  );
}

// =============================================================================
// Wizard Step Skeletons
// =============================================================================

/**
 * Skeleton for wizard step content.
 */
export function WizardStepSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('text-center space-y-6', className)}>
      {/* Icon */}
      <div className="flex justify-center">
        <Skeleton className="h-12 w-12 rounded-xl" />
      </div>
      {/* Title & description */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-48 mx-auto" />
        <Skeleton className="h-5 w-64 mx-auto" />
      </div>
      {/* Form fields */}
      <div className="space-y-4 text-left max-w-md mx-auto">
        <InputSkeleton />
        <InputSkeleton />
      </div>
    </div>
  );
}

// =============================================================================
// CSS for shimmer animation (add to globals.css)
// =============================================================================

/*
Add this to globals.css:

.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    hsl(var(--studio-surface)) 0%,
    hsl(var(--studio-border)) 50%,
    hsl(var(--studio-surface)) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
*/
