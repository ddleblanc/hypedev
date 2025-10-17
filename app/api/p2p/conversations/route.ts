import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

// GET /api/p2p/conversations - Get conversation (mixed messages and trade events) between two users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userAddress = searchParams.get('userAddress');
    const partnerAddress = searchParams.get('partnerAddress');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!userAddress || !partnerAddress) {
      return NextResponse.json(
        { success: false, error: 'Both user and partner addresses are required' },
        { status: 400 }
      );
    }

    const [user, partner] = await Promise.all([
      auth.getUserByWallet(userAddress),
      auth.getUserByWallet(partnerAddress)
    ]);

    if (!user || !partner) {
      return NextResponse.json(
        { success: false, error: 'User or partner not found' },
        { status: 404 }
      );
    }

    // Get all trades between these users
    const trades = await prisma.trade.findMany({
      where: {
        OR: [
          { initiatorId: user.id, counterpartyId: partner.id },
          { initiatorId: partner.id, counterpartyId: user.id }
        ]
      },
      include: {
        initiator: {
          select: {
            id: true,
            username: true,
            walletAddress: true,
            profilePicture: true
          }
        },
        counterparty: {
          select: {
            id: true,
            username: true,
            walletAddress: true,
            profilePicture: true
          }
        },
        items: {
          include: {
            nft: {
              select: {
                id: true,
                name: true,
                image: true,
                tokenId: true,
                collection: {
                  select: {
                    name: true,
                    symbol: true
                  }
                }
              }
            }
          }
        },
        messages: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                walletAddress: true,
                profilePicture: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        history: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                walletAddress: true,
                profilePicture: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Combine messages and trade events into a single timeline
    const timeline: any[] = [];

    trades.forEach(trade => {
      // Add trade creation event
      timeline.push({
        type: 'trade_created',
        timestamp: trade.createdAt,
        trade: {
          id: trade.id,
          status: trade.status,
          initiator: trade.initiator,
          counterparty: trade.counterparty,
          items: trade.items,
          fairnessScore: trade.fairnessScore
        },
        user: trade.initiator
      });

      // Add messages
      trade.messages.forEach(msg => {
        timeline.push({
          type: 'message',
          timestamp: msg.createdAt,
          message: msg.message,
          messageType: msg.messageType,
          metadata: msg.metadata,
          user: msg.user,
          tradeId: trade.id
        });
      });

      // Add trade history events
      trade.history.forEach(event => {
        if (event.action !== 'CREATED') { // Skip creation since we already added it
          timeline.push({
            type: 'trade_event',
            timestamp: event.createdAt,
            action: event.action,
            oldStatus: event.oldStatus,
            newStatus: event.newStatus,
            metadata: event.metadata,
            user: event.user,
            tradeId: trade.id
          });
        }
      });
    });

    // Sort timeline by timestamp
    timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Paginate
    const start = (page - 1) * limit;
    const paginatedTimeline = timeline.slice(start, start + limit);

    return NextResponse.json({
      success: true,
      data: {
        conversation: paginatedTimeline,
        partner: {
          id: partner.id,
          username: partner.username,
          walletAddress: partner.walletAddress,
          profilePicture: partner.profilePicture
        },
        stats: {
          totalTrades: trades.length,
          activeTrades: trades.filter(t => ['PENDING', 'COUNTERED', 'AGREED', 'ESCROW_DEPLOYED', 'DEPOSITED'].includes(t.status)).length,
          completedTrades: trades.filter(t => t.status === 'FINALIZED').length
        },
        pagination: {
          page,
          limit,
          total: timeline.length,
          totalPages: Math.ceil(timeline.length / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}