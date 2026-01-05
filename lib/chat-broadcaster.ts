import { EventEmitter } from 'events';

export interface ChatBroadcastEvent {
  type: 'world' | 'clan' | 'whisper';
  data: {
    id: string;
    messageType: string;
    content: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
  };
}

class ChatBroadcaster extends EventEmitter {
  private static instance: ChatBroadcaster;

  private constructor() {
    super();
    this.setMaxListeners(1000); // Support many concurrent connections
  }

  static getInstance(): ChatBroadcaster {
    if (!ChatBroadcaster.instance) {
      ChatBroadcaster.instance = new ChatBroadcaster();
    }
    return ChatBroadcaster.instance;
  }

  broadcastWorld(event: Omit<ChatBroadcastEvent['data'], 'id' | 'timestamp'>) {
    const fullEvent: ChatBroadcastEvent = {
      type: 'world',
      data: {
        ...event,
        id: `world-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        timestamp: new Date().toISOString(),
      },
    };
    this.emit('chat', fullEvent);
  }

  // Helper methods for common world events
  broadcastSale(nftName: string, collectionName: string, price: string, buyer: string, seller: string) {
    this.broadcastWorld({
      messageType: 'sale',
      content: `${buyer} bought ${nftName} for ${price} ETH`,
      metadata: { nftName, collectionName, price, buyer, seller },
    });
  }

  broadcastListing(nftName: string, collectionName: string, price: string, seller: string) {
    this.broadcastWorld({
      messageType: 'listing',
      content: `${seller} listed ${nftName} for ${price} ETH`,
      metadata: { nftName, collectionName, price, seller },
    });
  }

  broadcastLootboxOpen(username: string, rarity: string, rewardName: string) {
    this.broadcastWorld({
      messageType: 'lootbox',
      content: `${username} opened a ${rarity} lootbox and got ${rewardName}!`,
      metadata: { username, rarity, rewardName },
    });
  }

  broadcastAchievement(username: string, achievement: string) {
    this.broadcastWorld({
      messageType: 'achievement',
      content: `${username} unlocked "${achievement}"`,
      metadata: { username, achievement },
    });
  }

  broadcastTournament(message: string, tournamentName?: string) {
    this.broadcastWorld({
      messageType: 'tournament',
      content: message,
      metadata: tournamentName ? { tournamentName } : undefined,
    });
  }

  broadcastSystem(message: string) {
    this.broadcastWorld({
      messageType: 'system',
      content: message,
    });
  }
}

export const chatBroadcaster = ChatBroadcaster.getInstance();
