import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import {
  registerConnection,
  sendInitialActivities,
  sendHeartbeat,
} from "@/lib/activity-broadcaster";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// SSE endpoint for global real-time activity updates (homepage)
// Uses "global" as the collection ID for broadcaster
export async function GET(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, "api");
  if (rateLimitResult) return rateLimitResult;

  // Get initial activities across all collections
  const initialActivities = await getRecentGlobalActivities(20);

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial activities
      sendInitialActivities(controller, initialActivities);

      // Register this connection for global push updates
      const unregister = registerConnection("global", controller);

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

async function getRecentGlobalActivities(limit: number) {
  try {
    const activities = await prisma.activity.findMany({
      where: {
        type: {
          in: [
            "purchase",
            "listing_sold",
            "auction_won",
            "offer_accepted",
            "listing_created",
            "bid_placed",
            "nft_minted",
            "listing_cancelled",
            "auction_created",
            "auction_bid",
            "auction_closed",
          ],
        },
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
            slug: true,
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
    console.error("Error fetching global activities:", error);
    return [];
  }
}

function formatActivity(activity: {
  id: string;
  type: string;
  amount: number | null;
  createdAt: Date;
  transactionHash: string | null;
  relatedAddress: string | null;
  nft: { id: string; name: string; image: string | null; tokenId: string } | null;
  collection: { id: string; name: string; slug: string | null } | null;
  user: { walletAddress: string; username: string | null } | null;
}) {
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
    collection: activity.collection
      ? {
          id: activity.collection.id,
          name: activity.collection.name,
          slug: activity.collection.slug,
        }
      : null,
  };
}
