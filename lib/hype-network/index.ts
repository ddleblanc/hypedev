/**
 * Hype Network - Gamified Affiliate System
 * Central exports for hype network utilities
 */

// XP and rank calculations
export {
  RANK_THRESHOLDS,
  RANK_MULTIPLIERS,
  XP_SOURCES,
  type XpSource,
  type AwardXpResult,
  calculateRank,
  calculateRankProgress,
  getXpToNextRank,
  getNextRank,
  awardXp,
  awardCustomXp,
  awardReferralXp,
  awardStreakXp,
  calculateCommission,
} from "./xp-service";

// Streak tracking
export {
  type StreakUpdateResult,
  updateStreak,
  getStreakStatus,
  checkBrokenStreaks,
  getAgentsWithStreaksAtRisk,
  getStreakLeaderboard,
  getStreakMilestones,
} from "./streak-service";

// Display utilities
export {
  RANK_DISPLAY_NAMES,
  RANK_COLORS,
  RANK_ICONS,
  RANK_DESCRIPTIONS,
  RANK_PERKS,
  type RankInfo,
  getRankBadgeProps,
  formatXp,
  formatEarnings,
  getAllRanks,
  getRankIndex,
  isHigherRank,
  getTotalRanks,
  formatStreak,
  getProgressMessage,
} from "./rank-utils";

// Campaign management (Phase 3)
export {
  type CreateCampaignInput,
  type UpdateCampaignInput,
  CreateCampaignSchema,
  UpdateCampaignSchema,
  createCampaign,
  getCampaignById,
  getActiveCampaigns,
  getCreatorCampaigns,
  updateCampaign,
  cancelCampaign,
  canJoinCampaign,
  getCampaignStats,
  updateCampaignStatuses,
  getCampaignLeaderboard,
  updateCampaignLeaderboardRanks,
} from "./campaign-service";

// Affiliate links (Phase 3)
export {
  type VisitorInfo,
  type ConversionParams,
  createAffiliateLink,
  getLinkByCode,
  getAgentLinks,
  getLinkStats,
  trackClick,
  recordConversion,
  deactivateLink,
  reactivateLink,
  getAttributedLink,
} from "./link-service";

// Attribution tracking (Phase 3)
export {
  type AttributionData,
  setAttributionCookie,
  getAttributionData,
  hasAttribution,
  getAttributionForCampaign,
  clearAttributionCookie,
  updateAttribution,
  getAttributionTimeRemaining,
  checkAttribution,
} from "./attribution";

// Commission and payouts (Phase 4)
export {
  type EarningsSummary,
  type CommissionHistoryItem,
  type PayoutEligibility,
  getEarningsSummary,
  getCommissionHistory,
  processCommissionApprovals,
  canRequestPayout,
  requestPayout,
  processPayoutBatch,
  failPayout,
  getPayoutHistory,
  getPendingPayouts,
  getPayoutStats,
} from "./commission-service";

// Challenges & Competitions (Phase 5)
export {
  type CreateChallengeInput,
  CreateChallengeSchema,
  CHALLENGE_TYPE_INFO,
  createChallenge,
  getChallengeById,
  listChallenges,
  joinChallenge,
  hasJoinedChallenge,
  getAgentChallenges,
  updateChallengeProgress,
  updateDailyChallenges,
  updateChallengeRankings,
  endChallenge,
  getChallengeLeaderboard,
  cancelChallenge,
} from "./challenge-service";

// Achievement definitions (Phase 6)
export {
  type AchievementDefinition,
  ACHIEVEMENTS,
  ACHIEVEMENT_TIER_COLORS,
  TIER_ORDER,
  RANK_ORDER,
  getAchievementById,
  getAchievementsByCategory,
  getAchievementsByTier,
  getAllAchievementIds,
  getTotalAchievementXp,
  getAchievementCountByTier,
  getPublicAchievements,
  getSecretAchievements,
} from "./achievements";

// Achievement service (Phase 6)
export {
  type AchievementWithProgress,
  getAgentStats,
  checkAndUnlockAchievements,
  unlockAchievement,
  getAgentAchievements,
  getAchievementShowcase,
  getAgentAchievementStats,
  getRarestAchievements,
  getRecentAchievements,
} from "./achievement-service";

// Leaderboard service (Phase 6)
export {
  type LeaderboardType,
  type LeaderboardPeriod,
  type LeaderboardEntry,
  getGlobalLeaderboard,
  getAgentLeaderboardPosition,
  getLeaderboardSummary,
  getTopAgentsByPeriod,
  getLeaderboardStats,
  getRankDistribution,
} from "./leaderboard-service";

// Payout contract (Phase 5: On-Chain Payouts)
export {
  type TransferResult,
  executeDirectTransfer,
  getTreasuryBalance,
  hasSufficientBalance,
  canCoverPayoutBatch,
  getTreasuryAddress,
  isPayoutSystemConfigured,
  getPayoutSystemStatus,
} from "./payout-contract";

// Payout execution (Phase 5: On-Chain Payouts)
export {
  type PayoutResult,
  type BatchResult,
  processPayout,
  processAllPendingPayouts,
  retryFailedPayouts,
  getTreasuryHealth,
  getPayoutStatistics,
  cancelStuckPayout,
} from "./payout-execution";
