"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { trpc } from "@/lib/trpc/client";

export interface NFT {
  id: string;
  name: string;
  image: string;
  value: number;
  rarity: 'MYTHIC' | 'LEGENDARY' | 'EPIC' | 'RARE' | 'COMMON';
  selected?: boolean;
  collection?: {
    name: string;
    symbol: string;
    image: string;
    floorPrice?: number;
  };
  tokenId?: string;
  collectionId?: string;
  ownerAddress?: string;
}

export interface Trader {
  id: string;
  name: string;
  username?: string | null;
  walletAddress: string;
  avatar: string | null;
  rating: number;
  trades: number;
  successRate: number;
  isOnline: boolean;
  tier: 'DIAMOND' | 'GOLD' | 'SILVER' | 'BRONZE';
  nfts?: NFT[];
}

interface P2PTradingContextType {
  // User NFTs and board
  userNFTs: NFT[];
  userBoardNFTs: NFT[];
  toggleUserNFTSelection: (nftId: string) => void;
  confirmUserNFTs: () => void;
  removeUserNFTFromBoard: (nftId: string) => void;
  clearUserBoard: () => void;

  // Trader selection and NFTs
  selectedTrader: Trader | null;
  traderNFTs: NFT[];
  traderBoardNFTs: NFT[];
  selectTrader: (trader: Trader | null) => void;
  toggleTraderNFTSelection: (nftId: string) => void;
  confirmTraderNFTs: () => void;
  removeTraderNFTFromBoard: (nftId: string) => void;
  clearTraderBoard: () => void;

  // Traders list
  traders: Trader[];

  // Loading states
  isLoadingUserNFTs: boolean;
  isLoadingTraders: boolean;
  isLoadingTraderNFTs: boolean;

  // Error states
  userNFTsError: string | null;
  tradersError: string | null;
  traderNFTsError: string | null;

  // General
  clearAllSelections: () => void;
  refreshUserNFTs: () => void;
  refreshTraders: () => void;
  loadTradeIntoBoard: (trade: any) => void;
  activeTradeId: string | null;
  clearActiveTradeId: () => void;

  // Price management
  updateUserNFTPrice: (nftId: string, newPrice: number) => void;
  updateTraderNFTPrice: (nftId: string, newPrice: number) => void;

  // Board history navigation
  loadedTrade: any | null;
  boardHistoryIndex: number;
  navigateBoardHistory: (direction: 'prev' | 'next') => void;
  isViewingHistory: boolean;
}

const P2PTradingContext = createContext<P2PTradingContextType | undefined>(undefined);

// Helper function to convert API NFT to context NFT
const convertAPINFTToContextNFT = (apiNft: any): NFT => {
  // The tokenId might be a number or string, ensure it's a string
  // If tokenId is not available, use id as fallback (for consistency with collections page)
  const tokenIdValue = apiNft.tokenId !== undefined
    ? String(apiNft.tokenId)
    : String(apiNft.id);

  // Debug logging to understand what data we're receiving
  if (apiNft.tokenId === undefined) {
    console.warn('NFT has undefined tokenId, using id as fallback:', {
      id: apiNft.id,
      name: apiNft.name,
      tokenIdValue
    });
  }

  return {
    id: apiNft.id,
    name: apiNft.name,
    image: apiNft.image,
    // Use listing price if available, otherwise use collection floor price, otherwise default to 0
    value: apiNft.listingPrice || apiNft.collection?.floorPrice || 0,
    rarity: (apiNft.rarityTier || 'COMMON').toUpperCase() as any,
    selected: false,
    collection: apiNft.collection ? {
      name: apiNft.collection.name,
      symbol: apiNft.collection.symbol,
      image: apiNft.collection.image,
      floorPrice: apiNft.collection.floorPrice
    } : undefined,
    tokenId: tokenIdValue,
    collectionId: apiNft.collectionId,
    ownerAddress: apiNft.ownerAddress
  };
};

// Helper function to convert API trader to context trader
const convertAPITraderToContextTrader = (apiTrader: any): Trader => ({
  id: apiTrader.id,
  name: apiTrader.name,
  username: apiTrader.username,
  walletAddress: apiTrader.walletAddress,
  avatar: apiTrader.avatar,
  rating: apiTrader.rating,
  trades: apiTrader.trades,
  successRate: apiTrader.successRate,
  isOnline: apiTrader.isOnline,
  tier: apiTrader.tier,
  nfts: apiTrader.nfts?.map(convertAPINFTToContextNFT) || []
});

