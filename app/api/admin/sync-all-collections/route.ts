import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNFTContract } from "@/lib/marketplace";
import { totalSupply, ownerOf, tokenURI } from "thirdweb/extensions/erc721";

/**
 * POST /api/admin/sync-all-collections
 *
 * Sync ALL deployed collections - updates isOnChain, onChainTokenId, onChainAt, and ownerAddress
 * for all NFTs across all deployed collections.
 *
 * Body:
 *   - dryRun: boolean (default: true) - Preview changes without applying
 *   - limit: number (default: 10) - Max collections to process per request
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { dryRun = true, limit = 10 } = body;

    // Get all deployed collections with contract addresses
    const collections = await prisma.collection.findMany({
      where: {
        address: { startsWith: "0x" },
        isDeployed: true,
      },
      select: {
        id: true,
        name: true,
        address: true,
        _count: {
          select: { nfts: true },
        },
      },
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    console.log(`[sync-all] Found ${collections.length} deployed collections to sync`);

    const results: Array<{
      collectionId: string;
      collectionName: string;
      contractAddress: string;
      onChainSupply: number;
      dbNftsCount: number;
      matched: number;
      updated: number;
      errors: string[];
    }> = [];

    let totalUpdated = 0;
    let totalMatched = 0;

    for (const collection of collections) {
      if (!collection.address) continue;

      const collectionResult = {
        collectionId: collection.id,
        collectionName: collection.name,
        contractAddress: collection.address,
        onChainSupply: 0,
        dbNftsCount: collection._count.nfts,
        matched: 0,
        updated: 0,
        errors: [] as string[],
      };

      try {
        const nftContract = getNFTContract(collection.address);

        // Get total supply
        let supply: bigint;
        try {
          supply = await totalSupply({ contract: nftContract });
          collectionResult.onChainSupply = Number(supply);
          console.log(`[sync-all] ${collection.name}: ${supply} tokens on-chain`);
        } catch {
          collectionResult.errors.push("Failed to get totalSupply");
          results.push(collectionResult);
          continue;
        }

        if (supply === BigInt(0)) {
          results.push(collectionResult);
          continue;
        }

        // Get DB NFTs for this collection
        const dbNfts = await prisma.nft.findMany({
          where: { collectionId: collection.id },
          select: {
            id: true,
            tokenId: true,
            name: true,
            onChainTokenId: true,
            ownerAddress: true,
            isOnChain: true,
          },
        });

        // Fetch on-chain tokens
        const onChainTokens: Array<{
          tokenId: string;
          owner: string;
          name?: string;
        }> = [];

        const maxToCheck = Math.min(Number(supply) + 10, 500); // Check a few extra in case of gaps

        for (let i = 0; i < maxToCheck; i++) {
          try {
            const owner = await ownerOf({ contract: nftContract, tokenId: BigInt(i) });

            let name: string | undefined;
            try {
              const uri = await tokenURI({ contract: nftContract, tokenId: BigInt(i) });
              if (uri?.startsWith("data:application/json;base64,")) {
                const base64Data = uri.replace("data:application/json;base64,", "");
                const metadata = JSON.parse(Buffer.from(base64Data, "base64").toString("utf-8"));
                name = metadata.name;
              }
            } catch {
              // Token URI might not be available
            }

            onChainTokens.push({
              tokenId: i.toString(),
              owner: owner.toLowerCase(),
              name,
            });
          } catch {
            // Token doesn't exist or was burned
          }
        }

        console.log(`[sync-all] ${collection.name}: Found ${onChainTokens.length} on-chain tokens`);

        // Match on-chain tokens to DB NFTs
        // Strategy: Match by owner + order within owner's tokens
        const onChainByOwner = new Map<string, typeof onChainTokens>();
        for (const token of onChainTokens) {
          const existing = onChainByOwner.get(token.owner) || [];
          existing.push(token);
          onChainByOwner.set(token.owner, existing);
        }

        const dbNftsByOwner = new Map<string, typeof dbNfts>();
        for (const nft of dbNfts) {
          if (nft.ownerAddress) {
            const owner = nft.ownerAddress.toLowerCase();
            const existing = dbNftsByOwner.get(owner) || [];
            existing.push(nft);
            dbNftsByOwner.set(owner, existing);
          }
        }

        const updates: Array<{
          id: string;
          onChainTokenId: string;
          ownerAddress: string;
        }> = [];

        const matchedOnChainIds = new Set<string>();
        const matchedDbIds = new Set<string>();

        // Pass 1: Match by owner
        for (const [owner, ownerTokens] of onChainByOwner) {
          const ownerDbNfts = (dbNftsByOwner.get(owner) || []).filter(
            (n) => !matchedDbIds.has(n.id)
          );

          const sortedTokens = [...ownerTokens]
            .filter((t) => !matchedOnChainIds.has(t.tokenId))
            .sort((a, b) => parseInt(a.tokenId) - parseInt(b.tokenId));

          const matchCount = Math.min(sortedTokens.length, ownerDbNfts.length);
          for (let i = 0; i < matchCount; i++) {
            updates.push({
              id: ownerDbNfts[i].id,
              onChainTokenId: sortedTokens[i].tokenId,
              ownerAddress: owner,
            });
            matchedOnChainIds.add(sortedTokens[i].tokenId);
            matchedDbIds.add(ownerDbNfts[i].id);
          }
        }

        // Pass 2: Match remaining unmatched DB NFTs to remaining on-chain tokens
        const unmatchedDbNfts = dbNfts.filter((n) => !matchedDbIds.has(n.id));
        const unmatchedOnChain = onChainTokens.filter(
          (t) => !matchedOnChainIds.has(t.tokenId)
        );

        if (unmatchedDbNfts.length > 0 && unmatchedOnChain.length > 0) {
          unmatchedOnChain.sort((a, b) => parseInt(a.tokenId) - parseInt(b.tokenId));

          for (let i = 0; i < Math.min(unmatchedDbNfts.length, unmatchedOnChain.length); i++) {
            updates.push({
              id: unmatchedDbNfts[i].id,
              onChainTokenId: unmatchedOnChain[i].tokenId,
              ownerAddress: unmatchedOnChain[i].owner,
            });
          }
        }

        collectionResult.matched = updates.length;

        // Apply updates if not dry run
        if (!dryRun) {
          for (const update of updates) {
            try {
              await prisma.nft.update({
                where: { id: update.id },
                data: {
                  onChainTokenId: update.onChainTokenId,
                  ownerAddress: update.ownerAddress,
                  isOnChain: true,
                  onChainAt: new Date(),
                },
              });
              collectionResult.updated++;
            } catch (err) {
              collectionResult.errors.push(`Failed to update ${update.id}: ${err}`);
            }
          }
        } else {
          collectionResult.updated = updates.length; // Would be updated
        }

        totalMatched += collectionResult.matched;
        totalUpdated += collectionResult.updated;

      } catch (err) {
        collectionResult.errors.push(`Collection error: ${err}`);
      }

      results.push(collectionResult);
    }

    // Get total stats
    const totalCollections = await prisma.collection.count({
      where: { address: { startsWith: "0x" }, isDeployed: true },
    });

    return NextResponse.json({
      success: true,
      dryRun,
      summary: {
        totalDeployedCollections: totalCollections,
        collectionsProcessed: collections.length,
        totalMatched,
        totalUpdated,
        remaining: totalCollections - collections.length,
      },
      collections: results,
    });
  } catch (error) {
    console.error("[sync-all] Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/sync-all-collections
 *
 * Get sync status for all collections
 */
