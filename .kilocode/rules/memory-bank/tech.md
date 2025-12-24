# Technical Stack

## Technologies

### Client Options

The project supports two monitoring approaches:

#### Option 1: Python Agent (Technical Users)

- **Python**: 3.x (stdlib only - no external dependencies for core functionality)
- **ADB**: Android Debug Bridge for app status detection
- **PyInstaller**: For building standalone executables
- **Standard Library**:
  - `subprocess` - Process execution (ADB commands)
  - `urllib` - HTTP requests (sending heartbeats)
  - `json` - Configuration file parsing
  - `time` - Sleep intervals between checks

#### Option 2: Android Native App (Non-Technical Users)

- **Language**: Kotlin 100%
- **Min SDK**: API 24 (Android 7.0 Nougat)
- **Target SDK**: API 34 (Android 14)
- **Architecture**: MVVM with Coroutines
- **Key Libraries**:
  - OkHttp 4.12.0 - HTTP client for heartbeats
  - DataStore 1.0.0 - Configuration persistence
  - Kotlin Coroutines 1.7.3 - Asynchronous operations
  - Gson 2.10.1 - JSON parsing
  - Material Design Components - UI
- **Key Features**:
  - ForegroundService for background monitoring
  - ActivityManager/PackageManager for app detection
  - Persistent notification showing monitoring status
  - Battery optimization handling

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

### Frontend (PWA)

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

#### For Android App Development

- Android Studio (latest version)
- JDK 8 or higher
- Android SDK (API 24-34)
- Android device/emulator for testing

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

#### Python Client Setup

```bash
cd client
# No dependencies to install (stdlib only)
# Build executable:
pyinstaller --onefile mapleting.py
```

#### Android App Setup

```bash
cd android
# Open in Android Studio
# Sync Gradle files
# Run on device/emulator:
./gradlew installDebug
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

### Android App

- **Must send identical heartbeat format**: Exact same JSON as Python client
- **UTF-8 encoding**: Full Unicode support for nicknames
- **Background operation**: Must survive app backgrounding and screen-off
- **Battery optimization**: Must handle system battery optimization
- **Min SDK 24**: Support Android 7.0+ (99%+ of active devices)
- **Foreground service**: Persistent notification required
- **Network resilience**: Graceful retry logic for failures
- **No logging secrets**: Never log secret keys in plain text

### Next.js Server

- **UTF-8 everywhere**: No ASCII assumptions in any component
- **No user auth (initially)**: Per-nickname secrets only
- **Stateless API**: No sessions, all authentication via Bearer tokens
- **Push delivery**: Must handle expired endpoints gracefully
- **Unicode in URLs**: Must encode/decode nicknames properly

### PWA (Web)

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
	const recent = requests.filter((t) => now - t < 1000);

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

### Android App Tests

- **Unit tests**: App status detection, network client, configuration validation
- **Integration tests**: End-to-end monitoring flow, heartbeat delivery
- **UI tests**: Configuration flow, service start/stop
- **Unicode tests**: Test with Korean, Japanese, Chinese nicknames
- **Device testing**: Android 7.0 through Android 14
- **Battery optimization**: Test with/without optimization disabled

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

### Python Client Deployment

- **Standalone executable**: Distribute `monitor` binary
- **Configuration template**: Provide `config.json.example`
- **Documentation**: Clear setup instructions for ADB

### Android App Deployment

- **APK distribution**: For testing and direct distribution
- **Google Play Store**: Main distribution channel
- **F-Droid**: Alternative open-source distribution
- **Release notes**: Include version, features, requirements
- **Privacy policy**: Required for Play Store

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
- **Android app enhancements**:
  - Multiple app monitoring
  - Custom check intervals
  - Notification history on device
  - QR code configuration

### Technical Improvements

- **WebSocket fallback**: For real-time dashboards
- **Supabase Realtime**: For live updates (optional)
- **Message queue**: For reliable push delivery
- **Connection pooling**: Supabase handles pooling automatically
- **Android app improvements**:
  - WorkManager for scheduled tasks
  - Backup/restore configuration
  - Export logs for debugging
