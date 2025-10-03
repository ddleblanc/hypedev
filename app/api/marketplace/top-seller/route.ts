import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get the most recent NFT as the top seller for now
    // In production, this would be based on sales volume, price, etc.
    const topNft = await prisma.nft.findFirst({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        collection: {
          select: {
            id: true,
            name: true,
            claimPhases: true,
            projectId: true
          }
        }
      }
    });

    if (!topNft) {
      return NextResponse.json({
        success: false,
        error: "No NFTs found"
      });
    }

    // Check if there's an active claim phase
    let hasActiveClaimPhase = false;
    if (topNft.collection?.claimPhases) {
      try {
        const claimPhases = JSON.parse(topNft.collection.claimPhases);
        const now = new Date();
        hasActiveClaimPhase = claimPhases.some((phase: any) => {
          const startTime = new Date(phase.startTime);
          const endTime = phase.endTime ? new Date(phase.endTime) : null;
          return now >= startTime && (!endTime || now <= endTime);
        });
      } catch (e) {
        console.error('Error parsing claim phases:', e);
      }
    }

    return NextResponse.json({
      success: true,
      nft: {
        id: topNft.id,
        name: topNft.name,
        image: topNft.image,
        collectionName: topNft.collection?.name || 'Unknown Collection',
        collectionId: topNft.collection?.id || '',
        projectId: topNft.collection?.projectId || null,
        hasActiveClaimPhase,
        // Mock data for now - in production would come from sales/pricing data
        floorPrice: "8.5",
        changePercent: "+127%"
      }
    });
  } catch (error) {
    console.error("Error fetching top seller:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch top seller"
    }, { status: 500 });
  }
}
