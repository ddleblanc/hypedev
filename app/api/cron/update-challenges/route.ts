/**
 * Cron job for updating challenge status and rankings
 * Schedule: Every 5 minutes for active challenges
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  updateChallengeRankings,
  endChallenge,
  updateDailyChallenges,
} from "@/lib/hype-network/challenge-service";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Rate limit check
  const rateLimitResponse = await rateLimit(request, "api");
  if (rateLimitResponse) return rateLimitResponse;

  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const results = {
      activated: 0,
      ended: 0,
      rankingsUpdated: 0,
      dailyUpdated: false,
    };

    // 1. Activate scheduled challenges that should now be active
    const activated = await prisma.affiliateChallenge.updateMany({
      where: {
        status: "UPCOMING",
        startAt: { lte: now },
      },
      data: { status: "ACTIVE" },
    });
    results.activated = activated.count;

    // 2. Find challenges that have ended and need to be processed
    const endingChallenges = await prisma.affiliateChallenge.findMany({
      where: {
        status: "ACTIVE",
        endAt: { lt: now },
      },
      select: { id: true, name: true },
    });

    // End each challenge (calculate final rankings and distribute prizes)
    for (const challenge of endingChallenges) {
      try {
        await endChallenge(challenge.id);
        results.ended++;
        console.log(`[CRON] Challenge ended: ${challenge.name}`);
      } catch (error) {
        console.error(`[CRON] Error ending challenge ${challenge.id}:`, error);
      }
    }

    // 3. Update rankings for all active challenges
    const activeChallenges = await prisma.affiliateChallenge.findMany({
      where: { status: "ACTIVE" },
      select: { id: true },
    });

    for (const challenge of activeChallenges) {
      try {
        await updateChallengeRankings(challenge.id);
        results.rankingsUpdated++;
      } catch (error) {
        console.error(`[CRON] Error updating rankings for ${challenge.id}:`, error);
      }
    }

    // 4. Update daily-based challenges (streak/consistency) - once per hour
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();
    if (currentMinute < 5) {
      // Run in the first 5 minutes of each hour
      try {
        await updateDailyChallenges();
        results.dailyUpdated = true;
        console.log("[CRON] Daily challenges updated");
      } catch (error) {
        console.error("[CRON] Error updating daily challenges:", error);
      }
    }

    console.log("[CRON] Challenge update completed:", results);

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      ...results,
    });
  } catch (error) {
    console.error("[CRON] Error in challenge update:", error);
    return NextResponse.json(
      { error: "Failed to update challenges" },
      { status: 500 }
    );
  }
}
