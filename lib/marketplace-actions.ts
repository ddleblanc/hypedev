/**
 * Marketplace Actions - Centralized workflows for marketplace operations
 *
 * This module provides complete action workflows that:
 * 1. Execute on-chain transactions via lib/marketplace.ts
 * 2. Save records to database via API
 * 3. Handle errors consistently
 * 4. Return standardized results
 *
 * Components should use these actions instead of implementing logic inline.
 */

import { Account } from "thirdweb/wallets";
import { Result, ok, err } from "neverthrow";
import {
  createNftOffer as createNftOfferOnChain,
  createCollectionOffer as createCollectionOfferOnChain,
  buyFromDirectListing,
  createDirectListing,
  cancelDirectListing,
  cancelNftOffer,
  acceptNftOffer,
  transferNFT as transferNFTOnChain,
} from "@/lib/marketplace";

// =============================================================================
// Types
// =============================================================================

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  transactionHash?: string;
}

export interface MakeOfferParams {
  /** Database ID of the NFT (preferred for DB operations) */
  nftId?: string;
  /** Contract address of the NFT collection */
  contractAddress: string;
  /** Token ID of the NFT */
  tokenId: string;
  /** Offer amount in ETH */
  offerAmount: string;
  /** Offer duration in days */
  durationDays: number;
}

export interface MakeOfferResult {
  offerId: string;
  transactionHash: string;
}

export interface MakeCollectionOfferParams {
  /** Database ID of the collection */
  collectionId: string;
  /** Contract address of the collection */
  contractAddress: string;
  /** Offer amount in ETH */
  offerAmount: string;
  /** Number of NFTs to potentially acquire */
  quantity: number;
  /** Offer duration in days */
  durationDays: number;
}

export interface BuyNFTParams {
  /** Listing ID from the marketplace */
  listingId: string;
  /** Database ID of the NFT */
  nftId?: string;
  /** Quantity to buy (usually 1 for ERC-721) */
  quantity?: number;
}

export interface BuyNFTResult {
  transactionHash: string;
  listingId: string;
}

export interface ListNFTParams {
  /** Database ID of the NFT */
  nftId: string;
  /** Contract address of the NFT collection */
  contractAddress: string;
  /** Token ID of the NFT */
  tokenId: string;
  /** Listing price in ETH */
  pricePerToken: string;
  /** Listing duration in days */
  durationDays: number;
  /** Quantity (usually 1 for ERC-721) */
  quantity?: number;
}

export interface ListNFTResult {
  listingId: string;
  transactionHash: string;
}

export interface CancelListingParams {
  listingId: string;
  nftId?: string;
}

export interface TransferNFTParams {
  contractAddress: string;
  tokenId: string;
  toAddress: string;
  nftId?: string;
}

export interface TransferNFTResult {
  transactionHash: string;
}

// =============================================================================
// Helper: Parse error messages for user-friendly display
// =============================================================================

function parseErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();

    if (msg.includes("user rejected") || msg.includes("user denied")) {
      return "Transaction was cancelled";
    }
    if (msg.includes("insufficient funds") || msg.includes("insufficient balance")) {
      return "Insufficient funds to complete transaction";
    }
    if (msg.includes("insufficient weth")) {
      return "Insufficient WETH balance. Please wrap some ETH first.";
    }
    if (msg.includes("not approved") || msg.includes("approval")) {
      return "NFT approval required. Please approve the marketplace first.";
    }
    if (msg.includes("expired")) {
      return "This listing or offer has expired";
    }
    if (msg.includes("already")) {
      return "This action has already been completed";
    }

    // Return first 150 chars of error if no specific match
    return error.message.slice(0, 150);
  }

  return "An unexpected error occurred. Please try again.";
}

// =============================================================================
// Make Offer on Specific NFT
// =============================================================================

/**
 * Make an offer on a specific NFT
 *
 * @param params - Offer parameters
 * @param account - Connected wallet account
 * @returns Result with offer ID and transaction hash, or error
 *
 * @example
 * ```ts
 * const result = await makeNFTOffer({
 *   nftId: "uuid-here",
 *   contractAddress: "0x...",
 *   tokenId: "123",
 *   offerAmount: "0.5",
 *   durationDays: 7,
 * }, account);
 *
 * if (result.success) {
 *   console.log("Offer created:", result.data.offerId);
 * }
 * ```
 */
