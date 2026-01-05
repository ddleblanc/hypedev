import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNFTContract } from "@/lib/marketplace";
import { totalSupply, ownerOf, tokenURI } from "thirdweb/extensions/erc721";
import { readContract } from "thirdweb";

/**
 * POST /api/admin/sync-token-ids
 * Sync on-chain token IDs for NFTs in a collection
 *
 * Body: { collectionId: string } or { contractAddress: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { collectionId, contractAddress } = body;

    if (!collectionId && !contractAddress) {
      return NextResponse.json(
        { success: false, error: "collectionId or contractAddress is required" },
        { status: 400 }
      );
    }

    // Get the collection
    const collection = await prisma.collection.findFirst({
      where: collectionId
        ? { id: collectionId }
        : { address: contractAddress.toLowerCase() },
    });

    if (!collection) {
      return NextResponse.json(
        { success: false, error: "Collection not found" },
        { status: 404 }
      );
    }

    console.log(`[sync-token-ids] Starting sync for collection: ${collection.name} (${collection.address})`);

    // Get the NFT contract
    const nftContract = getNFTContract(collection.address);

    // Get total supply
    let supply: bigint;
    try {
      supply = await totalSupply({ contract: nftContract });
      console.log(`[sync-token-ids] Total supply: ${supply}`);
    } catch (err) {
      console.error("[sync-token-ids] Error getting total supply:", err);
      return NextResponse.json(
        { success: false, error: "Failed to get total supply from contract" },
        { status: 500 }
      );
    }

    if (supply === BigInt(0)) {
      return NextResponse.json({
        success: true,
        message: "No tokens minted on-chain",
        updated: 0,
      });
    }

    // Get all NFTs from database for this collection
    const dbNfts = await prisma.nft.findMany({
      where: { collectionId: collection.id },
      select: {
        id: true,
        tokenId: true,
        onChainTokenId: true,
        name: true,
        metadataUri: true,
        ownerAddress: true,
      },
    });

    console.log(`[sync-token-ids] Found ${dbNfts.length} NFTs in database`);

    // Fetch on-chain token data
    const onChainTokens: { tokenId: string; owner: string; uri?: string; metadata?: any }[] = [];

    // Iterate through on-chain tokens (0 to supply-1 for most contracts)
    const maxToCheck = Number(supply) > 1000 ? 1000 : Number(supply);

    for (let i = 0; i <= maxToCheck; i++) {
      const tokenId = BigInt(i);

      try {
        // Check if token exists by trying to get owner
        const owner = await ownerOf({ contract: nftContract, tokenId });

        // Get token URI and decode metadata
        let uri: string | undefined;
        let metadata: any = null;
        try {
          uri = await tokenURI({ contract: nftContract, tokenId });
          // Decode base64 JSON metadata if present
          if (uri?.startsWith("data:application/json;base64,")) {
            const base64Data = uri.replace("data:application/json;base64,", "");
            metadata = JSON.parse(Buffer.from(base64Data, "base64").toString("utf-8"));
          }
        } catch {
          // Token URI might not be available
        }

        onChainTokens.push({
          tokenId: tokenId.toString(),
          owner: owner.toLowerCase(),
          uri,
          metadata,
        });

        console.log(`[sync-token-ids] Found on-chain token ${tokenId} owned by ${owner.slice(0, 8)}... name: ${metadata?.name || "unknown"}`);
      } catch (err: any) {
        // Token might not exist (burned or not minted)
        if (!err.message?.includes("nonexistent token") && !err.message?.includes("invalid token") && !err.message?.includes("execution reverted")) {
          console.log(`[sync-token-ids] Token ${tokenId} error:`, err.message?.slice(0, 100));
        }
      }
    }

    console.log(`[sync-token-ids] Found ${onChainTokens.length} on-chain tokens`);

    // Group on-chain tokens by owner
    const onChainByOwner = new Map<string, typeof onChainTokens>();
    for (const token of onChainTokens) {
      const existing = onChainByOwner.get(token.owner) || [];
      existing.push(token);
      onChainByOwner.set(token.owner, existing);
    }

    // Group DB NFTs by owner
    const dbNftsByOwner = new Map<string, typeof dbNfts>();
    for (const nft of dbNfts) {
      if (nft.ownerAddress) {
        const owner = nft.ownerAddress.toLowerCase();
        const existing = dbNftsByOwner.get(owner) || [];
        existing.push(nft);
        dbNftsByOwner.set(owner, existing);
      }
    }

    console.log(`[sync-token-ids] On-chain owners: ${[...onChainByOwner.keys()].join(", ")}`);
    console.log(`[sync-token-ids] DB owners: ${[...dbNftsByOwner.keys()].join(", ")}`);

    // STRATEGY: Clear all existing onChainTokenIds first, then match fresh
    // This ensures we get a clean 1:1 mapping

    // First, clear all onChainTokenIds for this collection
    await prisma.nft.updateMany({
      where: { collectionId: collection.id },
      data: { onChainTokenId: null },
    });
    console.log(`[sync-token-ids] Cleared existing onChainTokenIds`);

    // Track which on-chain tokens have been matched
    const updates: { id: string; onChainTokenId: string }[] = [];
    const matchedOnChainIds = new Set<string>();
    const matchedDbIds = new Set<string>();

    // PASS 1: Match by owner + order (same owner, assign in sequence)
    for (const [owner, ownerOnChainTokens] of onChainByOwner) {
      const ownerDbNfts = (dbNftsByOwner.get(owner) || []).filter(n => !matchedDbIds.has(n.id));

      console.log(`[sync-token-ids] Owner ${owner.slice(0, 8)}... has ${ownerOnChainTokens.length} on-chain, ${ownerDbNfts.length} unmatched in DB`);

      // Sort on-chain tokens by tokenId
      const sortedOnChain = [...ownerOnChainTokens]
        .filter(t => !matchedOnChainIds.has(t.tokenId))
        .sort((a, b) => parseInt(a.tokenId) - parseInt(b.tokenId));

      // Match one-to-one in order
      const matchCount = Math.min(sortedOnChain.length, ownerDbNfts.length);
      for (let i = 0; i < matchCount; i++) {
        const onChainToken = sortedOnChain[i];
        const dbNft = ownerDbNfts[i];

        updates.push({
          id: dbNft.id,
          onChainTokenId: onChainToken.tokenId,
        });
        matchedOnChainIds.add(onChainToken.tokenId);
        matchedDbIds.add(dbNft.id);
        console.log(`[sync-token-ids] Matched on-chain token ${onChainToken.tokenId} (${onChainToken.metadata?.name}) to DB NFT: ${dbNft.name} (${dbNft.id})`);
      }

      if (sortedOnChain.length > ownerDbNfts.length) {
        console.log(`[sync-token-ids] WARNING: ${sortedOnChain.length - ownerDbNfts.length} on-chain tokens for ${owner.slice(0, 8)}... have no DB match`);
      }
      if (ownerDbNfts.length > sortedOnChain.length) {
        console.log(`[sync-token-ids] WARNING: ${ownerDbNfts.length - sortedOnChain.length} DB NFTs for ${owner.slice(0, 8)}... have no on-chain match`);
      }
    }

    // PASS 2: Match remaining unmatched (DB NFTs without owner or owner mismatch)
    const unmatchedDbNfts = dbNfts.filter(n => !matchedDbIds.has(n.id));
    const unmatchedOnChain = onChainTokens.filter(t => !matchedOnChainIds.has(t.tokenId));

    if (unmatchedDbNfts.length > 0 && unmatchedOnChain.length > 0) {
      console.log(`[sync-token-ids] PASS 2: Matching ${unmatchedDbNfts.length} remaining DB NFTs to ${unmatchedOnChain.length} remaining on-chain tokens`);

      // Sort remaining by tokenId
      unmatchedOnChain.sort((a, b) => parseInt(a.tokenId) - parseInt(b.tokenId));

      for (let i = 0; i < Math.min(unmatchedDbNfts.length, unmatchedOnChain.length); i++) {
        updates.push({
          id: unmatchedDbNfts[i].id,
          onChainTokenId: unmatchedOnChain[i].tokenId,
        });
        console.log(`[sync-token-ids] Matched remaining on-chain token ${unmatchedOnChain[i].tokenId} to DB NFT: ${unmatchedDbNfts[i].name}`);
      }
    }

    console.log(`[sync-token-ids] Found ${onChainTokens.length} on-chain tokens, ${updates.length} to update`);

    // Perform updates
    let updatedCount = 0;
    for (const update of updates) {
      try {
        await prisma.nft.update({
          where: { id: update.id },
          data: {
            onChainTokenId: update.onChainTokenId,
            isOnChain: true,  // Mark as on-chain when we confirm it exists
            onChainAt: new Date(),
          },
        });
        updatedCount++;
      } catch (err) {
        console.error(`[sync-token-ids] Failed to update NFT ${update.id}:`, err);
      }
    }

    console.log(`[sync-token-ids] Successfully updated ${updatedCount} NFTs`);

    return NextResponse.json({
      success: true,
      collection: {
        id: collection.id,
        name: collection.name,
        address: collection.address,
      },
      stats: {
        onChainSupply: Number(supply),
        onChainTokensFound: onChainTokens.length,
        dbNftsCount: dbNfts.length,
        matchedAndUpdated: updatedCount,
      },
      onChainTokens: onChainTokens.slice(0, 50), // Return first 50 for inspection
    });
  } catch (error) {
    console.error("[sync-token-ids] Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/sync-token-ids
 * Get status of on-chain token IDs for a collection
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const collectionId = searchParams.get("collectionId");
    const contractAddress = searchParams.get("contractAddress");

    if (!collectionId && !contractAddress) {
      return NextResponse.json(
        { success: false, error: "collectionId or contractAddress is required" },
        { status: 400 }
      );
    }

    // Get the collection
    const collection = await prisma.collection.findFirst({
      where: collectionId
        ? { id: collectionId }
        : { address: contractAddress!.toLowerCase() },
    });

    if (!collection) {
      return NextResponse.json(
        { success: false, error: "Collection not found" },
        { status: 404 }
      );
    }

    // Get NFT stats
    const [totalNfts, nftsWithOnChainId, nftsWithoutOnChainId] = await Promise.all([
      prisma.nft.count({ where: { collectionId: collection.id } }),
      prisma.nft.count({ where: { collectionId: collection.id, onChainTokenId: { not: null } } }),
      prisma.nft.findMany({
        where: { collectionId: collection.id, onChainTokenId: null },
        select: { id: true, tokenId: true, name: true },
        take: 20,
      }),
    ]);

    // Get on-chain supply
    let onChainSupply = 0;
    try {
      const nftContract = getNFTContract(collection.address);
      const supply = await totalSupply({ contract: nftContract });
      onChainSupply = Number(supply);
    } catch {
      // Contract might not support totalSupply
    }

    return NextResponse.json({
      success: true,
      collection: {
        id: collection.id,
        name: collection.name,
        address: collection.address,
      },
      stats: {
        onChainSupply,
        totalNftsInDb: totalNfts,
        nftsWithOnChainId,
        nftsMissingOnChainId: totalNfts - nftsWithOnChainId,
      },
      sampleMissingOnChainId: nftsWithoutOnChainId,
    });
  } catch (error) {
    console.error("[sync-token-ids] Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
