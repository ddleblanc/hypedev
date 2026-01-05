/**
 * Elympics API Client
 *
 * Integration with Elympics for competitive gaming, matchmaking, and tournaments.
 * Elympics uses a webhook-based integration pattern.
 *
 * Setup:
 * 1. Create an Elympics account at https://www.elympics.ai/
 * 2. Set up your game in the Elympics dashboard
 * 3. Configure webhooks to point to your /api/gaming/webhooks/elympics endpoint
 * 4. Set ELYMPICS_API_KEY in your environment
 *
 * Webhook callbacks implemented in /api/gaming/webhooks/elympics:
 * - OnQueueJoin: Allow/deny player joining queue
 * - OnQueueLeave: Player left the queue
 * - OnMatchCreate: Match created, pre-game setup
 * - OnMatchFinish: Game ended, handle results
 * - OnLeaderboardFinished: Leaderboard period ended
 *
 * @see https://docs.elympics.ai/api/overview/
 * @see https://docs.elympics.ai/lobby/general/matchmaking/
 */

import { z } from "zod";
import { err, ok, type Result } from "@/lib/result";

// ============ Environment Configuration ============

/**
 * HPX is a gaming platform (like Steam/Epic Games), not a single game.
 * Each game in the database has its own `elympicsGameId` field.
 * These environment variables are for the platform-level API credentials.
 */

// API key from Elympics dashboard
const ELYMPICS_API_KEY = process.env.ELYMPICS_API_KEY || "PLACEHOLDER_API_KEY";
const ELYMPICS_BASE_URL =
  process.env.ELYMPICS_API_URL || "https://api.elympics.cc";

// Check if we're using placeholder values (for mock mode)
// Note: Game IDs come from the Game table, not environment variables
const IS_CONFIGURED =
  ELYMPICS_API_KEY !== "PLACEHOLDER_API_KEY" &&
  ELYMPICS_API_KEY !== "";

// ============ Zod Schemas ============

export const ElympicsPlayerSchema = z.object({
  playerId: z.string(),
  displayName: z.string(),
  rating: z.number().optional(),
  walletAddress: z.string().optional(),
});

export const MatchTypeSchema = z.enum(["ranked", "casual", "tournament"]);

export const WagerSchema = z.object({
  amount: z.string(),
  type: z.enum(["eth", "nft", "token"]),
});

