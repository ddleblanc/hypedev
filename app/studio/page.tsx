"use client";

import { useRouter } from "next/navigation";
import { StudioView } from "@/components/authenticated-homescreen/studio-view";

export default function StudioPage() {
  const router = useRouter();

  const handleNavigate = (newMode: string) => {
    if (newMode === 'home') {
      router.push('/');
    } else {
      router.push(`/${newMode}`);
    }
  };

  return <StudioView setViewMode={handleNavigate} />;
}