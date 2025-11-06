"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { P2PView } from "@/components/authenticated-homescreen/p2p-view";
import { useP2PSelectionFlow } from "@/contexts/p2p-selection-flow-context";

function P2PPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resetFlow } = useP2PSelectionFlow();

  // Safely get params - searchParams can be null during SSR
  const traderAddress = searchParams?.get('trader') || undefined;
  const nftId = searchParams?.get('nft') || undefined;
  const collectionName = searchParams?.get('collection') || undefined;

  // New params for pre-populated NFT selections from 2-step flow
  const traderNftIds = searchParams?.get('traderNfts') || undefined;
  const userNftIds = searchParams?.get('userNfts') || undefined;

  // Cleanup: Clear selection state when user leaves the P2P board
  // This ensures the next trade starts with a clean slate
  useEffect(() => {
    return () => {
      // Only clear if we're navigating away from P2P entirely
      // (not just changing params within P2P)
      resetFlow();
    };
  }, [resetFlow]);

  const handleNavigate = (newMode: string) => {
    if (newMode === 'home') {
      router.push('/');
    } else {
      router.push(`/${newMode}`);
    }
  };

  return (
    <P2PView
      setViewMode={handleNavigate}
      initialTraderAddress={traderAddress}
      initialNftId={nftId}
      initialCollectionName={collectionName}
      initialTraderNftIds={traderNftIds}
      initialUserNftIds={userNftIds}
    />
  );
}

export default function P2PPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <P2PPageContent />
    </Suspense>
  );
}