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
    <div className="flex flex-col h-full">
      {/* Header */}
      {showHeader && (
        <header className="relative z-50 flex items-center justify-between px-16 py-6 flex-shrink-0">
          {/* Left section - Logo or View Title */}
          {viewMode === 'home' && (
            <div className="animate-[slideInLeft_0.3s_ease-out_0.1s_both]">
              <Image
                src="/assets/img/logo-text.png"
                alt="HYPERCHAINX"
                width={300}
                height={100}
                className="h-12 w-auto drop-shadow-2xl"
              />
            </div>
          )}
          {viewMode === 'p2p' && (
            <div className="animate-[slideInLeft_0.3s_ease-out_0.1s_both]">
              <h1 
                className="text-white text-6xl font-black tracking-wider"
                style={{ textShadow: '0 0 30px rgba(163,255,18,0.3)' }}
              >
                P2P TRADE
              </h1>
            </div>
          )}
          {viewMode === 'marketplace' && (
            <div className="animate-[slideInLeft_0.3s_ease-out_0.1s_both]">
              <h1 
                className="text-white text-6xl font-black tracking-wider"
                style={{ textShadow: '0 0 30px rgba(163,255,18,0.3)' }}
              >
                MARKETPLACE
              </h1>
            </div>
          )}
          {viewMode === 'casual' && (
            <div className="animate-[slideInLeft_0.3s_ease-out_0.1s_both]">
              <h1 
                className="text-white text-6xl font-black tracking-wider"
                style={{ textShadow: '0 0 30px rgba(163,255,18,0.3)' }}
              >
                CASUAL
              </h1>
            </div>
          )}
          {viewMode === 'launchpad' && (
            <div className="animate-[slideInLeft_0.3s_ease-out_0.1s_both]">
              <h1 
                className="text-white text-6xl font-black tracking-wider"
                style={{ textShadow: '0 0 30px rgba(163,255,18,0.3)' }}
              >
                LAUNCHPAD
              </h1>
            </div>
          )}
          {viewMode === 'museum' && (
            <div className="animate-[slideInLeft_0.3s_ease-out_0.1s_both]">
              <h1 
                className="text-white text-6xl font-black tracking-wider"
                style={{ textShadow: '0 0 30px rgba(163,255,18,0.3)' }}
              >
                LEGENDS HALL
              </h1>
            </div>
          )}
          {viewMode === 'studio' && (
            <div className="animate-[slideInLeft_0.3s_ease-out_0.1s_both]">
              <h1 
                className="text-white text-6xl font-black tracking-wider"
                style={{ textShadow: '0 0 30px rgba(163,255,18,0.3)' }}
              >
                NFT STUDIO
              </h1>
            </div>
          )}
          {(viewMode === 'trade' || viewMode === 'play') && <div />}
          
          {/* Right section - Player Terminal (always visible) */}
          <div className="relative animate-[slideInRight_0.3s_ease-out_0.15s_both] flex items-center gap-1">
            {/* Profile Section - PFP + Banner */}
            <div 
              className="flex items-stretch bg-black/40 backdrop-blur-xl rounded-l-2xl border border-white/10 overflow-hidden cursor-pointer transition-all duration-300 hover:bg-black/60"
              onClick={handleWalletConnect}
            >
              {/* Profile Picture - Full Height, No Padding */}
              <div className="w-20 h-20 relative flex-shrink-0">
                <MediaRenderer
                  src={user?.profilePicture || mockUserData.profilePicture}
                  alt="Profile Picture"
                  className="h-full w-full object-cover"
                  aspectRatio="square"
                  fallback={
                    <div className="h-full w-full bg-gradient-to-br from-[rgb(163,255,18)] to-green-400 flex items-center justify-center text-black font-black text-xl">
                      {(user?.username || mockUserData.username)[0]}
                    </div>
                  }
                />
                <div className="absolute top-1 right-1 w-3 h-3 bg-[rgb(163,255,18)] rounded-full border border-black animate-pulse shadow-sm shadow-[rgb(163,255,18)]/50" />
              </div>

              {/* Username Banner */}
              <div className="w-72 h-20 relative flex-shrink-0">
                <MediaRenderer
                  src={user?.profilePicture || mockUserData.profilePicture}
                  alt="User Banner"
                  className="h-full w-full object-cover"
                  aspectRatio="auto"
                />
                {/* Dark to transparent fade overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent"></div>
                {/* Username */}
                <div className="absolute inset-0 flex items-center justify-between pr-4 pl-8">
                  <span className="text-white text-lg font-bold tracking-wide drop-shadow-lg">
                    {user?.username || mockUserData.username}
                  </span>
                  <Wallet className="w-5 h-5 text-white/80 drop-shadow-lg" />
                </div>
              </div>
            </div>
            {/* Level Section */}
            <div className="flex items-center bg-black border-t border-b border-white/10 px-6 py-4 h-20">
              <div className="text-white text-sm font-bold">
                {(mockUserData.hyperTokens / 1000).toFixed(1)}K
              </div>
            </div>

            {/* Assets Section */}
            <div className="relative flex items-center justify-center rounded-r-2xl border border-white/10 h-20 w-20 cursor-pointer transition-all duration-300 hover:brightness-110 overflow-hidden">
              <div 
                className="absolute inset-0 bg-cover bg-center" 
                style={{ backgroundImage: 'url(/assets/img/hyper-logo.jpg)' }}
              />
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <div className={`relative z-10 flex-1 overflow-hidden ${className}`}>
        <div className={viewMode === 'marketplace' || viewMode === 'casual' || viewMode === 'launchpad' || viewMode === 'trade' || viewMode === 'museum' ? 'h-full relative' : 'h-full px-16 py-4'}>
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