"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { NFTMarketplaceSidebar } from "@/components/nft-marketplace-sidebar";
import { useWalletAuthOptimized } from "@/hooks/use-wallet-auth-optimized";

export default function PublicLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { user, isConnected } = useWalletAuthOptimized();

  // Check if this is a marketplace route accessed by non-authenticated users
  const isPublicMarketplaceRoute = pathname.startsWith('/marketplace') && (!user || !isConnected);
  
  // For public marketplace routes, use the NFTMarketplaceSidebar
  if (isPublicMarketplaceRoute) {
    return (
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen w-full">
          <NFTMarketplaceSidebar />
          <SidebarInset className="flex-1 min-w-0 w-full transition-all duration-300 ease-in-out">
            {children}
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  // For all other public routes, render normally
  return <>{children}</>;
}