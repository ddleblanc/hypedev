"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StudioDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/studio");
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[rgb(163,255,18)]"></div>
    </div>
  );
}