"use client";

import React from "react";
import { BarChart3, Grid3x3, TrendingUp, Activity, Users } from "lucide-react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

export function CollectionTabs() {
  return (
    <div className="sticky top-16 md:top-16 z-40 bg-black/95 backdrop-blur-lg border-b border-white/10">
      <div className="px-4 md:px-6">
        <TabsList className="bg-transparent border-0 h-auto p-0 w-full justify-start overflow-x-auto">
          <TabsTrigger
            value="overview"
            className="text-white/60 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-[rgb(163,255,18)] rounded-none px-6 py-4"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="items"
            className="text-white/60 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-[rgb(163,255,18)] rounded-none px-6 py-4"
          >
            <Grid3x3 className="w-4 h-4 mr-2" />
            Items
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="text-white/60 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-[rgb(163,255,18)] rounded-none px-6 py-4"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="text-white/60 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-[rgb(163,255,18)] rounded-none px-6 py-4"
          >
            <Activity className="w-4 h-4 mr-2" />
            Activity
          </TabsTrigger>
          <TabsTrigger
            value="holders"
            className="text-white/60 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-[rgb(163,255,18)] rounded-none px-6 py-4"
          >
            <Users className="w-4 h-4 mr-2" />
            Holders
          </TabsTrigger>
        </TabsList>
      </div>
    </div>
  );
}
