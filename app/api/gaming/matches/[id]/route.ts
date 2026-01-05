import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

// GET /api/gaming/matches/[id] - Get match details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResult = await rateLimit(request, "api");
  if (rateLimitResult) return rateLimitResult;

  try {
    const { id } = await params;

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        game: true,
        player1: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
            walletAddress: true,
          },
        },
        player2: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
            walletAddress: true,
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json(
        { success: false, error: "Match not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      match: {
        ...match,
        wagerAmount: match.wagerAmount
          ? parseFloat(match.wagerAmount.toString())
          : null,
      },
    });
  } catch (error) {
    console.error("Error fetching match:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch match" },
      { status: 500 }
    );
  }
}

// PATCH /api/gaming/matches/[id] - Update match (complete, set winner)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResult = await rateLimit(request, "apiWrite");
  if (rateLimitResult) return rateLimitResult;

  try {
    const { id } = await params;
    const body = await request.json();
    const { status, winnerId, replayUrl } = body;

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        game: true,
        player1: true,
        player2: true,
      },
    });

    if (!match) {
      return NextResponse.json(
        { success: false, error: "Match not found" },
        { status: 404 }
      );
    }

    const updates: any = {};
    if (status) updates.status = status;
    if (winnerId) updates.winnerId = winnerId;
    if (replayUrl) updates.replayUrl = replayUrl;

    if (status === "COMPLETED" && winnerId) {
      updates.completedAt = new Date();

      // Update player stats
      const loserId =
        winnerId === match.player1Id ? match.player2Id : match.player1Id;

      // Update winner stats
      await prisma.playerStats.upsert({
        where: {
          userId_gameId: { userId: winnerId, gameId: match.gameId },
        },
        create: {
          userId: winnerId,
          gameId: match.gameId,
          wins: 1,
          rating: 1025, // Starting + win bonus
          peakRating: 1025,
          streak: 1,
          totalEarnings: match.wagerAmount || 0,
        },
        update: {
          wins: { increment: 1 },
          rating: { increment: 25 },
          streak: { increment: 1 },
          totalEarnings: { increment: match.wagerAmount || 0 },
        },
      });

      // Update loser stats if exists
      if (loserId) {
        await prisma.playerStats.upsert({
          where: {
            userId_gameId: { userId: loserId, gameId: match.gameId },
          },
          create: {
            userId: loserId,
            gameId: match.gameId,
            losses: 1,
            rating: 985, // Starting - loss penalty
            peakRating: 1000,
            streak: -1,
          },
          update: {
            losses: { increment: 1 },
            rating: { decrement: 15 },
            streak: -1, // Reset streak to -1
          },
        });
      }
    }

    const updatedMatch = await prisma.match.update({
      where: { id },
      data: updates,
      include: {
        game: true,
        player1: {
          select: { id: true, username: true, profilePicture: true },
        },
        player2: {
          select: { id: true, username: true, profilePicture: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      match: {
        ...updatedMatch,
        wagerAmount: updatedMatch.wagerAmount
          ? parseFloat(updatedMatch.wagerAmount.toString())
          : null,
      },
    });
  } catch (error) {
    console.error("Error updating match:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update match" },
      { status: 500 }
    );
  }
}
