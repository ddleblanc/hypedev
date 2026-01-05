/**
 * Activity Broadcaster
 *
 * Manages SSE connections for real-time activity feeds.
 * Supports per-collection and global subscriptions.
 * Includes event deduplication to prevent duplicate broadcasts.
 *
 * Also broadcasts activity events to the World chat channel.
 */

import { chatBroadcaster } from './chat-broadcaster';

export interface ActivityEvent {
  id: string;
  type: string;
  item: string;
  image: string | null;
  price: string;
  from: string;
  to: string;
  timestamp: string;
  txHash: string;
}

// Store active SSE connections by collection ID
// "global" is a special key for all activity
const connections = new Map<string, Set<ReadableStreamDefaultController>>();

// Connection count for monitoring
let totalConnections = 0;

// Event deduplication: track recently broadcast events by collection
// Key: collectionId, Value: Set of event IDs with timestamps
const recentEvents = new Map<string, Map<string, number>>();
const DEDUP_WINDOW_MS = 60000; // 1 minute deduplication window

/**
 * Check if an event was recently broadcast to avoid duplicates
 */
function isDuplicateEvent(collectionId: string, eventId: string): boolean {
  const events = recentEvents.get(collectionId);
  if (!events) return false;

  const timestamp = events.get(eventId);
  if (!timestamp) return false;

  // Check if within dedup window
  return Date.now() - timestamp < DEDUP_WINDOW_MS;
}

/**
 * Mark an event as recently broadcast
 */
function markEventBroadcast(collectionId: string, eventId: string): void {
  if (!recentEvents.has(collectionId)) {
    recentEvents.set(collectionId, new Map());
  }
  recentEvents.get(collectionId)!.set(eventId, Date.now());

  // Clean up old events periodically (every 100 events)
  const events = recentEvents.get(collectionId)!;
  if (events.size > 100) {
    cleanupOldEvents(collectionId);
  }
}

/**
 * Remove events outside the dedup window
 */
function cleanupOldEvents(collectionId: string): void {
  const events = recentEvents.get(collectionId);
  if (!events) return;

  const now = Date.now();
  for (const [eventId, timestamp] of events) {
    if (now - timestamp >= DEDUP_WINDOW_MS) {
      events.delete(eventId);
    }
  }
}

/**
 * Register a new SSE connection for a collection
 */
export function registerConnection(
  collectionId: string,
  controller: ReadableStreamDefaultController
): () => void {
  if (!connections.has(collectionId)) {
    connections.set(collectionId, new Set());
  }

  connections.get(collectionId)!.add(controller);
  totalConnections++;

  console.log(
    `[Broadcaster] Connection added for ${collectionId}. Total: ${totalConnections}`
  );

  // Return cleanup function
  return () => {
    connections.get(collectionId)?.delete(controller);
    totalConnections--;

    // Clean up empty sets
    if (connections.get(collectionId)?.size === 0) {
      connections.delete(collectionId);
    }

    console.log(
      `[Broadcaster] Connection removed for ${collectionId}. Total: ${totalConnections}`
    );
  };
}

/**
 * Broadcast an activity event to all connections for a collection
 * Returns true if event was broadcast, false if duplicate or no connections
 */
export function broadcastToCollection(
  collectionId: string,
  activity: ActivityEvent
): boolean {
  try {
    const controllers = connections.get(collectionId);

    if (!controllers || controllers.size === 0) {
      return false;
    }

    // Check for duplicate events to prevent double-broadcasting
    if (isDuplicateEvent(collectionId, activity.id)) {
      console.log(
        `[Broadcaster] Skipping duplicate event ${activity.id} for ${collectionId}`
      );
      return false;
    }

    // Mark this event as broadcast
    markEventBroadcast(collectionId, activity.id);

    const message = formatSSEMessage("new", [activity]);
    const encoded = new TextEncoder().encode(message);

    let successCount = 0;
    const failedControllers: ReadableStreamDefaultController[] = [];

    controllers.forEach((controller) => {
      try {
        controller.enqueue(encoded);
        successCount++;
      } catch (error) {
        // Connection closed, mark for removal
        failedControllers.push(controller);
      }
    });

    // Remove failed connections
    failedControllers.forEach((controller) => {
      controllers.delete(controller);
      totalConnections--;
    });

    if (successCount > 0) {
      console.log(
        `[Broadcaster] Sent ${activity.type} to ${successCount} connections for ${collectionId}`
      );
    }

    return successCount > 0;
  } catch (error) {
    console.error(
      `[Broadcaster] Error broadcasting to ${collectionId}:`,
      error
    );
    return false;
  }
}

/**
 * Broadcast activity to World chat channel
 * Maps activity types to appropriate chat messages
 */
function broadcastToWorldChat(activity: ActivityEvent): void {
  try {
    switch (activity.type.toLowerCase()) {
      case 'sale':
      case 'purchase':
        chatBroadcaster.broadcastSale(
          activity.item,
          '', // Collection name not available in ActivityEvent, will use item name
          activity.price,
          activity.to, // buyer
          activity.from // seller
        );
        break;

      case 'listing':
      case 'list':
        chatBroadcaster.broadcastListing(
          activity.item,
          '', // Collection name not available
          activity.price,
          activity.from // seller
        );
        break;

      case 'transfer':
        // Optionally broadcast transfers - could be noisy, so we skip for now
        break;

      default:
        // Unknown activity type - log for debugging but don't broadcast
        console.log(`[Broadcaster] Unknown activity type for chat: ${activity.type}`);
        break;
    }
  } catch (error) {
    console.error('[Broadcaster] Error broadcasting to World chat:', error);
  }
}

/**
 * Broadcast to all connections (global event)
 * Returns true if event was broadcast to at least one connection
 */
export function broadcastGlobal(activity: ActivityEvent): boolean {
  try {
    // Broadcast to World chat channel
    broadcastToWorldChat(activity);

    // Broadcast to global SSE subscribers
    return broadcastToCollection("global", activity);
  } catch (error) {
    console.error("[Broadcaster] Error in broadcastGlobal:", error);
    return false;
  }
}

/**
 * Send initial activities to a new connection
 * Returns true if successful, false otherwise
 */
export function sendInitialActivities(
  controller: ReadableStreamDefaultController,
  activities: ActivityEvent[]
): boolean {
  try {
    const message = formatSSEMessage("initial", activities);
    controller.enqueue(new TextEncoder().encode(message));
    return true;
  } catch (error) {
    console.error("[Broadcaster] Error sending initial activities:", error);
    return false;
  }
}

/**
 * Send heartbeat to keep connection alive
 */
export function sendHeartbeat(
  controller: ReadableStreamDefaultController
): boolean {
  try {
    controller.enqueue(new TextEncoder().encode(": heartbeat\n\n"));
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Format SSE message
 */
function formatSSEMessage(
  type: "initial" | "new" | "heartbeat",
  activities: ActivityEvent[]
): string {
  const data = JSON.stringify({ type, activities });
  return `data: ${data}\n\n`;
}

/**
 * Get connection stats for monitoring
 */
export function getConnectionStats(): {
  total: number;
  byCollection: Record<string, number>;
} {
  const byCollection: Record<string, number> = {};

  connections.forEach((controllers, collectionId) => {
    byCollection[collectionId] = controllers.size;
  });

  return {
    total: totalConnections,
    byCollection,
  };
}

/**
 * Check if any connections exist for a collection
 */
export function hasConnections(collectionId: string): boolean {
  return (connections.get(collectionId)?.size ?? 0) > 0;
}
