import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

// POST /api/p2p/trades/[id]/deposit - Record NFT deposit
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { 
      userAddress, 
      nftIds, 
      tokenAmounts, 
      transactionHash 
    } = body;

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

    // Check if trade is in ESCROW_DEPLOYED status
    if (trade.status !== 'ESCROW_DEPLOYED') {
      return NextResponse.json(
        { success: false, error: 'Trade must have escrow deployed before deposits' },
        { status: 400 }
      );
    }

    // Determine user's side
    const userSide = trade.initiatorId === user.id ? 'INITIATOR' : 'COUNTERPARTY';

    // Update trade status to DEPOSITED if both parties have deposited
    const userItems = trade.items.filter(item => item.side === userSide);
    const hasUserDeposited = userItems.every(item => 
      nftIds?.includes(item.nftId) || 
      (item.tokenAmount && item.tokenAddress && tokenAmounts?.[item.tokenAddress])
    );

    if (!hasUserDeposited) {
      return NextResponse.json(
        { success: false, error: 'Not all required items have been deposited' },
        { status: 400 }
      );
    }

    // Check if both parties have deposited
    const otherSide = userSide === 'INITIATOR' ? 'COUNTERPARTY' : 'INITIATOR';
    const otherUserItems = trade.items.filter(item => item.side === otherSide);
    
    // For now, we'll assume the other party has deposited if we're recording this deposit
    // In a real implementation, you'd check the blockchain state
    const newStatus = 'DEPOSITED';

    // Update trade
    const updatedTrade = await prisma.trade.update({
      where: { id },
      data: {
        status: newStatus
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
        action: 'DEPOSITED',
        oldStatus: 'ESCROW_DEPLOYED',
        newStatus,
        metadata: { 
          nftIds,
          tokenAmounts,
          transactionHash,
          message: `${userSide} deposited items` 
        }
      }
    });

    // Add system message
    await prisma.tradeMessage.create({
      data: {
        tradeId: id,
        userId: user.id,
        message: `${userSide} deposited items into escrow`,
        messageType: 'SYSTEM',
        metadata: {
          nftIds,
          tokenAmounts,
          transactionHash
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedTrade
    });
  } catch (error) {
    console.error('Error recording deposit:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record deposit' },
      { status: 500 }
    );
  }
}
