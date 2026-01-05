"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  CheckCheck,
  Search,
  Clock,
  Settings2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/use-notifications";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { NotificationCard } from "@/components/control-center/notification-card";
import { NotificationGroup } from "@/components/control-center/notification-group";
import { EmptyState } from "@/components/control-center/empty-state";

type FilterTab =
  | "all"
  | "urgent"
  | "offers"
  | "trades"
  | "social"
  | "marketplace";

const filterTabs: { id: FilterTab; label: string; types: string[] }[] = [
  { id: "all", label: "All", types: [] },
  { id: "urgent", label: "Urgent", types: [] }, // Special: priority-based
  {
    id: "offers",
    label: "Offers",
    types: [
      "offer_received",
      "offer_made",
      "offer_accepted",
      "offer_rejected",
    ],
  },
  {
    id: "trades",
    label: "Trades",
    types: [
      "trade_received",
      "trade_initiated",
      "trade_completed",
      "trade_counteroffer",
    ],
  },
  { id: "social", label: "Social", types: ["user_followed_by"] },
  {
    id: "marketplace",
    label: "Marketplace",
    types: ["listing_sold", "purchase", "auction_won", "bid_placed"],
  },
];

function ControlCenterContent() {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    dismiss,
    performAction,
    refresh,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter and sort notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications.filter((n) => !n.isDismissed);

    // Tab filter
    if (activeTab === "urgent") {
      filtered = filtered.filter(
        (n) => n.priority === "URGENT" || n.isTimeSensitive
      );
    } else if (activeTab !== "all") {
      const tab = filterTabs.find((t) => t.id === activeTab);
      if (tab?.types.length) {
        filtered = filtered.filter((n) => tab.types.includes(n.type));
      }
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.message?.toLowerCase().includes(query) ||
          n.metadata?.nftName?.toLowerCase().includes(query)
      );
    }

    // Sort: Urgent first, then by time
    return filtered.sort((a, b) => {
      // Urgent notifications first
      if (a.priority === "URGENT" && b.priority !== "URGENT") return -1;
      if (b.priority === "URGENT" && a.priority !== "URGENT") return 1;

      // Time-sensitive next
      if (a.isTimeSensitive && !b.isTimeSensitive) return -1;
      if (b.isTimeSensitive && !a.isTimeSensitive) return 1;

      // Then by date (newest first)
      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
  }, [notifications, activeTab, searchQuery]);

  // Group by entity where relevant
  const groupedNotifications = useMemo(() => {
    const groups = new Map<string, typeof notifications>();
    const ungrouped: typeof notifications = [];

    filteredNotifications.forEach((n) => {
      // Group trade notifications by tradeId
      if (n.tradeId) {
        const key = `trade-${n.tradeId}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(n);
      }
      // Group offer notifications by offerId
      else if (n.offerId) {
        const key = `offer-${n.offerId}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(n);
      } else {
        ungrouped.push(n);
      }
    });

    return { groups, ungrouped };
  }, [filteredNotifications]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  const urgentCount = notifications.filter(
    (n) =>
      (n.priority === "URGENT" || n.isTimeSensitive) &&
      !n.isRead &&
      !n.isDismissed
  ).length;

  return (
    <div className="w-full min-h-screen overflow-hidden">
      {/* Sticky Header */}
      <div className="sticky top-16 z-30 bg-black/95 backdrop-blur-xl border-b border-white/10">
        <div className="px-4 md:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left: Title & Stats */}
            <div className="flex items-center gap-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-white mb-1 flex items-center gap-3">
                  <Bell className="w-6 md:w-7 h-6 md:h-7 text-[rgb(163,255,18)]" />
                  CONTROL CENTER
                </h1>
                <p className="text-white/60 text-sm">
                  {unreadCount} unread
                  {urgentCount > 0 && (
                    <span className="text-red-400 ml-2">
                      ({urgentCount} urgent)
                    </span>
                  )}
                </p>
              </div>

              {/* Quick Stats - Hidden on mobile */}
              <div className="hidden lg:flex items-center gap-4 pl-6 border-l border-white/10">
                <div className="text-center">
                  <p className="text-xs text-white/40 uppercase tracking-wide mb-1">
                    Pending
                  </p>
                  <p className="text-lg font-bold text-[rgb(163,255,18)]">
                    {
                      notifications.filter((n) => n.actionStatus === "PENDING")
                        .length
                    }
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-white/40 uppercase tracking-wide mb-1">
                    Today
                  </p>
                  <p className="text-lg font-bold text-white">
                    {
                      notifications.filter(
                        (n) =>
                          new Date(n.createdAt).toDateString() ===
                          new Date().toDateString()
                      ).length
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* Search */}
              <div className="relative flex-1 md:flex-none">
                <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 md:pl-11 pr-4 py-2 md:py-3 bg-black/60 border-white/20 text-white rounded-lg focus:border-[rgb(163,255,18)]/50 w-full md:w-64"
                />
              </div>

              {/* Refresh */}
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="border-white/20 hover:border-white/40 shrink-0"
              >
                <RefreshCw
                  className={cn("w-4 h-4", isRefreshing && "animate-spin")}
                />
              </Button>

              {/* Mark All Read */}
              <Button
                variant="outline"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="border-white/20 hover:border-[rgb(163,255,18)]/50 gap-2 hidden md:flex"
              >
                <CheckCheck className="w-4 h-4" />
                Mark All Read
              </Button>

              {/* Settings */}
              <Button
                variant="outline"
                size="icon"
                className="border-white/20 hover:border-white/40 shrink-0"
              >
                <Settings2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="mt-6 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as FilterTab)}
            >
              <TabsList className="bg-white/5 border border-white/10 p-1 w-max">
                {filterTabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className={cn(
                      "data-[state=active]:bg-[rgb(163,255,18)] data-[state=active]:text-black",
                      "px-3 md:px-4 py-2 text-xs md:text-sm font-medium whitespace-nowrap"
                    )}
                  >
                    {tab.label}
                    {tab.id === "urgent" && urgentCount > 0 && (
                      <Badge className="ml-2 bg-red-500 text-white text-[10px]">
                        {urgentCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Notification List */}
      <div className="px-4 md:px-8 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-white/20 border-t-[rgb(163,255,18)] rounded-full animate-spin" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <EmptyState activeTab={activeTab} />
        ) : (
          <div className="space-y-4">
            {/* Urgent Section */}
            {activeTab === "all" && urgentCount > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Requires Immediate Attention
                </h2>
                <div className="space-y-3">
                  <AnimatePresence>
                    {filteredNotifications
                      .filter(
                        (n) => n.priority === "URGENT" || n.isTimeSensitive
                      )
                      .map((notification, index) => (
                        <NotificationCard
                          key={notification.id}
                          notification={notification}
                          index={index}
                          onMarkRead={markAsRead}
                          onDismiss={dismiss}
                          onAction={performAction}
                        />
                      ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Grouped Notifications */}
            {Array.from(groupedNotifications.groups.entries()).map(
              ([key, items]) => (
                <NotificationGroup
                  key={key}
                  groupKey={key}
                  notifications={items}
                  onMarkRead={markAsRead}
                  onDismiss={dismiss}
                  onAction={performAction}
                />
              )
            )}

            {/* Ungrouped Notifications */}
            <AnimatePresence>
              {groupedNotifications.ungrouped
                .filter((n) =>
                  activeTab === "all"
                    ? !(n.priority === "URGENT" || n.isTimeSensitive)
                    : true
                )
                .map((notification, index) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    index={index}
                    onMarkRead={markAsRead}
                    onDismiss={dismiss}
                    onAction={performAction}
                  />
                ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ControlCenterPage() {
  return (
    <ProtectedRoute>
      <ControlCenterContent />
    </ProtectedRoute>
  );
}
