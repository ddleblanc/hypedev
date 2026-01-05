import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/thirdweb-auth";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, "api");
  if (rateLimitResult) return rateLimitResult;

  try {
    const walletAddress = await requireAuth();

    const user = await prisma.user.findUnique({
      where: { walletAddress },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({
        success: true,
        agent: null,
        isRegistered: false,
      });
    }

    const agent = await prisma.hypeAgent.findUnique({
      where: { userId: user.id },
      include: {
        user: {
          select: {
            username: true,
            profilePicture: true,
            walletAddress: true,
          },
        },
        _count: {
          select: {
            links: true,
            commissions: true,
            achievements: true,
            challengeParticipations: true,
          },
        },
      },
    });

    if (!agent) {
      return NextResponse.json({
        success: true,
        agent: null,
        isRegistered: false,
      });
    }

    return NextResponse.json({
      success: true,
      agent: {
        id: agent.id,
        agentTag: agent.agentTag,
        agentName: agent.agentName,
        avatar: agent.avatar,
        bio: agent.bio,
        totalXp: agent.totalXp,
        currentRank: agent.currentRank,
        rankProgress: agent.rankProgress,
        totalReferrals: agent.totalReferrals,
        totalEarnings: agent.totalEarnings.toString(),
        totalCampaigns: agent.totalCampaigns,
        totalChallengesWon: agent.totalChallengesWon,
        currentStreak: agent.currentStreak,
        longestStreak: agent.longestStreak,
        commissionMultiplier: agent.commissionMultiplier,
        isVerified: agent.isVerified,
        user: agent.user,
        counts: agent._count,
        createdAt: agent.createdAt,
      },
      isRegistered: true,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error("Error fetching agent:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch agent profile" },
      { status: 500 }
    );
  }
}
