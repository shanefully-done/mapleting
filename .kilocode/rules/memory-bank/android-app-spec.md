# Android App Specification: Mapleting Monitor

## App Overview

**Purpose**: Replace the Python monitoring client + ADB setup with a native Android application that performs the same monitoring functionality directly on Android devices.

**Target Users**: Non-technical Android users who need to monitor applications but find ADB setup too complex.

**Core Functionality**:
- Monitor specified Android application status
- Detect running → stopped transitions
- Send periodic heartbeats to Next.js server via HTTPS
- Run reliably in background with persistent notification
- Survive device sleep and screen-off states
- Simple, intuitive configuration UI

**User Benefits**:
- **No ADB required**: Runs directly on the device being monitored
- **Simple setup**: Configure everything within the app interface
- **Native experience**: Built for Android, follows Material Design guidelines
- **Background operation**: Works even when app is not in foreground
- **Low battery impact**: Efficient monitoring with minimal resource usage

## Architecture

### Application Components

```
┌─────────────────────────────────────────────────────────────┐
│                    MainActivity                              │
│  - Configuration UI (nickname, secret, package name)        │
│  - Start/Stop monitoring controls                           │
│  - Status indicator and battery optimization button         │
│  - Launch ForegroundService on start                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ startService()
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                 MonitoringService                            │
│  - ForegroundService with persistent notification           │
│  - Periodic app status checking (3-second interval)         │
│  - Network heartbeat to /api/heartbeat                      │
│  - Configuration validation                                 │
│  - Error handling and retry logic                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ├──────────────┬──────────────────────┐
                       │              │                      │
                       ↓              ↓                      ↓
              ┌─────────────┐ ┌──────────────┐    ┌──────────────┐
              │App Status   │ │Network      │    │Local Storage │
              │Detector     │ │Client       │    │(DataStore)   │
              │ActivityMgr/ │ │OkHttp       │    │Config        │
              │PkgManager   │ │HTTPS POST   │    │Persistence   │
              └─────────────┘ └──────────────┘    └──────────────┘
```

### Component Responsibilities

**MainActivity**:
- Display configuration form with input fields
- Validate configuration before starting service
- Start/stop MonitoringService
- Show current monitoring status
- Provide battery optimization settings button
- Display current configuration values

**MonitoringService (ForegroundService)**:
- Maintain persistent notification showing monitoring status
- Execute periodic app status checks every 3 seconds
- Detect app state transitions (running → stopped)
- Send heartbeat to Next.js server
- Handle network failures gracefully
- Survive app backgrounding and device sleep

**AppStatusDetector**:
- Check if target app is running using multiple methods
- Fallback logic for different Android versions
- Return boolean: app is running or not

**NetworkClient**:
- Send HTTPS POST requests to /api/heartbeat
- Include Authorization: Bearer <secret> header
- Handle UTF-8 encoding for nicknames
- Retry logic for network failures
- Timeout handling

**ConfigStorage**:
- Store configuration using DataStore (modern SharedPreferences replacement)
- Persist: nickname, secret, serverUrl, packageName, checkInterval
- Load configuration on app start
- Validate configuration completeness

## Technical Stack

### Core Technologies

**Language**: Kotlin (100% Kotlin, no Java)
- Modern, concise syntax
- Null safety
- Coroutines for asynchronous operations
- Extension functions for cleaner code

**Min SDK**: API 24 (Android 7.0 Nougat)
- Broad device compatibility (covers 99%+ of active devices)
- Supports JobScheduler for background work
- Sufficient for modern Android features

**Target SDK**: API 34 (Android 14)
- Latest Android features
- Foreground service permissions properly handled
- Privacy requirements met

**Architecture**: MVVM with Repository Pattern
- **View**: MainActivity with UI components
- **ViewModel**: MonitoringViewModel (holds UI state, business logic)
- **Repository**: ConfigRepository (data persistence)
- **Service**: MonitoringService (background monitoring)

### Key Dependencies

