/**
 * Museum Contract Service
 * Thirdweb v5 contract helpers for museum chapter NFT operations
 */
import {
  getContract,
  sendTransaction,
  waitForReceipt,
  readContract,
  prepareContractCall,
} from "thirdweb";
import {
  claimTo,
  getNFT,
  getOwnedNFTs,
  totalSupply,
  getClaimConditions,
  balanceOf,
} from "thirdweb/extensions/erc721";
import { isApprovedForAll, setApprovalForAll, ownerOf } from "thirdweb/extensions/erc721";
import { client } from "./thirdweb";
import { defineChain } from "thirdweb/chains";
import { prisma } from "./prisma";
import type { Account } from "thirdweb/wallets";

// Chain configuration - using Sepolia for testnet
export const MUSEUM_CHAIN_ID = 11155111; // Sepolia
export const MUSEUM_CHAIN = defineChain(MUSEUM_CHAIN_ID);

/**
 * Get contract instance for a collection by address
 */
export function getMuseumContract(contractAddress: string) {
  return getContract({
    client,
    chain: MUSEUM_CHAIN,
    address: contractAddress,
  });
}

/**
 * Get contract instance for a legend's collection
 */
export async function getLegendContract(legendId: string) {
  const legend = await prisma.legend.findUnique({
    where: { id: legendId },
    include: { collection: true },
  });

  if (!legend?.collection?.address) {
    throw new Error(`No collection contract found for legend ${legendId}`);
  }

  return getContract({
    client,
    chain: MUSEUM_CHAIN,
    address: legend.collection.address,
  });
}

/**
 * Get legend's collection contract address
 */
export async function getLegendContractAddress(legendId: string): Promise<string | null> {
  const legend = await prisma.legend.findUnique({
    where: { id: legendId },
    include: { collection: true },
  });

  return legend?.collection?.address || null;
}

/**
 * Parse tokenId to BigInt, handling compound formats like "1234567890-0"
 */
function parseTokenId(tokenId: string): bigint {
  if (tokenId.includes("-")) {
    const parts = tokenId.split("-");
    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i];
      if (/^\d+$/.test(part)) {
        console.log(`Parsed tokenId "${tokenId}" -> using on-chain tokenId: ${part}`);
        return BigInt(part);
      }
    }
    throw new Error(`Invalid tokenId format: ${tokenId}. Expected numeric value.`);
  }

  if (!/^\d+$/.test(tokenId)) {
    throw new Error(`Invalid tokenId format: ${tokenId}. Expected numeric value.`);
  }
  return BigInt(tokenId);
}

/**
 * Check if user owns a specific chapter NFT
 */
export async function userOwnsChapter(
  userAddress: string,
  legendId: string,
  chapterId: string
): Promise<boolean> {
  try {
    const chapter = await prisma.legendChapter.findUnique({
      where: { id: chapterId },
      include: {
        legend: { include: { collection: true } },
        nft: true,
      },
    });

    if (!chapter?.legend.collection?.address || !chapter.nft?.tokenId) {
      return false;
    }

    const contract = getMuseumContract(chapter.legend.collection.address);
    const tokenIdBigInt = parseTokenId(chapter.nft.tokenId);

    try {
      const actualOwner = await ownerOf({
        contract,
        tokenId: tokenIdBigInt,
      });

      return actualOwner.toLowerCase() === userAddress.toLowerCase();
    } catch {
      // Token might not exist or other error
      return false;
    }
  } catch (error) {
    console.error("Error checking chapter ownership:", error);
    return false;
  }
}

/**
 * Get all chapters owned by user for a legend
 */
export async function getUserOwnedChapters(
  userAddress: string,
  legendId: string
): Promise<string[]> {
  try {
    const legend = await prisma.legend.findUnique({
      where: { id: legendId },
      include: {
        collection: true,
        chapters: {
          include: { nft: true },
        },
      },
    });

    if (!legend?.collection?.address) {
      return [];
    }

    const contract = getMuseumContract(legend.collection.address);

    // Get all NFTs owned by user in this collection
    const ownedNFTs = await getOwnedNFTs({
      contract,
      owner: userAddress,
    });

    const ownedTokenIds = new Set(ownedNFTs.map((nft) => nft.id.toString()));

    // Match owned tokenIds to chapters
    const ownedChapterIds = legend.chapters
      .filter((chapter) => chapter.nft?.tokenId && ownedTokenIds.has(chapter.nft.tokenId))
      .map((chapter) => chapter.id);

    return ownedChapterIds;
  } catch (error) {
    console.error("Error getting owned chapters:", error);
    return [];
  }
}

