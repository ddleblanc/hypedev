import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  registerNotificationConnection,
  sendNotificationHeartbeat,
  sendInitialNotifications,
  type NotificationEvent,
} from "@/lib/notification-broadcaster";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/notifications/stream
 * SSE endpoint for real-time notification updates
 */
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");

  if (!userId) {
    return new Response("User ID required", { status: 400 });
  }

  // Validate user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    return new Response("User not found", { status: 404 });
  }

  // Fetch initial notifications
  const initialNotifications = await prisma.notification.findMany({
    where: {
      userId,
      isDismissed: false,
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    take: 50,
  });

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial notifications
      const formattedNotifications: NotificationEvent[] =
        initialNotifications.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          priority: n.priority,
          actionType: n.actionType,
          actionStatus: n.actionStatus,
          isTimeSensitive: n.isTimeSensitive,
          expiresAt: n.expiresAt?.toISOString() || null,
          nftId: n.nftId,
          collectionId: n.collectionId,
          tradeId: n.tradeId,
          offerId: n.offerId,
          relatedUserId: n.relatedUserId,
          relatedAddress: n.relatedAddress,
          metadata: n.metadata as Record<string, unknown> | null,
          createdAt: n.createdAt.toISOString(),
        }));

      sendInitialNotifications(controller, formattedNotifications);

      // Register this connection for push updates
      const unregister = registerNotificationConnection(userId, controller);

      // Keep-alive ping every 30 seconds
      const pingInterval = setInterval(() => {
        if (!sendNotificationHeartbeat(controller)) {
          clearInterval(pingInterval);
          unregister();
        }
      }, 30000);

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        clearInterval(pingInterval);
        unregister();
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
