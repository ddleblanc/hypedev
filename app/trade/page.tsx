"use client";

import { useRouter } from "next/navigation";
import { TradeView } from "@/components/authenticated-homescreen/trade-view";

export default function TradePage() {
  const router = useRouter();

  const handleNavigate = (newMode: string) => {
    if (newMode === 'home') {
      router.push('/home');
    } else {
      router.push(`/${newMode}`);
    }
  };

  return <TradeView setViewMode={handleNavigate} />;
}