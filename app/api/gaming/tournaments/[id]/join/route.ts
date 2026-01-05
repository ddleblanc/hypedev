import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimitCheck } from "@/lib/rate-limit";

// POST /api/gaming/tournaments/[id]/join - Join a tournament
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limit: blockchain operations (20 req/min with 60s block)
  const rateCheck = await rateLimitCheck(request, "blockchain");
  if (rateCheck.blocked) return rateCheck.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { walletAddress, txHash } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: "Missing wallet address" },
        { status: 400 }
      );
    }

    // Find tournament
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        _count: { select: { participants: true } },
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { success: false, error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Check if registration is open
    if (tournament.status !== "UPCOMING" && tournament.status !== "REGISTRATION") {
      return NextResponse.json(
        { success: false, error: "Tournament registration is closed" },
        { status: 400 }
      );
    }

    // Check if full
    if (tournament._count.participants >= tournament.maxPlayers) {
      return NextResponse.json(
        { success: false, error: "Tournament is full" },
        { status: 400 }
      );
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          walletAddress: walletAddress.toLowerCase(),
          username: `Player${walletAddress.slice(0, 6)}`,
        },
      });
    }

    // Check if already registered
    const existing = await prisma.tournamentParticipant.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId: id,
          userId: user.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Already registered for this tournament" },
        { status: 400 }
      );
    }

    // Create participant
    const participant = await prisma.tournamentParticipant.create({
      data: {
        tournamentId: id,
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
      },
    });

    // Update tournament player count
    await prisma.tournament.update({
      where: { id },
      data: {
        currentPlayers: { increment: 1 },
        // Auto-start registration if this is the first player
        status:
          tournament.status === "UPCOMING" ? "REGISTRATION" : tournament.status,
      },
    });

    return NextResponse.json({
      success: true,
      participant,
      message: "Successfully joined tournament",
    });
  } catch (error) {
    console.error("Error joining tournament:", error);
    return NextResponse.json(
      { success: false, error: "Failed to join tournament" },
      { status: 500 }
    );
  }
}
