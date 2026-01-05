'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import {
  AUTH_CHECK_INTERVAL,
  AUTH_MIN_REFRESH_INTERVAL,
} from '@/lib/constants/auth';

interface RefreshResult {
  success: boolean;
  expiresAt?: string;
  error?: string;
}

/**
 * Hook to automatically refresh JWT before expiry
 *
 * Features:
 * - Periodic expiry checking (every 5 minutes)
 * - Automatic refresh before expiry (when < 24 hours remaining)
 * - Visibility change handler (refresh when user returns to tab)
 * - Concurrent refresh prevention
 * - Minimum interval between refreshes (1 minute)
 */
export function useTokenRefresh() {
  const { isAuthenticated } = useAuth();

  // Refs for managing refresh state
  const isRefreshing = useRef(false);
  const lastRefresh = useRef<number>(0);
  const lastCheck = useRef<number>(0);

  /**
   * Perform the token refresh
   */
  const refreshToken = useCallback(async (): Promise<RefreshResult> => {
    // Prevent concurrent refreshes
    if (isRefreshing.current) {
      return { success: false, error: 'Refresh already in progress' };
    }

    // Don't refresh too frequently
    const now = Date.now();
    if (now - lastRefresh.current < AUTH_MIN_REFRESH_INTERVAL) {
      return { success: false, error: 'Refresh rate limited' };
    }

    isRefreshing.current = true;

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success && data.data?.refreshed) {
        lastRefresh.current = now;
        return {
          success: true,
          expiresAt: data.data.expiresAt,
        };
      }

      return {
        success: false,
        error: data.error?.message || 'Refresh failed',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Token refresh error:', message);
      return { success: false, error: message };
    } finally {
      isRefreshing.current = false;
    }
  }, []);

  /**
   * Check token expiry and refresh if needed
   */
  const checkAndRefreshIfNeeded = useCallback(async () => {
    if (!isAuthenticated) return;

    // Don't check too frequently
    const now = Date.now();
    if (now - lastCheck.current < 30000) {
      return; // Min 30 seconds between checks
    }
    lastCheck.current = now;

    try {
      // Get current session info via verify endpoint
      const response = await fetch('/api/auth/verify', {
        credentials: 'include',
      });
      const data = await response.json();

      if (!data.success || !data.data?.loggedIn) {
        return;
      }

      // Check if we have session expiry info
      const session = data.data.session;
      if (!session?.refreshBefore) {
        return;
      }

      const refreshBefore = new Date(session.refreshBefore).getTime();

      // If past the refresh threshold, refresh the token
      if (now >= refreshBefore) {
        const timeUntilExpiry = new Date(session.expiresAt).getTime() - now;
        const hoursRemaining = Math.round(timeUntilExpiry / (1000 * 60 * 60));
        console.log(
          `Token expires in ~${hoursRemaining}h, refreshing...`
        );
        const result = await refreshToken();
        if (result.success) {
          console.log('Token refreshed successfully, new expiry:', result.expiresAt);
        } else {
          console.warn('Token refresh failed:', result.error);
        }
      }
    } catch (error) {
      console.error('Token expiry check failed:', error);
    }
  }, [isAuthenticated, refreshToken]);

  // Periodic check while authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    // Check immediately on mount
    const immediateCheck = setTimeout(() => {
      checkAndRefreshIfNeeded();
    }, 1000); // Small delay to avoid race with initial auth

    // Then check periodically
    const interval = setInterval(checkAndRefreshIfNeeded, AUTH_CHECK_INTERVAL);

    return () => {
      clearTimeout(immediateCheck);
      clearInterval(interval);
    };
  }, [isAuthenticated, checkAndRefreshIfNeeded]);

  // Check on visibility change (user returns to tab)
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // User returned to tab, check if refresh needed
        checkAndRefreshIfNeeded();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, checkAndRefreshIfNeeded]);

  // Check on window focus (catches cases visibility change might miss)
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleFocus = () => {
      checkAndRefreshIfNeeded();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [isAuthenticated, checkAndRefreshIfNeeded]);

  return {
    refreshToken,
    checkAndRefreshIfNeeded,
  };
}
