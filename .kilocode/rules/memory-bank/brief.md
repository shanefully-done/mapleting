Next.js PWA Monitoring & Notification System — Spec

## System Overview

A cross-platform monitoring system that enables real-time notification of Android application state changes. The system consists of a Python client agent that monitors applications via ADB and a Next.js PWA server that delivers push notifications to subscribers.

## Architecture

```
┌─────────────────────┐
│  Python Client      │
│  - ADB Monitor      │
│  - State Detection  │
│  - Heartbeat API    │
└──────────┬──────────┘
           │ HTTPS POST
           │ /api/heartbeat
           ↓
┌─────────────────────┐
│  Next.js Server     │
│  - API Routes       │
│  - Data Storage     │
│  - Push Manager     │
└──────────┬──────────┘
           │ Web Push API
           ↓
┌─────────────────────┐
│  User Devices       │
│  - PWA/Browser      │
│  - Notifications    │
└─────────────────────┘
```

## Goals

### Primary Objectives
- Replace Telegram notifications from client with Web Push API
- Allow users to subscribe to specific nicknames for notifications
- Notify subscribers when a monitored app transitions to disconnected state
- Support all major platforms: Android, iOS 16.4+, Windows, macOS, Linux
- End-to-end UTF-8 support for non-English nicknames
- Clean integration with Python-based monitoring clients

### Quality Objectives
- Cross-platform compatibility (desktop and mobile)
- Native OS notification integration
- Better Unicode handling than Telegram
- Self-hosted, no external messaging service dependencies
- PWA installability on supported platforms

## Non-Goals

- Native mobile apps (PWA provides sufficient functionality)
- Real-time dashboards using polling/WebSocket (push notifications are event-based)
- User authentication via OAuth (can be added later, currently using per-nickname secrets)
- Multiple monitoring protocols (focused on heartbeat-based monitoring)

## Technology Stack

### Frontend (PWA)
- **Next.js 15**: App Router with Server Components
- **PWA Features**: Service Worker + Web Manifest
- **Push Notifications**: Web Push API with VAPID
- **Character Encoding**: UTF-8 everywhere
- **Styling**: CSS Modules or Tailwind CSS

### Backend (API Server)
- **Runtime**: Next.js API routes (Node.js or Edge Runtime)
- **Language**: TypeScript
- **Push Library**: `web-push` for notification delivery
- **Database**: Supabase Postgres
- **Storage**: Managed Postgres with REST API

### Client Agent
- **Language**: Python 3.x (stdlib only)
- **Monitoring**: ADB (Android Debug Bridge)
- **Communication**: HTTPS POST to heartbeat API
- **Packaging**: PyInstaller for standalone executables

## Data Model

### Nickname Entity
Represents a monitored Android application or device.

```typescript
interface Nickname {
  id: string;              // UUID (primary key)
  nickname: string;        // UTF-8, arbitrary Unicode (NOT used as PK)
  lastStatus: "connected" | "disconnected";
  lastSeenAt: number;      // Unix timestamp (milliseconds)
  secret: string;          // Shared secret for client authentication
  createdAt: number;       // Unix timestamp (milliseconds)
}
```

**Critical Constraints:**
- `nickname` is UTF-8 text, NOT a database identifier
- UUID `id` used as primary key to avoid Unicode issues in URLs
- Secret used for client authentication (not password hashing)
- Exact string matching for nicknames (no Unicode normalization)

### Push Subscription Entity
Represents a user's push notification subscription for a nickname.

```typescript
interface PushSubscription {
  id: string;              // UUID
  nicknameId: string;      // FK to Nickname.id
  endpoint: string;        // Push service endpoint URL
  p256dh: string;          // ECDH P-256 public key
  auth: string;            // Authentication secret
  userAgent: string;       // Browser user agent
  createdAt: number;       // Unix timestamp (milliseconds)
}
```

**Relationships:**
- One nickname → multiple subscriptions (one-to-many)
- One subscription → one nickname (many-to-one)
- Subscription linked via `nicknameId` (UUID, not nickname string)

