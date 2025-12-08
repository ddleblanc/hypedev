import { getContract, sendTransaction, waitForReceipt, readContract } from "thirdweb";
import {
  createListing,
  cancelListing,
  getAllValidListings,
  getListing,
  totalListings,
  buyFromListing,
} from "thirdweb/extensions/marketplace";
import {
  createAuction,
  cancelAuction,
  getAllValidAuctions,
  getAuction,
  totalAuctions,
  bidInAuction,
  buyoutAuction,
  getWinningBid,
  executeSale,
  collectAuctionPayout,
  collectAuctionTokens,
} from "thirdweb/extensions/marketplace";
import {
  makeOffer,
  acceptOffer,
  cancelOffer,
  getOffer,
  getAllValidOffers,
  totalOffers,
} from "thirdweb/extensions/marketplace";
import { isApprovedForAll, setApprovalForAll, ownerOf } from "thirdweb/extensions/erc721";
import { client } from "./thirdweb";
import { defineChain } from "thirdweb/chains";
import type { Account } from "thirdweb/wallets";

// Marketplace contract address from .env
export const MARKETPLACE_ADDRESS = process.env.MARKETPLACE_CONTRACT_ADDRESS_SEPOLIA || "0xB30af61443eeD475e07226169aFC0753eeE8BBc0";
export const MARKETPLACE_CHAIN_ID = 11155111; // Sepolia

// Native token address (ETH)
export const NATIVE_TOKEN = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

// Listing types
export type ListingType = "direct" | "auction";

// Interfaces
export interface DirectListingParams {
  assetContractAddress: string;
  tokenId: string;
  pricePerToken: string; // In ETH
  startTimestamp?: Date;
  endTimestamp?: Date;
  quantity?: number;
}

export interface AuctionParams {
  assetContractAddress: string;
  tokenId: string;
  minimumBidAmount: string; // Starting bid in ETH
  buyoutBidAmount?: string; // Optional instant buy price
  startTimestamp?: Date;
  endTimestamp?: Date;
  quantity?: number;
}

export interface ListingInfo {
  listingId: string;
  tokenId: string;
  quantity: bigint;
  pricePerToken: bigint;
  startTimestamp: bigint;
  endTimestamp: bigint;
  listingCreator: string;
  assetContract: string;
  currency: string;
  tokenType: number;
  status: number;
  reserved: boolean;
}

export interface AuctionInfo {
  auctionId: string;
  tokenId: string;
  quantity: bigint;
  minimumBidAmount: bigint;
  buyoutBidAmount: bigint;
  startTimestamp: bigint;
  endTimestamp: bigint;
  auctionCreator: string;
  assetContract: string;
  currency: string;
  tokenType: number;
  status: number;
}

/**
 * Get the marketplace contract instance
 */
export function getMarketplaceContract() {
  return getContract({
    client,
    chain: defineChain(MARKETPLACE_CHAIN_ID),
    address: MARKETPLACE_ADDRESS,
  });
}

/**
 * Get an NFT contract instance
 */
export function getNFTContract(contractAddress: string) {
  return getContract({
    client,
    chain: defineChain(MARKETPLACE_CHAIN_ID),
    address: contractAddress,
  });
}

/**
 * Check if the marketplace is approved to transfer NFTs from a collection
 */
export async function checkCollectionApproval(
  nftContractAddress: string,
  ownerAddress: string
): Promise<boolean> {
  try {
    const nftContract = getNFTContract(nftContractAddress);

    const approved = await isApprovedForAll({
      contract: nftContract,
      owner: ownerAddress,
      operator: MARKETPLACE_ADDRESS,
    });

    return approved;
  } catch (error) {
    console.error("Error checking collection approval:", error);
    return false;
  }
}

/**
 * Approve the marketplace to transfer all NFTs from a collection
 */
export async function approveMarketplace(
  nftContractAddress: string,
  account: Account
): Promise<{ transactionHash: string }> {
  try {
    const nftContract = getNFTContract(nftContractAddress);

    const transaction = setApprovalForAll({
      contract: nftContract,
      operator: MARKETPLACE_ADDRESS,
      approved: true,
    });

    const result = await sendTransaction({
      transaction,
      account,
    });

    // Wait for confirmation
    await waitForReceipt({
      client,
      chain: defineChain(MARKETPLACE_CHAIN_ID),
      transactionHash: result.transactionHash,
    });

    console.log("Marketplace approved for collection:", nftContractAddress);

    return { transactionHash: result.transactionHash };
  } catch (error) {
    console.error("Error approving marketplace:", error);
    throw error;
  }
}

/**
 * Parse tokenId to BigInt, handling compound formats like "1234567890-0"
 * Some NFT systems use compound IDs (e.g., "databaseId-onChainTokenId")
 * The actual on-chain tokenId is typically the LAST numeric segment
 */
