'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface NFT {
  id: string;
  tokenId: string;
  name: string;
  image: string;
  collection?: {
    name: string;
    symbol: string;
  };
}

interface P2PSelectionFlowContextType {
  // Step 1: Trader NFTs
  selectedTraderNFTs: NFT[];
  traderAddress: string | null;
  initialNFT: NFT | null;

  // Step 2: User NFTs
  selectedUserNFTs: NFT[];

  // Flow control
  currentStep: 'trader-selection' | 'user-selection' | 'board';

  // Actions
  setTraderAddress: (address: string) => void;
  setInitialNFT: (nft: NFT | null) => void;
  toggleTraderNFT: (nft: NFT) => void;
  toggleUserNFT: (nft: NFT) => void;
  clearTraderSelection: () => void;
  clearUserSelection: () => void;
  setCurrentStep: (step: 'trader-selection' | 'user-selection' | 'board') => void;
  resetFlow: () => void;

  // State queries
  getTraderSelectionCount: () => number;
  getUserSelectionCount: () => number;
  isTraderNFTSelected: (id: string) => boolean;
  isUserNFTSelected: (id: string) => boolean;
}

const P2PSelectionFlowContext = createContext<P2PSelectionFlowContextType | undefined>(undefined);

export function P2PSelectionFlowProvider({ children }: { children: ReactNode }) {
  const [selectedTraderNFTs, setSelectedTraderNFTs] = useState<NFT[]>([]);
  const [selectedUserNFTs, setSelectedUserNFTs] = useState<NFT[]>([]);
  const [traderAddress, setTraderAddress] = useState<string | null>(null);
  const [initialNFT, setInitialNFT] = useState<NFT | null>(null);
  const [currentStep, setCurrentStep] = useState<'trader-selection' | 'user-selection' | 'board'>('trader-selection');

  const toggleTraderNFT = useCallback((nft: NFT) => {
    setSelectedTraderNFTs((prev) => {
      const exists = prev.find((n) => n.id === nft.id);
      if (exists) {
        return prev.filter((n) => n.id !== nft.id);
      } else {
        return [...prev, nft];
      }
    });
  }, []);

  const toggleUserNFT = useCallback((nft: NFT) => {
    setSelectedUserNFTs((prev) => {
      const exists = prev.find((n) => n.id === nft.id);
      if (exists) {
        return prev.filter((n) => n.id !== nft.id);
      } else {
        return [...prev, nft];
      }
    });
  }, []);

  const clearTraderSelection = useCallback(() => {
    setSelectedTraderNFTs([]);
  }, []);

  const clearUserSelection = useCallback(() => {
    setSelectedUserNFTs([]);
  }, []);

  const resetFlow = useCallback(() => {
    setSelectedTraderNFTs([]);
    setSelectedUserNFTs([]);
    setTraderAddress(null);
    setInitialNFT(null);
    setCurrentStep('trader-selection');
  }, []);

  const getTraderSelectionCount = useCallback(() => {
    return selectedTraderNFTs.length;
  }, [selectedTraderNFTs]);

  const getUserSelectionCount = useCallback(() => {
    return selectedUserNFTs.length;
  }, [selectedUserNFTs]);

  const isTraderNFTSelected = useCallback((id: string) => {
    return selectedTraderNFTs.some((nft) => nft.id === id);
  }, [selectedTraderNFTs]);

  const isUserNFTSelected = useCallback((id: string) => {
    return selectedUserNFTs.some((nft) => nft.id === id);
  }, [selectedUserNFTs]);

  return (
    <P2PSelectionFlowContext.Provider
      value={{
        selectedTraderNFTs,
        selectedUserNFTs,
        traderAddress,
        initialNFT,
        currentStep,
        setTraderAddress,
        setInitialNFT,
        toggleTraderNFT,
        toggleUserNFT,
        clearTraderSelection,
        clearUserSelection,
        setCurrentStep,
        resetFlow,
        getTraderSelectionCount,
        getUserSelectionCount,
        isTraderNFTSelected,
        isUserNFTSelected,
      }}
    >
      {children}
    </P2PSelectionFlowContext.Provider>
  );
}

export function useP2PSelectionFlow() {
  const context = useContext(P2PSelectionFlowContext);
  if (context === undefined) {
    throw new Error('useP2PSelectionFlow must be used within a P2PSelectionFlowProvider');
  }
  return context;
}