/**
 * Get claim conditions for a legend's collection
 */
export async function getMuseumClaimConditions(legendId: string) {
  try {
    const contract = await getLegendContract(legendId);

    const conditions = await getClaimConditions({
      contract,
    });

    return conditions;
  } catch (error) {
    console.error("Error getting claim conditions:", error);
    return null;
  }
}

/**
 * Check if a chapter is available for purchase
 */
export async function isChapterAvailable(
  legendId: string,
  chapterId: string,
  userAddress?: string
): Promise<{ available: boolean; reason: string | undefined }> {
  const chapter = await prisma.legendChapter.findUnique({
    where: { id: chapterId },
    include: {
      legend: { include: { collection: true } },
      nft: true,
    },
  });

  if (!chapter) {
    return { available: false, reason: "Chapter not found" };
  }

  if (!chapter.legend.collection?.address) {
    return { available: false, reason: "Collection not deployed" };
  }

  // Check if user already owns this chapter
  if (userAddress && chapter.nft?.tokenId) {
    const owns = await userOwnsChapter(userAddress, legendId, chapterId);
    if (owns) {
      return { available: false, reason: "You already own this chapter" };
    }
  }

  // Check prerequisites
  if (chapter.prerequisiteNumber && userAddress) {
    const prereqChapter = await prisma.legendChapter.findFirst({
      where: {
        legendId,
        number: chapter.prerequisiteNumber,
      },
    });

    if (prereqChapter) {
      const ownsPrereq = await userOwnsChapter(userAddress, legendId, prereqChapter.id);
      if (!ownsPrereq) {
        return {
          available: false,
          reason: `Must own Chapter ${chapter.prerequisiteNumber} first`,
        };
      }
    }
  }

  // Check edition limits for 1/1 editions
  if (chapter.edition.toLowerCase().includes("1/1") || chapter.edition.toLowerCase() === "1 of 1") {
    if (chapter.nft?.ownerAddress) {
      return { available: false, reason: "Already minted (1/1)" };
    }
  }

  return { available: true, reason: undefined };
}

/**
 * Prepare chapter claim transaction data
 * Returns the contract address and prepared transaction
 */
export async function prepareChapterClaim(
  legendId: string,
  chapterId: string,
  recipientAddress: string
) {
  const chapter = await prisma.legendChapter.findUnique({
    where: { id: chapterId },
    include: {
      legend: { include: { collection: true } },
    },
  });

  if (!chapter) {
    throw new Error("Chapter not found");
  }

  if (!chapter.legend.collection?.address) {
    throw new Error("Collection not deployed for this legend");
  }

  const contract = getMuseumContract(chapter.legend.collection.address);

  // Prepare claim transaction
  const transaction = claimTo({
    contract,
    to: recipientAddress,
    quantity: BigInt(1),
  });

  return {
    contractAddress: chapter.legend.collection.address,
    chainId: MUSEUM_CHAIN_ID,
    transaction,
    chapter,
    price: chapter.price || 0,
    currency: "ETH",
  };
}

/**
 * Claim/mint a chapter NFT
 * This is the server-side claim function for signed transactions
 */
export async function claimChapterNFT(
  account: Account,
  legendId: string,
  chapterId: string
): Promise<{ transactionHash: string; tokenId: string }> {
  const { transaction, chapter } = await prepareChapterClaim(
    legendId,
    chapterId,
    account.address
  );

  console.log("=== MUSEUM CLAIM DEBUG ===");
  console.log("Legend ID:", legendId);
  console.log("Chapter ID:", chapterId);
  console.log("Recipient:", account.address);
  console.log("Chapter:", chapter.title);

  const result = await sendTransaction({
    transaction,
    account,
  });

  console.log("Claim transaction submitted:", result.transactionHash);

  // Wait for confirmation
  const receipt = await waitForReceipt({
    client,
    chain: MUSEUM_CHAIN,
    transactionHash: result.transactionHash,
  });

  // Extract token ID from events if possible
  let tokenId = chapter.number.toString();
  if (receipt.logs && receipt.logs.length > 0) {
    for (const log of receipt.logs) {
      if (log.topics && log.topics.length > 3) {
        try {
          // Transfer event: topics[3] is usually the tokenId
          const decodedId = BigInt(log.topics[3] as string).toString();
          if (decodedId) {
            tokenId = decodedId;
            break;
          }
        } catch {
          // Continue trying other logs
        }
      }
    }
  }

  console.log("Chapter claimed with token ID:", tokenId);
  console.log("===========================");

  return {
    transactionHash: result.transactionHash,
    tokenId,
  };
}

