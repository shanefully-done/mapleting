package com.mapleting.monitor.detection

import android.app.ActivityManager
import android.app.AppOpsManager
import android.app.usage.UsageStats
import android.app.usage.UsageStatsManager
import android.content.Context
import android.os.Build
import android.os.Process
import android.content.pm.PackageManager
import com.mapleting.monitor.data.LogEntry
import com.mapleting.monitor.data.LogManager
import com.mapleting.monitor.data.LogType

/**
 * Detector for checking if an app is currently running
 * Uses multiple methods with fallback chain for maximum reliability
 */
class AppStatusDetector(private val context: Context) {
    
    companion object {
        private const val TAG = "AppStatusDetector"
    }
    
    /**
     * Check if app is running using the best available method
     * Tries multiple detection methods in order of reliability
     *
     * @param packageName Package name of the app to check
     * @return true if app is running, false otherwise
     */
    fun isAppRunning(packageName: String): Boolean {
        LogManager.addLog(LogEntry(
            timestamp = System.currentTimeMillis(),
            message = "=================================================",
            type = LogType.INFO
        ))
        LogManager.addLog(LogEntry(
            timestamp = System.currentTimeMillis(),
            message = "Starting app detection for: $packageName",
            type = LogType.INFO
        ))
        LogManager.addLog(LogEntry(
            timestamp = System.currentTimeMillis(),
            message = "=================================================",
            type = LogType.INFO
        ))
        
        // Validate package is installed first
        if (!isAppInstalled(packageName)) {
            LogManager.addLog(LogEntry(
                timestamp = System.currentTimeMillis(),
                message = "⚠️  Package $packageName is NOT installed",
                type = LogType.WARNING
            ))
            return false
        }
        LogManager.addLog(LogEntry(
            timestamp = System.currentTimeMillis(),
            message = "✓ Package $packageName is installed",
            type = LogType.SUCCESS
        ))
        
        // Method 1: Try UsageStatsManager first (most accurate, API 21+)
        LogManager.addLog(LogEntry(
            timestamp = System.currentTimeMillis(),
            message = "Method 1: Checking UsageStatsManager permission...",
            type = LogType.INFO
        ))
        if (hasUsageStatsPermission()) {
            LogManager.addLog(LogEntry(
                timestamp = System.currentTimeMillis(),
                message = "✓ UsageStatsManager permission GRANTED",
                type = LogType.SUCCESS
            ))
            val result = isAppRunningUsageStats(packageName)
            if (result) {
                LogManager.addLog(LogEntry(
                    timestamp = System.currentTimeMillis(),
                    message = "✅ SUCCESS: App detected via UsageStatsManager",
                    type = LogType.SUCCESS
                ))
                return true
            } else {
                LogManager.addLog(LogEntry(
                    timestamp = System.currentTimeMillis(),
                    message = "ℹ️  App NOT found in UsageStats (may not be running)",
                    type = LogType.INFO
                ))
            }
        } else {
            LogManager.addLog(LogEntry(
                timestamp = System.currentTimeMillis(),
                message = "⚠️  UsageStatsManager permission NOT GRANTED",
                type = LogType.WARNING
            ))
            LogManager.addLog(LogEntry(
                timestamp = System.currentTimeMillis(),
                message = "   User must grant PACKAGE_USAGE_STATS permission in Settings",
                type = LogType.WARNING
            ))
        }
        
        // Method 2: Try ActivityManager.getRunningAppProcesses() with pkgList check
        LogManager.addLog(LogEntry(
            timestamp = System.currentTimeMillis(),
            message = "Method 2: Checking ActivityManager.getRunningAppProcesses()...",
            type = LogType.INFO
        ))
        val result = isAppRunningActivityManager(packageName)
        if (result) {
            LogManager.addLog(LogEntry(
                timestamp = System.currentTimeMillis(),
                message = "✅ SUCCESS: App detected via ActivityManager",
                type = LogType.SUCCESS
            ))
            return true
        } else {
            LogManager.addLog(LogEntry(
                timestamp = System.currentTimeMillis(),
                message = "ℹ️  App NOT found via ActivityManager",
                type = LogType.INFO
            ))
        }
        
        // Method 3: Try checking running services
        LogManager.addLog(LogEntry(
            timestamp = System.currentTimeMillis(),
            message = "Method 3: Checking running services...",
            type = LogType.INFO
        ))
        val serviceResult = isAppRunningServices(packageName)
        if (serviceResult) {
            LogManager.addLog(LogEntry(
                timestamp = System.currentTimeMillis(),
                message = "✅ SUCCESS: App has running services",
                type = LogType.SUCCESS
            ))
            return true
        } else {
            LogManager.addLog(LogEntry(
                timestamp = System.currentTimeMillis(),
                message = "ℹ️  No running services found for app",
                type = LogType.INFO
            ))
        }
        
        // All methods failed
        LogManager.addLog(LogEntry(
            timestamp = System.currentTimeMillis(),
            message = "❌ FAILED: App $packageName not detected by any method",
            type = LogType.ERROR
        ))
        LogManager.addLog(LogEntry(
            timestamp = System.currentTimeMillis(),
            message = "=================================================",
            type = LogType.INFO
        ))
        return false
    }
    