function parseTokenId(tokenId: string): bigint {
  // If tokenId contains a hyphen, it's likely a compound ID format
  // Common formats: "databaseId-tokenId", "timestamp-index", etc.
  // The on-chain tokenId is typically the LAST segment
  if (tokenId.includes('-')) {
    const parts = tokenId.split('-');

    // Use the LAST numeric segment as the on-chain tokenId
    // Iterate from the end to find the last numeric part
    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i];
      if (/^\d+$/.test(part)) {
        console.log(`Parsed tokenId "${tokenId}" -> using on-chain tokenId: ${part}`);
        return BigInt(part);
      }
    }
    throw new Error(`Invalid tokenId format: ${tokenId}. Expected numeric value.`);
  }

  // Standard numeric tokenId
  if (!/^\d+$/.test(tokenId)) {
    throw new Error(`Invalid tokenId format: ${tokenId}. Expected numeric value.`);
  }
  return BigInt(tokenId);
}

/**
 * Create a direct (fixed price) listing
 */
export async function createDirectListing(
  params: DirectListingParams,
  account: Account
): Promise<{ transactionHash: string; listingId: string }> {
  try {
    const marketplace = getMarketplaceContract();

    // Get current listing count to estimate new listing ID
    const currentTotal = await totalListings({ contract: marketplace });
    const estimatedListingId = currentTotal.toString();

    // Default end time is 180 days from now
    const defaultEndDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);

    // Parse tokenId safely (handles compound formats)
    const tokenIdBigInt = parseTokenId(params.tokenId);

    // Debug logging to trace the issue
    console.log("=== CREATE LISTING DEBUG ===");
    console.log("Raw tokenId from params:", params.tokenId);
    console.log("Parsed tokenId (BigInt):", tokenIdBigInt.toString());
    console.log("Asset contract address:", params.assetContractAddress);
    console.log("Seller address:", account.address);
    console.log("Price per token:", params.pricePerToken);
    console.log("Marketplace contract:", MARKETPLACE_ADDRESS);

    // Verify ownership on-chain before attempting to list
    const nftContract = getNFTContract(params.assetContractAddress);
    try {
      const actualOwner = await ownerOf({
        contract: nftContract,
        tokenId: tokenIdBigInt,
      });
      console.log("On-chain owner of token:", actualOwner);
      console.log("Seller address:", account.address);
      console.log("Ownership match:", actualOwner.toLowerCase() === account.address.toLowerCase());

      if (actualOwner.toLowerCase() !== account.address.toLowerCase()) {
        throw new Error(
          `You don't own this NFT on-chain. ` +
          `Token ${tokenIdBigInt.toString()} at ${params.assetContractAddress} ` +
          `is owned by ${actualOwner}, not ${account.address}. ` +
          `The tokenId in the database may not match the on-chain tokenId.`
        );
      }
    } catch (ownerError: any) {
      if (ownerError.message.includes("You don't own")) {
        throw ownerError;
      }
      // If ownerOf fails, the token might not exist
      console.error("Failed to verify ownership:", ownerError);
      throw new Error(
        `Failed to verify NFT ownership. Token ${tokenIdBigInt.toString()} may not exist ` +
        `at contract ${params.assetContractAddress}. Error: ${ownerError.message}`
      );
    }

    // Also verify approval
    const isApproved = await isApprovedForAll({
      contract: nftContract,
      owner: account.address,
      operator: MARKETPLACE_ADDRESS,
    });
    console.log("Marketplace approved:", isApproved);

    if (!isApproved) {
      throw new Error(
        `Marketplace is not approved to transfer NFTs from ${params.assetContractAddress}. ` +
        `Please approve the collection first.`
      );
    }

    console.log("============================");

    const transaction = createListing({
      contract: marketplace,
      assetContractAddress: params.assetContractAddress,
      tokenId: tokenIdBigInt,
      pricePerToken: params.pricePerToken,
      quantity: BigInt(params.quantity || 1),
      startTimestamp: params.startTimestamp || new Date(),
      endTimestamp: params.endTimestamp || defaultEndDate,
    });

    const result = await sendTransaction({
      transaction,
      account,
    });

    console.log("Listing transaction submitted:", result.transactionHash);

    // Wait for confirmation
    const receipt = await waitForReceipt({
      client,
      chain: defineChain(MARKETPLACE_CHAIN_ID),
      transactionHash: result.transactionHash,
    });

    // Extract listing ID from events
    let listingId = estimatedListingId;
    if (receipt.logs && receipt.logs.length > 0) {
      // Try to extract from NewListing event
      for (const log of receipt.logs) {
        if (log.topics && log.topics.length > 1 && log.topics[1]) {
          // The listing ID is typically in the first indexed topic after the event signature
          try {
            const decodedId = BigInt(log.topics[1] as string).toString();
            if (decodedId) {
              listingId = decodedId;
              break;
            }
          } catch {
            // Continue trying other logs
          }
        }
      }
    }

    console.log("Direct listing created with ID:", listingId);

    return {
      transactionHash: result.transactionHash,
      listingId,
    };
  } catch (error) {
    console.error("Error creating direct listing:", error);
    throw error;
  }
}

/**
 * Create an English auction
 */
