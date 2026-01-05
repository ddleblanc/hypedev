'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Wifi, WifiOff, ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChat, ChatTab } from '@/contexts/chat-context';
import { useChatStream } from '@/hooks/use-chat-stream';
import { useClanChat } from '@/hooks/use-clan-chat';
import { WorldTab } from './world-tab';
import { ClanTab } from './clan-tab';
import { WhispersTab } from './whispers-tab';

const TABS: { id: ChatTab; label: string; color: string }[] = [
  { id: 'world', label: 'World', color: 'text-amber-400' },
  { id: 'clan', label: 'Clan', color: 'text-emerald-400' },
  { id: 'whispers', label: 'Whispers', color: 'text-purple-400' },
];

interface InlineChatPanelProps {
  className?: string;
}

export function InlineChatPanel({ className }: InlineChatPanelProps) {
  const {
    isOpen,
    activeTab,
    connectionStatus,
    clanConnectionStatus,
    setOpen,
    setTab,
    unreadCounts,
  } = useChat();

  const { sendMessage: sendClanMessage, isSending: isClanSending, clanInfo } = useClanChat();

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');

  // Connect to world chat stream
  useChatStream();

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    // Delay adding listener to avoid immediate close from the focus event
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, setOpen]);

  const totalUnread = unreadCounts.world + unreadCounts.clan + unreadCounts.whispers;

  const handleInputFocus = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    if (activeTab === 'clan' && clanInfo) {
      const message = inputValue;
      setInputValue('');
      await sendClanMessage(message);
      inputRef.current?.focus();
    }
    // World and Whispers don't have send functionality yet
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Determine if input should be functional (not read-only)
  const isInputFunctional = isOpen && activeTab === 'clan' && clanInfo;
  const isSending = activeTab === 'clan' && isClanSending;

  // Get connection status for current tab
  const currentConnectionStatus = activeTab === 'clan' ? clanConnectionStatus : connectionStatus;

  // Get placeholder text based on active tab
  const getPlaceholderText = () => {
    if (!isOpen) {
      return 'Chat...';
    }
    switch (activeTab) {
      case 'world':
        return 'World chat is read-only...';
      case 'clan':
        return 'Message your clan...';
      case 'whispers':
        return 'Select a conversation...';
      default:
        return 'Chat...';
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Messages area - absolute positioned overlay that expands upward */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 right-0 mb-1 z-10"
          >
            <div className="h-[280px] bg-black/70 backdrop-blur-md rounded-lg border border-white/10 overflow-hidden flex flex-col">
              {/* Header with tabs and collapse button */}
              <div className="flex-shrink-0 flex items-center justify-between px-2 py-1.5 border-b border-white/10 bg-black/30">
                {/* Tabs */}
                <div className="flex items-center gap-0.5">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setTab(tab.id)}
                      className={cn(
                        "relative px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide transition-all",
                        activeTab === tab.id
                          ? `bg-white/10 ${tab.color}`
                          : "text-white/40 hover:text-white/60 hover:bg-white/5"
                      )}
                    >
                      {tab.label}
                      {unreadCounts[tab.id] > 0 && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">
                          {unreadCounts[tab.id] > 9 ? '9+' : unreadCounts[tab.id]}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Status and close */}
                <div className="flex items-center gap-1.5">
                  <div className={cn(
                    "flex items-center gap-1 text-[9px]",
                    currentConnectionStatus === 'connected' && "text-emerald-400",
                    currentConnectionStatus === 'connecting' && "text-amber-400",
                    currentConnectionStatus === 'disconnected' && "text-red-400"
                  )}>
                    {currentConnectionStatus === 'connected' ? (
                      <Wifi className="w-2.5 h-2.5" />
                    ) : (
                      <WifiOff className="w-2.5 h-2.5" />
                    )}
                  </div>
                  <button
                    onClick={handleClose}
                    className="w-5 h-5 rounded flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                {activeTab === 'world' && <WorldTab />}
                {activeTab === 'clan' && <ClanTab />}
                {activeTab === 'whispers' && <WhispersTab />}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar - always visible, stays in place */}
      <div
        className={cn(
          "relative flex items-center gap-2 px-3 py-2 bg-black/40 backdrop-blur-md border rounded-lg transition-colors duration-150",
          isOpen
            ? "border-[rgb(163,255,18)]/30"
            : "border-white/10 hover:border-white/20"
        )}
      >
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => isInputFunctional && setInputValue(e.target.value)}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={getPlaceholderText()}
          readOnly={!isInputFunctional}
          maxLength={500}
          disabled={isSending}
          className={cn(
            "flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none",
            isInputFunctional ? "cursor-text" : "cursor-pointer"
          )}
        />

        {/* Send button - only show when input has content and is functional */}
        {isInputFunctional && inputValue.trim() && (
          <button
            onClick={handleSend}
            disabled={isSending}
            className={cn(
              "p-1.5 rounded-md bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isSending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        )}

        {/* Unread badge when collapsed */}
        {!isOpen && totalUnread > 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-red-500/80 text-white text-[10px] font-bold">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}

        {/* Connection dot */}
        <div className={cn(
          "w-2 h-2 rounded-full flex-shrink-0",
          currentConnectionStatus === 'connected' && "bg-emerald-400",
          currentConnectionStatus === 'connecting' && "bg-amber-400 animate-pulse",
          currentConnectionStatus === 'disconnected' && "bg-red-400"
        )} />

        {/* Expand indicator when collapsed */}
        {!isOpen && (
          <ChevronDown className="w-3.5 h-3.5 text-white/40 rotate-180" />
        )}
      </div>
    </div>
  );
}
