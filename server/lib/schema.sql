-- Database schema for Next.js PWA Monitoring & Notification System
-- Run this in Supabase SQL Editor to initialize the database

-- Nicknames table: Stores monitored Android applications/devices
CREATE TABLE nicknames (
  -- UUID (application-generated, not database default)
  id TEXT PRIMARY KEY,
  
  -- UTF-8 nickname, arbitrary Unicode (NOT used as primary key)
  nickname TEXT NOT NULL UNIQUE,
  
  -- Current connection status
  last_status TEXT NOT NULL CHECK (last_status IN ('connected', 'disconnected')),
  
  -- Last heartbeat timestamp (milliseconds since epoch)
  last_seen_at BIGINT NOT NULL,
  
  -- Creation timestamp (milliseconds since epoch)
  created_at BIGINT NOT NULL
);

-- Push subscriptions table: Stores user push notification subscriptions
CREATE TABLE push_subscriptions (
  -- UUID (application-generated, not database default)
  id TEXT PRIMARY KEY,
  
  -- Foreign key to nicknames table
  nickname_id TEXT NOT NULL,
  
  -- Push service endpoint URL
  endpoint TEXT NOT NULL,
  
  -- ECDH P-256 public key
  p256dh TEXT NOT NULL,
  
  -- Authentication secret
  auth TEXT NOT NULL,
  
  -- Browser user agent (optional)
  user_agent TEXT,
  
  -- Creation timestamp (milliseconds since epoch)
  created_at BIGINT NOT NULL,
  
  -- Foreign key constraint with cascade delete
  FOREIGN KEY (nickname_id) REFERENCES nicknames(id) ON DELETE CASCADE
);

-- Index for efficient nickname lookups
CREATE INDEX idx_nicknames_nickname ON nicknames(nickname);

-- Index for efficient subscription lookups by nickname
CREATE INDEX idx_subscriptions_nicknameId ON push_subscriptions(nickname_id);

-- Optional: Enable Row Level Security (RLS) for production
-- ALTER TABLE nicknames ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
-- 
-- Note: For MVP, RLS can be disabled. Enable with appropriate policies in production.