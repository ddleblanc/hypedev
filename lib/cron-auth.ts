/**
 * Cron Authentication Utilities
 * Shared auth verification for Vercel Cron jobs
 */
import { headers } from "next/headers";

/**
 * Verify cron request is from Vercel
 * Uses CRON_SECRET environment variable
 */
export async function verifyCronAuth(): Promise<boolean> {
  const headersList = await headers();
  const authHeader = headersList.get("authorization");

  if (!authHeader) {
    return false;
  }

  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.warn("[Cron] CRON_SECRET not configured");
    return false;
  }

  return authHeader === `Bearer ${secret}`;
}

/**
 * Standard cron response with timing info
 */
export function cronResponse(
  success: boolean,
  data: Record<string, unknown>,
  startTime: number
) {
  return Response.json({
    success,
    ...data,
    duration: `${Date.now() - startTime}ms`,
    timestamp: new Date().toISOString(),
  });
}
