"use client";

import { useRouter } from "next/navigation";
import { PlayView } from "@/components/authenticated-homescreen/play-view";

export default function PlayPage() {
  const router = useRouter();

  const handleNavigate = (newMode: string) => {
    if (newMode === 'home') {
      router.push('/');
    } else {
      router.push(`/${newMode}`);
    }
  };

  return <PlayView setViewMode={handleNavigate} />;
}