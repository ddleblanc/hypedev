'use client';

import { type Variants, type Transition } from 'framer-motion';

// =============================================================================
// Standard Transition Presets
// =============================================================================

/**
 * Fast, snappy transitions for micro-interactions.
 * Use for: hover states, toggles, buttons
 */
export const fastTransition: Transition = {
  duration: 0.15,
  ease: [0.4, 0, 0.2, 1], // ease-out
};

/**
 * Standard transition for most UI elements.
 * Use for: modals, panels, tabs, cards
 */
export const standardTransition: Transition = {
  duration: 0.2,
  ease: [0.4, 0, 0.2, 1],
};

/**
 * Smooth transition for larger elements.
 * Use for: page transitions, large overlays
 */
export const smoothTransition: Transition = {
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1],
};

/**
 * Spring transition for bouncy, organic feel.
 * Use for: cards, list items, draggable elements
 */
export const springTransition: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
};

/**
 * Gentle spring for larger movements.
 * Use for: panels, drawers, modals
 */
export const gentleSpringTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 25,
};

/**
 * Stiff spring for snappy interactions.
 * Use for: tooltips, dropdowns, quick actions
 */
export const stiffSpringTransition: Transition = {
  type: 'spring',
  stiffness: 500,
  damping: 30,
};

// =============================================================================
// Fade Variants
// =============================================================================

/**
 * Simple fade in/out.
 */
export const fadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

/**
 * Fade with subtle scale.
 */
export const fadeScaleVariants: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

/**
 * Fade with blur effect (for overlays/backdrops).
 */
export const fadeBlurVariants: Variants = {
  initial: { opacity: 0, filter: 'blur(8px)' },
  animate: { opacity: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, filter: 'blur(8px)' },
};

// =============================================================================
// Slide Variants
// =============================================================================

/**
 * Slide up (for bottom sheets, toasts).
 */
export const slideUpVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

/**
 * Slide down (for dropdowns, menus).
 */
export const slideDownVariants: Variants = {
  initial: { opacity: 0, y: -10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

/**
 * Slide from left (for navigation, sidebars).
 */
export const slideLeftVariants: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

/**
 * Slide from right (for panels, drawers).
 */
export const slideRightVariants: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

/**
 * Full-width slide from right (for slide panels).
 */
export const panelSlideVariants: Variants = {
  initial: { x: '100%' },
  animate: { x: 0 },
  exit: { x: '100%' },
};

/**
 * Full-width slide from left.
 */
export const leftPanelSlideVariants: Variants = {
  initial: { x: '-100%' },
  animate: { x: 0 },
  exit: { x: '-100%' },
};

/**
 * Bottom sheet slide (for mobile).
 */
export const bottomSheetVariants: Variants = {
  initial: { y: '100%' },
  animate: { y: 0 },
  exit: { y: '100%' },
};

// =============================================================================
// Scale Variants
// =============================================================================

/**
 * Scale from center (for modals, dialogs).
 */
export const scaleVariants: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
};

/**
 * Pop in effect (for buttons, icons).
 */
export const popVariants: Variants = {
  initial: { opacity: 0, scale: 0.5 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.5 },
};

/**
 * Bounce in (for notifications, badges).
 */
export const bounceVariants: Variants = {
  initial: { opacity: 0, scale: 0.3 },
  animate: {
    opacity: 1,
    scale: [1.1, 0.95, 1],
    transition: { duration: 0.4 },
  },
  exit: { opacity: 0, scale: 0.3 },
};

// =============================================================================
// Stagger Variants (for lists)
// =============================================================================

/**
 * Container variant for staggered children.
 */
export const staggerContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
};

/**
 * Fast stagger for short lists.
 */
export const fastStaggerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.03,
    },
  },
};

/**
 * Slow stagger for dramatic reveals.
 */
export const slowStaggerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

/**
 * Child item variant for staggered lists.
 */
export const staggerItemVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

/**
 * Grid item variant (for NFT grids, etc.).
 */
export const gridItemVariants: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
};

// =============================================================================
// Page Transition Variants
// =============================================================================

