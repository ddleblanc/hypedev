'use client';

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ShoppingCart, Package, Trophy, Radio, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChat, WorldMessage } from '@/contexts/chat-context';
import { formatDistanceToNow } from 'date-fns';

const MESSAGE_ICONS: Record<WorldMessage['type'], React.ReactNode> = {
  sale: <ShoppingCart className="w-3.5 h-3.5 text-green-400" />,
  listing: <Package className="w-3.5 h-3.5 text-blue-400" />,
  lootbox: <Sparkles className="w-3.5 h-3.5 text-purple-400" />,
  achievement: <Trophy className="w-3.5 h-3.5 text-amber-400" />,
  tournament: <Radio className="w-3.5 h-3.5 text-red-400" />,
  system: <AlertCircle className="w-3.5 h-3.5 text-white/60" />,
};

const MESSAGE_COLORS: Record<WorldMessage['type'], string> = {
  sale: 'text-green-400',
  listing: 'text-blue-400',
  lootbox: 'text-purple-400',
  achievement: 'text-amber-400',
  tournament: 'text-red-400',
  system: 'text-white/60',
};

export function WorldTab() {
  const { worldMessages, connectionStatus } = useChat();
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef(true);

  // Auto-scroll to top on new messages (newest at top)
  useEffect(() => {
    if (shouldScrollRef.current && containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [worldMessages]);

  // Handle scroll to disable auto-scroll when user scrolls down
  const handleScroll = () => {
    if (containerRef.current) {
      shouldScrollRef.current = containerRef.current.scrollTop < 50;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages - newest at top */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
      >
        {worldMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <Radio className="w-8 h-8 text-white/20 mb-2" />
            <p className="text-white/40 text-xs">
              {connectionStatus === 'connected'
                ? 'Listening for world events...'
                : connectionStatus === 'connecting'
                  ? 'Connecting...'
                  : 'Disconnected'}
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {worldMessages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-start gap-2 py-1.5 px-2 rounded-lg hover:bg-white/5 transition-colors group"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {MESSAGE_ICONS[message.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/90 text-xs leading-relaxed break-words">
                    <span className={cn("font-medium", MESSAGE_COLORS[message.type])}>
                      [{message.type.toUpperCase()}]
                    </span>{' '}
                    {message.content}
                  </p>
                  <p className="text-white/30 text-[10px] mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer info */}
      <div className="flex-shrink-0 px-3 py-2 border-t border-white/5 text-[10px] text-white/30 text-center">
        World channel is read-only
      </div>
    </div>
  );
}
