import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

// GET /api/gaming/stats/[userId] - Get player stats
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const rateLimitResult = await rateLimit(request, "api");
  if (rateLimitResult) return rateLimitResult;

  try {
    const { userId } = await params;

    // Find user by ID or wallet address
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ id: userId }, { walletAddress: userId.toLowerCase() }],
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Get stats across all games
    const stats = await prisma.playerStats.findMany({
      where: { userId: user.id },
      include: {
        game: {
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
            category: true,
          },
        },
      },
      orderBy: { rating: "desc" },
    });

    // Get recent matches
    const recentMatches = await prisma.match.findMany({
      where: {
        OR: [{ player1Id: user.id }, { player2Id: user.id }],
        status: "COMPLETED",
      },
      include: {
        game: {
          select: { id: true, name: true, slug: true },
        },
        player1: {
          select: { id: true, username: true, profilePicture: true },
        },
        player2: {
          select: { id: true, username: true, profilePicture: true },
        },
      },
      orderBy: { completedAt: "desc" },
      take: 10,
    });

    // Get tournament participations
    const tournaments = await prisma.tournamentParticipant.findMany({
      where: { userId: user.id },
      include: {
        tournament: {
          include: {
            game: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
      take: 10,
    });

    // Calculate aggregates
    const totalWins = stats.reduce((sum, s) => sum + s.wins, 0);
    const totalLosses = stats.reduce((sum, s) => sum + s.losses, 0);
    const totalEarnings = stats.reduce(
      (sum, s) => sum + parseFloat(s.totalEarnings.toString()),
      0
    );
    const highestRating = Math.max(...stats.map((s) => s.peakRating), 0);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        profilePicture: user.profilePicture,
        walletAddress: user.walletAddress,
      },
      summary: {
        totalWins,
        totalLosses,
        winRate:
          totalWins + totalLosses > 0
            ? ((totalWins / (totalWins + totalLosses)) * 100).toFixed(1)
            : "0.0",
        totalEarnings,
        highestRating,
        gamesPlayed: stats.length,
        tournamentsEntered: tournaments.length,
      },
      gameStats: stats.map((s) => ({
        game: s.game,
        rating: s.rating,
        peakRating: s.peakRating,
        wins: s.wins,
        losses: s.losses,
        draws: s.draws,
        streak: s.streak,
        earnings: parseFloat(s.totalEarnings.toString()),
      })),
      recentMatches: recentMatches.map((m) => ({
        id: m.id,
        game: m.game,
        opponent:
          m.player1Id === user.id ? m.player2 : m.player1,
        won: m.winnerId === user.id,
        wagerAmount: m.wagerAmount
          ? parseFloat(m.wagerAmount.toString())
          : null,
        completedAt: m.completedAt,
      })),
      tournaments: tournaments.map((t) => ({
        id: t.tournament.id,
        name: t.tournament.name,
        game: t.tournament.game,
        placement: t.placement,
        prizeAmount: t.prizeAmount
          ? parseFloat(t.prizeAmount.toString())
          : null,
        eliminated: t.eliminated,
      })),
    });
  } catch (error) {
    console.error("Error fetching player stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch player stats" },
      { status: 500 }
    );
  }
}
