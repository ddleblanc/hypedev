'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useChat, WorldMessage } from '@/contexts/chat-context';

export function useChatStream() {
  const { addWorldMessage, setConnectionStatus } = useChat();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setConnectionStatus('connecting');

    const eventSource = new EventSource('/api/chat/world/stream');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setConnectionStatus('connected');
      reconnectAttempts.current = 0;
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'connected') {
          return; // Initial connection message
        }

        // Transform to WorldMessage
        const message: WorldMessage = {
          id: data.id,
          type: data.messageType as WorldMessage['type'],
          content: data.content,
          timestamp: new Date(data.timestamp),
          metadata: data.metadata,
        };

        addWorldMessage(message);
      } catch (error) {
        console.error('[ChatStream] Failed to parse chat message:', error);
      }
    };

    eventSource.onerror = () => {
      setConnectionStatus('disconnected');
      eventSource.close();
      eventSourceRef.current = null;

      // Exponential backoff reconnect
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
      reconnectAttempts.current++;

      console.log(`[ChatStream] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);
      reconnectTimeoutRef.current = setTimeout(connect, delay);
    };
  }, [addWorldMessage, setConnectionStatus]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setConnectionStatus('disconnected');
  }, [setConnectionStatus]);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { connect, disconnect };
}
