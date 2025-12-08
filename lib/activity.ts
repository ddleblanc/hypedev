import { prisma } from './prisma';

export type ActivityType =
  // Marketplace
  | 'listing_created'
  | 'listing_canceled'
  | 'listing_sold'
  | 'purchase'
  | 'auction_created'
  | 'bid_placed'
  | 'auction_won'
  | 'offer_made'
  | 'offer_received'
  | 'offer_accepted'
  | 'offer_canceled'
  | 'offer_rejected'
  // P2P Trading
  | 'trade_initiated'
  | 'trade_received'
  | 'trade_counteroffer'
  | 'trade_completed'
  | 'trade_canceled'
  // Minting
  | 'nft_minted'
  | 'collection_deployed'
  // Social
  | 'user_followed'
  | 'user_followed_by'
  // Lootbox
  | 'lootbox_purchased'
  | 'lootbox_opened'
  // Transfers
  | 'nft_transferred'
  | 'nft_received';

export interface CreateActivityParams {
  userId: string;
  type: ActivityType;
  nftId?: string;
  collectionId?: string;
  tradeId?: string;
  listingId?: string;
  relatedUserId?: string;
  relatedAddress?: string;
  amount?: number;
  tokenAmount?: number;
  currency?: string;
  transactionHash?: string;
  metadata?: { [key: string]: string | number | boolean | null };
}

/**
 * Create a single activity record
 */
export async function createActivity(params: CreateActivityParams) {
  return prisma.activity.create({ data: params });
}

/**
 * Log a marketplace listing creation
 */
export async function logListing(
  userId: string,
  nftId: string,
  listingId: string,
  price: number,
  collectionId?: string,
  txHash?: string
) {
  return createActivity({
    userId,
    type: 'listing_created',
    nftId,
    listingId,
    collectionId,
    amount: price,
    currency: 'ETH',
    transactionHash: txHash,
  });
}

/**
 * Log a listing cancellation
 */
export async function logListingCanceled(
  userId: string,
  nftId: string,
  listingId: string,
  collectionId?: string
) {
  return createActivity({
    userId,
    type: 'listing_canceled',
    nftId,
    listingId,
    collectionId,
  });
}

/**
 * Log a purchase - creates activity for both buyer and seller
 */
export async function logPurchase(
  buyerId: string,
  sellerId: string,
  nftId: string,
  price: number,
  collectionId?: string,
  txHash?: string
) {
  await Promise.all([
    createActivity({
      userId: buyerId,
      type: 'purchase',
      nftId,
      collectionId,
      amount: price,
      currency: 'ETH',
      relatedUserId: sellerId,
      transactionHash: txHash,
    }),
    createActivity({
      userId: sellerId,
      type: 'listing_sold',
      nftId,
      collectionId,
      amount: price,
      currency: 'ETH',
      relatedUserId: buyerId,
      transactionHash: txHash,
    }),
  ]);
}

/**
 * Log a completed P2P trade - creates activity for both parties
 */
export async function logTradeCompleted(
  initiatorId: string,
  counterpartyId: string,
  tradeId: string,
  metadata?: { [key: string]: string | number | boolean | null }
) {
  await Promise.all([
    createActivity({
      userId: initiatorId,
      type: 'trade_completed',
      tradeId,
      relatedUserId: counterpartyId,
      metadata,
    }),
    createActivity({
      userId: counterpartyId,
      type: 'trade_completed',
      tradeId,
      relatedUserId: initiatorId,
      metadata,
    }),
  ]);
}

/**
 * Log a trade initiation
 */
export async function logTradeInitiated(
  initiatorId: string,
  counterpartyId: string,
  tradeId: string
) {
  await Promise.all([
    createActivity({
      userId: initiatorId,
      type: 'trade_initiated',
      tradeId,
      relatedUserId: counterpartyId,
    }),
    createActivity({
      userId: counterpartyId,
      type: 'trade_received',
      tradeId,
      relatedUserId: initiatorId,
    }),
  ]);
}

/**
 * Log a trade cancellation
 */
export async function logTradeCanceled(
  userId: string,
  counterpartyId: string,
  tradeId: string
) {
  await Promise.all([
    createActivity({
      userId,
      type: 'trade_canceled',
      tradeId,
      relatedUserId: counterpartyId,
    }),
    createActivity({
      userId: counterpartyId,
      type: 'trade_canceled',
      tradeId,
      relatedUserId: userId,
    }),
  ]);
}

/**
 * Log a follow action - creates activity for both follower and followee
 */
export async function logFollow(followerId: string, followingId: string) {
  await Promise.all([
    createActivity({
      userId: followerId,
      type: 'user_followed',
      relatedUserId: followingId,
    }),
    createActivity({
      userId: followingId,
      type: 'user_followed_by',
      relatedUserId: followerId,
    }),
  ]);
}

/**
 * Log an NFT mint
 */
export async function logNftMinted(
  userId: string,
  nftId: string,
  collectionId: string,
  txHash?: string,
  metadata?: { [key: string]: string | number | boolean | null }
) {
  return createActivity({
    userId,
    type: 'nft_minted',
    nftId,
    collectionId,
    transactionHash: txHash,
    metadata,
  });
}

/**
 * Log a collection deployment
 */
export async function logCollectionDeployed(
  userId: string,
  collectionId: string,
  txHash?: string
) {
  return createActivity({
    userId,
    type: 'collection_deployed',
    collectionId,
    transactionHash: txHash,
  });
}

