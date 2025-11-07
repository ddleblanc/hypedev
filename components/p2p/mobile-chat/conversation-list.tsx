'use client';

import { motion } from 'framer-motion';
import { MessageCircle, TrendingUp, TrendingDown, Clock, CheckCheck } from 'lucide-react';
import { useP2PChat } from '@/hooks/use-p2p-chat';

interface ConversationListProps {
  onSelectConversation: (traderAddress: string, tradeId: string | null) => void;
}

export function ConversationList({ onSelectConversation }: ConversationListProps) {
  const { conversations, isLoadingConversations } = useP2PChat();

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'PENDING':
        return 'text-yellow-500/70';
      case 'AGREED':
      case 'FINALIZED':
        return 'text-[rgb(163,255,18)]';
      case 'REJECTED':
      case 'CANCELLED':
        return 'text-red-500/70';
      default:
        return 'text-white/40';
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-3 h-3" />;
      case 'AGREED':
      case 'FINALIZED':
        return <CheckCheck className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (isLoadingConversations) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-xl bg-black/40 border border-white/10 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-20 h-20 rounded-full bg-black/40 border border-white/10 flex items-center justify-center mb-4"
        >
          <MessageCircle className="w-10 h-10 text-white/20" />
        </motion.div>
        <h3 className="text-white text-lg font-semibold mb-2">No conversations yet</h3>
        <p className="text-white/40 text-sm text-center max-w-xs">
          Start browsing collections or traders to begin your first trade
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {conversations.map((conversation, index) => (
        <motion.button
          key={conversation.traderAddress}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          onClick={() => onSelectConversation(conversation.traderAddress, conversation.tradeId)}
          className="w-full group relative"
        >
          <div className="relative rounded-xl bg-black/40 hover:bg-black/60 border border-white/10 hover:border-[rgb(163,255,18)]/30 p-4 transition-all duration-300">
            {/* Unread Badge */}
            {conversation.unreadCount > 0 && (
              <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[rgb(163,255,18)] flex items-center justify-center">
                <span className="text-black text-xs font-bold">{conversation.unreadCount}</span>
              </div>
            )}

            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-white font-semibold group-hover:border-[rgb(163,255,18)]/30 transition-colors">
                {conversation.traderName
                  ? conversation.traderName.slice(0, 2).toUpperCase()
                  : conversation.traderAddress.slice(0, 2).toUpperCase()}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Top Row */}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="text-white font-semibold text-sm truncate">
                    {conversation.traderName ||
                      `${conversation.traderAddress.slice(0, 6)}...${conversation.traderAddress.slice(-4)}`}
                  </h3>
                  <span className="text-white/40 text-xs flex-shrink-0">
                    {formatTime(conversation.lastMessageTime)}
                  </span>
                </div>

                {/* Last Message */}
                <p className="text-white/60 text-sm truncate mb-2">{conversation.lastMessage}</p>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  {/* Trade Status */}
                  {conversation.tradeStatus && (
                    <div
                      className={`flex items-center gap-1.5 text-xs ${getStatusColor(conversation.tradeStatus)}`}
                    >
                      {getStatusIcon(conversation.tradeStatus)}
                      <span className="capitalize">{conversation.tradeStatus.toLowerCase()}</span>
                    </div>
                  )}

                  {/* Active Trades Count */}
                  {conversation.activeTrades > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-white/40">
                      <TrendingUp className="w-3 h-3" />
                      <span>{conversation.activeTrades} active</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
