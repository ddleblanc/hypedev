"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { MediaRenderer } from "@/components/MediaRenderer";
import { useWalletAuthOptimized } from "@/hooks/use-wallet-auth-optimized";
import { ConnectButton } from "thirdweb/react";
import { sepolia } from "thirdweb/chains";
import { client } from "@/lib/thirdweb";
import { Wallet } from "lucide-react";
import { usePathname } from "next/navigation";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
  footerContent?: React.ReactNode;
  className?: string;
}

export function AuthenticatedLayout({ 
  children, 
  showHeader = true,
  showFooter = true,
  footerContent,
  className = ""
}: AuthenticatedLayoutProps) {
  const { user } = useWalletAuthOptimized();
  const connectButtonRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  
  // Determine view mode from pathname
  const getViewMode = () => {
    const pathMap: Record<string, string> = {
      '/': 'home',
      '/trade': 'trade',
      '/play': 'play',
      '/p2p': 'p2p',
      '/marketplace': 'marketplace',
      '/casual': 'casual',
      '/launchpad': 'launchpad',
      '/museum': 'museum',
      '/studio': 'studio',
    };
    return pathMap[pathname] || 'home';
  };
  
  const viewMode = getViewMode();

  // Mock data for user stats
  const mockUserData = {
    username: "CyberWarrior",
    level: 42,
    nftCount: 127,
    hyperTokens: 15420,
    rank: "Diamond Elite",
    profilePicture: "https://picsum.photos/100/100?random=50"
  };

  // Handle wallet connect click
  const handleWalletConnect = () => {
    const button = connectButtonRef.current?.querySelector('button');
    if (button) {
      button.click();
    }
  };

  return (
    <div className="flex flex-col min-h-screen">

      {/* Main Content Area */}
      <div className={`relative z-10 flex-1 ${className}`}>
        <div className={viewMode === 'marketplace' || viewMode === 'casual' || viewMode === 'launchpad' || viewMode === 'trade' || viewMode === 'museum' || viewMode === 'home' ? 'relative' : 'px-4 py-4'}>
          {children}
        </div>
      </div>

      {/* Footer */}
      {showFooter && footerContent && (
        <footer className="relative z-20 flex-shrink-0 px-16 py-6">
          {footerContent}
        </footer>
      )}

      {/* Hidden ConnectButton for wallet management */}
      <div ref={connectButtonRef} className="hidden">
        <ConnectButton
          client={client}
          chain={sepolia}
          connectButton={{
            label: 'Connect Wallet',
          }}
          connectModal={{
            size: 'wide',
            titleIcon: '',
            welcomeScreen: {
              title: 'Connect to HypeX',
              subtitle: 'Choose how you want to connect to the ultimate gaming NFT marketplace.',
            },
          }}
        />
      </div>
    </div>
  );
}