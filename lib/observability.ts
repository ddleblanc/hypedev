/**
 * Observability utilities for API routes
 * Combines Sentry error tracking with OpenTelemetry tracing
 */
import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { type AnyAppError } from "@/lib/errors";

/**
 * Capture an error to Sentry with structured context
 */
export function captureError(
  error: Error | AnyAppError,
  context: {
    operation: string;
    walletAddress?: string;
    extra?: Record<string, unknown>;
  }
) {
  Sentry.withScope((scope) => {
    scope.setTag("operation", context.operation);

    if (context.walletAddress) {
      scope.setUser({ wallet: context.walletAddress });
    }

    if (context.extra) {
      scope.setExtras(context.extra);
    }

    // Handle structured errors
    if ("code" in error) {
      scope.setTag("error.code", (error as AnyAppError).code);
    }

    Sentry.captureException(error);
  });
}

/**
 * Set user context for the current Sentry scope
 */
export function setUserContext(walletAddress: string) {
  Sentry.setUser({
    wallet: walletAddress,
    id: walletAddress.toLowerCase(),
  });
}

/**
 * Add breadcrumb for tracking user flow
 */
export function addBreadcrumb(
  message: string,
  category: "api" | "blockchain" | "database" | "user" | "navigation",
  data?: Record<string, unknown>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level: "info",
    data,
  });
}

/**
 * Start a Sentry transaction for API routes
 */
export function startApiTransaction(
  request: NextRequest,
  name: string
): ReturnType<typeof Sentry.startSpan> {
  return Sentry.startSpan(
    {
      name,
      op: "http.server",
      attributes: {
        "http.method": request.method,
        "http.url": request.url,
      },
    },
    (span) => span
  );
}

/**
 * Wrapper for API route handlers with automatic observability
 */
export function withObservability<T>(
  operation: string,
  handler: () => Promise<T>,
  context?: {
    walletAddress?: string;
    extra?: Record<string, unknown>;
  }
): Promise<T> {
  return Sentry.startSpan(
    {
      name: operation,
      op: "function",
    },
    async (span) => {
      addBreadcrumb(`Starting ${operation}`, "api");

      if (context?.walletAddress) {
        setUserContext(context.walletAddress);
      }

      try {
        const result = await handler();
        span.setStatus({ code: 1 }); // OK
        return result;
      } catch (error) {
        span.setStatus({ code: 2, message: error instanceof Error ? error.message : "Unknown error" }); // ERROR
        captureError(error as Error, { operation, ...context });
        throw error;
      }
    }
  );
}

/**
 * Record a blockchain transaction metric
 */
export function recordBlockchainTx(
  contractName: string,
  method: string,
  success: boolean,
  walletAddress?: string,
  extra?: Record<string, unknown>
) {
  addBreadcrumb(`Blockchain: ${contractName}.${method}`, "blockchain", {
    success,
    walletAddress,
    ...extra,
  });

  if (!success) {
    Sentry.captureMessage(`Blockchain transaction failed: ${contractName}.${method}`, {
      level: "warning",
      tags: {
        contract: contractName,
        method,
      },
      extra,
    });
  }
}

/**
 * Record a lootbox opening event
 */
export function recordLootboxOpenEvent(
  lootboxId: string,
  userId: string,
  rewardRarity: string | null,
  vrfWaitTimeMs?: number
) {
  addBreadcrumb("Lootbox opened", "blockchain", {
    lootboxId,
    userId,
    rewardRarity,
    vrfWaitTimeMs,
  });

  Sentry.setMeasurement("lootbox.open.count", 1, "none");

  if (vrfWaitTimeMs) {
    Sentry.setMeasurement("lootbox.vrf_wait_ms", vrfWaitTimeMs, "millisecond");
  }

  if (rewardRarity && ["mythic", "cosmic"].includes(rewardRarity)) {
    Sentry.captureMessage(`Rare lootbox drop: ${rewardRarity}`, {
      level: "info",
      tags: {
        lootboxId,
        rarity: rewardRarity,
      },
    });
  }
}

/**
 * Record a marketplace transaction event
 */
export function recordMarketplaceTxEvent(
  type: "listing" | "purchase" | "auction" | "offer",
  nftId: string,
  price: string,
  success: boolean,
  walletAddress?: string
) {
  addBreadcrumb(`Marketplace: ${type}`, "blockchain", {
    nftId,
    price,
    success,
    walletAddress,
  });

  Sentry.setMeasurement(`marketplace.${type}.count`, 1, "none");
}

/**
 * Record a P2P trade event
 */
export function recordP2PTradeEvent(
  tradeId: string,
  status: string,
  itemCount: number,
  initiatorAddress: string,
  counterpartyAddress?: string
) {
  addBreadcrumb(`P2P Trade: ${status}`, "blockchain", {
    tradeId,
    status,
    itemCount,
    initiatorAddress,
    counterpartyAddress,
  });

  Sentry.setMeasurement("p2p.trade.count", 1, "none");
}
