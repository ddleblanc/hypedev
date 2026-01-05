'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClanChat } from '@/hooks/use-clan-chat';

export function ClanTab() {
  const {
    messages,
    isConnected,
    isLoading,
    clanInfo,
  } = useClanChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto-scroll to bottom on new messages if user is at bottom
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  // Detect if user scrolled up
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setAutoScroll(isAtBottom);
  };

  // No clan state
  if (!isLoading && !clanInfo) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <Users className="w-12 h-12 text-emerald-400/50 mb-4" />
        <h3 className="text-white font-semibold mb-2">No Clan</h3>
        <p className="text-sm text-white/50 mb-4">
          Join or create a clan to chat with members
        </p>
        <button className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 transition-colors">
          Find Clans
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Clan header */}
      {clanInfo && (
        <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold text-xs">
              [{clanInfo.tag}]
            </span>
            <span className="text-white/80 text-sm truncate max-w-[150px]">
              {clanInfo.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="w-3 h-3 text-emerald-400" />
            ) : (
              <WifiOff className="w-3 h-3 text-red-400" />
            )}
            <span className="text-white/40 text-xs">
              {clanInfo.memberCount} members
            </span>
          </div>
        </div>
      )}

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-white/10 min-h-0"
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-white/30 text-sm">
            No messages yet. Say hello!
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  'text-sm',
                  message.isSystem && 'text-center py-1'
                )}
              >
                {message.isSystem ? (
                  <span className="text-emerald-400/60 italic text-xs">
                    {message.content}
                  </span>
                ) : (
                  <div className="flex items-start gap-1.5 py-0.5">
                    <span className="text-emerald-400 font-medium shrink-0 text-xs">
                      [{clanInfo?.tag}]
                    </span>
                    <span className="text-white/90 font-medium shrink-0">
                      {message.sender.username || message.sender.walletAddress?.slice(0, 6)}:
                    </span>
                    <span className="text-white/70 break-words">
                      {message.content}
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