```gradle
// Core Android
implementation 'androidx.core:core-ktx:1.12.0'
implementation 'androidx.appcompat:appcompat:1.6.1'
implementation 'com.google.android.material:material:1.11.0'
implementation 'androidx.constraintlayout:constraintlayout:2.1.4'

// Lifecycle & ViewModel
implementation 'androidx.lifecycle:lifecycle-viewmodel-ktx:2.7.0'
implementation 'androidx.lifecycle:lifecycle-livedata-ktx:2.7.0'
implementation 'androidx.lifecycle:lifecycle-runtime-ktx:2.7.0'

// Coroutines
implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3'
implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3'

// DataStore (modern SharedPreferences)
implementation 'androidx.datastore:datastore-preferences:1.0.0'

// Networking
implementation 'com.squareup.okhttp3:okhttp:4.12.0'
implementation 'com.squareup.okhttp3:logging-interceptor:4.12.0'

// JSON parsing
implementation 'com.google.code.gson:gson:2.10.1'

// WorkManager (optional, for scheduled tasks)
implementation 'androidx.work:work-runtime-ktx:2.9.0'
```

### Build Configuration

**Gradle Setup**:
```gradle
android {
    compileSdk 34
    
    defaultConfig {
        applicationId "com.mapleting.monitor"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0.0"
        
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }
    
    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
    
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
    
    kotlinOptions {
        jvmTarget = '1.8'
    }
    
    buildFeatures {
        viewBinding true
    }
}
```

## Data Models

### Configuration Data Class

```kotlin
data class MonitorConfig(
    val nickname: String,           // UTF-8 encoded, user-facing identifier
    val secret: String,             // Per-nickname secret for authentication
    val serverUrl: String,          // Next.js server URL (e.g., https://server.com)
    val packageName: String,        // Android package name to monitor (e.g., com.example.app)
    val checkInterval: Long = 3000  // Check interval in milliseconds (default: 3 seconds)
)
```

**Validation Rules**:
- `nickname`: Non-empty string, any UTF-8 characters supported
- `secret`: Non-empty string, typically UUID or random string
- `serverUrl`: Valid HTTPS URL
- `packageName`: Valid Android package name format (com.example.app)
- `checkInterval`: Positive integer, minimum 1000ms (1 second)

### Heartbeat Request Model

```kotlin
data class HeartbeatRequest(
    val nickname: String,           // UTF-8 encoded nickname
    val status: String,             // "connected" or "disconnected"
    val timestamp: Long             // Unix timestamp in milliseconds
)
```

**Critical Requirements**:
- MUST send IDENTICAL payload format as Python client
- UTF-8 encoding for nickname field
- Timestamp in milliseconds (System.currentTimeMillis())
- Status exactly "connected" or "disconnected"

### Heartbeat Response Model

```kotlin
sealed class HeartbeatResult {
    object Success : HeartbeatResult()
    data class Error(val message: String, val code: Int) : HeartbeatResult()
}
```

## UI Requirements

### MainActivity Layout

```
┌─────────────────────────────────────────┐
│         Mapleting Monitor               │
│                                         │
│  Configuration                          │
│  ┌─────────────────────────────────┐   │
│  │ Nickname                        │   │
│  │ [_____________________________] │   │
│  │ Your device name               │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Secret                          │   │
│  │ [_____________________________] │   │
│  ••••••••••••••••••••••••••••     │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Package Name                    │   │
│  │ [_____________________________] │   │
│  │ com.example.app                │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Status: ● Stopped                     │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │       [Start Monitoring]        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Battery Optimization: Not Disabled    │
│  [Open Settings]                        │
│                                         │
│  Current Config:                        │
│  • Nickname: My Device                  │
│  • Package: com.example.app             │
│  • Server: https://server.com           │
└─────────────────────────────────────────┘
```

### UI Components

**Input Fields**:
1. **Nickname** (TextInputEditText)
   - User-editable text field
   - Hint: "Your device name"
   - Supports UTF-8 input (Korean, Japanese, Chinese, etc.)
   - Single-line input

2. **Secret** (TextInputEditText with password input)
   - User-editable text field
   - Password toggle visibility
   - Auto-generated or manually entered
   - Single-line input

3. **Package Name** (TextInputEditText)
   - User-editable text field
   - Hint: "com.example.app"
   - Validates package name format
   - Auto-fill suggestions from installed apps

