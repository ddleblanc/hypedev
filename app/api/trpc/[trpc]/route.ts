/**
 * tRPC API Handler for Next.js App Router
 */
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/lib/trpc/routers/_app";
import { createContext } from "@/lib/trpc/context";
import { rateLimit } from "@/lib/rate-limit";
import type { NextRequest } from "next/server";

const handler = async (req: NextRequest) => {
  // Apply rate limiting to all tRPC requests
  const rateLimitResult = await rateLimit(req, "api");
  if (rateLimitResult) return rateLimitResult;

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext({ req }),
    onError:
      process.env.NODE_ENV === "development"
        ? ({ path, error }) => {
            console.error(`tRPC error on '${path}':`, error);
          }
        : undefined,
  });
};

export { handler as GET, handler as POST };
