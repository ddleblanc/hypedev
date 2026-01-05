/**
 * Lootbox Utility Functions
 *
 * Provides utility functions for lootbox rarity calculations and related operations.
 * The rarity system uses weighted scoring based on deposited reward rarities.
 *
 * IMPORTANT: There are TWO rarity systems in use:
 *
 * 1. CONTRACT RARITY (for Solidity smart contracts):
 *    common, rare, epic, legendary, hyper
 *    These map directly to Solidity enum values (0-4)
 *
 * 2. DATABASE RARITY (for Prisma/UI):
 *    common, rare, epic, mythic, cosmic
 *    These are stored in the database and displayed in the UI
 *
 * Use the mapping functions to convert between systems when needed.
 */

import { z } from "zod";

// ============ Types ============

/**
 * Contract rarity tiers - used for Solidity smart contract interactions.
 * Maps to enum values 0-4 in the smart contract.
 */
export const ContractRarityTier = z.enum(["common", "rare", "epic", "legendary", "hyper"]);
export type ContractRarityTier = z.infer<typeof ContractRarityTier>;

/**
 * Database rarity tiers - used for Prisma database and UI display.
 * These are the values stored in the database.
 */
export const DatabaseRarityTier = z.enum(["common", "rare", "epic", "mythic", "cosmic"]);
export type DatabaseRarityTier = z.infer<typeof DatabaseRarityTier>;

/**
 * @deprecated Use ContractRarityTier or DatabaseRarityTier instead.
 * Keeping for backwards compatibility - defaults to contract tier.
 */
export const RarityTier = ContractRarityTier;
export type RarityTier = ContractRarityTier;

export const RewardRarityInput = z.object({
  rarity: z.string(),
  weight: z.number().positive(),
});
export type RewardRarityInput = z.infer<typeof RewardRarityInput>;

// ============ Constants ============

/**
 * Rarity tier values used for weighted average calculation.
 * Higher value = more valuable rarity tier.
 * Supports BOTH contract and database rarity names.
 */
export const RARITY_VALUES: Record<string, number> = {
  // Contract rarity names
  hyper: 5,
  legendary: 4,
  // Database rarity names (same tier levels)
  cosmic: 5,
  mythic: 4,
  // Shared names
  epic: 3,
  rare: 2,
  common: 1,
} as const;

/**
 * Rarity tier thresholds for determining the lootbox tier.
 * Score ranges are exclusive on the lower end, inclusive on the upper end.
 */
export const RARITY_THRESHOLDS = {
  // Top tier (cosmic/hyper)
  cosmic: 4.5,
  hyper: 4.5,
  // Second tier (mythic/legendary)
  mythic: 3.5,
  legendary: 3.5,
  // Shared tiers
  epic: 2.5,
  rare: 1.5,
  common: 0,
} as const;

/**
 * Rarity tier display information for UI purposes.
 * Uses DATABASE rarity names (mythic, cosmic) for user-facing display.
 */
export const RARITY_DISPLAY: Record<
  string,
  { label: string; color: string; bgColor: string; description: string }
> = {
  common: {
    label: "Common",
    color: "text-gray-400",
    bgColor: "bg-gray-500",
    description: "Standard rewards",
  },
  rare: {
    label: "Rare",
    color: "text-blue-400",
    bgColor: "bg-blue-500",
    description: "Enhanced rewards",
  },
  epic: {
    label: "Epic",
    color: "text-purple-400",
    bgColor: "bg-purple-500",
    description: "Premium rewards",
  },
  mythic: {
    label: "Mythic",
    color: "text-orange-400",
    bgColor: "bg-orange-500",
    description: "Mythic rewards",
  },
  cosmic: {
    label: "Cosmic",
    color: "text-pink-400",
    bgColor: "bg-pink-500",
    description: "Ultimate rewards",
  },
  // Legacy contract names (for backwards compatibility)
  legendary: {
    label: "Legendary",
    color: "text-orange-400",
    bgColor: "bg-orange-500",
    description: "Legendary rewards",
  },
  hyper: {
    label: "Hyper",
    color: "text-pink-400",
    bgColor: "bg-pink-500",
    description: "Ultimate rewards",
  },
};

// ============ Rarity System Mapping ============

/**
 * Map database rarity to contract rarity.
 * Use when sending data to smart contracts.
 */
