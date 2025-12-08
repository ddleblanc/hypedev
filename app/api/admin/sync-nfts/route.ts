import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getContract, readContract } from 'thirdweb';
import { client } from '@/lib/thirdweb';
import { defineChain } from 'thirdweb/chains';

const CHAIN_ID = 11155111; // Sepolia
const chain = defineChain(CHAIN_ID);

// Admin key - MUST be set in environment, no default
const ADMIN_KEY = process.env.ADMIN_API_KEY;

if (!ADMIN_KEY) {
  console.error('CRITICAL: ADMIN_API_KEY environment variable is not set');
}

interface SyncResult {
  nftId: string;
  tokenId: string;
  collectionAddress: string;
  oldOnChainTokenId: string | null;
  newOnChainTokenId: string | null;
  oldOwner: string | null;
  newOwner: string | null;
  status: 'updated' | 'skipped' | 'error' | 'not_found';
  error?: string;
}

/**
 * Get the owner of a specific token ID
 */
async function getTokenOwner(
  contractAddress: string,
  tokenId: string
): Promise<string | null> {
  try {
    const contract = getContract({
      client,
      chain,
      address: contractAddress,
    });

    const owner = await readContract({
      contract,
      method: "function ownerOf(uint256 tokenId) view returns (address)",
      params: [BigInt(tokenId)],
    });

    return owner;
  } catch {
    return null;
  }
}

/**
 * Try to find the actual on-chain token ID for an NFT
 */
async function findOnChainTokenId(
  contractAddress: string,
  ownerAddress: string,
  hintTokenId: string
): Promise<{ tokenId: string; owner: string } | null> {
  const possibleIds = [hintTokenId];

  // If hint contains a hyphen, extract potential token IDs
  if (hintTokenId.includes('-')) {
    const parts = hintTokenId.split('-');
    parts.forEach(part => {
      if (/^\d+$/.test(part) && !possibleIds.includes(part)) {
        possibleIds.push(part);
      }
    });
  }

  // Try sequential IDs
  for (let i = 0; i <= 20; i++) {
    if (!possibleIds.includes(i.toString())) {
      possibleIds.push(i.toString());
    }
  }

  for (const testId of possibleIds) {
    try {
      const owner = await getTokenOwner(contractAddress, testId);
      if (owner && owner.toLowerCase() === ownerAddress.toLowerCase()) {
        return { tokenId: testId, owner };
      }
    } catch {
      // Continue
    }
  }

  return null;
}