export async function makeNFTOffer(
  params: MakeOfferParams,
  account: Account
): Promise<ActionResult<MakeOfferResult>> {
  try {
    // Calculate expiration time
    const expirationTime = new Date();
    expirationTime.setDate(expirationTime.getDate() + params.durationDays);

    // Step 1: Execute on-chain transaction
    const onChainResult = await createNftOfferOnChain(
      {
        assetContractAddress: params.contractAddress,
        tokenId: params.tokenId,
        offerAmount: params.offerAmount,
        expirationTime,
      },
      account
    );

    // Step 2: Save to database
    const dbPayload = {
      offerId: onChainResult.offerId,
      offerorAddress: account.address,
      nftId: params.nftId,
      assetContractAddress: params.contractAddress,
      tokenId: params.tokenId,
      offerAmount: parseFloat(params.offerAmount),
      expirationTimestamp: expirationTime.toISOString(),
      transactionHash: onChainResult.transactionHash,
    };

    try {
      const dbResponse = await fetch("/api/marketplace/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dbPayload),
      });

      if (!dbResponse.ok) {
        console.error("[makeNFTOffer] Database save failed, but on-chain succeeded");
        // Don't fail the overall operation - on-chain is the source of truth
      }
    } catch (dbError) {
      console.error("[makeNFTOffer] Database save exception:", dbError);
      // Continue - on-chain succeeded
    }

    return {
      success: true,
      data: {
        offerId: onChainResult.offerId,
        transactionHash: onChainResult.transactionHash,
      },
      transactionHash: onChainResult.transactionHash,
    };
  } catch (error) {
    console.error("[makeNFTOffer] Error:", error);
    return {
      success: false,
      error: parseErrorMessage(error),
    };
  }
}

// =============================================================================
// Make Collection Offer
// =============================================================================

/**
 * Make an offer on any NFT in a collection
 *
 * @param params - Collection offer parameters
 * @param account - Connected wallet account
 * @returns Result with offer ID and transaction hash, or error
 */
export async function makeCollectionOffer(
  params: MakeCollectionOfferParams,
  account: Account
): Promise<ActionResult<MakeOfferResult>> {
  try {
    // Calculate expiration time
    const expirationTime = new Date();
    expirationTime.setDate(expirationTime.getDate() + params.durationDays);

    // Step 1: Execute on-chain transaction
    const onChainResult = await createCollectionOfferOnChain(
      {
        assetContractAddress: params.contractAddress,
        offerAmount: params.offerAmount,
        quantity: params.quantity,
        expirationTime,
      },
      account
    );

    // Step 2: Save to database
    const dbPayload = {
      offerId: onChainResult.offerId,
      collectionId: params.collectionId,
      assetContractAddress: params.contractAddress,
      offerAmount: parseFloat(params.offerAmount),
      quantity: params.quantity,
      expirationTimestamp: expirationTime.toISOString(),
      transactionHash: onChainResult.transactionHash,
    };

    try {
      const dbResponse = await fetch("/api/marketplace/collection-offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dbPayload),
      });

      if (!dbResponse.ok) {
        console.error("[makeCollectionOffer] Database save failed, but on-chain succeeded");
      }
    } catch (dbError) {
      console.error("[makeCollectionOffer] Database save exception:", dbError);
    }

    return {
      success: true,
      data: {
        offerId: onChainResult.offerId,
        transactionHash: onChainResult.transactionHash,
      },
      transactionHash: onChainResult.transactionHash,
    };
  } catch (error) {
    console.error("[makeCollectionOffer] Error:", error);
    return {
      success: false,
      error: parseErrorMessage(error),
    };
  }
}

// =============================================================================
// Buy NFT from Listing
// =============================================================================

/**
 * Buy an NFT from a direct listing
 *
 * @param params - Purchase parameters
 * @param account - Connected wallet account
 * @returns Result with transaction hash, or error
 */
export async function buyNFT(
  params: BuyNFTParams,
  account: Account
): Promise<ActionResult<BuyNFTResult>> {
  try {
    // Step 1: Execute on-chain purchase
    const onChainResult = await buyFromDirectListing(
      params.listingId,
      params.quantity || 1,
      account.address,
      account
    );

    // Step 2: Record purchase in database
    const dbPayload = {
      listingId: params.listingId,
      buyerAddress: account.address,
      transactionHash: onChainResult.transactionHash,
      quantity: params.quantity || 1,
    };

    try {
      const dbResponse = await fetch("/api/marketplace/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dbPayload),
      });

      if (!dbResponse.ok) {
        console.error("[buyNFT] Database record failed, but on-chain succeeded");
      }
    } catch (dbError) {
      console.error("[buyNFT] Database record exception:", dbError);
    }

    return {
      success: true,
      data: {
        transactionHash: onChainResult.transactionHash,
        listingId: params.listingId,
      },
      transactionHash: onChainResult.transactionHash,
    };
  } catch (error) {
    console.error("[buyNFT] Error:", error);
    return {
      success: false,
      error: parseErrorMessage(error),
    };
  }
}

