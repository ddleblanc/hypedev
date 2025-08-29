"use client";

import { useRouter } from "next/navigation";
import { LaunchpadView } from "@/components/authenticated-homescreen/launchpad-view";

export default function LaunchpadPage() {
  const router = useRouter();

  const handleNavigate = (newMode: string) => {
    if (newMode === 'home') {
      router.push('/');
    } else {
      router.push(`/${newMode}`);
    }
  };

  return <LaunchpadView setViewMode={handleNavigate} />;
}