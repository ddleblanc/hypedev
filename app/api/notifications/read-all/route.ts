import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { rateLimitCheck } from "@/lib/rate-limit";

const bodySchema = z.object({
  userId: z.string().uuid(),
});

/**
 * POST /api/notifications/read-all
 * Mark all notifications as read for a user
 */
export async function POST(request: NextRequest) {
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

    // Update all unread notifications for the user
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
        isDismissed: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      count: result.count,
    });
  } catch (error) {
    console.error("[POST /api/notifications/read-all] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to mark all as read" },
      { status: 500 }
    );
  }
}
