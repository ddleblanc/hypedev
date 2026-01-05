/**
 * Check Attribution Route
 * POST /api/hype-network/check-attribution
 *
 * Checks if current user has valid attribution for a purchase.
 * Used by the transaction drawer to display "Referred by" info.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAttributionData } from "@/lib/hype-network/attribution";

const CheckAttributionSchema = z.object({
  collectionId: z.string().optional(),
  lootboxId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = CheckAttributionSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ isAttributed: false });
    }

    const { collectionId, lootboxId } = parseResult.data;

    // Get attribution data from cookie
    const attribution = await getAttributionData();

    if (!attribution) {
      return NextResponse.json({ isAttributed: false });
    }

    // Get link with campaign and agent info
    const link = await prisma.affiliateLink.findUnique({
      where: { id: attribution.linkId },
      include: {
        agent: {
          select: { agentTag: true, agentName: true },
        },
        campaign: {
          select: {
            collectionId: true,
            lootboxId: true,
            baseCommissionBps: true,
            status: true,
          },
        },
      },
    });

    // Link not found or campaign not active
    if (!link || link.campaign.status !== "ACTIVE") {
      return NextResponse.json({ isAttributed: false });
    }

    // Check if campaign matches purchase target
    const matchesCollection =
      collectionId && link.campaign.collectionId === collectionId;
    const matchesLootbox =
      lootboxId && link.campaign.lootboxId === lootboxId;

    if (!matchesCollection && !matchesLootbox) {
      return NextResponse.json({ isAttributed: false });
    }

    // Return attribution info
    return NextResponse.json({
      isAttributed: true,
      agentTag: link.agent.agentTag,
      agentName: link.agent.agentName,
      commissionRate: link.campaign.baseCommissionBps / 100, // Convert bps to percentage
    });
  } catch (error) {
    console.error("[API] Check attribution error:", error);
    return NextResponse.json({ isAttributed: false });
  }
}
