"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useActiveAccount } from 'thirdweb/react';
import { useAuth } from '@/contexts/auth-context';
import { useStudio } from '@/contexts/studio-context';
import { useStudioHeader } from '@/components/conditional-layout';
import Lottie from 'lottie-react';
import { StudioMainContent } from "@/components/studio/studio-main-content";
import { StudioDashboard, StudioProjects, StudioCollections, StudioNFTs, StudioActivity } from "@/components/studio/views";
import loadingAnimation from '/public/assets/anim/loading.json';

interface StudioViewProps {
  setViewMode?: (mode: 'home' | 'trade' | 'p2p' | 'marketplace' | 'play' | 'casual' | 'launchpad' | 'museum' | 'studio') => void;
}

// Types from the old studio
interface Project {
  id: string;
  name: string;
  description: string;
  genre?: string;
  concept?: string;
  banner?: string;
  collections: number;
  totalNFTs: number;
  status: 'active' | 'draft';
  createdAt: string;
}

interface Collection {
  id: string;
  name: string;
  symbol: string;
  description?: string;
  image?: string;
  bannerImage?: string;
  projectId: string;
  project?: {
    id: string;
    name: string;
  };
  address?: string;
  chainId: number;
  contractType?: string;
  maxSupply?: number;
  mintedSupply: number;
  royaltyPercentage: number;
  isDeployed: boolean;
  volume: number;
  holders: number;
  floorPrice: number;
  createdAt: string;
  deployedAt?: string;
}

interface NFT {
  id: string;
  tokenId: string;
  name: string;
  description?: string;
  image?: string;
  metadataUri: string;
  collectionId: string;
  collection: { 
    name: string; 
    symbol: string; 
    address?: string; 
  };
  attributes: any;
  ownerAddress: string;
  isMinted: boolean;
  mintedAt?: string;
  traitCount: number;
  rarityScore?: number;
  rarityRank?: number;
  rarityTier?: string;
  createdAt: string;
  traits?: Array<{
    traitType: string;
    value: string;
    displayType?: string;
  }>;
}

