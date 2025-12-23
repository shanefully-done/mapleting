# Product: Next.js PWA Monitoring & Notification System

## Purpose

This project provides a cross-platform monitoring and notification system that replaces Telegram-based alerts with modern web push notifications. The system enables users to monitor Android applications and receive real-time notifications when monitored applications transition from running to stopped/crashed state.

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

## Target Users

1. **Android app developers/monitoring**: Need to track app crashes in real-time
2. **Game server operators**: Monitor mobile game instances for downtime
3. **Device managers**: Track application status across multiple devices
4. **Non-English users**: Full Unicode support for nicknames in Korean, Japanese, Chinese, etc.

## User Experience Goals

### For Python Client Operators
- Simple configuration file with clear fields
- Minimal dependencies (only Python stdlib + ADB)
- Clear error messages for configuration issues
- Graceful handling of network failures
- Easy migration from Telegram to new system

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

1. **Heartbeat API**: Python clients send periodic status updates
2. **State Transition Detection**: Server detects running → stopped transitions
3. **Push Notification Delivery**: Web Push API to all subscribers
4. **Nickname Subscription**: Users subscribe to specific monitored entities
5. **Unicode-First Design**: Full UTF-8 support throughout the stack
6. **PWA Installability**: Install as native app on all supported platforms

## Migration Path from Telegram

The system provides a clear migration path:
- Telegram bot token → Per-nickname secret
- Chat ID → Push subscription (endpoint + keys)
- Message text → Push notification payload
- Same monitoring logic, different delivery mechanism

## Success Metrics

- Notifications delivered within 5 seconds of heartbeat received
- 99.9% notification delivery success rate
- Support for nicknames in any language/script
- Zero Telegram dependency
- Works on all major platforms (Android, iOS, Windows, macOS, Linux)