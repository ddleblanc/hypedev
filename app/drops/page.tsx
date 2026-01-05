"use client";

import { useRouter } from "next/navigation";
import { DropsView } from "@/components/authenticated-homescreen/drops-view";

export default function DropsPage() {
  const router = useRouter();

  const handleNavigate = (newMode: string) => {
    if (newMode === 'home') {
      router.push('/');
    } else {
      router.push(`/${newMode}`);
    }
  };

  return <DropsView setViewMode={handleNavigate} />;
}
