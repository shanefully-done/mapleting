package com.mapleting.monitor.data

import android.content.Context
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.ObjectInputStream
import java.io.ObjectOutputStream

/**
 * Singleton manager for application logs
 * Maintains a bounded list of log entries and persists them to disk
 */
object LogManager {
    
    private const val MAX_LOGS = 100
    private const val LOG_FILE = "logs.dat"
    
    private val _logs = MutableLiveData<List<LogEntry>>(emptyList())
    val logs: LiveData<List<LogEntry>> = _logs
    
    private val logBuffer = mutableListOf<LogEntry>()
    
    /**
     * Add a log entry to the buffer and notify observers
     */
    fun addLog(entry: LogEntry) {
        synchronized(logBuffer) {
            logBuffer.add(0, entry) // Add at beginning for reverse chronological order
            
            // Keep only the most recent MAX_LOGS entries
            if (logBuffer.size > MAX_LOGS) {
                logBuffer.removeAt(logBuffer.size - 1)
            }
            
            _logs.postValue(logBuffer.toList())
        }
    }
    
    /**
     * Add a process check log
     */
    fun logProcessCheck(packageName: String, isRunning: Boolean) {
        addLog(LogEntry.processCheck(packageName, isRunning))
    }
    
    /**
     * Add a heartbeat success log
     */
    fun logHeartbeatSuccess(status: String, httpCode: Int = 200) {
        addLog(LogEntry.heartbeatSuccess(status, httpCode))
    }
    
    /**
     * Add a heartbeat failure log
     */
    fun logHeartbeatFailure(error: String, code: Int = 0) {
        addLog(LogEntry.heartbeatFailure(error, code))
    }
    
    /**
     * Add a state transition log
     */
    fun logStateTransition(fromStatus: String, toStatus: String) {
        addLog(LogEntry.stateTransition(fromStatus, toStatus))
    }
    
    /**
     * Add a general info log
     */
    fun logInfo(message: String) {
        addLog(LogEntry.info(message))
    }
    
    /**
     * Clear all logs
     */
    fun clearLogs() {
        synchronized(logBuffer) {
            logBuffer.clear()
            _logs.postValue(emptyList())
        }
    }
    
    /**
     * Get current logs as a formatted string
     */
    fun getFormattedLogs(): String {
        synchronized(logBuffer) {
            if (logBuffer.isEmpty()) {
                return "No logs yet"
            }
            return logBuffer.joinToString("\n") { it.getFormattedLog() }
        }
    }
    
    /**
     * Load logs from persistent storage
     */
    suspend fun loadLogs(context: Context) = withContext(Dispatchers.IO) {
        try {
            context.openFileInput(LOG_FILE).use { fis ->
                ObjectInputStream(fis).use { ois ->
                    @Suppress("UNCHECKED_CAST")
                    val loaded = ois.readObject() as? List<LogEntry>
                    if (loaded != null) {
                        synchronized(logBuffer) {
                            logBuffer.clear()
                            logBuffer.addAll(loaded)
                            _logs.postValue(logBuffer.toList())
                        }
                    }
                }
            }
        } catch (e: Exception) {
            // No saved logs or error loading - start fresh
            synchronized(logBuffer) {
                logBuffer.clear()
                _logs.postValue(emptyList())
            }
        }
    }
    
    /**
     * Save logs to persistent storage
     */
    suspend fun saveLogs(context: Context) = withContext(Dispatchers.IO) {
        try {
            context.openFileOutput(LOG_FILE, Context.MODE_PRIVATE).use { fos ->
                ObjectOutputStream(fos).use { oos ->
                    synchronized(logBuffer) {
                        oos.writeObject(logBuffer.toList())
                    }
                }
            }
        } catch (e: Exception) {
            // Failed to save logs - non-critical, just log the error
            e.printStackTrace()
        }
    }
    
    /**
     * Get the current log list
     */
    fun getCurrentLogs(): List<LogEntry> {
        synchronized(logBuffer) {
            return logBuffer.toList()
        }
    }
}