// =============================================================================
// List NFT for Sale
// =============================================================================

/**
 * List an NFT for sale on the marketplace
 *
 * @param params - Listing parameters
 * @param account - Connected wallet account
 * @returns Result with listing ID and transaction hash, or error
 */
export async function listNFT(
  params: ListNFTParams,
  account: Account
): Promise<ActionResult<ListNFTResult>> {
  try {
    // Calculate end time
    const endTimestamp = new Date();
    endTimestamp.setDate(endTimestamp.getDate() + params.durationDays);

    // Step 1: Execute on-chain listing
    const onChainResult = await createDirectListing(
      {
        assetContractAddress: params.contractAddress,
        tokenId: params.tokenId,
        pricePerToken: params.pricePerToken,
        quantity: params.quantity || 1,
        startTimestamp: new Date(),
        endTimestamp,
      },
      account
    );

    // Step 2: Save to database via tRPC or API
    const dbPayload = {
      nftId: params.nftId,
      listingId: onChainResult.listingId,
      sellerAddress: account.address,
      assetContractAddress: params.contractAddress,
      tokenId: params.tokenId,
      pricePerToken: parseFloat(params.pricePerToken),
      startTimestamp: new Date().toISOString(),
      endTimestamp: endTimestamp.toISOString(),
      transactionHash: onChainResult.transactionHash,
      quantity: params.quantity || 1,
    };

    try {
      const dbResponse = await fetch("/api/marketplace/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dbPayload),
      });

      if (!dbResponse.ok) {
        console.error("[listNFT] Database save failed, but on-chain succeeded");
      }
    } catch (dbError) {
      console.error("[listNFT] Database save exception:", dbError);
    }

    return {
      success: true,
      data: {
        listingId: onChainResult.listingId,
        transactionHash: onChainResult.transactionHash,
      },
      transactionHash: onChainResult.transactionHash,
    };
  } catch (error) {
    console.error("[listNFT] Error:", error);
    return {
      success: false,
      error: parseErrorMessage(error),
    };
  }
}

// =============================================================================
// Cancel Listing
// =============================================================================

/**
 * Cancel an active listing
 *
 * @param params - Cancel parameters
 * @param account - Connected wallet account
 * @returns Result with success status, or error
 */
export async function cancelListing(
  params: CancelListingParams,
  account: Account
): Promise<ActionResult<{ listingId: string }>> {
  try {
    // Step 1: Cancel on-chain
    const onChainResult = await cancelDirectListing(params.listingId, account);

    // Step 2: Update database
    try {
      const dbResponse = await fetch(`/api/marketplace/listings/${params.listingId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!dbResponse.ok) {
        console.error("[cancelListing] Database update failed, but on-chain succeeded");
      }
    } catch (dbError) {
      console.error("[cancelListing] Database update exception:", dbError);
    }

    return {
      success: true,
      data: { listingId: params.listingId },
      transactionHash: onChainResult.transactionHash,
    };
  } catch (error) {
    console.error("[cancelListing] Error:", error);
    return {
      success: false,
      error: parseErrorMessage(error),
    };
  }
}

// =============================================================================
// Cancel Offer
// =============================================================================

/**
 * Cancel an active offer
 *
 * @param offerId - The offer ID to cancel
 * @param account - Connected wallet account
 * @returns Result with success status, or error
 */
export async function cancelOffer(
  offerId: string,
  account: Account
): Promise<ActionResult<{ offerId: string }>> {
  try {
    // Step 1: Cancel on-chain
    const onChainResult = await cancelNftOffer(offerId, account);

    // Step 2: Update database
    try {
      const dbResponse = await fetch(`/api/marketplace/offers/${offerId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!dbResponse.ok) {
        console.error("[cancelOffer] Database update failed, but on-chain succeeded");
      }
    } catch (dbError) {
      console.error("[cancelOffer] Database update exception:", dbError);
    }

    return {
      success: true,
      data: { offerId },
      transactionHash: onChainResult.transactionHash,
    };
  } catch (error) {
    console.error("[cancelOffer] Error:", error);
    return {
      success: false,
      error: parseErrorMessage(error),
    };
  }
}

// =============================================================================
// Accept Offer
// =============================================================================

/**
 * Accept an offer on an NFT you own
 *
 * @param offerId - The offer ID to accept
 * @param account - Connected wallet account
 * @returns Result with transaction hash, or error
 */
export async function acceptOffer(
  offerId: string,
  account: Account
): Promise<ActionResult<{ offerId: string; transactionHash: string }>> {
  try {
    // Step 1: Accept on-chain
    const onChainResult = await acceptNftOffer(offerId, account);

    // Step 2: Update database
    try {
      const dbResponse = await fetch(`/api/marketplace/offers/${offerId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionHash: onChainResult.transactionHash,
        }),
      });

      if (!dbResponse.ok) {
        console.error("[acceptOffer] Database update failed, but on-chain succeeded");
      }
    } catch (dbError) {
      console.error("[acceptOffer] Database update exception:", dbError);
    }

    return {
      success: true,
      data: {
        offerId,
        transactionHash: onChainResult.transactionHash,
      },
      transactionHash: onChainResult.transactionHash,
    };
  } catch (error) {
    console.error("[acceptOffer] Error:", error);
    return {
      success: false,
      error: parseErrorMessage(error),
    };
  }
}

// =============================================================================
// Transfer NFT
// =============================================================================

/**
 * Transfer an NFT to another address
 *
 * @param params - Transfer parameters
 * @param account - Connected wallet account
 * @returns Result with transaction hash, or error
 */
export async function transferNFT(
  params: TransferNFTParams,
  account: Account
): Promise<ActionResult<TransferNFTResult>> {
  try {
    // Execute on-chain transfer
    const onChainResult = await transferNFTOnChain(
      {
        assetContractAddress: params.contractAddress,
        tokenId: params.tokenId,
        toAddress: params.toAddress,
      },
      account
    );

    // Update database ownership if we have nftId
    if (params.nftId) {
      try {
        const dbResponse = await fetch(`/api/user/nfts/${params.nftId}/transfer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            newOwnerAddress: params.toAddress,
            transactionHash: onChainResult.transactionHash,
          }),
        });

        if (!dbResponse.ok) {
          console.error("[transferNFT] Database update failed, but on-chain succeeded");
        }
      } catch (dbError) {
        console.error("[transferNFT] Database update exception:", dbError);
      }
    }

    return {
      success: true,
      data: {
        transactionHash: onChainResult.transactionHash,
      },
      transactionHash: onChainResult.transactionHash,
    };
  } catch (error) {
    console.error("[transferNFT] Error:", error);
    return {
      success: false,
      error: parseErrorMessage(error),
    };
  }
}

