#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Starting Android Debug Build..."

# 1. Build the APK
# Using -p to ensure we point to the correct directory
./gradlew assembleDebug

echo "✅ Build Successful. Looking for device..."

# 2. Check if adb can see a device
if ! adb get-state 1>/dev/null 2>&1; then
    echo "❌ Error: No device/emulator found. Connect a device and try again."
    exit 1
fi

# 3. Install the APK
echo "📲 Installing APK to device..."
adb install ./app/build/outputs/apk/debug/app-debug.apk

echo "🎉 Done! The app should be openable on your device."
