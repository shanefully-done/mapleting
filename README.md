# MapleTing

<div align="center">

**A cross-platform monitoring and notification system for Android applications**

[Features](#-key-features) • [Quick Start](#-quick-start)

</div>

---

## 📖 Overview

MapleTing is a comprehensive monitoring and notification system that enables real-time alerts for Android application state changes. It uses **Web Push API** for notification, delivering native OS notifications across all major platforms.

**Perfect for:** Game client monitoring, app crash detection, device status tracking, and any scenario where you need instant alerts when Android apps stop running.

### Why MapleTing?

- **🌍 Cross-Platform**: Works on Android, iOS 16.4+, Windows, macOS, and Linux
- **🔔 Native Notifications**: OS-integrated push that work even when browser/app is closed
- **🌐 Unicode-First**: Full UTF-8 support for non-English alias (Korean, Japanese, Chinese, etc.)
- **📦 PWA Installable**: Install as native app on any supported platform
- **📱 Native Android Monitoring App**: Kotlin-based app with AccessibilityService

---

## ✨ Key Features

- ✅ **PWA Experience**: Install as native app
- ✅ **Background Notifications**: Receive alerts when app is closed
- ✅ **Simple Subscription**: One-click subscription to device updates
- ✅ **Unicode Support**: Device names in any language

---

## 🚀 Quick Start

### Prerequisites

- **Server**: Node.js 18.17+, Bun package manager, Supabase account
- **Client**: Android device or emulator (Android 7.0+)

### 1. Deploy the Server

```bash
# Navigate to server directory
cd server

# Install dependencies
bun install

# Generate VAPID keys for Web Push
bunx web-push generate-vapid-keys

# Set up environment (see full docs for details)
# Edit .env.local with your Supabase and VAPID credentials
cp .env.example .env.local

# Start development server
bun dev
```

### 2. Install the Android App

```bash
# Download APK from GitHub Releases
# Latest release: https://github.com/yourusername/mapleting/releases

# Install on Android device
adb install mapleting-monitor.apk
# Or transfer APK to device and install directly
```

**App Configuration:**

1. Open the Mapleting Monitor app
2. Configure your monitoring settings:
   - **Nickname**: Your device name (supports UTF-8: 한국어, 日本語, 中文)
   - **Secret**: Your unique authentication key
   - **Package Name**: Android app to monitor (e.g., com.nexon.ma)
   - **Server URL**: Next.js server address (pre-configured)

3. Enable Accessibility Service:
   - Go to Settings → Accessibility → Mapleting Monitor
   - Enable the service to allow app state detection

4. Start Monitoring:
   - Tap "Start Monitoring" button
   - Grant necessary permissions when prompted
   - Disable battery optimization for reliable background operation

**Important:** You must register your nickname and secret with your server administrator before starting monitoring.

### 3. Subscribe to Notifications

1. Open your deployed server URL in a browser
2. Click "Subscribe" for your device alias
3. Allow push notifications when prompted
4. You'll receive alerts when the app stops running!

---

## 🛠️ Technology Stack

### Server (Next.js PWA)

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: Supabase Postgres
- **Push Notifications**: Web Push API with VAPID
- **UI**: Tailwind CSS + shadcn/ui components
- **PWA**: Service Worker + Web Manifest

### Client (Android Native App)

- **Language**: Kotlin 100%
- **Min SDK**: Android 7.0 (API 24)
- **Target SDK**: Android 14 (API 34)
- **Architecture**: MVVM with Coroutines
- **Key Components**:
  - AccessibilityService for real-time app state detection
  - ForegroundService for reliable background monitoring
  - Material Design UI with shadcn-inspired components
- **Data Storage**: DataStore (modern SharedPreferences)
- **Networking**: OkHttp for HTTPS heartbeats
- **Background**: Persistent notification showing monitoring status

### Infrastructure

- **Hosting**: Vercel (recommended) or self-hosted
- **Database**: Supabase (free tier works)
- **SSL/TLS**: Required for Web Push API

---

## 🎯 Use Cases

- **Game Client Monitoring**: Track mobile game instances for downtime
- **App Crash Detection**: Get notified when apps crash or stop unexpectedly
- **Device Status Tracking**: Monitor application status across multiple devices
- **Service Availability**: Ensure critical services are running 24/7
- **Non-English Environments**: Full support for Korean, Japanese, Chinese, and other languages

---

## 🚀 Deployment Options

### Vercel (Recommended)

One-click deployment with automatic SSL, CDN, and scaling:

```bash
cd server
vercel
```

**Advantages:**

- Zero configuration
- Automatic HTTPS
- Global CDN
- Free tier available
- Perfect for Next.js

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Areas for Contribution

- Additional language support
- Enhanced PWA features
- Performance optimizations
- Documentation improvements
- Bug fixes

---

## 🔗 Links & Resources

- **Next.js**: [https://nextjs.org](https://nextjs.org)
- **Supabase**: [https://supabase.com](https://supabase.com)
- **Web Push API**: [MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- **PWA**: [MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- **Vercel**: [https://vercel.com](https://vercel.com)
