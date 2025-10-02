"use client";

import React, { createContext, useContext, useReducer, useCallback } from 'react';

export type TransactionStep = "details" | "checkout" | "approve" | "confirm" | "pending" | "success" | "error";

export interface TransactionNFT {
  id: string;
  name: string;
  image: string;
  price?: number;
  collection: string;
  contractAddress?: string;
  tokenId?: string;
}

export interface TransactionState {
  id: string | null;
  nft: TransactionNFT | null;
  mode: "buy" | "offer" | "deploy" | "mint" | null;
  step: TransactionStep;
  amount: number;
  isActive: boolean;
  isMinimized: boolean;
  startTime: number | null;
  estimatedTime: number | null;
  txHash: string | null;
  error: string | null;
  progress: number;
}

type TransactionAction =
  | { type: 'START_TRANSACTION'; payload: { nft: TransactionNFT; mode: "buy" | "offer" | "deploy" | "mint"; amount: number } }
  | { type: 'UPDATE_STEP'; payload: { step: TransactionStep; progress?: number; estimatedTime?: number } }
  | { type: 'MINIMIZE_TRANSACTION' }
  | { type: 'EXPAND_TRANSACTION' }
  | { type: 'SET_TX_HASH'; payload: string }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'COMPLETE_TRANSACTION' }
  | { type: 'CANCEL_TRANSACTION' }
  | { type: 'RESET_TRANSACTION' };

const initialState: TransactionState = {
  id: null,
  nft: null,
  mode: null,
  step: "details",
  amount: 0,
  isActive: false,
  isMinimized: false,
  startTime: null,
  estimatedTime: null,
  txHash: null,
  error: null,
  progress: 0,
};

function transactionReducer(state: TransactionState, action: TransactionAction): TransactionState {
  switch (action.type) {
    case 'START_TRANSACTION':
      return {
        ...state,
        id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        nft: action.payload.nft,
        mode: action.payload.mode,
        amount: action.payload.amount,
        isActive: true,
        isMinimized: false,
        startTime: Date.now(),
        step: "checkout",
        progress: 20,
        estimatedTime: 45000, // 45 seconds
        txHash: null,
        error: null,
      };

    case 'UPDATE_STEP':
      const stepProgressMap: Record<TransactionStep, number> = {
        details: 0,
        checkout: 20,
        approve: 40,
        confirm: 60,
        pending: 80,
        success: 100,
        error: 0,
      };
      
      return {
        ...state,
        step: action.payload.step,
        progress: action.payload.progress ?? stepProgressMap[action.payload.step],
        estimatedTime: action.payload.estimatedTime ?? state.estimatedTime,
      };

    case 'MINIMIZE_TRANSACTION':
      return {
        ...state,
        isMinimized: true,
      };

    case 'EXPAND_TRANSACTION':
      return {
        ...state,
        isMinimized: false,
      };

    case 'SET_TX_HASH':
      return {
        ...state,
        txHash: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        step: "error",
        progress: 0,
      };

    case 'COMPLETE_TRANSACTION':
      return {
        ...state,
        step: "success",
        progress: 100,
        estimatedTime: null,
      };

    case 'CANCEL_TRANSACTION':
    case 'RESET_TRANSACTION':
      return initialState;

    default:
      return state;
  }
}

interface TransactionContextType {
  state: TransactionState;
  startTransaction: (nft: TransactionNFT, mode: "buy" | "offer" | "deploy" | "mint", amount: number) => void;
  updateStep: (step: TransactionStep, progress?: number, estimatedTime?: number) => void;
  minimizeTransaction: () => void;
  expandTransaction: () => void;
  setTxHash: (hash: string) => void;
  setError: (error: string) => void;
  completeTransaction: () => void;
  cancelTransaction: () => void;
  resetTransaction: () => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(transactionReducer, initialState);

  const startTransaction = useCallback((nft: TransactionNFT, mode: "buy" | "offer" | "deploy" | "mint", amount: number) => {
    dispatch({ type: 'START_TRANSACTION', payload: { nft, mode, amount } });
  }, []);

  const updateStep = useCallback((step: TransactionStep, progress?: number, estimatedTime?: number) => {
    dispatch({ type: 'UPDATE_STEP', payload: { step, progress, estimatedTime } });
  }, []);

  const minimizeTransaction = useCallback(() => {
    dispatch({ type: 'MINIMIZE_TRANSACTION' });
  }, []);

  const expandTransaction = useCallback(() => {
    dispatch({ type: 'EXPAND_TRANSACTION' });
  }, []);

  const setTxHash = useCallback((hash: string) => {
    dispatch({ type: 'SET_TX_HASH', payload: hash });
  }, []);

  const setError = useCallback((error: string) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const completeTransaction = useCallback(() => {
    dispatch({ type: 'COMPLETE_TRANSACTION' });
  }, []);

  const cancelTransaction = useCallback(() => {
    dispatch({ type: 'CANCEL_TRANSACTION' });
  }, []);

  const resetTransaction = useCallback(() => {
    dispatch({ type: 'RESET_TRANSACTION' });
  }, []);

  const value = {
    state,
    startTransaction,
    updateStep,
    minimizeTransaction,
    expandTransaction,
    setTxHash,
    setError,
    completeTransaction,
    cancelTransaction,
    resetTransaction,
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransaction() {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransaction must be used within a TransactionProvider');
  }
  return context;
}