'use client';

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
  type TouchEvent,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, ArrowDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

type RefreshState = 'idle' | 'pulling' | 'ready' | 'refreshing' | 'complete';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
  threshold?: number;
  maxPull?: number;
  className?: string;
  refreshingText?: string;
  pullText?: string;
  releaseText?: string;
  completeText?: string;
}

interface PullIndicatorProps {
  state: RefreshState;
  progress: number;
  pullText?: string;
  releaseText?: string;
  refreshingText?: string;
  completeText?: string;
}

// =============================================================================
// Constants
// =============================================================================

const PULL_THRESHOLD = 80; // Distance required to trigger refresh
const MAX_PULL_DISTANCE = 150; // Maximum pull distance
const COMPLETE_DELAY = 500; // How long to show "complete" state

// =============================================================================
// Pull Indicator Component
// =============================================================================

function PullIndicator({
  state,
  progress,
  pullText = 'Pull to refresh',
  releaseText = 'Release to refresh',
  refreshingText = 'Refreshing...',
  completeText = 'Updated!',
}: PullIndicatorProps) {
  const rotation = Math.min(progress * 180, 180);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="absolute top-0 left-0 right-0 flex items-center justify-center py-4 z-10"
    >
      <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-studio-surface border border-studio-border shadow-lg">
        {/* Icon */}
        <div className="relative h-5 w-5">
          <AnimatePresence mode="wait">
            {state === 'refreshing' && (
              <motion.div
                key="refreshing"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
              >
                <RefreshCw className="h-5 w-5 text-studio-accent animate-spin" />
              </motion.div>
            )}
            {state === 'complete' && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
              >
                <Check className="h-5 w-5 text-green-500" />
              </motion.div>
            )}
            {(state === 'pulling' || state === 'ready') && (
              <motion.div
                key="arrow"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  rotate: state === 'ready' ? 180 : rotation,
                }}
                transition={{ duration: 0.15 }}
              >
                <ArrowDown className="h-5 w-5 text-studio-text-muted" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Text */}
        <span className="text-sm text-studio-text-muted">
          {state === 'pulling' && pullText}
          {state === 'ready' && releaseText}
          {state === 'refreshing' && refreshingText}
          {state === 'complete' && completeText}
        </span>
      </div>
    </motion.div>
  );
}

// =============================================================================
// Pull to Refresh Component
// =============================================================================

/**
 * A container that enables pull-to-refresh functionality on mobile.
 * Wraps content and provides a native-feeling refresh experience.
 */
