/**
 * Mobile utility functions for iOS-optimized experiences
 * Following iOS Human Interface Guidelines for spacing, touch targets, and safe areas
 */

/**
 * iOS spacing system (in pixels)
 * Based on Apple's 8pt grid system
 */
export const IOSSpacing = {
  xs: 4,   // 0.5 rem / p-1
  sm: 8,   // 1 rem / p-2
  md: 16,  // 2 rem / p-4
  lg: 24,  // 3 rem / p-6
  xl: 32,  // 4 rem / p-8
  xxl: 48, // 6 rem / p-12
} as const;

/**
 * iOS minimum touch targets (in pixels)
 * Based on Apple's Human Interface Guidelines
 */
export const IOSTouchTargets = {
  minimum: 44,      // Minimum for any interactive element
  comfortable: 48,  // Comfortable size for primary actions
  large: 56,        // Large buttons and cards
  extraLarge: 88,   // File upload areas, feature cards
} as const;

/**
 * iOS safe areas (in pixels)
 * For handling notch, status bar, and home indicator
 */
export const IOSSafeAreas = {
  top: 80,          // pt-20 (status bar + navigation)
  bottom: 128,      // pb-32 (home indicator + action bar)
  sides: 16,        // px-4 (standard horizontal padding)
} as const;

/**
 * Detects if the current device is mobile based on screen width
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
};

/**
 * Detects if the device has a notch (iPhone X and later)
 */
export const hasNotch = (): boolean => {
  if (typeof window === 'undefined') return false;

  // Check for safe area inset support (indicates notch/island devices)
  return CSS.supports('padding-top: env(safe-area-inset-top)');
};

/**
 * Gets the appropriate bottom padding for safe area
 * Accounts for home indicator on newer iOS devices
 */
export const getSafeAreaBottomPadding = (): string => {
  return hasNotch() ? 'pb-32' : 'pb-24';
};

/**
 * Gets the appropriate top padding for safe area
 * Accounts for status bar and notch
 */
export const getSafeAreaTopPadding = (): string => {
  return hasNotch() ? 'pt-24' : 'pt-20';
};

/**
 * Validates if an element meets iOS minimum touch target size
 */
export const validateTouchTarget = (size: number): boolean => {
  return size >= IOSTouchTargets.minimum;
};

/**
 * Framer Motion spring configuration for iOS-like animations
 */
export const IOSSpringConfig = {
  // Quick, snappy response (buttons, taps)
  snappy: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 17,
  },

  // Smooth, natural motion (page transitions)
  smooth: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 25,
  },

  // Gentle, fluid motion (cards, modals)
  gentle: {
    type: 'spring' as const,
    stiffness: 200,
    damping: 20,
  },

  // Bouncy, playful motion (success states)
  bouncy: {
    type: 'spring' as const,
    stiffness: 500,
    damping: 15,
  },
} as const;

/**
 * iOS-style haptic feedback simulation using scale animations
 */
export const IOSHapticScale = {
  tap: 0.95,        // Standard tap feedback
  light: 0.98,      // Light tap (cards, list items)
  medium: 0.93,     // Medium impact
  heavy: 0.90,      // Heavy impact (destructive actions)
} as const;

/**
 * Glassmorphism classes matching P2P visual style
 */
export const GlassmorphismStyles = {
  // Card backgrounds
  card: 'bg-white/5 backdrop-blur-lg border border-white/10',
  cardHover: 'hover:bg-white/10 hover:border-white/20',

  // Overlay backgrounds
  overlay: 'bg-black/60 backdrop-blur-xl',

  // Action bar / navigation
  actionBar: 'bg-black/95 backdrop-blur-xl border-t border-white/10',

  // Modal backgrounds
  modal: 'bg-black/80 backdrop-blur-2xl',
} as const;

/**
 * Typography scale matching iOS standards
 */
export const IOSTypography = {
  largeTitle: 'text-3xl font-bold',      // 34pt
  title1: 'text-2xl font-bold',          // 28pt
  title2: 'text-xl font-bold',           // 22pt
  title3: 'text-lg font-semibold',       // 20pt
  headline: 'text-base font-semibold',   // 17pt
  body: 'text-base',                     // 17pt
  callout: 'text-sm font-medium',        // 16pt
  subheadline: 'text-sm',                // 15pt
  footnote: 'text-xs',                   // 13pt
  caption1: 'text-xs text-white/60',     // 12pt
  caption2: 'text-[11px] text-white/60', // 11pt
} as const;

/**
 * Helper to generate iOS-compliant button classes
 */
export const getIOSButtonClasses = (variant: 'primary' | 'secondary' | 'destructive' = 'primary'): string => {
  const base = `min-h-[${IOSTouchTargets.comfortable}px] rounded-2xl font-semibold transition-all duration-300`;

  const variants = {
    primary: 'bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90',
    secondary: 'bg-white/5 backdrop-blur-lg border border-white/10 text-white hover:bg-white/10 hover:border-white/20',
    destructive: 'bg-red-500/90 text-white hover:bg-red-600',
  };

  return `${base} ${variants[variant]}`;
};

/**
 * Helper to generate iOS-compliant card classes
 */
export const getIOSCardClasses = (interactive: boolean = false): string => {
  const base = `${GlassmorphismStyles.card} rounded-2xl p-4 transition-all duration-300`;
  const interactiveClasses = interactive ? GlassmorphismStyles.cardHover : '';

  return `${base} ${interactiveClasses}`;
};

/**
 * Scroll to element with iOS-style smooth animation
 */
export const scrollToElement = (elementId: string, offset: number = IOSSafeAreas.top) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - offset;

  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth',
  });
};

/**
 * Prevents default iOS scroll bounce on specific elements
 */
export const preventIOSBounce = (element: HTMLElement) => {
  let startY = 0;

  element.addEventListener('touchstart', (e) => {
    startY = e.touches[0].pageY;
  });

  element.addEventListener('touchmove', (e) => {
    const y = e.touches[0].pageY;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const height = element.offsetHeight;

    // Prevent overscroll at top
    if (scrollTop === 0 && y > startY) {
      e.preventDefault();
    }

    // Prevent overscroll at bottom
    if (scrollTop + height >= scrollHeight && y < startY) {
      e.preventDefault();
    }
  }, { passive: false });
};
