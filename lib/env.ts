/**
 * Environment variable validation using Zod
 * Fails fast if required variables are missing in production
 */
import { z } from "zod";

const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;
const numericStringRegex = /^\d+$/;

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),

  // Thirdweb
  NEXT_PUBLIC_THIRDWEB_CLIENT_ID: z.string().min(1),
  THIRDWEB_SECRET_KEY: z.string().min(1),

  // Contracts
  NEXT_PUBLIC_LOOTBOX_CONTRACT_ADDRESS: z.string().regex(ethereumAddressRegex),
  MARKETPLACE_CONTRACT_ADDRESS_SEPOLIA: z.string().regex(ethereumAddressRegex),
  NEXT_PUBLIC_CHAIN_ID: z.string().regex(numericStringRegex),

  // Chainlink
  NEXT_PUBLIC_CHAINLINK_VRF_SUBSCRIPTION_ID: z.string().regex(numericStringRegex),

  // Redis (required in production)
  REDIS_URL: z.string().url().optional(),

  // Sentry
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),

  // Elympics (optional)
  ELYMPICS_API_KEY: z.string().optional(),
  ELYMPICS_API_URL: z.string().url().optional(),
  ELYMPICS_WEBHOOK_SECRET: z.string().optional(),

  // Trade Escrow
  TRADE_ESCROW_FACTORY_ADDRESS: z.string().regex(ethereumAddressRegex).optional(),

  // Node environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("❌ Environment validation failed:");
    console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));

    if (process.env.NODE_ENV === "production") {
      throw new Error("Invalid environment configuration - required variables missing");
    }

    // In development, warn but continue with partial env
    console.warn("⚠️ Running with invalid environment configuration (allowed in development)");
  }

  return (parsed.data ?? process.env) as Env;
}

export const env = validateEnv();

/**
 * Helper to check if we're in production
 */
export function isProduction(): boolean {
  return env.NODE_ENV === "production";
}

/**
 * Helper to check if Redis is configured
 */
export function isRedisConfigured(): boolean {
  return Boolean(env.REDIS_URL);
}

/**
 * Helper to check if Sentry is configured
 */
export function isSentryConfigured(): boolean {
  return Boolean(env.SENTRY_DSN || env.NEXT_PUBLIC_SENTRY_DSN);
}

/**
 * Helper to check if Elympics is configured
 */
export function isElympicsConfigured(): boolean {
  return Boolean(env.ELYMPICS_API_KEY && env.ELYMPICS_API_URL);
}
