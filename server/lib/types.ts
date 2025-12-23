// TypeScript types for the Next.js PWA Monitoring & Notification System
// These types match the database schema exactly

/**
 * Nickname entity represents a monitored Android application/device
 */
export interface Nickname {
  id: string; // UUID (primary key)
  nickname: string; // UTF-8, arbitrary Unicode text
  last_status: "connected" | "disconnected"; // Current connection status
  last_seen_at: number; // Unix timestamp in milliseconds
  created_at: number; // Unix timestamp in milliseconds
}

/**
 * Push subscription entity represents a user's push notification subscription
 */
export interface PushSubscription {
  id: string; // UUID (primary key)
  nickname_id: string; // Foreign key to Nickname.id
  endpoint: string; // Push service endpoint URL
  p256dh: string; // ECDH P-256 public key
  auth: string; // Authentication secret
  user_agent?: string; // Browser user agent (optional)
  created_at: number; // Unix timestamp in milliseconds
}

/**
 * Heartbeat request from Python client
 */
export interface HeartbeatRequest {
  nickname: string; // UTF-8 encoded nickname
  status: "connected" | "disconnected"; // Current status
  timestamp: number; // Unix timestamp in milliseconds
}

/**
 * Subscribe request from browser/PWA
 */
export interface SubscribeRequest {
  nickname: string; // UTF-8 encoded nickname
  subscription: {
    endpoint: string; // Push service endpoint URL
    keys: {
      p256dh: string; // ECDH P-256 public key
      auth: string; // Authentication secret
    };
  };
}

/**
 * Unsubscribe request from browser/PWA
 */
export interface UnsubscribeRequest {
  subscriptionId: string; // UUID of the subscription to cancel
}

/**
 * Push notification payload
 */
export interface PushNotificationPayload {
  title: string; // Notification title
  body: string; // Notification body (may contain Unicode)
  nickname: string; // Original nickname (UTF-8)
  status: "connected" | "disconnected"; // Current status
  timestamp: number; // Unix timestamp in milliseconds
  data: {
    nicknameEncoded: string; // Base64-URL encoded nickname for navigation
  };
}

/**
 * Database row types (matching Supabase query results)
 */
export type NicknameRow = Nickname;
export type PushSubscriptionRow = PushSubscription;

/**
 * Helper type for creating new entities (without id/created_at)
 */
export interface NewNickname {
  id: string; // UUID (application-generated)
  nickname: string;
  last_status: "connected" | "disconnected";
  last_seen_at: number;
  created_at: number;
}

export interface NewPushSubscription {
  id: string; // UUID (application-generated)
  nickname_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent?: string;
  created_at: number;
}