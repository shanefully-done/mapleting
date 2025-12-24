# Project Context

## Current Work Focus

The project is in the **architecture and specification phase**. We have completed the Next.js PWA server implementation and are now designing a native Android app to provide an alternative to the Python client for non-technical users who find ADB setup too complex.

**Two Client Options**:
1. **Python Client with ADB**: For technical users comfortable with command-line tools
2. **Android Native App**: For non-technical users requiring simple, no-setup monitoring

## Project Status

### Completed

- ✅ Python monitoring client implemented with Telegram integration
- ✅ Client configuration system with JSON-based config
- ✅ ADB-based app status detection
- ✅ Heartbeat monitoring with state transition detection

### In Progress

- 🔄 Designing Android app architecture and specification
- 🔄 Planning Android app integration with existing Next.js server
- 🔄 Documenting Android app requirements and technical constraints

### Next Steps

1. Implement Android app based on specification
2. Test Android app on various Android versions (7.0 - 14)
3. Verify heartbeat format matches Python client exactly
4. Test UTF-8 support for non-English nicknames
5. Test battery optimization handling
6. Test background service reliability

## Recent Changes

### Current Implementation (Python Client)

- **File**: [`client/mapleting.py`](client/mapleting.py:1)
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

The system consists of multiple components:

### Monitoring Options (Choose One)

1. **Python Client Agent** ([`client/`](client/)) - Technical Users

   - Monitors Android app status via ADB
   - Sends heartbeat updates to server
   - Stateless, minimal dependencies
   - Cross-platform (Windows, macOS, Linux)

2. **Android Native App** ([`android/`](android/)) - Non-Technical Users (To Be Implemented)

   - Monitors Android app status via native APIs
   - Runs directly on target device
   - No ADB setup required
   - Simple, intuitive UI

### Server & Frontend

3. **Next.js Server** ([`server/`](server/)) - Implemented

   - Receives heartbeat from Python clients or Android apps
   - Manages nickname entities and subscriptions
   - Sends push notifications via Web Push API

4. **PWA Frontend** ([`server/`](server/)) - Implemented

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
┌─────────────────────────┐
│  Python Client OR       │
│  Android App            │
│  (ADB or Native APIs)   │
└──────────┬──────────────┘
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

- **Python Client**: Python 3.x with ADB tools
- **Android App**: Android Studio with Kotlin
- **Server**: Node.js with Next.js 15
- **Testing**: Android device/emulator with target app
- **Deployment**: Self-hosted or cloud platform (Vercel)

## Important Notes

- The Next.js server has been implemented and is functional
- The PWA frontend is complete with push notification support
- The Python client is fully functional with heartbeat API integration
- Android app specification is complete, implementation pending
- All non-English nickname handling must be tested end-to-end for both clients
- Android app must send identical heartbeat format as Python client
- Service worker works across all target platforms
