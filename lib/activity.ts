import { prisma } from './prisma';
import {
  broadcastNotification,
  type NotificationEvent,
} from './notification-broadcaster';

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
 * Notification priorities
 */
type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

/**
 * Notification action types
 */
type NotificationActionType =
  | 'ACCEPT_OFFER'
  | 'DECLINE_OFFER'
  | 'ACCEPT_TRADE'
  | 'DECLINE_TRADE'
  | 'FOLLOW_BACK'
  | 'PLACE_BID'
  | 'VIEW_ITEM';

interface CreateNotificationParams {
  userId: string;
  activityId?: string;
  type: ActivityType;
  title: string;
  message?: string;
  actionType?: NotificationActionType;
  priority?: NotificationPriority;
  isTimeSensitive?: boolean;
  expiresAt?: Date;
  nftId?: string;
  collectionId?: string;
  tradeId?: string;
  offerId?: string;
  relatedUserId?: string;
  relatedAddress?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Create a notification and broadcast it in real-time
 */
async function createAndBroadcastNotification(
  params: CreateNotificationParams
): Promise<void> {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        activityId: params.activityId,
        type: params.type,
        title: params.title,
        message: params.message,
        actionType: params.actionType,
        priority: params.priority ?? 'NORMAL',
        isTimeSensitive: params.isTimeSensitive ?? false,
        expiresAt: params.expiresAt,
        nftId: params.nftId,
        collectionId: params.collectionId,
        tradeId: params.tradeId,
        offerId: params.offerId,
        relatedUserId: params.relatedUserId,
        relatedAddress: params.relatedAddress,
        metadata: (params.metadata ?? null) as Parameters<typeof prisma.notification.create>[0]['data']['metadata'],
      },
    });

    // Format for broadcasting
    const event: NotificationEvent = {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      actionType: notification.actionType,
      actionStatus: notification.actionStatus,
      isTimeSensitive: notification.isTimeSensitive,
      expiresAt: notification.expiresAt?.toISOString() ?? null,
      nftId: notification.nftId,
      collectionId: notification.collectionId,
      tradeId: notification.tradeId,
      offerId: notification.offerId,
      relatedUserId: notification.relatedUserId,
      relatedAddress: notification.relatedAddress,
      metadata: notification.metadata as Record<string, unknown> | null,
      createdAt: notification.createdAt.toISOString(),
    };

    // Broadcast to user's active connections
    broadcastNotification(params.userId, event);
  } catch (error) {
    // Log but don't throw - notification failure shouldn't break activity logging
    console.error('[Activity] Failed to create notification:', error);
  }
}

/**
 * Get user display name for notification messages
 */
async function getUserDisplayName(userId: string): Promise<string> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, walletAddress: true },
    });
    return user?.username ?? (user?.walletAddress ? user.walletAddress.slice(0, 8) + '...' : 'Someone');
  } catch {
    return 'Someone';
  }
}

/**
 * Get NFT display name for notification messages
 */
