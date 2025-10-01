import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { collectionId, nfts } = body;

    if (!collectionId || !nfts || !Array.isArray(nfts)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Process each NFT
    const createdNfts = [];
    for (const nftData of nfts) {
      // Generate a unique tokenId if not provided
      const tokenId = nftData.tokenId || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create the NFT record
      const nft = await prisma.nft.create({
        data: {
          tokenId,
          collectionId,
          name: nftData.name,
          description: nftData.description || null,
          image: nftData.image || nftData.imageUrl || '',
          metadataUri: nftData.metadataUri || null,
          ownerAddress: nftData.ownerAddress || null,
          isMinted: true,
          mintedAt: new Date(),
          attributes: nftData.attributes || null,
          traitCount: nftData.attributes?.length || 0,
        },
        include: {
          traits: true
        }
      });

      // Create trait records if attributes exist
      if (nftData.attributes && Array.isArray(nftData.attributes)) {
        const traitRecords = [];

        for (const attr of nftData.attributes) {
          if (!attr.trait_type || !attr.value) continue;

          const trait = await prisma.nftTrait.create({
            data: {
              nftId: nft.id,
              traitType: attr.trait_type,
              value: String(attr.value),
              displayType: attr.display_type || null,
            }
          });

          traitRecords.push(trait);

          // Update or create collection trait statistics
          const collectionTrait = await prisma.collectionTrait.findFirst({
            where: {
              collectionId,
              traitType: attr.trait_type
            }
          });

          if (!collectionTrait) {
            // Create new collection trait
            await prisma.collectionTrait.create({
              data: {
                collectionId,
                traitType: attr.trait_type,
                totalValues: 1,
                totalNfts: 1
              }
            });

            // Create trait value
            await prisma.collectionTraitValue.create({
              data: {
                traitId: (await prisma.collectionTrait.findFirst({
                  where: { collectionId, traitType: attr.trait_type }
                }))!.id,
                value: String(attr.value),
                count: 1
              }
            });
          } else {
            // Update existing collection trait
            await prisma.collectionTrait.update({
              where: { id: collectionTrait.id },
              data: {
                totalNfts: { increment: 1 }
              }
            });

            // Check if value exists
            const existingValue = await prisma.collectionTraitValue.findFirst({
              where: {
                traitId: collectionTrait.id,
                value: String(attr.value)
              }
            });

            if (existingValue) {
              // Update count
              await prisma.collectionTraitValue.update({
                where: { id: existingValue.id },
                data: {
                  count: { increment: 1 }
                }
              });
            } else {
              // Create new value
              await prisma.collectionTraitValue.create({
                data: {
                  traitId: collectionTrait.id,
                  value: String(attr.value),
                  count: 1
                }
              });

              // Increment total values
              await prisma.collectionTrait.update({
                where: { id: collectionTrait.id },
                data: {
                  totalValues: { increment: 1 }
                }
              });
            }
          }
        }
      }

      createdNfts.push(nft);
    }

    // Update collection's minted supply count
    await prisma.collection.update({
      where: { id: collectionId },
      data: {
        mintedSupply: { increment: createdNfts.length }
      }
    });

    return NextResponse.json({
      success: true,
      nfts: createdNfts
    });

  } catch (error) {
    console.error('Error creating NFTs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create NFTs' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch NFTs for a collection
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const collectionId = searchParams.get('collectionId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!collectionId) {
      return NextResponse.json(
        { success: false, error: 'Collection ID required' },
        { status: 400 }
      );
    }

    const nfts = await prisma.nft.findMany({
      where: { collectionId },
      include: {
        traits: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    const total = await prisma.nft.count({
      where: { collectionId }
    });

    return NextResponse.json({
      success: true,
      nfts,
      total,
      limit,
      offset
    });

  } catch (error) {
    console.error('Error fetching NFTs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch NFTs' },
      { status: 500 }
    );
  }
}