# Project Context

## Current Work Focus

The project is in the **architecture and specification phase**. We are analyzing the existing Telegram-based Python monitoring client and designing a comprehensive Next.js PWA solution to replace Telegram notifications with cross-platform web push notifications.

## Project Status

### Completed
- ✅ Python monitoring client implemented with Telegram integration
- ✅ Client configuration system with JSON-based config
- ✅ ADB-based app status detection
- ✅ Heartbeat monitoring with state transition detection

### In Progress
- 🔄 Designing Next.js PWA server architecture
- 🔄 Defining API contracts between Python client and Next.js server
- 🔄 Planning migration strategy from Telegram to Web Push

### Next Steps
1. Implement Next.js server with API routes
2. Create heartbeat endpoint (`POST /api/heartbeat`)
3. Implement push subscription management
4. Build PWA manifest and service worker
5. Create subscription UI for users
6. Migrate Python client to use new API

## Recent Changes

### Current Implementation (Python Client)
- **File**: [`client/monitor.py`](client/monitor.py:1)
- **Functionality**: Monitors Android app status via ADB
- **Notification**: Sends Telegram messages on state transitions
- **Configuration**: JSON-based config file (`config.json`)

### Configuration Structure
```json
{
  "telegram_token": "...",
  "telegram_chat_id": "...",
  "nickname": "mekiuser",
  "package_name": "com.nexon.ma",
  "check_interval_seconds": 3
}
```

### Migration Requirements
The Python client will be modified to:
- Replace Telegram API calls with HTTP POST to `/api/heartbeat`
- Use per-nickname secret instead of bot token
- Include timestamp in heartbeat payload
- Handle authentication via `Authorization: Bearer <secret>` header

## Architecture Overview

The system consists of three main components:

1. **Python Client Agent** ([`client/`](client/))
   - Monitors Android app status via ADB
   - Sends heartbeat updates to server
   - Stateless, minimal dependencies

2. **Next.js Server** (to be implemented in [`server/`](server/))
   - Receives heartbeat from Python clients
   - Manages nickname entities and subscriptions
   - Sends push notifications via Web Push API

3. **PWA Frontend** (to be implemented in [`server/`](server/))
   - Users subscribe to nicknames
   - Receives push notifications
   - Displays device status

## Key Technical Decisions

- **UTF-8 First**: All text (especially nicknames) treated as UTF-8 throughout
- **Stateless Client**: Python agent has no persistent state
- **Push Over Polling**: Uses Web Push API instead of WebSockets
- **No User Auth**: Per-nickname secrets for client authentication (user auth can be added later)

## Data Flow

```
┌─────────────────┐
│  Python Client  │
│  (ADB Monitor)  │
└────────┬────────┘
         │ heartbeat (POST /api/heartbeat)
         │ Authorization: Bearer <secret>
         ↓
┌─────────────────┐
│  Next.js API    │
│  /api/heartbeat │
└────────┬────────┘
         │ State transition detected
         │ connected → disconnected
         ↓
┌─────────────────┐
│  Push Service   │
│  (web-push)     │
└────────┬────────┘
         │ Push notification
         ↓
┌─────────────────┐
│  User Devices   │
│  (PWA/Browser)  │
└─────────────────┘
```

## Development Environment

- **Client**: Python 3.x with ADB tools
- **Server**: Node.js with Next.js 15
- **Testing**: Android device/emulator with target app
- **Deployment**: Self-hosted or cloud platform

## Important Notes

- The server directory (`server/`) is currently empty and needs to be initialized
- The Python client is fully functional and will be modified for the new API
- All non-English nickname handling must be tested end-to-end
- Service worker must work across all target platforms