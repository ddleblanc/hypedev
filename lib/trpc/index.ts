/**
 * tRPC Server Configuration
 * This is the main entry point for the tRPC server
 */
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof Error && "issues" in error.cause
            ? (error.cause as { issues: unknown }).issues
            : null,
      },
    };
  },
});

// Base router and procedure helpers
export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

// Authenticated procedure - requires wallet connection
const isAuthed = middleware(async ({ ctx, next }) => {
  if (!ctx.walletAddress) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }
  return next({
    ctx: {
      ...ctx,
      walletAddress: ctx.walletAddress,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);

// Creator procedure - requires creator status
const isCreator = middleware(async ({ ctx, next }) => {
  if (!ctx.walletAddress) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const user = await ctx.prisma.user.findUnique({
    where: { walletAddress: ctx.walletAddress },
    select: { isCreator: true },
  });

  if (!user?.isCreator) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Creator status required",
    });
  }

  return next({ ctx });
});

export const creatorProcedure = protectedProcedure.use(isCreator);