export function P2PTradingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const address = user?.walletAddress;
  const utils = trpc.useUtils();
  const pathname = usePathname();

  // Only fetch P2P data when on P2P routes
  const isP2PRoute = pathname?.startsWith('/p2p');

  // State
  const [userNFTs, setUserNFTs] = useState<NFT[]>([]);
  const [userBoardNFTs, setUserBoardNFTs] = useState<NFT[]>([]);
  const [selectedTrader, setSelectedTrader] = useState<Trader | null>(null);
  const [traderNFTs, setTraderNFTs] = useState<NFT[]>([]);
  const [traderBoardNFTs, setTraderBoardNFTs] = useState<NFT[]>([]);
  const [traders, setTraders] = useState<Trader[]>([]);
  const [activeTradeId, setActiveTradeId] = useState<string | null>(null);
  const [loadedTrade, setLoadedTrade] = useState<any | null>(null);
  const [boardHistoryIndex, setBoardHistoryIndex] = useState(-1); // -1 = current state

  // Loading states
  const [isLoadingUserNFTs, setIsLoadingUserNFTs] = useState(false);
  const [isLoadingTraders, setIsLoadingTraders] = useState(false);
  const [isLoadingTraderNFTs, setIsLoadingTraderNFTs] = useState(false);

  // Error states
  const [userNFTsError, setUserNFTsError] = useState<string | null>(null);
  const [tradersError, setTradersError] = useState<string | null>(null);
  const [traderNFTsError, setTraderNFTsError] = useState<string | null>(null);

  // API functions using tRPC
  const fetchUserNFTs = useCallback(async () => {
    if (!address) {
      console.log('No wallet address available for fetching NFTs');
      return;
    }

    console.log('Fetching NFTs for address:', address);
    setIsLoadingUserNFTs(true);
    setUserNFTsError(null);

    try {
      const data = await utils.user.nfts.list.fetch({ address, filter: 'owned' });

      if (data.success) {
        const convertedNFTs = data.nfts.map(convertAPINFTToContextNFT);
        setUserNFTs(convertedNFTs);
        console.log('Successfully loaded', convertedNFTs.length, 'NFTs');
      }
    } catch (error) {
      console.error('Error fetching user NFTs:', error);
      setUserNFTsError('Failed to fetch user NFTs');
    } finally {
      setIsLoadingUserNFTs(false);
    }
  }, [address, utils.user.nfts.list]);

  const fetchTraders = useCallback(async () => {
    console.log('Fetching traders...');
    setIsLoadingTraders(true);
    setTradersError(null);

    try {
      const data = await utils.p2p.traders.list.fetch({});

      if (data.success) {
        const convertedTraders = data.traders.map(convertAPITraderToContextTrader);
        setTraders(convertedTraders);
        console.log('Successfully loaded', convertedTraders.length, 'traders');
      }
    } catch (error) {
      console.error('Error fetching traders:', error);
      setTradersError('Failed to fetch traders');
    } finally {
      setIsLoadingTraders(false);
    }
  }, [utils.p2p.traders.list]);

  const fetchTraderNFTs = useCallback(async (traderAddress: string) => {
    setIsLoadingTraderNFTs(true);
    setTraderNFTsError(null);

    try {
      const data = await utils.user.nfts.list.fetch({ address: traderAddress, filter: 'owned' });

      if (data.success) {
        const convertedNFTs = data.nfts.map(convertAPINFTToContextNFT);
        setTraderNFTs(convertedNFTs);
      }
    } catch (error) {
      console.error('Error fetching trader NFTs:', error);
      setTraderNFTsError('Failed to fetch trader NFTs');
    } finally {
      setIsLoadingTraderNFTs(false);
    }
  }, [utils.user.nfts.list]);

  // Effects - only fetch when on P2P routes
  useEffect(() => {
    if (address && isP2PRoute) {
      fetchUserNFTs();
    }
  }, [address, isP2PRoute, fetchUserNFTs]);

  useEffect(() => {
    if (isP2PRoute) {
      fetchTraders();
    }
  }, [isP2PRoute, fetchTraders]);

  // Removed the useEffect that was causing double fetching
  // The selectTrader function already handles fetching NFTs

  // Functions
  const toggleUserNFTSelection = (nftId: string) => {
    // First check if it's on the board
    const boardNft = userBoardNFTs.find(n => n.id === nftId);
    if (boardNft) {
      // Remove from board and add back to sidebar
      setUserBoardNFTs(prev => prev.filter(n => n.id !== nftId));
      setUserNFTs(prev => [...prev, { ...boardNft, selected: false }].sort((a, b) => a.name.localeCompare(b.name)));
      return;
    }

    // Then check if it's in the sidebar
    const sidebarNft = userNFTs.find(n => n.id === nftId);
    if (!sidebarNft) return;

    // Check board limit (6 NFTs max)
    if (userBoardNFTs.length >= 6) {
      return; // Don't add if board is full
    }

    // Add to board and remove from sidebar
    setUserBoardNFTs(prev => [...prev, { ...sidebarNft, selected: true }]);
    setUserNFTs(prev => prev.filter(n => n.id !== nftId));
  };

  const confirmUserNFTs = () => {
    // Kept for backwards compatibility, but not needed anymore
    const selectedNFTs = userNFTs.filter(nft => nft.selected);
    setUserBoardNFTs(prev => [...prev, ...selectedNFTs]);
    // Remove confirmed NFTs from sidebar to enable layout animation
    setUserNFTs(prev =>
      prev.filter(nft => !nft.selected)
    );
  };

  const removeUserNFTFromBoard = (nftId: string) => {
    const removedNFT = userBoardNFTs.find(nft => nft.id === nftId);
    if (removedNFT) {
      // Add back to sidebar
      setUserNFTs(prev => [...prev, { ...removedNFT, selected: false }]);
    }
    setUserBoardNFTs(prev => prev.filter(nft => nft.id !== nftId));
  };

  const clearUserBoard = () => {
    setUserBoardNFTs([]);
  };

  const selectTrader = (trader: Trader | null) => {
    // Clear previous trader data immediately
    setTraderNFTs([]);
    setTraderBoardNFTs([]);

    setSelectedTrader(trader);
    if (trader) {
      // Use NFTs from trader object if available, otherwise fetch
      if (trader.nfts && trader.nfts.length > 0) {
        setTraderNFTs(trader.nfts);
      } else {
        // Only fetch if we don't have NFTs already
        fetchTraderNFTs(trader.walletAddress);
      }
    }
  };

  const toggleTraderNFTSelection = (nftId: string) => {
    // First check if it's on the board
    const boardNft = traderBoardNFTs.find(n => n.id === nftId);
    if (boardNft) {
      // Remove from board and add back to sidebar
      setTraderBoardNFTs(prev => prev.filter(n => n.id !== nftId));
      setTraderNFTs(prev => [...prev, { ...boardNft, selected: false }].sort((a, b) => a.name.localeCompare(b.name)));
      return;
    }

    // Then check if it's in the sidebar
    const sidebarNft = traderNFTs.find(n => n.id === nftId);
    if (!sidebarNft) return;

    // Check board limit (6 NFTs max)
    if (traderBoardNFTs.length >= 6) {
      return; // Don't add if board is full
    }

    // Add to board and remove from sidebar
    setTraderBoardNFTs(prev => [...prev, { ...sidebarNft, selected: true }]);
    setTraderNFTs(prev => prev.filter(n => n.id !== nftId));
  };

  const confirmTraderNFTs = () => {
    // Kept for backwards compatibility, but not needed anymore
    const selectedNFTs = traderNFTs.filter(nft => nft.selected);
    setTraderBoardNFTs(prev => [...prev, ...selectedNFTs]);
    // Remove confirmed NFTs from sidebar to enable layout animation
    setTraderNFTs(prev =>
      prev.filter(nft => !nft.selected)
    );
  };

  const removeTraderNFTFromBoard = (nftId: string) => {
    const removedNFT = traderBoardNFTs.find(nft => nft.id === nftId);
    if (removedNFT) {
      // Add back to sidebar
      setTraderNFTs(prev => [...prev, { ...removedNFT, selected: false }]);
    }
    setTraderBoardNFTs(prev => prev.filter(nft => nft.id !== nftId));
  };

  const clearTraderBoard = () => {
    setTraderBoardNFTs([]);
  };

  const clearAllSelections = () => {
    setUserNFTs(prev => prev.map(nft => ({ ...nft, selected: false })));
    setTraderNFTs(prev => prev.map(nft => ({ ...nft, selected: false })));
    setUserBoardNFTs([]);
    setTraderBoardNFTs([]);
    setSelectedTrader(null);
    setActiveTradeId(null);
  };

  const clearActiveTradeId = () => {
    setActiveTradeId(null);
  };

  const updateUserNFTPrice = (nftId: string, newPrice: number) => {
    setUserBoardNFTs(prev => prev.map(nft =>
      nft.id === nftId ? { ...nft, value: newPrice } : nft
    ));
  };

  const updateTraderNFTPrice = (nftId: string, newPrice: number) => {
    setTraderBoardNFTs(prev => prev.map(nft =>
      nft.id === nftId ? { ...nft, value: newPrice } : nft
    ));
  };

  const refreshUserNFTs = () => {
    fetchUserNFTs();
  };

  const refreshTraders = () => {
    fetchTraders();
  };

  const navigateBoardHistory = (direction: 'prev' | 'next') => {
    if (!loadedTrade || !loadedTrade.history || loadedTrade.history.length === 0) return;

    const maxIndex = loadedTrade.history.length - 1;
    let newIndex = boardHistoryIndex;

    if (direction === 'prev') {
      // Go backward in history (older)
      newIndex = boardHistoryIndex === -1 ? maxIndex : Math.max(0, boardHistoryIndex - 1);
    } else {
      // Go forward in history (newer)
      if (boardHistoryIndex > 0) {
        newIndex = boardHistoryIndex - 1;
      } else if (boardHistoryIndex === 0) {
        newIndex = -1; // Go to current state
      } else {
        newIndex = -1; // Already at current state
      }
    }

    setBoardHistoryIndex(newIndex);

    // If returning to current state, reload from loadedTrade.items
    if (newIndex === -1) {
      // Current state - reload from the trade items
      const isInitiator = loadedTrade.initiator.walletAddress === address;
      const userItems = loadedTrade.items.filter((item: any) =>
        isInitiator ? item.side === 'INITIATOR' : item.side === 'COUNTERPARTY'
      );
      const traderItems = loadedTrade.items.filter((item: any) =>
        isInitiator ? item.side === 'COUNTERPARTY' : item.side === 'INITIATOR'
      );

      const userNFTsToLoad = userItems.map((item: any, index: number) => ({
        id: `user-${item.nft.id}-${index}`,
        name: item.nft.name,
        image: item.nft.image,
        value: item.tokenAmount || 0,
        rarity: 'COMMON' as const,
        collection: item.nft.collection,
        tokenId: item.nft.tokenId,
        collectionId: item.nft.collectionId,
        ownerAddress: isInitiator ? loadedTrade.initiator.walletAddress : loadedTrade.counterparty.walletAddress
      }));

      const traderNFTsToLoad = traderItems.map((item: any, index: number) => ({
        id: `trader-${item.nft.id}-${index}`,
        name: item.nft.name,
        image: item.nft.image,
        value: item.tokenAmount || 0,
        rarity: 'COMMON' as const,
        collection: item.nft.collection,
        tokenId: item.nft.tokenId,
        collectionId: item.nft.collectionId,
        ownerAddress: isInitiator ? loadedTrade.counterparty.walletAddress : loadedTrade.initiator.walletAddress
      }));

      setUserBoardNFTs(userNFTsToLoad);
      setTraderBoardNFTs(traderNFTsToLoad);
      return;
    }

    // Historical state - use items from history metadata
    const isInitiator = loadedTrade.initiator.walletAddress === address;
    let itemsToDisplay: any[] = [];

    const historyEntry = loadedTrade.history[newIndex];
    if (historyEntry?.metadata && 'items' in historyEntry.metadata) {
      itemsToDisplay = (historyEntry.metadata as any).items || [];
    }

    // Split items by side
    const userItems = itemsToDisplay.filter((item: any) =>
      isInitiator ? item.side === 'INITIATOR' : item.side === 'COUNTERPARTY'
    );
    const traderItems = itemsToDisplay.filter((item: any) =>
      isInitiator ? item.side === 'COUNTERPARTY' : item.side === 'INITIATOR'
    );

    // Convert to NFT format with unique IDs per side
    const userNFTsToLoad = userItems.map((item: any, index: number) => {
      const nftData = item.nft || item;
      const baseId = nftData.id || item.nftId;
      return {
        id: `user-${baseId}-${index}`,
        name: nftData.name || 'Unknown NFT',
        image: nftData.image || '',
        value: item.tokenAmount || 0,
        rarity: 'COMMON' as const,
        collection: nftData.collection,
        tokenId: nftData.tokenId,
        collectionId: nftData.collectionId,
        ownerAddress: isInitiator ? loadedTrade.initiator.walletAddress : loadedTrade.counterparty.walletAddress
      };
    });

    const traderNFTsToLoad = traderItems.map((item: any, index: number) => {
      const nftData = item.nft || item;
      const baseId = nftData.id || item.nftId;
      return {
        id: `trader-${baseId}-${index}`,
        name: nftData.name || 'Unknown NFT',
        image: nftData.image || '',
        value: item.tokenAmount || 0,
        rarity: 'COMMON' as const,
        collection: nftData.collection,
        tokenId: nftData.tokenId,
        collectionId: nftData.collectionId,
        ownerAddress: isInitiator ? loadedTrade.counterparty.walletAddress : loadedTrade.initiator.walletAddress
      };
    });

    setUserBoardNFTs(userNFTsToLoad);
    setTraderBoardNFTs(traderNFTsToLoad);
  };

  const loadTradeIntoBoard = (trade: any) => {
    // Set the active trade ID so we can update instead of create
    setActiveTradeId(trade.id);

    // Store the full trade data for history navigation
    setLoadedTrade(trade);
    setBoardHistoryIndex(-1); // Reset to current state

    // Clear current board
    setUserBoardNFTs([]);
    setTraderBoardNFTs([]);

    // Determine which side is which based on current user
    const isInitiator = trade.initiator.walletAddress === address;
    const userItems = trade.items.filter((item: any) =>
      isInitiator ? item.side === 'INITIATOR' : item.side === 'COUNTERPARTY'
    );
    const traderItems = trade.items.filter((item: any) =>
      isInitiator ? item.side === 'COUNTERPARTY' : item.side === 'INITIATOR'
    );

    // Convert trade items to NFTs and load onto board with unique IDs per side
    const userNFTsToLoad = userItems.map((item: any, index: number) => ({
      id: `user-${item.nft.id}-${index}`,
      name: item.nft.name,
      image: item.nft.image,
      value: item.tokenAmount || 0,
      rarity: 'COMMON' as const,
      collection: item.nft.collection,
      tokenId: item.nft.tokenId,
      collectionId: item.nft.collectionId,
      ownerAddress: isInitiator ? trade.initiator.walletAddress : trade.counterparty.walletAddress
    }));

    const traderNFTsToLoad = traderItems.map((item: any, index: number) => ({
      id: `trader-${item.nft.id}-${index}`,
      name: item.nft.name,
      image: item.nft.image,
      value: item.tokenAmount || 0,
      rarity: 'COMMON' as const,
      collection: item.nft.collection,
      tokenId: item.nft.tokenId,
      collectionId: item.nft.collectionId,
      ownerAddress: isInitiator ? trade.counterparty.walletAddress : trade.initiator.walletAddress
    }));

    setUserBoardNFTs(userNFTsToLoad);
    setTraderBoardNFTs(traderNFTsToLoad);

    // Select the trader and fetch their available NFTs for counter-offers
    const otherParty = isInitiator ? trade.counterparty : trade.initiator;
    const traderToSelect = traders.find(t => t.walletAddress === otherParty.walletAddress);

    if (traderToSelect) {
      setSelectedTrader(traderToSelect);
      // Fetch their NFTs so user can add/replace items in counter-offer
      fetchTraderNFTs(traderToSelect.walletAddress);
    } else {
      // Create a temporary trader object if not in list
      const tempTrader: Trader = {
        id: otherParty.id,
        name: otherParty.username,
        username: otherParty.username,
        walletAddress: otherParty.walletAddress,
        avatar: otherParty.profilePicture || '',
        rating: 0,
        trades: 0,
        successRate: 0,
        isOnline: false,
        tier: 'SILVER'
      };
      setSelectedTrader(tempTrader);
      // Fetch their NFTs so user can add/replace items in counter-offer
      fetchTraderNFTs(tempTrader.walletAddress);
    }
  };

  const value: P2PTradingContextType = {
    userNFTs,
    userBoardNFTs,
    toggleUserNFTSelection,
    confirmUserNFTs,
    removeUserNFTFromBoard,
    clearUserBoard,
    selectedTrader,
    traderNFTs,
    traderBoardNFTs,
    selectTrader,
    toggleTraderNFTSelection,
    confirmTraderNFTs,
    removeTraderNFTFromBoard,
    clearTraderBoard,
    isLoadingUserNFTs,
    isLoadingTraders,
    isLoadingTraderNFTs,
    userNFTsError,
    tradersError,
    traderNFTsError,
    clearAllSelections,
    refreshUserNFTs,
    refreshTraders,
    traders,
    loadTradeIntoBoard,
    activeTradeId,
    clearActiveTradeId,
    updateUserNFTPrice,
    updateTraderNFTPrice,
    loadedTrade,
    boardHistoryIndex,
    navigateBoardHistory,
    isViewingHistory: boardHistoryIndex !== -1,
  };

  return (
    <P2PTradingContext.Provider value={value}>
      {children}
    </P2PTradingContext.Provider>
  );
}

export function useP2PTrading() {
  const context = useContext(P2PTradingContext);
  if (context === undefined) {
    throw new Error('useP2PTrading must be used within a P2PTradingProvider');
  }
  return context;
}