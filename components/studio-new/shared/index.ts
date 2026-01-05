/**
 * Studio New - Shared Components
 *
 * This module exports all shared UI components, utilities, and patterns
 * for the new studio design system.
 *
 * Phase 6: Polish components for production-ready UX.
 */

// =============================================================================
// Skeletons - Loading States
// =============================================================================
export {
  Skeleton,
  TextSkeleton,
  CardSkeleton,
  StatSkeleton,
  StatsStripSkeleton,
  ListItemSkeleton,
  ActivityListSkeleton,
  ProjectRowSkeleton,
  ProjectTreeSkeleton,
  GridItemSkeleton,
  NftGridSkeleton,
  InputSkeleton,
  FormSkeleton,
  CollectionHeaderSkeleton,
  CollectionDetailSkeleton,
  WizardStepSkeleton,
} from './skeletons';

// =============================================================================
// Empty States - Zero Data UX
// =============================================================================
export {
  EmptyState,
  NoProjectsEmpty,
  NoCollectionsEmpty,
  NoNftsEmpty,
  NoLootboxesEmpty,
  NoActivityEmpty,
  NoSearchResultsEmpty,
  NoDataEmpty,
  ErrorState,
  InlineError,
  DropZoneEmpty,
} from './empty-states';

// =============================================================================
// Error Handling - Resilient UX
// =============================================================================
export {
  ErrorBoundary,
  ErrorFallback,
  RetryableError,
  useErrorHandler,
  SuspenseErrorFallback,
  ApiErrorDisplay,
} from './error-boundary';

// =============================================================================
// Mobile Gestures - Touch Interactions
// =============================================================================
export {
  SwipeableListItem,
  SwipeDeleteItem,
  SwipeActionsItem,
  SwipeNavigation,
  useSwipe,
} from './swipeable';

export {
  PullToRefresh,
  usePullToRefresh,
  RefreshButton,
} from './pull-to-refresh';

// =============================================================================
// Animations - Consistent Motion Design
// =============================================================================
export {
  // Transitions
  fastTransition,
  standardTransition,
  smoothTransition,
  springTransition,
  gentleSpringTransition,
  stiffSpringTransition,
  // Fade Variants
  fadeVariants,
  fadeScaleVariants,
  fadeBlurVariants,
  // Slide Variants
  slideUpVariants,
  slideDownVariants,
  slideLeftVariants,
  slideRightVariants,
  panelSlideVariants,
  leftPanelSlideVariants,
  bottomSheetVariants,
  // Scale Variants
  scaleVariants,
  popVariants,
  bounceVariants,
  // Stagger Variants
  staggerContainerVariants,
  fastStaggerVariants,
  slowStaggerVariants,
  staggerItemVariants,
  gridItemVariants,
  // Page Transitions
  pageTransitionVariants,
  pageSlideForwardVariants,
  pageSlideBackVariants,
  // Tab/Step Variants
  tabContentVariants,
  tabIndicatorVariants,
  // Hover/Tap Variants
  cardHoverVariants,
  buttonVariants,
  iconButtonVariants,
  listItemHoverVariants,
  // Collapse/Expand
  accordionVariants,
  expandFromTopVariants,
  // Utilities
  getStaggerDelay,
  withDelay,
  combineVariants,
  // Presets
  modalPreset,
  panelPreset,
  dropdownPreset,
  toastPreset,
  listPreset,
  gridPreset,
} from './transitions';

// =============================================================================
// Accessibility - A11y Utilities
// =============================================================================
export {
  FocusTrap,
  SkipLink,
  Announcer,
  useAnnounce,
  useKeyboardNavigation,
  useRovingTabIndex,
  VisuallyHidden,
  useFocusVisible,
  useReducedMotion,
  useId,
  getFocusableElements,
  isFocusable,
  getAriaLabel,
  FocusRing,
} from './accessibility';

// =============================================================================
// Slide Panel - Overlay Component
// =============================================================================
export { SlidePanel } from './slide-panel';
