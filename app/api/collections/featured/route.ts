import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, 'api');
  if (rateLimitResult) return rateLimitResult;
  try {
    // First try to get featured/verified collections
    let featuredCollections = await prisma.collection.findMany({
      where: {
        isDeployed: true,
        OR: [
          { isFeatured: true },
          { isVerified: true },
        ],
      },
      orderBy: [
        { isFeatured: 'desc' },
        { isVerified: 'desc' },
        { mintedSupply: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 8,
      select: {
        id: true,
        name: true,
        image: true,
        bannerImage: true,
        profileImage: true,
        address: true,
        mintedSupply: true,
        maxSupply: true,
        totalSupply: true,
        description: true,
        creatorAddress: true,
        isVerified: true,
        isFeatured: true,
        claimPhases: true,
        createdAt: true,
      },
    });

    // If no featured/verified, fall back to any deployed collections
    if (featuredCollections.length === 0) {
      featuredCollections = await prisma.collection.findMany({
        where: {
          isDeployed: true,
        },
        orderBy: [
          { mintedSupply: 'desc' },
          { createdAt: 'desc' },
        ],
        take: 8,
        select: {
          id: true,
          name: true,
          image: true,
          bannerImage: true,
          profileImage: true,
          address: true,
          mintedSupply: true,
          maxSupply: true,
          totalSupply: true,
          description: true,
          creatorAddress: true,
          isVerified: true,
          isFeatured: true,
          claimPhases: true,
          createdAt: true,
        },
      });
    }

    // Fetch creator names for all collections
    const creatorAddresses = [...new Set(featuredCollections.map(c => c.creatorAddress))];
    const creators = await prisma.user.findMany({
      where: {
        walletAddress: {
          in: creatorAddresses
        }
      },
      select: {
        walletAddress: true,
        username: true,
      }
    });

    // Create a map of creator addresses to usernames
    const creatorMap = new Map(
      creators.map(creator => [
        creator.walletAddress.toLowerCase(),
        creator.username || null
      ])
    );

    // Transform data to match the CollectionCardData type
    const formattedCollections = featuredCollections.map((collection) => {
      // Extract price from claim phases if available
      let floorPrice = '0.08';
      let floorPriceCurrency = 'ETH';

      if (collection.claimPhases) {
        try {
          const phases = JSON.parse(collection.claimPhases as string);
          if (Array.isArray(phases) && phases.length > 0) {
            const now = new Date();
            const activePhase = phases.find((phase: any) => {
              const startTime = new Date(phase.startTimestamp || phase.startTime);
              return now >= startTime;
            }) || phases[0];

            if (activePhase && activePhase.pricePerToken) {
              const priceInWei = BigInt(activePhase.pricePerToken);
              const priceInEth = Number(priceInWei) / 1e18;
              floorPrice = priceInEth.toFixed(6).replace(/\.?0+$/, '');
            }
          }
        } catch (e) {
          console.error('Error parsing claim phases for collection:', collection.id, e);
        }
      }

      // Get creator name from the map
      const creatorName = creatorMap.get(collection.creatorAddress.toLowerCase());

      // Calculate volume (mock for now - would come from marketplace data)
      const volume24h = collection.mintedSupply
        ? `${(collection.mintedSupply * parseFloat(floorPrice) * 0.1).toFixed(2)} ETH`
        : undefined;

      return {
        id: collection.id,
        name: collection.name,
        slug: collection.id,
        image: collection.image || collection.bannerImage || collection.profileImage || '',
        bannerImage: collection.bannerImage || collection.image || '',
        floorPrice,
        floorPriceCurrency,
        volume24h,
        itemCount: collection.maxSupply || collection.totalSupply,
        creatorName: creatorName || undefined,
        creatorAddress: collection.creatorAddress,
        isVerified: collection.isVerified,
        isFeatured: collection.isFeatured,
        isTrending: collection.mintedSupply > 10,
      };
    });

    return NextResponse.json({
      success: true,
      collections: formattedCollections,
    });
  } catch (error) {
    console.error('Error fetching featured collections:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch featured collections',
        collections: [],
      },
      { status: 500 }
    );
  }
}
