# MapleTing API Documentation

Complete API reference for the MapleTing monitoring system. All endpoints use JSON for request and response bodies.

## Base URL

The base URL depends on your deployment:

- **Development**: `http://localhost:3000`
- **Production (Vercel)**: `https://your-app.vercel.app`
- **Production (Self-Hosted)**: `https://your-domain.com`

## Authentication

### Per-Nickname Secret Authentication

The `/api/heartbeat` endpoint uses per-nickname secret authentication via the `Authorization` header:

```
Authorization: Bearer <nickname-secret>
```

**Example**:

```http
POST /api/heartbeat
Authorization: Bearer 7Kx9vP2mQ8wL5nR3jT6yH1sF4dG7cV0bN
Content-Type: application/json
```

**Security Notes**:

- Secrets are compared using constant-time comparison to prevent timing attacks
- Each nickname has a unique secret
- Secrets are never logged or exposed in error messages
- Use HTTPS in production to protect secrets in transit

### No Authentication Required

The `/api/subscribe` and `/api/unsubscribe` endpoints do not require authentication:

- Anyone can subscribe to any nickname (public monitoring model)
- Future versions may add optional user authentication

## Common Response Codes

| Code                        | Description                        |
| --------------------------- | ---------------------------------- |
| `200 OK`                    | Request successful                 |
| `400 Bad Request`           | Invalid request body or parameters |
| `401 Unauthorized`          | Missing or invalid authentication  |
| `404 Not Found`             | Resource not found                 |
| `405 Method Not Allowed`    | HTTP method not supported          |
| `500 Internal Server Error` | Server-side error                  |

## Common Response Format

Success responses follow this structure:

```json
{
  "success": true,
  "data": { ... }
}
```

Error responses follow this structure:

```json
{
  "error": "Error message description",
  "details": { ... }  // Optional
}
```

---

## Endpoints

### POST /api/heartbeat

Receives status updates from Python client agents and triggers push notifications on state transitions.

**Authentication**: Required (`Authorization: Bearer <secret>`)

#### Request

**Headers**:

```http
Content-Type: application/json
Authorization: Bearer <nickname-secret>
```

**Body**:

```json
{
	"nickname": "테스트-장치-01",
	"status": "connected",
	"timestamp": 1734850000000
}
```

**Fields**:

| Field       | Type   | Required | Description                                       |
| ----------- | ------ | -------- | ------------------------------------------------- |
| `nickname`  | string | ✅ Yes   | UTF-8 encoded nickname (treated as opaque text)   |
| `status`    | string | ✅ Yes   | Either `"connected"` or `"disconnected"`          |
| `timestamp` | number | ✅ Yes   | Unix timestamp in milliseconds (must be positive) |

#### Response

**Success (200 OK)**:

```json
{
	"success": true,
	"message": "Heartbeat received",
	"data": {
		"nickname": "테스트-장치-01",
		"status": "disconnected",
		"timestamp": 1734850000000,
		"previousStatus": "connected"
	}
}
```

**Error - Missing Authorization (401 Unauthorized)**:

```json
{
	"error": "Unauthorized: Missing or invalid Authorization header"
}
```

**Error - Invalid Secret (401 Unauthorized)**:

```json
{
	"error": "Unauthorized: Invalid nickname or secret"
}
```

**Error - Nickname Not Found (404 Not Found)**:

```json
{
	"error": "Not Found: Nickname does not exist"
}
```

**Error - Invalid Request Body (400 Bad Request)**:

```json
{
	"error": "Bad Request: Missing or invalid 'nickname' field"
}
```

#### Behavior

1. **Authentication**: Verifies the `Authorization: Bearer <secret>` header
2. **Validation**: Validates all required fields in request body
3. **State Detection**: Detects state transitions (connected → disconnected)
4. **Database Update**: Updates `last_status` and `last_seen_at` in database
5. **Push Notifications**: Sends notifications to all subscribers if transition detected
6. **Auto-Cleanup**: Deletes expired push endpoints automatically

**State Transition Logic**:

- Only triggers notifications for `connected → disconnected` transitions
- `disconnected → connected` transitions are logged but don't trigger notifications
- Duplicate heartbeats update the timestamp but don't trigger notifications

