import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

// GET /api/p2p/messages - Get messages between two users or for a specific trade
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userAddress = searchParams.get('userAddress');
    const partnerAddress = searchParams.get('partnerAddress');
    const tradeId = searchParams.get('tradeId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    if (!userAddress) {
      return NextResponse.json(
        { success: false, error: 'User address is required' },
        { status: 400 }
      );
    }

    const user = await auth.getUserByWallet(userAddress);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    let where: any = {};

    if (tradeId) {
      // Get messages for specific trade
      where.tradeId = tradeId;
    } else if (partnerAddress) {
      // Get all messages between two users across all trades
      const partner = await auth.getUserByWallet(partnerAddress);
      if (!partner) {
        return NextResponse.json(
          { success: false, error: 'Partner not found' },
          { status: 404 }
        );
      }

      // Find all trades between these two users
      const trades = await prisma.trade.findMany({
        where: {
          OR: [
            { initiatorId: user.id, counterpartyId: partner.id },
            { initiatorId: partner.id, counterpartyId: user.id }
          ]
        },
        select: { id: true }
      });

      where.tradeId = { in: trades.map(t => t.id) };
    } else {
      // Get all messages for the user
      const trades = await prisma.trade.findMany({
        where: {
          OR: [
            { initiatorId: user.id },
            { counterpartyId: user.id }
          ]
        },
        select: { id: true }
      });

      where.tradeId = { in: trades.map(t => t.id) };
    }

    const [messages, totalCount] = await Promise.all([
      prisma.tradeMessage.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              walletAddress: true,
              profilePicture: true
            }
          },
          trade: {
            select: {
              id: true,
              status: true,
              initiatorId: true,
              counterpartyId: true,
              items: {
                select: {
                  id: true,
                  side: true,
                  metadata: true,
                  nft: {
                    select: {
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
              }
            }
          }
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit
      }),
      prisma.tradeMessage.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        messages,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST /api/p2p/messages - Send a message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userAddress, tradeId, message, messageType = 'TEXT', metadata } = body;

    if (!userAddress || !message) {
      return NextResponse.json(
        { success: false, error: 'User address and message are required' },
        { status: 400 }
      );
    }

    const user = await auth.getUserByWallet(userAddress);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    let trade;

    if (tradeId) {
      // Message for existing trade
      trade = await prisma.trade.findUnique({
        where: { id: tradeId },
        include: {
          initiator: true,
          counterparty: true
        }
      });

      if (!trade) {
        return NextResponse.json(
          { success: false, error: 'Trade not found' },
          { status: 404 }
        );
      }

      // Verify user is part of this trade
      if (trade.initiatorId !== user.id && trade.counterpartyId !== user.id) {
        return NextResponse.json(
          { success: false, error: 'You are not part of this trade' },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Trade ID is required' },
        { status: 400 }
      );
    }

    // Create the message
    const newMessage = await prisma.tradeMessage.create({
      data: {
        tradeId: trade.id,
        userId: user.id,
        message,
        messageType,
        metadata
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            walletAddress: true,
            profilePicture: true
          }
        },
        trade: {
          select: {
            id: true,
            status: true
          }
        }
      }
    });

    // Update trade's updatedAt timestamp
    await prisma.trade.update({
      where: { id: trade.id },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json({
      success: true,
      data: newMessage
    });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    );
  }
}