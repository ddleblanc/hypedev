/**
 * OpenTelemetry configuration for distributed tracing
 * Provides manual instrumentation helpers using the OpenTelemetry API
 */
import { trace, SpanStatusCode, type Span } from "@opentelemetry/api";

// Get tracer for manual instrumentation
export function getTracer(name = "hpx") {
  return trace.getTracer(name);
}

// Helper for creating spans
export async function withSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  attributes?: Record<string, string | number | boolean>
): Promise<T> {
  const tracer = getTracer();
  return tracer.startActiveSpan(name, async (span) => {
    if (attributes) {
      span.setAttributes(attributes);
    }
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
}

// Custom metrics helpers
export function recordBlockchainTransaction(
  contractName: string,
  method: string,
  success: boolean,
  gasUsed?: number
) {
  const tracer = getTracer();
  const span = tracer.startSpan("blockchain.transaction");
  span.setAttributes({
    "blockchain.contract": contractName,
    "blockchain.method": method,
    "blockchain.success": success,
    ...(gasUsed && { "blockchain.gas_used": gasUsed }),
  });
  span.end();
}

export function recordLootboxOpen(
  lootboxId: string,
  rarity: string,
  vrfWaitTime: number
) {
  const tracer = getTracer();
  const span = tracer.startSpan("lootbox.open");
  span.setAttributes({
    "lootbox.id": lootboxId,
    "lootbox.reward_rarity": rarity,
    "lootbox.vrf_wait_ms": vrfWaitTime,
  });
  span.end();
}

export function recordP2PTrade(
  tradeId: string,
  initiatorAddress: string,
  counterpartyAddress: string,
  itemCount: number,
  success: boolean
) {
  const tracer = getTracer();
  const span = tracer.startSpan("p2p.trade");
  span.setAttributes({
    "p2p.trade_id": tradeId,
    "p2p.initiator": initiatorAddress,
    "p2p.counterparty": counterpartyAddress,
    "p2p.item_count": itemCount,
    "p2p.success": success,
  });
  span.end();
}

export function recordMarketplaceTransaction(
  type: "listing" | "auction" | "offer" | "purchase",
  nftId: string,
  price: string,
  success: boolean
) {
  const tracer = getTracer();
  const span = tracer.startSpan("marketplace.transaction");
  span.setAttributes({
    "marketplace.type": type,
    "marketplace.nft_id": nftId,
    "marketplace.price": price,
    "marketplace.success": success,
  });
  span.end();
}
