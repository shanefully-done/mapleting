// POST /api/unsubscribe endpoint
// Allows users to cancel push notifications for a specific subscription

import { NextRequest, NextResponse } from "next/server";
import { subscriptionRepository } from "@/lib/repositories/subscription-repository";
import type { UnsubscribeRequest } from "@/lib/types";

/**
 * Validate UUID v4 format
 * @param str - String to validate
 * @returns True if valid UUID v4 format
 */
function isValidUUID(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Handle POST requests to /api/unsubscribe
 * 
 * Expected request body:
 * {
 *   "subscriptionId": "uuid"  // UUID of the subscription to cancel
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Step 1: Parse and validate request body
    let body: UnsubscribeRequest;
    
    try {
      body = await request.json();
    } catch (error) {
      console.error("Failed to parse unsubscribe request body:", error);
      return NextResponse.json(
        { error: "Bad Request: Invalid JSON body" },
        { status: 400 }
      );
    }

    // Validate required fields
    const { subscriptionId } = body;

    if (!subscriptionId || typeof subscriptionId !== "string") {
      return NextResponse.json(
        { error: "Bad Request: Missing or invalid 'subscriptionId' field" },
        { status: 400 }
      );
    }

    // Step 2: Validate UUID format
    if (!isValidUUID(subscriptionId)) {
      return NextResponse.json(
        { error: "Bad Request: Invalid 'subscriptionId' format (must be valid UUID)" },
        { status: 400 }
      );
    }

    // Step 3: Check if subscription exists
    const subscription = await subscriptionRepository.getById(subscriptionId);

    if (!subscription) {
      console.warn(`Unsubscribe attempt for non-existent subscription: ${subscriptionId}`);
      return NextResponse.json(
        { error: "Not Found: Subscription does not exist" },
        { status: 404 }
      );
    }

    // Step 4: Delete the subscription
    try {
      await subscriptionRepository.delete(subscriptionId);
      console.log(`Subscription deleted successfully: ${subscriptionId}`);
    } catch (error) {
      console.error(`Failed to delete subscription ${subscriptionId}:`, error);
      return NextResponse.json(
        { error: "Internal Server Error: Failed to delete subscription" },
        { status: 500 }
      );
    }

    // Step 5: Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Subscription removed successfully",
      },
      { status: 200 }
    );

  } catch (error) {
    // Catch-all error handler
    console.error("Unexpected error in unsubscribe endpoint:", error);
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