/**
 * Tournament Bracket Generation Utilities
 *
 * Supports:
 * - Single elimination
 * - Double elimination
 * - Round robin
 *
 * @see https://docs.elympics.ai/api/tournaments/
 */

import { z } from "zod";

// ============ Types ============

export const TournamentFormatSchema = z.enum([
  "single_elimination",
  "double_elimination",
  "round_robin",
]);

export type TournamentFormat = z.infer<typeof TournamentFormatSchema>;

export interface BracketMatch {
  round: number;
  matchNumber: number;
  position: number; // Position within the round (0-indexed)
  player1Id: string | null;
  player2Id: string | null;
  winnerId?: string | null;
  loserId?: string | null;
  score1?: number | null;
  score2?: number | null;
  status: "pending" | "in_progress" | "completed" | "bye";
  bracket: "winners" | "losers" | "grand_final"; // For double elimination
  nextMatchId?: string; // Reference to next match in bracket
  scheduledAt?: Date;
}

export interface TournamentBracketConfig {
  playerIds: string[];
  format: TournamentFormat;
  seeded?: boolean; // Use seeding order as provided
  shuffle?: boolean; // Randomize player order
}

export interface GeneratedBracket {
  matches: BracketMatch[];
  totalRounds: number;
  totalMatches: number;
  format: TournamentFormat;
}

// ============ Single Elimination ============

/**
 * Generate a single elimination bracket
 *
 * Standard bracket where losers are eliminated.
 * Supports byes for non-power-of-2 player counts.
 */
export function generateSingleEliminationBracket(
  config: TournamentBracketConfig
): GeneratedBracket {
  const { playerIds, seeded = false, shuffle = true } = config;
  const matches: BracketMatch[] = [];

  if (playerIds.length < 2) {
    throw new Error("Need at least 2 players for a tournament");
  }

  // Prepare player list
  let players = [...playerIds];
  if (shuffle && !seeded) {
    players = shuffleArray(players);
  }

  // Calculate bracket size (next power of 2)
  const bracketSize = nextPowerOf2(players.length);
  const totalRounds = Math.log2(bracketSize);
  const byeCount = bracketSize - players.length;

  // Pad with null for byes (byes should be distributed to top seeds)
  const participants: (string | null)[] = [];
  let byesRemaining = byeCount;

  for (let i = 0; i < bracketSize; i++) {
    const playerIndex = i - (byesRemaining > 0 && i % 2 === 1 ? 1 : 0);
    if (byesRemaining > 0 && i % 2 === 1) {
      participants.push(null);
      byesRemaining--;
    } else if (playerIndex < players.length) {
      participants.push(players[playerIndex] ?? null);
    } else {
      participants.push(null);
    }
  }

  // Reorder for proper seeding (1 vs 8, 4 vs 5, 3 vs 6, 2 vs 7 for 8 players)
  const seededParticipants = seedBracket(participants);

  let globalMatchNumber = 0;

  // Generate first round matches
  for (let i = 0; i < bracketSize / 2; i++) {
    const player1 = seededParticipants[i * 2];
    const player2 = seededParticipants[i * 2 + 1];
    const isBye = player1 === null || player2 === null;

    matches.push({
      round: 1,
      matchNumber: globalMatchNumber++,
      position: i,
      player1Id: player1,
      player2Id: player2,
      status: isBye ? "bye" : "pending",
      winnerId: isBye ? (player1 ?? player2) : null,
      bracket: "winners",
    });
  }

  // Generate subsequent rounds (empty slots to be filled as matches complete)
  let matchesInCurrentRound = bracketSize / 2;
  for (let round = 2; round <= totalRounds; round++) {
    matchesInCurrentRound = matchesInCurrentRound / 2;
    for (let i = 0; i < matchesInCurrentRound; i++) {
      matches.push({
        round,
        matchNumber: globalMatchNumber++,
        position: i,
        player1Id: null,
        player2Id: null,
        status: "pending",
        bracket: "winners",
      });
    }
  }

  return {
    matches,
    totalRounds,
    totalMatches: matches.length,
    format: "single_elimination",
  };
}

