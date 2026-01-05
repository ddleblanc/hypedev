/**
 * Lootbox Contract Integration Library
 *
 * Provides functions to interact with the LootboxVRF smart contract.
 * Uses Thirdweb v5 SDK for all blockchain interactions.
 *
 * Features:
 * - Create lootboxes with custom pricing and supply
 * - Deposit ERC721/ERC1155 NFTs as rewards
 * - Purchase and open lootboxes
 * - Poll for Chainlink VRF fulfillment
 * - Automatic rarity calculation based on deposited rewards
 */

import {
  getContract,
  prepareContractCall,
  sendTransaction,
  readContract,
  waitForReceipt,
} from "thirdweb";
import { approve as approveERC721 } from "thirdweb/extensions/erc721";
import { setApprovalForAll as setApprovalForAllERC1155 } from "thirdweb/extensions/erc1155";
import { client } from "./thirdweb";
import { defineChain } from "thirdweb/chains";
import type { Account } from "thirdweb/wallets";
import { parseEther, formatEther } from "viem";
import { calculateLootboxRarity, type DatabaseRarityTier, type RarityTier } from "./lootbox-utils";
import { stringify as superjsonStringify } from "./superjson";

// ============ Configuration ============

// Chain configuration (Sepolia for testnet)
const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID || "11155111";
const chain = defineChain({
  id: parseInt(CHAIN_ID),
  rpc: "https://ethereum-sepolia-rpc.publicnode.com",
});

// Chainlink VRF V2.5 Sepolia Configuration
export const CHAINLINK_VRF_CONFIG = {
  vrfCoordinator: "0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B",
  keyHash: "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae",
  subscriptionId: process.env.NEXT_PUBLIC_CHAINLINK_VRF_SUBSCRIPTION_ID || "0",
};

// Lootbox contract address (set after deployment)
export const LOOTBOX_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_LOOTBOX_CONTRACT_ADDRESS || "";

// ============ Rarity Enum Mapping ============

/**
 * Maps rarity string to Solidity enum value
 * Rarity enum: COMMON=0, RARE=1, EPIC=2, LEGENDARY=3, HYPER=4
 */
export function rarityToEnumValue(rarity: string): number {
  const mapping: Record<string, number> = {
    common: 0,
    rare: 1,
    epic: 2,
    legendary: 3,
    hyper: 4,
  };
  return mapping[rarity.toLowerCase()] ?? 0;
}

/**
 * Maps Solidity enum value to rarity string
 */
export function enumValueToRarity(value: number): RarityTier {
  const mapping: RarityTier[] = ["common", "rare", "epic", "legendary", "hyper"];
  return mapping[value] ?? "common";
}

// ============ Contract Getter ============

export function getLootboxContract() {
  if (!LOOTBOX_CONTRACT_ADDRESS) {
    throw new Error(
      "NEXT_PUBLIC_LOOTBOX_CONTRACT_ADDRESS not set. Please deploy the LootboxVRF contract first."
    );
  }
  return getContract({
    client,
    chain,
    address: LOOTBOX_CONTRACT_ADDRESS,
  });
}

function getNFTContract(address: string) {
  return getContract({
    client,
    chain,
    address,
  });
}

/**
 * Verify that the user owns an ERC721 token
 * Returns true if owned, false otherwise
 */
export async function verifyERC721Ownership(
  nftContractAddress: string,
  tokenId: bigint,
  expectedOwner: string
): Promise<{ owned: boolean; actualOwner?: string; error?: string }> {
  try {
    const nftContract = getNFTContract(nftContractAddress);
    const owner = await readContract({
      contract: nftContract,
      method: "function ownerOf(uint256 tokenId) view returns (address)",
      params: [tokenId],
    });
    const owned = owner.toLowerCase() === expectedOwner.toLowerCase();
    return { owned, actualOwner: owner };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    // Token doesn't exist
    if (errorMessage.includes("OwnerQueryForNonexistentToken") ||
        errorMessage.includes("ERC721NonexistentToken") ||
        errorMessage.includes("invalid token ID")) {
      return { owned: false, error: "Token does not exist" };
    }
    return { owned: false, error: errorMessage };
  }
}

/**
 * Verify ownership for multiple NFTs before deployment
 * Returns list of NFTs that failed verification
 */