export async function createEnglishAuction(
  params: AuctionParams,
  account: Account
): Promise<{ transactionHash: string; auctionId: string }> {
  try {
    const marketplace = getMarketplaceContract();

    // Get current auction count to estimate new auction ID
    const currentTotal = await totalAuctions({ contract: marketplace });
    const estimatedAuctionId = currentTotal.toString();

    // Default end time is 7 days from now
    const defaultEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // If no buyout price is set, use a very high value to effectively disable buyout
    const buyoutPrice = params.buyoutBidAmount || "1000000";

    // Parse tokenId safely (handles compound formats)
    const tokenIdBigInt = parseTokenId(params.tokenId);

    // Debug logging to trace the issue
    console.log("=== CREATE AUCTION DEBUG ===");
    console.log("Raw tokenId from params:", params.tokenId);
    console.log("Parsed tokenId (BigInt):", tokenIdBigInt.toString());
    console.log("Asset contract address:", params.assetContractAddress);
    console.log("Seller address:", account.address);
    console.log("Minimum bid amount:", params.minimumBidAmount);
    console.log("Buyout bid amount:", buyoutPrice);
    console.log("Marketplace contract:", MARKETPLACE_ADDRESS);

    // Verify ownership on-chain before attempting to create auction
    const nftContract = getNFTContract(params.assetContractAddress);
    try {
      const actualOwner = await ownerOf({
        contract: nftContract,
        tokenId: tokenIdBigInt,
      });
      console.log("On-chain owner of token:", actualOwner);
      console.log("Seller address:", account.address);
      console.log("Ownership match:", actualOwner.toLowerCase() === account.address.toLowerCase());

      if (actualOwner.toLowerCase() !== account.address.toLowerCase()) {
        throw new Error(
          `You don't own this NFT on-chain. ` +
          `Token ${tokenIdBigInt.toString()} at ${params.assetContractAddress} ` +
          `is owned by ${actualOwner}, not ${account.address}. ` +
          `The tokenId in the database may not match the on-chain tokenId.`
        );
      }
    } catch (ownerError: any) {
      if (ownerError.message.includes("You don't own")) {
        throw ownerError;
      }
      // If ownerOf fails, the token might not exist
      console.error("Failed to verify ownership:", ownerError);
      throw new Error(
        `Failed to verify NFT ownership. Token ${tokenIdBigInt.toString()} may not exist ` +
        `at contract ${params.assetContractAddress}. Error: ${ownerError.message}`
      );
    }

    // Also verify approval
    const isApproved = await isApprovedForAll({
      contract: nftContract,
      owner: account.address,
      operator: MARKETPLACE_ADDRESS,
    });
    console.log("Marketplace approved:", isApproved);

    if (!isApproved) {
      throw new Error(
        `Marketplace is not approved to transfer NFTs from ${params.assetContractAddress}. ` +
        `Please approve the collection first.`
      );
    }

    console.log("============================");

    const transaction = createAuction({
      contract: marketplace,
      assetContractAddress: params.assetContractAddress,
      tokenId: tokenIdBigInt,
      minimumBidAmount: params.minimumBidAmount,
      buyoutBidAmount: buyoutPrice,
      quantity: BigInt(params.quantity || 1),
      startTimestamp: params.startTimestamp || new Date(),
      endTimestamp: params.endTimestamp || defaultEndDate,
    });

    const result = await sendTransaction({
      transaction,
      account,
    });

    console.log("Auction transaction submitted:", result.transactionHash);

    // Wait for confirmation - wrap in try/catch to handle ABI decode errors
    let receipt;
    try {
      receipt = await waitForReceipt({
        client,
        chain: defineChain(MARKETPLACE_CHAIN_ID),
        transactionHash: result.transactionHash,
      });
    } catch (receiptError: any) {
      // If the error is an ABI decode error but we have a tx hash, the tx likely succeeded
      if (receiptError.message?.includes('AbiErrorSignatureNotFoundError') ||
          receiptError.message?.includes('not found on ABI')) {
        console.warn("Receipt parsing error (tx may have succeeded):", receiptError.message);
        // Return with estimated ID - the tx was submitted successfully
        return {
          transactionHash: result.transactionHash,
          auctionId: estimatedAuctionId,
        };
      }
      throw receiptError;
    }

    // Extract auction ID from events
    let auctionId = estimatedAuctionId;
    if (receipt.logs && receipt.logs.length > 0) {
      for (const log of receipt.logs) {
        if (log.topics && log.topics.length > 1 && log.topics[1]) {
          try {
            const decodedId = BigInt(log.topics[1] as string).toString();
            if (decodedId) {
              auctionId = decodedId;
              break;
            }
          } catch {
            // Continue trying other logs
          }
        }
      }
    }

    console.log("Auction created with ID:", auctionId);

    return {
      transactionHash: result.transactionHash,
      auctionId,
    };
  } catch (error: any) {
    console.error("Error creating auction:", error);

    // Parse contract error signatures for better error messages
    const errorMessage = error.message || '';
    if (errorMessage.includes('0xa1148100')) {
      throw new Error('Auction creation failed: The NFT is not approved for the marketplace or the auction parameters are invalid.');
    }
    if (errorMessage.includes('0xdf2d9b42')) {
      throw new Error('Auction creation failed: The asset is invalid or you do not own this NFT on-chain.');
    }

    throw error;
  }
}

