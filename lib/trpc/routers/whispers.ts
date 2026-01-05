/**
 * Whispers tRPC Router
 * Handles direct messaging between friends (mutual followers)
 */
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../index';
import { areFriends, getOrCreateConversation, getFriends } from '@/lib/friends';
import { whisperBroadcaster } from '@/lib/whisper-broadcaster';
import type { PrismaClient } from '@prisma/client';

const MESSAGE_LIMIT = 50;
const RATE_LIMIT_MS = 500; // 2 messages per second

// Simple in-memory rate limit (use Redis in production)
const lastMessageTime = new Map<string, number>();

// Helper to get user from wallet address
async function getUserFromWallet(
  prisma: PrismaClient,
  walletAddress: string
): Promise<{
  id: string;
  username: string | null;
  profilePicture: string | null;
  walletAddress: string;
}> {
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

export const whispersRouter = router({
  // Get friends list (mutual followers)
  getFriends: protectedProcedure.query(async ({ ctx }) => {
    const user = await getUserFromWallet(ctx.prisma, ctx.walletAddress);
    return getFriends(user.id);
  }),

  // Get all conversations
  getConversations: protectedProcedure.query(async ({ ctx }) => {
    const user = await getUserFromWallet(ctx.prisma, ctx.walletAddress);

    const participants = await ctx.prisma.conversationParticipant.findMany({
      where: {
        userId: user.id,
        isArchived: false,
      },
      include: {
        conversation: {
          include: {
            participants: {
              where: { userId: { not: user.id } },
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
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                sender: {
                  select: { id: true, username: true },
                },
              },
            },
          },
        },
      },
      orderBy: { conversation: { updatedAt: 'desc' } },
    });

    return participants.map((cp) => {
      const otherParticipant = cp.conversation.participants[0];
      const lastMessage = cp.conversation.messages[0];

      // Calculate unread count based on lastReadAt
      const unreadCount =
        lastMessage && new Date(lastMessage.createdAt) > cp.lastReadAt
          ? 1
          : 0;

      return {
        id: cp.conversation.id,
        friend: otherParticipant?.user
          ? {
              id: otherParticipant.user.id,
              username: otherParticipant.user.username,
              avatar: otherParticipant.user.profilePicture,
              walletAddress: otherParticipant.user.walletAddress,
            }
          : null,
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              senderId: lastMessage.senderId,
              senderName: lastMessage.sender.username,
              createdAt: lastMessage.createdAt.toISOString(),
            }
          : null,
        unreadCount,
        lastReadAt: cp.lastReadAt.toISOString(),
      };
    });
  }),

  // Get messages in a conversation
  getMessages: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(MESSAGE_LIMIT),
      })
    )
    .query(async ({ ctx, input }) => {
      const user = await getUserFromWallet(ctx.prisma, ctx.walletAddress);

      // Verify participation
      const participation = await ctx.prisma.conversationParticipant.findFirst({
        where: {
          conversationId: input.conversationId,
          userId: user.id,
        },
      });

      if (!participation) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not part of this conversation.',
        });
      }

      const messages = await ctx.prisma.directMessage.findMany({
        where: {
          conversationId: input.conversationId,
          ...(input.cursor && { id: { lt: input.cursor } }),
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
          attachedNft: {
            select: {
              id: true,
              name: true,
              image: true,
              tokenId: true,
              collectionId: true,
              ownerAddress: true,
              rarityTier: true,
              listingPrice: true,
              collection: {
                select: {
                  name: true,
                  symbol: true,
                  image: true,
                  floorPrice: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit + 1,
      });

      let nextCursor: string | undefined;
      if (messages.length > input.limit) {
        const nextItem = messages.pop();
        nextCursor = nextItem?.id;
      }

      return {
        messages: messages.reverse().map((m) => ({
          id: m.id,
          content: m.content,
          createdAt: m.createdAt.toISOString(),
          sender: {
            id: m.sender.id,
            username: m.sender.username,
            avatar: m.sender.profilePicture,
            walletAddress: m.sender.walletAddress,
          },
          attachedNft: m.attachedNft
            ? {
                id: m.attachedNft.id,
                name: m.attachedNft.name,
                image: m.attachedNft.image,
                tokenId: m.attachedNft.tokenId,
                collectionId: m.attachedNft.collectionId,
                ownerAddress: m.attachedNft.ownerAddress,
                rarityTier: m.attachedNft.rarityTier,
                listingPrice: m.attachedNft.listingPrice,
                collection: m.attachedNft.collection,
              }
            : null,
        })),
        nextCursor,
      };
    }),

  // Start or get conversation with a friend
  startConversation: protectedProcedure
    .input(z.object({ friendId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const user = await getUserFromWallet(ctx.prisma, ctx.walletAddress);

      // Verify friendship
      const isFriend = await areFriends(user.id, input.friendId);
      if (!isFriend) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only message friends (mutual followers).',
        });
      }

      const conversationId = await getOrCreateConversation(
        user.id,
        input.friendId
      );
      return { conversationId };
    }),

  // Send a whisper
  send: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        content: z.string().min(1).max(500).trim(),
        attachedNftId: z.string().uuid().optional(), // NFT attachment support
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
          message: 'Slow down!',
        });
      }
      lastMessageTime.set(user.id, now);

      // Verify participation and get other participant
      const participants = await ctx.prisma.conversationParticipant.findMany({
        where: { conversationId: input.conversationId },
        include: {
          user: {
            select: { id: true, username: true, profilePicture: true },
          },
        },
      });

      const myParticipation = participants.find((p) => p.userId === user.id);
      const otherParticipant = participants.find((p) => p.userId !== user.id);

      if (!myParticipation) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not part of this conversation.',
        });
      }

      // Verify still friends
      if (otherParticipant) {
        const stillFriends = await areFriends(user.id, otherParticipant.userId);
        if (!stillFriends) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You can only message friends.',
          });
        }
      }

      // Validate NFT attachment if provided
      if (input.attachedNftId) {
        const nft = await ctx.prisma.nft.findUnique({
          where: { id: input.attachedNftId },
          select: { id: true, ownerAddress: true },
        });
        if (!nft) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'NFT not found',
          });
        }
        // Verify sender owns the NFT
        if (nft.ownerAddress?.toLowerCase() !== ctx.walletAddress.toLowerCase()) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You can only share NFTs you own',
          });
        }
      }

      // Create message and update conversation in a transaction
      const message = await ctx.prisma.$transaction(async (tx) => {
        const msg = await tx.directMessage.create({
          data: {
            conversationId: input.conversationId,
            senderId: user.id,
            content: input.content,
            attachedNftId: input.attachedNftId,
          },
          include: {
            sender: {
              select: { id: true, username: true, profilePicture: true, walletAddress: true },
            },
            attachedNft: {
              select: {
                id: true,
                name: true,
                image: true,
                tokenId: true,
                collectionId: true,
                ownerAddress: true,
                rarityTier: true,
                listingPrice: true,
                collection: {
                  select: {
                    name: true,
                    symbol: true,
                    image: true,
                    floorPrice: true,
                  },
                },
              },
            },
          },
        });

        // Update conversation timestamp
        await tx.conversation.update({
          where: { id: input.conversationId },
          data: { updatedAt: new Date() },
        });

        // Mark as read for sender
        await tx.conversationParticipant.update({
          where: { id: myParticipation.id },
          data: { lastReadAt: new Date() },
        });

        return msg;
      });

      // Broadcast to recipient via SSE
      if (otherParticipant) {
        whisperBroadcaster.broadcastToUser(otherParticipant.userId, {
          type: 'new_whisper',
          conversationId: input.conversationId,
          message: {
            id: message.id,
            content: message.content,
            createdAt: message.createdAt.toISOString(),
            sender: {
              id: message.sender.id,
              username: message.sender.username,
              avatar: message.sender.profilePicture,
              walletAddress: message.sender.walletAddress,
            },
            attachedNft: message.attachedNft
              ? {
                  id: message.attachedNft.id,
                  name: message.attachedNft.name,
                  image: message.attachedNft.image,
                  tokenId: message.attachedNft.tokenId,
                  collectionId: message.attachedNft.collectionId,
                  ownerAddress: message.attachedNft.ownerAddress,
                  rarityTier: message.attachedNft.rarityTier,
                  listingPrice: message.attachedNft.listingPrice,
                  collection: message.attachedNft.collection,
                }
              : null,
          },
        });
      }

      return {
        id: message.id,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
        sender: {
          id: message.sender.id,
          username: message.sender.username,
          avatar: message.sender.profilePicture,
          walletAddress: message.sender.walletAddress,
        },
        attachedNft: message.attachedNft
          ? {
              id: message.attachedNft.id,
              name: message.attachedNft.name,
              image: message.attachedNft.image,
              tokenId: message.attachedNft.tokenId,
              collectionId: message.attachedNft.collectionId,
              ownerAddress: message.attachedNft.ownerAddress,
              rarityTier: message.attachedNft.rarityTier,
              listingPrice: message.attachedNft.listingPrice,
              collection: message.attachedNft.collection,
            }
          : null,
      };
    }),

  // Mark conversation as read
  markRead: protectedProcedure
    .input(z.object({ conversationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const user = await getUserFromWallet(ctx.prisma, ctx.walletAddress);

      await ctx.prisma.conversationParticipant.updateMany({
        where: {
          conversationId: input.conversationId,
          userId: user.id,
        },
        data: { lastReadAt: new Date() },
      });

      return { success: true };
    }),

  // Archive conversation (hide from list)
  archive: protectedProcedure
    .input(z.object({ conversationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const user = await getUserFromWallet(ctx.prisma, ctx.walletAddress);

      await ctx.prisma.conversationParticipant.updateMany({
        where: {
          conversationId: input.conversationId,
          userId: user.id,
        },
        data: { isArchived: true },
      });

      return { success: true };
    }),

  // Unarchive conversation
  unarchive: protectedProcedure
    .input(z.object({ conversationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const user = await getUserFromWallet(ctx.prisma, ctx.walletAddress);

      await ctx.prisma.conversationParticipant.updateMany({
        where: {
          conversationId: input.conversationId,
          userId: user.id,
        },
        data: { isArchived: false },
      });

      return { success: true };
    }),
});
