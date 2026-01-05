import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

// GET /api/gaming/tournaments/[id] - Get tournament details
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
        game: true,
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
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { success: false, error: "Tournament not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      tournament: {
        ...tournament,
        entryFee: parseFloat(tournament.entryFee.toString()),
        prizePool: parseFloat(tournament.prizePool.toString()),
        currentPlayers: tournament.participants.length,
      },
    });
  } catch (error) {
    console.error("Error fetching tournament:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tournament" },
      { status: 500 }
    );
  }
}

// PATCH /api/gaming/tournaments/[id] - Update tournament status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResult = await rateLimit(request, "apiWrite");
  if (rateLimitResult) return rateLimitResult;

  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const tournament = await prisma.tournament.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, tournament });
  } catch (error) {
    console.error("Error updating tournament:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update tournament" },
      { status: 500 }
    );
  }
}
