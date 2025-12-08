import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Fetch projects with their collections for launchpad data
    const projects = await prisma.project.findMany({
      where: {
        status: {
          in: ['active', 'live', 'upcoming', 'published'],
        },
      },
      orderBy: [
        { createdAt: 'desc' },
      ],
      take: 12,
      include: {
        creator: {
          select: {
            username: true,
            walletAddress: true,
            isCreator: true,
          },
        },
        collections: {
          where: {
            isDeployed: true,
          },
          select: {
            id: true,
            name: true,
            image: true,
            bannerImage: true,
            maxSupply: true,
            mintedSupply: true,
            claimPhases: true,
            isVerified: true,
            deployedAt: true,
          },
          take: 1,
        },
      },
    });

    // Transform projects to match LaunchpadProjectData type
    const formattedProjects = projects.map((project) => {
      const collection = project.collections[0];

      // Determine status based on project status
      let status: 'upcoming' | 'live' | 'ended' = 'upcoming';
      if (project.status === 'live' || project.status === 'active') {
        status = 'live';
      } else if (project.status === 'ended' || project.status === 'completed') {
        status = 'ended';
      }

      // Extract mint price from collection claim phases
      let mintPrice = '0.08';
      let mintPriceCurrency = 'ETH';

      if (collection?.claimPhases) {
        try {
          const phases = JSON.parse(collection.claimPhases as string);
          if (Array.isArray(phases) && phases.length > 0) {
            const activePhase = phases[0];
            if (activePhase?.pricePerToken) {
              const priceInWei = BigInt(activePhase.pricePerToken);
              const priceInEth = Number(priceInWei) / 1e18;
              mintPrice = priceInEth.toFixed(6).replace(/\.?0+$/, '');
            }
          }
        } catch (e) {
          console.error('Error parsing claim phases:', e);
        }
      }

      return {
        id: project.id,
        name: project.name,
        slug: project.id,
        image: project.banner || collection?.image || '',
        bannerImage: project.banner || collection?.bannerImage || '',
        description: project.description,
        mintPrice,
        mintPriceCurrency,
        totalSupply: collection?.maxSupply || 10000,
        mintedSupply: collection?.mintedSupply || 0,
        startDate: collection?.deployedAt?.toISOString() || project.createdAt.toISOString(),
        status,
        creatorName: project.creator.username || undefined,
        isVerified: collection?.isVerified || false,
      };
    });

    return NextResponse.json({
      success: true,
      projects: formattedProjects,
    });
  } catch (error) {
    console.error('Error fetching launchpad projects:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch launchpad projects',
        projects: [],
      },
      { status: 500 }
    );
  }
}
