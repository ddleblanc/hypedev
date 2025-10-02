import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createThirdwebClient, getContract, defineChain } from 'thirdweb';
import { getNFTs, totalSupply } from 'thirdweb/extensions/erc721';

const prisma = new PrismaClient();

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: collectionId } = await params;

    // Fetch collection with related data
    const collection = await prisma.collection.findUnique({
      where: {
        id: collectionId,
      },
      include: {
        collectionTraits: {
          include: {
            values: true,
          },
        },
      },
    });

    if (!collection) {
      return NextResponse.json(
        {
          success: false,
          error: 'Collection not found',
        },
        { status: 404 }
      );
    }

    // Calculate holder statistics from NFTs
    const ownersSet = new Set<string>();
    const nftsForStats = await prisma.nft.findMany({
      where: {
        collectionId: collectionId,
        ownerAddress: { not: null },
      },
      select: {
        ownerAddress: true,
      },
    });

    for (const nft of nftsForStats) {
      if (nft.ownerAddress) {
        ownersSet.add(nft.ownerAddress.toLowerCase());
      }
    }

    const uniqueOwners = ownersSet.size;

    // Count total NFTs owned vs total supply
    const totalNfts = await prisma.nft.count({
      where: { collectionId: collectionId },
    });

    // Fetch blockchain data if deployed
    let onChainSupply = collection.totalSupply || collection.maxSupply || 0;
    if (collection.isDeployed && collection.address) {
      try {
        const chain = defineChain(collection.chainId);
        const contract = getContract({
          client,
          chain,
          address: collection.address,
        });

        // Get total supply from blockchain
        const supply = await totalSupply({ contract });
        onChainSupply = Number(supply);
      } catch (error) {
        console.error('Error fetching on-chain data:', error);
      }
    }

    // Format the collection data to match the expected structure
    const formattedCollection = {
      id: collection.id,
      title: collection.name,
      subtitle: collection.symbol || '',
      description: collection.description || '',
      longDescription: collection.description || '',
      videoUrl: null, // TODO: Add video support to schema if needed
      bannerImage: collection.bannerImage || collection.image || '/api/placeholder/1200/400',
      logo: collection.profileImage || collection.image || '/api/placeholder/120/120',
      contractAddress: collection.address || '',
      blockchain: 'Base', // TODO: Make this dynamic based on chain
      tokenStandard: 'ERC-721',
      createdDate: collection.createdAt.toISOString().split('T')[0],
      creator: {
        name: 'Creator', // TODO: Fetch from User table via creatorAddress
        address: collection.creatorAddress || '',
        avatar: '/api/placeholder/80/80',
        verified: collection.isVerified || false,
        followers: '0', // TODO: Add follower count
        description: '',
      },
      stats: {
        totalSupply: onChainSupply,
        owners: totalNfts,
        uniqueOwners: uniqueOwners,
        floorPrice: '0.00000', // TODO: Fetch from marketplace contract
        floorPriceUSD: 0,
        ceilingPrice: '0.00000',
        volume24h: '0.00000',
        volume7d: '0.00000',
        volume30d: '0.00000',
        volumeAll: '0.00000',
        volumeChange24h: 0,
        volumeChange7d: 0,
        avgPrice: '0.00000',
        avgPrice24h: '0.00000',
        marketCap: '0.00000',
        listedCount: 0,
        listedPercentage: 0,
        sales24h: 0,
        sales7d: 0,
        royalty: collection.royaltyPercentage || 5,
        bestOffer: '0.00000',
      },
      priceHistory: [],
      traits: collection.collectionTraits.map(trait => ({
        name: trait.traitType,
        values: trait.values.map(value => ({
          trait: value.value,
          count: value.frequency,
          percentage: value.rarity,
        })),
      })),
      items: [], // Will be loaded separately
      topHolders: [],
      recentActivity: [],
      socials: collection.socialLinks || {
        website: '',
        twitter: '',
        discord: '',
        medium: '',
      },
    };

    return NextResponse.json({
      success: true,
      collection: formattedCollection,
    });
  } catch (error) {
    console.error('Error fetching collection:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch collection',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
