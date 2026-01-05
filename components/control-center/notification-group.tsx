"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Handshake, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationCard } from "./notification-card";
import type { Notification } from "@/hooks/use-notifications";

interface NotificationGroupProps {
  groupKey: string;
  notifications: Notification[];
  onMarkRead: (id: string) => Promise<void>;
  onDismiss: (id: string) => Promise<void>;
  onAction: (
    id: string,
    action: string,
    data?: Record<string, unknown>
  ) => Promise<boolean>;
}

export function NotificationGroup({
  groupKey,
  notifications,
  onMarkRead,
  onDismiss,
  onAction,
}: NotificationGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const isTrade = groupKey.startsWith("trade-");
  const Icon = isTrade ? Handshake : Tag;

  // Sort by most recent
  const sortedNotifications = [...notifications].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="rounded-xl border border-white/10 overflow-hidden">
      {/* Group Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-colors",
          unreadCount > 0 && "border-l-2 border-l-[rgb(163,255,18)]"
        )}
      >
        <div className="flex items-center gap-3">
          <Icon
            className={cn(
              "w-5 h-5",
              isTrade ? "text-purple-400" : "text-blue-400"
            )}
          />
          <div className="text-left">
            <h3 className="text-white font-medium text-sm">
              {isTrade ? "Trade Activity" : "Offer Activity"}
            </h3>
            <p className="text-white/60 text-xs">
              {notifications.length} notifications
              {unreadCount > 0 && (
                <span className="text-[rgb(163,255,18)] ml-2">
                  ({unreadCount} unread)
                </span>
              )}
            </p>
          </div>
        </div>

        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-white/40" />
        ) : (
          <ChevronDown className="w-5 h-5 text-white/40" />
        )}
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-2 p-4 bg-black/20"
          >
            {sortedNotifications.map((notification, index) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                index={index}
                onMarkRead={onMarkRead}
                onDismiss={onDismiss}
                onAction={onAction}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
