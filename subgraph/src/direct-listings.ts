import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  NewListing as NewListingEvent,
  NewSale as NewSaleEvent,
  UpdatedListing as UpdatedListingEvent,
  CancelledListing as CancelledListingEvent,
} from "../generated/DirectListings/DirectListingsLogic";
import {
  Listing,
  Sale,
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

// Handle new listing created
export function handleNewListing(event: NewListingEvent): void {
  let listingId = event.params.listingId.toString();
  let listing = new Listing(listingId);

  listing.listingId = event.params.listingId;
  listing.listingCreator = event.params.listingCreator;
  listing.assetContract = event.params.assetContract;
  listing.tokenId = event.params.listing.tokenId;
  listing.quantity = event.params.listing.quantity;
  listing.currency = event.params.listing.currency;
  listing.pricePerToken = event.params.listing.pricePerToken;
  listing.startTimestamp = event.params.listing.startTimestamp;
  listing.endTimestamp = event.params.listing.endTimestamp;
  listing.tokenType = event.params.listing.tokenType;
  listing.status = "CREATED";
  listing.reserved = event.params.listing.reserved;
  listing.buyer = null;
  listing.quantitySold = null;
  listing.totalPricePaid = null;
  listing.createdAt = event.block.timestamp;
  listing.createdAtBlock = event.block.number;
  listing.updatedAt = event.block.timestamp;
  listing.soldAt = null;
  listing.cancelledAt = null;
  listing.transactionHash = event.transaction.hash;

  listing.save();

  // Update global stats
  let globalStats = getOrCreateMarketplaceStats();
  globalStats.totalListings = globalStats.totalListings.plus(BigInt.fromI32(1));
  globalStats.lastUpdated = event.block.timestamp;
  globalStats.save();

  // Update collection stats
  let collectionStats = getOrCreateCollectionStats(event.params.assetContract);
  collectionStats.totalListings = collectionStats.totalListings.plus(
    BigInt.fromI32(1)
  );

  // Update floor price if this is lower
  if (
    collectionStats.floorPrice === null ||
    event.params.listing.pricePerToken.lt(collectionStats.floorPrice as BigInt)
  ) {
    collectionStats.floorPrice = event.params.listing.pricePerToken;
  }

  collectionStats.lastUpdated = event.block.timestamp;
  collectionStats.save();
}

// Handle listing sold
export function handleNewSale(event: NewSaleEvent): void {
  let listingId = event.params.listingId.toString();
  let listing = Listing.load(listingId);

  if (listing) {
    listing.status = "COMPLETED";
    listing.buyer = event.params.buyer;
    listing.quantitySold = event.params.quantityBought;
    listing.totalPricePaid = event.params.totalPricePaid;
    listing.soldAt = event.block.timestamp;
    listing.updatedAt = event.block.timestamp;
    listing.save();
  }

  // Create sale record
  let sale = new Sale(event.transaction.hash.concatI32(event.logIndex.toI32()));
  sale.listing = listingId;
  sale.listingId = event.params.listingId;
  sale.listingCreator = event.params.listingCreator;
  sale.buyer = event.params.buyer;
  sale.assetContract = event.params.assetContract;
  sale.tokenId = event.params.tokenId;
  sale.quantity = event.params.quantityBought;
  sale.totalPrice = event.params.totalPricePaid;
  sale.blockNumber = event.block.number;
  sale.blockTimestamp = event.block.timestamp;
  sale.transactionHash = event.transaction.hash;
  sale.save();

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

// Handle listing updated
export function handleUpdatedListing(event: UpdatedListingEvent): void {
  let listingId = event.params.listingId.toString();
  let listing = Listing.load(listingId);

  if (listing) {
    listing.pricePerToken = event.params.listing.pricePerToken;
    listing.startTimestamp = event.params.listing.startTimestamp;
    listing.endTimestamp = event.params.listing.endTimestamp;
    listing.currency = event.params.listing.currency;
    listing.quantity = event.params.listing.quantity;
    listing.reserved = event.params.listing.reserved;
    listing.updatedAt = event.block.timestamp;
    listing.save();

    // Update collection floor price
    let collectionStats = getOrCreateCollectionStats(event.params.assetContract);
    if (
      collectionStats.floorPrice === null ||
      event.params.listing.pricePerToken.lt(collectionStats.floorPrice as BigInt)
    ) {
      collectionStats.floorPrice = event.params.listing.pricePerToken;
    }
    collectionStats.lastUpdated = event.block.timestamp;
    collectionStats.save();
  }
}

// Handle listing cancelled
export function handleCancelledListing(event: CancelledListingEvent): void {
  let listingId = event.params.listingId.toString();
  let listing = Listing.load(listingId);

  if (listing) {
    listing.status = "CANCELLED";
    listing.cancelledAt = event.block.timestamp;
    listing.updatedAt = event.block.timestamp;
    listing.save();
  }
}
