import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Get the collection with all related data
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            genre: true,
            description: true
          }
        },
        _count: {
          select: {
            nfts: true
          }
        }
      }
    });

    if (!collection) {
      return NextResponse.json({
        success: false,
        error: 'Collection not found'
      }, { status: 404 });
    }

    // Parse claim phases to check if there's an active one
    let hasActiveClaimPhase = false;
    let parsedClaimPhases = null;

    if (collection.claimPhases) {
      try {
        parsedClaimPhases = JSON.parse(collection.claimPhases);
        const now = new Date();
        hasActiveClaimPhase = Array.isArray(parsedClaimPhases) && parsedClaimPhases.some((phase: any) => {
          const startTime = new Date(phase.startTime || phase.startTimestamp);
          const endTime = phase.endTime ? new Date(phase.endTime) : null;
          return now >= startTime && (!endTime || now <= endTime);
        });
      } catch (e) {
        console.error('Error parsing claim phases:', e);
      }
    }

    // Transform data for the frontend
    const transformedCollection = {
      id: collection.id,
      name: collection.name,
      symbol: collection.symbol,
      description: collection.description,
      image: collection.image,
      bannerImage: collection.bannerImage,
      projectId: collection.projectId,
      project: collection.project,
      address: collection.address,
      chainId: collection.chainId,
      contractType: collection.contractType,
      maxSupply: collection.maxSupply,
      mintedSupply: collection._count.nfts,
      royaltyPercentage: collection.royaltyPercentage,
      isDeployed: !!collection.address,
      hasActiveClaimPhase,
      claimPhases: collection.claimPhases, // Keep original for detailed parsing
      volume: 0, // TODO: Calculate from actual sales
      holders: 0, // TODO: Calculate unique owners
      floorPrice: 0, // TODO: Calculate from listings
      createdAt: collection.createdAt.toISOString(),
      deployedAt: collection.deployedAt?.toISOString(),
      creatorAddress: collection.creatorAddress,
      about: collection.about,
      story: collection.story,
      utility: collection.utility,
      roadmap: collection.roadmap,
      socialLinks: collection.socialLinks,
      teamMembers: collection.teamMembers,
      tags: collection.tags,
    };

    return NextResponse.json({
      success: true,
      collection: transformedCollection
    });
  } catch (error) {
    console.error('Error fetching collection:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch collection'
    }, { status: 500 });
  }
}