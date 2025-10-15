import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

// POST /api/p2p/trades/[id]/mazal - Deploy escrow contract
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userAddress, escrowAddress, transactionHash } = body;

    if (!userAddress || !escrowAddress || !transactionHash) {
      return NextResponse.json(
        { success: false, error: 'User address, escrow address, and transaction hash are required' },
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
        counterparty: true
      }
    });

    if (!trade) {
      return NextResponse.json(
        { success: false, error: 'Trade not found' },
        { status: 404 }
      );
    }

    // Check if user is the initiator
    if (trade.initiatorId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Only the trade initiator can deploy escrow' },
        { status: 403 }
      );
    }

    // Check if trade is in AGREED status
    if (trade.status !== 'AGREED') {
      return NextResponse.json(
        { success: false, error: 'Trade must be agreed before deploying escrow' },
        { status: 400 }
      );
    }

    // Update trade with escrow information
    const updatedTrade = await prisma.trade.update({
      where: { id },
      data: {
        status: 'ESCROW_DEPLOYED',
        escrowAddress,
        escrowDeployedAt: new Date(),
        metadata: {
          ...trade.metadata as any,
          escrowTransactionHash: transactionHash
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
        action: 'ESCROW_DEPLOYED',
        oldStatus: 'AGREED',
        newStatus: 'ESCROW_DEPLOYED',
        metadata: { 
          escrowAddress,
          transactionHash,
          message: 'Escrow contract deployed' 
        }
      }
    });

    // Add system message
    await prisma.tradeMessage.create({
      data: {
        tradeId: id,
        userId: user.id,
        message: `Escrow contract deployed at ${escrowAddress}`,
        messageType: 'SYSTEM',
        metadata: {
          escrowAddress,
          transactionHash
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedTrade
    });
  } catch (error) {
    console.error('Error deploying escrow:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to deploy escrow' },
      { status: 500 }
    );
  }
}