export async function verifyNFTOwnership(
  ownerAddress: string,
  nfts: Array<{
    contractAddress: string;
    tokenId: string;
    tokenType: "ERC721" | "ERC1155";
    name: string;
  }>
): Promise<{
  valid: boolean;
  failed: Array<{ name: string; contractAddress: string; tokenId: string; reason: string }>;
}> {
  const failed: Array<{ name: string; contractAddress: string; tokenId: string; reason: string }> = [];

  for (const nft of nfts) {
    if (nft.tokenType === "ERC721") {
      let numericTokenId: bigint;
      try {
        const tokenIdStr = nft.tokenId.includes("-")
          ? nft.tokenId.split("-")[0]
          : nft.tokenId;
        numericTokenId = BigInt(tokenIdStr);
      } catch {
        failed.push({
          name: nft.name,
          contractAddress: nft.contractAddress,
          tokenId: nft.tokenId,
          reason: "Invalid token ID format",
        });
        continue;
      }

      const result = await verifyERC721Ownership(
        nft.contractAddress,
        numericTokenId,
        ownerAddress
      );

      if (!result.owned) {
        // Ensure reason is a string, not an object
        let reason = "Not owned by you";
        if (result.error) {
          reason = typeof result.error === 'string'
            ? result.error
            : JSON.stringify(result.error);
        }
        failed.push({
          name: nft.name,
          contractAddress: nft.contractAddress,
          tokenId: nft.tokenId,
          reason,
        });
      }
    }
    // For ERC1155, we'd need to check balanceOf - skip for now as most are ERC721
  }

  return {
    valid: failed.length === 0,
    failed,
  };
}

// ============ Types ============

export interface LootboxInfo {
  id: number;
  creator: string;
  price: bigint;
  priceEth: string;
  totalSupply: number;
  remaining: number;
  active: boolean;
  uri: string;
  rarity: RarityTier;
  rarityValue: number;
  rewardsPerOpening: number;
}

export interface DepositedReward {
  nftContract: string;
  tokenId: bigint;
  tokenType: "ERC721" | "ERC1155";
  amount: number;
  weight: number;
  rarity: RarityTier;
  rarityValue: number;
  claimed: boolean;
}

export interface OpenRequest {
  opener: string;
  lootboxId: number;
  fulfilled: boolean;
  rewardsCount: number;
}

export interface OpenRequestResult extends OpenRequest {
  rewardIndices: number[];
}

export interface RewardConfig {
  nftContract: string;
  tokenId: bigint;
  tokenType: "ERC721" | "ERC1155";
  amount?: number; // For ERC1155
  weight: number;
  rarity: RarityTier;
}

// ============ Creator Functions ============

/**
 * Create a new lootbox on-chain
 * @param account - The connected wallet account
 * @param price - Price per lootbox in ETH (as string, e.g., "0.01")
 * @param totalSupply - Total number of lootboxes to create
 * @param lootboxUri - Metadata URI for the lootbox
 * @param rewardsPerOpening - Number of rewards per opening (1-10, default 1)
 * @returns The created lootbox ID and transaction hash
 *
 * @note Rarity is automatically calculated when rewards are deposited
 */
export async function createLootboxOnChain(
  account: Account,
  price: string,
  totalSupply: number,
  lootboxUri: string,
  rewardsPerOpening: number = 1
): Promise<{ lootboxId: number; txHash: string }> {
  const contract = getLootboxContract();
  const priceWei = parseEther(price);

  // Validate rewardsPerOpening (1-10)
  const rewardsCount = Math.max(1, Math.min(10, rewardsPerOpening));

  // Debug: Check account nonce
  const accountAddress = account.address;
  console.log("[createLootboxOnChain] Account address:", accountAddress);

  try {
    const nonceResponse = await fetch(
      `https://ethereum-sepolia-rpc.publicnode.com`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_getTransactionCount",
          params: [accountAddress, "latest"],
          id: 1,
        }),
      }
    );
    const nonceData = await nonceResponse.json();
    console.log("[createLootboxOnChain] Current nonce from RPC:", parseInt(nonceData.result, 16));
  } catch (e) {
    console.log("[createLootboxOnChain] Failed to fetch nonce:", e);
  }

  console.log(
    "[createLootboxOnChain] Creating lootbox with params:",
    superjsonStringify({
      price,
      priceWei,
      totalSupply,
      lootboxUri: lootboxUri.slice(0, 50) + (lootboxUri.length > 50 ? "..." : ""),
      rewardsCount,
      contractAddress: LOOTBOX_CONTRACT_ADDRESS,
    })
  );

  const transaction = prepareContractCall({
    contract,
    method:
      "function createLootbox(uint256 price, uint256 totalSupply, string lootboxUri, uint8 rewardsPerOpening) returns (uint256)",
    params: [priceWei, BigInt(totalSupply), lootboxUri, rewardsCount],
    // Explicit gas limit to avoid estimation issues
    gas: BigInt(500000),
  });

  const result = await sendTransaction({ account, transaction });
  const receipt = await waitForReceipt({ client, chain, transactionHash: result.transactionHash });

  // Parse lootboxId from LootboxCreated event
  let lootboxId = 0;
  if (receipt.logs && receipt.logs.length > 0) {
    // The first indexed parameter in the event is lootboxId
    const lootboxCreatedEvent = receipt.logs.find((log) => log.topics.length >= 2);
    const topic = lootboxCreatedEvent?.topics[1];
    if (topic) {
      lootboxId = Number(BigInt(topic));
    }
  }

  // Fallback: read nextLootboxId - 1
  if (lootboxId === 0) {
    const nextId = await readContract({
      contract,
      method: "function nextLootboxId() view returns (uint256)",
      params: [],
    });
    lootboxId = Number(nextId) - 1;
  }

  return { lootboxId, txHash: result.transactionHash };
}

