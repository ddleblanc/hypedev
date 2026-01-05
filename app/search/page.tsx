"use client";

import { Suspense } from "react";
import { SearchResults } from "@/components/search/search-results";
import { Loader2 } from "lucide-react";

function SearchPageContent() {
  return (
    <div className="min-h-screen pt-24 pb-12 px-4 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Search</h1>
          <p className="text-white/50">
            Discover collections, NFTs, and users across the marketplace
          </p>
        </div>

        {/* Search Results */}
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[rgb(163,255,18)] animate-spin" />
            </div>
          }
        >
          <SearchResults />
        </Suspense>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[rgb(163,255,18)] animate-spin" />
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
