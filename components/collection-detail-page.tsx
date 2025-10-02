"use client";

import React, { useState, useEffect } from "react";
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
import type { Collection } from "@/components/collection/types";

interface CollectionDetailPageProps {
  slug: string;
}

export function CollectionDetailPage({ slug }: CollectionDetailPageProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('items');
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch collection data
  useEffect(() => {
    const fetchCollection = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/marketplace/collection/${slug}`);
        const data = await response.json();

        if (data.success && data.collection) {
          setCollection(data.collection);
        } else {
          setError(data.error || 'Failed to load collection');
        }
      } catch (err) {
        console.error('Error fetching collection:', err);
        setError('Failed to load collection');
      } finally {
        setLoading(false);
      }
    };

    fetchCollection();
  }, [slug]);

  const handleShare = () => {
    if (navigator.share && collection) {
      navigator.share({
        title: collection.title,
        text: collection.description,
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

  // Use actual collection data or fallback to mock data
  const displayCollection = collection || mockCollection;

  // Show loading state
  if (loading) {
    return (
      <div className="w-full min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading collection...</div>
      </div>
    );
  }

  // Show error state
  if (error && !collection) {
    return (
      <div className="w-full min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full min-h-screen bg-black"
    >
      <TooltipProvider>
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <CollectionHero
            collection={displayCollection}
            isWatchlisted={isWatchlisted}
            onWatchlistToggle={() => setIsWatchlisted(!isWatchlisted)}
            onShare={handleShare}
          />
        </motion.div>

        {/* Main Content */}
        <div className="relative bg-black min-h-screen pb-20 md:pb-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <CollectionTabs />
            </motion.div>

            {/* Tab Contents */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="px-4 md:px-6 py-8"
            >
              <OverviewTab collection={displayCollection} />
              <ItemsTab collection={displayCollection} />
              <AnalyticsTab />
              <ActivityTab collection={displayCollection} />
              <HoldersTab collection={displayCollection} />
            </motion.div>
          </Tabs>
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="md:hidden fixed bottom-0 left-0 right-0 z-30"
        >
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
        </motion.div>
      </TooltipProvider>
    </motion.div>
  );
}
