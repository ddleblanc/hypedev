import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: collectionId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Fetch NFTs for this collection
    const [nfts, totalCount] = await Promise.all([
      prisma.nft.findMany({
        where: {
          collectionId: collectionId,
        },
        skip,
        take: limit,
        orderBy: {
          tokenId: 'asc',
        },
        include: {
          traits: true,
        },
      }),
      prisma.nft.count({
        where: {
          collectionId: collectionId,
        },
      }),
    ]);

    // Format NFTs to match expected structure
    const formattedNfts = nfts.map((nft, index) => ({
      id: parseInt(nft.tokenId),
      name: nft.name || `#${nft.tokenId}`,
      price: '0', // TODO: Fetch from blockchain marketplace
      lastSale: '0',
      image: nft.image || '/api/placeholder/300/450',
      rarity: nft.rarityTier || 'Common',
      rank: nft.rarityRank || (skip + index + 1),
      likes: 0,
      owner: nft.ownerAddress || '',
      listed: false, // TODO: Check marketplace listing status
      hasOffer: false,
      offerPrice: '0',
      traits: nft.traits.map(trait => ({
        trait_type: trait.traitType,
        value: trait.value,
      })),
    }));

    return NextResponse.json({
      success: true,
      nfts: formattedNfts,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching NFTs:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch NFTs',
        nfts: [],
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
