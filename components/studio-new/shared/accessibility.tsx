'use client';

import {
  useRef,
  useEffect,
  useCallback,
  useState,
  type ReactNode,
  type KeyboardEvent,
  type RefObject,
} from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// Focus Trap Component
// =============================================================================

interface FocusTrapProps {
  children: ReactNode;
  active?: boolean;
  returnFocusOnDeactivate?: boolean;
  className?: string;
}

/**
 * Traps focus within a container. Essential for modals and dialogs.
 * Ensures keyboard users can't tab out of the container.
 */
export function FocusTrap({
  children,
  active = true,
  returnFocusOnDeactivate = true,
  className,
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Store the previously focused element
  useEffect(() => {
    if (active) {
      previousActiveElement.current = document.activeElement as HTMLElement;
    }
  }, [active]);

  // Return focus when deactivated
  useEffect(() => {
    return () => {
      if (returnFocusOnDeactivate && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [returnFocusOnDeactivate]);

  // Focus the first focusable element on activation
  useEffect(() => {
    if (active && containerRef.current) {
      const firstFocusable = getFocusableElements(containerRef.current)[0];
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }
  }, [active]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (!active || e.key !== 'Tab' || !containerRef.current) return;

      const focusableElements = getFocusableElements(containerRef.current);
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Shift + Tab: Focus last element when on first
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
      // Tab: Focus first element when on last
      else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    },
    [active]
  );

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className={className}
      role="region"
      aria-modal={active}
    >
      {children}
    </div>
  );
}

// =============================================================================
// Skip Link Component
// =============================================================================

interface SkipLinkProps {
  targetId: string;
  className?: string;
  children?: ReactNode;
}

/**
 * Skip link for keyboard navigation. Allows users to skip to main content.
 * Should be the first focusable element on the page.
 */
export function SkipLink({
  targetId,
  className,
  children = 'Skip to main content',
}: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className={cn(
        'sr-only focus:not-sr-only',
        'focus:fixed focus:top-4 focus:left-4 focus:z-[9999]',
        'focus:px-4 focus:py-2 focus:rounded-lg',
        'focus:bg-studio-accent focus:text-white',
        'focus:outline-none focus:ring-2 focus:ring-white',
        className
      )}
    >
      {children}
    </a>
  );
}

// =============================================================================
// Live Region / Announcer
// =============================================================================

interface AnnouncerProps {
  message: string;
  politeness?: 'polite' | 'assertive';
  className?: string;
}

/**
 * ARIA live region for screen reader announcements.
 * Messages are announced when they change.
 */
export function Announcer({
  message,
  politeness = 'polite',
  className,
}: AnnouncerProps) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className={cn('sr-only', className)}
    >
      {message}
    </div>
  );
}

// =============================================================================
// Use Announce Hook
// =============================================================================

/**
 * Hook for programmatically announcing messages to screen readers.
 */
export function useAnnounce() {
  const [message, setMessage] = useState('');
  const [key, setKey] = useState(0);

  const announce = useCallback((text: string) => {
    // Force re-render by updating key to trigger new announcement
    setKey((k) => k + 1);
    setMessage(text);

    // Clear message after announcement
    setTimeout(() => setMessage(''), 1000);
  }, []);

  const Announcer = useCallback(
    () => (
      <div
        key={key}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {message}
      </div>
    ),
    [message, key]
  );

  return { announce, Announcer };
}

// =============================================================================
// Keyboard Navigation Hook
// =============================================================================

interface UseKeyboardNavigationOptions {
  onEnter?: () => void;
  onEscape?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onTab?: (shiftKey: boolean) => void;
  onHome?: () => void;
  onEnd?: () => void;
  onSpace?: () => void;
  enabled?: boolean;
}

/**
 * Hook for handling keyboard navigation events.
 */
export function useKeyboardNavigation({
  onEnter,
  onEscape,
  onArrowUp,
  onArrowDown,
  onArrowLeft,
  onArrowRight,
  onTab,
  onHome,
  onEnd,
  onSpace,
  enabled = true,
}: UseKeyboardNavigationOptions) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      switch (e.key) {
        case 'Enter':
          onEnter?.();
          break;
        case 'Escape':
          onEscape?.();
          break;
        case 'ArrowUp':
          e.preventDefault();
          onArrowUp?.();
          break;
        case 'ArrowDown':
          e.preventDefault();
          onArrowDown?.();
          break;
        case 'ArrowLeft':
          onArrowLeft?.();
          break;
        case 'ArrowRight':
          onArrowRight?.();
          break;
        case 'Tab':
          onTab?.(e.shiftKey);
          break;
        case 'Home':
          e.preventDefault();
          onHome?.();
          break;
        case 'End':
          e.preventDefault();
          onEnd?.();
          break;
        case ' ':
          if (onSpace) {
            e.preventDefault();
            onSpace();
          }
          break;
      }
    },
    [
      enabled,
      onEnter,
      onEscape,
      onArrowUp,
      onArrowDown,
      onArrowLeft,
      onArrowRight,
      onTab,
      onHome,
      onEnd,
      onSpace,
    ]
  );

  return { onKeyDown: handleKeyDown };
}

// =============================================================================
// Roving Tab Index Hook
// =============================================================================

