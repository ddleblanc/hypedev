'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2 } from 'lucide-react';
import { useP2PChat } from '@/hooks/use-p2p-chat';
import { useWalletAuthOptimized } from '@/hooks/use-wallet-auth-optimized';
import { ChatHeader } from './chat-header';
import { TradeContextCard } from './trade-context-card';

interface NFT {
  id: string;
  tokenId: string;
  name: string;
  image: string;
  collection?: {
    name: string;
  };
}

interface ChatViewProps {
  traderAddress: string;
  traderName: string | null;
  tradeId: string | null;
  tradeStatus: string | null;
  userNFTs?: NFT[];
  traderNFTs?: NFT[];
  onBack: () => void;
  onViewFullTrade?: () => void;
}

export function ChatView({
  traderAddress,
  traderName,
  tradeId,
  tradeStatus,
  userNFTs = [],
  traderNFTs = [],
  onBack,
  onViewFullTrade,
}: ChatViewProps) {
  const { user } = useWalletAuthOptimized();
  const {
    messages,
    isLoadingMessages,
    isSending,
    sendMessage,
  } = useP2PChat({
    traderAddress,
    tradeId: tradeId || undefined,
    enablePolling: true,
  });

  const [messageText, setMessageText] = useState('');
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Detect keyboard open/close (approximate)
  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        const viewportHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        setIsKeyboardOpen(viewportHeight < windowHeight * 0.75);
      }
    };

    window.visualViewport?.addEventListener('resize', handleResize);
    return () => window.visualViewport?.removeEventListener('resize', handleResize);
  }, []);

  const handleSend = async () => {
    if (!messageText.trim() || isSending || !tradeId) return;

    try {
      await sendMessage(messageText.trim());
      setMessageText('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateHeader = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const groupMessagesByDate = () => {
    const groups: { date: string; messages: typeof messages }[] = [];
    let currentDate = '';

    messages.forEach((message) => {
      const messageDate = new Date(message.createdAt).toDateString();
      if (messageDate !== currentDate) {
        currentDate = messageDate;
        groups.push({ date: message.createdAt, messages: [] });
      }
      groups[groups.length - 1].messages.push(message);
    });

    return groups;
  };

  const messageGroups = groupMessagesByDate();

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Chat Header */}
      <ChatHeader
        traderName={traderName}
        traderAddress={traderAddress}
        tradeStatus={tradeStatus}
        onBack={onBack}
        onViewTrade={onViewFullTrade}
      />

      {/* Messages Container */}
      <div
        className={`flex-1 overflow-y-auto px-4 py-4 ${
          isKeyboardOpen ? 'pb-2' : 'pb-4'
        }`}
        style={{ marginTop: '120px', marginBottom: isKeyboardOpen ? '64px' : userNFTs.length > 0 ? '200px' : '64px' }}
      >
        {isLoadingMessages ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-white/40 text-sm text-center">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          <>
            {messageGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-3 mb-6">
                {/* Date Header */}
                <div className="flex items-center justify-center my-4">
                  <div className="px-3 py-1 rounded-full bg-black/40 border border-white/10">
                    <span className="text-white/40 text-xs">{formatDateHeader(group.date)}</span>
                  </div>
                </div>

                {/* Messages */}
                {group.messages.map((message, index) => {
                  const isOwnMessage = message.userId === user?.id;
                  const isSystemMessage = message.messageType === 'SYSTEM';

                  if (isSystemMessage) {
                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex justify-center my-2"
                      >
                        <div className="px-3 py-2 rounded-lg bg-black/40 border border-white/10 max-w-[80%]">
                          <p className="text-white/60 text-xs text-center">{message.message}</p>
                        </div>
                      </motion.div>
                    );
                  }

                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, x: isOwnMessage ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.02 }}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[75%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                        <div
                          className={`px-4 py-2 rounded-2xl ${
                            isOwnMessage
                              ? 'bg-[rgb(163,255,18)]/10 border border-[rgb(163,255,18)]/30 rounded-br-sm'
                              : 'bg-black/40 border border-white/10 rounded-bl-sm'
                          }`}
                        >
                          <p className={`text-sm ${isOwnMessage ? 'text-white' : 'text-white/90'}`}>
                            {message.message}
                          </p>
                        </div>
                        <span className="text-white/30 text-xs px-2">
                          {formatMessageTime(message.createdAt)}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Trade Context Card (if trade exists) */}
      {!isKeyboardOpen && userNFTs.length > 0 && traderNFTs.length > 0 && (
        <div className="fixed bottom-[64px] left-0 right-0 z-30">
          <TradeContextCard
            userNFTs={userNFTs}
            traderNFTs={traderNFTs}
            tradeStatus={tradeStatus}
            isKeyboardOpen={isKeyboardOpen}
            onViewFullTrade={onViewFullTrade}
          />
        </div>
      )}

      {/* Message Input */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-2xl border-t border-white/10 px-4 py-3 pb-safe-or-3">
        <div className="flex items-end gap-2">
          <input
            ref={inputRef}
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={isSending || !tradeId}
            className="flex-1 px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-[rgb(163,255,18)]/30 text-white placeholder-white/40 text-sm outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSend}
            disabled={!messageText.trim() || isSending || !tradeId}
            className="flex-shrink-0 w-12 h-12 rounded-xl bg-[rgb(163,255,18)]/10 hover:bg-[rgb(163,255,18)]/20 border border-[rgb(163,255,18)]/30 hover:border-[rgb(163,255,18)]/50 flex items-center justify-center text-[rgb(163,255,18)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
