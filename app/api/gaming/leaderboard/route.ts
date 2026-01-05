import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

// Mock leaderboard data
const MOCK_LEADERBOARD = [
  { rank: 1, displayName: "ProGamer420", rating: 2450, wins: 156, losses: 23, earnings: 12.5 },
  { rank: 2, displayName: "CryptoChamp", rating: 2380, wins: 142, losses: 31, earnings: 8.2 },
  { rank: 3, displayName: "NFTWarrior", rating: 2310, wins: 128, losses: 29, earnings: 6.8 },
  { rank: 4, displayName: "BlockMaster", rating: 2290, wins: 134, losses: 38, earnings: 5.4 },
  { rank: 5, displayName: "EthKing", rating: 2245, wins: 118, losses: 32, earnings: 4.9 },
  { rank: 6, displayName: "MetaPlayer", rating: 2210, wins: 112, losses: 35, earnings: 4.2 },
  { rank: 7, displayName: "Web3Gamer", rating: 2180, wins: 105, losses: 28, earnings: 3.8 },
  { rank: 8, displayName: "ChainChamp", rating: 2150, wins: 98, losses: 31, earnings: 3.5 },
  { rank: 9, displayName: "TokenTitan", rating: 2120, wins: 92, losses: 27, earnings: 3.1 },
  { rank: 10, displayName: "CryptoElite", rating: 2090, wins: 88, losses: 29, earnings: 2.8 },
];

// GET /api/gaming/leaderboard - Get global or game-specific leaderboard
export async function GET(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, "api");
  if (rateLimitResult) return rateLimitResult;

  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get("gameId");
    const gameSlug = searchParams.get("gameSlug");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: any = {};
    if (gameId) {
      where.gameId = gameId;
    } else if (gameSlug) {
      const game = await prisma.game.findFirst({ where: { slug: gameSlug } });
      if (game) where.gameId = game.id;
    }

    // For global leaderboard (no gameId), aggregate stats by user
    // Show each user's best rating and total stats across all games
    const isGlobalLeaderboard = !gameId && !gameSlug;

    let leaderboard: any[] = [];
    let totalCount = 0;

    if (isGlobalLeaderboard) {
      // Get all player stats with users
      const allStats = await prisma.playerStats.findMany({
        include: {
          user: {
            select: {
              id: true,
              username: true,
              profilePicture: true,
              walletAddress: true,
            },
          },
        },
        orderBy: { rating: "desc" },
      });

      // Aggregate by user - show best rating and sum totals
      const userStatsMap = new Map<string, {
        user: typeof allStats[0]["user"];
        bestRating: number;
        peakRating: number;
        totalWins: number;
        totalLosses: number;
        totalDraws: number;
        bestStreak: number;
        totalEarnings: number;
      }>();

      for (const stat of allStats) {
        const existing = userStatsMap.get(stat.userId);
        if (existing) {
          existing.bestRating = Math.max(existing.bestRating, stat.rating);
          existing.peakRating = Math.max(existing.peakRating, stat.peakRating || stat.rating);
          existing.totalWins += stat.wins;
          existing.totalLosses += stat.losses;
          existing.totalDraws += stat.draws;
          existing.bestStreak = Math.max(existing.bestStreak, stat.streak);
          existing.totalEarnings += parseFloat(stat.totalEarnings.toString());
        } else {
          userStatsMap.set(stat.userId, {
            user: stat.user,
            bestRating: stat.rating,
            peakRating: stat.peakRating || stat.rating,
            totalWins: stat.wins,
            totalLosses: stat.losses,
            totalDraws: stat.draws,
            bestStreak: stat.streak,
            totalEarnings: parseFloat(stat.totalEarnings.toString()),
          });
        }
      }

      // Convert to array and sort by best rating
      const aggregatedStats = Array.from(userStatsMap.values())
        .sort((a, b) => b.bestRating - a.bestRating);

      totalCount = aggregatedStats.length;
      const paginatedStats = aggregatedStats.slice(offset, offset + limit);

      leaderboard = paginatedStats.map((stat, index) => ({
        rank: offset + index + 1,
        user: {
          id: stat.user.id,
          displayName: stat.user.username,
          avatarUrl: stat.user.profilePicture,
        },
        rating: stat.bestRating,
        peakRating: stat.peakRating,
        wins: stat.totalWins,
        losses: stat.totalLosses,
        draws: stat.totalDraws,
        winRate: stat.totalWins + stat.totalLosses > 0
          ? ((stat.totalWins / (stat.totalWins + stat.totalLosses)) * 100).toFixed(1)
          : "0.0",
        streak: stat.bestStreak,
        totalEarnings: stat.totalEarnings,
      }));
    } else {
      // Game-specific leaderboard - show stats per game
      const stats = await prisma.playerStats.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              profilePicture: true,
              walletAddress: true,
            },
          },
          game: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: { rating: "desc" },
        take: limit,
        skip: offset,
      });

      totalCount = await prisma.playerStats.count({ where });

      leaderboard = stats.map((stat, index) => ({
        rank: offset + index + 1,
        user: {
          id: stat.user.id,
          displayName: stat.user.username,
          avatarUrl: stat.user.profilePicture,
        },
        game: stat.game,
        rating: stat.rating,
        peakRating: stat.peakRating,
        wins: stat.wins,
        losses: stat.losses,
        draws: stat.draws,
        winRate: stat.wins + stat.losses > 0
          ? ((stat.wins / (stat.wins + stat.losses)) * 100).toFixed(1)
          : "0.0",
        streak: stat.streak,
        totalEarnings: parseFloat(stat.totalEarnings.toString()),
      }));
    }

    // Fall back to mock data if no results
    if (leaderboard.length === 0) {
      return NextResponse.json({
        success: true,
        leaderboard: MOCK_LEADERBOARD.slice(offset, offset + limit).map(
          (entry, index) => ({
            ...entry,
            rank: offset + index + 1,
            user: {
              id: `mock-${index}`,
              displayName: entry.displayName,
              avatarUrl: null,
            },
          })
        ),
        source: "mock",
        pagination: {
          total: MOCK_LEADERBOARD.length,
          limit,
          offset,
        },
      });
    }

    return NextResponse.json({
      success: true,
      leaderboard,
      source: "database",
      pagination: {
        total: totalCount,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
