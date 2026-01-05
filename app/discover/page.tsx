"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TraditionalHomepage } from "@/components/homepage/traditional/traditional-homepage";
import { PortalSwitchButton } from "@/components/homepage/portal-switch-button";
import { useAuth } from "@/contexts/auth-context";
import { AuthenticatedConnectButton } from "@/components/auth/authenticated-connect-button";
import { LogIn, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Lottie from "lottie-react";
import loadingAnimation from "@/public/assets/anim/loading.json";

/**
 * Content component that uses searchParams
 * Must be wrapped in Suspense for Next.js 15
 */
function DiscoverContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();

  // Get redirect URL from query params (set by middleware when redirecting from protected routes)
  const redirectTo = searchParams.get("redirect");

  // Handle redirect after authentication
  useEffect(() => {
    if (isAuthenticated && redirectTo && !isLoading) {
      // Validate redirect URL to prevent open redirects
      if (redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
        router.push(redirectTo);
      }
    }
  }, [isAuthenticated, redirectTo, isLoading, router]);

  const handleModeChange = (mode: "traditional" | "hud") => {
    if (mode === "hud") {
      router.push("/home");
    }
  };

  const dismissAuthBanner = () => {
    // Remove redirect param from URL
    router.replace("/discover");
  };

  // Format the redirect path for display
  const formatRedirectPath = (path: string) => {
    const parts = path.split("/").filter(Boolean);
    if (parts.length === 0) return "this page";
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  };

  return (
    <div className="relative min-h-screen">
      {/* Auth Required Banner */}
      {redirectTo && !isAuthenticated && !isLoading && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[rgb(163,255,18)]/90 to-[rgb(140,230,10)]/90 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-black/20 rounded-lg">
                  <LogIn className="w-5 h-5 text-black" />
                </div>
                <div>
                  <p className="font-semibold text-black">
                    Connect your wallet to access {formatRedirectPath(redirectTo)}
                  </p>
                  <p className="text-sm text-black/70">
                    Sign in with your wallet to continue
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AuthenticatedConnectButton
                  className="[&_button]:bg-black [&_button]:hover:bg-black/90 [&_button]:text-white"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={dismissAuthBanner}
                  className="text-black/70 hover:text-black hover:bg-black/10"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add top padding when banner is shown */}
      <div className={redirectTo && !isAuthenticated && !isLoading ? "pt-16" : ""}>
        <TraditionalHomepage />
      </div>

      <PortalSwitchButton
        currentMode="traditional"
        onModeChange={handleModeChange}
        isTransitioning={false}
      />
    </div>
  );
}

/**
 * Loading fallback for Suspense boundary
 */
function DiscoverLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center space-y-4">
        <Lottie
          animationData={loadingAnimation}
          loop={true}
          className="w-32 h-32 mx-auto"
        />
      </div>
    </div>
  );
}

/**
 * Discover page with proper Suspense boundary for useSearchParams
 */
export default function DiscoverPage() {
  return (
    <Suspense fallback={<DiscoverLoading />}>
      <DiscoverContent />
    </Suspense>
  );
}