/**
 * Cancel a direct listing
 */
export async function cancelDirectListing(
  listingId: string,
  account: Account
): Promise<{ transactionHash: string }> {
  try {
    const marketplace = getMarketplaceContract();

    const transaction = cancelListing({
      contract: marketplace,
      listingId: BigInt(listingId),
    });

    const result = await sendTransaction({
      transaction,
      account,
    });

    // Wait for confirmation
    await waitForReceipt({
      client,
      chain: defineChain(MARKETPLACE_CHAIN_ID),
      transactionHash: result.transactionHash,
    });

    console.log("Listing cancelled:", listingId);

    return { transactionHash: result.transactionHash };
  } catch (error) {
    console.error("Error cancelling listing:", error);
    throw error;
  }
}

/**
 * Cancel an auction
 */
export async function cancelEnglishAuction(
  auctionId: string,
  account: Account
): Promise<{ transactionHash: string }> {
  try {
    const marketplace = getMarketplaceContract();

    const transaction = cancelAuction({
      contract: marketplace,
      auctionId: BigInt(auctionId),
    });

    const result = await sendTransaction({
      transaction,
      account,
    });

    // Wait for confirmation
    await waitForReceipt({
      client,
      chain: defineChain(MARKETPLACE_CHAIN_ID),
      transactionHash: result.transactionHash,
    });

    console.log("Auction cancelled:", auctionId);

    return { transactionHash: result.transactionHash };
  } catch (error) {
    console.error("Error cancelling auction:", error);
    throw error;
  }
}

/**
 * Get a specific listing by ID
 */
export async function getListingById(listingId: string) {
  try {
    const marketplace = getMarketplaceContract();

    const listing = await getListing({
      contract: marketplace,
      listingId: BigInt(listingId),
    });

    return listing;
  } catch (error) {
    console.error("Error getting listing:", error);
    return null;
  }
}

/**
 * Get a specific auction by ID
 */
export async function getAuctionById(auctionId: string) {
  try {
    const marketplace = getMarketplaceContract();

    const auction = await getAuction({
      contract: marketplace,
      auctionId: BigInt(auctionId),
    });

    return auction;
  } catch (error) {
    console.error("Error getting auction:", error);
    return null;
  }
}

/**
 * Get all active listings by a seller
 */
export async function getUserListings(sellerAddress: string) {
  try {
    const marketplace = getMarketplaceContract();

    const allListings = await getAllValidListings({
      contract: marketplace,
    });

    const userListings = allListings.filter(
      (listing) => listing.creatorAddress.toLowerCase() === sellerAddress.toLowerCase()
    );

    return userListings;
  } catch (error) {
    console.error("Error getting user listings:", error);
    return [];
  }
}

/**
 * Get all active auctions by a seller
 */
export async function getUserAuctions(sellerAddress: string) {
  try {
    const marketplace = getMarketplaceContract();

    const allAuctions = await getAllValidAuctions({
      contract: marketplace,
    });

    const userAuctions = allAuctions.filter(
      (auction) => auction.creatorAddress.toLowerCase() === sellerAddress.toLowerCase()
    );

    return userAuctions;
  } catch (error) {
    console.error("Error getting user auctions:", error);
    return [];
  }
}

/**
 * Get all valid listings (for marketplace browse)
 */
export async function getAllListings() {
  try {
    const marketplace = getMarketplaceContract();

    const listings = await getAllValidListings({
      contract: marketplace,
    });

    return listings;
  } catch (error) {
    console.error("Error getting all listings:", error);
    return [];
  }
}

/**
 * Get all valid auctions (for marketplace browse)
 */
export async function getAllAuctions() {
  try {
    const marketplace = getMarketplaceContract();

    const auctions = await getAllValidAuctions({
      contract: marketplace,
    });

    return auctions;
  } catch (error) {
    console.error("Error getting all auctions:", error);
    return [];
  }
}

/**
 * Convert ETH price to Wei with proper precision handling
 * Uses string manipulation to avoid floating point precision loss
 */
export function ethToWei(ethAmount: string): bigint {
  // Handle empty or invalid input
  if (!ethAmount || ethAmount === '0') return BigInt(0);

  // Split the amount into integer and decimal parts
  const [intPart, decPart = ''] = ethAmount.split('.');

  // Pad or truncate decimal part to 18 digits
  const paddedDecimal = decPart.padEnd(18, '0').slice(0, 18);

  // Combine and parse as BigInt
  const combined = intPart + paddedDecimal;

  // Remove leading zeros but keep at least one character
  const trimmed = combined.replace(/^0+/, '') || '0';

  return BigInt(trimmed);
}

/**
 * Convert Wei to ETH with proper precision
 */
export function weiToEth(weiAmount: bigint): string {
  const weiString = weiAmount.toString().padStart(19, '0');
  const intPart = weiString.slice(0, -18) || '0';
  const decPart = weiString.slice(-18);

  // Trim trailing zeros but keep at least 6 decimal places for display
  let trimmedDec = decPart.replace(/0+$/, '');
  if (trimmedDec.length < 6) {
    trimmedDec = decPart.slice(0, 6);
  }

  return trimmedDec ? `${intPart}.${trimmedDec}` : intPart;
}

