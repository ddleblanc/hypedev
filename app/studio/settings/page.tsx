"use client";

import { Suspense } from "react";
import { StudioMainContent } from "@/components/studio/studio-main-content";
import { useStudioData } from "@/hooks/use-studio-data";

// Placeholder Settings component until the actual one is created
function StudioSettings({ viewMode }: { viewMode: 'grid' | 'list' }) {
  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Studio Settings</h1>
        <p className="text-muted-foreground">Manage your studio preferences and configuration.</p>
      </div>
      
      <div className="space-y-6">
        {/* Profile Settings */}
        <div className="bg-card rounded-lg p-6 border">
          <h3 className="text-lg font-semibold mb-4">Profile Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Studio Name</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border rounded-md bg-background"
                placeholder="Enter your studio name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Bio</label>
              <textarea 
                className="w-full px-3 py-2 border rounded-md bg-background h-24"
                placeholder="Tell us about your studio"
              />
            </div>
          </div>
        </div>
        
        {/* Notification Settings */}
        <div className="bg-card rounded-lg p-6 border">
          <h3 className="text-lg font-semibold mb-4">Notifications</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive updates about your collections</p>
              </div>
              <input type="checkbox" className="rounded" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Sale Notifications</p>
                <p className="text-sm text-muted-foreground">Get notified when your NFTs are sold</p>
              </div>
              <input type="checkbox" className="rounded" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Marketing Updates</p>
                <p className="text-sm text-muted-foreground">Receive tips and platform updates</p>
              </div>
              <input type="checkbox" className="rounded" />
            </div>
          </div>
        </div>
        
        {/* Blockchain Settings */}
        <div className="bg-card rounded-lg p-6 border">
          <h3 className="text-lg font-semibold mb-4">Blockchain Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Default Chain</label>
              <select className="w-full px-3 py-2 border rounded-md bg-background">
                <option>Ethereum</option>
                <option>Polygon</option>
                <option>Base</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Default Royalty (%)</label>
              <input 
                type="number" 
                className="w-full px-3 py-2 border rounded-md bg-background"
                placeholder="5"
                min="0"
                max="10"
              />
            </div>
          </div>
        </div>
        
        {/* Save Button */}
        <div className="flex justify-end">
          <button className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsContent() {
  const { isLoading, error, refreshData } = useStudioData();

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <div className="text-red-500 text-2xl">⚠</div>
          </div>
          <h3 className="text-lg font-semibold mb-2">Error Loading Settings</h3>
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

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-hidden pt-16">
        <StudioMainContent currentView="settings">
          <StudioSettings viewMode="grid" />
        </StudioMainContent>
      </div>
    </div>
  );
}

export default function StudioSettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}