/**
 * Record chapter purchase in database
 * Called after successful on-chain transaction
 */
export async function recordChapterPurchase(
  userId: string,
  legendId: string,
  chapterId: string,
  transactionHash: string,
  tokenId: string,
  walletAddress: string
) {
  // Get chapter with collection info
  const chapter = await prisma.legendChapter.findUnique({
    where: { id: chapterId },
    include: {
      legend: { include: { collection: true } },
      nft: true,
    },
  });

  if (!chapter) {
    throw new Error("Chapter not found");
  }

  // Update NFT owner if exists
  if (chapter.nft) {
    await prisma.nft.update({
      where: { id: chapter.nft.id },
      data: {
        ownerAddress: walletAddress,
        isListed: false,
        isMinted: true,
        mintedAt: new Date(),
        isOnChain: true,
        onChainAt: new Date(),
        onChainTokenId: tokenId,
      },
    });
  }

  // Update user progress
  await prisma.userLegendProgress.upsert({
    where: {
      userId_legendId: {
        userId,
        legendId,
      },
    },
    create: {
      userId,
      legendId,
      chaptersOwned: [chapterId],
      firstVisitAt: new Date(),
      lastVisitAt: new Date(),
    },
    update: {
      chaptersOwned: {
        push: chapterId,
      },
      lastVisitAt: new Date(),
    },
  });

  // Record activity
  await prisma.activity.create({
    data: {
      userId,
      type: "museum_chapter_purchase",
      nftId: chapter.nft?.id,
      collectionId: chapter.legend.collection?.id,
      amount: chapter.price || 0,
      currency: "ETH",
      transactionHash,
      metadata: {
        legendId,
        legendName: chapter.legend.name,
        chapterId,
        chapterTitle: chapter.title,
        chapterNumber: chapter.number,
        tokenId,
      },
    },
  });

  return { success: true };
}

/**
 * Get chapter purchase preparation data for frontend
 */
export async function getChapterPurchaseData(legendId: string, chapterId: string) {
  const chapter = await prisma.legendChapter.findUnique({
    where: { id: chapterId },
    include: {
      legend: { include: { collection: true } },
      nft: true,
    },
  });

  if (!chapter) {
    throw new Error("Chapter not found");
  }

  if (!chapter.legend.collection?.address) {
    throw new Error("Collection not deployed");
  }

  // Get claim conditions if available
  let claimConditions = null;
  try {
    claimConditions = await getMuseumClaimConditions(legendId);
  } catch {
    // Claim conditions might not be set
  }

  return {
    contractAddress: chapter.legend.collection.address,
    chainId: MUSEUM_CHAIN_ID,
    price: chapter.price || 0,
    currency: "ETH",
    edition: chapter.edition,
    rarity: chapter.rarity,
    claimConditions,
    chapter: {
      id: chapter.id,
      number: chapter.number,
      title: chapter.title,
      subtitle: chapter.subtitle,
      description: chapter.description,
      thumbnailUrl: chapter.thumbnailUrl,
      videoUrl: chapter.videoUrl,
      year: chapter.year,
    },
    legend: {
      id: chapter.legend.id,
      name: chapter.legend.name,
      primaryColor: chapter.legend.primaryColor,
    },
  };
}

/**
 * Get all purchasable chapters for a legend with pricing
 */
export async function getLegendChaptersWithPricing(legendId: string, userAddress?: string) {
  const chapters = await prisma.legendChapter.findMany({
    where: { legendId },
    orderBy: { number: "asc" },
    include: {
      nft: {
        select: {
          id: true,
          tokenId: true,
          ownerAddress: true,
          isListed: true,
          listingPrice: true,
        },
      },
    },
  });

  // Check ownership for each chapter
  const chaptersWithOwnership = await Promise.all(
    chapters.map(async (chapter) => {
      let isOwned = false;
      let availability = { available: true, reason: undefined as string | undefined };

      if (userAddress) {
        isOwned = await userOwnsChapter(userAddress, legendId, chapter.id);
        availability = await isChapterAvailable(legendId, chapter.id, userAddress);
      }

      return {
        ...chapter,
        isOwned,
        isAvailable: availability.available,
        unavailableReason: availability.reason,
      };
    })
  );

  return chaptersWithOwnership;
}

/**
 * Calculate total collection price (all chapters)
 */
export async function getCollectionTotalPrice(legendId: string): Promise<number> {
  const chapters = await prisma.legendChapter.findMany({
    where: { legendId },
    select: { price: true },
  });

  return chapters.reduce((sum, chapter) => sum + (chapter.price || 0), 0);
}
