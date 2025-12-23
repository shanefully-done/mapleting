// POST /api/subscribe endpoint
// Allows users to subscribe to push notifications for a specific nickname

import { NextRequest, NextResponse } from "next/server";
import { nicknameRepository } from "@/lib/repositories/nickname-repository";
import { subscriptionRepository } from "@/lib/repositories/subscription-repository";
import { validateSubscription } from "@/lib/push";
import type { SubscribeRequest } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

/**
 * Handle POST requests to /api/subscribe
 * 
 * Expected request body:
 * {
 *   "nickname": "테스트-장치-01",  // UTF-8 encoded nickname
 *   "subscription": {
 *     "endpoint": "https://fcm.googleapis.com/...",
 *     "keys": {
 *       "p256dh": "B...",
 *       "auth": "A..."
 *     }
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Step 1: Parse and validate request body
    let body: SubscribeRequest;
    
    try {
      body = await request.json();
    } catch (error) {
      console.error("Failed to parse subscribe request body:", error);
      return NextResponse.json(
        { error: "Bad Request: Invalid JSON body" },
        { status: 400 }
      );
    }

    // Validate required fields
    const { nickname, subscription } = body;

    if (!nickname || typeof nickname !== "string") {
      return NextResponse.json(
        { error: "Bad Request: Missing or invalid 'nickname' field" },
        { status: 400 }
      );
    }

    if (!subscription || typeof subscription !== "object") {
      return NextResponse.json(
        { error: "Bad Request: Missing or invalid 'subscription' field" },
        { status: 400 }
      );
    }

    // Validate subscription structure
    if (!subscription.endpoint || typeof subscription.endpoint !== "string") {
      return NextResponse.json(
        { error: "Bad Request: Missing or invalid 'subscription.endpoint'" },
        { status: 400 }
      );
    }

    // Validate endpoint URL format
    try {
      new URL(subscription.endpoint);
    } catch {
      return NextResponse.json(
        { error: "Bad Request: Invalid 'subscription.endpoint' URL format" },
        { status: 400 }
      );
    }

    if (!subscription.keys || typeof subscription.keys !== "object") {
      return NextResponse.json(
        { error: "Bad Request: Missing or invalid 'subscription.keys'" },
        { status: 400 }
      );
    }

    if (!subscription.keys.p256dh || typeof subscription.keys.p256dh !== "string") {
      return NextResponse.json(
        { error: "Bad Request: Missing or invalid 'subscription.keys.p256dh'" },
        { status: 400 }
      );
    }

    if (!subscription.keys.auth || typeof subscription.keys.auth !== "string") {
      return NextResponse.json(
        { error: "Bad Request: Missing or invalid 'subscription.keys.auth'" },
        { status: 400 }
      );
    }

    // Step 2: Validate subscription format using validateSubscription
    const subscriptionObject = {
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    };

    if (!validateSubscription(subscriptionObject as any)) {
      return NextResponse.json(
        { error: "Bad Request: Invalid subscription format" },
        { status: 400 }
      );
    }

    // Step 3: Check if nickname exists
    // Use exact UTF-8 string matching (no normalization)
    const nicknameEntity = await nicknameRepository.getByNickname(nickname);

    if (!nicknameEntity) {
      console.warn(`Subscribe attempt for non-existent nickname: ${nickname}`);
      return NextResponse.json(
        { error: "Not Found: Nickname does not exist" },
        { status: 404 }
      );
    }

    // Step 4: Check for duplicate subscription by endpoint
    const existingSubscription = await subscriptionRepository.getByEndpoint(subscription.endpoint);

    if (existingSubscription) {
      // Update existing subscription instead of creating duplicate
      // This handles cases where keys change but endpoint stays the same
      console.log(`Updating existing subscription for endpoint: ${subscription.endpoint}`);
      
      try {
        await subscriptionRepository.update(existingSubscription.id, {
          nickname_id: nicknameEntity.id,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          user_agent: request.headers.get("user-agent") || undefined,
        });

        return NextResponse.json(
          {
            success: true,
            subscriptionId: existingSubscription.id,
            nickname,
            updated: true,
          },
          { status: 200 }
        );
      } catch (error) {
        console.error(`Failed to update subscription for endpoint ${subscription.endpoint}:`, error);
        return NextResponse.json(
          { error: "Internal Server Error: Failed to update subscription" },
          { status: 500 }
        );
      }
    }

    // Step 5: Create new subscription
    const subscriptionId = uuidv4();
    const timestamp = Date.now();

    try {
      await subscriptionRepository.create({
        id: subscriptionId,
        nickname_id: nicknameEntity.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        user_agent: request.headers.get("user-agent") || undefined,
        created_at: timestamp,
      });
    } catch (error) {
      console.error(`Failed to create subscription for nickname ${nickname}:`, error);
      return NextResponse.json(
        { error: "Internal Server Error: Failed to create subscription" },
        { status: 500 }
      );
    }

    // Step 6: Return success response
    console.log(`Subscription created successfully for nickname ${nickname}, subscription ID: ${subscriptionId}`);
    
    return NextResponse.json(
      {
        success: true,
        subscriptionId,
        nickname,
        updated: false,
      },
      { status: 200 }
    );

  } catch (error) {
    // Catch-all error handler
    console.error("Unexpected error in subscribe endpoint:", error);
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