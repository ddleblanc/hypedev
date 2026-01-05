/**
 * Elympics Webhook Handler
 *
 * Receives callbacks from Elympics for:
 * - OnQueueJoin: Player attempting to join queue
 * - OnQueueLeave: Player left the queue
 * - OnMatchCreate: Match has been created
 * - OnMatchFinish: Match has ended
 * - OnLeaderboardFinished: Leaderboard period ended
 *
 * Authentication: Elympics uses JWT tokens with RSA-256 signatures.
 * The JWT contains `hash` and `hash-alg` claims for request body integrity.
 * Retrieve the public key via: `elympics pubkey internal`
 *
 * @see https://docs.elympics.ai/deploy/advanced/external-game-backend/
 * @see https://docs.elympics.ai/deploy/advanced/cli/public-rsa-keys/
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";
import * as jose from "jose";
import { calculateEloChange } from "@/lib/elympics";

// ============ Zod Schemas for Webhook Payloads ============

const ElympicsPlayerSchema = z.object({
  playerId: z.string(),
  displayName: z.string().optional(),
  rating: z.number().optional(),
  walletAddress: z.string().optional(),
});

const QueueJoinPayloadSchema = z.object({
  event: z.literal("OnQueueJoin"),
  playerId: z.string(),
  gameId: z.string(),
  queueName: z.string().optional(),
  matchType: z.enum(["ranked", "casual", "tournament"]).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const QueueLeavePayloadSchema = z.object({
  event: z.literal("OnQueueLeave"),
  playerId: z.string(),
  gameId: z.string(),
  queueId: z.string().optional(),
  reason: z.enum(["matched", "cancelled", "timeout", "error"]).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const MatchCreatePayloadSchema = z.object({
  event: z.literal("OnMatchCreate"),
  matchId: z.string(),
  gameId: z.string(),
  players: z.array(ElympicsPlayerSchema),
  matchType: z.enum(["ranked", "casual", "tournament"]).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const MatchPlayerResultSchema = z.object({
  playerId: z.string(),
  score: z.number(),
  placement: z.number(),
  walletAddress: z.string().optional(),
});

const MatchFinishPayloadSchema = z.object({
  event: z.literal("OnMatchFinish"),
  matchId: z.string(),
  gameId: z.string(),
  winnerId: z.string().nullable(),
  players: z.array(MatchPlayerResultSchema),
  duration: z.number(), // seconds
  replayUrl: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const LeaderboardEntrySchema = z.object({
  rank: z.number(),
  playerId: z.string(),
  displayName: z.string().optional(),
  score: z.number(),
  rating: z.number().optional(),
  walletAddress: z.string().optional(),
});

const LeaderboardFinishedPayloadSchema = z.object({
  event: z.literal("OnLeaderboardFinished"),
  gameId: z.string(),
  period: z.string(), // e.g., "weekly", "monthly", "season-1"
  entries: z.array(LeaderboardEntrySchema),
  metadata: z.record(z.unknown()).optional(),
});

const WebhookPayloadSchema = z.discriminatedUnion("event", [
  QueueJoinPayloadSchema,
  QueueLeavePayloadSchema,
  MatchCreatePayloadSchema,
  MatchFinishPayloadSchema,
  LeaderboardFinishedPayloadSchema,
]);

type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;

// ============ JWT Verification ============

/**
 * Elympics uses JWT tokens with RSA-256 for webhook authentication.
 * The public key should be retrieved via `elympics pubkey internal` CLI command.
 *
 * JWT claims include:
 * - Standard: nbf, exp, iat
 * - Custom: hash (body checksum), hash-alg (algorithm used)
 */

// Cache the imported public key
let cachedPublicKey: jose.CryptoKey | jose.KeyObject | null = null;

async function getPublicKey(): Promise<jose.CryptoKey | jose.KeyObject | null> {
  if (cachedPublicKey) return cachedPublicKey;

  const publicKeyPem = process.env.ELYMPICS_PUBLIC_KEY_INTERNAL;
  if (!publicKeyPem) {
    return null;
  }

  try {
    cachedPublicKey = await jose.importSPKI(publicKeyPem, "RS256");
    return cachedPublicKey;
  } catch (error) {
    console.error("[Elympics Webhook] Failed to import public key:", error);
    return null;
  }
}

