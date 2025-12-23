'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface IOSNavigator extends Navigator {
  standalone?: boolean;
}

/**
 * PWA Install Button Component
 * 
 * Displays an install button when the PWA can be installed.
 * Handles the beforeinstallprompt event and prompts the user to install.
 */
export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (typeof window !== 'undefined') {
      // Check for standalone mode (installed PWA)
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as IOSNavigator).standalone === true;
      
      if (isStandalone) {
        setIsInstalled(true);
        return;
      }

      // Check if running on iOS
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) &&
                         !(window.navigator as IOSNavigator).standalone;
      setIsIOS(isIOSDevice);

      // Listen for beforeinstallprompt event (Chrome, Edge, Firefox)
      const handleBeforeInstallPrompt = (e: Event) => {
        // Prevent Chrome 67 and earlier from automatically showing the prompt
        e.preventDefault();
        // Stash the event so it can be triggered later
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setShowInstallPrompt(true);
      };

      // Listen for appinstalled event
      const handleAppInstalled = () => {
        setShowInstallPrompt(false);
        setDeferredPrompt(null);
        setIsInstalled(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
  };

  // Don't show anything if already installed or no prompt available
  if (isInstalled || (!showInstallPrompt && !isIOS)) {
    return null;
  }

  // iOS doesn't support beforeinstallprompt, show instructions
  if (isIOS) {
    return (
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Download className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium">앱으로 설치</p>
              <p className="text-xs text-muted-foreground">
                iOS에 설치하려면 공유 버튼을 탭한 후 &quot;홈 화면에 추가&quot;를 선택하세요.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show install prompt for supported browsers
  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Download className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium">앱으로 설치</p>
            <p className="text-xs text-muted-foreground">
              오프라인 지원과 함께 최상의 경험을 위해 이 앱을 설치하세요.
            </p>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleInstallClick}
                className="h-8 text-xs"
              >
                설치
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleDismiss}
                className="h-8 text-xs"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact PWA Install Button
 * A smaller version for use in headers or tight spaces
 */
export function PWAInstallButtonCompact() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as IOSNavigator).standalone === true;
      
      if (isStandalone) {
        setIsInstalled(true);
        return;
      }

      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setShowInstallButton(true);
      };

      const handleAppInstalled = () => {
        setShowInstallButton(false);
        setDeferredPrompt(null);
        setIsInstalled(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  if (isInstalled || !showInstallButton) {
    return null;
  }

  return (
    <Button 
      size="sm" 
      onClick={handleInstallClick}
      variant="outline"
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      앱 설치
    </Button>
  );
}