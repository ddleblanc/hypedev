import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

// GET /api/p2p/trades/[id] - Get trade details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const trade = await prisma.trade.findUnique({
      where: { id },
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
          include: {
            user: {
              select: {
                username: true,
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
                username: true,
                profilePicture: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!trade) {
      return NextResponse.json(
        { success: false, error: 'Trade not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: trade
    });
  } catch (error) {
    console.error('Error fetching trade:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trade' },
      { status: 500 }
    );
  }
}

// PUT /api/p2p/trades/[id] - Update trade (counteroffer, accept, reject)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      action,
      userAddress,
      items,
      message,
      metadata: requestMetadata
    } = body;

    let metadata = requestMetadata;

    if (!action || !userAddress) {
      return NextResponse.json(
        { success: false, error: 'Action and user address are required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await auth.getUserByWallet(userAddress);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get trade
    const trade = await prisma.trade.findUnique({
      where: { id },
      include: {
        initiator: true,
        counterparty: true,
        items: true
      }
    });

    if (!trade) {
      return NextResponse.json(
        { success: false, error: 'Trade not found' },
        { status: 404 }
      );
    }

    // Check if user is part of this trade
    if (trade.initiatorId !== user.id && trade.counterpartyId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    let newStatus = trade.status;
    let updateData: any = {};

    // Handle different actions
    switch (action) {
      case 'message':
        // Just add a message, don't change status
        if (!message) {
          return NextResponse.json(
            { success: false, error: 'Message is required' },
            { status: 400 }
          );
        }

        await prisma.tradeMessage.create({
          data: {
            tradeId: id,
            userId: user.id,
            message,
            messageType: 'TEXT',
            metadata
          }
        });

        // Return the updated trade with messages
        const tradeWithMessages = await prisma.trade.findUnique({
          where: { id },
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
              include: {
                user: {
                  select: {
                    username: true,
                    profilePicture: true
                  }
                }
              },
              orderBy: { createdAt: 'asc' }
            }
          }
        });

        return NextResponse.json({
          success: true,
          data: tradeWithMessages
        });

      case 'counteroffer':
        // Only counterparty can make a counteroffer
        if (trade.initiatorId === user.id) {
          return NextResponse.json(
            { success: false, error: 'Only the counterparty can make a counteroffer' },
            { status: 403 }
          );
        }

        if (trade.status !== 'PENDING' && trade.status !== 'COUNTERED') {
          return NextResponse.json(
            { success: false, error: 'Cannot make counteroffer in current status' },
            { status: 400 }
          );
        }

        newStatus = 'COUNTERED';

        // Save a snapshot of current items before updating
        const currentItemsSnapshot = trade.items.map((item: any) => ({
          nftId: item.nftId,
          side: item.side,
          tokenAmount: item.tokenAmount,
          metadata: item.metadata
        }));

        // Update items if provided
        if (items) {
          // Delete existing items
          await prisma.tradeItem.deleteMany({
            where: { tradeId: id }
          });

          // Create new items
          await prisma.tradeItem.createMany({
            data: items.map((item: any) => ({
              tradeId: id,
              nftId: item.nftId,
              side: item.side,
              tokenAmount: item.tokenAmount,
              tokenAddress: item.tokenAddress,
              metadata: item.metadata
            }))
          });
        }

        // Store items snapshot in metadata for history
        metadata = {
          ...metadata,
          previousItems: currentItemsSnapshot,
          newItems: items
        };
        break;

      case 'accept':
        // Only counterparty can accept
        if (trade.initiatorId === user.id) {
          return NextResponse.json(
            { success: false, error: 'Only the counterparty can accept the trade' },
            { status: 403 }
          );
        }

        if (trade.status !== 'PENDING' && trade.status !== 'COUNTERED') {
          return NextResponse.json(
            { success: false, error: 'Cannot accept trade in current status' },
            { status: 400 }
          );
        }

        newStatus = 'AGREED';
        updateData.agreedAt = new Date();
        break;

      case 'reject':
        // Only counterparty can reject
        if (trade.initiatorId === user.id) {
          return NextResponse.json(
            { success: false, error: 'Only the counterparty can reject the trade' },
            { status: 403 }
          );
        }

        if (trade.status !== 'PENDING' && trade.status !== 'COUNTERED') {
          return NextResponse.json(
            { success: false, error: 'Cannot reject trade in current status' },
            { status: 400 }
          );
        }

        newStatus = 'REJECTED';
        updateData.canceledAt = new Date();
        break;

      case 'cancel':
        // Only initiator can cancel
        if (trade.initiatorId !== user.id) {
          return NextResponse.json(
            { success: false, error: 'Only the initiator can cancel the trade' },
            { status: 403 }
          );
        }

        if (trade.status === 'FINALIZED' || trade.status === 'CANCELED' || trade.status === 'REJECTED') {
          return NextResponse.json(
            { success: false, error: 'Cannot cancel trade in current status' },
            { status: 400 }
          );
        }

        newStatus = 'CANCELED';
        updateData.canceledAt = new Date();
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Update trade
    const updatedTrade = await prisma.trade.update({
      where: { id },
      data: {
        status: newStatus,
        ...updateData
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

    // Add message if provided
    if (message) {
      await prisma.tradeMessage.create({
        data: {
          tradeId: id,
          userId: user.id,
          message,
          messageType: action === 'counteroffer' ? 'COUNTEROFFER' : 
                      action === 'accept' ? 'ACCEPTANCE' : 
                      action === 'reject' ? 'REJECTION' : 'TEXT',
          metadata
        }
      });
    }

    // Add history entry
    await prisma.tradeHistory.create({
      data: {
        tradeId: id,
        userId: user.id,
        action: action.toUpperCase(),
        oldStatus: trade.status,
        newStatus,
        metadata: { message: `Trade ${action}ed` }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedTrade
    });
  } catch (error) {
    console.error('Error updating trade:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update trade' },
      { status: 500 }
    );
  }
}