interface JWTVerificationResult {
  valid: boolean;
  error?: string;
  payload?: jose.JWTPayload;
}

async function verifyElympicsJWT(
  token: string,
  requestBody: string
): Promise<JWTVerificationResult> {
  const publicKey = await getPublicKey();

  // Skip verification in development if no key is set
  if (!publicKey) {
    console.warn(
      "[Elympics Webhook] ELYMPICS_PUBLIC_KEY_INTERNAL not set, skipping JWT verification"
    );
    return { valid: true };
  }

  try {
    // Verify JWT signature
    const { payload } = await jose.jwtVerify(token, publicKey, {
      algorithms: ["RS256"],
    });

    // Verify request body hash if present
    const bodyHash = payload.hash as string | undefined;
    const hashAlg = (payload["hash-alg"] as string | undefined) ?? "sha256";

    if (bodyHash) {
      const computedHash = crypto
        .createHash(hashAlg)
        .update(requestBody)
        .digest("hex");

      if (computedHash !== bodyHash) {
        return {
          valid: false,
          error: "Request body hash mismatch",
        };
      }
    }

    return { valid: true, payload };
  } catch (error) {
    if (error instanceof jose.errors.JWTExpired) {
      return { valid: false, error: "JWT expired" };
    }
    if (error instanceof jose.errors.JWTClaimValidationFailed) {
      return { valid: false, error: "JWT claim validation failed" };
    }
    console.error("[Elympics Webhook] JWT verification error:", error);
    return { valid: false, error: "JWT verification failed" };
  }
}

// ============ Main Webhook Handler ============

export async function POST(request: NextRequest) {
  try {
    // Read raw body for verification
    const rawBody = await request.text();

    // Extract JWT from Authorization header (Bearer token)
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    // Verify JWT if token is present
    if (token) {
      const verification = await verifyElympicsJWT(token, rawBody);
      if (!verification.valid) {
        console.error("[Elympics Webhook] JWT verification failed:", verification.error);
        return NextResponse.json(
          { success: false, error: verification.error || "Authentication failed" },
          { status: 401 }
        );
      }
    } else {
      // No token - check if we're in development mode
      const publicKey = await getPublicKey();
      if (publicKey) {
        console.error("[Elympics Webhook] Missing Authorization header");
        return NextResponse.json(
          { success: false, error: "Missing Authorization header" },
          { status: 401 }
        );
      }
      // No key configured, allow request in development
      console.warn("[Elympics Webhook] No JWT provided, but verification disabled");
    }

    // Parse and validate payload
    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const parseResult = WebhookPayloadSchema.safeParse(body);

    if (!parseResult.success) {
      console.error(
        "[Elympics Webhook] Validation failed:",
        parseResult.error.issues
      );
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const payload = parseResult.data;

    console.log(`[Elympics Webhook] Received event: ${payload.event}`);

    // Route to appropriate handler
    switch (payload.event) {
      case "OnQueueJoin":
        return await handleQueueJoin(payload);
      case "OnQueueLeave":
        return await handleQueueLeave(payload);
      case "OnMatchCreate":
        return await handleMatchCreate(payload);
      case "OnMatchFinish":
        return await handleMatchFinish(payload);
      case "OnLeaderboardFinished":
        return await handleLeaderboardFinished(payload);
      default: {
        // TypeScript exhaustive check
        const _exhaustive: never = payload;
        return _exhaustive;
      }
    }
  } catch (error) {
    console.error("[Elympics Webhook] Unhandled error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ============ Event Handlers ============

async function handleQueueJoin(
  payload: z.infer<typeof QueueJoinPayloadSchema>
): Promise<NextResponse> {
  console.log("[Elympics Webhook] Player joining queue:", payload.playerId);

  try {
    // Find user by playerId (which could be wallet address or user ID)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: payload.playerId },
          { walletAddress: payload.playerId.toLowerCase() },
        ],
      },
      include: {
        playerStats: {
          where: {
            game: {
              elympicsGameId: payload.gameId,
            },
          },
        },
      },
    });

    // Validation checks
    // 1. Check if user exists
    if (!user) {
      console.log(
        "[Elympics Webhook] Unknown player, allowing queue join:",
        payload.playerId
      );
      // Allow unknown players - they may register during game
      return NextResponse.json({
        allow: true,
        reason: "New player",
      });
    }

    // 2. Check if user is banned (you can add a banned field to User model)
    // if (user.banned) {
    //   return NextResponse.json({
    //     allow: false,
    //     reason: "Account suspended",
    //   });
    // }

    // 3. For wager matches, verify balance (integrate with smart contracts)
    const wagerAmount = payload.metadata?.wagerAmount as string | undefined;
    if (wagerAmount && parseFloat(wagerAmount) > 0) {
      // TODO: Verify wallet balance via Thirdweb
      console.log(
        "[Elympics Webhook] Wager match requested:",
        wagerAmount,
        "ETH"
      );
    }

    // Return player rating for matchmaking if available
    const playerRating = user.playerStats[0]?.rating ?? 1000;

    return NextResponse.json({
      allow: true,
      playerData: {
        userId: user.id,
        username: user.username,
        rating: playerRating,
        walletAddress: user.walletAddress,
      },
    });
  } catch (error) {
    console.error("[Elympics Webhook] handleQueueJoin error:", error);
    // Allow queue join on error to prevent blocking players
    return NextResponse.json({
      allow: true,
      reason: "Validation skipped due to error",
    });
  }
}

