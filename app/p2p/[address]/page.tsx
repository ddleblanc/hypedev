"use client";

import { useRouter, useParams } from "next/navigation";
import { P2PView } from "@/components/authenticated-homescreen/p2p-view";

export default function P2PConversationPage() {
  const router = useRouter();
  const params = useParams();
  const traderAddress = params.address as string;

  const handleNavigate = (newMode: string) => {
    if (newMode === 'home') {
      router.push('/');
    } else {
      router.push(`/${newMode}`);
    }
  };

  return <P2PView setViewMode={handleNavigate} initialTraderAddress={traderAddress} />;
}
