/**
 * Gaming tRPC Router
 * Handles all gaming-related procedures: games, matches, tournaments, leaderboard, stats
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../index";
import { auth } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

// =============================================================================
// Constants
// =============================================================================

const TournamentStatusValues = [
  "UPCOMING",
  "REGISTRATION",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
] as const;

const MatchStatusValues = [
  "PENDING",
  "MATCHMAKING",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "DISPUTED",
] as const;

const GameCategoryValues = ["casual", "competitive", "casino", "1v1"] as const;

// =============================================================================
// Mock Data (until database is seeded)
// =============================================================================

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

const MOCK_TOURNAMENTS = [
  {
    id: "tournament-1",
    gameId: "game-2",
    name: "Weekly FPS Championship",
    description: "Weekly competitive tournament",
    image: "/api/placeholder/800/400",
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
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
    startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
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

// =============================================================================
// Input Schemas - Games
// =============================================================================

const GetGamesInput = z.object({
  category: z.enum(GameCategoryValues).optional(),
  subcategory: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
});

const GetGameInput = z.object({
  id: z.string(),
});

const CreateGameInput = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  image: z.string(),
  category: z.enum(GameCategoryValues),
  subcategory: z.string().optional(),
  minPlayers: z.number().min(1).default(1),
  maxPlayers: z.number().min(1).default(2),
  entryFee: z.number().optional(),
  prizePool: z.number().optional(),
  elympicsGameId: z.string().optional(),
});

// =============================================================================
// Input Schemas - Tournaments
// =============================================================================

const GetTournamentsInput = z.object({
  gameId: z.string().optional(),
  status: z.enum(TournamentStatusValues).optional(),
  limit: z.number().min(1).max(100).default(20),
});

const GetTournamentInput = z.object({
  id: z.string().uuid(),
});

const CreateTournamentInput = z.object({
  gameId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  image: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  entryFee: z.number().min(0),
  prizePool: z.number().min(0),
  maxPlayers: z.number().min(2),
  format: z.enum(["single_elimination", "double_elimination", "round_robin"]).default("single_elimination"),
});

const JoinTournamentInput = z.object({
  tournamentId: z.string().uuid(),
  walletAddress: z.string().min(1),
});

// =============================================================================
// Input Schemas - Matches
// =============================================================================

const FindMatchInput = z.object({
  gameId: z.string(),
  walletAddress: z.string().min(1),
  matchType: z.string().optional(),
  wager: z.object({
    amount: z.number().optional(),
    type: z.string().optional(),
  }).optional(),
});

const GetMatchInput = z.object({
  id: z.string().uuid(),
});

const CancelMatchInput = z.object({
  matchId: z.string().uuid(),
  walletAddress: z.string().min(1),
});

// =============================================================================
// Input Schemas - Leaderboard
// =============================================================================

const GetLeaderboardInput = z.object({
  gameId: z.string().optional(),
  gameSlug: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

// =============================================================================
// Input Schemas - Player Stats
// =============================================================================

const GetPlayerStatsInput = z.object({
  userId: z.string().optional(),
  walletAddress: z.string().optional(),
  gameId: z.string().optional(),
});

// =============================================================================
// Games Router
// =============================================================================

const gamesRouter = router({
  /**
   * List all games
   */
  list: publicProcedure.input(GetGamesInput).query(async ({ ctx, input }) => {
    const { category, subcategory, limit } = input;

    const where: Prisma.GameWhereInput = { isActive: true };
    if (category) where.category = category;
    if (subcategory) where.subcategory = subcategory;

    let games = await ctx.prisma.game.findMany({
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

      return {
        games: mockGames.map((g) => ({
          ...g,
          _count: { tournaments: 0, matches: 0 },
        })),
        source: "mock" as const,
      };
    }

    return {
      games: games.map((g) => ({
        ...g,
        entryFee: g.entryFee ? parseFloat(g.entryFee.toString()) : null,
        prizePool: g.prizePool ? parseFloat(g.prizePool.toString()) : null,
      })),
      source: "database" as const,
    };
  }),

  /**
   * Get a single game by ID or slug
   */
  byId: publicProcedure.input(GetGameInput).query(async ({ ctx, input }) => {
    const game = await ctx.prisma.game.findFirst({
      where: {
        OR: [{ id: input.id }, { slug: input.id }],
      },
      include: {
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
      // Check mock data
      const mockGame = MOCK_GAMES.find((g) => g.id === input.id || g.slug === input.id);
      if (mockGame) {
        return {
          ...mockGame,
          _count: { tournaments: 0, matches: 0, playerStats: 0 },
          source: "mock" as const,
        };
      }

      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Game not found",
      });
    }

    return {
      ...game,
      entryFee: game.entryFee ? parseFloat(game.entryFee.toString()) : null,
      prizePool: game.prizePool ? parseFloat(game.prizePool.toString()) : null,
      source: "database" as const,
    };
  }),

  /**
   * Create a new game (admin only in production)
   */
  create: protectedProcedure.input(CreateGameInput).mutation(async ({ ctx, input }) => {
    const game = await ctx.prisma.game.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        image: input.image,
        category: input.category,
        subcategory: input.subcategory,
        minPlayers: input.minPlayers,
        maxPlayers: input.maxPlayers,
        entryFee: input.entryFee,
        prizePool: input.prizePool,
        elympicsGameId: input.elympicsGameId,
        isActive: true,
      },
    });

    return { success: true as const, game };
  }),
});

