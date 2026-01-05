/**
 * Collection Price Snapshots Job
 * Takes hourly snapshots of collection stats for historical tracking
 */
import { prisma } from "../prisma";
import { getCollectionStats } from "../analytics";

/**
 * Take hourly snapshots of collection stats for historical tracking.
 * Should be run via cron job or Vercel Cron.
 */
export async function takeCollectionSnapshots(): Promise<{
  succeeded: number;
  failed: number;
  total: number;
}> {
  const collections = await prisma.collection.findMany({
    where: { isDeployed: true },
    select: { id: true, address: true },
  });

  const results = await Promise.allSettled(
    collections.map(async (collection) => {
      const stats = await getCollectionStats(collection.id, collection.address);

      return prisma.collectionPriceSnapshot.create({
        data: {
          collectionId: collection.id,
          floorPrice: stats.floorPrice,
          volume24h: stats.volume24h,
          sales24h: stats.sales24h,
          listedCount: stats.listedCount,
          holders: stats.holders,
        },
      });
    })
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  console.log(`[Snapshot] Captured ${succeeded}/${collections.length} collection snapshots`);

  if (failed > 0) {
    const errors = results
      .filter((r): r is PromiseRejectedResult => r.status === "rejected")
      .map((r) => r.reason);
    console.error("[Snapshot] Failed snapshots:", errors);
  }

  return {
    succeeded,
    failed,
    total: collections.length,
  };
}

/**
 * Calculate floor price change percentages from snapshots
 */
export async function getFloorPriceChanges(collectionId: string): Promise<{
  floorChange24h: number | null;
  floorChange7d: number | null;
}> {
  const now = new Date();
  const day1Ago = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const day7Ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [current, snapshot24h, snapshot7d] = await Promise.all([
    prisma.collectionPriceSnapshot.findFirst({
      where: { collectionId },
      orderBy: { timestamp: "desc" },
    }),
    prisma.collectionPriceSnapshot.findFirst({
      where: { collectionId, timestamp: { lte: day1Ago } },
      orderBy: { timestamp: "desc" },
    }),
    prisma.collectionPriceSnapshot.findFirst({
      where: { collectionId, timestamp: { lte: day7Ago } },
      orderBy: { timestamp: "desc" },
    }),
  ]);

  const currentFloor = current?.floorPrice;

  return {
    floorChange24h:
      currentFloor && snapshot24h?.floorPrice
        ? ((currentFloor - snapshot24h.floorPrice) / snapshot24h.floorPrice) * 100
        : null,
    floorChange7d:
      currentFloor && snapshot7d?.floorPrice
        ? ((currentFloor - snapshot7d.floorPrice) / snapshot7d.floorPrice) * 100
        : null,
  };
}

/**
 * Get historical floor price data for charting
 */
export async function getFloorPriceHistory(
  collectionId: string,
  days: number = 30
): Promise<
  Array<{
    timestamp: Date;
    floorPrice: number | null;
    volume24h: number;
    sales24h: number;
  }>
> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const snapshots = await prisma.collectionPriceSnapshot.findMany({
    where: {
      collectionId,
      timestamp: { gte: since },
    },
    orderBy: { timestamp: "asc" },
    select: {
      timestamp: true,
      floorPrice: true,
      volume24h: true,
      sales24h: true,
    },
  });

  return snapshots;
}

/**
 * Cleanup old snapshots (keep last 90 days)
 */
export async function cleanupOldSnapshots(): Promise<number> {
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const result = await prisma.collectionPriceSnapshot.deleteMany({
    where: { timestamp: { lt: cutoff } },
  });

  console.log(`[Snapshot] Cleaned up ${result.count} old snapshots`);
  return result.count;
}