// ============ Double Elimination ============

/**
 * Generate a double elimination bracket
 *
 * Players must lose twice to be eliminated.
 * Includes winners bracket, losers bracket, and grand final.
 */
export function generateDoubleEliminationBracket(
  config: TournamentBracketConfig
): GeneratedBracket {
  const { playerIds, seeded = false, shuffle = true } = config;

  if (playerIds.length < 2) {
    throw new Error("Need at least 2 players for a tournament");
  }

  // Prepare player list
  let players = [...playerIds];
  if (shuffle && !seeded) {
    players = shuffleArray(players);
  }

  const bracketSize = nextPowerOf2(players.length);
  const winnersRounds = Math.log2(bracketSize);
  const losersRounds = winnersRounds * 2 - 1;

  const matches: BracketMatch[] = [];
  let globalMatchNumber = 0;

  // Seed participants
  const participants: (string | null)[] = [...players];
  while (participants.length < bracketSize) {
    participants.push(null);
  }
  const seededParticipants = seedBracket(participants);

  // Generate winners bracket (same as single elimination)
  let matchesInRound = bracketSize / 2;
  for (let round = 1; round <= winnersRounds; round++) {
    for (let i = 0; i < matchesInRound; i++) {
      const isFirstRound = round === 1;
      const player1 = isFirstRound ? seededParticipants[i * 2] : null;
      const player2 = isFirstRound ? seededParticipants[i * 2 + 1] : null;
      const isBye = isFirstRound && (player1 === null || player2 === null);

      matches.push({
        round,
        matchNumber: globalMatchNumber++,
        position: i,
        player1Id: player1,
        player2Id: player2,
        status: isBye ? "bye" : "pending",
        winnerId: isBye ? (player1 ?? player2) : null,
        bracket: "winners",
      });
    }
    matchesInRound = matchesInRound / 2;
  }

  // Generate losers bracket
  // Losers bracket has alternating "full" and "half" rounds
  let losersMatchesInRound = bracketSize / 4;
  for (let round = 1; round <= losersRounds; round++) {
    for (let i = 0; i < losersMatchesInRound; i++) {
      matches.push({
        round,
        matchNumber: globalMatchNumber++,
        position: i,
        player1Id: null,
        player2Id: null,
        status: "pending",
        bracket: "losers",
      });
    }
    // Every other round, halve the matches
    if (round % 2 === 0) {
      losersMatchesInRound = Math.max(1, losersMatchesInRound / 2);
    }
  }

  // Grand final (winners bracket winner vs losers bracket winner)
  matches.push({
    round: 1,
    matchNumber: globalMatchNumber++,
    position: 0,
    player1Id: null, // Winners bracket champion
    player2Id: null, // Losers bracket champion
    status: "pending",
    bracket: "grand_final",
  });

  // Grand final reset (if losers bracket winner wins first grand final)
  matches.push({
    round: 2,
    matchNumber: globalMatchNumber++,
    position: 0,
    player1Id: null,
    player2Id: null,
    status: "pending",
    bracket: "grand_final",
  });

  return {
    matches,
    totalRounds: winnersRounds + losersRounds + 2, // +2 for grand finals
    totalMatches: matches.length,
    format: "double_elimination",
  };
}

// ============ Round Robin ============

/**
 * Generate a round robin schedule
 *
 * Every player plays every other player once.
 * No elimination - standings determined by win/loss record.
 */
