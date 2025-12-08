/**
 * Database Migration Script: Sync onChainTokenId for existing NFTs
 *
 * This script finds NFTs that are marked as on-chain but have incorrect/missing
 * onChainTokenId values and attempts to sync them with the actual blockchain state.
 *
 * Usage:
 *   npx ts-node scripts/sync-onchain-token-ids.ts [--dry-run] [--collection <address>]
 *
 * Options:
 *   --dry-run       Preview changes without modifying the database
 *   --collection    Only process NFTs from a specific collection address
 *   --batch-size    Number of NFTs to process at once (default: 50)
 *   --fix-ownership Also update ownerAddress from on-chain data
 */

import { PrismaClient } from '@prisma/client';
import { getContract, readContract } from 'thirdweb';
import { createThirdwebClient } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';

// Initialize Prisma
const prisma = new PrismaClient();

// Initialize Thirdweb client
const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || '',
});

const CHAIN_ID = 11155111; // Sepolia
const chain = defineChain(CHAIN_ID);

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const fixOwnership = args.includes('--fix-ownership');
const collectionIndex = args.indexOf('--collection');
const collectionFilter = collectionIndex !== -1 ? args[collectionIndex + 1] : null;
const batchSizeIndex = args.indexOf('--batch-size');
const batchSize = batchSizeIndex !== -1 ? parseInt(args[batchSizeIndex + 1]) : 50;

interface SyncResult {
  nftId: string;
  tokenId: string;
  collectionAddress: string;
  oldOnChainTokenId: string | null;
  newOnChainTokenId: string | null;
  oldOwner: string | null;
  newOwner: string | null;
  status: 'updated' | 'skipped' | 'error' | 'not_found';
  error?: string;
}

/**
 * Try to find the actual on-chain token ID for an NFT
 * by checking ownership of sequential token IDs
 */
async function findOnChainTokenId(
  contractAddress: string,
  ownerAddress: string,
  hintTokenId: string
): Promise<{ tokenId: string; owner: string } | null> {
  const contract = getContract({
    client,
    chain,
    address: contractAddress,
  });

  // Strategy 1: Try the hint token ID directly (last segment of compound ID)
  const possibleIds = [hintTokenId];

  // If hint contains a hyphen, extract potential token IDs
  if (hintTokenId.includes('-')) {
    const parts = hintTokenId.split('-');
    // Add all numeric parts as candidates
    parts.forEach(part => {
      if (/^\d+$/.test(part) && !possibleIds.includes(part)) {
        possibleIds.push(part);
      }
    });
  }

  // Strategy 2: Try sequential IDs around common starting points
  for (let i = 0; i <= 20; i++) {
    if (!possibleIds.includes(i.toString())) {
      possibleIds.push(i.toString());
    }
  }

  // Try each possible token ID
  for (const testId of possibleIds) {
    try {
      const owner = await readContract({
        contract,
        method: "function ownerOf(uint256 tokenId) view returns (address)",
        params: [BigInt(testId)],
      });

      if (owner) {
        // Found a valid token - check if it's owned by our target address
        if (owner.toLowerCase() === ownerAddress.toLowerCase()) {
          return { tokenId: testId, owner };
        }
        // Even if not owned by target, we found a valid token
        // Continue checking in case there's a match
      }
    } catch (e) {
      // Token doesn't exist or error - continue
    }
  }

  return null;
}

/**
 * Get the owner of a specific token ID
 */
async function getTokenOwner(
  contractAddress: string,
  tokenId: string
): Promise<string | null> {
  try {
    const contract = getContract({
      client,
      chain,
      address: contractAddress,
    });

    const owner = await readContract({
      contract,
      method: "function ownerOf(uint256 tokenId) view returns (address)",
      params: [BigInt(tokenId)],
    });

    return owner;
  } catch (e) {
    return null;
  }
}

/**
 * Get total supply of a collection to understand token ID range
 */
async function getTotalSupply(contractAddress: string): Promise<bigint | null> {
  try {
    const contract = getContract({
      client,
      chain,
      address: contractAddress,
    });

    // Try totalSupply first
    try {
      const supply = await readContract({
        contract,
        method: "function totalSupply() view returns (uint256)",
        params: [],
      });
      return supply;
    } catch {
      // Try nextTokenIdToMint (for drop contracts)
      const nextId = await readContract({
        contract,
        method: "function nextTokenIdToMint() view returns (uint256)",
        params: [],
      });
      return nextId;
    }
  } catch (e) {
    return null;
  }
}

/**
 * Process a single NFT and attempt to sync its on-chain token ID
 */
