import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

// Mock tournaments for demo
const MOCK_TOURNAMENTS = [
  {
    id: "tournament-1",
    gameId: "game-2",
    name: "Weekly FPS Championship",
    description: "Weekly competitive tournament",
    image: "/api/placeholder/800/400",
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    endTime: null,
    entryFee: 0.01,
    prizePool: 0.5,
    maxPlayers: 32,
    currentPlayers: 12,
    format: "single_elimination",
    status: "REGISTRATION",
    game: { id: "game-2", name: "FPS Arena Championship", slug: "fps-arena" },
  },
  {
    id: "tournament-2",
    gameId: "game-4",
    name: "1v1 Showdown Series",
    description: "Head-to-head combat championship",
    image: "/api/placeholder/800/400",
    startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // In 2 days
    endTime: null,
    entryFee: 0.02,
    prizePool: 0.2,
    maxPlayers: 16,
    currentPlayers: 8,
    format: "double_elimination",
    status: "UPCOMING",
    game: { id: "game-4", name: "Battle Arena", slug: "battle-arena" },
  },
];

// GET /api/gaming/tournaments - List tournaments
export async function GET(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, "api");
  if (rateLimitResult) return rateLimitResult;

  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get("gameId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: any = {};
    if (gameId) where.gameId = gameId;
    if (status) where.status = status;

    let tournaments = await prisma.tournament.findMany({
      where,
      include: {
        game: {
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
          },
        },
        _count: {
          select: {
            participants: true,
            brackets: true,
          },
        },
      },
      orderBy: { startTime: "asc" },
      take: limit,
    });

    // Fall back to mock data
    if (tournaments.length === 0) {
      let mock = MOCK_TOURNAMENTS;
      if (gameId) mock = mock.filter((t) => t.gameId === gameId);
      if (status) mock = mock.filter((t) => t.status === status);

      return NextResponse.json({
        success: true,
        tournaments: mock,
        source: "mock",
      });
    }

    return NextResponse.json({
      success: true,
      tournaments: tournaments.map((t) => ({
        ...t,
        entryFee: parseFloat(t.entryFee.toString()),
        prizePool: parseFloat(t.prizePool.toString()),
        currentPlayers: t._count.participants,
      })),
      source: "database",
    });
  } catch (error) {
    console.error("Error fetching tournaments:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tournaments" },
      { status: 500 }
    );
  }
}

// POST /api/gaming/tournaments - Create tournament
export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, "apiWrite");
  if (rateLimitResult) return rateLimitResult;

  try {
    const body = await request.json();
    const {
      gameId,
      name,
      description,
      image,
      startTime,
      endTime,
      entryFee,
      prizePool,
      maxPlayers,
      format,
    } = body;

    const tournament = await prisma.tournament.create({
      data: {
        gameId,
        name,
        description,
        image,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        entryFee,
        prizePool,
        maxPlayers,
        format: format || "single_elimination",
        status: "UPCOMING",
      },
      include: {
        game: true,
      },
    });

    return NextResponse.json({ success: true, tournament });
  } catch (error) {
    console.error("Error creating tournament:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create tournament" },
      { status: 500 }
    );
  }
}
