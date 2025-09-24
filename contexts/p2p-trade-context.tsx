"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface NFT {
  id: string;
  name: string;
  image: string;
  collection: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  value: number;
}

interface User {
  id: string;
  username: string;
  avatar?: string;
  verified: boolean;
}

interface TradeState {
  // User's offer
  selectedNFTs: NFT[];
  tokenAmount: number;
  
  // Opponent data
  targetUser: User | null;
  targetNFTs: NFT[];
  targetTokens: number;
  
  // Trade status
  status: 'draft' | 'pending' | 'accepted' | 'rejected' | 'completed';
  fairnessScore: number;
}

interface TradeActions {
  // NFT Selection
  addNFT: (nft: NFT) => void;
  removeNFT: (nftId: string) => void;
  clearNFTs: () => void;
  
  // Token management
  setTokenAmount: (amount: number) => void;
  adjustTokens: (delta: number) => void;
  
  // Target user/items
  setTargetUser: (user: User) => void;
  setTargetNFTs: (nfts: NFT[]) => void;
  setTargetTokens: (amount: number) => void;
  
  // Trade actions
  calculateFairness: () => number;
  submitOffer: () => void;
  acceptOffer: () => void;
  rejectOffer: () => void;
  resetTrade: () => void;
}

interface P2PTradeContextType extends TradeState, TradeActions {}

const P2PTradeContext = createContext<P2PTradeContextType | undefined>(undefined);

export function useP2PTrade() {
  const context = useContext(P2PTradeContext);
  if (context === undefined) {
    throw new Error('useP2PTrade must be used within a P2PTradeProvider');
  }
  return context;
}

interface P2PTradeProviderProps {
  children: ReactNode;
}

