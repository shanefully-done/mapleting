'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { encodeNicknameForUrl } from '@/lib/url-utils';
import { Bell, Smartphone, Shield, Globe } from 'lucide-react';
import { PWAInstallButton } from '@/components/pwa-install-button';

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
              디바이스 모니터링
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              모니터링 중인 애플리케이션이나 디바이스가 오프라인되면 즉시 푸시 알림을 받으세요.
              최신 브라우저가 지원되는 모든 플랫폼에서 작동합니다.
            </p>
          </div>

          {/* Subscribe Card */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>디바이스 구독</CardTitle>
              <CardDescription>
                알림을 받을 디바이스 닉네임을 입력하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="디바이스 닉네임 입력 (예: 테스트-장치-01)"
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
                  {isLoading ? '로딩 중...' : '구독'}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                모든 언어 지원 - 한국어, 일본어, 중국어 등
              </p>
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">크로스 플랫폼</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Android, iOS, Windows, macOS, Linux에서 작동
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">푸시 알림</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  브라우저가 닫혀 있어도 즉시 알림 수신
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">보안 및 개인정보 보호</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  종단 간 암호화된 푸시 알림과 함께 자체 호스팅
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">유니코드 지원</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  모든 언어의 디바이스 이름에 대한 완전한 UTF-8 지원
                </p>
              </CardContent>
            </Card>
          </div>

          {/* How it Works */}
          <Card>
            <CardHeader>
              <CardTitle>사용 방법</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>
                  <strong>디바이스 닉네임 입력</strong> - 디바이스가 모니터링 시스템에
                  등록되어 있어야 합니다
                </li>
                <li>
                  <strong>알림 활성화</strong> - 브라우저에서 푸시 알림을 허용하세요
                </li>
                <li>
                  <strong>알림 수신</strong> - 디바이스가 오프라인되면 즉시 알림을 받습니다
                </li>
                <li>
                  <strong>앱으로 설치</strong> - 네이티브 앱 경험을 위해 홈 화면에 추가하세요
                  (선택 사항)
                </li>
              </ol>
            </CardContent>
          </Card>

          {/* PWA Install Prompt */}
          <PWAInstallButton />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>Mapleting - 크로스 플랫폼 디바이스 모니터링 시스템</p>
        </div>
      </footer>
    </div>
  );
}