/**
 * Approve an ERC721 NFT for deposit into the lootbox contract
 */
export async function approveERC721ForDeposit(
  account: Account,
  nftContractAddress: string,
  tokenId: bigint
) {
  const nftContract = getNFTContract(nftContractAddress);
  const transaction = approveERC721({
    contract: nftContract,
    to: LOOTBOX_CONTRACT_ADDRESS,
    tokenId,
  });
  const result = await sendTransaction({ account, transaction });
  await waitForReceipt({ client, chain, transactionHash: result.transactionHash });
  return result;
}

/**
 * Approve an ERC1155 collection for deposit (setApprovalForAll)
 */
export async function approveERC1155ForDeposit(
  account: Account,
  nftContractAddress: string
) {
  const nftContract = getNFTContract(nftContractAddress);
  const transaction = setApprovalForAllERC1155({
    contract: nftContract,
    operator: LOOTBOX_CONTRACT_ADDRESS,
    approved: true,
  });
  const result = await sendTransaction({ account, transaction });
  await waitForReceipt({ client, chain, transactionHash: result.transactionHash });
  return result;
}

/**
 * Deposit an ERC721 NFT as a lootbox reward
 * @note This will trigger automatic rarity recalculation
 */
export async function depositERC721Reward(
  account: Account,
  lootboxId: number,
  nftContract: string,
  tokenId: bigint,
  weight: number,
  rarity: RarityTier
) {
  const contract = getLootboxContract();
  const rarityValue = rarityToEnumValue(rarity);

  const transaction = prepareContractCall({
    contract,
    method:
      "function depositERC721Reward(uint256 lootboxId, address nftContract, uint256 tokenId, uint256 weight, uint8 rarity)",
    params: [BigInt(lootboxId), nftContract, tokenId, BigInt(weight), rarityValue],
  });
  const result = await sendTransaction({ account, transaction });
  await waitForReceipt({ client, chain, transactionHash: result.transactionHash });
  return result;
}

/**
 * Deposit ERC1155 tokens as lootbox rewards
 * @note This will trigger automatic rarity recalculation
 */
export async function depositERC1155Reward(
  account: Account,
  lootboxId: number,
  nftContract: string,
  tokenId: bigint,
  amount: number,
  weight: number,
  rarity: RarityTier
) {
  const contract = getLootboxContract();
  const rarityValue = rarityToEnumValue(rarity);

  const transaction = prepareContractCall({
    contract,
    method:
      "function depositERC1155Reward(uint256 lootboxId, address nftContract, uint256 tokenId, uint256 amount, uint256 weight, uint8 rarity)",
    params: [
      BigInt(lootboxId),
      nftContract,
      tokenId,
      BigInt(amount),
      BigInt(weight),
      rarityValue,
    ],
  });
  const result = await sendTransaction({ account, transaction });
  await waitForReceipt({ client, chain, transactionHash: result.transactionHash });
  return result;
}

/**
 * Activate a lootbox after depositing all rewards
 */
export async function activateLootbox(account: Account, lootboxId: number) {
  const contract = getLootboxContract();
  const transaction = prepareContractCall({
    contract,
    method: "function activateLootbox(uint256 lootboxId)",
    params: [BigInt(lootboxId)],
  });
  const result = await sendTransaction({ account, transaction });
  await waitForReceipt({ client, chain, transactionHash: result.transactionHash });
  return result;
}

