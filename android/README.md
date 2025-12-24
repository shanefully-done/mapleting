# MapleTing Monitor Android App

Native Android application for monitoring Android applications without requiring ADB setup.

## Features

- **No ADB Required**: Runs directly on the device being monitored
- **Simple Setup**: Configure everything within the app interface
- **Native Experience**: Built for Android with Material Design
- **Background Operation**: Works even when app is not in foreground
- **Low Battery Impact**: Efficient monitoring with minimal resource usage
- **UTF-8 Support**: Full Unicode support for nicknames (Korean, Japanese, Chinese, etc.)

## Requirements

- Android 7.0 (Nougat, API 24) or higher
- Active internet connection
- Server URL and access credentials

## Building

### Debug Build

```bash
cd android
./gradlew assembleDebug
```

Output: `app/build/outputs/apk/debug/app-debug.apk`

### Release Build

```bash
cd android
./gradlew assembleRelease
```

Output: `app/build/outputs/apk/release/app-release-1.0.0.apk`

## Installation

1. Install the APK on your Android device
2. Open the app
3. Enter your configuration:
   - **Nickname**: Your character name (supports UTF-8)
   - **Secret**: Your secret key for authentication
   - **Package Name**: The Android package to monitor (e.g., com.example.app)
4. (Optional) Disable battery optimization for reliable monitoring
5. Tap "Start Monitoring"

## Battery Optimization

Android's battery optimization may stop the monitoring service. For reliable operation:

1. Tap "Open Battery Settings" in the app
2. Select "Don't optimize" for MapleTing Monitor
3. Return to the app

## Architecture

- **MVVM Pattern**: Clean separation of concerns
- **Kotlin Coroutines**: Asynchronous operations
- **DataStore**: Modern configuration persistence
- **OkHttp**: Efficient HTTP client
- **ForegroundService**: Reliable background monitoring

## API Integration

The app sends heartbeats to the Next.js server in the same format as the Python client:

```json
{
	"nickname": "your-device-name",
	"status": "connected",
	"timestamp": 1734850000000
}
```

## Permissions

- **INTERNET**: Required for sending heartbeats
- **FOREGROUND_SERVICE**: Required for background monitoring
- **POST_NOTIFICATIONS**: Required for persistent notification (Android 13+)
- **PACKAGE_USAGE_STATS**: Optional, for better app detection

## Privacy

- No data is collected or shared beyond the heartbeat API
- All communication is encrypted via HTTPS
- Configuration is stored locally on the device

## License

See main project LICENSE file.
