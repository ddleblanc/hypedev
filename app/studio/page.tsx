"use client";

import { StudioView } from "@/components/authenticated-homescreen/studio-view";
import { Suspense } from "react";

function StudioContent() {
  return <StudioView />;
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