// =============================================================================
// Tournaments Router
// =============================================================================

const tournamentsRouter = router({
  /**
   * List tournaments
   */
  list: publicProcedure.input(GetTournamentsInput).query(async ({ ctx, input }) => {
    const { gameId, status, limit } = input;

    const where: Prisma.TournamentWhereInput = {};
    if (gameId) where.gameId = gameId;
    if (status) where.status = status;

    let tournaments = await ctx.prisma.tournament.findMany({
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

      return {
        tournaments: mock,
        source: "mock" as const,
      };
    }

    return {
      tournaments: tournaments.map((t) => ({
        ...t,
        entryFee: parseFloat(t.entryFee.toString()),
        prizePool: parseFloat(t.prizePool.toString()),
        currentPlayers: t._count.participants,
      })),
      source: "database" as const,
    };
  }),

  /**
   * Get a single tournament by ID
   */
  byId: publicProcedure.input(GetTournamentInput).query(async ({ ctx, input }) => {
    const tournament = await ctx.prisma.tournament.findUnique({
      where: { id: input.id },
      include: {
        game: {
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
          },
        },
        participants: {
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
          orderBy: { seed: "asc" },
        },
        brackets: {
          orderBy: [{ round: "asc" }, { matchNumber: "asc" }],
        },
        _count: {
          select: {
            participants: true,
            brackets: true,
          },
        },
      },
    });

    if (!tournament) {
      // Check mock data
      const mockTournament = MOCK_TOURNAMENTS.find((t) => t.id === input.id);
      if (mockTournament) {
        return {
          ...mockTournament,
          participants: [],
          brackets: [],
          source: "mock" as const,
        };
      }

      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Tournament not found",
      });
    }

    return {
      ...tournament,
      entryFee: parseFloat(tournament.entryFee.toString()),
      prizePool: parseFloat(tournament.prizePool.toString()),
      currentPlayers: tournament._count.participants,
      source: "database" as const,
    };
  }),

  /**
   * Create a new tournament
   */
  create: protectedProcedure.input(CreateTournamentInput).mutation(async ({ ctx, input }) => {
    const tournament = await ctx.prisma.tournament.create({
      data: {
        gameId: input.gameId,
        name: input.name,
        description: input.description,
        image: input.image,
        startTime: new Date(input.startTime),
        endTime: input.endTime ? new Date(input.endTime) : null,
        entryFee: input.entryFee,
        prizePool: input.prizePool,
        maxPlayers: input.maxPlayers,
        format: input.format,
        status: "UPCOMING",
      },
      include: {
        game: true,
      },
    });

    return { success: true as const, tournament };
  }),

  /**
   * Join a tournament
   */
  join: protectedProcedure.input(JoinTournamentInput).mutation(async ({ ctx, input }) => {
    const { tournamentId, walletAddress } = input;

    // Verify the caller matches the wallet address
    if (ctx.walletAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You can only join tournaments from your own wallet",
      });
    }

    // Find user
    const user = await auth.getUserByWallet(walletAddress);
    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Find tournament
    const tournament = await ctx.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        _count: { select: { participants: true } },
      },
    });

    if (!tournament) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Tournament not found",
      });
    }

    // Check tournament status
    if (tournament.status !== "UPCOMING" && tournament.status !== "REGISTRATION") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Tournament is not accepting registrations",
      });
    }

    // Check if tournament is full
    if (tournament._count.participants >= tournament.maxPlayers) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Tournament is full",
      });
    }

    // Check if user is already registered
    const existingParticipant = await ctx.prisma.tournamentParticipant.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId,
          userId: user.id,
        },
      },
    });

    if (existingParticipant) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "You are already registered for this tournament",
      });
    }

    // Create participant entry
    const participant = await ctx.prisma.tournamentParticipant.create({
      data: {
        tournamentId,
        userId: user.id,
        seed: tournament._count.participants + 1,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
        tournament: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Update tournament status to REGISTRATION if it was UPCOMING
    if (tournament.status === "UPCOMING") {
      await ctx.prisma.tournament.update({
        where: { id: tournamentId },
        data: { status: "REGISTRATION" },
      });
    }

    return { success: true as const, participant };
  }),

  /**
   * Get tournament brackets
   */
  brackets: publicProcedure.input(GetTournamentInput).query(async ({ ctx, input }) => {
    const brackets = await ctx.prisma.tournamentBracket.findMany({
      where: { tournamentId: input.id },
      orderBy: [{ round: "asc" }, { matchNumber: "asc" }],
    });

    return { brackets };
  }),
});