export function PullToRefresh({
  children,
  onRefresh,
  disabled = false,
  threshold = PULL_THRESHOLD,
  maxPull = MAX_PULL_DISTANCE,
  className,
  refreshingText,
  pullText,
  releaseText,
  completeText,
}: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<RefreshState>('idle');
  const [pullDistance, setPullDistance] = useState(0);

  const startY = useRef(0);
  const currentY = useRef(0);
  const isAtTop = useRef(true);

  // Check if container is scrolled to top
  const checkIfAtTop = useCallback(() => {
    if (!containerRef.current) return true;
    return containerRef.current.scrollTop === 0;
  }, []);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (disabled || state !== 'idle') return;

      isAtTop.current = checkIfAtTop();
      if (!isAtTop.current) return;

      startY.current = e.touches[0].clientY;
      currentY.current = e.touches[0].clientY;
    },
    [disabled, state, checkIfAtTop]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (disabled || state === 'refreshing' || state === 'complete') return;
      if (!isAtTop.current) return;

      currentY.current = e.touches[0].clientY;
      const diff = currentY.current - startY.current;

      // Only allow pulling down
      if (diff <= 0) {
        setPullDistance(0);
        setState('idle');
        return;
      }

      // Apply resistance as pull distance increases
      const resistance = 0.5;
      const adjustedDiff = Math.min(diff * resistance, maxPull);

      setPullDistance(adjustedDiff);
      setState(adjustedDiff >= threshold ? 'ready' : 'pulling');
    },
    [disabled, state, threshold, maxPull]
  );

  const handleTouchEnd = useCallback(async () => {
    if (disabled || state === 'idle' || state === 'refreshing') return;

    if (state === 'ready') {
      // Trigger refresh
      setState('refreshing');
      setPullDistance(threshold);

      try {
        await onRefresh();
        setState('complete');

        // Show complete state briefly, then reset
        setTimeout(() => {
          setState('idle');
          setPullDistance(0);
        }, COMPLETE_DELAY);
      } catch (error) {
        console.error('Refresh failed:', error);
        setState('idle');
        setPullDistance(0);
      }
    } else {
      // Not enough pull, snap back
      setState('idle');
      setPullDistance(0);
    }
  }, [disabled, state, threshold, onRefresh]);

  // Reset state when disabled changes
  useEffect(() => {
    if (disabled) {
      setState('idle');
      setPullDistance(0);
    }
  }, [disabled]);

  const progress = Math.min(pullDistance / threshold, 1);
  const showIndicator = state !== 'idle';

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={cn('relative overflow-auto', className)}
    >
      {/* Pull Indicator */}
      <AnimatePresence>
        {showIndicator && (
          <PullIndicator
            state={state}
            progress={progress}
            pullText={pullText}
            releaseText={releaseText}
            refreshingText={refreshingText}
            completeText={completeText}
          />
        )}
      </AnimatePresence>

      {/* Content Container */}
      <motion.div
        animate={{
          y: state === 'refreshing' || state === 'complete'
            ? threshold / 2
            : pullDistance,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

// =============================================================================
// Simple Pull to Refresh Hook
// =============================================================================

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  disabled?: boolean;
}

interface UsePullToRefreshReturn {
  isRefreshing: boolean;
  pullDistance: number;
  handlers: {
    onTouchStart: (e: TouchEvent) => void;
    onTouchMove: (e: TouchEvent) => void;
    onTouchEnd: () => void;
  };
  progress: number;
}

/**
 * Hook for implementing custom pull-to-refresh UI.
 * Provides gesture handling and state management.
 */
export function usePullToRefresh({
  onRefresh,
  threshold = PULL_THRESHOLD,
  disabled = false,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const startY = useRef(0);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (disabled || isRefreshing) return;
      startY.current = e.touches[0].clientY;
    },
    [disabled, isRefreshing]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (disabled || isRefreshing) return;

      const diff = e.touches[0].clientY - startY.current;
      if (diff > 0) {
        setPullDistance(Math.min(diff * 0.5, threshold * 1.5));
      }
    },
    [disabled, isRefreshing, threshold]
  );

  const handleTouchEnd = useCallback(async () => {
    if (disabled || isRefreshing) return;

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
  }, [disabled, isRefreshing, pullDistance, threshold, onRefresh]);

  return {
    isRefreshing,
    pullDistance,
    progress: Math.min(pullDistance / threshold, 1),
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}

// =============================================================================
// Refresh Trigger Button (Alternative to Pull)
// =============================================================================

interface RefreshButtonProps {
  onRefresh: () => Promise<void>;
  isRefreshing?: boolean;
  className?: string;
}

/**
 * A button that triggers refresh with loading state.
 * Alternative to pull-to-refresh for desktop or accessibility.
 */
export function RefreshButton({
  onRefresh,
  isRefreshing = false,
  className,
}: RefreshButtonProps) {
  const [localRefreshing, setLocalRefreshing] = useState(false);

  const handleClick = useCallback(async () => {
    if (localRefreshing || isRefreshing) return;

    setLocalRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setLocalRefreshing(false);
    }
  }, [onRefresh, localRefreshing, isRefreshing]);

  const showSpinner = localRefreshing || isRefreshing;

  return (
    <button
      onClick={handleClick}
      disabled={showSpinner}
      className={cn(
        'p-2 rounded-lg transition-colors',
        'hover:bg-studio-surface active:bg-studio-border',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus:outline-none focus:ring-2 focus:ring-studio-accent focus:ring-offset-2 focus:ring-offset-studio-bg',
        className
      )}
      aria-label="Refresh"
    >
      <RefreshCw
        className={cn(
          'h-5 w-5 text-studio-text-muted',
          showSpinner && 'animate-spin'
        )}
      />
    </button>
  );
}
