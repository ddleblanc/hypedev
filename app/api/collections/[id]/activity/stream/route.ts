import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import {
  registerConnection,
  sendInitialActivities,
  sendHeartbeat,
} from "@/lib/activity-broadcaster";

// SSE endpoint for real-time activity updates
// Now push-based via Alchemy webhooks instead of polling
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResult = await rateLimit(request, "api");
  if (rateLimitResult) return rateLimitResult;

  const { id: collectionId } = await params;

  // Get initial activities to seed the stream
  const initialActivities = await getRecentActivities(collectionId, 20);

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial activities
      sendInitialActivities(controller, initialActivities);

      // Register this connection for push updates
      const unregister = registerConnection(collectionId, controller);

      // Keep-alive ping every 30 seconds
      const pingInterval = setInterval(() => {
        if (!sendHeartbeat(controller)) {
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

async function getRecentActivities(collectionId: string, limit: number) {
  try {
    const activities = await prisma.activity.findMany({
      where: {
        OR: [
          { collectionId: collectionId },
          // Also check nft's collection
          {
            nft: {
              collectionId: collectionId,
            },
          },
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      include: {
        nft: {
          select: {
            id: true,
            name: true,
            image: true,
            tokenId: true,
          },
        },
        collection: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            walletAddress: true,
            username: true,
          },
        },
      },
    });

    return activities.map(formatActivity);
  } catch (error) {
    console.error("Error fetching activities:", error);
    return [];
  }
}

async function getNewActivities(
  collectionId: string,
  lastId: string | null
) {
  if (!lastId) return [];

  try {
    const activities = await prisma.activity.findMany({
      where: {
        OR: [
          { collectionId: collectionId },
          {
            nft: {
              collectionId: collectionId,
            },
          },
        ],
        id: {
          gt: lastId, // Only get activities newer than last
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
      include: {
        nft: {
          select: {
            id: true,
            name: true,
            image: true,
            tokenId: true,
          },
        },
        collection: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            walletAddress: true,
            username: true,
          },
        },
      },
    });

    return activities.map(formatActivity);
  } catch (error) {
    console.error("Error fetching new activities:", error);
    return [];
  }
}

// Typed activity input for type safety
interface ActivityInput {
  id: string;
  type: string;
  amount: number | null;
  createdAt: Date;
  transactionHash: string | null;
  relatedAddress: string | null;
  nft: { id: string; name: string; image: string | null; tokenId: string } | null;
  collection: { id: string; name: string } | null;
  user: { walletAddress: string; username: string | null } | null;
}

function formatActivity(activity: ActivityInput) {
  return {
    id: activity.id,
    type: activity.type,
    item: activity.nft?.name || `NFT #${activity.nft?.tokenId || "unknown"}`,
    image: activity.nft?.image || null,
    price: activity.amount?.toString() || "0",
    from: activity.user?.walletAddress
      ? `${activity.user.walletAddress.slice(0, 6)}...${activity.user.walletAddress.slice(-4)}`
      : "-",
    to: activity.relatedAddress
      ? `${activity.relatedAddress.slice(0, 6)}...${activity.relatedAddress.slice(-4)}`
      : "-",
    timestamp: activity.createdAt.toISOString(),
    txHash: activity.transactionHash || "",
  };
}
