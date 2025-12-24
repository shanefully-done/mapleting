// POST /api/heartbeat endpoint
// Receives status updates from Android monitoring clients and triggers push notifications on state transitions

import { NextRequest, NextResponse } from "next/server";
import { nicknameRepository } from "@/lib/repositories/nickname-repository";
import { subscriptionRepository } from "@/lib/repositories/subscription-repository";
import { initializeVAPID, createNotificationPayload, sendNotifications } from "@/lib/push";
import type { HeartbeatRequest } from "@/lib/types";

/**
 * Rate limiter for heartbeats
 * Allows maximum 1 heartbeat per 55 seconds per nickname
 */
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 55000; // 55 seconds

function checkRateLimit(nickname: string): boolean {
  const now = Date.now();
  const lastHeartbeat = rateLimitMap.get(nickname);
  
  if (lastHeartbeat === undefined || now - lastHeartbeat >= RATE_LIMIT_MS) {
    rateLimitMap.set(nickname, now);
    return true;
  }
  
  return false;
}

/**
 * Handle POST requests to /api/heartbeat
 *
 * Expected request body:
 * {
 *   "nickname": "테스트-장치-01",  // UTF-8 encoded nickname
 *   "status": "connected",          // "connected" or "disconnected"
 *   "timestamp": 1734850000000      // Unix timestamp in milliseconds
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Step 1: Parse and validate request body
    let body: HeartbeatRequest;
    
    try {
      body = await request.json();
    } catch (error) {
      console.error("Failed to parse heartbeat request body:", error);
      return NextResponse.json(
        { error: "Bad Request: Invalid JSON body" },
        { status: 400 }
      );
    }

    // Step 2: Validate required fields with auto-ignore for invalid payloads
    const { nickname, status, timestamp } = body;

    if (!nickname || typeof nickname !== "string") {
      console.warn("Invalid heartbeat: missing or invalid nickname field - auto-ignored");
      return NextResponse.json(
        { success: false, message: "Invalid payload" },
        { status: 200 }
      );
    }

    if (!status || (status !== "connected" && status !== "disconnected")) {
      console.warn(`Invalid heartbeat for ${nickname}: invalid status field - auto-ignored`);
      return NextResponse.json(
        { success: false, message: "Invalid payload" },
        { status: 200 }
      );
    }

    if (!timestamp || typeof timestamp !== "number" || timestamp <= 0) {
      console.warn(`Invalid heartbeat for ${nickname}: invalid timestamp field - auto-ignored`);
      return NextResponse.json(
        { success: false, message: "Invalid payload" },
        { status: 200 }
      );
    }

    // Step 3: Check rate limit (55 seconds per nickname)
    if (!checkRateLimit(nickname)) {
      console.warn(`Rate limited: ${nickname} - too many requests`);
      return NextResponse.json(
        { success: false, message: "Rate limited" },
        { status: 200 }
      );
    }

    // Step 4: Get or create nickname entity (auto-create if doesn't exist)
    const nicknameEntity = await nicknameRepository.getOrCreate(nickname, timestamp);

    // Step 5: Detect state transition
    const currentStatus = nicknameEntity.last_status;
    const hasTransitioned = currentStatus === "connected" && status === "disconnected";

    // Step 6: Update database with new status and timestamp
    try {
      await nicknameRepository.updateStatus(nicknameEntity.id, status, timestamp);
    } catch (error) {
      console.error(`Failed to update status for nickname ${nickname}:`, error);
      return NextResponse.json(
        { error: "Internal Server Error: Failed to update status" },
        { status: 500 }
      );
    }

    // Step 7: Send push notifications if transition detected (connected → disconnected)
    if (hasTransitioned) {
      console.log(`State transition detected for ${nickname}: connected → disconnected`);

      try {
        // Initialize VAPID keys before sending notifications
        initializeVAPID();

        // Fetch all subscriptions for this nickname
        const subscriptions = await subscriptionRepository.getByNicknameId(nicknameEntity.id);

        if (subscriptions.length > 0) {
          // Create notification payload
          const payload = createNotificationPayload(nickname, status, timestamp);

          // Send notifications in parallel
          const results = await sendNotifications(subscriptions, payload);

          console.log(
            `Push notifications sent for ${nickname}: ` +
            `${results.successCount} succeeded, ${results.failedSubscriptions.length} failed`
          );

          // Auto-delete expired endpoints
          if (results.expiredEndpoints.length > 0) {
            console.log(`Cleaning up ${results.expiredEndpoints.length} expired subscriptions...`);
            
            for (const expiredSubscription of subscriptions) {
              if (results.expiredEndpoints.includes(expiredSubscription.endpoint)) {
                try {
                  await subscriptionRepository.delete(expiredSubscription.id);
                  console.log(`Deleted expired subscription: ${expiredSubscription.id}`);
                } catch (error) {
                  console.error(`Failed to delete expired subscription ${expiredSubscription.id}:`, error);
                }
              }
            }
          }
        } else {
          console.log(`No subscriptions found for nickname ${nickname}`);
        }
      } catch (error) {
        // Log push notification errors but don't fail the heartbeat request
        console.error(`Failed to send push notifications for ${nickname}:`, error);
        // Continue - the heartbeat was still processed successfully
      }
    }

    // Step 8: Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Heartbeat received",
        data: {
          nickname,
          status,
          timestamp,
          previousStatus: currentStatus,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    // Catch-all error handler
    console.error("Unexpected error in heartbeat endpoint:", error);
    return NextResponse.json(
      { error: "Internal Server Error: An unexpected error occurred" },
      { status: 500 }
    );
  }
}

/**
 * Handle non-POST requests
 * Only POST is allowed for this endpoint
 */
export async function GET() {
  return NextResponse.json(
    { error: "Method Not Allowed: Only POST requests are accepted" },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: "Method Not Allowed: Only POST requests are accepted" },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Method Not Allowed: Only POST requests are accepted" },
    { status: 405 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { error: "Method Not Allowed: Only POST requests are accepted" },
    { status: 405 }
  );
}