# Android App Build Fixes

## Issue
The Android app initially failed to build due to missing launcher icons and Kotlin compilation errors.

## Fixes Applied

### 1. Missing Launcher Icons
**Error**: `resource mipmap/ic_launcher (aka com.mapleting.monitor:mipmap/ic_launcher) not found`

**Solution**: Created vector drawable launcher icons:
- `drawable/ic_launcher_foreground.xml` - Icon foreground with monitoring design
- `drawable/ic_launcher_background.xml` - Green background (#3DDC84)
- `drawable/ic_launcher.xml` - Simple launcher icon for older Android versions
- `mipmap-anydpi-v26/ic_launcher.xml` - Adaptive icon for API 26+
- `mipmap-anydpi-v26/ic_launcher_round.xml` - Adaptive round icon

**Manifest Change**: Updated `AndroidManifest.xml` to use `@drawable/ic_launcher` instead of `@mipmap/ic_launcher`

### 2. Vector Drawable Compatibility
**Error**: `attribute android:cx not found`, `attribute android:cy not found`, `attribute android:r not found`

**Solution**: Replaced `<circle>` element with equivalent `<path>` element in `ic_launcher_foreground.xml`:
```xml
<!-- Before (not supported) -->
<circle android:fillColor="#FFFFFF" android:cx="24" android:cy="24" android:r="3"/>

<!-- After (supported) -->
<path android:fillColor="#FFFFFF" android:pathData="M24,21c-1.66,0 -3,1.34 -3,3s1.34,3 3,3 3,-1.34 3,-3 -1.34,-3 -3,-3z"/>
```

### 3. Serializable Interface
**Error**: `None of the following functions can be called with the arguments supplied: putExtra(...)`

**Solution**: Made `MonitorConfig` implement `Serializable` interface:
```kotlin
data class MonitorConfig(...) : Serializable
```

This allows the config object to be passed via Intent extras to the MonitoringService.

### 4. Coroutine isActive Check
**Error**: `Unresolved reference: isActive`

**Solution**: Changed from `isActive` (coroutine context property) to `monitoringJob?.isActive`:
```kotlin
// Before
while (isActive) {

// After
while (monitoringJob?.isActive == true) {
```

## Build Status
✅ **BUILD SUCCESSFUL** - APK generated at `android/app/build/outputs/apk/debug/app-debug.apk` (6.5MB)

## Warnings (Non-Critical)
- Elvis operator warning in MainActivity.kt:193 (can be cleaned up)
- Deprecated `getRunningServices()` method (still functional)
- Deprecated `getSerializableExtra()` method (still functional)
- Unused variable 'nickname' in MonitoringService.kt:122 (can be cleaned up)

## Next Steps for Testing

1. Install APK on device/emulator:
   ```bash
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```

2. Configure the app with:
   - Nickname
   - Secret
   - Package name to monitor
   - Server URL

3. Test functionality:
   - Start monitoring service
   - Verify persistent notification appears
   - Check battery optimization handling
   - Test app state detection
   - Verify heartbeat delivery to server

## File Structure
```
android/app/src/main/res/
├── drawable/
│   ├── ic_launcher.xml
│   ├── ic_launcher_background.xml
│   └── ic_launcher_foreground.xml
├── mipmap-anydpi-v26/
│   ├── ic_launcher.xml
│   └── ic_launcher_round.xml
└── AndroidManifest.xml (updated)
```

## Build Commands

```bash
cd android

# Clean build
./gradlew clean

# Build debug APK
./gradlew assembleDebug

# Build release APK
./gradlew assembleRelease

# Install on connected device
adb install app/build/outputs/apk/debug/app-debug.apk

# View logs
adb logcat | grep "mapleting"