4. **Server URL** (TextInputEditText - hidden from basic UI)
   - Advanced setting (show via menu or advanced mode toggle)
   - Default: Hardcoded or from build config
   - Validated as HTTPS URL

5. **Check Interval** (TextInputEditText - hidden from basic UI)
   - Advanced setting
   - Default: 3000ms (hardcoded)
   - Minimum: 1000ms

**Controls**:
- **Start/Stop Button**: Toggle monitoring service
- **Battery Optimization Button**: Open system settings
- **Clear Config Button**: Reset all configuration

**Status Display**:
- **Current Status**: "● Monitoring" or "● Stopped"
- **Last Heartbeat**: Timestamp of last successful heartbeat
- **App Status**: "Running" or "Stopped"

## Foreground Service Requirements

### Service Implementation

**Service Type**: `androidx.work.ForegroundService` (modern approach)

**Persistent Notification**:
```
┌─────────────────────────────────┐
│ 🟢 Mapleting Monitor            │
│ Monitoring: com.example.app     │
│ Last heartbeat: Just now        │
└─────────────────────────────────┘
```

**Notification Channels**:
- **Primary Channel**: "Monitoring Service"
  - Importance: HIGH
  - Show badge: Yes
  - Vibration: No (to save battery)
  - Sound: No

**Service Lifecycle**:
1. MainActivity calls `startService()` with configuration
2. Service creates notification channel (API 26+)
3. Service starts foreground with notification
4. Service begins periodic app status checks
5. Service survives app backgrounding
6. Service stops only when explicitly stopped by user

**Periodic Task Execution**:

```kotlin
class MonitoringService : Service() {
    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    private var monitoringJob: Job? = null
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Start foreground with notification
        startForeground(NOTIFICATION_ID, createNotification())
        
        // Start monitoring loop
        monitoringJob = serviceScope.launch {
            while (isActive) {
                try {
                    checkAppStatusAndSendHeartbeat()
                    delay(checkInterval) // Default 3000ms
                } catch (e: Exception) {
                    Log.e(TAG, "Monitoring error", e)
                    // Continue monitoring despite errors
                }
            }
        }
        
        return START_STICKY // Restart if killed by system
    }
    
    override fun onDestroy() {
        monitoringJob?.cancel()
        super.onDestroy()
    }
}
```

**Service Survival**:
- **START_STICKY**: Restart if killed by system
- **Foreground**: Prevents system from killing under normal conditions
- **Wake Lock**: Optional (if needed for sleep state)
- **Partial Wake Lock**: Keep CPU running during checks

## Battery Optimization Handling

### Problem

Android's battery optimization kills background services to save power, which would stop monitoring.

### Solution: User-Guided Disabling

**Detection**:

```kotlin
fun isBatteryOptimizationEnabled(context: Context): Boolean {
    val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
    return !powerManager.isIgnoringBatteryOptimizations(context.packageName)
}
```

**UI Feedback**:
- Show warning if battery optimization is enabled
- Display button: "Disable Battery Optimization"
- Explain why: "Required to prevent monitoring from being stopped by the system"

**Open Settings**:

```kotlin
fun openBatteryOptimizationSettings(context: Context) {
    val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
        data = Uri.parse("package:${context.packageName}")
    }
    context.startActivity(intent)
}
```

**User Guidance**:
1. User taps "Open Settings" button
2. System battery optimization settings open
3. User selects "Don't optimize" for Mapleting Monitor
4. User returns to app
5. App re-checks and confirms optimization is disabled

**Fallback**:
- If user refuses to disable, warn that monitoring may be unreliable
- Show notification: "Battery optimization may stop monitoring"
- Allow user to proceed with monitoring (their choice)

## App State Detection

### Detection Methods

#### Method 1: ActivityManager (API 1+)

**Pros**: Works on all Android versions
**Cons**: Deprecated in API 21, requires permission

```kotlin
fun isAppRunningActivityManager(packageName: String): Boolean {
    val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
    val runningProcesses = activityManager.runningAppProcesses ?: return false
    
    return runningProcesses.any { it.processName == packageName }
}
```

**Required Permission**: `<uses-permission android:name="android.permission.GET_TASKS" />`

#### Method 2: UsageStatsManager (API 21+)

