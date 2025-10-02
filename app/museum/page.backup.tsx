"use client";

import { useRouter } from "next/navigation";
import { MuseumView } from "@/components/authenticated-homescreen/museum-view";

export default function MuseumPage() {
  const router = useRouter();

  const handleNavigate = (newMode: string) => {
    if (newMode === 'home') {
      router.push('/');
    } else {
      router.push(`/${newMode}`);
    }
  };

  return <MuseumView setViewMode={handleNavigate} />;
}