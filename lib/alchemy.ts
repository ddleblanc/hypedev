import { Alchemy, Network, WebhookType, AlchemySubscription } from "alchemy-sdk";
import { createHmac } from "crypto";

// Alchemy client singleton
let alchemyClient: Alchemy | null = null;

export function getAlchemy(): Alchemy {
  if (!alchemyClient) {
    const apiKey = process.env.ALCHEMY_API_KEY;
    if (!apiKey) {
      throw new Error("ALCHEMY_API_KEY is not configured");
    }

    alchemyClient = new Alchemy({
      apiKey,
      network: Network.ETH_SEPOLIA,
    });
  }
  return alchemyClient;
}

// Webhook signature verification
export function verifyAlchemyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const signingKey = process.env.ALCHEMY_WEBHOOK_SIGNING_KEY;
  if (!signingKey) {
    console.warn("ALCHEMY_WEBHOOK_SIGNING_KEY not set, skipping verification");
    return true; // Allow in development
  }

  const hmac = createHmac("sha256", signingKey);
  hmac.update(payload);
  const expectedSignature = hmac.digest("hex");

  return signature === expectedSignature;
}

// Marketplace contract address
export const MARKETPLACE_CONTRACT = (
  process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS ||
  "0x38ab4489E479c9266471bbe8C3794CB30EA11F20"
).toLowerCase();

// Event signatures for Thirdweb Marketplace V3
export const MARKETPLACE_EVENTS = {
  // Direct Listings
  NewListing: "0x5d0b6c7e1b2cd7e9c8e0f5a7b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5",
  UpdatedListing: "0x1234...", // placeholder
  CancelledListing: "0x2345...", // placeholder
  NewSale: "0x3456...", // placeholder

  // Auctions
  NewAuction: "0x4567...", // placeholder
  NewBid: "0x5678...", // placeholder
  AuctionClosed: "0x6789...", // placeholder

  // Offers
  NewOffer: "0x7890...", // placeholder
  AcceptedOffer: "0x8901...", // placeholder
  CancelledOffer: "0x9012...", // placeholder
} as const;

// Common event types we care about
export type MarketplaceEventType =
  | "listing_created"
  | "listing_cancelled"
  | "listing_sold"
  | "auction_created"
  | "auction_bid"
  | "auction_closed"
  | "offer_made"
  | "offer_accepted"
  | "offer_cancelled"
  | "transfer";

// Parsed activity event
export interface AlchemyActivityEvent {
  id: string;
  type: MarketplaceEventType;
  contractAddress: string;
  tokenId: string;
  from: string;
  to: string;
  price?: string;
  currency?: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: Date;
  raw?: unknown;
}

// Parse NFT Activity webhook payload
export function parseNFTActivityPayload(
  payload: unknown
): AlchemyActivityEvent[] {
  const events: AlchemyActivityEvent[] = [];

  if (!payload || typeof payload !== "object") {
    return events;
  }

  const data = payload as {
    webhookId?: string;
    id?: string;
    createdAt?: string;
    type?: string;
    event?: {
      activity?: Array<{
        fromAddress: string;
        toAddress: string;
        contractAddress: string;
        blockNum: string;
        hash: string;
        erc721TokenId?: string;
        erc1155Metadata?: Array<{ tokenId: string; value: string }>;
        category: string;
        value?: number;
        asset?: string;
        rawContract?: {
          address: string;
          decimal?: string;
        };
      }>;
    };
  };

  const activities = data?.event?.activity || [];

  for (const activity of activities) {
    const tokenId =
      activity.erc721TokenId ||
      activity.erc1155Metadata?.[0]?.tokenId ||
      "0";

    // Determine event type based on category and addresses
    let eventType: MarketplaceEventType = "transfer";

    // Check if this is a marketplace-related transfer
    const isFromMarketplace =
      activity.fromAddress.toLowerCase() === MARKETPLACE_CONTRACT;
    const isToMarketplace =
      activity.toAddress.toLowerCase() === MARKETPLACE_CONTRACT;

    if (isFromMarketplace) {
      eventType = "listing_sold"; // NFT leaving marketplace = sale
    } else if (isToMarketplace) {
      eventType = "listing_created"; // NFT entering marketplace = listing
    }

    events.push({
      id: `${activity.hash}-${tokenId}`,
      type: eventType,
      contractAddress: activity.contractAddress,
      tokenId,
      from: activity.fromAddress,
      to: activity.toAddress,
      price: activity.value?.toString(),
      transactionHash: activity.hash,
      blockNumber: parseInt(activity.blockNum, 16),
      timestamp: new Date(),
      raw: activity,
    });
  }

  return events;
}

// Parse Address Activity webhook payload (for wallet tracking)
export function parseAddressActivityPayload(
  payload: unknown
): AlchemyActivityEvent[] {
  // Similar structure to NFT activity
  return parseNFTActivityPayload(payload);
}

// Get WebSocket URL
export function getAlchemyWebSocketUrl(): string {
  const apiKey = process.env.ALCHEMY_API_KEY;
  if (!apiKey) {
    throw new Error("ALCHEMY_API_KEY is not configured");
  }
  return `wss://eth-sepolia.g.alchemy.com/v2/${apiKey}`;
}

// Get RPC URL
export function getAlchemyRpcUrl(): string {
  const apiKey = process.env.ALCHEMY_API_KEY;
  if (!apiKey) {
    throw new Error("ALCHEMY_API_KEY is not configured");
  }
  return `https://eth-sepolia.g.alchemy.com/v2/${apiKey}`;
}