// =============================================================================
// Bulk Operations
// =============================================================================

/**
 * Bulk list multiple NFTs
 *
 * @param items - Array of NFTs to list with their prices
 * @param account - Connected wallet account
 * @param onProgress - Callback for progress updates
 * @returns Array of results for each NFT
 */
export async function bulkListNFTs(
  items: Array<ListNFTParams>,
  account: Account,
  onProgress?: (completed: number, total: number, current: ListNFTParams) => void
): Promise<Array<ActionResult<ListNFTResult> & { nftId: string }>> {
  const results: Array<ActionResult<ListNFTResult> & { nftId: string }> = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    onProgress?.(i, items.length, item);

    const result = await listNFT(item, account);
    results.push({ ...result, nftId: item.nftId });
  }

  return results;
}

/**
 * Bulk cancel multiple listings
 *
 * @param listingIds - Array of listing IDs to cancel
 * @param account - Connected wallet account
 * @param onProgress - Callback for progress updates
 * @returns Array of results for each listing
 */
export async function bulkCancelListings(
  listingIds: string[],
  account: Account,
  onProgress?: (completed: number, total: number, current: string) => void
): Promise<Array<ActionResult<{ listingId: string }> & { listingId: string }>> {
  const results: Array<ActionResult<{ listingId: string }> & { listingId: string }> = [];

  for (let i = 0; i < listingIds.length; i++) {
    const listingId = listingIds[i];
    onProgress?.(i, listingIds.length, listingId);

    const result = await cancelListing({ listingId }, account);
    results.push({ ...result, listingId });
  }

  return results;
}

/**
 * Bulk transfer multiple NFTs to the same address
 *
 * @param items - Array of NFTs to transfer
 * @param toAddress - Destination address
 * @param account - Connected wallet account
 * @param onProgress - Callback for progress updates
 * @returns Array of results for each transfer
 */
export async function bulkTransferNFTs(
  items: Array<{ contractAddress: string; tokenId: string; nftId?: string }>,
  toAddress: string,
  account: Account,
  onProgress?: (completed: number, total: number, current: typeof items[0]) => void
): Promise<Array<ActionResult<TransferNFTResult> & { tokenId: string }>> {
  const results: Array<ActionResult<TransferNFTResult> & { tokenId: string }> = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    onProgress?.(i, items.length, item);

    const result = await transferNFT({ ...item, toAddress }, account);
    results.push({ ...result, tokenId: item.tokenId });
  }

  return results;
}
