import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { rateLimitCheck } from "@/lib/rate-limit";
import { broadcastNotificationUpdate } from "@/lib/notification-broadcaster";

const bodySchema = z.object({
  userId: z.string().uuid(),
});

/**
 * POST /api/notifications/[id]/read
 * Mark a notification as read
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Rate limit
  const rateCheck = await rateLimitCheck(request, "apiWrite");
  if (rateCheck.blocked) {
    return rateCheck.response;
  }

  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.message },
        { status: 400 }
      );
    }

    const { userId } = parsed.data;

    // Verify the notification belongs to the user
    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      return NextResponse.json(
        { success: false, error: "Notification not found" },
        { status: 404 }
      );
    }

    // Update the notification
    const updated = await prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    // Broadcast update to connected clients
    broadcastNotificationUpdate(userId, {
      id: updated.id,
      isRead: true,
      readAt: updated.readAt?.toISOString() || null,
    } as { id: string; isRead: boolean; readAt: string | null });

    return NextResponse.json({
      success: true,
      notification: updated,
    });
  } catch (error) {
    console.error("[POST /api/notifications/[id]/read] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}
