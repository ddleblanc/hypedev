"use client";

import { useRouter } from "next/navigation";
import { MuseumView } from "@/components/authenticated-homescreen/museum-view";
import { MuseumProvider } from "@/contexts/museum-context";
import { TheaterEntry, TheaterExitButton } from "@/components/museum/theater";

export default function MuseumPage() {
  const router = useRouter();

  const handleNavigate = (newMode: string) => {
    if (newMode === 'home') {
      router.push('/');
    } else {
      router.push(`/${newMode}`);
    }
  };

  return (
    <MuseumProvider>
      <TheaterEntry>
        <TheaterExitButton />
        <MuseumView setViewMode={handleNavigate} />
      </TheaterEntry>
    </MuseumProvider>
  );
}
