import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { rateLimitCheck } from "@/lib/rate-limit";
import { broadcastNotificationUpdate } from "@/lib/notification-broadcaster";

const bodySchema = z.object({
  userId: z.string().uuid(),
  action: z.enum([
    "ACCEPT_OFFER",
    "DECLINE_OFFER",
    "COUNTER_OFFER",
    "ACCEPT_TRADE",
    "DECLINE_TRADE",
    "PLACE_BID",
    "VIEW_ITEM",
    "FOLLOW_BACK",
    "VIEW_PROFILE",
    "CLAIM_ITEM",
    "VIEW_TRANSACTION",
  ]),
  data: z.record(z.unknown()).optional(),
});

/**
 * POST /api/notifications/[id]/action
 * Perform an action on a notification
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

    const { userId, action } = parsed.data;

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

    // Check if action is still valid
    if (notification.actionStatus !== "PENDING") {
      return NextResponse.json(
        {
          success: false,
          error: `Action already ${notification.actionStatus.toLowerCase()}`,
        },
        { status: 400 }
      );
    }

    // Handle specific actions
    let actionResult: { success: boolean; message: string; data?: unknown } = {
      success: true,
      message: "Action completed",
    };

    switch (action) {
      case "ACCEPT_OFFER":
        // TODO: Integrate with marketplace offer acceptance
        // For now, just mark as completed - the actual acceptance
        // should be done through the marketplace API
        actionResult = {
          success: true,
          message: "Offer acceptance initiated. Complete the transaction in your wallet.",
        };
        break;

      case "DECLINE_OFFER":
        // TODO: Integrate with marketplace offer rejection
        actionResult = {
          success: true,
          message: "Offer declined",
        };
        break;

      case "ACCEPT_TRADE":
        // TODO: Integrate with P2P trade acceptance
        actionResult = {
          success: true,
          message: "Navigate to trade to review and accept",
        };
        break;

      case "DECLINE_TRADE":
        // TODO: Integrate with P2P trade rejection
        actionResult = {
          success: true,
          message: "Trade declined",
        };
        break;

      case "FOLLOW_BACK":
        // Create follow relationship
        if (notification.relatedUserId) {
          const existingFollow = await prisma.userFollow.findUnique({
            where: {
              followerId_followingId: {
                followerId: userId,
                followingId: notification.relatedUserId,
              },
            },
          });

          if (!existingFollow) {
            await prisma.userFollow.create({
              data: {
                followerId: userId,
                followingId: notification.relatedUserId,
              },
            });
            actionResult = {
              success: true,
              message: "Now following user",
            };
          } else {
            actionResult = {
              success: true,
              message: "Already following user",
            };
          }
        } else {
          actionResult = {
            success: false,
            message: "Cannot follow: user not found",
          };
        }
        break;

      case "PLACE_BID":
        // Navigate to auction - just mark as viewed
        actionResult = {
          success: true,
          message: "Navigate to auction to place a new bid",
        };
        break;

      case "VIEW_ITEM":
      case "VIEW_PROFILE":
      case "VIEW_TRANSACTION":
      case "CLAIM_ITEM":
        // These are navigation actions - just mark as completed
        actionResult = {
          success: true,
          message: "Navigating to view",
        };
        break;

      default:
        actionResult = {
          success: false,
          message: "Unknown action",
        };
    }

    if (!actionResult.success) {
      return NextResponse.json(
        { success: false, error: actionResult.message },
        { status: 400 }
      );
    }

    // Mark notification action as completed
    const updated = await prisma.notification.update({
      where: { id },
      data: {
        actionStatus: "COMPLETED",
        isRead: true,
        readAt: new Date(),
      },
    });

    // Broadcast update to connected clients
    broadcastNotificationUpdate(userId, {
      id: updated.id,
      actionStatus: "COMPLETED",
      isRead: true,
      readAt: updated.readAt?.toISOString() || null,
    } as { id: string; actionStatus: string; isRead: boolean; readAt: string | null });

    return NextResponse.json({
      success: true,
      result: actionResult,
    });
  } catch (error) {
    console.error("[POST /api/notifications/[id]/action] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to perform action" },
      { status: 500 }
    );
  }
}
