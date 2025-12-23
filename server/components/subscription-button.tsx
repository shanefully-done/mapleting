'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import {
  subscribeToNickname,
  unsubscribeFromNickname,
  checkSubscriptionStatus,
  isPushSupported,
  getPushPermission,
} from '@/lib/push-client';

interface SubscriptionButtonProps {
  nickname: string;
  onSubscriptionChange?: (isSubscribed: boolean) => void;
}

export function SubscriptionButton({
  nickname,
  onSubscriptionChange,
}: SubscriptionButtonProps) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // Check subscription status and push support on mount
  useEffect(() => {
    setPushSupported(isPushSupported());
    setPermission(getPushPermission());
    setIsSubscribed(checkSubscriptionStatus(nickname));
  }, [nickname]);

  const handleSubscribe = async () => {
    if (!pushSupported) {
      toast.error('Push notifications are not supported in this browser');
      return;
    }

    if (permission === 'denied') {
      toast.error(
        'Notification permission denied. Please enable notifications in your browser settings.'
      );
      return;
    }

    setIsLoading(true);
    try {
      await subscribeToNickname(nickname);
      setIsSubscribed(true);
      onSubscriptionChange?.(true);
      toast.success('Successfully subscribed to notifications!');
    } catch (error) {
      console.error('Subscribe error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to subscribe';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);
    try {
      await unsubscribeFromNickname(nickname);
      setIsSubscribed(false);
      onSubscriptionChange?.(false);
      toast.success('Successfully unsubscribed from notifications');
    } catch (error) {
      console.error('Unsubscribe error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to unsubscribe';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Show a message if push is not supported
  if (!pushSupported) {
    return (
      <div className="text-sm text-muted-foreground">
        Push notifications are not supported in this browser. Please use a modern
        browser like Chrome, Firefox, or Safari 16.4+.
      </div>
    );
  }

  // Show permission request button if not granted
  if (permission === 'default' && !isSubscribed) {
    return (
      <Button
        onClick={handleSubscribe}
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? 'Requesting Permission...' : 'Enable Notifications'}
      </Button>
    );
  }

  // Show denied message
  if (permission === 'denied') {
    return (
      <div className="text-sm text-destructive">
        Notifications are blocked. Please enable them in your browser settings.
      </div>
    );
  }

  // Show subscribe/unsubscribe button
  return (
    <Button
      onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
      disabled={isLoading}
      variant={isSubscribed ? 'outline' : 'default'}
      className="w-full"
    >
      {isLoading
        ? 'Processing...'
        : isSubscribed
        ? 'Unsubscribe from Notifications'
        : 'Subscribe to Notifications'}
    </Button>
  );
}