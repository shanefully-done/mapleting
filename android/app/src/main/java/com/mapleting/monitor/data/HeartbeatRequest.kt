package com.mapleting.monitor.data

/**
 * Heartbeat request model
 * MUST send IDENTICAL payload format as Python client
 *
 * @param nickname UTF-8 encoded nickname
 * @param status "connected" or "disconnected"
 * @param timestamp Unix timestamp in milliseconds
 */
data class HeartbeatRequest(
    val nickname: String,
    val status: String,
    val timestamp: Long
)