"use client";

import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';

export interface CartItem {
  id: string;
  listingId: string;
  tokenId: string;
  name: string;
  image: string;
  price: number;
  priceWei: string;
  collection: {
    id: string;
    name: string;
    contractAddress: string;
  };
  rarity?: string;
  rank?: number;
  sellerAddress: string;
}

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
  isProcessing: boolean;
  currentPurchaseIndex: number | null;
  purchaseStatus: 'idle' | 'processing' | 'success' | 'partial' | 'error';
  purchaseResults: Array<{
    itemId: string;
    success: boolean;
    txHash?: string;
    error?: string;
  }>;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'CLEAR_CART' }
  | { type: 'OPEN_CART' }
  | { type: 'CLOSE_CART' }
  | { type: 'TOGGLE_CART' }
  | { type: 'START_PURCHASE' }
  | { type: 'SET_CURRENT_PURCHASE_INDEX'; payload: number }
  | { type: 'ADD_PURCHASE_RESULT'; payload: { itemId: string; success: boolean; txHash?: string; error?: string } }
  | { type: 'COMPLETE_PURCHASE'; payload: 'success' | 'partial' | 'error' }
  | { type: 'RESET_PURCHASE_STATE' };

const initialState: CartState = {
  items: [],
  isOpen: false,
  isProcessing: false,
  currentPurchaseIndex: null,
  purchaseStatus: 'idle',
  purchaseResults: [],
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM':
      // Check if item already exists
      if (state.items.some(item => item.id === action.payload.id)) {
        return state;
      }
      return {
        ...state,
        items: [...state.items, action.payload],
        isOpen: true, // Auto-open cart when adding
      };

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload),
      };

    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
      };

    case 'OPEN_CART':
      return {
        ...state,
        isOpen: true,
      };

    case 'CLOSE_CART':
      return {
        ...state,
        isOpen: false,
      };

    case 'TOGGLE_CART':
      return {
        ...state,
        isOpen: !state.isOpen,
      };

    case 'START_PURCHASE':
      return {
        ...state,
        isProcessing: true,
        currentPurchaseIndex: 0,
        purchaseStatus: 'processing',
        purchaseResults: [],
      };

    case 'SET_CURRENT_PURCHASE_INDEX':
      return {
        ...state,
        currentPurchaseIndex: action.payload,
      };

    case 'ADD_PURCHASE_RESULT':
      return {
        ...state,
        purchaseResults: [...state.purchaseResults, action.payload],
      };

    case 'COMPLETE_PURCHASE':
      // Remove successfully purchased items from cart
      const successfulIds = state.purchaseResults
        .filter(r => r.success)
        .map(r => r.itemId);

      return {
        ...state,
        isProcessing: false,
        currentPurchaseIndex: null,
        purchaseStatus: action.payload,
        items: state.items.filter(item => !successfulIds.includes(item.id)),
      };

    case 'RESET_PURCHASE_STATE':
      return {
        ...state,
        isProcessing: false,
        currentPurchaseIndex: null,
        purchaseStatus: 'idle',
        purchaseResults: [],
      };

    default:
      return state;
  }
}

interface CartContextType {
  state: CartState;
  addItem: (item: CartItem) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  isInCart: (itemId: string) => boolean;
  totalItems: number;
  totalPrice: number;
  startPurchase: () => void;
  setCurrentPurchaseIndex: (index: number) => void;
  addPurchaseResult: (result: { itemId: string; success: boolean; txHash?: string; error?: string }) => void;
  completePurchase: (status: 'success' | 'partial' | 'error') => void;
  resetPurchaseState: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function ShoppingCartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const addItem = useCallback((item: CartItem) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: itemId });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, []);

  const openCart = useCallback(() => {
    dispatch({ type: 'OPEN_CART' });
  }, []);

  const closeCart = useCallback(() => {
    dispatch({ type: 'CLOSE_CART' });
  }, []);

  const toggleCart = useCallback(() => {
    dispatch({ type: 'TOGGLE_CART' });
  }, []);

  const isInCart = useCallback((itemId: string) => {
    return state.items.some(item => item.id === itemId);
  }, [state.items]);

  const totalItems = useMemo(() => state.items.length, [state.items]);

  const totalPrice = useMemo(() => {
    return state.items.reduce((sum, item) => sum + item.price, 0);
  }, [state.items]);

  const startPurchase = useCallback(() => {
    dispatch({ type: 'START_PURCHASE' });
  }, []);

  const setCurrentPurchaseIndex = useCallback((index: number) => {
    dispatch({ type: 'SET_CURRENT_PURCHASE_INDEX', payload: index });
  }, []);

  const addPurchaseResult = useCallback((result: { itemId: string; success: boolean; txHash?: string; error?: string }) => {
    dispatch({ type: 'ADD_PURCHASE_RESULT', payload: result });
  }, []);

  const completePurchase = useCallback((status: 'success' | 'partial' | 'error') => {
    dispatch({ type: 'COMPLETE_PURCHASE', payload: status });
  }, []);

  const resetPurchaseState = useCallback(() => {
    dispatch({ type: 'RESET_PURCHASE_STATE' });
  }, []);

  const value = {
    state,
    addItem,
    removeItem,
    clearCart,
    openCart,
    closeCart,
    toggleCart,
    isInCart,
    totalItems,
    totalPrice,
    startPurchase,
    setCurrentPurchaseIndex,
    addPurchaseResult,
    completePurchase,
    resetPurchaseState,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useShoppingCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useShoppingCart must be used within a ShoppingCartProvider');
  }
  return context;
}
