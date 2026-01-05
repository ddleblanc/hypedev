/**
 * Search Index Rebuild Job
 * Rebuilds the SearchIndex table for fast global search queries
 */
import { prisma } from "../prisma";

interface RebuildResult {
  collections: number;
  nfts: number;
  users: number;
  total: number;
  duration: number;
}

/**
 * Rebuild the entire search index.
 * Should be run periodically via cron or manually after bulk data changes.
 */
export async function rebuildSearchIndex(): Promise<RebuildResult> {
  const startTime = Date.now();
  console.log("[SearchIndex] Starting rebuild...");

  // Clear existing index
  await prisma.searchIndex.deleteMany({});
  console.log("[SearchIndex] Cleared existing index");

  // Index collections
  const collections = await prisma.collection.findMany({
    where: { isDeployed: true },
    select: {
      id: true,
      name: true,
      description: true,
      image: true,
      address: true,
      category: true,
      tags: true,
      floorPrice: true,
      mintedSupply: true,
      isVerified: true,
      creatorAddress: true,
    },
  });

  if (collections.length > 0) {
    await prisma.searchIndex.createMany({
      data: collections.map((c) => ({
        entityType: "collection",
        entityId: c.id,
        title: c.name,
        description: c.description,
        keywords: [c.name, c.category, ...c.tags].filter(Boolean) as string[],
        searchVector: buildSearchVector([
          c.name,
          c.description,
          c.category,
          c.address,
          ...c.tags,
        ]),
        collectionId: c.id,
        creatorAddress: c.creatorAddress,
      })),
    });
  }
  console.log(`[SearchIndex] Indexed ${collections.length} collections`);

  // Index NFTs - prioritize by rarity/listing status
  // Limit to top 50k to avoid overwhelming the index
  const nfts = await prisma.nft.findMany({
    where: {
      collection: { isDeployed: true },
    },
    orderBy: [{ isListed: "desc" }, { rarityRank: "asc" }],
    take: 50000,
    select: {
      id: true,
      name: true,
      description: true,
      image: true,
      tokenId: true,
      onChainTokenId: true,
      collectionId: true,
      ownerAddress: true,
      collection: {
        select: {
          name: true,
          address: true,
        },
      },
    },
  });

  // Batch insert NFTs in chunks to avoid memory issues
  const NFT_BATCH_SIZE = 5000;
  for (let i = 0; i < nfts.length; i += NFT_BATCH_SIZE) {
    const batch = nfts.slice(i, i + NFT_BATCH_SIZE);
    await prisma.searchIndex.createMany({
      data: batch.map((n) => ({
        entityType: "nft",
        entityId: n.id,
        title: n.name,
        description: n.description,
        keywords: [n.name, n.collection.name, n.tokenId, n.onChainTokenId].filter(
          Boolean
        ) as string[],
        searchVector: buildSearchVector([
          n.name,
          n.description,
          n.collection.name,
          n.tokenId,
          n.onChainTokenId,
        ]),
        collectionId: n.collectionId,
        creatorAddress: n.ownerAddress,
      })),
    });
  }
  console.log(`[SearchIndex] Indexed ${nfts.length} NFTs`);

  // Index users
  const users = await prisma.user.findMany({
    where: {
      OR: [{ username: { not: null } }, { isCreator: true }],
    },
    select: {
      id: true,
      username: true,
      bio: true,
      profilePicture: true,
      walletAddress: true,
      isCreator: true,
    },
  });

  if (users.length > 0) {
    await prisma.searchIndex.createMany({
      data: users.map((u) => ({
        entityType: "user",
        entityId: u.id,
        title: u.username || formatAddress(u.walletAddress),
        description: u.bio,
        keywords: [u.username, u.walletAddress].filter(Boolean) as string[],
        searchVector: buildSearchVector([u.username, u.bio, u.walletAddress]),
        creatorAddress: u.walletAddress,
      })),
    });
  }
  console.log(`[SearchIndex] Indexed ${users.length} users`);

  const duration = Date.now() - startTime;
  const total = collections.length + nfts.length + users.length;

  console.log(`[SearchIndex] Rebuild complete: ${total} items in ${duration}ms`);

  return {
    collections: collections.length,
    nfts: nfts.length,
    users: users.length,
    total,
    duration,
  };
}

