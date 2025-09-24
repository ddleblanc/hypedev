"use client";

import { useRouter } from "next/navigation";
import { CasualGamesView } from "@/components/authenticated-homescreen/casual-games-view";

export default function CasualPage() {
  const router = useRouter();

  const handleBack = (destination: string) => {
    router.push(`/${destination}`);
  };

  return <CasualGamesView onBack={() => handleBack('play')} />;
}