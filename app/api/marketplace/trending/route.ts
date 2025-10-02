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
        createdAt: true,
      },
    });

    // Transform data to match the expected format
    const formattedCollections = trendingCollections.map((collection, index) => {
      // Calculate a mock change percentage based on minted supply
      const changePercentage = collection.maxSupply
        ? Math.round((collection.mintedSupply / collection.maxSupply) * 100 * 3)
        : Math.round(Math.random() * 200 + 50);

      return {
        id: collection.id,
        title: collection.name,
        image: collection.image || collection.bannerImage || collection.profileImage || '/api/placeholder/300/450',
        floor: '0.5 ETH', // TODO: Add floor price calculation from blockchain data
        change: `+${changePercentage}%`,
        mintedSupply: collection.mintedSupply,
        maxSupply: collection.maxSupply,
        description: collection.description,
        creatorAddress: collection.creatorAddress,
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
