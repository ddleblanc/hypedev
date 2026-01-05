'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useActiveAccount } from 'thirdweb/react';

export interface AttachedNftData {
  id: string;
  name: string;
  image: string;
  tokenId: string;
  collectionId: string;
  ownerAddress?: string | null;
  rarityTier?: string | null;
  listingPrice?: number | null;
  collection?: {
    name: string;
    symbol: string;
    image?: string | null;
    floorPrice?: number | null;
  } | null;
}

export interface WhisperMessage {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    username: string | null;
    avatar: string | null;
    walletAddress?: string;
  };
  attachedNft?: AttachedNftData | null;
}

export interface Friend {
  id: string;
  username: string | null;
  avatar: string | null;
  walletAddress: string;
}

export interface Conversation {
  id: string;
  friend: {
    id: string;
    username: string | null;
    avatar: string | null;
    walletAddress: string;
  } | null;
  lastMessage: {
    content: string;
    senderId: string;
    senderName: string | null;
    createdAt: string;
  } | null;
  unreadCount: number;
}

export function useWhispers() {
  const account = useActiveAccount();
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<WhisperMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);

  const utils = trpc.useUtils();

  // Fetch friends list
  const { data: friends = [], isLoading: loadingFriends } =
    trpc.whispers.getFriends.useQuery(undefined, {
      enabled: !!account?.address,
    });

  // Fetch conversations
  const { data: conversations = [], isLoading: loadingConversations } =
    trpc.whispers.getConversations.useQuery(undefined, {
      enabled: !!account?.address,
    });

  // Fetch messages for active conversation
  const { data: messageData, isLoading: loadingMessages } =
    trpc.whispers.getMessages.useQuery(
      { conversationId: activeConversation!, limit: 50 },
      { enabled: !!activeConversation && !!account?.address }
    );

  // Mutations
  const sendMutation = trpc.whispers.send.useMutation({
    onSuccess: (newMessage) => {
      // Add the sent message to the local state
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });
      // Refetch conversations to update last message
      utils.whispers.getConversations.invalidate();
    },
  });

  const startConversationMutation = trpc.whispers.startConversation.useMutation({
    onSuccess: (data) => {
      setActiveConversation(data.conversationId);
      utils.whispers.getConversations.invalidate();
    },
  });

  const markReadMutation = trpc.whispers.markRead.useMutation({
    onSuccess: () => {
      utils.whispers.getConversations.invalidate();
    },
  });

  // Load messages when conversation changes
  useEffect(() => {
    if (messageData?.messages) {
      setMessages(messageData.messages);
    }
  }, [messageData]);

  // SSE connection
  const connect = useCallback(() => {
    if (!account?.address) return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const url = `/api/chat/whispers/stream?wallet=${encodeURIComponent(account.address)}`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      reconnectAttempts.current = 0;
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'connected') {
          return; // Initial connection message
        }

        if (data.type === 'new_whisper' && data.message) {
          // Add message if it's for the active conversation
          if (data.conversationId === activeConversation) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === data.message.id)) {
                return prev;
              }
              return [...prev, data.message];
            });
          }

          // Refresh conversation list to update unread counts
          utils.whispers.getConversations.invalidate();
        }
      } catch {
        // Invalid JSON, ignore
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();
      eventSourceRef.current = null;

      // Exponential backoff reconnect
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
      reconnectAttempts.current++;

      reconnectTimeoutRef.current = setTimeout(connect, delay);
    };
  }, [account?.address, activeConversation, utils]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // Connect when account is available
  useEffect(() => {
    if (account?.address) {
      connect();
    }
    return () => disconnect();
  }, [account?.address, connect, disconnect]);

  // Mark conversation as read when opened
  useEffect(() => {
    if (activeConversation && account?.address) {
      markReadMutation.mutate({ conversationId: activeConversation });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation, account?.address]);

  // Send message (with optional NFT attachment)
  const sendMessage = useCallback(
    async (content: string, attachedNftId?: string) => {
      if (!activeConversation || !content.trim()) return;

      await sendMutation.mutateAsync({
        conversationId: activeConversation,
        content: content.trim(),
        attachedNftId,
      });
    },
    [activeConversation, sendMutation]
  );

  // Start new conversation with a friend
  const startConversation = useCallback(
    async (friendId: string) => {
      await startConversationMutation.mutateAsync({ friendId });
    },
    [startConversationMutation]
  );

  // Calculate total unread count
  const totalUnread = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  return {
    // State
    conversations,
    activeConversation,
    setActiveConversation,
    messages,
    friends,
    isConnected,

    // Loading states
    loadingFriends,
    loadingConversations,
    loadingMessages,

    // Actions
    sendMessage,
    startConversation,

    // Mutation states
    isSending: sendMutation.isPending,
    isStartingConversation: startConversationMutation.isPending,

    // Computed
    totalUnread,
  };
}
