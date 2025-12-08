"use client";

import { useRouter } from "next/navigation";
import { HomeView } from "@/components/authenticated-homescreen/home-view";
import { PortalSwitchButton } from "@/components/homepage/portal-switch-button";

export default function HomePage() {
  const router = useRouter();

  const handleNavigate = (route: string) => {
    if (route === "home") {
      router.push("/home");
    } else {
      router.push(`/${route}`);
    }
  };

  const handleModeChange = (mode: "traditional" | "hud") => {
    if (mode === "traditional") {
      router.push("/discover");
    }
  };

  return (
    <div className="relative min-h-screen">
      <HomeView setViewMode={handleNavigate} />
      <PortalSwitchButton
        currentMode="hud"
        onModeChange={handleModeChange}
        isTransitioning={false}
      />
    </div>
  );
}
