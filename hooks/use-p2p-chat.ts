'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWalletAuthOptimized } from './use-wallet-auth-optimized';

interface Message {
  id: string;
  tradeId: string | null;
  userId: string;
  message: string;
  messageType: 'TEXT' | 'SYSTEM' | 'COUNTEROFFER' | 'ACCEPTANCE' | 'REJECTION';
  metadata: any;
  createdAt: string;
  user: {
    username: string | null;
    walletAddress: string;
  };
}

interface Conversation {
  traderAddress: string;
  traderName: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  tradeId: string | null;
  tradeStatus: string | null;
  activeTrades: number;
}

interface UseP2PChatOptions {
  traderAddress?: string;
  tradeId?: string;
  enablePolling?: boolean;
  pollingInterval?: number;
}

export function useP2PChat(options: UseP2PChatOptions = {}) {
  const { traderAddress, tradeId, enablePolling = false, pollingInterval = 5000 } = options;
  const { user } = useWalletAuthOptimized();

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!user?.walletAddress) return;

    try {
      setIsLoadingConversations(true);
      setError(null);

      const response = await fetch(`/api/p2p/messages?userAddress=${user.walletAddress}`);
      const data = await response.json();

      if (data.success && data.data) {
        // Transform messages into conversations
        const conversationsMap = new Map<string, Conversation>();

        data.data.messages?.forEach((msg: Message) => {
          const otherUser = msg.user.walletAddress === user.walletAddress
            ? msg.metadata?.counterpartyAddress
            : msg.user.walletAddress;

          const otherUsername = msg.user.walletAddress === user.walletAddress
            ? msg.metadata?.counterpartyUsername
            : msg.user.username;

          if (!otherUser) return;

          const existing = conversationsMap.get(otherUser);
          if (!existing || new Date(msg.createdAt) > new Date(existing.lastMessageTime)) {
            conversationsMap.set(otherUser, {
              traderAddress: otherUser,
              traderName: otherUsername || null,
              lastMessage: msg.message,
              lastMessageTime: msg.createdAt,
              unreadCount: 0, // TODO: Implement unread tracking
              tradeId: msg.tradeId,
              tradeStatus: msg.metadata?.tradeStatus || null,
              activeTrades: existing?.activeTrades || 1,
            });
          }
        });

        const conversationsList = Array.from(conversationsMap.values()).sort(
          (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
        );

        setConversations(conversationsList);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setIsLoadingConversations(false);
    }
  }, [user?.walletAddress]);

  // Load messages for a specific conversation
  const loadMessages = useCallback(async () => {
    if (!user?.walletAddress || (!traderAddress && !tradeId)) return;

    try {
      setIsLoadingMessages(true);
      setError(null);

      let url = `/api/p2p/messages?userAddress=${user.walletAddress}`;
      if (tradeId) {
        url += `&tradeId=${tradeId}`;
      } else if (traderAddress) {
        url += `&partnerAddress=${traderAddress}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success && data.data?.messages) {
        setMessages(data.data.messages);
        if (data.data.messages.length > 0) {
          lastMessageIdRef.current = data.data.messages[data.data.messages.length - 1].id;
        }
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
      setError('Failed to load messages');
    } finally {
      setIsLoadingMessages(false);
    }
  }, [user?.walletAddress, traderAddress, tradeId]);

  // Send message
  const sendMessage = useCallback(async (messageText: string, messageType: Message['messageType'] = 'TEXT') => {
    if (!user?.walletAddress || !tradeId || !messageText.trim()) return;

    try {
      setIsSending(true);
      setError(null);

      const response = await fetch('/api/p2p/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tradeId,
          userId: user.id,
          message: messageText.trim(),
          messageType,
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        // Add new message to local state
        setMessages((prev) => [...prev, data.data]);
        lastMessageIdRef.current = data.data.id;
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to send message');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message');
      throw err;
    } finally {
      setIsSending(false);
    }
  }, [user?.walletAddress, user?.id, tradeId]);

  // Set up polling for new messages
  useEffect(() => {
    if (!enablePolling || (!traderAddress && !tradeId)) return;

    const poll = async () => {
      if (!user?.walletAddress) return;

      try {
        let url = `/api/p2p/messages?userAddress=${user.walletAddress}`;
        if (tradeId) {
          url += `&tradeId=${tradeId}`;
        } else if (traderAddress) {
          url += `&partnerAddress=${traderAddress}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (data.success && data.data?.messages) {
          const newMessages = data.data.messages;
          if (newMessages.length > messages.length) {
            const lastKnownId = lastMessageIdRef.current;
            const hasNewMessages = lastKnownId
              ? newMessages.some((msg: Message) => msg.id !== lastKnownId && new Date(msg.createdAt) > new Date(messages[messages.length - 1]?.createdAt || 0))
              : newMessages.length > 0;

            if (hasNewMessages) {
              setMessages(newMessages);
              lastMessageIdRef.current = newMessages[newMessages.length - 1]?.id;
            }
          }
        }
      } catch (err) {
        // Silent fail for polling
        console.error('Polling error:', err);
      }
    };

    // Initial poll
    poll();

    // Set up interval
    pollingRef.current = setInterval(poll, pollingInterval);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [enablePolling, traderAddress, tradeId, user?.walletAddress, messages.length, pollingInterval]);

  // Load initial data
  useEffect(() => {
    if (traderAddress || tradeId) {
      loadMessages();
    } else {
      loadConversations();
    }
  }, [traderAddress, tradeId, loadMessages, loadConversations]);

  return {
    messages,
    conversations,
    isLoadingMessages,
    isLoadingConversations,
    isSending,
    error,
    sendMessage,
    loadMessages,
    loadConversations,
    refreshMessages: loadMessages,
    refreshConversations: loadConversations,
  };
}
