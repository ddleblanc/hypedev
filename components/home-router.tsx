"use client";

import { useWalletAuthOptimized } from "@/hooks/use-wallet-auth-optimized";
import { HomepageContainer, PublicHomepageContainer } from "@/components/homepage/homepage-container";
import Lottie from "lottie-react";
import loadingAnimation from "@/public/assets/anim/loading.json";

export function HomeRouter() {
  const { user, isLoading, isConnected } = useWalletAuthOptimized();

  // Show loading state while checking authentication
  if (isLoading) {
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

  // Authenticated users get the full dual-homepage experience with portal switch
  if (user && isConnected) {
    return <HomepageContainer isAuthenticated={true} />;
  }

  // Unauthenticated users see Traditional homepage only (no portal switch)
  return <PublicHomepageContainer />;
}
