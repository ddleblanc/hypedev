/**
 * Utility to clean up stuck modal/dialog states
 *
 * Sometimes when dialogs close during async operations, the cleanup
 * doesn't happen properly, leaving the page in an unresponsive state.
 * This utility forcefully removes any stuck overlay effects.
 */

export function cleanupStuckModals() {
  // Remove any data attributes that Radix adds for scroll locking
  document.body.removeAttribute('data-scroll-locked');
  document.documentElement.removeAttribute('data-scroll-locked');

  // Remove any inline styles that might be blocking interactions
  const body = document.body;
  const html = document.documentElement;

  // Reset pointer-events
  body.style.pointerEvents = '';
  html.style.pointerEvents = '';

  // Reset overflow (scroll lock)
  body.style.overflow = '';
  body.style.overflowY = '';
  body.style.overflowX = '';

  // Reset position (sometimes dialogs set this)
  if (body.style.position === 'fixed') {
    body.style.position = '';
  }

  // Reset width/height that might have been set for scroll lock
  if (body.style.width === '100%' || body.style.width === '100vw') {
    body.style.width = '';
  }
  body.style.marginRight = '';
  body.style.paddingRight = '';

  // Remove any Radix portal containers that might be stuck
  // (Be careful - only remove empty ones or ones with stuck overlays)
  const portals = document.querySelectorAll('[data-radix-portal]');
  portals.forEach(portal => {
    // Check if portal has any visible children (dialogs/overlays)
    const hasVisibleOverlay = portal.querySelector('[data-state="open"]');
    if (!hasVisibleOverlay && portal.childElementCount === 0) {
      portal.remove();
    }
  });

  // Find and remove any stuck overlays (transparent full-screen elements)
  const potentialOverlays = document.querySelectorAll('[class*="fixed"][class*="inset-0"]');
  potentialOverlays.forEach(overlay => {
    // Check if it's a Radix overlay that's stuck
    const state = overlay.getAttribute('data-state');
    if (state === 'closed' || !state) {
      // Check if it's blocking interactions (has pointer-events auto or not set to none)
      const computedStyle = window.getComputedStyle(overlay);
      const pointerEvents = computedStyle.pointerEvents;
      const opacity = parseFloat(computedStyle.opacity);

      // If it's nearly invisible but still blocking, it's probably stuck
      if (pointerEvents !== 'none' && opacity < 0.1) {
        (overlay as HTMLElement).style.pointerEvents = 'none';
      }
    }
  });

  // Clean up Thirdweb-specific modal artifacts
  // Thirdweb modals may use different patterns
  const twModals = document.querySelectorAll(
    '[data-tw-modal], [id*="headlessui-dialog"], [class*="ConnectWallet"], [class*="tw-modal"]'
  );
  twModals.forEach(modal => {
    const state = modal.getAttribute('data-state') || modal.getAttribute('data-headlessui-state');
    if (!state || state === 'closed') {
      // Check if it's an overlay blocking interactions
      const computedStyle = window.getComputedStyle(modal);
      if (computedStyle.position === 'fixed' && computedStyle.pointerEvents !== 'none') {
        (modal as HTMLElement).style.pointerEvents = 'none';
      }
    }
  });

  // Clean up HeadlessUI (used by some Thirdweb components) artifacts
  const headlessUIPortals = document.querySelectorAll('#headlessui-portal-root');
  headlessUIPortals.forEach(portal => {
    // Check if empty or all children are closed
    const hasOpenDialog = portal.querySelector('[data-headlessui-state="open"]');
    if (!hasOpenDialog) {
      // Remove any inert attribute that might have been set
      document.querySelectorAll('[inert]').forEach(el => {
        el.removeAttribute('inert');
      });
    }
  });

  // Remove aria-hidden from main content if it was set by a dialog
  document.querySelectorAll('[aria-hidden="true"]').forEach(el => {
    // Only remove from main content areas, not from intentionally hidden elements
    if (el.tagName === 'MAIN' || el.id === '__next' || el.id === 'root') {
      el.removeAttribute('aria-hidden');
    }
  });

  // Remove any inert attributes that might be blocking
  document.querySelectorAll('[inert]').forEach(el => {
    // Check if there's an actual open dialog that needs this
    const hasOpenDialog = document.querySelector('[role="dialog"][data-state="open"]');
    if (!hasOpenDialog) {
      el.removeAttribute('inert');
    }
  });

  // Force a re-paint to ensure styles are applied
  void document.body.offsetHeight;

  console.log('[modal-cleanup] Cleaned up potential stuck modal states');
}

/**
 * Hook to call cleanup on component unmount or error states
 */
export function useModalCleanup() {
  if (typeof window === 'undefined') return;

  return {
    cleanup: cleanupStuckModals,
  };
}