export async function GET() {
  try {
    // Count collections and their sync status
    const [totalCollections, totalNfts, nftsOnChain, nftsWithOnChainId] = await Promise.all([
      prisma.collection.count({
        where: { address: { startsWith: "0x" }, isDeployed: true },
      }),
      prisma.nft.count(),
      prisma.nft.count({ where: { isOnChain: true } }),
      prisma.nft.count({ where: { NOT: { onChainTokenId: null } } }),
    ]);

    // Get collections that need syncing (have NFTs without onChainTokenId)
    const collectionsNeedingSync = await prisma.collection.findMany({
      where: {
        address: { startsWith: "0x" },
        isDeployed: true,
        nfts: {
          some: {
            OR: [
              { onChainTokenId: null },
              { isOnChain: false },
            ],
          },
        },
      },
      select: {
        id: true,
        name: true,
        address: true,
        _count: {
          select: { nfts: true },
        },
      },
    });

    // Count NFTs needing sync per collection
    const collectionsWithCounts = await Promise.all(
      collectionsNeedingSync.map(async (c) => {
        const needsSync = await prisma.nft.count({
          where: {
            collectionId: c.id,
            OR: [
              { onChainTokenId: null },
              { isOnChain: false },
            ],
          },
        });
        return {
          id: c.id,
          name: c.name,
          address: c.address,
          totalNfts: c._count.nfts,
          needsSync,
        };
      })
    );

    return NextResponse.json({
      success: true,
      stats: {
        totalDeployedCollections: totalCollections,
        totalNfts,
        nftsMarkedOnChain: nftsOnChain,
        nftsWithOnChainTokenId: nftsWithOnChainId,
        nftsMissingOnChainData: totalNfts - nftsWithOnChainId,
      },
      collectionsNeedingSync: collectionsWithCounts.filter((c) => c.needsSync > 0),
    });
  } catch (error) {
    console.error("[sync-all] Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
