"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWalletAuthOptimized } from "@/hooks/use-wallet-auth-optimized";
import Lottie from "lottie-react";
import loadingAnimation from "@/public/assets/anim/loading.json";

interface HomeRouterProps {
  publicContent: React.ReactNode;
  authenticatedContent: React.ReactNode;
}

export function HomeRouter({ publicContent, authenticatedContent }: HomeRouterProps) {
  const { user, isLoading, isConnected } = useWalletAuthOptimized();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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

  // If user is connected and authenticated, show authenticated content
  if (user && isConnected) {
    return <>{authenticatedContent}</>;
  }

  // Otherwise show public content
  return <>{publicContent}</>;
}