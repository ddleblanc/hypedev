import { prisma } from '@/lib/prisma';

export interface Friend {
  id: string;
  username: string | null;
  avatar: string | null;
  walletAddress: string;
  isOnline?: boolean;
}

/**
 * Check if two users are mutual followers (friends)
 * Users can only whisper to friends to prevent spam
 */
export async function areFriends(userId1: string, userId2: string): Promise<boolean> {
  const follows = await prisma.userFollow.findMany({
    where: {
      OR: [
        { followerId: userId1, followingId: userId2 },
        { followerId: userId2, followingId: userId1 },
      ],
    },
  });

  return follows.length === 2; // Both directions = mutual follow
}

/**
 * Get all friends (mutual followers) for a user
 */
export async function getFriends(userId: string): Promise<Friend[]> {
  // Get users I follow
  const following = await prisma.userFollow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  const followingIds = following.map((f) => f.followingId);

  if (followingIds.length === 0) {
    return [];
  }

  // Get users who follow me back (mutual)
  const mutualFollows = await prisma.userFollow.findMany({
    where: {
      followerId: { in: followingIds },
      followingId: userId,
    },
    include: {
      follower: {
        select: {
          id: true,
          username: true,
          profilePicture: true,
          walletAddress: true,
        },
      },
    },
  });

  return mutualFollows.map((f) => ({
    id: f.follower.id,
    username: f.follower.username,
    avatar: f.follower.profilePicture,
    walletAddress: f.follower.walletAddress,
  }));
}

/**
 * Get or create a conversation between two users
 * Returns the conversation ID
 */
export async function getOrCreateConversation(
  userId1: string,
  userId2: string
): Promise<string> {
  // Check if conversation exists
  // A conversation between two users has exactly 2 participants: userId1 and userId2
  const existingParticipant = await prisma.conversationParticipant.findFirst({
    where: {
      userId: userId1,
      conversation: {
        participants: {
          some: { userId: userId2 },
        },
      },
    },
    include: {
      conversation: {
        include: {
          participants: true,
        },
      },
    },
  });

  // Verify it's a 1:1 conversation (exactly 2 participants)
  if (
    existingParticipant &&
    existingParticipant.conversation.participants.length === 2
  ) {
    return existingParticipant.conversationId;
  }

  // Create new conversation
  const conversation = await prisma.conversation.create({
    data: {
      participants: {
        createMany: {
          data: [{ userId: userId1 }, { userId: userId2 }],
        },
      },
    },
  });

  return conversation.id;
}