async function handleQueueLeave(
  payload: z.infer<typeof QueueLeavePayloadSchema>
): Promise<NextResponse> {
  console.log(
    "[Elympics Webhook] Player left queue:",
    payload.playerId,
    "Reason:",
    payload.reason
  );

  try {
    // If player left due to cancellation or timeout, refund any locked wager
    if (payload.reason === "cancelled" || payload.reason === "timeout") {
      // TODO: Release escrow lock if wager was deposited
      console.log(
        "[Elympics Webhook] Would release wager lock for:",
        payload.playerId
      );
    }

    // Cancel any MATCHMAKING status matches for this player
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: payload.playerId },
          { walletAddress: payload.playerId.toLowerCase() },
        ],
      },
    });

    if (user) {
      await prisma.match.updateMany({
        where: {
          player1Id: user.id,
          status: "MATCHMAKING",
          player2Id: null,
        },
        data: {
          status: "CANCELLED",
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Elympics Webhook] handleQueueLeave error:", error);
    return NextResponse.json({ success: true }); // Non-critical, don't fail
  }
}

async function handleMatchCreate(
  payload: z.infer<typeof MatchCreatePayloadSchema>
): Promise<NextResponse> {
  console.log(
    "[Elympics Webhook] Match created:",
    payload.matchId,
    "Players:",
    payload.players.length
  );

  try {
    // Find game by Elympics ID
    const game = await prisma.game.findFirst({
      where: { elympicsGameId: payload.gameId },
    });

    if (!game) {
      console.error(
        "[Elympics Webhook] Game not found for Elympics ID:",
        payload.gameId
      );
      // Still acknowledge the webhook to prevent retries
      return NextResponse.json({
        success: true,
        warning: "Game not registered in database",
      });
    }

    // Resolve players to user IDs
    const playerUsers = await Promise.all(
      payload.players.map(async (player) => {
        // Try to find existing user
        let user = await prisma.user.findFirst({
          where: {
            OR: [
              { id: player.playerId },
              {
                walletAddress: player.walletAddress?.toLowerCase() ?? undefined,
              },
            ].filter((q) => Object.values(q).some((v) => v !== undefined)),
          },
        });

        // Create user if wallet address provided but user doesn't exist
        if (!user && player.walletAddress) {
          user = await prisma.user.create({
            data: {
              walletAddress: player.walletAddress.toLowerCase(),
              username: player.displayName || `Player${player.playerId.slice(0, 6)}`,
            },
          });
        }

        return { ...player, userId: user?.id ?? null };
      })
    );

    const player1 = playerUsers[0];
    const player2 = playerUsers[1];

    // Create match record
    const match = await prisma.match.create({
      data: {
        gameId: game.id,
        player1Id: player1?.userId ?? player1?.playerId ?? "unknown",
        player2Id: player2?.userId ?? player2?.playerId ?? null,
        elympicsMatchId: payload.matchId,
        status: "IN_PROGRESS",
        startedAt: new Date(),
        wagerAmount: payload.metadata?.wagerAmount
          ? parseFloat(payload.metadata.wagerAmount as string)
          : null,
        wagerType: (payload.metadata?.wagerType as string) ?? null,
      },
    });

    console.log(
      "[Elympics Webhook] Match recorded in database:",
      match.id,
      "->",
      payload.matchId
    );

    // Return match settings (Elympics can use these to configure the game server)
    return NextResponse.json({
      success: true,
      matchId: match.id,
      matchSettings: {
        gameMode: payload.matchType || "casual",
        // Add any game-specific settings here
      },
    });
  } catch (error) {
    console.error("[Elympics Webhook] handleMatchCreate error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to record match" },
      { status: 500 }
    );
  }
}

