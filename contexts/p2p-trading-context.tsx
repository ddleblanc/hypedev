"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export interface NFT {
  id: string;
  name: string;
  image: string;
  value: number;
  rarity: 'MYTHIC' | 'LEGENDARY' | 'EPIC' | 'RARE';
  selected?: boolean;
}

export interface Trader {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  trades: number;
  successRate: number;
  isOnline: boolean;
  tier: 'DIAMOND' | 'GOLD' | 'SILVER';
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
  selectTrader: (trader: Trader) => void;
  toggleTraderNFTSelection: (nftId: string) => void;
  confirmTraderNFTs: () => void;
  removeTraderNFTFromBoard: (nftId: string) => void;
  clearTraderBoard: () => void;
  
  // General
  clearAllSelections: () => void;
}

const P2PTradingContext = createContext<P2PTradingContextType | undefined>(undefined);

// Mock data
const mockUserNFTs: NFT[] = [
  { id: '1', name: 'Cyber Dragon #001', image: 'https://picsum.photos/200/200?random=901', value: 2.5, rarity: 'LEGENDARY', selected: false },
  { id: '2', name: 'Digital Warrior #127', image: 'https://picsum.photos/200/200?random=902', value: 1.8, rarity: 'EPIC', selected: false },
  { id: '3', name: 'Neon Beast #089', image: 'https://picsum.photos/200/200?random=903', value: 3.2, rarity: 'LEGENDARY', selected: false },
  { id: '4', name: 'Quantum Knight #445', image: 'https://picsum.photos/200/200?random=904', value: 1.5, rarity: 'RARE', selected: false },
  { id: '5', name: 'Plasma Phoenix #202', image: 'https://picsum.photos/200/200?random=905', value: 4.7, rarity: 'MYTHIC', selected: false },
  { id: '6', name: 'Shadow Assassin #666', image: 'https://picsum.photos/200/200?random=906', value: 2.1, rarity: 'EPIC', selected: false },
  { id: '7', name: 'Ice Golem #333', image: 'https://picsum.photos/200/200?random=907', value: 1.3, rarity: 'RARE', selected: false },
  { id: '8', name: 'Fire Drake #777', image: 'https://picsum.photos/200/200?random=908', value: 5.5, rarity: 'MYTHIC', selected: false },
  { id: '9', name: 'Storm Wizard #999', image: 'https://picsum.photos/200/200?random=909', value: 2.8, rarity: 'EPIC', selected: false },
  { id: '10', name: 'Earth Titan #111', image: 'https://picsum.photos/200/200?random=910', value: 3.9, rarity: 'LEGENDARY', selected: false }
];

const mockTraderNFTs: NFT[] = [
  { id: 't1', name: 'Mystic Wolf #234', image: 'https://picsum.photos/200/200?random=801', value: 3.1, rarity: 'LEGENDARY', selected: false },
  { id: 't2', name: 'Golden Eagle #567', image: 'https://picsum.photos/200/200?random=802', value: 2.4, rarity: 'EPIC', selected: false },
  { id: 't3', name: 'Diamond Snake #890', image: 'https://picsum.photos/200/200?random=803', value: 4.2, rarity: 'MYTHIC', selected: false },
  { id: 't4', name: 'Crystal Bear #123', image: 'https://picsum.photos/200/200?random=804', value: 1.9, rarity: 'RARE', selected: false },
  { id: 't5', name: 'Thunder Lion #456', image: 'https://picsum.photos/200/200?random=805', value: 5.8, rarity: 'MYTHIC', selected: false },
  { id: 't6', name: 'Frost Tiger #789', image: 'https://picsum.photos/200/200?random=806', value: 2.7, rarity: 'EPIC', selected: false },
  { id: 't7', name: 'Flame Fox #012', image: 'https://picsum.photos/200/200?random=807', value: 1.6, rarity: 'RARE', selected: false },
  { id: 't8', name: 'Ocean Shark #345', image: 'https://picsum.photos/200/200?random=808', value: 3.5, rarity: 'LEGENDARY', selected: false }
];

export function P2PTradingProvider({ children }: { children: ReactNode }) {
  const [userNFTs, setUserNFTs] = useState<NFT[]>(mockUserNFTs);
  const [userBoardNFTs, setUserBoardNFTs] = useState<NFT[]>([]);
  const [selectedTrader, setSelectedTrader] = useState<Trader | null>(null);
  const [traderNFTs, setTraderNFTs] = useState<NFT[]>(mockTraderNFTs);
  const [traderBoardNFTs, setTraderBoardNFTs] = useState<NFT[]>([]);

  const toggleUserNFTSelection = (nftId: string) => {
    setUserNFTs(prev => 
      prev.map(nft => 
        nft.id === nftId ? { ...nft, selected: !nft.selected } : nft
      )
    );
  };

  const confirmUserNFTs = () => {
    const selectedNFTs = userNFTs.filter(nft => nft.selected);
    setUserBoardNFTs(prev => [...prev, ...selectedNFTs]);
    setUserNFTs(prev => 
      prev.map(nft => ({ ...nft, selected: false }))
    );
  };

  const removeUserNFTFromBoard = (nftId: string) => {
    setUserBoardNFTs(prev => prev.filter(nft => nft.id !== nftId));
  };

  const clearUserBoard = () => {
    setUserBoardNFTs([]);
  };

  const selectTrader = (trader: Trader) => {
    setSelectedTrader(trader);
  };

  const toggleTraderNFTSelection = (nftId: string) => {
    setTraderNFTs(prev => 
      prev.map(nft => 
        nft.id === nftId ? { ...nft, selected: !nft.selected } : nft
      )
    );
  };

  const confirmTraderNFTs = () => {
    const selectedNFTs = traderNFTs.filter(nft => nft.selected);
    setTraderBoardNFTs(prev => [...prev, ...selectedNFTs]);
    setTraderNFTs(prev => 
      prev.map(nft => ({ ...nft, selected: false }))
    );
  };

  const removeTraderNFTFromBoard = (nftId: string) => {
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
    clearAllSelections,
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