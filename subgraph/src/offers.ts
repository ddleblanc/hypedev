import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  NewOffer as NewOfferEvent,
  AcceptedOffer as AcceptedOfferEvent,
  CancelledOffer as CancelledOfferEvent,
} from "../generated/Offers/OffersLogic";
import {
  Offer,
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

// Handle new offer created
export function handleNewOffer(event: NewOfferEvent): void {
  let offerId = event.params.offerId.toString();
  let offer = new Offer(offerId);

  offer.offerId = event.params.offerId;
  offer.offeror = event.params.offeror;
  offer.assetContract = event.params.assetContract;
  offer.tokenId = event.params.offer.tokenId;
  offer.quantity = event.params.offer.quantity;
  offer.currency = event.params.offer.currency;
  offer.totalPrice = event.params.offer.totalPrice;
  offer.expirationTimestamp = event.params.offer.expirationTimestamp;
  offer.tokenType = event.params.offer.tokenType;
  offer.status = "CREATED";
  offer.seller = null;
  offer.quantitySold = null;
  offer.totalPricePaid = null;
  offer.createdAt = event.block.timestamp;
  offer.createdAtBlock = event.block.number;
  offer.acceptedAt = null;
  offer.cancelledAt = null;
  offer.transactionHash = event.transaction.hash;

  offer.save();

  // Update global stats
  let globalStats = getOrCreateMarketplaceStats();
  globalStats.totalOffers = globalStats.totalOffers.plus(BigInt.fromI32(1));
  globalStats.lastUpdated = event.block.timestamp;
  globalStats.save();

  // Update collection stats
  let collectionStats = getOrCreateCollectionStats(event.params.assetContract);
  collectionStats.totalOffers = collectionStats.totalOffers.plus(
    BigInt.fromI32(1)
  );
  collectionStats.lastUpdated = event.block.timestamp;
  collectionStats.save();
}

// Handle offer accepted
export function handleAcceptedOffer(event: AcceptedOfferEvent): void {
  let offerId = event.params.offerId.toString();
  let offer = Offer.load(offerId);

  if (offer) {
    offer.status = "COMPLETED";
    offer.seller = event.params.seller;
    offer.quantitySold = event.params.quantitySold;
    offer.totalPricePaid = event.params.totalPricePaid;
    offer.acceptedAt = event.block.timestamp;
    offer.save();

    // Update global stats
    let globalStats = getOrCreateMarketplaceStats();
    globalStats.totalSales = globalStats.totalSales.plus(BigInt.fromI32(1));
    globalStats.totalVolumeETH = globalStats.totalVolumeETH.plus(
      event.params.totalPricePaid
    );
    globalStats.lastUpdated = event.block.timestamp;
    globalStats.save();

    // Update collection stats
    let collectionStats = getOrCreateCollectionStats(event.params.assetContract);
    collectionStats.totalSales = collectionStats.totalSales.plus(
      BigInt.fromI32(1)
    );
    collectionStats.totalVolumeETH = collectionStats.totalVolumeETH.plus(
      event.params.totalPricePaid
    );
    collectionStats.lastSalePrice = event.params.totalPricePaid;
    collectionStats.lastUpdated = event.block.timestamp;
    collectionStats.save();
  }
}

// Handle offer cancelled
export function handleCancelledOffer(event: CancelledOfferEvent): void {
  let offerId = event.params.offerId.toString();
  let offer = Offer.load(offerId);

  if (offer) {
    offer.status = "CANCELLED";
    offer.cancelledAt = event.block.timestamp;
    offer.save();
  }
}
