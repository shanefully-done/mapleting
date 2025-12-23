/**
 * Client-side utilities for Web Push API
 * 
 * These functions handle push notification subscriptions, permissions,
 * and communication with the server's push subscription endpoints.
 */

import {
  SubscribeRequest,
  UnsubscribeRequest,
} from './types';

/**
 * Get the current push subscription from the service worker registration
 * @returns The push subscription or null if not subscribed
 */
export async function getPushSubscription(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error('Error getting push subscription:', error);
    return null;
  }
}

/**
 * Request notification permission from the user
 * @returns The permission state ('granted', 'denied', 'default')
 */
export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    throw new Error('This browser does not support notifications');
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    throw new Error('Notification permission denied. Please enable notifications in your browser settings.');
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Subscribe to push notifications
 * @returns The push subscription object
 */
export async function subscribeToPush(): Promise<PushSubscription> {
  // Request permission first
  const permission = await requestPushPermission();
  if (permission !== 'granted') {
    throw new Error('Push notification permission not granted');
  }

  // Get service worker registration
  const registration = await navigator.serviceWorker.ready;

  // Get VAPID public key from environment
  // In Next.js, NEXT_PUBLIC_ vars are available on the client side
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
                         (typeof window !== 'undefined' && (window as Record<string, unknown>).__NEXT_PUBLIC_VAPID_PUBLIC_KEY as string);
  
  if (!vapidPublicKey) {
    console.error('VAPID public key not found. Available env vars:', Object.keys(process.env).filter(k => k.includes('VAPID')));
    throw new Error('VAPID public key not configured. Please check your .env.local file.');
  }
  
  console.log('VAPID public key found:', vapidPublicKey.substring(0, 20) + '...');

  // Convert base64 VAPID key to Uint8Array
  const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

  // Subscribe to push
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: convertedVapidKey as unknown as BufferSource,
  });

  return subscription;
}

/**
 * Subscribe to notifications for a specific nickname
 * @param nickname - The nickname to subscribe to (UTF-8 string)
 * @returns The subscription ID from the server
 */
export async function subscribeToNickname(nickname: string): Promise<string> {
  try {
    // Get or create push subscription
    let pushSubscription = await getPushSubscription();
    
    if (!pushSubscription) {
      pushSubscription = await subscribeToPush();
    }

    // Build subscribe request payload
    const payload: SubscribeRequest = {
      nickname,
      subscription: {
        endpoint: pushSubscription.endpoint,
        keys: {
          p256dh: pushSubscription.getKey('p256dh')
            ? arrayBufferToBase64(pushSubscription.getKey('p256dh')!)
            : '',
          auth: pushSubscription.getKey('auth')
            ? arrayBufferToBase64(pushSubscription.getKey('auth')!)
            : '',
        },
      },
    };

    // Send subscribe request to server
    const response = await fetch('/api/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || 'Failed to subscribe');
    }

    const data = await response.json();
    
    // Store subscription ID in localStorage
    if (data.subscriptionId) {
      localStorage.setItem(`subscription_${nickname}`, data.subscriptionId);
    }

    return data.subscriptionId;
  } catch (error) {
    console.error('Error subscribing to nickname:', error);
    throw error;
  }
}

/**
 * Unsubscribe from notifications for a specific nickname
 * @param nickname - The nickname to unsubscribe from
 * @returns True if unsubscribed successfully
 */
export async function unsubscribeFromNickname(nickname: string): Promise<boolean> {
  try {
    // Get subscription ID from localStorage
    const subscriptionId = localStorage.getItem(`subscription_${nickname}`);
    
    if (!subscriptionId) {
      // Not subscribed, nothing to do
      return true;
    }

    // Build unsubscribe request payload
    const payload: UnsubscribeRequest = {
      subscriptionId,
    };

    // Send unsubscribe request to server
    const response = await fetch('/api/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || 'Failed to unsubscribe');
    }

    // Remove subscription ID from localStorage
    localStorage.removeItem(`subscription_${nickname}`);

    return true;
  } catch (error) {
    console.error('Error unsubscribing from nickname:', error);
    throw error;
  }
}

/**
 * Check if the user is subscribed to a specific nickname
 * @param nickname - The nickname to check
 * @returns True if subscribed
 */
export function checkSubscriptionStatus(nickname: string): boolean {
  const subscriptionId = localStorage.getItem(`subscription_${nickname}`);
  return subscriptionId !== null && subscriptionId !== '';
}

/**
 * Check if push notifications are supported in the current browser
 * @returns True if supported
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Check if push notification permission is granted
 * @returns The permission state
 */
export function getPushPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Convert URL-safe base64 string to Uint8Array
 * Used for VAPID key conversion
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Convert ArrayBuffer to base64 string
 * Used for encoding push subscription keys
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}