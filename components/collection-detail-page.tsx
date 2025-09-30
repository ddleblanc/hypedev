"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Home, TrendingUp, Gamepad2, Crown, User } from "lucide-react";
import { CollectionHero } from "@/components/collection/collection-hero";
import { CollectionTabs } from "@/components/collection/collection-tabs";
import { Tabs } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OverviewTab } from "@/components/collection/overview-tab";
import { ItemsTab } from "@/components/collection/items-tab";
import { AnalyticsTab } from "@/components/collection/analytics-tab";
import { ActivityTab } from "@/components/collection/activity-tab";
import { HoldersTab } from "@/components/collection/holders-tab";
import { mockCollection } from "@/components/collection/mock-data";

interface CollectionDetailPageProps {
  slug: string;
}

export function CollectionDetailPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [isWatchlisted, setIsWatchlisted] = useState(false);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: mockCollection.title,
        text: mockCollection.description,
        url: window.location.href
      });
    }
  };

  const mainNavigation = [
    { label: "TRADE", href: "/trade", icon: TrendingUp },
    { label: "PLAY", href: "/play", icon: Gamepad2 },
    { label: "MUSEUM", href: "/museum", icon: Crown },
    { label: "COLLECTION", href: "/profile", icon: User }
  ];

  return (
    <div className="w-full min-h-screen bg-black">
      <TooltipProvider>
        <CollectionHero
          collection={mockCollection}
          isWatchlisted={isWatchlisted}
          onWatchlistToggle={() => setIsWatchlisted(!isWatchlisted)}
          onShare={handleShare}
        />

        {/* Main Content */}
        <div className="relative bg-black min-h-screen pb-20 md:pb-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <CollectionTabs />

            {/* Tab Contents */}
            <div className="px-4 md:px-6 py-8">
              <OverviewTab collection={mockCollection} />
              <ItemsTab collection={mockCollection} />
              <AnalyticsTab />
              <ActivityTab collection={mockCollection} />
              <HoldersTab collection={mockCollection} />
            </div>
          </Tabs>
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-30">
          <div className="bg-black/60 backdrop-blur-xl border-t border-white/10">
            <div className="grid grid-cols-5">
              {/* Home Button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => router.push('/')}
                className="flex flex-col items-center py-3 text-white/60 active:text-[rgb(163,255,18)] transition-colors group"
              >
                <Home className="w-6 h-6 mb-1 group-active:scale-110 transition-transform" />
              </motion.button>

              {/* Main Navigation Items */}
              {mainNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = item.label === 'COLLECTION';

                return (
                  <motion.button
                    key={item.label}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => router.push(item.href)}
                    className={`flex flex-col items-center py-3 transition-colors group ${
                      isActive
                        ? 'text-[rgb(163,255,18)]'
                        : 'text-white/60 active:text-[rgb(163,255,18)]'
                    }`}
                  >
                    <Icon className="w-6 h-6 mb-1 group-active:scale-110 transition-transform" />
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
}
