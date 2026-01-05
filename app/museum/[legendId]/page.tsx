"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { LegendExperience } from "@/components/museum/legend-experience";
import { MuseumProvider, useMuseum } from "@/contexts/museum-context";
import { TheaterEntry } from "@/components/museum/theater";
import { trpc } from "@/lib/trpc/client";

function LegendPageContent() {
  const params = useParams();
  const router = useRouter();
  const legendSlug = params.legendId as string;
  const { enterTheaterMode, theaterPhase, activeLegend } = useMuseum();

  // Fetch legend data to start theater mode
  const { data: legend, isLoading, error } = trpc.museum.legends.getBySlug.useQuery(
    { slug: legendSlug },
    { enabled: !!legendSlug }
  );

  // Auto-start theater mode when legend loads
  useEffect(() => {
    if (legend && theaterPhase === "idle" && !activeLegend) {
      enterTheaterMode({
        id: legend.id,
        slug: legend.slug,
        title: legend.title,
        subtitle: legend.tagline,
        thumbnail: legend.portraitUrl,
        introVideo: legend.heroVideoUrl,
        trailerUrl: legend.trailerVideoUrl || undefined,
      });
    }
  }, [legend, theaterPhase, activeLegend, enterTheaterMode]);

  // Handle error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <h1 className="text-2xl font-light text-white mb-4">Legend Not Found</h1>
          <p className="text-white/60 mb-8">The legend you&apos;re looking for doesn&apos;t exist.</p>
          <button
            onClick={() => router.push("/museum")}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
          >
            Return to Museum
          </button>
        </div>
      </div>
    );
  }

  // Show loading while fetching or entering theater
  if (isLoading || !legend) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <TheaterEntry>
      <LegendExperience legendSlug={legendSlug} />
    </TheaterEntry>
  );
}

export default function LegendPage() {
  return (
    <MuseumProvider>
      <LegendPageContent />
    </MuseumProvider>
  );
}
