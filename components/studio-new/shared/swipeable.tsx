'use client';

import {
  useRef,
  useState,
  useCallback,
  type ReactNode,
  type TouchEvent,
  type MouseEvent,
} from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { Trash2, Edit2, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

interface SwipeableProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: SwipeAction;
  rightAction?: SwipeAction;
  threshold?: number;
  className?: string;
  disabled?: boolean;
}

interface SwipeAction {
  icon?: ReactNode;
  label?: string;
  color?: 'red' | 'green' | 'blue' | 'amber' | 'gray';
  onClick?: () => void;
}

interface SwipeState {
  isDragging: boolean;
  direction: 'left' | 'right' | null;
  offset: number;
}

// =============================================================================
// Constants
// =============================================================================

const ACTION_WIDTH = 80; // Width of action area in pixels
const SWIPE_THRESHOLD = 0.4; // Percentage of width needed to trigger action

const colorClasses: Record<NonNullable<SwipeAction['color']>, string> = {
  red: 'bg-red-500',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  amber: 'bg-amber-500',
  gray: 'bg-zinc-600',
};

// =============================================================================
// Swipeable List Item Component
// =============================================================================

/**
 * A swipeable wrapper for list items with left/right swipe actions.
 * Ideal for mobile "swipe to delete" or "swipe to reveal actions" patterns.
 */
