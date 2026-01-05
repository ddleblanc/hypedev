/**
 * tRPC Context
 * Creates context for each request with user info and dependencies
 */
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/thirdweb-auth";
import { AUTH_COOKIE_NAME } from "@/lib/constants/auth";
import type { NextRequest } from "next/server";

export interface Context {
  prisma: typeof prisma;
  walletAddress: string | null;
  req: NextRequest | null;
}

export async function createContext(opts: { req: NextRequest }): Promise<Context> {
  const { req } = opts;

  let walletAddress: string | null = null;

  // Primary auth method: Read JWT from httpOnly cookie
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (token) {
      const verified = await verifyJWT(token);
      if (verified.valid && verified.address) {
        walletAddress = verified.address;
      }
    }
  } catch (error) {
    // Log error but don't block request - might be unauthenticated
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[tRPC Context] Error verifying JWT:", message);
  }

  // Fallback: Check for x-authenticated-address header (from middleware)
  if (!walletAddress) {
    const middlewareAddress = req.headers.get("x-authenticated-address");
    if (middlewareAddress) {
      walletAddress = middlewareAddress.toLowerCase();
    }
  }

  return {
    prisma,
    walletAddress,
    req,
  };
}