export function generateRoundRobinSchedule(
  config: TournamentBracketConfig
): GeneratedBracket {
  const { playerIds, shuffle = false } = config;

  if (playerIds.length < 2) {
    throw new Error("Need at least 2 players for a tournament");
  }

  let players = [...playerIds];
  if (shuffle) {
    players = shuffleArray(players);
  }

  const matches: BracketMatch[] = [];
  const n = players.length;

  // Use the "circle method" for scheduling
  // If odd number of players, add a bye
  const participants = n % 2 === 0 ? players : [...players, null];
  const numParticipants = participants.length;
  const numRounds = numParticipants - 1;
  const matchesPerRound = numParticipants / 2;

  let globalMatchNumber = 0;

  for (let round = 0; round < numRounds; round++) {
    for (let match = 0; match < matchesPerRound; match++) {
      const home = match;
      const away = numParticipants - 1 - match;

      // Rotate participants (except first one)
      const homePlayer =
        match === 0
          ? participants[0]
          : participants[((home - 1 + round) % (numParticipants - 1)) + 1];
      const awayPlayer =
        participants[((away - 1 + round) % (numParticipants - 1)) + 1];

      // Skip if bye match
      if (homePlayer === null || awayPlayer === null) {
        continue;
      }

      matches.push({
        round: round + 1,
        matchNumber: globalMatchNumber++,
        position: match,
        player1Id: homePlayer,
        player2Id: awayPlayer,
        status: "pending",
        bracket: "winners",
      });
    }
  }

  return {
    matches,
    totalRounds: numRounds,
    totalMatches: matches.length,
    format: "round_robin",
  };
}

// ============ Bracket Advancement ============

/**
 * Advance a winner to the next round in a bracket
 */
export function advanceWinner(
  matches: BracketMatch[],
  completedMatchNumber: number,
  winnerId: string,
  loserId?: string
): BracketMatch[] {
  const updatedMatches = [...matches];
  const completedMatch = updatedMatches.find(
    (m) => m.matchNumber === completedMatchNumber
  );

  if (!completedMatch) {
    console.warn("Match not found:", completedMatchNumber);
    return updatedMatches;
  }

  // Mark match as completed
  completedMatch.status = "completed";
  completedMatch.winnerId = winnerId;
  completedMatch.loserId = loserId || null;

  // Find next match in winners bracket
  if (completedMatch.bracket === "winners") {
    const nextRound = completedMatch.round + 1;
    const nextPosition = Math.floor(completedMatch.position / 2);

    const nextMatch = updatedMatches.find(
      (m) =>
        m.bracket === "winners" &&
        m.round === nextRound &&
        m.position === nextPosition
    );

    if (nextMatch) {
      // Place winner in appropriate slot (top or bottom)
      if (completedMatch.position % 2 === 0) {
        nextMatch.player1Id = winnerId;
      } else {
        nextMatch.player2Id = winnerId;
      }

      // Check if match is ready to start
      if (nextMatch.player1Id && nextMatch.player2Id) {
        nextMatch.status = "pending";
      }
    }

    // For double elimination, send loser to losers bracket
    if (loserId) {
      const losersRound = completedMatch.round;
      const losersMatch = updatedMatches.find(
        (m) =>
          m.bracket === "losers" &&
          m.round === losersRound &&
          m.player1Id === null
      );

      if (losersMatch) {
        if (!losersMatch.player1Id) {
          losersMatch.player1Id = loserId;
        } else {
          losersMatch.player2Id = loserId;
        }
      }
    }
  }

  // Handle losers bracket advancement
  if (completedMatch.bracket === "losers") {
    const nextRound = completedMatch.round + 1;
    const nextPosition =
      completedMatch.round % 2 === 0
        ? Math.floor(completedMatch.position / 2)
        : completedMatch.position;

    const nextMatch = updatedMatches.find(
      (m) =>
        m.bracket === "losers" &&
        m.round === nextRound &&
        m.position === nextPosition
    );

    if (nextMatch) {
      if (completedMatch.position % 2 === 0 || completedMatch.round % 2 === 1) {
        nextMatch.player1Id = nextMatch.player1Id ?? winnerId;
      } else {
        nextMatch.player2Id = nextMatch.player2Id ?? winnerId;
      }
    }
  }

  return updatedMatches;
}

/**
 * Calculate round robin standings
 */
