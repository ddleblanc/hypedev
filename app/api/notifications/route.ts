import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { rateLimitCheck } from "@/lib/rate-limit";

const querySchema = z.object({
  userId: z.string().uuid(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  type: z.string().optional(),
  unreadOnly: z
    .string()
    .transform((v) => v === "true")
    .optional(),
});

/**
 * GET /api/notifications
 * Fetch notifications for a user with pagination and filtering
 */
export async function GET(request: NextRequest) {
  // Rate limit
  const rateCheck = await rateLimitCheck(request, "api");
  if (rateCheck.blocked) {
    return rateCheck.response;
  }

  const searchParams = request.nextUrl.searchParams;

  const parsed = querySchema.safeParse({
    userId: searchParams.get("userId"),
    limit: searchParams.get("limit") ?? undefined,
    offset: searchParams.get("offset") ?? undefined,
    type: searchParams.get("type") ?? undefined,
    unreadOnly: searchParams.get("unreadOnly") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.message },
      { status: 400 }
    );
  }

  const { userId, limit, offset, type, unreadOnly } = parsed.data;

  try {
    const where: {
      userId: string;
      isDismissed: boolean;
      type?: string;
      isRead?: boolean;
    } = {
      userId,
      isDismissed: false,
    };

    if (type) {
      where.type = type;
    }

    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where }),
    ]);

    // Transform priority for proper sorting
    const priorityOrder: Record<string, number> = {
      URGENT: 4,
      HIGH: 3,
      NORMAL: 2,
      LOW: 1,
    };

    const sortedNotifications = notifications.sort((a, b) => {
      const priorityDiff =
        (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });

    return NextResponse.json({
      success: true,
      notifications: sortedNotifications,
      total,
      hasMore: offset + notifications.length < total,
    });
  } catch (error) {
    console.error("[GET /api/notifications] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
