// Nickname repository for database operations
// Handles all CRUD operations for nickname entities

import { getAdminClient } from "../db";
import type { Nickname, NewNickname } from "../types";

/**
 * Repository class for nickname operations
 * All methods use the admin client to bypass Row Level Security
 */
export class NicknameRepository {
  /**
   * Find a nickname by exact UTF-8 match
   * 
   * @param nickname - UTF-8 encoded nickname string
   * @returns The nickname entity or null if not found
   */
  async getByNickname(nickname: string): Promise<Nickname | null> {
    try {
      const admin = getAdminClient();
      const { data, error } = await admin
        .from("nicknames")
        .select("*")
        .eq("nickname", nickname)
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
      console.error("Error in getByNickname:", error);
      throw new Error(`Failed to get nickname: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Find a nickname by UUID
   * 
   * @param id - UUID of the nickname
   * @returns The nickname entity or null if not found
   */
  async getById(id: string): Promise<Nickname | null> {
    try {
      const admin = getAdminClient();
      const { data, error } = await admin
        .from("nicknames")
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
      throw new Error(`Failed to get nickname by ID: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Create a new nickname with generated UUID
   * 
   * @param data - New nickname data with application-generated UUID
   * @returns The created nickname entity
   */
  async create(data: NewNickname): Promise<Nickname> {
    try {
      const admin = getAdminClient();
      const { data: created, error } = await admin
        .from("nicknames")
        .insert(data)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return created;
    } catch (error) {
      console.error("Error in create:", error);
      throw new Error(`Failed to create nickname: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Update the status and last_seen_at timestamp for a nickname
   * 
   * @param id - UUID of the nickname
   * @param status - New status (connected or disconnected)
   * @param timestamp - Unix timestamp in milliseconds
   * @returns The updated nickname entity
   */
  async updateStatus(
    id: string,
    status: "connected" | "disconnected",
    timestamp: number
  ): Promise<Nickname> {
    try {
      const admin = getAdminClient();
      const { data: updated, error } = await admin
        .from("nicknames")
        .update({
          last_status: status,
          last_seen_at: timestamp,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return updated;
    } catch (error) {
      console.error("Error in updateStatus:", error);
      throw new Error(`Failed to update status: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Get or create a nickname by exact UTF-8 match
   * If the nickname doesn't exist, it will be created with default values
   *
   * @param nickname - UTF-8 encoded nickname string
   * @param timestamp - Current timestamp in milliseconds
   * @returns The nickname entity (existing or newly created)
   */
  async getOrCreate(nickname: string, timestamp: number): Promise<Nickname> {
    try {
      // First, try to get existing nickname
      const existing = await this.getByNickname(nickname);
      
      if (existing) {
        return existing;
      }

      // Nickname doesn't exist, create it
      const { v4: uuidv4 } = require("uuid");
      const newNickname: NewNickname = {
        id: uuidv4(),
        nickname,
        last_status: "disconnected",
        last_seen_at: timestamp,
        created_at: timestamp,
      };

      console.log(`Auto-creating new nickname: ${nickname}`);
      return await this.create(newNickname);
    } catch (error) {
      console.error("Error in getOrCreate:", error);
      throw new Error(`Failed to get or create nickname: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Get all nicknames (for admin/debugging purposes)
   * 
   * @returns Array of all nickname entities
   */
  async getAll(): Promise<Nickname[]> {
    try {
      const admin = getAdminClient();
      const { data, error } = await admin
        .from("nicknames")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("Error in getAll:", error);
      throw new Error(`Failed to get all nicknames: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}

// Export a singleton instance
export const nicknameRepository = new NicknameRepository();