/**
 * Withdraw unclaimed rewards from a lootbox
 */
export async function withdrawUnclaimedRewards(account: Account, lootboxId: number) {
  const contract = getLootboxContract();
  const transaction = prepareContractCall({
    contract,
    method: "function withdrawUnclaimedRewards(uint256 lootboxId)",
    params: [BigInt(lootboxId)],
  });
  const result = await sendTransaction({ account, transaction });
  await waitForReceipt({ client, chain, transactionHash: result.transactionHash });
  return result;
}

// ============ User Functions ============

/**
 * Purchase lootboxes with ETH
 */
export async function purchaseLootbox(
  account: Account,
  lootboxId: number,
  quantity: number,
  pricePerUnit: bigint
) {
  const contract = getLootboxContract();
  const totalValue = pricePerUnit * BigInt(quantity);

  const transaction = prepareContractCall({
    contract,
    method: "function purchaseLootbox(uint256 lootboxId, uint256 quantity) payable",
    params: [BigInt(lootboxId), BigInt(quantity)],
    value: totalValue,
  });

  const result = await sendTransaction({ account, transaction });
  await waitForReceipt({ client, chain, transactionHash: result.transactionHash });
  return result;
}

/**
 * Open a lootbox - triggers Chainlink VRF
 * @returns The VRF request ID for polling
 */
export async function openLootbox(
  account: Account,
  lootboxId: number
): Promise<{ requestId: bigint; txHash: string }> {
  const contract = getLootboxContract();

  const transaction = prepareContractCall({
    contract,
    method: "function openLootbox(uint256 lootboxId) returns (uint256)",
    params: [BigInt(lootboxId)],
  });

  const result = await sendTransaction({ account, transaction });
  const receipt = await waitForReceipt({ client, chain, transactionHash: result.transactionHash });

  // Parse requestId from LootboxOpenRequested event
  let requestId = BigInt(0);
  if (receipt.logs && receipt.logs.length > 0) {
    const openRequestedEvent = receipt.logs.find((log) => log.topics.length >= 3);
    const topic = openRequestedEvent?.topics[1];
    if (topic) {
      requestId = BigInt(topic);
    }
  }

  return { requestId, txHash: result.transactionHash };
}

/**
 * Poll for VRF fulfillment
 * @param requestId - The VRF request ID from openLootbox
 * @returns The open request status
 */
export async function getOpenRequestStatus(requestId: bigint): Promise<OpenRequest> {
  const contract = getLootboxContract();
  const result = await readContract({
    contract,
    method:
      "function getOpenRequest(uint256) view returns (address opener, uint256 lootboxId, bool fulfilled, uint8 rewardsCount)",
    params: [requestId],
  });

  return {
    opener: result[0],
    lootboxId: Number(result[1]),
    fulfilled: result[2],
    rewardsCount: Number(result[3]),
  };
}

/**
 * Get the reward indices for a fulfilled VRF request
 * @param requestId - The VRF request ID
 * @returns Array of reward indices that were selected
 */
export async function getOpenRequestRewardIndices(requestId: bigint): Promise<number[]> {
  const contract = getLootboxContract();
  const result = await readContract({
    contract,
    method: "function getOpenRequestRewardIndices(uint256) view returns (uint256[])",
    params: [requestId],
  });

  return (result as bigint[]).map((idx) => Number(idx));
}

/**
 * Get full open request result including reward indices
 * @param requestId - The VRF request ID
 * @returns The open request with reward indices
 */
export async function getOpenRequestResult(requestId: bigint): Promise<OpenRequestResult> {
  const [status, indices] = await Promise.all([
    getOpenRequestStatus(requestId),
    getOpenRequestRewardIndices(requestId),
  ]);

  return {
    ...status,
    rewardIndices: indices,
  };
}

/**
 * Wait for VRF fulfillment with polling
 * @param requestId - The VRF request ID
 * @param pollInterval - Polling interval in ms (default 3000)
 * @param timeout - Maximum wait time in ms (default 120000)
 * @returns The full open request result with reward indices
 */
export async function waitForLootboxResult(
  requestId: bigint,
  pollInterval = 3000,
  timeout = 120000
): Promise<OpenRequestResult> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const status = await getOpenRequestStatus(requestId);
    if (status.fulfilled) {
      // Fetch reward indices now that it's fulfilled
      const indices = await getOpenRequestRewardIndices(requestId);
      return {
        ...status,
        rewardIndices: indices,
      };
    }
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error("VRF fulfillment timeout - please check Chainlink VRF subscription");
}