## API Design

### POST /api/heartbeat
**Purpose**: Report application status from Python client

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
  "timestamp": 1734850000000
}
```

**Field Descriptions:**
- `nickname` (string, required): UTF-8 encoded nickname, treated as opaque text
- `status` (string, required): Either "connected" or "disconnected"
- `timestamp` (number, required): Unix timestamp in milliseconds

**Behavior:**
1. Authenticate via `Authorization: Bearer <secret>` header
2. Resolve `nickname` → internal UUID via exact UTF-8 string match
3. Detect state transition: connected → disconnected
4. If transition occurs, trigger push notifications to all subscribers
5. Update `lastStatus` and `lastSeenAt` fields

**Critical Implementation Rules:**
- MUST treat `nickname` as opaque UTF-8 text
- MUST NOT assume ASCII encoding
- MUST NOT URL-decode the nickname field
- MUST store and compare as exact UTF-8 string
- MUST use constant-time comparison for secrets

**Response Codes:**
- `200 OK`: Heartbeat processed successfully
- `400 Bad Request`: Invalid payload or missing required fields
- `401 Unauthorized`: Invalid or missing secret
- `404 Not Found`: Nickname not registered in system
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server-side error

### POST /api/subscribe
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

**Behavior:**
1. Validate nickname exists (exact UTF-8 match)
2. Extract push subscription details from request
3. Store subscription in database
4. Link subscription to nickname via UUID
5. Return subscription ID

**Response Codes:**
- `200 OK`: Subscription created successfully
- `400 Bad Request`: Invalid payload or subscription format
- `404 Not Found`: Nickname doesn't exist
- `409 Conflict`: Already subscribed to this nickname
- `500 Internal Server Error`: Server-side error

### POST /api/unsubscribe
**Purpose**: Cancel push notification subscription

**Request Body:**
```json
{
  "subscriptionId": "uuid"
}
```

**Response Codes:**
- `200 OK`: Unsubscribed successfully
- `404 Not Found`: Subscription not found
- `500 Internal Server Error`: Server-side error

## URL Routing for Non-English Nicknames

### Critical Rule
**NEVER put raw Unicode nicknames in URLs without encoding.**

### Problem
Raw Unicode in URLs breaks across:
- Safari (especially on iOS)
- Service workers (scope and routing issues)
- Push payload navigation

### Solution: Base64-URL Encoding

**Preferred Pattern:**
```
/n/[base64url(utf8Encode(nickname))]
```

Example:
```typescript
// Encode nickname
const nickname = "테스트-장치-01";
const encoded = base64urlEncode(new TextEncoder().encode(nickname));
// Result: "7YyA65OU7J2YIO2EpOyglA=="

