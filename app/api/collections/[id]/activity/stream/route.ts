import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// SSE endpoint for real-time activity updates
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: collectionId } = await params;

  // Get initial activities to seed the stream
  const initialActivities = await getRecentActivities(collectionId, 20);

  // Track last activity ID for polling
  let lastActivityId = initialActivities[0]?.id || null;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial activities
      const initialData = JSON.stringify({
        type: "initial",
        activities: initialActivities,
      });
      controller.enqueue(encoder.encode(`data: ${initialData}\n\n`));

      // Keep-alive ping every 30 seconds
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(pingInterval);
        }
      }, 30000);

      // Poll for new activities every 5 seconds
      const pollInterval = setInterval(async () => {
        try {
          const newActivities = await getNewActivities(collectionId, lastActivityId);

          if (newActivities.length > 0) {
            lastActivityId = newActivities[0].id;

            const newData = JSON.stringify({
              type: "new",
              activities: newActivities,
            });
            controller.enqueue(encoder.encode(`data: ${newData}\n\n`));
          }
        } catch (error) {
          console.error("Error polling activities:", error);
        }
      }, 5000);

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        clearInterval(pingInterval);
        clearInterval(pollInterval);
        controller.close();
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
      },
    });

    return activities.map(formatActivity);
  } catch (error) {
    console.error("Error fetching new activities:", error);
    return [];
  }
}

function formatActivity(activity: any) {
  return {
    id: activity.id,
    type: activity.type,
    item: activity.nft?.name || `NFT #${activity.nft?.tokenId || "unknown"}`,
    image: activity.nft?.image || null,
    price: activity.amount?.toString() || "0",
    from: activity.relatedAddress
      ? `${activity.relatedAddress.slice(0, 6)}...${activity.relatedAddress.slice(-4)}`
      : "-",
    to: activity.user?.walletAddress
      ? `${activity.user.walletAddress.slice(0, 6)}...${activity.user.walletAddress.slice(-4)}`
      : "-",
    timestamp: activity.createdAt.toISOString(),
    txHash: activity.transactionHash || "",
  };
}