async function getNftDisplayName(nftId: string): Promise<string> {
  try {
    const nft = await prisma.nft.findUnique({
      where: { id: nftId },
      select: { name: true, tokenId: true },
    });
    return nft?.name ?? (nft?.tokenId ? `Token #${nft.tokenId}` : 'an NFT');
  } catch {
    return 'an NFT';
  }
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
  const [, sellerActivity] = await Promise.all([
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

  // Get display names for notification message
  const [buyerName, nftName] = await Promise.all([
    getUserDisplayName(buyerId),
    getNftDisplayName(nftId),
  ]);

  // Notify seller of sale
  await createAndBroadcastNotification({
    userId: sellerId,
    activityId: sellerActivity.id,
    type: 'listing_sold',
    title: 'Item Sold!',
    message: `${buyerName} purchased ${nftName} for ${price} ETH`,
    priority: 'HIGH',
    nftId,
    collectionId,
    relatedUserId: buyerId,
    metadata: { price, currency: 'ETH', transactionHash: txHash },
  });
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
  const [initiatorActivity, counterpartyActivity] = await Promise.all([
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

  // Get display names for notification messages
  const [initiatorName, counterpartyName] = await Promise.all([
    getUserDisplayName(initiatorId),
    getUserDisplayName(counterpartyId),
  ]);

  // Notify both parties of trade completion
  await Promise.all([
    createAndBroadcastNotification({
      userId: initiatorId,
      activityId: initiatorActivity.id,
      type: 'trade_completed',
      title: 'Trade Completed',
      message: `Your trade with ${counterpartyName} has been completed successfully`,
      priority: 'HIGH',
      tradeId,
      relatedUserId: counterpartyId,
      metadata: metadata as Record<string, unknown>,
    }),
    createAndBroadcastNotification({
      userId: counterpartyId,
      activityId: counterpartyActivity.id,
      type: 'trade_completed',
      title: 'Trade Completed',
      message: `Your trade with ${initiatorName} has been completed successfully`,
      priority: 'HIGH',
      tradeId,
      relatedUserId: initiatorId,
      metadata: metadata as Record<string, unknown>,
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
  const [, counterpartyActivity] = await Promise.all([
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

  // Get display name for notification message
  const initiatorName = await getUserDisplayName(initiatorId);

  // Notify counterparty of new trade request (actionable)
  await createAndBroadcastNotification({
    userId: counterpartyId,
    activityId: counterpartyActivity.id,
    type: 'trade_received',
    title: 'New Trade Request',
    message: `${initiatorName} wants to trade with you`,
    actionType: 'ACCEPT_TRADE',
    priority: 'HIGH',
    isTimeSensitive: true,
    tradeId,
    relatedUserId: initiatorId,
  });
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
  const [, followingActivity] = await Promise.all([
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

  // Get display name for notification message
  const followerName = await getUserDisplayName(followerId);

  // Notify followed user (actionable - can follow back)
  await createAndBroadcastNotification({
    userId: followingId,
    activityId: followingActivity.id,
    type: 'user_followed_by',
    title: 'New Follower',
    message: `${followerName} started following you`,
    actionType: 'FOLLOW_BACK',
    priority: 'NORMAL',
    relatedUserId: followerId,
  });
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
  const activity = await createActivity({
    userId,
    type: 'lootbox_opened',
    nftId,
    collectionId,
    metadata,
  });

  // Get NFT name for notification message if an NFT was won
  let message = 'You opened a lootbox!';
  if (nftId) {
    const nftName = await getNftDisplayName(nftId);
    message = `You won ${nftName} from a lootbox!`;
  }

  // Notify user of their lootbox result
  await createAndBroadcastNotification({
    userId,
    activityId: activity.id,
    type: 'lootbox_opened',
    title: 'Lootbox Opened!',
    message,
    priority: nftId ? 'HIGH' : 'NORMAL',
    nftId,
    collectionId,
    metadata: metadata as Record<string, unknown>,
  });

  return activity;
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

  const results = await Promise.all(activities);

  // Notify receiver if they're in our system
  if (receiverId) {
    const receiverActivity = results[1];
    const [senderName, nftName] = await Promise.all([
      getUserDisplayName(senderId),
      getNftDisplayName(nftId),
    ]);

    await createAndBroadcastNotification({
      userId: receiverId,
      activityId: receiverActivity.id,
      type: 'nft_received',
      title: 'NFT Received',
      message: `${senderName} sent you ${nftName}`,
      priority: 'HIGH',
      nftId,
      collectionId,
      relatedUserId: senderId,
      metadata: { transactionHash: txHash },
    });
  }
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
  txHash?: string,
  previousBidderId?: string
) {
  const activity = await createActivity({
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

  // Get display names for notifications
  const [bidderName, nftName] = await Promise.all([
    getUserDisplayName(userId),
    getNftDisplayName(nftId),
  ]);

  // Notify seller of new bid
  await createAndBroadcastNotification({
    userId: sellerId,
    activityId: activity.id,
    type: 'bid_placed',
    title: 'New Bid',
    message: `${bidderName} placed a bid of ${bidAmount} ETH on ${nftName}`,
    priority: 'NORMAL',
    nftId,
    collectionId,
    relatedUserId: userId,
    metadata: { bidAmount, currency: 'ETH', listingId },
  });

  // Notify previous high bidder they've been outbid (if applicable)
  if (previousBidderId && previousBidderId !== userId) {
    await createAndBroadcastNotification({
      userId: previousBidderId,
      type: 'bid_placed',
      title: 'Outbid!',
      message: `You've been outbid on ${nftName}. New bid: ${bidAmount} ETH`,
      actionType: 'PLACE_BID',
      priority: 'URGENT',
      isTimeSensitive: true,
      nftId,
      collectionId,
      relatedUserId: userId,
      metadata: { bidAmount, currency: 'ETH', listingId },
    });
  }

  return activity;
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
  const [winnerActivity, sellerActivity] = await Promise.all([
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

  // Get display names for notifications
  const [winnerName, nftName] = await Promise.all([
    getUserDisplayName(winnerId),
    getNftDisplayName(nftId),
  ]);

  // Notify winner
  await createAndBroadcastNotification({
    userId: winnerId,
    activityId: winnerActivity.id,
    type: 'auction_won',
    title: 'Auction Won!',
    message: `Congratulations! You won the auction for ${nftName} with a bid of ${finalPrice} ETH`,
    priority: 'HIGH',
    nftId,
    collectionId,
    relatedUserId: sellerId,
    metadata: { finalPrice, currency: 'ETH', transactionHash: txHash },
  });

  // Notify seller of sale
  await createAndBroadcastNotification({
    userId: sellerId,
    activityId: sellerActivity.id,
    type: 'listing_sold',
    title: 'Auction Sold!',
    message: `${winnerName} won your auction for ${nftName} at ${finalPrice} ETH`,
    priority: 'HIGH',
    nftId,
    collectionId,
    relatedUserId: winnerId,
    metadata: { finalPrice, currency: 'ETH', transactionHash: txHash },
  });
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

  const results = await Promise.all(activities);

  // Create notification for NFT owner (if in system)
  if (ownerId) {
    const ownerActivity = results[1];
    const [offerorName, nftName] = await Promise.all([
      getUserDisplayName(offerorId),
      getNftDisplayName(nftId),
    ]);

    // Notify owner of new offer (actionable)
    await createAndBroadcastNotification({
      userId: ownerId,
      activityId: ownerActivity.id,
      type: 'offer_received',
      title: 'New Offer Received',
      message: `${offerorName} offered ${offerAmount} ETH for ${nftName}`,
      actionType: 'ACCEPT_OFFER',
      priority: 'HIGH',
      isTimeSensitive: true,
      nftId,
      collectionId,
      offerId,
      relatedUserId: offerorId,
      metadata: { offerAmount, currency: 'ETH', transactionHash: txHash },
    });
  }
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
  const [, offerorActivity] = await Promise.all([
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

  // Get display names for notification message
  const [ownerName, nftName] = await Promise.all([
    getUserDisplayName(ownerId),
    getNftDisplayName(nftId),
  ]);

  // Notify offeror that their offer was accepted
  await createAndBroadcastNotification({
    userId: offerorId,
    activityId: offerorActivity.id,
    type: 'offer_accepted',
    title: 'Offer Accepted!',
    message: `${ownerName} accepted your offer of ${acceptedAmount} ETH for ${nftName}`,
    priority: 'HIGH',
    nftId,
    collectionId,
    offerId,
    relatedUserId: ownerId,
    metadata: { acceptedAmount, currency: 'ETH', transactionHash: txHash },
  });
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