// =============================================================================
// Matches Router
// =============================================================================

const matchesRouter = router({
  /**
   * Find/request a match (matchmaking)
   */
  find: protectedProcedure.input(FindMatchInput).mutation(async ({ ctx, input }) => {
    const { gameId, walletAddress, wager } = input;

    // Verify the caller matches the wallet address
    if (ctx.walletAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You can only request matches from your own wallet",
      });
    }

    // Find game
    const game = await ctx.prisma.game.findFirst({
      where: { OR: [{ id: gameId }, { slug: gameId }] },
    });

    if (!game) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Game not found",
      });
    }

    // Find or create user
    let user = await ctx.prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() },
    });

    if (!user) {
      user = await ctx.prisma.user.create({
        data: {
          walletAddress: walletAddress.toLowerCase(),
          username: `Player${walletAddress.slice(0, 6)}`,
        },
      });
    }

    // Check for existing pending match to join
    const existingMatch = await ctx.prisma.match.findFirst({
      where: {
        gameId: game.id,
        status: "MATCHMAKING",
        player2Id: null,
        player1Id: { not: user.id },
      },
      orderBy: { createdAt: "asc" },
    });

    if (existingMatch) {
      // Join existing match
      const match = await ctx.prisma.match.update({
        where: { id: existingMatch.id },
        data: {
          player2Id: user.id,
          status: "IN_PROGRESS",
          startedAt: new Date(),
        },
        include: {
          player1: {
            select: { id: true, username: true, profilePicture: true },
          },
          player2: {
            select: { id: true, username: true, profilePicture: true },
          },
          game: true,
        },
      });

      return {
        success: true as const,
        status: "matched" as const,
        match: {
          ...match,
          wagerAmount: match.wagerAmount ? parseFloat(match.wagerAmount.toString()) : null,
        },
      };
    }

    // Create new match and wait for opponent
    const match = await ctx.prisma.match.create({
      data: {
        gameId: game.id,
        player1Id: user.id,
        status: "MATCHMAKING",
        wagerAmount: wager?.amount ? parseFloat(String(wager.amount)) : null,
        wagerType: wager?.type || null,
      },
      include: {
        player1: {
          select: { id: true, username: true, profilePicture: true },
        },
        game: true,
      },
    });

    return {
      success: true as const,
      status: "searching" as const,
      match: {
        ...match,
        wagerAmount: match.wagerAmount ? parseFloat(match.wagerAmount.toString()) : null,
      },
      message: "Searching for opponent...",
    };
  }),

  /**
   * Get a single match by ID
   */
  byId: publicProcedure.input(GetMatchInput).query(async ({ ctx, input }) => {
    const match = await ctx.prisma.match.findUnique({
      where: { id: input.id },
      include: {
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
        game: true,
      },
    });

    if (!match) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Match not found",
      });
    }

    return {
      ...match,
      wagerAmount: match.wagerAmount ? parseFloat(match.wagerAmount.toString()) : null,
    };
  }),

  /**
   * Cancel matchmaking
   */
  cancel: protectedProcedure.input(CancelMatchInput).mutation(async ({ ctx, input }) => {
    const { matchId, walletAddress } = input;

    // Verify the caller matches the wallet address
    if (ctx.walletAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You can only cancel your own matchmaking requests",
      });
    }

    const user = await ctx.prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Cancel the match if user is player1 and still searching
    const match = await ctx.prisma.match.findFirst({
      where: {
        id: matchId,
        player1Id: user.id,
        status: "MATCHMAKING",
      },
    });

    if (!match) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Match not found or cannot be cancelled",
      });
    }

    await ctx.prisma.match.update({
      where: { id: matchId },
      data: { status: "CANCELLED" },
    });

    return { success: true as const, message: "Matchmaking cancelled" };
  }),
});

// =============================================================================
// Leaderboard Router
// =============================================================================

