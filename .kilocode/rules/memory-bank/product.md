# Product: Next.js PWA Monitoring & Notification System

## Purpose

This project provides a cross-platform monitoring and notification system that replaces Telegram-based alerts with modern web push notifications. The system enables users to monitor Android applications and receive real-time notifications when monitored applications transition from running to stopped/crashed state.

The system supports two monitoring approaches:
1. **Python Client with ADB**: For technical users comfortable with ADB setup
2. **Android Native App**: For non-technical users requiring simple setup (no ADB)

## Problems Solved

### Current Limitations (Telegram-based)
- **Platform dependency**: Requires Telegram app installation and account
- **Notification fragmentation**: Alerts trapped in Telegram app, not integrated with OS notification system
- **Limited platform support**: Doesn't support native push on iOS, desktop platforms
- **Localization issues**: Telegram message handling for non-English text inconsistent
- **Single point of failure**: Relies on Telegram API availability

### New Solution Benefits
- **Universal platform support**: Android, iOS 16.4+, Windows, macOS, Linux
- **Native notifications**: OS-integrated push notifications that work even when browser closed
- **Better Unicode support**: End-to-end UTF-8 support for non-English nicknames
- **No external dependencies**: Self-hosted, no third-party messaging service required
- **PWA installability**: Can be installed as native app on supported platforms
- **Android app option**: Native Android monitoring app requires no ADB setup, perfect for non-technical users

## Target Users

1. **Technical Users**: Python client with ADB for cross-platform monitoring
2. **Non-technical Android users**: Native Android app for simple, no-setup monitoring
3. **Android app developers/monitoring**: Need to track app crashes in real-time
4. **Game server operators**: Monitor mobile game instances for downtime
5. **Device managers**: Track application status across multiple devices
6. **Non-English users**: Full Unicode support for nicknames in Korean, Japanese, Chinese, etc.

## User Experience Goals

### For Python Client Operators (Technical Users)
- Simple configuration file with clear fields
- Minimal dependencies (only Python stdlib + ADB)
- Clear error messages for configuration issues
- Graceful handling of network failures
- Easy migration from Telegram to new system
- Cross-platform compatibility (Windows, macOS, Linux)

### For Android App Users (Non-Technical Users)
- **No ADB required**: Runs directly on the device being monitored
- **Simple setup**: Configure everything within the app interface
- **Native experience**: Built for Android with Material Design
- **Background operation**: Works even when app is not in foreground
- **Low battery impact**: Efficient monitoring with minimal resource usage
- **Persistent notification**: Always shows monitoring status
- **Battery optimization guidance**: Clear instructions to ensure reliable monitoring

### For PWA Users
- One-click installation as desktop/mobile app
- Simple nickname subscription flow
- Instant notifications regardless of app state (foreground/background/closed)
- Reliable notification delivery with retry logic
- Clear notification payload with device name and status

### Cross-Platform Consistency
- Identical notification format across all platforms
- Same subscription flow regardless of device
- Consistent behavior with browser restart
- Background notification delivery on all supported platforms

## Core Features

### Server & PWA Features
1. **Heartbeat API**: Receives status updates from Python clients or Android apps
2. **State Transition Detection**: Server detects running → stopped transitions
3. **Push Notification Delivery**: Web Push API to all subscribers
4. **Nickname Subscription**: Users subscribe to specific monitored entities
5. **Unicode-First Design**: Full UTF-8 support throughout the stack
6. **PWA Installability**: Install as native app on all supported platforms

### Android App Features
1. **Native monitoring**: Runs directly on Android device without ADB
2. **Foreground service**: Reliable background monitoring with persistent notification
3. **Simple UI**: Intuitive configuration interface for non-technical users
4. **Auto-detection**: Multiple methods to detect if target app is running
5. **Network resilience**: Graceful retry logic for network failures
6. **Battery optimization handling**: Guides users to disable optimization for reliable operation

## Migration Path from Telegram

The system provides a clear migration path for existing Python users:
- Telegram bot token → Per-nickname secret
- Chat ID → Push subscription (endpoint + keys)
- Message text → Push notification payload
- Same monitoring logic, different delivery mechanism

For new Android users:
- **No migration needed**: Start fresh with Android app
- **Same server**: Use existing Next.js server infrastructure
- **Identical API**: Android app sends same heartbeat format as Python client
- **Choose your client**: Use Python client (technical) OR Android app (non-technical)

## Success Metrics

### Server & PWA
- Notifications delivered within 5 seconds of heartbeat received
- 99.9% notification delivery success rate
- Support for nicknames in any language/script
- Zero Telegram dependency
- Works on all major platforms (Android, iOS, Windows, macOS, Linux)

### Android App
- No ADB setup required for monitoring
- Monitoring survives device sleep and screen-off states
- Battery optimization guidance clear and effective
- Simple setup completes in under 5 minutes
- Works reliably on Android 7.0+ devices