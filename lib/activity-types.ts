/**
 * Shared Activity Types
 *
 * Centralized definitions for all activity types used across the marketplace.
 * Provides type safety and utility functions for activity categorization.
 */

/**
 * All possible activity types in the system
 */
export const ActivityTypes = {
  // Sales & Purchases
  PURCHASE: 'purchase',
  LISTING_SOLD: 'listing_sold',
  AUCTION_WON: 'auction_won',
  NFT_PURCHASED: 'nft_purchased',
  OFFER_ACCEPTED: 'offer_accepted',
  COLLECTION_OFFER_ACCEPTED: 'collection_offer_accepted',

  // Listings
  LISTING_CREATED: 'listing_created',
  LISTING_CANCELLED: 'listing_cancelled',
  LISTING_CANCELED: 'listing_canceled', // Alternative spelling
  AUCTION_CREATED: 'auction_created',
  AUCTION_BID: 'auction_bid',
  AUCTION_CLOSED: 'auction_closed',

  // Offers & Bids
  OFFER_MADE: 'offer_made',
  OFFER_CANCELLED: 'offer_cancelled',
  BID_PLACED: 'bid_placed',

  // Transfers & Mints
  TRANSFER: 'transfer',
  MINT: 'mint',
  NFT_MINTED: 'nft_minted',
  AIRDROP: 'airdrop',
} as const;

export type ActivityType = (typeof ActivityTypes)[keyof typeof ActivityTypes];

/**
 * Activity types that represent completed sales
 */
export const SALE_TYPES: ActivityType[] = [
  ActivityTypes.PURCHASE,
  ActivityTypes.LISTING_SOLD,
  ActivityTypes.AUCTION_WON,
  ActivityTypes.NFT_PURCHASED,
  ActivityTypes.OFFER_ACCEPTED,
  ActivityTypes.COLLECTION_OFFER_ACCEPTED,
];

/**
 * Activity types that represent listings
 */
export const LISTING_TYPES: ActivityType[] = [
  ActivityTypes.LISTING_CREATED,
  ActivityTypes.AUCTION_CREATED,
];

/**
 * Activity types that represent offers or bids
 */
export const OFFER_TYPES: ActivityType[] = [
  ActivityTypes.OFFER_MADE,
  ActivityTypes.BID_PLACED,
  ActivityTypes.AUCTION_BID,
];

/**
 * Activity types that represent ownership changes
 */
export const OWNERSHIP_CHANGE_TYPES: ActivityType[] = [
  ActivityTypes.MINT,
  ActivityTypes.NFT_MINTED,
  ActivityTypes.TRANSFER,
  ActivityTypes.PURCHASE,
  ActivityTypes.LISTING_SOLD,
  ActivityTypes.AUCTION_WON,
  ActivityTypes.AIRDROP,
];

/**
 * Activity types that include price/amount data
 */
export const PRICED_TYPES: ActivityType[] = [
  ...SALE_TYPES,
  ActivityTypes.LISTING_CREATED,
  ActivityTypes.OFFER_MADE,
  ActivityTypes.BID_PLACED,
];

/**
 * Simplified activity categories for UI display
 */
export type ActivityCategory =
  | 'sale'
  | 'listing'
  | 'offer'
  | 'transfer'
  | 'mint'
  | 'bid'
  | 'cancel';

/**
 * Map raw activity type to display category
 */
export function mapActivityToCategory(type: string): ActivityCategory {
  switch (type) {
    case ActivityTypes.PURCHASE:
    case ActivityTypes.AUCTION_WON:
    case ActivityTypes.LISTING_SOLD:
    case ActivityTypes.NFT_PURCHASED:
    case ActivityTypes.OFFER_ACCEPTED:
    case ActivityTypes.COLLECTION_OFFER_ACCEPTED:
      return 'sale';

    case ActivityTypes.LISTING_CREATED:
    case ActivityTypes.AUCTION_CREATED:
      return 'listing';

    case ActivityTypes.LISTING_CANCELLED:
    case ActivityTypes.LISTING_CANCELED:
    case ActivityTypes.OFFER_CANCELLED:
    case ActivityTypes.AUCTION_CLOSED:
      return 'cancel';

    case ActivityTypes.OFFER_MADE:
      return 'offer';

    case ActivityTypes.BID_PLACED:
    case ActivityTypes.AUCTION_BID:
      return 'bid';

    case ActivityTypes.TRANSFER:
      return 'transfer';

    case ActivityTypes.MINT:
    case ActivityTypes.NFT_MINTED:
    case ActivityTypes.AIRDROP:
      return 'mint';

    default:
      return 'transfer';
  }
}

/**
 * Ownership event types for provenance
 */
export type OwnershipType = 'mint' | 'transfer' | 'sale' | 'airdrop';

/**
 * Map activity type to ownership event type
 */
export function mapToOwnershipType(type: string): OwnershipType {
  switch (type) {
    case ActivityTypes.MINT:
    case ActivityTypes.NFT_MINTED:
      return 'mint';

    case ActivityTypes.PURCHASE:
    case ActivityTypes.AUCTION_WON:
    case ActivityTypes.LISTING_SOLD:
    case ActivityTypes.NFT_PURCHASED:
    case ActivityTypes.OFFER_ACCEPTED:
    case ActivityTypes.COLLECTION_OFFER_ACCEPTED:
      return 'sale';

    case ActivityTypes.AIRDROP:
      return 'airdrop';

    case ActivityTypes.TRANSFER:
    default:
      return 'transfer';
  }
}

/**
 * Check if an activity type represents a sale
 */
export function isSaleType(type: string): boolean {
  return SALE_TYPES.includes(type as ActivityType);
}

/**
 * Check if an activity type represents an ownership change
 */
export function isOwnershipChangeType(type: string): boolean {
  return OWNERSHIP_CHANGE_TYPES.includes(type as ActivityType);
}

/**
 * Check if an activity type has a price component
 */
export function hasPriceData(type: string): boolean {
  return PRICED_TYPES.includes(type as ActivityType);
}

/**
 * Get human-readable label for activity type
 */
export function getActivityLabel(type: string): string {
  switch (type) {
    case ActivityTypes.PURCHASE:
    case ActivityTypes.NFT_PURCHASED:
      return 'Purchased';
    case ActivityTypes.LISTING_SOLD:
      return 'Sold';
    case ActivityTypes.AUCTION_WON:
      return 'Won Auction';
    case ActivityTypes.OFFER_ACCEPTED:
    case ActivityTypes.COLLECTION_OFFER_ACCEPTED:
      return 'Offer Accepted';
    case ActivityTypes.LISTING_CREATED:
      return 'Listed';
    case ActivityTypes.AUCTION_CREATED:
      return 'Auction Started';
    case ActivityTypes.LISTING_CANCELLED:
    case ActivityTypes.LISTING_CANCELED:
      return 'Listing Cancelled';
    case ActivityTypes.OFFER_MADE:
      return 'Offer Made';
    case ActivityTypes.OFFER_CANCELLED:
      return 'Offer Cancelled';
    case ActivityTypes.BID_PLACED:
    case ActivityTypes.AUCTION_BID:
      return 'Bid Placed';
    case ActivityTypes.AUCTION_CLOSED:
      return 'Auction Closed';
    case ActivityTypes.TRANSFER:
      return 'Transferred';
    case ActivityTypes.MINT:
    case ActivityTypes.NFT_MINTED:
      return 'Minted';
    case ActivityTypes.AIRDROP:
      return 'Airdropped';
    default:
      return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }
}
