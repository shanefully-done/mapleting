import { NextResponse } from "next/server";

export async function GET() {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  
  return NextResponse.json({
    vapidPublicKeyConfigured: !!vapidPublicKey,
    vapidPublicKeyPrefix: vapidPublicKey ? vapidPublicKey.substring(0, 20) + "..." : null,
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
}