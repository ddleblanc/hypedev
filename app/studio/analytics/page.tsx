"use client";

import { Suspense } from "react";
import { StudioMainContent } from "@/components/studio/studio-main-content";
import { useStudioData } from "@/hooks/use-studio-data";

// Placeholder Analytics component until the actual one is created
function StudioAnalytics({ viewMode }: { viewMode: 'grid' | 'list' }) {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Analytics</h1>
        <p className="text-muted-foreground">Track your studio performance and insights.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-card rounded-lg p-6 border">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Revenue</h3>
          <p className="text-2xl font-bold">$12,345</p>
          <p className="text-xs text-green-500 mt-1">+12% from last month</p>
        </div>
        <div className="bg-card rounded-lg p-6 border">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">NFTs Sold</h3>
          <p className="text-2xl font-bold">1,234</p>
          <p className="text-xs text-green-500 mt-1">+8% from last month</p>
        </div>
        <div className="bg-card rounded-lg p-6 border">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Active Collections</h3>
          <p className="text-2xl font-bold">12</p>
          <p className="text-xs text-blue-500 mt-1">2 new this month</p>
        </div>
        <div className="bg-card rounded-lg p-6 border">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Unique Holders</h3>
          <p className="text-2xl font-bold">856</p>
          <p className="text-xs text-green-500 mt-1">+15% from last month</p>
        </div>
      </div>
      
      <div className="bg-card rounded-lg p-6 border">
        <h3 className="text-lg font-semibold mb-4">Performance Overview</h3>
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          <p>Analytics charts will be implemented here</p>
        </div>
      </div>
    </div>
  );
}

function AnalyticsContent() {
  const { isLoading, error, refreshData } = useStudioData();

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <div className="text-red-500 text-2xl">⚠</div>
          </div>
          <h3 className="text-lg font-semibold mb-2">Error Loading Analytics</h3>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <button 
            onClick={refreshData}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-hidden pt-16">
        <StudioMainContent currentView="analytics">
          <StudioAnalytics viewMode="grid" />
        </StudioMainContent>
      </div>
    </div>
  );
}

export default function StudioAnalyticsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <AnalyticsContent />
    </Suspense>
  );
}