// ============ View Functions ============

/**
 * Get lootbox details including calculated rarity
 */
export async function getLootboxInfo(lootboxId: number): Promise<LootboxInfo> {
  const contract = getLootboxContract();
  const result = await readContract({
    contract,
    method:
      "function getLootboxInfo(uint256) view returns (address creator, uint256 price, uint256 totalSupply, uint256 remaining, bool active, string lootboxUri, uint8 rarity, uint8 rewardsPerOpening)",
    params: [BigInt(lootboxId)],
  });

  const rarityValue = Number(result[6]);
  const rarity = enumValueToRarity(rarityValue);

  return {
    id: lootboxId,
    creator: result[0],
    price: result[1],
    priceEth: formatEther(result[1]),
    totalSupply: Number(result[2]),
    remaining: Number(result[3]),
    active: result[4],
    uri: result[5],
    rarity,
    rarityValue,
    rewardsPerOpening: Number(result[7]),
  };
}

/**
 * Get the current rarity score for a lootbox
 * @returns Score from 100 (common) to 500 (hyper)
 */
export async function getLootboxRarityScore(lootboxId: number): Promise<number> {
  const contract = getLootboxContract();
  const result = await readContract({
    contract,
    method: "function getLootboxRarityScore(uint256) view returns (uint256)",
    params: [BigInt(lootboxId)],
  });
  return Number(result);
}

/**
 * Get user's lootbox balance
 */
export async function getLootboxBalance(
  address: string,
  lootboxId: number
): Promise<number> {
  const contract = getLootboxContract();
  const result = await readContract({
    contract,
    method: "function balanceOf(address, uint256) view returns (uint256)",
    params: [address, BigInt(lootboxId)],
  });
  return Number(result);
}

// Type for reward struct returned from contract
type RewardStruct = {
  nftContract: string;
  tokenId: bigint;
  tokenType: number;
  amount: bigint;
  weight: bigint;
  rarity: number;
  claimed: boolean;
};

/**
 * Get all rewards for a lootbox
 */
export async function getLootboxRewards(lootboxId: number): Promise<DepositedReward[]> {
  const contract = getLootboxContract();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (await readContract({
    contract,
    method: {
      type: "function",
      name: "getLootboxRewards",
      inputs: [{ type: "uint256", name: "lootboxId" }],
      outputs: [
        {
          type: "tuple[]",
          components: [
            { type: "address", name: "nftContract" },
            { type: "uint256", name: "tokenId" },
            { type: "uint8", name: "tokenType" },
            { type: "uint256", name: "amount" },
            { type: "uint256", name: "weight" },
            { type: "uint8", name: "rarity" },
            { type: "bool", name: "claimed" },
          ],
        },
      ],
      stateMutability: "view",
    },
    params: [BigInt(lootboxId)],
  })) as RewardStruct[];

  return result.map((r) => {
    const rarityValue = Number(r.rarity);
    return {
      nftContract: r.nftContract,
      tokenId: r.tokenId,
      tokenType: r.tokenType === 0 ? "ERC721" : "ERC1155",
      amount: Number(r.amount),
      weight: Number(r.weight),
      rarity: enumValueToRarity(rarityValue),
      rarityValue,
      claimed: r.claimed,
    };
  });
}

/**
 * Get available (unclaimed) rewards for a lootbox
 */
export async function getAvailableRewards(lootboxId: number): Promise<DepositedReward[]> {
  const contract = getLootboxContract();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (await readContract({
    contract,
    method: {
      type: "function",
      name: "getAvailableRewards",
      inputs: [{ type: "uint256", name: "lootboxId" }],
      outputs: [
        {
          type: "tuple[]",
          components: [
            { type: "address", name: "nftContract" },
            { type: "uint256", name: "tokenId" },
            { type: "uint8", name: "tokenType" },
            { type: "uint256", name: "amount" },
            { type: "uint256", name: "weight" },
            { type: "uint8", name: "rarity" },
            { type: "bool", name: "claimed" },
          ],
        },
      ],
      stateMutability: "view",
    },
    params: [BigInt(lootboxId)],
  })) as RewardStruct[];

  return result.map((r) => {
    const rarityValue = Number(r.rarity);
    return {
      nftContract: r.nftContract,
      tokenId: r.tokenId,
      tokenType: r.tokenType === 0 ? "ERC721" : "ERC1155",
      amount: Number(r.amount),
      weight: Number(r.weight),
      rarity: enumValueToRarity(rarityValue),
      rarityValue,
      claimed: r.claimed,
    };
  });
}