export function P2PTradeProvider({ children }: P2PTradeProviderProps) {
  const [tradeState, setTradeState] = useState<TradeState>({
    selectedNFTs: [],
    tokenAmount: 0,
    targetUser: null,
    targetNFTs: [],
    targetTokens: 0,
    status: 'draft',
    fairnessScore: 0
  });

  const addNFT = useCallback((nft: NFT) => {
    setTradeState(prev => {
      if (prev.selectedNFTs.find(n => n.id === nft.id)) {
        return prev; // NFT already selected
      }
      const newSelectedNFTs = [...prev.selectedNFTs, nft];
      const newFairnessScore = calculateFairnessScore(
        newSelectedNFTs, 
        prev.tokenAmount, 
        prev.targetNFTs, 
        prev.targetTokens
      );
      return {
        ...prev,
        selectedNFTs: newSelectedNFTs,
        fairnessScore: newFairnessScore
      };
    });
  }, []);

  const removeNFT = useCallback((nftId: string) => {
    setTradeState(prev => {
      const newSelectedNFTs = prev.selectedNFTs.filter(nft => nft.id !== nftId);
      const newFairnessScore = calculateFairnessScore(
        newSelectedNFTs, 
        prev.tokenAmount, 
        prev.targetNFTs, 
        prev.targetTokens
      );
      return {
        ...prev,
        selectedNFTs: newSelectedNFTs,
        fairnessScore: newFairnessScore
      };
    });
  }, []);

  const clearNFTs = useCallback(() => {
    setTradeState(prev => ({
      ...prev,
      selectedNFTs: [],
      fairnessScore: calculateFairnessScore([], prev.tokenAmount, prev.targetNFTs, prev.targetTokens)
    }));
  }, []);

  const setTokenAmount = useCallback((amount: number) => {
    setTradeState(prev => {
      const newFairnessScore = calculateFairnessScore(
        prev.selectedNFTs, 
        amount, 
        prev.targetNFTs, 
        prev.targetTokens
      );
      return {
        ...prev,
        tokenAmount: Math.max(0, amount),
        fairnessScore: newFairnessScore
      };
    });
  }, []);

  const adjustTokens = useCallback((delta: number) => {
    setTradeState(prev => {
      const newAmount = Math.max(0, prev.tokenAmount + delta);
      const newFairnessScore = calculateFairnessScore(
        prev.selectedNFTs, 
        newAmount, 
        prev.targetNFTs, 
        prev.targetTokens
      );
      return {
        ...prev,
        tokenAmount: newAmount,
        fairnessScore: newFairnessScore
      };
    });
  }, []);

  const setTargetUser = useCallback((user: User) => {
    setTradeState(prev => ({
      ...prev,
      targetUser: user,
      targetNFTs: [], // Reset target NFTs when changing user
      targetTokens: 0
    }));
  }, []);

  const setTargetNFTs = useCallback((nfts: NFT[]) => {
    setTradeState(prev => {
      const newFairnessScore = calculateFairnessScore(
        prev.selectedNFTs, 
        prev.tokenAmount, 
        nfts, 
        prev.targetTokens
      );
      return {
        ...prev,
        targetNFTs: nfts,
        fairnessScore: newFairnessScore
      };
    });
  }, []);

  const setTargetTokens = useCallback((amount: number) => {
    setTradeState(prev => {
      const newFairnessScore = calculateFairnessScore(
        prev.selectedNFTs, 
        prev.tokenAmount, 
        prev.targetNFTs, 
        amount
      );
      return {
        ...prev,
        targetTokens: Math.max(0, amount),
        fairnessScore: newFairnessScore
      };
    });
  }, []);

  const calculateFairness = useCallback(() => {
    return calculateFairnessScore(
      tradeState.selectedNFTs,
      tradeState.tokenAmount,
      tradeState.targetNFTs,
      tradeState.targetTokens
    );
  }, [tradeState]);

  const submitOffer = useCallback(() => {
    setTradeState(prev => ({
      ...prev,
      status: 'pending'
    }));
    // Here you would integrate with your backend API
    console.log('Trade offer submitted:', tradeState);
  }, [tradeState]);

  const acceptOffer = useCallback(() => {
    setTradeState(prev => ({
      ...prev,
      status: 'accepted'
    }));
    // Here you would integrate with your backend API
  }, []);

  const rejectOffer = useCallback(() => {
    setTradeState(prev => ({
      ...prev,
      status: 'rejected'
    }));
    // Here you would integrate with your backend API
  }, []);

  const resetTrade = useCallback(() => {
    setTradeState({
      selectedNFTs: [],
      tokenAmount: 0,
      targetUser: null,
      targetNFTs: [],
      targetTokens: 0,
      status: 'draft',
      fairnessScore: 0
    });
  }, []);

  const contextValue: P2PTradeContextType = {
    ...tradeState,
    addNFT,
    removeNFT,
    clearNFTs,
    setTokenAmount,
    adjustTokens,
    setTargetUser,
    setTargetNFTs,
    setTargetTokens,
    calculateFairness,
    submitOffer,
    acceptOffer,
    rejectOffer,
    resetTrade
  };

  return (
    <P2PTradeContext.Provider value={contextValue}>
      {children}
    </P2PTradeContext.Provider>
  );
}

// Utility function to calculate fairness score
function calculateFairnessScore(
  userNFTs: NFT[], 
  userTokens: number, 
  targetNFTs: NFT[], 
  targetTokens: number
): number {
  const userValue = userNFTs.reduce((sum, nft) => sum + nft.value, 0) + userTokens;
  const targetValue = targetNFTs.reduce((sum, nft) => sum + nft.value, 0) + targetTokens;
  
  if (userValue === 0 && targetValue === 0) {
    return 1; // Perfect fairness when both sides are empty
  }
  
  if (userValue === 0 || targetValue === 0) {
    return 0; // Completely unfair if one side has nothing
  }
  
  const minValue = Math.min(userValue, targetValue);
  const maxValue = Math.max(userValue, targetValue);
  
  // Calculate fairness as a ratio, with diminishing returns for extreme differences
  const fairnessRatio = minValue / maxValue;
  
  // Apply a curve to make the scoring more nuanced
  // Values closer to 1.0 (perfect fairness) get higher scores
  return Math.pow(fairnessRatio, 0.7);
}