/**
 * Format price for display
 */
export function formatPrice(weiAmount: bigint): string {
  const eth = Number(weiAmount) / 1e18;
  if (eth < 0.0001) return "< 0.0001 ETH";
  if (eth < 1) return `${eth.toFixed(4)} ETH`;
  return `${eth.toFixed(2)} ETH`;
}

/**
 * Calculate platform fee (2.5%)
 */
export function calculatePlatformFee(priceEth: string): string {
  const price = parseFloat(priceEth);
  return (price * 0.025).toFixed(6);
}

/**
 * Calculate creator royalty
 */
export function calculateRoyalty(priceEth: string, royaltyPercentage: number): string {
  const price = parseFloat(priceEth);
  return (price * (royaltyPercentage / 100)).toFixed(6);
}

/**
 * Calculate seller proceeds after fees
 */
export function calculateSellerProceeds(
  priceEth: string,
  royaltyPercentage: number = 0
): { proceeds: string; platformFee: string; royalty: string } {
  const price = parseFloat(priceEth);
  const platformFee = price * 0.025;
  const royalty = price * (royaltyPercentage / 100);
  const proceeds = price - platformFee - royalty;

  return {
    proceeds: proceeds.toFixed(6),
    platformFee: platformFee.toFixed(6),
    royalty: royalty.toFixed(6),
  };
}

// ============================================================================
// BUY FUNCTIONS
// ============================================================================

/**
 * Buy from a direct listing
 */
export async function buyFromDirectListing(
  listingId: string,
  quantity: number,
  buyerAddress: string,
  account: Account
): Promise<{ transactionHash: string }> {
  try {
    const marketplace = getMarketplaceContract();

    console.log("=== BUY FROM LISTING DEBUG ===");
    console.log("Listing ID:", listingId);
    console.log("Quantity:", quantity);
    console.log("Buyer address:", buyerAddress);

    // Get listing details first to verify it exists and is active
    const listing = await getListing({
      contract: marketplace,
      listingId: BigInt(listingId),
    });

    if (!listing) {
      throw new Error(`Listing ${listingId} not found`);
    }

    console.log("Listing found:", {
      id: listing.id.toString(),
      pricePerToken: listing.pricePerToken.toString(),
      quantity: listing.quantity.toString(),
      status: listing.status,
    });

    const transaction = buyFromListing({
      contract: marketplace,
      listingId: BigInt(listingId),
      quantity: BigInt(quantity),
      recipient: buyerAddress,
    });

    const result = await sendTransaction({
      transaction,
      account,
    });

    console.log("Purchase transaction submitted:", result.transactionHash);

    // Wait for confirmation
    await waitForReceipt({
      client,
      chain: defineChain(MARKETPLACE_CHAIN_ID),
      transactionHash: result.transactionHash,
    });

    console.log("Purchase completed successfully");
    console.log("==============================");

    return { transactionHash: result.transactionHash };
  } catch (error: any) {
    console.error("Error buying from listing:", error);

    // Parse common error signatures
    const errorMessage = error.message || "";
    if (errorMessage.includes("insufficient funds")) {
      throw new Error("Insufficient funds to complete purchase");
    }
    if (errorMessage.includes("0x")) {
      // Try to provide more context for contract errors
      throw new Error(`Purchase failed: ${errorMessage}`);
    }

    throw error;
  }
}

// ============================================================================
// AUCTION BIDDING FUNCTIONS
// ============================================================================

/**
 * Place a bid on an auction
 */
export async function placeAuctionBid(
  auctionId: string,
  bidAmount: string,
  account: Account
): Promise<{ transactionHash: string }> {
  try {
    const marketplace = getMarketplaceContract();

    console.log("=== PLACE BID DEBUG ===");
    console.log("Auction ID:", auctionId);
    console.log("Bid amount (ETH):", bidAmount);
    console.log("Bidder address:", account.address);

    // Get auction details first
    const auction = await getAuction({
      contract: marketplace,
      auctionId: BigInt(auctionId),
    });

    if (!auction) {
      throw new Error(`Auction ${auctionId} not found`);
    }

    console.log("Auction found:", {
      id: auction.id.toString(),
      minimumBidAmount: auction.minimumBidAmount.toString(),
      buyoutBidAmount: auction.buyoutBidAmount.toString(),
      status: auction.status,
    });

    const transaction = bidInAuction({
      contract: marketplace,
      auctionId: BigInt(auctionId),
      bidAmount: bidAmount,
    });

    const result = await sendTransaction({
      transaction,
      account,
    });

    console.log("Bid transaction submitted:", result.transactionHash);

    // Wait for confirmation
    await waitForReceipt({
      client,
      chain: defineChain(MARKETPLACE_CHAIN_ID),
      transactionHash: result.transactionHash,
    });

    console.log("Bid placed successfully");
    console.log("=======================");

    return { transactionHash: result.transactionHash };
  } catch (error: any) {
    console.error("Error placing bid:", error);

    const errorMessage = error.message || "";
    if (errorMessage.includes("bid too low") || errorMessage.includes("BidTooLow")) {
      throw new Error("Bid amount is too low. Must be higher than the current bid.");
    }
    if (errorMessage.includes("insufficient funds")) {
      throw new Error("Insufficient funds to place bid");
    }

    throw error;
  }
}

