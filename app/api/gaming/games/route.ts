import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

// Mock games data for demo (until database is seeded)
const MOCK_GAMES = [
  {
    id: "game-1",
    name: "Crypto Farm Legends",
    slug: "crypto-farm",
    description: "Build your NFT farm empire",
    image: "/api/placeholder/400/300",
    category: "casual",
    subcategory: "farming",
    minPlayers: 1,
    maxPlayers: 1,
    entryFee: null,
    prizePool: null,
    isActive: true,
  },
  {
    id: "game-2",
    name: "FPS Arena Championship",
    slug: "fps-arena",
    description: "Competitive first-person shooter",
    image: "/api/placeholder/400/300",
    category: "competitive",
    subcategory: "fps",
    minPlayers: 2,
    maxPlayers: 10,
    entryFee: 0.01,
    prizePool: 0.1,
    isActive: true,
  },
  {
    id: "game-3",
    name: "Crypto Poker",
    slug: "crypto-poker",
    description: "Texas Hold'em with crypto stakes",
    image: "/api/placeholder/400/300",
    category: "casino",
    subcategory: "poker",
    minPlayers: 2,
    maxPlayers: 9,
    entryFee: 0.05,
    prizePool: null,
    isActive: true,
  },
  {
    id: "game-4",
    name: "Battle Arena",
    slug: "battle-arena",
    description: "1v1 PvP combat",
    image: "/api/placeholder/400/300",
    category: "1v1",
    subcategory: "fighting",
    minPlayers: 2,
    maxPlayers: 2,
    entryFee: 0.02,
    prizePool: 0.04,
    isActive: true,
  },
];

// GET /api/gaming/games - List all games
export async function GET(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, "api");
  if (rateLimitResult) return rateLimitResult;

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const subcategory = searchParams.get("subcategory");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Try database first
    const where: any = { isActive: true };
    if (category) where.category = category;
    if (subcategory) where.subcategory = subcategory;

    let games = await prisma.game.findMany({
      where,
      include: {
        _count: {
          select: {
            tournaments: true,
            matches: true,
          },
        },
      },
      take: limit,
      orderBy: { name: "asc" },
    });

    // Fall back to mock data if no games in database
    if (games.length === 0) {
      let mockGames = MOCK_GAMES;
      if (category) {
        mockGames = mockGames.filter((g) => g.category === category);
      }
      if (subcategory) {
        mockGames = mockGames.filter((g) => g.subcategory === subcategory);
      }

      return NextResponse.json({
        success: true,
        games: mockGames.map((g) => ({
          ...g,
          _count: { tournaments: 0, matches: 0 },
        })),
        source: "mock",
      });
    }

    return NextResponse.json({
      success: true,
      games: games.map((g) => ({
        ...g,
        entryFee: g.entryFee ? parseFloat(g.entryFee.toString()) : null,
        prizePool: g.prizePool ? parseFloat(g.prizePool.toString()) : null,
      })),
      source: "database",
    });
  } catch (error) {
    console.error("Error fetching games:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch games" },
      { status: 500 }
    );
  }
}

// POST /api/gaming/games - Create a game (admin only)
export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, "apiWrite");
  if (rateLimitResult) return rateLimitResult;

  try {
    const body = await request.json();
    const {
      name,
      slug,
      description,
      image,
      category,
      subcategory,
      minPlayers,
      maxPlayers,
      entryFee,
      prizePool,
      elympicsGameId,
    } = body;

    const game = await prisma.game.create({
      data: {
        name,
        slug,
        description,
        image,
        category,
        subcategory,
        minPlayers: minPlayers || 1,
        maxPlayers: maxPlayers || 2,
        entryFee,
        prizePool,
        elympicsGameId,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, game });
  } catch (error) {
    console.error("Error creating game:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create game" },
      { status: 500 }
    );
  }
}
