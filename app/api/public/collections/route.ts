import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'all';
    const search = searchParams.get('search') || '';

    // Build where clause for filtering
    const whereClause: any = {};

    // Add search filter if provided
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { symbol: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get all public collections with their projects
    const collections = await prisma.collection.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            genre: true
          }
        },
        _count: {
          select: {
            nfts: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform data for the frontend
    const transformedCollections = collections.map(collection => {
      // Parse claim phases to check if there's an active one
      let hasActiveClaimPhase = false;
      if (collection.claimPhases) {
        try {
          const phases = JSON.parse(collection.claimPhases);
          const now = new Date();
          hasActiveClaimPhase = Array.isArray(phases) && phases.some((phase: any) => {
            const startTime = new Date(phase.startTime);
            const endTime = phase.endTime ? new Date(phase.endTime) : null;
            return now >= startTime && (!endTime || now <= endTime);
          });
        } catch (e) {
          console.error('Error parsing claim phases:', e);
        }
      }

      return {
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
        volume: 0, // TODO: Calculate from actual sales
        holders: 0, // TODO: Calculate unique owners
        floorPrice: 0, // TODO: Calculate from listings
        createdAt: collection.createdAt.toISOString(),
        deployedAt: collection.deployedAt?.toISOString()
      };
    });

    // Filter by category after transformation
    let filteredCollections = transformedCollections;
    if (category !== 'all') {
      filteredCollections = transformedCollections.filter(collection => {
        switch (category) {
          case 'live':
            return collection.hasActiveClaimPhase;
          case 'featured':
            return collection.isDeployed && collection.mintedSupply > 0;
          case 'trending':
            return collection.mintedSupply > 10; // Collections with significant minting activity
          default:
            return true;
        }
      });
    }

    return NextResponse.json({
      success: true,
      collections: filteredCollections,
      total: filteredCollections.length
    });
  } catch (error) {
    console.error('Error fetching public collections:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch collections'
    }, { status: 500 });
  }
}