/**
 * Buyout an auction instantly at the buyout price
 */
export async function buyoutAuctionNow(
  auctionId: string,
  account: Account
): Promise<{ transactionHash: string }> {
  try {
    const marketplace = getMarketplaceContract();

    console.log("=== BUYOUT AUCTION DEBUG ===");
    console.log("Auction ID:", auctionId);
    console.log("Buyer address:", account.address);

    // Get auction to check buyout price
    const auction = await getAuction({
      contract: marketplace,
      auctionId: BigInt(auctionId),
    });

    if (!auction) {
      throw new Error(`Auction ${auctionId} not found`);
    }

    console.log("Buyout price:", auction.buyoutBidAmount.toString());

    const transaction = buyoutAuction({
      contract: marketplace,
      auctionId: BigInt(auctionId),
    });

    const result = await sendTransaction({
      transaction,
      account,
    });

    console.log("Buyout transaction submitted:", result.transactionHash);

    await waitForReceipt({
      client,
      chain: defineChain(MARKETPLACE_CHAIN_ID),
      transactionHash: result.transactionHash,
    });

    console.log("Auction bought out successfully");
    console.log("==============================");

    return { transactionHash: result.transactionHash };
  } catch (error: any) {
    console.error("Error buying out auction:", error);
    throw error;
  }
}

/**
 * Get the winning bid for an auction
 */
export async function fetchWinningBid(auctionId: string) {
  try {
    const marketplace = getMarketplaceContract();

    const winningBid = await getWinningBid({
      contract: marketplace,
      auctionId: BigInt(auctionId),
    });

    return winningBid;
  } catch (error) {
    console.error("Error getting winning bid:", error);
    return null;
  }
}

// ============================================================================
// AUCTION SETTLEMENT FUNCTIONS
// ============================================================================

/**
 * Execute sale after auction ends (anyone can call)
 * This finalizes the auction and transfers assets
 */
export async function settleAuction(
  auctionId: string,
  account: Account
): Promise<{ transactionHash: string }> {
  try {
    const marketplace = getMarketplaceContract();

    console.log("=== SETTLE AUCTION DEBUG ===");
    console.log("Auction ID:", auctionId);

    const transaction = executeSale({
      contract: marketplace,
      auctionId: BigInt(auctionId),
    });

    const result = await sendTransaction({
      transaction,
      account,
    });

    console.log("Settlement transaction submitted:", result.transactionHash);

    await waitForReceipt({
      client,
      chain: defineChain(MARKETPLACE_CHAIN_ID),
      transactionHash: result.transactionHash,
    });

    console.log("Auction settled successfully");
    console.log("============================");

    return { transactionHash: result.transactionHash };
  } catch (error: any) {
    console.error("Error settling auction:", error);

    const errorMessage = error.message || "";
    if (errorMessage.includes("auction not ended")) {
      throw new Error("Auction has not ended yet");
    }
    if (errorMessage.includes("no winning bid")) {
      throw new Error("Auction has no winning bid");
    }

    throw error;
  }
}

/**
 * Seller collects payment after auction settlement
 */
export async function claimAuctionPayout(
  auctionId: string,
  account: Account
): Promise<{ transactionHash: string }> {
  try {
    const marketplace = getMarketplaceContract();

    console.log("=== CLAIM PAYOUT DEBUG ===");
    console.log("Auction ID:", auctionId);
    console.log("Seller address:", account.address);

    const transaction = collectAuctionPayout({
      contract: marketplace,
      auctionId: BigInt(auctionId),
    });

    const result = await sendTransaction({
      transaction,
      account,
    });

    console.log("Payout claim transaction submitted:", result.transactionHash);

    await waitForReceipt({
      client,
      chain: defineChain(MARKETPLACE_CHAIN_ID),
      transactionHash: result.transactionHash,
    });

    console.log("Payout claimed successfully");
    console.log("===========================");

    return { transactionHash: result.transactionHash };
  } catch (error) {
    console.error("Error claiming auction payout:", error);
    throw error;
  }
}

/**
 * Winner collects NFT after auction settlement
 */
export async function claimAuctionNFT(
  auctionId: string,
  account: Account
): Promise<{ transactionHash: string }> {
  try {
    const marketplace = getMarketplaceContract();

    console.log("=== CLAIM NFT DEBUG ===");
    console.log("Auction ID:", auctionId);
    console.log("Winner address:", account.address);

    const transaction = collectAuctionTokens({
      contract: marketplace,
      auctionId: BigInt(auctionId),
    });

    const result = await sendTransaction({
      transaction,
      account,
    });

    console.log("NFT claim transaction submitted:", result.transactionHash);

    await waitForReceipt({
      client,
      chain: defineChain(MARKETPLACE_CHAIN_ID),
      transactionHash: result.transactionHash,
    });

    console.log("NFT claimed successfully");
    console.log("========================");

    return { transactionHash: result.transactionHash };
  } catch (error) {
    console.error("Error claiming auction NFT:", error);
    throw error;
  }
}

