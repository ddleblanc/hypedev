"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface StudioData {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  projects: any[];
  collections: any[];
  nfts: any[];
}

interface StudioContextType {
  studioData: StudioData | null;
  setStudioData: (data: StudioData | null) => void;
}

const StudioContext = createContext<StudioContextType | undefined>(undefined);

export function StudioProvider({ children }: { children: ReactNode }) {
  const [studioData, setStudioData] = useState<StudioData | null>(null);

  return (
    <StudioContext.Provider value={{ studioData, setStudioData }}>
      {children}
    </StudioContext.Provider>
  );
}

export function useStudio() {
  const context = useContext(StudioContext);
  if (context === undefined) {
    throw new Error('useStudio must be used within a StudioProvider');
  }
  return context;
}