export function SwipeableListItem({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  threshold = SWIPE_THRESHOLD,
  className,
  disabled = false,
}: SwipeableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState<'left' | 'right' | null>(null);

  const x = useMotionValue(0);

  // Transform values for action visibility
  const leftActionOpacity = useTransform(x, [0, ACTION_WIDTH], [0, 1]);
  const rightActionOpacity = useTransform(x, [-ACTION_WIDTH, 0], [1, 0]);
  const leftActionScale = useTransform(x, [0, ACTION_WIDTH], [0.8, 1]);
  const rightActionScale = useTransform(x, [-ACTION_WIDTH, 0], [1, 0.8]);

  const handleDragEnd = useCallback(
    (
      _: unknown,
      info: { offset: { x: number }; velocity: { x: number } }
    ) => {
      const containerWidth = containerRef.current?.offsetWidth || 300;
      const swipeThreshold = containerWidth * threshold;

      // Check if swipe exceeded threshold
      if (info.offset.x > swipeThreshold && rightAction) {
        setIsOpen('right');
        onSwipeRight?.();
      } else if (info.offset.x < -swipeThreshold && leftAction) {
        setIsOpen('left');
        onSwipeLeft?.();
      } else {
        // Snap back to closed
        setIsOpen(null);
      }
    },
    [threshold, leftAction, rightAction, onSwipeLeft, onSwipeRight]
  );

  const handleClose = useCallback(() => {
    setIsOpen(null);
  }, []);

  const handleActionClick = useCallback(
    (action: SwipeAction | undefined) => {
      action?.onClick?.();
      handleClose();
    },
    [handleClose]
  );

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
    >
      {/* Right Action (revealed when swiping right) */}
      {rightAction && (
        <motion.button
          style={{ opacity: leftActionOpacity, scale: leftActionScale }}
          onClick={() => handleActionClick(rightAction)}
          className={cn(
            'absolute left-0 top-0 bottom-0 flex items-center justify-center px-6',
            colorClasses[rightAction.color || 'green']
          )}
          aria-label={rightAction.label}
        >
          {rightAction.icon || <ChevronRight className="h-6 w-6 text-white" />}
        </motion.button>
      )}

      {/* Left Action (revealed when swiping left) */}
      {leftAction && (
        <motion.button
          style={{ opacity: rightActionOpacity, scale: rightActionScale }}
          onClick={() => handleActionClick(leftAction)}
          className={cn(
            'absolute right-0 top-0 bottom-0 flex items-center justify-center px-6',
            colorClasses[leftAction.color || 'red']
          )}
          aria-label={leftAction.label}
        >
          {leftAction.icon || <Trash2 className="h-6 w-6 text-white" />}
        </motion.button>
      )}

      {/* Main Content */}
      <motion.div
        style={{ x }}
        drag="x"
        dragConstraints={{
          left: leftAction ? -ACTION_WIDTH * 1.5 : 0,
          right: rightAction ? ACTION_WIDTH * 1.5 : 0,
        }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        animate={{
          x: isOpen === 'left' ? -ACTION_WIDTH : isOpen === 'right' ? ACTION_WIDTH : 0,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="relative bg-studio-surface touch-pan-y"
        role="listitem"
      >
        {children}
      </motion.div>

      {/* Tap overlay to close when open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 z-10"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// Swipe Delete Item
// =============================================================================

interface SwipeDeleteItemProps {
  children: ReactNode;
  onDelete: () => void;
  deleteLabel?: string;
  className?: string;
}

/**
 * Pre-configured swipeable item with delete action on left swipe.
 */
export function SwipeDeleteItem({
  children,
  onDelete,
  deleteLabel = 'Delete',
  className,
}: SwipeDeleteItemProps) {
  return (
    <SwipeableListItem
      leftAction={{
        icon: <Trash2 className="h-5 w-5 text-white" />,
        label: deleteLabel,
        color: 'red',
        onClick: onDelete,
      }}
      className={className}
    >
      {children}
    </SwipeableListItem>
  );
}

// =============================================================================
// Swipe Actions Item
// =============================================================================

interface SwipeActionsItemProps {
  children: ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  onMore?: () => void;
  className?: string;
}

/**
 * Pre-configured swipeable item with edit (right) and delete (left) actions.
 */
export function SwipeActionsItem({
  children,
  onEdit,
  onDelete,
  onMore,
  className,
}: SwipeActionsItemProps) {
  return (
    <SwipeableListItem
      rightAction={
        onEdit || onMore
          ? {
              icon: onEdit ? (
                <Edit2 className="h-5 w-5 text-white" />
              ) : (
                <MoreHorizontal className="h-5 w-5 text-white" />
              ),
              label: onEdit ? 'Edit' : 'More',
              color: 'blue',
              onClick: onEdit || onMore,
            }
          : undefined
      }
      leftAction={
        onDelete
          ? {
              icon: <Trash2 className="h-5 w-5 text-white" />,
              label: 'Delete',
              color: 'red',
              onClick: onDelete,
            }
          : undefined
      }
      className={className}
    >
      {children}
    </SwipeableListItem>
  );
}

// =============================================================================
// Swipe Navigation
// =============================================================================

interface SwipeNavigationProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftHint?: string;
  rightHint?: string;
  className?: string;
}

/**
 * Swipeable container for page-level navigation (e.g., swipe between tabs).
 */
export function SwipeNavigation({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftHint,
  rightHint,
  className,
}: SwipeNavigationProps) {
  const [showLeftHint, setShowLeftHint] = useState(false);
  const [showRightHint, setShowRightHint] = useState(false);

  const x = useMotionValue(0);

  const handleDragEnd = useCallback(
    (
      _: unknown,
      info: { offset: { x: number }; velocity: { x: number } }
    ) => {
      const threshold = 100;
      const velocityThreshold = 500;

      // Check velocity or offset threshold
      if (
        info.offset.x > threshold ||
        info.velocity.x > velocityThreshold
      ) {
        onSwipeRight?.();
      } else if (
        info.offset.x < -threshold ||
        info.velocity.x < -velocityThreshold
      ) {
        onSwipeLeft?.();
      }

      setShowLeftHint(false);
      setShowRightHint(false);
    },
    [onSwipeLeft, onSwipeRight]
  );

  const handleDrag = useCallback(
    (_: unknown, info: { offset: { x: number } }) => {
      setShowLeftHint(info.offset.x < -50 && !!onSwipeLeft);
      setShowRightHint(info.offset.x > 50 && !!onSwipeRight);
    },
    [onSwipeLeft, onSwipeRight]
  );

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Left Navigation Hint */}
      <AnimatePresence>
        {showLeftHint && leftHint && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex items-center gap-2 text-studio-text-muted"
          >
            <span className="text-sm">{leftHint}</span>
            <ChevronLeft className="h-4 w-4" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right Navigation Hint */}
      <AnimatePresence>
        {showRightHint && rightHint && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex items-center gap-2 text-studio-text-muted"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="text-sm">{rightHint}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <motion.div
        style={{ x }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.3}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        className="touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  );
}

// =============================================================================
// Hook for Swipe Detection
// =============================================================================

interface UseSwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
}

/**
 * Hook for detecting swipe gestures on any element.
 */
export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
}: UseSwipeOptions) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!touchStart.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStart.current.x;
      const deltaY = touch.clientY - touchStart.current.y;

      // Determine if horizontal or vertical swipe
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > threshold) {
          if (deltaX > 0) {
            onSwipeRight?.();
          } else {
            onSwipeLeft?.();
          }
        }
      } else {
        // Vertical swipe
        if (Math.abs(deltaY) > threshold) {
          if (deltaY > 0) {
            onSwipeDown?.();
          } else {
            onSwipeUp?.();
          }
        }
      }

      touchStart.current = null;
    },
    [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold]
  );

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  };
}
