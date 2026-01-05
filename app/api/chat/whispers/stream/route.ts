/**
 * Whispers SSE Stream Endpoint
 * Provides real-time DM notifications for authenticated users
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { whisperBroadcaster, WhisperEvent } from '@/lib/whisper-broadcaster';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const walletAddress = searchParams.get('wallet');

  // Require wallet address for authentication
  if (!walletAddress) {
    return new Response('Unauthorized - wallet address required', { status: 401 });
  }

  // Find user by wallet
  const user = await prisma.user.findUnique({
    where: { walletAddress: walletAddress.toLowerCase() },
    select: { id: true },
  });

  if (!user) {
    return new Response('User not found', { status: 404 });
  }

  const userId = user.id;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({
          type: 'connected',
          userId,
          timestamp: new Date().toISOString(),
        })}\n\n`)
      );

      // Subscribe to user's whisper channel
      const unsubscribe = whisperBroadcaster.subscribeToUser(
        userId,
        (event: WhisperEvent) => {
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
            );
          } catch {
            // Stream closed, will be handled by abort
          }
        }
      );

      // Heartbeat every 30 seconds to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(heartbeat);
        }
      }, 30000);

      // Cleanup on connection close
      request.signal.addEventListener('abort', () => {
        unsubscribe();
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
