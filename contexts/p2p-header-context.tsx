"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SelectedTrader {
  name: string;
  avatar?: string;
  isOnline?: boolean;
  walletAddress: string;
}

interface P2PHeaderContextType {
  selectedTrader: SelectedTrader | null;
  isCreatingOffer: boolean;
  setSelectedTrader: (trader: SelectedTrader | null) => void;
  setIsCreatingOffer: (value: boolean) => void;
  onBack?: () => void;
  onCancelOffer?: () => void;
  onShowHistory?: () => void;
  setOnBack: (callback: (() => void) | undefined) => void;
  setOnCancelOffer: (callback: (() => void) | undefined) => void;
  setOnShowHistory: (callback: (() => void) | undefined) => void;
}

const P2PHeaderContext = createContext<P2PHeaderContextType | undefined>(undefined);

export function P2PHeaderProvider({ children }: { children: ReactNode }) {
  const [selectedTrader, setSelectedTrader] = useState<SelectedTrader | null>(null);
  const [isCreatingOffer, setIsCreatingOffer] = useState(false);
  const [onBack, setOnBack] = useState<(() => void) | undefined>(() => undefined);
  const [onCancelOffer, setOnCancelOffer] = useState<(() => void) | undefined>(() => undefined);
  const [onShowHistory, setOnShowHistory] = useState<(() => void) | undefined>(() => undefined);

  // Wrapper functions to properly set callback functions
  const setOnBackWrapper = (callback: (() => void) | undefined) => {
    setOnBack(() => callback);
  };

  const setOnCancelOfferWrapper = (callback: (() => void) | undefined) => {
    setOnCancelOffer(() => callback);
  };

  const setOnShowHistoryWrapper = (callback: (() => void) | undefined) => {
    setOnShowHistory(() => callback);
  };

  return (
    <P2PHeaderContext.Provider
      value={{
        selectedTrader,
        isCreatingOffer,
        setSelectedTrader,
        setIsCreatingOffer,
        onBack,
        onCancelOffer,
        onShowHistory,
        setOnBack: setOnBackWrapper,
        setOnCancelOffer: setOnCancelOfferWrapper,
        setOnShowHistory: setOnShowHistoryWrapper,
      }}
    >
      {children}
    </P2PHeaderContext.Provider>
  );
}

export function useP2PHeader() {
  const context = useContext(P2PHeaderContext);
  if (context === undefined) {
    throw new Error('useP2PHeader must be used within a P2PHeaderProvider');
  }
  return context;
}
