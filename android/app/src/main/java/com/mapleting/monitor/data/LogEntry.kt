package com.mapleting.monitor.data

import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Represents a single log entry with timestamp and message
 */
data class LogEntry(
    val timestamp: Long = System.currentTimeMillis(),
    val message: String,
    val type: LogType = LogType.INFO
) {
    /**
     * Get formatted timestamp string
     */
    fun getFormattedTime(): String {
        val formatter = SimpleDateFormat("HH:mm:ss", Locale.getDefault())
        return formatter.format(Date(timestamp))
    }
    
    /**
     * Get full formatted log line
     */
    fun getFormattedLog(): String {
        return "[${getFormattedTime()}] ${type.prefix} ${message}"
    }
    
    companion object {
        /**
         * Create a process check log entry
         */
        fun processCheck(packageName: String, isRunning: Boolean): LogEntry {
            val status = if (isRunning) "RUNNING" else "STOPPED"
            return LogEntry(
                message = "Process check: $packageName - $status",
                type = LogType.INFO
            )
        }
        
        /**
         * Create a heartbeat success log entry
         */
        fun heartbeatSuccess(status: String, httpCode: Int = 200): LogEntry {
            return LogEntry(
                message = "Heartbeat sent: SUCCESS ($httpCode) - Status: $status",
                type = LogType.SUCCESS
            )
        }
        
        /**
         * Create a heartbeat failure log entry
         */
        fun heartbeatFailure(error: String, code: Int = 0): LogEntry {
            val errorDetail = if (code > 0) "($code) " else ""
            return LogEntry(
                message = "Heartbeat sent: FAILED ${errorDetail}- $error",
                type = LogType.ERROR
            )
        }
        
        /**
         * Create a state transition log entry
         */
        fun stateTransition(fromStatus: String, toStatus: String): LogEntry {
            return LogEntry(
                message = "State transition: $fromStatus → $toStatus",
                type = LogType.WARNING
            )
        }
        
        /**
         * Create a general info log entry
         */
        fun info(message: String): LogEntry {
            return LogEntry(
                message = message,
                type = LogType.INFO
            )
        }
    }
}

/**
 * Log type enumeration with display prefixes
 */
enum class LogType(val prefix: String) {
    INFO("ℹ️"),
    SUCCESS("✅"),
    WARNING("⚠️"),
    ERROR("❌")
}