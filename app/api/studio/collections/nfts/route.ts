import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { logNftMinted } from '@/lib/activity';
import { rateLimitCheck } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  // Rate limit: blockchain operations (20 req/min with 60s block)
  const rateCheck = await rateLimitCheck(request, "blockchain");
  if (rateCheck.blocked) return rateCheck.response;

  try {
    const body = await request.json();
    const { collectionId, nfts, walletAddress } = body;

    if (!collectionId || !nfts || !Array.isArray(nfts)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Authentication: require wallet address
    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: 'Wallet address is required' },
        { status: 401 }
      );
    }

    // Verify user exists
    const user = await auth.getUserByWallet(walletAddress);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found. Please connect your wallet first.' },
        { status: 401 }
      );
    }

    // Authorization: check if user owns this collection
    const ownsCollection = await auth.doesUserOwnCollection(walletAddress, collectionId);
    if (!ownsCollection) {
      return NextResponse.json(
        { success: false, error: 'You do not own this collection' },
        { status: 403 }
      );
    }

    // Check if any NFTs are being minted on-chain (not just lazy-minted)
    const hasOnChainMints = nfts.some((nft: any) => nft.isOnChain === true);

    // For on-chain minting, require approved creator status
    if (hasOnChainMints) {
      const canDeploy = await auth.canUserDeployContracts(walletAddress);
      if (!canDeploy) {
        return NextResponse.json(
          {
            success: false,
            error: 'Your creator application is pending approval. You can draft NFTs but cannot mint to blockchain until approved.',
            code: 'CREATOR_NOT_APPROVED'
          },
          { status: 403 }
        );
      }
    }

    // Process each NFT
    const createdNfts = [];
    for (const nftData of nfts) {
      // Generate a unique tokenId if not provided
      const tokenId = nftData.tokenId || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create the NFT record
      // isOnChain indicates if the NFT actually exists on the blockchain (vs just lazy-minted in DB)
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
          // On-chain status tracking - critical for listing eligibility
          isOnChain: nftData.isOnChain ?? false, // Default to false for lazy-minted NFTs
          onChainAt: nftData.isOnChain ? new Date() : null,
          onChainTokenId: nftData.onChainTokenId || null,
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
                frequency: 1
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
                  frequency: { increment: 1 }
                }
              });
            } else {
              // Create new value
              await prisma.collectionTraitValue.create({
                data: {
                  traitId: collectionTrait.id,
                  value: String(attr.value),
                  frequency: 1
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

    // Log mint activity for on-chain NFTs
    // Only log for NFTs that are actually minted on-chain (not lazy-minted)
    const onChainNfts = createdNfts.filter(nft => nft.isOnChain);
    if (onChainNfts.length > 0 && onChainNfts[0].ownerAddress) {
      try {
        // Find the user who minted
        const minter = await auth.getUserByWallet(onChainNfts[0].ownerAddress);
        if (minter) {
          // Log activity for each minted NFT
          await Promise.all(
            onChainNfts.map(nft =>
              logNftMinted(
                minter.id,
                nft.id,
                collectionId,
                undefined, // Transaction hash is not available here, would need to pass from client
                { tokenId: nft.tokenId, name: nft.name }
              )
            )
          );
        }
      } catch (activityError) {
        // Don't fail the request if activity logging fails
        console.error('Failed to log mint activity:', activityError);
      }
    }

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