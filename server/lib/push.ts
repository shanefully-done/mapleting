// Push notification utility for Web Push API
// Handles VAPID key validation and push notification delivery

import webpush from "web-push";
import type { PushSubscription, PushNotificationPayload } from "./types";

// Environment variables for VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

/**
 * Initialize VAPID keys for push notifications
 * This must be called before any push operations
 */
export function initializeVAPID(): void {
  if (!vapidPublicKey) {
    throw new Error("NEXT_PUBLIC_VAPID_PUBLIC_KEY environment variable is not set");
  }

  if (!vapidPrivateKey) {
    throw new Error("VAPID_PRIVATE_KEY environment variable is not set");
  }

  webpush.setVapidDetails(
    vapidSubject,
    vapidPublicKey,
    vapidPrivateKey
  );
}

/**
 * Validate VAPID keys format
 * @returns true if keys are valid format, false otherwise
 */
export function validateVAPIDKeys(): boolean {
  try {
    if (!vapidPublicKey || !vapidPrivateKey) {
      return false;
    }

    // Basic format validation - VAPID keys should be base64url encoded
    const urlSafeBase64Regex = /^[A-Za-z0-9_-]+$/;
    
    if (!urlSafeBase64Regex.test(vapidPublicKey) || !urlSafeBase64Regex.test(vapidPrivateKey)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Send a push notification to a subscription
 * 
 * @param subscription - Push subscription details
 * @param payload - Notification payload to send
 * @returns Promise that resolves when notification is sent
 * @throws Error if notification fails (except for expired endpoints)
 */
export async function sendNotification(
  subscription: PushSubscription,
  payload: PushNotificationPayload
): Promise<void> {
  try {
    // Ensure VAPID is initialized
    initializeVAPID();

    // Convert subscription to web-push format
    const webPushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    };

    // Serialize payload as JSON with UTF-8 encoding
    const payloadString = JSON.stringify(payload);
    const payloadBuffer = Buffer.from(payloadString, "utf-8");

    // Send push notification with 5 second timeout
    await Promise.race([
      webpush.sendNotification(webPushSubscription, payloadBuffer),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Push notification timeout")), 5000)
      ),
    ]);

    console.log(`Push notification sent successfully to ${subscription.endpoint}`);
  } catch (error) {
    // Handle specific error cases
    if (error instanceof Error) {
      // Check for expired/invalid subscription errors
      if (
        error.message.includes("410 Gone") ||
        error.message.includes("404 Not Found") ||
        error.message.includes("invalid endpoint") ||
        error.message.includes("subscription is not valid")
      ) {
        // This is an expired endpoint - it should be deleted from the database
        throw new Error(`EXPIRED_ENDPOINT: ${error.message}`);
      }

      // Log other errors but don't throw - we want to continue with other subscriptions
      console.error(`Failed to send push notification: ${error.message}`);
      throw error;
    }

    // Unknown error type
    console.error("Unknown error sending push notification:", error);
    throw new Error("Unknown error sending push notification");
  }
}

/**
 * Send push notifications to multiple subscriptions
 * Notifications are sent in parallel for efficiency
 * 
 * @param subscriptions - Array of push subscriptions
 * @param payload - Notification payload to send
 * @returns Object with success count and failed subscriptions
 */
export async function sendNotifications(
  subscriptions: PushSubscription[],
  payload: PushNotificationPayload
): Promise<{
  successCount: number;
  failedSubscriptions: Array<{ subscription: PushSubscription; error: string }>;
  expiredEndpoints: string[];
}> {
  const results = await Promise.allSettled(
    subscriptions.map((subscription) => sendNotification(subscription, payload))
  );

  const failedSubscriptions: Array<{ subscription: PushSubscription; error: string }> = [];
  const expiredEndpoints: string[] = [];
  let successCount = 0;

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      successCount++;
    } else {
      const subscription = subscriptions[index];
      const error = result.reason as Error;

      // Check if this is an expired endpoint
      if (error.message.startsWith("EXPIRED_ENDPOINT:")) {
        expiredEndpoints.push(subscription.endpoint);
        failedSubscriptions.push({
          subscription,
          error: "Expired endpoint - should be deleted",
        });
      } else {
        failedSubscriptions.push({
          subscription,
          error: error.message || "Unknown error",
        });
      }
    }
  });

  return {
    successCount,
    failedSubscriptions,
    expiredEndpoints,
  };
}

/**
 * Helper function to encode a nickname for URL navigation
 * Uses base64url encoding to safely include Unicode in URLs
 * 
 * @param nickname - UTF-8 encoded nickname string
 * @returns Base64-URL encoded nickname
 */
export function encodeNicknameForUrl(nickname: string): string {
  const utf8Bytes = new TextEncoder().encode(nickname);
  const base64 = Buffer.from(utf8Bytes).toString("base64");
  // Convert to base64url (replace + with -, / with _, remove = padding)
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * Helper function to decode a nickname from URL
 * 
 * @param encoded - Base64-URL encoded nickname
 * @returns UTF-8 decoded nickname string
 */
export function decodeNicknameFromUrl(encoded: string): string {
  // Convert from base64url to base64
  let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  // Add padding if needed
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }
  const utf8Bytes = Buffer.from(base64, "base64");
  return new TextDecoder().decode(utf8Bytes);
}

/**
 * Create a push notification payload
 * 
 * @param nickname - Original nickname (UTF-8)
 * @param status - Current status
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted push notification payload
 */
export function createNotificationPayload(
  nickname: string,
  status: "connected" | "disconnected",
  timestamp: number
): PushNotificationPayload {
  const statusText = status === "connected" ? "connected" : "disconnected";
  const encodedNickname = encodeNicknameForUrl(nickname);

  return {
    title: `Device ${statusText}`,
    body: `${nickname} is ${statusText}`,
    nickname,
    status,
    timestamp,
    data: {
      nicknameEncoded: encodedNickname,
    },
  };
}

/**
 * Validate a push subscription object
 * 
 * @param subscription - Subscription object to validate
 * @returns true if valid, false otherwise
 */
export function validateSubscription(subscription: PushSubscription): boolean {
  try {
    return !!(
      subscription.endpoint &&
      subscription.endpoint.startsWith("https://") &&
      subscription.p256dh &&
      subscription.auth &&
      subscription.p256dh.length > 0 &&
      subscription.auth.length > 0
    );
  } catch {
    return false;
  }
}