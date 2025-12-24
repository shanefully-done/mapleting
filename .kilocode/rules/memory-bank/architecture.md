# Architecture

## System Overview

The monitoring and notification system follows a three-tier architecture with multiple client options:

1. **Client Agent** (Python or Android) - Monitors Android applications via ADB or native APIs
2. **API Server** (Next.js) - Receives heartbeats, manages subscriptions, delivers push notifications
3. **PWA Frontend** (Next.js) - User interface for subscription management and notification display

### Client Options

The system supports two client approaches:
- **Python Client**: Cross-platform monitoring via ADB (requires ADB setup)
- **Android App**: Native monitoring directly on Android device (no ADB required, simpler for non-technical users)

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Client Options (Choose One)                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           Python Client Agent (Technical Users)          │   │
│  │           [client/mapleting.py]                          │   │
│  │  - ADB Interface: Checks app status via `adb shell ps`  │   │
│  │  - State Machine: Tracks running → stopped transitions  │   │
│  │  - HTTP Client: POSTs heartbeats to Next.js server      │   │
│  │  - Config: JSON-based (nickname, package, secret)       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          OR                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           Android App (Non-Technical Users)              │   │
│  │           [android/app/]                                 │   │
│  │  - AccessibilityService: App status detection           │   │
│  │  - ForegroundService: Background monitoring              │   │
│  │  - HTTP Client: OkHttp for heartbeats                   │   │
│  │  - Config: DataStore (nickname, package, secret)        │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────────┘
                               │
                               │ HTTPS POST
                               │ /api/heartbeat
                               │ Authorization: Bearer <secret>
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js API Server                          │
│                      [server/app/api/]                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  /api/heartbeat                                          │   │
│  │  - Authenticate via Bearer token                         │   │
│  │  - Resolve nickname → internal ID                        │   │
│  │  - Detect state transitions                             │   │
│  │  - Trigger push notifications                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  /api/subscribe                                          │   │
│  │  - Store push subscription (endpoint + keys)             │   │
│  │  - Link subscription to nickname                         │   │
│  │  - Handle non-English nicknames (UTF-8)                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  /api/unsubscribe                                        │   │
│  │  - Remove push subscription                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Data Layer                                              │   │
│  │  - Nickname entities (id, nickname, secret, lastStatus)  │   │
│  │  - Push subscriptions (endpoint, p256dh, auth)           │   │
│  │  - Storage: Postgres (Vercel Postgres or Supabase)       │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              │ Web Push API
                              │ (VAPID)
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      PWA Frontend                                │
│                      [server/app/]                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Pages/Components                                       │   │
│  │  - /n/[nickname] - Nickname detail page                 │   │
│  │  - Subscription UI - Push permission + form             │   │
│  │  - Status display - Current device status               │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Service Worker [public/sw.js]                          │   │
│  │  - push event handler                                   │   │
│  │  - notificationclick handler                            │   │
│  │  - Background sync support                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Manifest [public/manifest.json]                        │   │
│  │  - UTF-8 encoded                                        │   │
│  │  - Non-ASCII app name support                           │   │
│  │  - PWA installability metadata                          │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Model

### Nickname Entity

Represents a monitored Android application/device.

```typescript
interface Nickname {
	id: string; // UUID (primary key)
	nickname: string; // UTF-8, arbitrary Unicode (NOT used as PK)
	lastStatus: "connected" | "disconnected";
	lastSeenAt: number; // Unix timestamp
	secret: string; // Shared secret for client authentication
	createdAt: number; // Unix timestamp
}
```

**Critical Design Decisions:**

- `nickname` is UTF-8 text, NOT a database identifier
- UUID `id` used as primary key to avoid Unicode issues
- Secret used for authentication (not password hashing)
- Exact string matching for nicknames (no normalization)

### Push Subscription Entity

Represents a user's push notification subscription for a nickname.

```typescript
interface PushSubscription {
	id: string; // UUID
	nicknameId: string; // FK to Nickname.id
	endpoint: string; // Push service endpoint URL
	p256dh: string; // ECDH P-256 public key
	auth: string; // Authentication secret
	userAgent: string; // Browser user agent
	createdAt: number; // Unix timestamp
}
```

**Relationships:**

- One nickname can have multiple subscriptions
- One subscription belongs to exactly one nickname
- Subscription is linked to nickname via `nicknameId` (UUID)

## API Contracts

### POST /api/heartbeat

**From**: Python client agent OR Android app
**Purpose**: Report application status

**Request Headers:**

```
Content-Type: application/json
Authorization: Bearer <nickname-secret>
```

**Request Body:**

```json
{
	"nickname": "테스트-장치-01",
	"status": "connected",
	"timestamp": 1734850000
}
```

**Response:**

- `200 OK` - Heartbeat processed
- `401 Unauthorized` - Invalid secret
- `404 Not Found` - Nickname not registered
- `500 Internal Server Error` - Server error

**Behavior:**

