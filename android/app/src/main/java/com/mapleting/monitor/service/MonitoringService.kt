package com.mapleting.monitor.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.mapleting.monitor.MainActivity
import com.mapleting.monitor.R
import com.mapleting.monitor.data.LogEntry
import com.mapleting.monitor.data.LogManager
import com.mapleting.monitor.data.LogType
import com.mapleting.monitor.data.MonitorConfig
import com.mapleting.monitor.network.HeartbeatClient
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Foreground service for monitoring app status
 * Maintains persistent notification and implements event-driven monitoring:
 * 1. Immediate heartbeat on foreground state changes (connected/disconnected)
 * 2. Filters out system UI packages to avoid false positives
 */
class MonitoringService : Service() {
    
    companion object {
        private const val TAG = "MonitoringService"
        private const val NOTIFICATION_ID = 1001
        private const val CHANNEL_ID = "monitoring_channel"
        
        const val EXTRA_CONFIG = "extra_config"
        const val ACTION_STOP = "com.mapleting.monitor.STOP"
    }
    
    // Rate limit configuration (60 seconds)
    private val RATE_LIMIT_INTERVAL_MS = 60000L
    
    private val serviceScope = CoroutineScope(SupervisorJob() + kotlinx.coroutines.Dispatchers.Default)
    private var config: MonitorConfig? = null
    private var heartbeatClient: HeartbeatClient? = null
    private var lastForegroundPackage: String? = null
    private var lastHeartbeatTime: Long = 0
    
    // Queuing system for rate limit handling
    private var queuedStatus: String? = null  // Latest status to send
    private var lastSuccessfulHeartbeatTime: Long = 0L
    private var queueFlushJob: Job? = null  // Periodic queue flush job
    private var lastSentStatus: String? = null  // Last successfully sent status
    
    // System UI packages to ignore
    private val ignoredPackages = setOf(
        "com.android.systemui",
        "com.android.settings",
        "com.android.permissioncontroller",
        "com.android.providers.notifications",
        "com.android.shell",
        "android",
        "com.android.phone",
        "com.android.server.telecom",
        "com.android.keyguard",
        "com.google.android.gms",
        "com.google.android.gsf",
        "com.google.android.gms.ui",
        "com.sec.android.systemui",
        "com.samsung.android.app.notificationcenter",
        "com.samsung.android.oneconnect",
        "com.miui.systemui",
        "com.miui.securitycenter",
        "com.miui.powerkeeper",
        "com.huawei.systemmanager",
        "com.coloros.systemui",
        "com.coloros.notificationmanager",
        "com.vivo.systemui",
        "com.vivo.permissionmanager",
        "com.bluestacks.settings",
        "com.android.emulator.smartsystem",
        "autoclicker.clicker.autoclickerapp.autoclickerforgames",
        "com.truedevelopersstudio.automatictap.autoclicker",
        "com.tapassistant.autoclicker",
        "com.speed.gc.autoclicker.automatictap"
    )
    
    // BroadcastReceiver for foreground app changes from AccessibilityService
    private val foregroundChangedReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            val packageName = intent?.getStringExtra(ForegroundAccessibilityService.EXTRA_PACKAGE_NAME) ?: return
            
