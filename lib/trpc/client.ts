/**
 * tRPC Client Configuration
 * For use with TanStack Query
 */
import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "./routers/_app";

export const trpc = createTRPCReact<AppRouter>();

export function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  // SSR should use localhost
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export function getTRPCClientConfig() {
  return {
    links: [
      httpBatchLink({
        url: `${getBaseUrl()}/api/trpc`,
        transformer: superjson,
        headers() {
          // Headers are set dynamically by the provider
          return {};
        },
      }),
    ],
  };
}
