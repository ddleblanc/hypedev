"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export interface BulkSelectionNFT {
  id: string;
  name: string;
  image: string;
  price?: number;
  rarity: string;
  collection: string;
}

interface BulkSelectionContextType {
  selectedNFTs: BulkSelectionNFT[];
  isSelectionMode: boolean;
  toggleSelectionMode: () => void;
  toggleNFT: (nft: BulkSelectionNFT) => void;
  clearSelection: () => void;
  getTotalPrice: () => number;
  getSelectedCount: () => number;
  isNFTSelected: (id: string) => boolean;
}

const BulkSelectionContext = createContext<BulkSelectionContextType | undefined>(undefined);

export function BulkSelectionProvider({ children }: { children: React.ReactNode }) {
  const [selectedNFTs, setSelectedNFTs] = useState<BulkSelectionNFT[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode(prev => {
      if (prev) {
        // Clear selection when exiting selection mode
        setSelectedNFTs([]);
      }
      return !prev;
    });
  }, []);

  const toggleNFT = useCallback((nft: BulkSelectionNFT) => {
    setSelectedNFTs(prev => {
      const isSelected = prev.some(item => item.id === nft.id);
      if (isSelected) {
        return prev.filter(item => item.id !== nft.id);
      } else {
        return [...prev, nft];
      }
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedNFTs([]);
  }, []);

  const getTotalPrice = useCallback(() => {
    return selectedNFTs.reduce((total, nft) => {
      return total + (nft.price || 0);
    }, 0);
  }, [selectedNFTs]);

  const getSelectedCount = useCallback(() => {
    return selectedNFTs.length;
  }, [selectedNFTs]);

  const isNFTSelected = useCallback((id: string) => {
    return selectedNFTs.some(nft => nft.id === id);
  }, [selectedNFTs]);

  const value = {
    selectedNFTs,
    isSelectionMode,
    toggleSelectionMode,
    toggleNFT,
    clearSelection,
    getTotalPrice,
    getSelectedCount,
    isNFTSelected,
  };

  return (
    <BulkSelectionContext.Provider value={value}>
      {children}
    </BulkSelectionContext.Provider>
  );
}

export function useBulkSelection() {
  const context = useContext(BulkSelectionContext);
  if (context === undefined) {
    throw new Error("useBulkSelection must be used within a BulkSelectionProvider");
  }
  return context;
}