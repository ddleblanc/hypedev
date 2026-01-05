"use client";

import { useState, useCallback, useMemo } from "react";
import { RefreshCw, Volume2, VolumeX, Filter, WifiOff, Wifi } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collection, RecentActivity } from "./types";
import { LiveIndicator } from "@/components/shared/live-indicator";
import { useActivitySound } from "@/hooks/use-sound-notification";
import { useActivityStream, ActivityEvent } from "@/hooks/use-activity-stream";
import { cn } from "@/lib/utils";

interface ActivityTabProps {
  collection: Collection;
}

// Activity types for filtering
const activityTypes = [
  { value: "all", label: "All Activity" },
  { value: "Sale", label: "Sales" },
  { value: "List", label: "Listings" },
  { value: "Transfer", label: "Transfers" },
  { value: "Offer", label: "Offers" },
  { value: "Bid", label: "Bids" },
];

// Activity type configuration for consistent styling
const activityConfig: Record<string, {
  badge: string;
  border: string;
}> = {
  Sale: {
    badge: "bg-green-500/20 text-green-400",
    border: "border-l-green-500",
  },
  List: {
    badge: "bg-blue-500/20 text-blue-400",
    border: "border-l-blue-500",
  },
  Transfer: {
    badge: "bg-purple-500/20 text-purple-400",
    border: "border-l-purple-500",
  },
  Offer: {
    badge: "bg-orange-500/20 text-orange-400",
    border: "border-l-orange-500",
  },
  Bid: {
    badge: "bg-yellow-500/20 text-yellow-400",
    border: "border-l-yellow-500",
  },
};

function getActivityConfig(type: string) {
  return activityConfig[type] || {
    badge: "bg-gray-500/20 text-gray-400",
    border: "border-l-gray-500",
  };
}

export function ActivityTab({ collection }: ActivityTabProps) {
  const [filterType, setFilterType] = useState("all");
  const [useLiveStream, setUseLiveStream] = useState(true);

  // SSE stream for real-time updates
  const {
    activities: streamActivities,
    isConnected,
    error: streamError,
    reconnect,
  } = useActivityStream({
    collectionId: collection.id,
    enabled: useLiveStream,
    onNewActivity: (activity) => {
      // Sound will play via the hook below
    },
  });

  // Combine stream activities with fallback to static data
  const allActivities = useMemo(() => {
    if (streamActivities.length > 0) {
      return streamActivities;
    }
    // Fallback to collection's static activity data
    if (!collection.recentActivity || collection.recentActivity.length === 0) {
      return [];
    }
    return collection.recentActivity.map((a) => ({
      id: String(a.id),
      type: a.type,
      item: a.item,
      image: null,
      price: a.price,
      from: a.from,
      to: a.to,
      timestamp: a.timestamp,
      txHash: a.txHash,
    }));
  }, [streamActivities, collection.recentActivity]);

  // Filter activities by type
  const filteredActivities = useMemo(() => {
    if (filterType === "all") return allActivities;
    return allActivities.filter((a) => a.type === filterType);
  }, [allActivities, filterType]);

  // Sound notification hook
  const { toggle: toggleSound, isEnabled: isSoundEnabled } = useActivitySound(
    allActivities.map((a) => ({ id: a.id })),
    {
      soundUrl: "/sounds/notification.mp3",
      enabled: useLiveStream,
    }
  );

  const handleReconnect = useCallback(() => {
    reconnect();
  }, [reconnect]);

  return (
    <TabsContent value="activity" className="mt-0 space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-white">Recent Activity</h3>
          {useLiveStream && isConnected ? (
            <LiveIndicator variant="pulse" size="sm" />
          ) : (
            <Badge className="bg-white/10 text-white/60 text-xs">
              <WifiOff className="w-3 h-3 mr-1" />
              Offline
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Activity Type Filter */}
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px] h-9 bg-black/40 border-white/20 text-white text-sm">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              {activityTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sound Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSound}
            className={cn(
              "text-white/50 hover:text-white h-9 px-2",
              isSoundEnabled && "text-[rgb(163,255,18)]"
            )}
            title={isSoundEnabled ? "Mute notifications" : "Enable notifications"}
          >
            {isSoundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </Button>

          {/* Live Toggle */}
          <Button
            variant={useLiveStream ? "default" : "outline"}
            size="sm"
            onClick={() => setUseLiveStream(!useLiveStream)}
            className={cn(
              "h-9",
              useLiveStream
                ? "bg-[rgb(163,255,18)] text-black hover:bg-[rgb(143,235,0)]"
                : "border-white/20 text-white hover:bg-white/10"
            )}
          >
            <Wifi className="w-4 h-4 mr-1" />
            Live
          </Button>

          {/* Reconnect button (shown when disconnected) */}
          {useLiveStream && !isConnected && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReconnect}
              className="border-white/20 text-white hover:bg-white/10 h-9"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Reconnect
            </Button>
          )}
        </div>
      </div>

      {/* Connection Error Banner */}
      {streamError && useLiveStream && (
        <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
          <p className="text-sm text-orange-400">{streamError}</p>
        </div>
      )}

      <Card className="bg-black/40 border-white/10">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-sm font-medium text-white/60 p-4">Event</th>
                  <th className="text-left text-sm font-medium text-white/60 p-4">Item</th>
                  <th className="text-left text-sm font-medium text-white/60 p-4">Price</th>
                  <th className="text-left text-sm font-medium text-white/60 p-4">From</th>
                  <th className="text-left text-sm font-medium text-white/60 p-4">To</th>
                  <th className="text-left text-sm font-medium text-white/60 p-4">Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center">
                      <p className="text-white/50">No activity found</p>
                      {filterType !== "all" && (
                        <Button
                          variant="link"
                          className="text-[rgb(163,255,18)] mt-2"
                          onClick={() => setFilterType("all")}
                        >
                          Clear filter
                        </Button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredActivities.map((activity, index) => {
                    const config = getActivityConfig(activity.type);
                    return (
                      <tr
                        key={`${activity.id}-${index}`}
                        className={cn(
                          "border-b border-white/5 hover:bg-white/5 transition-colors",
                          "border-l-4",
                          config.border
                        )}
                      >
                        <td className="p-4">
                          <Badge className={config.badge}>
                            {activity.type}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <p className="text-white font-medium">{activity.item}</p>
                        </td>
                        <td className="p-4">
                          <p className="text-[rgb(163,255,18)] font-bold text-xl">{activity.price} ETH</p>
                        </td>
                        <td className="p-4">
                          <p className="text-white/80 font-mono text-sm">{activity.from}</p>
                        </td>
                        <td className="p-4">
                          <p className="text-white/80 font-mono text-sm">{activity.to}</p>
                        </td>
                        <td className="p-4">
                          <p className="text-white/60 text-sm">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