export interface RoundRobinStanding {
  playerId: string;
  wins: number;
  losses: number;
  draws: number;
  points: number; // 3 for win, 1 for draw, 0 for loss
  pointsFor: number;
  pointsAgainst: number;
  pointDifferential: number;
}

export function calculateRoundRobinStandings(
  matches: BracketMatch[]
): RoundRobinStanding[] {
  const standings: Map<string, RoundRobinStanding> = new Map();

  // Initialize all players
  for (const match of matches) {
    if (match.player1Id && !standings.has(match.player1Id)) {
      standings.set(match.player1Id, {
        playerId: match.player1Id,
        wins: 0,
        losses: 0,
        draws: 0,
        points: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        pointDifferential: 0,
      });
    }
    if (match.player2Id && !standings.has(match.player2Id)) {
      standings.set(match.player2Id, {
        playerId: match.player2Id,
        wins: 0,
        losses: 0,
        draws: 0,
        points: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        pointDifferential: 0,
      });
    }
  }

  // Calculate results
  for (const match of matches) {
    if (match.status !== "completed" || !match.player1Id || !match.player2Id) {
      continue;
    }

    const p1 = standings.get(match.player1Id)!;
    const p2 = standings.get(match.player2Id)!;

    const score1 = match.score1 ?? 0;
    const score2 = match.score2 ?? 0;

    p1.pointsFor += score1;
    p1.pointsAgainst += score2;
    p2.pointsFor += score2;
    p2.pointsAgainst += score1;

    if (match.winnerId === match.player1Id) {
      p1.wins++;
      p1.points += 3;
      p2.losses++;
    } else if (match.winnerId === match.player2Id) {
      p2.wins++;
      p2.points += 3;
      p1.losses++;
    } else {
      // Draw
      p1.draws++;
      p2.draws++;
      p1.points += 1;
      p2.points += 1;
    }
  }

  // Calculate differentials and sort
  const result = Array.from(standings.values());
  for (const standing of result) {
    standing.pointDifferential = standing.pointsFor - standing.pointsAgainst;
  }

  // Sort by points, then point differential, then points for
  result.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.pointDifferential !== a.pointDifferential) {
      return b.pointDifferential - a.pointDifferential;
    }
    return b.pointsFor - a.pointsFor;
  });

  return result;
}

// ============ Helper Functions ============

/**
 * Get the next power of 2 >= n
 */
function nextPowerOf2(n: number): number {
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled;
}

/**
 * Seed bracket to ensure top seeds play bottom seeds
 * Uses standard bracket seeding (1v8, 4v5, 3v6, 2v7 for 8 players)
 */
function seedBracket<T>(participants: T[]): T[] {
  const n = participants.length;
  if (n <= 2) return participants;

  const seeded: T[] = new Array(n);
  const seeds = generateSeedOrder(n);

  for (let i = 0; i < n; i++) {
    seeded[seeds[i]!] = participants[i]!;
  }

  return seeded;
}

/**
 * Generate seed positions for a bracket
 */
function generateSeedOrder(n: number): number[] {
  if (n === 2) return [0, 1];

  const half = n / 2;
  const left = generateSeedOrder(half);
  const right = generateSeedOrder(half);

  const result: number[] = [];
  for (let i = 0; i < half; i++) {
    result.push(left[i]! * 2);
    result.push(right[i]! * 2 + 1);
  }

  return result;
}

/**
 * Generate bracket based on format
 */
export function generateBracket(
  config: TournamentBracketConfig
): GeneratedBracket {
  switch (config.format) {
    case "single_elimination":
      return generateSingleEliminationBracket(config);
    case "double_elimination":
      return generateDoubleEliminationBracket(config);
    case "round_robin":
      return generateRoundRobinSchedule(config);
    default: {
      // Exhaustive check
      const _exhaustive: never = config.format;
      throw new Error(`Unknown format: ${_exhaustive}`);
    }
  }
}

/**
 * Validate tournament format string
 */
export function isValidTournamentFormat(
  format: string
): format is TournamentFormat {
  return TournamentFormatSchema.safeParse(format).success;
}
