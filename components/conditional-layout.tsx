"use client";

import { usePathname } from "next/navigation";
import { NFTMarketplaceSidebar } from "@/components/nft-marketplace-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useWalletAuthOptimized } from "@/hooks/use-wallet-auth-optimized";
import { PersistentBackground } from "@/components/persistent-background";
import { SinglePageApp } from "@/components/single-page-app";
import { AppNavigationProvider } from "@/contexts/app-navigation-context";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const { user, isConnected } = useWalletAuthOptimized();
  
  const isStudioRoute = pathname?.startsWith('/studio');
  const isCollectionRoute = pathname?.startsWith('/collection');
  
  // Define authenticated app routes
  const isAppRoute = pathname === '/' ||
    pathname === '/trade' ||
    pathname === '/play' ||
    pathname === '/p2p' ||
    pathname === '/marketplace' ||
    pathname === '/casual' ||
    pathname === '/launchpad' ||
    pathname === '/museum' ||
    pathname === '/studio';

  // Check if user is authenticated and on an app route
  const isAuthenticatedAppRoute = user && isConnected && isAppRoute;

  // For authenticated app routes, use single-page app with persistent background
  if (isAuthenticatedAppRoute) {
    return (
      <AppNavigationProvider>
        <PersistentBackground>
          <SinglePageApp />
        </PersistentBackground>
      </AppNavigationProvider>
    );
  }

  // For studio routes, collection pages, and homepage when not authenticated
  if (isStudioRoute || isCollectionRoute || pathname === '/') {
    return <>{children}</>;
  }

  // Non-authenticated users on other routes: Use NFTMarketplaceSidebar
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