**Rate Limiting**:

- Per-nickname rate limiting: 1 request per second
- Uses in-memory token bucket implementation
- Returns `429 Too Many Requests` if limit exceeded

#### Example Requests

**cURL**:

```bash
curl -X POST https://your-server.com/api/heartbeat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 7Kx9vP2mQ8wL5nR3jT6yH1sF4dG7cV0bN" \
  -d '{
    "nickname": "테스트-장치-01",
    "status": "disconnected",
    "timestamp": 1734850000000
  }'
```

**JavaScript (fetch)**:

```javascript
const response = await fetch("https://your-server.com/api/heartbeat", {
	method: "POST",
	headers: {
		"Content-Type": "application/json",
		Authorization: "Bearer 7Kx9vP2mQ8wL5nR3jT6yH1sF4dG7cV0bN",
	},
	body: JSON.stringify({
		nickname: "테스트-장치-01",
		status: "disconnected",
		timestamp: Date.now(),
	}),
});

const data = await response.json();
console.log(data);
```

**Python (requests)**:

```python
import requests
import time

response = requests.post(
    'https://your-server.com/api/heartbeat',
    headers={
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 7Kx9vP2mQ8wL5nR3jT6yH1sF4dG7cV0bN'
    },
    json={
        'nickname': '테스트-장치-01',
        'status': 'disconnected',
        'timestamp': int(time.time() * 1000)
    }
)

print(response.json())
```

---

### POST /api/subscribe

Allows users to subscribe to push notifications for a specific nickname.

**Authentication**: Not required (public endpoint)

#### Request

**Headers**:

```http
Content-Type: application/json
```

**Body**:

```json
{
	"nickname": "테스트-장치-01",
	"subscription": {
		"endpoint": "https://fcm.googleapis.com/fcm/send/...",
		"keys": {
			"p256dh": "Bxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
			"auth": "Axxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
		}
	}
}
```

**Fields**:

| Field                      | Type   | Required | Description                               |
| -------------------------- | ------ | -------- | ----------------------------------------- |
| `nickname`                 | string | ✅ Yes   | UTF-8 encoded nickname to subscribe to    |
| `subscription`             | object | ✅ Yes   | Push subscription object                  |
| `subscription.endpoint`    | string | ✅ Yes   | Push service endpoint URL                 |
| `subscription.keys`        | object | ✅ Yes   | Push encryption keys                      |
| `subscription.keys.p256dh` | string | ✅ Yes   | ECDH P-256 public key (base64url encoded) |
| `subscription.keys.auth`   | string | ✅ Yes   | Authentication secret (base64url encoded) |

#### Response

**Success - New Subscription (200 OK)**:

```json
{
	"success": true,
	"subscriptionId": "550e8400-e29b-41d4-a716-446655440000",
	"nickname": "테스트-장치-01",
	"updated": false
}
```

**Success - Updated Existing Subscription (200 OK)**:

```json
{
	"success": true,
	"subscriptionId": "550e8400-e29b-41d4-a716-446655440000",
	"nickname": "테스트-장치-01",
	"updated": true
}
```

**Error - Nickname Not Found (404 Not Found)**:

```json
{
	"error": "Not Found: Nickname does not exist"
}
```

**Error - Invalid Subscription (400 Bad Request)**:

```json
{
	"error": "Bad Request: Invalid subscription format"
}
```

#### Behavior

1. **Validation**: Validates subscription structure and keys
2. **Nickname Lookup**: Verifies nickname exists in database
3. **Duplicate Detection**: Checks if endpoint already has a subscription
4. **Create or Update**: Creates new subscription or updates existing one
5. **User Agent**: Stores browser user agent for debugging

**Duplicate Handling**:

- If the endpoint already exists, the subscription is updated instead of creating a duplicate
- This handles cases where keys change but the endpoint stays the same
- Returns `updated: true` to indicate an existing subscription was modified

#### Example Requests

**cURL**:

```bash
curl -X POST https://your-server.com/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "nickname": "테스트-장치-01",
    "subscription": {
      "endpoint": "https://fcm.googleapis.com/fcm/send/...",
      "keys": {
        "p256dh": "Bxxxxxxxxxxxxx",
        "auth": "Axxxxxxxxxxxxx"
      }
    }
  }'
```