async function processNFT(nft: {
  id: string;
  tokenId: string;
  onChainTokenId: string | null;
  ownerAddress: string | null;
  collection: { address: string };
}): Promise<SyncResult> {
  const result: SyncResult = {
    nftId: nft.id,
    tokenId: nft.tokenId,
    collectionAddress: nft.collection.address,
    oldOnChainTokenId: nft.onChainTokenId,
    newOnChainTokenId: null,
    oldOwner: nft.ownerAddress,
    newOwner: null,
    status: 'skipped',
  };

  try {
    // Check if tokenId looks like a timestamp-based ID (likely incorrect)
    const isTimestampBased = nft.tokenId.includes('-') &&
      /^\d{13}-\d+$/.test(nft.tokenId); // e.g., "1760417973371-1"

    // If onChainTokenId already looks valid (pure numeric), verify it
    if (nft.onChainTokenId && /^\d+$/.test(nft.onChainTokenId) && !isTimestampBased) {
      const owner = await getTokenOwner(nft.collection.address, nft.onChainTokenId);
      if (owner) {
        result.newOwner = owner;
        if (fixOwnership && owner.toLowerCase() !== nft.ownerAddress?.toLowerCase()) {
          result.status = 'updated';
        } else {
          result.status = 'skipped';
        }
        result.newOnChainTokenId = nft.onChainTokenId;
        return result;
      }
    }

    // Need to find the correct on-chain token ID
    if (!nft.ownerAddress) {
      result.status = 'skipped';
      result.error = 'No owner address in database';
      return result;
    }

    // Extract potential token ID from the compound format
    let hintId = nft.tokenId;
    if (nft.tokenId.includes('-')) {
      const parts = nft.tokenId.split('-');
      // Use the last numeric part as hint
      for (let i = parts.length - 1; i >= 0; i--) {
        if (/^\d+$/.test(parts[i])) {
          hintId = parts[i];
          break;
        }
      }
    }

    // Try to find the token on-chain
    const found = await findOnChainTokenId(
      nft.collection.address,
      nft.ownerAddress,
      hintId
    );

    if (found) {
      result.newOnChainTokenId = found.tokenId;
      result.newOwner = found.owner;

      if (found.tokenId !== nft.onChainTokenId) {
        result.status = 'updated';
      } else if (fixOwnership && found.owner.toLowerCase() !== nft.ownerAddress?.toLowerCase()) {
        result.status = 'updated';
      } else {
        result.status = 'skipped';
      }
    } else {
      result.status = 'not_found';
      result.error = 'Could not find matching token on-chain';
    }

    return result;
  } catch (e: any) {
    result.status = 'error';
    result.error = e.message;
    return result;
  }
}

/**
 * Main sync function
 */
async function syncOnChainTokenIds() {
  console.log('========================================');
  console.log('NFT On-Chain Token ID Sync Script');
  console.log('========================================');
  console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes)' : 'LIVE (will update database)'}`);
  console.log(`Fix ownership: ${fixOwnership ? 'YES' : 'NO'}`);
  console.log(`Collection filter: ${collectionFilter || 'ALL'}`);
  console.log(`Batch size: ${batchSize}`);
  console.log('----------------------------------------\n');

  // Build query for NFTs that need syncing
  const whereClause: any = {
    isOnChain: true,
    OR: [
      // NFTs with timestamp-based tokenIds (incorrect format)
      { tokenId: { contains: '-' } },
      // NFTs with null onChainTokenId
      { onChainTokenId: null },
      // NFTs where onChainTokenId matches tokenId but tokenId contains hyphen
      {
        AND: [
          { tokenId: { contains: '-' } },
          { NOT: { onChainTokenId: null } }
        ]
      }
    ]
  };

  if (collectionFilter) {
    whereClause.collection = {
      address: {
        equals: collectionFilter,
        mode: 'insensitive'
      }
    };
  }

  // Get count first
  const totalCount = await prisma.nft.count({ where: whereClause });
  console.log(`Found ${totalCount} NFTs that may need syncing\n`);

  if (totalCount === 0) {
    console.log('No NFTs need syncing. Exiting.');
    return;
  }

  // Process in batches
  let processed = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  let notFound = 0;
  const results: SyncResult[] = [];

  while (processed < totalCount) {
    const nfts = await prisma.nft.findMany({
      where: whereClause,
      include: {
        collection: {
          select: { address: true, name: true }
        }
      },
      skip: processed,
      take: batchSize,
      orderBy: { createdAt: 'desc' }
    });

    if (nfts.length === 0) break;

    console.log(`Processing batch ${Math.floor(processed / batchSize) + 1}...`);

    for (const nft of nfts) {
      const result = await processNFT(nft);
      results.push(result);

      // Log progress
      const status = result.status === 'updated' ? '✅' :
                    result.status === 'skipped' ? '⏭️' :
                    result.status === 'not_found' ? '❓' : '❌';

      console.log(`  ${status} ${nft.tokenId} -> ${result.newOnChainTokenId || 'N/A'} (${result.status})`);
      if (result.error) {
        console.log(`     Error: ${result.error}`);
      }

      // Update database if not dry run and status is updated
      if (!isDryRun && result.status === 'updated') {
        try {
          const updateData: any = {};

          if (result.newOnChainTokenId && result.newOnChainTokenId !== nft.onChainTokenId) {
            updateData.onChainTokenId = result.newOnChainTokenId;
          }

          if (fixOwnership && result.newOwner && result.newOwner.toLowerCase() !== nft.ownerAddress?.toLowerCase()) {
            updateData.ownerAddress = result.newOwner.toLowerCase();
          }

          if (Object.keys(updateData).length > 0) {
            await prisma.nft.update({
              where: { id: nft.id },
              data: updateData
            });
          }
        } catch (e: any) {
          console.log(`     DB Update Error: ${e.message}`);
          result.status = 'error';
          result.error = e.message;
        }
      }

      // Update counters
      switch (result.status) {
        case 'updated': updated++; break;
        case 'skipped': skipped++; break;
        case 'error': errors++; break;
        case 'not_found': notFound++; break;
      }
    }

    processed += nfts.length;
    console.log(`  Batch complete. Progress: ${processed}/${totalCount}\n`);

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Print summary
  console.log('\n========================================');
  console.log('SYNC COMPLETE');
  console.log('========================================');
  console.log(`Total processed: ${processed}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Not found: ${notFound}`);
  console.log(`Errors: ${errors}`);

  if (isDryRun) {
    console.log('\n⚠️  DRY RUN - No changes were made to the database');
    console.log('Run without --dry-run to apply changes');
  }

  // Save results to file
  const resultsFile = `sync-results-${Date.now()}.json`;
  const fs = await import('fs');
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  console.log(`\nDetailed results saved to: ${resultsFile}`);
}

// Run the script
syncOnChainTokenIds()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
