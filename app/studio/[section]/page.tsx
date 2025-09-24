"use client";

import { useParams, redirect } from "next/navigation";
import { useEffect } from "react";

export default function StudioSectionPage() {
  const params = useParams();
  const section = params?.section as string;

  useEffect(() => {
    // Redirect to the proper dedicated pages
    const validSections = ['projects', 'collections', 'nfts', 'activity', 'analytics', 'settings'];
    
    if (validSections.includes(section)) {
      redirect(`/studio/${section}`);
    } else {
      // Invalid section, redirect to dashboard
      redirect('/studio');
    }
  }, [section]);

  // This component should never render as it always redirects
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}
