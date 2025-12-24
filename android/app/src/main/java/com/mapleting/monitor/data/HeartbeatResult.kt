package com.mapleting.monitor.data

/**
 * Sealed class for heartbeat responses
 */
sealed class HeartbeatResult {
    /** Successful heartbeat */
    object Success : HeartbeatResult()
    
    /** Error with message and HTTP code (0 for network errors) */
    data class Error(val message: String, val code: Int) : HeartbeatResult()
}