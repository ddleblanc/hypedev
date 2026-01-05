/**
 * Clan tRPC Router
 * Handles clan CRUD operations: create, join, leave, get members
 */
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, publicProcedure } from '../index';
import type { Context } from '../context';
import type { PrismaClient } from '@prisma/client';

// Helper to get user from wallet address
async function getUserFromWallet(
  prisma: PrismaClient,
  walletAddress: string
): Promise<{ id: string; username: string | null; walletAddress: string }> {
  const user = await prisma.user.findUnique({
    where: { walletAddress: walletAddress.toLowerCase() },
    select: { id: true, username: true, walletAddress: true },
  });

  if (!user) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'User not found. Please complete profile setup.',
    });
  }

  return user;
}

export const clanRouter = router({
  // Get user's current clan
  getMyClan: protectedProcedure.query(async ({ ctx }) => {
    const user = await getUserFromWallet(ctx.prisma, ctx.walletAddress);

    const membership = await ctx.prisma.clanMember.findFirst({
      where: { userId: user.id },
      include: {
        clan: {
          include: {
            owner: { select: { id: true, username: true, profilePicture: true } },
            _count: { select: { members: true } },
          },
        },
      },
    });

    if (!membership) return null;

    return {
      ...membership.clan,
      memberCount: membership.clan._count.members,
      myRole: membership.role,
    };
  }),

  // Get clan by ID
  getById: publicProcedure
    .input(z.object({ clanId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const clan = await ctx.prisma.clan.findUnique({
        where: { id: input.clanId },
        include: {
          owner: { select: { id: true, username: true, profilePicture: true, walletAddress: true } },
          members: {
            include: {
              user: { select: { id: true, username: true, profilePicture: true, walletAddress: true } },
            },
            orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
          },
          _count: { select: { members: true, messages: true } },
        },
      });

      if (!clan) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Clan not found' });
      }

      return clan;
    }),

  // Search/list clans
  list: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const clans = await ctx.prisma.clan.findMany({
        where: input.search
          ? {
              OR: [
                { name: { contains: input.search, mode: 'insensitive' } },
                { tag: { contains: input.search.toUpperCase(), mode: 'insensitive' } },
              ],
            }
          : undefined,
        include: {
          owner: { select: { id: true, username: true, profilePicture: true } },
          _count: { select: { members: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
      });

      let nextCursor: string | undefined;
      if (clans.length > input.limit) {
        const nextItem = clans.pop();
        nextCursor = nextItem?.id;
      }

      return { clans, nextCursor };
    }),

  // Create a new clan
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(3).max(32).trim(),
        tag: z.string().min(2).max(6).regex(/^[A-Z0-9]+$/, 'Tag must be uppercase letters and numbers only'),
        description: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await getUserFromWallet(ctx.prisma, ctx.walletAddress);

      // Check if user already in a clan
      const existingMembership = await ctx.prisma.clanMember.findFirst({
        where: { userId: user.id },
      });

      if (existingMembership) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'You are already in a clan. Leave your current clan first.',
        });
      }

      // Check if name or tag already taken
      const existingClan = await ctx.prisma.clan.findFirst({
        where: {
          OR: [
            { name: { equals: input.name, mode: 'insensitive' } },
            { tag: input.tag.toUpperCase() },
          ],
        },
      });

      if (existingClan) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: existingClan.name.toLowerCase() === input.name.toLowerCase()
            ? 'A clan with this name already exists.'
            : 'This tag is already taken.',
        });
      }

      // Create clan with owner as first member in transaction
      const clan = await ctx.prisma.$transaction(async (tx) => {
        const newClan = await tx.clan.create({
          data: {
            name: input.name,
            tag: input.tag.toUpperCase(),
            description: input.description,
            ownerId: user.id,
          },
        });

        await tx.clanMember.create({
          data: {
            clanId: newClan.id,
            userId: user.id,
            role: 'OWNER',
          },
        });

        // Create system message
        await tx.clanMessage.create({
          data: {
            clanId: newClan.id,
            senderId: user.id,
            content: 'Clan created! Welcome to the family.',
            isSystem: true,
          },
        });

        return newClan;
      });

      return clan;
    }),

  // Join a clan
  join: protectedProcedure
    .input(z.object({ clanId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const user = await getUserFromWallet(ctx.prisma, ctx.walletAddress);

      // Check if user already in a clan
      const existingMembership = await ctx.prisma.clanMember.findFirst({
        where: { userId: user.id },
      });

      if (existingMembership) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'You are already in a clan.',
        });
      }

      // Check if clan exists
      const clan = await ctx.prisma.clan.findUnique({
        where: { id: input.clanId },
      });

      if (!clan) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Clan not found' });
      }

      // Join clan in transaction
      const membership = await ctx.prisma.$transaction(async (tx) => {
        const member = await tx.clanMember.create({
          data: {
            clanId: input.clanId,
            userId: user.id,
            role: 'MEMBER',
          },
        });

        await tx.clanMessage.create({
          data: {
            clanId: input.clanId,
            senderId: user.id,
            content: `${user.username || user.walletAddress?.slice(0, 8) || 'Someone'} has joined the clan!`,
            isSystem: true,
          },
        });

        return member;
      });

      return membership;
    }),

  // Leave a clan
  leave: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await getUserFromWallet(ctx.prisma, ctx.walletAddress);

    const membership = await ctx.prisma.clanMember.findFirst({
      where: { userId: user.id },
      include: { clan: true },
    });

    if (!membership) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'You are not in a clan.',
      });
    }

    if (membership.role === 'OWNER') {
      // Check if there are other members
      const memberCount = await ctx.prisma.clanMember.count({
        where: { clanId: membership.clanId },
      });

      if (memberCount > 1) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Owners cannot leave while there are other members. Transfer ownership or kick all members first.',
        });
      }

      // Owner is the only member, delete the clan
      await ctx.prisma.clan.delete({
        where: { id: membership.clanId },
      });

      return { success: true, disbanded: true };
    }

    // Regular member leaving
    await ctx.prisma.$transaction(async (tx) => {
      await tx.clanMember.delete({
        where: { id: membership.id },
      });

      await tx.clanMessage.create({
        data: {
          clanId: membership.clanId,
          senderId: user.id,
          content: `${user.username || user.walletAddress?.slice(0, 8) || 'Someone'} has left the clan.`,
          isSystem: true,
        },
      });
    });

    return { success: true, disbanded: false };
  }),

  // Get clan members
  getMembers: publicProcedure
    .input(z.object({ clanId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const members = await ctx.prisma.clanMember.findMany({
        where: { clanId: input.clanId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              profilePicture: true,
              walletAddress: true,
            },
          },
        },
        orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
      });

      return members;
    }),

  // Kick a member (owner/officer only)
  kickMember: protectedProcedure
    .input(z.object({ memberId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const user = await getUserFromWallet(ctx.prisma, ctx.walletAddress);

      // Get the target member
      const targetMember = await ctx.prisma.clanMember.findUnique({
        where: { id: input.memberId },
        include: {
          user: { select: { username: true, walletAddress: true } },
          clan: true,
        },
      });

      if (!targetMember) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Member not found' });
      }

      // Get the caller's membership
      const callerMembership = await ctx.prisma.clanMember.findFirst({
        where: { userId: user.id, clanId: targetMember.clanId },
      });

      if (!callerMembership) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You are not in this clan' });
      }

      // Permission checks
      if (callerMembership.role === 'MEMBER') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only officers and owners can kick members' });
      }

      if (targetMember.role === 'OWNER') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot kick the owner' });
      }

      if (targetMember.role === 'OFFICER' && callerMembership.role !== 'OWNER') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only owners can kick officers' });
      }

      // Kick the member
      await ctx.prisma.$transaction(async (tx) => {
        await tx.clanMember.delete({
          where: { id: input.memberId },
        });

        await tx.clanMessage.create({
          data: {
            clanId: targetMember.clanId,
            senderId: user.id,
            content: `${targetMember.user.username || targetMember.user.walletAddress?.slice(0, 8)} was kicked from the clan.`,
            isSystem: true,
          },
        });
      });

      return { success: true };
    }),

  // Promote/demote member (owner only)
  setMemberRole: protectedProcedure
    .input(
      z.object({
        memberId: z.string().uuid(),
        role: z.enum(['OFFICER', 'MEMBER']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await getUserFromWallet(ctx.prisma, ctx.walletAddress);

      // Get the target member
      const targetMember = await ctx.prisma.clanMember.findUnique({
        where: { id: input.memberId },
        include: { user: { select: { username: true, walletAddress: true } } },
      });

      if (!targetMember) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Member not found' });
      }

      // Get the caller's membership
      const callerMembership = await ctx.prisma.clanMember.findFirst({
        where: { userId: user.id, clanId: targetMember.clanId },
      });

      if (!callerMembership || callerMembership.role !== 'OWNER') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only owners can change roles' });
      }

      if (targetMember.role === 'OWNER') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot change owner role' });
      }

      // Update role
      await ctx.prisma.$transaction(async (tx) => {
        await tx.clanMember.update({
          where: { id: input.memberId },
          data: { role: input.role },
        });

        const action = input.role === 'OFFICER' ? 'promoted to Officer' : 'demoted to Member';
        await tx.clanMessage.create({
          data: {
            clanId: targetMember.clanId,
            senderId: user.id,
            content: `${targetMember.user.username || targetMember.user.walletAddress?.slice(0, 8)} was ${action}.`,
            isSystem: true,
          },
        });
      });

      return { success: true };
    }),
});
