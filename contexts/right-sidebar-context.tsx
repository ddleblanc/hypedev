"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';

interface RightSidebarContextType {
  isRightSidebarOpen: boolean;
  openRightSidebar: () => void;
  closeRightSidebar: () => void;
  toggleRightSidebar: () => void;
}

const RightSidebarContext = createContext<RightSidebarContextType | undefined>(undefined);

export function RightSidebarProvider({ children }: { children: React.ReactNode }) {
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

  const openRightSidebar = useCallback(() => {
    setIsRightSidebarOpen(true);
  }, []);

  const closeRightSidebar = useCallback(() => {
    setIsRightSidebarOpen(false);
  }, []);

  const toggleRightSidebar = useCallback(() => {
    setIsRightSidebarOpen(prev => !prev);
  }, []);

  const value = {
    isRightSidebarOpen,
    openRightSidebar,
    closeRightSidebar,
    toggleRightSidebar
  };

  return (
    <RightSidebarContext.Provider value={value}>
      {children}
    </RightSidebarContext.Provider>
  );
}

export function useRightSidebar() {
  const context = useContext(RightSidebarContext);
  if (context === undefined) {
    throw new Error('useRightSidebar must be used within a RightSidebarProvider');
  }
  return context;
}