import { EventEmitter } from 'events';

export interface WhisperMessagePayload {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    username: string | null;
    avatar: string | null;
    walletAddress?: string;
  };
  attachedNft?: {
    id: string;
    name: string;
    image: string;
    tokenId: string;
    collectionId: string;
    ownerAddress?: string | null;
    rarityTier?: string | null;
    listingPrice?: number | null;
    collection?: {
      name: string;
      symbol: string;
      image?: string | null;
      floorPrice?: number | null;
    } | null;
  } | null;
}

export interface WhisperEvent {
  type: 'new_whisper' | 'typing' | 'read' | 'connected';
  conversationId?: string;
  message?: WhisperMessagePayload;
  userId?: string;
}

/**
 * Whisper Broadcaster - User-specific SSE channels for direct messages
 * Each user gets their own event channel for receiving whispers
 */
class WhisperBroadcaster {
  private emitter: EventEmitter;

  constructor() {
    this.emitter = new EventEmitter();
    // Allow many concurrent users
    this.emitter.setMaxListeners(5000);
  }

  /**
   * Broadcast an event to a specific user
   */
  broadcastToUser(userId: string, event: WhisperEvent): void {
    this.emitter.emit(`user:${userId}`, event);
  }

  /**
   * Subscribe to events for a specific user
   * Returns an unsubscribe function
   */
  subscribeToUser(
    userId: string,
    callback: (event: WhisperEvent) => void
  ): () => void {
    const channel = `user:${userId}`;
    this.emitter.on(channel, callback);

    return () => {
      this.emitter.off(channel, callback);
    };
  }

  /**
   * Get the number of listeners for a user channel
   * Useful for debugging and monitoring
   */
  getListenerCount(userId: string): number {
    return this.emitter.listenerCount(`user:${userId}`);
  }
}

// Singleton instance
export const whisperBroadcaster = new WhisperBroadcaster();
