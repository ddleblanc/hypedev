import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import {
  generateBracket,
  isValidTournamentFormat,
  calculateRoundRobinStandings,
  type TournamentFormat,
} from "@/lib/tournament";

// ============ GET Handler ============

// GET /api/gaming/tournaments/[id]/brackets - Get tournament bracket
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResult = await rateLimit(request, "api");
  if (rateLimitResult) return rateLimitResult;

  try {
    const { id } = await params;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        brackets: {
          orderBy: [{ round: "asc" }, { matchNumber: "asc" }],
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
        game: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { success: false, error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Build bracket structure for frontend
    const rounds: Record<number, any[]> = {};
    for (const bracket of tournament.brackets) {
      if (!rounds[bracket.round]) {
        rounds[bracket.round] = [];
      }

      // Get player info
      const player1 = tournament.participants.find(
        (p) => p.userId === bracket.player1Id
      );
      const player2 = tournament.participants.find(
        (p) => p.userId === bracket.player2Id
      );
      const winner = tournament.participants.find(
        (p) => p.userId === bracket.winnerId
      );

      rounds[bracket.round].push({
        id: bracket.id,
        matchNumber: bracket.matchNumber,
        player1: player1?.user || null,
        player2: player2?.user || null,
        winner: winner?.user || null,
        score1: bracket.score1,
        score2: bracket.score2,
        status: bracket.status,
        scheduledAt: bracket.scheduledAt,
        completedAt: bracket.completedAt,
      });
    }

    // For round robin, also calculate standings
    let standings = null;
    if (tournament.format === "round_robin") {
      const bracketMatches = tournament.brackets.map((b) => ({
        round: b.round,
        matchNumber: b.matchNumber,
        position: b.matchNumber - 1,
        player1Id: b.player1Id,
        player2Id: b.player2Id,
        winnerId: b.winnerId,
        score1: b.score1,
        score2: b.score2,
        status: b.status as "pending" | "in_progress" | "completed" | "bye",
        bracket: "winners" as const,
      }));

      const rawStandings = calculateRoundRobinStandings(bracketMatches);

      // Enrich standings with user data
      standings = rawStandings.map((s) => {
        const participant = tournament.participants.find(
          (p) => p.userId === s.playerId
        );
        return {
          ...s,
          user: participant?.user || null,
          seed: participant?.seed,
        };
      });
    }

    return NextResponse.json({
      success: true,
      tournament: {
        id: tournament.id,
        name: tournament.name,
        format: tournament.format,
        status: tournament.status,
        game: tournament.game,
        entryFee: parseFloat(tournament.entryFee.toString()),
        prizePool: parseFloat(tournament.prizePool.toString()),
      },
      brackets: rounds,
      standings,
      participants: tournament.participants.map((p) => ({
        ...p.user,
        seed: p.seed,
        eliminated: p.eliminated,
        placement: p.placement,
      })),
      totalRounds: Object.keys(rounds).length,
    });
  } catch (error) {
    console.error("Error fetching brackets:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch brackets" },
      { status: 500 }
    );
  }
}

// ============ POST Handler ============

const GenerateBracketsSchema = z.object({
  shuffle: z.boolean().optional().default(false),
  seeded: z.boolean().optional().default(true),
});

// POST /api/gaming/tournaments/[id]/brackets - Generate brackets
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResult = await rateLimit(request, "apiWrite");
  if (rateLimitResult) return rateLimitResult;

  try {
    const { id } = await params;

    // Parse optional body
    let options = { shuffle: false, seeded: true };
    try {
      const body = await request.json();
      const parseResult = GenerateBracketsSchema.safeParse(body);
      if (parseResult.success) {
        options = parseResult.data;
      }
    } catch {
      // Use defaults if no body
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        participants: {
          orderBy: { seed: "asc" },
        },
        brackets: true,
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { success: false, error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Check if brackets already exist
    if (tournament.brackets.length > 0) {
      return NextResponse.json(
        { success: false, error: "Brackets already generated. Delete existing brackets first." },
        { status: 400 }
      );
    }

    const numPlayers = tournament.participants.length;
    if (numPlayers < 2) {
      return NextResponse.json(
        { success: false, error: "Need at least 2 participants" },
        { status: 400 }
      );
    }

    // Validate tournament format
    if (!isValidTournamentFormat(tournament.format)) {
      return NextResponse.json(
        { success: false, error: `Invalid tournament format: ${tournament.format}` },
        { status: 400 }
      );
    }

    // Generate brackets using the tournament library
    const playerIds = tournament.participants.map((p) => p.userId);
    const generatedBracket = generateBracket({
      playerIds,
      format: tournament.format as TournamentFormat,
      seeded: options.seeded,
      shuffle: options.shuffle,
    });

    // Convert to database format
    const bracketsToCreate = generatedBracket.matches.map((match) => ({
      tournamentId: id,
      round: match.round,
      matchNumber: match.matchNumber + 1, // 1-indexed for DB
      player1Id: match.player1Id,
      player2Id: match.player2Id,
      winnerId: match.winnerId || null,
      status: match.status,
    }));

    // Create all brackets in a transaction
    await prisma.$transaction([
      prisma.tournamentBracket.createMany({
        data: bracketsToCreate,
      }),
      prisma.tournament.update({
        where: { id },
        data: { status: "IN_PROGRESS" },
      }),
    ]);

    // Handle automatic byes (matches where one player is null)
    const byeMatches = generatedBracket.matches.filter(
      (m) => m.status === "bye" && m.winnerId
    );

    if (byeMatches.length > 0) {
      // Update bye matches as completed
      for (const byeMatch of byeMatches) {
        await prisma.tournamentBracket.updateMany({
          where: {
            tournamentId: id,
            round: byeMatch.round,
            matchNumber: byeMatch.matchNumber + 1,
          },
          data: {
            status: "completed",
            winnerId: byeMatch.winnerId,
            completedAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Brackets generated successfully",
      format: generatedBracket.format,
      bracketCount: generatedBracket.totalMatches,
      rounds: generatedBracket.totalRounds,
      byeCount: byeMatches.length,
    });
  } catch (error) {
    console.error("Error generating brackets:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate brackets" },
      { status: 500 }
    );
  }
}

// ============ DELETE Handler ============

// DELETE /api/gaming/tournaments/[id]/brackets - Delete all brackets (reset tournament)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResult = await rateLimit(request, "apiWrite");
  if (rateLimitResult) return rateLimitResult;

  try {
    const { id } = await params;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
    });

    if (!tournament) {
      return NextResponse.json(
        { success: false, error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Only allow reset if tournament hasn't started or is in progress
    if (tournament.status === "COMPLETED") {
      return NextResponse.json(
        { success: false, error: "Cannot reset completed tournament" },
        { status: 400 }
      );
    }

    // Delete all brackets and reset tournament status
    await prisma.$transaction([
      prisma.tournamentBracket.deleteMany({
        where: { tournamentId: id },
      }),
      prisma.tournamentParticipant.updateMany({
        where: { tournamentId: id },
        data: {
          eliminated: false,
          placement: null,
        },
      }),
      prisma.tournament.update({
        where: { id },
        data: { status: "REGISTRATION" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Tournament brackets reset",
    });
  } catch (error) {
    console.error("Error resetting brackets:", error);
    return NextResponse.json(
      { success: false, error: "Failed to reset brackets" },
      { status: 500 }
    );
  }
}