**JavaScript (Browser - after push subscription)**:

```javascript
// Assuming you have a push subscription from navigator.pushManager.subscribe()
const response = await fetch("https://your-server.com/api/subscribe", {
	method: "POST",
	headers: {
		"Content-Type": "application/json",
	},
	body: JSON.stringify({
		nickname: "테스트-장치-01",
		subscription: {
			endpoint: pushSubscription.endpoint,
			keys: {
				p256dh: pushSubscription.getKey("p256dh"),
				auth: pushSubscription.getKey("auth"),
			},
		},
	}),
});

const data = await response.json();
console.log(data);
```

#### Obtaining Push Subscription

Before calling `/api/subscribe`, you need a push subscription from the browser:

```javascript
// Request push notification permission
const permission = await Notification.requestPermission();

if (permission === "granted") {
	// Subscribe to push service
	const pushSubscription = await navigator.pushManager.subscribe({
		userVisibleOnly: true,
		applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
	});

	// Now send to /api/subscribe
	await subscribeToNickname("테스트-장치-01", pushSubscription);
}

// Utility function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
	const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");

	const rawData = window.atob(base64);
	const outputArray = new Uint8Array(rawData.length);

	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i);
	}

	return outputArray;
}
```

---

### POST /api/unsubscribe

Allows users to cancel push notifications for a specific subscription.

**Authentication**: Not required (public endpoint)

#### Request

**Headers**:

```http
Content-Type: application/json
```

**Body**:

```json
{
	"subscriptionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Fields**:

| Field            | Type   | Required | Description                        |
| ---------------- | ------ | -------- | ---------------------------------- |
| `subscriptionId` | string | ✅ Yes   | UUID of the subscription to cancel |

#### Response

**Success (200 OK)**:

```json
{
	"success": true,
	"message": "Subscription removed successfully"
}
```

**Error - Invalid UUID (400 Bad Request)**:

```json
{
	"error": "Bad Request: Invalid 'subscriptionId' format (must be valid UUID)"
}
```

**Error - Subscription Not Found (404 Not Found)**:

```json
{
	"error": "Not Found: Subscription does not exist"
}
```

#### Behavior

1. **UUID Validation**: Validates the subscription ID is a valid UUID v4
2. **Lookup**: Finds the subscription in the database
3. **Delete**: Removes the subscription from the database
4. **Logging**: Logs the deletion for debugging

**Note**: This only removes the subscription from the server database. The browser's push subscription remains active and should be revoked separately if desired:

```javascript
// Revoke browser push subscription
await pushSubscription.unsubscribe();
```

#### Example Requests

**cURL**:

```bash
curl -X POST https://your-server.com/api/unsubscribe \
  -H "Content-Type: application/json" \
  -d '{
    "subscriptionId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

**JavaScript**:

```javascript
const response = await fetch("https://your-server.com/api/unsubscribe", {
	method: "POST",
	headers: {
		"Content-Type": "application/json",
	},
	body: JSON.stringify({
		subscriptionId: "550e8400-e29b-41d4-a716-446655440000",
	}),
});

const data = await response.json();
console.log(data);
```

**Python**:

```python
import requests

response = requests.post(
    'https://your-server.com/api/unsubscribe',
    headers={
        'Content-Type': 'application/json'
    },
    json={
        'subscriptionId': '550e8400-e29b-41d4-a716-446655440000'
    }
)

print(response.json())
```

---

## Data Types

### HeartbeatRequest

```typescript
interface HeartbeatRequest {
	nickname: string; // UTF-8 encoded nickname
	status: "connected" | "disconnected";
	timestamp: number; // Unix timestamp in milliseconds
}
```

### SubscribeRequest

```typescript
interface SubscribeRequest {
	nickname: string;
	subscription: {
		endpoint: string;
		keys: {
			p256dh: string; // ECDH P-256 public key (base64url)
			auth: string; // Authentication secret (base64url)
		};
	};
}
```

### UnsubscribeRequest

```typescript
interface UnsubscribeRequest {
	subscriptionId: string; // UUID v4
}
```

