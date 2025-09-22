"use client";

import { useRouter } from "next/navigation";
import { StudioView } from "@/components/authenticated-homescreen/studio-view";
import { Suspense } from "react";

function StudioContent() {
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

export default function StudioPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>}>
      <StudioContent />
    </Suspense>
  );
}