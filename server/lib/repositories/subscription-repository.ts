// Push subscription repository for database operations
// Handles all CRUD operations for push subscription entities

import { getAdminClient } from "../db";
import type { PushSubscription, NewPushSubscription } from "../types";

/**
 * Repository class for push subscription operations
 * All methods use the admin client to bypass Row Level Security
 */
export class SubscriptionRepository {
  /**
   * Create a new push subscription
   * 
   * @param data - New subscription data with application-generated UUID
   * @returns The created subscription entity
   */
  async create(data: NewPushSubscription): Promise<PushSubscription> {
    try {
      const admin = getAdminClient();
      const { data: created, error } = await admin
        .from("push_subscriptions")
        .insert(data)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return created;
    } catch (error) {
      console.error("Error in create:", error);
      throw new Error(`Failed to create subscription: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Get all subscriptions for a specific nickname
   * 
   * @param nicknameId - UUID of the nickname
   * @returns Array of push subscriptions for the nickname
   */
  async getByNicknameId(nicknameId: string): Promise<PushSubscription[]> {
    try {
      const admin = getAdminClient();
      const { data, error } = await admin
        .from("push_subscriptions")
        .select("*")
        .eq("nickname_id", nicknameId)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("Error in getByNicknameId:", error);
      throw new Error(`Failed to get subscriptions: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Get a subscription by UUID
   * 
   * @param id - UUID of the subscription
   * @returns The subscription entity or null if not found
   */
  async getById(id: string): Promise<PushSubscription | null> {
    try {
      const admin = getAdminClient();
      const { data, error } = await admin
        .from("push_subscriptions")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Error in getById:", error);
      throw new Error(`Failed to get subscription by ID: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Delete a subscription by UUID
   * 
   * @param id - UUID of the subscription to delete
   * @returns True if deletion was successful
   */
  async delete(id: string): Promise<boolean> {
    try {
      const admin = getAdminClient();
      const { error } = await admin
        .from("push_subscriptions")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error("Error in delete:", error);
      throw new Error(`Failed to delete subscription: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Check if a subscription with the given endpoint exists
   * Used to avoid duplicate subscriptions
   * 
   * @param endpoint - Push service endpoint URL
   * @returns The subscription entity if found, null otherwise
   */
  async getByEndpoint(endpoint: string): Promise<PushSubscription | null> {
    try {
      const admin = getAdminClient();
      const { data, error } = await admin
        .from("push_subscriptions")
        .select("*")
        .eq("endpoint", endpoint)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Error in getByEndpoint:", error);
      throw new Error(`Failed to get subscription by endpoint: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Update an existing subscription
   * Used to update keys or nickname_id when endpoint already exists
   *
   * @param id - UUID of the subscription to update
   * @param updates - Fields to update (nickname_id, p256dh, auth, user_agent)
   * @returns The updated subscription entity
   */
  async update(
    id: string,
    updates: {
      nickname_id?: string;
      p256dh?: string;
      auth?: string;
      user_agent?: string;
    }
  ): Promise<PushSubscription> {
    try {
      const admin = getAdminClient();
      const { data: updated, error } = await admin
        .from("push_subscriptions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return updated;
    } catch (error) {
      console.error("Error in update:", error);
      throw new Error(`Failed to update subscription: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Delete all subscriptions for a specific nickname
   * Useful when a nickname is deleted or for cleanup
   * 
   * @param nicknameId - UUID of the nickname
   * @returns Number of subscriptions deleted
   */
  async deleteByNicknameId(nicknameId: string): Promise<number> {
    try {
      const admin = getAdminClient();
      const { data: existingSubs } = await admin
        .from("push_subscriptions")
        .select("id")
        .eq("nickname_id", nicknameId);

      if (!existingSubs || existingSubs.length === 0) {
        return 0;
      }

      const { error } = await admin
        .from("push_subscriptions")
        .delete()
        .eq("nickname_id", nicknameId);

      if (error) {
        throw error;
      }

      return existingSubs.length;
    } catch (error) {
      console.error("Error in deleteByNicknameId:", error);
      throw new Error(`Failed to delete subscriptions by nickname: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Get all subscriptions (for admin/debugging purposes)
   * 
   * @returns Array of all subscription entities
   */
  async getAll(): Promise<PushSubscription[]> {
    try {
      const admin = getAdminClient();
      const { data, error } = await admin
        .from("push_subscriptions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("Error in getAll:", error);
      throw new Error(`Failed to get all subscriptions: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}

// Export a singleton instance
export const subscriptionRepository = new SubscriptionRepository();