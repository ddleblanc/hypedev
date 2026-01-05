/**
 * Notification Broadcaster
 *
 * Manages SSE connections for real-time user notification updates.
 * Unlike activity-broadcaster (collection-based), this is user-based.
 */

export interface NotificationEvent {
  id: string;
  type: string;
  title: string;
  message: string | null;
  priority: string;
  actionType: string | null;
  actionStatus: string;
  isTimeSensitive: boolean;
  expiresAt: string | null;
  nftId: string | null;
  collectionId: string | null;
  tradeId: string | null;
  offerId: string | null;
  relatedUserId: string | null;
  relatedAddress: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

// Store active SSE connections by user ID
const connections = new Map<string, Set<ReadableStreamDefaultController>>();

// Connection count for monitoring
let totalConnections = 0;

/**
 * Register a new SSE connection for a user
 */
export function registerNotificationConnection(
  userId: string,
  controller: ReadableStreamDefaultController
): () => void {
  if (!connections.has(userId)) {
    connections.set(userId, new Set());
  }

  connections.get(userId)!.add(controller);
  totalConnections++;

  console.log(
    `[NotificationBroadcaster] Connection added for ${userId}. Total: ${totalConnections}`
  );

  // Return cleanup function
  return () => {
    connections.get(userId)?.delete(controller);
    totalConnections--;

    // Clean up empty sets
    if (connections.get(userId)?.size === 0) {
      connections.delete(userId);
    }

    console.log(
      `[NotificationBroadcaster] Connection removed for ${userId}. Total: ${totalConnections}`
    );
  };
}

/**
 * Broadcast a new notification to a specific user
 */
export function broadcastNotification(
  userId: string,
  notification: NotificationEvent
): void {
  const controllers = connections.get(userId);

  if (!controllers || controllers.size === 0) {
    return;
  }

  const message = formatSSEMessage("new", notification);
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
      `[NotificationBroadcaster] Sent ${notification.type} to ${successCount} connections for user ${userId}`
    );
  }
}

/**
 * Broadcast notification update (read, dismissed, action completed)
 */
export function broadcastNotificationUpdate(
  userId: string,
  notification: Partial<NotificationEvent> & { id: string }
): void {
  const controllers = connections.get(userId);

  if (!controllers || controllers.size === 0) {
    return;
  }

  const message = formatSSEMessage("update", notification);
  const encoded = new TextEncoder().encode(message);

  const failedControllers: ReadableStreamDefaultController[] = [];

  controllers.forEach((controller) => {
    try {
      controller.enqueue(encoded);
    } catch (error) {
      failedControllers.push(controller);
    }
  });

  // Remove failed connections
  failedControllers.forEach((controller) => {
    controllers.delete(controller);
    totalConnections--;
  });
}

/**
 * Broadcast notification deletion/dismissal
 */
export function broadcastNotificationDelete(
  userId: string,
  notificationId: string
): void {
  const controllers = connections.get(userId);

  if (!controllers || controllers.size === 0) {
    return;
  }

  const message = formatSSEMessage("delete", { id: notificationId });
  const encoded = new TextEncoder().encode(message);

  const failedControllers: ReadableStreamDefaultController[] = [];

  controllers.forEach((controller) => {
    try {
      controller.enqueue(encoded);
    } catch (error) {
      failedControllers.push(controller);
    }
  });

  // Remove failed connections
  failedControllers.forEach((controller) => {
    controllers.delete(controller);
    totalConnections--;
  });
}

/**
 * Send initial notifications to a new connection
 */
export function sendInitialNotifications(
  controller: ReadableStreamDefaultController,
  notifications: NotificationEvent[]
): void {
  try {
    const message = formatSSEMessage("initial", notifications);
    controller.enqueue(new TextEncoder().encode(message));
  } catch (error) {
    console.error(
      "[NotificationBroadcaster] Error sending initial notifications:",
      error
    );
  }
}

/**
 * Send heartbeat to keep connection alive
 */
export function sendNotificationHeartbeat(
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
  type: "initial" | "new" | "update" | "delete",
  data: unknown
): string {
  const payload = JSON.stringify({ type, data });
  return `data: ${payload}\n\n`;
}

/**
 * Get connection stats for monitoring
 */
export function getNotificationConnectionStats(): {
  total: number;
  byUser: Record<string, number>;
} {
  const byUser: Record<string, number> = {};

  connections.forEach((controllers, userId) => {
    byUser[userId] = controllers.size;
  });

  return {
    total: totalConnections,
    byUser,
  };
}

/**
 * Check if any connections exist for a user
 */
export function hasNotificationConnections(userId: string): boolean {
  return (connections.get(userId)?.size ?? 0) > 0;
}