1. Authenticate via `Authorization: Bearer <secret>`
2. Resolve `nickname` → internal UUID via exact string match
3. Detect state transition: `connected` → `disconnected`
4. If transition occurs, trigger push notifications to all subscribers
5. Update `lastStatus` and `lastSeenAt`

**Critical Rules:**

- Treat `nickname` as opaque UTF-8 text
- MUST NOT assume ASCII
- MUST NOT URL-decode nickname field
- MUST store and compare as UTF-8 string

### POST /api/subscribe

**From**: Browser/PWA  
**Purpose**: Subscribe to notifications for a nickname

**Request Body:**

```json
{
	"nickname": "テスト-장치-01",
	"subscription": {
		"endpoint": "https://fcm.googleapis.com/...",
		"keys": {
			"p256dh": "B...",
			"auth": "A..."
		}
	}
}
```

**Response:**

- `200 OK` - Subscription created
- `400 Bad Request` - Invalid payload
- `404 Not Found` - Nickname doesn't exist
- `409 Conflict` - Already subscribed

**Behavior:**

1. Validate nickname exists (exact UTF-8 match)
2. Store push subscription details
3. Link subscription to nickname via UUID
4. Return subscription ID

### POST /api/unsubscribe

**From**: Browser/PWA  
**Purpose**: Cancel push notifications

**Request Body:**

```json
{
	"subscriptionId": "uuid"
}
```

**Response:**

- `200 OK` - Unsubscribed
- `404 Not Found` - Subscription not found

## URL Routing Strategy

### Nickname Pages

**Problem**: Raw Unicode in URLs breaks across browsers/service workers

**Solution**: Base64-URL encoding

```
Preferred: /n/[base64url(utf8Encode(nickname))]
Acceptable: /n?nickname=<encodeURIComponent(nickname)>
Avoid: /n/테스트 (breaks Safari, service workers)
```

**Implementation:**

```typescript
// Encode
const encoded = base64urlEncode(new TextEncoder().encode(nickname));

// Decode
const nickname = new TextDecoder().decode(base64urlDecode(encoded));
```

## Push Notification Flow

```
1. Python Client OR Android App detects: running → stopped
   ↓
2. POST /api/heartbeat with status="disconnected"
   ↓
3. Server detects transition: connected → disconnected
   ↓
4. Query subscriptions by nicknameId
   ↓
5. For each subscription:
   a. Build payload (UTF-8 encoded)
   b. Send via web-push library
   c. Handle errors (expired endpoints → delete)
   ↓
6. Service Worker receives push event
   ↓
7. Display notification with Unicode text
   ↓
8. User clicks notification
   ↓
9. Open /n?nickname=<encoded>
```

## Notification Payload Format

```json
{
	"title": "Device disconnected",
	"body": "테스트-장치-01 is offline",
	"nickname": "テ스트-장치-01",
	"status": "disconnected",
	"timestamp": 1734850000,
	"data": {
		"nicknameEncoded": "JUVDJUIwJUJEJUI4..."
	}
}
```

**Rules:**

- UTF-8 encoded JSON
- No truncation of Unicode text
- Include encoded nickname for click handling
- Service worker must display Unicode correctly

## Security Model

### Authentication

- **Client Authentication**: Per-nickname secret via `Authorization: Bearer`
- **Constant-time comparison**: Prevent timing attacks on secrets
- **No user authentication**: Optional feature for future (OAuth)

### Authorization

- **Secret scope**: Each secret valid for one nickname only
- **Subscription scope**: Any user can subscribe to any nickname (public monitoring)

### Rate Limiting

- **Endpoint**: `/api/heartbeat`
- **Strategy**: Per-nickname rate limiting (prevent spam)
- **Implementation**: Token bucket or sliding window

### Data Protection

- **Secrets**: Never log secrets, use constant-time comparison
- **Push keys**: Store as encrypted strings in database
- **UTF-8 handling**: Never truncate or modify Unicode text

## Error Handling

### Client (Python) Failures

- **Network error**: Retry with exponential backoff
- **Invalid secret**: Log error, exit with clear message
- **Missing nickname**: Log error, suggest registration

### Server (Next.js) Failures

- **Duplicate heartbeat**: Update timestamp, skip notification
- **Out-of-order timestamps**: Use latest timestamp
- **Expired push endpoint**: Auto-delete subscription, log error
- **Unicode errors**: Reject request, return 400 Bad Request

### Service Worker Failures

- **Push delivery failure**: Silent fail (browser handles retry)
- **Notification display**: Fallback to basic notification
- **Click handler**: Gracefully handle malformed URLs

## Design Patterns

### 1. Event-Driven Architecture

- Heartbeat events trigger state transitions
- State transitions trigger push notifications
- Loose coupling between components

### 2. Stateless Client

- Python agent has no persistent state
- All state stored server-side
- Easy to restart/migrate clients

### 3. Pub/Sub Pattern

