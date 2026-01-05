import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  verifyAlchemyWebhookSignature,
  parseNFTActivityPayload,
  MARKETPLACE_CONTRACT,
  type AlchemyActivityEvent,
} from "@/lib/alchemy";
import { prisma } from "@/lib/prisma";
import { broadcastToCollection } from "@/lib/activity-broadcaster";
import { chatBroadcaster } from "@/lib/chat-broadcaster";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Alchemy webhook payload schema
const AlchemyWebhookSchema = z.object({
  webhookId: z.string(),
  id: z.string(),
  createdAt: z.string(),
  type: z.enum([
    "NFT_ACTIVITY",
    "ADDRESS_ACTIVITY",
    "MINED_TRANSACTION",
    "DROPPED_TRANSACTION",
    "NFT_METADATA_UPDATE",
    "GRAPHQL",
  ]),
  event: z.unknown(),
});

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();

    // Verify signature (from X-Alchemy-Signature header)
    const signature = request.headers.get("x-alchemy-signature") || "";
    if (!verifyAlchemyWebhookSignature(rawBody, signature)) {
      console.error("Invalid Alchemy webhook signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    // Parse payload
    const payload = JSON.parse(rawBody);
    const parseResult = AlchemyWebhookSchema.safeParse(payload);

    if (!parseResult.success) {
      console.error("Invalid Alchemy webhook payload:", parseResult.error);
      return NextResponse.json(
        { error: "Invalid payload", details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const { type, event, id } = parseResult.data;

    console.log(`[Alchemy Webhook] Received ${type} event: ${id}`);

    // Process based on webhook type
    switch (type) {
      case "NFT_ACTIVITY":
        await handleNFTActivity(event);
        break;

      case "ADDRESS_ACTIVITY":
        await handleAddressActivity(event);
        break;

      case "MINED_TRANSACTION":
        await handleMinedTransaction(event);
        break;

      case "GRAPHQL":
        await handleGraphQLEvent(event);
        break;

      default:
        console.log(`[Alchemy Webhook] Unhandled event type: ${type}`);
    }

    // Always return 200 quickly to acknowledge receipt
    return NextResponse.json({ received: true, id });
  } catch (error) {
    console.error("[Alchemy Webhook] Error processing webhook:", error);
    // Return 200 anyway to prevent retries for parsing errors
    // Alchemy will retry on non-2xx responses
    return NextResponse.json(
      { error: "Processing error", received: true },
      { status: 200 }
    );
  }
}

async function handleNFTActivity(event: unknown) {
  const activities = parseNFTActivityPayload({ event });

  console.log(`[Alchemy Webhook] Processing ${activities.length} NFT activities`);

  for (const activity of activities) {
    try {
      await processActivity(activity);
    } catch (error) {
      console.error(
        `[Alchemy Webhook] Error processing activity ${activity.id}:`,
        error
      );
    }
  }
}

async function handleAddressActivity(event: unknown) {
  // Handle wallet-specific activity if needed
  const activities = parseNFTActivityPayload({ event });

  for (const activity of activities) {
    // Filter to only marketplace-related activity
    if (
      activity.from.toLowerCase() === MARKETPLACE_CONTRACT ||
      activity.to.toLowerCase() === MARKETPLACE_CONTRACT
    ) {
      await processActivity(activity);
    }
  }
}

async function handleMinedTransaction(event: unknown) {
  // Handle raw transaction confirmations if needed
  // This is useful for tracking transactions we initiated
  console.log("[Alchemy Webhook] Mined transaction:", event);
}

// GraphQL webhook payload structure
interface GraphQLBlock {
  hash: string;
  number: string;
  timestamp: string;
  logs: Array<{
    data: string;
    topics: string[];
    index: string;
    account: { address: string };
    transaction: {
      hash: string;
      nonce: string;
      index: string;
      from: { address: string };
      to: { address: string } | null;
      value: string;
      status: string;
    };
  }>;
}

// Thirdweb Marketplace V3 event signatures (first 4 bytes of keccak256)
const EVENT_SIGNATURES = {
  // NewListing(uint256 listingId, address listingCreator, address assetContract, ...)
  NewListing: "0x5b6e3a8b",
  // UpdatedListing(uint256 listingId, address listingCreator, ...)
  UpdatedListing: "0xa0208f48",
  // CancelledListing(uint256 listingId, address listingCreator)
  CancelledListing: "0x27cf49e9",
  // NewSale(uint256 listingId, address listingCreator, address buyer, ...)
  NewSale: "0xd7a8a84e",
  // NewAuction(uint256 auctionId, address auctionCreator, ...)
  NewAuction: "0xb4a87134",
  // NewBid(uint256 auctionId, address bidder, ...)
  NewBid: "0x0b27fb9a",
  // AuctionClosed(uint256 auctionId, address closer, ...)
  AuctionClosed: "0x93d3173e",
} as const;

async function handleGraphQLEvent(event: unknown) {
  const data = event as { block?: GraphQLBlock };
  const block = data?.block;

  if (!block || !block.logs || block.logs.length === 0) {
    console.log("[Alchemy Webhook] GraphQL event with no logs");
    return;
  }

  console.log(
    `[Alchemy Webhook] Processing GraphQL block ${block.number} with ${block.logs.length} logs`
  );

  for (const log of block.logs) {
    try {
      await processGraphQLLog(log, block);
    } catch (error) {
      console.error(
        `[Alchemy Webhook] Error processing log ${log.index}:`,
        error
      );
    }
  }
}

async function processGraphQLLog(
  log: GraphQLBlock["logs"][0],
  block: GraphQLBlock
) {
  const topic0 = log.topics[0]?.slice(0, 10); // First 4 bytes
  const txHash = log.transaction.hash;
  const fromAddress = log.transaction.from.address;
  const contractAddress = log.account.address;

  // Determine event type from topic
  let eventType: string;
  switch (topic0) {
    case EVENT_SIGNATURES.NewListing:
      eventType = "listing_created";
      break;
    case EVENT_SIGNATURES.CancelledListing:
      eventType = "listing_cancelled";
      break;
    case EVENT_SIGNATURES.NewSale:
      eventType = "listing_sold";
      break;
    case EVENT_SIGNATURES.NewAuction:
      eventType = "auction_created";
      break;
    case EVENT_SIGNATURES.NewBid:
      eventType = "auction_bid";
      break;
    case EVENT_SIGNATURES.AuctionClosed:
      eventType = "auction_closed";
      break;
    default:
      console.log(`[Alchemy Webhook] Unknown event topic: ${topic0}`);
      return;
  }

  console.log(
    `[Alchemy Webhook] Detected ${eventType} event in tx ${txHash}`
  );

  // Broadcast to global feed for now (we'd need to decode log data for specific collection)
  const broadcastEvent = {
    id: `${txHash}-${log.index}`,
    type: eventType,
    item: `Marketplace Event`,
    image: null,
    price: "0",
    from: fromAddress,
    to: log.transaction.to?.address || "",
    timestamp: new Date(parseInt(block.timestamp) * 1000).toISOString(),
    txHash,
  };

  broadcastToCollection("global", broadcastEvent);

  console.log(`[Alchemy Webhook] Broadcast ${eventType} to global feed`);
}

async function processActivity(activity: AlchemyActivityEvent) {
  console.log(
    `[Alchemy Webhook] Processing: ${activity.type} for token ${activity.tokenId}`
  );

  // Find the collection by contract address
  const collection = await prisma.collection.findFirst({
    where: {
      address: {
        equals: activity.contractAddress,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  // Find the NFT if it exists
  const nft = await prisma.nft.findFirst({
    where: {
      tokenId: activity.tokenId,
      collection: {
        address: {
          equals: activity.contractAddress,
          mode: "insensitive",
        },
      },
    },
    select: {
      id: true,
      name: true,
      image: true,
    },
  });

  // Find or create users
  const [fromUser, toUser] = await Promise.all([
    findOrCreateUser(activity.from),
    findOrCreateUser(activity.to),
  ]);

  // Determine which user to associate with this activity
  // For sales: the buyer (toUser) is the primary actor
  // For listings: the seller (fromUser) is the primary actor
  const primaryUser = activity.type === "listing_sold" ? toUser : fromUser;
  const secondaryUser = activity.type === "listing_sold" ? fromUser : toUser;

  // Skip if we can't determine a user (both null)
  if (!primaryUser && !secondaryUser) {
    console.warn(
      `[Alchemy Webhook] Skipping activity - no valid users: ${activity.id}`
    );
    return;
  }

  // Create activity record in database
  const dbActivity = await prisma.activity.create({
    data: {
      type: activity.type,
      userId: (primaryUser || secondaryUser)!.id,
      collectionId: collection?.id,
      nftId: nft?.id,
      relatedUserId: secondaryUser?.id,
      relatedAddress: secondaryUser ? undefined : activity.to,
      amount: activity.price ? parseFloat(activity.price) : null,
      transactionHash: activity.transactionHash,
      metadata: {
        from: activity.from,
        to: activity.to,
        tokenId: activity.tokenId,
        contractAddress: activity.contractAddress,
        blockNumber: activity.blockNumber,
        alchemyEventId: activity.id,
      },
    },
  });

  // Broadcast to SSE connections
  if (collection?.id) {
    const broadcastEvent = {
      id: dbActivity.id,
      type: activity.type,
      item: nft?.name || `Token #${activity.tokenId}`,
      image: nft?.image || null,
      price: activity.price || "0",
      from: activity.from,
      to: activity.to,
      timestamp: new Date().toISOString(),
      txHash: activity.transactionHash,
    };

    broadcastToCollection(collection.id, broadcastEvent);

    // Also broadcast to global feed
    broadcastToCollection("global", broadcastEvent);

    // Broadcast to chat world channel
    const itemName = nft?.name || `Token #${activity.tokenId}`;
    const collectionName = collection?.name || 'Unknown Collection';
    const price = activity.price || '0';
    const fromName = fromUser ? `0x${activity.from.slice(2, 6)}...${activity.from.slice(-4)}` : 'Unknown';
    const toName = toUser ? `0x${activity.to.slice(2, 6)}...${activity.to.slice(-4)}` : 'Unknown';

    if (activity.type === 'listing_sold') {
      chatBroadcaster.broadcastSale(itemName, collectionName, price, toName, fromName);
    } else if (activity.type === 'listing_created') {
      chatBroadcaster.broadcastListing(itemName, collectionName, price, fromName);
    }
  }

  console.log(
    `[Alchemy Webhook] Activity saved: ${dbActivity.id} (${activity.type})`
  );
}

async function findOrCreateUser(address: string) {
  if (
    !address ||
    address === "0x0000000000000000000000000000000000000000"
  ) {
    return null;
  }

  const normalizedAddress = address.toLowerCase();

  let user = await prisma.user.findUnique({
    where: { walletAddress: normalizedAddress },
    select: { id: true },
  });

  if (!user) {
    // Create minimal user record
    user = await prisma.user.create({
      data: {
        walletAddress: normalizedAddress,
      },
      select: { id: true },
    });
  }

  return user;
}

// Health check for webhook verification
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Alchemy webhook endpoint ready",
    timestamp: new Date().toISOString(),
  });
}