**Pros**: More accurate, works with proper permission
**Cons**: Requires user-granted permission

```kotlin
fun isAppRunningUsageStats(packageName: String): Boolean {
    val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
    val currentTime = System.currentTimeMillis()
    val stats = usageStatsManager.queryUsageStats(
        UsageStatsManager.INTERVAL_DAILY,
        currentTime - 1000 * 10, // Last 10 seconds
        currentTime
    )
    
    return stats?.any { it.packageName == packageName && it.lastTimeUsed >= currentTime - 1000 * 10 } ?: false
}
```

**Required Permission**: `android.permission.PACKAGE_USAGE_STATS` (special permission, must be granted by user in settings)

#### Method 3: PackageManager with ApplicationInfo (Simple Check)

**Pros**: No special permissions, checks if app is installed
**Cons**: Doesn't detect if app is currently running

```kotlin
fun isAppInstalled(packageName: String): Boolean {
    return try {
        context.packageManager.getPackageInfo(packageName, 0)
        true
    } catch (e: PackageManager.NameNotFoundException) {
        false
    }
}
```

### Recommended Approach: Fallback Chain

```kotlin
class AppStatusDetector(private val context: Context) {
    
    fun isAppRunning(packageName: String): Boolean {
        // Try UsageStatsManager first (most accurate)
        if (hasUsageStatsPermission()) {
            return isAppRunningUsageStats(packageName)
        }
        
        // Fallback to ActivityManager
        return isAppRunningActivityManager(packageName)
    }
    
    private fun hasUsageStatsPermission(): Boolean {
        val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = appOps.checkOpNoThrow(
            AppOpsManager.OPSTR_GET_USAGE_STATS,
            Process.myUid(),
            context.packageName
        )
        return mode == AppOpsManager.MODE_ALLOWED
    }
}
```

### State Transition Detection

```kotlin
class MonitoringService : Service() {
    private var lastAppStatus: Boolean? = null
    
    private fun checkAppStatusAndSendHeartbeat() {
        val isRunning = appStatusDetector.isAppRunning(config.packageName)
        
        // Detect state transition
        if (lastAppStatus != null && lastAppStatus != isRunning) {
            // Transition detected: running -> stopped OR stopped -> running
            val status = if (isRunning) "connected" else "disconnected"
            sendHeartbeat(status)
        }
        
        lastAppStatus = isRunning
    }
}
```

## API Integration

### Network Client Implementation

```kotlin
class HeartbeatClient(
    private val config: MonitorConfig,
    private val client: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .writeTimeout(10, TimeUnit.SECONDS)
        .build()
) {
    suspend fun sendHeartbeat(status: String): HeartbeatResult = withContext(Dispatchers.IO) {
        val requestBody = HeartbeatRequest(
            nickname = config.nickname,
            status = status,
            timestamp = System.currentTimeMillis()
        )
        
        val mediaType = "application/json; charset=utf-8".toMediaType()
        val jsonBody = Gson().toJson(requestBody)
        
        val request = Request.Builder()
            .url("${config.serverUrl}/api/heartbeat")
            .addHeader("Authorization", "Bearer ${config.secret}")
            .addHeader("Content-Type", "application/json; charset=utf-8")
            .post(jsonBody.toRequestBody(mediaType))
            .build()
        
        try {
            val response = client.newCall(request).execute()
            
            when (response.code) {
                200 -> HeartbeatResult.Success
                401 -> HeartbeatResult.Error("Invalid secret", 401)
                404 -> HeartbeatResult.Error("Nickname not found", 404)
                else -> HeartbeatResult.Error("Server error: ${response.code}", response.code)
            }
        } catch (e: Exception) {
            HeartbeatResult.Error("Network error: ${e.message}", 0)
        }
    }
}
```

### UTF-8 Encoding

**Critical**: Ensure UTF-8 encoding for nicknames throughout

```kotlin
// OkHttp handles UTF-8 encoding automatically
// But we must ensure Content-Type header specifies charset
.addHeader("Content-Type", "application/json; charset=utf-8")
```