- Nicknames are "topics"
- Subscribers receive notifications on state changes
- One-to-many notification delivery

### 4. Repository Pattern

- Data access abstracted from API routes
- Postgres with connection pooling
- Centralized business logic

## Performance Considerations

### Database Indexes

```sql
CREATE INDEX idx_nicknames_nickname ON nicknames(nickname);
CREATE INDEX idx_subscriptions_nicknameId ON subscriptions(nicknameId);
```

### Push Notification Batching

- Send notifications in parallel (not serial)
- Use `Promise.all()` for concurrent requests
- Timeout individual push requests (5s)

### Caching Strategy

- Cache nickname → UUID resolution (in-memory)
- TTL: 5 minutes
- Invalidate on nickname updates

## Scalability

### Current Scope (MVP)

- Single Next.js server
- Supabase Postgres database
- Suitable for < 1000 nicknames, < 10000 subscriptions

### Future Scaling

- Add load balancer → multiple Next.js instances
- Add Redis (Upstash) for caching/pub/sub
- Implement queue for push notification delivery
- Connection pooling for high concurrency

## Source Code Structure

```
mapleting/
├── client/                          # Python monitoring agent
│   ├── mapleting.py                   # Main monitoring script
│   ├── config.json                  # Client configuration
│
├── android/                         # Android monitoring app
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── java/com/mapleting/monitor/
│   │   │   │   ├── MainActivity.kt
│   │   │   │   ├── MonitoringService.kt
│   │   │   │   ├── ForegroundAccessibilityService.kt
│   │   │   │   ├── adapter/
│   │   │   │   │   └── AppInfoAdapter.kt
│   │   │   │   ├── data/
│   │   │   │   │   ├── AppInfoItem.kt
│   │   │   │   │   ├── ConfigRepository.kt
│   │   │   │   │   ├── HeartbeatRequest.kt
│   │   │   │   │   ├── HeartbeatResult.kt
│   │   │   │   │   ├── LogEntry.kt
│   │   │   │   │   ├── LogManager.kt
│   │   │   │   │   └── MonitorConfig.kt
│   │   │   │   ├── network/
│   │   │   │   │   └── HeartbeatClient.kt
│   │   │   │   ├── service/
│   │   │   │   │   ├── ForegroundAccessibilityService.kt
│   │   │   │   │   └── MonitoringService.kt
│   │   │   │   ├── utils/
│   │   │   │   │   └── AccessibilityUtils.kt
│   │   │   │   └── viewmodel/
│   │   │   │       └── MonitoringViewModel.kt
│   │   └── build.gradle.kts
│
├── server/                          # Next.js PWA
│   ├── app/
│   │   ├── api/
│   │   │   ├── heartbeat/
│   │   │   │   └── route.ts         # POST /api/heartbeat
│   │   │   ├── subscribe/
│   │   │   │   └── route.ts         # POST /api/subscribe
│   │   │   └── unsubscribe/
│   │   │       └── route.ts         # POST /api/unsubscribe
│   │   ├── n/
│   │   │   └── [nickname]/
│   │   │       └── page.tsx         # Nickname detail page
│   │   └── page.tsx                 # Home page
│   ├── lib/
│   │   ├── db.ts                    # Database client
│   │   ├── models.ts                # Data models
│   │   └── push.ts                  # Web push utilities
│   ├── public/
│   │   ├── manifest.json            # PWA manifest
│   │   └── sw.js                    # Service worker
│   └── package.json
│
└── .kilocode/
    └── rules/
        └── memory-bank/             # Project documentation
            ├── brief.md             # System specification
            ├── product.md           # Product requirements
            ├── context.md           # Current state
            ├── architecture.md      # This file
            └── tech.md              # Technical stack
```

## Key Technical Decisions Rationale

### Why UTF-8 First?

- Non-English users are primary target (Korean, Japanese, Chinese)
- Prevents data corruption across the stack
- Avoids complex normalization logic

### Why Web Push Over WebSocket?

- Works when browser/app is closed
- Better battery life on mobile
- Native OS notification integration
- Scales better (no persistent connections)

### Why Per-Nickname Secrets?

- Simpler than full user authentication
- Sufficient for server-to-server auth
- Easy to migrate from Telegram bot tokens
- Works identically for Python and Android clients

### Why Add Android App?

- **No ADB required**: Runs directly on target device
- **Simpler for non-technical users**: No complex setup
- **Better reliability**: Native APIs more robust than ADB
- **Same API contract**: Identical heartbeat format as Python client
- **Wider accessibility**: Enables monitoring for users without technical skills

### Why Next.js?

- Unified frontend + backend
- Excellent PWA support
- Easy deployment (Vercel, self-hosted)
- TypeScript support

### Why Supabase?

- Managed Postgres with excellent developer experience
- Application-generated UUIDs work perfectly
- CHECK constraints for data validation
- Built-in connection pooling
- Easy to use with comprehensive TypeScript client
- Works seamlessly with Vercel deployment