// ============================================================================
// OFFER FUNCTIONS
// ============================================================================

export interface MakeOfferParams {
  assetContractAddress: string;
  tokenId: string;
  offerAmount: string; // In ETH
  expirationTime: Date;
  quantity?: number;
}

/**
 * Make an offer on any NFT (listed or not)
 */
export async function createNftOffer(
  params: MakeOfferParams,
  account: Account
): Promise<{ transactionHash: string; offerId: string }> {
  try {
    const marketplace = getMarketplaceContract();

    // Get current offer count to estimate new offer ID
    const currentTotal = await totalOffers({ contract: marketplace });
    const estimatedOfferId = currentTotal.toString();

    console.log("=== CREATE OFFER DEBUG ===");
    console.log("Asset contract:", params.assetContractAddress);
    console.log("Token ID:", params.tokenId);
    console.log("Offer amount (ETH):", params.offerAmount);
    console.log("Expiration:", params.expirationTime);
    console.log("Offeror:", account.address);

    const tokenIdBigInt = parseTokenId(params.tokenId);

    const transaction = makeOffer({
      contract: marketplace,
      assetContractAddress: params.assetContractAddress,
      tokenId: tokenIdBigInt,
      currencyContractAddress: NATIVE_TOKEN,
      totalOffer: params.offerAmount,
      offerExpiresAt: params.expirationTime,
      quantity: BigInt(params.quantity || 1),
    });

    const result = await sendTransaction({
      transaction,
      account,
    });

    console.log("Offer transaction submitted:", result.transactionHash);

    // Wait for confirmation
    const receipt = await waitForReceipt({
      client,
      chain: defineChain(MARKETPLACE_CHAIN_ID),
      transactionHash: result.transactionHash,
    });

    // Extract offer ID from events
    let offerId = estimatedOfferId;
    if (receipt.logs && receipt.logs.length > 0) {
      for (const log of receipt.logs) {
        if (log.topics && log.topics.length > 1 && log.topics[1]) {
          try {
            const decodedId = BigInt(log.topics[1] as string).toString();
            if (decodedId) {
              offerId = decodedId;
              break;
            }
          } catch {
            // Continue trying other logs
          }
        }
      }
    }

    console.log("Offer created with ID:", offerId);
    console.log("=========================");

    return {
      transactionHash: result.transactionHash,
      offerId,
    };
  } catch (error: any) {
    console.error("Error creating offer:", error);

    const errorMessage = error.message || "";
    if (errorMessage.includes("insufficient funds")) {
      throw new Error("Insufficient funds to make offer");
    }

    throw error;
  }
}

/**
 * Accept an offer (only NFT owner can call)
 */
export async function acceptNftOffer(
  offerId: string,
  account: Account
): Promise<{ transactionHash: string }> {
  try {
    const marketplace = getMarketplaceContract();

    console.log("=== ACCEPT OFFER DEBUG ===");
    console.log("Offer ID:", offerId);
    console.log("Acceptor (NFT owner):", account.address);

    // Verify offer exists
    const offer = await getOffer({
      contract: marketplace,
      offerId: BigInt(offerId),
    });

    if (!offer) {
      throw new Error(`Offer ${offerId} not found`);
    }

    console.log("Offer details:", {
      offeror: offer.offerorAddress,
      tokenId: offer.tokenId.toString(),
      totalPrice: offer.totalPrice.toString(),
    });

    const transaction = acceptOffer({
      contract: marketplace,
      offerId: BigInt(offerId),
    });

    const result = await sendTransaction({
      transaction,
      account,
    });

    console.log("Accept offer transaction submitted:", result.transactionHash);

    await waitForReceipt({
      client,
      chain: defineChain(MARKETPLACE_CHAIN_ID),
      transactionHash: result.transactionHash,
    });

    console.log("Offer accepted successfully");
    console.log("===========================");

    return { transactionHash: result.transactionHash };
  } catch (error: any) {
    console.error("Error accepting offer:", error);

    const errorMessage = error.message || "";
    if (errorMessage.includes("not owner")) {
      throw new Error("Only the NFT owner can accept this offer");
    }
    if (errorMessage.includes("offer expired")) {
      throw new Error("This offer has expired");
    }

    throw error;
  }
}

/**
 * Cancel an offer (only offeror can call)
 */
export async function cancelNftOffer(
  offerId: string,
  account: Account
): Promise<{ transactionHash: string }> {
  try {
    const marketplace = getMarketplaceContract();

    console.log("=== CANCEL OFFER DEBUG ===");
    console.log("Offer ID:", offerId);
    console.log("Offeror:", account.address);

    const transaction = cancelOffer({
      contract: marketplace,
      offerId: BigInt(offerId),
    });

    const result = await sendTransaction({
      transaction,
      account,
    });

    console.log("Cancel offer transaction submitted:", result.transactionHash);

    await waitForReceipt({
      client,
      chain: defineChain(MARKETPLACE_CHAIN_ID),
      transactionHash: result.transactionHash,
    });

    console.log("Offer cancelled successfully");
    console.log("============================");

    return { transactionHash: result.transactionHash };
  } catch (error: any) {
    console.error("Error cancelling offer:", error);

    const errorMessage = error.message || "";
    if (errorMessage.includes("not offeror")) {
      throw new Error("Only the offeror can cancel this offer");
    }

    throw error;
  }
}

