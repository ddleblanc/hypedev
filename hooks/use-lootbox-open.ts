"use client";

import { useState, useCallback } from "react";
import type { Account } from "thirdweb/wallets";
import {
  openLootbox,
  waitForLootboxResult,
  getLootboxBalance,
} from "@/lib/lootbox-contracts";

export interface LootboxReward {
  id: string;
  name: string;
  image: string;
  rarity: string;
  nftContractAddress: string;
  nftTokenId: string;
}

// Error types for better UX
export type LootboxErrorType =
  | "vrf_timeout"
  | "vrf_underfunded"
  | "insufficient_balance"
  | "transaction_failed"
  | "network_error"
  | "unknown";

export interface LootboxError {
  type: LootboxErrorType;
  title: string;
  message: string;
  suggestion?: string;
  technical?: string;
}

// User-friendly error messages
const ERROR_MESSAGES: Record<LootboxErrorType, Omit<LootboxError, "type" | "technical">> = {
  vrf_timeout: {
    title: "Opening Delayed",
    message: "The random number generation is taking longer than expected. This can happen during high network activity.",
    suggestion: "Your lootbox is safe. Please try again in a few minutes, or check back later - it may complete automatically.",
  },
  vrf_underfunded: {
    title: "System Maintenance Required",
    message: "The lootbox system is temporarily unable to process openings.",
    suggestion: "Please try again later. Our team has been notified and is working on it.",
  },
  insufficient_balance: {
    title: "No Lootboxes Available",
    message: "You don't have any of this lootbox type to open.",
    suggestion: "Purchase a lootbox first, then come back to open it.",
  },
  transaction_failed: {
    title: "Transaction Failed",
    message: "The blockchain transaction couldn't be completed.",
    suggestion: "Please check your wallet has enough ETH for gas fees and try again.",
  },
  network_error: {
    title: "Connection Issue",
    message: "We couldn't connect to the blockchain network.",
    suggestion: "Please check your internet connection and try again.",
  },
  unknown: {
    title: "Something Went Wrong",
    message: "An unexpected error occurred while opening your lootbox.",
    suggestion: "Please try again. If the problem persists, contact support.",
  },
};

function classifyError(error: Error | string): LootboxError {
  const message = typeof error === "string" ? error : error.message;
  const lowerMessage = message.toLowerCase();

  let type: LootboxErrorType = "unknown";

  if (lowerMessage.includes("vrf fulfillment timeout") || lowerMessage.includes("timeout")) {
    type = "vrf_timeout";
  } else if (lowerMessage.includes("insufficient") && lowerMessage.includes("link")) {
    type = "vrf_underfunded";
  } else if (lowerMessage.includes("balance") || lowerMessage.includes("don't own") || lowerMessage.includes("no lootbox")) {
    type = "insufficient_balance";
  } else if (lowerMessage.includes("user rejected") || lowerMessage.includes("denied") || lowerMessage.includes("cancelled")) {
    return {
      type: "transaction_failed",
      title: "Transaction Cancelled",
      message: "You cancelled the transaction in your wallet.",
      suggestion: "Click 'Open' again when you're ready.",
      technical: message,
    };
  } else if (lowerMessage.includes("revert") || lowerMessage.includes("execution reverted")) {
    type = "transaction_failed";
  } else if (lowerMessage.includes("network") || lowerMessage.includes("fetch") || lowerMessage.includes("connection")) {
    type = "network_error";
  }

  return {
    type,
    ...ERROR_MESSAGES[type],
    technical: message,
  };
}

export interface OpeningState {
  status: "idle" | "opening" | "waiting_vrf" | "revealed" | "error";
  progress: number;
  statusMessage: string;
  reward: LootboxReward | null; // Legacy single reward for backwards compatibility
  rewards: LootboxReward[]; // Multi-reward support
  rewardsCount: number; // Expected number of rewards
  bestRarityTier: string | null; // Best rarity from all rewards
  error: LootboxError | null;
  txHash: string | null;
  vrfRequestId: bigint | null;
}

const INITIAL_STATE: OpeningState = {
  status: "idle",
  progress: 0,
  statusMessage: "",
  reward: null,
  rewards: [],
  rewardsCount: 1,
  bestRarityTier: null,
  error: null,
  txHash: null,
  vrfRequestId: null,
};

