import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { rateLimitCheck } from "@/lib/rate-limit";
import { broadcastNotificationDelete } from "@/lib/notification-broadcaster";

const bodySchema = z.object({
  userId: z.string().uuid(),
});

/**
 * POST /api/notifications/[id]/dismiss
 * Dismiss a notification (soft delete)
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
    await prisma.notification.update({
      where: { id },
      data: {
        isDismissed: true,
        dismissedAt: new Date(),
      },
    });

    // Broadcast deletion to connected clients
    broadcastNotificationDelete(userId, id);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("[POST /api/notifications/[id]/dismiss] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to dismiss notification" },
      { status: 500 }
    );
  }
}
