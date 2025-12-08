"use client";

import { TraditionalHomepage } from "@/components/homepage/traditional/traditional-homepage";
import { PortalSwitchButton } from "@/components/homepage/portal-switch-button";
import { useRouter } from "next/navigation";

export default function DiscoverPage() {
  const router = useRouter();

  const handleModeChange = (mode: "traditional" | "hud") => {
    if (mode === "hud") {
      router.push("/home");
    }
  };

  return (
    <div className="relative min-h-screen">
      <TraditionalHomepage />
      <PortalSwitchButton
        currentMode="traditional"
        onModeChange={handleModeChange}
        isTransitioning={false}
      />
    </div>
  );
}