async function handleMatchFinish(
  payload: z.infer<typeof MatchFinishPayloadSchema>
): Promise<NextResponse> {
  console.log(
    "[Elympics Webhook] Match finished:",
    payload.matchId,
    "Winner:",
    payload.winnerId
  );

  try {
    // Find the match by Elympics match ID
    const match = await prisma.match.findFirst({
      where: { elympicsMatchId: payload.matchId },
      include: {
        game: true,
        player1: true,
        player2: true,
      },
    });

    if (!match) {
      console.error(
        "[Elympics Webhook] Match not found for Elympics ID:",
        payload.matchId
      );
      return NextResponse.json({
        success: true,
        warning: "Match not found in database",
      });
    }

    // Resolve winner user ID
    let winnerUserId: string | null = null;
    if (payload.winnerId) {
      // Check if winnerId matches player1 or player2
      if (match.player1Id === payload.winnerId) {
        winnerUserId = match.player1Id;
      } else if (match.player2Id === payload.winnerId) {
        winnerUserId = match.player2Id;
      } else {
        // Try to find by wallet or external ID
        const winnerUser = await prisma.user.findFirst({
          where: {
            OR: [
              { id: payload.winnerId },
              { walletAddress: payload.winnerId.toLowerCase() },
            ],
          },
        });
        winnerUserId = winnerUser?.id ?? null;
      }
    }

    // Update match record
    await prisma.match.update({
      where: { id: match.id },
      data: {
        status: "COMPLETED",
        winnerId: winnerUserId,
        replayUrl: payload.replayUrl,
        completedAt: new Date(),
      },
    });

    // Update player stats with ELO calculation
    if (match.player1 && match.player2 && winnerUserId) {
      await updatePlayerStats(
        match.gameId,
        match.player1.id,
        match.player2.id,
        winnerUserId,
        match.wagerAmount ? parseFloat(match.wagerAmount.toString()) : 0
      );
    }

    // Handle wager distribution
    if (match.wagerAmount && winnerUserId) {
      await distributeWager(match.id, winnerUserId);
    }

    console.log("[Elympics Webhook] Match result processed:", match.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Elympics Webhook] handleMatchFinish error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process match result" },
      { status: 500 }
    );
  }
}

async function handleLeaderboardFinished(
  payload: z.infer<typeof LeaderboardFinishedPayloadSchema>
): Promise<NextResponse> {
  console.log(
    "[Elympics Webhook] Leaderboard period ended:",
    payload.period,
    "Game:",
    payload.gameId,
    "Entries:",
    payload.entries.length
  );

  try {
    // Find game
    const game = await prisma.game.findFirst({
      where: { elympicsGameId: payload.gameId },
    });

    if (!game) {
      console.warn(
        "[Elympics Webhook] Game not found for leaderboard:",
        payload.gameId
      );
      return NextResponse.json({ success: true });
    }

    // Award prizes to top players
    const topPlayers = payload.entries.slice(0, 10); // Top 10 get rewards

    for (const entry of topPlayers) {
      // Find user
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { id: entry.playerId },
            { walletAddress: entry.walletAddress?.toLowerCase() ?? undefined },
          ].filter((q) => Object.values(q).some((v) => v !== undefined)),
        },
      });

      if (!user) continue;

      // Award free lootbox based on rank
      const freeBoxCount = entry.rank <= 3 ? 3 : entry.rank <= 10 ? 1 : 0;

      if (freeBoxCount > 0) {
        // Update user lootbox stats
        await prisma.userLootboxStats.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            freeBoxesAvailable: freeBoxCount,
          },
          update: {
            freeBoxesAvailable: { increment: freeBoxCount },
          },
        });

        console.log(
          "[Elympics Webhook] Awarded",
          freeBoxCount,
          "free lootboxes to rank",
          entry.rank,
          "player:",
          user.id
        );
      }
    }

    return NextResponse.json({
      success: true,
      rewardsDistributed: topPlayers.length,
    });
  } catch (error) {
    console.error("[Elympics Webhook] handleLeaderboardFinished error:", error);
    return NextResponse.json({ success: true }); // Non-critical
  }
}

