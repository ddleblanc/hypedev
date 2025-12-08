import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  NewAuction as NewAuctionEvent,
  NewBid as NewBidEvent,
  CancelledAuction as CancelledAuctionEvent,
  AuctionClosed as AuctionClosedEvent,
} from "../generated/EnglishAuctions/EnglishAuctionsLogic";
import {
  Auction,
  Bid,
  MarketplaceStats,
  CollectionStats,
} from "../generated/schema";

// Helper to get or create global stats
function getOrCreateMarketplaceStats(): MarketplaceStats {
  let stats = MarketplaceStats.load("global");
  if (!stats) {
    stats = new MarketplaceStats("global");
    stats.totalListings = BigInt.fromI32(0);
    stats.totalSales = BigInt.fromI32(0);
    stats.totalAuctions = BigInt.fromI32(0);
    stats.totalOffers = BigInt.fromI32(0);
    stats.totalVolumeETH = BigInt.fromI32(0);
    stats.lastUpdated = BigInt.fromI32(0);
  }
  return stats;
}

// Helper to get or create collection stats
function getOrCreateCollectionStats(assetContract: Bytes): CollectionStats {
  let id = assetContract.toHexString();
  let stats = CollectionStats.load(id);
  if (!stats) {
    stats = new CollectionStats(id);
    stats.assetContract = assetContract;
    stats.totalListings = BigInt.fromI32(0);
    stats.totalSales = BigInt.fromI32(0);
    stats.totalAuctions = BigInt.fromI32(0);
    stats.totalOffers = BigInt.fromI32(0);
    stats.totalVolumeETH = BigInt.fromI32(0);
    stats.floorPrice = null;
    stats.lastSalePrice = null;
    stats.lastUpdated = BigInt.fromI32(0);
  }
  return stats;
}

// Handle new auction created
export function handleNewAuction(event: NewAuctionEvent): void {
  let auctionId = event.params.auctionId.toString();
  let auction = new Auction(auctionId);

  auction.auctionId = event.params.auctionId;
  auction.auctionCreator = event.params.auctionCreator;
  auction.assetContract = event.params.assetContract;
  auction.tokenId = event.params.auction.tokenId;
  auction.quantity = event.params.auction.quantity;
  auction.currency = event.params.auction.currency;
  auction.minimumBidAmount = event.params.auction.minimumBidAmount;
  auction.buyoutBidAmount = event.params.auction.buyoutBidAmount;
  auction.timeBufferInSeconds = event.params.auction.timeBufferInSeconds;
  auction.bidBufferBps = event.params.auction.bidBufferBps;
  auction.startTimestamp = event.params.auction.startTimestamp;
  auction.endTimestamp = event.params.auction.endTimestamp;
  auction.tokenType = event.params.auction.tokenType;
  auction.status = "CREATED";
  auction.winningBidder = null;
  auction.winningBid = null;
  auction.createdAt = event.block.timestamp;
  auction.createdAtBlock = event.block.number;
  auction.updatedAt = event.block.timestamp;
  auction.closedAt = null;
  auction.cancelledAt = null;
  auction.transactionHash = event.transaction.hash;

  auction.save();

  // Update global stats
  let globalStats = getOrCreateMarketplaceStats();
  globalStats.totalAuctions = globalStats.totalAuctions.plus(BigInt.fromI32(1));
  globalStats.lastUpdated = event.block.timestamp;
  globalStats.save();

  // Update collection stats
  let collectionStats = getOrCreateCollectionStats(event.params.assetContract);
  collectionStats.totalAuctions = collectionStats.totalAuctions.plus(
    BigInt.fromI32(1)
  );
  collectionStats.lastUpdated = event.block.timestamp;
  collectionStats.save();
}

// Handle new bid placed
export function handleNewBid(event: NewBidEvent): void {
  let auctionId = event.params.auctionId.toString();
  let auction = Auction.load(auctionId);

  if (auction) {
    auction.winningBidder = event.params.bidder;
    auction.winningBid = event.params.bidAmount;
    // Update end time from auction struct (might be extended due to time buffer)
    auction.endTimestamp = event.params.auction.endTimestamp;
    auction.updatedAt = event.block.timestamp;
    auction.save();
  }

  // Create bid record
  let bid = new Bid(event.transaction.hash.concatI32(event.logIndex.toI32()));
  bid.auction = auctionId;
  bid.auctionId = event.params.auctionId;
  bid.bidder = event.params.bidder;
  bid.assetContract = event.params.assetContract;
  bid.bidAmount = event.params.bidAmount;
  bid.blockNumber = event.block.number;
  bid.blockTimestamp = event.block.timestamp;
  bid.transactionHash = event.transaction.hash;
  bid.save();
}

// Handle auction cancelled
export function handleCancelledAuction(event: CancelledAuctionEvent): void {
  let auctionId = event.params.auctionId.toString();
  let auction = Auction.load(auctionId);

  if (auction) {
    auction.status = "CANCELLED";
    auction.cancelledAt = event.block.timestamp;
    auction.updatedAt = event.block.timestamp;
    auction.save();
  }
}

// Handle auction closed (completed)
export function handleAuctionClosed(event: AuctionClosedEvent): void {
  let auctionId = event.params.auctionId.toString();
  let auction = Auction.load(auctionId);

  if (auction) {
    auction.status = "COMPLETED";
    auction.winningBidder = event.params.winningBidder;
    auction.closedAt = event.block.timestamp;
    auction.updatedAt = event.block.timestamp;
    auction.save();

    // Update collection stats with volume if there was a winning bid
    if (auction.winningBid !== null) {
      let collectionStats = getOrCreateCollectionStats(event.params.assetContract);
      collectionStats.totalSales = collectionStats.totalSales.plus(
        BigInt.fromI32(1)
      );
      collectionStats.totalVolumeETH = collectionStats.totalVolumeETH.plus(
        auction.winningBid as BigInt
      );
      collectionStats.lastSalePrice = auction.winningBid;
      collectionStats.lastUpdated = event.block.timestamp;
      collectionStats.save();

      // Update global stats
      let globalStats = getOrCreateMarketplaceStats();
      globalStats.totalSales = globalStats.totalSales.plus(BigInt.fromI32(1));
      globalStats.totalVolumeETH = globalStats.totalVolumeETH.plus(
        auction.winningBid as BigInt
      );
      globalStats.lastUpdated = event.block.timestamp;
      globalStats.save();
    }
  }
}
