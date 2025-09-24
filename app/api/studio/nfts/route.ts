import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    
    console.log('NFT Creation API called with address:', address);
    
    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log('Request body received:', JSON.stringify(body, null, 2));
    const { 
      collectionId,
      tokenId,
      name,
      description,
      image,
      metadataUri,
      attributes,
      transactionHash,
      ownerAddress
    } = body;

    if (!collectionId || !name || !image || !metadataUri) {
      return NextResponse.json(
        { success: false, error: 'Collection ID, name, image, and metadata URI are required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await auth.getUserByWallet(address);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify collection exists and user has permission
    const collection = await prisma.collection.findFirst({
      where: {
        id: collectionId,
        creatorAddress: address.toLowerCase(),
      },
    });

    if (!collection) {
      return NextResponse.json(
        { success: false, error: 'Collection not found or unauthorized' },
        { status: 403 }
      );
    }

    // Generate next token ID if not provided
    let nextTokenId = tokenId;
    if (!nextTokenId) {
      const lastNft = await prisma.nft.findFirst({
        where: { collectionId },
        orderBy: { tokenId: 'desc' },
      });
      
      const lastTokenIdNum = lastNft ? parseInt(lastNft.tokenId) : 0;
      nextTokenId = (lastTokenIdNum + 1).toString();
    }

    // Create NFT record
    const nft = await prisma.nft.create({
      data: {
        tokenId: nextTokenId,
        collectionId,
        name,
        description: description || '',
        image,
        metadataUri,
        attributes: attributes || {},
        ownerAddress: ownerAddress || address.toLowerCase(),
        isMinted: true, // Since we're using lazy minting, it's ready for claiming
        mintedAt: new Date(),
        traitCount: Array.isArray(attributes) ? attributes.length : 0,
      },
      include: {
        collection: {
          select: {
            name: true,
            symbol: true,
            address: true,
          },
        },
      },
    });

    // Process attributes to create individual trait records for better querying
    if (attributes && Array.isArray(attributes) && attributes.length > 0) {
      for (const attribute of attributes) {
        if (attribute.trait_type && attribute.value) {
          // Create or update collection trait
          const collectionTrait = await prisma.collectionTrait.upsert({
            where: {
              collectionId_traitType: {
                collectionId,
                traitType: attribute.trait_type,
              },
            },
            create: {
              collectionId,
              traitType: attribute.trait_type,
              totalValues: 1,
              totalNfts: 1,
            },
            update: {
              totalNfts: {
                increment: 1,
              },
            },
          });

          // Create or update trait value
          await prisma.collectionTraitValue.upsert({
            where: {
              traitId_value: {
                traitId: collectionTrait.id,
                value: attribute.value,
              },
            },
            create: {
              traitId: collectionTrait.id,
              value: attribute.value,
              frequency: 1,
              rarity: 100, // Will be calculated later
            },
            update: {
              frequency: {
                increment: 1,
              },
            },
          });

          // Create individual NFT trait record
          await prisma.nftTrait.create({
            data: {
              nftId: nft.id,
              traitType: attribute.trait_type,
              value: attribute.value,
              displayType: attribute.display_type,
            },
          });
        }
      }
    }

    // Update search index - use findFirst and create/update pattern since there's no unique constraint
    const existingSearchIndex = await prisma.searchIndex.findFirst({
      where: {
        entityType: 'nft',
        entityId: nft.id,
      },
    });

    if (existingSearchIndex) {
      await prisma.searchIndex.update({
        where: {
          id: existingSearchIndex.id,
        },
        data: {
          title: name,
          description: description || '',
          keywords: [name, collection.name, collection.symbol],
          searchVector: `${name} ${description || ''} ${collection.name}`.toLowerCase(),
        },
      });
    } else {
      await prisma.searchIndex.create({
        data: {
          entityType: 'nft',
          entityId: nft.id,
          title: name,
          description: description || '',
          keywords: [name, collection.name, collection.symbol],
          searchVector: `${name} ${description || ''} ${collection.name}`.toLowerCase(),
          collectionId,
          creatorAddress: address.toLowerCase(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      nft: {
        id: nft.id,
        tokenId: nft.tokenId,
        collectionId: nft.collectionId,
        name: nft.name,
        description: nft.description,
        image: nft.image,
        metadataUri: nft.metadataUri,
        attributes: nft.attributes,
        ownerAddress: nft.ownerAddress,
        isMinted: nft.isMinted,
        mintedAt: nft.mintedAt,
        traitCount: nft.traitCount,
        createdAt: nft.createdAt,
        collection: {
          name: nft.collection.name,
          symbol: nft.collection.symbol,
          address: nft.collection.address,
        },
        transactionHash,
        launchpadReady: true,
      },
    });

  } catch (error) {
    console.error('Error creating NFT:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { success: false, error: `Failed to create NFT: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const collectionId = searchParams.get('collectionId');
    
    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await auth.getUserByWallet(address);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Build query conditions
    const whereCondition: any = {};

    if (collectionId) {
      // Verify collection ownership
      const collection = await prisma.collection.findFirst({
        where: {
          id: collectionId,
          creatorAddress: address.toLowerCase(),
        },
      });

      if (!collection) {
        return NextResponse.json(
          { success: false, error: 'Collection not found or unauthorized' },
          { status: 403 }
        );
      }

      whereCondition.collectionId = collectionId;
    } else {
      // Get all NFTs from collections owned by this user
      whereCondition.collection = {
        creatorAddress: address.toLowerCase(),
      };
    }

    // Fetch NFTs with collection info
    const nfts = await prisma.nft.findMany({
      where: whereCondition,
      include: {
        collection: {
          select: {
            name: true,
            symbol: true,
            address: true,
          },
        },
        traits: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      nfts: nfts.map(nft => ({
        id: nft.id,
        tokenId: nft.tokenId,
        collectionId: nft.collectionId,
        name: nft.name,
        description: nft.description,
        image: nft.image,
        metadataUri: nft.metadataUri,
        attributes: nft.attributes,
        ownerAddress: nft.ownerAddress,
        isMinted: nft.isMinted,
        mintedAt: nft.mintedAt,
        traitCount: nft.traitCount,
        rarityScore: nft.rarityScore,
        rarityRank: nft.rarityRank,
        rarityTier: nft.rarityTier,
        createdAt: nft.createdAt,
        collection: nft.collection,
        traits: nft.traits,
      })),
    });

  } catch (error) {
    console.error('Error fetching NFTs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch NFTs' },
      { status: 500 }
    );
  }
}