/**
 * Get the next lootbox ID that will be created
 */
export async function getNextLootboxId(): Promise<number> {
  const contract = getLootboxContract();
  const result = await readContract({
    contract,
    method: "function nextLootboxId() view returns (uint256)",
    params: [],
  });
  return Number(result);
}

// ============ Full Deployment Flow ============

export interface DeployLootboxConfig {
  name: string;
  price: string; // ETH amount as string
  supply: number;
  metadataUri: string;
  rewardsPerOpening?: number; // 1-10, default 1
}

export type DeployProgressCallback = (step: string, progress: number) => void;

/**
 * Full deployment flow for Studio wizard
 * Creates lootbox, deposits all rewards, and activates
 * Rarity is automatically calculated based on deposited rewards
 */
export async function deployLootboxWithRewards(
  account: Account,
  config: DeployLootboxConfig,
  rewards: RewardConfig[],
  onProgress?: DeployProgressCallback
): Promise<{ lootboxId: number; txHash: string; calculatedRarity: DatabaseRarityTier }> {
  // Calculate what the rarity will be
  const calculatedRarity = calculateLootboxRarity(
    rewards.map((r) => ({ rarity: r.rarity, weight: r.weight }))
  );

  const rewardsPerOpening = config.rewardsPerOpening ?? 1;

  // Step 1: Create lootbox (rarity is calculated automatically after deposits)
  onProgress?.("Creating lootbox...", 10);
  const { lootboxId, txHash } = await createLootboxOnChain(
    account,
    config.price,
    config.supply,
    config.metadataUri,
    rewardsPerOpening
  );

  // Step 2: Approve and deposit each reward
  for (let i = 0; i < rewards.length; i++) {
    const reward = rewards[i];
    const progress = 10 + (80 * (i + 1)) / rewards.length;

    if (reward.tokenType === "ERC721") {
      onProgress?.(`Approving NFT ${i + 1}/${rewards.length}...`, progress - 5);
      await approveERC721ForDeposit(account, reward.nftContract, reward.tokenId);

      onProgress?.(`Depositing NFT ${i + 1}/${rewards.length}...`, progress);
      await depositERC721Reward(
        account,
        lootboxId,
        reward.nftContract,
        reward.tokenId,
        reward.weight,
        reward.rarity
      );
    } else {
      onProgress?.(`Approving NFT collection ${i + 1}/${rewards.length}...`, progress - 5);
      await approveERC1155ForDeposit(account, reward.nftContract);

      onProgress?.(`Depositing NFT ${i + 1}/${rewards.length}...`, progress);
      await depositERC1155Reward(
        account,
        lootboxId,
        reward.nftContract,
        reward.tokenId,
        reward.amount || 1,
        reward.weight,
        reward.rarity
      );
    }
  }

  // Step 3: Activate
  onProgress?.("Activating lootbox...", 95);
  await activateLootbox(account, lootboxId);

  onProgress?.("Complete!", 100);
  return { lootboxId, txHash, calculatedRarity };
}

// ============ Utility Functions ============

/**
 * Calculate drop probability percentages from weights
 */
export function calculateDropProbabilities(
  rewards: { weight: number; rarity: string }[]
): { rarity: string; probability: number }[] {
  const totalWeight = rewards.reduce((sum, r) => sum + r.weight, 0);
  if (totalWeight === 0) return rewards.map((r) => ({ rarity: r.rarity, probability: 0 }));

  // Group by rarity
  const rarityWeights = new Map<string, number>();
  for (const reward of rewards) {
    const current = rarityWeights.get(reward.rarity) || 0;
    rarityWeights.set(reward.rarity, current + reward.weight);
  }

  // Calculate percentages
  const result: { rarity: string; probability: number }[] = [];
  for (const [rarity, weight] of rarityWeights) {
    result.push({
      rarity,
      probability: (weight / totalWeight) * 100,
    });
  }

  return result.sort((a, b) => b.probability - a.probability);
}

/**
 * Check if contract is deployed and accessible
 */
export async function isContractDeployed(): Promise<boolean> {
  if (!LOOTBOX_CONTRACT_ADDRESS) return false;
  try {
    await getNextLootboxId();
    return true;
  } catch {
    return false;
  }
}
