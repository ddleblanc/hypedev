# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
- `npm run dev` - Start development server (Next.js on port 3000)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Database Commands (Prisma + PostgreSQL)
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

## Tech Stack & Key Requirements

### Blockchain Integration
You must exclusively use **Thirdweb v5** APIs and tools for *all* blockchain-related functionality—covering wallets, contracts, IPFS, NFTs, claim logic, media rendering, AI integrations, and more.

- No v4 or legacy usage permitted.
- Ensure every blockchain related task references Thirdweb v5 documentation and SDK.

### Core Technologies
- **Framework**: Next.js 15+ with App Router
- **Database**: PostgreSQL via Prisma
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context API
- **Animations**: Framer Motion
- **Authentication**: Wallet-based (Thirdweb v5)

## Key Architecture Patterns

### Database Schema
The application uses a comprehensive Prisma schema with models for:
- **User Management**: User, CreatorApplication, UserFollow, UserSocial
- **NFT System**: Project, Collection, Nft, NftTrait, CollectionTrait, CollectionTraitValue
- **Search & Analytics**: SearchIndex, UserPreference, UserSuggestion, GlobalSuggestion

### Important Conventions
- All blockchain interactions must use Thirdweb v5 SDK exclusively
- Components use shadcn/ui patterns and Radix primitives
- Database operations use Prisma Client with PostgreSQL
- Image optimization uses Next.js Image component
- Form handling uses react-hook-form with zod validation

## High-Level Layout Architecture Guide
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

The LayoutWrapper (`components/layout-wrapper.tsx`) serves as the intelligent router for UI element visibility and coordinates all animated components. It has sophisticated routing logic:

Route Classification:

- **Studio Routes** (/studio/*): Bypass layout system entirely (<>{children}</>)
- **Unauthenticated Marketplace**: Uses special SidebarProvider system with NFTMarketplaceSidebar
- **Authenticated Routes**: Use ProgressiveUIWrapper with state-driven UI elements
- **Collection Routes**: Conditional layout based on authentication status
- **Public Pages**: Default passthrough (<>{children}</>)

### LayoutWrapper Component Coordination

The LayoutWrapper manages four main animated UI components:

- **AnimatedHeader** (`components/animated-ui/animated-header.tsx`) - Top navigation
- **AnimatedFooter** (`components/animated-ui/animated-footer.tsx`) - Bottom navigation
- **AnimatedSidebar** (`components/animated-ui/animated-sidebar.tsx`) - Left sidebar
- **RightAnimatedSidebar** (`components/animated-ui/right-animated-sidebar.tsx`) - Right sidebar

### Progressive UI State Management:

The LayoutWrapper uses a sophisticated state system that calculates which UI elements should be visible based on:
- Current route path
- User authentication status
- Mobile vs desktop screen size
- Route hierarchy depth

```typescript
interface ProgressiveUIState {
  showHeader: boolean;        // AnimatedHeader visibility
  showFooter: boolean;        // AnimatedFooter visibility
  showSidebar: boolean;       // Left AnimatedSidebar visibility
  showRightSidebar: boolean;  // Right AnimatedSidebar visibility
  navigationDepth: number;    // For breadcrumb/navigation logic
  previousRoute: string | null; // For back navigation
}
```

### Route-Specific UI Configurations:

- **Home (/)**: No UI elements visible - Full immersive experience
- **Trade (/trade)**: Header only - Minimal interface for trading
- **Play (/play)**: Header + Footer - Basic navigation
- **Marketplace (/marketplace)**: Header + Footer + Left Sidebar (desktop only)
- **P2P (/p2p)**: All UI elements - Maximum functionality
- **Studio (/studio)**: Header + Footer + Left Sidebar - Creative workspace
- **Lootboxes (/lootboxes)**: Dynamic - No UI on main page, Header + Sidebar on detail pages

### Mobile Responsiveness:
The LayoutWrapper automatically hides sidebars and footers on mobile devices (< 768px width) for most routes, ensuring optimal mobile experience.

4. UI Element Rendering Pattern

The LayoutWrapper renders animated UI components in a specific layered approach within the ProgressiveUIWrapper:

```jsx
// The LayoutWrapper orchestrates all UI elements
<ProgressiveUIWrapper>
  <AnimatedHeader
    show={uiState.showHeader}
    onNavigate={handleNavigate}
    currentRoute={currentRoute}
    onStudioViewChange={handleStudioViewChange}
    currentStudioView={currentStudioView}
  />
  <AnimatedFooter show={uiState.showFooter} />
  <AnimatedSidebar
    show={uiState.showSidebar}
    currentRoute={currentRoute}
    studioData={studioData}
    p2pData={p2pData}
    lootboxData={lootboxData}
    onNavigate={handleNavigate}
  />
  <RightAnimatedSidebar
    show={uiState.showRightSidebar}
    currentRoute={currentRoute}
    p2pData={p2pRightSidebarData}
  />

  {/* Content layer with automatic padding adjustments */}
  <div className={`
    transition-all duration-300 ease-in-out
    ${uiState.showSidebar ? 'md:pl-80' : 'pl-0'}
    ${uiState.showRightSidebar ? 'md:pr-80' : 'pr-0'}
  `}>
    {children} // Page content goes here
  </div>
</ProgressiveUIWrapper>
```

### Key Implementation Details:
- **State Synchronization**: LayoutWrapper calculates initial state on render and updates via useEffect
- **Animation Coordination**: All UI elements use AnimatePresence for smooth enter/exit animations
- **Responsive Padding**: Content area automatically adjusts padding based on visible sidebars
- **Route-Aware Components**: Each animated component receives currentRoute prop for contextual behavior

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
