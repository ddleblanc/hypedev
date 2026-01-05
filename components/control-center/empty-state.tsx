"use client";

import { Inbox } from "lucide-react";
import { motion } from "framer-motion";

interface EmptyStateProps {
  activeTab: string;
}

const messages: Record<string, { title: string; description: string }> = {
  all: {
    title: "You're all caught up!",
    description:
      "No new notifications. Check back later for updates on your activity.",
  },
  urgent: {
    title: "No urgent notifications",
    description: "Nothing requires your immediate attention right now.",
  },
  offers: {
    title: "No offer notifications",
    description:
      "You'll see notifications here when someone makes or responds to offers.",
  },
  trades: {
    title: "No trade notifications",
    description: "Trade requests and updates will appear here.",
  },
  social: {
    title: "No social activity",
    description: "New followers and social interactions will show up here.",
  },
  marketplace: {
    title: "No marketplace activity",
    description: "Sales, purchases, and auction updates will appear here.",
  },
};

export function EmptyState({ activeTab }: EmptyStateProps) {
  const { title, description } = messages[activeTab] || messages.all;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
        <Inbox className="w-10 h-10 text-white/20" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-white/60 text-sm max-w-md">{description}</p>
    </motion.div>
  );
}
