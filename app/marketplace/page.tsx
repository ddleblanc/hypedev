"use client";

import { useRouter } from "next/navigation";
import { MarketplaceView } from "@/components/authenticated-homescreen/marketplace-view";

export default function MarketplacePage() {
  const router = useRouter();

  const handleNavigate = (newMode: string) => {
    if (newMode === 'home') {
      router.push('/');
    } else {
      router.push(`/${newMode}`);
    }
  };

  return <MarketplaceView setViewMode={handleNavigate} />;
}