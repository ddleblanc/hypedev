import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

// POST /api/p2p/trades/[id]/finalize - Finalize trade
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userAddress, transactionHash } = body;

    if (!userAddress || !transactionHash) {
      return NextResponse.json(
        { success: false, error: 'User address and transaction hash are required' },
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

    // Check if trade is in DEPOSITED status
    if (trade.status !== 'DEPOSITED') {
      return NextResponse.json(
        { success: false, error: 'Trade must have all items deposited before finalization' },
        { status: 400 }
      );
    }

    // Update trade status to FINALIZED
    const updatedTrade = await prisma.trade.update({
      where: { id },
      data: {
        status: 'FINALIZED',
        finalizedAt: new Date(),
        metadata: {
          ...trade.metadata as any,
          finalizeTransactionHash: transactionHash
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

    // Add history entry
    await prisma.tradeHistory.create({
      data: {
        tradeId: id,
        userId: user.id,
        action: 'FINALIZED',
        oldStatus: 'DEPOSITED',
        newStatus: 'FINALIZED',
        metadata: { 
          transactionHash,
          message: 'Trade finalized successfully' 
        }
      }
    });

    // Add system message
    await prisma.tradeMessage.create({
      data: {
        tradeId: id,
        userId: user.id,
        message: 'Trade has been finalized and assets have been swapped',
        messageType: 'SYSTEM',
        metadata: {
          transactionHash
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedTrade
    });
  } catch (error) {
    console.error('Error finalizing trade:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to finalize trade' },
      { status: 500 }
    );
  }
}


