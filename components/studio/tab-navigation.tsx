"use client";

import { Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TabNavigationProps {
  activeTab: string;
  showUploadInterface: boolean;
  uploadFilesCount: number;
  onTabChange: (tab: string) => void;
}

export function TabNavigation({
  activeTab,
  showUploadInterface,
  uploadFilesCount,
  onTabChange
}: TabNavigationProps) {
  const tabs = showUploadInterface
    ? ['upload', 'about', 'items', 'offers', 'holders', 'traits', 'activity']
    : ['about', 'items', 'offers', 'holders', 'traits', 'activity'];

  return (
    <div className="flex items-center gap-3 mb-6 overflow-x-auto">
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
            activeTab === tab
              ? 'bg-[rgb(163,255,18)]/20 text-[rgb(163,255,18)]'
              : 'text-white/70 hover:bg-white/6'
          }`}
        >
          {tab === 'upload' ? (
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Add NFTs
              {uploadFilesCount > 0 && (
                <Badge className="bg-[rgb(163,255,18)] text-black text-xs">
                  {uploadFilesCount}
                </Badge>
              )}
            </div>
          ) : (
            tab.charAt(0).toUpperCase() + tab.slice(1)
          )}
        </button>
      ))}
    </div>
  );
}