export function databaseToContractRarity(dbRarity: DatabaseRarityTier): ContractRarityTier {
  const mapping: Record<DatabaseRarityTier, ContractRarityTier> = {
    common: "common",
    rare: "rare",
    epic: "epic",
    mythic: "legendary",
    cosmic: "hyper",
  };
  return mapping[dbRarity];
}

/**
 * Map contract rarity to database rarity.
 * Use when reading data from smart contracts.
 */
export function contractToDatabaseRarity(contractRarity: ContractRarityTier): DatabaseRarityTier {
  const mapping: Record<ContractRarityTier, DatabaseRarityTier> = {
    common: "common",
    rare: "rare",
    epic: "epic",
    legendary: "mythic",
    hyper: "cosmic",
  };
  return mapping[contractRarity];
}

// ============ Rarity Calculation Functions ============

/**
 * Calculate the weighted average rarity score from rewards.
 *
 * Formula: boxRarityScore = Σ(itemRarityValue × itemWeight) / Σ(weights)
 *
 * @param rewards - Array of rewards with rarity and weight
 * @returns The weighted rarity score (1.0 to 5.0 scale)
 */
export function calculateRarityScore(
  rewards: RewardRarityInput[]
): number {
  if (rewards.length === 0) {
    return 1; // Default to common score
  }

  const totalWeight = rewards.reduce((sum, r) => sum + r.weight, 0);
  if (totalWeight === 0) {
    return 1; // Default to common score
  }

  const weightedSum = rewards.reduce((sum, r) => {
    const value = RARITY_VALUES[r.rarity.toLowerCase()] ?? 1;
    return sum + value * r.weight;
  }, 0);

  return weightedSum / totalWeight;
}

/**
 * Convert a rarity score to a DATABASE rarity tier.
 * Use this for database storage and UI display.
 *
 * Tier thresholds:
 * - 4.5+ → cosmic
 * - 3.5-4.49 → mythic
 * - 2.5-3.49 → epic
 * - 1.5-2.49 → rare
 * - <1.5 → common
 *
 * @param score - The weighted rarity score (1.0 to 5.0 scale)
 * @returns The database rarity tier string
 */
export function scoreToRarityTier(score: number): DatabaseRarityTier {
  if (score >= RARITY_THRESHOLDS.cosmic) return "cosmic";
  if (score >= RARITY_THRESHOLDS.mythic) return "mythic";
  if (score >= RARITY_THRESHOLDS.epic) return "epic";
  if (score >= RARITY_THRESHOLDS.rare) return "rare";
  return "common";
}

/**
 * Convert a rarity score to a CONTRACT rarity tier.
 * Use this for smart contract interactions.
 *
 * Tier thresholds:
 * - 4.5+ → hyper
 * - 3.5-4.49 → legendary
 * - 2.5-3.49 → epic
 * - 1.5-2.49 → rare
 * - <1.5 → common
 *
 * @param score - The weighted rarity score (1.0 to 5.0 scale)
 * @returns The contract rarity tier string
 */
export function scoreToContractRarityTier(score: number): ContractRarityTier {
  if (score >= RARITY_THRESHOLDS.hyper) return "hyper";
  if (score >= RARITY_THRESHOLDS.legendary) return "legendary";
  if (score >= RARITY_THRESHOLDS.epic) return "epic";
  if (score >= RARITY_THRESHOLDS.rare) return "rare";
  return "common";
}

/**
 * Calculate the lootbox rarity tier based on deposited rewards' rarities and weights.
 * Returns DATABASE rarity tier (common, rare, epic, mythic, cosmic).
 *
 * This function implements automatic rarity calculation to prevent deceptive practices
 * where creators could set a high rarity tier but fill with low-value rewards.
 *
 * Formula: boxRarity = Σ(itemRarityValue × itemWeight) / Σ(weights)
 *
 * Rarity values (supports both naming conventions):
 * - cosmic/hyper = 5
 * - mythic/legendary = 4
 * - epic = 3
 * - rare = 2
 * - common = 1
 *
 * Tier thresholds (returns database rarity names):
 * - 4.5+ → cosmic
 * - 3.5-4.49 → mythic
 * - 2.5-3.49 → epic
 * - 1.5-2.49 → rare
 * - <1.5 → common
 *
 * @param rewards - Array of rewards with rarity and weight
 * @returns The calculated database rarity tier string
 *
 * @example
 * const rewards = [
 *   { rarity: "cosmic", weight: 10 },  // Very rare drop
 *   { rarity: "epic", weight: 30 },    // Uncommon drop
 *   { rarity: "common", weight: 60 },  // Common drop
 * ];
 * const rarity = calculateLootboxRarity(rewards);
 * // Score = (5*10 + 3*30 + 1*60) / 100 = 2.0 → "rare"
 */
