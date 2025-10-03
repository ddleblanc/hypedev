"use client";

import { createContext, useContext, useState, ReactNode, useMemo } from "react";

interface CollectionData {
  id: string;
  name: string;
  totalSupply: number;
  owners: number;
  floorPrice: string;
  volume: string;
  listed: string;
  isOwner: boolean;
}

interface CollectionContextType {
  collectionData: CollectionData | null;
  setCollectionData: (data: CollectionData | null) => void;
}

const CollectionContext = createContext<CollectionContextType | null>(null);

export function CollectionProvider({ children }: { children: ReactNode }) {
  const [collectionData, setCollectionData] = useState<CollectionData | null>(null);

  const value = useMemo(() => ({ collectionData, setCollectionData }), [collectionData]);

  return (
    <CollectionContext.Provider value={value}>
      {children}
    </CollectionContext.Provider>
  );
}

export function useCollection() {
  const context = useContext(CollectionContext);
  if (!context) {
    throw new Error("useCollection must be used within a CollectionProvider");
  }
  return context;
}

export function useCollectionOptional() {
  return useContext(CollectionContext);
}
