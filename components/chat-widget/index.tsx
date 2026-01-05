'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Minus, X, Maximize2, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChat, ChatTab } from '@/contexts/chat-context';
import { useChatStream } from '@/hooks/use-chat-stream';
import { WorldTab } from './world-tab';
import { ClanTab } from './clan-tab';
import { WhispersTab } from './whispers-tab';

const TABS: { id: ChatTab; label: string; color: string }[] = [
  { id: 'world', label: 'World', color: 'text-amber-400' },
  { id: 'clan', label: 'Clan', color: 'text-emerald-400' },
  { id: 'whispers', label: 'Whispers', color: 'text-purple-400' },
];

// Accessibility labels for connection status
const CONNECTION_STATUS_LABELS: Record<string, string> = {
  connected: 'Connected to chat server',
  connecting: 'Connecting to chat server',
  disconnected: 'Disconnected from chat server',
};

export function ChatWidget() {
  const {
    isOpen,
    isMinimized,
    activeTab,
    unreadCounts,
    connectionStatus,
    toggleOpen,
    toggleMinimize,
    setTab,
    setOpen,
  } = useChat();

  const widgetRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<ChatTab, HTMLButtonElement | null>>({
    world: null,
    clan: null,
    whispers: null,
  });

  // Connect to chat stream
  useChatStream();

  const totalUnread = unreadCounts.world + unreadCounts.clan + unreadCounts.whispers;

  // Keyboard navigation for tabs
  const handleTabKeyDown = useCallback((e: React.KeyboardEvent, currentTab: ChatTab) => {
    const tabOrder: ChatTab[] = ['world', 'clan', 'whispers'];
    const currentIndex = tabOrder.indexOf(currentTab);

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % tabOrder.length;
      const nextTab = tabOrder[nextIndex];
      setTab(nextTab);
      tabRefs.current[nextTab]?.focus();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + tabOrder.length) % tabOrder.length;
      const prevTab = tabOrder[prevIndex];
      setTab(prevTab);
      tabRefs.current[prevTab]?.focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    }
  }, [setTab, setOpen]);

  // Global keyboard shortcut to open chat
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      const target = e.target as HTMLElement;
      const isInInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Ctrl+Shift+C to toggle chat
      if (e.ctrlKey && e.shiftKey && e.key === 'C' && !isInInput) {
        e.preventDefault();
        toggleOpen();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [toggleOpen]);

  // Minimized state - just an icon (hidden on mobile - mobile uses MobileActionBar)
  if (!isOpen) {
    return (
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleOpen}
        aria-label={`Open chat${totalUnread > 0 ? `. ${totalUnread} unread messages` : ''}`}
        aria-expanded={false}
        className={cn(
          // Hidden on mobile - mobile uses MobileActionBar with fullscreen overlay
          "hidden md:flex",
          "fixed z-[60] w-12 h-12 rounded-full items-center justify-center shadow-lg transition-all",
          "bg-gradient-to-br from-[rgb(163,255,18)]/20 to-black/80 backdrop-blur-md",
          "border-2 border-[rgb(163,255,18)]/50 hover:border-[rgb(163,255,18)]",
          "hover:shadow-[0_0_20px_rgba(163,255,18,0.3)]",
          // Touch target size for accessibility (min 44x44)
          "min-w-[44px] min-h-[44px]",
          // Position: offset from corner to avoid Next.js dev indicator
          "left-20",
          // Desktop position
          "bottom-4"
        )}
      >
        <MessageSquare className="w-5 h-5 text-[rgb(163,255,18)]" aria-hidden="true" />
        {totalUnread > 0 && (
          <span
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center"
            aria-hidden="true"
          >
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </motion.button>
    );
  }

  return (
    <motion.div
      ref={widgetRef}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      role="region"
      aria-label="Chat widget"
      className={cn(
        // Hidden on mobile - mobile uses MobileActionBar with fullscreen overlay
        "hidden md:flex md:flex-col",
        "fixed z-[60] w-[360px] bg-black/90 backdrop-blur-md rounded-xl overflow-hidden shadow-2xl",
        "border-2 border-[rgb(163,255,18)]/30",
        // Position: offset from corner to avoid Next.js dev indicator
        "left-20",
        // Desktop position
        "bottom-4",
        isMinimized ? "h-auto" : "h-[400px]"
      )}
    >
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-b border-white/10 bg-black/50">
        {/* Tabs */}
        <div role="tablist" aria-label="Chat channels" className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              ref={(el) => { tabRefs.current[tab.id] = el; }}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`${tab.id}-panel`}
              id={`${tab.id}-tab`}
              tabIndex={activeTab === tab.id ? 0 : -1}
              onClick={() => setTab(tab.id)}
              onKeyDown={(e) => handleTabKeyDown(e, tab.id)}
              className={cn(
                "relative px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all",
                // Touch target size
                "min-h-[32px]",
                activeTab === tab.id
                  ? `bg-white/10 ${tab.color}`
                  : "text-white/50 hover:text-white/80 hover:bg-white/5"
              )}
            >
              {tab.label}
              {unreadCounts[tab.id] > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center"
                  aria-label={`${unreadCounts[tab.id]} unread`}
                >
                  {unreadCounts[tab.id] > 9 ? '9+' : unreadCounts[tab.id]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          {/* Connection status */}
          <div
            className={cn(
              "w-6 h-6 rounded flex items-center justify-center",
              connectionStatus === 'connected' && "text-emerald-400",
              connectionStatus === 'connecting' && "text-amber-400 animate-pulse",
              connectionStatus === 'disconnected' && "text-red-400"
            )}
            role="status"
            aria-label={CONNECTION_STATUS_LABELS[connectionStatus]}
          >
            {connectionStatus === 'connected' ? (
              <Wifi className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <WifiOff className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </div>

          <button
            onClick={toggleMinimize}
            aria-label={isMinimized ? 'Expand chat' : 'Minimize chat'}
            aria-expanded={!isMinimized}
            className="w-6 h-6 rounded flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px]"
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" /> : <Minus className="w-3.5 h-3.5" aria-hidden="true" />}
          </button>

          <button
            onClick={() => setOpen(false)}
            aria-label="Close chat"
            className="w-6 h-6 rounded flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px]"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Content - Tab panels */}
      <AnimatePresence mode="wait">
        {!isMinimized && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex-1 overflow-hidden flex flex-col"
          >
            <div
              role="tabpanel"
              id={`${activeTab}-panel`}
              aria-labelledby={`${activeTab}-tab`}
              tabIndex={0}
              className="flex-1 overflow-hidden flex flex-col"
            >
              {activeTab === 'world' && <WorldTab />}
              {activeTab === 'clan' && <ClanTab />}
              {activeTab === 'whispers' && <WhispersTab />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Screen reader announcements for new messages */}
      <div
        role="log"
        aria-live="polite"
        aria-atomic="false"
        className="sr-only"
      >
        {totalUnread > 0 && `${totalUnread} new messages`}
      </div>
    </motion.div>
  );
}