export function calculateLootboxRarity(
  rewards: RewardRarityInput[]
): DatabaseRarityTier {
  const score = calculateRarityScore(rewards);
  return scoreToRarityTier(score);
}

/**
 * Calculate rarity with detailed breakdown for UI display.
 * Uses DATABASE rarity tier (common, rare, epic, mythic, cosmic).
 *
 * @param rewards - Array of rewards with rarity and weight
 * @returns Object containing the tier, score, and display information
 */
export function calculateLootboxRarityWithDetails(rewards: RewardRarityInput[]): {
  tier: DatabaseRarityTier;
  score: number;
  display: (typeof RARITY_DISPLAY)[string];
  breakdown: {
    rarity: string;
    count: number;
    totalWeight: number;
    weightPercent: number;
  }[];
} {
  const score = calculateRarityScore(rewards);
  const tier = scoreToRarityTier(score);
  const display = RARITY_DISPLAY[tier];

  // Calculate breakdown by rarity
  const totalWeight = rewards.reduce((sum, r) => sum + r.weight, 0);
  const breakdownMap = new Map<
    string,
    { count: number; totalWeight: number }
  >();

  for (const reward of rewards) {
    const rarity = reward.rarity.toLowerCase();
    const current = breakdownMap.get(rarity) || { count: 0, totalWeight: 0 };
    breakdownMap.set(rarity, {
      count: current.count + 1,
      totalWeight: current.totalWeight + reward.weight,
    });
  }

  const breakdown = Array.from(breakdownMap.entries())
    .map(([rarity, data]) => ({
      rarity,
      count: data.count,
      totalWeight: data.totalWeight,
      weightPercent: totalWeight > 0 ? (data.totalWeight / totalWeight) * 100 : 0,
    }))
    .sort((a, b) => {
      // Sort by rarity value descending
      const aValue = RARITY_VALUES[a.rarity] ?? 0;
      const bValue = RARITY_VALUES[b.rarity] ?? 0;
      return bValue - aValue;
    });

  return {
    tier,
    score,
    display,
    breakdown,
  };
}

/**
 * Validate that rewards array is valid for rarity calculation.
 *
 * @param rewards - Array of rewards with rarity and weight
 * @returns Validation result
 */
export function validateRewardsForRarity(
  rewards: unknown[]
): { valid: boolean; error?: string } {
  if (!Array.isArray(rewards)) {
    return { valid: false, error: "Rewards must be an array" };
  }

  if (rewards.length === 0) {
    return { valid: false, error: "At least one reward is required" };
  }

  for (const [index, reward] of rewards.entries()) {
    const parsed = RewardRarityInput.safeParse(reward);
    if (!parsed.success) {
      return {
        valid: false,
        error: `Invalid reward at index ${index}: ${parsed.error.message}`,
      };
    }

    const normalizedRarity = (reward as RewardRarityInput).rarity.toLowerCase();
    if (!(normalizedRarity in RARITY_VALUES)) {
      return {
        valid: false,
        error: `Unknown rarity "${(reward as RewardRarityInput).rarity}" at index ${index}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Get the Solidity rarity enum value for on-chain storage.
 * Used when interacting with the smart contract.
 *
 * @param tier - The rarity tier string
 * @returns The numeric enum value (0-4)
 */
export function getRarityEnumValue(tier: RarityTier): number {
  const enumValues: Record<RarityTier, number> = {
    common: 0,
    rare: 1,
    epic: 2,
    legendary: 3,
    hyper: 4,
  };
  return enumValues[tier];
}

/**
 * Get the rarity tier string from a Solidity enum value.
 *
 * @param enumValue - The numeric enum value (0-4)
 * @returns The rarity tier string
 */
export function rarityFromEnumValue(enumValue: number): RarityTier {
  const tiers: RarityTier[] = ["common", "rare", "epic", "legendary", "hyper"];
  return tiers[enumValue] ?? "common";
}
