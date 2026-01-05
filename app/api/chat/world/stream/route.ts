import { NextRequest } from 'next/server';
import { chatBroadcaster, ChatBroadcastEvent } from '@/lib/chat-broadcaster';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`)
      );

      // Listen for chat events
      const handleChat = (event: ChatBroadcastEvent) => {
        if (event.type === 'world') {
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(event.data)}\n\n`)
            );
          } catch {
            // Stream closed
          }
        }
      };

      chatBroadcaster.on('chat', handleChat);

      // Heartbeat every 30 seconds
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          clearInterval(heartbeat);
        }
      }, 30000);

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        chatBroadcaster.off('chat', handleChat);
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          // Controller already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
