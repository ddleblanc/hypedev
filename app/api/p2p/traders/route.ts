import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/p2p/traders - List available traders (users with NFTs)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    // Build where clause for users
    const where: any = {};

    // Add search filter
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { walletAddress: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get users with their NFT counts
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          walletAddress: true,
          profilePicture: true,
          createdAt: true,
          _count: {
            select: {
              initiatedTrades: {
                where: {
                  status: {
                    in: ['FINALIZED']
                  }
                }
              },
              receivedTrades: {
                where: {
                  status: {
                    in: ['FINALIZED']
                  }
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ]);

    // Calculate success rates and other stats
    const traders = await Promise.all(
      users.map(async (user) => {
        // Get user's NFTs
        const userNFTs = await prisma.nft.findMany({
          where: {
            OR: [
              // NFTs from collections they created
              {
                collection: {
                  creatorAddress: user.walletAddress.toLowerCase()
                },
                isMinted: true
              },
              // NFTs they own
              {
                ownerAddress: user.walletAddress.toLowerCase(),
                isMinted: true
              }
            ]
          },
          include: {
            collection: {
              select: {
                name: true,
                symbol: true,
                image: true
              }
            }
          },
          take: 10 // Limit for performance
        });

        // Calculate success rate
        const totalTrades = user._count.initiatedTrades + user._count.receivedTrades;
        const successRate = totalTrades > 0 ? 
          ((user._count.initiatedTrades + user._count.receivedTrades) / totalTrades) * 100 : 0;

        // Calculate rating (simplified)
        const rating = Math.min(5.0, Math.max(1.0, 3.0 + (successRate / 100) * 2));

        return {
          id: user.id,
          name: user.username || `User ${user.walletAddress.slice(0, 6)}...`,
          username: user.username,
          walletAddress: user.walletAddress,
          avatar: user.profilePicture,
          rating: Math.round(rating * 10) / 10,
          trades: totalTrades,
          successRate: Math.round(successRate * 10) / 10,
          isOnline: Math.random() > 0.3, // Mock online status
          tier: totalTrades > 100 ? 'DIAMOND' : totalTrades > 50 ? 'GOLD' : 'SILVER',
          nfts: userNFTs.map(nft => ({
            id: nft.id,
            name: nft.name,
            image: nft.image,
            value: Math.random() * 10, // Mock value
            rarity: nft.rarityTier || 'COMMON',
            collection: nft.collection.name
          }))
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        traders,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching traders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch traders' },
      { status: 500 }
    );
  }
}
