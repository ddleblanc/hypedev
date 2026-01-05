/**
 * Clan Chat Broadcaster
 * SSE-based real-time messaging for clan chat channels
 */
import { EventEmitter } from 'events';

export interface ClanChatMessageData {
  id: string;
  content: string;
  isSystem: boolean;
  createdAt: string;
  sender: {
    id: string;
    username: string | null;
    avatar: string | null;
    walletAddress: string;
  };
}

export interface ClanMemberData {
  id: string;
  username: string | null;
  walletAddress: string;
}

export type ClanChatEventType = 'new_message' | 'member_joined' | 'member_left' | 'member_kicked' | 'role_changed';

export interface ClanChatEvent {
  type: ClanChatEventType;
  message?: ClanChatMessageData;
  member?: ClanMemberData;
  newRole?: string;
}

class ClanChatBroadcaster {
  private emitter: EventEmitter;

  constructor() {
    this.emitter = new EventEmitter();
    // Support many concurrent clan channels
    this.emitter.setMaxListeners(1000);
  }

  /**
   * Broadcast an event to all subscribers of a clan channel
   */
  broadcastToChannel(clanId: string, event: ClanChatEvent): void {
    this.emitter.emit(`clan:${clanId}`, event);
  }

  /**
   * Subscribe to a clan channel
   * Returns an unsubscribe function
   */
  subscribeToChannel(
    clanId: string,
    callback: (event: ClanChatEvent) => void
  ): () => void {
    const channel = `clan:${clanId}`;
    this.emitter.on(channel, callback);

    return () => {
      this.emitter.off(channel, callback);
    };
  }

  /**
   * Get the number of subscribers for a clan channel
   */
  getListenerCount(clanId: string): number {
    return this.emitter.listenerCount(`clan:${clanId}`);
  }

  /**
   * Broadcast a member join event
   */
  broadcastMemberJoined(clanId: string, member: ClanMemberData): void {
    this.broadcastToChannel(clanId, {
      type: 'member_joined',
      member,
    });
  }

  /**
   * Broadcast a member leave event
   */
  broadcastMemberLeft(clanId: string, member: ClanMemberData): void {
    this.broadcastToChannel(clanId, {
      type: 'member_left',
      member,
    });
  }

  /**
   * Broadcast a member kicked event
   */
  broadcastMemberKicked(clanId: string, member: ClanMemberData): void {
    this.broadcastToChannel(clanId, {
      type: 'member_kicked',
      member,
    });
  }

  /**
   * Broadcast a role change event
   */
  broadcastRoleChanged(clanId: string, member: ClanMemberData, newRole: string): void {
    this.broadcastToChannel(clanId, {
      type: 'role_changed',
      member,
      newRole,
    });
  }
}

// Singleton instance
export const clanChatBroadcaster = new ClanChatBroadcaster();
