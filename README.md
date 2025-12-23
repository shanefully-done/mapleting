# Mapleting

A cross-platform monitoring and notification system that enables real-time alerts for Android application state changes. Replace Telegram notifications with modern web push notifications that work on Android, iOS 16.4+, Windows, macOS, and Linux.

## 🚀 Quick Start

### For Server Administrators

1. **Deploy the Next.js Server**:
   ```bash
   cd server
   bun install
   cp .env.local.example .env.local
   # Edit .env.local with your Supabase and VAPID credentials
   bun dev
   ```

2. **Set Up Database**:
   - Create a project at [supabase.com](https://supabase.com/)
   - Run the SQL schema from [`server/lib/schema.sql`](server/lib/schema.sql:1)
   - Configure environment variables

3. **Deploy to Vercel**:
   ```bash
   cd server
   vercel
   ```

📖 **Full Server Setup Guide**: [`server/README.md`](server/README.md:1)

### For Python Client Users

1. **Clone and Configure**:
   ```bash
   cd client
   cp config.json.example config.json
   # Edit config.json with your server URL and credentials
   python monitor.py
   ```

2. **Install ADB**:
   - Download from [developer.android.com](https://developer.android.com/tools/releases/platform-tools)
   - Enable USB debugging on your Android device
   - Verify connection: `adb devices`

3. **Start Monitoring**:
   ```bash
   python monitor.py
   ```

📖 **Full Client Setup Guide**: [`client/README.md`](client/README.md:1)

## 📋 Overview

Mapleting is a complete monitoring system consisting of:

- **Python Client Agent**: Monitors Android apps via ADB and sends heartbeats
- **Next.js PWA Server**: Receives heartbeats and manages push notifications
- **Web Push API**: Delivers notifications to subscribers across all platforms

### Key Features

✅ **Cross-Platform Push Notifications** - Works on Android, iOS 16.4+, Windows, macOS, and Linux  
✅ **PWA Installability** - Install as native app on supported platforms  
✅ **UTF-8 First Design** - Full Unicode support for non-English nicknames  
✅ **Real-Time Monitoring** - Instant notifications on state changes  
✅ **Self-Hosted** - No external messaging service dependencies  
✅ **Lightweight Client** - Uses only Python standard library  
✅ **Type-Safe Server** - Full TypeScript implementation  
✅ **Supabase Integration** - Managed PostgreSQL with excellent DX  

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Python Client Agent                      │
│                         [client/monitor.py]                      │
├─────────────────────────────────────────────────────────────────┤
│  - ADB Interface: Checks app status via `adb shell ps`          │
│  - State Machine: Tracks running → stopped transitions          │
│  - HTTP Client: POSTs heartbeats to Next.js server              │
│  - Config: JSON-based (nickname, package, secret, interval)     │
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
│  │  - Storage: Supabase Postgres                            │   │
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
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              │ Push Notification
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      User Devices                                │
│  Android • iOS 16.4+ • Windows • macOS • Linux                  │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 Use Cases

- **Game Server Monitoring**: Track mobile game instances for downtime
- **App Crash Detection**: Get notified when apps crash or stop unexpectedly
- **Device Status Tracking**: Monitor application status across multiple devices
- **Service Availability**: Ensure critical services are running
- **Non-English Environments**: Full support for Korean, Japanese, Chinese, and other languages

## 📱 Platform Support

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

## 🔧 Technology Stack

### Client (Python)
- **Language**: Python 3.8+
- **Monitoring**: ADB (Android Debug Bridge)
- **Communication**: HTTPS POST to heartbeat API
- **Dependencies**: Python standard library only
- **Packaging**: PyInstaller for standalone executables

### Server (Next.js)
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: Supabase Postgres
- **Push Notifications**: Web Push API with VAPID
- **PWA**: Service Worker + Web Manifest
- **Styling**: Tailwind CSS + shadcn/ui

## 📚 Documentation

- **Server Setup**: [`server/README.md`](server/README.md:1) - Complete server installation and configuration
- **Client Setup**: [`client/README.md`](client/README.md:1) - Python client installation and usage
- **Deployment Guide**: [`DEPLOYMENT.md`](DEPLOYMENT.md:1) - Production deployment instructions
- **API Reference**: [`server/API.md`](server/API.md:1) - API endpoint documentation

## 🚀 Getting Started

### 1. Set Up the Server

```bash
# Navigate to server directory
cd server

# Install dependencies
bun install

# Generate VAPID keys
npx web-push generate-vapid-keys

# Create environment file
cp .env.local.example .env.local
# Edit .env.local with your credentials

# Start development server
bun dev
```

### 2. Set Up the Database

1. Create a project at [supabase.com](https://supabase.com/)
2. Navigate to SQL Editor
3. Run the schema from [`server/lib/schema.sql`](server/lib/schema.sql:1)
4. Get your Supabase credentials from Settings → API

### 3. Configure the Python Client

```bash
# Navigate to client directory
cd client

# Copy example configuration
cp config.json.example config.json

# Edit config.json with your settings
```

Configuration example:
```json
{
  "server_url": "https://your-server.com",
  "nickname": "테스트-장치-01",
  "secret": "your-per-nickname-secret",
  "package_name": "com.nexon.ma",
  "check_interval_seconds": 3
}
```

### 4. Start Monitoring

```bash
# Ensure ADB is installed and device is connected
adb devices

# Start the monitor
python monitor.py
```

## 🔑 Key Features Explained

### UTF-8 First Design

All text handling in Mapleting assumes UTF-8 encoding:
- Nicknames can be in any language (Korean, Japanese, Chinese, etc.)
- Database stores UTF-8 text natively
- API payloads are UTF-8 encoded JSON
- Push notifications display Unicode correctly

### State Transition Detection

The Python client monitors app state transitions:
- **Running → Stopped**: Triggers push notification to all subscribers
- **Stopped → Running**: Logged to console (no notification)
- **Continuous Monitoring**: Checks every N seconds (configurable)

### Push Notification Flow

```
1. Python Client detects: running → stopped
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

### Security Model

- **Per-Nickname Secrets**: Each monitored device has a unique secret
- **Bearer Token Authentication**: `Authorization: Bearer <secret>` header
- **Constant-Time Comparison**: Prevents timing attacks on secrets
- **Rate Limiting**: Per-nickname rate limiting on heartbeat endpoint
- **No User Auth Required**: Optional feature for future (OAuth)

## 📦 Project Structure

```
mapleting/
├── client/                          # Python monitoring agent
│   ├── monitor.py                   # Main monitoring script
│   ├── config.json                  # Client configuration (not in git)
│   ├── config.json.example          # Configuration template
│   ├── monitor.spec                 # PyInstaller spec
│   ├── package_list.txt             # Reference package list
│   └── README.md                    # Client documentation
│
├── server/                          # Next.js PWA server
│   ├── app/
│   │   ├── api/
│   │   │   ├── heartbeat/           # POST /api/heartbeat
│   │   │   ├── subscribe/           # POST /api/subscribe
│   │   │   └── unsubscribe/         # POST /api/unsubscribe
│   │   ├── n/[encodedNickname]/     # Nickname detail pages
│   │   ├── layout.tsx               # Root layout
│   │   └── page.tsx                 # Home page
│   ├── components/
│   │   └── subscription-button.tsx  # Push subscription UI
│   ├── lib/
│   │   ├── db.ts                    # Supabase client
│   │   ├── push-client.ts           # Web Push API client
│   │   ├── push.ts                  # Push utilities
│   │   ├── types.ts                 # TypeScript types
│   │   ├── url-utils.ts             # URL encoding utilities
│   │   ├── repositories/            # Data access layer
│   │   │   ├── nickname-repository.ts
│   │   │   └── subscription-repository.ts
│   │   └── schema.sql               # Database schema
│   ├── public/
│   │   ├── manifest.json            # PWA manifest
│   │   ├── sw.js                    # Service worker
│   │   └── icons/                   # PWA icons
│   ├── package.json
│   └── README.md                    # Server documentation
│
├── DEPLOYMENT.md                    # Deployment guide
└── README.md                        # This file
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - See LICENSE file for details

## 🔗 Links

- **Next.js**: [https://nextjs.org](https://nextjs.org)
- **Supabase**: [https://supabase.com](https://supabase.com)
- **Web Push API**: [https://developer.mozilla.org/en-US/docs/Web/API/Push_API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- **PWA**: [https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

---

**Built with ❤️ for cross-platform monitoring**