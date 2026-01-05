import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getLootboxBalance,
  isContractDeployed,
  LOOTBOX_CONTRACT_ADDRESS,
} from "@/lib/lootbox-contracts";
import { rateLimit } from "@/lib/rate-limit";

// GET /api/lootboxes/user/inventory - Get user's lootbox inventory
// Query params: address (wallet address)
export async function GET(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, "api");
  if (rateLimitResult) return rateLimitResult;

  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        { success: false, error: "Missing address parameter" },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { walletAddress: address.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({
        success: true,
        inventory: [],
        openings: [],
      });
    }

    // Get user's lootbox openings (history)
    const openings = await prisma.lootboxOpening.findMany({
      where: { userId: user.id },
      include: {
        lootbox: {
          select: {
            id: true,
            onChainId: true,
            name: true,
            image: true,
            rarity: true,
          },
        },
        reward: {
          select: {
            id: true,
            name: true,
            image: true,
            rarity: true,
            nftContractAddress: true,
            nftTokenId: true,
          },
        },
      },
      orderBy: { openedAt: "desc" },
      take: 50,
    });

    // Get all active lootboxes to check on-chain balances
    const activeLootboxes = await prisma.lootbox.findMany({
      where: { isActive: true },
      select: {
        id: true,
        onChainId: true,
        name: true,
        description: true,
        image: true,
        price: true,
        priceCurrency: true,
        rarity: true,
        remainingSupply: true,
        contractAddress: true,
      },
    });

    // Check if lootbox contract is deployed
    const contractDeployed = LOOTBOX_CONTRACT_ADDRESS && await isContractDeployed();

    // Fetch on-chain balances for each lootbox
    const inventoryWithBalances = await Promise.all(
      activeLootboxes.map(async (lb) => {
        let balance = 0;

        // Only fetch balance if contract is deployed and lootbox has an onChainId
        if (contractDeployed && lb.onChainId !== null) {
          try {
            balance = await getLootboxBalance(address, lb.onChainId);
          } catch (error) {
            console.error(
              `Failed to fetch balance for lootbox ${lb.id}:`,
              error
            );
            // Continue with balance = 0
          }
        }

        return {
          ...lb,
          price: parseFloat(lb.price.toString()),
          balance,
        };
      })
    );

    // Filter to only include lootboxes with balance > 0 or all if checking inventory
    const inventory = inventoryWithBalances;

    // Get user's created lootboxes
    const createdLootboxes = await prisma.lootbox.findMany({
      where: { creatorId: user.id },
      select: {
        id: true,
        onChainId: true,
        name: true,
        image: true,
        price: true,
        rarity: true,
        totalSupply: true,
        remainingSupply: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            openings: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      inventory,
      openings: openings.map((o) => ({
        id: o.id,
        lootbox: o.lootbox,
        reward: o.reward,
        fulfilled: o.fulfilled,
        openedAt: o.openedAt,
        fulfilledAt: o.fulfilledAt,
      })),
      createdLootboxes: createdLootboxes.map((lb) => ({
        ...lb,
        price: parseFloat(lb.price.toString()),
        soldCount: lb.totalSupply - lb.remainingSupply,
        openingsCount: lb._count.openings,
      })),
    });
  } catch (error) {
    console.error("Error fetching user inventory:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user inventory" },
      { status: 500 }
    );
  }
}