/**
 * Log a lootbox purchase
 */
export async function logLootboxPurchased(
  userId: string,
  price: number,
  metadata?: { [key: string]: string | number | boolean | null }
) {
  return createActivity({
    userId,
    type: 'lootbox_purchased',
    amount: price,
    currency: 'ETH',
    metadata,
  });
}

/**
 * Log a lootbox opening
 */
export async function logLootboxOpened(
  userId: string,
  nftId?: string,
  collectionId?: string,
  metadata?: { [key: string]: string | number | boolean | null }
) {
  return createActivity({
    userId,
    type: 'lootbox_opened',
    nftId,
    collectionId,
    metadata,
  });
}

/**
 * Log an NFT transfer - creates activity for both sender and receiver
 */
export async function logNftTransfer(
  senderId: string,
  receiverId: string | null,
  receiverAddress: string,
  nftId: string,
  collectionId?: string,
  txHash?: string
) {
  const activities = [
    createActivity({
      userId: senderId,
      type: 'nft_transferred',
      nftId,
      collectionId,
      relatedUserId: receiverId ?? undefined,
      relatedAddress: receiverId ? undefined : receiverAddress,
      transactionHash: txHash,
    }),
  ];

  // Only create receive activity if receiver is in our system
  if (receiverId) {
    activities.push(
      createActivity({
        userId: receiverId,
        type: 'nft_received',
        nftId,
        collectionId,
        relatedUserId: senderId,
        transactionHash: txHash,
      })
    );
  }

  await Promise.all(activities);
}

/**
 * Log an auction creation
 */
export async function logAuctionCreated(
  userId: string,
  nftId: string,
  listingId: string,
  startingPrice: number,
  collectionId?: string,
  txHash?: string
) {
  return createActivity({
    userId,
    type: 'auction_created',
    nftId,
    listingId,
    collectionId,
    amount: startingPrice,
    currency: 'ETH',
    transactionHash: txHash,
  });
}

/**
 * Log a bid on an auction
 */
export async function logBidPlaced(
  userId: string,
  sellerId: string,
  nftId: string,
  listingId: string,
  bidAmount: number,
  collectionId?: string,
  txHash?: string
) {
  return createActivity({
    userId,
    type: 'bid_placed',
    nftId,
    listingId,
    collectionId,
    amount: bidAmount,
    currency: 'ETH',
    relatedUserId: sellerId,
    transactionHash: txHash,
  });
}

/**
 * Log winning an auction
 */
export async function logAuctionWon(
  winnerId: string,
  sellerId: string,
  nftId: string,
  listingId: string,
  finalPrice: number,
  collectionId?: string,
  txHash?: string
) {
  await Promise.all([
    createActivity({
      userId: winnerId,
      type: 'auction_won',
      nftId,
      listingId,
      collectionId,
      amount: finalPrice,
      currency: 'ETH',
      relatedUserId: sellerId,
      transactionHash: txHash,
    }),
    createActivity({
      userId: sellerId,
      type: 'listing_sold',
      nftId,
      listingId,
      collectionId,
      amount: finalPrice,
      currency: 'ETH',
      relatedUserId: winnerId,
      transactionHash: txHash,
    }),
  ]);
}

/**
 * Log an offer made - creates activity for both offeror and NFT owner
 */
export async function logOfferMade(
  offerorId: string,
  ownerId: string | null,
  nftId: string,
  offerId: string,
  offerAmount: number,
  collectionId?: string,
  txHash?: string
) {
  const activities = [
    createActivity({
      userId: offerorId,
      type: 'offer_made',
      nftId,
      listingId: offerId,
      collectionId,
      amount: offerAmount,
      currency: 'ETH',
      relatedUserId: ownerId ?? undefined,
      transactionHash: txHash,
    }),
  ];

  // Only create activity for owner if they're in our system
  if (ownerId) {
    activities.push(
      createActivity({
        userId: ownerId,
        type: 'offer_received',
        nftId,
        listingId: offerId,
        collectionId,
        amount: offerAmount,
        currency: 'ETH',
        relatedUserId: offerorId,
        transactionHash: txHash,
      })
    );
  }

  await Promise.all(activities);
}

/**
 * Log an offer accepted - creates activity for both parties
 */
export async function logOfferAccepted(
  ownerId: string,
  offerorId: string,
  nftId: string,
  offerId: string,
  acceptedAmount: number,
  collectionId?: string,
  txHash?: string
) {
  await Promise.all([
    createActivity({
      userId: ownerId,
      type: 'offer_accepted',
      nftId,
      listingId: offerId,
      collectionId,
      amount: acceptedAmount,
      currency: 'ETH',
      relatedUserId: offerorId,
      transactionHash: txHash,
    }),
    createActivity({
      userId: offerorId,
      type: 'purchase',
      nftId,
      listingId: offerId,
      collectionId,
      amount: acceptedAmount,
      currency: 'ETH',
      relatedUserId: ownerId,
      transactionHash: txHash,
    }),
  ]);
}

/**
 * Log an offer canceled
 */
export async function logOfferCanceled(
  offerorId: string,
  nftId: string,
  offerId: string,
  collectionId?: string
) {
  return createActivity({
    userId: offerorId,
    type: 'offer_canceled',
    nftId,
    listingId: offerId,
    collectionId,
  });
}
