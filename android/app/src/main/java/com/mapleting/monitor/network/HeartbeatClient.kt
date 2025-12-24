package com.mapleting.monitor.network

import com.google.gson.Gson
import com.mapleting.monitor.data.HeartbeatRequest
import com.mapleting.monitor.data.HeartbeatResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

/**
 * HTTP client for sending heartbeats to the server
 * Matches Python client implementation with no authentication
 *
 * @param serverUrl Next.js server URL
 */
class HeartbeatClient(
    private val serverUrl: String
) {
    private val client = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .writeTimeout(10, TimeUnit.SECONDS)
        .build()
    
    private val gson = Gson()
    private val mediaType = "application/json; charset=utf-8".toMediaType()
    
    /**
     * Send heartbeat to server
     * Matches Python client: NO Authorization header
     *
     * @param nickname UTF-8 encoded nickname
     * @param status "connected" or "disconnected"
     * @return HeartbeatResult indicating success or error
     */
    suspend fun sendHeartbeat(
        nickname: String,
        status: String
    ): HeartbeatResult = withContext(Dispatchers.IO) {
        val requestBody = HeartbeatRequest(
            nickname = nickname,
            status = status,
            timestamp = System.currentTimeMillis()
        )
        
        val jsonBody = gson.toJson(requestBody)
        
        // Build request WITHOUT Authorization header (matches Python client)
        val request = Request.Builder()
            .url("$serverUrl/api/heartbeat")
            .addHeader("Content-Type", "application/json; charset=utf-8")
            .post(jsonBody.toRequestBody(mediaType))
            .build()
        
        try {
            val response = client.newCall(request).execute()
            
            when (response.code) {
                200 -> {
                    android.util.Log.d(TAG, "Heartbeat sent successfully for nickname: $nickname")
                    HeartbeatResult.Success
                }
                404 -> {
                    android.util.Log.e(TAG, "Nickname not found on server")
                    HeartbeatResult.Error("Nickname not found", 404)
                }
                else -> {
                    android.util.Log.e(TAG, "Server error: ${response.code}")
                    HeartbeatResult.Error("Server error: ${response.code}", response.code)
                }
            }
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Network error sending heartbeat: ${e.message}")
            HeartbeatResult.Error("Network error: ${e.message}", 0)
        }
    }
    
    /**
     * Send heartbeat with retry logic
     *
     * @param nickname UTF-8 encoded nickname
     * @param status "connected" or "disconnected"
     * @param maxRetries Maximum number of retry attempts
     * @return HeartbeatResult indicating success or error
     */
    suspend fun sendHeartbeatWithRetry(
        nickname: String,
        status: String,
        maxRetries: Int = 3
    ): HeartbeatResult {
        repeat(maxRetries) { attempt ->
            val result = sendHeartbeat(nickname, status)
            
            if (result is HeartbeatResult.Success) {
                return result
            }
            
            // Exponential backoff: 1s, 2s, 3s
            if (attempt < maxRetries - 1) {
                val delayMs = 1000L * (attempt + 1)
                android.util.Log.d(TAG, "Retrying in ${delayMs}ms...")
                delay(delayMs)
            }
        }
        
        return HeartbeatResult.Error("Max retries exceeded", 0)
    }
    
    companion object {
        private const val TAG = "HeartbeatClient"
    }
}