const leaderboardRouter = router({
  /**
   * Get leaderboard (global or game-specific)
   */
  list: publicProcedure.input(GetLeaderboardInput).query(async ({ ctx, input }) => {
    const { gameId, gameSlug, limit, offset } = input;

    const where: Prisma.PlayerStatsWhereInput = {};
    if (gameId) {
      where.gameId = gameId;
    } else if (gameSlug) {
      const game = await ctx.prisma.game.findFirst({ where: { slug: gameSlug } });
      if (game) where.gameId = game.id;
    }

    const isGlobalLeaderboard = !gameId && !gameSlug;

    let leaderboard: Array<{
      rank: number;
      user: { id: string; displayName: string | null; avatarUrl: string | null };
      game?: { id: string; name: string; slug: string } | null;
      rating: number;
      peakRating: number | null;
      wins: number;
      losses: number;
      draws: number;
      winRate: string;
      streak: number;
      totalEarnings: number;
    }> = [];
    let totalCount = 0;

    if (isGlobalLeaderboard) {
      // Get all player stats with users
      const allStats = await ctx.prisma.playerStats.findMany({
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
      const userStatsMap = new Map<
        string,
        {
          user: (typeof allStats)[0]["user"];
          bestRating: number;
          peakRating: number;
          totalWins: number;
          totalLosses: number;
          totalDraws: number;
          bestStreak: number;
          totalEarnings: number;
        }
      >();

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
      const aggregatedStats = Array.from(userStatsMap.values()).sort(
        (a, b) => b.bestRating - a.bestRating
      );

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
        winRate:
          stat.totalWins + stat.totalLosses > 0
            ? ((stat.totalWins / (stat.totalWins + stat.totalLosses)) * 100).toFixed(1)
            : "0.0",
        streak: stat.bestStreak,
        totalEarnings: stat.totalEarnings,
      }));
    } else {
      // Game-specific leaderboard
      const stats = await ctx.prisma.playerStats.findMany({
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

      totalCount = await ctx.prisma.playerStats.count({ where });

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
        winRate:
          stat.wins + stat.losses > 0
            ? ((stat.wins / (stat.wins + stat.losses)) * 100).toFixed(1)
            : "0.0",
        streak: stat.streak,
        totalEarnings: parseFloat(stat.totalEarnings.toString()),
      }));
    }

    // Fall back to mock data if no results
    if (leaderboard.length === 0) {
      return {
        leaderboard: MOCK_LEADERBOARD.slice(offset, offset + limit).map((entry, index) => ({
          ...entry,
          rank: offset + index + 1,
          user: {
            id: `mock-${index}`,
            displayName: entry.displayName,
            avatarUrl: null,
          },
          peakRating: entry.rating,
          draws: 0,
          winRate: ((entry.wins / (entry.wins + entry.losses)) * 100).toFixed(1),
          streak: 0,
          totalEarnings: entry.earnings,
        })),
        source: "mock" as const,
        pagination: {
          total: MOCK_LEADERBOARD.length,
          limit,
          offset,
        },
      };
    }

    return {
      leaderboard,
      source: "database" as const,
      pagination: {
        total: totalCount,
        limit,
        offset,
      },
    };
  }),
});

// =============================================================================
// Player Stats Router
// =============================================================================

const statsRouter = router({
  /**
   * Get player stats
   */
  byUser: publicProcedure.input(GetPlayerStatsInput).query(async ({ ctx, input }) => {
    const { userId, walletAddress, gameId } = input;

    if (!userId && !walletAddress) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Either userId or walletAddress is required",
      });
    }

    let targetUserId = userId;

    if (!targetUserId && walletAddress) {
      const user = await auth.getUserByWallet(walletAddress);
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }
      targetUserId = user.id;
    }

    const where: Prisma.PlayerStatsWhereInput = { userId: targetUserId };
    if (gameId) where.gameId = gameId;

    const stats = await ctx.prisma.playerStats.findMany({
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
        user: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
      },
      orderBy: { rating: "desc" },
    });

    // Calculate aggregates
    const aggregates = stats.reduce(
      (acc, stat) => {
        acc.totalWins += stat.wins;
        acc.totalLosses += stat.losses;
        acc.totalDraws += stat.draws;
        acc.totalEarnings += parseFloat(stat.totalEarnings.toString());
        acc.bestRating = Math.max(acc.bestRating, stat.rating);
        acc.peakRating = Math.max(acc.peakRating, stat.peakRating || stat.rating);
        return acc;
      },
      {
        totalWins: 0,
        totalLosses: 0,
        totalDraws: 0,
        totalEarnings: 0,
        bestRating: 0,
        peakRating: 0,
      }
    );

    return {
      stats: stats.map((s) => ({
        ...s,
        totalEarnings: parseFloat(s.totalEarnings.toString()),
      })),
      aggregates: {
        ...aggregates,
        gamesPlayed: stats.length,
        winRate:
          aggregates.totalWins + aggregates.totalLosses > 0
            ? ((aggregates.totalWins / (aggregates.totalWins + aggregates.totalLosses)) * 100).toFixed(1)
            : "0.0",
      },
    };
  }),
});

// =============================================================================
// Export Combined Gaming Router
// =============================================================================

export const gamingRouter = router({
  games: gamesRouter,
  tournaments: tournamentsRouter,
  matches: matchesRouter,
  leaderboard: leaderboardRouter,
  stats: statsRouter,
});
