"use client";

import React from "react";
import { motion } from "framer-motion";
import { BarChart3, Grid3x3, TrendingUp, Activity, Users } from "lucide-react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const tabs = [
  { value: "overview", label: "Overview", icon: BarChart3 },
  { value: "items", label: "Items", icon: Grid3x3 },
  { value: "analytics", label: "Analytics", icon: TrendingUp },
  { value: "activity", label: "Activity", icon: Activity },
  { value: "holders", label: "Holders", icon: Users },
];

interface CollectionTabsProps {
  activeTab?: string;
}

export function CollectionTabs({ activeTab = "items" }: CollectionTabsProps) {
  return (
    <div className="sticky top-16 md:top-16 z-40 bg-black/95 backdrop-blur-lg border-b border-white/10">
      <div className="px-4 md:px-6">
        <TabsList className="bg-transparent border-0 h-auto p-0 w-full justify-start overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.value;

            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  "relative text-white/60 hover:text-white/80 rounded-none px-6 py-4",
                  "transition-colors duration-200",
                  "data-[state=active]:text-white"
                )}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[rgb(163,255,18)]"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>
    </div>
  );
}