            Log.d(TAG, "Foreground changed to: $packageName")
            handleForegroundChange(packageName)
        }
    }
    
    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "MonitoringService created")
        createNotificationChannel()
        registerForegroundChangedReceiver()
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "onStartCommand called")
        
        when (intent?.action) {
            ACTION_STOP -> {
                Log.d(TAG, "Stop action received")
                stopSelf()
                return START_NOT_STICKY
            }
            else -> {
                // Extract config from intent
                val config = intent?.getSerializableExtra(EXTRA_CONFIG) as? MonitorConfig
                if (config != null) {
                    this.config = config
                    // Initialize heartbeat client
                    heartbeatClient = HeartbeatClient(config.serverUrl)
                    
                    // Start foreground with notification
                    startForeground(NOTIFICATION_ID, createNotification("Monitoring: ${config.packageName}"))
                    
                    // Start periodic queue flush (every 60 seconds)
                    startQueueFlush()
                    
                    LogManager.addLog(LogEntry(
                        timestamp = System.currentTimeMillis(),
                        message = "✅ Monitoring started - Rate-limit-aware mode",
                        type = LogType.SUCCESS
                    ))
                } else {
                    Log.e(TAG, "No config provided, stopping service")
                    stopSelf()
                    return START_NOT_STICKY
                }
            }
        }
        
        return START_STICKY // Restart if killed by system
    }
    
    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "MonitoringService destroyed")
        
        // Cancel queue flush job
        queueFlushJob?.cancel()
        unregisterForegroundChangedReceiver()
    }
    
    override fun onBind(intent: Intent?) = null
    
    /**
     * Handle foreground app change from AccessibilityService
     * Filters out system UI packages and detects target app state changes
     * Implements rate-limit-aware queuing with status deduplication
     */
    private fun handleForegroundChange(currentPackage: String) {
        // Ignore system UI packages to avoid false positives
        if (ignoredPackages.contains(currentPackage)) {
            Log.d(TAG, "Ignoring system UI package: $currentPackage")
            return
        }
        
        val targetPackage = config?.packageName ?: return
        
        // Determine new status based on foreground
        val newStatus = if (currentPackage == targetPackage) {
            "connected"
        } else {
            "disconnected"
        }
        
        // Only proceed if status is different from last sent status
        if (newStatus == lastSentStatus) {
            LogManager.addLog(LogEntry(
                timestamp = System.currentTimeMillis(),
                message = "ℹ️ Status unchanged: $newStatus - Skipping",
                type = LogType.INFO
            ))
            lastForegroundPackage = currentPackage
            return
        }
        
        // Log the change
        LogManager.addLog(LogEntry(
            timestamp = System.currentTimeMillis(),
            message = "App switch: $currentPackage (New status: $newStatus)",
            type = LogType.INFO
        ))
        
        // Log state transition
        if (lastForegroundPackage == targetPackage && currentPackage != targetPackage) {
            // Target left foreground
            queuedStatus = newStatus  // Queue it
            trySendHeartbeat(newStatus)
            
            LogManager.addLog(LogEntry(
                timestamp = System.currentTimeMillis(),
                message = "❌ $targetPackage left foreground → Queued: $newStatus",
                type = LogType.WARNING
            ))
        } else if (currentPackage == targetPackage && lastForegroundPackage != targetPackage) {
            // Target entered foreground
            queuedStatus = newStatus  // Queue it
            trySendHeartbeat(newStatus)
            
            LogManager.addLog(LogEntry(
                timestamp = System.currentTimeMillis(),
                message = "✅ $targetPackage entered foreground → Queued: $newStatus",
                type = LogType.SUCCESS
            ))
        }
        
        lastForegroundPackage = currentPackage
    }
    
    /**
     * Start periodic queue flush job (every 60 seconds)
     */
    private fun startQueueFlush() {
        queueFlushJob = serviceScope.launch {
            while (isActive) {
                delay(RATE_LIMIT_INTERVAL_MS)  // 60 seconds
                flushQueue()
            }
        }
    }
    
    /**
     * Flush the queue - send latest queued status if rate limit allows
     */
    private fun flushQueue() {
        // If there's a queued status, try to send it
        queuedStatus?.let { status ->
            LogManager.addLog(LogEntry(
                timestamp = System.currentTimeMillis(),
                message = "🔄 Flushing queue: $status",
                type = LogType.INFO
            ))
            
            trySendHeartbeat(status)
        } ?: run {
            LogManager.addLog(LogEntry(
                timestamp = System.currentTimeMillis(),
                message = "ℹ️ Queue empty - Nothing to flush",
                type = LogType.INFO
            ))
        }
    }
    
    /**
     * Try to send heartbeat to server with rate limit awareness
     * @param status The status to send ("connected" or "disconnected")
     */
    private fun trySendHeartbeat(status: String) {
        val nickname = config?.nickname ?: return
        
        serviceScope.launch {
            // Check if we're within rate limit
            val timeSinceLastHeartbeat = System.currentTimeMillis() - lastSuccessfulHeartbeatTime
            
            if (timeSinceLastHeartbeat < RATE_LIMIT_INTERVAL_MS) {
                // Too soon, keep in queue
                val remainingSeconds = (RATE_LIMIT_INTERVAL_MS - timeSinceLastHeartbeat) / 1000
                LogManager.addLog(LogEntry(
                    timestamp = System.currentTimeMillis(),
                    message = "⏳ Rate limited - Queued: $status (${remainingSeconds}s remaining)",
                    type = LogType.INFO
                ))
                return@launch
            }
            
            // Try to send
            try {
                val result = heartbeatClient?.sendHeartbeat(nickname, status)
                
                if (result is com.mapleting.monitor.data.HeartbeatResult.Success) {
                    lastSuccessfulHeartbeatTime = System.currentTimeMillis()
                    lastHeartbeatTime = System.currentTimeMillis()
                    lastSentStatus = status  // Update last sent status
                    queuedStatus = null  // Clear queue after successful send
                    
                    Log.d(TAG, "Heartbeat sent successfully: $status")
                    LogManager.addLog(LogEntry(
                        timestamp = System.currentTimeMillis(),
                        message = "✅ Heartbeat sent: $status",
                        type = LogType.SUCCESS
                    ))
                } else if (result is com.mapleting.monitor.data.HeartbeatResult.Error) {
                    // Failed (possibly rate limited), keep in queue
                    Log.e(TAG, "Failed to send heartbeat: $result")
                    LogManager.addLog(LogEntry(
                        timestamp = System.currentTimeMillis(),
                        message = "❌ Heartbeat failed: ${result.message} - Keeping in queue",
                        type = LogType.ERROR
                    ))
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error sending heartbeat", e)
                LogManager.addLog(LogEntry(
                    timestamp = System.currentTimeMillis(),
                    message = "❌ Heartbeat error: ${e.message} - Keeping in queue",
                    type = LogType.ERROR
                ))
            }
        }
    }
    
    /**
     * Create notification channel (required for API 26+)
     */
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Monitoring Service",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Persistent notification for monitoring service"
                setShowBadge(true)
                setSound(null, null)
                enableVibration(false)
            }
            
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }
    
    /**
     * Create persistent notification
     */
    private fun createNotification(contentText: String): Notification {
        val notificationIntent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            notificationIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        
        // Stop action intent
        val stopIntent = Intent(this, MonitoringService::class.java).apply {
            action = ACTION_STOP
        }
        val stopPendingIntent = PendingIntent.getService(
            this,
            0,
            stopIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("MapleTing Monitor")
            .setContentText(contentText)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setContentIntent(pendingIntent)
            .addAction(
                android.R.drawable.ic_menu_close_clear_cancel,
                "Stop",
                stopPendingIntent
            )
            .setOngoing(true)
            .build()
    }
    
    /**
     * Update notification with current status
     */
    private fun updateNotification(isConnected: Boolean) {
        val statusText = if (isConnected) "Connected" else "Disconnected"
        val lastHeartbeat = if (lastHeartbeatTime > 0) {
            val time = SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(Date(lastHeartbeatTime))
            "Last heartbeat: $time"
        } else {
            "No heartbeat sent yet"
        }
        
        val notification = createNotification(
            "${config?.packageName}\n$statusText • $lastHeartbeat"
        )
        
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(NOTIFICATION_ID, notification)
    }
    
    /**
     * Register broadcast receiver for foreground app changes
     */
    private fun registerForegroundChangedReceiver() {
        val filter = IntentFilter(ForegroundAccessibilityService.ACTION_FOREGROUND_CHANGED)
        registerReceiver(foregroundChangedReceiver, filter)
        Log.d(TAG, "Foreground change receiver registered")
    }
    
    /**
     * Unregister broadcast receiver
     */
    private fun unregisterForegroundChangedReceiver() {
        try {
            unregisterReceiver(foregroundChangedReceiver)
            Log.d(TAG, "Foreground change receiver unregistered")
        } catch (e: IllegalArgumentException) {
            // Receiver was not registered, ignore
            Log.d(TAG, "Receiver was not registered, ignoring")
        }
    }
}
