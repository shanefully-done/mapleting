package com.mapleting.monitor.service

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.view.accessibility.AccessibilityEvent
import com.mapleting.monitor.data.LogEntry
import com.mapleting.monitor.data.LogManager
import com.mapleting.monitor.data.LogType

/**
 * AccessibilityService that detects foreground app changes.
 * 
 * This service listens for TYPE_WINDOW_STATE_CHANGED events to detect
 * when the user switches between apps, allowing us to detect when the
 * monitored app leaves or enters the foreground.
 * 
 * Works across all user profiles and is more reliable than process checking.
 */
class ForegroundAccessibilityService : AccessibilityService() {
    
    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        event ?: return
        
        // Only act on TYPE_WINDOW_STATE_CHANGED
        if (event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return
        
        // Get package name
        val packageName = event.packageName?.toString() ?: return
        
        // Log EVERY foreground app change
        LogManager.addLog(LogEntry(
            timestamp = System.currentTimeMillis(),
            message = "Foreground: $packageName",
            type = LogType.INFO
        ))
        
        // Broadcast to monitoring service
        val intent = Intent(ACTION_FOREGROUND_CHANGED).apply {
            putExtra(EXTRA_PACKAGE_NAME, packageName)
            putExtra(EXTRA_TIMESTAMP, System.currentTimeMillis())
            // Add package to ensure only our app receives this
            `package` = "com.mapleting.monitor"
        }
        sendBroadcast(intent)
    }
    
    override fun onInterrupt() {
        // Called when the service is interrupted
        // No action needed for our use case
    }
    
    override fun onDestroy() {
        super.onDestroy()
        // Service is being destroyed
    }
    
    companion object {
        const val ACTION_FOREGROUND_CHANGED = "com.mapleting.monitor.FOREGROUND_CHANGED"
        const val EXTRA_PACKAGE_NAME = "package_name"
        const val EXTRA_TIMESTAMP = "timestamp"
    }
}