### HeartbeatResponse

```typescript
interface HeartbeatResponse {
	success: true;
	message: "Heartbeat received";
	data: {
		nickname: string;
		status: "connected" | "disconnected";
		timestamp: number;
		previousStatus: "connected" | "disconnected";
	};
}
```

### SubscribeResponse

```typescript
interface SubscribeResponse {
	success: true;
	subscriptionId: string;
	nickname: string;
	updated: boolean; // true if existing subscription was updated
}
```

### UnsubscribeResponse

```typescript
interface UnsubscribeResponse {
	success: true;
	message: "Subscription removed successfully";
}
```

---

## Error Handling

### Error Response Format

All error responses follow this structure:

```typescript
interface ErrorResponse {
	error: string; // Human-readable error message
	details?: any; // Optional additional details
}
```

### Common Errors

| HTTP Code | Error Message                                                 | Cause                            | Solution                                        |
| --------- | ------------------------------------------------------------- | -------------------------------- | ----------------------------------------------- |
| `400`     | `Bad Request: Invalid JSON body`                              | Malformed JSON                   | Check JSON syntax                               |
| `400`     | `Bad Request: Missing or invalid 'nickname' field`            | Missing nickname                 | Include nickname in request                     |
| `400`     | `Bad Request: 'status' must be 'connected' or 'disconnected'` | Invalid status value             | Use only "connected" or "disconnected"          |
| `400`     | `Bad Request: Missing or invalid 'timestamp' field`           | Invalid timestamp                | Use positive number (milliseconds)              |
| `400`     | `Bad Request: Invalid subscription format`                    | Invalid push subscription        | Check subscription structure                    |
| `400`     | `Bad Request: Invalid 'subscriptionId' format`                | Invalid UUID                     | Use valid UUID v4 format                        |
| `401`     | `Unauthorized: Missing or invalid Authorization header`       | No auth header or invalid secret | Include `Authorization: Bearer <secret>` header |
| `401`     | `Unauthorized: Invalid nickname or secret`                    | Secret doesn't match             | Verify secret is correct for nickname           |
| `404`     | `Not Found: Nickname does not exist`                          | Nickname not in database         | Register nickname first                         |
| `404`     | `Not Found: Subscription does not exist`                      | Subscription ID not found        | Verify subscription ID                          |
| `405`     | `Method Not Allowed: Only POST requests are accepted`         | Wrong HTTP method                | Use POST method                                 |
| `429`     | `Too Many Requests: Rate limit exceeded`                      | Too many requests                | Wait before retrying                            |
| `500`     | `Internal Server Error: Failed to update status`              | Database error                   | Check server logs                               |
| `500`     | `Internal Server Error: Failed to create subscription`        | Database error                   | Check server logs                               |

---

## Rate Limiting

### Per-Nickname Rate Limiting

The `/api/heartbeat` endpoint implements per-nickname rate limiting:

**Limits**:

- **Requests**: 1 request per second per nickname
- **Window**: Sliding window (1 second)

**Response**:

```json
{
	"error": "Too Many Requests: Rate limit exceeded",
	"retryAfter": 1000 // milliseconds to wait
}
```

**Implementation**:

- In-memory token bucket
- Independent per nickname (not per IP)
- Resets after 1 second of inactivity

**Best Practices**:

- Respect rate limits in client code
- Implement exponential backoff on 429 responses
- Don't spam heartbeat endpoint

---

## UTF-8 and Unicode Handling

### Critical Rules

All text fields in the API support UTF-8 encoding:

1. **Nickname Field**:

   - Treat as opaque UTF-8 text
   - Do NOT assume ASCII encoding
   - Do NOT URL-decode the nickname field
   - Store and compare as exact UTF-8 string
   - No Unicode normalization (use exact string matching)

2. **Request Headers**:

   - Always include `Content-Type: application/json; charset=utf-8`
   - Ensure proper UTF-8 encoding in HTTP body

3. **Response Headers**:
   - Server returns `Content-Type: application/json; charset=utf-8`
   - All JSON responses are UTF-8 encoded

### Example: Non-English Nicknames

**Korean**:

```json
{
	"nickname": "테스트-장치-01",
	"status": "connected",
	"timestamp": 1734850000000
}
```