/**
 * POST /api/admin/sync-nfts
 *
 * Sync on-chain token IDs for NFTs
 *
 * Body:
 *   - dryRun: boolean (default: true)
 *   - collectionAddress: string (optional - filter by collection)
 *   - nftId: string (optional - sync single NFT)
 *   - fixOwnership: boolean (default: false)
 *   - limit: number (default: 50, max: 200)
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin key
    if (!ADMIN_KEY) {
      return NextResponse.json(
        { success: false, error: 'Admin API not configured' },
        { status: 503 }
      );
    }
    const authHeader = request.headers.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${ADMIN_KEY}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      dryRun = true,
      collectionAddress,
      nftId,
      fixOwnership = false,
      limit = 50
    } = body;

    const actualLimit = Math.min(limit, 200);

    // Build query
    const whereClause: any = {
      isOnChain: true,
    };

    // If specific NFT ID provided, just sync that one
    if (nftId) {
      whereClause.id = nftId;
    } else {
      // Otherwise, find NFTs that need syncing
      whereClause.OR = [
        { tokenId: { contains: '-' } },
        { onChainTokenId: null },
      ];
    }

    if (collectionAddress) {
      whereClause.collection = {
        address: {
          equals: collectionAddress,
          mode: 'insensitive'
        }
      };
    }

    // Get NFTs
    const nfts = await prisma.nft.findMany({
      where: whereClause,
      include: {
        collection: {
          select: { address: true, name: true }
        }
      },
      take: actualLimit,
      orderBy: { createdAt: 'desc' }
    });

    const totalCount = await prisma.nft.count({ where: whereClause });

    const results: SyncResult[] = [];
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    let notFound = 0;

    for (const nft of nfts) {
      const result: SyncResult = {
        nftId: nft.id,
        tokenId: nft.tokenId,
        collectionAddress: nft.collection.address,
        oldOnChainTokenId: nft.onChainTokenId,
        newOnChainTokenId: null,
        oldOwner: nft.ownerAddress,
        newOwner: null,
        status: 'skipped',
      };

      try {
        // Check if already has valid onChainTokenId
        if (nft.onChainTokenId && /^\d+$/.test(nft.onChainTokenId)) {
          const owner = await getTokenOwner(nft.collection.address, nft.onChainTokenId);
          if (owner) {
            result.newOwner = owner;
            result.newOnChainTokenId = nft.onChainTokenId;

            if (fixOwnership && owner.toLowerCase() !== nft.ownerAddress?.toLowerCase()) {
              result.status = 'updated';
            } else {
              result.status = 'skipped';
            }
          }
        } else if (nft.ownerAddress) {
          // Need to find the correct token ID
          let hintId = nft.tokenId;
          if (nft.tokenId.includes('-')) {
            const parts = nft.tokenId.split('-');
            for (let i = parts.length - 1; i >= 0; i--) {
              if (/^\d+$/.test(parts[i])) {
                hintId = parts[i];
                break;
              }
            }
          }

          const found = await findOnChainTokenId(
            nft.collection.address,
            nft.ownerAddress,
            hintId
          );

          if (found) {
            result.newOnChainTokenId = found.tokenId;
            result.newOwner = found.owner;
            result.status = 'updated';
          } else {
            result.status = 'not_found';
            result.error = 'Could not find matching token on-chain';
          }
        } else {
          result.status = 'skipped';
          result.error = 'No owner address';
        }

        // Update database if not dry run
        if (!dryRun && result.status === 'updated') {
          const updateData: any = {};

          if (result.newOnChainTokenId) {
            updateData.onChainTokenId = result.newOnChainTokenId;
          }

          if (fixOwnership && result.newOwner) {
            updateData.ownerAddress = result.newOwner.toLowerCase();
          }

          if (Object.keys(updateData).length > 0) {
            await prisma.nft.update({
              where: { id: nft.id },
              data: updateData
            });
          }
        }
      } catch (e: any) {
        result.status = 'error';
        result.error = e.message;
      }

      results.push(result);

      switch (result.status) {
        case 'updated': updated++; break;
        case 'skipped': skipped++; break;
        case 'error': errors++; break;
        case 'not_found': notFound++; break;
      }
    }

    return NextResponse.json({
      success: true,
      dryRun,
      summary: {
        total: totalCount,
        processed: nfts.length,
        updated,
        skipped,
        notFound,
        errors,
        remaining: totalCount - nfts.length
      },
      results
    });

  } catch (error: any) {
    console.error('Sync NFTs error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to sync NFTs' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/sync-nfts
 *
 * Get status of NFTs that need syncing
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin key
    if (!ADMIN_KEY) {
      return NextResponse.json(
        { success: false, error: 'Admin API not configured' },
        { status: 503 }
      );
    }
    const authHeader = request.headers.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${ADMIN_KEY}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const collectionAddress = searchParams.get('collection');

    // Count NFTs that need syncing
    const whereClause: any = {
      isOnChain: true,
      OR: [
        { tokenId: { contains: '-' } },
        { onChainTokenId: null },
      ]
    };

    if (collectionAddress) {
      whereClause.collection = {
        address: {
          equals: collectionAddress,
          mode: 'insensitive'
        }
      };
    }

    const needsSync = await prisma.nft.count({ where: whereClause });

    // Count total on-chain NFTs
    const totalOnChain = await prisma.nft.count({
      where: {
        isOnChain: true,
        ...(collectionAddress ? {
          collection: {
            address: { equals: collectionAddress, mode: 'insensitive' }
          }
        } : {})
      }
    });

    // Get collections with sync issues
    const collectionsNeedingSync = await prisma.nft.groupBy({
      by: ['collectionId'],
      where: whereClause,
      _count: { id: true }
    });

    const collectionDetails = await Promise.all(
      collectionsNeedingSync.map(async (c) => {
        const collection = await prisma.collection.findUnique({
          where: { id: c.collectionId },
          select: { id: true, name: true, address: true }
        });
        return {
          ...collection,
          needsSync: c._count.id
        };
      })
    );

    return NextResponse.json({
      success: true,
      stats: {
        totalOnChainNfts: totalOnChain,
        needsSync,
        synced: totalOnChain - needsSync,
        percentSynced: totalOnChain > 0
          ? Math.round(((totalOnChain - needsSync) / totalOnChain) * 100)
          : 100
      },
      collectionsNeedingSync: collectionDetails.filter(c => c !== null)
    });

  } catch (error: any) {
    console.error('Get sync status error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get sync status' },
      { status: 500 }
    );
  }
}
