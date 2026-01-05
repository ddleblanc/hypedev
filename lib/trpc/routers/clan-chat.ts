/**
 * Clan Chat tRPC Router
 * Handles clan messaging: send/receive messages with rate limiting
 */
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../index';
import { clanChatBroadcaster } from '@/lib/clan-chat-broadcaster';
import type { PrismaClient } from '@prisma/client';

const MESSAGE_LIMIT = 50;
const RATE_LIMIT_MS = 1000; // 1 message per second

// Simple in-memory rate limit (use Redis in production)
const lastMessageTime = new Map<string, number>();

// Helper to get user from wallet address
async function getUserFromWallet(
  prisma: PrismaClient,
  walletAddress: string
): Promise<{ id: string; username: string | null; profilePicture: string | null; walletAddress: string }> {
  const user = await prisma.user.findUnique({
    where: { walletAddress: walletAddress.toLowerCase() },
    select: { id: true, username: true, profilePicture: true, walletAddress: true },
  });

  if (!user) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'User not found. Please complete profile setup.',
    });
  }

  return user;
}

export const clanChatRouter = router({
  // Get recent messages with pagination
  getMessages: protectedProcedure
    .input(
      z.object({
        clanId: z.string().uuid(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(MESSAGE_LIMIT),
      })
    )
    .query(async ({ ctx, input }) => {
      const user = await getUserFromWallet(ctx.prisma, ctx.walletAddress);

      // Verify membership
      const membership = await ctx.prisma.clanMember.findFirst({
        where: { clanId: input.clanId, userId: user.id },
      });

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not a member of this clan.',
        });
      }

      const messages = await ctx.prisma.clanMessage.findMany({
        where: {
          clanId: input.clanId,
          ...(input.cursor && { createdAt: { lt: new Date(input.cursor) } }),
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              profilePicture: true,
              walletAddress: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit + 1,
      });

      let nextCursor: string | undefined;
      if (messages.length > input.limit) {
        const nextItem = messages.pop();
        nextCursor = nextItem?.createdAt.toISOString();
      }

      return {
        messages: messages.reverse(), // Return in chronological order
        nextCursor,
      };
    }),

  // Send a message
  send: protectedProcedure
    .input(
      z.object({
        clanId: z.string().uuid(),
        content: z.string().min(1).max(500).trim(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await getUserFromWallet(ctx.prisma, ctx.walletAddress);

      // Rate limiting
      const lastTime = lastMessageTime.get(user.id) || 0;
      const now = Date.now();
      if (now - lastTime < RATE_LIMIT_MS) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Slow down! Wait a moment before sending another message.',
        });
      }
      lastMessageTime.set(user.id, now);

      // Verify membership
      const membership = await ctx.prisma.clanMember.findFirst({
        where: { clanId: input.clanId, userId: user.id },
      });

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not a member of this clan.',
        });
      }

      // Create message
      const message = await ctx.prisma.clanMessage.create({
        data: {
          clanId: input.clanId,
          senderId: user.id,
          content: input.content,
          isSystem: false,
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              profilePicture: true,
              walletAddress: true,
            },
          },
        },
      });

      // Broadcast to clan members via SSE
      clanChatBroadcaster.broadcastToChannel(input.clanId, {
        type: 'new_message',
        message: {
          id: message.id,
          content: message.content,
          isSystem: message.isSystem,
          createdAt: message.createdAt.toISOString(),
          sender: {
            id: message.sender.id,
            username: message.sender.username,
            avatar: message.sender.profilePicture,
            walletAddress: message.sender.walletAddress,
          },
        },
      });

      return message;
    }),

  // Get message history (older messages)
  getHistory: protectedProcedure
    .input(
      z.object({
        clanId: z.string().uuid(),
        before: z.string(), // ISO date string
        limit: z.number().min(1).max(100).default(MESSAGE_LIMIT),
      })
    )
    .query(async ({ ctx, input }) => {
      const user = await getUserFromWallet(ctx.prisma, ctx.walletAddress);

      // Verify membership
      const membership = await ctx.prisma.clanMember.findFirst({
        where: { clanId: input.clanId, userId: user.id },
      });

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not a member of this clan.',
        });
      }

      const messages = await ctx.prisma.clanMessage.findMany({
        where: {
          clanId: input.clanId,
          createdAt: { lt: new Date(input.before) },
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              profilePicture: true,
              walletAddress: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
      });

      return {
        messages: messages.reverse(),
        hasMore: messages.length === input.limit,
      };
    }),
});