    /**
     * Check if app is installed on the device using multiple methods
     * Logs all attempts for debugging purposes
     */
    private fun isAppInstalled(packageName: String): Boolean {
        return try {
            val pm = context.packageManager
            
            // Log all installed packages for debugging
            logInstalledPackages()
            
            // Method 1: Try with GET_ACTIVITIES flag
            try {
                pm.getPackageInfo(packageName, PackageManager.GET_ACTIVITIES)
                LogManager.addLog(LogEntry(
                    timestamp = System.currentTimeMillis(),
                    message = "✓ Package found via GET_ACTIVITIES",
                    type = LogType.SUCCESS
                ))
                return true
            } catch (e: Exception) {
                LogManager.addLog(LogEntry(
                    timestamp = System.currentTimeMillis(),
                    message = "⚠ GET_ACTIVITIES failed: ${e.message}",
                    type = LogType.WARNING
                ))
            }
            
            // Method 2: Try with no flags (just basic info)
            try {
                pm.getPackageInfo(packageName, 0)
                LogManager.addLog(LogEntry(
                    timestamp = System.currentTimeMillis(),
                    message = "✓ Package found via basic check",
                    type = LogType.SUCCESS
                ))
                return true
            } catch (e: Exception) {
                LogManager.addLog(LogEntry(
                    timestamp = System.currentTimeMillis(),
                    message = "⚠ Basic check failed: ${e.message}",
                    type = LogType.WARNING
                ))
            }
            
            // Method 3: Try getApplicationInfo
            try {
                pm.getApplicationInfo(packageName, 0)
                LogManager.addLog(LogEntry(
                    timestamp = System.currentTimeMillis(),
                    message = "✓ Package found via ApplicationInfo",
                    type = LogType.SUCCESS
                ))
                return true
            } catch (e: Exception) {
                LogManager.addLog(LogEntry(
                    timestamp = System.currentTimeMillis(),
                    message = "⚠ ApplicationInfo failed: ${e.message}",
                    type = LogType.WARNING
                ))
            }
            
            // Method 4: List all installed packages and search
            val installedPackages = pm.getInstalledApplications(0)
            val found = installedPackages.any { it.packageName == packageName }
            
            if (found) {
                LogManager.addLog(LogEntry(
                    timestamp = System.currentTimeMillis(),
                    message = "✓ Package found in installed apps list",
                    type = LogType.SUCCESS
                ))
                return true
            }
            
            LogManager.addLog(LogEntry(
                timestamp = System.currentTimeMillis(),
                message = "❌ Package NOT found in ${installedPackages.size} installed apps",
                type = LogType.ERROR
            ))
            
            false
        } catch (e: Exception) {
            LogManager.addLog(LogEntry(
                timestamp = System.currentTimeMillis(),
                message = "❌ Error checking package: ${e.message}",
                type = LogType.ERROR
            ))
            false
        }
    }
    
    /**
     * Log first 20 installed packages for debugging
     */
    private fun logInstalledPackages() {
        try {
            val pm = context.packageManager
            val packages = pm.getInstalledApplications(0)
                .take(20)
                .map { it.packageName }
            
            LogManager.addLog(LogEntry(
                timestamp = System.currentTimeMillis(),
                message = "Installed packages (first 20): ${packages.joinToString(", ")}",
                type = LogType.INFO
            ))
            
            // Log total count
            val totalCount = pm.getInstalledApplications(0).size
            LogManager.addLog(LogEntry(
                timestamp = System.currentTimeMillis(),
                message = "Total installed packages: $totalCount",
                type = LogType.INFO
            ))
        } catch (e: Exception) {
            LogManager.addLog(LogEntry(
                timestamp = System.currentTimeMillis(),
                message = "Error listing packages: ${e.message}",
                type = LogType.ERROR
            ))
        }
    }
    