/**
 * Incrementally update the search index for a specific entity
 */
export async function updateSearchIndexEntry(
  entityType: "collection" | "nft" | "user",
  entityId: string
): Promise<void> {
  // Delete existing entry
  await prisma.searchIndex.deleteMany({
    where: { entityType, entityId },
  });

  // Re-index based on type
  switch (entityType) {
    case "collection": {
      const collection = await prisma.collection.findUnique({
        where: { id: entityId },
        select: {
          id: true,
          name: true,
          description: true,
          address: true,
          category: true,
          tags: true,
          isDeployed: true,
          creatorAddress: true,
        },
      });

      if (collection && collection.isDeployed) {
        await prisma.searchIndex.create({
          data: {
            entityType: "collection",
            entityId: collection.id,
            title: collection.name,
            description: collection.description,
            keywords: [collection.name, collection.category, ...collection.tags].filter(
              Boolean
            ) as string[],
            searchVector: buildSearchVector([
              collection.name,
              collection.description,
              collection.category,
              collection.address,
              ...collection.tags,
            ]),
            collectionId: collection.id,
            creatorAddress: collection.creatorAddress,
          },
        });
      }
      break;
    }

    case "nft": {
      const nft = await prisma.nft.findUnique({
        where: { id: entityId },
        select: {
          id: true,
          name: true,
          description: true,
          tokenId: true,
          onChainTokenId: true,
          collectionId: true,
          ownerAddress: true,
          collection: {
            select: {
              name: true,
              isDeployed: true,
            },
          },
        },
      });

      if (nft && nft.collection.isDeployed) {
        await prisma.searchIndex.create({
          data: {
            entityType: "nft",
            entityId: nft.id,
            title: nft.name,
            description: nft.description,
            keywords: [nft.name, nft.collection.name, nft.tokenId, nft.onChainTokenId].filter(
              Boolean
            ) as string[],
            searchVector: buildSearchVector([
              nft.name,
              nft.description,
              nft.collection.name,
              nft.tokenId,
              nft.onChainTokenId,
            ]),
            collectionId: nft.collectionId,
            creatorAddress: nft.ownerAddress,
          },
        });
      }
      break;
    }

    case "user": {
      const user = await prisma.user.findUnique({
        where: { id: entityId },
        select: {
          id: true,
          username: true,
          bio: true,
          walletAddress: true,
        },
      });

      if (user && user.username) {
        await prisma.searchIndex.create({
          data: {
            entityType: "user",
            entityId: user.id,
            title: user.username || formatAddress(user.walletAddress),
            description: user.bio,
            keywords: [user.username, user.walletAddress].filter(Boolean) as string[],
            searchVector: buildSearchVector([user.username, user.bio, user.walletAddress]),
            creatorAddress: user.walletAddress,
          },
        });
      }
      break;
    }
  }
}

/**
 * Build a lowercase search vector from multiple text fields
 */
function buildSearchVector(fields: (string | null | undefined)[]): string {
  return fields
    .filter(Boolean)
    .map((f) => f!.toLowerCase().trim())
    .join(" ");
}

/**
 * Format wallet address for display
 */
function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Get search index statistics
 */
export async function getSearchIndexStats(): Promise<{
  total: number;
  byType: Record<string, number>;
  lastUpdated: Date | null;
}> {
  const [total, byType, lastEntry] = await Promise.all([
    prisma.searchIndex.count(),
    prisma.searchIndex.groupBy({
      by: ["entityType"],
      _count: true,
    }),
    prisma.searchIndex.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    }),
  ]);

  return {
    total,
    byType: Object.fromEntries(byType.map((b) => [b.entityType, b._count])),
    lastUpdated: lastEntry?.updatedAt || null,
  };
}
