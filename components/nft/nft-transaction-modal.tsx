"use client";

import { useEffect, useState } from "react";
import { NFTTransactionPanel } from "./nft-transaction-panel";
import { NFTTransactionDrawer } from "./nft-transaction-drawer";

export interface NFTTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nft: {
    id: string;
    name: string;
    image: string;
    price?: number;
    lastSale?: number;
    rarity: string;
    collection: string;
    contractAddress?: string;
    tokenId?: string;
    owner?: string;
    creator?: string;
    royalty?: number;
    traits?: Record<string, string>;
    floorPrice?: number;
    topBid?: number;
    views?: number;
    likes?: number;
    rank?: number;
  } | null;
  mode: "buy" | "offer";
}

export function NFTTransactionModal({ open, onOpenChange, nft, mode }: NFTTransactionModalProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // Use drawer for mobile, panel for desktop
  if (isMobile) {
    return (
      <NFTTransactionDrawer
        open={open}
        onOpenChange={onOpenChange}
        nft={nft}
        mode={mode}
      />
    );
  }

  return (
    <NFTTransactionPanel
      open={open}
      onOpenChange={onOpenChange}
      nft={nft}
      mode={mode}
    />
  );
}