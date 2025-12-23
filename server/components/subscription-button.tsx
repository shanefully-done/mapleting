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
      toast.error('이 브라우저는 푸시 알림을 지원하지 않습니다');
      return;
    }

    if (permission === 'denied') {
      toast.error(
        '알림 권한이 거부되었습니다. 브라우저 설정에서 알림을 활성화해 주세요.'
      );
      return;
    }

    setIsLoading(true);
    try {
      await subscribeToNickname(nickname);
      setIsSubscribed(true);
      onSubscriptionChange?.(true);
      toast.success('알림 구독에 성공했습니다!');
    } catch (error) {
      console.error('Subscribe error:', error);
      const errorMessage =
        error instanceof Error ? error.message : '구독에 실패했습니다';
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
      toast.success('알림 구독이 취소되었습니다');
    } catch (error) {
      console.error('Unsubscribe error:', error);
      const errorMessage =
        error instanceof Error ? error.message : '구독 취소에 실패했습니다';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Show a message if push is not supported
  if (!pushSupported) {
    return (
      <div className="text-sm text-muted-foreground">
        이 브라우저는 푸시 알림을 지원하지 않습니다. Chrome, Firefox 또는
        Safari 16.4+와 같은 최신 브라우저를 사용해 주세요.
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
        {isLoading ? '권한 요청 중...' : '알림 활성화'}
      </Button>
    );
  }

  // Show denied message
  if (permission === 'denied') {
    return (
      <div className="text-sm text-destructive">
        알림이 차단되어 있습니다. 브라우저 설정에서 활성화해 주세요.
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
        ? '처리 중...'
        : isSubscribed
        ? '알림 구독 취소'
        : '알림 구독'}
    </Button>
  );
}