export function StudioView({ setViewMode }: StudioViewProps = {}) {
  const searchParams = useSearchParams();
  const account = useActiveAccount();
  const { user, isConnected } = useAuth();
  const { setStudioData } = useStudio();
  const studioHeaderContext = useStudioHeader();
  
  // Core state
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [gridViewMode, setGridViewMode] = useState<'grid' | 'list'>('grid');
  
  // Data state
  const [projects, setProjects] = useState<Project[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [nfts, setNFTs] = useState<NFT[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data fetching functions
  const fetchProjects = useCallback(async () => {
    if (!account?.address) return;
    
    try {
      setIsLoadingData(true);
      setError(null);
      const response = await fetch(`/api/studio/projects?address=${account.address}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProjects(data.projects || []);
        } else {
          setError(data.error || 'Failed to fetch projects');
        }
      } else {
        setError('Failed to fetch projects');
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Network error while fetching projects');
    } finally {
      setIsLoadingData(false);
    }
  }, [account?.address]);

  const fetchCollections = useCallback(async (projectId?: string) => {
    if (!account?.address) return;
    
    try {
      setError(null);
      const url = projectId 
        ? `/api/studio/collections?projectId=${projectId}&address=${account.address}`
        : `/api/studio/collections?address=${account.address}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCollections(data.collections || []);
        } else {
          setError(data.error || 'Failed to fetch collections');
        }
      } else {
        setError('Failed to fetch collections');
      }
    } catch (err) {
      console.error('Error fetching collections:', err);
      setError('Network error while fetching collections');
    }
  }, [account?.address]);

  const fetchNFTs = useCallback(async (collectionId?: string) => {
    if (!account?.address) return;
    
    try {
      setError(null);
      const url = collectionId 
        ? `/api/studio/nfts?address=${account.address}&collectionId=${collectionId}`
        : `/api/studio/nfts?address=${account.address}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNFTs(data.nfts || []);
        } else {
          setError(data.error || 'Failed to fetch NFTs');
        }
      } else {
        setError('Failed to fetch NFTs');
      }
    } catch (err) {
      console.error('Error fetching NFTs:', err);
      setError('Network error while fetching NFTs');
    }
  }, [account?.address]);

  // Initialize data when authenticated
  useEffect(() => {
    if (account?.address) {
      fetchProjects();
      fetchCollections();
      fetchNFTs();
    }
  }, [account?.address, fetchProjects, fetchCollections, fetchNFTs]);

  // Update studio data for the sidebar
  useEffect(() => {
    setStudioData({
      searchQuery,
      onSearchChange: setSearchQuery,
      viewMode: gridViewMode,
      onViewModeChange: setGridViewMode,
      projects,
      collections,
      nfts
    });

    // Cleanup when component unmounts
    return () => {
      setStudioData(null);
    };
  }, [searchQuery, gridViewMode, projects, collections, nfts, setStudioData]);

  // Initialize section from URL params on mount
  useEffect(() => {
    const section = searchParams.get('section');
    if (section && ['dashboard', 'projects', 'collections', 'nfts', 'activity', 'create', 'analytics', 'settings'].includes(section)) {
      setCurrentView(section);
    }
  }, [searchParams]);

  // Update URL when section changes
  const handleViewChange = useCallback((section: string) => {
    setCurrentView(section);
    const url = new URL(window.location.href);
    url.searchParams.set('view', 'studio');
    url.searchParams.set('section', section);
    window.history.pushState({}, '', url.toString());
    
    // Update the header context
    if (studioHeaderContext) {
      studioHeaderContext.updateCurrentStudioView(section);
    }
  }, [studioHeaderContext]);

  // Register this component's view change handler with the header
  useEffect(() => {
    if (studioHeaderContext) {
      studioHeaderContext.registerStudioViewHandler(handleViewChange);
      // Also update current view immediately
      studioHeaderContext.updateCurrentStudioView(currentView);
    }
  }, [studioHeaderContext, handleViewChange, currentView]);

  // Refresh data functions
  const refreshData = useCallback(() => {
    if (account?.address) {
      fetchProjects();
      fetchCollections();
      fetchNFTs();
    }
  }, [account?.address, fetchProjects, fetchCollections, fetchNFTs]);

  // Handle auth state
  if (!isConnected || !account?.address) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4 mx-auto">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Connect Wallet Required</h3>
          <p className="text-sm text-muted-foreground">
            Please connect your wallet to access the studio
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4 mx-auto">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Error Loading Studio</h3>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              fetchProjects();
              fetchCollections();
              fetchNFTs();
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show loading state if data is loading and we don't have any data yet
  if (isLoadingData && projects.length === 0 && currentView === 'dashboard') {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Lottie 
            animationData={loadingAnimation} 
            className="w-24 h-24 mx-auto mb-4"
            loop={true}
            autoplay={true}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Studio Navigation is now handled by AnimatedHeader */}
      {/* StudioNavbar commented out as navigation is now handled by AnimatedHeader
          <StudioNavbar 
        currentView={currentView} 
        onViewChange={handleViewChange} 
      />
      */}

      {/* Main Content Area - Properly spaced to match header spacing and allow scrolling */}
      <div className="flex-1 overflow-hidden pt-16">
        <StudioMainContent currentView={currentView}>
          {currentView === 'dashboard' && (
            <StudioDashboard 
              mockProjects={projects.length > 0 ? projects : []}
              mockCollections={collections.length > 0 ? collections : []}
              mockNFTs={nfts.length > 0 ? nfts : []}
            />
          )}
          {currentView === 'projects' && (
            <StudioProjects 
              mockProjects={projects.length > 0 ? projects : []}
              viewMode={gridViewMode}
            />
          )}
          {currentView === 'collections' && (
            <StudioCollections 
              collections={collections.length > 0 ? collections : []}
              viewMode={gridViewMode}
            />
          )}
          {currentView === 'nfts' && (
            <StudioNFTs 
              nfts={nfts.length > 0 ? nfts : []}
              viewMode={gridViewMode}
            />
          )}
          {currentView === 'activity' && (
            <StudioActivity 
              viewMode={gridViewMode}
            />
          )}
          {/* Add other views here */}
        </StudioMainContent>
      </div>
    </div>
  );
}