interface UseRovingTabIndexOptions {
  itemCount: number;
  orientation?: 'horizontal' | 'vertical' | 'both';
  loop?: boolean;
  onSelect?: (index: number) => void;
}

/**
 * Hook for implementing roving tabindex pattern.
 * Used for keyboard navigation in composite widgets (tabs, menus, etc.).
 */
export function useRovingTabIndex({
  itemCount,
  orientation = 'horizontal',
  loop = true,
  onSelect,
}: UseRovingTabIndexOptions) {
  const [focusedIndex, setFocusedIndex] = useState(0);

  const getTabIndex = useCallback(
    (index: number) => (index === focusedIndex ? 0 : -1),
    [focusedIndex]
  );

  const moveFocus = useCallback(
    (direction: 'next' | 'prev' | 'first' | 'last') => {
      let newIndex = focusedIndex;

      switch (direction) {
        case 'next':
          newIndex = focusedIndex + 1;
          if (newIndex >= itemCount) {
            newIndex = loop ? 0 : itemCount - 1;
          }
          break;
        case 'prev':
          newIndex = focusedIndex - 1;
          if (newIndex < 0) {
            newIndex = loop ? itemCount - 1 : 0;
          }
          break;
        case 'first':
          newIndex = 0;
          break;
        case 'last':
          newIndex = itemCount - 1;
          break;
      }

      setFocusedIndex(newIndex);
      return newIndex;
    },
    [focusedIndex, itemCount, loop]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      let handled = false;

      if (orientation === 'horizontal' || orientation === 'both') {
        if (e.key === 'ArrowRight') {
          moveFocus('next');
          handled = true;
        } else if (e.key === 'ArrowLeft') {
          moveFocus('prev');
          handled = true;
        }
      }

      if (orientation === 'vertical' || orientation === 'both') {
        if (e.key === 'ArrowDown') {
          moveFocus('next');
          handled = true;
        } else if (e.key === 'ArrowUp') {
          moveFocus('prev');
          handled = true;
        }
      }

      if (e.key === 'Home') {
        moveFocus('first');
        handled = true;
      } else if (e.key === 'End') {
        moveFocus('last');
        handled = true;
      }

      if (e.key === 'Enter' || e.key === ' ') {
        onSelect?.(focusedIndex);
        handled = true;
      }

      if (handled) {
        e.preventDefault();
      }
    },
    [orientation, moveFocus, focusedIndex, onSelect]
  );

  return {
    focusedIndex,
    setFocusedIndex,
    getTabIndex,
    moveFocus,
    handleKeyDown,
  };
}

// =============================================================================
// Visually Hidden Component
// =============================================================================

interface VisuallyHiddenProps {
  children: ReactNode;
  as?: 'span' | 'div';
}

/**
 * Hides content visually while keeping it accessible to screen readers.
 */
export function VisuallyHidden({
  children,
  as: Component = 'span',
}: VisuallyHiddenProps) {
  return <Component className="sr-only">{children}</Component>;
}

// =============================================================================
// Focus Visible Only Hook
// =============================================================================

/**
 * Hook to determine if focus should be visible (keyboard navigation).
 */
export function useFocusVisible() {
  const [isFocusVisible, setIsFocusVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsFocusVisible(true);
      }
    };

    const handleMouseDown = () => {
      setIsFocusVisible(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return isFocusVisible;
}

// =============================================================================
// Reduced Motion Hook
// =============================================================================

/**
 * Hook to detect user's reduced motion preference.
 */
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}

// =============================================================================
// ID Generator Hook
// =============================================================================

let idCounter = 0;

/**
 * Hook to generate unique IDs for ARIA relationships.
 */
export function useId(prefix = 'studio') {
  const [id] = useState(() => `${prefix}-${++idCounter}`);
  return id;
}

// =============================================================================
// Helper Functions
// =============================================================================

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable]',
].join(', ');

/**
 * Gets all focusable elements within a container.
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)).filter(
    (el) => !el.hasAttribute('disabled') && el.tabIndex !== -1
  );
}

/**
 * Checks if an element is focusable.
 */
export function isFocusable(element: HTMLElement): boolean {
  return element.matches(FOCUSABLE_SELECTORS) && element.tabIndex !== -1;
}

/**
 * Creates ARIA label props for elements.
 */
export function getAriaLabel(
  label?: string,
  labelledBy?: string,
  describedBy?: string
) {
  return {
    ...(label && { 'aria-label': label }),
    ...(labelledBy && { 'aria-labelledby': labelledBy }),
    ...(describedBy && { 'aria-describedby': describedBy }),
  };
}

// =============================================================================
// Focus Ring Component
// =============================================================================

interface FocusRingProps {
  children: ReactNode;
  className?: string;
  ringClassName?: string;
}

/**
 * Wrapper that adds a consistent focus ring to children.
 */
export function FocusRing({
  children,
  className,
  ringClassName,
}: FocusRingProps) {
  return (
    <div
      className={cn(
        'focus-within:outline-none focus-within:ring-2',
        'focus-within:ring-studio-accent focus-within:ring-offset-2',
        'focus-within:ring-offset-studio-bg',
        ringClassName,
        className
      )}
    >
      {children}
    </div>
  );
}