**Testing UTF-8**:
```kotlin
// Test with various Unicode nicknames
val testNicknames = listOf(
    "테스트-장치-01",  // Korean
    "テスト-装置-01",   // Japanese
    "测试-设备-01",    // Chinese
    "Device-01"        // ASCII
)
```

### Error Handling

**Retry Logic**:

```kotlin
suspend fun sendHeartbeatWithRetry(status: String, maxRetries: Int = 3): HeartbeatResult {
    repeat(maxRetries) { attempt ->
        val result = sendHeartbeat(status)
        
        if (result is HeartbeatResult.Success) {
            return result
        }
        
        // Exponential backoff
        if (attempt < maxRetries - 1) {
            delay(1000L * (attempt + 1)) // 1s, 2s, 3s
        }
    }
    
    return HeartbeatResult.Error("Max retries exceeded", 0)
}
```

**Logging**:
- Log all network requests (without secrets)
- Log errors with context
- Never log secrets or sensitive data

## Configuration Storage

### DataStore Implementation

**Modern replacement for SharedPreferences**

```kotlin
class ConfigRepository(private val context: Context) {
    
    private val Context.dataStore: DataStore<Preferences> by preferencesDataStore("monitor_config")
    
    companion object {
        val NICKNAME_KEY = stringPreferencesKey("nickname")
        val SECRET_KEY = stringPreferencesKey("secret")
        val SERVER_URL_KEY = stringPreferencesKey("server_url")
        val PACKAGE_NAME_KEY = stringPreferencesKey("package_name")
        val CHECK_INTERVAL_KEY = longPreferencesKey("check_interval")
    }
    
    suspend fun saveConfig(config: MonitorConfig) {
        context.dataStore.edit { preferences ->
            preferences[NICKNAME_KEY] = config.nickname
            preferences[SECRET_KEY] = config.secret
            preferences[SERVER_URL_KEY] = config.serverUrl
            preferences[PACKAGE_NAME_KEY] = config.packageName
            preferences[CHECK_INTERVAL_KEY] = config.checkInterval
        }
    }
    
    suspend fun loadConfig(): MonitorConfig? {
        val preferences = context.dataStore.data.first()
        
        val nickname = preferences[NICKNAME_KEY]
        val secret = preferences[SECRET_KEY]
        val serverUrl = preferences[SERVER_URL_KEY]
        val packageName = preferences[PACKAGE_NAME_KEY]
        val checkInterval = preferences[CHECK_INTERVAL_KEY] ?: 3000
        
        return if (nickname != null && secret != null && serverUrl != null && packageName != null) {
            MonitorConfig(nickname, secret, serverUrl, packageName, checkInterval)
        } else {
            null
        }
    }
    
    suspend fun clearConfig() {
        context.dataStore.edit { preferences ->
            preferences.clear()
        }
    }
}
```

### Configuration Validation

```kotlin
fun validateConfig(config: MonitorConfig): ConfigValidation {
    return when {
        config.nickname.isBlank() -> ConfigValidation.Error("Nickname cannot be empty")
        config.secret.isBlank() -> ConfigValidation.Error("Secret cannot be empty")
        !isValidUrl(config.serverUrl) -> ConfigValidation.Error("Invalid server URL")
        !isValidPackageName(config.packageName) -> ConfigValidation.Error("Invalid package name")
        config.checkInterval < 1000 -> ConfigValidation.Error("Check interval must be at least 1 second")
        else -> ConfigValidation.Valid
    }
}

sealed class ConfigValidation {
    object Valid : ConfigValidation()
    data class Error(val message: String) : ConfigValidation()
}
```

## Permissions Required

### AndroidManifest.xml

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.mapleting.monitor">

    <!-- Required permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    
    <!-- Android 14+ (API 34) -->
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />
    
    <!-- Android 13+ (API 33) -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    
    <!-- Optional permissions (for better app detection) -->
    <uses-permission android:name="android.permission.GET_TASKS" />
    <uses-permission android:name="android.permission.PACKAGE_USAGE_STATS"
        tools:ignore="ProtectedPermissions" />
    
    <!-- Optional (battery optimization) -->
    <uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.MapletingMonitor">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:theme="@style/Theme.MapletingMonitor">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
        
        <service
            android:name=".MonitoringService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="specialUse">
            <property
                android:name="android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE"
                android:value="monitoring" />
        </service>
    </application>
