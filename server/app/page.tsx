'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { encodeNicknameForUrl } from '@/lib/url-utils';
import { Bell, Smartphone, Shield, Globe } from 'lucide-react';

export default function Home() {
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubscribe = () => {
    if (!nickname.trim()) {
      return;
    }

    setIsLoading(true);
    
    // Encode the nickname and navigate to detail page
    const encoded = encodeNicknameForUrl(nickname.trim());
    router.push(`/n/${encoded}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubscribe();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Mapleting</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Monitor Your Devices
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get instant push notifications when your monitored applications or devices go offline.
              Works on any platform with a modern browser.
            </p>
          </div>

          {/* Subscribe Card */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Subscribe to a Device</CardTitle>
              <CardDescription>
                Enter the device nickname to subscribe to notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter device nickname (e.g., 테스트-장치-01)"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSubscribe}
                  disabled={isLoading || !nickname.trim()}
                  size="lg"
                >
                  {isLoading ? 'Loading...' : 'Subscribe'}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Supports any language - Korean, Japanese, Chinese, and more
              </p>
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Cross-Platform</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Works on Android, iOS, Windows, macOS, and Linux
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Push Notifications</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Instant notifications even when the browser is closed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Secure & Private</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Self-hosted with end-to-end encrypted push notifications
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Unicode Support</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Full UTF-8 support for device names in any language
                </p>
              </CardContent>
            </Card>
          </div>

          {/* How it Works */}
          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>
                  <strong>Enter a device nickname</strong> - The device must be registered
                  in the monitoring system
                </li>
                <li>
                  <strong>Enable notifications</strong> - Allow push notifications in your
                  browser
                </li>
                <li>
                  <strong>Receive alerts</strong> - Get notified instantly when the device
                  goes offline
                </li>
                <li>
                  <strong>Install as app</strong> - Add to home screen for a native app
                  experience (optional)
                </li>
              </ol>
            </CardContent>
          </Card>

          {/* PWA Install Prompt */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-base">Install as App</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Install this as a Progressive Web App (PWA) for the best experience.
                Look for the &quot;Install&quot; button in your browser&apos;s address bar
                or add to home screen on mobile devices.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>Mapleting - Cross-Platform Device Monitoring System</p>
        </div>
      </footer>
    </div>
  );
}