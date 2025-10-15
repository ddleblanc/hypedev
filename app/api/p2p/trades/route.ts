import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

// GET /api/p2p/trades - List user's trades
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

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

    // Build where clause
    const where: any = {
      OR: [
        { initiatorId: user.id },
        { counterpartyId: user.id }
      ]
    };

    if (status) {
      where.status = status.toUpperCase();
    }

    // Get trades with related data
    const [trades, totalCount] = await Promise.all([
      prisma.trade.findMany({
        where,
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
                include: {
                  collection: {
                    select: {
                      name: true,
                      symbol: true,
                      image: true
                    }
                  }
                }
              }
            }
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: {
              user: {
                select: {
                  username: true,
                  profilePicture: true
                }
              }
            }
          },
          _count: {
            select: {
              items: true,
              messages: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.trade.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        trades,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching trades:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trades' },
      { status: 500 }
    );
  }
}

// POST /api/p2p/trades - Create new trade offer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      initiatorAddress, 
      counterpartyAddress, 
      initiatorItems, 
      counterpartyItems, 
      metadata 
    } = body;

    if (!initiatorAddress || !counterpartyAddress) {
      return NextResponse.json(
        { success: false, error: 'Both initiator and counterparty addresses are required' },
        { status: 400 }
      );
    }

    // Find users
    const [initiator, counterparty] = await Promise.all([
      auth.getUserByWallet(initiatorAddress),
      auth.getUserByWallet(counterpartyAddress)
    ]);

    if (!initiator || !counterparty) {
      return NextResponse.json(
        { success: false, error: 'One or both users not found' },
        { status: 404 }
      );
    }

    if (initiator.id === counterparty.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot trade with yourself' },
        { status: 400 }
      );
    }

    // Validate items
    if (!initiatorItems || initiatorItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Initiator must offer at least one item' },
        { status: 400 }
      );
    }

    // Create trade with items
    const trade = await prisma.trade.create({
      data: {
        initiatorId: initiator.id,
        counterpartyId: counterparty.id,
        status: 'PENDING',
        metadata,
        items: {
          create: [
            // Initiator items
            ...initiatorItems.map((item: any) => ({
              nftId: item.nftId,
              side: 'INITIATOR',
              tokenAmount: item.tokenAmount,
              tokenAddress: item.tokenAddress,
              metadata: item.metadata
            })),
            // Counterparty items
            ...(counterpartyItems || []).map((item: any) => ({
              nftId: item.nftId,
              side: 'COUNTERPARTY',
              tokenAmount: item.tokenAmount,
              tokenAddress: item.tokenAddress,
              metadata: item.metadata
            }))
          ]
        },
        history: {
          create: {
            userId: initiator.id,
            action: 'CREATED',
            newStatus: 'PENDING',
            metadata: {
              message: 'Trade offer created',
              items: [
                ...initiatorItems.map((item: any) => ({
                  nftId: item.nftId,
                  side: 'INITIATOR',
                  tokenAmount: item.tokenAmount,
                  metadata: item.metadata
                })),
                ...(counterpartyItems || []).map((item: any) => ({
                  nftId: item.nftId,
                  side: 'COUNTERPARTY',
                  tokenAmount: item.tokenAmount,
                  metadata: item.metadata
                }))
              ]
            }
          }
        }
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
              include: {
                collection: {
                  select: {
                    name: true,
                    symbol: true,
                    image: true
                  }
                }
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: trade
    });
  } catch (error) {
    console.error('Error creating trade:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create trade' },
      { status: 500 }
    );
  }
}