/**
 * Page fade transition.
 */
export const pageTransitionVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

/**
 * Page slide right (forward navigation).
 */
export const pageSlideForwardVariants: Variants = {
  initial: { opacity: 0, x: 100 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -100 },
};

/**
 * Page slide left (backward navigation).
 */
export const pageSlideBackVariants: Variants = {
  initial: { opacity: 0, x: -100 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 100 },
};

// =============================================================================
// Tab/Step Variants
// =============================================================================

/**
 * Tab content slide (for wizard steps, tabs).
 */
export const tabContentVariants: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

/**
 * Tab indicator (underline animation).
 */
export const tabIndicatorVariants: Variants = {
  initial: { width: 0 },
  animate: { width: '100%' },
  exit: { width: 0 },
};

// =============================================================================
// Hover/Tap Variants
// =============================================================================

/**
 * Card hover effect.
 */
export const cardHoverVariants: Variants = {
  initial: { scale: 1 },
  hover: { scale: 1.02, y: -4 },
  tap: { scale: 0.98 },
};

/**
 * Button press effect.
 */
export const buttonVariants: Variants = {
  initial: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.95 },
};

/**
 * Icon button effect.
 */
export const iconButtonVariants: Variants = {
  initial: { scale: 1 },
  hover: { scale: 1.1 },
  tap: { scale: 0.9 },
};

/**
 * List item hover.
 */
export const listItemHoverVariants: Variants = {
  initial: { backgroundColor: 'transparent' },
  hover: { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
  tap: { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
};

// =============================================================================
// Collapse/Expand Variants
// =============================================================================

/**
 * Accordion content.
 */
export const accordionVariants: Variants = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1 },
  exit: { height: 0, opacity: 0 },
};

/**
 * Expand from top.
 */
export const expandFromTopVariants: Variants = {
  initial: { height: 0, opacity: 0, originY: 0 },
  animate: { height: 'auto', opacity: 1 },
  exit: { height: 0, opacity: 0 },
};

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Creates stagger delay for list items.
 */
export function getStaggerDelay(index: number, baseDelay = 0.05): number {
  return index * baseDelay;
}

/**
 * Creates a custom variant with delay.
 */
export function withDelay(variants: Variants, delay: number): Variants {
  return {
    ...variants,
    animate: {
      ...(typeof variants.animate === 'object' ? variants.animate : {}),
      transition: {
        ...(typeof variants.animate === 'object' && 'transition' in variants.animate
          ? variants.animate.transition
          : {}),
        delay,
      },
    },
  };
}

/**
 * Combines multiple variant objects.
 */
export function combineVariants(...variants: Variants[]): Variants {
  return variants.reduce(
    (acc, variant) => ({
      initial: { ...acc.initial, ...variant.initial },
      animate: { ...acc.animate, ...variant.animate },
      exit: { ...acc.exit, ...variant.exit },
      hover: { ...acc.hover, ...variant.hover },
      tap: { ...acc.tap, ...variant.tap },
    }),
    {} as Variants
  );
}

// =============================================================================
// Presets for Common Use Cases
// =============================================================================

/**
 * Preset for modal/dialog animations.
 */
export const modalPreset = {
  variants: scaleVariants,
  transition: gentleSpringTransition,
};

/**
 * Preset for slide panel animations.
 */
export const panelPreset = {
  variants: panelSlideVariants,
  transition: gentleSpringTransition,
};

/**
 * Preset for dropdown/menu animations.
 */
export const dropdownPreset = {
  variants: slideDownVariants,
  transition: fastTransition,
};

/**
 * Preset for toast/notification animations.
 */
export const toastPreset = {
  variants: slideUpVariants,
  transition: springTransition,
};

/**
 * Preset for list item animations.
 */
export const listPreset = {
  containerVariants: staggerContainerVariants,
  itemVariants: staggerItemVariants,
  transition: standardTransition,
};

/**
 * Preset for grid animations.
 */
export const gridPreset = {
  containerVariants: staggerContainerVariants,
  itemVariants: gridItemVariants,
  transition: standardTransition,
};
