"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireOnboarding?: boolean;
}

/**
 * Protected Route Component
 * Wraps pages that require wallet authentication
 * Redirects to login page if wallet is not connected
 */
export function ProtectedRoute({
  children,
  redirectTo = "/login",
  requireOnboarding = false
}: ProtectedRouteProps) {
  const router = useRouter();
  const { isConnected, isLoading, user, requiresOnboarding } = useAuth();

  useEffect(() => {
    // Wait for initial loading to complete
    if (isLoading) return;

    // If not connected, redirect to specified page
    if (!isConnected) {
      router.push(redirectTo);
      return;
    }

    // If route requires completed onboarding but user hasn't completed it
    if (requireOnboarding && requiresOnboarding) {
      router.push("/signup");
      return;
    }
  }, [isConnected, isLoading, requiresOnboarding, requireOnboarding, router, redirectTo]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[rgb(163,255,18)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60 text-sm">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show nothing while redirecting (prevents flash of protected content)
  if (!isConnected || (requireOnboarding && requiresOnboarding)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[rgb(163,255,18)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60 text-sm">Redirecting...</p>
        </div>
      </div>
    );
  }

  // User is authenticated, render children
  return <>{children}</>;
}
