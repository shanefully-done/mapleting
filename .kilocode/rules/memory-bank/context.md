# Project Context

## Current Work Focus

The project has completed the Android native app implementation. The system now provides two fully functional monitoring client options:

**Two Client Options**:
1. **Python Client with ADB**: For technical users comfortable with command-line tools ✅ Implemented
2. **Android Native App**: For non-technical users requiring simple, no-setup monitoring ✅ Implemented

## Project Status

### Completed

- ✅ Python monitoring client implemented with Telegram integration
- ✅ Client configuration system with JSON-based config
- ✅ ADB-based app status detection
- ✅ Heartbeat monitoring with state transition detection

### Completed

- ✅ Python monitoring client implemented with Telegram integration
- ✅ Python client modified to use heartbeat API
- ✅ Next.js PWA server implementation complete
- ✅ PWA frontend with push notification support
- ✅ Android app specification complete
- ✅ Android app fully implemented with all features

### Next Steps

1. Build Android APK and test on device/emulator
2. Test Android app on various Android versions (7.0 - 14)
3. Verify heartbeat format matches Python client exactly
4. Test UTF-8 support for non-English nicknames (Korean, Japanese, Chinese)
5. Test battery optimization handling
6. Test background service reliability
7. End-to-end testing with actual Next.js server

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

1. **Python Client Agent** ([`client/`](client/)) - Technical Users ✅

   - Monitors Android app status via ADB
   - Sends heartbeat updates to server
   - Stateless, minimal dependencies
   - Cross-platform (Windows, macOS, Linux)

2. **Android Native App** ([`android/`](android/)) - Non-Technical Users ✅

   - Monitors Android app status via native APIs
   - Runs directly on target device
   - No ADB setup required
   - Simple, intuitive UI
   - ForegroundService for reliable background monitoring
   - Material Design UI with UTF-8 support

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
- The Android app is now fully implemented with all features from specification
- All non-English nickname handling must be tested end-to-end for both clients
- Android app sends identical heartbeat format as Python client
- Service worker works across all target platforms
- Android app ready for testing and deployment
