import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

// GET /api/gaming/games/[id] - Get game details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResult = await rateLimit(request, "api");
  if (rateLimitResult) return rateLimitResult;

  try {
    const { id } = await params;

    const game = await prisma.game.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        tournaments: {
          where: {
            status: { in: ["UPCOMING", "REGISTRATION", "IN_PROGRESS"] },
          },
          take: 5,
          orderBy: { startTime: "asc" },
        },
        playerStats: {
          take: 10,
          orderBy: { rating: "desc" },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                profilePicture: true,
              },
            },
          },
        },
        _count: {
          select: {
            tournaments: true,
            matches: true,
            playerStats: true,
          },
        },
      },
    });

    if (!game) {
      return NextResponse.json(
        { success: false, error: "Game not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      game: {
        ...game,
        entryFee: game.entryFee ? parseFloat(game.entryFee.toString()) : null,
        prizePool: game.prizePool ? parseFloat(game.prizePool.toString()) : null,
        topPlayers: game.playerStats,
      },
    });
  } catch (error) {
    console.error("Error fetching game:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch game" },
      { status: 500 }
    );
  }
}
