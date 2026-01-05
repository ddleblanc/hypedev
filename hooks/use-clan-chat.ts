'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useActiveAccount } from 'thirdweb/react';

export interface ClanChatMessage {
  id: string;
  content: string;
  isSystem: boolean;
  createdAt: string;
  sender: {
    id: string;
    username: string | null;
    avatar: string | null;
    walletAddress: string;
  };
}

export interface ClanInfo {
  id: string;
  name: string;
  tag: string;
  memberCount: number;
  myRole: string;
}

export function useClanChat() {
  const account = useActiveAccount();
  const [messages, setMessages] = useState<ClanChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [clanInfo, setClanInfo] = useState<ClanInfo | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);

  // Fetch user's clan
  const { data: myClan, isLoading: isClanLoading } = trpc.clan.getMyClan.useQuery(undefined, {
    enabled: !!account?.address,
  });

  // Fetch initial messages
  const {
    data: initialMessages,
    isLoading: isMessagesLoading,
    refetch: refetchMessages,
  } = trpc.clanChat.getMessages.useQuery(
    { clanId: myClan?.id ?? '', limit: 50 },
    { enabled: !!myClan?.id }
  );

  // Send message mutation
  const sendMutation = trpc.clanChat.send.useMutation();

  // Update clan info when data loads
  useEffect(() => {
    if (myClan) {
      setClanInfo({
        id: myClan.id,
        name: myClan.name,
        tag: myClan.tag,
        memberCount: myClan.memberCount,
        myRole: myClan.myRole,
      });
    } else {
      setClanInfo(null);
    }
  }, [myClan]);

  // Load initial messages
  useEffect(() => {
    if (initialMessages?.messages) {
      setMessages(
        initialMessages.messages.map((msg) => ({
          id: msg.id,
          content: msg.content,
          isSystem: msg.isSystem,
          createdAt: msg.createdAt.toISOString(),
          sender: {
            id: msg.sender.id,
            username: msg.sender.username,
            avatar: msg.sender.profilePicture,
            walletAddress: msg.sender.walletAddress,
          },
        }))
      );
    }
  }, [initialMessages]);

  // SSE connection
  const connect = useCallback(() => {
    if (!account?.address || !myClan?.id) return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const url = `/api/chat/clan/stream?wallet=${encodeURIComponent(account.address)}`;
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

        if (data.type === 'new_message' && data.message) {
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === data.message.id)) {
              return prev;
            }
            return [...prev, data.message];
          });
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
  }, [account?.address, myClan?.id]);

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

  // Connect when clan is available
  useEffect(() => {
    if (myClan?.id && account?.address) {
      connect();
    }
    return () => disconnect();
  }, [myClan?.id, account?.address, connect, disconnect]);

  // Send message
  const sendMessage = useCallback(
    async (content: string) => {
      if (!myClan?.id || !content.trim()) return;

      await sendMutation.mutateAsync({
        clanId: myClan.id,
        content: content.trim(),
      });
    },
    [myClan?.id, sendMutation]
  );

  return {
    messages,
    isConnected,
    isLoading: isClanLoading || isMessagesLoading,
    clanInfo,
    sendMessage,
    isSending: sendMutation.isPending,
    refetchMessages,
  };
}
