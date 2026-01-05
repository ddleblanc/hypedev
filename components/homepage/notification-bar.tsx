"use client";

import React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Bell, ChevronRight, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/use-notifications";

export function NotificationBar() {
  const router = useRouter();
  const { notifications, unreadCount, hasUrgent, isLoading } = useNotifications({ enabled: true });

  // Get the most recent unread notification for preview
  const latestNotification = notifications.find(n => !n.isRead && !n.isDismissed);

  const handleClick = () => {
    router.push('/control-center');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4 }}
      onClick={handleClick}
      className="cursor-pointer group"
    >
      <div className={cn(
        "relative overflow-hidden rounded-xl border backdrop-blur-xl transition-all duration-300",
        hasUrgent
          ? "bg-red-500/10 border-red-500/30 hover:border-red-500/50"
          : unreadCount > 0
            ? "bg-[rgb(163,255,18)]/5 border-[rgb(163,255,18)]/20 hover:border-[rgb(163,255,18)]/40"
            : "bg-black/30 border-white/10 hover:border-white/20"
      )}>
        {/* Animated glow effect for urgent notifications */}
        {hasUrgent && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/10 to-red-500/0"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        )}

        <div className="relative flex items-center gap-3 px-4 py-3">
          {/* Bell Icon with Badge */}
          <div className="relative flex-shrink-0">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300",
              hasUrgent
                ? "bg-red-500/20"
                : unreadCount > 0
                  ? "bg-[rgb(163,255,18)]/10"
                  : "bg-white/5"
            )}>
              <Bell className={cn(
                "w-5 h-5 transition-colors",
                hasUrgent
                  ? "text-red-400"
                  : unreadCount > 0
                    ? "text-[rgb(163,255,18)]"
                    : "text-white/60"
              )} />
            </div>

            {/* Count Badge */}
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={cn(
                  "absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold flex items-center justify-center",
                  hasUrgent
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-[rgb(163,255,18)] text-black"
                )}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </motion.span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
              </div>
            ) : unreadCount > 0 && latestNotification ? (
              <>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={cn(
                    "text-xs font-bold uppercase tracking-wider",
                    hasUrgent ? "text-red-400" : "text-[rgb(163,255,18)]"
                  )}>
                    {hasUrgent ? "Urgent" : "New"}
                  </span>
                  {hasUrgent && (
                    <Zap className="w-3 h-3 text-red-400 animate-pulse" />
                  )}
                </div>
                <p className="text-white text-sm font-medium truncate">
                  {latestNotification.title}
                </p>
                {latestNotification.message && (
                  <p className="text-white/60 text-xs truncate">
                    {latestNotification.message}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-white/40" />
                <span className="text-white/60 text-sm">All caught up!</span>
              </div>
            )}
          </div>

          {/* Arrow indicator */}
          <div className="flex-shrink-0 flex items-center gap-2">
            {unreadCount > 1 && (
              <span className="text-white/40 text-xs">
                +{unreadCount - 1} more
              </span>
            )}
            <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white/70 group-hover:translate-x-1 transition-all duration-300" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
