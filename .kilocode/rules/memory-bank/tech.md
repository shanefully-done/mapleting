# Technical Stack

## Technologies

### Client (Python Agent)
- **Python**: 3.x (stdlib only - no external dependencies for core functionality)
- **ADB**: Android Debug Bridge for app status detection
- **PyInstaller**: For building standalone executables
- **Standard Library**:
  - `subprocess` - Process execution (ADB commands)
  - `urllib` - HTTP requests (future: sending heartbeats)
  - `json` - Configuration file parsing
  - `time` - Sleep intervals between checks

### Server (Next.js PWA)
- **Framework**: Next.js 15 with App Router
- **Runtime**: Node.js or Edge Runtime (API routes)
- **Language**: TypeScript
- **Web Push**: `web-push` library for push notification delivery
- **Database**: Supabase Postgres
  - Managed Postgres with REST API
  - Node.js client: `@supabase/supabase-js`
- **PWA Features**:
  - Service Worker (custom implementation)
  - Web Push API
  - VAPID keys for push authentication

### Frontend
- **React**: Next.js 15 App Router with Server Components
- **Styling**: CSS Modules or Tailwind CSS
- **PWA**: Service Worker + Manifest for installability
- **Push Notifications**: Web Push API with VAPID

## Development Setup

### Prerequisites

#### For Python Client Development
- Python 3.8+
- ADB (Android Platform Tools)
- Android device/emulator with USB debugging enabled

#### For Next.js Server Development
- Node.js 18.17+ (or 20.x)
- `bun` (preferred package manager, per project rules)
- VAPID key pair (generate with `npx web-push generate-vapid-keys`)

### Environment Variables

#### Client (config.json)
```json
{
  "server_url": "https://your-server.com",
  "nickname": "your-nickname",
  "secret": "your-per-nickname-secret",
  "package_name": "com.example.app",
  "check_interval_seconds": 3
}
```

#### Server (.env.local)
```bash
# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Web Push (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-public-key"
VAPID_PRIVATE_KEY="your-private-key"
VAPID_SUBJECT="mailto:admin@example.com"

# Application
APP_BASE_URL="https://your-domain.com"
NODE_ENV="development"
```

### Installation

#### Client Setup
```bash
cd client
# No dependencies to install (stdlib only)
# Build executable:
pyinstaller monitor.spec
```

#### Server Setup
```bash
cd server
bun install
# Generate VAPID keys:
npx web-push generate-vapid-keys
# Copy keys to .env.local
# Run development server:
bun dev
```

## Technical Constraints

### Python Client
- **No external HTTP libraries**: Must use `urllib` (stdlib)
- **Cross-platform**: Must work on Windows, macOS, Linux
- **Minimal dependencies**: Prefer stdlib over pip packages
- **Standalone executable**: Must be buildable with PyInstaller
- **Unicode support**: All text handling must support UTF-8

### Next.js Server
- **UTF-8 everywhere**: No ASCII assumptions in any component
- **No user auth (initially)**: Per-nickname secrets only
- **Stateless API**: No sessions, all authentication via Bearer tokens
- **Push delivery**: Must handle expired endpoints gracefully
- **Unicode in URLs**: Must encode/decode nicknames properly

### PWA
- **Service Worker**: Must work on Safari (strictest requirements)
- **Background sync**: Notifications must arrive when app is closed
- **Installability**: Must meet PWA install criteria
- **Cross-browser**: Must work on Chrome, Firefox, Safari, Edge

## Database Schema

### Supabase Setup
Create tables in Supabase SQL Editor or via migration:

```sql
CREATE TABLE nicknames (
  id TEXT PRIMARY KEY,              -- UUID (application-generated)
  nickname TEXT NOT NULL UNIQUE,
  secret TEXT NOT NULL,
  last_status TEXT NOT NULL CHECK (last_status IN ('connected', 'disconnected')),
  last_seen_at BIGINT NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE TABLE push_subscriptions (
  id TEXT PRIMARY KEY,              -- UUID (application-generated)
  nickname_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at BIGINT NOT NULL,
  FOREIGN KEY (nickname_id) REFERENCES nicknames(id) ON DELETE CASCADE
);

CREATE INDEX idx_nicknames_nickname ON nicknames(nickname);
CREATE INDEX idx_subscriptions_nicknameId ON push_subscriptions(nickname_id);
```

**Supabase-Specific Features:**
- Use `@supabase/supabase-js` client library
- Application-generated UUIDs (using `uuid` package)
- CHECK constraints for status enum validation
- BIGINT for timestamps (milliseconds since epoch)
- Automatic cascade deletes on foreign keys
- Row Level Security (RLS) can be enabled for production

## API Rate Limiting

