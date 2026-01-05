import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getNextLootboxId,
  getLootboxInfo,
  getLootboxRewards,
  isContractDeployed,
  LOOTBOX_CONTRACT_ADDRESS,
  enumValueToRarity,
} from '@/lib/lootbox-contracts';
import { rateLimitCheck } from '@/lib/rate-limit';

const ADMIN_KEY = process.env.ADMIN_API_KEY;

interface OnChainLootbox {
  id: number;
  creator: string;
  price: string;
  totalSupply: number;
  remaining: number;
  active: boolean;
  uri: string;
  rarity: string;
  rewardsPerOpening: number;
  rewardsCount: number;
  inDatabase: boolean;
  databaseId?: string;
}

/**
 * GET /api/admin/recover-lootboxes
 *
 * Scan the lootbox contract for lootboxes that exist on-chain but not in the database
 */
export async function GET(request: NextRequest) {
  const rateLimit = await rateLimitCheck(request, "auth");
  if (rateLimit.blocked) return rateLimit.response;

  try {
    if (!ADMIN_KEY) {
      return rateLimit.applyHeaders(
        NextResponse.json({ success: false, error: 'Admin API not configured' }, { status: 503 })
      );
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${ADMIN_KEY}`) {
      return rateLimit.applyHeaders(
        NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
      );
    }

    // Check if contract is deployed
    const contractDeployed = await isContractDeployed();
    if (!contractDeployed) {
      return rateLimit.applyHeaders(
        NextResponse.json({
          success: false,
          error: 'Lootbox contract not deployed',
          contractAddress: LOOTBOX_CONTRACT_ADDRESS
        }, { status: 503 })
      );
    }

    // Get next lootbox ID (tells us how many exist)
    const nextId = await getNextLootboxId();
    const totalOnChain = nextId; // IDs are 0-indexed

    // Get all lootboxes from database
    const dbLootboxes = await prisma.lootbox.findMany({
      select: { id: true, onChainId: true, creatorId: true },
    });
    const dbOnChainIds = new Set(dbLootboxes.map(lb => lb.onChainId));

    // Scan on-chain lootboxes
    const onChainLootboxes: OnChainLootbox[] = [];
    const missingFromDb: OnChainLootbox[] = [];

    for (let i = 0; i < totalOnChain; i++) {
      try {
        const info = await getLootboxInfo(i);
        const rewards = await getLootboxRewards(i);

        const lootbox: OnChainLootbox = {
          id: i,
          creator: info.creator,
          price: info.priceEth,
          totalSupply: info.totalSupply,
          remaining: info.remaining,
          active: info.active,
          uri: info.uri,
          rarity: info.rarity,
          rewardsPerOpening: info.rewardsPerOpening,
          rewardsCount: rewards.length,
          inDatabase: dbOnChainIds.has(i),
        };

        if (dbOnChainIds.has(i)) {
          const dbRecord = dbLootboxes.find(lb => lb.onChainId === i);
          lootbox.databaseId = dbRecord?.id;
        }

        onChainLootboxes.push(lootbox);

        if (!dbOnChainIds.has(i)) {
          missingFromDb.push(lootbox);
        }
      } catch (err) {
        console.error(`[recover-lootboxes] Error reading lootbox ${i}:`, err);
      }
    }

    return rateLimit.applyHeaders(
      NextResponse.json({
        success: true,
        contractAddress: LOOTBOX_CONTRACT_ADDRESS,
        summary: {
          totalOnChain,
          totalInDatabase: dbLootboxes.length,
          missingFromDatabase: missingFromDb.length,
        },
        onChainLootboxes,
        missingFromDb,
      })
    );
  } catch (error) {
    console.error('[recover-lootboxes] Error:', error);
    return rateLimit.applyHeaders(
      NextResponse.json(
        { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    );
  }
}

/**
 * POST /api/admin/recover-lootboxes
 *
 * Recover a specific lootbox from on-chain to database
 *
 * Body:
 *   - onChainId: number - The on-chain lootbox ID to recover
 *   - creatorAddress: string - The wallet address of the creator (for user lookup)
 *   - dryRun: boolean (default: true)
 */
export async function POST(request: NextRequest) {
  const rateLimit = await rateLimitCheck(request, "auth");
  if (rateLimit.blocked) return rateLimit.response;

  try {
    if (!ADMIN_KEY) {
      return rateLimit.applyHeaders(
        NextResponse.json({ success: false, error: 'Admin API not configured' }, { status: 503 })
      );
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${ADMIN_KEY}`) {
      return rateLimit.applyHeaders(
        NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
      );
    }

    const body = await request.json();
    const { onChainId, creatorAddress, dryRun = true } = body;

    if (typeof onChainId !== 'number') {
      return rateLimit.applyHeaders(
        NextResponse.json({ success: false, error: 'onChainId is required (number)' }, { status: 400 })
      );
    }

    // Check if already in database
    const existing = await prisma.lootbox.findFirst({
      where: { onChainId },
    });

    if (existing) {
      return rateLimit.applyHeaders(
        NextResponse.json({
          success: false,
          error: 'Lootbox already exists in database',
          databaseId: existing.id,
        }, { status: 409 })
      );
    }

    // Get on-chain data
    const info = await getLootboxInfo(onChainId);
    const rewards = await getLootboxRewards(onChainId);

    // Find creator user
    const creatorWallet = creatorAddress || info.creator;
    const creator = await prisma.user.findFirst({
      where: { walletAddress: { equals: creatorWallet, mode: 'insensitive' } },
    });

    if (!creator) {
      return rateLimit.applyHeaders(
        NextResponse.json({
          success: false,
          error: `Creator not found for wallet: ${creatorWallet}`,
          onChainData: {
            id: onChainId,
            creator: info.creator,
            price: info.priceEth,
            totalSupply: info.totalSupply,
            remaining: info.remaining,
            active: info.active,
            rarity: info.rarity,
            rewardsCount: rewards.length,
          }
        }, { status: 404 })
      );
    }

    // Parse metadata URI if it's JSON
    let name = `Lootbox #${onChainId}`;
    let description = '';
    let image = '';

    if (info.uri) {
      try {
        if (info.uri.startsWith('data:application/json;base64,')) {
          const base64Data = info.uri.replace('data:application/json;base64,', '');
          const metadata = JSON.parse(Buffer.from(base64Data, 'base64').toString('utf-8'));
          name = metadata.name || name;
          description = metadata.description || '';
          image = metadata.image || '';
        } else if (info.uri.startsWith('{')) {
          const metadata = JSON.parse(info.uri);
          name = metadata.name || name;
          description = metadata.description || '';
          image = metadata.image || '';
        }
      } catch {
        // URI parsing failed, use defaults
      }
    }

    // Map rarity to database enum
    const rarityMap: Record<string, string> = {
      common: 'common',
      rare: 'rare',
      epic: 'epic',
      legendary: 'mythic', // Map legendary to mythic
      hyper: 'cosmic', // Map hyper to cosmic
    };
    const dbRarity = rarityMap[info.rarity.toLowerCase()] || 'common';

    const lootboxData = {
      onChainId,
      name,
      description,
      image,
      price: parseFloat(info.priceEth),
      totalSupply: info.totalSupply,
      remainingSupply: info.remaining,
      rarity: dbRarity,
      isActive: info.active,
      rewardsPerOpening: info.rewardsPerOpening,
      creatorId: creator.id,
      contractAddress: LOOTBOX_CONTRACT_ADDRESS,
    };

    const rewardsData = rewards.map((r, index) => ({
      nftContractAddress: r.nftContract,
      nftTokenId: r.tokenId.toString(),
      tokenType: r.tokenType,
      name: `Reward #${index + 1}`,
      image: '',
      rarity: rarityMap[r.rarity.toLowerCase()] || 'common',
      weight: r.weight,
      claimed: r.claimed,
    }));

    if (dryRun) {
      return rateLimit.applyHeaders(
        NextResponse.json({
          success: true,
          dryRun: true,
          message: 'Dry run - no changes made',
          wouldCreate: {
            lootbox: lootboxData,
            rewards: rewardsData,
          },
        })
      );
    }

    // Create lootbox in database
    const created = await prisma.lootbox.create({
      data: {
        ...lootboxData,
        rewards: {
          create: rewardsData,
        },
      },
      include: {
        rewards: true,
        creator: {
          select: { id: true, username: true, walletAddress: true },
        },
      },
    });

    return rateLimit.applyHeaders(
      NextResponse.json({
        success: true,
        message: 'Lootbox recovered successfully',
        lootbox: created,
      })
    );
  } catch (error) {
    console.error('[recover-lootboxes] Error:', error);
    return rateLimit.applyHeaders(
      NextResponse.json(
        { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    );
  }
}
