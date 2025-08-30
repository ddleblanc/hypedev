High-Level Layout Architecture Guide
Core Philosophy: Native App Experience

The layout system is designed to provide a native app experience with persistent UI elements that don't reload on route changes, enabling fluid transitions and maintaining state across navigation.

Architecture Overview

1. Root Level Integration (app/layout.tsx)

<BackgroundCarouselProvider>
  <AppNavigationProvider>
    <StudioProvider>
      <PersistentBackground>  // Global background system
        <LayoutWrapper>       // Global UI elements system
          {children}          // All pages go here
        </LayoutWrapper>
      </PersistentBackground>
    </StudioProvider>
  </AppNavigationProvider>
</BackgroundCarouselProvider>

- Single Global Instance: Only ONE LayoutWrapper exists at the root level
- Persistent Across Routes: Header, footer, sidebars, and background persist without reloading
- No Nested LayoutWrappers: Individual pages should NEVER wrap themselves in <LayoutWrapper>

2. Background System Architecture

PersistentBackground Component:

- Fixed Positioning: fixed inset-0 z-0 - sits behind all content
- Route-Aware Effects: Different zoom, blur, and overlay effects per route
- Video/Image Detection: Automatically detects and handles both video and image backgrounds
- Performance Optimized: Video only plays on home route, pauses elsewhere

Background State Management:

// BackgroundCarouselContext provides:
{
  currentBackground: string;     // Current background URL/path
  isCarouselVisible: boolean;    // Carousel visibility state
  setCurrentBackground: (bg: string) => void;  // Change background
  showCarousel: () => void;      // Show background selector
  hideCarousel: () => void;      // Hide background selector
}

Route-Specific Background Effects:

- Home: scale-100 blur-none - Full clarity, normal size
- Trade/Play: scale-110 blur-sm - Slight zoom and blur
- Lootboxes: scale-110 blur-sm + black overlay - Dramatic darkening
- P2P: scale-150 blur-lg - Heavy zoom and blur for focus
- Marketplace/Studio/etc: scale-125 blur-md - Medium effects

3. LayoutWrapper Logic Flow

The LayoutWrapper has intelligent routing logic:

Route Classification:

- Studio Routes (/studio/*): Bypass layout system entirely (<>{children}</>)
- Unauthenticated Marketplace: Uses special SidebarProvider system
- Authenticated Routes: Use ProgressiveUIWrapper with state-driven UI elements
- Public Pages: Default passthrough (<>{children}</>)

Progressive UI State Management:

interface ProgressiveUIState {
  showHeader: boolean;        // AnimatedHeader visibility
  showFooter: boolean;        // AnimatedFooter visibility
  showSidebar: boolean;       // Left AnimatedSidebar visibility
  showRightSidebar: boolean;  // Right AnimatedSidebar visibility
  navigationDepth: number;    // For breadcrumb/navigation logic
  previousRoute: string | null; // For back navigation
}

4. UI Element Rendering Pattern

// Background layer (z-0)
<PersistentBackground>

  // UI elements layer (z-50 for header, z-40 for sidebars)
  <AnimatedHeader show={uiState.showHeader} />
  <AnimatedFooter show={uiState.showFooter} />
  <AnimatedSidebar show={uiState.showSidebar} />
  <RightAnimatedSidebar show={uiState.showRightSidebar} />

  // Content layer (z-10) with automatic padding adjustments
  <div className={`
    transition-all duration-300 ease-in-out
    ${uiState.showSidebar ? 'pl-80' : 'pl-0'}
    ${uiState.showRightSidebar ? 'pr-80' : 'pr-0'}
  `}>
    {children} // Page content goes here
  </div>

</PersistentBackground>

5. Z-Index Hierarchy

- Background: z-0 - PersistentBackground
- Lootbox Overlay: z-5 - Special black overlay for lootboxes
- Content: z-10 - Page content
- Sidebars: z-40 - AnimatedSidebar, RightAnimatedSidebar
- Header: z-50 - AnimatedHeader (highest priority)

6. Route-Specific UI Configurations

Examples of Route Configurations:

- Home (/): No UI elements, video background plays (fullscreen experience)
- Trade (/trade): Header + Footer, background blurred + zoomed
- Marketplace (/marketplace): Header + Footer + Left Sidebar, background heavily dimmed
- P2P (/p2p): Header + Footer + Left Sidebar + Right Sidebar, maximum background blur
- Lootboxes (/lootboxes): Header only + black overlay, background paused
- Lootbox Detail (/lootboxes/[id]): Header + Left Sidebar
- Play Subroutes (/play/*): Header + Footer + Left Sidebar

7. State Synchronization Strategy

- Initial State Calculation: Calculates correct UI state on first render to prevent transitions
- useEffect State Updates: Only updates state when actual changes are needed
- Transition Prevention: Returns previous state object if no changes, preventing unnecessary re-renders
- Background Context: Separate context for background management, independent of UI layout

Implementation Rules

✅ Correct Usage:

// Individual page components - just return content
export default function MyPage() {
  return (
    <div>
      {/* Page content directly - background and UI handled globally */}
      <h1>My Page</h1>
    </div>
  );
}

// Access background controls if needed
const { currentBackground, setCurrentBackground } = useBackgroundCarousel();

❌ Incorrect Usage:

// DON'T DO THIS - Creates duplicate UI elements
export default function MyPage() {
  return (
    <LayoutWrapper>  {/* ❌ WRONG - Already wrapped at root level */}
      <div>
        <h1>My Page</h1>
      </div>
    </LayoutWrapper>
  );
}

// DON'T DO THIS - Interferes with global background
export default function MyPage() {
  return (
    <div style={{ background: 'url(...)' }}>  {/* ❌ WRONG - Use background context */}
      <h1>My Page</h1>
    </div>
  );
}

8. Adding New Routes

When adding new routes, update THREE places:

1. Background Effects (PersistentBackground.getBackgroundStyles)
2. Initial State Function (LayoutWrapper.getInitialUIState)
3. useEffect State Logic (LayoutWrapper useEffect)

Example:
// 1. Add background effects
case 'newroute':
  scale = 'scale-120';
  blur = 'blur-md';
  break;

// 2. Add to initial state
else if (currentRoute === 'newroute') {
  return { showHeader: true, showFooter: false, showSidebar: true, showRightSidebar: false, navigationDepth: 2,
  previousRoute: 'home' };
}

// 3. Add to useEffect state logic
else if (currentRoute === 'newroute') {
  newState = {
    showHeader: true,
    showFooter: false,
    showSidebar: true,
    showRightSidebar: false,
    navigationDepth: 2,
    previousRoute: 'home'
  };
}

Key Benefits

- Zero Layout Shifts: UI elements and background don't reload between routes
- Smooth Transitions: AnimatePresence handles enter/exit animations for UI elements
- Dynamic Backgrounds: Background effects change smoothly based on current route
- Video Performance: Video backgrounds only play when appropriate (home screen)
- State Persistence: Navigation and background state maintained across route changes
- Automatic Spacing: Content padding adjusts automatically based on visible sidebars
- Native Feel: Mimics native app navigation with persistent background and UI layers
- User Customization: Background carousel allows users to personalize their experience