### Strategy
- **Endpoint**: `/api/heartbeat`
- **Scope**: Per-nickname (not per IP)
- **Limit**: 1 request per second per nickname
- **Implementation**: In-memory token bucket or Redis (if using multiple instances)

### Implementation (Node.js)
```typescript
// Pseudo-code for rate limiting
const rateLimits = new Map<string, number[]>();

function checkRateLimit(nicknameId: string): boolean {
  const now = Date.now();
  const requests = rateLimits.get(nicknameId) || [];
  
  // Remove requests older than 1 second
  const recent = requests.filter(t => now - t < 1000);
  
  if (recent.length >= 1) {
    return false; // Rate limited
  }
  
  recent.push(now);
  rateLimits.set(nicknameId, recent);
  return true;
}
```

## Error Handling Strategy

### Client Error Handling
- **Network errors**: Retry with exponential backoff (1s, 2s, 4s, 8s, max 30s)
- **Invalid configuration**: Exit with clear error message
- **ADB not found**: Provide download link and exit
- **Authentication failure**: Log error, suggest checking secret

### Server Error Handling
- **Invalid heartbeat**: Return 400 with error details
- **Authentication failure**: Return 401 (constant-time comparison)
- **Nickname not found**: Return 404
- **Push delivery failure**: Log error, auto-delete expired subscriptions
- **Database errors**: Return 500, log full error

### Service Worker Error Handling
- **Push parsing errors**: Silent fail (browser handles retry)
- **Notification display errors**: Fallback to basic notification
- **Click handler errors**: Open home page as fallback

## Testing Strategy

### Python Client Tests
- **Unit tests**: Mock ADB responses, test state transitions
- **Integration tests**: Test against local Next.js server
- **Unicode tests**: Test with Korean, Japanese, Chinese nicknames

### Server Tests
- **API tests**: Test all endpoints with valid/invalid data
- **Push tests**: Mock web-push library, verify payload format
- **Unicode tests**: Ensure UTF-8 handling throughout
- **Rate limiting tests**: Verify per-nickname limits

### PWA Tests
- **Service worker tests**: Test push event, notificationclick
- **Subscription tests**: Test subscribe/unsubscribe flow
- **Cross-browser tests**: Manual testing on Safari, Chrome, Firefox

## Deployment

### Client Deployment
- **Standalone executable**: Distribute `monitor` binary
- **Configuration template**: Provide `config.json.example`
- **Documentation**: Clear setup instructions for ADB

### Server Deployment
- **Platform**: Vercel (recommended) or self-hosted
- **Database**: Supabase
  - Create project at supabase.com
  - Run SQL schema in Supabase SQL Editor
  - Configure environment variables from Supabase project settings
- **Environment variables**: Configure in deployment platform
- **VAPID keys**: Generate unique keys per deployment

### SSL/TLS Requirements
- **Required**: All endpoints must use HTTPS
- **Web Push**: Requires valid SSL certificate
- **Service Worker**: Requires HTTPS (or localhost for development)

## Performance Targets

### Response Times
- **Heartbeat API**: < 100ms (p50), < 500ms (p99)
- **Subscribe API**: < 200ms (p50), < 1s (p99)
- **Push delivery**: < 5s from heartbeat to notification

### Scalability Targets
- **MVP**: 100 nicknames, 1000 subscriptions
- **Production**: 10,000 nicknames, 100,000 subscriptions
- **Notification rate**: 1000 notifications/second

## Monitoring & Observability

### Metrics to Track
- Heartbeat rate per nickname
- Push notification success rate
- Subscription count per nickname
- API error rates (4xx, 5xx)
- Response times (p50, p95, p99)

### Logging Strategy
- **Server**: Structured JSON logs
- **Client**: Console output for debugging
- **Service Worker**: Console logs (developer tools only)

## Security Considerations

### Secrets Management
- **Per-nickname secrets**: Store securely in database
- **VAPID keys**: Environment variables, never commit to git
- **Constant-time comparison**: Prevent timing attacks
- **No logging of secrets**: Redact in all logs

### Data Protection
- **Push keys**: Encrypt in database (optional)
- **UTF-8 handling**: Never truncate or modify
- **Rate limiting**: Prevent spam/abuse
- **Input validation**: Strict validation on all inputs

## Future Enhancements

### Potential Features
- **User authentication**: OAuth login for personal dashboards
- **Notification history**: Store past notifications
- **Analytics**: Charts showing uptime/downtime
- **Multi-device monitoring**: One nickname, multiple devices
- **Custom notification rules**: Different alerts for different states

### Technical Improvements
- **WebSocket fallback**: For real-time dashboards
- **Supabase Realtime**: For live updates (optional)
- **Message queue**: For reliable push delivery
- **Connection pooling**: Supabase handles pooling automatically