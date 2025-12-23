import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { decodeNicknameFromUrl } from '@/lib/url-utils';
import { createClient } from '@/lib/db';
import { SubscriptionButton } from '@/components/subscription-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: Promise<{
    encodedNickname: string;
  }>;
}

/**
 * Generate metadata for the nickname detail page
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { encodedNickname } = await params;
  
  try {
    const nickname = decodeNicknameFromUrl(encodedNickname);
    return {
      title: `${nickname} - Mapleting`,
      description: `Monitor and receive notifications for ${nickname}`,
    };
  } catch {
    return {
      title: 'Device Not Found - Mapleting',
      description: 'The requested device could not be found',
    };
  }
}

/**
 * Fetch nickname data from the database
 */
async function getNicknameData(nickname: string) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('nicknames')
      .select('*')
      .eq('nickname', nickname)
      .single();

    if (error) {
      console.error('Error fetching nickname:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Database error:', error);
    return null;
  }
}

/**
 * Format timestamp to human-readable date
 */
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  
  // Format: "Dec 23, 2025 at 5:07 PM"
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Calculate relative time (e.g., "2 minutes ago")
 */
function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) {
    return 'just now';
  } else if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else {
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
}

export default async function NicknameDetailPage({ params }: PageProps) {
  const { encodedNickname } = await params;
  
  let nickname: string;
  try {
    nickname = decodeNicknameFromUrl(encodedNickname);
  } catch (error) {
    console.error('Failed to decode nickname:', error);
    notFound();
  }

  // Fetch nickname data from database
  const nicknameData = await getNicknameData(nickname);

  // If nickname not found, show 404
  if (!nicknameData) {
    notFound();
  }

  const isConnected = nicknameData.last_status === 'connected';
  const relativeTime = getRelativeTime(nicknameData.last_seen_at);
  const formattedTime = formatTimestamp(nicknameData.last_seen_at);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Device Info Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-2xl">{nickname}</CardTitle>
                  <CardDescription>Device monitoring and notifications</CardDescription>
                </div>
                <Badge 
                  variant={isConnected ? "default" : "destructive"}
                  className="gap-1.5 text-sm"
                >
                  {isConnected ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Connected
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3.5 w-3.5" />
                      Disconnected
                    </>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status Description */}
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm">
                  {isConnected ? (
                    <>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        Device is online
                      </span>
                      {' '}and functioning normally. You will receive a notification if it goes offline.
                    </>
                  ) : (
                    <>
                      <span className="font-semibold text-red-600 dark:text-red-400">
                        Device is offline
                      </span>
                      {' '}and may need attention. You will be notified when it comes back online.
                    </>
                  )}
                </p>
              </div>

              {/* Last Seen Info */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  Last seen: {relativeTime} ({formattedTime})
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Card */}
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Subscribe to receive push notifications when this device changes status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SubscriptionButton nickname={nickname} />
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-base">How Notifications Work</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                • You'll receive a push notification when the device transitions from connected to disconnected
              </p>
              <p>
                • Notifications work even when this page is closed or your browser is not running
              </p>
              <p>
                • You can manage your subscription anytime using the button above
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}