/**
 * Get a specific offer by ID
 */
export async function getOfferById(offerId: string) {
  try {
    const marketplace = getMarketplaceContract();

    const offer = await getOffer({
      contract: marketplace,
      offerId: BigInt(offerId),
    });

    return offer;
  } catch (error) {
    console.error("Error getting offer:", error);
    return null;
  }
}

/**
 * Get all valid offers
 */
export async function getAllOffers() {
  try {
    const marketplace = getMarketplaceContract();

    const offers = await getAllValidOffers({
      contract: marketplace,
    });

    return offers;
  } catch (error) {
    console.error("Error getting all offers:", error);
    return [];
  }
}

/**
 * Get all offers for a specific NFT
 */
export async function getOffersForNFT(
  assetContractAddress: string,
  tokenId: string
) {
  try {
    const allOffers = await getAllOffers();
    const tokenIdBigInt = parseTokenId(tokenId);

    const nftOffers = allOffers.filter(
      (offer) =>
        offer.assetContractAddress.toLowerCase() === assetContractAddress.toLowerCase() &&
        offer.tokenId === tokenIdBigInt
    );

    return nftOffers;
  } catch (error) {
    console.error("Error getting offers for NFT:", error);
    return [];
  }
}

/**
 * Get all offers made by a user
 */
export async function getUserSentOffers(userAddress: string) {
  try {
    const allOffers = await getAllOffers();

    const userOffers = allOffers.filter(
      (offer) => offer.offerorAddress.toLowerCase() === userAddress.toLowerCase()
    );

    return userOffers;
  } catch (error) {
    console.error("Error getting user sent offers:", error);
    return [];
  }
}

// ============================================================================
// SWEEP FLOOR FUNCTION
// ============================================================================

/**
 * Sweep floor - buy multiple NFTs from a collection at floor prices
 */
export async function sweepFloor(
  collectionAddress: string,
  maxItems: number,
  maxTotalPriceEth: string,
  buyerAddress: string,
  account: Account
): Promise<{ transactions: { transactionHash: string; listingId: string }[]; totalSpent: string }> {
  try {
    const marketplace = getMarketplaceContract();

    console.log("=== SWEEP FLOOR DEBUG ===");
    console.log("Collection:", collectionAddress);
    console.log("Max items:", maxItems);
    console.log("Max total price (ETH):", maxTotalPriceEth);
    console.log("Buyer:", buyerAddress);

    // Get all valid listings
    const allListings = await getAllValidListings({ contract: marketplace });

    // Filter listings for this collection and sort by price ASC (floor first)
    const collectionListings = allListings
      .filter(
        (listing) =>
          listing.assetContractAddress.toLowerCase() === collectionAddress.toLowerCase()
      )
      .sort((a, b) => {
        const priceA = Number(a.pricePerToken);
        const priceB = Number(b.pricePerToken);
        return priceA - priceB;
      });

    console.log(`Found ${collectionListings.length} listings for collection`);

    if (collectionListings.length === 0) {
      throw new Error("No listings found for this collection");
    }

    // Select listings up to maxItems and maxTotalPrice
    const maxTotalPriceWei = ethToWei(maxTotalPriceEth);
    const selectedListings: typeof collectionListings = [];
    let totalPriceWei = BigInt(0);

    for (const listing of collectionListings) {
      if (selectedListings.length >= maxItems) break;
      if (totalPriceWei + listing.pricePerToken > maxTotalPriceWei) break;

      selectedListings.push(listing);
      totalPriceWei += listing.pricePerToken;
    }

    console.log(`Selected ${selectedListings.length} listings to purchase`);
    console.log("Total price:", weiToEth(totalPriceWei), "ETH");

    if (selectedListings.length === 0) {
      throw new Error("No listings within budget");
    }

    // Execute purchases sequentially
    const transactions: { transactionHash: string; listingId: string }[] = [];
    let actualSpentWei = BigInt(0);

    for (const listing of selectedListings) {
      try {
        const result = await buyFromDirectListing(
          listing.id.toString(),
          1,
          buyerAddress,
          account
        );
        transactions.push({
          transactionHash: result.transactionHash,
          listingId: listing.id.toString(),
        });
        actualSpentWei += listing.pricePerToken;
        console.log(`Purchased listing ${listing.id}`);
      } catch (purchaseError) {
        console.error(`Failed to purchase listing ${listing.id}:`, purchaseError);
        // Continue with other purchases even if one fails
      }
    }

    console.log(`Sweep complete: ${transactions.length}/${selectedListings.length} successful`);
    console.log("Actual spent:", weiToEth(actualSpentWei), "ETH");
    console.log("=========================");

    return {
      transactions,
      totalSpent: weiToEth(actualSpentWei),
    };
  } catch (error) {
    console.error("Error sweeping floor:", error);
    throw error;
  }
}
