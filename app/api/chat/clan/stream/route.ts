/**
 * Clan Chat SSE Stream Endpoint
 * Provides real-time message updates for clan members
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clanChatBroadcaster, ClanChatEvent } from '@/lib/clan-chat-broadcaster';

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

  // Get user's clan membership
  const membership = await prisma.clanMember.findFirst({
    where: { userId: user.id },
    select: { clanId: true },
  });

  if (!membership) {
    return new Response('Not in a clan', { status: 404 });
  }

  const clanId = membership.clanId;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message with clanId
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({
          type: 'connected',
          clanId,
          timestamp: new Date().toISOString(),
        })}\n\n`)
      );

      // Subscribe to clan chat channel
      const unsubscribe = clanChatBroadcaster.subscribeToChannel(
        clanId,
        (event: ClanChatEvent) => {
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
