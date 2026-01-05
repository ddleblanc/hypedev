/**
 * Museum Type Definitions
 * TypeScript types and Zod schemas for the museum/legends hall feature
 */
import { z } from "zod";
import type {
  Legend as PrismaLegend,
  LegendChapter as PrismaChapter,
  LegendArtifact as PrismaArtifact,
  LegendTimelineEvent as PrismaTimelineEvent,
  LegendQuote as PrismaQuote,
  LegendAchievement as PrismaAchievement,
  UserLegendProgress as PrismaProgress,
} from "@prisma/client";
import {
  LegendStatus,
  ArtifactUnlockType,
  AchievementUnlockType,
} from "@prisma/client";

// Re-export enums for convenience
export { LegendStatus, ArtifactUnlockType, AchievementUnlockType };

// ============================================
// SCHEMA DEFINITIONS
// ============================================

// Stats schema - flexible key-value pairs for legend stats
export const legendStatsSchema = z.record(z.string(), z.string());
export type LegendStats = z.infer<typeof legendStatsSchema>;

// Quiz options schema
export const quizOptionsSchema = z.array(z.string());
export type QuizOptions = z.infer<typeof quizOptionsSchema>;

// ============================================
// ENRICHED TYPES WITH RELATIONS
// ============================================

export interface LegendWithRelations extends PrismaLegend {
  chapters: PrismaChapter[];
  artifacts: PrismaArtifact[];
  achievements: PrismaAchievement[];
  timeline: PrismaTimelineEvent[];
  quotes: PrismaQuote[];
}

export interface LegendChapterWithNft extends PrismaChapter {
  nft?: {
    id: string;
    name: string;
    image: string;
    price: number | null;
    isListed: boolean;
  } | null;
}

// User progress enriched with details
export interface UserProgressWithDetails extends PrismaProgress {
  ownedChapterDetails: PrismaChapter[];
  earnedAchievementDetails: PrismaAchievement[];
  foundArtifactDetails: PrismaArtifact[];
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface LegendListItem {
  id: string;
  slug: string;
  name: string;
  title: string;
  tagline: string;
  category: string;
  status: LegendStatus;
  portraitUrl: string;
  bannerUrl: string;
  primaryColor: string;
  chapterCount: number;
  stats: LegendStats;
}

export interface LegendDetail extends LegendWithRelations {
  parsedStats: LegendStats;
  userProgress?: PrismaProgress | null;
}

// ============================================
// INPUT VALIDATION SCHEMAS
// ============================================

export const createLegendSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with dashes"),
  name: z.string().min(1),
  title: z.string().min(1),
  tagline: z.string().min(1),
  era: z.string().min(1),
  category: z.string().min(1),
  impact: z.string().min(1),
  status: z.nativeEnum(LegendStatus).default("DRAFT"),
  heroLine: z.string().min(1),
  challenge: z.string().min(1),
  breakthrough: z.string().min(1),
  legacy: z.string().min(1),
  modernImpact: z.string().min(1),
  portraitUrl: z.string().url(),
  bannerUrl: z.string().url(),
  heroVideoUrl: z.string().url(),
  trailerVideoUrl: z.string().url().optional(),
  trailerDuration: z.number().int().optional(),
  primaryColor: z.string().default("#a3ff12"),
  accentColor: z.string().default("#7bc400"),
  gradientClass: z.string().default("from-green-400/20 to-emerald-600/10"),
  stats: legendStatsSchema.default({}),
  displayOrder: z.number().int().default(0),
});

export type CreateLegendInput = z.infer<typeof createLegendSchema>;

export const createChapterSchema = z.object({
  legendId: z.string().uuid(),
  number: z.number().int().positive(),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  description: z.string().min(1),
  videoUrl: z.string().url(),
  thumbnailUrl: z.string().url(),
  year: z.string().optional(),
  rarity: z.string().default("Common"),
  edition: z.string().default("Open Edition"),
  price: z.number().optional(),
  prerequisiteNumber: z.number().int().optional(),
});

export type CreateChapterInput = z.infer<typeof createChapterSchema>;

export const updateProgressSchema = z.object({
  legendId: z.string().uuid(),
  action: z.enum([
    "view_chapter",
    "view_timeline_event",
    "complete_quiz",
    "find_artifact",
    "watch_trailer",
  ]),
  targetId: z.string().optional(), // Chapter ID, event ID, etc.
  quizScore: z.number().int().optional(), // For quiz completion
});

export type UpdateProgressInput = z.infer<typeof updateProgressSchema>;

// ============================================
// QUERY INPUT SCHEMAS
// ============================================

export const listLegendsInputSchema = z.object({
  status: z.nativeEnum(LegendStatus).optional(),
  includeComingSoon: z.boolean().default(true),
}).optional();

export type ListLegendsInput = z.infer<typeof listLegendsInputSchema>;

export const getLegendBySlugInputSchema = z.object({
  slug: z.string().min(1),
});

export type GetLegendBySlugInput = z.infer<typeof getLegendBySlugInputSchema>;

export const getLegendByIdInputSchema = z.object({
  id: z.string().uuid(),
});

export type GetLegendByIdInput = z.infer<typeof getLegendByIdInputSchema>;

export const listChaptersInputSchema = z.object({
  legendId: z.string().uuid(),
});

export type ListChaptersInput = z.infer<typeof listChaptersInputSchema>;

export const getChapterInputSchema = z.object({
  id: z.string().uuid(),
});

export type GetChapterInput = z.infer<typeof getChapterInputSchema>;

export const checkArtifactUnlockInputSchema = z.object({
  legendId: z.string().uuid(),
  artifactId: z.string().uuid(),
});

export type CheckArtifactUnlockInput = z.infer<typeof checkArtifactUnlockInputSchema>;

export const recordOwnershipInputSchema = z.object({
  legendId: z.string().uuid(),
  chapterId: z.string().uuid(),
});

export type RecordOwnershipInput = z.infer<typeof recordOwnershipInputSchema>;
