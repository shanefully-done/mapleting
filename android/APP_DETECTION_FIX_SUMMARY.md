# Android App Detection Fix - Summary

## Problem
The Android monitoring app was incorrectly detecting the target app (com.nexon.ma) as "stopped" even when it was running in the foreground or background.

## Root Cause Analysis

The original `AppStatusDetector` had several critical issues:

1. **Insufficient Permission Checks**: The code tried UsageStatsManager but didn't properly log permission status
2. **Inadequate Process Detection**: Only checked `processName` which often doesn't match the package name
3. **No Fallback Methods**: Only had 2 detection methods, both could fail
4. **Minimal Logging**: Impossible to debug why detection was failing
5. **Time Window Too Narrow**: UsageStatsManager only checked last 10 seconds

## Changes Implemented

### 1. Added Tap-to-Copy Logs (MainActivity.kt)

**Location**: `MainActivity.kt` lines 103-118

**Changes**:
- Added click listener to logs TextView
- Copies all log text to clipboard when tapped
- Shows "Logs copied to clipboard" toast message
- Makes debugging much easier for users

```kotlin
binding.logsTextView.setOnClickListener {
    copyLogsToClipboard()
}
```

### 2. Completely Rewrote AppStatusDetector

**File**: `AppStatusDetector.kt` (completely rewritten, 295 lines)

#### Key Improvements:

**A. Pre-Flight Validation**
- Checks if package is installed first
- Logs clear warning if package not found

**B. Three Detection Methods (in priority order)**

1. **Method 1: UsageStatsManager** (Most accurate)
   - Requires PACKAGE_USAGE_STATS permission
   - Checks last 30 seconds (increased from 10s)
   - Detailed logging of permission status
   - Shows number of usage entries found
   - Shows time since last use

2. **Method 2: ActivityManager with pkgList Check** (Main fix)
   - **CRITICAL FIX**: Now checks `processInfo.pkgList` instead of just `processName`
   - This is the key improvement that fixes the detection issue
   - The `pkgList` array contains all packages associated with a process
   - Checks process importance to distinguish active from cached processes
   - Logs all running processes for debugging
   - Shows first 5 process names when not found

3. **Method 3: Running Services Check** (New fallback)
   - Additional method to detect apps with background services
   - Lists all services found for the target package
   - Useful for apps that run as services

**C. Comprehensive Logging**

Every detection attempt now logs:
- ✅ Success with method used
- ⚠️ Warnings about missing permissions or issues
- ℹ️ Informational messages about what was checked
- ❌ Errors with full stack traces
- Detailed process information (importance, package list)

Example log output:
```
=================================================
Starting app detection for: com.nexon.ma
=================================================
✓ Package com.nexon.ma is installed
Method 1: Checking UsageStatsManager permission...
⚠️  UsageStatsManager permission NOT GRANTED
   User must grant PACKAGE_USAGE_STATS permission in Settings
Method 2: Checking ActivityManager.getRunningAppProcesses()...
   Found 156 running processes
   ✓ Found package in process: com.nexon.ma
     Importance: FOREGROUND
     Package list: com.nexon.ma
   ✓ Process is ACTIVE (not cached)
✅ SUCCESS: App detected via ActivityManager
=================================================
```

### 3. Detection Logic Improvements

**Process Importance Checking**:
```kotlin
val importanceName = when (importance) {
    IMPORTANCE_FOREGROUND -> "FOREGROUND"
    IMPORTANCE_FOREGROUND_SERVICE -> "FOREGROUND_SERVICE"
    IMPORTANCE_VISIBLE -> "VISIBLE"
    IMPORTANCE_SERVICE -> "SERVICE"
    IMPORTANCE_BACKGROUND -> "BACKGROUND"
    IMPORTANCE_CACHED -> "CACHED"
    else -> "OTHER($importance)"
}

// Consider it running if importance < IMPORTANCE_CACHED
val isRunning = importance < ActivityManager.RunningAppProcessInfo.IMPORTANCE_CACHED
```

**Package List Checking** (The Critical Fix):
```kotlin
// OLD CODE (BROKEN):
runningProcesses.any { it.processName == packageName }

// NEW CODE (WORKING):
for (processInfo in runningProcesses) {
    if (processInfo.pkgList.contains(packageName)) {
        // Check importance and return true if active
    }
}
```

## Why This Fixes the Issue

The key problem was that `processName` often doesn't equal the package name. For example:
- Package name: `com.nexon.ma`
- Process name might be: `com.nexon.ma:game` or `com.nexon.ma:service`

The old code only checked `processName == packageName`, which would fail.

The new code checks `pkgList.contains(packageName)`, which correctly finds the package even if the process has a suffix or different naming scheme.

## How to Test

1. Install the new APK on your Android device
2. Open the Mapleting Monitor app
3. Configure with:
   - Nickname: your device name
   - Package: `com.nexon.ma` (or your target app)
   - Server: your server URL
4. Start monitoring
5. Open your target app (com.nexon.ma) and keep it running
6. Tap on the logs area in Mapleting Monitor
7. Paste the logs somewhere to see the detailed detection output

## Expected Log Output (When App is Running)

```
[INFO] MonitoringService created
[INFO] Starting monitoring loop - Check interval: 60000ms
=================================================
Starting app detection for: com.nexon.ma
=================================================
✓ Package com.nexon.ma is installed
Method 1: Checking UsageStatsManager permission...
⚠️  UsageStatsManager permission NOT GRANTED
   User must grant PACKAGE_USAGE_STATS permission in Settings
Method 2: Checking ActivityManager.getRunningAppProcesses()...
   Found 156 running processes
   ✓ Found package in process: com.nexon.ma
     Importance: FOREGROUND
     Package list: com.nexon.ma
   ✓ Process is ACTIVE (not cached)
✅ SUCCESS: App detected via ActivityManager
=================================================
[INFO] Process check: com.nexon.ma = running
```

## Optional: Grant UsageStats Permission for Better Accuracy

For even more reliable detection, grant PACKAGE_USAGE_STATS permission:

1. Go to Settings → Apps → Mapleting Monitor
2. Permissions → Special access → Usage access
3. Grant permission

This enables Method 1 (UsageStatsManager) which is the most accurate detection method.

## Files Modified

1. **MainActivity.kt**
   - Added tap-to-copy logs functionality
   - Lines added: 103-118

2. **AppStatusDetector.kt**
   - Complete rewrite (295 lines)
   - Added comprehensive logging
   - Added pkgList checking (critical fix)
   - Added running services check (new method)
   - Added package installation validation
   - Increased UsageStats time window to 30 seconds

## Build Status

✅ **BUILD SUCCESSFUL**

APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

## Next Steps

1. Install the APK on your device
2. Test with com.nexon.ma running
3. Check the logs to verify detection is working
4. If still failing, tap on logs and share the output for further debugging

The comprehensive logging will now show exactly what's happening during app detection, making it much easier to diagnose any remaining issues.