// ============ Helper Functions ============

async function updatePlayerStats(
  gameId: string,
  player1Id: string,
  player2Id: string,
  winnerId: string,
  wagerAmount: number
): Promise<void> {
  // Get or create player stats
  const [stats1, stats2] = await Promise.all([
    prisma.playerStats.upsert({
      where: { userId_gameId: { userId: player1Id, gameId } },
      create: { userId: player1Id, gameId, rating: 1000, peakRating: 1000 },
      update: {},
    }),
    prisma.playerStats.upsert({
      where: { userId_gameId: { userId: player2Id, gameId } },
      create: { userId: player2Id, gameId, rating: 1000, peakRating: 1000 },
      update: {},
    }),
  ]);

  const player1Won = winnerId === player1Id;
  const winnerStats = player1Won ? stats1 : stats2;
  const loserStats = player1Won ? stats2 : stats1;

  // Calculate ELO change
  const { winnerChange, loserChange } = calculateEloChange(
    winnerStats.rating,
    loserStats.rating
  );

  // Update both players in a transaction
  await prisma.$transaction([
    prisma.playerStats.update({
      where: { id: winnerStats.id },
      data: {
        wins: { increment: 1 },
        rating: winnerStats.rating + winnerChange,
        peakRating: Math.max(
          winnerStats.peakRating,
          winnerStats.rating + winnerChange
        ),
        streak: winnerStats.streak > 0 ? winnerStats.streak + 1 : 1,
        totalEarnings: { increment: wagerAmount },
      },
    }),
    prisma.playerStats.update({
      where: { id: loserStats.id },
      data: {
        losses: { increment: 1 },
        rating: Math.max(0, loserStats.rating + loserChange), // Don't go negative
        streak: loserStats.streak < 0 ? loserStats.streak - 1 : -1,
      },
    }),
  ]);

  console.log(
    "[Elympics Webhook] Stats updated - Winner:",
    winnerId,
    `(+${winnerChange} ELO)`,
    "Loser:",
    player1Won ? player2Id : player1Id,
    `(${loserChange} ELO)`
  );
}

async function distributeWager(
  matchId: string,
  winnerId: string
): Promise<void> {
  // TODO: Integrate with escrow smart contract
  // This would call the escrow contract to release funds to winner
  console.log(
    "[Elympics Webhook] TODO: Distribute wager for match",
    matchId,
    "to winner",
    winnerId
  );

  // Placeholder for smart contract integration:
  // 1. Get escrow contract address from match metadata
  // 2. Call contract.releaseToWinner(winnerId)
  // 3. Log transaction hash
}

// ============ Health Check ============

export async function GET() {
  const hasPublicKey = Boolean(process.env.ELYMPICS_PUBLIC_KEY_INTERNAL);
  const hasApiKey = Boolean(process.env.ELYMPICS_API_KEY) &&
    process.env.ELYMPICS_API_KEY !== "PLACEHOLDER_API_KEY";

  return NextResponse.json({
    status: "healthy",
    service: "elympics-webhook",
    timestamp: new Date().toISOString(),
    configured: {
      apiKey: hasApiKey,
      publicKey: hasPublicKey,
      verification: hasPublicKey ? "enabled" : "disabled (development mode)",
    },
  });
}