export const MatchRequestSchema = z.object({
  playerId: z.string(),
  gameId: z.string(),
  matchType: MatchTypeSchema.optional(),
  wager: WagerSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const MatchResultPlayerSchema = z.object({
  playerId: z.string(),
  score: z.number(),
  placement: z.number(),
});

export const MatchResultSchema = z.object({
  matchId: z.string(),
  winnerId: z.string().nullable(),
  players: z.array(MatchResultPlayerSchema),
  duration: z.number(),
  replayUrl: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const TournamentFormatSchema = z.enum([
  "single_elimination",
  "double_elimination",
  "round_robin",
]);

export const TournamentConfigSchema = z.object({
  gameId: z.string(),
  name: z.string(),
  maxPlayers: z.number().int().positive(),
  startTime: z.date(),
  format: TournamentFormatSchema,
  entryFee: z.number().optional(),
  prizePool: z.number().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const QueueStatusSchema = z.object({
  queueId: z.string(),
  status: z.enum(["searching", "matched", "expired", "cancelled"]),
  estimatedWaitTime: z.number().optional(),
  playersInQueue: z.number().optional(),
  matchId: z.string().optional(), // Present when status is "matched"
});

export const LeaderboardEntrySchema = z.object({
  rank: z.number().int().positive(),
  playerId: z.string(),
  displayName: z.string(),
  score: z.number(),
  rating: z.number().optional(),
});

// ============ Types (derived from schemas) ============

export type ElympicsPlayer = z.infer<typeof ElympicsPlayerSchema>;
export type MatchRequest = z.infer<typeof MatchRequestSchema>;
export type MatchResult = z.infer<typeof MatchResultSchema>;
export type TournamentConfig = z.infer<typeof TournamentConfigSchema>;
export type QueueStatus = z.infer<typeof QueueStatusSchema>;
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;
export type TournamentFormat = z.infer<typeof TournamentFormatSchema>;
export type MatchType = z.infer<typeof MatchTypeSchema>;

// ============ Error Types ============

export class ElympicsError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = "ElympicsError";
  }
}

export type ElympicsResult<T> = Result<T, ElympicsError>;

// ============ API Client ============

interface ElympicsRequestOptions extends RequestInit {
  timeout?: number;
}

async function elympicsRequest<T>(
  endpoint: string,
  options: ElympicsRequestOptions = {},
  schema?: z.ZodType<T>
): Promise<ElympicsResult<T>> {
  if (!IS_CONFIGURED) {
    console.warn(
      "[Elympics] API not configured (using placeholders), mock mode active"
    );
    return err(
      new ElympicsError("Elympics API not configured", "NOT_CONFIGURED")
    );
  }

  const { timeout = 10000, ...fetchOptions } = options;
  const url = `${ELYMPICS_BASE_URL}${endpoint}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ELYMPICS_API_KEY}`,
        // Note: X-Game-Id should be passed per-request via options.headers
        // since HPX is a platform with multiple games
        ...fetchOptions.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      return err(
        new ElympicsError(
          `Elympics API error: ${response.status} - ${errorBody}`,
          "API_ERROR",
          response.status
        )
      );
    }

    const data = await response.json();

    // Validate response with schema if provided
    if (schema) {
      const parseResult = schema.safeParse(data);
      if (!parseResult.success) {
        console.error("[Elympics] Response validation failed:", parseResult.error);
        return err(
          new ElympicsError(
            "Invalid API response format",
            "VALIDATION_ERROR"
          )
        );
      }
      return ok(parseResult.data);
    }

    return ok(data as T);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return err(new ElympicsError("Request timeout", "TIMEOUT"));
    }
    console.error("[Elympics] Request failed:", error);
    return err(
      new ElympicsError(
        error instanceof Error ? error.message : "Unknown error",
        "NETWORK_ERROR"
      )
    );
  }
}

export const elympicsClient = {
  /**
   * Check if Elympics platform credentials are configured
   * Note: Individual games have their own elympicsGameId in the database
   */
  isConfigured(): boolean {
    return IS_CONFIGURED;
  },

  /**
   * Queue a player for matchmaking
   * Returns mock response if API is not configured
   * @param request - Must include gameId from the Game table's elympicsGameId field
   */
  async joinQueue(request: MatchRequest): Promise<QueueStatus> {
    // Validate input
    const parseResult = MatchRequestSchema.safeParse(request);
    if (!parseResult.success) {
      console.error("[Elympics] Invalid match request:", parseResult.error);
      throw new ElympicsError("Invalid match request", "VALIDATION_ERROR");
    }

    if (!this.isConfigured()) {
      // Return mock response for demo/development
      console.log("[Elympics] Mock mode: Player joining queue", request.playerId);
      return {
        queueId: `mock-queue-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        status: "searching",
        estimatedWaitTime: Math.floor(Math.random() * 30) + 10,
        playersInQueue: Math.floor(Math.random() * 50) + 10,
      };
    }

    // gameId is required - it comes from the Game table's elympicsGameId field
    if (!request.gameId) {
      throw new ElympicsError("gameId is required (from Game.elympicsGameId)", "VALIDATION_ERROR");
    }

    const result = await elympicsRequest<QueueStatus>(
      "/v1/matchmaking/queue",
      {
        method: "POST",
        body: JSON.stringify({
          gameId: request.gameId,
          playerId: request.playerId,
          matchType: request.matchType || "casual",
          metadata: request.metadata,
        }),
      },
      QueueStatusSchema
    );

    if (result.isErr()) {
      throw result.error;
    }

    return result.value;
  },

  /**
   * Leave matchmaking queue
   */
  async leaveQueue(queueId: string): Promise<void> {
    if (!this.isConfigured()) {
      console.log("[Elympics] Mock mode: Left queue", queueId);
      return;
    }

    const result = await elympicsRequest<void>(
      `/v1/matchmaking/queue/${encodeURIComponent(queueId)}`,
      { method: "DELETE" }
    );

    if (result.isErr()) {
      throw result.error;
    }
  },

  /**
   * Get queue status (for polling)
   */
  async getQueueStatus(queueId: string): Promise<QueueStatus> {
    if (!this.isConfigured()) {
      // Simulate finding a match after some time (30% chance each poll)
      const random = Math.random();
      const status = random > 0.7 ? "matched" : "searching";
      return {
        queueId,
        status,
        estimatedWaitTime: status === "searching" ? Math.floor(Math.random() * 30) : 0,
        playersInQueue: Math.floor(Math.random() * 50) + 10,
        matchId: status === "matched" ? `mock-match-${Date.now()}` : undefined,
      };
    }

    const result = await elympicsRequest<QueueStatus>(
      `/v1/matchmaking/queue/${encodeURIComponent(queueId)}`,
      { method: "GET" },
      QueueStatusSchema
    );

    if (result.isErr()) {
      throw result.error;
    }

    return result.value;
  },

  /**
   * Poll queue until matched or timeout
   */
  async pollQueueUntilMatched(
    queueId: string,
    options: { pollInterval?: number; timeout?: number } = {}
  ): Promise<QueueStatus & { matchId: string }> {
    const { pollInterval = 2000, timeout = 120000 } = options;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const status = await this.getQueueStatus(queueId);

      if (status.status === "matched" && status.matchId) {
        return { ...status, matchId: status.matchId };
      }

      if (status.status === "expired" || status.status === "cancelled") {
        throw new ElympicsError(
          `Queue ${status.status}`,
          status.status.toUpperCase()
        );
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new ElympicsError("Matchmaking timeout", "TIMEOUT");
  },

  /**
   * Get match status
   */
  async getMatchStatus(
    matchId: string
  ): Promise<{ status: string; players: ElympicsPlayer[] }> {
    if (!this.isConfigured()) {
      return {
        status: "in_progress",
        players: [],
      };
    }

    const result = await elympicsRequest<{ status: string; players: ElympicsPlayer[] }>(
      `/v1/matches/${encodeURIComponent(matchId)}`
    );

    if (result.isErr()) {
      throw result.error;
    }

    return result.value;
  },

  /**
   * Get leaderboard for a specific game
   * @param gameId - The Elympics game ID (from Game.elympicsGameId)
   */
  async getLeaderboard(
    gameId: string,
    limit = 50
  ): Promise<LeaderboardEntry[]> {
    if (!gameId) {
      throw new ElympicsError("gameId is required", "VALIDATION_ERROR");
    }

    if (!this.isConfigured()) {
      // Return mock leaderboard for development
      return Array.from({ length: Math.min(limit, 100) }, (_, i) => ({
        rank: i + 1,
        playerId: `mock-player-${i}`,
        displayName: `Player ${i + 1}`,
        score: Math.max(0, 10000 - i * 100 + Math.floor(Math.random() * 50)),
        rating: Math.max(0, 2000 - i * 20 + Math.floor(Math.random() * 10)),
      }));
    }

    const result = await elympicsRequest<{ entries: LeaderboardEntry[] }>(
      `/v1/leaderboards/${encodeURIComponent(gameId)}?limit=${limit}`
    );

    if (result.isErr()) {
      throw result.error;
    }

    return result.value.entries || [];
  },

  /**
   * Create a tournament via Elympics
   */
  async createTournament(
    config: TournamentConfig
  ): Promise<{ tournamentId: string }> {
    // Validate input
    const parseResult = TournamentConfigSchema.safeParse(config);
    if (!parseResult.success) {
      throw new ElympicsError("Invalid tournament config", "VALIDATION_ERROR");
    }

    if (!this.isConfigured()) {
      console.log("[Elympics] Mock mode: Creating tournament", config.name);
      return { tournamentId: `mock-tournament-${Date.now()}` };
    }

    const result = await elympicsRequest<{ id: string }>(
      "/v1/tournaments",
      {
        method: "POST",
        body: JSON.stringify({
          ...config,
          startTime: config.startTime.toISOString(),
        }),
      }
    );

    if (result.isErr()) {
      throw result.error;
    }

    return { tournamentId: result.value.id };
  },

  /**
   * Get tournament info from Elympics
   * @param tournamentId - The Elympics tournament ID
   * @param gameId - Optional game ID for mock data
   */
  async getTournament(
    tournamentId: string,
    gameId?: string
  ): Promise<TournamentConfig & { id: string; status: string }> {
    if (!this.isConfigured()) {
      return {
        id: tournamentId,
        gameId: gameId || "mock-game-id",
        name: "Mock Tournament",
        maxPlayers: 32,
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        format: "single_elimination",
        status: "upcoming",
      };
    }

    const result = await elympicsRequest<TournamentConfig & { id: string; status: string }>(
      `/v1/tournaments/${encodeURIComponent(tournamentId)}`
    );

    if (result.isErr()) {
      throw result.error;
    }

    return result.value;
  },

  /**
   * Submit match result to Elympics (for server-authoritative games)
   */
  async submitMatchResult(result: MatchResult): Promise<void> {
    const parseResult = MatchResultSchema.safeParse(result);
    if (!parseResult.success) {
      throw new ElympicsError("Invalid match result", "VALIDATION_ERROR");
    }

    if (!this.isConfigured()) {
      console.log("[Elympics] Mock mode: Match result submitted", result.matchId);
      return;
    }

    const apiResult = await elympicsRequest<void>(
      `/v1/matches/${encodeURIComponent(result.matchId)}/result`,
      {
        method: "POST",
        body: JSON.stringify(result),
      }
    );

    if (apiResult.isErr()) {
      throw apiResult.error;
    }
  },
};

// ============ Configuration Exports ============

/**
 * Export configuration for use in other modules
 * Note: Game IDs are stored per-game in the Game table (Game.elympicsGameId)
 *
 * Webhook authentication uses JWT with RSA-256 (not a shared secret).
 * Retrieve the public key via: `elympics pubkey internal`
 * Set in env: ELYMPICS_PUBLIC_KEY_INTERNAL
 */
export const elympicsConfig = {
  apiKey: ELYMPICS_API_KEY,
  baseUrl: ELYMPICS_BASE_URL,
  isConfigured: IS_CONFIGURED,
  hasPublicKey: Boolean(process.env.ELYMPICS_PUBLIC_KEY_INTERNAL),
} as const;

/**
 * K-factors for different match types
 * Higher K = more rating change per match
 */
export const ELO_K_FACTORS = {
  casual: 16, // Less volatile
  ranked: 32, // Standard
  tournament: 48, // High stakes
} as const;

// ============ Utility Functions ============

/**
 * Calculate ELO rating change
 */
export function calculateEloChange(
  winnerRating: number,
  loserRating: number,
  kFactor = 32
): { winnerChange: number; loserChange: number } {
  const expectedWinner =
    1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
  const expectedLoser =
    1 / (1 + Math.pow(10, (winnerRating - loserRating) / 400));

  const winnerChange = Math.round(kFactor * (1 - expectedWinner));
  const loserChange = Math.round(kFactor * (0 - expectedLoser));

  return { winnerChange, loserChange };
}

/**
 * Format match duration
 */
export function formatMatchDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

/**
 * Get rank tier from rating
 */
export function getRankTier(
  rating: number
): { tier: string; color: string; icon: string } {
  if (rating >= 2400) return { tier: "Grandmaster", color: "#ff0000", icon: "crown" };
  if (rating >= 2200) return { tier: "Master", color: "#ffd700", icon: "star" };
  if (rating >= 2000) return { tier: "Diamond", color: "#00bfff", icon: "gem" };
  if (rating >= 1800) return { tier: "Platinum", color: "#e5e4e2", icon: "shield" };
  if (rating >= 1600) return { tier: "Gold", color: "#ffd700", icon: "medal" };
  if (rating >= 1400) return { tier: "Silver", color: "#c0c0c0", icon: "medal" };
  if (rating >= 1200) return { tier: "Bronze", color: "#cd7f32", icon: "medal" };
  return { tier: "Unranked", color: "#808080", icon: "user" };
}