</manifest>
```

### Runtime Permission Handling

**POST_NOTIFICATIONS (Android 13+)**:

```kotlin
class MainActivity : AppCompatActivity() {
    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted: Boolean ->
        if (isGranted) {
            // Permission granted
        } else {
            // Explain why permission is needed
            showNotificationPermissionDialog()
        }
    }
    
    private fun checkNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
                requestPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
    }
}
```

## Build Configuration

### Release Build Signing

```gradle
android {
    signingConfigs {
        release {
            // Use environment variables or keystore.properties file
            storeFile file(findProperty("RELEASE_STORE_FILE") ?: "keystore.jks")
            storePassword findProperty("RELEASE_STORE_PASSWORD")
            keyAlias findProperty("RELEASE_KEY_ALIAS")
            keyPassword findProperty("RELEASE_KEY_PASSWORD")
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### ProGuard Rules

```proguard
# Keep data classes
-keep class com.mapleting.monitor.data.** { *; }

# Keep Kotlin coroutines
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}

# Keep OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }

# Keep Gson
-keepattributes Signature
-keepattributes *Annotation*
-dontwarn sun.misc.**
-keep class com.google.gson.** { *; }
-keep class * implements com.google.gson.TypeAdapter
-keep class * implements com.google.gson.TypeAdapterFactory
-keep class * implements com.google.gson.JsonSerializer
-keep class * implements com.google.gson.JsonDeserializer

# Keep DataStore
-keep class androidx.datastore.** { *; }
```

### Version Naming

```gradle
android {
    defaultConfig {
        versionCode 1        // Increment for each release
        versionName "1.0.0"  // Semantic versioning
    }
}
```

**Version Strategy**:
- **Major**: Breaking changes, major features
- **Minor**: New features, UI improvements
- **Patch**: Bug fixes, minor improvements

## Testing Strategy

### Unit Tests

**AppStatusDetector Tests**:
```kotlin
class AppStatusDetectorTest {
    @Test
    fun `isAppRunning returns true when app is in usage stats`() {
        // Mock UsageStatsManager
        // Test detection logic
    }
    
    @Test
    fun `isAppRunning falls back to ActivityManager when permission denied`() {
        // Test fallback logic
    }
}
```

**NetworkClient Tests**:
```kotlin
class HeartbeatClientTest {
    @Test
    fun `sendHeartbeat sends correct payload format`() {
        // Mock OkHttp client
        // Verify request body format matches Python client
    }
    
    @Test
    fun `sendHeartbeat handles UTF-8 nicknames correctly`() {
        // Test with Korean, Japanese, Chinese nicknames
    }
    
    @Test
    fun `sendHeartbeat retries on network failure`() {
        // Test retry logic
    }
}
```

### Integration Tests

**End-to-End Monitoring Flow**:
```kotlin
class MonitoringFlowTest {
    @Test
    fun `monitoring flow detects app transition and sends heartbeat`() {
        // Start service
        // Simulate app start
        // Simulate app stop
        // Verify heartbeat sent
    }
}
```

### Manual Testing

**Pre-Release Checklist**:
- [ ] Install on Android 7.0 (API 24)
- [ ] Install on Android 14 (API 34)
- [ ] Test with Korean nickname
- [ ] Test with Japanese nickname
- [ ] Test with Chinese nickname
- [ ] Test monitoring with screen off
- [ ] Test monitoring with device in airplane mode (reconnect)
- [ ] Test battery optimization warning
- [ ] Test service survival after swiping app from recents
- [ ] Test heartbeat delivery to actual server

## Deployment

### APK Distribution

**Debug Build**:
```bash
./gradlew assembleDebug
# Output: app/build/outputs/apk/debug/app-debug.apk
```

**Release Build**:
```bash
./gradlew assembleRelease
# Output: app/build/outputs/apk/release/app-release-1.0.0.apk
```

### Distribution Methods

**Direct Download**:
- Host APK on project website or GitHub Releases
- User downloads and installs (requires "Unknown Sources" permission)

**Google Play Store**:
- Create developer account ($25 one-time fee)
- Submit app for review
- Meets all Play Store policies:
  - No dangerous permissions without justification
  - Foreground service has clear purpose
  - Privacy policy required
  - Content rating

**F-Droid (Open Source)**:
- Requires app to be open source (AGPL-3.0 or compatible)
- Free to publish
- Target audience: Privacy-conscious users

**Alternative Stores**:
- Amazon Appstore
- Galaxy Store (Samsung)
- Huawei AppGallery

### Release Notes Template

```markdown
# Mapleting Monitor v1.0.0

## Features
- Monitor any Android application in real-time
- Get notified when apps crash or stop
- Simple configuration UI
- Runs reliably in background
- Low battery impact

## Requirements
- Android 7.0 (Nougat) or higher
- Active internet connection
- Server URL and access credentials

## Setup
1. Enter your device nickname
2. Enter your secret key
3. Select app to monitor
4. Tap "Start Monitoring"

## Known Issues
- Battery optimization may stop monitoring (disable in settings)

## Privacy
- No data is collected or shared
- All communication is encrypted via HTTPS
- Source code available at [GitHub]
```

## Critical Implementation Requirements

### MUST DO

1. **Identical Heartbeat Payload**: Send EXACT same format as Python client
2. **UTF-8 Support**: Full Unicode support for nicknames
3. **Background Operation**: Service must survive app backgrounding
4. **Persistent Notification**: Always show monitoring status
5. **Battery Optimization**: Guide user to disable optimization
6. **Error Handling**: Graceful retry on network failures
7. **Configuration Persistence**: Save and restore user settings

### MUST NOT DO

1. **Don't log secrets**: Never log secret keys in plain text
2. **Don't assume ASCII**: Always handle UTF-8 encoding
3. **Don't block main thread**: Use coroutines for network operations
4. **Don't crash on invalid config**: Validate before starting service
5. **Don't send excessive heartbeats**: Respect server rate limits

## Architecture Diagrams

### Complete System with Android App

```
┌─────────────────────────────────────────────────────────────┐
│                    Android Device                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Mapleting Monitor App                     │  │
│  │  ┌─────────────┐  ┌────────────────┐  ┌────────────┐ │  │
│  │  │MainActivity │  │Config Storage │  │UI Settings │ │  │
│  │  └──────┬──────┘  └────────────────┘  └────────────┘ │  │
│  │         │                                           │  │
│  │         │ startService()                            │  │
│  │         ↓                                           │  │
│  │  ┌────────────────────────────────────────────────┐ │  │
│  │  │        MonitoringService (Foreground)           │ │  │
│  │  │  • Periodic app status checks (3s interval)    │ │  │
│  │  │  • State transition detection                  │ │  │
│  │  │  • HTTPS heartbeat to server                   │ │  │
│  │  │  • Persistent notification                     │ │  │
│  │  └──────────────────┬─────────────────────────────┘ │  │
│  └────────────────────┼───────────────────────────────┘  │
└───────────────────────┼───────────────────────────────────┘
                        │
                        │ HTTPS POST /api/heartbeat
                        │ Authorization: Bearer <secret>
                        │ Body: {nickname, status, timestamp}
                        ↓
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Server                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           /api/heartbeat Endpoint                     │  │
│  │  • Authenticate via Bearer token                     │  │
│  │  • Resolve nickname → UUID                           │  │
│  │  • Detect state transitions                          │  │
│  │  • Trigger push notifications                        │  │
│  └───────────────────┬───────────────────────────────────┘  │
└──────────────────────┼──────────────────────────────────────┘
                       │
                       │ Web Push API
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                  Subscriber Devices                         │
│  • PWA/Browser receives push notification                   │
│  • Service worker displays notification                     │
│  • User clicks notification to view details                 │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow Comparison

**Python Client (Existing)**:
```
Python Script → ADB → Device Status → HTTPS Heartbeat → Server
```

**Android App (New)**:
```
Android App → ActivityManager/PkgManager → App Status → HTTPS Heartbeat → Server
```

**Benefits**:
- No ADB setup required
- Runs directly on target device
- Simpler for non-technical users
- Native Android experience

---

**Document Version**: 1.0  
**Last Updated**: 2025-12-24  
**Status**: Specification Complete