export function useLootboxOpen() {
  const [state, setState] = useState<OpeningState>(INITIAL_STATE);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const openLootboxWithVRF = useCallback(
    async (
      account: Account,
      lootboxId: number,
      onChainLootboxId: number
    ): Promise<LootboxReward | null> => {
      try {
        // Step 1: Initiate opening
        setState({
          ...INITIAL_STATE,
          status: "opening",
          progress: 10,
          statusMessage: "Initiating lootbox opening...",
        });

        // Call the contract
        const { requestId, txHash } = await openLootbox(account, onChainLootboxId);

        setState((prev) => ({
          ...prev,
          status: "waiting_vrf",
          progress: 30,
          statusMessage: "Waiting for Chainlink VRF randomness...",
          txHash,
          vrfRequestId: requestId,
        }));

        // Record opening in database
        try {
          await fetch(`/api/lootboxes/${lootboxId}/open`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              vrfRequestId: requestId.toString(),
              txHash,
              openerWalletAddress: account.address,
            }),
          });
        } catch (dbError) {
          console.error("Failed to record opening:", dbError);
          // Continue anyway - on-chain is source of truth
        }

        // Step 2: Wait for VRF fulfillment
        setState((prev) => ({
          ...prev,
          progress: 50,
          statusMessage: "Random number being generated...",
        }));

        const result = await waitForLootboxResult(requestId, 3000, 120000);

        if (!result.fulfilled) {
          throw new Error("VRF fulfillment timeout");
        }

        setState((prev) => ({
          ...prev,
          progress: 80,
          statusMessage: "Reward revealed! Fetching details...",
        }));

        // Step 3: Fetch reward details from API
        const openingResponse = await fetch(
          `/api/lootboxes/${lootboxId}/open?vrfRequestId=${requestId.toString()}`
        );
        const openingData = await openingResponse.json();

        // Handle multi-reward response (rewards array) or legacy single reward
        const apiRewards = openingData.opening?.rewards || [];
        const legacyReward = openingData.opening?.reward;

        if (!openingData.success || (apiRewards.length === 0 && !legacyReward)) {
          throw new Error("Could not fetch reward details");
        }

        // Build rewards array
        const rewards: LootboxReward[] = apiRewards.length > 0
          ? apiRewards.map((r: any) => ({
              id: r.id,
              name: r.name,
              image: r.image,
              rarity: r.rarity,
              nftContractAddress: r.nftContractAddress,
              nftTokenId: r.nftTokenId,
            }))
          : legacyReward
            ? [{
                id: legacyReward.id,
                name: legacyReward.name,
                image: legacyReward.image,
                rarity: legacyReward.rarity,
                nftContractAddress: legacyReward.nftContractAddress,
                nftTokenId: legacyReward.nftTokenId,
              }]
            : [];

        // Use first reward for legacy compatibility
        const primaryReward = rewards[0] || null;

        setState({
          status: "revealed",
          progress: 100,
          statusMessage: rewards.length > 1 ? `${rewards.length} rewards claimed!` : "Reward claimed!",
          reward: primaryReward,
          rewards,
          rewardsCount: openingData.opening?.rewardsCount || rewards.length,
          bestRarityTier: openingData.opening?.bestRarityTier || primaryReward?.rarity || null,
          error: null,
          txHash,
          vrfRequestId: requestId,
        });

        return primaryReward;
      } catch (error: any) {
        console.error("Lootbox open error:", error);
        const classifiedError = classifyError(error);
        setState((prev) => ({
          ...prev,
          status: "error",
          error: classifiedError,
          statusMessage: classifiedError.title,
        }));
        return null;
      }
    },
    []
  );

  // Fetch user's lootbox balances
  const fetchUserLootboxes = useCallback(
    async (address: string): Promise<any[]> => {
      try {
        const response = await fetch(
          `/api/lootboxes/user/inventory?address=${address}`
        );
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error);
        }

        // Return lootboxes with balance > 0
        return data.inventory?.filter((lb: any) => lb.balance > 0) || [];
      } catch (error) {
        console.error("Failed to fetch user lootboxes:", error);
        return [];
      }
    },
    []
  );

  return {
    state,
    reset,
    openLootboxWithVRF,
    fetchUserLootboxes,
  };
}

// Helper to check if the lootbox contract is available
export async function isLootboxSystemAvailable(): Promise<boolean> {
  try {
    const { isContractDeployed } = await import("@/lib/lootbox-contracts");
    return await isContractDeployed();
  } catch {
    return false;
  }
}
