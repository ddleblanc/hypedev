import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Fetch collections with most minted NFTs as a proxy for trending
    // You can modify this logic based on your trending criteria
    const trendingCollections = await prisma.collection.findMany({
      where: {
        isDeployed: true,
      },
      orderBy: [
        { mintedSupply: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 6,
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

    // Fetch creator names for all collections
    const creatorAddresses = [...new Set(trendingCollections.map(c => c.creatorAddress))];
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

    // Transform data to match the expected format
    const formattedCollections = trendingCollections.map((collection, index) => {
      // Calculate a mock change percentage based on minted supply
      const changePercentage = collection.maxSupply
        ? Math.round((collection.mintedSupply / collection.maxSupply) * 100 * 3)
        : Math.round(Math.random() * 200 + 50);

      // Extract price from claim phases if available
      let floorPrice = '0.08 ETH'; // Default price
      if (collection.claimPhases) {
        try {
          const phases = JSON.parse(collection.claimPhases as string);
          if (Array.isArray(phases) && phases.length > 0) {
            // Get the current or most recent phase
            const now = new Date();
            const activePhase = phases.find((phase: any) => {
              const startTime = new Date(phase.startTimestamp || phase.startTime);
              return now >= startTime;
            }) || phases[0]; // Use first phase if no active one

            if (activePhase && activePhase.pricePerToken) {
              // Convert from wei to ETH (divide by 10^18)
              const priceInWei = BigInt(activePhase.pricePerToken);
              const priceInEth = Number(priceInWei) / 1e18;
              floorPrice = `${priceInEth} ETH`;
            }
          }
        } catch (e) {
          console.error('Error parsing claim phases for collection:', collection.id, e);
        }
      }

      // Get creator name from the map
      const creatorName = creatorMap.get(collection.creatorAddress.toLowerCase());

      return {
        id: collection.id,
        title: collection.name,
        image: collection.image || collection.bannerImage || collection.profileImage || '/api/placeholder/300/450',
        floor: floorPrice,
        change: `+${changePercentage}%`,
        mintedSupply: collection.mintedSupply,
        maxSupply: collection.maxSupply,
        description: collection.description,
        creatorAddress: collection.creatorAddress,
        creatorName: creatorName,
        isVerified: collection.isVerified,
        isFeatured: collection.isFeatured,
      };
    });

    return NextResponse.json({
      success: true,
      collections: formattedCollections,
    });
  } catch (error) {
    console.error('Error fetching trending collections:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch trending collections',
        collections: [],
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