**Japanese**:

```json
{
	"nickname": "テスト-デバイス-01",
	"status": "connected",
	"timestamp": 1734850000000
}
```

**Chinese**:

```json
{
	"nickname": "测试设备-01",
	"status": "connected",
	"timestamp": 1734850000000
}
```

**Mixed Scripts**:

```json
{
	"nickname": "Device-测试-테스트-デバイス",
	"status": "connected",
	"timestamp": 1734850000000
}
```

---

## Web Push Integration

### Push Notification Payload

When a state transition occurs (connected → disconnected), the server sends push notifications with this payload:

```json
{
	"title": "Device disconnected",
	"body": "테스트-장치-01 is offline",
	"nickname": "테스트-장치-01",
	"status": "disconnected",
	"timestamp": 1734850000000,
	"data": {
		"nicknameEncoded": "7YyA65OU7J2YIO2EpOyglA=="
	}
}
```

### Service Worker Integration

Your service worker should handle push events:

```javascript
self.addEventListener("push", (event) => {
	const payload = event.data.json();

	const options = {
		body: payload.body,
		icon: "/icons/icon-192x192.png",
		badge: "/icons/badge-72x72.png",
		vibrate: [200, 100, 200],
		data: {
			nicknameEncoded: payload.data.nicknameEncoded,
		},
		actions: [
			{
				action: "view",
				title: "View Details",
			},
		],
	};

	event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener("notificationclick", (event) => {
	event.notification.close();

	const encodedNickname = event.notification.data.nicknameEncoded;
	const url = `/n/${encodedNickname}`;

	event.waitUntil(clients.openWindow(url));
});
```

---

## Testing the API

### Local Testing

**Start development server**:

```bash
cd server
bun dev
```

**Test heartbeat endpoint**:

```bash
curl -X POST http://localhost:3000/api/heartbeat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-here" \
  -d '{
    "nickname": "test-device",
    "status": "connected",
    "timestamp": 1734850000000
  }'
```

**Test subscribe endpoint**:

```bash
curl -X POST http://localhost:3000/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "nickname": "test-device",
    "subscription": {
      "endpoint": "https://fcm.googleapis.com/fcm/send/test",
      "keys": {
        "p256dh": "BMxxxxxxxxxxxxx",
        "auth": "AMxxxxxxxxxxxxx"
      }
    }
  }'
```

### Using Postman

**Create a new collection** for MapleTing API:

1. **Heartbeat Request**:

   - Method: POST
   - URL: `{{baseUrl}}/api/heartbeat`
   - Headers:
     - `Authorization`: `Bearer {{secret}}`
     - `Content-Type`: `application/json`
   - Body: Raw JSON

2. **Subscribe Request**:

   - Method: POST
   - URL: `{{baseUrl}}/api/subscribe`
   - Headers:
     - `Content-Type`: `application/json`
   - Body: Raw JSON

3. **Unsubscribe Request**:
   - Method: POST
   - URL: `{{baseUrl}}/api/unsubscribe`
   - Headers:
     - `Content-Type`: `application/json`
   - Body: Raw JSON

---

## SDKs and Libraries

Currently, there are no official SDKs. However, you can easily integrate with any HTTP client:

- **JavaScript**: `fetch` API (built-in)
- **Python**: `requests` library
- **Node.js**: `axios` or `node-fetch`
- **Go**: `net/http` package
- **Rust**: `reqwest` crate
- **Java**: OkHttp or HttpClient
- **C#**: HttpClient

---

## Changelog

### Version 1.0.0 (Current)

- Initial API release
- POST /api/heartbeat endpoint
- POST /api/subscribe endpoint
- POST /api/unsubscribe endpoint
- UTF-8 support throughout
- Per-nickname authentication
- Rate limiting on heartbeat endpoint

---

## Support

For implementation help or bug reports:

- **Server Documentation**: [`README.md`](README.md:1)
- **Client Documentation**: [`../client/README.md`](../client/README.md:1)
- **Deployment Guide**: [`../DEPLOYMENT.md`](../DEPLOYMENT.md:1)

---

**Last Updated**: 2025-12-23  
**API Version**: 1.0.0