    /**
     * Check if PACKAGE_USAGE_STATS permission is granted
     */
    private fun hasUsageStatsPermission(): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
            LogManager.addLog(LogEntry(
                timestamp = System.currentTimeMillis(),
                message = "   Android version < Lollipop, UsageStatsManager not available",
                type = LogType.INFO
            ))
            return false
        }
        
        val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            appOps.unsafeCheckOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                context.packageName
            )
        } else {
            @Suppress("DEPRECATION")
            appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                context.packageName
            )
        }
        
        val granted = mode == AppOpsManager.MODE_ALLOWED
        LogManager.addLog(LogEntry(
            timestamp = System.currentTimeMillis(),
            message = "   Permission check result: $granted (mode=$mode)",
            type = LogType.INFO
        ))
        return granted
    }
    
    /**
     * Check if app is running using UsageStatsManager (most accurate)
     * Requires PACKAGE_USAGE_STATS permission
     */
    private fun isAppRunningUsageStats(packageName: String): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
            return false
        }
        
        return try {
            val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            val currentTime = System.currentTimeMillis()
            val timeWindow = 1000 * 30 // Check last 30 seconds (more lenient)
            
            LogManager.addLog(LogEntry(
                timestamp = System.currentTimeMillis(),
                message = "   Querying UsageStats from ${currentTime - timeWindow} to $currentTime",
                type = LogType.INFO
            ))
            
            val stats = usageStatsManager.queryUsageStats(
                UsageStatsManager.INTERVAL_DAILY,
                currentTime - timeWindow,
                currentTime
            )
            
            if (stats.isNullOrEmpty()) {
                LogManager.addLog(LogEntry(
                    timestamp = System.currentTimeMillis(),
                    message = "   ⚠️  No usage stats returned (may need permission or first use)",
                    type = LogType.WARNING
                ))
                return false
            }
            
            LogManager.addLog(LogEntry(
                timestamp = System.currentTimeMillis(),
                message = "   Found ${stats.size} usage entries",
                type = LogType.INFO
            ))
            
            // Filter by package name and check last used time
            val matchingStats = stats.filter {
                it.packageName == packageName
            }
            
            if (matchingStats.isEmpty()) {
                LogManager.addLog(LogEntry(
                    timestamp = System.currentTimeMillis(),
                    message = "   No entries found for package: $packageName",
                    type = LogType.INFO
                ))
                return false
            }
            
            LogManager.addLog(LogEntry(
                timestamp = System.currentTimeMillis(),
                message = "   Found ${matchingStats.size} entries for $packageName",
                type = LogType.INFO
            ))
            
            // Check if app was used recently
            val recentlyUsed = matchingStats.any { stat ->
                val lastUsed = stat.lastTimeUsed
                val timeSinceUsed = currentTime - lastUsed
                val isRecent = timeSinceUsed < timeWindow
                
                if (isRecent) {
                    LogManager.addLog(LogEntry(
                        timestamp = System.currentTimeMillis(),
                        message = "   ✓ App used ${(timeSinceUsed / 1000)}s ago",
                        type = LogType.SUCCESS
                    ))
                }
                
                isRecent
            }
            
            if (!recentlyUsed) {
                LogManager.addLog(LogEntry(
                    timestamp = System.currentTimeMillis(),
                    message = "   ⚠️  App found but not used in last ${timeWindow / 1000}s",
                    type = LogType.WARNING
                ))
            }
            
            recentlyUsed
        } catch (e: Exception) {
            LogManager.addLog(LogEntry(
                timestamp = System.currentTimeMillis(),
                message = "   ❌ Error checking app status via UsageStatsManager: ${e.message}",
                type = LogType.ERROR
            ))
            false
        }
    }
    
    /**
     * Check if app is running using ActivityManager (fallback method)
     * Works on all Android versions but less accurate on newer versions
     * IMPROVED: Checks pkgList instead of just processName
     */
    @Suppress("DEPRECATION")
    private fun isAppRunningActivityManager(packageName: String): Boolean {
        return try {
            val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
            val runningProcesses = activityManager.runningAppProcesses
            
            if (runningProcesses.isNullOrEmpty()) {
                LogManager.addLog(LogEntry(
                    timestamp = System.currentTimeMillis(),
                    message = "   ⚠️  No running processes found",
                    type = LogType.WARNING
                ))
                return false
            }
            
            LogManager.addLog(LogEntry(
                timestamp = System.currentTimeMillis(),
                message = "   Found ${runningProcesses.size} running processes",
                type = LogType.INFO
            ))
            
            // Log first few processes for debugging
            runningProcesses.take(5).forEach { process ->
                LogManager.addLog(LogEntry(
                    timestamp = System.currentTimeMillis(),
                    message = "   Process: ${process.processName}, importance=${process.importance}, pkgList=[${process.pkgList.take(3).joinToString()}${if (process.pkgList.size > 3) "..." else ""}]",
                    type = LogType.INFO
                ))
            }
            
            // Check if any process has the package in its pkgList
            for (processInfo in runningProcesses) {
                // Check if package is in process's package list
                if (processInfo.pkgList.contains(packageName)) {
                    val importance = processInfo.importance
                    val importanceName = when (importance) {
                        ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND -> "FOREGROUND"
                        ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND_SERVICE -> "FOREGROUND_SERVICE"
                        ActivityManager.RunningAppProcessInfo.IMPORTANCE_TOP_SLEEPING -> "TOP_SLEEPING"
                        ActivityManager.RunningAppProcessInfo.IMPORTANCE_VISIBLE -> "VISIBLE"
                        ActivityManager.RunningAppProcessInfo.IMPORTANCE_SERVICE -> "SERVICE"
                        ActivityManager.RunningAppProcessInfo.IMPORTANCE_BACKGROUND -> "BACKGROUND"
                        ActivityManager.RunningAppProcessInfo.IMPORTANCE_CACHED -> "CACHED"
                        else -> "OTHER($importance)"
                    }
                    
                    LogManager.addLog(LogEntry(
                        timestamp = System.currentTimeMillis(),
                        message = "   ✓ Found package in process: ${processInfo.processName}",
                        type = LogType.SUCCESS
                    ))
                    LogManager.addLog(LogEntry(
                        timestamp = System.currentTimeMillis(),
                        message = "     Importance: $importanceName",
                        type = LogType.INFO
                    ))
                    LogManager.addLog(LogEntry(
                        timestamp = System.currentTimeMillis(),
                        message = "     Package list: ${processInfo.pkgList.joinToString()}",
                        type = LogType.INFO
                    ))
                    
                    // Consider it running if it's in any active state
                    // Exclude cached processes (importance >= 400 on most devices)
                    val isRunning = importance < ActivityManager.RunningAppProcessInfo.IMPORTANCE_CACHED
                    
                    if (isRunning) {
                        LogManager.addLog(LogEntry(
                            timestamp = System.currentTimeMillis(),
                            message = "   ✓ Process is ACTIVE (not cached)",
                            type = LogType.SUCCESS
                        ))
                        return true
                    } else {
                        LogManager.addLog(LogEntry(
                            timestamp = System.currentTimeMillis(),
                            message = "   ⚠️  Process is CACHED (not actively running)",
                            type = LogType.WARNING
                        ))
                    }
                }
            }
            
            // Also check processName directly (for single-process apps)
            val processNameMatch = runningProcesses.any { it.processName == packageName }
            if (processNameMatch) {
                LogManager.addLog(LogEntry(
                    timestamp = System.currentTimeMillis(),
                    message = "   ✓ Found package as process name",
                    type = LogType.SUCCESS
                ))
                return true
            }
            
            LogManager.addLog(LogEntry(
                timestamp = System.currentTimeMillis(),
                message = "   ℹ️  Package not found in any running process",
                type = LogType.INFO
            ))
            
            false
        } catch (e: Exception) {
            LogManager.addLog(LogEntry(
                timestamp = System.currentTimeMillis(),
                message = "   ❌ Error checking app status via ActivityManager: ${e.message}",
                type = LogType.ERROR
            ))
            false
        }
    }
    
    /**
     * Check if app has any running services (additional fallback)
     */
    @Suppress("DEPRECATION")
    private fun isAppRunningServices(packageName: String): Boolean {
        return try {
            val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
            val runningServices = activityManager.getRunningServices(Integer.MAX_VALUE)
            
            if (runningServices.isNullOrEmpty()) {
                LogManager.addLog(LogEntry(
                    timestamp = System.currentTimeMillis(),
                    message = "   ⚠️  No running services found",
                    type = LogType.WARNING
                ))
                return false
            }
            
            LogManager.addLog(LogEntry(
                timestamp = System.currentTimeMillis(),
                message = "   Found ${runningServices.size} running services",
                type = LogType.INFO
            ))
            
            // Check if any service belongs to the target package
            val matchingServices = runningServices.filter {
                it.service.packageName == packageName
            }
            
            if (matchingServices.isNotEmpty()) {
                LogManager.addLog(LogEntry(
                    timestamp = System.currentTimeMillis(),
                    message = "   ✓ Found ${matchingServices.size} services for $packageName",
                    type = LogType.SUCCESS
                ))
                matchingServices.forEach { service ->
                    LogManager.addLog(LogEntry(
                        timestamp = System.currentTimeMillis(),
                        message = "     - Service: ${service.service.className}",
                        type = LogType.INFO
                    ))
                }
                return true
            }
            
            LogManager.addLog(LogEntry(
                timestamp = System.currentTimeMillis(),
                message = "   ℹ️  No services found for package: $packageName",
                type = LogType.INFO
            ))
            false
        } catch (e: Exception) {
            LogManager.addLog(LogEntry(
                timestamp = System.currentTimeMillis(),
                message = "   ❌ Error checking running services: ${e.message}",
                type = LogType.ERROR
            ))
            false
        }
    }
}