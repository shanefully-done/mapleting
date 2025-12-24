package com.mapleting.monitor.data

import java.io.Serializable

/**
 * Configuration data class for monitoring
 *
 * @param nickname UTF-8 encoded, user-facing identifier
 * @param serverUrl Next.js server URL (default: https://mapleting.vercel.app)
 * @param packageName Android package name to monitor (default: com.nexon.ma)
 * @param checkInterval Check interval in milliseconds (default: 60 seconds)
 */
data class MonitorConfig(
    val nickname: String,
    val serverUrl: String = DEFAULT_SERVER_URL,
    val packageName: String = DEFAULT_PACKAGE_NAME,
    val checkInterval: Long = 60000L
) : Serializable {
    
    companion object {
        const val DEFAULT_SERVER_URL = "https://mapleting.vercel.app"
        const val DEFAULT_PACKAGE_NAME = "com.nexon.ma"
    }
}