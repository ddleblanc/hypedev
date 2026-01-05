"use client";

import React, { useEffect, useCallback, useRef } from 'react';
import { cleanupStuckModals } from '@/lib/modal-cleanup';

/**
 * Global modal cleanup provider that:
 * 1. Listens for Escape key to trigger emergency cleanup
 * 2. Monitors for stuck modal states and auto-cleans
 * 3. Detects when the page becomes unresponsive due to stuck overlays
 */
export function ModalCleanupProvider({ children }: { children: React.ReactNode }) {
  const lastClickTarget = useRef<EventTarget | null>(null);
  const clickCount = useRef(0);
  const lastClickTime = useRef(0);

  // Emergency escape key handler - triple Escape cleans up stuck modals
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      // Check if we're in a truly stuck state (no open dialogs but body is locked)
      const hasOpenDialog = document.querySelector('[role="dialog"][data-state="open"]');
      const hasScrollLock = document.body.hasAttribute('data-scroll-locked');

      // If body is scroll-locked but no open dialog, we're stuck
      if (hasScrollLock && !hasOpenDialog) {
        console.log('[modal-cleanup] Escape pressed with no open dialog but scroll lock - cleaning up');
        cleanupStuckModals();
      }
    }
  }, []);

  // Detect rapid clicks on what seems like the background (indicating stuck overlay)
  const handleClick = useCallback((event: MouseEvent) => {
    const now = Date.now();
    const target = event.target as HTMLElement;

    // Check if clicking on html or body (indicates overlay blocking everything)
    if (target === document.body || target === document.documentElement) {
      // If rapidly clicking on body/html, user is probably trying to interact but can't
      if (now - lastClickTime.current < 500) {
        clickCount.current++;

        if (clickCount.current >= 3) {
          console.log('[modal-cleanup] Detected 3+ rapid clicks on body/html - cleaning up');
          cleanupStuckModals();
          clickCount.current = 0;
        }
      } else {
        clickCount.current = 1;
      }

      lastClickTime.current = now;
    } else {
      // Reset if clicking on actual elements
      clickCount.current = 0;
    }

    lastClickTarget.current = event.target;
  }, []);

  // Periodic check for stuck states
  useEffect(() => {
    const checkForStuckState = () => {
      const hasScrollLock = document.body.hasAttribute('data-scroll-locked');
      const hasOpenDialog = document.querySelector('[role="dialog"][data-state="open"]');
      const hasPointerEventsNone = document.body.style.pointerEvents === 'none';

      // Stuck state: scroll lock or pointer-events:none without any open dialog
      if ((hasScrollLock || hasPointerEventsNone) && !hasOpenDialog) {
        console.log('[modal-cleanup] Periodic check found stuck state - cleaning up');
        cleanupStuckModals();
      }
    };

    // Check every 2 seconds
    const interval = setInterval(checkForStuckState, 2000);

    return () => clearInterval(interval);
  }, []);

  // Listen for ThirdWeb modal events via MutationObserver
  useEffect(() => {
    let cleanupTimeout: NodeJS.Timeout | null = null;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // Check if a Thirdweb modal was removed
          mutation.removedNodes.forEach((node) => {
            if (node instanceof HTMLElement) {
              // Thirdweb modals often have specific identifiers
              const isThirdwebModal =
                node.querySelector('[data-tw-modal]') ||
                node.classList?.contains('tw-connected-wallet') ||
                node.id?.includes('headlessui') ||
                node.querySelector('[class*="ConnectWallet"]');

              if (isThirdwebModal) {
                // Clean up after Thirdweb modal closes
                if (cleanupTimeout) clearTimeout(cleanupTimeout);
                cleanupTimeout = setTimeout(() => {
                  const hasScrollLock = document.body.hasAttribute('data-scroll-locked');
                  const hasOpenDialog = document.querySelector('[role="dialog"][data-state="open"]');

                  if (hasScrollLock && !hasOpenDialog) {
                    console.log('[modal-cleanup] Thirdweb modal closed - cleaning up stuck state');
                    cleanupStuckModals();
                  }
                }, 100);
              }
            }
          });
        }

        // Also check for attribute changes on body
        if (mutation.type === 'attributes' && mutation.target === document.body) {
          // If pointer-events was just set to none, schedule a check
          if (mutation.attributeName === 'style') {
            const body = document.body;
            if (body.style.pointerEvents === 'none') {
              if (cleanupTimeout) clearTimeout(cleanupTimeout);
              cleanupTimeout = setTimeout(() => {
                // Still has pointer-events: none after delay?
                if (body.style.pointerEvents === 'none') {
                  const hasOpenDialog = document.querySelector('[role="dialog"][data-state="open"]');
                  if (!hasOpenDialog) {
                    console.log('[modal-cleanup] Pointer-events stuck on body - cleaning up');
                    cleanupStuckModals();
                  }
                }
              }, 500);
            }
          }
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'data-scroll-locked']
    });

    return () => {
      observer.disconnect();
      if (cleanupTimeout) clearTimeout(cleanupTimeout);
    };
  }, []);

  // Add global event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClick, true); // Capture phase to catch blocked clicks

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClick, true);
    };
  }, [handleKeyDown, handleClick]);

  return <>{children}</>;
}
