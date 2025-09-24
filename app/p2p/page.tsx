"use client";

import { useRouter } from "next/navigation";
import { P2PView } from "@/components/authenticated-homescreen/p2p-view";
import { P2PTradingProvider } from "@/contexts/p2p-trading-context";

export default function P2PPage() {
  const router = useRouter();

  const handleNavigate = (newMode: string) => {
    if (newMode === 'home') {
      router.push('/');
    } else {
      router.push(`/${newMode}`);
    }
  };

  return (
    <P2PTradingProvider>
      <P2PView setViewMode={handleNavigate} />
    </P2PTradingProvider>
  );
}