// Decode nickname
const decoded = new TextDecoder().decode(base64urlDecode(encoded));
```

**Acceptable Alternative:**
```
/n?nickname=<encodeURIComponent(nickname)>
```

**Patterns to Avoid:**
```
❌ /n/테스트 (breaks Safari, service workers)
❌ /n/test-device (loses original Unicode)
```

## Push Notification Payload

### Format
```json
{
  "title": "Device disconnected",
  "body": "테스트-장치-01 is offline",
  "nickname": "テスト-장치-01",
  "status": "disconnected",
  "timestamp": 1734850000000,
  "data": {
    "nicknameEncoded": "JUVDJUIwJUJEJUI4..."
  }
}
```

### Encoding Rules
- Payload MUST be UTF-8 encoded JSON
- MUST NOT truncate Unicode text
- MUST include encoded nickname for click handling
- Service worker MUST display Unicode correctly

### Service Worker Behavior

**Push Event Handler:**
```javascript
self.addEventListener('push', (event) => {
  const payload = event.data.json();
  
  // Display notification with Unicode text
  const options = {
    body: payload.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    data: {
      nicknameEncoded: payload.data.nicknameEncoded
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});
```

**Notification Click Handler:**
```javascript
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const encodedNickname = event.notification.data.nicknameEncoded;
  const url = `/n/${encodedNickname}`;
  
  event.waitUntil(
    clients.openWindow(url)
  );
});
```

## PWA Requirements

### Manifest
- UTF-8 encoded
- Non-ASCII app name support
- Installability criteria met
- Icons for all screen densities
- Display modes configured

### Service Worker
Must support:
- `push` event (receive notifications)
- `notificationclick` event (handle user interaction)
- Background delivery (work when app is closed)
- Proper Unicode handling in notification display

## Security Model

### Authentication
**Client Authentication:**
- Per-nickname secret via `Authorization: Bearer` header
- Constant-time string comparison to prevent timing attacks
- No user authentication required (public monitoring model)

**Future Enhancements:**
- Optional OAuth user authentication
- Personal dashboards
- Multi-user subscriptions

### Authorization
- **Secret scope**: Each secret valid for one nickname only
- **Subscription scope**: Any user can subscribe to any nickname
- **Rate limiting**: Per-nickname to prevent abuse

### Data Protection
- **Secrets**: Never log secrets, use constant-time comparison
- **Push keys**: Store as encrypted strings in database
- **UTF-8 handling**: Never truncate or modify Unicode text
- **Input validation**: Strict validation on all inputs

### Rate Limiting
- **Endpoint**: `/api/heartbeat`
- **Scope**: Per-nickname (not per IP)
- **Limit**: 1 request per second per nickname
- **Implementation**: Token bucket or sliding window

## Error Handling

### Client (Python) Failures
- **Network errors**: Retry with exponential backoff (1s, 2s, 4s, 8s, max 30s)
- **Invalid secret**: Log error, exit with clear message
- **Missing nickname**: Log error, suggest registration
- **ADB not found**: Provide download link, exit gracefully

### Server (Next.js) Failures
- **Duplicate heartbeat**: Update timestamp, skip notification
- **Out-of-order timestamps**: Use latest timestamp
- **Expired push endpoint**: Auto-delete subscription, log error
- **Unicode errors**: Reject request, return 400 Bad Request

### Service Worker Failures
- **Push delivery failure**: Silent fail (browser handles retry)
- **Notification display**: Fallback to basic notification
- **Click handler**: Open home page as fallback

## Compatibility Guarantees

### Platform Support

| Platform | Works | Notes |
|----------|-------|-------|
| Android | ✅ Yes | Chrome, Firefox |
| iOS | ✅ Yes | iOS 16.4+ (Safari) |
| Windows | ✅ Yes | Chrome, Firefox, Edge |
| macOS | ✅ Yes | Chrome, Firefox, Safari |
| Linux | ✅ Yes | Chrome, Firefox |

### Browser Support
- Chrome 80+
- Firefox 80+
- Safari 16.4+
- Edge 80+

## Configuration

### Environment Variables (Server)
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

### Client Configuration (config.json)
```json
{
  "server_url": "https://your-server.com",
  "nickname": "your-nickname",
  "secret": "your-per-nickname-secret",
  "package_name": "com.example.app",
  "check_interval_seconds": 3
}
```

### VAPID Key Generation
```bash
npx web-push generate-vapid-keys
```

## Migration from Telegram

### Mapping
| Telegram Component | New System Component |
|-------------------|---------------------|
| Bot Token | Per-nickname secret |
| Chat ID | Push subscription (endpoint + keys) |
| Message | Push notification payload |
| Webhook | Heartbeat API |

### Client Changes Required
1. Replace `send_telegram()` with `send_heartbeat()`
2. Change config: `telegram_token` → `server_url` + `secret`
3. Add `Authorization: Bearer <secret>` header
4. Include timestamp in heartbeat payload
5. Handle HTTP response codes instead of Telegram API responses

### No Conceptual Changes
- Monitoring logic remains identical
- State detection unchanged
- Notification triggers same
- User experience improved

## Implementation Order

### Phase 1: Server Foundation
1. Initialize Next.js project with App Router
2. Set up database schema (Postgres)
3. Create data models and repositories
4. Implement `/api/heartbeat` endpoint
5. Test with mock Python client

### Phase 2: Push Infrastructure
6. Generate VAPID keys
7. Create nickname + secret model
8. Implement `/api/subscribe` endpoint
9. Implement `/api/unsubscribe` endpoint
10. Test push subscription flow

### Phase 3: PWA Features
11. Create service worker (push + click handlers)
12. Create PWA manifest (UTF-8 support)
13. Build subscription UI
14. Implement nickname detail pages
15. Test PWA installability

### Phase 4: Integration
16. Modify Python client to use new API
17. End-to-end testing with real ADB
18. Unicode testing (Korean, Japanese, Chinese)
19. Cross-browser testing
20. Performance optimization

### Phase 5: Deployment
21. Set up Supabase database project
22. Run schema in Supabase SQL Editor
23. Configure environment variables in Vercel
24. Deploy to Vercel
25. Monitor and iterate

## Explicit Design Decisions

### UTF-8 First
- All text handling assumes UTF-8
- No ASCII assumptions anywhere
- Prevents data corruption
- Avoids complex normalization

### Nickname as Data, Not Identifier
- Nickname is user-facing text
- UUID used as internal identifier
- Prevents URL encoding issues
- Simplifies database queries

### Push Over WebSocket
- Works when browser/app is closed
- Better battery life on mobile
- Native OS notification integration
- Scales better (no persistent connections)

### Stateless Python Client
- No persistent state on client
- All state stored server-side
- Easy to restart/migrate clients
- Simplified error handling

### No Vendor Lock-in
- Self-hosted solution
- Standard Web Push API
- No third-party messaging services
- Full control over data

## Acceptance Criteria

### Functional Requirements
- ✅ Non-English nickname works end-to-end
- ✅ Notification arrives when disconnected
- ✅ Works after browser restart
- ✅ Works when app is backgrounded
- ✅ No Telegram dependency

### Non-Functional Requirements
- ✅ Notification delivery within 5 seconds
- ✅ 99.9% delivery success rate
- ✅ Cross-platform compatibility
- ✅ UTF-8 support throughout
- ✅ PWA installable on all platforms

### Testing Requirements
- ✅ Unicode nicknames (Korean, Japanese, Chinese)
- ✅ State transition detection
- ✅ Push notification delivery
- ✅ Service worker functionality
- ✅ Cross-browser compatibility

## Failure Modes to Handle

### Expected Failures
- Duplicate heartbeat messages
- Out-of-order timestamps
- Client reconnect storms
- Expired push endpoints
- Unicode normalization mismatches

### Mitigation Strategies
- Idempotent heartbeat processing
- Use latest timestamp
- Per-nickname rate limiting
- Auto-delete expired subscriptions
- Exact string matching (no normalization)

## Performance Targets

### Response Times
- Heartbeat API: < 100ms (p50), < 500ms (p99)
- Subscribe API: < 200ms (p50), < 1s (p99)
- Push delivery: < 5s from heartbeat to notification

### Scalability
- MVP: 100 nicknames, 1,000 subscriptions
- Production: 10,000 nicknames, 100,000 subscriptions
- Notification rate: 1,000 notifications/second

## Monitoring & Observability

### Key Metrics
- Heartbeat rate per nickname
- Push notification success rate
- Subscription count per nickname
- API error rates (4xx, 5xx)
- Response times (p50, p95, p99)

### Logging Strategy
- Server: Structured JSON logs
- Client: Console output for debugging
- Service Worker: Console logs (dev tools only)
- Never log secrets or sensitive data

## Future Enhancements

### Potential Features
- User authentication (OAuth)
- Notification history
- Analytics dashboard
- Multi-device monitoring
- Custom notification rules

### Technical Improvements
- WebSocket fallback for dashboards
- Redis caching for nickname resolution
- Message queue for push delivery
- Load balancing for multiple instances
- Real-time status display

---

**Document Version**: 1.0  
**Last Updated**: 2025-12-23  
**Status**: Specification Complete